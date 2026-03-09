'use client'

import { useState, useCallback, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Upload, FileText, X, Loader2, ArrowLeft, Check, Plus, Trash2,
  HelpCircle, FileUp
} from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ExamType, QuestionFormData, Level, Subject, Material } from '@/types'

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false })
import 'react-quill-new/dist/quill.snow.css'

export default function EditExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  
  const [fetching, setFetching] = useState(true)
  const [examType, setExamType] = useState<ExamType>('questions')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
  })
  
  // Selection State
  const [levels, setLevels] = useState<Level[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  
  const [selectedLevelId, setSelectedLevelId] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedMaterialId, setSelectedMaterialId] = useState('')

  const [file, setFile] = useState<File | null>(null)
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | null>(null)
  const [questions, setQuestions] = useState<QuestionFormData[]>([
    { 
      id: crypto.randomUUID(),
      question_text: '', 
      explanation: '',
      choices: [
        { id: crypto.randomUUID(), choice_text: '', is_correct: true },
        { id: crypto.randomUUID(), choice_text: '', is_correct: false },
        { id: crypto.randomUUID(), choice_text: '', is_correct: false },
        { id: crypto.randomUUID(), choice_text: '', is_correct: false },
      ]
    }
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
  }, [supabase])

  // Fetch Exam Data
  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        const { data: exam, error: examError } = await supabase
          .from('exams')
          .select('*')
          .eq('id', id)
          .single()

        if (examError) throw examError

        setExamType(exam.type as ExamType)
        setFormData({ 
            title: exam.title, 
            description: exam.description || '',
            category: exam.category || ''
        })
        
        if (exam.subject_id) {
          setSelectedSubjectId(exam.subject_id)
          const { data: subject } = await supabase.from('subjects').select('level_id').eq('id', exam.subject_id).single()
          if (subject) setSelectedLevelId(subject.level_id)
        }
        if (exam.material_id) setSelectedMaterialId(exam.material_id)

        if (exam.type === 'pdf' && exam.pdf_url) {
          setExistingPdfUrl(exam.pdf_url)
        }

        if (exam.type === 'questions') {
          const { data: qData, error: qError } = await supabase
            .from('questions')
            .select('*, choices(*)')
            .eq('exam_id', id)
            .order('order_number')
            
          if (qError) throw qError
          if (qData && qData.length > 0) {
             setQuestions(qData.map((q: any) => ({
               id: q.id,
               question_text: q.question_text,
               explanation: q.explanation || '',
               choices: q.choices.map((c: any) => ({
                  id: c.id,
                  choice_text: c.choice_text,
                  is_correct: c.is_correct
               }))
             })))
          }
        }
      } catch (err) {
        console.error('Error fetching exam details:', err)
        setError('Gagal memuat data ujian')
      } finally {
        setFetching(false)
      }
    }
    
    fetchExamDetails()
  }, [id, supabase])

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
  }, [selectedLevelId, supabase])

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
  }, [selectedSubjectId, supabase])


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
        setExistingPdfUrl(null)
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
        setExistingPdfUrl(null)
      } else {
        setError('Silakan unggah file PDF')
      }
    }
  }

  const addQuestion = () => {
    setQuestions(prev => [...prev, {
      id: crypto.randomUUID(),
      question_text: '',
      explanation: '',
      choices: [
        { id: crypto.randomUUID(), choice_text: '', is_correct: true },
        { id: crypto.randomUUID(), choice_text: '', is_correct: false },
        { id: crypto.randomUUID(), choice_text: '', is_correct: false },
        { id: crypto.randomUUID(), choice_text: '', is_correct: false },
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

  const updateExplanation = (index: number, html: string) => {
    setQuestions(prev => prev.map((q, i) => 
      i === index ? { ...q, explanation: html } : q
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
    if (!formData.category) return setError('Silakan pilih kategori')
    if (!selectedLevelId) return setError('Silakan pilih jenjang')
    if (examType === 'pdf' && !file && !existingPdfUrl) return setError('Silakan unggah file PDF')

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
      let pdfUrl = existingPdfUrl

      if (examType === 'pdf' && file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('exams').upload(fileName, file)
        
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('exams').getPublicUrl(fileName)
        pdfUrl = publicUrl
      } else if (examType !== 'pdf') {
        pdfUrl = null // Clear pdf_url if type changed
      }

      const { error: examError } = await supabase
        .from('exams')
        .update({
          title: formData.title,
          description: formData.description || null,
          type: examType,
          category: formData.category || null,
          pdf_url: pdfUrl,
          subject_id: selectedSubjectId || null,
          material_id: selectedMaterialId || null
        })
        .eq('id', id)

      if (examError) throw examError

      if (examType === 'questions') {
        // Fetch existing question IDs from DB to figure out which ones to delete
        const { data: existingDbQuestions } = await supabase
          .from('questions')
          .select('id')
          .eq('exam_id', id)
          
        const existingDbQuestionIds = existingDbQuestions?.map(q => q.id) || []
        const currentQuestionIds = questions.map(q => q.id).filter(Boolean)
        const questionsToDelete = existingDbQuestionIds.filter(dbId => !currentQuestionIds.includes(dbId))

        // Delete removed questions
        if (questionsToDelete.length > 0) {
          await supabase.from('questions').delete().in('id', questionsToDelete)
        }

        for (let i = 0; i < questions.length; i++) {
          const q = questions[i]
          
          // Upsert the question
          const { data: question, error: qError } = await supabase
            .from('questions')
            .upsert({
              id: q.id,
              exam_id: id,
              question_text: q.question_text,
              explanation: q.explanation || null,
              order_number: i + 1,
            }, { onConflict: 'id' })
            .select()
            .single()

          if (qError) throw qError

          // Fetch existing choices for this question to figure out which ones to delete
          const { data: existingDbChoices } = await supabase
            .from('choices')
            .select('id')
            .eq('question_id', question.id)
            
          const existingDbChoiceIds = existingDbChoices?.map(c => c.id) || []
          const currentChoiceIds = q.choices.map(c => c.id).filter(Boolean)
          const choicesToDelete = existingDbChoiceIds.filter(dbId => !currentChoiceIds.includes(dbId))

          if (choicesToDelete.length > 0) {
              await supabase.from('choices').delete().in('id', choicesToDelete)
          }

          // Upsert the choices
          for (const c of q.choices) {
              const { error: cError } = await supabase.from('choices').upsert({
                  id: c.id,
                  question_id: question.id,
                  choice_text: c.choice_text,
                  is_correct: c.is_correct,
              }, { onConflict: 'id' })
              if (cError) throw cError
          }
        }
        
        // Trigger bulk score recalculation via API
        try {
            await fetch('/api/grading/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ examId: id })
            })
        } catch (gradingErr) {
            console.error('Failed to trigger bulk grading:', gradingErr)
            // We don't throw here to not break the save success, but ideally we show a warning
        }

      } else {
        // If type changed from questions to pdf
        await supabase.from('questions').delete().eq('exam_id', id)
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/exams')
      }, 1500)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Gagal menyimpan perubahan ujian')
    } finally {
      setSubmitting(false)
    }
  }

  if (fetching) {
     return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <Check className="w-16 h-16 text-green-400 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Perubahan Ujian Berhasil Disimpan!</h2>
          <p className="text-slate-500">Mengalihkan ke daftar ujian...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/exams" className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Ujian</h1>
          <p className="text-slate-500">Ubah informasi dan soal ujian</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="bg-red-500/10 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}

        {/* Level, Subject, Material Selection */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Kategori <span className="text-red-500">*</span></label>
                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 bg-slate-100 rounded-xl text-slate-900 border border-slate-200" required>
                    <option value="">Pilih Kategori</option>
                    <option value="UAS">UAS</option>
                    <option value="UTS">UTS</option>
                    <option value="Remedial">Remedial</option>
                    <option value="Latihan Soal">Latihan Soal</option>
                </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Jenjang <span className="text-red-500">*</span></label>
                <select value={selectedLevelId} onChange={(e) => setSelectedLevelId(e.target.value)} className="w-full px-4 py-3 bg-slate-100 rounded-xl text-slate-900 border border-slate-200" required>
                    <option value="">Pilih Jenjang</option>
                    {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Mata Pelajaran (Opsional)</label>
                <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} className="w-full px-4 py-3 bg-slate-100 rounded-xl text-slate-900 border border-slate-200" disabled={!selectedLevelId}>
                    <option value="">Pilih Mata Pelajaran</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Materi (Opsional)</label>
                <select value={selectedMaterialId} onChange={(e) => setSelectedMaterialId(e.target.value)} className="w-full px-4 py-3 bg-slate-100 rounded-xl text-slate-900 border border-slate-200" disabled={!selectedSubjectId}>
                    <option value="">Pilih Materi</option>
                    {materials.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
            </div>
        </div>

        {/* Exam Type Selection */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <label className="block text-sm font-medium text-slate-600 mb-3">Tipe Ujian</label>
          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={() => setExamType('questions')} className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${examType === 'questions' ? 'border-purple-500 bg-purple-500/10' : 'border-slate-200 hover:border-slate-600'}`}>
              <HelpCircle className={`w-8 h-8 ${examType === 'questions' ? 'text-purple-400' : 'text-slate-500'}`} />
              <div className="text-center"><p className={`font-medium ${examType === 'questions' ? 'text-slate-900' : 'text-slate-600'}`}>Pilihan Ganda</p><p className="text-sm text-slate-500 mt-1">Soal pilihan ganda otomatis</p></div>
            </button>
            <button type="button" onClick={() => setExamType('pdf')} className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${examType === 'pdf' ? 'border-orange-500 bg-orange-500/10' : 'border-slate-200 hover:border-slate-600'}`}>
              <FileUp className={`w-8 h-8 ${examType === 'pdf' ? 'text-orange-400' : 'text-slate-500'}`} />
              <div className="text-center"><p className={`font-medium ${examType === 'pdf' ? 'text-slate-900' : 'text-slate-600'}`}>Unggah PDF</p><p className="text-sm text-slate-500 mt-1">Unggah ujian sebagai PDF</p></div>
            </button>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div><label className="block text-sm font-medium text-slate-600 mb-2">Judul Ujian</label><input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required className="w-full px-4 py-3 bg-slate-100 border border-slate-600 rounded-xl text-slate-900" placeholder="Masukkan judul ujian" /></div>
          <div><label className="block text-sm font-medium text-slate-600 mb-2">Deskripsi</label><textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-4 py-3 bg-slate-100 border border-slate-600 rounded-xl text-slate-900" placeholder="Masukkan deskripsi ujian" /></div>
        </div>

        {/* Unggah PDF */}
        {examType === 'pdf' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <label className="block text-sm font-medium text-slate-600 mb-3">File PDF Ujian (Maks. 5MB)</label>
            <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive ? 'border-orange-500 bg-orange-500/10' : (file || existingPdfUrl) ? 'border-green-500/50 bg-green-500/5' : 'border-slate-600 hover:border-slate-500'}`}>
              <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" id="exam-pdf-upload" />
              <label htmlFor="exam-pdf-upload" className="cursor-pointer">
                {file ? (
                  <div className="flex items-center justify-center gap-3"><FileText className="w-10 h-10 text-green-400" /><div className="text-left"><p className="text-slate-900 font-medium">{file.name}</p><p className="text-slate-500 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p></div><button type="button" onClick={(e) => { e.stopPropagation(); setFile(null) }} className="p-1 text-slate-500 hover:text-red-400"><X className="w-5 h-5" /></button></div>
                ) : existingPdfUrl ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-10 h-10 text-green-400" />
                    <div className="text-left">
                      <p className="text-slate-900 font-medium">File PDF Tersimpan</p>
                      <p className="text-slate-500 text-sm max-w-xs truncate">{existingPdfUrl.split('/').pop()}</p>
                    </div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setExistingPdfUrl(null) }} className="p-1 text-slate-500 hover:text-red-400">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-600">Seret & letakkan file PDF di sini, atau <span className="text-orange-400">pilih file</span></p>
                  </>
                )}
              </label>
            </div>
          </div>
        )}

        {/* Questions Builder */}
        {examType === 'questions' && (
          <div className="space-y-4">
            {questions.map((question, qIndex) => (
              <div key={qIndex} className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <label className="text-sm font-medium text-slate-600">Soal {qIndex + 1}</label>
                  {questions.length > 1 && <button type="button" onClick={() => removeQuestion(qIndex)} className="p-1 text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>}
                </div>
                <textarea value={question.question_text} onChange={(e) => updateQuestion(qIndex, e.target.value)} rows={2} className="w-full px-4 py-3 bg-slate-100 border border-slate-600 rounded-xl text-slate-900 mb-4" placeholder="Masukkan pertanyaan" />
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">Tandai jawaban yang benar</p>
                  {question.choices.map((choice, cIndex) => (
                    <div key={cIndex} className="flex items-center gap-3">
                      <button type="button" onClick={() => setCorrectAnswer(qIndex, cIndex)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${choice.is_correct ? 'border-green-500 bg-green-500' : 'border-slate-500 hover:border-slate-400'}`}>{choice.is_correct && <Check className="w-3 h-3 text-slate-900" />}</button>
                      <input type="text" value={choice.choice_text} onChange={(e) => updateChoice(qIndex, cIndex, e.target.value)} className="flex-1 px-4 py-2 bg-slate-100 border border-slate-600 rounded-lg text-slate-900" placeholder={`Pilihan ${String.fromCharCode(65 + cIndex)}`} />
                    </div>
                  ))}
                </div>
                <div className="mt-6 border-t border-slate-200 pt-4">
                  <label className="block text-sm font-medium text-slate-600 mb-2">Pembahasan (Opsional)</label>
                  <div className="bg-white rounded-xl overflow-hidden [&_.ql-container]:min-h-[120px] [&_.ql-container]:text-base [&_.ql-toolbar]:border-none [&_.ql-toolbar]:bg-slate-50 [&_.ql-container]:border-none [&_.ql-editor]:min-h-[120px] border border-slate-300">
                    <ReactQuill 
                      theme="snow" 
                      value={question.explanation || ''} 
                      onChange={(val) => updateExplanation(qIndex, val)}
                      placeholder="Masukkan penjelasan untuk jawaban yang benar (mendukung format rich text)..."
                      modules={{
                        toolbar: [
                          [{ 'header': [1, 2, 3, false] }],
                          ['bold', 'italic', 'underline'],
                          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                          ['clean']
                        ]
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addQuestion} className="w-full py-3 border-2 border-dashed border-slate-200 hover:border-slate-600 rounded-xl text-slate-500 hover:text-slate-900 flex items-center justify-center gap-2 transition-colors"><Plus className="w-5 h-5" /> Tambah Soal</button>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Link href="/admin/exams" className="flex-1 py-3 px-4 bg-slate-200 hover:bg-slate-600 text-slate-900 hover:text-white font-medium rounded-xl text-center transition-colors">Batal</Link>
          <button type="submit" disabled={submitting} className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">{submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Perubahan'}</button>
        </div>
      </form>
    </div>
  )
}
