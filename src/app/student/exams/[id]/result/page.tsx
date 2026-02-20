'use client'

import { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, Trophy, CheckCircle, XCircle, Award
} from 'lucide-react'
import { ScoreBreakdownItem } from '@/types'

interface ScoreData {
  id: string
  total_score: number
  max_score: number
  percentage: number
  is_passed: boolean
  graded_at: string
  breakdown: ScoreBreakdownItem[]
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ExamResultPage({ params }: PageProps) {
  const { id: examId } = use(params)
  const supabase = createClient()
  const [examTitle, setExamTitle] = useState('')
  const [score, setScore] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchResult = useCallback(async () => {
    try {
      const { data: exam } = await supabase
        .from('exams')
        .select('title')
        .eq('id', examId)
        .single()

      if (exam) setExamTitle(exam.title)

      const response = await fetch(`/api/scores/${examId}`)
      const data = await response.json()

      if (data.scores && data.scores.length > 0) {
        setScore(data.scores[0])
      }
    } catch (error) {
      console.error('Error fetching result:', error)
    } finally {
      setLoading(false)
    }
  }, [examId, supabase])

  useEffect(() => {
    fetchResult()
  }, [fetchResult])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!score) {
    return (
      <div className="text-center py-12">
        <Award className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Results not available yet</h3>
        <p className="text-slate-400 mb-4">Your exam hasn&apos;t been graded yet. Please check back later.</p>
        <Link
          href="/student/exams"
          className="text-emerald-400 hover:text-emerald-300"
        >
          ← Back to exams
        </Link>
      </div>
    )
  }

  const correctCount = score.breakdown.filter(b => b.is_correct).length
  const totalQuestions = score.breakdown.length

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/student/exams"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors mt-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{examTitle}</h1>
          <p className="text-slate-400 mt-1">Exam Results</p>
        </div>
      </div>

      {/* Score Card */}
      <div className={`rounded-2xl p-8 text-center ${
        score.is_passed
          ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30'
          : 'bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30'
      }`}>
        <Trophy className={`w-16 h-16 mx-auto mb-4 ${
          score.is_passed ? 'text-emerald-400' : 'text-orange-400'
        }`} />
        <h2 className="text-lg text-slate-300 mb-2">Your Score</h2>
        <p className={`text-5xl font-bold ${
          score.is_passed ? 'text-emerald-400' : 'text-orange-400'
        }`}>
          {score.percentage}%
        </p>
        <p className={`text-sm mt-2 font-medium ${
          score.is_passed ? 'text-emerald-400' : 'text-orange-400'
        }`}>
          {score.is_passed ? '✓ PASSED' : '✗ FAILED'}
        </p>
        <div className="flex items-center justify-center gap-6 mt-4 text-slate-300 text-sm">
          <span>Correct: <strong className="text-emerald-400">{correctCount}</strong></span>
          <span>Incorrect: <strong className="text-red-400">{totalQuestions - correctCount}</strong></span>
          <span>Total: <strong className="text-white">{totalQuestions}</strong></span>
        </div>
        <p className="text-slate-500 text-xs mt-3">
          Nilai Aktual: {score.total_score}/{score.max_score} • Dinilai: {new Date(score.graded_at).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
          })}
        </p>
        <div className="flex gap-3 justify-center mt-6">
          <Link
            href="/student/exams"
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
          >
            Back to Exams
          </Link>
        </div>
      </div>

      {/* Answer Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Answer Review</h3>

        {score.breakdown.map((item, index) => (
          <div
            key={item.question_id}
            className="bg-slate-800 border border-slate-700 rounded-xl p-5"
          >
            <div className="flex items-start gap-3 mb-4">
              <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                item.is_correct
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {item.is_correct
                  ? <CheckCircle className="w-5 h-5" />
                  : <XCircle className="w-5 h-5" />
                }
              </span>
              <div className="flex-1">
                <p className="text-white font-medium">{index + 1}. {item.question_text}</p>
                {item.weight !== 1 && (
                  <p className="text-slate-500 text-xs mt-1">Weight: {item.weight} point(s)</p>
                )}
              </div>
            </div>

            <div className="space-y-2 pl-11">
              {/* Student's answer */}
              {item.selected_choice_text ? (
                <div className={`px-4 py-2 rounded-lg border ${
                  item.is_correct
                    ? 'bg-green-500/10 border-green-500/50 text-green-400'
                    : 'bg-red-500/10 border-red-500/50 text-red-400'
                }`}>
                  {item.selected_choice_text}
                  <span className="ml-2 text-xs">
                    {item.is_correct ? '(Your answer ✓)' : '(Your answer)'}
                  </span>
                </div>
              ) : (
                <div className="px-4 py-2 rounded-lg border border-slate-700 text-slate-500">
                  No answer selected
                </div>
              )}

              {/* Correct answer (show only if student was wrong) */}
              {!item.is_correct && (
                <div className="px-4 py-2 rounded-lg border bg-green-500/10 border-green-500/50 text-green-400">
                  {item.correct_choice_text}
                  <span className="ml-2 text-xs">(Correct answer)</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
