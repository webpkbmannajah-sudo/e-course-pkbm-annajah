'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { createClient } from '@/lib/supabase/client'
import {
  BarChart3,
  Users,
  ClipboardList,
  Award,
  TrendingUp,
  FileText,
  Download,
  FileSpreadsheet,
  Percent,
  Target,
} from 'lucide-react'
import type { PlatformOverview } from '@/types'
import { formatPercentage } from '@/lib/analytics'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface ExamStat {
  id: string
  title: string
  type: string
  created_at: string
  total_attempts: number
  avg_score: number | null
  pass_rate: number | null
}

interface TopStudent {
  user_id: string
  name: string
  email: string
  avg_score: number
  exams_taken: number
  pass_count: number
}

export default function AdminReportsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<PlatformOverview | null>(null)
  const [examStats, setExamStats] = useState<ExamStat[]>([])
  const [topStudents, setTopStudents] = useState<TopStudent[]>([])
  const [examFilter, setExamFilter] = useState<'all' | 'has_attempts'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'avg_score' | 'pass_rate'>('avg_score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [exporting, setExporting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics/stats')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()

      setOverview(data.overview)
      setExamStats(data.exam_stats || [])
      setTopStudents(data.top_students || [])
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      // Fallback: direct query
      const { count: totalStudents } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')

      const { count: totalExams } = await supabase
        .from('exams')
        .select('*', { count: 'exact', head: true })

      const { count: totalAttempts } = await supabase
        .from('exam_attempts')
        .select('*', { count: 'exact', head: true })

      const { count: totalMaterials } = await supabase
        .from('materials')
        .select('*', { count: 'exact', head: true })

      setOverview({
        total_students: totalStudents || 0,
        total_exams: totalExams || 0,
        total_question_exams: 0,
        total_attempts: totalAttempts || 0,
        total_graded: 0,
        avg_platform_score: null,
        overall_pass_rate: null,
        total_materials: totalMaterials || 0,
      })
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report: 'overview' }),
      })
      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'laporan-ringkasan.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setExporting(false)
    }
  }

  const filteredExams = examStats.filter(exam => {
    if (examFilter === 'has_attempts') return exam.total_attempts > 0
    return true
  })

  const sortedExams = [...filteredExams].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    if (sortBy === 'name') return a.title.localeCompare(b.title) * dir
    if (sortBy === 'avg_score') return ((a.avg_score || 0) - (b.avg_score || 0)) * dir
    if (sortBy === 'pass_rate') return ((a.pass_rate || 0) - (b.pass_rate || 0)) * dir
    return 0
  })

  const handleSort = (col: 'name' | 'avg_score' | 'pass_rate') => {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortDir('desc')
    }
  }

  // Chart data
  const passFail = overview ? {
    pass: overview.overall_pass_rate ? Math.round((overview.total_graded * (overview.overall_pass_rate / 100))) : 0,
    fail: overview.total_graded - (overview.overall_pass_rate ? Math.round((overview.total_graded * (overview.overall_pass_rate / 100))) : 0),
  } : { pass: 0, fail: 0 }

  const doughnutData = {
    labels: ['Lulus', 'Tidak Lulus'],
    datasets: [{
      data: [passFail.pass, passFail.fail],
      backgroundColor: ['rgba(16, 185, 129, 0.7)', 'rgba(239, 68, 68, 0.7)'],
      borderColor: ['rgb(16, 185, 129)', 'rgb(239, 68, 68)'],
      borderWidth: 2,
    }],
  }

  const barData = {
    labels: sortedExams.slice(0, 10).map(e => e.title.length > 20 ? e.title.slice(0, 20) + '…' : e.title),
    datasets: [{
      label: 'Rata-rata Skor (%)',
      data: sortedExams.slice(0, 10).map(e => e.avg_score || 0),
      backgroundColor: 'rgba(168, 85, 247, 0.5)',
      borderColor: 'rgb(168, 85, 247)',
      borderWidth: 2,
      borderRadius: 6,
    }],
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-purple-400" />
            Laporan & Analitik
          </h1>
          <p className="text-slate-500 mt-1">Ringkasan performa platform dan ujian</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport()}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-900 rounded-xl transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Unduh Excel
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Siswa', value: overview?.total_students || 0, icon: Users, color: 'from-blue-500 to-cyan-500' },
          { label: 'Total Ujian', value: overview?.total_exams || 0, icon: ClipboardList, color: 'from-purple-500 to-pink-500' },
          { label: 'Total Percobaan', value: overview?.total_attempts || 0, icon: FileText, color: 'from-amber-500 to-orange-500' },
          { label: 'Sudah Dinilai', value: overview?.total_graded || 0, icon: Award, color: 'from-emerald-500 to-teal-500' },
          { label: 'Rata-rata Skor', value: formatPercentage(overview?.avg_platform_score ?? null), icon: Target, color: 'from-indigo-500 to-violet-500' },
          { label: 'Tingkat Kelulusan', value: formatPercentage(overview?.overall_pass_rate ?? null), icon: Percent, color: 'from-rose-500 to-pink-500' },
        ].map((card) => (
          <div key={card.label} className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <card.icon className="w-4 h-4 text-slate-900" />
              </div>
            </div>
            <p className="text-xl font-bold text-slate-900">{card.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doughnut */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Kelulusan Keseluruhan</h2>
          {overview && overview.total_graded > 0 ? (
            <div className="h-64 flex items-center justify-center">
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { color: 'rgb(148, 163, 184)', padding: 16 },
                    },
                  },
                }}
              />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              Belum ada data penilaian
            </div>
          )}
        </div>

        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Rata-rata Skor per Ujian</h2>
          {sortedExams.length > 0 && sortedExams.some(e => e.avg_score !== null) ? (
            <div className="h-64">
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      ticks: { color: 'rgb(148, 163, 184)' },
                      grid: { color: 'rgba(51, 65, 85, 0.5)' },
                    },
                    y: {
                      min: 0,
                      max: 100,
                      ticks: { color: 'rgb(148, 163, 184)' },
                      grid: { color: 'rgba(51, 65, 85, 0.5)' },
                    },
                  },
                  plugins: {
                    legend: { display: false },
                  },
                }}
              />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              Belum ada data skor ujian
            </div>
          )}
        </div>
      </div>

      {/* Exam Performance Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-purple-400" />
            Performa per Ujian
          </h2>
          <div className="flex items-center gap-3">
            <select
              value={examFilter}
              onChange={(e) => setExamFilter(e.target.value as 'all' | 'has_attempts')}
              className="bg-slate-200 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">Semua Ujian</option>
              <option value="has_attempts">Sudah Ada Peserta</option>
            </select>
          </div>
        </div>

        {sortedExams.length === 0 ? (
          <div className="text-center py-8 text-slate-500">Belum ada ujian</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-500 border-b border-slate-200">
                  <th className="pb-3 pr-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('name')}>
                    Ujian {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="pb-3 pr-4 text-center">Peserta</th>
                  <th className="pb-3 pr-4 text-center cursor-pointer hover:text-slate-900" onClick={() => handleSort('avg_score')}>
                    Rata-rata {sortBy === 'avg_score' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="pb-3 pr-4 text-center cursor-pointer hover:text-slate-900" onClick={() => handleSort('pass_rate')}>
                    Kelulusan {sortBy === 'pass_rate' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="pb-3 text-right">Detail</th>
                </tr>
              </thead>
              <tbody>
                {sortedExams.map((exam) => (
                  <tr key={exam.id} className="border-b border-slate-200/50 hover:bg-slate-200/30 transition-colors">
                    <td className="py-3 pr-4">
                      <span className="text-slate-900 font-medium">{exam.title}</span>
                    </td>
                    <td className="py-3 pr-4 text-center text-slate-600">{exam.total_attempts}</td>
                    <td className="py-3 pr-4 text-center">
                      <span className={`font-medium ${
                        exam.avg_score !== null
                          ? exam.avg_score >= 60 ? 'text-emerald-400' : 'text-amber-400'
                          : 'text-slate-500'
                      }`}>
                        {exam.avg_score !== null ? `${exam.avg_score.toFixed(1)}%` : '-'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-center">
                      <span className={`font-medium ${
                        exam.pass_rate !== null
                          ? exam.pass_rate >= 50 ? 'text-emerald-400' : 'text-red-400'
                          : 'text-slate-500'
                      }`}>
                        {exam.pass_rate !== null ? `${exam.pass_rate.toFixed(1)}%` : '-'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/admin/reports/exams/${exam.id}`}
                        className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        Lihat →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Students Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          Siswa Terbaik
        </h2>

        {topStudents.length === 0 ? (
          <div className="text-center py-8 text-slate-500">Belum ada data siswa</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-500 border-b border-slate-200">
                  <th className="pb-3 pr-4">#</th>
                  <th className="pb-3 pr-4">Nama</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4 text-center">Ujian Diambil</th>
                  <th className="pb-3 pr-4 text-center">Rata-rata Skor</th>
                  <th className="pb-3 text-right">Detail</th>
                </tr>
              </thead>
              <tbody>
                {topStudents.map((student, i) => (
                  <tr key={student.user_id} className="border-b border-slate-200/50 hover:bg-slate-200/30 transition-colors">
                    <td className="py-3 pr-4">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-amber-500/20 text-amber-400' :
                        i === 1 ? 'bg-slate-400/20 text-slate-600' :
                        i === 2 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-slate-200 text-slate-500'
                      }`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-900 font-medium">{student.name}</td>
                    <td className="py-3 pr-4 text-slate-500 text-sm">{student.email}</td>
                    <td className="py-3 pr-4 text-center text-slate-600">{student.exams_taken}</td>
                    <td className="py-3 pr-4 text-center">
                      <span className={`font-medium ${student.avg_score >= 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {student.avg_score.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/admin/reports/students/${student.user_id}`}
                        className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        Lihat →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
