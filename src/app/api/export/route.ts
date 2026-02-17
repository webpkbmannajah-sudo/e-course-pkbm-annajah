import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateExcel, examReportColumns, studentReportColumns, overviewReportColumns } from '@/lib/export'

export async function POST(request: NextRequest) {
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

        const body = await request.json()
        const { report, id } = body as { report: 'exam' | 'student' | 'overview'; id?: string }

        if (!report) {
            return NextResponse.json({ error: 'Missing report type' }, { status: 400 })
        }

        let data: Record<string, unknown>[] = []
        let columns = overviewReportColumns
        let title = 'Report'
        let fileName = 'report'

        if (report === 'exam' && id) {
            title = 'Laporan Ujian'
            fileName = 'laporan-ujian'
            columns = examReportColumns

            // Get scores for this exam
            const { data: scores } = await supabase
                .from('scores')
                .select('*')
                .eq('exam_id', id)
                .order('graded_at', { ascending: false })

            const { data: exam } = await supabase
                .from('exams')
                .select('title')
                .eq('id', id)
                .single()

            if (exam) {
                title = `Laporan Ujian: ${exam.title}`
                fileName = `laporan-${exam.title.toLowerCase().replace(/\s+/g, '-')}`
            }

            if (scores) {
                const userIds = [...new Set(scores.map(s => s.user_id))]
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, name, email')
                    .in('id', userIds.length > 0 ? userIds : ['none'])

                data = scores.map(score => {
                    const studentProfile = profiles?.find(p => p.id === score.user_id)
                    return {
                        student_name: studentProfile?.name || 'Unknown',
                        student_email: studentProfile?.email || '',
                        score: Number(score.total_score),
                        percentage: `${Number(score.percentage).toFixed(1)}%`,
                        status: score.is_passed ? 'Lulus' : 'Tidak Lulus',
                        graded_at: score.graded_at
                            ? new Date(score.graded_at).toLocaleDateString('id-ID')
                            : '-',
                    }
                })
            }
        } else if (report === 'student' && id) {
            title = 'Laporan Siswa'
            fileName = 'laporan-siswa'
            columns = studentReportColumns

            const { data: student } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', id)
                .single()

            if (student) {
                title = `Laporan Siswa: ${student.name}`
                fileName = `laporan-${student.name.toLowerCase().replace(/\s+/g, '-')}`
            }

            const { data: scores } = await supabase
                .from('scores')
                .select('*')
                .eq('user_id', id)
                .order('graded_at', { ascending: false })

            if (scores) {
                const examIds = [...new Set(scores.map(s => s.exam_id))]
                const { data: exams } = await supabase
                    .from('exams')
                    .select('id, title')
                    .in('id', examIds.length > 0 ? examIds : ['none'])

                data = scores.map(score => {
                    const exam = exams?.find(e => e.id === score.exam_id)
                    return {
                        exam_title: exam?.title || 'Unknown',
                        total_score: Number(score.total_score),
                        percentage: `${Number(score.percentage).toFixed(1)}%`,
                        status: score.is_passed ? 'Lulus' : 'Tidak Lulus',
                        graded_at: score.graded_at
                            ? new Date(score.graded_at).toLocaleDateString('id-ID')
                            : '-',
                    }
                })
            }
        } else if (report === 'overview') {
            title = 'Laporan Ringkasan Platform'
            fileName = 'laporan-ringkasan'
            columns = overviewReportColumns

            const { data: exams } = await supabase
                .from('exams')
                .select('id, title')
                .eq('type', 'questions')

            if (exams) {
                for (const exam of exams) {
                    const { data: scores } = await supabase
                        .from('scores')
                        .select('percentage, is_passed')
                        .eq('exam_id', exam.id)

                    const totalAttempts = scores?.length || 0
                    let avgScore = '-'
                    let passRate = '-'

                    if (scores && scores.length > 0) {
                        const sum = scores.reduce((acc, s) => acc + (Number(s.percentage) || 0), 0)
                        avgScore = `${(sum / scores.length).toFixed(1)}%`
                        const passCount = scores.filter(s => s.is_passed).length
                        passRate = `${((passCount / scores.length) * 100).toFixed(1)}%`
                    }

                    data.push({
                        exam_title: exam.title,
                        total_attempts: totalAttempts,
                        avg_score: avgScore,
                        pass_rate: passRate,
                    })
                }
            }
        } else {
            return NextResponse.json({ error: 'Invalid report type or missing id' }, { status: 400 })
        }

        // Generate Excel file only
        const buffer = generateExcel(data, columns, title)

        return new Response(Buffer.from(buffer), {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${fileName}.xlsx"`,
            },
        })
    } catch (error) {
        console.error('Export error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
