'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ClipboardList, Search, Calendar, ArrowRight, FileText, HelpCircle, CheckCircle } from 'lucide-react'
import { Exam } from '@/types'

interface ExamWithAttempt extends Exam {
  hasAttempted?: boolean
  score?: number
}

const getThemeVars = (level: string | null) => {
  switch (level) {
    case 'sd': return {
      titleHover: 'group-hover:text-orange-600',
      badge: 'bg-orange-100 text-orange-700 border-orange-200',
      cardHover: 'hover:border-orange-400',
      arrowHover: 'text-slate-500 group-hover:text-orange-500 group-hover:translate-x-1',
    }
    case 'smp': return {
      titleHover: 'group-hover:text-blue-600',
      badge: 'bg-blue-100 text-blue-700 border-blue-200',
      cardHover: 'hover:border-blue-400',
      arrowHover: 'text-slate-500 group-hover:text-blue-500 group-hover:translate-x-1',
    }
    case 'sma':
    default: return {
      titleHover: 'group-hover:text-emerald-600',
      badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      cardHover: 'hover:border-emerald-400',
      arrowHover: 'text-slate-500 group-hover:text-emerald-500 group-hover:translate-x-1',
    }
  }
}

export default function StudentExamsPage() {
  const supabase = createClient()
  const [exams, setExams] = useState<ExamWithAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [userLevel, setUserLevel] = useState<string | null>(null)

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user profile for education level
      const { data: profile } = await supabase
        .from('profiles')
        .select('education_level')
        .eq('id', user.id)
        .single()
      
      const level = profile?.education_level
      setUserLevel(level)

      // Fetch exams filtered by level
      let query = supabase
        .from('exams')
        .select('*, subjects!inner(id, name, levels!inner(slug))')
        .order('created_at', { ascending: false })

      if (level) {
         query = query.eq('subjects.levels.slug', level)
      }

      const { data: examsData, error: examsError } = await query

      if (examsError) throw examsError

      // Fetch user's attempts
      const { data: attempts, error: attemptsError } = await supabase
        .from('exam_attempts')
        .select('exam_id, score')
        .eq('user_id', user.id)

      if (attemptsError) throw attemptsError

      // Merge data
      const examsWithAttempts = (examsData || []).map(exam => {
        const attempt = attempts?.find(a => a.exam_id === exam.id)
        return {
          ...exam,
          hasAttempted: !!attempt,
          score: attempt?.score
        }
      })

      setExams(examsWithAttempts as any)
    } catch (error) {
      console.error('Error fetching exams:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredExams = exams.filter(e =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Latihan Soal</h1>
        <p className="text-slate-500">
            {userLevel ? `Latihan soal untuk ${userLevel === 'sd' ? 'Paket A' : userLevel === 'smp' ? 'Paket B' : userLevel === 'sma' ? 'Paket C' : userLevel.toUpperCase()}` : 'Kerjakan latihan soal dan pantau progress'}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          placeholder="Cari latihan soal..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Exams Grid */}
      {filteredExams.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <ClipboardList className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Belum ada latihan soal</h3>
          <p className="text-slate-500">
              {userLevel ? `Belum ada latihan untuk ${userLevel === 'sd' ? 'Paket A' : userLevel === 'smp' ? 'Paket B' : 'Paket C'}.` : 'Silakan cek kembali nanti.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExams.map((exam) => {
            const themeVars = getThemeVars(userLevel)
            return (
            <Link
              key={exam.id}
              href={`/student/exams/${exam.id}`}
              className={`group bg-white border border-slate-200 rounded-xl p-5 transition-all relative flex flex-col items-start ${themeVars.cardHover}`}
            >
              {exam.hasAttempted && (
                <div className="absolute top-4 right-4">
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-full border border-green-200">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-700 font-medium">
                      {exam.score !== null ? `${exam.score}%` : 'Selesai'}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex items-start justify-between w-full mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                    exam.type === 'pdf' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'
                  }`}>
                    {exam.type === 'pdf' ? (
                      <FileText className="w-6 h-6" />
                    ) : (
                      <HelpCircle className="w-6 h-6" />
                    )}
                  </div>
                  {exam.subject && (
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold mr-8 border ${themeVars.badge}`}>
                          {exam.subject.name}
                      </span>
                  )}
              </div>

              <h3 className={`font-semibold text-slate-900 mb-2 transition-colors pr-8 ${themeVars.titleHover}`}>
                {exam.title}
              </h3>
              
              {exam.description && (
                <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-1">{exam.description}</p>
              )}
              
              <div className="flex items-center justify-between w-full mt-auto pt-4 border-t border-slate-200/50">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase border ${
                    exam.type === 'pdf' 
                      ? 'bg-orange-50 text-orange-600 border-orange-200'
                      : 'bg-purple-50 text-purple-600 border-purple-200'
                  }`}>
                    {exam.type === 'pdf' ? 'Ujian PDF' : 'Latihan'}
                  </span>
                <ArrowRight className={`w-5 h-5 transition-all ${themeVars.arrowHover}`} />
              </div>
            </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
