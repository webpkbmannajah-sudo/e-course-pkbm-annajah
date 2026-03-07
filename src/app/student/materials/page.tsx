'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Search, Calendar, ArrowRight, Image as ImageIcon, X, ChevronDown, Check } from 'lucide-react'
import { Material } from '@/types'
import { getStudentThemeVars, getLevelLabel } from '@/lib/levelColors'

export default function StudentMaterialsPage() {
  const supabase = createClient()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [userLevel, setUserLevel] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<Material | null>(null)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all')
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

  const uniqueSubjects = Array.from(new Map(
    materials
      .filter(m => m.subject)
      .map(m => [(m as any).subject.id, m.subject])
  ).values())

  const filteredSubjectsForDropdown = uniqueSubjects.filter((subject: any) => 
    subject.name.toLowerCase().includes(subjectSearchQuery.toLowerCase())
  )

  const selectedSubject = uniqueSubjects.find((s: any) => s.id === selectedSubjectId)

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesSubject = selectedSubjectId === 'all' || m.subject?.id === selectedSubjectId

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
              {selectedSubjectId === 'all' ? 'Semua Mata Pelajaran' : (selectedSubject as any)?.name}
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
                    setSelectedSubjectId('all')
                    setIsSubjectDropdownOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                    selectedSubjectId === 'all'
                      ? 'bg-emerald-50 text-emerald-700 font-medium'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Semua Mata Pelajaran
                  {selectedSubjectId === 'all' && <Check className="w-4 h-4 text-emerald-600" />}
                </button>
                {filteredSubjectsForDropdown.map((subject: any) => (
                  <button
                    key={subject.id}
                    onClick={() => {
                      setSelectedSubjectId(subject.id)
                      setIsSubjectDropdownOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                      selectedSubjectId === subject.id
                        ? 'bg-emerald-50 text-emerald-700 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{subject.name}</span>
                    {selectedSubjectId === subject.id && <Check className="w-4 h-4 text-emerald-600" />}
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
                
                {material.type === 'image' ? (
                     <button
                        onClick={() => setSelectedImage(material)}
                        className={`flex items-center gap-1 text-sm transition-colors ${themeVars.linkHover}`}
                     >
                         Lihat <ArrowRight className="w-4 h-4" />
                     </button>
                ) : (
                     <a href={material.file_url || '#'} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1 text-sm transition-colors ${themeVars.linkHover}`}>
                         Buka <ArrowRight className="w-4 h-4" />
                     </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-300">
              <h2 className="text-xl font-bold text-slate-900 pr-8">{selectedImage.title}</h2>
              <button 
                onClick={() => setSelectedImage(null)}
                className="p-2 hover:bg-white rounded-full text-slate-500 hover:text-slate-900 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={selectedImage.file_url || ''} 
                alt={selectedImage.title}
                className="max-w-full max-h-[60vh] object-contain rounded-lg"
              />
            </div>
             <div className="p-4 border-t border-slate-300 flex justify-end">
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-900 rounded-lg transition-colors"
                >
                  Tutup
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}
