"use client"

import { useState } from "react"

type Tool = {
  id: number
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

export default function ToolsInterface({ tools }: { tools: Tool[] }) {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(tools[0] || null)

  return (
    <div className="flex h-full">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4">
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
      </div>

      {/* Main Panel */}
      <div className="flex-1 bg-white p-8">
        {selectedTool ? (
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
    </div>
  )
}
