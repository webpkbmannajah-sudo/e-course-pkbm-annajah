'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { createClient } from '@/lib/supabase/client'
import {
  TrendingUp,
  Award,
  Target,
  BookOpen,
  CheckCircle,
} from 'lucide-react'
import { formatPercentage } from '@/lib/analytics'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface PerformanceData {
  total_exams_taken: number
  avg_score: number | null
  highest_score: number | null
  lowest_score: number | null
  pass_count: number
  fail_count: number
  total_exams_available: number
}

interface ScoreEntry {
  id: string
  exam_id: string
  percentage: number
  total_score: number
  is_passed: boolean
  graded_at: string
  exam_title: string
}

export default function StudentProgressPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [performance, setPerformance] = useState<PerformanceData | null>(null)
  const [scoreHistory, setScoreHistory] = useState<ScoreEntry[]>([])

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const res = await fetch(`/api/analytics/students/${user.id}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()

      setPerformance(data.performance)
      setScoreHistory(data.score_history || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const completionRate = performance && performance.total_exams_available > 0
    ? Math.round((performance.total_exams_taken / performance.total_exams_available) * 100)
    : 0

  // Line chart
  const lineData = {
    labels: scoreHistory.map(s =>
      s.exam_title.length > 15 ? s.exam_title.slice(0, 15) + '…' : s.exam_title
    ),
    datasets: [{
      label: 'Skor (%)',
      data: scoreHistory.map(s => Number(s.percentage)),
      borderColor: 'rgb(16, 185, 129)',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: scoreHistory.map(s =>
        s.is_passed ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'
      ),
      pointBorderColor: scoreHistory.map(s =>
        s.is_passed ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'
      ),
      pointRadius: 6,
      pointHoverRadius: 8,
    }],
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <TrendingUp className="w-7 h-7 text-emerald-400" />
          Progress Saya
        </h1>
        <p className="text-slate-400 mt-1">Pantau perkembangan belajarmu</p>
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Ujian Diambil',
            value: `${performance?.total_exams_taken || 0} / ${performance?.total_exams_available || 0}`,
            sub: `${completionRate}% selesai`,
            icon: BookOpen,
            color: 'from-blue-500 to-cyan-500',
          },
          {
            label: 'Rata-rata Skor',
            value: formatPercentage(performance?.avg_score ?? null),
            sub: 'keseluruhan',
            icon: Target,
            color: 'from-purple-500 to-pink-500',
          },
          {
            label: 'Skor Tertinggi',
            value: formatPercentage(performance?.highest_score ?? null),
            sub: 'pencapaian terbaik',
            icon: TrendingUp,
            color: 'from-emerald-500 to-teal-500',
          },
        ].map((card) => (
          <div key={card.label} className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-xl font-bold text-white">{card.value}</p>
            <p className="text-xs text-slate-400 mt-1">{card.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Score Timeline */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          Riwayat Skor
        </h2>
        {scoreHistory.length > 0 ? (
          <div className="h-72">
            <Line data={lineData} options={{
              responsive: true,
              maintainAspectRatio: false,
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
                      return val !== null ? `Skor: ${val.toFixed(1)}%` : ''
                    },
                  },
                },
              },
            }} />
          </div>
        ) : (
          <div className="h-72 flex items-center justify-center text-slate-500 flex-col gap-2">
            <BookOpen className="w-12 h-12 text-slate-600" />
            <p>Belum ada riwayat skor</p>
            <Link href="/student/exams" className="text-emerald-400 text-sm hover:text-emerald-300">
              Mulai mengerjakan ujian →
            </Link>
          </div>
        )}
      </div>

      {/* Exam Results Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-400" />
          Hasil Ujian
        </h2>
        {scoreHistory.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            Belum ada hasil ujian
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-400 border-b border-slate-700">
                  <th className="pb-3 pr-4">Ujian</th>
                  <th className="pb-3 pr-4 text-center">Skor</th>
                  <th className="pb-3 pr-4 text-center">Persentase</th>
                  <th className="pb-3 pr-4 text-center">Status</th>
                  <th className="pb-3 text-right">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {scoreHistory.map((score) => (
                  <tr key={score.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 pr-4">
                      <Link href={`/student/exams/${score.exam_id}/result`}
                        className="text-white font-medium hover:text-emerald-400 transition-colors">
                        {score.exam_title}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-center text-slate-300">{Number(score.total_score).toFixed(1)}</td>
                    <td className="py-3 pr-4 text-center">
                      <span className="font-medium text-emerald-400">
                        {Number(score.percentage).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
                        <CheckCircle className="w-3 h-3" />
                        Selesai
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-400 text-sm">
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
