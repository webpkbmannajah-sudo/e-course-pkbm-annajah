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
        <h1 className="text-2xl font-bold text-white">Latihan Soal</h1>
        <p className="text-slate-400">
            {userLevel ? `Latihan soal untuk ${userLevel === 'sd' ? 'Paket A' : userLevel === 'smp' ? 'Paket B' : userLevel === 'sma' ? 'Paket C' : userLevel.toUpperCase()}` : 'Kerjakan latihan soal dan pantau progress'}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Cari latihan soal..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Exams Grid */}
      {filteredExams.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 text-center">
          <ClipboardList className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Belum ada latihan soal</h3>
          <p className="text-slate-400">
              {userLevel ? `Belum ada latihan untuk ${userLevel === 'sd' ? 'Paket A' : userLevel === 'smp' ? 'Paket B' : 'Paket C'}.` : 'Silakan cek kembali nanti.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExams.map((exam) => (
            <Link
              key={exam.id}
              href={`/student/exams/${exam.id}`}
              className="group bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-emerald-500/50 transition-all relative flex flex-col items-start"
            >
              {exam.hasAttempted && (
                <div className="absolute top-4 right-4">
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400 font-medium">
                      {exam.score !== null ? `${exam.score}%` : 'Selesai'}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex items-start justify-between w-full mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                    exam.type === 'pdf' ? 'bg-orange-500/20' : 'bg-purple-500/20'
                  }`}>
                    {exam.type === 'pdf' ? (
                      <FileText className="w-6 h-6 text-orange-400" />
                    ) : (
                      <HelpCircle className="w-6 h-6 text-purple-400" />
                    )}
                  </div>
                  {exam.subject && (
                      <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mr-8">
                          {exam.subject.name}
                      </span>
                  )}
              </div>

              <h3 className="font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors pr-8">
                {exam.title}
              </h3>
              
              {exam.description && (
                <p className="text-slate-400 text-sm line-clamp-2 mb-4 flex-1">{exam.description}</p>
              )}
              
              <div className="flex items-center justify-between w-full mt-auto pt-4 border-t border-slate-700/50">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${
                    exam.type === 'pdf' 
                      ? 'bg-orange-500/10 text-orange-400'
                      : 'bg-purple-500/10 text-purple-400'
                  }`}>
                    {exam.type === 'pdf' ? 'Ujian PDF' : 'Latihan'}
                  </span>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
