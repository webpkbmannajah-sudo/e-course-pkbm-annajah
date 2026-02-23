import Link from 'next/link'
import { ArrowLeft, Users, User } from 'lucide-react'

export default function StructurePage() {
  const team = [
    {
      name: "Dr. Ahmad Hidayat",
      role: "Kepala Lembaga",
      image: null
    },
    {
      name: "Siti Nurhaliza, S.Pd",
      role: "Koordinator Akademik",
      image: null
    },
    {
      name: "Budi Santoso, M.Kom",
      role: "Kesiswaan",
      image: null
    },
    {
      name: "Ratna Sari, S.E",
      role: "Administrasi",
      image: null
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Navbar */}
      <nav className="border-b border-slate-300 bg-slate-50/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-900 hover:text-emerald-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Kembali ke Beranda</span>
          </Link>
          <div className="font-bold text-xl bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            PKBM An-Najah
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-4">Struktur Organisasi</h1>
        <p className="text-slate-500 text-center mb-16 max-w-2xl mx-auto">
          Kenali tim pengurus PKBM An-Najah yang berdedikasi dalam memberikan pengalaman pendidikan terbaik.
        </p>
        
        {/* Org Chart Visual */}
        <section className="mb-20">
            <div className="flex justify-center mb-12">
                <div className="bg-white border border-slate-200 p-6 rounded-2xl w-64 text-center relative group hover:border-emerald-500/50 transition-all">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400">
                        <Users className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900">Kepala Lembaga</h3>
                    <p className="text-slate-500">Dr. Ahmad Hidayat</p>
                    
                    {/* Connecting Line */}
                    <div className="absolute -bottom-12 left-1/2 w-0.5 h-12 bg-slate-200 group-hover:bg-emerald-500/30 transition-colors" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                {/* Horizontal Line */}
                <div className="hidden md:block absolute -top-8 left-1/2 -translate-x-1/2 w-2/3 h-0.5 bg-slate-200" />
                <div className="hidden md:block absolute -top-8 left-[17%] w-0.5 h-8 bg-slate-200" />
                <div className="hidden md:block absolute -top-8 right-[17%] w-0.5 h-8 bg-slate-200" />
                <div className="hidden md:block absolute -top-8 left-1/2 w-0.5 h-8 bg-slate-200" />

                {team.slice(1).map((member, index) => (
                    <div key={index} className="bg-white border border-slate-200 p-6 rounded-2xl text-center hover:border-emerald-500/50 transition-all">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-400">
                            <User className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-slate-900 mb-1">{member.role}</h3>
                        <p className="text-slate-500 text-sm">{member.name}</p>
                    </div>
                ))}
            </div>
        </section>

        {/* Team List */}
        <section>
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <Users className="w-6 h-6 text-purple-400" />
                Tim Kami
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {team.map((member, index) => (
                    <div key={index} className="flex items-center gap-4 bg-white border border-slate-200/50 p-4 rounded-xl hover:bg-white transition-colors">
                        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                            <User className="w-6 h-6 text-slate-500" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900">{member.name}</p>
                            <p className="text-emerald-400 text-sm">{member.role}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
      </main>

      <footer className="border-t border-slate-300 py-8 mt-20">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© 2026 PKBM An-Najah. Hak cipta dilindungi.</p>
        </div>
      </footer>
    </div>
  )
}
