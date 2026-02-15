import { ScoreBreakdownItem } from '@/types'

/**
 * Calculate question difficulty from score breakdowns
 * Returns per-question correct rate
 */
export function getQuestionDifficulty(
    breakdowns: ScoreBreakdownItem[][]
): { question_id: string; question_text: string; correct_rate: number; total: number }[] {
    const questionMap = new Map<string, { text: string; correct: number; total: number }>()

    for (const breakdown of breakdowns) {
        for (const item of breakdown) {
            const existing = questionMap.get(item.question_id)
            if (existing) {
                existing.total += 1
                if (item.is_correct) existing.correct += 1
            } else {
                questionMap.set(item.question_id, {
                    text: item.question_text,
                    correct: item.is_correct ? 1 : 0,
                    total: 1,
                })
            }
        }
    }

    return Array.from(questionMap.entries()).map(([id, data]) => ({
        question_id: id,
        question_text: data.text,
        correct_rate: Math.round((data.correct / data.total) * 100 * 100) / 100,
        total: data.total,
    }))
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number | null): string {
    if (value === null || value === undefined) return '-'
    return `${Number(value).toFixed(1)}%`
}

/**
 * Format score for display
 */
export function formatScore(value: number | null): string {
    if (value === null || value === undefined) return '-'
    return Number(value).toFixed(1)
}

/**
 * Get chart color palette
 */
export function getChartColors(count: number): { bg: string[]; border: string[] } {
    const palette = [
        { bg: 'rgba(168, 85, 247, 0.5)', border: 'rgb(168, 85, 247)' },   // purple
        { bg: 'rgba(59, 130, 246, 0.5)', border: 'rgb(59, 130, 246)' },    // blue
        { bg: 'rgba(16, 185, 129, 0.5)', border: 'rgb(16, 185, 129)' },    // emerald
        { bg: 'rgba(245, 158, 11, 0.5)', border: 'rgb(245, 158, 11)' },    // amber
        { bg: 'rgba(239, 68, 68, 0.5)', border: 'rgb(239, 68, 68)' },      // red
        { bg: 'rgba(14, 165, 233, 0.5)', border: 'rgb(14, 165, 233)' },    // sky
        { bg: 'rgba(236, 72, 153, 0.5)', border: 'rgb(236, 72, 153)' },    // pink
        { bg: 'rgba(34, 197, 94, 0.5)', border: 'rgb(34, 197, 94)' },      // green
        { bg: 'rgba(249, 115, 22, 0.5)', border: 'rgb(249, 115, 22)' },    // orange
        { bg: 'rgba(99, 102, 241, 0.5)', border: 'rgb(99, 102, 241)' },    // indigo
    ]

    const bg: string[] = []
    const border: string[] = []
    for (let i = 0; i < count; i++) {
        const color = palette[i % palette.length]
        bg.push(color.bg)
        border.push(color.border)
    }
    return { bg, border }
}

/**
 * Dark theme config for Chart.js
 */
export const chartDarkTheme = {
    color: 'rgb(148, 163, 184)',     // slate-400
    borderColor: 'rgb(51, 65, 85)',  // slate-700
    gridColor: 'rgba(51, 65, 85, 0.5)',
}
