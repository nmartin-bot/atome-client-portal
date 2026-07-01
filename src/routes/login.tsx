import { createFileRoute, redirect, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session) throw redirect({ to: '/' })
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [signupSent, setSignupSent] = useState(false)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/` },
      })
      if (error) {
        setError(error.message === 'User already registered' ? 'Un compte existe déjà avec cet email.' : "Une erreur est survenue à l'inscription.")
      } else if (data.session) {
        navigate({ to: '/' })
      } else {
        setSignupSent(true)
      }
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Identifiants incorrects. Vérifiez votre email et mot de passe.')
    } else {
      navigate({ to: '/' })
    }
    setLoading(false)
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setCodeError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' })
    if (error) {
      setCodeError('Code incorrect ou expiré. Vérifiez le dernier email reçu.')
    } else {
      navigate({ to: '/' })
    }
    setLoading(false)
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setForgotSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Form side */}
      <div className="flex flex-col items-center justify-center px-8 py-12" style={{ flex: '0 0 44%' }}>
        <div className="w-full max-w-[360px]">
          <Link to="/" className="inline-flex items-center gap-2 hover:opacity-70 transition-opacity mb-14">
            <img src="/logo-atome.svg" alt="Atome" className="h-5 w-auto" />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>Atome</span>
          </Link>

          {showForgot ? (
            <>
              <div className="mb-8">
                <h1 className="mb-2" style={{ fontWeight: 600, fontSize: 24, lineHeight: 1.25, color: '#1A1A1A' }}>
                  Mot de passe oublié
                </h1>
                <p style={{ fontSize: '13.5px', color: '#6B6B6B' }}>On vous envoie un lien de réinitialisation.</p>
              </div>

              {forgotSent ? (
                <div className="text-center space-y-4">
                  <p style={{ fontSize: '12.5px', color: '#6B6B6B' }}>
                    Un email a été envoyé à <strong>{email}</strong>.
                  </p>
                  <button onClick={() => { setShowForgot(false); setForgotSent(false) }}
                    style={{ fontSize: '12.5px', color: '#6B6B6B', fontWeight: 500 }} className="hover:text-black transition-colors">
                    ← Retour à la connexion
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-3.5">
                  <div>
                    <label className="block mb-1.5" style={{ fontSize: '12.5px', fontWeight: 500, color: '#6B6B6B' }}>Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full rounded-[0.65rem] outline-none transition-colors"
                      style={{ border: '1px solid rgba(0,0,0,0.1)', padding: '10px 14px', fontSize: '13.5px', color: '#1A1A1A' }}
                      placeholder="vous@exemple.com"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-[0.65rem] hover:opacity-85 transition-opacity disabled:opacity-50"
                    style={{ background: 'linear-gradient(180deg, #2a2a2a 0%, #0a0a0a 100%)', color: '#fff', padding: '11px 0', fontSize: '13.5px', fontWeight: 500, marginTop: 4 }}
                  >
                    {loading ? 'Envoi...' : 'Envoyer le lien'}
                  </button>
                  <button type="button" onClick={() => setShowForgot(false)}
                    className="w-full" style={{ fontSize: '12.5px', color: '#B0B0B0', padding: '4px 0' }}>
                    ← Retour
                  </button>
                </form>
              )}
            </>
          ) : signupSent ? (
            <>
              <div className="mb-8">
                <h1 className="mb-2" style={{ fontWeight: 600, fontSize: 24, lineHeight: 1.25, color: '#1A1A1A' }}>
                  Vérifiez votre email
                </h1>
                <p style={{ fontSize: '13.5px', color: '#6B6B6B' }}>
                  Entrez le code envoyé à <strong>{email}</strong>.
                </p>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-3.5">
                <div>
                  <label className="block mb-1.5" style={{ fontSize: '12.5px', fontWeight: 500, color: '#6B6B6B' }}>Code de confirmation</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={8}
                    required
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full rounded-[0.65rem] outline-none transition-colors text-center tracking-[0.3em]"
                    style={{ border: '1px solid rgba(0,0,0,0.1)', padding: '10px 14px', fontSize: '18px', color: '#1A1A1A' }}
                    placeholder="••••••••"
                  />
                </div>

                {codeError && (
                  <div style={{ fontSize: 12, color: '#E5484D', paddingTop: 2 }}>{codeError}</div>
                )}

                <button
                  type="submit"
                  disabled={loading || code.length < 6}
                  className="w-full rounded-[0.65rem] hover:opacity-85 transition-opacity disabled:opacity-50"
                  style={{ background: 'linear-gradient(180deg, #2a2a2a 0%, #0a0a0a 100%)', color: '#fff', padding: '11px 0', fontSize: '13.5px', fontWeight: 500, marginTop: 4 }}
                >
                  {loading ? '...' : 'Valider'}
                </button>
              </form>

              <button onClick={() => { setMode('login'); setSignupSent(false); setCode(''); setCodeError(null) }}
                className="mt-6 hover:text-black transition-colors"
                style={{ fontSize: '12.5px', color: '#6B6B6B', fontWeight: 500 }}>
                ← Retour à la connexion
              </button>
            </>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="mb-2" style={{ fontWeight: 600, fontSize: 24, lineHeight: 1.25, color: '#1A1A1A' }}>
                  {mode === 'signup' ? 'Créer votre compte' : "Connexion à l'espace client"}
                </h1>
                <p style={{ fontSize: '13.5px', color: '#6B6B6B' }}>
                  {mode === 'signup' ? 'Créez votre accès à votre espace client Atome.' : 'Accédez à vos projets, livrables et échanges.'}
                </p>
              </div>

              {/* Google OAuth */}
              <button
                onClick={handleGoogle}
                type="button"
                className="w-full flex items-center justify-center gap-2.5 rounded-[0.65rem] hover:bg-gray-50 transition-colors mb-5"
                style={{ border: '1px solid rgba(0,0,0,0.1)', padding: '10px 0', fontSize: '13.5px', fontWeight: 500, color: '#1A1A1A' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continuer avec Google
              </button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }} />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3" style={{ fontSize: '11.5px', color: '#B0B0B0' }}>ou</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block mb-1.5" style={{ fontSize: '12.5px', fontWeight: 500, color: '#6B6B6B' }}>Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-[0.65rem] outline-none transition-colors"
                    style={{ border: '1px solid rgba(0,0,0,0.1)', padding: '10px 14px', fontSize: '13.5px', color: '#1A1A1A' }}
                    placeholder="vous@exemple.com"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label style={{ fontSize: '12.5px', fontWeight: 500, color: '#6B6B6B' }}>Mot de passe</label>
                    {mode === 'login' && (
                      <button type="button" onClick={() => setShowForgot(true)}
                        style={{ fontSize: '12px', color: '#6B6B6B' }} className="hover:text-black transition-colors">
                        Mot de passe oublié ?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-[0.65rem] outline-none transition-colors"
                    style={{ border: '1px solid rgba(0,0,0,0.1)', padding: '10px 14px', fontSize: '13.5px', color: '#1A1A1A' }}
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <div style={{ fontSize: 12, color: '#E5484D', paddingTop: 2 }}>{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-[0.65rem] hover:opacity-85 transition-opacity disabled:opacity-50"
                  style={{ background: 'linear-gradient(180deg, #2a2a2a 0%, #0a0a0a 100%)', color: '#fff', padding: '11px 0', fontSize: '13.5px', fontWeight: 500, marginTop: 4 }}
                >
                  {loading ? '...' : mode === 'signup' ? 'Créer mon compte' : 'Se connecter'}
                </button>
              </form>

              <p className="text-center mt-7" style={{ fontSize: '12.5px', color: '#B0B0B0' }}>
                {mode === 'signup' ? (
                  <>Déjà client ?{' '}
                    <button onClick={() => { setMode('login'); setError(null) }}
                      className="hover:text-black transition-colors" style={{ color: '#6B6B6B', fontWeight: 500 }}>
                      Se connecter
                    </button>
                  </>
                ) : (
                  <>Pas encore client ?{' '}
                    <button onClick={() => { setMode('signup'); setError(null) }}
                      className="hover:text-black transition-colors" style={{ color: '#6B6B6B', fontWeight: 500 }}>
                      Démarrez un projet →
                    </button>
                  </>
                )}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Visual side */}
      <div className="hidden md:flex relative overflow-hidden" style={{ flex: 1, background: '#f0ede8' }}>
        <img src="/login-bg.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" />
        <div
          className="absolute flex flex-col rounded-[0.85rem] overflow-hidden"
          style={{ top: 64, left: 64, right: -120, bottom: -120, background: '#fff', boxShadow: '0 40px 90px -20px rgba(0,0,0,0.18)', border: '6px solid rgba(0,0,0,0.06)' }}
        >
          <div className="flex flex-1" style={{ minHeight: 0 }}>
            {/* Sidebar */}
            <div className="flex flex-col flex-shrink-0" style={{ width: 210, borderRight: '1px solid rgba(0,0,0,0.06)', padding: '18px 14px' }}>
              <div className="flex items-center gap-2 mb-7 px-1">
                <span className="rounded-[0.3rem] flex items-center justify-center flex-shrink-0" style={{ width: 18, height: 18, background: '#1A1A1A' }}>
                  <img src="/logo-atome-white.svg" alt="" style={{ width: 11, height: 11 }} />
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>Espace client</span>
              </div>

              <div style={{ fontSize: '9.5px', fontWeight: 600, color: '#B0B0B0', letterSpacing: '0.06em', marginBottom: 7, padding: '0 6px' }}>MODULES</div>
              <div className="flex flex-col gap-0.5 mb-1">
                <div className="flex items-center gap-2 rounded-[0.4rem] px-2 py-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>
                  <span style={{ fontSize: '11.5px', color: '#6B6B6B' }}>Tableau de bord</span>
                </div>
                <div className="flex items-center gap-2 rounded-[0.4rem] px-2 py-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  <span style={{ fontSize: '11.5px', color: '#6B6B6B' }}>Agenda</span>
                </div>
                <div className="flex items-center gap-2 rounded-[0.4rem] px-2 py-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                  <span style={{ fontSize: '11.5px', color: '#6B6B6B' }}>Documents</span>
                </div>
                <div className="flex items-center gap-2 rounded-[0.4rem] px-2 py-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                  <span style={{ fontSize: '11.5px', color: '#6B6B6B' }}>Échanges</span>
                </div>
              </div>

              <div style={{ fontSize: '9.5px', fontWeight: 600, color: '#B0B0B0', letterSpacing: '0.06em', margin: '14px 0 7px', padding: '0 6px' }}>COMMERCIAL</div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 rounded-[0.45rem] px-2 py-1.5" style={{ background: '#F4F4F5' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="15" y2="17" /></svg>
                  <span style={{ fontSize: '11.5px', fontWeight: 500, color: '#1A1A1A' }}>Devis</span>
                </div>
                <div className="flex items-center gap-2 rounded-[0.4rem] px-2 py-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                  <span style={{ fontSize: '11.5px', color: '#6B6B6B' }}>Factures</span>
                </div>
              </div>

              <div style={{ fontSize: '9.5px', fontWeight: 600, color: '#B0B0B0', letterSpacing: '0.06em', margin: '14px 0 7px', padding: '0 6px' }}>SYSTÈME</div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 rounded-[0.4rem] px-2 py-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                  <span style={{ fontSize: '11.5px', color: '#6B6B6B' }}>Paramètres</span>
                </div>
              </div>

              <div className="flex-1" />
              <div className="flex items-center gap-2 rounded-[0.5rem] px-2 py-2" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 12 }}>
                <span className="rounded-full flex items-center justify-center flex-shrink-0" style={{ width: 22, height: 22, background: '#1A1A1A' }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: '#fff' }}>N</span>
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: '#1A1A1A', whiteSpace: 'nowrap' }}>n.martin@untitled-hr.com</div>
                  <div style={{ fontSize: '9.5px', color: '#B0B0B0' }}>Membre</div>
                </div>
              </div>
            </div>

            {/* Main */}
            <div className="flex-1 flex flex-col" style={{ minWidth: 0 }}>
              {/* Topbar */}
              <div className="flex items-center justify-between" style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div className="flex items-center gap-1.5">
                  <span style={{ fontSize: 13, color: '#B0B0B0' }}>Commercial</span>
                  <span style={{ fontSize: 13, color: '#D4D4D8' }}>›</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>Devis</span>
                </div>
                <div className="flex items-center gap-3.5">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                  <span className="rounded-full flex items-center justify-center" style={{ width: 24, height: 24, background: '#1A1A1A' }}>
                    <span style={{ fontSize: '9.5px', fontWeight: 600, color: '#fff' }}>N</span>
                  </span>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex items-center justify-between" style={{ padding: '12px 20px' }}>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full" style={{ border: '1px solid rgba(0,0,0,0.1)', padding: '5px 11px', fontSize: 12, color: '#6B6B6B' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                    Filtrer
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full" style={{ border: '1px solid rgba(0,0,0,0.1)', padding: '5px 11px', fontSize: 12, color: '#6B6B6B' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h11M3 12h7M3 17h4" /><path d="M17 4v16m0 0 3-3m-3 3-3-3" /></svg>
                    Trier
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: 12, color: '#B0B0B0' }}>0 devis</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full text-white" style={{ background: 'linear-gradient(180deg, #2a2a2a 0%, #0a0a0a 100%)', padding: '6px 13px', fontSize: 12, fontWeight: 500 }}>
                    + Nouveau devis
                  </span>
                </div>
              </div>

              {/* Empty state */}
              <div className="flex-1 flex flex-col items-center justify-center" style={{ padding: '0 24px 32px' }}>
                <div className="flex flex-col gap-3 mb-8" style={{ width: '100%', maxWidth: 380 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 rounded-[0.6rem] px-4 py-3.5" style={{ border: '1px solid rgba(0,0,0,0.06)', opacity: 1 - i * 0.18 }}>
                      <span className="rounded-[0.4rem] flex-shrink-0" style={{ width: 28, height: 28, background: '#F0F0F0' }} />
                      <div className="flex-1">
                        <div className="rounded-full mb-1.5" style={{ width: '65%', height: 8, background: '#EDEDED' }} />
                        <div className="rounded-full" style={{ width: '40%', height: 6, background: '#F2F2F2' }} />
                      </div>
                      <span className="rounded-full" style={{ width: 38, height: 14, background: '#F2F2F2' }} />
                      <span className="rounded-full" style={{ width: 16, height: 14, background: '#F2F2F2' }} />
                    </div>
                  ))}
                </div>
                <p className="mb-1.5" style={{ fontSize: 16, fontWeight: 600, color: '#1A1A1A' }}>Aucun devis</p>
                <p className="mb-5 text-center" style={{ fontSize: '12.5px', color: '#B0B0B0', maxWidth: 280 }}>
                  Créez vos devis et suivez leur statut jusqu'à la signature.
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-full text-white" style={{ background: 'linear-gradient(180deg, #2a2a2a 0%, #0a0a0a 100%)', padding: '9px 16px', fontSize: 13, fontWeight: 500 }}>
                  + Nouveau devis
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
