import { cn } from '@/lib/utils'
import StatusPill from '@/components/shared/StatusPill'
import type { ProjectStep } from '@/types'

const DOT_COLORS: Record<ProjectStep['status'], string> = {
  pending: 'bg-gray-300',
  active: 'bg-blue-500',
  done: 'bg-green-500',
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ProjectTimeline({ steps }: { steps: ProjectStep[] }) {
  const sorted = [...steps].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="space-y-0">
      {sorted.map((step, i) => (
        <div key={step.id} className="flex gap-4">
          {/* Point + ligne */}
          <div className="flex flex-col items-center">
            <span
              className={cn(
                'w-3 h-3 rounded-full shrink-0',
                DOT_COLORS[step.status],
                step.status === 'active' && 'animate-pulse'
              )}
            />
            {i < sorted.length - 1 && <div className="w-px flex-1 bg-gray-100 my-1" />}
          </div>

          {/* Contenu */}
          <div className="flex-1 pb-6">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900">{step.title}</p>
              <StatusPill status={step.status} />
            </div>
            {step.description && <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>}
            {step.completed_at && (
              <p className="text-xs text-gray-400 mt-1">Terminé le {formatDate(step.completed_at)}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
