import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import Modal from '@/components/shared/Modal'
import { createClient } from '@/lib/supabase/client'
import type { AtomeDocument } from '@/types'

interface DocumentPreviewModalProps {
  document: AtomeDocument
  onClose: () => void
}

export default function DocumentPreviewModal({ document: doc, onClose }: DocumentPreviewModalProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchUrl() {
      if (!doc.storage_path) { setLoading(false); setError(true); return }
      const supabase = createClient()
      const { data, error } = await supabase.storage.from('documents').createSignedUrl(doc.storage_path, 3600)
      if (error || !data?.signedUrl) { setError(true) } else { setUrl(data.signedUrl) }
      setLoading(false)
    }
    fetchUrl()
  }, [doc])

  return (
    <Modal title="Aperçu du document" subtitle={doc.label} onClose={onClose} size="lg">
      <div className="space-y-3">
        {loading && <p className="text-sm text-gray-400 text-center py-12">Chargement...</p>}
        {!loading && error && (
          <p className="text-sm text-gray-400 text-center py-12">Aucun fichier disponible pour ce document.</p>
        )}
        {!loading && url && (
          <>
            <iframe src={url} className="w-full h-[70vh] rounded-lg border border-gray-100" title={doc.label} />
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Ouvrir dans un nouvel onglet
            </a>
          </>
        )}
      </div>
    </Modal>
  )
}
