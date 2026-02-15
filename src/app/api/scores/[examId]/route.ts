import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

        const isAdmin = profile?.role === 'admin'

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

        // If admin, also fetch student names
        if (isAdmin && scores && scores.length > 0) {
            const userIds = [...new Set(scores.map(s => s.user_id))]
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, name, email')
                .in('id', userIds)

            const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

            const scoresWithProfiles = scores.map(score => ({
                ...score,
                student_name: profileMap.get(score.user_id)?.name || 'Unknown',
                student_email: profileMap.get(score.user_id)?.email || '',
            }))

            return NextResponse.json({ scores: scoresWithProfiles })
        }

        return NextResponse.json({ scores })
    } catch (error) {
        console.error('Scores API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
