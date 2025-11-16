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

type GeneratedImage = {
  id: number
  imageGenerationRequestId: number
  imageUrl: string
  createdAt: Date
  updatedAt: Date
}

type ImageGenerationRequest = {
  id: number
  projectId: number
  userId: string
  name: string | null
  prompt: string
  numberOfImages: number
  createdAt: Date
  updatedAt: Date
  generatedImages: GeneratedImage[]
}

type CharacterConsistentGeneratedImage = {
  id: number
  characterConsistentImageRequestId: number
  imageUrl: string
  createdAt: Date
  updatedAt: Date
}

type LeonardoModel = {
  id: number
  name: string
  modelId: string
  preprocessorId: number
  photoRealAvailable: boolean
  photoRealDefault: boolean
  photoRealVersion: string
  alchemyAvailable: boolean
  alchemyDefault: boolean
  isActive: boolean
  displayOrder: number
}

type CharacterConsistentImageRequest = {
  id: number
  projectId: number
  userId: string
  name: string | null
  prompt: string
  referenceImageUrl: string
  leonardoImageId: string
  strengthType: string
  modelId: string | null
  width: number
  height: number
  photoReal: boolean
  alchemy: boolean
  numberOfImages: number
  createdAt: Date
  updatedAt: Date
  characterConsistentGeneratedImages: CharacterConsistentGeneratedImage[]
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

  // Image Generation form fields
  const [imagePrompt, setImagePrompt] = useState("")
  const [numberOfImages, setNumberOfImages] = useState("1")
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])

  // Image Generation Requests list
  const [imageGenerationRequests, setImageGenerationRequests] = useState<ImageGenerationRequest[]>([])
  const [selectedImageRequestId, setSelectedImageRequestId] = useState<number | null>(null)
  const [hoveredImageRequest, setHoveredImageRequest] = useState<number | null>(null)
  const [deleteImageConfirmId, setDeleteImageConfirmId] = useState<number | null>(null)

  // Character Consistent Image Generation form fields
  const [characterPrompt, setCharacterPrompt] = useState("")
  const [referenceImage, setReferenceImage] = useState<File | null>(null)
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null)
  const [strengthType, setStrengthType] = useState("Mid")
  const [leonardoModels, setLeonardoModels] = useState<LeonardoModel[]>([])
  const [selectedModel, setSelectedModel] = useState<LeonardoModel | null>(null)
  const [dimensions, setDimensions] = useState("1024x1024")
  const [photoReal, setPhotoReal] = useState(true)
  // Note: Alchemy is automatically tied to PhotoReal (not a separate control)
  const [characterGeneratedImages, setCharacterGeneratedImages] = useState<CharacterConsistentGeneratedImage[]>([])

  // Character Consistent Image Requests list
  const [characterRequests, setCharacterRequests] = useState<CharacterConsistentImageRequest[]>([])
  const [selectedCharacterRequestId, setSelectedCharacterRequestId] = useState<number | null>(null)
  const [hoveredCharacterRequest, setHoveredCharacterRequest] = useState<number | null>(null)
  const [deleteCharacterConfirmId, setDeleteCharacterConfirmId] = useState<number | null>(null)
  const [fileInputKey, setFileInputKey] = useState(0) // Key to force file input reset

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

  // Fetch image generation requests for the selected project
  const fetchImageGenerationRequests = useCallback(async () => {
    if (!selectedProject) return

    try {
      const response = await fetch(`/api/image-generations?projectId=${selectedProject.id}`)
      if (response.ok) {
        const data = await response.json()
        setImageGenerationRequests(data)
      }
    } catch (error) {
      console.error("Failed to fetch image generation requests:", error)
    }
  }, [selectedProject])

  // Fetch image generation requests when selected project changes
  useEffect(() => {
    fetchImageGenerationRequests()
  }, [fetchImageGenerationRequests])

  // Fetch character consistent requests for the selected project
  const fetchCharacterRequests = useCallback(async () => {
    if (!selectedProject) return

    try {
      const response = await fetch(`/api/character-consistent-generations?projectId=${selectedProject.id}`)
      if (response.ok) {
        const data = await response.json()
        setCharacterRequests(data)
      }
    } catch (error) {
      console.error("Failed to fetch character consistent requests:", error)
    }
  }, [selectedProject])

  // Fetch character consistent requests when selected project changes
  useEffect(() => {
    fetchCharacterRequests()
  }, [fetchCharacterRequests])

  // Fetch Leonardo models on component mount
  useEffect(() => {
    const fetchLeonardoModels = async () => {
      try {
        const response = await fetch('/api/leonardo-models')
        if (response.ok) {
          const models = await response.json()
          setLeonardoModels(models)
          // Set default to Lightning XL (displayOrder 1)
          const defaultModel = models.find((m: LeonardoModel) => m.displayOrder === 1)
          if (defaultModel) {
            setSelectedModel(defaultModel)
            setPhotoReal(defaultModel.photoRealDefault)
            // Alchemy is automatically tied to PhotoReal, no need to set separately
          }
        }
      } catch (error) {
        console.error('Failed to fetch Leonardo models:', error)
      }
    }
    fetchLeonardoModels()
  }, [])

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

  // Image Generation delete handlers
  const handleImageDeleteClick = (requestId: number, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent request selection
    setDeleteImageConfirmId(requestId)
  }

  const handleConfirmImageDelete = async () => {
    if (!deleteImageConfirmId) return

    try {
      const response = await fetch(`/api/image-generations/${deleteImageConfirmId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Refresh the image generation requests list
        await fetchImageGenerationRequests()

        // If the deleted request was selected, clear the form
        if (selectedImageRequestId === deleteImageConfirmId) {
          setSelectedImageRequestId(null)
          setImagePrompt("")
          setNumberOfImages("1")
          setGeneratedImages([])
        }

        setDeleteImageConfirmId(null)
      } else {
        alert("Failed to delete image generation request")
      }
    } catch (error) {
      console.error("Error deleting image generation request:", error)
      alert("Failed to delete image generation request")
    }
  }

  const handleCancelImageDelete = () => {
    setDeleteImageConfirmId(null)
  }

  // Character Consistent Image handlers
  const handleCharacterDeleteClick = (requestId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteCharacterConfirmId(requestId)
  }

  const handleConfirmCharacterDelete = async () => {
    if (!deleteCharacterConfirmId) return

    try {
      const response = await fetch(`/api/character-consistent-generations/${deleteCharacterConfirmId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchCharacterRequests()

        if (selectedCharacterRequestId === deleteCharacterConfirmId) {
          setSelectedCharacterRequestId(null)
          setCharacterPrompt("")
          setReferenceImage(null)
          setReferenceImagePreview(null)
          setStrengthType("Mid")
          // Reset to default model
          const defaultModel = leonardoModels.find(m => m.displayOrder === 1)
          if (defaultModel) {
            setSelectedModel(defaultModel)
            setPhotoReal(defaultModel.photoRealDefault)
            // Alchemy is automatically tied to PhotoReal
          }
          setDimensions("1024x1024")
          setCharacterGeneratedImages([])
          setFileInputKey(prev => prev + 1) // Force file input to reset
        }

        setDeleteCharacterConfirmId(null)
      } else {
        alert("Failed to delete character consistent generation")
      }
    } catch (error) {
      console.error("Error deleting character consistent generation:", error)
      alert("Failed to delete character consistent generation")
    }
  }

  const handleCancelCharacterDelete = () => {
    setDeleteCharacterConfirmId(null)
  }

  const handleReferenceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setReferenceImage(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setReferenceImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Validation for Text Summarizer
  const isTextSummarizerValid = () => {
    const hasInput = website.trim() !== "" || textToSummarize.trim() !== ""
    const wordCount = parseInt(targetWordCount)
    const hasValidWordCount = !isNaN(wordCount) && wordCount >= 1 && wordCount <= 5000
    return hasInput && hasValidWordCount
  }

  // Validation for Image Generation
  const isImageGenerationValid = () => {
    const hasPrompt = imagePrompt.trim() !== ""
    const numImages = parseInt(numberOfImages)
    const hasValidCount = !isNaN(numImages) && numImages >= 1 && numImages <= 10
    return hasPrompt && hasValidCount
  }

  // Validation for Character Consistent Image
  const isCharacterConsistentValid = () => {
    const hasPrompt = characterPrompt.trim() !== ""
    const hasImage = referenceImage !== null || selectedCharacterRequestId !== null
    return hasPrompt && hasImage
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

  const handleImageGenerationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!imagePrompt.trim()) {
      alert("Please provide a prompt")
      return
    }

    if (!selectedProject) {
      alert("Please select a project")
      return
    }

    setIsSubmitting(true)

    try {
      // Determine if we're updating an existing request or creating a new one
      const isEditing = selectedImageRequestId !== null
      const url = isEditing
        ? `/api/image-generations/${selectedImageRequestId}`
        : "/api/image-generations"
      const method = isEditing ? "PUT" : "POST"

      const body = isEditing
        ? JSON.stringify({
            prompt: imagePrompt,
            numberOfImages: numberOfImages,
          })
        : JSON.stringify({
            projectId: selectedProject.id,
            prompt: imagePrompt,
            numberOfImages: numberOfImages,
          })

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      })

      if (!response.ok) {
        let errorMessage = isEditing ? "Failed to update images" : "Failed to generate images"
        try {
          const error = await response.json()
          errorMessage = error.error || errorMessage
        } catch {
          errorMessage = await response.text() || errorMessage
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      setGeneratedImages(result.generatedImages || [])
      setSelectedImageRequestId(result.id)

      // Refresh the image generation requests list
      await fetchImageGenerationRequests()

      // Force a router refresh to ensure UI updates
      router.refresh()
    } catch (error) {
      console.error("Error generating images:", error)
      alert(error instanceof Error ? error.message : "Failed to generate images")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCharacterConsistentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!characterPrompt.trim()) {
      alert("Please provide a prompt")
      return
    }

    if (!selectedProject) {
      alert("Please select a project")
      return
    }

    if (!referenceImage && selectedCharacterRequestId === null) {
      alert("Please upload a reference image")
      return
    }

    setIsSubmitting(true)

    try {
      const isEditing = selectedCharacterRequestId !== null
      const url = isEditing
        ? `/api/character-consistent-generations/${selectedCharacterRequestId}`
        : "/api/character-consistent-generations"
      const method = isEditing ? "PUT" : "POST"

      // Parse dimensions
      const [width, height] = dimensions.split("x").map(Number)

      // Create form data
      const formData = new FormData()
      if (!isEditing) {
        formData.append("projectId", selectedProject.id.toString())
      }
      formData.append("prompt", characterPrompt)
      formData.append("strengthType", strengthType)
      formData.append("modelId", selectedModel?.modelId || "")
      formData.append("width", width.toString())
      formData.append("height", height.toString())
      formData.append("photoReal", photoReal.toString())
      formData.append("alchemy", photoReal.toString()) // Alchemy is tied to PhotoReal

      if (referenceImage) {
        formData.append("referenceImage", referenceImage)
      }

      const response = await fetch(url, {
        method,
        body: formData,
      })

      if (!response.ok) {
        let errorMessage = isEditing
          ? "Failed to update character consistent generation"
          : "Failed to generate character consistent images"
        try {
          const error = await response.json()
          errorMessage = error.error || errorMessage
        } catch {
          errorMessage = (await response.text()) || errorMessage
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      setCharacterGeneratedImages(result.characterConsistentGeneratedImages || [])
      setSelectedCharacterRequestId(result.id)

      // Refresh the character consistent requests list
      await fetchCharacterRequests()

      // Force a router refresh to ensure UI updates
      router.refresh()
    } catch (error) {
      console.error("Error generating character consistent images:", error)
      alert(error instanceof Error ? error.message : "Failed to generate character consistent images")
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

            {/* Image Generation Requests List */}
            {selectedTool?.name === "Text to Image" && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Image Generations
                  </label>
                  <button
                    onClick={() => {
                      setSelectedImageRequestId(null)
                      setImagePrompt("")
                      setNumberOfImages("1")
                      setGeneratedImages([])
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    + New
                  </button>
                </div>
                {imageGenerationRequests.length > 0 && (
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {imageGenerationRequests.map((request) => {
                      const title = request.name || "Untitled"

                      return (
                        <div
                          key={request.id}
                          className="relative"
                          onMouseEnter={() => setHoveredImageRequest(request.id)}
                          onMouseLeave={() => setHoveredImageRequest(null)}
                        >
                          <button
                            onClick={() => {
                              setSelectedImageRequestId(request.id)
                              setImagePrompt(request.prompt)
                              setNumberOfImages(request.numberOfImages.toString())
                              setGeneratedImages(request.generatedImages || [])
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors ${
                              selectedImageRequestId === request.id ? 'bg-gray-800 text-white hover:bg-gray-700 border-l-4 border-indigo-500' : 'text-gray-700'
                            }`}
                          >
                            <div className="text-sm font-medium truncate pr-8">
                              {title}
                            </div>
                          </button>

                          {/* Delete button - shown on hover */}
                          {hoveredImageRequest === request.id && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              <button
                                onClick={(e) => handleImageDeleteClick(request.id, e)}
                                className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400 transition-colors"
                                title="Delete image generation"
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

            {/* Character Consistent Image Requests List */}
            {selectedTool?.name === "Character Consistent Image" && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Character Generations
                  </label>
                  <button
                    onClick={() => {
                      setSelectedCharacterRequestId(null)
                      setCharacterPrompt("")
                      setReferenceImage(null)
                      setReferenceImagePreview(null)
                      setStrengthType("Mid")
                      // Reset to default model
                      const defaultModel = leonardoModels.find(m => m.displayOrder === 1)
                      if (defaultModel) {
                        setSelectedModel(defaultModel)
                        setPhotoReal(defaultModel.photoRealDefault)
                        // Alchemy is automatically tied to PhotoReal
                      }
                      setDimensions("1024x1024")
                      setCharacterGeneratedImages([])
                      setFileInputKey(prev => prev + 1) // Force file input to reset
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    + New
                  </button>
                </div>
                {characterRequests.length > 0 && (
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {characterRequests.map((request) => {
                      const title = request.name || "Untitled"

                      return (
                        <div
                          key={request.id}
                          className="relative"
                          onMouseEnter={() => setHoveredCharacterRequest(request.id)}
                          onMouseLeave={() => setHoveredCharacterRequest(null)}
                        >
                          <button
                            onClick={() => {
                              setSelectedCharacterRequestId(request.id)
                              setCharacterPrompt(request.prompt)
                              setReferenceImage(null) // Clear file since we don't have the original
                              setReferenceImagePreview(request.referenceImageUrl) // Load Vercel Blob URL
                              setStrengthType(request.strengthType)
                              // Find and set the model based on stored modelId
                              const model = leonardoModels.find(m => m.modelId === request.modelId)
                              if (model) {
                                setSelectedModel(model)
                              }
                              setDimensions(`${request.width}x${request.height}`)
                              setPhotoReal(request.photoReal)
                              setAlchemy(request.alchemy)
                              setCharacterGeneratedImages(request.characterConsistentGeneratedImages || [])
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors ${
                              selectedCharacterRequestId === request.id ? 'bg-gray-800 text-white hover:bg-gray-700 border-l-4 border-indigo-500' : 'text-gray-700'
                            }`}
                          >
                            <div className="text-sm font-medium truncate pr-8">
                              {title}
                            </div>
                          </button>

                          {/* Delete button - shown on hover */}
                          {hoveredCharacterRequest === request.id && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              <button
                                onClick={(e) => handleCharacterDeleteClick(request.id, e)}
                                className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400 transition-colors"
                                title="Delete character generation"
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
        ) : selectedTool?.name === "Text to Image" ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {selectedTool.name}
            </h2>
            <form onSubmit={handleImageGenerationSubmit} className="space-y-6 max-w-2xl">
              <div>
                <label htmlFor="imagePrompt" className="block text-sm font-semibold text-gray-700 mb-2">
                  Prompt
                </label>
                <textarea
                  id="imagePrompt"
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  disabled={isSubmitting}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="Describe the image you want to generate..."
                />
              </div>

              <div>
                <label htmlFor="numberOfImages" className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Images (1-10)
                </label>
                <input
                  type="number"
                  id="numberOfImages"
                  value={numberOfImages}
                  onChange={(e) => setNumberOfImages(e.target.value)}
                  disabled={isSubmitting}
                  min="1"
                  max="10"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="e.g., 1"
                />
              </div>

              <div className="text-sm text-gray-600">
                * Prompt is required
                <br />
                * Number of images must be between 1 and 10
                <br />
                * Images will be 1024x768 pixels (JPG format)
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !isImageGenerationValid()}
                className="px-6 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:bg-gray-400"
              >
                {isSubmitting ? "Generating Images..." : "Generate"}
              </button>
            </form>

            {/* Display Generated Images */}
            {generatedImages.length > 0 && (
              <div className="mt-8">
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Generated Images ({generatedImages.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {generatedImages.map((image, index) => (
                      <div key={image.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={image.imageUrl}
                          alt={`Generated image ${index + 1}`}
                          className="w-full h-auto"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : selectedTool?.name === "Character Consistent Image" ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {selectedTool.name}
            </h2>
            <form onSubmit={handleCharacterConsistentSubmit} className="space-y-6 max-w-2xl">
              {/* Reference Image Upload */}
              <div>
                <label htmlFor="referenceImage" className="block text-sm font-semibold text-gray-700 mb-2">
                  Reference Image
                </label>
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="referenceImage"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Choose File
                  </label>
                  <span className="text-sm text-gray-600">
                    {referenceImage ? referenceImage.name : "No file chosen"}
                  </span>
                </div>
                <input
                  key={fileInputKey}
                  type="file"
                  id="referenceImage"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleReferenceImageChange}
                  disabled={isSubmitting}
                  className="hidden"
                />
                {referenceImagePreview && (
                  <div className="mt-4">
                    <img
                      src={referenceImagePreview}
                      alt="Reference preview"
                      className="max-w-xs rounded-lg border border-gray-300"
                    />
                  </div>
                )}
              </div>

              {/* Prompt */}
              <div>
                <label htmlFor="characterPrompt" className="block text-sm font-semibold text-gray-700 mb-2">
                  Prompt
                </label>
                <textarea
                  id="characterPrompt"
                  value={characterPrompt}
                  onChange={(e) => setCharacterPrompt(e.target.value)}
                  disabled={isSubmitting}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="Describe what you want to generate with this character..."
                />
              </div>

              {/* Strength Type */}
              <div>
                <label htmlFor="strengthType" className="block text-sm font-semibold text-gray-700 mb-2">
                  Strength Type
                </label>
                <select
                  id="strengthType"
                  value={strengthType}
                  onChange={(e) => setStrengthType(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  <option value="Low">Low (More creative freedom)</option>
                  <option value="Mid">Mid (Balanced)</option>
                  <option value="High">High (Closer resemblance)</option>
                </select>
              </div>

              {/* Model Selection */}
              <div>
                <label htmlFor="leonardoModel" className="block text-sm font-semibold text-gray-700 mb-2">
                  Model
                </label>
                <select
                  id="leonardoModel"
                  value={selectedModel?.modelId || ""}
                  onChange={(e) => {
                    const model = leonardoModels.find(m => m.modelId === e.target.value)
                    if (model) {
                      setSelectedModel(model)
                      // Update PhotoReal default based on model (Alchemy is tied to PhotoReal)
                      setPhotoReal(model.photoRealDefault)
                    }
                  }}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  {leonardoModels.map((model) => (
                    <option key={model.id} value={model.modelId}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dimensions */}
              <div>
                <label htmlFor="dimensions" className="block text-sm font-semibold text-gray-700 mb-2">
                  Dimensions
                </label>
                <select
                  id="dimensions"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  <option value="512x512">512x512 (Square)</option>
                  <option value="768x768">768x768 (Square HD)</option>
                  <option value="1024x1024">1024x1024 (Square XL)</option>
                  <option value="512x768">512x768 (Portrait)</option>
                  <option value="768x512">768x512 (Landscape)</option>
                  <option value="1024x576">1024x576 (Widescreen)</option>
                </select>
              </div>

              {/* PhotoReal Toggle */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="photoReal"
                  checked={photoReal}
                  onChange={(e) => setPhotoReal(e.target.checked)}
                  disabled={isSubmitting}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                />
                <label htmlFor="photoReal" className="ml-2 block text-sm text-gray-700">
                  PhotoReal (Enhanced photorealism with Alchemy)
                </label>
              </div>

              <div className="text-sm text-gray-600">
                * Reference image is required for new generations
                <br />
                * Prompt is required
                <br />
                * Generation may take 30-60 seconds
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !isCharacterConsistentValid()}
                className="px-6 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:bg-gray-400"
              >
                {isSubmitting ? "Generating..." : "Generate"}
              </button>
            </form>

            {/* Display Generated Images */}
            {characterGeneratedImages.length > 0 && (
              <div className="mt-8">
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Generated Images ({characterGeneratedImages.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {characterGeneratedImages.map((image, index) => (
                      <div key={image.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={image.imageUrl}
                          alt={`Generated image ${index + 1}`}
                          className="w-full h-auto"
                        />
                      </div>
                    ))}
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

      {/* Delete Confirmation Modal for Text Summaries */}
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

      {/* Delete Confirmation Modal for Image Generations */}
      {deleteImageConfirmId && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-2xl border border-gray-300">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Image Generation</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to delete this image generation?</p>
            <p className="text-red-600 font-semibold mb-6">
              All generated images will be deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelImageDelete}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImageDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Character Consistent Generations */}
      {deleteCharacterConfirmId && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-2xl border border-gray-300">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Character Generation</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to delete this character generation?</p>
            <p className="text-red-600 font-semibold mb-6">
              All generated images will be deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelCharacterDelete}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCharacterDelete}
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
