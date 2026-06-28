import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  title: string
  subtitle?: string
  icon?: React.ComponentType<{ className?: string }>
  onClose: () => void
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export default function Modal({ title, subtitle, onClose, children, size = 'md' }: ModalProps) {
  const maxW = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-2xl' : 'max-w-xl'
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={cn('bg-white rounded-xl shadow-xl w-full max-h-[90vh] flex flex-col', maxW)}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3.5 shrink-0">
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ml-3 shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 mx-5" />

        {/* Content */}
        <div className="overflow-y-auto px-5 py-4 flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}

/* Shared form field styles — taille second bar */
export const fieldLabel = 'block text-xs font-medium text-gray-400 mb-1'
export const fieldInput = 'w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent transition-colors bg-white'
export const fieldSelect = 'w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent transition-colors bg-white appearance-none cursor-pointer'
export const fieldTextarea = 'w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent transition-colors bg-white resize-none'

export function FormFooter({ onCancel, saving, label = 'Enregistrer' }: { onCancel: () => void; saving: boolean; label?: string }) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-1">
      <button type="button" onClick={onCancel}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
        Annuler
      </button>
      <button type="submit" disabled={saving}
        className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
        {saving ? 'Enregistrement...' : label}
      </button>
    </div>
  )
}
