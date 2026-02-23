'use client'

import { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  TrendingUp,
  Award,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BookOpen,
  User,
} from 'lucide-react'
import { formatPercentage } from '@/lib/analytics'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface StudentData {
  student: { id: string; name: string; email: string; created_at: string }
  performance: {
    total_exams_taken: number
    avg_score: number | null
    highest_score: number | null
    lowest_score: number | null
    pass_count: number
    fail_count: number
    total_exams_available: number
  }
  score_history: {
    id: string
    exam_id: string
    percentage: number
    total_score: number
    is_passed: boolean
    graded_at: string
    exam_title: string
  }[]
}

export default function StudentReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<StudentData | null>(null)
  const [exporting, setExporting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/analytics/students/${id}`)
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
        body: JSON.stringify({ type, report: 'student', id }),
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `laporan-siswa.${type === 'excel' ? 'xlsx' : 'pdf'}`
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
        <p>Data siswa tidak ditemukan</p>
        <Link href="/admin/reports" className="text-purple-400 hover:text-purple-300 mt-2 inline-block">← Kembali</Link>
      </div>
    )
  }

  const { student, performance, score_history } = data

  // Line chart data
  const lineData = {
    labels: score_history.map(s =>
      s.exam_title.length > 15 ? s.exam_title.slice(0, 15) + '…' : s.exam_title
    ),
    datasets: [{
      label: 'Skor (%)',
      data: score_history.map(s => Number(s.percentage)),
      borderColor: 'rgb(168, 85, 247)',
      backgroundColor: 'rgba(168, 85, 247, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: score_history.map(s =>
        s.is_passed ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'
      ),
      pointBorderColor: score_history.map(s =>
        s.is_passed ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'
      ),
      pointRadius: 6,
      pointHoverRadius: 8,
    }],
  }

  const completionRate = performance.total_exams_available > 0
    ? Math.round((performance.total_exams_taken / performance.total_exams_available) * 100)
    : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/admin/reports" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{student.name}</h1>
              <p className="text-slate-500 text-sm">{student.email}</p>
            </div>
          </div>
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

      {/* Performance Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Ujian Diambil', value: `${performance.total_exams_taken} / ${performance.total_exams_available}`, sub: `${completionRate}% selesai`, icon: BookOpen, color: 'text-blue-400' },
          { label: 'Rata-rata Skor', value: formatPercentage(performance.avg_score), sub: 'overall', icon: Target, color: 'text-purple-400' },
          { label: 'Skor Tertinggi', value: formatPercentage(performance.highest_score), sub: 'best performance', icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Kelulusan', value: `${performance.pass_count} / ${performance.total_exams_taken}`, sub: performance.total_exams_taken > 0 ? `${Math.round((performance.pass_count / performance.total_exams_taken) * 100)}%` : '-', icon: Award, color: 'text-amber-400' },
        ].map((card) => (
          <div key={card.label} className="bg-white border border-slate-200 rounded-2xl p-5">
            <card.icon className={`w-5 h-5 ${card.color} mb-3`} />
            <p className="text-xl font-bold text-slate-900">{card.value}</p>
            <p className="text-xs text-slate-500 mt-1">{card.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Score Timeline Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-400" /> Riwayat Skor
        </h2>
        {score_history.length > 0 ? (
          <div className="h-72">
            <Line data={lineData} options={{
              responsive: true, maintainAspectRatio: false,
              scales: {
                x: { ticks: { color: 'rgb(148, 163, 184)' }, grid: { color: 'rgba(51, 65, 85, 0.5)' } },
                y: { min: 0, max: 100, ticks: { color: 'rgb(148, 163, 184)' }, grid: { color: 'rgba(51, 65, 85, 0.5)' } },
              },
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (ctx) => {
                      const val = ctx.parsed.y
                      return val !== null && val !== undefined ? `Skor: ${val.toFixed(1)}%` : ''
                    },
                  },
                },
              },
            }} />
          </div>
        ) : (
          <div className="h-72 flex items-center justify-center text-slate-500">
            Belum ada riwayat skor
          </div>
        )}
      </div>

      {/* Exam Results Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
          <Award className="w-5 h-5 text-purple-400" /> Detail Hasil Ujian
        </h2>
        {score_history.length === 0 ? (
          <div className="text-center py-8 text-slate-500">Belum ada hasil ujian</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-500 border-b border-slate-200">
                  <th className="pb-3 pr-4">Ujian</th>
                  <th className="pb-3 pr-4 text-center">Skor</th>
                  <th className="pb-3 pr-4 text-center">Persentase</th>
                  <th className="pb-3 pr-4 text-center">Status</th>
                  <th className="pb-3 text-right">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {score_history.map((score) => (
                  <tr key={score.id} className="border-b border-slate-200/50 hover:bg-slate-200/30 transition-colors">
                    <td className="py-3 pr-4">
                      <Link href={`/admin/reports/exams/${score.exam_id}`}
                        className="text-slate-900 font-medium hover:text-purple-400 transition-colors">
                        {score.exam_title}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-center text-slate-600">{Number(score.total_score).toFixed(1)}</td>
                    <td className="py-3 pr-4 text-center">
                      <span className={`font-medium ${
                        Number(score.percentage) >= 60 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {Number(score.percentage).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        score.is_passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {score.is_passed ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {score.is_passed ? 'Lulus' : 'Tidak Lulus'}
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-500 text-sm">
                      {score.graded_at ? new Date(score.graded_at).toLocaleDateString('id-ID') : '-'}
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
