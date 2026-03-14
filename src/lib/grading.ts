// Phase 3: Auto-grading library for MCQ exams

import { ScoreBreakdownItem } from '@/types'

interface QuestionWithChoices {
    id: string
    question_text: string
    weight: number
    question_type: string
    explanation?: string | null
    choices: {
        id: string
        choice_text: string
        is_correct: boolean
    }[]
}

interface GradingResult {
    totalScore: number
    maxScore: number
    percentage: number
    isPassed: boolean
    breakdown: ScoreBreakdownItem[]
}

/**
 * Calculate auto-score for an MCQ exam attempt.
 * Compares student answers with correct choices, applying question weights.
 */
export function calculateAutoScore(
    answers: Record<string, string>, // question_id -> choice_id
    questions: QuestionWithChoices[]
): GradingResult {
    const breakdown = generateScoreBreakdown(answers, questions)
    const { totalScore, maxScore } = calculateWeightedScore(breakdown)
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 10000) / 100 : 0
    // KKM active — minimum passing score is 75%
    const isPassed = determinePassStatus(percentage)

    return {
        totalScore,
        maxScore,
        percentage,
        isPassed,
        breakdown,
    }
}

/**
 * Calculate weighted score from breakdown items.
 * Each question's weight contributes to the total if answered correctly.
 */
export function calculateWeightedScore(
    breakdown: ScoreBreakdownItem[]
): { totalScore: number; maxScore: number } {
    let totalScore = 0
    let maxScore = 0

    for (const item of breakdown) {
        maxScore += item.weight
        if (item.is_correct) {
            totalScore += item.weight
        }
    }

    return {
        totalScore: Math.round(totalScore * 100) / 100,
        maxScore: Math.round(maxScore * 100) / 100,
    }
}

/**
 * Generate per-question score breakdown.
 * For each question: records whether student answered correctly,
 * the selected vs correct choice, and the question weight.
 */
export function generateScoreBreakdown(
    answers: Record<string, string>,
    questions: QuestionWithChoices[]
): ScoreBreakdownItem[] {
    return questions
        .filter(q => q.question_type === 'mcq') // Only grade MCQ questions
        .map(question => {
            const selectedChoiceId = answers[question.id] || null
            const correctChoice = question.choices.find(c => c.is_correct)
            const selectedChoice = selectedChoiceId
                ? question.choices.find(c => c.id === selectedChoiceId)
                : null

            return {
                question_id: question.id,
                question_text: question.question_text,
                weight: question.weight || 1.0,
                is_correct: selectedChoiceId !== null && selectedChoiceId === correctChoice?.id,
                selected_choice_id: selectedChoiceId,
                correct_choice_id: correctChoice?.id || '',
                selected_choice_text: selectedChoice?.choice_text || null,
                correct_choice_text: correctChoice?.choice_text || '',
                explanation: question.explanation || null,
            }
        })
}

/**
 * Determines pass/fail status based on KKM threshold.
 * Default passing score is 75%.
 */
export function determinePassStatus(
    percentage: number,
    passingScore: number = 75
): boolean {
    return percentage >= passingScore
}
