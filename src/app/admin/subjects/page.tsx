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
        .select('*')
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
      alert('Failed to add subject')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Are you sure? This will hide materials associated with this subject.')) return
    
    setProcessingId(id)
    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id)

      if (error) throw error
      setSubjects(subjects.filter(s => s.id !== id))
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
          <h1 className="text-2xl font-bold text-slate-900">Subjects</h1>
          <p className="text-slate-500">Manage learning subjects per level</p>
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
                ? 'bg-purple-500 text-slate-900 shadow-lg'
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
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-slate-900 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Subject
          </button>
        </div>

        {isAddingString && (
          <form onSubmit={handleAddSubject} className="mb-6 p-4 bg-slate-50/50 rounded-xl border border-purple-500/30 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Folder className="w-5 h-5 text-purple-400" />
            </div>
            <input
              type="text"
              placeholder="Enter subject name..."
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
                    <div key={subject.id} className="group flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-purple-500/50 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                                <BookOpen className="w-5 h-5 text-slate-500 group-hover:text-purple-400" />
                            </div>
                            <span className="font-medium text-slate-900">{subject.name}</span>
                        </div>
                        <button
                            onClick={() => handleDeleteSubject(subject.id)}
                            disabled={processingId === subject.id}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            title="Hapus"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  )
}
