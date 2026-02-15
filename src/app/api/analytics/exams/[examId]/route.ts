import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ examId: string }> }
) {
    try {
        const { examId } = await params
        const supabase = await createClient()

        // Verify admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Get exam info
        const { data: exam, error: examError } = await supabase
            .from('exams')
            .select('*')
            .eq('id', examId)
            .single()

        if (examError || !exam) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
        }

        // Get question count
        const { count: questionCount } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('exam_id', examId)

        // Get all scores for this exam
        const { data: scores } = await supabase
            .from('scores')
            .select('*')
            .eq('exam_id', examId)
            .order('graded_at', { ascending: false })

        // Calculate stats
        let stats = {
            total_attempts: 0,
            avg_score: null as number | null,
            max_score: null as number | null,
            min_score: null as number | null,
            pass_count: 0,
            fail_count: 0,
            pass_rate: null as number | null,
        }

        if (scores && scores.length > 0) {
            const percentages = scores.map(s => Number(s.percentage) || 0)
            const passCount = scores.filter(s => s.is_passed).length

            stats = {
                total_attempts: scores.length,
                avg_score: Math.round((percentages.reduce((a, b) => a + b, 0) / percentages.length) * 100) / 100,
                max_score: Math.max(...percentages),
                min_score: Math.min(...percentages),
                pass_count: passCount,
                fail_count: scores.length - passCount,
                pass_rate: Math.round((passCount / scores.length) * 100 * 100) / 100,
            }
        }

        // Calculate score distribution
        const ranges = ['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80-89', '90-100']
        const distribution = ranges.map(range => ({ score_range: range, count: 0 }))

        if (scores) {
            for (const score of scores) {
                const pct = Number(score.percentage) || 0
                let idx = Math.floor(pct / 10)
                if (idx >= 10) idx = 9 // 100% goes to 90-100
                distribution[idx].count += 1
            }
        }

        // Get attempts with student info
        const attempts = []
        if (scores) {
            const userIds = [...new Set(scores.map(s => s.user_id))]
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, name, email')
                .in('id', userIds.length > 0 ? userIds : ['none'])

            for (const score of scores) {
                const studentProfile = profiles?.find(p => p.id === score.user_id)

                // Get the attempt's submitted_at
                const { data: attempt } = await supabase
                    .from('exam_attempts')
                    .select('submitted_at')
                    .eq('id', score.attempt_id)
                    .single()

                attempts.push({
                    id: score.attempt_id,
                    user_id: score.user_id,
                    exam_id: score.exam_id,
                    student_name: studentProfile?.name || 'Unknown',
                    student_email: studentProfile?.email || '',
                    score: Number(score.total_score),
                    percentage: Number(score.percentage),
                    is_passed: score.is_passed,
                    submitted_at: attempt?.submitted_at || score.graded_at,
                    graded_at: score.graded_at,
                })
            }
        }

        // Get question difficulty from breakdowns
        const questionDifficulty = []
        if (scores) {
            const questionMap = new Map<string, { text: string; correct: number; total: number }>()

            for (const score of scores) {
                const breakdown = score.breakdown as { question_id: string; question_text: string; is_correct: boolean }[] || []
                for (const item of breakdown) {
                    const existing = questionMap.get(item.question_id)
                    if (existing) {
                        existing.total += 1
                        if (item.is_correct) existing.correct += 1
                    } else {
                        questionMap.set(item.question_id, {
                            text: item.question_text,
                            correct: item.is_correct ? 1 : 0,
                            total: 1,
                        })
                    }
                }
            }

            for (const [id, data] of questionMap.entries()) {
                questionDifficulty.push({
                    question_id: id,
                    question_text: data.text,
                    correct_rate: Math.round((data.correct / data.total) * 100 * 100) / 100,
                    total_answers: data.total,
                })
            }
        }

        return NextResponse.json({
            exam: { ...exam, question_count: questionCount || 0 },
            stats,
            distribution,
            attempts,
            question_difficulty: questionDifficulty,
        })
    } catch (error) {
        console.error('Exam analytics error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
