import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useProject } from '@/lib/projectContext'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import ChatBar from '@/components/chat/ChatBar'
import TypewriterText from '@/components/chat/TypewriterText'
import { BRIEF_SECTIONS, stripDashes } from '@/lib/briefSections'
import type { ProjectBrief } from '@/types'
import type { Json } from '@/types/database.types'

export const Route = createFileRoute('/dashboard/brief')({
  component: BriefPage,
})

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const OPENING_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: "Pouvez-vous me décrire l'outil que vous souhaitez créer en une phrase, comme si vous l'expliquiez à quelqu'un qui ne connaît pas votre secteur ?",
}

function parseBrief(text: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (let i = 0; i < BRIEF_SECTIONS.length; i++) {
    const label = BRIEF_SECTIONS[i]
    const nextLabel = BRIEF_SECTIONS[i + 1]
    const escaped = label.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
    const nextEscaped = nextLabel?.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
    const pattern = nextEscaped
      ? new RegExp(`\\*\\*${escaped}\\*\\*\\s*:\\s*([\\s\\S]*?)(?=\\*\\*${nextEscaped}\\*\\*)`)
      : new RegExp(`\\*\\*${escaped}\\*\\*\\s*:\\s*([\\s\\S]*?)(?:---\\s*$|$)`)
    const match = text.match(pattern)
    if (match) result[label] = match[1].trim()
  }
  return result
}

function BriefPage() {
  const { activeProject, loading: projectLoading } = useProject()
  const [brief, setBrief] = useState<ProjectBrief | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([OPENING_MESSAGE])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [typingIndex, setTypingIndex] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activeProject) { setLoading(false); return }

    async function fetchBrief() {
      const supabase = createClient()
      const { data } = await supabase
        .from('project_briefs')
        .select('*')
        .eq('project_id', activeProject!.id)
        .maybeSingle()

      if (data) {
        setBrief(data)
        const history = data.conversation_history as unknown as ChatMessage[] | null
        if (history && history.length > 0) setMessages(history)
      }
      setLoading(false)
    }

    fetchBrief()
  }, [activeProject])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function persistConversation(history: ChatMessage[]) {
    if (!activeProject) return
    const supabase = createClient()
    await supabase
      .from('project_briefs')
      .upsert({ project_id: activeProject.id, conversation_history: history as unknown as Json }, { onConflict: 'project_id' })
  }

  async function handleSend(content: string) {
    if (!activeProject) return
    setError(null)
    const updated = [...messages, { role: 'user' as const, content }]
    setMessages(updated)
    setSending(true)

    const supabase = createClient()
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/brief-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ messages: updated, projectId: activeProject.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur inconnue')

      const text: string = json.text

      if (text.includes('---BRIEF---')) {
        const parsed = parseBrief(text)
        const finalMessages = [...updated, { role: 'assistant' as const, content: text }]
        const { data: saved } = await supabase
          .from('project_briefs')
          .upsert(
            {
              project_id: activeProject.id,
              conversation_history: finalMessages as unknown as Json,
              meta: parsed as unknown as Json,
              submitted_at: new Date().toISOString(),
            },
            { onConflict: 'project_id' },
          )
          .select('*')
          .single()
        setMessages(finalMessages)
        if (saved) setBrief(saved)
      } else {
        const finalMessages = [...updated, { role: 'assistant' as const, content: text }]
        setMessages(finalMessages)
        setTypingIndex(finalMessages.length - 1)
        await persistConversation(finalMessages)
      }
    } catch {
      setError("Une erreur est survenue. Réessayez.")
      setMessages(updated)
    }

    setSending(false)
  }

  if (projectLoading || loading) {
    return (
      <div className="h-full flex flex-col">
        <PageHeader pathItems={[{ label: 'Brief métier' }]} />
        <div className="p-6 animate-pulse h-32 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  if (!activeProject) {
    return (
      <div className="h-full flex flex-col">
        <PageHeader pathItems={[{ label: 'Brief métier' }]} />
        <div className="flex-1 overflow-y-auto">
          <EmptyState title="Brief métier" description="Votre projet démarre bientôt." variant="list" />
        </div>
      </div>
    )
  }

  // État B — brief soumis, affichage en lecture
  if (brief?.submitted_at) {
    const meta = (brief.meta as unknown as Record<string, string> | null) ?? {}
    return (
      <div className="h-full flex flex-col">
        <PageHeader pathItems={[{ label: 'Brief métier' }]} />
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-[680px] mx-auto bg-white border border-gray-200 rounded-sm shadow-sm px-16 py-14">
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">
              {meta['Type de projet'] || activeProject.name}
            </h1>
            <p className="text-xs text-gray-400 mb-10">
              Soumis le {new Date(brief.submitted_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>

            {BRIEF_SECTIONS.filter(label => label !== 'Type de projet' && meta[label]).map((label, i) => {
              const value = meta[label]
              return (
                <div key={label} className={i > 0 ? 'mt-8 pt-8 border-t border-gray-100' : ''}>
                  <h2 className="text-[15px] font-semibold text-gray-900 mb-2">{label}</h2>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{stripDashes(value)}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // État A — conversation en cours
  const hasStarted = messages.some(m => m.role === 'user')

  return (
    <div className="h-full flex flex-col">
      <PageHeader pathItems={[{ label: 'Brief métier' }]} />

      {!hasStarted ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="max-w-2xl w-full text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Construisons votre brief</h1>
            <p className="text-sm text-gray-500">{OPENING_MESSAGE.content}</p>
          </div>
          <motion.div layoutId="brief-chatbar" className="max-w-3xl w-full">
            <ChatBar onSend={handleSend} loading={sending} />
          </motion.div>
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 pb-10">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((m, i) => {
                if (m.content.includes('---BRIEF---')) return null
                if (i === 0 && m.content === OPENING_MESSAGE.content) return null
                return (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        m.role === 'user' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {m.role === 'assistant' && i === typingIndex ? (
                        <TypewriterText
                          text={m.content}
                          onDone={() => {
                            setTypingIndex(null)
                            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
                          }}
                        />
                      ) : (
                        m.content
                      )}
                    </div>
                  </div>
                )
              })}
              {error && <p className="text-xs text-red-600 text-center">{error}</p>}
            </div>
          </div>
          <motion.div layoutId="brief-chatbar" className="max-w-3xl w-full mx-auto px-6 pb-12">
            <ChatBar onSend={handleSend} loading={sending} variant="compact" />
          </motion.div>
        </>
      )}
    </div>
  )
}
