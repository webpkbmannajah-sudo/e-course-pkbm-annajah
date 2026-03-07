'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ClipboardList, Plus, Trash2, Edit, Search, Calendar, FileText, HelpCircle, Award } from 'lucide-react'
import ConfirmModal from '@/components/ConfirmModal'
import { showToast } from '@/components/Toast'
import { Exam, Level } from '@/types'

export default function AdminExamsPage() {
  const supabase = createClient()
  const [exams, setExams] = useState<Exam[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [selectedLevelId, setSelectedLevelId] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; title: string; pdfUrl: string | null }>({
    isOpen: false,
    id: '',
    title: '',
    pdfUrl: null
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
      showToast('Gagal memuat paket', 'error')
    }
  }, [supabase])

  const fetchExams = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*, subject:subjects(name, level_id, level:levels(name)), material:materials(title)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setExams(data as unknown as Exam[] || [])
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

  const handleDelete = async () => {
    const { id, pdfUrl } = deleteModal
    if (!id) return

    setDeleting(id)
    try {
      // Delete PDF from storage if exists
      if (pdfUrl) {
        const fileName = pdfUrl.split('/').pop()
        if (fileName) {
          await supabase.storage.from('exams').remove([fileName])
        }
      }

      // Delete from database (cascades to questions and choices)
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', id)

      if (error) throw error

      setExams(prev => prev.filter(e => e.id !== id))
      setDeleteModal({ isOpen: false, id: '', title: '', pdfUrl: null })
      showToast('Ujian berhasil dihapus', 'success')
    } catch (error) {
      console.error('Error deleting exam:', error)
      showToast('Gagal menghapus ujian', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const filteredExams = exams.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesLevel = selectedLevelId === 'all' || e.subject?.level_id === selectedLevelId
    
    return matchesSearch && matchesLevel
  })

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
          <h1 className="text-2xl font-bold text-slate-900">Ujian</h1>
          <p className="text-slate-500">Kelola ujian dan latihan soal</p>
        </div>
        <Link
          href="/admin/exams/create"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors w-fit"
        >
          <Plus className="w-4 h-4" />
          Buat Ujian
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
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

      {/* Exams List */}
      {filteredExams.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <ClipboardList className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Ujian tidak ditemukan</h3>
          <p className="text-slate-500 mb-6">Buat ujian pertama Anda untuk memulai</p>
          <Link
            href="/admin/exams/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Buat Ujian
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-600 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    exam.type === 'pdf' ? 'bg-orange-500/20' : 'bg-purple-500/20'
                  }`}>
                    {exam.type === 'pdf' ? (
                      <FileText className="w-6 h-6 text-orange-400" />
                    ) : (
                      <HelpCircle className="w-6 h-6 text-purple-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{exam.title}</h3>
                    {exam.description && (
                      <p className="text-slate-500 text-sm mt-1 line-clamp-2">{exam.description}</p>
                    )}
                    <div className="flex flex-col gap-2 mt-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {exam.subject?.level?.name && (
                          <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                            {exam.subject.level.name}
                          </span>
                        )}
                        {exam.subject?.name && (
                          <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                            {exam.subject.name}
                          </span>
                        )}
                        {exam.material?.title && (
                          <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                            Materi: {exam.material.title}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          exam.type === 'pdf' 
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {exam.type === 'pdf' ? 'Ujian PDF' : 'Pilihan Ganda'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(exam.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/exams/${exam.id}/edit`}
                    className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                    title="Edit Ujian"
                  >
                    <Edit className="w-5 h-5" />
                  </Link>
                  {exam.type === 'questions' && (
                    <Link
                      href={`/admin/exams/${exam.id}/grading`}
                      className="p-2 text-slate-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                      title="Penilaian"
                    >
                      <Award className="w-5 h-5" />
                    </Link>
                  )}
                  <button
                    onClick={() => setDeleteModal({ isOpen: true, id: exam.id, title: exam.title, pdfUrl: exam.pdf_url })}
                    disabled={deleting === exam.id}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                    title="Hapus"
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
        onClose={() => setDeleteModal({ isOpen: false, id: '', title: '', pdfUrl: null })}
        onConfirm={handleDelete}
        title="Hapus Ujian?"
        message={
          <span>
            Apakah Anda yakin ingin menghapus ujian <strong className="font-semibold text-slate-900">&quot;{deleteModal.title}&quot;</strong>? 
            <br /><br />
            Tindakan ini tidak dapat dibatalkan. Hasil pengerjaan siswa untuk ujian ini juga akan terhapus.
          </span>
        }
        confirmText="Hapus Sekarang"
        variant="danger"
        loading={deleting !== null}
      />
    </div>
  )
}
