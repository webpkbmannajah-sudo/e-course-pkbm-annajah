'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ClipboardList, Plus, Trash2, Eye, Search, Calendar, FileText, HelpCircle } from 'lucide-react'
import { Exam } from '@/types'

export default function AdminExamsPage() {
  const supabase = createClient()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setExams(data || [])
    } catch (error) {
      console.error('Error fetching exams:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, pdfUrl: string | null) => {
    if (!confirm('Are you sure you want to delete this exam?')) return

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
    } catch (error) {
      console.error('Error deleting exam:', error)
      alert('Failed to delete exam')
    } finally {
      setDeleting(null)
    }
  }

  const filteredExams = exams.filter(e =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.description?.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-2xl font-bold text-white">Exams</h1>
          <p className="text-slate-400">Manage your course exams</p>
        </div>
        <Link
          href="/admin/exams/create"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors w-fit"
        >
          <Plus className="w-4 h-4" />
          Create Exam
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search exams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Exams List */}
      {filteredExams.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 text-center">
          <ClipboardList className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No exams yet</h3>
          <p className="text-slate-400 mb-6">Create your first exam to get started</p>
          <Link
            href="/admin/exams/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Exam
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-all"
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
                    <h3 className="font-semibold text-white">{exam.title}</h3>
                    {exam.description && (
                      <p className="text-slate-400 text-sm mt-1 line-clamp-2">{exam.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        exam.type === 'pdf' 
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {exam.type === 'pdf' ? 'PDF Exam' : 'Question-based'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(exam.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/exams/${exam.id}`}
                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                    title="View Exam"
                  >
                    <Eye className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(exam.id, exam.pdf_url)}
                    disabled={deleting === exam.id}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {deleting === exam.id ? (
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
