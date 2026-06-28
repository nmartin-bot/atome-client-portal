import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title: string
  description: string
  action?: { label: string; onClick: () => void }
  variant?: 'table' | 'cards' | 'kanban' | 'list' | 'calendar'
  ghostOpacity?: number
  className?: string
}

function GhostTable() {
  return (
    <div className="w-full max-w-lg mx-auto pointer-events-none select-none">
      <div className="border border-gray-300 rounded-xl overflow-hidden">
        <div className="border-b border-gray-200 flex gap-4 px-5 py-3 bg-gray-100">
          <div className="w-3 h-3 rounded bg-gray-300" />
          <div className="h-3 rounded bg-gray-300 w-24" />
          <div className="h-3 rounded bg-gray-300 w-20 ml-auto" />
          <div className="h-3 rounded bg-gray-300 w-16" />
        </div>
        {[1, 0.6, 0.3].map((op, i) => (
          <div key={i} className="border-b border-gray-100 flex gap-4 px-5 py-3.5 items-center" style={{ opacity: op }}>
            <div className="w-3 h-3 rounded bg-gray-200" />
            <div className="w-6 h-6 rounded-md bg-gray-200 shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="h-2.5 rounded bg-gray-200" style={{ width: `${50 + i * 15}%` }} />
              <div className="h-2 rounded bg-gray-100 w-1/3" />
            </div>
            <div className="h-2.5 rounded bg-gray-100 w-16" />
            <div className="h-2.5 rounded bg-gray-100 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}

function GhostCards() {
  return (
    <div className="flex gap-4 justify-center pointer-events-none select-none">
      {[1, 0.5].map((op, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-5 w-52 bg-white" style={{ opacity: op }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-gray-200 shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="h-2.5 rounded bg-gray-200 w-3/4" />
              <div className="h-2 rounded bg-gray-100 w-1/2" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-2 rounded bg-gray-200 w-full" />
            <div className="h-2 rounded bg-gray-100 w-4/5" />
            <div className="h-2 rounded bg-gray-100 w-2/3" />
          </div>
          <div className="mt-4 flex gap-2">
            <div className="h-6 rounded-lg bg-gray-200 w-16" />
            <div className="h-6 rounded-lg bg-gray-100 w-12" />
          </div>
        </div>
      ))}
    </div>
  )
}

function GhostKanban() {
  return (
    <div className="flex gap-3 justify-center pointer-events-none select-none">
      {[
        { op: 1, cards: 3 },
        { op: 0.55, cards: 2 },
        { op: 0.25, cards: 1 },
      ].map(({ op, cards }, i) => (
        <div key={i} className="w-40 border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50" style={{ opacity: op }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-gray-300" />
            <div className="h-2.5 rounded bg-gray-300 flex-1" />
            <div className="h-4 rounded-full bg-gray-200 w-5" />
          </div>
          {Array.from({ length: cards }).map((_, j) => (
            <div key={j} className="border border-gray-200 rounded-lg p-2.5 space-y-1.5 bg-white">
              <div className="h-2 rounded bg-gray-200 w-full" />
              <div className="h-2 rounded bg-gray-100 w-3/4" />
              <div className="h-4 rounded bg-gray-100 w-10 mt-1" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function GhostList() {
  return (
    <div className="w-full max-w-lg mx-auto pointer-events-none select-none space-y-2.5">
      {[1, 0.55, 0.25].map((op, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-4 flex gap-4 items-center bg-white" style={{ opacity: op }}>
          <div className="w-10 h-10 rounded-lg bg-gray-200 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 rounded bg-gray-200" style={{ width: `${60 + i * 10}%` }} />
            <div className="h-2 rounded bg-gray-100 w-2/5" />
          </div>
          <div className="h-6 rounded-full bg-gray-200 w-16" />
          <div className="h-6 rounded-lg bg-gray-100 w-10" />
        </div>
      ))}
    </div>
  )
}

function GhostCalendar() {
  const cols = 7
  const rows = 5
  return (
    <div className="w-full max-w-lg mx-auto pointer-events-none select-none">
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        {/* day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((_d, i) => (
            <div key={i} className="py-2 text-center">
              <div className="h-2 rounded bg-gray-200 w-3 mx-auto" />
            </div>
          ))}
        </div>
        {/* grid */}
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="grid grid-cols-7 border-b border-gray-50" style={{ opacity: 1 - r * 0.18 }}>
            {Array.from({ length: cols }).map((_, c) => {
              const hasEvent = (r === 0 && c === 1) || (r === 1 && c === 4) || (r === 2 && c === 2)
              return (
                <div key={c} className="p-1.5 min-h-[40px]">
                  <div className="h-2 rounded bg-gray-100 w-4 mb-1" />
                  {hasEvent && <div className="h-3 rounded bg-gray-200 w-full mt-1" />}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

const GHOST: Record<NonNullable<EmptyStateProps['variant']>, React.ReactNode> = {
  table: <GhostTable />,
  cards: <GhostCards />,
  kanban: <GhostKanban />,
  list: <GhostList />,
  calendar: <GhostCalendar />,
}

export default function EmptyState({ title, description, action, variant = 'table', ghostOpacity, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center h-full min-h-[400px] px-8', className)}>
      <div className="w-full mb-8" style={ghostOpacity !== undefined ? { opacity: ghostOpacity } : undefined}>
        {GHOST[variant]}
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1.5">{title}</h3>
      <p className="text-sm text-gray-400 text-center max-w-sm mb-6">{description}</p>
      {action && (
        <button onClick={action.onClick}
          className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-3.5 h-3.5" />{action.label}
        </button>
      )}
    </div>
  )
}
