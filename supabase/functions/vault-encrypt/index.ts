// Edge Function — vault-encrypt
// Reçoit { label, service, type, value, projectId }, vérifie que l'appelant a
// accès au projet (RLS via son propre JWT), chiffre "value" en AES-256-GCM avec
// VAULT_SECRET_KEY, et stocke uniquement le résultat chiffré + un aperçu.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const ALLOWED_ORIGINS = ['https://app.atomegroup.fr', 'http://localhost:3000']

function corsHeaders(req: Request) {
  const origin = req.headers.get('Origin') ?? ''
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  }
}

function jsonResponse(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } })
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  return bytes
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

async function getKey(): Promise<CryptoKey> {
  const hex = Deno.env.get('VAULT_SECRET_KEY')!
  return crypto.subtle.importKey('raw', hexToBytes(hex), 'AES-GCM', false, ['encrypt'])
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse(req, { error: 'Non authentifié.' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return jsonResponse(req, { error: 'Non authentifié.' }, 401)

    const { label, service, type, value, projectId, credentialId } = await req.json()
    if (!label || !type || !value || !projectId) {
      return jsonResponse(req, { error: 'Champs manquants.' }, 400)
    }

    // L'accès au projet est vérifié via RLS (le client ne peut lire que ses propres projets)
    const { data: project } = await supabase.from('projects').select('id').eq('id', projectId).maybeSingle()
    if (!project) return jsonResponse(req, { error: 'Projet introuvable ou accès refusé.' }, 403)

    const key = await getKey()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(value))
    const combined = new Uint8Array(iv.length + ciphertext.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(ciphertext), iv.length)

    const row = {
      project_id: projectId,
      label,
      service: service ?? null,
      type,
      encrypted_value: toBase64(combined),
      value_preview: `${String(value).slice(0, 3)}***`,
    }

    const { data: saved, error } = credentialId
      ? await supabase.from('vault_credentials').update(row).eq('id', credentialId).select('id').single()
      : await supabase.from('vault_credentials').insert(row).select('id').single()

    if (error) return jsonResponse(req, { error: "Échec de l'enregistrement.", detail: error.message }, 500)
    return jsonResponse(req, { success: true, id: saved.id })
  } catch (err) {
    return jsonResponse(req, { error: 'Erreur interne.', detail: String(err) }, 500)
  }
})
