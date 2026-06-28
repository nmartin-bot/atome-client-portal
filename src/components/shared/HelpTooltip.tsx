import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HelpTooltipProps {
  id: string
  title: string
  description: string
  visual?: React.ReactNode
  className?: string
}

export default function HelpTooltip({ id, title, description, visual, className }: HelpTooltipProps) {
  const storageKey = `help_seen_${id}`
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSeen(!!localStorage.getItem(storageKey))
  }, [storageKey])

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function dismiss() {
    localStorage.setItem(storageKey, '1')
    setSeen(true)
    setOpen(false)
  }

  return (
    <div ref={ref} className={cn('relative inline-flex', className)}>
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold transition-colors',
          seen
            ? 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
        )}
        aria-label="Aide"
      >
        ?
      </button>

      {open && (
        <div className="absolute top-7 left-1/2 -translate-x-1/2 z-50 w-64">
          {/* Triangle pointer */}
          <div className="flex justify-center mb-1">
            <div className="w-3 h-2 overflow-hidden">
              <div className="w-3 h-3 bg-white border border-gray-200 rotate-45 -translate-y-1.5 mx-auto shadow-sm" />
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            {/* Visual */}
            {visual && (
              <div className="bg-gray-50 border-b border-gray-100 p-3">
                {visual}
              </div>
            )}

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h4 className="text-sm font-semibold text-gray-900 leading-snug">{title}</h4>
                <button onClick={dismiss} className="p-0.5 text-gray-300 hover:text-gray-500 shrink-0 -mt-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
              {!seen && (
                <button onClick={dismiss} className="mt-3 text-xs font-semibold text-gray-900 underline underline-offset-2">
                  Ne plus afficher
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
