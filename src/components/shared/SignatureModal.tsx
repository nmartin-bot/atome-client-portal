import { useRef, useState, useEffect } from 'react'
import { Eraser } from 'lucide-react'
import Modal from '@/components/shared/Modal'
import { createClient } from '@/lib/supabase/client'
import type { AtomeDocument } from '@/types'

interface SignatureModalProps {
  document: AtomeDocument
  onClose: () => void
  onSigned: () => void
}

export default function SignatureModal({ document: doc, onClose, onSigned }: SignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * ratio
    canvas.height = canvas.offsetHeight * ratio
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(ratio, ratio)
      ctx.strokeStyle = '#1A1A1A'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
  }, [])

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      const touch = e.touches[0]
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    drawingRef.current = true
    const ctx = canvasRef.current?.getContext('2d')
    const { x, y } = getPos(e)
    ctx?.beginPath()
    ctx?.moveTo(x, y)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawingRef.current) return
    const ctx = canvasRef.current?.getContext('2d')
    const { x, y } = getPos(e)
    ctx?.lineTo(x, y)
    ctx?.stroke()
    setHasDrawn(true)
  }

  function stopDraw() {
    drawingRef.current = false
  }

  function handleClear() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  async function handleValidate() {
    if (!hasDrawn || !canvasRef.current) return
    setSaving(true)
    setError(null)
    const signatureData = canvasRef.current.toDataURL('image/png')

    const supabase = createClient()
    const { error } = await supabase
      .from('documents')
      .update({ signed_at: new Date().toISOString(), signature_data: signatureData })
      .eq('id', doc.id)

    setSaving(false)
    if (error) {
      setError("Une erreur est survenue. Réessayez.")
      return
    }
    onSigned()
  }

  return (
    <Modal title="Signer le document" subtitle={doc.label} onClose={onClose} size="md">
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-40 cursor-crosshair touch-none"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
        </div>

        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Eraser className="w-3.5 h-3.5" /> Effacer
        </button>

        <p className="text-[11px] text-gray-400">
          En signant, j'accepte les conditions du document ci-dessus.
        </p>

        {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <button
          onClick={handleValidate}
          disabled={!hasDrawn || saving}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Valider ma signature'}
        </button>
      </div>
    </Modal>
  )
}
