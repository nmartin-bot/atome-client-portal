import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    async function waitForSession() {
      const supabase = createClient()

      // Le flow "implicit" place les jetons dans le fragment d'URL (#access_token=...)
      // et detectSessionInUrl les traite automatiquement à la création du client.
      // On attend simplement que la session apparaisse.
      let session = (await supabase.auth.getSession()).data.session

      if (!session) {
        session = await new Promise(resolve => {
          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
            subscription.unsubscribe()
            resolve(s)
          })
          setTimeout(() => { subscription.unsubscribe(); resolve(null) }, 4000)
        })
      }

      if (!session) {
        setError('Ce lien a expiré. Demandez un nouveau lien de réinitialisation.')
        return
      }

      setReady(true)
    }

    waitForSession()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setError("Une erreur est survenue. Réessayez.")
    else setDone(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src="/logo-atome.svg" alt="Atome" className="w-8 h-8" />
          <span className="font-semibold text-gray-900 text-lg">Atome</span>
        </div>

        <div className="border border-gray-100 rounded-2xl p-8 shadow-[0_1px_8px_rgba(0,0,0,0.06)] bg-white">
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-gray-900">Nouveau mot de passe</h1>
          </div>

          {done ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-green-600 text-xl">✓</span>
              </div>
              <p className="text-xs text-gray-500">Mot de passe mis à jour.</p>
              <button onClick={() => navigate({ to: '/' })} className="text-xs text-blue-600 hover:underline">
                Continuer
              </button>
            </div>
          ) : error ? (
            <div className="text-center space-y-4">
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              <button onClick={() => navigate({ to: '/login' })} className="text-xs text-blue-600 hover:underline">
                Retour à la connexion
              </button>
            </div>
          ) : ready ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5" htmlFor="password">
                  Nouveau mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {loading ? '...' : 'Valider'}
              </button>
            </form>
          ) : (
            <p className="text-center text-xs text-gray-400">Vérification du lien...</p>
          )}
        </div>
      </div>
    </div>
  )
}
