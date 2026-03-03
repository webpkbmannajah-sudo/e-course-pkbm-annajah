'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Search, Plus, Trash2, Edit2, Check, X, Folder } from 'lucide-react'
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

  useEffect(() => {
    fetchLevels()
  }, [])

  useEffect(() => {
    if (selectedLevelId) {
      fetchSubjects(selectedLevelId)
    }
  }, [selectedLevelId])

  const fetchLevels = async () => {
    try {
      const { data, error } = await supabase
        .from('levels')
        .select('*')
        .order('name')
      
      if (error) throw error
      setLevels(data || [])
      if (data && data.length > 0) {
        setSelectedLevelId(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching levels:', error)
    }
  }

  const fetchSubjects = async (levelId: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*, materials:materials(count), exams:exams(count)')
        .eq('level_id', levelId)
        .order('name')

      if (error) throw error
      setSubjects(data || [])
    } catch (error) {
      console.error('Error fetching subjects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubjectName.trim() || !selectedLevelId) return

    setProcessingId('new')
    try {
      const { data, error } = await supabase
        .from('subjects')
        .insert([{
          name: newSubjectName.trim(),
          level_id: selectedLevelId
        }])
        .select()
        .single()

      if (error) throw error
      setSubjects([...subjects, data])
      setNewSubjectName('')
      setIsAddingString(false)
    } catch (error) {
      console.error('Error adding subject:', error)
      alert('Gagal menambahkan mata pelajaran')
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
    } catch (error) {
      console.error('Error updating subject:', error)
      alert('Gagal memperbarui mata pelajaran')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeleteSubject = async () => {
    const { id, name } = deleteModal
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
      setSubjects(subjects.filter(s => s.id !== id))
      setDeleteModal({ isOpen: false, id: '', name: '' })
    } catch (error) {
      console.error('Error deleting subject:', error)
      alert('Gagal menghapus mata pelajaran')
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
              <Folder className="w-5 h-5 text-purple-400" />
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
                <Check className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsAddingString(false)}
                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Batal"
              >
                <X className="w-5 h-5" />
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
                                <Check className="w-4 h-4" />
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
                                <X className="w-4 h-4" />
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
                                        <Edit2 className="w-4 h-4" />
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
                                  <Check className="w-3.5 h-3.5" />
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
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Hapus Mata Pelajaran?</h3>
              <p className="text-slate-500 leading-relaxed">
                Apakah Anda yakin ingin menghapus mata pelajaran <span className="font-semibold text-slate-900">"{deleteModal.name}"</span>? 
                <br /><br />
                Tindakan ini akan <span className="text-red-500 font-medium">menghapus seluruh materi dan ujian</span> yang terkait dengan mata pelajaran ini secara permanen.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, id: '', name: '' })}
                disabled={processingId !== null}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteSubject}
                disabled={processingId !== null}
                className="flex items-center gap-2 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 transition-all disabled:opacity-50"
              >
                {processingId === deleteModal.id ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
