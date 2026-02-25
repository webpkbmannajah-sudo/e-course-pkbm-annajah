'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Search, Mail, Calendar, GraduationCap, CheckCircle, XCircle } from 'lucide-react'
import { User } from '@/types'

export default function AdminUsersPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [activeTab])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or('role.eq.student,role.is.null')
        .eq('status', activeTab)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers((data as unknown as User[]) || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (userId: string, newStatus: 'active' | 'rejected') => {
    setProcessingId(userId)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId)

      if (error) throw error

      // Remove from list or refresh
      setUsers(users.filter(u => u.id !== userId))
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    } finally {
      setProcessingId(null)
    }
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getLevelBadgeColor = (level?: string | null) => {
    switch (level) {
      case 'sd': return 'bg-blue-500/20 text-blue-400'
      case 'smp': return 'bg-orange-500/20 text-orange-400'
      case 'sma': return 'bg-purple-500/20 text-purple-400'
      default: return 'bg-slate-200 text-slate-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Pengguna</h1>
          <p className="text-slate-500">Kelola pendaftaran siswa</p>
        </div>
        <div className="flex bg-white p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'pending'
                ? 'bg-purple-500 text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Menunggu Persetujuan
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'active'
                ? 'bg-purple-500 text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Siswa Aktif
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          placeholder="Cari pengguna..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Pengguna tidak ditemukan</h3>
          <p className="text-slate-500">
            {activeTab === 'pending' ? 'Tidak ada pendaftaran tertunda' : 'Siswa aktif tidak ditemukan'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-500">Siswa</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-500">Tingkat Pendidikan</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-500">Bergabung</th>
                  {activeTab === 'pending' && (
                    <th className="text-right px-6 py-4 text-sm font-medium text-slate-500">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-200/50 hover:bg-slate-200/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                          <span className="text-slate-900 font-medium">
                            {user.name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="text-slate-900 font-medium">{user.name}</p>
                          <div className="flex items-center gap-2 text-slate-500 text-xs">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getLevelBadgeColor(user.education_level)}`}>
                        {user.education_level || 'Tidak diketahui'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Calendar className="w-4 h-4" />
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    {activeTab === 'pending' && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleStatusUpdate(user.id, 'rejected')}
                            disabled={processingId === user.id}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Reject"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(user.id, 'active')}
                            disabled={processingId === user.id}
                            className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
