interface TokenBarProps {
  balance: number
  quota?: number
}

export default function TokenBar({ balance, quota = 100 }: TokenBarProps) {
  const pct = Math.max(0, Math.min(100, (balance / quota) * 100))
  const color = balance === 0 ? 'bg-red-500' : balance < 20 ? 'bg-orange-500' : 'bg-blue-500'

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-gray-600">{balance} / {quota} tokens</span>
        <span className="text-xs text-gray-400">{Math.round(pct)}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
