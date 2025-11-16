"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useProject } from "../ProjectContext"
import DeleteConfirmModal from "@/app/components/DeleteConfirmModal"

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

export default function TextSummarizerPage() {
  const router = useRouter()
  const { selectedProject, setSidebarContent } = useProject()

  // Form fields
  const [website, setWebsite] = useState("")
  const [textToSummarize, setTextToSummarize] = useState("")
  const [targetWordCount, setTargetWordCount] = useState("")
  const [generatedSummary, setGeneratedSummary] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Summaries list
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
    // Clear form when project changes
    setSelectedSummaryId(null)
    setWebsite("")
    setTextToSummarize("")
    setTargetWordCount("")
    setGeneratedSummary("")
  }, [fetchTextSummaries])

  // Update sidebar content whenever summaries or selected item changes
  useEffect(() => {
    setSidebarContent(
      <div>
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
    )

    return () => setSidebarContent(null)
  }, [textSummaries, selectedSummaryId, hoveredSummary, setSidebarContent])

  // Validation for Text Summarizer
  const isTextSummarizerValid = () => {
    const hasInput = website.trim() !== "" || textToSummarize.trim() !== ""
    const wordCount = parseInt(targetWordCount)
    const hasValidWordCount = !isNaN(wordCount) && wordCount >= 1 && wordCount <= 5000
    return hasInput && hasValidWordCount
  }

  const handleSubmit = async (e: React.FormEvent) => {
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

  const handleDeleteClick = (summaryId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteConfirmId(summaryId)
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return

    try {
      const response = await fetch(`/api/text-summaries/${deleteConfirmId}`, {
        method: "DELETE",
      })

      if (response.ok) {
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

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Text Summarizer
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirmId !== null}
        title="Delete Text Summary"
        message="Are you sure you want to delete this text summary?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </>
  )
}
