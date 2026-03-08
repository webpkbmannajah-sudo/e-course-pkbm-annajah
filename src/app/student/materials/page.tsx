'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { FileText, Search, ArrowRight, Image as ImageIcon, ChevronDown, Check } from 'lucide-react'
import { Material } from '@/types'
import { getStudentThemeVars, getLevelLabel } from '@/lib/levelColors'

export default function StudentMaterialsPage() {
  const supabase = createClient()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [userLevel, setUserLevel] = useState<string | null>(null)

  const [subjects, setSubjects] = useState<string[]>([])
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>('all')
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false)
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSubjectDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('education_level')
        .eq('id', user.id)
        .single()
      
      const level = profile?.education_level
      setUserLevel(level)

      let query = supabase
        .from('materials')
        .select('*, subjects!inner(id, name, levels!inner(slug))')
        .order('created_at', { ascending: false })

      if (level) {
          query = query.eq('subjects.levels.slug', level)

          // Fetch subjects for this level
          const { data: subjectData, error: subjectError } = await supabase
            .from('subjects')
            .select('name, levels!inner(slug)')
            .eq('levels.slug', level)
            .order('name')

          if (!subjectError && subjectData) {
             const uniqueNames = Array.from(new Set(subjectData.map(s => s.name)))
             setSubjects(uniqueNames)
          }
      } else {
          // If no level, fetch all subjects
          const { data: subjectData } = await supabase.from('subjects').select('name').order('name')
          if (subjectData) {
             const uniqueNames = Array.from(new Set(subjectData.map(s => s.name)))
             setSubjects(uniqueNames)
          }
      }

      const { data, error } = await query

      if (error) throw error
      setMaterials(data as unknown as Material[] || [])
    } catch (error) {
      console.error('Error fetching materials:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSubjectsForDropdown = subjects.filter(name => 
    name.toLowerCase().includes(subjectSearchQuery.toLowerCase())
  )

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesSubject = selectedSubjectName === 'all' || m.subject?.name === selectedSubjectName

    return matchesSearch && matchesSubject
  })





  const getTypeIcon = (type: string, theme: Record<string, string>) => {
    switch (type) {
      case 'image': return <ImageIcon className={`w-6 h-6 ${theme.iconBase}`} />
      default: return <FileText className={`w-6 h-6 ${theme.iconBase}`} />
    }
  }

  const themeVars = getStudentThemeVars(userLevel)

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
        <h1 className="text-2xl font-bold text-slate-900">Materi Pembelajaran</h1>
        <p className="text-slate-500">
            {userLevel ? `Materi untuk ${getLevelLabel(userLevel)}` : 'Jelajahi materi pelajaran'}
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Cari materi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Custom Subject Dropdown */}
        <div className="relative min-w-[250px]" ref={dropdownRef}>
          <button
            onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
            className="w-full h-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 flex items-center justify-between hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
          >
            <span className="truncate">
              {selectedSubjectName === 'all' ? 'Semua Mata Pelajaran' : selectedSubjectName}
            </span>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isSubjectDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isSubjectDropdownOpen && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              <div className="p-2 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari mata pelajaran..."
                    value={subjectSearchQuery}
                    onChange={(e) => setSubjectSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-transparent rounded-lg text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                <button
                  onClick={() => {
                    setSelectedSubjectName('all')
                    setIsSubjectDropdownOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                    selectedSubjectName === 'all'
                      ? 'bg-emerald-50 text-emerald-700 font-medium'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Semua Mata Pelajaran
                  {selectedSubjectName === 'all' && <Check className="w-4 h-4 text-emerald-600" />}
                </button>
                {filteredSubjectsForDropdown.map((subjectName) => (
                  <button
                    key={subjectName}
                    onClick={() => {
                      setSelectedSubjectName(subjectName)
                      setIsSubjectDropdownOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                      selectedSubjectName === subjectName
                        ? 'bg-emerald-50 text-emerald-700 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{subjectName}</span>
                    {selectedSubjectName === subjectName && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>
                ))}
                {filteredSubjectsForDropdown.length === 0 && (
                  <div className="px-3 py-8 text-center text-sm text-slate-500">
                    Mata pelajaran tidak ditemukan
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Belum ada materi</h3>
          <p className="text-slate-500">
              {userLevel ? `Belum ada materi untuk ${getLevelLabel(userLevel)}.` : 'Silakan periksa kembali nanti.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((material) => (
            <div
              key={material.id}
              className={`group bg-white border border-slate-200 rounded-xl p-5 transition-all flex flex-col ${themeVars.cardHover}`}
            >
              <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {getTypeIcon(material.type || 'pdf', themeVars)}
                  </div>
                  {material.subject && (
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold border ${themeVars.badge}`}>
                          {material.subject.name}
                      </span>
                  )}
              </div>
              
              <h3 className={`font-semibold text-slate-900 mb-2 transition-colors ${themeVars.titleHover}`}>
                {material.title}
              </h3>
              
              {material.description && (
                <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-1">{material.description}</p>
              )}
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-200/50">
                <span className="text-xs text-slate-500 uppercase font-medium">
                    {material.type === 'image' ? 'Gambar' : 'PDF'}
                </span>
                
                <Link
                  href={`/student/materials/${material.id}`}
                  className={`flex items-center gap-1 text-sm transition-colors ${themeVars.linkHover}`}
                >
                  Lihat <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}


    </div>
  )
}
