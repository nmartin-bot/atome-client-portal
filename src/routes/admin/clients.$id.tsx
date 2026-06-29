import { createFileRoute } from '@tanstack/react-router'
import { Fragment, useEffect, useState } from 'react'
import { Upload, ChevronDown, ChevronUp, Check, FolderKanban, FileText, Edit3, Zap, Headphones, Lock, Plus, Eye, Download, Trash2, Globe, Server, Key, Box, Copy, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/layout/PageHeader'
import Modal from '@/components/shared/Modal'
import DocumentPreviewModal from '@/components/shared/DocumentPreviewModal'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StatusPill from '@/components/shared/StatusPill'
import TokenRing from '@/components/shared/TokenRing'
import { cn } from '@/lib/utils'
import { BRIEF_SECTIONS, stripDashes } from '@/lib/briefSections'
import type { Client, Project, ProjectStep, AtomeDocument, ProjectBrief, VaultCredential, TokenLedgerEntry, SavTicket } from '@/types'

export const Route = createFileRoute('/admin/clients/$id')({
  component: AdminClientDetailPage,
})

type Tab = 'projet' | 'documents' | 'brief' | 'tokens' | 'sav' | 'vault'

const TABS: { id: Tab; label: string; color: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'projet', label: 'Projet', color: 'bg-blue-500', icon: FolderKanban },
  { id: 'documents', label: 'Documents', color: 'bg-green-500', icon: FileText },
  { id: 'brief', label: 'Brief', color: 'bg-violet-500', icon: Edit3 },
  { id: 'tokens', label: 'Tokens', color: 'bg-cyan-400', icon: Zap },
  { id: 'sav', label: 'SAV', color: 'bg-rose-400', icon: Headphones },
  { id: 'vault', label: 'Vault', color: 'bg-orange-400', icon: Lock },
]

const DOC_TYPE_LABELS: Record<AtomeDocument['type'], string> = {
  devis: 'Devis',
  contrat: 'Contrat',
  facture_acompte: 'Facture acompte',
  facture_solde: 'Facture solde',
  autre: 'Autre',
}

function AdminClientDetailPage() {
  const { id } = Route.useParams()
  const [client, setClient] = useState<Client | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [tab, setTab] = useState<Tab>('projet')
  const [showTabMenu, setShowTabMenu] = useState(false)

  const [documents, setDocuments] = useState<AtomeDocument[]>([])
  const [docsLoading, setDocsLoading] = useState(true)
  const [showDocForm, setShowDocForm] = useState(false)
  const [editingDoc, setEditingDoc] = useState<AtomeDocument | null>(null)
  const [previewing, setPreviewing] = useState<AtomeDocument | null>(null)
  const [deleting, setDeleting] = useState<AtomeDocument | null>(null)

  const [showTokenForm, setShowTokenForm] = useState(false)
  const [tokenRefreshKey, setTokenRefreshKey] = useState(0)

  const [showStepForm, setShowStepForm] = useState(false)
  const [stepRefreshKey, setStepRefreshKey] = useState(0)

  const [showVaultForm, setShowVaultForm] = useState(false)
  const [editingCred, setEditingCred] = useState<VaultCredential | null>(null)
  const [vaultRefreshKey, setVaultRefreshKey] = useState(0)

  const [brief, setBrief] = useState<ProjectBrief | null>(null)
  const [briefLoading, setBriefLoading] = useState(true)

  useEffect(() => {
    async function fetchClient() {
      const supabase = createClient()
      const [{ data: clientData }, { data: projects }] = await Promise.all([
        supabase.from('clients').select('*').eq('id', id).maybeSingle(),
        supabase.from('projects').select('*').eq('client_id', id).order('created_at', { ascending: true }),
      ])
      setClient(clientData)
      setProject(projects?.[0] ?? null)
    }
    fetchClient()
  }, [id])

  async function fetchDocuments(projectId: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    setDocuments(data ?? [])
    setDocsLoading(false)
  }

  useEffect(() => {
    if (project) fetchDocuments(project.id)
  }, [project])

  useEffect(() => {
    if (!project) return

    async function fetchBrief() {
      const supabase = createClient()
      const { data } = await supabase
        .from('project_briefs')
        .select('*')
        .eq('project_id', project!.id)
        .maybeSingle()
      setBrief(data)
      setBriefLoading(false)
    }

    fetchBrief()
  }, [project])

  async function handleDelete(doc: AtomeDocument) {
    const supabase = createClient()
    if (doc.storage_path) await supabase.storage.from('documents').remove([doc.storage_path])
    await supabase.from('documents').delete().eq('id', doc.id)
    setDeleting(null)
    if (project) fetchDocuments(project.id)
  }

  async function handleDownload(doc: AtomeDocument) {
    if (!doc.storage_path) return
    const supabase = createClient()
    const { data } = await supabase.storage.from('documents').createSignedUrl(doc.storage_path, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function togglePaid(doc: AtomeDocument) {
    const supabase = createClient()
    await supabase.from('documents').update({ paid_at: doc.paid_at ? null : new Date().toISOString() }).eq('id', doc.id)
    if (project) fetchDocuments(project.id)
  }

  if (!client) {
    return (
      <div className="h-full flex flex-col">
        <PageHeader pathItems={[{ label: 'Clients', href: '/admin' }, { label: '...' }]} />
      </div>
    )
  }

  const name = client.full_name || client.email
  const infoFields = [
    { label: 'Email', value: client.email },
    { label: 'Société', value: client.company_name },
    { label: 'Projet', value: project?.name },
    { label: 'Statut', value: project?.status },
    { label: 'Avancement', value: project ? `${project.progress_pct}%` : null },
  ]

  return (
    <>
      <PageHeader
        pathItems={[{ label: 'Clients', href: '/admin' }, { label: name }]}
        secondBarLeft={
          <div className="relative">
            <button onClick={() => setShowTabMenu(v => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
              {(() => { const active = TABS.find(t => t.id === tab)!; return <span className={cn('w-4 h-4 rounded flex items-center justify-center shrink-0', active.color)}><active.icon className="w-2.5 h-2.5 text-white" /></span> })()}
              {TABS.find(t => t.id === tab)?.label}
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>
            {showTabMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowTabMenu(false)} />
                <div className="absolute top-full mt-1.5 left-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-1.5 min-w-[160px]">
                  {TABS.map(t => (
                    <button key={t.id} onClick={() => { setTab(t.id); setShowTabMenu(false) }}
                      className={cn('flex items-center gap-2.5 w-full pl-1 pr-3 py-1 rounded-lg text-sm hover:bg-gray-50 text-left transition-colors',
                        tab === t.id ? 'text-gray-900 font-medium' : 'text-gray-600')}>
                      <span className={cn('w-4 h-4 rounded flex items-center justify-center shrink-0', t.color)}><t.icon className="w-2.5 h-2.5 text-white" /></span>
                      {t.label}
                      {tab === t.id && <Check className="w-3.5 h-3.5 ml-auto" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        }
        secondBarRight={
          tab === 'documents' && project ? (
            <button onClick={() => { setEditingDoc(null); setShowDocForm(true) }}
              className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
              <Plus className="w-3.5 h-3.5" />Nouveau document
            </button>
          ) : tab === 'tokens' && project ? (
            <button onClick={() => setShowTokenForm(true)}
              className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
              <Plus className="w-3.5 h-3.5" />Nouveau mouvement
            </button>
          ) : tab === 'projet' && project ? (
            <button onClick={() => setShowStepForm(true)}
              className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
              <Plus className="w-3.5 h-3.5" />Nouvelle étape
            </button>
          ) : tab === 'vault' && project ? (
            <button onClick={() => { setEditingCred(null); setShowVaultForm(true) }}
              className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
              <Plus className="w-3.5 h-3.5" />Ajouter
            </button>
          ) : undefined
        }
      />

      {/* Two-column layout */}
      <div className="flex h-full overflow-hidden">
        {/* Left panel */}
        <div className="w-72 shrink-0 border-r border-gray-100 overflow-y-auto bg-white">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="font-semibold text-gray-900 text-sm break-all">{name}</h2>
              {client.company_name && <p className="text-sm text-gray-500 mt-0.5">{client.company_name}</p>}
            </div>

            <div className="border-t border-gray-100">
              {infoFields.filter(f => f.value).map(f => (
                <div key={f.label} className="flex justify-between items-center py-2.5 border-b border-gray-50">
                  <span className="text-xs text-gray-400">{f.label}</span>
                  <span className="text-sm text-gray-900 text-right max-w-[160px] truncate">{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className={cn('flex-1 overflow-y-auto', tab === 'documents' || tab === 'vault' || tab === 'sav' || tab === 'tokens' || tab === 'projet' ? '' : 'p-6')}>
          {tab === 'projet' && (
            project ? (
              <ProjetTab project={project} onUpdated={setProject} refreshKey={stepRefreshKey} />
            ) : (
              <p className="text-sm text-gray-400 p-6">Aucun projet pour ce client.</p>
            )
          )}

          {tab === 'documents' && (
            project ? (
              docsLoading ? (
                <p className="text-sm text-gray-400 p-6">Chargement...</p>
              ) : documents.length === 0 ? (
                <p className="text-sm text-gray-400 p-6">Aucun document pour ce projet.</p>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left pl-6 pr-3 py-2.5 text-xs font-medium text-gray-400">Document</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400">Type</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400">Montant HT</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400">Statut</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400">Créé le</th>
                      <th className="text-left px-4 py-2.5 pr-6 text-xs font-medium text-gray-400"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map(doc => (
                      <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                        <td className="pl-6 pr-3 py-3 font-medium text-gray-900">{doc.label}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{DOC_TYPE_LABELS[doc.type]}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {doc.amount_ht !== null ? `${doc.amount_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {doc.type === 'facture_acompte' || doc.type === 'facture_solde' ? (
                            <button
                              onClick={() => togglePaid(doc)}
                              className={cn(
                                'text-xs font-medium px-2 py-0.5 rounded-full border transition-colors',
                                doc.paid_at
                                  ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                  : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                              )}
                              title="Cliquer pour changer le statut de paiement"
                            >
                              {doc.paid_at ? 'Payée' : 'En attente'}
                            </button>
                          ) : doc.type === 'devis' ? (
                            <span className="text-gray-300">—</span>
                          ) : doc.signed_at ? (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200">Signé</span>
                          ) : (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-gray-100 text-gray-500 border-gray-200">En attente</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {new Date(doc.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 pr-6">
                          <div className="flex items-center justify-end gap-1">
                            {doc.storage_path && (
                              <>
                                <button onClick={() => setPreviewing(doc)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Aperçu">
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDownload(doc)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Télécharger">
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            <button onClick={() => { setEditingDoc(doc); setShowDocForm(true) }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Modifier">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleting(doc)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" title="Supprimer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : (
              <p className="text-sm text-gray-400 p-6">Aucun projet pour ce client.</p>
            )
          )}

          {tab === 'brief' && (
            briefLoading ? (
              <p className="text-sm text-gray-400">Chargement...</p>
            ) : !brief?.submitted_at ? (
              <p className="text-sm text-gray-400">Le client n'a pas encore finalisé son brief métier.</p>
            ) : (
              <div className="bg-gray-50 -m-6 p-6">
                <div className="max-w-[680px] mx-auto bg-white border border-gray-200 rounded-sm shadow-sm px-16 py-14">
                  {(() => {
                    const meta = (brief.meta as unknown as Record<string, string> | null) ?? {}
                    return (
                      <>
                        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                          {meta['Type de projet'] || project?.name}
                        </h1>
                        <p className="text-xs text-gray-400 mb-10">
                          Soumis le {new Date(brief.submitted_at!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        {BRIEF_SECTIONS.filter(label => label !== 'Type de projet' && meta[label]).map((label, i) => (
                          <div key={label} className={i > 0 ? 'mt-8 pt-8 border-t border-gray-100' : ''}>
                            <h2 className="text-[15px] font-semibold text-gray-900 mb-2">{label}</h2>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{stripDashes(meta[label])}</p>
                          </div>
                        ))}
                      </>
                    )
                  })()}
                </div>
              </div>
            )
          )}

          {tab === 'vault' && (
            project ? (
              <VaultTab
                projectId={project.id}
                refreshKey={vaultRefreshKey}
                onEdit={cred => { setEditingCred(cred); setShowVaultForm(true) }}
              />
            ) : <p className="text-sm text-gray-400 p-6">Aucun projet pour ce client.</p>
          )}

          {tab === 'tokens' && (
            project ? <TokensTab projectId={project.id} refreshKey={tokenRefreshKey} /> : <p className="text-sm text-gray-400">Aucun projet pour ce client.</p>
          )}

          {tab === 'sav' && (
            project ? <SavTab projectId={project.id} /> : <p className="text-sm text-gray-400">Aucun projet pour ce client.</p>
          )}

          {tab !== 'projet' && tab !== 'documents' && tab !== 'brief' && tab !== 'vault' && tab !== 'tokens' && tab !== 'sav' && (
            <p className="text-sm text-gray-400">Section « {TABS.find(t => t.id === tab)?.label} » à construire.</p>
          )}
        </div>
      </div>

      {showDocForm && project && (
        <NewDocumentModal
          projectId={project.id}
          editing={editingDoc}
          onClose={() => { setShowDocForm(false); setEditingDoc(null) }}
          onCreated={() => { setShowDocForm(false); setEditingDoc(null); fetchDocuments(project.id) }}
        />
      )}

      {showTokenForm && project && (
        <NewTokenMovementModal
          projectId={project.id}
          onClose={() => setShowTokenForm(false)}
          onCreated={() => { setShowTokenForm(false); setTokenRefreshKey(k => k + 1) }}
        />
      )}

      {showStepForm && project && (
        <NewStepModal
          projectId={project.id}
          onClose={() => setShowStepForm(false)}
          onCreated={() => { setShowStepForm(false); setStepRefreshKey(k => k + 1) }}
        />
      )}

      {showVaultForm && project && (
        <AdminCredentialFormModal
          projectId={project.id}
          editing={editingCred}
          onClose={() => setShowVaultForm(false)}
          onSaved={() => { setShowVaultForm(false); setVaultRefreshKey(k => k + 1) }}
        />
      )}

      {previewing && (
        <DocumentPreviewModal document={previewing} onClose={() => setPreviewing(null)} />
      )}

      {deleting && (
        <ConfirmDialog
          title="Supprimer ce document ?"
          description={`« ${deleting.label} » sera définitivement supprimé, y compris le fichier associé.`}
          onConfirm={() => handleDelete(deleting)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  )
}

function NewDocumentModal({ projectId, editing, onClose, onCreated }: {
  projectId: string
  editing: AtomeDocument | null
  onClose: () => void
  onCreated: () => void
}) {
  const [type, setType] = useState<AtomeDocument['type']>(editing?.type ?? 'devis')
  const [label, setLabel] = useState(editing?.label ?? '')
  const [amountHt, setAmountHt] = useState(editing?.amount_ht !== null && editing?.amount_ht !== undefined ? String(editing.amount_ht) : '')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim()) { setError('Le libellé est obligatoire.'); return }
    setSaving(true)
    setError(null)

    const supabase = createClient()
    let storagePath: string | null = editing?.storage_path ?? null

    if (file) {
      if (editing?.storage_path) await supabase.storage.from('documents').remove([editing.storage_path])
      storagePath = `${projectId}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('documents').upload(storagePath, file)
      if (uploadError) {
        setError("Échec de l'upload du fichier.")
        setSaving(false)
        return
      }
    }

    const payload = {
      type,
      label: label.trim(),
      amount_ht: amountHt ? Number(amountHt) : null,
      storage_path: storagePath,
    }

    const { error: dbError } = editing
      ? await supabase.from('documents').update(payload).eq('id', editing.id)
      : await supabase.from('documents').insert({ project_id: projectId, ...payload })

    setSaving(false)
    if (dbError) { setError("Échec de l'enregistrement du document."); return }
    onCreated()
  }

  return (
    <Modal
      title={editing ? 'Modifier le document' : 'Nouveau document'}
      subtitle={editing ? 'Modifiez les informations de ce document.' : 'Ajoutez un document au projet de ce client.'}
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as AtomeDocument['type'])}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
            >
              {Object.entries(DOC_TYPE_LABELS).map(([value, l]) => (
                <option key={value} value={value}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Montant HT (optionnel)</label>
            <input
              type="number"
              value={amountHt}
              onChange={e => setAmountHt(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-300"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Libellé</label>
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Ex : Devis CRM interne"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-300"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Fichier {editing ? '(laisser vide pour conserver le fichier actuel)' : '(optionnel)'}
          </label>
          <label className="flex items-center gap-2 w-full rounded-lg border border-dashed border-gray-300 px-3 py-2.5 text-sm text-gray-500 hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="truncate">{file ? file.name : 'Cliquez pour choisir un fichier (PDF, image)'}</span>
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </label>
        </div>

        {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-1">
          <button type="button" onClick={onClose}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
            {saving ? 'Enregistrement...' : editing ? 'Enregistrer' : 'Ajouter le document'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

const VAULT_TYPE_LABELS: Record<VaultCredential['type'], string> = {
  dns: 'DNS',
  hosting: 'Hébergement',
  api: 'Clé API',
  cms: 'CMS',
  autre: 'Autre',
}

const VAULT_ICONS: Record<VaultCredential['type'], React.ComponentType<{ className?: string }>> = {
  dns: Globe,
  hosting: Server,
  api: Key,
  cms: Box,
  autre: Box,
}

interface DnsFields {
  recordType: string
  host: string
  value: string
}

function parseDnsValue(raw: string): DnsFields | null {
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.recordType === 'string' && typeof parsed.host === 'string' && typeof parsed.value === 'string') {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

function VaultTab({ projectId, refreshKey, onEdit }: { projectId: string; refreshKey: number; onEdit: (cred: VaultCredential) => void }) {
  const [credentials, setCredentials] = useState<VaultCredential[]>([])
  const [loading, setLoading] = useState(true)
  const [copyingId, setCopyingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<VaultCredential | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedFields, setExpandedFields] = useState<DnsFields | null>(null)
  const [expandLoading, setExpandLoading] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  async function fetchCredentials() {
    const supabase = createClient()
    const { data } = await supabase
      .from('vault_credentials')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    setCredentials(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchCredentials()
  }, [projectId, refreshKey])

  async function handleDelete(cred: VaultCredential) {
    const supabase = createClient()
    await supabase.from('vault_credentials').delete().eq('id', cred.id)
    setDeleting(null)
    fetchCredentials()
  }

  async function handleCopy(cred: VaultCredential) {
    setCopyingId(cred.id)
    setError(null)
    const supabase = createClient()
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vault-decrypt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ credentialId: cred.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur inconnue')

      await navigator.clipboard.writeText(json.value)
      setCopiedId(cred.id)
      setTimeout(() => setCopiedId(null), 1500)
      // Log de l'accès admin (pas encore persisté en DB — voir SESSION 6 du brief)
      console.info(`[vault] accès copié — credential ${cred.id} (${cred.label})`)
    } catch {
      setError('Échec du déchiffrement.')
    }
    setCopyingId(null)
  }

  async function toggleExpand(cred: VaultCredential) {
    if (expandedId === cred.id) { setExpandedId(null); setExpandedFields(null); return }
    setError(null)
    setExpandedId(cred.id)
    setExpandedFields(null)
    setExpandLoading(true)

    const supabase = createClient()
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vault-decrypt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ credentialId: cred.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur inconnue')
      setExpandedFields(parseDnsValue(json.value))
    } catch {
      setError('Échec de la lecture.')
      setExpandedId(null)
    }
    setExpandLoading(false)
  }

  async function copyField(key: string, value: string) {
    await navigator.clipboard.writeText(value)
    setCopiedField(key)
    setTimeout(() => setCopiedField(null), 1500)
  }

  if (loading) return <p className="text-sm text-gray-400 p-6">Chargement...</p>
  if (credentials.length === 0) return <p className="text-sm text-gray-400 p-6">Aucun credential pour ce projet.</p>

  return (
    <div>
      {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 m-6 mb-0">{error}</p>}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left pl-6 pr-3 py-2.5 text-xs font-medium text-gray-400">Credential</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400">Service</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400">Type</th>
            <th className="text-left px-4 py-2.5 pr-6 text-xs font-medium text-gray-400"></th>
          </tr>
        </thead>
        <tbody>
          {credentials.map(cred => {
            const Icon = VAULT_ICONS[cred.type]
            const isExpanded = expandedId === cred.id
            const isDns = cred.type === 'dns'
            return (
              <Fragment key={cred.id}>
                <tr className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="pl-6 pr-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-gray-50 flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <span className="font-medium text-gray-900">{cred.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{cred.service ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{VAULT_TYPE_LABELS[cred.type]}</td>
                  <td className="px-4 py-3 pr-6">
                    <div className="flex items-center justify-end gap-1">
                      {isDns ? (
                        <button
                          onClick={() => toggleExpand(cred)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          title={isExpanded ? 'Masquer' : 'Voir les champs'}
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCopy(cred)}
                          disabled={copyingId === cred.id}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                          title="Copier"
                        >
                          {copiedId === cred.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(cred)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Modifier"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleting(cred)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="border-b border-gray-50 bg-gray-50/40">
                    <td colSpan={4} className="px-6 py-3">
                      {expandLoading ? (
                        <p className="text-xs text-gray-400">Déchiffrement...</p>
                      ) : !expandedFields ? (
                        <p className="text-xs text-gray-400">Format invalide pour ce credential.</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-3">
                          {([
                            ['Type', expandedFields.recordType, `${cred.id}-type`],
                            ['Host', expandedFields.host, `${cred.id}-host`],
                            ['Valeur', expandedFields.value, `${cred.id}-value`],
                          ] as const).map(([fieldLabel, fieldValue, key]) => (
                            <div key={key} className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                              <p className="text-[10px] text-gray-400 mb-0.5">{fieldLabel}</p>
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-gray-900 font-mono truncate">{fieldValue}</p>
                                <button
                                  onClick={() => copyField(key, fieldValue)}
                                  className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                                  title="Copier"
                                >
                                  {copiedField === key ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>

      {deleting && (
        <ConfirmDialog
          title="Supprimer ce credential ?"
          description={`« ${deleting.label} » sera définitivement supprimé.`}
          onConfirm={() => handleDelete(deleting)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}

function AdminCredentialFormModal({ projectId, editing, onClose, onSaved }: {
  projectId: string
  editing: VaultCredential | null
  onClose: () => void
  onSaved: () => void
}) {
  const [label, setLabel] = useState(editing?.label ?? '')
  const [service, setService] = useState(editing?.service ?? '')
  const [type, setType] = useState<VaultCredential['type']>(editing?.type ?? 'dns')
  const [value, setValue] = useState('')
  const [recordType, setRecordType] = useState('TXT')
  const [host, setHost] = useState('')
  const [dnsValue, setDnsValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isDns = type === 'dns'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim()) { setError('Le libellé est obligatoire.'); return }
    if (isDns && (!host.trim() || !dnsValue.trim())) { setError('Le host et la valeur sont obligatoires.'); return }
    if (!isDns && !value.trim()) { setError('La valeur est obligatoire.'); return }
    setSaving(true)
    setError(null)

    const finalValue = isDns
      ? JSON.stringify({ recordType, host: host.trim(), value: dnsValue.trim() })
      : value.trim()

    const supabase = createClient()
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vault-encrypt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          label: label.trim(),
          service: service.trim() || null,
          type,
          value: finalValue,
          projectId,
          credentialId: editing?.id,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur inconnue')
      onSaved()
    } catch {
      setError('Une erreur est survenue. Réessayez.')
    }

    setSaving(false)
  }

  return (
    <Modal
      title={editing ? 'Modifier le credential' : 'Ajouter un credential'}
      subtitle="Ex : enregistrements DNS à transmettre au client pour connecter son domaine."
      onClose={onClose}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Libellé</label>
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Ex : Enregistrement TXT SPF"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-300"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as VaultCredential['type'])}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
            >
              {Object.entries(VAULT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Service (optionnel)</label>
            <input
              value={service}
              onChange={e => setService(e.target.value)}
              placeholder="Ex : OVH, Resend"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-300"
            />
          </div>
        </div>

        {isDns ? (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Type</label>
              <select
                value={recordType}
                onChange={e => setRecordType(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
              >
                {['TXT', 'CNAME', 'A', 'MX'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Host</label>
              <input
                value={host}
                onChange={e => setHost(e.target.value)}
                placeholder="Ex : resend._domainkey"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Valeur</label>
              <input
                value={dnsValue}
                onChange={e => setDnsValue(e.target.value)}
                placeholder="Ex : v=spf1 ..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-300"
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Valeur</label>
            <textarea
              value={value}
              onChange={e => setValue(e.target.value)}
              rows={3}
              placeholder={editing ? 'Laisser pour ne pas modifier la valeur existante' : 'Ex : v=spf1 include:_spf.resend.com ~all'}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-300 resize-none font-mono"
            />
          </div>
        )}

        {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-1">
          <button type="button" onClick={onClose}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
            {saving ? 'Enregistrement...' : editing ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

const STEP_STATUS_LABELS: Record<ProjectStep['status'], string> = {
  pending: 'En attente',
  active: 'En cours',
  done: 'Terminé',
}

function ProjetTab({ project, onUpdated, refreshKey }: { project: Project; onUpdated: (p: Project) => void; refreshKey: number }) {
  const [progress, setProgress] = useState(project.progress_pct)
  const [saving, setSaving] = useState(false)
  const [steps, setSteps] = useState<ProjectStep[]>([])
  const [loadingSteps, setLoadingSteps] = useState(true)
  const [deleting, setDeleting] = useState<ProjectStep | null>(null)

  useEffect(() => { setProgress(project.progress_pct) }, [project.progress_pct])

  async function fetchSteps() {
    const supabase = createClient()
    const { data } = await supabase
      .from('project_steps')
      .select('*')
      .eq('project_id', project.id)
      .order('sort_order', { ascending: true })
    setSteps(data ?? [])
    setLoadingSteps(false)
  }

  useEffect(() => { fetchSteps() }, [project.id, refreshKey])

  async function saveProject(patch: Partial<Project>) {
    setSaving(true)
    const supabase = createClient()
    const { data } = await supabase.from('projects').update(patch).eq('id', project.id).select().maybeSingle()
    setSaving(false)
    if (data) onUpdated(data)
  }

  async function updateStep(id: string, patch: Partial<ProjectStep>) {
    const supabase = createClient()
    await supabase.from('project_steps').update(patch).eq('id', id)
    fetchSteps()
  }

  async function handleDelete(step: ProjectStep) {
    const supabase = createClient()
    await supabase.from('project_steps').delete().eq('id', step.id)
    setDeleting(null)
    fetchSteps()
  }

  return (
    <div>
      <div className="flex items-center gap-4 px-6 py-4 bg-gray-50">
        <div>
          <label className="block text-[11px] font-medium text-gray-500 mb-1">Statut</label>
          <select
            value={project.status}
            onChange={e => saveProject({ status: e.target.value as Project['status'] })}
            disabled={saving}
            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
          >
            <option value="active">Actif</option>
            <option value="paused">En pause</option>
            <option value="delivered">Livré</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-gray-500 mb-1">Avancement (%)</label>
          <input
            type="number" min={0} max={100}
            value={progress}
            onChange={e => setProgress(Number(e.target.value))}
            onBlur={() => saveProject({ progress_pct: progress })}
            disabled={saving}
            className="w-20 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
        </div>
      </div>

      {loadingSteps ? (
        <p className="text-sm text-gray-400 p-6">Chargement...</p>
      ) : steps.length === 0 ? (
        <p className="text-sm text-gray-400 p-6">Aucune étape pour ce projet.</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left pl-6 pr-3 py-2.5 text-xs font-medium text-gray-400">Étape</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400">Statut</th>
              <th className="text-left px-4 py-2.5 pr-6 text-xs font-medium text-gray-400"></th>
            </tr>
          </thead>
          <tbody>
            {steps.map(step => (
              <tr key={step.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                <td className="pl-6 pr-3 py-3">
                  <input
                    defaultValue={step.title}
                    onBlur={e => { if (e.target.value.trim() && e.target.value !== step.title) updateStep(step.id, { title: e.target.value.trim() }) }}
                    className="font-medium text-gray-900 w-full focus:outline-none bg-transparent"
                  />
                  {step.description && <p className="text-xs text-gray-400">{step.description}</p>}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={step.status}
                    onChange={e => updateStep(step.id, { status: e.target.value as ProjectStep['status'] })}
                    className="rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                  >
                    {Object.entries(STEP_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 pr-6">
                  <div className="flex items-center justify-end">
                    <button onClick={() => setDeleting(step)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" title="Supprimer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {deleting && (
        <ConfirmDialog
          title="Supprimer cette étape ?"
          description={`« ${deleting.title} » sera définitivement supprimée.`}
          onConfirm={() => handleDelete(deleting)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}

function NewStepModal({ projectId, onClose, onCreated }: {
  projectId: string
  onClose: () => void
  onCreated: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Le titre est obligatoire.'); return }
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { count } = await supabase
      .from('project_steps')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)

    const { error: insertError } = await supabase.from('project_steps').insert({
      project_id: projectId,
      title: title.trim(),
      description: description.trim() || null,
      sort_order: count ?? 0,
    })

    setSaving(false)
    if (insertError) { setError("Échec de l'enregistrement."); return }
    onCreated()
  }

  return (
    <Modal title="Nouvelle étape" subtitle="Ajoutez une étape au suivi du projet." onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Titre</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ex : Maquettes validées"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-300"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder="Optionnel"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-300 resize-none"
          />
        </div>

        {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-1">
          <button type="button" onClick={onClose}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
            {saving ? 'Enregistrement...' : 'Ajouter'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function TokensTab({ projectId, refreshKey }: { projectId: string; refreshKey: number }) {
  const [entries, setEntries] = useState<TokenLedgerEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEntries() {
      const supabase = createClient()
      const { data } = await supabase
        .from('token_ledger')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      setEntries(data ?? [])
      setLoading(false)
    }
    fetchEntries()
  }, [projectId, refreshKey])

  if (loading) return <p className="text-sm text-gray-400 p-6">Chargement...</p>

  const balance = entries.reduce((sum, e) => sum + e.delta, 0)

  return (
    <div>
      <div className="flex items-center gap-3 px-6 py-4 bg-gray-50">
        <TokenRing balance={balance} />
        <p className="text-lg font-semibold text-gray-900 shrink-0">
          {balance} <span className="text-xs font-normal text-gray-400">tokens disponibles</span>
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-gray-400 p-6">Aucun mouvement pour l'instant.</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left pl-6 pr-3 py-2.5 text-xs font-medium text-gray-400">Mouvement</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400">Créé le</th>
              <th className="text-left px-4 py-2.5 pr-6 text-xs font-medium text-gray-400">Delta</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => (
              <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                <td className="pl-6 pr-3 py-3 font-medium text-gray-900">{entry.label}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(entry.created_at)}</td>
                <td className={`px-4 py-3 pr-6 text-sm font-medium ${entry.delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {entry.delta >= 0 ? '+' : ''}{entry.delta} tokens
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function NewTokenMovementModal({ projectId, onClose, onCreated }: {
  projectId: string
  onClose: () => void
  onCreated: () => void
}) {
  const [delta, setDelta] = useState('')
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const deltaNum = Number(delta)
    if (!deltaNum || !label.trim()) { setError('Le delta et le libellé sont obligatoires.'); return }
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { error: insertError } = await supabase.from('token_ledger').insert({
      project_id: projectId,
      delta: deltaNum,
      label: label.trim(),
    })

    setSaving(false)
    if (insertError) { setError("Échec de l'enregistrement."); return }
    onCreated()
  }

  return (
    <Modal title="Nouveau mouvement" subtitle="Ajoutez ou retirez des tokens sur ce projet." onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Delta (+ ou -)</label>
          <input
            type="number"
            value={delta}
            onChange={e => setDelta(e.target.value)}
            placeholder="Ex : 100 ou -12"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-300"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Libellé</label>
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Ex : Renouvellement bimensuel"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-300"
          />
        </div>

        {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-1">
          <button type="button" onClick={onClose}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
            {saving ? 'Enregistrement...' : 'Valider'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

const SAV_CATEGORY_LABELS: Record<SavTicket['category'], string> = {
  bug: 'Bug',
  modification: 'Modification',
  feature: 'Nouvelle fonctionnalité',
  question: 'Question',
}

function SavTab({ projectId }: { projectId: string }) {
  const [tickets, setTickets] = useState<SavTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<SavTicket | null>(null)
  const [selected, setSelected] = useState<SavTicket | null>(null)

  async function fetchTickets() {
    const supabase = createClient()
    const { data } = await supabase
      .from('sav_tickets')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    setTickets(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchTickets()
  }, [projectId])

  async function updateTicket(id: string, patch: Partial<SavTicket>) {
    setSavingId(id)
    const supabase = createClient()
    await supabase.from('sav_tickets').update(patch).eq('id', id)
    await fetchTickets()
    setSavingId(null)
  }

  async function handleDelete(ticket: SavTicket) {
    const supabase = createClient()
    await supabase.from('sav_tickets').delete().eq('id', ticket.id)
    setDeleting(null)
    fetchTickets()
  }

  if (loading) return <p className="text-sm text-gray-400 p-6">Chargement...</p>
  if (tickets.length === 0) return <p className="text-sm text-gray-400 p-6">Aucun ticket pour ce projet.</p>

  return (
    <div>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left pl-6 pr-3 py-2.5 text-xs font-medium text-gray-400">Demande</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400">Catégorie</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400">Statut</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400">Coût</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400">Créé le</th>
            <th className="text-left px-4 py-2.5 pr-6 text-xs font-medium text-gray-400"></th>
          </tr>
        </thead>
        <tbody>
          {tickets.map(ticket => (
            <tr key={ticket.id} onClick={() => setSelected(ticket)}
              className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors cursor-pointer">
              <td className="pl-6 pr-3 py-3">
                <p className="font-medium text-gray-900">{ticket.title}</p>
                {ticket.body && <p className="text-xs text-gray-400 truncate max-w-[280px]">{ticket.body}</p>}
              </td>
              <td className="px-4 py-3 text-gray-500 text-xs">{SAV_CATEGORY_LABELS[ticket.category]}</td>
              <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                <select
                  value={ticket.status}
                  onChange={e => updateTicket(ticket.id, { status: e.target.value as SavTicket['status'] })}
                  disabled={savingId === ticket.id}
                  className="rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                >
                  <option value="open">Ouvert</option>
                  <option value="in_progress">En cours</option>
                  <option value="closed">Résolu</option>
                </select>
              </td>
              <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                {ticket.category === 'modification' || ticket.category === 'feature' ? (
                  <input
                    type="number"
                    defaultValue={ticket.token_cost ?? ''}
                    onBlur={e => {
                      const v = e.target.value ? Number(e.target.value) : null
                      if (v !== ticket.token_cost) updateTicket(ticket.id, { token_cost: v })
                    }}
                    placeholder="Tokens"
                    disabled={ticket.token_cost !== null || savingId === ticket.id}
                    className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-300 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(ticket.created_at)}</td>
              <td className="px-4 py-3 pr-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => setDeleting(ticket)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {deleting && (
        <ConfirmDialog
          title="Supprimer ce ticket ?"
          description={`« ${deleting.title} » sera définitivement supprimé.`}
          onConfirm={() => handleDelete(deleting)}
          onCancel={() => setDeleting(null)}
        />
      )}

      {selected && (
        <Modal title={selected.title} subtitle={SAV_CATEGORY_LABELS[selected.category]} onClose={() => setSelected(null)} size="md">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusPill status={selected.status} />
              {selected.token_cost !== null && (
                <span className="text-xs font-medium text-gray-500">{selected.token_cost} tokens facturés</span>
              )}
            </div>
            {selected.body && <p className="text-sm text-gray-700 whitespace-pre-line">{selected.body}</p>}
            <p className="text-xs text-gray-400">Créé le {formatDate(selected.created_at)}</p>
          </div>
        </Modal>
      )}
    </div>
  )
}
