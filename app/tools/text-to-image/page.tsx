"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useProject } from "../ProjectContext"
import DeleteConfirmModal from "@/app/components/DeleteConfirmModal"

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

export default function TextToImagePage() {
  const router = useRouter()
  const { selectedProject, setSidebarContent } = useProject()

  // Form fields
  const [imagePrompt, setImagePrompt] = useState("")
  const [numberOfImages, setNumberOfImages] = useState("1")
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Image Generation Requests list
  const [imageGenerationRequests, setImageGenerationRequests] = useState<ImageGenerationRequest[]>([])
  const [selectedImageRequestId, setSelectedImageRequestId] = useState<number | null>(null)
  const [hoveredImageRequest, setHoveredImageRequest] = useState<number | null>(null)
  const [deleteImageConfirmId, setDeleteImageConfirmId] = useState<number | null>(null)

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
    // Clear form when project changes
    setSelectedImageRequestId(null)
    setImagePrompt("")
    setNumberOfImages("1")
    setGeneratedImages([])
  }, [fetchImageGenerationRequests])

  // Update sidebar content whenever image requests or selected item changes
  useEffect(() => {
    setSidebarContent(
      <div>
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
    )

    return () => setSidebarContent(null)
  }, [imageGenerationRequests, selectedImageRequestId, hoveredImageRequest, setSidebarContent])

  // Validation for Image Generation
  const isImageGenerationValid = () => {
    const hasPrompt = imagePrompt.trim() !== ""
    const numImages = parseInt(numberOfImages)
    const hasValidCount = !isNaN(numImages) && numImages >= 1 && numImages <= 10
    return hasPrompt && hasValidCount
  }

  const handleSubmit = async (e: React.FormEvent) => {
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

  const handleImageDeleteClick = (requestId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteImageConfirmId(requestId)
  }

  const handleConfirmImageDelete = async () => {
    if (!deleteImageConfirmId) return

    try {
      const response = await fetch(`/api/image-generations/${deleteImageConfirmId}`, {
        method: "DELETE",
      })

      if (response.ok) {
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

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Text to Image
        </h2>

          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteImageConfirmId !== null}
        title="Delete Image Generation"
        message="Are you sure you want to delete this image generation?"
        warningMessage="All generated images will be deleted."
        onConfirm={handleConfirmImageDelete}
        onCancel={() => setDeleteImageConfirmId(null)}
      />
    </>
  )
}
