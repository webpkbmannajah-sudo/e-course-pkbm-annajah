'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, Award, CheckCircle, XCircle, Loader2,
  Users, TrendingUp, AlertCircle, Zap
} from 'lucide-react'

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
    if (!confirm('Grade all student attempts for this exam?')) return

    setBulkGrading(true)
    try {
      const response = await fetch('/api/grading/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Grading complete!\n• Graded: ${data.summary.graded}\n• Failed: ${data.summary.failed}`)
        await fetchData() // Refresh scores
      } else {
        alert(data.error || 'Failed to grade')
      }
    } catch (error) {
      console.error('Bulk grade error:', error)
      alert('Failed to grade exams')
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
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to grade')
      }
    } catch (error) {
      console.error('Single grade error:', error)
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
      if (sortBy === 'score') return b.percentage - a.percentage
      if (sortBy === 'name') return a.student_name.localeCompare(b.student_name)
      return new Date(b.graded_at).getTime() - new Date(a.graded_at).getTime()
    })

  // Stats
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + s.percentage, 0) / scores.length)
    : 0
  const passedCount = scores.filter(s => s.is_passed).length
  const failedCount = scores.filter(s => !s.is_passed).length

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
          <h1 className="text-2xl font-bold text-slate-900">Grading</h1>
          <p className="text-slate-500 mt-1">{exam?.title}</p>
        </div>
        <button
          onClick={handleBulkGrade}
          disabled={bulkGrading || attemptCount === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-slate-900 font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
        >
          {bulkGrading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Grading...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Grade All ({attemptCount})
            </>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Attempts</p>
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
              <p className="text-sm text-slate-500">Average Score</p>
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
              <p className="text-sm text-slate-500">Passed</p>
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
              <p className="text-sm text-slate-500">Failed</p>
              <p className="text-2xl font-bold text-red-400">{failedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-white rounded-xl p-1 border border-slate-200">
          {(['all', 'passed', 'failed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                filter === f
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as 'score' | 'name' | 'date')}
          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="score">Sort by Score</option>
          <option value="name">Sort by Name</option>
          <option value="date">Sort by Date</option>
        </select>
      </div>

      {/* Scores Table */}
      {scores.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <Award className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No scores yet</h3>
          <p className="text-slate-500 mb-6">
            {attemptCount > 0
              ? 'Click "Grade All" to auto-grade all student attempts'
              : 'No students have attempted this exam yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left px-5 py-4 text-sm font-semibold text-slate-600">Student</th>
                  <th className="text-center px-5 py-4 text-sm font-semibold text-slate-600">Score</th>
                  <th className="text-center px-5 py-4 text-sm font-semibold text-slate-600">Percentage</th>
                  <th className="text-center px-5 py-4 text-sm font-semibold text-slate-600">Status</th>
                  <th className="text-center px-5 py-4 text-sm font-semibold text-slate-600">Graded</th>
                  <th className="text-center px-5 py-4 text-sm font-semibold text-slate-600">Actions</th>
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
                      <span className="text-slate-900 font-mono">
                        {score.total_score}/{score.max_score}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-lg font-bold ${
                        score.percentage >= 80 ? 'text-emerald-400' :
                        score.percentage >= 60 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {score.percentage}%
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {score.is_passed ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                          <XCircle className="w-3 h-3" />
                          Failed
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
                          className="px-3 py-1.5 text-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors"
                        >
                          Review
                        </Link>
                        <button
                          onClick={() => handleSingleGrade(score.attempt_id)}
                          disabled={grading}
                          className="px-3 py-1.5 text-sm bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Re-grade
                        </button>
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
      {attemptCount > scores.length && (
        <div className="flex items-center gap-3 px-5 py-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-amber-300 text-sm">
            <strong>{attemptCount - scores.length}</strong> attempt(s) haven&apos;t been graded yet.
            Click &quot;Grade All&quot; to grade them.
          </p>
        </div>
      )}
    </div>
  )
}
