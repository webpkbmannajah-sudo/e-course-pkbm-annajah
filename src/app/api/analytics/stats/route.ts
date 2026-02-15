import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
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

        // Get platform overview via RPC
        const { data: overview, error: overviewError } = await supabase.rpc('get_platform_overview')

        if (overviewError) {
            // Fallback: manual query if RPC not available
            const { count: totalStudents } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'student')

            const { count: totalExams } = await supabase
                .from('exams')
                .select('*', { count: 'exact', head: true })

            const { count: totalQuestionExams } = await supabase
                .from('exams')
                .select('*', { count: 'exact', head: true })
                .eq('type', 'questions')

            const { count: totalAttempts } = await supabase
                .from('exam_attempts')
                .select('*', { count: 'exact', head: true })

            const { count: totalGraded } = await supabase
                .from('scores')
                .select('*', { count: 'exact', head: true })

            const { data: scoreAgg } = await supabase
                .from('scores')
                .select('percentage, is_passed')

            let avgScore: number | null = null
            let passRate: number | null = null
            if (scoreAgg && scoreAgg.length > 0) {
                const sum = scoreAgg.reduce((acc, s) => acc + (Number(s.percentage) || 0), 0)
                avgScore = Math.round((sum / scoreAgg.length) * 100) / 100
                const passCount = scoreAgg.filter(s => s.is_passed).length
                passRate = Math.round((passCount / scoreAgg.length) * 100 * 100) / 100
            }

            const { count: totalMaterials } = await supabase
                .from('materials')
                .select('*', { count: 'exact', head: true })

            return NextResponse.json({
                total_students: totalStudents || 0,
                total_exams: totalExams || 0,
                total_question_exams: totalQuestionExams || 0,
                total_attempts: totalAttempts || 0,
                total_graded: totalGraded || 0,
                avg_platform_score: avgScore,
                overall_pass_rate: passRate,
                total_materials: totalMaterials || 0,
            })
        }

        // Get exam list with stats for the table
        const { data: exams } = await supabase
            .from('exams')
            .select('id, title, type, created_at')
            .eq('type', 'questions')
            .order('created_at', { ascending: false })

        // Get scores per exam for the table
        const examStats = []
        if (exams) {
            for (const exam of exams) {
                const { data: scores } = await supabase
                    .from('scores')
                    .select('percentage, is_passed')
                    .eq('exam_id', exam.id)

                const totalAttempts = scores?.length || 0
                let avgScore: number | null = null
                let passRate: number | null = null

                if (scores && scores.length > 0) {
                    const sum = scores.reduce((acc, s) => acc + (Number(s.percentage) || 0), 0)
                    avgScore = Math.round((sum / scores.length) * 100) / 100
                    const passCount = scores.filter(s => s.is_passed).length
                    passRate = Math.round((passCount / scores.length) * 100 * 100) / 100
                }

                examStats.push({
                    ...exam,
                    total_attempts: totalAttempts,
                    avg_score: avgScore,
                    pass_rate: passRate,
                })
            }
        }

        // Get top students
        const { data: topStudents } = await supabase
            .from('scores')
            .select('user_id, percentage, is_passed')

        const studentMap = new Map<string, { total: number; sum: number; pass: number }>()
        if (topStudents) {
            for (const s of topStudents) {
                const existing = studentMap.get(s.user_id)
                if (existing) {
                    existing.total += 1
                    existing.sum += Number(s.percentage) || 0
                    if (s.is_passed) existing.pass += 1
                } else {
                    studentMap.set(s.user_id, {
                        total: 1,
                        sum: Number(s.percentage) || 0,
                        pass: s.is_passed ? 1 : 0,
                    })
                }
            }
        }

        const studentIds = Array.from(studentMap.keys())
        const { data: studentProfiles } = await supabase
            .from('profiles')
            .select('id, name, email')
            .in('id', studentIds.length > 0 ? studentIds : ['none'])

        const topStudentsList = Array.from(studentMap.entries())
            .map(([userId, data]) => {
                const profile = studentProfiles?.find(p => p.id === userId)
                return {
                    user_id: userId,
                    name: profile?.name || 'Unknown',
                    email: profile?.email || '',
                    avg_score: Math.round((data.sum / data.total) * 100) / 100,
                    exams_taken: data.total,
                    pass_count: data.pass,
                }
            })
            .sort((a, b) => b.avg_score - a.avg_score)
            .slice(0, 10)

        return NextResponse.json({
            overview: overview || {
                total_students: 0,
                total_exams: 0,
                total_question_exams: 0,
                total_attempts: 0,
                total_graded: 0,
                avg_platform_score: null,
                overall_pass_rate: null,
                total_materials: 0,
            },
            exam_stats: examStats,
            top_students: topStudentsList,
        })
    } catch (error) {
        console.error('Analytics stats error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
