'use client'

import { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, CheckCircle, XCircle, Award, User, FileText, Loader2, Save
} from 'lucide-react'
import { ScoreBreakdownItem } from '@/types'
import { showToast } from '@/components/Toast'

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
  answers?: { file_url?: string; file_name?: string } | Record<string, string>;
  is_graded?: boolean;
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
  const [isPdf, setIsPdf] = useState(false)
  
  // Manual Grading State
  const [manualScore, setManualScore] = useState<string>('')
  const [manualFeedback, setManualFeedback] = useState<string>('')
  const [submittingGrade, setSubmittingGrade] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const { data: exam } = await supabase
        .from('exams')
        .select('title, type')
        .eq('id', examId)
        .single()

      if (exam) {
        setExamTitle(exam.title)
        setIsPdf(exam.type === 'pdf')
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', userId)
        .single()

      if (profile) setStudentName(profile.name)

      const response = await fetch(`/api/scores/${examId}?userId=${userId}`)
      const data = await response.json()

      if (data.scores && data.scores.length > 0) {
        const scoreData = data.scores[0]
        setScore(scoreData)
        if (scoreData.is_graded !== false) {
          setManualScore(scoreData.total_score.toString())
          const manualItem = scoreData.breakdown?.find((b: ScoreBreakdownItem) => b.question_id === 'manual-grading')
          if (manualItem) {
            setManualFeedback(manualItem.selected_choice_text || '')
          }
        }
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

  const submitManualGrade = async () => {
    if (!score || !manualScore) return
    
    const numScore = parseInt(manualScore)
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      showToast('Nilai harus berupa angka 0 - 100', 'error')
      return
    }

    setSubmittingGrade(true)
    try {
      const res = await fetch('/api/grading/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attemptId: score.attempt_id,
          score: numScore,
          feedback: manualFeedback
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit grade')

      showToast('Nilai berhasil disimpan', 'success')
      await fetchData() // refresh data
    } catch (err) {
      console.error(err)
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan nilai', 'error')
    } finally {
      setSubmittingGrade(false)
    }
  }

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
        <h3 className="text-lg font-medium text-slate-900 mb-2">Nilai tidak ditemukan</h3>
        <p className="text-slate-500 mb-4">Siswa ini belum dinilai.</p>
        <Link
          href={`/admin/exams/${examId}/grading`}
          className="text-purple-400 hover:text-purple-300"
        >
          ← Kembali ke penilaian
        </Link>
      </div>
    )
  }

  const breakdownInfo = score.breakdown || []
  const correctCount = breakdownInfo.filter(b => b.is_correct).length
  const totalQuestions = breakdownInfo.length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href={`/admin/exams/${examId}/grading`}
          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-colors mt-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tinjauan Jawaban</h1>
          <p className="text-slate-500 mt-1">{examTitle}</p>
        </div>
      </div>

      {/* Student Info & Score Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Student Info */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <User className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-slate-900 font-medium">{studentName}</p>
              <p className="text-slate-500 text-sm">
                Di{score.is_graded === false ? 'kumpulkan' : 'nilai'}: {new Date(score.graded_at).toLocaleDateString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        {/* Score Card */}
        <div className={`rounded-xl p-5 text-center ${
          score.is_graded === false
            ? 'bg-slate-50 border border-slate-200'
            : score.is_passed
              ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30'
              : 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30'
        }`}>
          <p className="text-sm text-slate-600 mb-1">Nilai</p>
          <p className={`text-4xl font-bold ${
            score.is_graded === false ? 'text-slate-400' : score.is_passed ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {score.is_graded === false ? '-' : `${score.percentage}%`}
          </p>
          <p className={`text-sm mt-1 ${
            score.is_graded === false ? 'text-slate-400' : score.is_passed ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {score.is_graded === false ? 'BELUM DINILAI' : score.is_passed ? 'LULUS' : 'TIDAK LULUS'}
          </p>
        </div>

        {/* Breakdown Summary */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-sm text-slate-500 mb-3">Rincian</p>
          <div className="space-y-2">
            {!isPdf && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-600">Benar</span>
                  <span className="text-emerald-400 font-medium">{correctCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Salah</span>
                  <span className="text-red-400 font-medium">{totalQuestions - correctCount}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 mb-2">
                  <span className="text-slate-600">Total</span>
                  <span className="text-slate-900 font-medium">{totalQuestions}</span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span className="text-slate-600">Nilai Berbobot</span>
              {score.is_graded === false ? (
                 <span className="text-slate-400 font-medium">Belum dinilai</span>
               ) : (
                 <span className="text-slate-900 font-medium">{score.total_score}/{score.max_score}</span>
               )}
            </div>
          </div>
        </div>
      </div>

      {isPdf ? (
        <div className="space-y-6">
          {/* PDF Viewer */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600">
                <FileText className="w-5 h-5" />
                <span className="font-medium">File Jawaban Siswa</span>
              </div>
              {score.answers?.file_name && (
                <span className="text-sm text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                  {score.answers.file_name}
                </span>
              )}
            </div>
            
            {score.answers?.file_url ? (
               <div className="aspect-[4/3] bg-slate-50 relative">
                  <iframe
                    src={`${score.answers.file_url}#toolbar=0`}
                    className="w-full h-full border-0 absolute inset-0"
                    title="Jawaban PDF Siswa"
                  />
               </div>
            ) : (
              <div className="py-12 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">File jawaban tidak ditemukan</p>
              </div>
            )}
           
           {score.answers?.file_url && (
             <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
               <a 
                 href={score.answers.file_url} 
                 target="_blank" 
                 rel="noreferrer"
                 className="text-sm font-medium text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
               >
                 Buka di Tab Baru
               </a>
             </div>
           )}
          </div>

          {/* Grading Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Form Penilaian</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Total Nilai (0 - 100) <span className="text-red-500">*</span>
                </label>
                <div className="relative max-w-[200px]">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={manualScore}
                    onChange={(e) => setManualScore(e.target.value)}
                    className="w-full pl-5 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                    / 100
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Catatan / Deskripsi Penilaian
                </label>
                <textarea
                  value={manualFeedback}
                  onChange={(e) => setManualFeedback(e.target.value)}
                  rows={4}
                  className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="Tambahkan feedback untuk siswa secara opsional..."
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={submitManualGrade}
                  disabled={submittingGrade || !manualScore}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
                >
                  {submittingGrade ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Simpan Nilai
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Tinjauan Per Soal</h2>

          {score.breakdown.map((item, index) => (
            <div
              key={item.question_id}
              className={`bg-white border rounded-xl p-5 ${
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
                  <p className="text-slate-900 font-medium">
                    {index + 1}. {item.question_text}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    Bobot: {item.weight}
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
                  <p className="text-xs text-slate-500 mb-1">Jawaban Siswa</p>
                  <p className={`font-medium ${
                    item.is_correct ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {item.selected_choice_text || '(Tidak dijawab)'}
                  </p>
                </div>

                {/* Correct Answer */}
                <div className="px-4 py-3 rounded-lg border bg-emerald-500/10 border-emerald-500/30">
                  <p className="text-xs text-slate-500 mb-1">Jawaban Benar</p>
                  <p className="font-medium text-emerald-400">
                    {item.correct_choice_text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
