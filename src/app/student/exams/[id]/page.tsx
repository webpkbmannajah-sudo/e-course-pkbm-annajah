'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, FileText, ClipboardList, CheckCircle, 
  Loader2, AlertCircle, Trophy, RefreshCw
} from 'lucide-react'
import { Exam, Question, Choice } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

interface ExamWithQuestions extends Exam {
  questions: (Question & { choices: Choice[] })[]
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
  const [exam, setExam] = useState<ExamWithQuestions | null>(null)
  const [existingAttempt, setExistingAttempt] = useState<ExistingAttempt | null>(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)

  useEffect(() => {
    fetchExam()
  }, [id])

  const fetchExam = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch exam with questions
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select(`
          *,
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

  const handleAnswerChange = (questionId: string, choiceId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: choiceId
    }))
  }

  const calculateScore = () => {
    if (!exam?.questions) return 0

    let correct = 0
    for (const question of exam.questions) {
      const selectedChoiceId = answers[question.id]
      if (selectedChoiceId) {
        const correctChoice = question.choices.find(c => c.is_correct)
        if (correctChoice && correctChoice.id === selectedChoiceId) {
          correct++
        }
      }
    }

    return Math.round((correct / exam.questions.length) * 100)
  }

  const handleSubmit = async () => {
    if (!exam) return

    const unanswered = exam.questions?.filter(q => !answers[q.id])
    if (unanswered && unanswered.length > 0) {
      if (!confirm(`You have ${unanswered.length} unanswered question(s). Submit anyway?`)) {
        return
      }
    }

    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const calculatedScore = exam.type === 'questions' ? calculateScore() : null

      const { error } = await supabase
        .from('exam_attempts')
        .insert({
          user_id: user.id,
          exam_id: exam.id,
          answers,
          score: calculatedScore,
        })

      if (error) throw error

      setScore(calculatedScore)
      setSubmitted(true)
    } catch (err) {
      console.error('Error submitting exam:', err)
      alert('Failed to submit exam')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRetake = async () => {
    if (!existingAttempt) return
    if (!confirm('Are you sure you want to retake this exam? Your previous score will be replaced.')) return

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
        <h3 className="text-lg font-medium text-white mb-2">Exam not found</h3>
        <Link href="/student/exams" className="text-emerald-400 hover:text-emerald-300">
          ← Back to exams
        </Link>
      </div>
    )
  }

  // PDF Exam
  if (exam.type === 'pdf') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Link
            href="/student/exams"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors mt-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{exam.title}</h1>
            {exam.description && (
              <p className="text-slate-400 mt-1">{exam.description}</p>
            )}
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="bg-slate-700/50 px-4 py-3 border-b border-slate-600 flex items-center gap-2 text-slate-400">
            <FileText className="w-5 h-5" />
            <span className="text-sm">Exam PDF</span>
          </div>
          <div className="aspect-[4/3] bg-slate-900">
            <iframe
              src={`${exam.pdf_url}#toolbar=0&navpanes=0`}
              className="w-full h-full"
              title={exam.title}
            />
          </div>
        </div>
      </div>
    )
  }

  // Question-based Exam - Results
  if (submitted && exam.type === 'questions') {
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
            <h1 className="text-2xl font-bold text-white">{exam.title}</h1>
            <p className="text-slate-400 mt-1">Exam completed</p>
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
          <h2 className="text-lg text-slate-300 mb-2">Your Score</h2>
          <p className={`text-5xl font-bold ${
            score !== null && score >= 70 ? 'text-emerald-400' : 'text-orange-400'
          }`}>
            {score}%
          </p>
          <p className="text-slate-400 mt-4">
            {score !== null && score >= 70 
              ? 'Great job! You passed the exam!' 
              : 'Keep studying and try again!'}
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <Link
              href="/student/exams"
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
            >
              Back to Exams
            </Link>
            <button
              onClick={handleRetake}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retake Exam
            </button>
          </div>
        </div>

        {/* Review Answers */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Review Your Answers</h3>
          {exam.questions?.map((question, index) => {
            const selectedChoiceId = answers[question.id]
            const correctChoice = question.choices.find(c => c.is_correct)
            const isCorrect = selectedChoiceId === correctChoice?.id

            return (
              <div key={question.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <div className="flex items-start gap-3 mb-4">
                  <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {isCorrect ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  </span>
                  <p className="text-white font-medium">{index + 1}. {question.question_text}</p>
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
                            : 'border-slate-700 text-slate-400'
                        }`}
                      >
                        {choice.choice_text}
                        {isCorrectChoice && <span className="ml-2 text-xs">(Correct)</span>}
                        {isSelected && !isCorrectChoice && <span className="ml-2 text-xs">(Your answer)</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Question-based Exam - Taking
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            href="/student/exams"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors mt-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{exam.title}</h1>
            {exam.description && (
              <p className="text-slate-400 mt-1">{exam.description}</p>
            )}
          </div>
        </div>
        <div className="bg-slate-800 px-4 py-2 rounded-xl text-slate-300">
          {Object.keys(answers).length} / {exam.questions?.length || 0} answered
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {exam.questions?.map((question, index) => (
          <div key={question.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <p className="text-white font-medium mb-4">
              {index + 1}. {question.question_text}
            </p>

            <div className="space-y-2">
              {question.choices.map((choice, cIndex) => (
                <label
                  key={choice.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all border ${
                    answers[question.id] === choice.id
                      ? 'bg-emerald-500/10 border-emerald-500/50'
                      : 'border-slate-700 hover:border-slate-600 hover:bg-slate-700/50'
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
                      <CheckCircle className="w-4 h-4 text-white" />
                    )}
                  </span>
                  <span className={`${
                    answers[question.id] === choice.id ? 'text-white' : 'text-slate-300'
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
      <div className="sticky bottom-6 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl p-4 flex items-center justify-between">
        <p className="text-slate-400">
          {Object.keys(answers).length} of {exam.questions?.length || 0} questions answered
        </p>
        <button
          onClick={handleSubmit}
          disabled={submitting || Object.keys(answers).length === 0}
          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Submit Exam
            </>
          )}
        </button>
      </div>
    </div>
  )
}
