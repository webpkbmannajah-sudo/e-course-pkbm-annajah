import Link from 'next/link'
import { GraduationCap, Shield, Award, Phone, MapPin, ChevronRight, Users, FileText, ClipboardList } from 'lucide-react'

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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Navbar */}
      <nav className="border-b border-slate-300 bg-slate-50/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-emerald-500/20 overflow-hidden p-1">
              <img src="/logo.png" alt="PKBM An-Najah Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-lg text-slate-900">PKBM AN-NAJAH</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg transition-colors"
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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))]" />
        
        <div className="max-w-6xl mx-auto px-4 pt-20 pb-24 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium px-4 py-2 rounded-full mb-6">
              <GraduationCap className="w-4 h-4" />
              Pusat Kegiatan Belajar Masyarakat
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
              Raih Kesempatan Kedua,{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Tata Kembali Masa Depan
              </span>{' '}
              Lewat Pendidikan
            </h1>

            <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              Banyak yang terpaksa putus sekolah karena harus bekerja, menikah muda, atau alasan ekonomi.
              PKBM An-Najah hadir memberikan solusi pendidikan kesetaraan — Paket A, B, dan C — dengan 
              pembelajaran fleksibel yang bisa diakses kapan saja.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-900 px-8 py-4 rounded-xl font-semibold shadow-lg shadow-emerald-500/30 transition-all duration-200 text-lg"
              >
                Daftar Sekarang
                <ChevronRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-900 px-8 py-4 rounded-xl font-semibold transition-all duration-200 text-lg"
              >
                Masuk
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-16 max-w-xl mx-auto">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-400">3</div>
              <div className="text-sm text-slate-500 mt-1">Program</div>
            </div>
            <div className="text-center border-x border-slate-200">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-400">33</div>
              <div className="text-sm text-slate-500 mt-1">Mata Pelajaran</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-400">24/7</div>
              <div className="text-sm text-slate-500 mt-1">Akses Belajar</div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-20 relative">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Program Kesetaraan
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Pilih program yang sesuai dengan kebutuhan pendidikan Anda
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {programs.map((program) => (
              <div
                key={program.slug}
                className={`bg-white border ${program.borderColor} rounded-2xl p-6 ${program.hoverBorder} transition-all duration-300 group hover:shadow-lg`}
              >
                <div className={`inline-flex items-center gap-2 ${program.bgLight} ${program.textColor} text-sm font-semibold px-3 py-1.5 rounded-lg mb-4`}>
                  <GraduationCap className="w-4 h-4" />
                  {program.setara}
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 mb-3">{program.name}</h3>
                <p className="text-slate-500 mb-6 leading-relaxed">{program.description}</p>

                <div className="flex items-center gap-4 mb-6 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {program.subjects} Mapel
                  </span>
                  <span className="flex items-center gap-1">
                    <ClipboardList className="w-4 h-4" />
                    Latihan Soal
                  </span>
                </div>

                <Link
                  href="/register"
                  className={`block text-center py-3 rounded-xl font-semibold bg-gradient-to-r ${program.bgGradient} text-slate-900 hover:opacity-90 transition-opacity`}
                >
                  Daftar {program.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Platform Belajar Digital
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Akses materi dan ujian kapan saja, di mana saja
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-emerald-500/50 transition-all">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 text-blue-400">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Materi Digital</h3>
              <p className="text-slate-500">
                Materi pelajaran dalam format PDF dan gambar yang bisa diakses langsung dari browser, 
                tanpa perlu download aplikasi tambahan.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-emerald-500/50 transition-all">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 text-emerald-400">
                <ClipboardList className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Latihan Soal</h3>
              <p className="text-slate-500">
                Latihan soal pilihan ganda dengan penilaian otomatis. Bisa dikerjakan berulang kali 
                untuk mengukur pemahaman Anda.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-emerald-500/50 transition-all">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 text-purple-400">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Pantau Progress</h3>
              <p className="text-slate-500">
                Dashboard pribadi untuk melihat riwayat ujian, nilai, dan perkembangan belajar Anda 
                dari waktu ke waktu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Legality Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Legalitas &amp; Pengakuan
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              PKBM An-Najah beroperasi secara resmi dan diakui oleh pemerintah
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {legality.map((item, index) => (
              <div key={index} className="bg-white border border-slate-200 rounded-2xl p-6 text-center hover:border-emerald-500/30 transition-all">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-400">
                  <Shield className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Manfaat Ijazah Kesetaraan
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Ijazah dari program kesetaraan memiliki kedudukan yang sama dengan ijazah pendidikan formal
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-emerald-500/30 transition-all group">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 text-emerald-400 group-hover:scale-110 transition-transform">
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{benefit.title}</h3>
                <p className="text-slate-500">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Contact Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border border-emerald-500/20 rounded-3xl p-8 sm:p-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Mulai Perjalanan Belajar Anda
            </h2>
            <p className="text-slate-600 text-lg mb-8 max-w-2xl mx-auto">
              Jangan biarkan kesempatan berlalu. Daftar sekarang dan raih ijazah kesetaraan Anda bersama PKBM An-Najah.
            </p>
            
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-900 px-8 py-4 rounded-xl font-semibold shadow-lg shadow-emerald-500/30 transition-all duration-200 text-lg mb-10"
            >
              Daftar Sekarang
              <ChevronRight className="w-5 h-5" />
            </Link>

            <div className="border-t border-emerald-500/20 pt-8 mt-4">
              <p className="text-slate-500 mb-4 text-sm uppercase tracking-widest font-medium">Hubungi Kami</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <a href="https://wa.me/6282196848763" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors">
                  <Phone className="w-5 h-5" />
                  <span>0821-9684-8763</span>
                </a>
                <a href="https://instagram.com/pkbm.annajah" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors">
                  <MapPin className="w-5 h-5" />
                  <span>@pkbm.annajah</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-300 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            © 2026 PKBM An-Najah. Hak cipta dilindungi undang-undang.
          </p>
        </div>
      </footer>
    </div>
  )
}
