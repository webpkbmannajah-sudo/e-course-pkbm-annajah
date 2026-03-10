// Export utilities for admin reports — Excel only (per PRD)

import * as XLSX from 'xlsx'

export interface ColumnDef {
    key: string
    label: string
    width?: number
}

// Column definitions for different report types
export const examReportColumns: ColumnDef[] = [
    { key: 'student_name', label: 'Nama Siswa', width: 25 },
    { key: 'student_email', label: 'Email', width: 25 },
    { key: 'score', label: 'Skor', width: 10 },
    { key: 'percentage', label: 'Persentase', width: 15 },
    { key: 'status', label: 'Status', width: 15 },
    { key: 'graded_at', label: 'Tanggal Penilaian', width: 20 },
]

export const studentReportColumns: ColumnDef[] = [
    { key: 'exam_title', label: 'Judul Ujian', width: 30 },
    { key: 'total_score', label: 'Skor Total', width: 15 },
    { key: 'percentage', label: 'Persentase', width: 15 },
    { key: 'status', label: 'Status', width: 15 },
    { key: 'graded_at', label: 'Tanggal Penilaian', width: 20 },
]

export const overviewReportColumns: ColumnDef[] = [
    { key: 'exam_title', label: 'Judul Ujian', width: 30 },
    { key: 'total_attempts', label: 'Total Peserta', width: 15 },
    { key: 'avg_score', label: 'Rata-rata Skor', width: 15 },
    { key: 'pass_rate', label: 'Tingkat Kelulusan', width: 20 },
]

/**
 * Generate an Excel file from data and column definitions.
 * Returns a Uint8Array that can be downloaded as .xlsx
 */
export function generateExcel(
    data: Record<string, unknown>[],
    columns: ColumnDef[],
    title: string = 'Laporan'
): Uint8Array {
    const headers = columns.map(c => c.label)
    const rows = data.map(row =>
        columns.map(col => {
            const val = row[col.key]
            return val !== null && val !== undefined ? String(val) : ''
        })
    )

    const wsData = [headers, ...rows]
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Set column widths
    ws['!cols'] = columns.map(col => ({ wch: col.width || 15 }))

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, title)

    return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as Uint8Array
}

/**
 * Trigger download of a file in the browser
 */
export function downloadFile(data: Uint8Array, filename: string) {
    const blob = new Blob([data.buffer as ArrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}
