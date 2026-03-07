'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShieldCheck, UserPlus, Trash2, Mail, Calendar, Key, Edit2 } from 'lucide-react'

interface AdminUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'superadmin'
  created_at: string
}

export default function ManageAdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)

  // Add Admin Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminPassword, setNewAdminPassword] = useState('')
  const [addingAdmin, setAddingAdmin] = useState(false)
  const [addMessage, setAddMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [deletingAdmin, setDeletingAdmin] = useState(false)

  // Reset Password Modal
  const [resetTarget, setResetTarget] = useState<{ id: string, name: string } | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resettingPassword, setResettingPassword] = useState(false)
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showResetPassword, setShowResetPassword] = useState(false)

  // Edit Email Modal
  const [editTarget, setEditTarget] = useState<{ id: string, name: string, email: string } | null>(null)
  const [editEmail, setEditEmail] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [editMessage, setEditMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const fetchAdmins = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/manage-admins')
      const data = await response.json()
      if (response.ok) {
        setAdmins(data.admins || [])
      }
    } catch (error) {
      console.error('Error fetching admins:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAdmins()
  }, [fetchAdmins])

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingAdmin(true)
    setAddMessage(null)

    try {
      const response = await fetch('/api/admin/manage-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newAdminEmail, password: newAdminPassword })
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setAddMessage({ type: 'success', text: 'Admin berhasil ditambahkan!' })
      fetchAdmins()
      setTimeout(() => {
        setShowAddModal(false)
        setNewAdminEmail('')
        setNewAdminPassword('')
        setAddMessage(null)
      }, 1500)
    } catch (error) {
      setAddMessage({ type: 'error', text: error instanceof Error ? error.message : 'Gagal menambahkan admin' })
    } finally {
      setAddingAdmin(false)
    }
  }

  const handleDeleteAdmin = async () => {
    if (!deleteTarget) return
    setDeletingAdmin(true)

    try {
      const response = await fetch('/api/admin/manage-admins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: deleteTarget.id })
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setAdmins(admins.filter(a => a.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (error) {
      console.error('Error deleting admin:', error)
      alert(error instanceof Error ? error.message : 'Gagal menghapus admin')
    } finally {
      setDeletingAdmin(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetTarget || resetPassword.length < 6) return

    setResettingPassword(true)
    setResetMessage(null)

    try {
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: resetTarget.id, newPassword: resetPassword })
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setResetMessage({ type: 'success', text: 'Password berhasil diperbarui!' })
      setTimeout(() => {
        setResetTarget(null)
        setResetPassword('')
        setResetMessage(null)
        setShowResetPassword(false)
      }, 1500)
    } catch (error) {
      setResetMessage({ type: 'error', text: error instanceof Error ? error.message : 'Gagal mereset password' })
    } finally {
      setResettingPassword(false)
    }
  }

  const handleEditEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget) return

    setSavingEmail(true)
    setEditMessage(null)

    try {
      const response = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editTarget.id,
          name: editTarget.name,
          email: editEmail,
        })
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setEditMessage({ type: 'success', text: 'Email berhasil diperbarui!' })
      setAdmins(admins.map(a => a.id === editTarget.id ? { ...a, email: editEmail } : a))
      setTimeout(() => {
        setEditTarget(null)
        setEditEmail('')
        setEditMessage(null)
      }, 1500)
    } catch (error) {
      setEditMessage({ type: 'error', text: error instanceof Error ? error.message : 'Gagal memperbarui email' })
    } finally {
      setSavingEmail(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Admin</h1>
          <p className="text-slate-500">Kelola akun admin dan operator</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all shadow-sm hover:shadow-md"
        >
          <UserPlus className="w-4 h-4" />
          Tambah Admin
        </button>
      </div>

      {/* Admins List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : admins.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-purple-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Belum ada admin</h3>
          <p className="text-slate-500 mb-6">Tambahkan admin pertama untuk mulai mengelola platform</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all shadow-sm hover:shadow-md font-medium"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Admin
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/50">
                <tr className="border-b border-slate-200">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Admin</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Role</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Dibuat</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm ring-1 ring-white/50 ${
                          admin.role === 'superadmin' 
                            ? 'bg-gradient-to-br from-amber-400 to-orange-500' 
                            : 'bg-gradient-to-br from-purple-500 to-indigo-500'
                        }`}>
                          <span className="text-white font-medium text-sm">
                            {admin.name?.charAt(0).toUpperCase() || admin.email?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="text-slate-900 font-medium">{admin.name || admin.email.split('@')[0]}</p>
                          <div className="flex items-center gap-2 text-slate-500 text-xs">
                            <Mail className="w-3 h-3" />
                            {admin.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        admin.role === 'superadmin' 
                          ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                          : 'bg-purple-100 text-purple-700 border border-purple-200'
                      }`}>
                        {admin.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Calendar className="w-4 h-4" />
                        {new Date(admin.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditTarget({ id: admin.id, name: admin.name || admin.email, email: admin.email }); setEditEmail(admin.email) }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit Email"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setResetTarget({ id: admin.id, name: admin.name || admin.email })}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        {admin.role !== 'superadmin' && (
                          <button
                            onClick={() => setDeleteTarget(admin)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Hapus Admin"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Tambah Admin Baru</h2>
              <p className="text-sm text-slate-500 mt-1">Buat akun admin baru untuk mengelola platform.</p>
            </div>
            <form onSubmit={handleAddAdmin} className="p-6 space-y-4">
              {addMessage && (
                <div className={`p-3 rounded-lg text-sm border ${
                  addMessage.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {addMessage.text}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  placeholder="admin@contoh.com"
                  disabled={addingAdmin || addMessage?.type === 'success'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  placeholder="Minimal 6 karakter"
                  disabled={addingAdmin || addMessage?.type === 'success'}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setAddMessage(null); setNewAdminEmail(''); setNewAdminPassword('') }}
                  disabled={addingAdmin}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addingAdmin || addMessage?.type === 'success'}
                  className="px-6 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center"
                >
                  {addingAdmin ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Menambahkan...
                    </>
                  ) : (
                    'Tambah Admin'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-2">Hapus Admin?</h2>
              <p className="text-sm text-slate-500">
                Apakah Anda yakin ingin menghapus <strong className="text-slate-700">{deleteTarget.name || deleteTarget.email}</strong>? 
                Akun ini akan dihapus secara permanen.
              </p>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deletingAdmin}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteAdmin}
                  disabled={deletingAdmin}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
                >
                  {deletingAdmin ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Menghapus...
                    </>
                  ) : (
                    'Ya, Hapus'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Reset Password Admin</h2>
              <p className="text-sm text-slate-500 mt-1">
                Atur ulang password untuk <span className="font-semibold text-slate-700">{resetTarget.name}</span>
              </p>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              {resetMessage && (
                <div className={`p-3 rounded-lg text-sm border ${
                  resetMessage.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {resetMessage.text}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password Baru</label>
                <div className="relative">
                  <input
                    type={showResetPassword ? "text" : "password"}
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 pr-10 outline-none"
                    placeholder="Minimal 6 karakter"
                    required
                    minLength={6}
                    disabled={resettingPassword || resetMessage?.type === 'success'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showResetPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setResetTarget(null); setResetPassword(''); setResetMessage(null); setShowResetPassword(false) }}
                  disabled={resettingPassword}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={resettingPassword || resetPassword.length < 6 || resetMessage?.type === 'success'}
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center"
                >
                  {resettingPassword ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Email Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Edit Email Admin</h2>
              <p className="text-sm text-slate-500 mt-1">
                Ubah email untuk <span className="font-semibold text-slate-700">{editTarget.name}</span>
              </p>
            </div>
            <form onSubmit={handleEditEmail} className="p-6 space-y-4">
              {editMessage && (
                <div className={`p-3 rounded-lg text-sm border ${
                  editMessage.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {editMessage.text}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Baru</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="admin@contoh.com"
                  disabled={savingEmail || editMessage?.type === 'success'}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setEditTarget(null); setEditEmail(''); setEditMessage(null) }}
                  disabled={savingEmail}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEmail || editMessage?.type === 'success'}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {savingEmail ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Email'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
