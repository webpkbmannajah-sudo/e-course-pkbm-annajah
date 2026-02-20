'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Upload, FileText, X, Loader2, ArrowLeft, Check, Plus, Trash2,
  HelpCircle, FileUp
} from 'lucide-react'
import Link from 'next/link'
import { ExamType, QuestionFormData, Level, Subject, Material } from '@/types'

export default function CreateExamPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [examType, setExamType] = useState<ExamType>('questions')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  })
  
  // Selection State
  const [levels, setLevels] = useState<Level[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  
  const [selectedLevelId, setSelectedLevelId] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedMaterialId, setSelectedMaterialId] = useState('')

  const [file, setFile] = useState<File | null>(null)
  const [questions, setQuestions] = useState<QuestionFormData[]>([
    { question_text: '', choices: [
      { choice_text: '', is_correct: true },
      { choice_text: '', is_correct: false },
      { choice_text: '', is_correct: false },
      { choice_text: '', is_correct: false },
    ]}
  ])
  const [dragActive, setDragActive] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Fetch Levels
  useEffect(() => {
    const fetchLevels = async () => {
      const { data } = await supabase.from('levels').select('*').order('name')
      if (data) setLevels(data)
    }
    fetchLevels()
  }, [])

  // Fetch Subjects
  useEffect(() => {
    if (selectedLevelId) {
      const fetchSubjects = async () => {
        const { data } = await supabase.from('subjects').select('*').eq('level_id', selectedLevelId).order('name')
        if (data) setSubjects(data)
      }
      fetchSubjects()
    } else {
      setSubjects([])
      setSelectedSubjectId('')
    }
  }, [selectedLevelId])

  // Fetch Materials
  useEffect(() => {
    if (selectedSubjectId) {
      const fetchMaterials = async () => {
        const { data } = await supabase.from('materials').select('*').eq('subject_id', selectedSubjectId).order('title')
        if (data) setMaterials(data as Material[])
      }
      fetchMaterials()
    } else {
      setMaterials([])
      setSelectedMaterialId('')
    }
  }, [selectedSubjectId])


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
      if (droppedFile.type === 'application/pdf') {
        if (droppedFile.size > 5 * 1024 * 1024) {
          setError('Ukuran file maksimal 5MB')
          return
        }
        setFile(droppedFile)
      } else {
        setError('Silakan unggah file PDF')
      }
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type === 'application/pdf') {
        if (selectedFile.size > 5 * 1024 * 1024) {
          setError('Ukuran file maksimal 5MB')
          return
        }
        setFile(selectedFile)
      } else {
        setError('Silakan unggah file PDF')
      }
    }
  }

  const addQuestion = () => {
    setQuestions(prev => [...prev, {
      question_text: '',
      choices: [
        { choice_text: '', is_correct: true },
        { choice_text: '', is_correct: false },
        { choice_text: '', is_correct: false },
        { choice_text: '', is_correct: false },
      ]
    }])
  }

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateQuestion = (index: number, text: string) => {
    setQuestions(prev => prev.map((q, i) => 
      i === index ? { ...q, question_text: text } : q
    ))
  }

  const updateChoice = (qIndex: number, cIndex: number, text: string) => {
    setQuestions(prev => prev.map((q, i) => 
      i === qIndex 
        ? { ...q, choices: q.choices.map((c, j) => 
            j === cIndex ? { ...c, choice_text: text } : c
          )}
        : q
    ))
  }

  const setCorrectAnswer = (qIndex: number, cIndex: number) => {
    setQuestions(prev => prev.map((q, i) => 
      i === qIndex 
        ? { ...q, choices: q.choices.map((c, j) => 
            ({ ...c, is_correct: j === cIndex })
          )}
        : q
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (examType === 'pdf' && !file) return setError('Silakan unggah file PDF')

    if (examType === 'questions') {
      for (let i = 0; i < questions.length; i++) {
        if (!questions[i].question_text.trim()) return setError(`Soal ${i + 1} masih kosong`)
        const hasCorrect = questions[i].choices.some(c => c.is_correct && c.choice_text.trim())
        if (!hasCorrect) return setError(`Soal ${i + 1} membutuhkan jawaban benar yang terisi`)
        const hasEmpty = questions[i].choices.some(c => !c.choice_text.trim())
        if (hasEmpty) return setError(`Soal ${i + 1} memiliki pilihan yang kosong`)
      }
    }

    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let pdfUrl = null

      if (examType === 'pdf' && file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('exams').upload(fileName, file)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('exams').getPublicUrl(fileName)
        pdfUrl = publicUrl
      }

      const { data: exam, error: examError } = await supabase
        .from('exams')
        .insert({
          title: formData.title,
          description: formData.description || null,
          type: examType,
          pdf_url: pdfUrl,
          created_by: user.id,
          subject_id: selectedSubjectId || null,
          material_id: selectedMaterialId || null
        })
        .select()
        .single()

      if (examError) throw examError

      if (examType === 'questions') {
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i]
          const { data: question, error: qError } = await supabase
            .from('questions')
            .insert({
              exam_id: exam.id,
              question_text: q.question_text,
              order_number: i + 1,
            })
            .select().single()

          if (qError) throw qError

          const choicesData = q.choices.map(c => ({
            question_id: question.id,
            choice_text: c.choice_text,
            is_correct: c.is_correct,
          }))

          const { error: cError } = await supabase.from('choices').insert(choicesData)
          if (cError) throw cError
        }
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/exams')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat ujian')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 text-center">
          <Check className="w-16 h-16 text-green-400 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-white mb-2">Ujian Berhasil Dibuat!</h2>
          <p className="text-slate-400">Mengalihkan ke daftar ujian...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/exams" className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Buat Ujian</h1>
          <p className="text-slate-400">Buat ujian baru untuk siswa</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="bg-red-500/10 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}

        {/* Level, Subject, Material Selection */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Jenjang (Opsional)</label>
                <select value={selectedLevelId} onChange={(e) => setSelectedLevelId(e.target.value)} className="w-full px-4 py-3 bg-slate-700/50 rounded-xl text-white">
                    <option value="">Pilih Jenjang</option>
                    {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Mata Pelajaran (Opsional)</label>
                <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} className="w-full px-4 py-3 bg-slate-700/50 rounded-xl text-white" disabled={!selectedLevelId}>
                    <option value="">Pilih Mata Pelajaran</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Materi (Opsional)</label>
                <select value={selectedMaterialId} onChange={(e) => setSelectedMaterialId(e.target.value)} className="w-full px-4 py-3 bg-slate-700/50 rounded-xl text-white" disabled={!selectedSubjectId}>
                    <option value="">Pilih Materi</option>
                    {materials.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
            </div>
        </div>

        {/* Exam Type Selection */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <label className="block text-sm font-medium text-slate-300 mb-3">Tipe Ujian</label>
          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={() => setExamType('questions')} className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${examType === 'questions' ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 hover:border-slate-600'}`}>
              <HelpCircle className={`w-8 h-8 ${examType === 'questions' ? 'text-purple-400' : 'text-slate-400'}`} />
              <div className="text-center"><p className={`font-medium ${examType === 'questions' ? 'text-white' : 'text-slate-300'}`}>Pilihan Ganda</p><p className="text-sm text-slate-500 mt-1">Soal pilihan ganda otomatis</p></div>
            </button>
            <button type="button" onClick={() => setExamType('pdf')} className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${examType === 'pdf' ? 'border-orange-500 bg-orange-500/10' : 'border-slate-700 hover:border-slate-600'}`}>
              <FileUp className={`w-8 h-8 ${examType === 'pdf' ? 'text-orange-400' : 'text-slate-400'}`} />
              <div className="text-center"><p className={`font-medium ${examType === 'pdf' ? 'text-white' : 'text-slate-300'}`}>Unggah PDF</p><p className="text-sm text-slate-500 mt-1">Unggah ujian sebagai PDF</p></div>
            </button>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
          <div><label className="block text-sm font-medium text-slate-300 mb-2">Judul Ujian</label><input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white" placeholder="Masukkan judul ujian" /></div>
          <div><label className="block text-sm font-medium text-slate-300 mb-2">Deskripsi</label><textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white" placeholder="Masukkan deskripsi ujian" /></div>
        </div>

        {/* Unggah PDF */}
        {examType === 'pdf' && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">File PDF Ujian (Maks. 5MB)</label>
            <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive ? 'border-orange-500 bg-orange-500/10' : file ? 'border-green-500/50 bg-green-500/5' : 'border-slate-600 hover:border-slate-500'}`}>
              <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" id="exam-pdf-upload" />
              <label htmlFor="exam-pdf-upload" className="cursor-pointer">
                {file ? <div className="flex items-center justify-center gap-3"><FileText className="w-10 h-10 text-green-400" /><div className="text-left"><p className="text-white font-medium">{file.name}</p><p className="text-slate-400 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p></div><button type="button" onClick={(e) => { e.stopPropagation(); setFile(null) }} className="p-1 text-slate-400 hover:text-red-400"><X className="w-5 h-5" /></button></div> : <><Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-300">Seret & letakkan file PDF di sini, atau <span className="text-orange-400">pilih file</span></p></>}
              </label>
            </div>
          </div>
        )}

        {/* Questions Builder */}
        {examType === 'questions' && (
          <div className="space-y-4">
            {questions.map((question, qIndex) => (
              <div key={qIndex} className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <label className="text-sm font-medium text-slate-300">Soal {qIndex + 1}</label>
                  {questions.length > 1 && <button type="button" onClick={() => removeQuestion(qIndex)} className="p-1 text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>}
                </div>
                <textarea value={question.question_text} onChange={(e) => updateQuestion(qIndex, e.target.value)} rows={2} className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white mb-4" placeholder="Masukkan pertanyaan" />
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">Tandai jawaban yang benar</p>
                  {question.choices.map((choice, cIndex) => (
                    <div key={cIndex} className="flex items-center gap-3">
                      <button type="button" onClick={() => setCorrectAnswer(qIndex, cIndex)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${choice.is_correct ? 'border-green-500 bg-green-500' : 'border-slate-500 hover:border-slate-400'}`}>{choice.is_correct && <Check className="w-3 h-3 text-white" />}</button>
                      <input type="text" value={choice.choice_text} onChange={(e) => updateChoice(qIndex, cIndex, e.target.value)} className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white" placeholder={`Pilihan ${String.fromCharCode(65 + cIndex)}`} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button type="button" onClick={addQuestion} className="w-full py-3 border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-xl text-slate-400 hover:text-white flex items-center justify-center gap-2 transition-colors"><Plus className="w-5 h-5" /> Tambah Soal</button>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Link href="/admin/exams" className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl text-center">Batal</Link>
          <button type="submit" disabled={submitting} className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">{submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buat Ujian'}</button>
        </div>
      </form>
    </div>
  )
}
