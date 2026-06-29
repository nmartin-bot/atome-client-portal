import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Project } from '@/types'

interface ProjectContextValue {
  activeProject: Project | null
  setActiveProject: (project: Project) => void
  projects: Project[]
  loading: boolean
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProjects() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', session.user.id)
        .order('created_at', { ascending: true })

      setProjects(data ?? [])
      setActiveProject(data?.[0] ?? null)
      setLoading(false)
    }

    fetchProjects()
  }, [])

  return (
    <ProjectContext.Provider value={{ activeProject, setActiveProject, projects, loading }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject doit être utilisé dans un ProjectProvider')
  return ctx
}
