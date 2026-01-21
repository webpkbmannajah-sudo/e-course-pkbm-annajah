'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { FileText, Plus, Trash2, Eye, Search, Calendar } from 'lucide-react'
import { Material } from '@/types'

export default function AdminMaterialsPage() {
  const supabase = createClient()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

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

  const handleDelete = async (id: string, fileUrl: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return

    setDeleting(id)
    try {
      // Delete from storage
      const fileName = fileUrl.split('/').pop()
      if (fileName) {
        await supabase.storage.from('materials').remove([fileName])
      }

      // Delete from database
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id)

      if (error) throw error

      setMaterials(prev => prev.filter(m => m.id !== id))
    } catch (error) {
      console.error('Error deleting material:', error)
      alert('Failed to delete material')
    } finally {
      setDeleting(null)
    }
  }

  const filteredMaterials = materials.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.description?.toLowerCase().includes(searchQuery.toLowerCase())
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Materials</h1>
          <p className="text-slate-400">Manage your course materials</p>
        </div>
        <Link
          href="/admin/materials/upload"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors w-fit"
        >
          <Plus className="w-4 h-4" />
          Upload Material
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search materials..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Materials List */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 text-center">
          <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No materials yet</h3>
          <p className="text-slate-400 mb-6">Upload your first material to get started</p>
          <Link
            href="/admin/materials/upload"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Upload Material
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredMaterials.map((material) => (
            <div
              key={material.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{material.title}</h3>
                    {material.description && (
                      <p className="text-slate-400 text-sm mt-1 line-clamp-2">{material.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(material.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span>{material.file_name}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={material.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                    title="View PDF"
                  >
                    <Eye className="w-5 h-5" />
                  </a>
                  <button
                    onClick={() => handleDelete(material.id, material.file_url)}
                    disabled={deleting === material.id}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {deleting === material.id ? (
                      <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
