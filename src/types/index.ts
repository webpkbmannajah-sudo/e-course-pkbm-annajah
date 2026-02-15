// Database types for the Course Management System

export type UserRole = 'student' | 'admin'

export interface User {
    id: string
    email: string
    name: string
    role: UserRole
    avatar_url?: string
    phone?: string
    last_login_at?: string
    is_active?: boolean
    created_at: string
}

export interface LoginHistory {
    id: string
    user_id: string
    login_at: string
    ip_address?: string
    user_agent?: string
    status: 'success' | 'failed'
    failure_reason?: string
}

export interface AuditLog {
    id: string
    user_id: string
    action: string
    entity_type?: string
    entity_id?: string
    details?: Record<string, unknown>
    created_at: string
}

export interface Material {
    id: string
    title: string
    description: string | null
    file_url: string
    file_name: string
    uploaded_by: string
    created_at: string
}

export type ExamType = 'pdf' | 'questions'

export interface Exam {
    id: string
    title: string
    description: string | null
    type: ExamType
    pdf_url: string | null
    created_by: string
    created_at: string
    questions?: Question[]
}

export interface Question {
    id: string
    exam_id: string
    question_text: string
    order_number: number
    weight?: number
    question_type?: 'mcq' | 'essay'
    choices?: Choice[]
}

export interface Choice {
    id: string
    question_id: string
    choice_text: string
    is_correct: boolean
}

export interface ExamAttempt {
    id: string
    user_id: string
    exam_id: string
    answers: Record<string, string> // question_id -> choice_id
    score: number | null
    submitted_at: string
}

// Scoring types (Phase 3)
export interface Score {
    id: string
    attempt_id: string
    exam_id: string
    user_id: string
    total_score: number
    max_score: number
    percentage: number
    is_passed: boolean
    grading_type: 'auto' | 'manual' | 'mixed'
    graded_at: string
    breakdown: ScoreBreakdownItem[]
}

export interface ScoreBreakdownItem {
    question_id: string
    question_text: string
    weight: number
    is_correct: boolean
    selected_choice_id: string | null
    correct_choice_id: string
    selected_choice_text: string | null
    correct_choice_text: string
}

// Form types
export interface MaterialFormData {
    title: string
    description: string
    file: File | null
}

export interface ExamFormData {
    title: string
    description: string
    type: ExamType
    file?: File | null
    questions?: QuestionFormData[]
}

export interface QuestionFormData {
    question_text: string
    choices: ChoiceFormData[]
}

export interface ChoiceFormData {
    choice_text: string
    is_correct: boolean
}

// Analytics types (Phase 4)
export interface PlatformOverview {
    total_students: number
    total_exams: number
    total_question_exams: number
    total_attempts: number
    total_graded: number
    avg_platform_score: number | null
    overall_pass_rate: number | null
    total_materials: number
}

export interface ExamStats {
    total_attempts: number
    avg_score: number | null
    max_score: number | null
    min_score: number | null
    pass_count: number
    fail_count: number
    pass_rate: number | null
}

export interface ScoreDistribution {
    score_range: string
    count: number
}

export interface ExamAnalytics {
    exam: Exam
    stats: ExamStats
    distribution: ScoreDistribution[]
    attempts: ExamAttemptWithStudent[]
}

export interface ExamAttemptWithStudent {
    id: string
    user_id: string
    exam_id: string
    student_name: string
    student_email: string
    score: number | null
    percentage: number | null
    is_passed: boolean | null
    submitted_at: string
    graded_at: string | null
}

export interface StudentPerformance {
    total_exams_taken: number
    avg_score: number | null
    highest_score: number | null
    lowest_score: number | null
    pass_count: number
    fail_count: number
    total_exams_available: number
}

export interface StudentAnalytics {
    student: User
    performance: StudentPerformance
    score_history: ScoreWithExam[]
}

export interface ScoreWithExam extends Score {
    exam_title: string
}

export type ExportFormat = 'excel' | 'pdf'
export type ReportType = 'exam' | 'student' | 'overview'
