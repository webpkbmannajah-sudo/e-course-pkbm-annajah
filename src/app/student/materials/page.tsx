'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Search, Calendar, ArrowRight, Image as ImageIcon, X } from 'lucide-react'
import { Material } from '@/types'

export default function StudentMaterialsPage() {
  const supabase = createClient()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [userLevel, setUserLevel] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<Material | null>(null)

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
      setMaterials(data as any || [])
    } catch (error) {
      console.error('Error fetching materials:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMaterials = materials.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getLevelLabel = (level: string | null) => {
    switch (level) {
      case 'sd': return 'Paket A'
      case 'smp': return 'Paket B'
      case 'sma': return 'Paket C'
      default: return level?.toUpperCase() || ''
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-6 h-6 text-green-400" />
      default: return <FileText className="w-6 h-6 text-blue-400" />
    }
  }

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
        <h1 className="text-2xl font-bold text-white">Materi Pembelajaran</h1>
        <p className="text-slate-400">
            {userLevel ? `Materi untuk ${getLevelLabel(userLevel)}` : 'Jelajahi materi pelajaran'}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Cari materi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 text-center">
          <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Belum ada materi</h3>
          <p className="text-slate-400">
              {userLevel ? `Belum ada materi untuk ${getLevelLabel(userLevel)}.` : 'Silakan periksa kembali nanti.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((material) => (
            <div
              key={material.id}
              className="group bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-emerald-500/50 transition-all flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {getTypeIcon(material.type || 'pdf')}
                  </div>
                  {material.subject && (
                      <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {material.subject.name}
                      </span>
                  )}
              </div>
              
              <h3 className="font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                {material.title}
              </h3>
              
              {material.description && (
                <p className="text-slate-400 text-sm line-clamp-2 mb-4 flex-1">{material.description}</p>
              )}
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-700/50">
                <span className="text-xs text-slate-500 uppercase font-medium">
                    {material.type === 'image' ? 'Gambar' : 'PDF'}
                </span>
                
                {material.type === 'image' ? (
                     <button
                        onClick={() => setSelectedImage(material)}
                        className="flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                     >
                         Lihat <ArrowRight className="w-4 h-4" />
                     </button>
                ) : (
                     <a href={material.file_url || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
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
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white pr-8">{selectedImage.title}</h2>
              <button 
                onClick={() => setSelectedImage(null)}
                className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
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
             <div className="p-4 border-t border-slate-800 flex justify-end">
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
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
