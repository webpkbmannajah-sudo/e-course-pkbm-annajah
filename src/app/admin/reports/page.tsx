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
import {
  BarChart3,
  Users,
  ClipboardList,
  Award,
  TrendingUp,
  FileSpreadsheet,
  Percent,
  Target,
} from 'lucide-react'
import Pagination from '@/components/Pagination'
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
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<PlatformOverview | null>(null)
  const [examStats, setExamStats] = useState<ExamStat[]>([])
  const [topStudents, setTopStudents] = useState<TopStudent[]>([])
  const [examFilter, setExamFilter] = useState<'all' | 'has_attempts'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'avg_score' | 'pass_rate'>('avg_score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  // Pagination states
  const [examsCurrentPage, setExamsCurrentPage] = useState(1)
  const [examsTotalPages, setExamsTotalPages] = useState(1)
  const [examsTotal, setExamsTotal] = useState(0)
  
  const [studentsCurrentPage, setStudentsCurrentPage] = useState(1)
  const [studentsTotalPages, setStudentsTotalPages] = useState(1)
  const [studentsTotal, setStudentsTotal] = useState(0)

  const itemsPerPage = 8

  // Initial Data Fetch (Overview & Initial Pages)
  const fetchInitialData = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics/stats')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()

      setOverview(data.overview)
      
      // We still use these initial values to prevent blank states, but we'll fetch actual paginated data right after
    } catch (error) {
      console.error('Failed to fetch analytics overview:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch paginated exam stats
  const fetchExamStats = useCallback(async () => {
    try {
      const url = new URL('/api/analytics/stats', window.location.origin)
      url.searchParams.set('type', 'exam_stats')
      url.searchParams.set('page', examsCurrentPage.toString())
      url.searchParams.set('limit', itemsPerPage.toString())
      if (examFilter === 'has_attempts') {
        url.searchParams.set('has_attempts', 'true')
      }

      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch exam stats')
      const data = await res.json()

      setExamStats(data.data || [])
      setExamsTotal(data.total || 0)
      setExamsTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error('Failed to fetch paginated exam stats:', error)
    }
  }, [examsCurrentPage, examFilter])

  // Fetch paginated top students
  const fetchTopStudents = useCallback(async () => {
    try {
      const url = new URL('/api/analytics/stats', window.location.origin)
      url.searchParams.set('type', 'top_students')
      url.searchParams.set('page', studentsCurrentPage.toString())
      url.searchParams.set('limit', itemsPerPage.toString())

      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch top students')
      const data = await res.json()

      setTopStudents(data.data || [])
      setStudentsTotal(data.total || 0)
      setStudentsTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error('Failed to fetch paginated top students:', error)
    }
  }, [studentsCurrentPage])

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  useEffect(() => {
    fetchExamStats()
  }, [fetchExamStats])

  useEffect(() => {
    fetchTopStudents()
  }, [fetchTopStudents])

  useEffect(() => {
    // Reset page when filter changes
    setExamsCurrentPage(1)
  }, [examFilter])

  // Client-side filtering is reduced as it's now mainly handled via API parameters
  const filteredExams = examStats 

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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Siswa', value: overview?.total_students || 0, icon: Users, color: 'from-blue-500 to-cyan-500' },
          { label: 'Total Ujian', value: overview?.total_exams || 0, icon: ClipboardList, color: 'from-purple-500 to-pink-500' },
          { label: 'Total Percobaan', value: overview?.total_attempts || 0, icon: ClipboardList, color: 'from-amber-500 to-orange-500' },
          { label: 'Sudah Dinilai', value: overview?.total_graded || 0, icon: Award, color: 'from-emerald-500 to-teal-500' },
          { label: 'Rata-rata Skor', value: formatPercentage(overview?.avg_platform_score ?? null), icon: Target, color: 'from-indigo-500 to-violet-500' },
          { label: 'Tingkat Kelulusan', value: formatPercentage(overview?.overall_pass_rate ?? null), icon: Percent, color: 'from-rose-500 to-pink-500' },
        ].map((card) => (
          <div key={card.label} className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <card.icon className="w-4 h-4 text-white" />
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
              className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg px-3 py-1.5 focus:ring-purple-500 focus:border-purple-500 outline-none"
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
                        className="text-sm text-purple-600 hover:text-purple-500 transition-colors inline-block"
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
        
        {examsTotal > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Menampilkan {Math.min((examsCurrentPage - 1) * itemsPerPage + 1, examsTotal)} hingga {Math.min(examsCurrentPage * itemsPerPage, examsTotal)} dari {examsTotal} ujian
            </p>
            <Pagination 
              currentPage={examsCurrentPage}
              totalPages={examsTotalPages}
              onPageChange={setExamsCurrentPage}
            />
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
                {topStudents.map((student, i) => {
                  const globalIndex = (studentsCurrentPage - 1) * itemsPerPage + i;
                  return (
                  <tr key={student.user_id} className="border-b border-slate-200/50 hover:bg-slate-200/30 transition-colors">
                    <td className="py-3 pr-4">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        globalIndex === 0 ? 'bg-amber-100 text-amber-600 border border-amber-200' :
                        globalIndex === 1 ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                        globalIndex === 2 ? 'bg-orange-100 text-orange-600 border border-orange-200' :
                        'bg-slate-50 text-slate-500 border border-slate-200'
                      }`}>
                        {globalIndex + 1}
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
                );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* --- STUDENT PAGINATION START --- */}
        {studentsTotal > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Menampilkan {Math.min((studentsCurrentPage - 1) * itemsPerPage + 1, studentsTotal)} hingga {Math.min(studentsCurrentPage * itemsPerPage, studentsTotal)} dari {studentsTotal} siswa
            </p>
            <Pagination 
              currentPage={studentsCurrentPage}
              totalPages={studentsTotalPages}
              onPageChange={setStudentsCurrentPage}
            />
          </div>
        )}
        {/* --- STUDENT PAGINATION END --- */}
      </div>
    </div>
  )
}
