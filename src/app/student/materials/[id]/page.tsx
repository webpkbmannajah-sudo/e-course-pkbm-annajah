'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, FileText, Download, ExternalLink, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { Material } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function MaterialDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const supabase = createClient()
  const [material, setMaterial] = useState<Material | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMaterial()
  }, [id])

  const fetchMaterial = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setMaterial(data)
    } catch (error) {
      console.error('Error fetching material:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!material) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">Materi tidak ditemukan</h3>
        <Link href="/student/materials" className="text-emerald-400 hover:text-emerald-300">
          ← Kembali ke daftar materi
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            href="/student/materials"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-colors mt-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{material.title}</h1>
            {material.description && (
              <p className="text-slate-500 mt-1">{material.description}</p>
            )}
            <p className="text-sm text-slate-500 mt-2">
              Diunggah pada {new Date(material.created_at).toLocaleDateString('id-ID')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href={material.file_url || undefined}
            download={material.file_name}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-900 rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            Unduh
          </a>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="bg-slate-100 px-4 py-3 border-b border-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <FileText className="w-5 h-5" />
            <span className="text-sm">{material.file_name}</span>
          </div>
        </div>
        <div className="aspect-[4/3] bg-slate-50">
          <iframe
            src={`${material.file_url}#toolbar=0&navpanes=0`}
            className="w-full h-full"
            title={material.title}
          />
        </div>
      </div>
    </div>
  )
}
