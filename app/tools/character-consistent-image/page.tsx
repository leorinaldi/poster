"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useProject } from "../ProjectContext"
import DeleteConfirmModal from "@/app/components/DeleteConfirmModal"

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

export default function CharacterConsistentImagePage() {
  const router = useRouter()
  const { selectedProject, setSidebarContent } = useProject()

  // Form fields
  const [characterPrompt, setCharacterPrompt] = useState("")
  const [referenceImage, setReferenceImage] = useState<File | null>(null)
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null)
  const [strengthType, setStrengthType] = useState("Mid")
  const [leonardoModels, setLeonardoModels] = useState<LeonardoModel[]>([])
  const [selectedModel, setSelectedModel] = useState<LeonardoModel | null>(null)
  const [dimensions, setDimensions] = useState("1024x1024")
  const [photoReal, setPhotoReal] = useState(true)
  const [characterGeneratedImages, setCharacterGeneratedImages] = useState<CharacterConsistentGeneratedImage[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)

  // Character Consistent Image Requests list
  const [characterRequests, setCharacterRequests] = useState<CharacterConsistentImageRequest[]>([])
  const [selectedCharacterRequestId, setSelectedCharacterRequestId] = useState<number | null>(null)
  const [hoveredCharacterRequest, setHoveredCharacterRequest] = useState<number | null>(null)
  const [deleteCharacterConfirmId, setDeleteCharacterConfirmId] = useState<number | null>(null)

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
          }
        }
      } catch (error) {
        console.error('Failed to fetch Leonardo models:', error)
      }
    }
    fetchLeonardoModels()
  }, [])

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
    // Clear form when project changes
    setSelectedCharacterRequestId(null)
    setCharacterPrompt("")
    setReferenceImage(null)
    setReferenceImagePreview(null)
    setStrengthType("Mid")
    const defaultModel = leonardoModels.find(m => m.displayOrder === 1)
    if (defaultModel) {
      setSelectedModel(defaultModel)
      setPhotoReal(defaultModel.photoRealDefault)
    }
    setDimensions("1024x1024")
    setCharacterGeneratedImages([])
    setFileInputKey(prev => prev + 1)
  }, [fetchCharacterRequests, leonardoModels])

  // Update sidebar content whenever character requests or selected item changes
  useEffect(() => {
    setSidebarContent(
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-700">
            Character Images
          </label>
          <button
            onClick={() => {
              setSelectedCharacterRequestId(null)
              setCharacterPrompt("")
              setReferenceImage(null)
              setReferenceImagePreview(null)
              setStrengthType("Mid")
              const defaultModel = leonardoModels.find(m => m.displayOrder === 1)
              if (defaultModel) {
                setSelectedModel(defaultModel)
                setPhotoReal(defaultModel.photoRealDefault)
              }
              setDimensions("1024x1024")
              setCharacterGeneratedImages([])
              setFileInputKey(prev => prev + 1)
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
                      setReferenceImagePreview(request.referenceImageUrl)
                      setStrengthType(request.strengthType)
                      const model = leonardoModels.find(m => m.modelId === request.modelId)
                      if (model) {
                        setSelectedModel(model)
                      }
                      setDimensions(`${request.width}x${request.height}`)
                      setPhotoReal(request.photoReal)
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
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteCharacterConfirmId(request.id)
                        }}
                        className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete character image"
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
    )

    return () => setSidebarContent(null)
  }, [characterRequests, selectedCharacterRequestId, hoveredCharacterRequest, leonardoModels, setSidebarContent])

  // Validation for Character Consistent Image
  const isCharacterConsistentValid = () => {
    const hasPrompt = characterPrompt.trim() !== ""
    const hasImage = referenceImage !== null || selectedCharacterRequestId !== null
    return hasPrompt && hasImage
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

  const handleSubmit = async (e: React.FormEvent) => {
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
          }
          setDimensions("1024x1024")
          setCharacterGeneratedImages([])
          setFileInputKey(prev => prev + 1)
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

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Character Consistent Image
        </h2>

          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteCharacterConfirmId !== null}
        title="Delete Character Generation"
        message="Are you sure you want to delete this character generation?"
        warningMessage="All generated images will be deleted."
        onConfirm={handleConfirmCharacterDelete}
        onCancel={() => setDeleteCharacterConfirmId(null)}
      />
    </>
  )
}
