import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import clsx from 'clsx'
import { generatePagination } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  disabled?: boolean
  className?: string
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
  className
}: PaginationProps) {
  const pages = generatePagination(currentPage, totalPages)

  if (totalPages <= 1) return null

  return (
    <div className={clsx("flex items-center justify-center gap-1 mt-6", className)}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1 || disabled}
        className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg disabled:opacity-50 disabled:pointer-events-none transition-colors"
        aria-label="Halaman sebelumnya"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {pages.map((page, index) => {
        if (page === '...') {
          return (
            <div key={`ellipsis-${index}`} className="px-2 text-slate-400 flex items-center justify-center">
              <MoreHorizontal className="w-4 h-4" />
            </div>
          )
        }

        return (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            disabled={disabled}
            className={clsx(
              "w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors disabled:opacity-50",
              currentPage === page
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-purple-50 hover:text-purple-600"
            )}
          >
            {page}
          </button>
        )
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages || disabled}
        className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg disabled:opacity-50 disabled:pointer-events-none transition-colors"
        aria-label="Halaman selanjutnya"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}
