'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Award, ArrowRight, ClipboardList, Search, ChevronDown, Check } from 'lucide-react'
import { Level, Subject } from '@/types'
import { showToast } from '@/components/Toast'

interface ExamSummary {
  id: string
  title: string
  type: string
  category?: string
  created_at: string
  attempt_count: number
  subject?: {
    name: string
    level_id: string
    level?: {
      name: string
    }
  }
}

export default function GradingIndexPage() {
  const supabase = createClient()
  const [exams, setExams] = useState<ExamSummary[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedLevelId, setSelectedLevelId] = useState<string>('all')
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>('all')
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false)
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('')

  const fetchLevels = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('levels')
        .select('*')
        .order('name')
      
      if (error) throw error
      setLevels(data || [])
    } catch (error) {
      console.error('Error fetching levels:', error)
      showToast('Gagal memuat paket', 'error')
    }
  }, [supabase])

  const fetchSubjects = useCallback(async (levelId: string) => {
    try {
      let query = supabase.from('subjects').select('id, name').order('name')
      if (levelId !== 'all') {
        query = query.eq('level_id', levelId)
      }
      const { data, error } = await query
      if (error) throw error
      
      const uniqueSubjects: Subject[] = []
      const seenNames = new Set()
      
      if (data) {
        data.forEach(subject => {
          const lowerName = subject.name.toLowerCase()
          if (!seenNames.has(lowerName)) {
            seenNames.add(lowerName)
            uniqueSubjects.push(subject as Subject)
          }
        })
      }
      
      setSubjects(uniqueSubjects)
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }, [supabase])

  const fetchExams = useCallback(async () => {
    try {
      // Fetch question-based exams only
      const { data: examsData, error } = await supabase
        .from('exams')
        .select('id, title, type, category, created_at, subject:subjects(name, level_id, level:levels(name))')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch attempt counts
      const examsWithCounts = await Promise.all(
        ((examsData as unknown as Omit<ExamSummary, 'attempt_count'>[]) || []).map(async (exam) => {
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
  }, [supabase])

  useEffect(() => {
    fetchLevels()
    fetchExams()
  }, [fetchLevels, fetchExams])

  useEffect(() => {
    fetchSubjects(selectedLevelId)
    setSelectedSubjectName('all')
  }, [selectedLevelId, fetchSubjects])

  const filteredExams = exams.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || e.category === selectedCategory
    const matchesLevel = selectedLevelId === 'all' || e.subject?.level_id === selectedLevelId
    const matchesSubject = selectedSubjectName === 'all' || e.subject?.name === selectedSubjectName
    return matchesSearch && matchesCategory && matchesLevel && matchesSubject
  })

  const filteredSubjectsList = subjects.filter(s => 
    s.name.toLowerCase().includes(subjectSearchQuery.toLowerCase())
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
        <h1 className="text-2xl font-bold text-slate-900">Pusat Penilaian</h1>
        <p className="text-slate-500">Nilai otomatis dan tinjau hasil ujian</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
            type="text"
            placeholder="Cari ujian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
        </div>

        {/* Category Filter */}
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto w-full">
            {['all', 'UAS', 'UTS', 'Remedial', 'Latihan Soal'].map((cat) => (
                <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex-1 min-w-[120px] px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedCategory === cat
                            ? 'bg-purple-500 text-white shadow-md'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                    {cat === 'all' ? 'Semua Kategori' : cat}
                </button>
            ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto flex-1">
            <button
              onClick={() => setSelectedLevelId('all')}
              className={`flex-1 min-w-[100px] px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedLevelId === 'all'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Semua Paket
            </button>
            {levels.map(level => (
              <button
                key={level.id}
                onClick={() => setSelectedLevelId(level.id)}
                className={`flex-1 min-w-[100px] px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedLevelId === level.id
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {level.name}
              </button>
            ))}
          </div>

          <div className="relative min-w-[200px] md:min-w-[250px] z-20">
            <button
              onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
            >
              <span className="truncate pr-4">
                {selectedSubjectName === 'all' 
                  ? 'Semua Mata Pelajaran' 
                  : selectedSubjectName}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isSubjectDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSubjectDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsSubjectDropdownOpen(false)}
                />
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-slate-100">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari mata pelajaran..."
                        value={subjectSearchQuery}
                        onChange={(e) => setSubjectSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto p-1">
                    <button
                      onClick={() => {
                        setSelectedSubjectName('all')
                        setIsSubjectDropdownOpen(false)
                        setSubjectSearchQuery('')
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                        selectedSubjectName === 'all'
                          ? 'bg-purple-50 text-purple-700 font-medium'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Semua Mata Pelajaran
                      {selectedSubjectName === 'all' && <Check className="w-4 h-4" />}
                    </button>
                    {filteredSubjectsList.map(subject => (
                      <button
                        key={subject.id}
                        onClick={() => {
                          setSelectedSubjectName(subject.name)
                          setIsSubjectDropdownOpen(false)
                          setSubjectSearchQuery('')
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors mt-1 ${
                          selectedSubjectName === subject.name
                            ? 'bg-purple-50 text-purple-700 font-medium'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{subject.name}</span>
                        {selectedSubjectName === subject.name && <Check className="w-4 h-4 shrink-0" />}
                      </button>
                    ))}
                    {filteredSubjectsList.length === 0 && (
                      <div className="px-3 py-4 text-sm text-slate-500 text-center">
                        Mata pelajaran tidak ditemukan
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Exams Grid */}
      {filteredExams.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <ClipboardList className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Tidak ada ujian untuk dinilai</h3>
          <p className="text-slate-500">Ujian berbasis pertanyaan dan PDF akan muncul di sini</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredExams.map((exam) => (
            <Link
              key={exam.id}
              href={`/admin/exams/${exam.id}/grading`}
              className="group bg-white border border-slate-200 rounded-xl p-5 hover:border-purple-500/50 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Award className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 group-hover:text-purple-400 transition-colors">
                      {exam.title}
                    </h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      exam.type === 'pdf' 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}>
                      {exam.type === 'pdf' ? 'PDF' : 'Pilihan Ganda'}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm mt-1">
                    {exam.attempt_count} percobaan • Dibuat {new Date(exam.created_at).toLocaleDateString('id-ID')}
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
