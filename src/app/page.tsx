import Link from 'next/link'
import { GraduationCap, Shield, Award, Phone, MapPin, ChevronRight, Users, FileText, ClipboardList, Instagram, Music2 } from 'lucide-react'

export default function HomePage() {
  const programs = [
    {
      name: 'Paket A',
      setara: 'Setara SD',
      slug: 'sd',
      color: 'red',
      bgGradient: 'from-red-600 to-red-700',
      bgLight: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-400',
      hoverBorder: 'hover:border-red-500',
      ringColor: 'focus:ring-red-500',
      subjects: 7,
      description: 'Program kesetaraan tingkat SD untuk siswa yang belum menyelesaikan pendidikan dasar.',
    },
    {
      name: 'Paket B',
      setara: 'Setara SMP',
      slug: 'smp',
      color: 'green',
      bgGradient: 'from-green-600 to-green-700',
      bgLight: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-400',
      hoverBorder: 'hover:border-green-500',
      ringColor: 'focus:ring-green-500',
      subjects: 7,
      description: 'Program kesetaraan tingkat SMP bagi siswa yang ingin melanjutkan pendidikan menengah.',
    },
    {
      name: 'Paket C',
      setara: 'Setara SMA',
      slug: 'sma',
      color: 'yellow',
      bgGradient: 'from-yellow-500 to-amber-600',
      bgLight: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      textColor: 'text-yellow-400',
      hoverBorder: 'hover:border-yellow-500',
      ringColor: 'focus:ring-yellow-500',
      subjects: 19,
      description: 'Program kesetaraan tingkat SMA dengan berbagai mata pelajaran umum dan peminatan.',
    },
  ]

  const benefits = [
    {
      icon: <GraduationCap className="w-7 h-7" />,
      title: 'Melanjutkan ke Perguruan Tinggi',
      description: 'Ijazah kesetaraan diakui untuk mendaftar ke universitas negeri maupun swasta.',
    },
    {
      icon: <Shield className="w-7 h-7" />,
      title: 'Melamar Pekerjaan',
      description: 'Memenuhi syarat administrasi untuk melamar ke berbagai instansi dan perusahaan.',
    },
    {
      icon: <Award className="w-7 h-7" />,
      title: 'Berwirausaha',
      description: 'Menambah kepercayaan diri dan modal legalitas untuk memulai usaha sendiri.',
    },
  ]

  const legality = [
    {
      title: 'Terdaftar di Dapodik',
      description: 'PKBM An-Najah terdaftar resmi di Data Pokok Pendidikan Kemendikbud.',
    },
    {
      title: 'SK Pemerintah',
      description: 'Beroperasi berdasarkan Surat Keputusan resmi dari pemerintah daerah.',
    },
    {
      title: 'Terakreditasi',
      description: 'Program kesetaraan yang telah melalui proses akreditasi resmi.',
    },
  ]

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navbar */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-emerald-500/10 overflow-hidden p-1 border border-slate-100">
              <img src="/logo.png" alt="PKBM An-Najah Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">PKBM AN-NAJAH</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg transition-colors font-medium"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="text-sm bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-lg shadow-emerald-500/20"
            >
              Daftar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        <div className="max-w-6xl mx-auto px-4 pt-24 pb-24 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold px-4 py-2 rounded-full mb-8 shadow-sm">
              <GraduationCap className="w-4 h-4" />
              Pusat Kegiatan Belajar Masyarakat
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-slate-900 mb-8 tracking-tight leading-[1.1]">
              Raih Kesempatan Kedua,{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Tata Kembali Masa Depan
              </span>{' '}
              Lewat Pendidikan
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
              PKBM An-Najah hadir memberikan solusi pendidikan kesetaraan — Paket A, B, dan C — dengan 
              pembelajaran fleksibel yang bisa diakses kapan saja.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-emerald-500/25 transition-all duration-300 text-lg active:scale-95"
              >
                Daftar Sekarang
                <ChevronRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-10 py-4 rounded-2xl font-bold transition-all duration-300 text-lg active:scale-95"
              >
                Masuk
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-8 mt-24 max-w-2xl mx-auto">
            <div className="text-center group">
              <div className="text-3xl sm:text-4xl font-black text-emerald-600 group-hover:scale-110 transition-transform">3</div>
              <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">Program</div>
            </div>
            <div className="text-center border-x border-slate-100 group">
              <div className="text-3xl sm:text-4xl font-black text-emerald-600 group-hover:scale-110 transition-transform">33</div>
              <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">Mata Pelajaran</div>
            </div>
            <div className="text-center group">
              <div className="text-3xl sm:text-4xl font-black text-emerald-600 group-hover:scale-110 transition-transform">24/7</div>
              <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">Akses Belajar</div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-24 bg-slate-50/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">
              Program Kesetaraan
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
              Pilih program yang sesuai dengan kebutuhan pendidikan Anda
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {programs.map((program) => (
              <div
                key={program.slug}
                className="bg-white border border-slate-200 rounded-3xl p-8 hover:border-emerald-500/50 transition-all duration-500 group hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1"
              >
                <div className={`inline-flex items-center gap-2 ${program.bgLight} ${program.textColor} text-sm font-bold px-4 py-2 rounded-xl mb-6`}>
                  <GraduationCap className="w-4 h-4" />
                  {program.setara}
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{program.name}</h3>
                <p className="text-slate-500 mb-8 leading-relaxed font-medium">{program.description}</p>

                <div className="flex flex-col gap-4 mb-8">
                  <div className="flex items-center gap-3 text-slate-600 font-semibold">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <FileText className="w-4 h-4" />
                    </div>
                    {program.subjects} Mata Pelajaran
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 font-semibold">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <ClipboardList className="w-4 h-4" />
                    </div>
                    Latihan Soal & Ujian
                  </div>
                </div>

                <Link
                  href="/register"
                  className="block text-center py-4 rounded-2xl font-bold bg-slate-900 text-white hover:bg-emerald-600 transition-all duration-300 shadow-lg shadow-slate-900/10 hover:shadow-emerald-500/20"
                >
                  Daftar {program.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">
              Platform Belajar Digital
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
              Akses materi dan ujian kapan saja, di mana saja
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 hover:bg-white hover:border-emerald-500/30 transition-all duration-300 group">
              <div className="w-14 h-14 bg-white shadow-md rounded-2xl flex items-center justify-center mb-6 text-emerald-600 group-hover:scale-110 transition-transform">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Materi Digital</h3>
              <p className="text-slate-500 leading-relaxed font-medium">
                Materi pelajaran dalam format PDF dan gambar yang bisa diakses langsung dari browser, 
                tanpa perlu download aplikasi tambahan.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 hover:bg-white hover:border-emerald-500/30 transition-all duration-300 group">
              <div className="w-14 h-14 bg-white shadow-md rounded-2xl flex items-center justify-center mb-6 text-emerald-600 group-hover:scale-110 transition-transform">
                <ClipboardList className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Latihan Soal</h3>
              <p className="text-slate-500 leading-relaxed font-medium">
                Latihan soal pilihan ganda dengan penilaian otomatis. Bisa dikerjakan berulang kali 
                untuk mengukur pemahaman Anda.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 hover:bg-white hover:border-emerald-500/30 transition-all duration-300 group">
              <div className="w-14 h-14 bg-white shadow-md rounded-2xl flex items-center justify-center mb-6 text-emerald-600 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Pantau Progress</h3>
              <p className="text-slate-500 leading-relaxed font-medium">
                Dashboard pribadi untuk melihat riwayat ujian, nilai, dan perkembangan belajar Anda 
                dari waktu ke waktu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Legality Section */}
      <section className="py-24 bg-slate-50/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">
              Legalitas & Pengakuan
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
              PKBM An-Najah beroperasi secara resmi dan diakui oleh pemerintah
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {legality.map((item, index) => (
              <div key={index} className="bg-white border border-slate-200 rounded-3xl p-8 text-center hover:border-emerald-500/30 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-600">
                  <Shield className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">{item.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">
              Manfaat Ijazah Kesetaraan
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
              Ijazah dari program kesetaraan memiliki kedudukan yang sama dengan ijazah pendidikan formal
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-slate-50 border border-slate-100 rounded-3xl p-8 hover:bg-white hover:border-emerald-500/30 transition-all duration-300 group shadow-sm hover:shadow-xl">
                <div className="w-16 h-16 bg-white shadow-md rounded-2xl flex items-center justify-center mb-6 text-emerald-600 group-hover:scale-110 transition-transform">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">{benefit.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Contact Section */}
      <section className="py-24 bg-slate-50/30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-[2.5rem] p-10 sm:p-16 text-center shadow-2xl shadow-emerald-500/5 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-5xl font-black text-emerald-900 mb-6 tracking-tight">
                Mulai Perjalanan Belajar Anda
              </h2>
              <p className="text-emerald-800 text-lg sm:text-xl mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
                Jangan biarkan kesempatan berlalu. Daftar sekarang dan raih ijazah kesetaraan Anda bersama PKBM An-Najah.
              </p>
              
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-5 rounded-2xl font-black shadow-xl shadow-emerald-600/20 transition-all duration-300 text-xl mb-12 active:scale-95"
              >
                Daftar Sekarang
                <ChevronRight className="w-6 h-6" />
              </Link>

              <div className="border-t border-emerald-200/60 pt-10">
                <p className="text-emerald-700/60 mb-6 text-xs uppercase tracking-[0.2em] font-black">Hubungi Kami</p>
                <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
                  <a 
                    href="https://www.instagram.com/pkbm.annajah" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-3 text-emerald-900 hover:text-emerald-600 transition-all duration-300 font-bold text-lg group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                      <Instagram className="w-6 h-6" />
                    </div>
                    <span>@pkbm.annajah</span>
                  </a>
                  <a 
                    href="https://www.tiktok.com/@pkbm.annajah?is_from_webapp=1&sender_device=pc" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-3 text-emerald-900 hover:text-emerald-600 transition-all duration-300 font-bold text-lg group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                      <Music2 className="w-6 h-6" />
                    </div>
                    <span>@pkbm.annajah</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center p-1 border border-emerald-100">
              <img src="/logo.png" alt="PKBM An-Najah Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight">PKBM AN-NAJAH</span>
          </div>
          <p className="text-slate-400 text-sm font-medium">
            © 2026 PKBM An-Najah. Hak cipta dilindungi undang-undang.
          </p>
        </div>
      </footer>
    </div>
  )
}
