import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminRole } from '@/lib/roles'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Verify user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!isAdminRole(profile?.role, user.email)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { attemptId, score, feedback } = await request.json()

        if (!attemptId || score === undefined) {
            return NextResponse.json({ error: 'attemptId and score are required' }, { status: 400 })
        }

        // Ensure score is within valid range
        const numScore = Number(score)
        if (isNaN(numScore) || numScore < 0 || numScore > 100) {
            return NextResponse.json({ error: 'Score must be a number between 0 and 100' }, { status: 400 })
        }

        // Fetch the attempt to get exam and user info
        const { data: attempt, error: attemptError } = await supabase
            .from('exam_attempts')
            .select('*')
            .eq('id', attemptId)
            .single()

        if (attemptError || !attempt) {
            return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
        }

        // Manual grading breakdown uses a specific structure to store feedback
        const breakdown = [
            {
                question_id: 'manual-grading',
                question_text: 'Manual Grading Feedback',
                weight: 100,
                is_correct: numScore >= 60,
                selected_choice_id: null,
                correct_choice_id: 'manual',
                selected_choice_text: feedback || '',
                correct_choice_text: 'Manual Grade',
            }
        ]

        // Upsert to scores table
        const { data: scoreRecord, error: scoreError } = await supabase
            .from('scores')
            .upsert(
                {
                    attempt_id: attemptId,
                    exam_id: attempt.exam_id,
                    user_id: attempt.user_id,
                    total_score: numScore,
                    max_score: 100,
                    percentage: numScore,
                    is_passed: numScore >= 60,
                    grading_type: 'manual',
                    graded_at: new Date().toISOString(),
                    breakdown: breakdown,
                },
                { onConflict: 'attempt_id' }
            )
            .select()
            .single()

        if (scoreError) {
            console.error('Score upsert error:', scoreError)
            return NextResponse.json({ error: 'Failed to save score' }, { status: 500 })
        }

        // Update exam_attempts.score for backwards compatibility
        await supabase
            .from('exam_attempts')
            .update({ score: numScore })
            .eq('id', attemptId)

        return NextResponse.json({ score: scoreRecord })
    } catch (error) {
        console.error('Manual grade error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
