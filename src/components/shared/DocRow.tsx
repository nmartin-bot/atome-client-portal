import { FileSignature, Receipt, FileText, Download, Eye, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import StatusPill from '@/components/shared/StatusPill'
import type { AtomeDocument } from '@/types'

const ICONS: Record<AtomeDocument['type'], React.ComponentType<{ className?: string }>> = {
  devis: FileSignature,
  contrat: FileSignature,
  facture_acompte: Receipt,
  facture_solde: Receipt,
  autre: FileText,
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatAmount(value: number) {
  return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' € HT'
}

interface DocRowProps {
  document: AtomeDocument
  needsSignature: boolean
  onSign: () => void
  onPreview: () => void
  onDelete?: () => void
}

export default function DocRow({ document: doc, needsSignature, onSign, onPreview, onDelete }: DocRowProps) {
  const Icon = ICONS[doc.type]
  const isInvoice = doc.type === 'facture_acompte' || doc.type === 'facture_solde'

  const status = needsSignature ? 'to_sign' : doc.signed_at ? 'signed' : isInvoice ? (doc.paid_at ? 'paid' : 'pending') : 'pending'

  async function handleDownload() {
    if (!doc.storage_path) return
    const supabase = createClient()
    const { data } = await supabase.storage.from('documents').createSignedUrl(doc.storage_path, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 border border-gray-100 rounded-xl bg-white">
      <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-gray-500" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{doc.label}</p>
        <p className="text-xs text-gray-400">{formatDate(doc.created_at)}</p>
      </div>

      {doc.amount_ht !== null && (
        <span className="text-sm text-gray-600 shrink-0">{formatAmount(doc.amount_ht)}</span>
      )}

      {doc.type !== 'devis' && <StatusPill status={status} className="shrink-0" />}

      <div className="flex items-center gap-1 shrink-0">
        {doc.storage_path && (
          <>
            <button
              onClick={onPreview}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Aperçu"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Télécharger"
            >
              <Download className="w-4 h-4" />
            </button>
          </>
        )}
        {needsSignature && (
          <button
            onClick={onSign}
            className="text-xs font-medium bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            Signer
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
