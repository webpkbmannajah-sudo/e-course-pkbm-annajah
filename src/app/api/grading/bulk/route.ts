import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateAutoScore } from '@/lib/grading'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Verify user is admin
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const { examId } = await request.json()

        if (!examId) {
            return NextResponse.json({ error: 'examId is required' }, { status: 400 })
        }

        // Fetch all attempts for this exam
        const { data: attempts, error: attemptsError } = await supabase
            .from('exam_attempts')
            .select('*')
            .eq('exam_id', examId)

        if (attemptsError) {
            return NextResponse.json({ error: 'Failed to fetch attempts' }, { status: 500 })
        }

        if (!attempts || attempts.length === 0) {
            return NextResponse.json({ error: 'No attempts found for this exam' }, { status: 404 })
        }

        // Fetch questions with choices
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
            .eq('exam_id', examId)
            .order('order_number')

        if (questionsError || !questions) {
            return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
        }

        const normalizedQuestions = questions.map(q => ({
            ...q,
            weight: q.weight || 1.0,
            question_type: q.question_type || 'mcq',
        }))

        // Grade each attempt
        const results = []
        let gradedCount = 0
        let failedCount = 0

        for (const attempt of attempts) {
            try {
                const result = calculateAutoScore(attempt.answers || {}, normalizedQuestions)

                // Upsert score
                const { error: scoreError } = await supabase
                    .from('scores')
                    .upsert(
                        {
                            attempt_id: attempt.id,
                            exam_id: examId,
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

                if (scoreError) {
                    failedCount++
                    continue
                }

                // Update exam_attempts.score for backward compatibility
                await supabase
                    .from('exam_attempts')
                    .update({ score: Math.round(result.percentage) })
                    .eq('id', attempt.id)

                gradedCount++
                results.push({
                    attemptId: attempt.id,
                    userId: attempt.user_id,
                    percentage: result.percentage,
                    isPassed: result.isPassed,
                })
            } catch {
                failedCount++
            }
        }

        return NextResponse.json({
            summary: {
                total: attempts.length,
                graded: gradedCount,
                failed: failedCount,
            },
            results,
        })
    } catch (error) {
        console.error('Bulk grade error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
