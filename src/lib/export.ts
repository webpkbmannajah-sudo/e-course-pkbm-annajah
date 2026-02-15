import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface ColumnDef {
    header: string
    key: string
    width?: number
}

/**
 * Generate Excel file from data
 * Returns a Uint8Array buffer
 */
export function generateExcel(
    data: Record<string, unknown>[],
    columns: ColumnDef[],
    sheetName: string = 'Report'
): Uint8Array {
    // Map data to column headers
    const mappedData = data.map((row) => {
        const obj: Record<string, unknown> = {}
        for (const col of columns) {
            obj[col.header] = row[col.key] ?? ''
        }
        return obj
    })

    const ws = XLSX.utils.json_to_sheet(mappedData)

    // Set column widths
    ws['!cols'] = columns.map((col) => ({ wch: col.width || 15 }))

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName)

    return XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as Uint8Array
}

/**
 * Generate PDF file from data
 * Returns a Uint8Array buffer
 */
export function generatePDF(
    data: Record<string, unknown>[],
    columns: ColumnDef[],
    title: string = 'Report'
): Uint8Array {
    const doc = new jsPDF()

    // Title
    doc.setFontSize(18)
    doc.text(title, 14, 22)

    // Subtitle with date
    doc.setFontSize(10)
    doc.setTextColor(128)
    doc.text(`Generated: ${new Date().toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })}`, 14, 30)

    // Table
    const headers = columns.map((col) => col.header)
    const rows = data.map((row) =>
        columns.map((col) => String(row[col.key] ?? ''))
    )

    autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 36,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: {
            fillColor: [88, 28, 135], // purple-900
            textColor: [255, 255, 255],
            fontStyle: 'bold',
        },
        alternateRowStyles: { fillColor: [245, 243, 255] }, // purple-50
        margin: { top: 36, left: 14, right: 14 },
    })

    return doc.output('arraybuffer') as unknown as Uint8Array
}

// ---- Column definitions for different report types ----

export const examReportColumns: ColumnDef[] = [
    { header: 'Nama Siswa', key: 'student_name', width: 25 },
    { header: 'Email', key: 'student_email', width: 30 },
    { header: 'Skor', key: 'score', width: 10 },
    { header: 'Persentase', key: 'percentage', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Tanggal', key: 'graded_at', width: 20 },
]

export const studentReportColumns: ColumnDef[] = [
    { header: 'Ujian', key: 'exam_title', width: 30 },
    { header: 'Skor', key: 'total_score', width: 10 },
    { header: 'Persentase', key: 'percentage', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Tanggal', key: 'graded_at', width: 20 },
]

export const overviewReportColumns: ColumnDef[] = [
    { header: 'Ujian', key: 'exam_title', width: 30 },
    { header: 'Total Peserta', key: 'total_attempts', width: 15 },
    { header: 'Rata-rata Skor', key: 'avg_score', width: 15 },
    { header: 'Tingkat Kelulusan', key: 'pass_rate', width: 18 },
]
