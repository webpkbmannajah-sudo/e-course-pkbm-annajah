'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { FileText, ClipboardList, CheckCircle, Clock } from 'lucide-react'

interface DashboardStats {
  totalMaterials: number
  totalExams: number
  completedExams: number
}

export default function StudentDashboard() {
  const supabase = createClient()
  const [userName, setUserName] = useState('')
  const [stats, setStats] = useState<DashboardStats>({
    totalMaterials: 0,
    totalExams: 0,
    completedExams: 0,
  })
  const [recentMaterials, setRecentMaterials] = useState<{id: string; title: string; created_at: string}[]>([])
  const [upcomingExams, setUpcomingExams] = useState<{id: string; title: string; type: string}[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Get user
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserName(user.user_metadata?.name || 'Siswa')

          // Fetch materials count
          const { count: materialsCount } = await supabase
            .from('materials')
            .select('*', { count: 'exact', head: true })

          // Fetch exams count
          const { count: examsCount } = await supabase
            .from('exams')
            .select('*', { count: 'exact', head: true })

          // Fetch completed exams count
          const { count: completedCount } = await supabase
            .from('exam_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

          // Fetch recent materials
          const { data: materials } = await supabase
            .from('materials')
            .select('id, title, created_at')
            .order('created_at', { ascending: false })
            .limit(3)

          // Fetch upcoming exams (exams not yet taken)
          const { data: exams } = await supabase
            .from('exams')
            .select('id, title, type')
            .order('created_at', { ascending: false })
            .limit(3)

          setStats({
            totalMaterials: materialsCount || 0,
            totalExams: examsCount || 0,
            completedExams: completedCount || 0,
          })
          setRecentMaterials(materials || [])
          setUpcomingExams(exams || [])
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white">Halo, {userName}! 👋</h1>
        <p className="text-slate-300 mt-1">Siap untuk melanjutkan belajar hari ini?</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Materi Tersedia</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.totalMaterials}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Ujian</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.totalExams}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Ujian Selesai</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.completedExams}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Materials */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Materi Terbaru
            </h2>
            <Link href="/student/materials" className="text-sm text-emerald-400 hover:text-emerald-300">
              Lihat semua →
            </Link>
          </div>
          
          {recentMaterials.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Belum ada materi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentMaterials.map((material) => (
                <Link
                  key={material.id}
                  href={`/student/materials/${material.id}`}
                  className="flex items-center justify-between py-3 px-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition-colors"
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
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Available Exams */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-purple-400" />
              Ujian Tersedia
            </h2>
            <Link href="/student/exams" className="text-sm text-emerald-400 hover:text-emerald-300">
              Lihat semua →
            </Link>
          </div>
          
          {upcomingExams.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Belum ada ujian</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingExams.map((exam) => (
                <Link
                  key={exam.id}
                  href={`/student/exams/${exam.id}`}
                  className="flex items-center justify-between py-3 px-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <span className="text-white block">{exam.title}</span>
                      <span className="text-xs text-slate-400 capitalize">Ujian {exam.type}</span>
                    </div>
                  </div>
                  <Clock className="w-5 h-5 text-slate-400" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
