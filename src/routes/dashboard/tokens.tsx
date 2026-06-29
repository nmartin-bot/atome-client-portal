import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { AlertTriangle, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useProject } from '@/lib/projectContext'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import TokenRing from '@/components/shared/TokenRing'
import type { TokenLedgerEntry } from '@/types'

export const Route = createFileRoute('/dashboard/tokens')({
  component: TokensPage,
})

const QUOTA = 100
const PAGE_SIZE = 10

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function TokensPage() {
  const { activeProject, loading: projectLoading } = useProject()
  const [entries, setEntries] = useState<TokenLedgerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  useEffect(() => {
    async function fetchEntries() {
      if (!activeProject) { setLoading(false); return }
      const supabase = createClient()
      const { data } = await supabase
        .from('token_ledger')
        .select('*')
        .eq('project_id', activeProject.id)
        .order('created_at', { ascending: false })
      setEntries(data ?? [])
      setLoading(false)
    }
    fetchEntries()
  }, [activeProject])

  if (projectLoading || loading) {
    return (
      <div className="h-full flex flex-col">
        <PageHeader pathItems={[{ label: 'Tokens & abonnement' }]} />
        <div className="p-6 animate-pulse h-32 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  if (!activeProject) {
    return (
      <div className="h-full flex flex-col">
        <PageHeader pathItems={[{ label: 'Tokens & abonnement' }]} />
        <div className="flex-1 overflow-y-auto">
          <EmptyState title="Tokens & abonnement" description="Votre projet démarre bientôt." variant="table" />
        </div>
      </div>
    )
  }

  const balance = entries.reduce((sum, e) => sum + e.delta, 0)
  const totalPages = Math.ceil(entries.length / PAGE_SIZE)
  const pageEntries = entries.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <div className="h-full flex flex-col">
      <PageHeader pathItems={[{ label: 'Tokens & abonnement' }]} />

      {/* Solde */}
      <div className="flex items-center gap-3 px-6 py-4 bg-gray-50">
        <TokenRing balance={balance} quota={QUOTA} />
        <p className="text-lg font-semibold text-gray-900 shrink-0">
          {balance} <span className="text-xs font-normal text-gray-400">tokens disponibles</span>
        </p>
        {balance === 0 ? (
          <div className="flex items-center gap-1.5 text-xs text-red-600 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" /> Solde épuisé
          </div>
        ) : balance < 20 ? (
          <div className="flex items-center gap-1.5 text-xs text-orange-600 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" /> Solde faible
          </div>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto">
        {entries.length === 0 ? (
          <EmptyState title="Aucun mouvement" description="L'historique de vos tokens apparaîtra ici." variant="table" />
        ) : (
          <>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left pl-6 pr-3 py-2.5 text-xs font-medium text-gray-400">Mouvement</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400">Créé le</th>
                  <th className="text-left px-4 py-2.5 pr-6 text-xs font-medium text-gray-400">Delta</th>
                </tr>
              </thead>
              <tbody>
                {pageEntries.map(entry => (
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
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 text-xs text-gray-400">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-2 py-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
                >
                  ← Précédent
                </button>
                <span>Page {page + 1} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="px-2 py-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
                >
                  Suivant →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Abonnement */}
      <div className="border-t border-gray-100 px-6 h-16 flex items-center justify-between shrink-0">
        <div>
          <p className="text-sm font-medium text-gray-900">Abonnement</p>
          <p className="text-xs text-gray-500">Maintenance hébergement incluse · Renouvellement mensuel</p>
        </div>
        <a
          href="mailto:hello@atome.fr"
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline shrink-0"
        >
          <Mail className="w-3.5 h-3.5" /> Contacter Atome
        </a>
      </div>
    </div>
  )
}
