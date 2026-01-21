# Course Management System

A full-stack web application for course management with student and admin portals, built with Next.js 14, TypeScript, and Supabase.

## Features

### For Students
- 📚 View learning materials (PDF viewer)
- 📝 Take online exams (question-based or PDF)
- 📊 Track exam scores and progress

### For Administrators  
- 📤 Upload PDF learning materials
- ✏️ Create exams (PDF upload or question builder)
- 👥 View registered students

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth
- **Hosting**: Vercel (recommended)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (free at [supabase.com](https://supabase.com))

### 1. Clone and Install

```bash
cd course-management
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com/dashboard)
2. Go to **Settings > API** to get your project URL and anon key
3. Create `.env.local` file:

```bash
cp .env.local.example .env.local
```

4. Update `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Set up Database

1. Go to Supabase Dashboard > **SQL Editor**
2. Copy and paste the contents of `supabase/schema.sql`
3. Run the SQL script

### 4. Set up Storage Buckets

1. Go to Supabase Dashboard > **Storage**
2. Create two buckets:
   - `materials` (public)
   - `exams` (public)
3. For each bucket, enable public access in bucket settings

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── (auth)/login, register    # Authentication pages
│   ├── admin/                    # Admin dashboard and features
│   │   ├── dashboard/
│   │   ├── materials/
│   │   ├── exams/
│   │   └── students/
│   ├── student/                  # Student dashboard and features
│   │   ├── dashboard/
│   │   ├── materials/
│   │   └── exams/
│   ├── layout.tsx
│   └── page.tsx                  # Landing page
├── components/                   # Reusable components
├── lib/
│   ├── supabase/                 # Supabase client setup
│   └── utils.ts                  # Utility functions
├── types/                        # TypeScript types
└── middleware.ts                 # Auth middleware
```

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Import Project** and select your repository
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**

## Usage

### Creating an Admin Account

1. Go to `/register`
2. Select "Admin" role
3. Fill in your details and register
4. Check your email for verification (if enabled in Supabase)

### Creating a Student Account

1. Go to `/register`  
2. Select "Student" role
3. Fill in your details and register

### Admin Workflow

1. **Upload Materials**: Go to Materials > Upload Material
2. **Create Exams**: Go to Exams > Create Exam
   - Choose Question-based for multiple choice exams
   - Choose PDF-based to upload exam as PDF
3. **View Students**: Go to Students to see registered students

### Student Workflow

1. **View Materials**: Browse available materials and view PDFs
2. **Take Exams**: Select an exam and answer questions
3. **View Results**: See your score and review answers

## License

MIT
