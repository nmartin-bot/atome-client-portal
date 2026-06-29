import { cn } from '@/lib/utils'

type Status =
  | 'active' | 'paused' | 'delivered'
  | 'pending' | 'done'
  | 'open' | 'in_progress' | 'closed'
  | 'signed' | 'paid' | 'to_sign'

const LABELS: Record<Status, string> = {
  active: 'Actif',
  paused: 'En pause',
  delivered: 'Livré',
  pending: 'En attente',
  done: 'Terminé',
  open: 'Ouvert',
  in_progress: 'En cours',
  closed: 'Résolu',
  signed: 'Signé',
  paid: 'Payée',
  to_sign: 'À signer',
}

const COLORS: Record<Status, string> = {
  active: 'bg-green-50 text-green-700',
  paused: 'bg-orange-50 text-orange-700',
  delivered: 'bg-blue-50 text-blue-700',
  pending: 'bg-gray-100 text-gray-500',
  done: 'bg-green-50 text-green-700',
  open: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-orange-50 text-orange-700',
  closed: 'bg-green-50 text-green-700',
  signed: 'bg-green-50 text-green-700',
  paid: 'bg-green-50 text-green-700',
  to_sign: 'bg-orange-50 text-orange-700',
}

export default function StatusPill({ status, className }: { status: Status; className?: string }) {
  return (
    <span className={cn('inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full', COLORS[status], className)}>
      {LABELS[status]}
    </span>
  )
}
