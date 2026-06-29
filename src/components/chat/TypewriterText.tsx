import { useEffect, useState } from 'react'

interface TypewriterTextProps {
  text: string
  speed?: number
  onDone?: () => void
}

export default function TypewriterText({ text, speed = 12, onDone }: TypewriterTextProps) {
  const [shown, setShown] = useState('')

  useEffect(() => {
    setShown('')
    let i = 0
    const interval = setInterval(() => {
      i++
      setShown(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(interval)
        onDone?.()
      }
    }, speed)
    return () => clearInterval(interval)
  }, [text])

  return <>{shown}</>
}
