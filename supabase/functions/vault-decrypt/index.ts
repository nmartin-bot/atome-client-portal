// Edge Function — vault-decrypt
// Reçoit { credentialId }, vérifie que l'appelant est ADMIN ou le client
// propriétaire du projet concerné, déchiffre la valeur avec VAULT_SECRET_KEY
// et la retourne — jamais stockée en clair en base ni mise en cache côté client.
// Chaque déchiffrement réussi est journalisé dans vault_access_log.

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

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function getKey(): Promise<CryptoKey> {
  const hex = Deno.env.get('VAULT_SECRET_KEY')!
  return crypto.subtle.importKey('raw', hexToBytes(hex), 'AES-GCM', false, ['decrypt'])
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

    const { credentialId } = await req.json()
    if (!credentialId) return jsonResponse(req, { error: 'credentialId manquant.' }, 400)

    const { data: credential } = await supabase
      .from('vault_credentials')
      .select('encrypted_value, project_id, projects(client_id)')
      .eq('id', credentialId)
      .maybeSingle()

    if (!credential) return jsonResponse(req, { error: 'Credential introuvable.' }, 404)

    const { data: admin } = await supabase.from('admins').select('id').eq('id', user.id).maybeSingle()
    const ownerClientId = (credential.projects as unknown as { client_id: string } | null)?.client_id
    const isOwner = ownerClientId === user.id

    if (!admin && !isOwner) return jsonResponse(req, { error: 'Accès refusé.' }, 403)

    const key = await getKey()
    const combined = fromBase64(credential.encrypted_value)
    const iv = combined.slice(0, 12)
    const ciphertext = combined.slice(12)
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)

    // Journal d'accès persistant — qui a déchiffré quoi, et quand
    await supabase.from('vault_access_log').insert({
      credential_id: credentialId,
      accessed_by: user.id,
      accessed_by_role: admin ? 'admin' : 'client',
    })

    return jsonResponse(req, { value: new TextDecoder().decode(plaintext) })
  } catch (err) {
    return jsonResponse(req, { error: 'Erreur interne.', detail: String(err) }, 500)
  }
})
