"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

type Project = {
  id: number
  name: string
  description: string | null
  userId: string
  createdAt: Date
  updatedAt: Date
}

type ProjectContextType = {
  selectedProject: Project | null
  setSelectedProject: (project: Project | null) => void
  projects: Project[]
  fetchProjects: () => Promise<void>
  sidebarContent: ReactNode | null
  setSidebarContent: (content: ReactNode | null) => void
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [sidebarContent, setSidebarContent] = useState<ReactNode | null>(null)

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
        if (!selectedProject && data.length > 0) {
          setSelectedProject(data[0])
        }
        // If current selected project was deleted, select first project
        if (selectedProject && !data.find((p: Project) => p.id === selectedProject.id)) {
          setSelectedProject(data[0] || null)
        }
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  return (
    <ProjectContext.Provider value={{ selectedProject, setSelectedProject, projects, fetchProjects, sidebarContent, setSidebarContent }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider")
  }
  return context
}
