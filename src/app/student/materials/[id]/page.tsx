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
        <h3 className="text-lg font-medium text-white mb-2">Material not found</h3>
        <Link href="/student/materials" className="text-emerald-400 hover:text-emerald-300">
          ← Back to materials
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
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors mt-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{material.title}</h1>
            {material.description && (
              <p className="text-slate-400 mt-1">{material.description}</p>
            )}
            <p className="text-sm text-slate-500 mt-2">
              Uploaded on {new Date(material.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href={material.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open
          </a>
          <a
            href={material.file_url}
            download={material.file_name}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </a>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="bg-slate-700/50 px-4 py-3 border-b border-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
            <FileText className="w-5 h-5" />
            <span className="text-sm">{material.file_name}</span>
          </div>
        </div>
        <div className="aspect-[4/3] bg-slate-900">
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
