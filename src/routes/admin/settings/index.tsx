import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Bell, Shield, Lock, Download, AlertTriangle, Check, Eye, EyeOff, Save } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import PageHeader from '@/components/layout/PageHeader'

export const Route = createFileRoute('/admin/settings/')({
  component: SettingsPage,
})

type Section = 'profil' | 'general' | 'securite' | 'donnees'

const NAV = [
  {
    section: 'COMPTE',
    items: [{ id: 'profil' as Section, label: 'Profil' }],
  },
  {
    section: 'PRÉFÉRENCES',
    items: [{ id: 'general' as Section, label: 'Général' }],
  },
  {
    section: 'SÉCURITÉ',
    items: [
      { id: 'securite' as Section, label: 'Confidentialité' },
      { id: 'donnees' as Section, label: 'Données' },
    ],
  },
]

function SettingsPage() {
  const [active, setActive] = useState<Section>('profil')

  return (
    <div className="flex flex-col h-full">
      <PageHeader pathItems={[{ label: 'Paramètres' }]} />

    <div className="flex flex-1 overflow-hidden">
      {/* Left nav */}
      <div className="w-52 border-r border-gray-100 py-6 px-3 shrink-0">
        {NAV.map(group => (
          <div key={group.section} className="mb-5">
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              {group.section}
            </p>
            {group.items.map(item => (
              <button key={item.id} onClick={() => setActive(item.id)}
                className={cn(
                  'w-full text-left px-2.5 py-1.5 rounded-lg text-[13px] transition-colors',
                  active === item.id
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                )}>
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-10 py-8 max-w-2xl">
        {active === 'profil' && <ProfilSection />}
        {active === 'general' && <GeneralSection />}
        {active === 'securite' && <SecuriteSection />}
        {active === 'donnees' && <DonneesSection />}
      </div>
    </div>
    </div>
  )
}

function ProfilSection() {
  const { profile, user } = useAuth()
  const supabase = createClient()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const email = profile?.email ?? user?.email ?? ''
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    // Les admins n'ont pas de champ "nom complet" en base — stocké côté metadata utilisateur uniquement
    await supabase.auth.updateUser({ data: { full_name: fullName } })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const initials = (fullName || email).split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Profil</h1>

      <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-100">
        <div className="w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center shrink-0">
          <span className="text-white text-lg font-semibold">{initials}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{fullName || email}</p>
          <p className="text-xs text-gray-400 mt-0.5">{email}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5 max-w-sm">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Nom complet</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)}
            placeholder="Votre nom"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-300" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Adresse email</label>
          <input value={email} disabled
            className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-400 cursor-not-allowed" />
          <p className="text-[11px] text-gray-400 mt-1">L'email ne peut pas être modifié ici.</p>
        </div>
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
          {saved ? <><Check className="w-4 h-4" />Enregistré</> : <><Save className="w-4 h-4" />{saving ? 'Enregistrement...' : 'Enregistrer'}</>}
        </button>
      </form>
    </div>
  )
}

function GeneralSection() {
  const [notifRdv, setNotifRdv] = useState(true)
  const [notifTache, setNotifTache] = useState(true)
  const [notifAts, setNotifAts] = useState(false)

  return (
    <div className="space-y-10">
      <h1 className="text-xl font-semibold text-gray-900">Général</h1>

      {/* Thème */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900">Thème</span>
        </div>
        <p className="text-xs text-gray-400 mb-4">Choisissez l'apparence de l'application.</p>
        <div className="grid grid-cols-3 gap-3 max-w-sm">
          {/* Clair — actif */}
          <button className="border-2 border-blue-500 rounded-xl overflow-hidden text-left focus:outline-none">
            <div className="h-16 bg-white relative border-b border-gray-100">
              <div className="absolute inset-0 flex">
                <div className="w-1/3 bg-gray-50 border-r border-gray-100" />
                <div className="flex-1 p-2 space-y-1.5">
                  <div className="h-1.5 bg-gray-200 rounded w-3/4" />
                  <div className="h-1.5 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            </div>
            <div className="px-2.5 py-2 bg-white">
              <span className="text-xs font-medium text-gray-900">Clair</span>
            </div>
          </button>

          {/* Sombre — bientôt */}
          {[{ label: 'Sombre' }, { label: 'Système' }].map(t => (
            <button key={t.label} disabled
              className="border-2 border-transparent rounded-xl overflow-hidden text-left opacity-50 cursor-not-allowed">
              <div className="h-16 bg-gray-800 relative border-b border-gray-700">
                <div className="absolute inset-0 flex">
                  <div className="w-1/3 bg-gray-900 border-r border-gray-700" />
                  <div className="flex-1 p-2 space-y-1.5">
                    <div className="h-1.5 bg-gray-600 rounded w-3/4" />
                    <div className="h-1.5 bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              </div>
              <div className="px-2.5 py-2 bg-gray-800 flex items-center justify-between">
                <span className="text-xs text-gray-300">{t.label}</span>
                <span className="text-[10px] text-gray-500">Bientôt</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="border-t border-gray-100 pt-8">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-900">Notifications</span>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { label: 'Rappels de rendez-vous par email', value: notifRdv, set: setNotifRdv },
            { label: 'Alertes tâches en retard', value: notifTache, set: setNotifTache },
            { label: 'Nouvelles candidatures ATS', value: notifAts, set: setNotifAts },
          ].map(({ label, value, set }) => (
            <div key={label} className="flex items-center justify-between py-3">
              <span className="text-sm text-gray-600">{label}</span>
              <Toggle value={value} onChange={set} />
            </div>
          ))}
        </div>
      </div>

      {/* Langue */}
      <div className="border-t border-gray-100 pt-8">
        <span className="text-sm font-medium text-gray-900 block mb-3">Langue</span>
        <select className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300">
          <option value="fr">Français</option>
        </select>
      </div>
    </div>
  )
}

function SecuriteSection() {
  const supabase = createClient()
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  async function handleChangePwd(e: React.FormEvent) {
    e.preventDefault()
    if (newPwd !== confirmPwd) { setPwdMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas.' }); return }
    if (newPwd.length < 8) { setPwdMsg({ type: 'error', text: 'Minimum 8 caractères.' }); return }
    setPwdSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPwd })
    setPwdSaving(false)
    if (error) setPwdMsg({ type: 'error', text: error.message })
    else { setPwdMsg({ type: 'ok', text: 'Mot de passe modifié.' }); setNewPwd(''); setConfirmPwd('') }
    setTimeout(() => setPwdMsg(null), 4000)
  }

  return (
    <div className="space-y-10">
      <h1 className="text-xl font-semibold text-gray-900">Confidentialité</h1>

      {/* Changer mot de passe */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-900">Changer le mot de passe</span>
        </div>
        <p className="text-xs text-gray-400 mb-4">Minimum 8 caractères.</p>
        <form onSubmit={handleChangePwd} className="space-y-3 max-w-sm">
          <div className="relative">
            <input type={showPwd ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)}
              placeholder="Nouveau mot de passe" required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm pr-9 focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-300" />
            <button type="button" onClick={() => setShowPwd(v => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <input type={showPwd ? 'text' : 'password'} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
            placeholder="Confirmer le mot de passe" required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-300" />
          {pwdMsg && (
            <p className={cn('text-xs px-3 py-2 rounded-lg', pwdMsg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600')}>
              {pwdMsg.text}
            </p>
          )}
          <button type="submit" disabled={pwdSaving}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
            <Lock className="w-3.5 h-3.5" />
            {pwdSaving ? 'Modification...' : 'Modifier le mot de passe'}
          </button>
        </form>
      </div>

      {/* 2FA */}
      <div className="border-t border-gray-100 pt-8">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-900">Sécurité avancée</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-gray-50">
          <span className="text-sm text-gray-600">Authentification à deux facteurs</span>
          <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Bientôt</span>
        </div>
      </div>
    </div>
  )
}

function DonneesSection() {
  const { user } = useAuth()
  const supabase = createClient()
  const [deleteConfirm, setDeleteConfirm] = useState('')

  return (
    <div className="space-y-10">
      <h1 className="text-xl font-semibold text-gray-900">Données</h1>

      {/* Export */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Download className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-900">Exporter mes données</span>
        </div>
        <p className="text-xs text-gray-400 mb-4">Téléchargez vos données personnelles à tout moment.</p>
        <button className="text-sm border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors text-gray-700">
          Télécharger mes données
        </button>
      </div>

      {/* Zone dangereuse */}
      <div className="border-t border-gray-100 pt-8">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span className="text-sm font-medium text-rose-600">Zone dangereuse</span>
        </div>
        <div className="border border-rose-200 bg-rose-50 rounded-xl p-5">
          <p className="text-sm font-medium text-rose-900 mb-1">Supprimer mon compte</p>
          <p className="text-xs text-rose-700/70 mb-4">Cette action est irréversible. Toutes vos données associées seront définitivement perdues.</p>
          <div className="flex items-center gap-3 flex-wrap">
            <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
              placeholder='Tapez "SUPPRIMER" pour confirmer'
              className="text-sm border border-rose-200 bg-white px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-300 w-64 placeholder:text-rose-300" />
            {deleteConfirm === 'SUPPRIMER' && (
              <button
                onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}
                className="text-sm border border-red-300 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                Confirmer la suppression
              </button>
            )}
          </div>
        </div>
      </div>

      {user && (
        <div className="border-t border-gray-100 pt-6 text-[11px] text-gray-300">
          Compte créé le {new Date(user.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      )}
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={cn('relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200', value ? 'bg-gray-900' : 'bg-gray-200')}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5',
          value ? 'translate-x-[22px]' : 'translate-x-0.5'
        )}
      />
    </button>
  )
}
