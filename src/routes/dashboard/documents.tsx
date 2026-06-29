import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useProject } from '@/lib/projectContext'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import DocRow from '@/components/shared/DocRow'
import SignatureModal from '@/components/shared/SignatureModal'
import DocumentPreviewModal from '@/components/shared/DocumentPreviewModal'
import type { AtomeDocument } from '@/types'

export const Route = createFileRoute('/dashboard/documents')({
  component: DocumentsPage,
})

const CONTRACTUAL_TYPES: AtomeDocument['type'][] = ['devis', 'contrat']

function DocumentsPage() {
  const { activeProject, loading: projectLoading } = useProject()
  const [documents, setDocuments] = useState<AtomeDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState<AtomeDocument | null>(null)
  const [previewing, setPreviewing] = useState<AtomeDocument | null>(null)

  async function fetchDocuments() {
    if (!activeProject) { setLoading(false); return }
    const supabase = createClient()
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', activeProject.id)
      .order('created_at', { ascending: false })
    setDocuments(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchDocuments()
  }, [activeProject])

  if (projectLoading || loading) {
    return (
      <div className="h-full flex flex-col">
        <PageHeader pathItems={[{ label: 'Documents' }]} />
        <div className="p-6 space-y-3 animate-pulse">
          <div className="h-16 bg-gray-100 rounded-xl" />
          <div className="h-16 bg-gray-100 rounded-xl" />
          <div className="h-16 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!activeProject || documents.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <PageHeader pathItems={[{ label: 'Documents' }]} />
        <div className="flex-1 overflow-y-auto">
          <EmptyState
            title="Aucun document"
            description="Vos documents apparaîtront ici dès le démarrage du projet."
            variant="table"
          />
        </div>
      </div>
    )
  }

  const contractual = documents.filter(d => CONTRACTUAL_TYPES.includes(d.type))
  const invoices = documents.filter(d => !CONTRACTUAL_TYPES.includes(d.type))

  return (
    <div className="h-full flex flex-col">
      <PageHeader pathItems={[{ label: 'Documents' }]} />
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {contractual.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-gray-900 mb-3">Documents contractuels</h2>
            <div className="space-y-2">
              {contractual.map(doc => (
                <DocRow
                  key={doc.id}
                  document={doc}
                  needsSignature={doc.type === 'contrat' && !doc.signed_at}
                  onSign={() => setSigning(doc)}
                  onPreview={() => setPreviewing(doc)}
                />
              ))}
            </div>
          </div>
        )}

        {invoices.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-gray-900 mb-3">Factures</h2>
            <div className="space-y-2">
              {invoices.map(doc => (
                <DocRow
                  key={doc.id}
                  document={doc}
                  needsSignature={false}
                  onSign={() => {}}
                  onPreview={() => setPreviewing(doc)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {signing && (
        <SignatureModal
          document={signing}
          onClose={() => setSigning(null)}
          onSigned={() => { setSigning(null); fetchDocuments() }}
        />
      )}

      {previewing && (
        <DocumentPreviewModal document={previewing} onClose={() => setPreviewing(null)} />
      )}
    </div>
  )
}
