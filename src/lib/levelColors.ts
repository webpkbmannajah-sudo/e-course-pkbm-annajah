/**
 * Shared utility for consistent package level colors across admin & student pages.
 * 
 * Paket A (sd)  → Red
 * Paket B (smp) → Green/Emerald
 * Paket C (sma) → Yellow/Amber
 */

/** Returns badge classes for a level name like "Paket A", "Paket B", "Paket C" */
export function getLevelBadgeClass(levelName?: string | null): string {
    const name = (levelName || '').toLowerCase()
    if (name.includes('paket a') || name === 'sd') {
        return 'bg-red-50 text-red-600 border border-red-200'
    }
    if (name.includes('paket b') || name === 'smp') {
        return 'bg-emerald-50 text-emerald-600 border border-emerald-200'
    }
    if (name.includes('paket c') || name === 'sma') {
        return 'bg-amber-50 text-amber-600 border border-amber-200'
    }
    return 'bg-slate-100 text-slate-600 border border-slate-200'
}

/** Returns display label for education_level slug */
export function getLevelLabel(slug?: string | null): string {
    switch (slug) {
        case 'sd': return 'Paket A'
        case 'smp': return 'Paket B'
        case 'sma': return 'Paket C'
        default: return slug?.toUpperCase() || 'Tidak diketahui'
    }
}

/** Returns theme variables for student-facing pages (card hover, title hover, etc.) */
export function getStudentThemeVars(level: string | null) {
    switch (level) {
        case 'sd': return {
            titleHover: 'group-hover:text-red-600',
            badge: 'bg-red-50 text-red-600 border-red-200',
            iconBase: 'text-red-500',
            linkHover: 'text-red-600 hover:text-red-700',
            cardHover: 'hover:border-red-300',
            arrowHover: 'text-slate-500 group-hover:text-red-500 group-hover:translate-x-1',
        }
        case 'smp': return {
            titleHover: 'group-hover:text-emerald-600',
            badge: 'bg-emerald-50 text-emerald-600 border-emerald-200',
            iconBase: 'text-emerald-500',
            linkHover: 'text-emerald-600 hover:text-emerald-700',
            cardHover: 'hover:border-emerald-300',
            arrowHover: 'text-slate-500 group-hover:text-emerald-500 group-hover:translate-x-1',
        }
        case 'sma':
        default: return {
            titleHover: 'group-hover:text-amber-600',
            badge: 'bg-amber-50 text-amber-600 border-amber-200',
            iconBase: 'text-amber-500',
            linkHover: 'text-amber-600 hover:text-amber-700',
            cardHover: 'hover:border-amber-300',
            arrowHover: 'text-slate-500 group-hover:text-amber-500 group-hover:translate-x-1',
        }
    }
}
