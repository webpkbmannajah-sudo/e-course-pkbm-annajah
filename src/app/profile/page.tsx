import Link from 'next/link'
import { BookOpen, Target, History, ArrowLeft } from 'lucide-react'

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Navbar Placeholder */}
      <nav className="border-b border-slate-300 bg-slate-50/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-900 hover:text-emerald-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
          </Link>
          <div className="font-bold text-xl bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            PKBM Annajah
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-4">About Our Institution</h1>
        <p className="text-slate-500 text-center mb-16 max-w-2xl mx-auto">
          Dedicated to empowering students through quality education and character building since 2010.
        </p>
        
        <div className="space-y-8">
           {/* History */}
           <section className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-emerald-500/30 transition-colors">
             <div className="flex items-center gap-4 mb-6">
               <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                 <History className="w-6 h-6 text-purple-400" />
               </div>
               <h2 className="text-2xl font-bold">Our History</h2>
             </div>
             <div className="space-y-4 text-slate-600 leading-relaxed">
               <p>
                 PKBM Annajah was founded with a noble mission to provide accessible and high-quality education to all segments of society. Starting as a small community initiative, we have grown into a comprehensive learning center offering various educational programs.
               </p>
               <p>
                 Over the years, we have helped hundreds of students achieve their academic goals, whether it be completing their formal education through our equivalency programs (Paket A, B, C) or enhancing their skills through our vocational training courses.
               </p>
             </div>
           </section>

           {/* Vision & Mission */}
           <div className="grid md:grid-cols-2 gap-6">
             <section className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-emerald-500/30 transition-colors">
               <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Target className="w-6 h-6 text-emerald-400" />
                 </div>
                 <h2 className="text-2xl font-bold">Vision</h2>
               </div>
               <p className="text-slate-600 leading-relaxed">
                 To become a leading center of excellence in community education that produces intelligent, skilled, and noble character graduates who are ready to contribute to society.
               </p>
             </section>

             <section className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-emerald-500/30 transition-colors">
               <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-400" />
                 </div>
                 <h2 className="text-2xl font-bold">Mission</h2>
               </div>
               <ul className="space-y-4 text-slate-600">
                 <li className="flex gap-3">
                   <span className="w-1.5 h-1.5 mt-2 rounded-full bg-blue-400 flex-shrink-0" />
                   Provide quality and accessible education for everyone.
                 </li>
                 <li className="flex gap-3">
                   <span className="w-1.5 h-1.5 mt-2 rounded-full bg-blue-400 flex-shrink-0" />
                   Develop comprehensive curriculum integrating academic and life skills.
                 </li>
                 <li className="flex gap-3">
                   <span className="w-1.5 h-1.5 mt-2 rounded-full bg-blue-400 flex-shrink-0" />
                   Build strong character and moral values in every student.
                 </li>
               </ul>
             </section>
           </div>
        </div>
      </main>
      
      <footer className="border-t border-slate-300 py-8 mt-20">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© 2026 PKBM Annajah. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
