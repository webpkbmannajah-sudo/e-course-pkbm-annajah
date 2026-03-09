'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
  ChevronDown,
} from 'lucide-react'
import { formatPercentage } from '@/lib/analytics'
import Pagination from '@/components/Pagination'

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
  const [expandedExams, setExpandedExams] = useState<Record<string, boolean>>({})

  // Pagination for the table
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const groupedScoreHistory = useMemo(() => {
    const groups: Record<string, {
      exam_id: string
      exam_title: string
      highest_percentage: number
      highest_score: number
      attempts: ScoreEntry[]
    }> = {}
    
    scoreHistory.forEach(score => {
      if (!groups[score.exam_id]) {
        groups[score.exam_id] = {
          exam_id: score.exam_id,
          exam_title: score.exam_title,
          highest_percentage: Number(score.percentage),
          highest_score: Number(score.total_score),
          attempts: [score]
        }
      } else {
        groups[score.exam_id].attempts.push(score)
        if (Number(score.percentage) > groups[score.exam_id].highest_percentage) {
          groups[score.exam_id].highest_percentage = Number(score.percentage)
          groups[score.exam_id].highest_score = Number(score.total_score)
        }
      }
    })

    // Sort attempts from newest to oldest within each group
    Object.values(groups).forEach(group => {
      group.attempts.sort((a, b) => new Date(b.graded_at).getTime() - new Date(a.graded_at).getTime())
    })

    // Sort groups themselves by the latest attempt
    const sortedGroups = Object.values(groups).sort((a, b) => {
      const latestA = a.attempts[0]?.graded_at ? new Date(a.attempts[0].graded_at).getTime() : 0
      const latestB = b.attempts[0]?.graded_at ? new Date(b.attempts[0].graded_at).getTime() : 0
      return latestB - latestA
    })

    return sortedGroups
  }, [scoreHistory])

  const toggleExpand = (examId: string) => {
    setExpandedExams(prev => ({ ...prev, [examId]: !prev[examId] }))
  }

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

  const totalPages = Math.ceil(groupedScoreHistory.length / itemsPerPage)
  const paginatedGroups = groupedScoreHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <TrendingUp className="w-7 h-7 text-emerald-400" />
          Progress Saya
        </h1>
        <p className="text-slate-500 mt-1">Pantau perkembangan belajarmu</p>
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
          <div key={card.label} className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-xl font-bold text-slate-900">{card.value}</p>
            <p className="text-xs text-slate-500 mt-1">{card.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Score Timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
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
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
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
                <tr className="text-left text-sm text-slate-500 border-b border-slate-200">
                  <th className="pb-3 pr-4">Ujian</th>
                  <th className="pb-3 pr-4 text-center">Skor</th>
                  <th className="pb-3 pr-4 text-center">Persentase</th>
                  <th className="pb-3 pr-4 text-center">Status</th>
                  <th className="pb-3 text-right">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {paginatedGroups.map((group) => (
                  <React.Fragment key={group.exam_id}>
                    <tr 
                      className="border-b border-slate-200/50 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => toggleExpand(group.exam_id)}
                    >
                      <td className="py-3 pr-4 flex items-center gap-2">
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedExams[group.exam_id] ? 'rotate-180' : ''}`} />
                        <span className="text-slate-900 font-medium">{group.exam_title}</span>
                      </td>
                      <td className="py-3 pr-4 text-center text-slate-600">{Number(group.highest_score).toFixed(1)}</td>
                      <td className="py-3 pr-4 text-center">
                        <span className="font-medium text-emerald-500">
                          {Number(group.highest_percentage).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          {group.attempts.length} Percobaan
                        </span>
                      </td>
                      <td className="py-3 text-right text-slate-500 text-sm">
                        {group.attempts[0]?.graded_at ? new Date(group.attempts[0].graded_at).toLocaleDateString('id-ID') : '-'}
                      </td>
                    </tr>
                    {expandedExams[group.exam_id] && group.attempts.map((score, index) => (
                      <tr key={score.id} className="bg-slate-50/80 border-b border-slate-100 last:border-slate-200/50">
                        <td className="py-2 pr-4 pl-10">
                          <Link href={`/student/exams/${score.exam_id}/result`} className="text-sm font-medium text-emerald-600 hover:text-emerald-500 transition-colors">
                            Percobaan {group.attempts.length - index}
                          </Link>
                        </td>
                        <td className="py-2 pr-4 text-center text-sm text-slate-500">{Number(score.total_score).toFixed(1)}</td>
                        <td className="py-2 pr-4 text-center text-sm text-slate-500">{Number(score.percentage).toFixed(1)}%</td>
                        <td className="py-2 pr-4 text-center text-xs text-slate-400"></td>
                        <td className="py-2 text-right text-slate-400 text-xs">
                          {score.graded_at ? new Date(score.graded_at).toLocaleDateString('id-ID') : '-'}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {groupedScoreHistory.length > 0 && (
          <div className="mt-6 border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, groupedScoreHistory.length)} hingga {Math.min(currentPage * itemsPerPage, groupedScoreHistory.length)} dari {groupedScoreHistory.length} hasil ujian
            </p>
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages || 1}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  )
}
