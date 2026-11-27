import React, { useState, useEffect, useCallback } from 'react'
import { getItinerary, patchItinerary, addSection } from '../api/itinerary'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header'
import SectionSelector from '../components/DaySelector'
import DayTable from '../components/DayTable'
import LoginModal from '../components/LoginModal'
import toast from 'react-hot-toast'

export default function ItineraryPage() {
  const { isAdmin, checking } = useAuth()
  const [itinerary, setItinerary]             = useState(null)
  const [loading, setLoading]                 = useState(true)
  const [error, setError]                     = useState('')
  const [isEditing, setIsEditing]             = useState(false)
  const [showLogin, setShowLogin]             = useState(false)
  const [activeSectionId, setActiveSectionId] = useState(null)

  const fetchItinerary = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const doc = await getItinerary()
      setItinerary(doc)
      if (doc.sections?.length > 0) {
        setActiveSectionId(prev => prev || doc.sections[0]._id)
      }
    } catch (e) {
      const apiBase = import.meta.env.VITE_API_URL || '(not set — using same origin)'
      const detail = e.response?.data?.error || e.message || 'Unknown error'
      setError(`Failed to load data (${detail}). API: ${apiBase}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (!checking) fetchItinerary() }, [checking, fetchItinerary])

  const handleItineraryUpdate = (doc) => {
    setItinerary(doc)
    const sections = doc.sections || []
    const stillExists = sections.some(s => s._id === activeSectionId)
    if (!stillExists) {
      setActiveSectionId(sections.length > 0 ? sections[0]._id : null)
    }
  }

  const handleEditClick = () => {
    if (isAdmin) {
      setIsEditing(true)
    } else {
      setShowLogin(true)
    }
  }

  const handleLoginSuccess = () => {
    setShowLogin(false)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleDone = () => {
    setIsEditing(false)
    toast.success('All changes are saved in MongoDB ✅')
  }

  const handlePatchItinerary = async (data) => {
    try {
      const doc = await patchItinerary(data)
      setItinerary(doc)
      toast.success('Heading updated')
    } catch {
      toast.error('Failed to update heading')
    }
  }

  const handleQuickAddSection = async () => {
    try {
      const doc = await addSection({ title: 'Section 1' })
      toast.success('Section created')
      handleItineraryUpdate(doc)
      const created = doc.sections?.[doc.sections.length - 1]
      if (created) setActiveSectionId(created._id)
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to add section')
    }
  }

  const sections = itinerary?.sections || []
  const activeSection = sections.find(s => s._id === activeSectionId) || sections[0] || null

  if (checking || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Loading…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 px-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="font-bold text-red-800 text-lg mb-2">Connection Error</h2>
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={fetchItinerary} className="mt-4 btn-primary mx-auto">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header
        itinerary={itinerary}
        isEditing={isEditing && isAdmin}
        onEdit={handleEditClick}
        onSave={handleDone}
        onCancel={handleCancel}
        onPatchItinerary={handlePatchItinerary}
      />

      {(sections.length > 0 || (isEditing && isAdmin)) && (
        <SectionSelector
          sections={sections}
          activeSectionId={activeSection?._id}
          onSelect={setActiveSectionId}
          isEditing={isEditing && isAdmin}
          onUpdate={handleItineraryUpdate}
        />
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4">
            <div className="text-5xl sm:text-6xl mb-4">📋</div>
            <h3 className="font-bold text-slate-700 text-lg sm:text-xl mb-2">No sections yet</h3>
            {isAdmin && isEditing ? (
              <>
                <p className="text-slate-500 text-sm mb-5 max-w-md">
                  Create your first section (tab/sheet) and customize its columns however you like.
                </p>
                <button
                  onClick={handleQuickAddSection}
                  className="btn-primary px-6 py-2.5 text-sm sm:text-base shadow"
                >
                  + Add First Section
                </button>
              </>
            ) : (
              <p className="text-slate-500 text-sm">
                The admin hasn&apos;t added any content yet.
              </p>
            )}
          </div>
        ) : activeSection ? (
          <DayTable
            key={activeSection._id}
            day={activeSection}
            isEditing={isEditing && isAdmin}
            onItineraryUpdate={handleItineraryUpdate}
          />
        ) : null}
      </main>

      <footer className="bg-white border-t border-slate-200 py-3 sm:py-4 px-4 sm:px-6 text-center text-[11px] sm:text-xs text-slate-400">
        <p>
          {itinerary?.title || 'ISHA'} &nbsp;•&nbsp; Powered by MongoDB Atlas
          {itinerary?.updatedAt && (
            <> &nbsp;•&nbsp; Last updated: {new Date(itinerary.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</>
          )}
        </p>
      </footer>

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={handleLoginSuccess}
        />
      )}
    </div>
  )
}
