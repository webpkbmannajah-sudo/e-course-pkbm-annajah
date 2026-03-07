'use client'

import { useState, useEffect, use, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, FileText, ClipboardList, CheckCircle, 
  Loader2, AlertCircle, Trophy, RefreshCw, Upload, X
} from 'lucide-react'
import ConfirmModal from '@/components/ConfirmModal'
import { showToast } from '@/components/Toast'
import { Exam, Question, Choice } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

interface ExamWithQuestions extends Exam {
  questions: (Question & { choices: Choice[] })[]
  subject?: any
  material?: any
}

interface ExistingAttempt {
  id: string
  answers: Record<string, string>
  score: number | null
  submitted_at: string
}

export default function TakeExamPage({ params }: PageProps) {
  const { id } = use(params)
  const supabase = createClient()
  const router = useRouter()
  const [exam, setExam] = useState<ExamWithQuestions | null>(null)
  const [existingAttempt, setExistingAttempt] = useState<ExistingAttempt | null>(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  
  const [answerFile, setAnswerFile] = useState<File | null>(null)
  const [uploadingAnswer, setUploadingAnswer] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  
  // Modals state
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showRetakeModal, setShowRetakeModal] = useState(false)
  const [unansweredCount, setUnansweredCount] = useState(0)

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
  
        // Fetch exam with questions
        const { data: examData, error: examError } = await supabase
          .from('exams')
          .select(`
            *,
            subject:subjects(name, level_id, level:levels(name)),
            material:materials(title),
            questions (
              *,
              choices (*)
            )
          `)
          .eq('id', id)
          .single()
  
        if (examError) throw examError
  
        // Sort questions by order_number
        if (examData.questions) {
          examData.questions.sort((a: Question, b: Question) => a.order_number - b.order_number)
        }
  
        setExam(examData)
  
        // Check for existing attempt
        const { data: attempt } = await supabase
          .from('exam_attempts')
          .select('*')
          .eq('exam_id', id)
          .eq('user_id', user.id)
          .single()
  
        if (attempt) {
          setExistingAttempt(attempt)
          setAnswers(attempt.answers || {})
          setSubmitted(true)
          setScore(attempt.score)
        }
      } catch (error) {
        console.error('Error fetching exam:', error)
      } finally {
        setLoading(false)
      }
    }

    // Load answers from localStorage
    const saved = localStorage.getItem(`exam_answers_${id}`)
    if (saved) {
      try {
        setAnswers(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse saved answers', e)
      }
    }
    fetchExam()
  }, [id, supabase])

  useEffect(() => {
    // Save answers to localStorage
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(`exam_answers_${id}`, JSON.stringify(answers))
    }
  }, [answers, id])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.size > 5 * 1024 * 1024) {
        showToast('Ukuran file maksimal 5MB', 'error')
        return
      }
      setAnswerFile(droppedFile)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.size > 5 * 1024 * 1024) {
        showToast('Ukuran file maksimal 5MB', 'error')
        return
      }
      setAnswerFile(selectedFile)
    }
  }

  const submitPdfExam = async () => {
    if (!exam || !answerFile) return
    setUploadingAnswer(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const formData = new FormData()
      formData.append('file', answerFile)
      
      const uploadRes = await fetch(`/api/exams/${exam.id}/upload-answer`, {
        method: 'POST',
        body: formData
      })
      
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Gagal mengunggah file')

      const { data: attempt, error } = await supabase
        .from('exam_attempts')
        .insert({
          user_id: user.id,
          exam_id: exam.id,
          answers: { file_url: uploadData.url, file_name: answerFile.name },
        })
        .select()
        .single()

      if (error) throw error

      setExistingAttempt(attempt as ExistingAttempt)
      setSubmitted(true)
      showToast('Jawaban berhasil dikirim', 'success')
      
    } catch (err) {
      console.error('Error submitting exam:', err)
      showToast(err instanceof Error ? err.message : 'Gagal mengirim ujian', 'error')
    } finally {
      setUploadingAnswer(false)
    }
  }

  const handleAnswerChange = (questionId: string, choiceId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: choiceId
    }))
  }

  const attemptSubmit = () => {
    if (!exam) return

    const unanswered = exam.questions?.filter(q => !answers[q.id])
    if (unanswered && unanswered.length > 0) {
      setUnansweredCount(unanswered.length)
      setShowSubmitModal(true)
      return
    }

    executeSubmit()
  }

  const executeSubmit = async () => {
    if (!exam) return
    setShowSubmitModal(false)
    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Insert attempt (without score — backend will calculate)
      const { data: attempt, error } = await supabase
        .from('exam_attempts')
        .insert({
          user_id: user.id,
          exam_id: exam.id,
          answers,
        })
        .select('id')
        .single()

      if (error) throw error

      // Auto-grade via backend API
      if (exam.type === 'questions' && attempt) {
        await fetch('/api/grading/auto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attemptId: attempt.id }),
        })
      }

      localStorage.removeItem(`exam_answers_${id}`)

      // Redirect to result page
      router.push(`/student/exams/${id}/result`)
    } catch (err) {
      console.error('Error submitting exam:', err)
      showToast('Gagal mengirim ujian', 'error')
      setSubmitting(false)
    }
  }

  const handleRetake = async () => {
    if (!existingAttempt) return
    
    setShowRetakeModal(false)
    try {
      const { error } = await supabase
        .from('exam_attempts')
        .delete()
        .eq('id', existingAttempt.id)

      if (error) throw error

      setExistingAttempt(null)
      setAnswers({})
      setSubmitted(false)
      setScore(null)
      localStorage.removeItem(`exam_answers_${id}`)
    } catch (err) {
      console.error('Error deleting attempt:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="text-center py-12">
        <ClipboardList className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">Ujian tidak ditemukan</h3>
        <Link href="/student/exams" className="text-emerald-400 hover:text-emerald-300">
          ← Kembali ke daftar ujian
        </Link>
      </div>
    )
  }

  // Determine level color class based on package name
  let levelColorClass = "bg-slate-100 text-slate-600 border-slate-200"
  const levelNameTemp = exam.subject?.level?.name?.toLowerCase() || ""
  if (levelNameTemp.includes('paket a')) {
    levelColorClass = "bg-red-50 text-red-600 border-red-200"
  } else if (levelNameTemp.includes('paket b')) {
    levelColorClass = "bg-emerald-50 text-emerald-600 border-emerald-200"
  } else if (levelNameTemp.includes('paket c')) {
    levelColorClass = "bg-yellow-50 text-yellow-600 border-yellow-200"
  }

  // PDF Exam
  if (exam.type === 'pdf') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <Link
              href="/student/exams"
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors mt-1 shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{exam.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-3 mb-2">
                {exam.subject?.level?.name && (
                  <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${levelColorClass}`}>
                    {exam.subject.level.name}
                  </span>
                )}
                {exam.subject?.name && (
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                    {exam.subject.name}
                  </span>
                )}
                {exam.material?.title && (
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                    Materi: {exam.material.title}
                  </span>
                )}
              </div>
              {exam.description && (
                <p className="text-slate-500 mt-1">{exam.description}</p>
              )}
              {submitted && <span className="inline-block mt-2 px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">Terkirim</span>}
            </div>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="bg-slate-100 px-4 py-3 border-b border-slate-600 flex items-center gap-2 text-slate-500">
            <FileText className="w-5 h-5" />
            <span className="text-sm">File Soal Ujian</span>
          </div>
          <div className="aspect-[4/3] bg-slate-50">
            <iframe
              src={`${exam.pdf_url}#toolbar=0&navpanes=0`}
              className="w-full h-full"
              title={exam.title}
            />
          </div>
        </div>

        {/* Answer Upload Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Jawaban Ujian</h2>
          {submitted ? (
            <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
                <div>
                  <p className="text-emerald-900 font-medium">Jawaban telah dikirim</p>
                  <p className="text-emerald-700 text-sm">
                    {existingAttempt?.answers?.file_name || 'File jawaban tersimpan'}
                  </p>
                </div>
              </div>
              {existingAttempt?.answers?.file_url && (
                <a 
                  href={existingAttempt.answers.file_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-4 py-2 bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50 rounded-lg text-sm font-medium transition-colors"
                >
                  Lihat Jawaban
                </a>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div 
                onDragEnter={handleDrag} 
                onDragLeave={handleDrag} 
                onDragOver={handleDrag} 
                onDrop={handleDrop} 
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive ? 'border-emerald-500 bg-emerald-500/10' : answerFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-300 hover:border-slate-400'}`}
              >
                <input type="file" accept=".pdf,image/*" onChange={handleFileChange} className="hidden" id="answer-file-upload" />
                <label htmlFor="answer-file-upload" className="cursor-pointer block">
                  {answerFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="text-left py-2">
                        <p className="text-slate-900 font-medium truncate max-w-xs">{answerFile.name}</p>
                        <p className="text-slate-500 text-sm">{(answerFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button type="button" onClick={(e) => { e.preventDefault(); setAnswerFile(null) }} className="p-2 ml-4 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600">Seret & letakkan file jawaban (PDF/Gambar) di sini, atau <span className="text-emerald-500">pilih file</span></p>
                      <p className="text-slate-400 text-sm mt-1">Maksimal 5MB</p>
                    </>
                  )}
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={submitPdfExam}
                  disabled={!answerFile || uploadingAnswer}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {uploadingAnswer ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Mengunggah...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Kirim Jawaban
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Question-based Exam - Results
  if (submitted && exam.type === 'questions') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <Link
              href="/student/exams"
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors mt-1 shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{exam.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-3 mb-2">
                {exam.subject?.level?.name && (
                  <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${levelColorClass}`}>
                    {exam.subject.level.name}
                  </span>
                )}
                {exam.subject?.name && (
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                    {exam.subject.name}
                  </span>
                )}
                {exam.material?.title && (
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                    Materi: {exam.material.title}
                  </span>
                )}
              </div>
              <p className="text-slate-500 mt-1">Ujian selesai</p>
            </div>
          </div>
        </div>

        {/* Score Card */}
        <div className={`rounded-2xl p-8 text-center ${
          score !== null && score >= 70 
            ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30'
            : 'bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30'
        }`}>
          <Trophy className={`w-16 h-16 mx-auto mb-4 ${
            score !== null && score >= 70 ? 'text-emerald-400' : 'text-orange-400'
          }`} />
          <h2 className="text-lg text-slate-600 mb-2">Nilai Anda</h2>
          <p className={`text-5xl font-bold ${
            score !== null && score >= 70 ? 'text-emerald-400' : 'text-orange-400'
          }`}>
            {score}%
          </p>
          <p className="text-slate-500 mt-4">
            {score !== null && score >= 70 
              ? 'Bagus! Pertahankan prestasi Anda!' 
              : 'Terus belajar dan coba lagi!'}
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <Link
              href="/student/exams"
              className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 hover:text-slate-900 font-medium rounded-xl transition-colors"
            >
              Kembali ke Ujian
            </Link>
            <button
              onClick={() => setShowRetakeModal(true)}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Kerjakan Ulang
            </button>
          </div>
        </div>

        {/* Review Answers */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Tinjau Jawaban Anda</h3>
          {exam.questions?.map((question, index) => {
            const selectedChoiceId = answers[question.id]
            const correctChoice = question.choices.find(c => c.is_correct)
            const isCorrect = selectedChoiceId === correctChoice?.id

            return (
              <div key={question.id} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-start gap-3 mb-4">
                  <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {isCorrect ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  </span>
                  <p className="text-slate-900 font-medium">{index + 1}. {question.question_text}</p>
                </div>

                <div className="space-y-2 pl-11">
                  {question.choices.map((choice) => {
                    const isSelected = selectedChoiceId === choice.id
                    const isCorrectChoice = choice.is_correct

                    return (
                      <div
                        key={choice.id}
                        className={`px-4 py-2 rounded-lg border ${
                          isCorrectChoice
                            ? 'bg-green-500/10 border-green-500/50 text-green-400'
                            : isSelected
                            ? 'bg-red-500/10 border-red-500/50 text-red-400'
                            : 'border-slate-200 text-slate-500'
                        }`}
                      >
                        {choice.choice_text}
                        {isCorrectChoice && <span className="ml-2 text-xs">(Benar)</span>}
                        {isSelected && !isCorrectChoice && <span className="ml-2 text-xs">(Jawaban Anda)</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Retake Confirmation Modal */}
        <ConfirmModal
          isOpen={showRetakeModal}
          onClose={() => setShowRetakeModal(false)}
          onConfirm={handleRetake}
          title="Kerjakan Ulang Ujian?"
          message="Apakah Anda yakin ingin mengulang ujian ini? Nilai dan percobaan Anda sebelumnya akan diganti secara permanen."
          confirmText="Kerjakan Ulang"
          variant="danger"
        />
      </div>
    )
  }

  // Question-based Exam - Taking
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Link
              href="/student/exams"
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors mt-1 shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{exam.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-3 mb-2">
                {exam.subject?.level?.name && (
                  <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${levelColorClass}`}>
                    {exam.subject.level.name}
                  </span>
                )}
                {exam.subject?.name && (
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                    {exam.subject.name}
                  </span>
                )}
                {exam.material?.title && (
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                    Materi: {exam.material.title}
                  </span>
                )}
              </div>
              {exam.description && (
                <p className="text-slate-500 mt-1">{exam.description}</p>
              )}
            </div>
          </div>
          <div className="bg-slate-100 px-4 py-2 rounded-xl text-slate-700 font-medium shrink-0">
            {Object.keys(answers).length} / {exam.questions?.length || 0} dijawab
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {exam.questions?.map((question, index) => (
          <div key={question.id} className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-slate-900 font-medium mb-4">
              {index + 1}. {question.question_text}
            </p>

            <div className="space-y-2">
              {question.choices.map((choice, cIndex) => (
                <label
                  key={choice.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all border ${
                    answers[question.id] === choice.id
                      ? 'bg-emerald-500/10 border-emerald-500/50'
                      : 'border-slate-200 hover:border-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={choice.id}
                    checked={answers[question.id] === choice.id}
                    onChange={() => handleAnswerChange(question.id, choice.id)}
                    className="sr-only"
                  />
                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    answers[question.id] === choice.id
                      ? 'border-emerald-500 bg-emerald-500'
                      : 'border-slate-500'
                  }`}>
                    {answers[question.id] === choice.id && (
                      <CheckCircle className="w-4 h-4 text-slate-900" />
                    )}
                  </span>
                  <span className={`${
                    answers[question.id] === choice.id ? 'text-slate-900' : 'text-slate-600'
                  }`}>
                    {String.fromCharCode(65 + cIndex)}. {choice.choice_text}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="sticky bottom-6 bg-slate-50/95 backdrop-blur border border-slate-200 rounded-xl p-4 flex items-center justify-between">
        <p className="text-slate-500">
          {Object.keys(answers).length} dari {exam.questions?.length || 0} soal dijawab
        </p>
        <button
          onClick={attemptSubmit}
          disabled={submitting || Object.keys(answers).length === 0}
          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Mengirim...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Kirim Jawaban
            </>
          )}
        </button>
      </div>

      {/* Submit Confirmation Modal (Warning for unanswered) */}
      <ConfirmModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={executeSubmit}
        title="Ada Soal Kosong"
        message={
          <span>
            Anda masih memiliki <strong className="font-semibold text-slate-900">{unansweredCount}</strong> soal yang belum dijawab. 
            Yakin ingin mengirim jawaban sekarang?
          </span>
        }
        confirmText="Kirim Sekarang"
        variant="warning"
        loading={submitting}
      />
    </div>
  )
}
