import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Search, Filter, ArrowUpDown, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import MetricCard from '@/components/shared/MetricCard'
import { cn } from '@/lib/utils'
import type { Client, Project } from '@/types'

export const Route = createFileRoute('/admin/')({
  component: AdminIndexPage,
})

type ClientRow = Client & { projects: Project[] }

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-cyan-100 text-cyan-700',
]

function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

const STATUS_TABS = [
  { id: 'all', label: 'Tous' },
  { id: 'active', label: 'Projets actifs' },
  { id: 'paused', label: 'En pause' },
  { id: 'delivered', label: 'Livrés' },
]

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  active: { label: 'Actif', class: 'bg-green-50 text-green-700 border border-green-200' },
  paused: { label: 'En pause', class: 'bg-orange-50 text-orange-700 border border-orange-200' },
  delivered: { label: 'Livré', class: 'bg-blue-50 text-blue-700 border border-blue-200' },
}

const ghostBtn = 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors'

function AdminIndexPage() {
  const [clients, setClients] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'date_desc' | 'date_asc'>('name_asc')
  const [showFilter, setShowFilter] = useState(false)
  const [showSort, setShowSort] = useState(false)
  const [metrics, setMetrics] = useState({ activeProjects: 0, openTickets: 0, pendingSignatures: 0 })

  useEffect(() => {
    async function fetchClients() {
      const supabase = createClient()
      const { data } = await supabase
        .from('clients')
        .select('*, projects(*)')
        .order('created_at', { ascending: false })
      setClients((data as ClientRow[] | null) ?? [])
      setLoading(false)
    }
    async function fetchMetrics() {
      const supabase = createClient()
      const [activeProjects, openTickets, pendingSignatures] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('sav_tickets').select('*', { count: 'exact', head: true }).neq('status', 'closed'),
        supabase.from('documents').select('*', { count: 'exact', head: true }).in('type', ['devis', 'contrat']).is('signed_at', null),
      ])
      setMetrics({
        activeProjects: activeProjects.count ?? 0,
        openTickets: openTickets.count ?? 0,
        pendingSignatures: pendingSignatures.count ?? 0,
      })
    }
    fetchClients()
    fetchMetrics()
  }, [])

  const filtered = [...clients]
    .filter(c => {
      const name = c.full_name || c.email
      const project = c.projects?.[0]
      const matchSearch = name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        (project?.name ?? '').toLowerCase().includes(search.toLowerCase())
      const matchStatus = filterStatus === 'all' || project?.status === filterStatus
      return matchSearch && matchStatus
    })
    .sort((a, b) => {
      const nameA = a.full_name || a.email
      const nameB = b.full_name || b.email
      if (sortBy === 'name_asc') return nameA.localeCompare(nameB)
      if (sortBy === 'name_desc') return nameB.localeCompare(nameA)
      if (sortBy === 'date_desc') return b.created_at.localeCompare(a.created_at)
      return a.created_at.localeCompare(b.created_at)
    })

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        pathItems={[{ label: 'Clients' }]}
        secondBarLeft={
          <>
            <div className="relative">
              <button onClick={() => { setShowFilter(v => !v); setShowSort(false) }} className={ghostBtn}>
                <Filter className="w-3.5 h-3.5" />Filtrer
              </button>
              {showFilter && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowFilter(false)} />
                  <div className="absolute top-full mt-1.5 left-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-1.5 min-w-[180px]">
                    <p className="text-xs text-gray-400 uppercase tracking-wide px-2 py-1.5 font-medium">Statut projet</p>
                    {STATUS_TABS.map(tab => (
                      <button key={tab.id} onClick={() => { setFilterStatus(tab.id); setShowFilter(false) }}
                        className={cn('flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm hover:bg-gray-50 text-left transition-colors',
                          filterStatus === tab.id ? 'text-gray-900 font-medium' : 'text-gray-600')}>
                        {tab.label}
                        {filterStatus === tab.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="relative">
              <button onClick={() => { setShowSort(v => !v); setShowFilter(false) }} className={ghostBtn}>
                <ArrowUpDown className="w-3.5 h-3.5" />Trier
              </button>
              {showSort && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSort(false)} />
                  <div className="absolute top-full mt-1.5 left-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-1.5 min-w-[180px]">
                    <p className="text-xs text-gray-400 uppercase tracking-wide px-2 py-1.5 font-medium">Trier par</p>
                    {([['name_asc', 'Nom A → Z'], ['name_desc', 'Nom Z → A'], ['date_desc', 'Plus récent'], ['date_asc', 'Plus ancien']] as const).map(([id, label]) => (
                      <button key={id} onClick={() => { setSortBy(id); setShowSort(false) }}
                        className={cn('flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm hover:bg-gray-50 text-left transition-colors',
                          sortBy === id ? 'text-gray-900 font-medium' : 'text-gray-600')}>
                        {label}
                        {sortBy === id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300 w-40 placeholder:text-gray-300" />
            </div>
            {filterStatus !== 'all' && (
              <button onClick={() => setFilterStatus('all')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-900 text-white text-xs font-medium hover:bg-gray-700">
                {STATUS_TABS.find(t => t.id === filterStatus)?.label}
                <X className="w-3 h-3" />
              </button>
            )}
          </>
        }
        secondBarRight={
          <span className="text-xs text-gray-400">{filtered.length} client{filtered.length > 1 ? 's' : ''}</span>
        }
      />

      <div className="px-6 py-4 grid grid-cols-3 gap-4 border-b border-gray-100 shrink-0">
        <MetricCard label="Projets actifs" value={String(metrics.activeProjects)} />
        <MetricCard label="Tickets SAV ouverts" value={String(metrics.openTickets)} color={metrics.openTickets > 0 ? 'amber' : 'gray'} />
        <MetricCard label="Signatures en attente" value={String(metrics.pendingSignatures)} color={metrics.pendingSignatures > 0 ? 'amber' : 'gray'} />
      </div>

      <div className="flex-1 overflow-auto relative">
        {!loading && filtered.length === 0 ? (
          <EmptyState
            title="Aucun client"
            description="Les clients apparaîtront ici dès leur première connexion."
            variant="table"
          />
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left pl-6 pr-3 py-2.5 text-xs font-medium text-gray-400">Client</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400">Projet actif</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400">Avancement</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400">Statut</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 pr-6">Créé le</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(client => {
                const project = client.projects?.[0]
                const name = client.full_name || client.email
                const statusCfg = project ? STATUS_CONFIG[project.status] : undefined
                return (
                  <tr key={client.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="pl-6 pr-3 py-3">
                      <Link to="/admin/clients/$id" params={{ id: client.id }} className="flex items-center gap-2.5 group/link">
                        <div className={cn('w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-xs font-semibold', avatarColor(name))}>
                          {name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 group-hover/link:text-blue-600 transition-colors">{name}</p>
                          <p className="text-xs text-gray-400">{client.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{project?.name ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{project ? `${project.progress_pct}%` : <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3">
                      {statusCfg ? (
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', statusCfg.class)}>
                          {statusCfg.label}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 pr-6 text-gray-500 text-xs">
                      {new Date(client.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
