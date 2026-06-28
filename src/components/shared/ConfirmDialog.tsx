import { AlertCircle, X } from 'lucide-react'

interface ConfirmDialogProps {
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  icon?: React.ComponentType<{ className?: string }>
  warning?: string
}

export default function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Supprimer',
  onConfirm,
  onCancel,
  icon: Icon,
  warning = 'Cette action est irréversible.',
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start gap-3 p-5">
          {Icon && (
            <span className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <Icon className="w-4.5 h-4.5 text-gray-600" />
            </span>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>
          </div>
          <button onClick={onCancel} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0 -mt-0.5 -mr-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-gray-200 mx-5" />

        {/* Warning banner */}
        <div className="mx-4 mt-4 flex items-center gap-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <p className="text-xs text-rose-700 font-medium">{warning}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 px-5 py-4">
          <button onClick={onCancel}
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-600 font-medium hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button onClick={onConfirm}
            className="flex-1 px-3 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium transition-colors">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
