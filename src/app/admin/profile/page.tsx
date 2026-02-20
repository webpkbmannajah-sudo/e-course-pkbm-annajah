'use client'

import { useState, useEffect } from 'react'
import { User as UserIcon, Save, Camera, Loader2 } from 'lucide-react'
import type { User as UserType } from '@/types'

export default function AdminProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserType | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/users/profile')
      if (!res.ok) throw new Error('Failed to fetch profile')
      const data = await res.json()
      setProfile(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile!.name,
          phone: profile!.phone,
        }),
      })

      if (!res.ok) throw new Error('Gagal memperbarui profil')
      
      setMessage({ type: 'success', text: 'Profil berhasil diperbarui' })
    } catch {
      setMessage({ type: 'error', text: 'Gagal memperbarui profil' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-purple-600" /></div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-8">My Profile</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8">
          {message && (
            <div className={`p-4 rounded-lg mb-6 text-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex items-start gap-8">
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-4">
                <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden relative group">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-12 h-12 text-slate-400" />
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                </div>
                <button type="button" className="text-sm text-purple-600 font-medium hover:text-purple-700">
                  Change Photo
                </button>
              </div>

              {/* Form Fields */}
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profile?.name || ''}
                      onChange={e => setProfile({ ...profile!, name: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={profile?.phone || ''}
                    onChange={e => setProfile({ ...profile!, phone: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    placeholder="+62..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium">
                    {profile?.role}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
