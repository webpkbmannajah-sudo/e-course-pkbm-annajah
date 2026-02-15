'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Award, ArrowRight, ClipboardList, Search } from 'lucide-react'

interface ExamSummary {
  id: string
  title: string
  type: string
  created_at: string
  attempt_count: number
}

export default function GradingIndexPage() {
  const supabase = createClient()
  const [exams, setExams] = useState<ExamSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchExams = async () => {
      try {
        // Fetch question-based exams only
        const { data: examsData, error } = await supabase
          .from('exams')
          .select('id, title, type, created_at')
          .eq('type', 'questions')
          .order('created_at', { ascending: false })

        if (error) throw error

        // Fetch attempt counts
        const examsWithCounts = await Promise.all(
          (examsData || []).map(async (exam) => {
            const { count } = await supabase
              .from('exam_attempts')
              .select('*', { count: 'exact', head: true })
              .eq('exam_id', exam.id)

            return {
              ...exam,
              attempt_count: count || 0,
            }
          })
        )

        setExams(examsWithCounts)
      } catch (error) {
        console.error('Error fetching exams:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchExams()
  }, [supabase])

  const filteredExams = exams.filter(e =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
      <div>
        <h1 className="text-2xl font-bold text-white">Grading Center</h1>
        <p className="text-slate-400">Auto-grade and review exam results</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search exams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Exams Grid */}
      {filteredExams.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 text-center">
          <ClipboardList className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No exams to grade</h3>
          <p className="text-slate-400">Question-based exams will appear here</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredExams.map((exam) => (
            <Link
              key={exam.id}
              href={`/admin/exams/${exam.id}/grading`}
              className="group bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-purple-500/50 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Award className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                    {exam.title}
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">
                    {exam.attempt_count} attempt(s) • Created {new Date(exam.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
