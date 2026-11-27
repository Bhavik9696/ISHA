import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Header({ itinerary, isEditing, onEdit, onSave, onCancel, onPatchItinerary }) {
  const { isAdmin, logout } = useAuth()
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleVal, setTitleVal]         = useState('')
  const [subtitleVal, setSubtitleVal]   = useState('')

  const startEditTitle = () => {
    setTitleVal(itinerary?.title || '')
    setSubtitleVal(itinerary?.subtitle || '')
    setEditingTitle(true)
  }

  const saveTitle = async () => {
    await onPatchItinerary({ title: titleVal.trim() || 'My Document', subtitle: subtitleVal.trim() })
    setEditingTitle(false)
  }

  const updatedAt = itinerary?.updatedAt
    ? new Date(itinerary.updatedAt).toLocaleString('en-IN', {
        dateStyle: 'medium', timeStyle: 'short',
      })
    : null

  return (
    <header className="bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Top bar — stacks/wraps cleanly on small mobile screens */}
        <div className="flex flex-wrap items-center justify-between py-3 sm:py-4 gap-2 sm:gap-3">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/20 rounded-xl flex items-center justify-center font-bold text-base sm:text-lg">
              📋
            </div>
            <span className="font-semibold text-blue-100 tracking-wide text-sm">
              ISHA
            </span>
          </div>

          {/* Right controls (moved before title on wrap? No, keep order on desktop, order-2 on mobile) */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 sm:order-3">
            {isAdmin && isEditing ? (
              <>
                <button onClick={onSave} className="bg-emerald-500 hover:bg-emerald-400 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center gap-1 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Done</span>
                </button>
                <button onClick={onCancel} className="bg-white/20 hover:bg-white/30 text-white text-xs sm:text-sm font-medium px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg flex items-center gap-1 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="hidden xs:inline sm:inline">Exit</span>
                </button>
                <button onClick={logout} className="bg-red-500/80 hover:bg-red-500 text-white text-xs p-2 rounded-lg transition-colors" title="Log out">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </>
            ) : (
              <button
                onClick={onEdit}
                className="bg-white text-blue-800 hover:bg-blue-50 font-semibold text-xs sm:text-sm px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
          </div>

          {/* Title & Subtitle — full-width second row on mobile, centered middle on sm+ */}
          <div className="w-full sm:w-auto sm:flex-1 sm:order-2 text-center px-1 sm:px-4 pt-1 sm:pt-0">
            {isEditing && editingTitle ? (
              <div className="flex flex-col items-center gap-2">
                <input
                  autoFocus
                  value={titleVal}
                  onChange={(e) => setTitleVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveTitle()
                    if (e.key === 'Escape') setEditingTitle(false)
                  }}
                  className="text-slate-900 font-bold text-base sm:text-lg rounded px-3 py-1.5 w-full max-w-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="Main Heading / Title"
                />
                <input
                  value={subtitleVal}
                  onChange={(e) => setSubtitleVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveTitle()
                    if (e.key === 'Escape') setEditingTitle(false)
                  }}
                  className="text-slate-900 text-sm rounded px-3 py-1.5 w-full max-w-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="Subtitle or description (optional)"
                />
                <div className="flex gap-2">
                  <button onClick={saveTitle} className="bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-medium px-3 py-1.5 rounded">
                    Save Heading
                  </button>
                  <button onClick={() => setEditingTitle(false)} className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={isEditing ? 'cursor-pointer group inline-block px-3 py-1 rounded-lg hover:bg-white/10 transition-colors' : ''}
                onClick={isEditing ? startEditTitle : undefined}
                title={isEditing ? 'Click to edit heading & subtitle' : ''}
              >
                <h1 className="font-bold text-lg sm:text-2xl leading-tight text-white flex flex-wrap items-center justify-center gap-2">
                  <span className="break-words">{itinerary?.title || 'My Document'}</span>
                  {isEditing && (
                    <span className="text-blue-200 group-hover:text-white text-xs font-normal bg-white/15 px-2 py-0.5 rounded">
                      ✏️ Edit
                    </span>
                  )}
                </h1>
                {itinerary?.subtitle ? (
                  <p className="text-blue-200 text-xs sm:text-sm mt-0.5 break-words">{itinerary.subtitle}</p>
                ) : isEditing ? (
                  <p className="text-blue-300/70 text-xs italic mt-0.5">+ Tap to add subtitle</p>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Admin editing banner */}
        {isAdmin && isEditing && (
          <div className="bg-amber-500/20 border border-amber-400/30 rounded-lg px-3 sm:px-4 py-2 mb-2.5 flex items-start sm:items-center gap-2 text-amber-100 text-xs sm:text-sm">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>
              <strong>Admin Edit Mode</strong> — Tap heading to rename, manage columns/sections, or edit rows. Saves directly to MongoDB.
            </span>
          </div>
        )}

        {/* Updated timestamp */}
        {updatedAt && (
          <div className="text-blue-300 text-[11px] sm:text-xs pb-2.5 text-center">
            Last updated: {updatedAt}
          </div>
        )}
      </div>
    </header>
  )
}
