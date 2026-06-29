interface TokenRingProps {
  balance: number
  quota?: number
  size?: number
  strokeWidth?: number
  children?: React.ReactNode
}

export default function TokenRing({ balance, quota = 100, size = 32, strokeWidth = 3, children }: TokenRingProps) {
  const pct = Math.max(0, Math.min(100, (balance / quota) * 100))
  const color = balance === 0 ? '#ef4444' : balance < 20 ? '#f97316' : '#3b82f6'
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.3s' }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}
