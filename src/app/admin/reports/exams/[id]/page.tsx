'use client'

import { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Users,
  TrendingUp,
  Award,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { formatPercentage } from '@/lib/analytics'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

interface ExamAnalyticsData {
  exam: { id: string; title: string; type: string; question_count: number }
  stats: {
    total_attempts: number
    avg_score: number | null
    max_score: number | null
    min_score: number | null
    pass_count: number
    fail_count: number
    pass_rate: number | null
  }
  distribution: { score_range: string; count: number }[]
  attempts: {
    id: string
    user_id: string
    student_name: string
    student_email: string
    score: number | null
    percentage: number | null
    is_passed: boolean | null
    submitted_at: string
    graded_at: string | null
  }[]
  question_difficulty: {
    question_id: string
    question_text: string
    correct_rate: number
    total_answers: number
  }[]
}

export default function ExamReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ExamAnalyticsData | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed'>('all')
  const [exporting, setExporting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/analytics/exams/${id}`)
      if (!res.ok) throw new Error('Failed')
      setData(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  const handleExport = async (type: 'excel' | 'pdf') => {
    setExporting(true)
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, report: 'exam', id }),
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `laporan-ujian.${type === 'excel' ? 'xlsx' : 'pdf'}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-slate-500">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-amber-400" />
        <p>Data ujian tidak ditemukan</p>
        <Link href="/admin/reports" className="text-purple-400 hover:text-purple-300 mt-2 inline-block">
          ← Kembali ke Reports
        </Link>
      </div>
    )
  }

  const { exam, stats, distribution, attempts, question_difficulty } = data

  const filteredAttempts = attempts.filter(a => {
    if (statusFilter === 'passed') return a.is_passed === true
    if (statusFilter === 'failed') return a.is_passed === false
    return true
  })

  const distributionChart = {
    labels: distribution.map(d => d.score_range),
    datasets: [{
      label: 'Jumlah Siswa',
      data: distribution.map(d => d.count),
      backgroundColor: distribution.map(d => {
        const range = parseInt(d.score_range)
        if (range >= 60) return 'rgba(16, 185, 129, 0.6)'
        if (range >= 40) return 'rgba(245, 158, 11, 0.6)'
        return 'rgba(239, 68, 68, 0.6)'
      }),
      borderColor: distribution.map(d => {
        const range = parseInt(d.score_range)
        if (range >= 60) return 'rgb(16, 185, 129)'
        if (range >= 40) return 'rgb(245, 158, 11)'
        return 'rgb(239, 68, 68)'
      }),
      borderWidth: 2,
      borderRadius: 6,
    }],
  }

  const passFailChart = {
    labels: ['Lulus', 'Tidak Lulus'],
    datasets: [{
      data: [stats.pass_count, stats.fail_count],
      backgroundColor: ['rgba(16, 185, 129, 0.7)', 'rgba(239, 68, 68, 0.7)'],
      borderColor: ['rgb(16, 185, 129)', 'rgb(239, 68, 68)'],
      borderWidth: 2,
    }],
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/admin/reports" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{exam.title}</h1>
          <p className="text-slate-500 text-sm mt-1">{exam.question_count} soal · Tipe: {exam.type}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('excel')} disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-900 rounded-xl transition-colors disabled:opacity-50">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button onClick={() => handleExport('pdf')} disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-slate-900 rounded-xl transition-colors disabled:opacity-50">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Peserta', value: stats.total_attempts, icon: Users, color: 'text-blue-400' },
          { label: 'Rata-rata', value: formatPercentage(stats.avg_score), icon: Target, color: 'text-purple-400' },
          { label: 'Tertinggi', value: formatPercentage(stats.max_score), icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Terendah', value: formatPercentage(stats.min_score), icon: AlertTriangle, color: 'text-amber-400' },
          { label: 'Lulus', value: stats.pass_count, icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'Tidak Lulus', value: stats.fail_count, icon: XCircle, color: 'text-red-400' },
        ].map((card) => (
          <div key={card.label} className="bg-white border border-slate-200 rounded-2xl p-4">
            <card.icon className={`w-5 h-5 ${card.color} mb-2`} />
            <p className="text-xl font-bold text-slate-900">{card.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Kelulusan</h2>
          {stats.total_attempts > 0 ? (
            <div className="h-56 flex items-center justify-center">
              <Doughnut data={passFailChart} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: 'rgb(148, 163, 184)', padding: 16 } } },
              }} />
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-slate-500">Belum ada data</div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Distribusi Skor</h2>
          {stats.total_attempts > 0 ? (
            <div className="h-56">
              <Bar data={distributionChart} options={{
                responsive: true, maintainAspectRatio: false,
                scales: {
                  x: { ticks: { color: 'rgb(148, 163, 184)' }, grid: { color: 'rgba(51, 65, 85, 0.5)' } },
                  y: { beginAtZero: true, ticks: { color: 'rgb(148, 163, 184)', stepSize: 1 }, grid: { color: 'rgba(51, 65, 85, 0.5)' } },
                },
                plugins: { legend: { display: false } },
              }} />
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-slate-500">Belum ada data</div>
          )}
        </div>
      </div>

      {/* Students Score Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-400" /> Skor Siswa
          </h2>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | 'passed' | 'failed')}
            className="bg-slate-200 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-1.5">
            <option value="all">Semua</option>
            <option value="passed">Lulus</option>
            <option value="failed">Tidak Lulus</option>
          </select>
        </div>

        {filteredAttempts.length === 0 ? (
          <div className="text-center py-8 text-slate-500">Tidak ada data</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-500 border-b border-slate-200">
                  <th className="pb-3 pr-4">Nama</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4 text-center">Skor</th>
                  <th className="pb-3 pr-4 text-center">Persentase</th>
                  <th className="pb-3 pr-4 text-center">Status</th>
                  <th className="pb-3 text-right">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttempts.map((attempt) => (
                  <tr key={attempt.id} className="border-b border-slate-200/50 hover:bg-slate-200/30 transition-colors">
                    <td className="py-3 pr-4 text-slate-900 font-medium">{attempt.student_name}</td>
                    <td className="py-3 pr-4 text-slate-500 text-sm">{attempt.student_email}</td>
                    <td className="py-3 pr-4 text-center text-slate-600">{attempt.score !== null ? attempt.score : '-'}</td>
                    <td className="py-3 pr-4 text-center">
                      <span className={`font-medium ${attempt.percentage !== null
                        ? (attempt.percentage >= 60 ? 'text-emerald-400' : 'text-red-400')
                        : 'text-slate-500'}`}>
                        {attempt.percentage !== null ? `${Number(attempt.percentage).toFixed(1)}%` : '-'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-center">
                      {attempt.is_passed !== null ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          attempt.is_passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {attempt.is_passed ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {attempt.is_passed ? 'Lulus' : 'Tidak Lulus'}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-3 text-right text-slate-500 text-sm">
                      {attempt.graded_at ? new Date(attempt.graded_at).toLocaleDateString('id-ID') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Question Difficulty */}
      {question_difficulty.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Tingkat Kesulitan Soal</h2>
          <div className="space-y-3">
            {question_difficulty.map((q, i) => (
              <div key={q.question_id} className="flex items-center gap-4">
                <span className="text-slate-500 text-sm w-8 shrink-0">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 text-sm truncate">{q.question_text}</p>
                  <div className="mt-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        q.correct_rate >= 70 ? 'bg-emerald-500'
                        : q.correct_rate >= 40 ? 'bg-amber-500'
                        : 'bg-red-500'
                      }`}
                      style={{ width: `${q.correct_rate}%` }}
                    />
                  </div>
                </div>
                <span className={`text-sm font-medium w-14 text-right ${
                  q.correct_rate >= 70 ? 'text-emerald-400'
                  : q.correct_rate >= 40 ? 'text-amber-400'
                  : 'text-red-400'
                }`}>
                  {q.correct_rate.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
