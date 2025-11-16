"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { signOut } from "next-auth/react"
import ManageProjects from "../components/manage-projects"
import { useProject } from "./ProjectContext"
import { Session } from "next-auth"

export default function ToolsLayoutClient({ children, session }: { children: React.ReactNode; session: Session | null }) {
  const router = useRouter()
  const pathname = usePathname()
  const { selectedProject, setSelectedProject, projects, fetchProjects, sidebarContent } = useProject()
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [isManagingProjects, setIsManagingProjects] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleProjectChange = (value: string) => {
    if (value === "create_new") {
      setIsCreatingProject(true)
      setIsManagingProjects(false)
    } else if (value === "manage_projects") {
      setIsManagingProjects(true)
      setIsCreatingProject(false)
    } else {
      const project = projects.find(p => p.id === parseInt(value))
      setSelectedProject(project || null)
      setIsCreatingProject(false)
      setIsManagingProjects(false)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName, description: projectDescription }),
      })

      if (!response.ok) throw new Error("Failed to create project")

      const newProject = await response.json()
      await fetchProjects() // Refresh projects from server
      setSelectedProject(newProject)
      setProjectName("")
      setProjectDescription("")
      setIsCreatingProject(false)
      router.refresh()
    } catch (error) {
      console.error("Error creating project:", error)
      alert("Failed to create project")
    } finally {
      setIsSubmitting(false)
    }
  }

  const tools = [
    { name: "Text Summarizer", path: "/tools/text-summarizer" },
    { name: "Text to Image", path: "/tools/text-to-image" },
    { name: "Character Consistent Image", path: "/tools/character-consistent-image" },
  ]

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Top Header Bar */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-indigo-600">
              Poster
            </h1>
            <div className="flex items-center gap-4">
              {session?.user?.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              )}
              <div className="text-sm">
                <p className="font-semibold text-gray-900">{session?.user?.name}</p>
                <p className="text-gray-600">{session?.user?.email}</p>
              </div>
              <Link
                href="/account"
                className="px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-300 rounded-lg hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Account Settings
              </Link>
              <button
                onClick={() => signOut({ redirectTo: "/login" })}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col overflow-y-auto">
        {/* Projects Dropdown */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Projects
          </label>
          <select
            value={isCreatingProject ? 'create_new' : isManagingProjects ? 'manage_projects' : (selectedProject?.id || '')}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
            <option value="create_new">+ Create New Project</option>
            {projects.length > 0 && (
              <option value="manage_projects" className="font-semibold">
                -&gt; Manage Projects
              </option>
            )}
          </select>
        </div>

        {/* Tools Dropdown - Only show when not creating or managing projects */}
        {!isCreatingProject && !isManagingProjects && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tools
              </label>
              <select
                value={pathname}
                onChange={(e) => router.push(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {tools.map((tool) => (
                  <option key={tool.path} value={tool.path}>
                    {tool.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tool-specific sidebar content */}
            {sidebarContent}
          </>
        )}
        </div>

        {/* Main Panel */}
        <div className="flex-1 bg-white p-8 overflow-y-auto">
        {isManagingProjects ? (
          <ManageProjects
            onProjectsChanged={async () => {
              await fetchProjects()
              router.refresh()
            }}
          />
        ) : isCreatingProject ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Create New Project
            </h2>
            <form onSubmit={handleCreateProject} className="space-y-6 max-w-2xl">
              <div>
                <label htmlFor="projectName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label htmlFor="projectDescription" className="block text-sm font-semibold text-gray-700 mb-2">
                  Project Description
                </label>
                <textarea
                  id="projectDescription"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Describe your project (optional)"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Project"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingProject(false)
                    setProjectName("")
                    setProjectDescription("")
                  }}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          children
        )}
        </div>
      </div>
    </div>
  )
}
