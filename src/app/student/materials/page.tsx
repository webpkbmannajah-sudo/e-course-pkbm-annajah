'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { FileText, Search, Calendar, ArrowRight } from 'lucide-react'
import { Material } from '@/types'

export default function StudentMaterialsPage() {
  const supabase = createClient()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchMaterials()
  }, [])

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMaterials(data || [])
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
        <h1 className="text-2xl font-bold text-white">Learning Materials</h1>
        <p className="text-slate-400">Browse and study course materials</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search materials..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 text-center">
          <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No materials available</h3>
          <p className="text-slate-400">Check back later for new materials</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((material) => (
            <Link
              key={material.id}
              href={`/student/materials/${material.id}`}
              className="group bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-emerald-500/50 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                {material.title}
              </h3>
              {material.description && (
                <p className="text-slate-400 text-sm line-clamp-2 mb-4">{material.description}</p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(material.created_at).toLocaleDateString()}
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
