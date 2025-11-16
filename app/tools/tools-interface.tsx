"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import ManageProjects from "../components/manage-projects"

type Tool = {
  id: number
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

type Project = {
  id: number
  name: string
  description: string | null
  userId: string
  createdAt: Date
  updatedAt: Date
}

type TextSummary = {
  id: number
  projectId: number
  userId: string
  name: string | null
  website: string | null
  textToSummarize: string | null
  targetWordCount: number | null
  summary: string | null
  createdAt: Date
  updatedAt: Date
}

export default function ToolsInterface({ tools, projects: initialProjects }: { tools: Tool[], projects: Project[] }) {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [selectedProject, setSelectedProject] = useState<Project | null>(projects[0] || null)
  const [selectedTool, setSelectedTool] = useState<Tool | null>(tools[0] || null)
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [isManagingProjects, setIsManagingProjects] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Text Summarizer form fields
  const [website, setWebsite] = useState("")
  const [textToSummarize, setTextToSummarize] = useState("")
  const [targetWordCount, setTargetWordCount] = useState("")
  const [generatedSummary, setGeneratedSummary] = useState("")

  // Text Summaries list
  const [textSummaries, setTextSummaries] = useState<TextSummary[]>([])
  const [selectedSummaryId, setSelectedSummaryId] = useState<number | null>(null)
  const [hoveredSummary, setHoveredSummary] = useState<number | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  // Fetch text summaries for the selected project
  const fetchTextSummaries = useCallback(async () => {
    if (!selectedProject) return

    try {
      const response = await fetch(`/api/text-summaries?projectId=${selectedProject.id}`)
      if (response.ok) {
        const data = await response.json()
        setTextSummaries(data)
      }
    } catch (error) {
      console.error("Failed to fetch text summaries:", error)
    }
  }, [selectedProject])

  // Fetch text summaries when selected project changes
  useEffect(() => {
    fetchTextSummaries()
  }, [fetchTextSummaries])

  // Fetch projects from API
  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
        // If current selected project was deleted, select first project and clear form
        if (selectedProject && !data.find((p: Project) => p.id === selectedProject.id)) {
          setSelectedProject(data[0] || null)
          // Clear all form fields and summary state
          setSelectedSummaryId(null)
          setWebsite("")
          setTextToSummarize("")
          setTargetWordCount("")
          setGeneratedSummary("")
          setTextSummaries([])
        }
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    }
  }

  // Delete handlers
  const handleDeleteClick = (summaryId: number, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent summary selection
    setDeleteConfirmId(summaryId)
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return

    try {
      const response = await fetch(`/api/text-summaries/${deleteConfirmId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Refresh the text summaries list
        await fetchTextSummaries()

        // If the deleted summary was selected, clear the form
        if (selectedSummaryId === deleteConfirmId) {
          setSelectedSummaryId(null)
          setWebsite("")
          setTextToSummarize("")
          setTargetWordCount("")
          setGeneratedSummary("")
        }

        setDeleteConfirmId(null)
      } else {
        alert("Failed to delete text summary")
      }
    } catch (error) {
      console.error("Error deleting text summary:", error)
      alert("Failed to delete text summary")
    }
  }

  const handleCancelDelete = () => {
    setDeleteConfirmId(null)
  }

  // Validation for Text Summarizer
  const isTextSummarizerValid = () => {
    const hasInput = website.trim() !== "" || textToSummarize.trim() !== ""
    const wordCount = parseInt(targetWordCount)
    const hasValidWordCount = !isNaN(wordCount) && wordCount >= 1 && wordCount <= 5000
    return hasInput && hasValidWordCount
  }

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

      // Clear summaries list to prevent showing stale data
      setTextSummaries([])

      // Clear form fields when switching projects
      setSelectedSummaryId(null)
      setWebsite("")
      setTextToSummarize("")
      setTargetWordCount("")
      setGeneratedSummary("")
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
      setProjects([newProject, ...projects])
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

  const handleTextSummarizerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!website && !textToSummarize) {
      alert("Please provide either a website URL or text to summarize")
      return
    }

    if (!selectedProject) {
      alert("Please select a project")
      return
    }

    setIsSubmitting(true)

    try {
      // Update existing summary if one is selected, otherwise create new
      const url = selectedSummaryId
        ? `/api/text-summaries/${selectedSummaryId}`
        : "/api/text-summaries"
      const method = selectedSummaryId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject.id,
          website,
          textToSummarize,
          targetWordCount,
        }),
      })

      if (!response.ok) {
        let errorMessage = "Failed to submit"
        try {
          const error = await response.json()
          errorMessage = error.error || errorMessage
        } catch {
          // If response is not JSON, use status text
          errorMessage = await response.text() || errorMessage
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      setGeneratedSummary(result.summary || "")
      setSelectedSummaryId(result.id)

      // Refresh the text summaries list
      await fetchTextSummaries()

      // Force a router refresh to ensure UI updates
      router.refresh()
    } catch (error) {
      console.error("Error submitting text summary:", error)
      alert(error instanceof Error ? error.message : "Failed to submit text summary")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-full">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4">
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
                value={selectedTool?.id || ''}
                onChange={(e) => {
                  const tool = tools.find(t => t.id === parseInt(e.target.value))
                  setSelectedTool(tool || null)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {tools.map((tool) => (
                  <option key={tool.id} value={tool.id}>
                    {tool.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Text Summaries List */}
            {selectedTool?.name === "Text summarizer" && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Text Summaries
                  </label>
                  <button
                    onClick={() => {
                      setSelectedSummaryId(null)
                      setWebsite("")
                      setTextToSummarize("")
                      setTargetWordCount("")
                      setGeneratedSummary("")
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    + New
                  </button>
                </div>
                {textSummaries.length > 0 && (
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {textSummaries.map((summary) => {
                      const title = summary.name || "Untitled"

                      return (
                        <div
                          key={summary.id}
                          className="relative"
                          onMouseEnter={() => setHoveredSummary(summary.id)}
                          onMouseLeave={() => setHoveredSummary(null)}
                        >
                          <button
                            onClick={() => {
                              setSelectedSummaryId(summary.id)
                              setWebsite(summary.website || "")
                              setTextToSummarize(summary.textToSummarize || "")
                              setTargetWordCount(summary.targetWordCount?.toString() || "")
                              setGeneratedSummary(summary.summary || "")
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors ${
                              selectedSummaryId === summary.id ? 'bg-gray-800 text-white hover:bg-gray-700 border-l-4 border-indigo-500' : 'text-gray-700'
                            }`}
                          >
                            <div className="text-sm font-medium truncate pr-8">
                              {title}
                            </div>
                          </button>

                          {/* Delete button - shown on hover */}
                          {hoveredSummary === summary.id && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              <button
                                onClick={(e) => handleDeleteClick(summary.id, e)}
                                className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400 transition-colors"
                                title="Delete summary"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Main Panel */}
      <div className="flex-1 bg-white p-8 overflow-y-auto">
        {isManagingProjects ? (
          <ManageProjects
            onProjectsChanged={async () => {
              // Re-fetch projects to update the dropdown
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
        ) : selectedTool?.name === "Text summarizer" ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {selectedTool.name}
            </h2>
            <form onSubmit={handleTextSummarizerSubmit} className="space-y-6 max-w-2xl">
              <div>
                <label htmlFor="website" className="block text-sm font-semibold text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label htmlFor="textToSummarize" className="block text-sm font-semibold text-gray-700 mb-2">
                  Text to Summarize
                </label>
                <textarea
                  id="textToSummarize"
                  value={textToSummarize}
                  onChange={(e) => setTextToSummarize(e.target.value)}
                  disabled={isSubmitting}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="Paste text here..."
                />
              </div>

              <div>
                <label htmlFor="targetWordCount" className="block text-sm font-semibold text-gray-700 mb-2">
                  Target Word Count (1-5,000)
                </label>
                <input
                  type="number"
                  id="targetWordCount"
                  value={targetWordCount}
                  onChange={(e) => setTargetWordCount(e.target.value)}
                  disabled={isSubmitting}
                  min="1"
                  max="5000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="e.g., 100"
                />
              </div>

              <div className="text-sm text-gray-600">
                * You must provide either a website URL or text to summarize (or both)
                <br />
                * Target word count must be between 1 and 5,000
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !isTextSummarizerValid()}
                className="px-6 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:bg-gray-400"
              >
                {isSubmitting ? "Generating Summary..." : "Submit"}
              </button>
            </form>

            {/* Display Generated Summary */}
            {generatedSummary && (
              <div className="mt-8 max-w-2xl">
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Summary</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {generatedSummary}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : selectedTool ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedTool.name}
            </h2>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No tool selected</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-2xl border border-gray-300">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Text Summary</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this text summary?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
