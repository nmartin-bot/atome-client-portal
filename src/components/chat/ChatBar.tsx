import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Paperclip, LayoutGrid, CircleDashed, SquareDashedMousePointer, Lightbulb, ArrowUp } from 'lucide-react'

const C = {
  primary: '#2D7DF6',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
}

interface ChatBarProps {
  onSend: (message: string) => void
  loading: boolean
  variant?: 'hero' | 'compact'
}

export default function ChatBar({ onSend, loading, variant = 'hero' }: ChatBarProps) {
  const [input, setInput] = useState('')
  const [activeTool, setActiveTool] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }, [])

  function handleSubmit() {
    if (!input.trim() || loading) return
    onSend(input.trim())
    setInput('')
    requestAnimationFrame(autoResize)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (variant === 'compact') {
    return (
      <div
        className="flex items-center gap-2 bg-white rounded-full px-4 py-2"
        style={{ border: '1.5px solid rgba(0,0,0,0.14)' }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écrivez votre message..."
          className="flex-1 outline-none bg-transparent text-sm"
          style={{ fontFamily: 'Inter, sans-serif', color: C.textPrimary }}
        />
        <button
          type="button"
          aria-label="Envoyer"
          onClick={handleSubmit}
          disabled={!input.trim() || loading}
          className="shrink-0 rounded-full bg-gray-900 text-white flex items-center justify-center disabled:opacity-40 transition-opacity"
          style={{ width: 30, height: 30 }}
        >
          {loading ? (
            <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
          ) : (
            <ArrowUp size={14} />
          )}
        </button>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Ghost shadow layer behind the bar */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: -28, background: '#F1F1F1', borderRadius: 24, zIndex: 0 }} />

      {/* Hint label peeking out from behind */}
      <div style={{ position: 'absolute', left: 18, bottom: -28, height: 28, zIndex: 1 }} className="flex items-center gap-2">
        {loading ? (
          <>
            <span className="w-3 h-3 rounded-full border-2 border-gray-300 border-t-gray-500 animate-spin" />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9ca3af' }}>Réflexion en cours...</span>
          </>
        ) : (
          <>
            <Lightbulb size={13} color="#9ca3af" strokeWidth={1.5} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9ca3af' }}>Parlez nous de votre projet</span>
          </>
        )}
      </div>

      {/* Main bar */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          background: '#FFFFFF',
          border: '1px solid rgba(0,0,0,0.10)',
          borderRadius: 20,
          boxShadow: '0 2px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
          padding: '14px 16px',
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => { setInput(e.target.value); autoResize() }}
          onKeyDown={handleKeyDown}
          placeholder="Décrivez votre situation..."
          rows={1}
          style={{
            width: '100%', border: 'none', outline: 'none', resize: 'none', background: 'transparent',
            fontFamily: 'Inter, sans-serif', fontSize: 15, color: C.textPrimary, minHeight: 52, lineHeight: 1.5,
          }}
        />
        <div className="flex items-center justify-between gap-3 mt-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Attach button */}
            <button
              type="button"
              aria-label="Joindre un fichier"
              style={{ width: 34, height: 34, borderRadius: 999, background: '#FFFFFF', border: '1.5px solid rgba(0,0,0,0.14)' }}
              className="flex items-center justify-center text-[#4a4a4a] hover:bg-[#f7f7f7] transition-colors shrink-0"
            >
              <Paperclip size={16} />
            </button>

            {/* Mode toggle pill with sliding indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#ECECEC', borderRadius: 999, padding: '1.5px', position: 'relative' }}>
              <motion.div
                style={{
                  position: 'absolute', width: 32, height: 32, borderRadius: 999, background: '#FFFFFF',
                  border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                  top: '50%', left: 0, marginTop: -16, zIndex: 0,
                }}
                animate={{ x: 1.5 + activeTool * 34 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
              {[LayoutGrid, CircleDashed, SquareDashedMousePointer].map((Icon, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label="Mode"
                  onClick={() => setActiveTool(i)}
                  style={{
                    width: 32, height: 32, borderRadius: 999, background: 'transparent', border: '1px solid transparent',
                    color: activeTool === i ? '#1a1a1a' : '#8a8a8a', transition: 'color 0.15s', zIndex: 1, position: 'relative',
                  }}
                  className="flex items-center justify-center shrink-0"
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* Send button — glossy blue */}
          <button
            type="button"
            aria-label="Envoyer"
            onClick={handleSubmit}
            disabled={!input.trim() || loading}
            className="send-btn"
            style={{
              position: 'relative', height: 36, padding: '0 20px', borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.9)',
              background: 'radial-gradient(120% 80% at 50% 18%, #4d9bff 0%, #8fc0ff 38%, #b8d8ff 70%, #dceaff 100%)',
              color: '#ffffff', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              boxShadow: '0 4px 10px rgba(45,125,246,0.30), inset 0 1px 1px rgba(255,255,255,0.9), inset 0 -4px 8px rgba(255,255,255,0.30)',
              transition: 'transform 0.15s, filter 0.15s',
              opacity: !input.trim() || loading ? 0.5 : 1,
            }}
          >
            <span style={{ position: 'absolute', top: 1, left: '50%', transform: 'translateX(-50%)', width: '65%', height: '40%', background: 'radial-gradient(60% 100% at 50% 0%, rgba(255,255,255,0.55), rgba(255,255,255,0))', pointerEvents: 'none', borderRadius: 999 }} />
            <span style={{ position: 'relative', zIndex: 1 }}>Envoyer</span>
          </button>
        </div>
      </div>

      <style>{`
        .send-btn:hover:not(:disabled) { transform: scale(1.03); filter: brightness(1.08); }
      `}</style>
    </div>
  )
}
