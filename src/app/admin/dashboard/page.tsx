'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { FileText, ClipboardList, Users, Plus, TrendingUp, Target, Percent } from 'lucide-react'

interface DashboardStats {
  totalMaterials: number
  totalExams: number
  totalStudents: number
  avgScore: number | null
  passRate: number | null
}

export default function AdminDashboard() {
  const supabase = createClient()
  const [stats, setStats] = useState<DashboardStats>({
    totalMaterials: 0,
    totalExams: 0,
    totalStudents: 0,
    avgScore: null,
    passRate: null,
  })
  const [recentMaterials, setRecentMaterials] = useState<{id: string; title: string; created_at: string}[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch materials count
        const { count: materialsCount } = await supabase
          .from('materials')
          .select('*', { count: 'exact', head: true })

        // Fetch exams count
        const { count: examsCount } = await supabase
          .from('exams')
          .select('*', { count: 'exact', head: true })

        // Fetch students count
        const { count: studentsCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'student')

        // Fetch recent materials
        const { data: materials } = await supabase
          .from('materials')
          .select('id, title, created_at')
          .order('created_at', { ascending: false })
          .limit(5)

        // Fetch score analytics
        let avgScore: number | null = null
        let passRate: number | null = null
        const { data: scores } = await supabase
          .from('scores')
          .select('percentage, is_passed')

        if (scores && scores.length > 0) {
          const sum = scores.reduce((acc, s) => acc + (Number(s.percentage) || 0), 0)
          avgScore = Math.round((sum / scores.length) * 10) / 10
          const passCount = scores.filter(s => s.is_passed).length
          passRate = Math.round((passCount / scores.length) * 100 * 10) / 10
        }

        setStats({
          totalMaterials: materialsCount || 0,
          totalExams: examsCount || 0,
          totalStudents: studentsCount || 0,
          avgScore,
          passRate,
        })
        setRecentMaterials(materials || [])
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [supabase])

  const statCards = [
    {
      title: 'Total Materi',
      value: stats.totalMaterials,
      icon: FileText,
      color: 'from-blue-500 to-cyan-500',
      href: '/admin/materials',
    },
    {
      title: 'Total Ujian',
      value: stats.totalExams,
      icon: ClipboardList,
      color: 'from-purple-500 to-pink-500',
      href: '/admin/exams',
    },
    {
      title: 'Total Siswa',
      value: stats.totalStudents,
      icon: Users,
      color: 'from-emerald-500 to-teal-500',
      href: '/admin/students',
    },
    {
      title: 'Rata-rata Nilai',
      value: stats.avgScore !== null ? `${stats.avgScore}%` : '-',
      icon: Target,
      color: 'from-indigo-500 to-violet-500',
      href: '/admin/reports',
    },
    {
      title: 'Tingkat Kelulusan',
      value: stats.passRate !== null ? `${stats.passRate}%` : '-',
      icon: Percent,
      color: 'from-rose-500 to-pink-500',
      href: '/admin/reports',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400">Selamat datang kembali! Berikut adalah ringkasan platform Anda.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/materials/upload"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Materi
          </Link>
          <Link
            href="/admin/exams/create"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Buat Ujian
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group bg-slate-800 border border-slate-700 rounded-2xl p-6 hover:border-slate-600 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">{card.title}</p>
                <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Materials */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            Materi Terbaru
          </h2>
          <Link href="/admin/materials" className="text-sm text-purple-400 hover:text-purple-300">
            Lihat semua →
          </Link>
        </div>
        
        {recentMaterials.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Belum ada materi</p>
            <Link href="/admin/materials/upload" className="text-purple-400 hover:text-purple-300 text-sm">
              Unggah materi pertama Anda →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentMaterials.map((material) => (
              <div
                key={material.id}
                className="flex items-center justify-between py-3 px-4 bg-slate-700/50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-white">{material.title}</span>
                </div>
                <span className="text-sm text-slate-400">
                  {new Date(material.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
