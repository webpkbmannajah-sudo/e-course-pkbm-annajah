import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateAutoScore } from '@/lib/grading'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Verify user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { attemptId } = await request.json()

        if (!attemptId) {
            return NextResponse.json({ error: 'attemptId is required' }, { status: 400 })
        }

        // Fetch the attempt
        const { data: attempt, error: attemptError } = await supabase
            .from('exam_attempts')
            .select('*')
            .eq('id', attemptId)
            .single()

        if (attemptError || !attempt) {
            return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
        }

        // Fetch questions with choices for this exam
        const { data: questions, error: questionsError } = await supabase
            .from('questions')
            .select(`
        id,
        question_text,
        weight,
        question_type,
        order_number,
        choices (
          id,
          choice_text,
          is_correct
        )
      `)
            .eq('exam_id', attempt.exam_id)
            .order('order_number')

        if (questionsError || !questions) {
            return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
        }

        // Calculate score
        const result = calculateAutoScore(
            attempt.answers || {},
            questions.map(q => ({
                ...q,
                weight: q.weight || 1.0,
                question_type: q.question_type || 'mcq',
            }))
        )

        // Upsert to scores table (update if already graded)
        const { data: score, error: scoreError } = await supabase
            .from('scores')
            .upsert(
                {
                    attempt_id: attemptId,
                    exam_id: attempt.exam_id,
                    user_id: attempt.user_id,
                    total_score: result.totalScore,
                    max_score: result.maxScore,
                    percentage: result.percentage,
                    is_passed: result.isPassed,
                    grading_type: 'auto',
                    graded_at: new Date().toISOString(),
                    breakdown: result.breakdown,
                },
                { onConflict: 'attempt_id' }
            )
            .select()
            .single()

        if (scoreError) {
            console.error('Score upsert error:', scoreError)
            return NextResponse.json({ error: 'Failed to save score' }, { status: 500 })
        }

        // Also update exam_attempts.score for backwards compatibility
        await supabase
            .from('exam_attempts')
            .update({ score: Math.round(result.percentage) })
            .eq('id', attemptId)

        return NextResponse.json({ score })
    } catch (error) {
        console.error('Auto-grade error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
