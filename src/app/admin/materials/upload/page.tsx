'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, FileText, Loader2, ArrowLeft, Check } from 'lucide-react'
import Link from 'next/link'
import { Level, Subject } from '@/types'

export default function UploadMaterialPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [type, setType] = useState<'pdf' | 'image'>('pdf')
  
  const [levels, setLevels] = useState<Level[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedLevelId, setSelectedLevelId] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')

  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchLevels()
  }, [])

  useEffect(() => {
    if (selectedLevelId) {
      fetchSubjects(selectedLevelId)
    } else {
      setSubjects([])
      setSelectedSubjectId('')
    }
  }, [selectedLevelId])

  const fetchLevels = async () => {
    const { data } = await supabase.from('levels').select('*').order('name')
    if (data) setLevels(data as Level[])
  }

  const fetchSubjects = async (levelId: string) => {
    const { data } = await supabase.from('subjects').select('*').eq('level_id', levelId).order('name')
    if (data) setSubjects(data as Subject[])
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      const isValid = type === 'pdf' ? droppedFile.type === 'application/pdf' : droppedFile.type.startsWith('image/')
      if (isValid) {
        setFile(droppedFile)
        if (!formData.title) setFormData(prev => ({ ...prev, title: droppedFile.name.replace(/\.[^/.]+$/, "") }))
      } else {
        setError(`Please upload a valid ${type.toUpperCase()} file`)
      }
    }
  }, [formData.title])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      const isValid = type === 'pdf' ? selectedFile.type === 'application/pdf' : selectedFile.type.startsWith('image/')
      if (isValid) {
        setFile(selectedFile)
        if (!formData.title) setFormData(prev => ({ ...prev, title: selectedFile.name.replace(/\.[^/.]+$/, "") }))
      } else {
        setError(`Please upload a valid ${type.toUpperCase()} file`)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSubjectId) return setError('Please select a subject')
    if (!file) return setError('Please select a file')

    setError(null)
    setUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileExt = file.name.split('.').pop()
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('materials').upload(uniqueFileName, file)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('materials').getPublicUrl(uniqueFileName)

      const { error: dbError } = await supabase.from('materials').insert({
        title: formData.title,
        description: formData.description,
        file_url: publicUrl,
        file_name: file.name,
        uploaded_by: user.id,
        type: type,
        subject_id: selectedSubjectId
      })

      if (dbError) throw dbError
      setSuccess(true)
      setTimeout(() => router.push('/admin/materials'), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload material')
    } finally {
      setUploading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 text-center">
          <Check className="w-16 h-16 text-green-400 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-white mb-2">Material Created!</h2>
          <p className="text-slate-400">Redirecting to materials list...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/materials" className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Add Material</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-6">
        {error && <div className="bg-red-500/10 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Level</label>
                <select value={selectedLevelId} onChange={(e) => setSelectedLevelId(e.target.value)} className="w-full px-4 py-3 bg-slate-700 rounded-xl text-white" required>
                    <option value="">Select Level</option>
                    {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
                <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} className="w-full px-4 py-3 bg-slate-700 rounded-xl text-white" required disabled={!selectedLevelId}>
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
            <div className="flex bg-slate-700 p-1 rounded-xl gap-1">
                {['pdf', 'image'].map((t) => (
                    <button key={t} type="button" onClick={() => setType(t as 'pdf' | 'image')} 
                        className={`flex-1 py-2 rounded-lg capitalize ${type === t ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                        {t}
                    </button>
                ))}
            </div>
        </div>

        <div
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center ${dragActive ? 'border-purple-500 bg-purple-500/10' : 'border-slate-600'}`}
        >
            <input type="file" accept={type === 'pdf' ? '.pdf' : 'image/*'} onChange={handleFileChange} className="hidden" id="file-upload" />
            <label htmlFor="file-upload" className="cursor-pointer">
                {file ? <div className="text-white">{file.name}</div> : <div className="text-slate-400">Click or Drag {type.toUpperCase()} here</div>}
            </label>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required className="w-full px-4 py-3 bg-slate-700 rounded-xl text-white" />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-4 py-3 bg-slate-700 rounded-xl text-white" />
        </div>

        <button type="submit" disabled={uploading} className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl disabled:opacity-50">
            {uploading ? 'Creating...' : 'Create Material'}
        </button>
      </form>
    </div>
  )
}
