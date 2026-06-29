import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { TrendingUp, ListChecks, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useProject } from '@/lib/projectContext'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import StatusPill from '@/components/shared/StatusPill'
import StatusDonut from '@/components/shared/StatusDonut'
import type { ProjectStep, TokenLedgerEntry, AtomeDocument } from '@/types'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardIndexPage,
})

function formatDate(value: string | null) {
  if (!value) return null
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatAmount(value: number) {
  return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' € HT'
}

function DashboardIndexPage() {
  const { activeProject, loading: projectLoading } = useProject()
  const [steps, setSteps] = useState<ProjectStep[]>([])
  const [loadingSteps, setLoadingSteps] = useState(true)
  const [tokenEntries, setTokenEntries] = useState<TokenLedgerEntry[]>([])
  const [documents, setDocuments] = useState<AtomeDocument[]>([])

  useEffect(() => {
    if (!activeProject) { setLoadingSteps(false); return }

    async function fetchSteps() {
      const supabase = createClient()
      const { data } = await supabase
        .from('project_steps')
        .select('*')
        .eq('project_id', activeProject!.id)
        .order('sort_order', { ascending: true })
      setSteps(data ?? [])
      setLoadingSteps(false)
    }

    async function fetchTokenEntries() {
      const supabase = createClient()
      const { data } = await supabase
        .from('token_ledger')
        .select('*')
        .eq('project_id', activeProject!.id)
        .order('created_at', { ascending: true })
      setTokenEntries(data ?? [])
    }

    async function fetchDocuments() {
      const supabase = createClient()
      const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', activeProject!.id)
      setDocuments(data ?? [])
    }

    fetchSteps()
    fetchTokenEntries()
    fetchDocuments()
  }, [activeProject])

  if (projectLoading || loadingSteps) {
    return (
      <div className="h-full flex flex-col">
        <PageHeader pathItems={[{ label: "Vue d'ensemble" }]} />
        <div className="flex-1 p-6 space-y-4 animate-pulse">
          <div className="h-6 w-48 bg-gray-100 rounded" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-gray-100 rounded-xl" />
            <div className="h-24 bg-gray-100 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!activeProject) {
    return (
      <div className="h-full flex flex-col">
        <PageHeader pathItems={[{ label: "Vue d'ensemble" }]} />
        <div className="flex-1 overflow-y-auto">
          <EmptyState
            title="Votre projet démarre bientôt"
            description="Vous recevrez un accès complet dès le lancement par l'équipe Atome. Pour toute question : hello@atome.fr"
            variant="cards"
          />
        </div>
      </div>
    )
  }

  const devisTotal = documents
    .filter(d => d.type === 'devis' && d.amount_ht)
    .reduce((sum, d) => sum + (d.amount_ht ?? 0), 0)
  const totalAmount = devisTotal > 0 ? devisTotal : activeProject.total_amount_ht
  const paidAmount = documents
    .filter(d => (d.type === 'facture_acompte' || d.type === 'facture_solde') && d.paid_at && d.amount_ht)
    .reduce((sum, d) => sum + (d.amount_ht ?? 0), 0)
  const remainingBalance = totalAmount !== null
    ? Math.max(0, totalAmount - paidAmount)
    : null
  const balancePaid = remainingBalance !== null && remainingBalance === 0 && paidAmount > 0

  const doneCount = steps.filter(s => s.status === 'done').length
  const activeCount = steps.filter(s => s.status === 'active').length
  const pendingCount = steps.filter(s => s.status === 'pending').length

  const now = new Date()
  const monthlyTotals = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const entries = tokenEntries.filter(e => {
      const d = new Date(e.created_at)
      return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth()
    })
    const credited = entries.filter(e => e.delta > 0).reduce((sum, e) => sum + e.delta, 0)
    const debited = entries.filter(e => e.delta < 0).reduce((sum, e) => sum + Math.abs(e.delta), 0)
    return { date, credited, debited }
  })
  const maxAmount = Math.max(1, ...monthlyTotals.flatMap(m => [m.credited, m.debited]))

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        pathItems={[{ label: "Vue d'ensemble" }]}
        secondBarLeft={
          <div className="flex items-center gap-2.5">
            <p className="text-sm font-medium text-gray-900">{activeProject.name}</p>
            <p className="text-xs text-gray-400">
              {activeProject.started_at && `Démarré le ${formatDate(activeProject.started_at)}`}
              {activeProject.started_at && activeProject.estimated_at && ' · '}
              {activeProject.estimated_at && `Livraison estimée ${formatDate(activeProject.estimated_at)}`}
            </p>
            <StatusPill status={activeProject.status} />
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Métriques compactes */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Avancement</p>
              <div className="w-8 h-8 rounded-full border border-dashed border-gray-200 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{activeProject.progress_pct}%</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Solde restant</p>
              <div className="w-8 h-8 rounded-full border border-dashed border-gray-200 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>
            <p className={`text-2xl font-semibold mt-1 ${balancePaid ? 'text-green-600' : 'text-gray-900'}`}>
              {balancePaid ? 'Soldé' : remainingBalance !== null ? formatAmount(remainingBalance) : '—'}
            </p>
          </div>
        </div>

        {/* Donut étapes + Bar tokens */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-900">Avancement du projet</p>
            </div>
            {steps.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">Aucune étape pour l'instant.</p>
            ) : (
              <div className="flex flex-col items-center py-2">
                <StatusDonut
                  size={110}
                  segments={[
                    { value: doneCount, color: '#111827' },
                    { value: activeCount, color: '#9ca3af' },
                    { value: pendingCount, color: '#d1d5db' },
                  ]}
                />
                <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-900" />Terminé</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-400" />En cours</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-300" />À venir</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-900">Tokens</p>
              <Link to="/dashboard/tokens" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">↗</Link>
            </div>
            <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-900" />Crédité</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-300" />Débité</span>
            </div>
            {tokenEntries.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center flex-1">Aucun mouvement pour l'instant.</p>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 flex items-end justify-between gap-3">
                  {monthlyTotals.map(({ date, credited, debited }) => (
                    <div key={date.toISOString()} className="flex-1 flex items-end justify-center gap-1 h-full">
                      <div
                        className="w-3.5 rounded-t-sm bg-gray-900"
                        style={{ height: `${credited === 0 ? 2 : Math.max(6, (credited / maxAmount) * 100)}%` }}
                      />
                      <div
                        className="w-3.5 rounded-t-sm bg-gray-300"
                        style={{ height: `${debited === 0 ? 2 : Math.max(6, (debited / maxAmount) * 100)}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-3 mt-1.5">
                  {monthlyTotals.map(({ date }) => (
                    <span key={date.toISOString()} className="flex-1 text-center text-[10px] text-gray-400">
                      {date.toLocaleDateString('fr-FR', { month: 'short' })}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Étapes */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <ListChecks className="w-3.5 h-3.5 text-gray-400" />
            <p className="text-sm font-medium text-gray-900">Étapes du projet</p>
          </div>
          {steps.length === 0 ? (
            <p className="text-sm text-gray-400 p-5">Aucune étape pour l'instant.</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left pl-5 pr-3 py-2.5 text-xs font-medium text-gray-400">Étape</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400">Statut</th>
                  <th className="text-left px-4 py-2.5 pr-5 text-xs font-medium text-gray-400">Terminé le</th>
                </tr>
              </thead>
              <tbody>
                {steps.map(step => (
                  <tr key={step.id} className="border-b border-gray-50 last:border-0">
                    <td className="pl-5 pr-3 py-3">
                      <p className="font-medium text-gray-900">{step.title}</p>
                      {step.description && <p className="text-xs text-gray-400">{step.description}</p>}
                    </td>
                    <td className="px-4 py-3"><StatusPill status={step.status} /></td>
                    <td className="px-4 py-3 pr-5 text-gray-500 text-xs">
                      {step.completed_at ? formatDate(step.completed_at) : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
