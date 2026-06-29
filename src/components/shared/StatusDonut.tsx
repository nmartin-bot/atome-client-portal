interface Segment {
  value: number
  color: string
}

export default function StatusDonut({ segments, size = 140, strokeWidth = 16 }: { segments: Segment[]; size?: number; strokeWidth?: number }) {
  const visible = segments.filter(seg => seg.value > 0)
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const gap = visible.length > 1 ? strokeWidth + 6 : 0
  let cumulative = 0

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {visible.map((seg, i) => {
        const fraction = seg.value / total
        const fullDash = fraction * circumference
        const dash = Math.max(0, fullDash - gap)
        const offset = circumference - (cumulative + gap / 2)
        cumulative += fullDash
        return (
          <circle
            key={i}
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={seg.color} strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )
      })}
    </svg>
  )
}
