import Link from 'next/link'
import { BookOpen, GraduationCap, Shield, ArrowRight, FileText, ClipboardList, CheckCircle } from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      icon: FileText,
      title: 'Learning Materials',
      description: 'Access PDF materials uploaded by instructors anytime, anywhere.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: ClipboardList,
      title: 'Interactive Exams',
      description: 'Take quizzes and exams with instant feedback and score tracking.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: CheckCircle,
      title: 'Track Progress',
      description: 'Monitor your learning progress and exam results in one place.',
      color: 'from-emerald-500 to-teal-500',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute top-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-32">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-center text-white mb-6">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Course Management
            </span>
          </h1>

          <p className="text-xl text-slate-400 text-center max-w-2xl mx-auto mb-12">
            Your complete platform for learning materials and online examinations. 
            Access courses, take exams, and track your progress.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
            >
              Sign In
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-white mb-4">
          Everything You Need to Succeed
        </h2>
        <p className="text-slate-400 text-center mb-12">
          A complete learning management system for students and administrators
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all group"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Role Cards */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student Card */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-4">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">For Students</h3>
            <ul className="space-y-2 text-slate-400 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Access learning materials
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Take online exams
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                View your scores and progress
              </li>
            </ul>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Register as Student
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Admin Card */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">For Administrators</h3>
            <ul className="space-y-2 text-slate-400 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-purple-400" />
                Upload learning materials
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-purple-400" />
                Create and manage exams
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-purple-400" />
                Monitor student progress
              </li>
            </ul>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium"
            >
              Register as Admin
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© 2026 Course Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
