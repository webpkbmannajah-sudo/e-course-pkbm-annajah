'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Plus, Trash2, Edit, Search, Users, CheckCircle, GraduationCap } from 'lucide-react'
import ConfirmModal from '@/components/ConfirmModal'
import { showToast } from '@/components/Toast'
import { Level, Subject } from '@/types'

export default function AdminSubjectsPage() {
  const supabase = createClient()
  const [levels, setLevels] = useState<Level[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedLevelId, setSelectedLevelId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddingString, setIsAddingString] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  })

  const fetchLevels = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('levels')
        .select('*')
        .order('name')
      
      if (error) throw error
      setLevels(data || [])
      // The original code had a side effect here: if (data && data.length > 0) { setSelectedLevelId(data[0].id) }.
      // This side effect is now handled in the useEffect that calls fetchLevels.
    } catch (error) {
      console.error('Error fetching levels:', error)
      showToast('Gagal memuat tingkat', 'error')
    }
  }, [supabase])

  const fetchSubjects = useCallback(async (levelId: string) => {
    setLoading(true)
    try {
      let query = supabase
        .from('subjects')
        .select(`
          *,
          level:levels(name),
          materials(count),
          exams(count)
        `)
        .order('name')

      if (levelId !== 'all') {
        query = query.eq('level_id', levelId)
      }

      const { data, error } = await query
      if (error) throw error
      setSubjects(data || [])
    } catch (error) {
      console.error('Error fetching subjects:', error)
      showToast('Gagal memuat mata pelajaran', 'error')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchLevels().then(() => {
      // After fetching levels, if there are levels, set the first one as selected
      if (levels.length > 0 && !selectedLevelId) {
        setSelectedLevelId(levels[0].id);
      }
    });
  }, [fetchLevels, levels.length, selectedLevelId, levels]); // Added levels.length and selectedLevelId to dependencies

  useEffect(() => {
    if (selectedLevelId) {
      fetchSubjects(selectedLevelId)
    }
  }, [selectedLevelId, fetchSubjects])

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubjectName.trim() || !selectedLevelId) return

    setProcessingId('new')
    try {
      const { error } = await supabase
        .from('subjects')
        .insert([{
          name: newSubjectName.trim(),
          level_id: selectedLevelId !== 'all' ? selectedLevelId : levels[0]?.id
        }])
        .select()
        .single()

      if (error) throw error

      await fetchSubjects(selectedLevelId) // Re-fetch subjects to include the new one
      setNewSubjectName('')
      setIsAddingString(false)
      showToast('Berhasil menambahkan mata pelajaran', 'success')
    } catch (error) {
      console.error('Error adding subject:', error)
      showToast('Gagal menambahkan mata pelajaran', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleEditSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingName.trim() || !editingId) return

    setProcessingId(editingId)
    try {
      const { error } = await supabase
        .from('subjects')
        .update({ name: editingName.trim() })
        .eq('id', editingId)

      if (error) throw error
      
      setSubjects(subjects.map(s => 
        s.id === editingId ? { ...s, name: editingName.trim() } : s
      ))
      setEditingId(null)
      setEditingName('')
      showToast('Mata pelajaran berhasil diperbarui', 'success')
    } catch (error) {
      console.error('Error updating subject:', error)
      showToast('Gagal memperbarui mata pelajaran', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeleteSubject = async () => {
    const { id } = deleteModal
    if (!id) return
    
    setProcessingId(id)
    try {
      // 1. Delete associated exams
      await supabase
        .from('exams')
        .delete()
        .eq('subject_id', id)

      // 2. Delete associated materials
      await supabase
        .from('materials')
        .delete()
        .eq('subject_id', id)

      // 3. Delete the subject itself
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchSubjects(selectedLevelId) // Re-fetch subjects after deletion
      showToast('Mata pelajaran berhasil dihapus', 'success')
      setDeleteModal({ isOpen: false, id: '', name: '' })
    } catch (error) {
      console.error('Error deleting subject:', error)
      showToast('Gagal menghapus mata pelajaran', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const filteredSubjects = subjects.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mata Pelajaran</h1>
          <p className="text-slate-500">Kelola mata pelajaran per tingkat</p>
        </div>
      </div>

      {/* Level Tabs */}
      <div className="flex bg-white p-1 rounded-xl overflow-x-auto">
        {levels.map(level => (
          <button
            key={level.id}
            onClick={() => setSelectedLevelId(level.id)}
            className={`flex-1 min-w-[120px] px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              selectedLevelId === level.id
                ? 'bg-purple-500 text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {level.name}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cari mata pelajaran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={() => setIsAddingString(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Mata Pelajaran
          </button>
        </div>

        {isAddingString && (
          <form onSubmit={handleAddSubject} className="mb-6 p-4 bg-slate-50/50 rounded-xl border border-purple-500/30 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-purple-400" />
            </div>
            <input
              type="text"
              placeholder="Masukkan nama mata pelajaran..."
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              autoFocus
              className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={!newSubjectName.trim() || processingId === 'new'}
                className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsAddingString(false)}
                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Batal"
              >
                <Users className="w-5 h-5" />
              </button>
            </div>
          </form>
        )}

        {loading ? (
            <div className="flex items-center justify-center h-32">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        ) : filteredSubjects.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
                Mata pelajaran tidak ditemukan pada tingkat ini.
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSubjects.map(subject => (
                    <div key={subject.id} className="group flex flex-col p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-purple-500/50 transition-all">
                        {editingId === subject.id ? (
                          <form onSubmit={handleEditSubject} className="flex flex-col gap-3">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              autoFocus
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="submit"
                                disabled={!editingName.trim() || processingId === subject.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Simpan
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(null)
                                  setEditingName('')
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300"
                              >
                                <Users className="w-4 h-4" />
                                Batal
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                                        <BookOpen className="w-5 h-5 text-slate-500 group-hover:text-purple-400" />
                                    </div>
                                    <span className="font-medium text-slate-900">{subject.name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => {
                                          setEditingId(subject.id)
                                          setEditingName(subject.name)
                                        }}
                                        disabled={processingId === subject.id}
                                        className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg md:opacity-0 group-hover:opacity-100 transition-all"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteModal({ isOpen: true, id: subject.id, name: subject.name })}
                                        disabled={processingId === subject.id}
                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg md:opacity-0 group-hover:opacity-100 transition-all"
                                        title="Hapus"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                                <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-slate-100">
                                  <BookOpen className="w-3.5 h-3.5" />
                                  {subject.materials?.[0]?.count || 0} Materi
                                </div>
                                <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-slate-100">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  {subject.exams?.[0]?.count || 0} Ujian
                                </div>
                            </div>
                          </>
                        )}
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: '', name: '' })}
        onConfirm={handleDeleteSubject}
        title="Hapus Mata Pelajaran?"
        message={
          <span>
            Apakah Anda yakin ingin menghapus mata pelajaran <strong className="font-semibold text-slate-900">&quot;{deleteModal.name}&quot;</strong>? 
            <br /><br />
            Tindakan ini akan <span className="text-red-500 font-medium">menghapus seluruh materi dan ujian</span> yang terkait dengan mata pelajaran ini secara permanen.
          </span>
        }
        confirmText="Hapus Sekarang"
        variant="danger"
        loading={processingId === deleteModal.id}
      />
    </div>
  )
}
