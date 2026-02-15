'use client'

import { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, CheckCircle, XCircle, Award, User
} from 'lucide-react'
import { ScoreBreakdownItem } from '@/types'

interface ScoreData {
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
  breakdown: ScoreBreakdownItem[]
  student_name?: string
  student_email?: string
}

interface PageProps {
  params: Promise<{ id: string; userId: string }>
}

export default function StudentReviewPage({ params }: PageProps) {
  const { id: examId, userId } = use(params)
  const supabase = createClient()
  const [score, setScore] = useState<ScoreData | null>(null)
  const [examTitle, setExamTitle] = useState('')
  const [studentName, setStudentName] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const { data: exam } = await supabase
        .from('exams')
        .select('title')
        .eq('id', examId)
        .single()

      if (exam) setExamTitle(exam.title)

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', userId)
        .single()

      if (profile) setStudentName(profile.name)

      const response = await fetch(`/api/scores/${examId}?userId=${userId}`)
      const data = await response.json()

      if (data.scores && data.scores.length > 0) {
        setScore(data.scores[0])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [examId, userId, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!score) {
    return (
      <div className="text-center py-12">
        <Award className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No score found</h3>
        <p className="text-slate-400 mb-4">This student hasn&apos;t been graded yet.</p>
        <Link
          href={`/admin/exams/${examId}/grading`}
          className="text-purple-400 hover:text-purple-300"
        >
          ← Back to grading
        </Link>
      </div>
    )
  }

  const correctCount = score.breakdown.filter(b => b.is_correct).length
  const totalQuestions = score.breakdown.length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href={`/admin/exams/${examId}/grading`}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors mt-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Answer Review</h1>
          <p className="text-slate-400 mt-1">{examTitle}</p>
        </div>
      </div>

      {/* Student Info & Score Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Student Info */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <User className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-white font-medium">{studentName}</p>
              <p className="text-slate-400 text-sm">
                Graded: {new Date(score.graded_at).toLocaleDateString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        {/* Score Card */}
        <div className={`rounded-xl p-5 text-center ${
          score.is_passed
            ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30'
            : 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30'
        }`}>
          <p className="text-sm text-slate-300 mb-1">Score</p>
          <p className={`text-4xl font-bold ${
            score.is_passed ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {score.percentage}%
          </p>
          <p className={`text-sm mt-1 ${
            score.is_passed ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {score.is_passed ? 'PASSED' : 'FAILED'}
          </p>
        </div>

        {/* Breakdown Summary */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <p className="text-sm text-slate-400 mb-3">Breakdown</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-300">Correct</span>
              <span className="text-emerald-400 font-medium">{correctCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Incorrect</span>
              <span className="text-red-400 font-medium">{totalQuestions - correctCount}</span>
            </div>
            <div className="flex justify-between border-t border-slate-700 pt-2">
              <span className="text-slate-300">Total</span>
              <span className="text-white font-medium">{totalQuestions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Weighted Score</span>
              <span className="text-white font-medium">{score.total_score}/{score.max_score}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Per-Question Review */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Question-by-Question Review</h2>

        {score.breakdown.map((item, index) => (
          <div
            key={item.question_id}
            className={`bg-slate-800 border rounded-xl p-5 ${
              item.is_correct ? 'border-emerald-500/30' : 'border-red-500/30'
            }`}
          >
            <div className="flex items-start gap-3 mb-4">
              <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                item.is_correct
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {item.is_correct
                  ? <CheckCircle className="w-5 h-5" />
                  : <XCircle className="w-5 h-5" />
                }
              </span>
              <div className="flex-1">
                <p className="text-white font-medium">
                  {index + 1}. {item.question_text}
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  Weight: {item.weight}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-11">
              {/* Student Answer */}
              <div className={`px-4 py-3 rounded-lg border ${
                item.is_correct
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <p className="text-xs text-slate-400 mb-1">Student&apos;s Answer</p>
                <p className={`font-medium ${
                  item.is_correct ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {item.selected_choice_text || '(No answer)'}
                </p>
              </div>

              {/* Correct Answer */}
              <div className="px-4 py-3 rounded-lg border bg-emerald-500/10 border-emerald-500/30">
                <p className="text-xs text-slate-400 mb-1">Correct Answer</p>
                <p className="font-medium text-emerald-400">
                  {item.correct_choice_text}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
