import { createFileRoute } from '@tanstack/react-router'
import { Fragment, useEffect, useState } from 'react'
import { Plus, Globe, Server, Key, Box, Copy, Pencil, Check, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useProject } from '@/lib/projectContext'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import Modal from '@/components/shared/Modal'
import type { VaultCredential } from '@/types'

export const Route = createFileRoute('/dashboard/vault')({
  component: VaultPage,
})

const TYPE_LABELS: Record<VaultCredential['type'], string> = {
  dns: 'DNS',
  hosting: 'Hébergement',
  api: 'Clé API',
  cms: 'CMS',
  autre: 'Autre',
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

const ICONS: Record<VaultCredential['type'], React.ComponentType<{ className?: string }>> = {
  dns: Globe,
  hosting: Server,
  api: Key,
  cms: Box,
  autre: Box,
}

function VaultPage() {
  const { activeProject, loading: projectLoading } = useProject()
  const [credentials, setCredentials] = useState<VaultCredential[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<VaultCredential | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedFields, setExpandedFields] = useState<DnsFields | null>(null)
  const [expandLoading, setExpandLoading] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  async function fetchCredentials() {
    if (!activeProject) { setLoading(false); return }
    const supabase = createClient()
    const { data } = await supabase
      .from('vault_credentials')
      .select('*')
      .eq('project_id', activeProject.id)
      .order('created_at', { ascending: false })
    setCredentials(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchCredentials()
  }, [activeProject])

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
      setError('Échec de la lecture. Réessayez.')
      setExpandedId(null)
    }
    setExpandLoading(false)
  }

  async function copyField(key: string, value: string) {
    await navigator.clipboard.writeText(value)
    setCopiedField(key)
    setTimeout(() => setCopiedField(null), 1500)
  }

  if (projectLoading || loading) {
    return (
      <div className="h-full flex flex-col">
        <PageHeader pathItems={[{ label: 'Credentials' }]} />
        <div className="p-6 animate-pulse h-32 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        pathItems={[{ label: 'Credentials' }]}
        secondBarRight={
          activeProject ? (
            <button onClick={() => { setEditing(null); setShowForm(true) }}
              className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
              <Plus className="w-3.5 h-3.5" />Ajouter
            </button>
          ) : undefined
        }
      />
      <div className="flex-1 overflow-y-auto">
        {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 m-6 mb-0">{error}</p>}
        {!activeProject || credentials.length === 0 ? (
          <EmptyState
            title="Aucun credential"
            description="Ajoutez vos accès (hébergement, API, etc.) en toute sécurité — ils sont chiffrés avant d'être stockés."
            variant="cards"
          />
        ) : (
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
                const Icon = ICONS[cred.type]
                const isExpanded = expandedId === cred.id
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
                      <td className="px-4 py-3 text-gray-500 text-xs">{TYPE_LABELS[cred.type]}</td>
                      <td className="px-4 py-3 pr-6">
                        <div className="flex items-center justify-end gap-1">
                          {cred.type === 'dns' && (
                            <button
                              onClick={() => toggleExpand(cred)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                              title={isExpanded ? 'Masquer' : 'Voir les champs'}
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          <button
                            onClick={() => { setEditing(cred); setShowForm(true) }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Modifier"
                          >
                            <Pencil className="w-3.5 h-3.5" />
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
        )}
      </div>

      {showForm && activeProject && (
        <CredentialFormModal
          projectId={activeProject.id}
          editing={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchCredentials() }}
        />
      )}
    </div>
  )
}

function CredentialFormModal({ projectId, editing, onClose, onSaved }: {
  projectId: string
  editing: VaultCredential | null
  onClose: () => void
  onSaved: () => void
}) {
  const [label, setLabel] = useState(editing?.label ?? '')
  const [service, setService] = useState(editing?.service ?? '')
  const [type, setType] = useState<VaultCredential['type']>(editing?.type ?? 'api')
  const [value, setValue] = useState('')
  const [showValue, setShowValue] = useState(false)
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
      setError("Une erreur est survenue. Réessayez.")
    }

    setSaving(false)
  }

  return (
    <Modal title={editing ? 'Modifier le credential' : 'Ajouter un credential'} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Libellé</label>
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Ex : Clé API Stripe"
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
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Service (optionnel)</label>
            <input
              value={service}
              onChange={e => setService(e.target.value)}
              placeholder="Ex : Stripe, OVH"
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
            <div className="relative">
              <input
                type={showValue ? 'text' : 'password'}
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder={editing ? 'Resaisissez la valeur pour la modifier' : '••••••••••'}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-300"
              />
              <button type="button" onClick={() => setShowValue(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
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
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
