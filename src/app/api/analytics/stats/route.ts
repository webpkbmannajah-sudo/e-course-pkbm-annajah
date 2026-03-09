import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminRole } from '@/lib/roles'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') || 'all'

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

        if (!isAdminRole(profile?.role, user.email)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // If requesting only overview
        if (type === 'overview') {
            const { data: overview, error: overviewError } = await supabase.rpc('get_platform_overview')
            if (overviewError) throw overviewError
            return NextResponse.json({ overview })
        }

        // If requesting top students (paginated)
        if (type === 'top_students') {
            const page = parseInt(searchParams.get('page') || '1')
            const limit = parseInt(searchParams.get('limit') || '10')
            const offset = (page - 1) * limit

            const { data: topStudents, error: tsError } = await supabase.rpc('get_top_students', {
                p_limit: limit,
                p_offset: offset
            })
            if (tsError) throw tsError

            const { data: totalCount, error: countError } = await supabase.rpc('get_top_students_count')
            if (countError) throw countError

            return NextResponse.json({
                data: topStudents || [],
                total: totalCount || 0,
                page,
                limit,
                totalPages: Math.ceil((totalCount || 0) / limit)
            })
        }

        // If requesting exam stats (paginated)
        if (type === 'exam_stats') {
            const page = parseInt(searchParams.get('page') || '1')
            const limit = parseInt(searchParams.get('limit') || '10')
            const offset = (page - 1) * limit
            const hasAttemptsOnly = searchParams.get('has_attempts') === 'true'

            // Note: For exam stats, since it's a bit complex with joins and we didn't write an RPC for it,
            // we will fetch exams and then count. In a real highly-optimized scenario, we'd write an RPC for this too.
            // For now, we will paginate the exams table and do the count per page.

            let query = supabase
                .from('exams')
                .select('id, title, type, created_at', { count: 'exact' })
                .eq('type', 'questions')
                .order('created_at', { ascending: false })

            query = query.range(offset, offset + limit - 1)

            const { data: exams, count: totalExams, error: examsError } = await query
            if (examsError) throw examsError

            const examStats = []
            if (exams) {
                for (const exam of exams) {
                    const { data: scores } = await supabase
                        .from('scores')
                        .select('percentage, is_passed')
                        .eq('exam_id', exam.id)

                    const totalAttempts = scores?.length || 0

                    // If filter is active, skip exams with no attempts
                    if (hasAttemptsOnly && totalAttempts === 0) continue;

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

            return NextResponse.json({
                data: examStats,
                total: totalExams || 0,
                page,
                limit,
                totalPages: Math.ceil((totalExams || 0) / limit)
            })
        }

        // Legacy: load everything for initial page load (backward compatible)
        const { data: overview } = await supabase.rpc('get_platform_overview')

        // We only fetch a small initial chunk of exam stats and top students for the initial render
        const { data: topStudents } = await supabase.rpc('get_top_students', {
            p_limit: 10,
            p_offset: 0
        })

        const { data: exams } = await supabase
            .from('exams')
            .select('id, title, type, created_at')
            .eq('type', 'questions')
            .order('created_at', { ascending: false })
            .limit(10)

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

        return NextResponse.json({
            overview,
            exam_stats: examStats,
            top_students: topStudents,
        })
    } catch (error) {
        console.error('Analytics stats error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
