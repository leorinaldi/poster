"use client"

import { useState, useEffect } from "react"

type Project = {
  id: number
  name: string
  description: string | null
}

type ManageProjectsProps = {
  onProjectsChanged: () => void
}

export default function ManageProjects({ onProjectsChanged }: ManageProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (project: Project) => {
    setEditingId(project.id)
    setEditName(project.name)
    setEditDescription(project.description || "")
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName("")
    setEditDescription("")
  }

  const handleSaveEdit = async () => {
    if (!editingId) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/projects/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
        }),
      })

      if (response.ok) {
        await fetchProjects()
        setEditingId(null)
        setEditName("")
        setEditDescription("")
        onProjectsChanged()
      } else {
        alert("Failed to update project")
      }
    } catch (error) {
      console.error("Failed to update project:", error)
      alert("Failed to update project")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteClick = (projectId: number) => {
    setDeleteConfirmId(projectId)
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return

    try {
      const response = await fetch(`/api/projects/${deleteConfirmId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchProjects()
        onProjectsChanged()
      } else {
        const errorText = await response.text()
        alert(errorText || "Failed to delete project")
      }
    } catch (error) {
      console.error("Failed to delete project:", error)
      alert("Failed to delete project")
    } finally {
      setDeleteConfirmId(null)
    }
  }

  const handleCancelDelete = () => {
    setDeleteConfirmId(null)
  }

  if (isLoading) {
    return (
      <div className="h-full bg-white flex items-center justify-center">
        <p className="text-gray-500">Loading projects...</p>
      </div>
    )
  }

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-300 bg-indigo-50">
        <h3 className="text-lg font-semibold text-gray-900">Manage Projects</h3>
        <p className="text-sm text-gray-600">Edit or delete your projects</p>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm"
            >
              {editingId === project.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      maxLength={500}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveEdit}
                      disabled={isSaving || !editName.trim()}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {project.name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    {project.description || "No description"}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEdit(project)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(project.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-2xl border border-gray-300">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Project</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this project?
            </p>
            <p className="text-red-600 font-semibold mb-4">
              All text summaries in this project will be deleted.
            </p>
            <p className="text-gray-600 mb-6">This action cannot be undone.</p>
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
