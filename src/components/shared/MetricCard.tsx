import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string
  subtext?: string
  color?: 'gray' | 'amber' | 'green'
  children?: React.ReactNode
}

const VALUE_COLORS: Record<NonNullable<MetricCardProps['color']>, string> = {
  gray: 'text-gray-900',
  amber: 'text-amber-600',
  green: 'text-green-600',
}

export default function MetricCard({ label, value, subtext, color = 'gray', children }: MetricCardProps) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={cn('text-2xl font-semibold mt-1', VALUE_COLORS[color])}>{value}</p>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      {children}
    </div>
  )
}
