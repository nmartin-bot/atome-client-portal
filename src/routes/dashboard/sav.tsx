import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useProject } from '@/lib/projectContext'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import StatusPill from '@/components/shared/StatusPill'
import Modal from '@/components/shared/Modal'
import type { SavTicket } from '@/types'

export const Route = createFileRoute('/dashboard/sav')({
  component: SavPage,
})

const CATEGORY_LABELS: Record<SavTicket['category'], string> = {
  bug: 'Bug',
  modification: 'Modification',
  feature: 'Nouvelle fonctionnalité',
  question: 'Question',
}

const CATEGORY_COLORS: Record<SavTicket['category'], string> = {
  bug: 'bg-red-50 text-red-700 border-red-200',
  modification: 'bg-blue-50 text-blue-700 border-blue-200',
  feature: 'bg-violet-50 text-violet-700 border-violet-200',
  question: 'bg-gray-100 text-gray-500 border-gray-200',
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function SavPage() {
  const { activeProject, loading: projectLoading } = useProject()
  const [tickets, setTickets] = useState<SavTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<SavTicket | null>(null)
  const [tokenBalance, setTokenBalance] = useState<number | null>(null)

  async function fetchTickets() {
    if (!activeProject) { setLoading(false); return }
    const supabase = createClient()
    const { data } = await supabase
      .from('sav_tickets')
      .select('*')
      .eq('project_id', activeProject.id)
      .order('created_at', { ascending: false })
    setTickets(data ?? [])
    setLoading(false)
  }

  async function fetchTokenBalance() {
    if (!activeProject) { setTokenBalance(null); return }
    const supabase = createClient()
    const { data } = await supabase
      .from('token_ledger')
      .select('delta')
      .eq('project_id', activeProject.id)
    setTokenBalance((data ?? []).reduce((sum, e) => sum + e.delta, 0))
  }

  useEffect(() => {
    fetchTickets()
    fetchTokenBalance()
  }, [activeProject])

  if (projectLoading || loading) {
    return (
      <div className="h-full flex flex-col">
        <PageHeader pathItems={[{ label: 'SAV' }]} />
        <div className="p-6 animate-pulse h-32 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        pathItems={[{ label: 'SAV' }]}
        secondBarRight={
          activeProject ? (
            tokenBalance === 0 ? (
              <button disabled
                className="flex items-center gap-1.5 bg-gray-100 text-gray-400 px-3 py-1.5 rounded-lg text-xs font-medium cursor-not-allowed">
                <Plus className="w-3.5 h-3.5" />Tokens épuisés
              </button>
            ) : (
              <button onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                <Plus className="w-3.5 h-3.5" />Nouvelle demande
              </button>
            )
          ) : undefined
        }
      />
      <div className="flex-1 overflow-y-auto">
        {!activeProject || tickets.length === 0 ? (
          <EmptyState
            title="Aucun ticket"
            description="Créez une demande pour signaler un bug ou demander une évolution."
            variant="list"
          />
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left pl-6 pr-3 py-2.5 text-xs font-medium text-gray-400">Demande</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400">Catégorie</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400">Statut</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400">Coût</th>
                <th className="text-left px-4 py-2.5 pr-6 text-xs font-medium text-gray-400">Créé le</th>
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
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[ticket.category]}`}>
                      {CATEGORY_LABELS[ticket.category]}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatusPill status={ticket.status} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {ticket.token_cost !== null ? `${ticket.token_cost} tokens` : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 pr-6 text-gray-500 text-xs">{formatDate(ticket.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && activeProject && (
        <NewTicketModal
          projectId={activeProject.id}
          projectName={activeProject.name}
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); fetchTickets() }}
        />
      )}

      {selected && (
        <Modal title={selected.title} subtitle={CATEGORY_LABELS[selected.category]} onClose={() => setSelected(null)} size="md">
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

function NewTicketModal({ projectId, projectName, onClose, onCreated }: {
  projectId: string
  projectName: string
  onClose: () => void
  onCreated: () => void
}) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState<SavTicket['category']>('bug')
  const [sourceApp, setSourceApp] = useState(projectName)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Le titre est obligatoire.'); return }
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { error: insertError } = await supabase.from('sav_tickets').insert({
      project_id: projectId,
      title: title.trim(),
      body: body.trim() || null,
      category,
      source_app: sourceApp.trim() || null,
    })

    setSaving(false)
    if (insertError) { setError("Échec de l'enregistrement."); return }
    onCreated()
  }

  return (
    <Modal title="Nouvelle demande" subtitle="Décrivez votre besoin, Atome revient vers vous sous 24h." onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Type de demande</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value as SavTicket['category'])}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
          >
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {(category === 'modification' || category === 'feature') && (
            <p className="text-[11px] text-gray-400 mt-1.5">Cette demande sera chiffrée en tokens par l'équipe Atome avant traitement.</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Titre</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ex : Le bouton export ne fonctionne pas"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-300"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Description</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={4}
            placeholder="Décrivez le problème ou la demande..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-300 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Application concernée</label>
          <input
            value={sourceApp}
            onChange={e => setSourceApp(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
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
            {saving ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
