import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminRole } from '@/lib/roles'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ examId: string }> }
) {
    try {
        const supabase = await createClient()
        const { examId } = await params

        // Verify user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const isAdmin = isAdminRole(profile?.role, user.email)

        // Optional userId filter
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        // Build query
        let query = supabase
            .from('scores')
            .select('*')
            .eq('exam_id', examId)
            .order('graded_at', { ascending: false })

        if (userId) {
            query = query.eq('user_id', userId)
        } else if (!isAdmin) {
            // Non-admin can only see their own scores
            query = query.eq('user_id', user.id)
        }

        const { data: scores, error } = await query

        if (error) {
            console.error('Scores fetch error:', error)
            return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 })
        }

        // If admin, we also want to fetch all attempts so ungraded ones are shown
        if (isAdmin) {
            let attemptsQuery = supabase
                .from('exam_attempts')
                .select('*')
                .eq('exam_id', examId)

            if (userId) {
                attemptsQuery = attemptsQuery.eq('user_id', userId)
            }

            const { data: attempts } = await attemptsQuery

            // Collect all user IDs from attempts
            const userIds = [...new Set((attempts || []).map(a => a.user_id))]
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, name, email')
                .in('id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000'])

            const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

            // Map scores by attempt_id
            const scoresMap = new Map((scores || []).map(s => [s.attempt_id, s]))

            // Build unified list of scores (real scores + placeholder scores for ungraded attempts)
            const allScoresWithProfiles = (attempts || []).map(attempt => {
                const existingScore = scoresMap.get(attempt.id)
                const profile = profileMap.get(attempt.user_id)

                if (existingScore) {
                    return {
                        ...existingScore,
                        student_name: profile?.name || 'Unknown',
                        student_email: profile?.email || '',
                    }
                }

                // Return placeholder score for ungraded
                return {
                    id: `temp-${attempt.id}`,
                    attempt_id: attempt.id,
                    exam_id: attempt.exam_id,
                    user_id: attempt.user_id,
                    total_score: 0,
                    max_score: 100,
                    percentage: 0,
                    is_passed: false,
                    grading_type: 'none',
                    graded_at: attempt.submitted_at, // Use submitted_at temporarily for sorting
                    is_graded: false, // Flag to identify ungraded attempt in UI
                    student_name: profile?.name || 'Unknown',
                    student_email: profile?.email || '',
                    answers: attempt.answers // Include answers for PDF file url
                }
            })

            // Sort: ungraded first, then by date desc
            allScoresWithProfiles.sort((a, b) => {
                if (a.is_graded === false && b.is_graded !== false) return -1
                if (a.is_graded !== false && b.is_graded === false) return 1
                return new Date(b.graded_at).getTime() - new Date(a.graded_at).getTime()
            })

            return NextResponse.json({ scores: allScoresWithProfiles })
        }

        return NextResponse.json({ scores })
    } catch (error) {
        console.error('Scores API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
