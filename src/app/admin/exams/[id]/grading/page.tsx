'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, Award, CheckCircle, XCircle, Loader2, 
  Users, TrendingUp, AlertCircle, Zap
} from 'lucide-react'
import ConfirmModal from '@/components/ConfirmModal'
import { showToast } from '@/components/Toast'

interface ScoreWithProfile {
  id: string
  attempt_id: string
  exam_id: string
  user_id: string
  total_score: number
  max_score: number
  percentage: number
  is_passed: boolean
  grading_type: string
  graded_at: string
  student_name: string
  student_email: string
  is_graded?: boolean
}

interface ExamInfo {
  id: string
  title: string
  type: string
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function GradingPage({ params }: PageProps) {
  const { id: examId } = use(params)
  const supabase = createClient()
  const [exam, setExam] = useState<ExamInfo | null>(null)
  const [scores, setScores] = useState<ScoreWithProfile[]>([])
  const [attemptCount, setAttemptCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [grading, setGrading] = useState(false)
  const [bulkGrading, setBulkGrading] = useState(false)
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all')
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'date'>('score')

  useEffect(() => {
    fetchData()
  }, [examId])

  const fetchData = async () => {
    try {
      // Fetch exam info
      const { data: examData } = await supabase
        .from('exams')
        .select('id, title, type')
        .eq('id', examId)
        .single()

      if (examData) setExam(examData)

      // Fetch attempt count
      const { count } = await supabase
        .from('exam_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('exam_id', examId)

      setAttemptCount(count || 0)

      // Fetch scores
      const response = await fetch(`/api/scores/${examId}`)
      const data = await response.json()
      if (data.scores) {
        setScores(data.scores)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkGrade = async () => {
    setShowBulkConfirm(false)
    setBulkGrading(true)
    try {
      const response = await fetch('/api/grading/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId }),
      })

      const data = await response.json()

      if (response.ok) {
        showToast(`Penilaian selesai! Dinilai: ${data.summary.graded}, Gagal: ${data.summary.failed}`, 'success')
        await fetchData() // Refresh scores
      } else {
        showToast(data.error || 'Gagal menilai')
      }
    } catch (error) {
      console.error('Bulk grade error:', error)
      showToast('Gagal menilai ujian')
    } finally {
      setBulkGrading(false)
    }
  }

  const handleSingleGrade = async (attemptId: string) => {
    setGrading(true)
    try {
      const response = await fetch('/api/grading/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId }),
      })

      if (response.ok) {
        await fetchData()
        showToast('Berhasil menilai ulang', 'success')
      } else {
        const data = await response.json()
        showToast(data.error || 'Gagal menilai')
      }
    } catch (error) {
      console.error('Single grade error:', error)
      showToast('Gagal menilai ujian')
    } finally {
      setGrading(false)
    }
  }

  // Filter & sort
  const filteredScores = scores
    .filter(s => {
      if (filter === 'passed') return s.is_passed
      if (filter === 'failed') return !s.is_passed
      return true
    })
    .sort((a, b) => {
      // Sort ungraded first
      if (a.is_graded === false && b.is_graded !== false) return -1
      if (a.is_graded !== false && b.is_graded === false) return 1
      
      if (sortBy === 'score') return b.percentage - a.percentage
      if (sortBy === 'name') return a.student_name.localeCompare(b.student_name)
      return new Date(b.graded_at).getTime() - new Date(a.graded_at).getTime()
    })

  // Stats (only for graded attempts)
  const gradedScores = scores.filter(s => s.is_graded !== false)
  const avgScore = gradedScores.length > 0
    ? Math.round(gradedScores.reduce((sum, s) => sum + s.percentage, 0) / gradedScores.length)
    : 0
  const passedCount = gradedScores.filter(s => s.is_passed).length
  const failedCount = gradedScores.filter(s => !s.is_passed).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/admin/exams"
          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-colors mt-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Penilaian</h1>
          <p className="text-slate-500 mt-1">{exam?.title}</p>
        </div>
        {exam?.type !== 'pdf' && (
          <button
            onClick={() => setShowBulkConfirm(true)}
            disabled={bulkGrading || attemptCount === 0 || attemptCount === gradedScores.length}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
          >
            {bulkGrading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Menilai...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                 Nilai Semua ({attemptCount - gradedScores.length})
              </>
            )}
          </button>
        )}
      </div>

      {/* Kartu Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Percobaan</p>
              <p className="text-2xl font-bold text-slate-900">{attemptCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Rata-rata Nilai</p>
              <p className="text-2xl font-bold text-slate-900">{avgScore}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Lulus</p>
              <p className="text-2xl font-bold text-emerald-400">{passedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Tidak Lulus</p>
              <p className="text-2xl font-bold text-red-400">{failedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-white rounded-xl p-1 border border-slate-200">
          {([{key: 'all', label: 'Semua'}, {key: 'passed', label: 'Lulus'}, {key: 'failed', label: 'Tidak Lulus'}] as const).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as 'all' | 'passed' | 'failed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.key
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as 'score' | 'name' | 'date')}
          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="score">Urutkan berdasarkan Nilai</option>
          <option value="name">Urutkan berdasarkan Nama</option>
          <option value="date">Urutkan berdasarkan Tanggal</option>
        </select>
      </div>

      {/* Tabel Nilai */}
      {scores.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <Award className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Belum ada nilai</h3>
          <p className="text-slate-500 mb-6">
            {attemptCount > 0
              ? 'Klik "Nilai Semua" untuk menilai otomatis semua percobaan siswa'
              : 'Belum ada siswa yang mengerjakan ujian ini'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left px-5 py-4 text-sm font-semibold text-slate-600">Siswa</th>
                  <th className="text-center px-5 py-4 text-sm font-semibold text-slate-600">Nilai</th>
                  <th className="text-center px-5 py-4 text-sm font-semibold text-slate-600">Persentase</th>
                  <th className="text-center px-5 py-4 text-sm font-semibold text-slate-600">Status</th>
                  <th className="text-center px-5 py-4 text-sm font-semibold text-slate-600">Dinilai</th>
                  <th className="text-center px-5 py-4 text-sm font-semibold text-slate-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredScores.map(score => (
                  <tr key={score.id} className="border-b border-slate-200/50 hover:bg-slate-200/30 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-slate-900 font-medium">{score.student_name}</p>
                        <p className="text-slate-500 text-sm">{score.student_email}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {score.is_graded === false ? (
                        <span className="text-slate-400 font-medium">-</span>
                      ) : (
                        <span className="text-slate-900 font-mono">
                          {score.total_score}/{score.max_score}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {score.is_graded === false ? (
                        <span className="text-slate-400 font-medium">-</span>
                      ) : (
                        <span className={`text-lg font-bold ${
                          score.percentage >= 80 ? 'text-emerald-400' :
                          score.percentage >= 75 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {score.percentage}%
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {score.is_graded === false ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/20 text-amber-500 rounded-full text-xs font-medium">
                          Belum Dinilai
                        </span>
                      ) : score.is_passed ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Lulus
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                          <XCircle className="w-3 h-3" />
                          Tidak Lulus
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center text-sm text-slate-500">
                      {new Date(score.graded_at).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/admin/exams/${examId}/grading/${score.user_id}`}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            score.is_graded === false
                              ? 'bg-amber-500/20 text-amber-600 hover:bg-amber-500/30'
                              : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                          }`}
                        >
                          {score.is_graded === false ? 'Beri Nilai' : 'Tinjau'}
                        </Link>
                        {exam?.type !== 'pdf' && score.is_graded !== false && (
                          <button
                            onClick={() => handleSingleGrade(score.attempt_id)}
                            disabled={grading}
                            className="px-3 py-1.5 text-sm bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-lg transition-colors disabled:opacity-50"
                          >
                             Nilai Ulang
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ungraded attempts notice */}
      {attemptCount > gradedScores.length && exam?.type !== 'pdf' && (
        <div className="flex items-center gap-3 px-5 py-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-amber-500 text-sm">
            <strong className="font-semibold">{attemptCount - gradedScores.length}</strong> percobaan belum dinilai.
            Klik &quot;Nilai Semua&quot; untuk menilainya.
          </p>
        </div>
      )}
      
      {attemptCount > gradedScores.length && exam?.type === 'pdf' && (
        <div className="flex items-center gap-3 px-5 py-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-amber-500 text-sm">
            <strong className="font-semibold">{attemptCount - gradedScores.length}</strong> ujian PDF menunggu dinilai.
            Pilih &quot;Beri Nilai&quot; pada tabel di atas untuk memeriksa file PDF siswa.
          </p>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showBulkConfirm}
        onClose={() => setShowBulkConfirm(false)}
        onConfirm={handleBulkGrade}
        title="Mulai Penilaian Otomatis?"
        message={`Anda akan otomatis menilai ${attemptCount - gradedScores.length} percobaan yang belum dinilai. Proses ini mungkin memakan waktu beberapa saat.`}
        confirmText="Nilai Semua"
        variant="info"
        loading={bulkGrading}
      />
    </div>
  )
}
