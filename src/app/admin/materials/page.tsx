'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { FileText, Plus, Trash2, Eye, Search, Calendar, Image as ImageIcon } from 'lucide-react'
import ConfirmModal from '@/components/ConfirmModal'
import { showToast } from '@/components/Toast'
import { Material, Level } from '@/types'
import { getLevelBadgeClass } from '@/lib/levelColors'

export default function AdminMaterialsPage() {
  const supabase = createClient()
  const [materials, setMaterials] = useState<Material[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [selectedLevelId, setSelectedLevelId] = useState<string>('all')
  const [subjects, setSubjects] = useState<string[]>([])
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; title: string; fileUrl: string | null }>({
    isOpen: false,
    id: '',
    title: '',
    fileUrl: null
  })

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
      showToast('Gagal memuat daftar paket', 'error')
    }
  }, [supabase])

  const fetchMaterials = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select(`
          *,
          subject:subjects(name, level_id, level:levels(name))
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMaterials(data as unknown as Material[] || [])
    } catch (error) {
      console.error('Error fetching materials:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const fetchSubjects = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('name')
        .order('name')
      
      if (error) throw error
      const uniqueNames = Array.from(new Set((data || []).map(s => s.name)))
      setSubjects(uniqueNames)
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }, [supabase])

  useEffect(() => {
    fetchLevels()
    fetchMaterials()
    fetchSubjects()
  }, [fetchLevels, fetchMaterials, fetchSubjects])

  const handleDelete = async () => {
    const { id, fileUrl } = deleteModal
    if (!id) return

    setDeleting(id)
    try {
      // Delete from storage if it's a file
      if (fileUrl) {
          const fileName = fileUrl.split('/').pop()
          if (fileName) {
            await supabase.storage.from('materials').remove([fileName])
          }
      }

      // Delete from database
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id)

      if (error) throw error

      setMaterials(prev => prev.filter(m => m.id !== id))
      setDeleteModal({ isOpen: false, id: '', title: '', fileUrl: null })
      showToast('Materi berhasil dihapus', 'success')
    } catch (error) {
      console.error('Error deleting material:', error)
      showToast('Gagal menghapus materi', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesLevel = selectedLevelId === 'all' || m.subject?.level_id === selectedLevelId
    
    const matchesSubject = selectedSubjectName === 'all' || m.subject?.name === selectedSubjectName
    
    return matchesSearch && matchesLevel && matchesSubject
  })

  const getTypeIcon = (type: string) => {
      switch (type) {
          case 'image': return <ImageIcon className="w-6 h-6 text-green-400" />
          default: return <FileText className="w-6 h-6 text-blue-400" />
      }
  }

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
          <h1 className="text-2xl font-bold text-slate-900">Materi</h1>
          <p className="text-slate-500">Kelola materi pelajaran</p>
        </div>
        <Link
          href="/admin/materials/upload"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors w-fit"
        >
          <Plus className="w-4 h-4" />
          Upload Materi
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Cari materi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <select
            value={selectedSubjectName}
            onChange={(e) => setSelectedSubjectName(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[200px]"
          >
            <option value="all">Semua Mata Pelajaran</option>
            {subjects.map((subjectName) => (
              <option key={subjectName} value={subjectName}>
                {subjectName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto">
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
      </div>

      {/* Materials List */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Materi tidak ditemukan</h3>
          <p className="text-slate-500 mb-6">Upload materi pertama Anda untuk memulai</p>
          <Link
            href="/admin/materials/upload"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Upload Materi
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredMaterials.map((material) => (
            <div
              key={material.id}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-600 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    {getTypeIcon(material.type || 'pdf')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{material.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        {(material as any).subject?.level?.name && (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getLevelBadgeClass((material as any).subject.level.name)}`}>
                                {(material as any).subject.level.name}
                            </span>
                        )}
                        {material.subject && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-600 border border-purple-200">
                                {material.subject.name}
                            </span>
                        )}
                        <span className="text-xs text-slate-500 uppercase">{material.type || 'pdf'}</span>
                    </div>
                    {material.description && (
                      <p className="text-slate-500 text-sm mt-2 line-clamp-2">{material.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(material.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {material.type === 'image' ? (
                      <a href={material.file_url || '#'} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-500 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors">
                          <Eye className="w-5 h-5" />
                      </a>
                  ) : (
                      <a href={material.file_url || '#'} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                          <Eye className="w-5 h-5" />
                      </a>
                  )}
                  
                  <button
                    onClick={() => setDeleteModal({ isOpen: true, id: material.id, title: material.title, fileUrl: material.file_url })}
                    disabled={deleting === material.id}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: '', title: '', fileUrl: null })}
        onConfirm={handleDelete}
        title="Hapus Materi?"
        message={
          <span>
            Apakah Anda yakin ingin menghapus materi <strong className="font-semibold text-slate-900">&quot;{deleteModal.title}&quot;</strong>? 
            <br /><br />
            File materi yang diunggah (jika ada) juga akan dihapus. Tindakan ini tidak dapat dibatalkan.
          </span>
        }
        confirmText="Hapus Sekarang"
        variant="danger"
        loading={deleting === deleteModal.id}
      />
    </div>
  )
}
