import React, { useState } from 'react'
import { addSection } from '../api/itinerary'
import toast from 'react-hot-toast'

export default function SectionSelector({ sections, activeSectionId, onSelect, isEditing, onUpdate }) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle]   = useState('')

  const handleAdd = async () => {
    const label = title.trim() || `Section ${sections.length + 1}`
    setAdding(true)
    try {
      const doc = await addSection({ title: label })
      toast.success(`"${label}" added`)
      onUpdate(doc)
      const newSec = doc.sections[doc.sections.length - 1]
      if (newSec) onSelect(newSec._id)
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to add section')
    } finally {
      setAdding(false)
      setTitle('')
    }
  }

  const sorted = [...sections].sort((a, b) => a.order - b.order)

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2">

        {/* Horizontally scrollable section tabs on mobile */}
        {sorted.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 flex-1">
            {sorted.map((sec) => (
              <button
                key={sec._id}
                onClick={() => onSelect(sec._id)}
                className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all ${
                  activeSectionId === sec._id
                    ? 'bg-blue-700 text-white shadow'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sec.title}
                {sec.date && (
                  <span className="ml-1.5 text-[11px] opacity-75">
                    {new Date(sec.date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Add section — always visible in edit mode */}
        {isEditing && (
          <div className="flex items-center gap-1.5 w-full sm:w-auto flex-shrink-0">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="New section name…"
              className="border border-dashed border-blue-300 hover:border-blue-500 focus:border-blue-500 rounded-lg px-3 py-1.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 sm:w-40 transition-colors"
            />
            <button
              onClick={handleAdd}
              disabled={adding}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-1 whitespace-nowrap flex-shrink-0"
            >
              {adding
                ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
              }
              Add Section
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
