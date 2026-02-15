import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params
        const supabase = await createClient()

        // Verify auth
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check permission: admin can view anyone, student can only view own
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin' && user.id !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Get student profile
        const { data: student, error: studentError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (studentError || !student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 })
        }

        // Get all scores for this student
        const { data: scores } = await supabase
            .from('scores')
            .select('*')
            .eq('user_id', userId)
            .order('graded_at', { ascending: true })

        // Calculate performance
        let performance = {
            total_exams_taken: 0,
            avg_score: null as number | null,
            highest_score: null as number | null,
            lowest_score: null as number | null,
            pass_count: 0,
            fail_count: 0,
            total_exams_available: 0,
        }

        // Count available question exams
        const { count: totalAvailable } = await supabase
            .from('exams')
            .select('*', { count: 'exact', head: true })
            .eq('type', 'questions')

        if (scores && scores.length > 0) {
            const percentages = scores.map(s => Number(s.percentage) || 0)
            const passCount = scores.filter(s => s.is_passed).length

            performance = {
                total_exams_taken: scores.length,
                avg_score: Math.round((percentages.reduce((a, b) => a + b, 0) / percentages.length) * 100) / 100,
                highest_score: Math.max(...percentages),
                lowest_score: Math.min(...percentages),
                pass_count: passCount,
                fail_count: scores.length - passCount,
                total_exams_available: totalAvailable || 0,
            }
        } else {
            performance.total_exams_available = totalAvailable || 0
        }

        // Get exam titles for score history
        const scoreHistory = []
        if (scores) {
            const examIds = [...new Set(scores.map(s => s.exam_id))]
            const { data: exams } = await supabase
                .from('exams')
                .select('id, title')
                .in('id', examIds.length > 0 ? examIds : ['none'])

            for (const score of scores) {
                const exam = exams?.find(e => e.id === score.exam_id)
                scoreHistory.push({
                    ...score,
                    exam_title: exam?.title || 'Unknown Exam',
                })
            }
        }

        return NextResponse.json({
            student,
            performance,
            score_history: scoreHistory,
        })
    } catch (error) {
        console.error('Student analytics error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
