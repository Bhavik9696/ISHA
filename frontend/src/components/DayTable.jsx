import React, { useState } from 'react'
import toast from 'react-hot-toast'
import {
  patchColumn, deleteColumn, addColumn, reorderColumns,
  addRow, patchRow, deleteRow,
  patchSection, deleteSection,
} from '../api/itinerary'

// ── Helpers ───────────────────────────────────────────────────────────────────
function CellView({ value, type }) {
  if (!value && value !== 0) return <span className="text-slate-300 italic text-xs select-none">—</span>

  if (type === 'link') {
    if (value.includes(' | ')) {
      const idx = value.indexOf(' | ')
      const label = value.slice(0, idx).trim()
      const url   = value.slice(idx + 3).trim()
      return (
        <a href={url} target="_blank" rel="noopener noreferrer"
           className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-medium text-sm break-all">
          🔗 {label}
        </a>
      )
    }
    if (/^https?:\/\//i.test(value)) {
      return (
        <a href={value} target="_blank" rel="noopener noreferrer"
           className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm break-all">
          🔗 {value}
        </a>
      )
    }
  }

  const urlRe = /(https?:\/\/[^\s]+)/g
  const parts = String(value).split(urlRe)
  if (parts.length > 1) {
    return (
      <span className="text-sm text-slate-700 whitespace-pre-wrap break-words">
        {parts.map((p, i) =>
          urlRe.test(p)
            ? <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{p}</a>
            : p
        )}
      </span>
    )
  }

  return <span className="text-sm text-slate-700 whitespace-pre-wrap break-words">{value}</span>
}

function CellInput({ value, onChange, type, placeholder }) {
  if (type === 'multiline') {
    return (
      <textarea
        className="w-full bg-blue-50 border border-blue-200 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none min-h-[56px]"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
      />
    )
  }
  return (
    <input
      className="w-full bg-blue-50 border border-blue-200 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )
}

// ── Desktop Column Header (edit mode) ─────────────────────────────────────────
function ColHeader({ col, cols, sectionId, onUpdate, isFirst, isLast }) {
  const [editing, setEditing] = useState(false)
  const [label, setLabel]     = useState(col.label)
  const [saving, setSaving]   = useState(false)

  const saveLabel = async () => {
    if (label.trim() === col.label) { setEditing(false); return }
    setSaving(true)
    try {
      const doc = await patchColumn(sectionId, col._id, { label: label.trim() || col.label })
      onUpdate(doc)
    } catch { toast.error('Failed to rename column') }
    finally { setSaving(false); setEditing(false) }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete column "${col.label}"? All data in this column will be lost.`)) return
    try {
      const doc = await deleteColumn(sectionId, col._id)
      toast.success('Column deleted')
      onUpdate(doc)
    } catch { toast.error('Failed to delete column') }
  }

  const handleType = async (e) => {
    try {
      const doc = await patchColumn(sectionId, col._id, { type: e.target.value })
      onUpdate(doc)
    } catch { toast.error('Failed to change type') }
  }

  const moveCol = async (dir) => {
    const sorted = [...cols].sort((a, b) => a.order - b.order)
    const idx    = sorted.findIndex(c => c._id === col._id)
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= sorted.length) return
    const ids = sorted.map(c => c._id)
    ;[ids[idx], ids[newIdx]] = [ids[newIdx], ids[idx]]
    try {
      const doc = await reorderColumns(sectionId, ids)
      onUpdate(doc)
    } catch { toast.error('Failed to reorder') }
  }

  return (
    <th className="px-3 py-2 text-left bg-gradient-to-b from-blue-700 to-blue-800 text-white border-r border-blue-600 last:border-r-0 min-w-[130px]">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1">
          {editing ? (
            <input
              autoFocus
              value={label}
              onChange={e => setLabel(e.target.value)}
              onBlur={saveLabel}
              onKeyDown={e => { if (e.key === 'Enter') saveLabel(); if (e.key === 'Escape') setEditing(false) }}
              disabled={saving}
              className="text-blue-900 bg-white rounded px-1.5 py-0.5 text-xs font-semibold w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          ) : (
            <span
              className="font-semibold text-sm flex-1 cursor-pointer hover:text-blue-200 truncate"
              title="Click to rename"
              onClick={() => { setLabel(col.label); setEditing(true) }}
            >
              {col.label}
              <span className="ml-1 text-blue-300 text-xs">✏</span>
            </span>
          )}
          <button onClick={handleDelete} title="Delete column"
            className="text-red-300 hover:text-red-100 font-bold text-base leading-none flex-shrink-0 ml-1">×</button>
        </div>
        <div className="flex items-center gap-1">
          <select value={col.type} onChange={handleType}
            className="text-xs bg-blue-900/60 text-blue-100 border border-blue-500/40 rounded px-1 py-0.5 flex-1 focus:outline-none cursor-pointer">
            <option value="text">Text</option>
            <option value="multiline">Multi-line</option>
            <option value="link">Link 🔗</option>
          </select>
          <button onClick={() => moveCol(-1)} disabled={isFirst} title="Move left"
            className="text-blue-200 hover:text-white disabled:opacity-30 text-xs px-0.5">◀</button>
          <button onClick={() => moveCol(1)}  disabled={isLast}  title="Move right"
            className="text-blue-200 hover:text-white disabled:opacity-30 text-xs px-0.5">▶</button>
        </div>
      </div>
    </th>
  )
}

// ── Mobile Columns Manager (edit mode on < md) ────────────────────────────────
function MobileColumnsManager({ cols, sectionId, onUpdate }) {
  const [open, setOpen]       = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [label, setLabel]     = useState('')

  const saveLabel = async (col) => {
    if (label.trim() && label.trim() !== col.label) {
      try {
        const doc = await patchColumn(sectionId, col._id, { label: label.trim() })
        onUpdate(doc)
      } catch { toast.error('Failed to rename column') }
    }
    setEditingId(null)
  }

  const handleType = async (col, type) => {
    try {
      const doc = await patchColumn(sectionId, col._id, { type })
      onUpdate(doc)
    } catch { toast.error('Failed to change type') }
  }

  const handleDelete = async (col) => {
    if (!window.confirm(`Delete column "${col.label}"? All data in this column will be lost.`)) return
    try {
      const doc = await deleteColumn(sectionId, col._id)
      toast.success('Column deleted')
      onUpdate(doc)
    } catch { toast.error('Failed to delete column') }
  }

  const moveCol = async (idx, dir) => {
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= cols.length) return
    const ids = cols.map(c => c._id)
    ;[ids[idx], ids[newIdx]] = [ids[newIdx], ids[idx]]
    try {
      const doc = await reorderColumns(sectionId, ids)
      onUpdate(doc)
    } catch { toast.error('Failed to reorder') }
  }

  return (
    <div className="md:hidden mb-3 bg-white border border-purple-200 rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-purple-800 bg-purple-50"
      >
        <span>⚙️ Manage Columns ({cols.length})</span>
        <span>{open ? '▲ Hide' : '▼ Edit'}</span>
      </button>
      {open && (
        <div className="p-3 space-y-2 divide-y divide-slate-100">
          {cols.map((col, i) => (
            <div key={col._id} className="pt-2 first:pt-0 flex flex-wrap items-center gap-2">
              {editingId === col._id ? (
                <input
                  autoFocus
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  onBlur={() => saveLabel(col)}
                  onKeyDown={e => { if (e.key === 'Enter') saveLabel(col); if (e.key === 'Escape') setEditingId(null) }}
                  className="border border-blue-300 rounded px-2 py-1 text-xs font-medium flex-1 min-w-[120px]"
                />
              ) : (
                <button
                  onClick={() => { setLabel(col.label); setEditingId(col._id) }}
                  className="text-xs font-semibold text-slate-700 hover:text-blue-700 flex-1 text-left truncate"
                >
                  {col.label} ✏️
                </button>
              )}
              <select
                value={col.type}
                onChange={e => handleType(col, e.target.value)}
                className="text-xs border border-slate-200 rounded px-1.5 py-1 bg-slate-50"
              >
                <option value="text">Text</option>
                <option value="multiline">Multi-line</option>
                <option value="link">Link</option>
              </select>
              <div className="flex items-center gap-1">
                <button onClick={() => moveCol(i, -1)} disabled={i === 0} className="px-1.5 py-0.5 text-xs bg-slate-100 rounded disabled:opacity-30">▲</button>
                <button onClick={() => moveCol(i, 1)} disabled={i === cols.length - 1} className="px-1.5 py-0.5 text-xs bg-slate-100 rounded disabled:opacity-30">▼</button>
                <button onClick={() => handleDelete(col)} className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded font-bold">×</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Desktop Row ───────────────────────────────────────────────────────────────
function TableRow({ row, idx, cols, sectionId, onUpdate, isEditing }) {
  const [editing, setEditing] = useState(false)
  const [data, setData]       = useState({})
  const [saving, setSaving]   = useState(false)

  const startEdit = () => {
    const d = {}
    cols.forEach(c => { d[c.key] = row.data?.[c.key] ?? '' })
    setData(d)
    setEditing(true)
  }

  const saveRow = async () => {
    setSaving(true)
    try {
      const doc = await patchRow(sectionId, row._id, { data })
      toast.success('Saved')
      onUpdate(doc)
      setEditing(false)
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const delRow = async () => {
    if (!window.confirm('Delete this row?')) return
    try {
      const doc = await deleteRow(sectionId, row._id)
      toast.success('Row deleted')
      onUpdate(doc)
    } catch { toast.error('Failed to delete') }
  }

  const isEven = idx % 2 === 0

  if (isEditing && editing) {
    return (
      <tr className="bg-blue-50/80 border-b-2 border-blue-300">
        <td className="px-3 py-2 text-center text-slate-400 text-xs w-10 font-medium">{idx + 1}</td>
        {cols.map(col => (
          <td key={col._id} className="px-3 py-2">
            <CellInput
              value={data[col.key] ?? ''}
              onChange={v => setData(d => ({ ...d, [col.key]: v }))}
              type={col.type}
              placeholder={col.type === 'link' ? 'Label | https://url  or  https://url' : col.label}
            />
          </td>
        ))}
        <td className="px-2 py-2 w-28">
          <div className="flex flex-col gap-1.5">
            <button onClick={saveRow} disabled={saving}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded flex items-center justify-center gap-1 disabled:opacity-50">
              {saving ? '…' : '✓ Save'}
            </button>
            <button onClick={() => setEditing(false)}
              className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded">
              Cancel
            </button>
            <button onClick={delRow}
              className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded">
              🗑 Del
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className={`border-b border-slate-100 hover:bg-blue-50/40 transition-colors group ${isEven ? 'bg-white' : 'bg-slate-50/60'}`}>
      <td className="px-3 py-2.5 text-center text-slate-400 text-xs font-medium w-10">{idx + 1}</td>
      {cols.map(col => (
        <td key={col._id} className="px-3 py-2.5">
          <CellView value={row.data?.[col.key]} type={col.type} />
        </td>
      ))}
      {isEditing && (
        <td className="px-2 py-2.5 w-20 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
          <button onClick={startEdit}
            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2.5 py-1 rounded font-medium whitespace-nowrap">
            ✏️ Edit
          </button>
        </td>
      )}
    </tr>
  )
}

// ── Mobile Row Card ───────────────────────────────────────────────────────────
function MobileRowCard({ row, idx, cols, sectionId, onUpdate, isEditing }) {
  const [editing, setEditing] = useState(false)
  const [data, setData]       = useState({})
  const [saving, setSaving]   = useState(false)

  const startEdit = () => {
    const d = {}
    cols.forEach(c => { d[c.key] = row.data?.[c.key] ?? '' })
    setData(d)
    setEditing(true)
  }

  const saveRow = async () => {
    setSaving(true)
    try {
      const doc = await patchRow(sectionId, row._id, { data })
      toast.success('Saved')
      onUpdate(doc)
      setEditing(false)
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const delRow = async () => {
    if (!window.confirm('Delete this row?')) return
    try {
      const doc = await deleteRow(sectionId, row._id)
      toast.success('Row deleted')
      onUpdate(doc)
    } catch { toast.error('Failed to delete') }
  }

  return (
    <div className={`rounded-xl border shadow-sm overflow-hidden ${editing ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200 bg-white'}`}>
      {/* Card header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50 border-b border-slate-200">
        <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
          #{idx + 1}
        </span>
        {isEditing && !editing && (
          <div className="flex items-center gap-2">
            <button onClick={startEdit} className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2.5 py-1 rounded-md font-medium">
              ✏️ Edit
            </button>
            <button onClick={delRow} className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded-md font-medium">
              🗑
            </button>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-3.5 space-y-2.5">
        {cols.map(col => (
          <div key={col._id}>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
              {col.label}
            </div>
            {editing ? (
              <CellInput
                value={data[col.key] ?? ''}
                onChange={v => setData(d => ({ ...d, [col.key]: v }))}
                type={col.type}
                placeholder={col.type === 'link' ? 'Label | https://url' : col.label}
              />
            ) : (
              <div><CellView value={row.data?.[col.key]} type={col.type} /></div>
            )}
          </div>
        ))}

        {editing && (
          <div className="flex gap-2 pt-2 border-t border-blue-200">
            <button onClick={saveRow} disabled={saving}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium py-2 rounded-lg disabled:opacity-50">
              {saving ? 'Saving…' : '✓ Save'}
            </button>
            <button onClick={() => setEditing(false)}
              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium py-2 rounded-lg">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Add Row form ──────────────────────────────────────────────────────────────
function AddRowForm({ cols, sectionId, onAdded }) {
  const empty = () => Object.fromEntries(cols.map(c => [c.key, '']))
  const [data, setData]   = useState(empty)
  const [open, setOpen]   = useState(false)
  const [saving, setSaving] = useState(false)

  React.useEffect(() => { setData(empty()) }, [cols.length])

  const save = async () => {
    setSaving(true)
    try {
      const doc = await addRow(sectionId, { data })
      toast.success('Row added')
      onAdded(doc)
      setData(empty())
      setOpen(false)
    } catch { toast.error('Failed to add row') }
    finally { setSaving(false) }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="mt-3 w-full sm:w-auto flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium border border-dashed border-blue-300 hover:border-blue-500 rounded-lg px-4 py-2.5 sm:py-2 transition-colors bg-white sm:bg-transparent">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Row
      </button>
    )
  }

  return (
    <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3.5 sm:p-4 space-y-3">
      <h4 className="font-semibold text-blue-800 text-sm">New Row</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cols.map(col => (
          <div key={col._id}>
            <label className="text-xs text-slate-600 font-medium block mb-0.5">{col.label}</label>
            <CellInput
              value={data[col.key] ?? ''}
              onChange={v => setData(d => ({ ...d, [col.key]: v }))}
              type={col.type}
              placeholder={col.type === 'link' ? 'Label | https://url' : col.label}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={save} disabled={saving}
          className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50">
          {saving ? '…' : '+ Add Row'}
        </button>
        <button onClick={() => setOpen(false)}
          className="flex-1 sm:flex-none bg-white hover:bg-slate-100 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg border border-slate-300">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Main SectionTable component ───────────────────────────────────────────────
export default function DayTable({ day: section, isEditing, onItineraryUpdate }) {
  const [editTitle, setEditTitle]     = useState(false)
  const [titleVal, setTitleVal]       = useState(section.title)
  const [editDate, setEditDate]       = useState(false)
  const [dateVal, setDateVal]         = useState(section.date || '')
  const [addingCol, setAddingCol]     = useState(false)
  const [newColLabel, setNewColLabel] = useState('')

  const cols = [...section.columns].sort((a, b) => a.order - b.order)
  const rows = [...section.rows].sort((a, b) => a.order - b.order)

  const saveTitle = async () => {
    try {
      const doc = await patchSection(section._id, { title: titleVal || section.title })
      onItineraryUpdate(doc)
    } catch { toast.error('Failed to update title') }
    setEditTitle(false)
  }

  const saveDate = async () => {
    try {
      const doc = await patchSection(section._id, { date: dateVal })
      onItineraryUpdate(doc)
    } catch { toast.error('Failed to update date') }
    setEditDate(false)
  }

  const handleDeleteSection = async () => {
    if (!window.confirm(`Delete section "${section.title}" and ALL its data? This cannot be undone.`)) return
    try {
      const doc = await deleteSection(section._id)
      toast.success('Section deleted')
      onItineraryUpdate(doc)
    } catch { toast.error('Failed to delete section') }
  }

  const handleAddColumn = async () => {
    const label = newColLabel.trim() || 'New Column'
    setAddingCol(true)
    try {
      const doc = await addColumn(section._id, { label, type: 'text' })
      toast.success(`Column "${label}" added`)
      onItineraryUpdate(doc)
      setNewColLabel('')
    } catch { toast.error('Failed to add column') }
    finally { setAddingCol(false) }
  }

  return (
    <div className="mb-8">
      {/* ── Section header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4 px-0.5">
        <div className="flex-1 min-w-0">
          {isEditing && editTitle ? (
            <input
              autoFocus
              value={titleVal}
              onChange={e => setTitleVal(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditTitle(false) }}
              className="text-xl sm:text-2xl font-bold text-slate-800 border-b-2 border-blue-500 outline-none w-full bg-transparent"
              placeholder="Section title"
            />
          ) : (
            <h2
              className={`text-lg sm:text-xl font-bold text-slate-800 ${isEditing ? 'cursor-pointer hover:text-blue-700' : ''} flex items-center gap-2`}
              onClick={isEditing ? () => { setTitleVal(section.title); setEditTitle(true) } : undefined}
              title={isEditing ? 'Click to rename' : ''}
            >
              <span className="break-words">{section.title}</span>
              {isEditing && <span className="text-blue-400 text-sm font-normal">✏️</span>}
            </h2>
          )}
          {isEditing && editDate ? (
            <input
              autoFocus
              type="date"
              value={dateVal}
              onChange={e => setDateVal(e.target.value)}
              onBlur={saveDate}
              onKeyDown={e => { if (e.key === 'Enter') saveDate(); if (e.key === 'Escape') setEditDate(false) }}
              className="text-sm border border-blue-300 rounded px-2 py-1 mt-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          ) : (
            <div
              className={`text-slate-400 text-xs sm:text-sm mt-0.5 ${isEditing ? 'cursor-pointer hover:text-blue-500' : ''}`}
              onClick={isEditing ? () => { setDateVal(section.date || ''); setEditDate(true) } : undefined}
              title={isEditing ? 'Click to set date' : ''}
            >
              {section.date
                ? new Date(section.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                : isEditing
                  ? <span className="italic text-xs text-slate-400">+ Tap to add date</span>
                  : null
              }
            </div>
          )}
        </div>

        {/* Section controls */}
        {isEditing && (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
              <input
                value={newColLabel}
                onChange={e => setNewColLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddColumn()}
                placeholder="Column name…"
                className="border border-dashed border-purple-300 hover:border-purple-400 focus:border-purple-500 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none flex-1 sm:w-32 bg-white"
              />
              <button
                onClick={handleAddColumn}
                disabled={addingCol}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-1 whitespace-nowrap flex-shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Column
              </button>
            </div>
            <button
              onClick={handleDeleteSection}
              className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap"
            >
              🗑 Delete Section
            </button>
          </div>
        )}
      </div>

      {/* ── Mobile Columns Manager (only in edit mode on small screens) ── */}
      {isEditing && cols.length > 0 && (
        <MobileColumnsManager cols={cols} sectionId={section._id} onUpdate={onItineraryUpdate} />
      )}

      {/* ── Mobile Card View (< md) ── */}
      <div className="md:hidden space-y-3">
        {rows.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 text-center py-10 px-4 text-slate-400 italic text-sm">
            No rows yet.{isEditing ? ' Tap "Add Row" below.' : ''}
          </div>
        ) : (
          rows.map((row, i) => (
            <MobileRowCard
              key={row._id}
              row={row}
              idx={i}
              cols={cols}
              sectionId={section._id}
              onUpdate={onItineraryUpdate}
              isEditing={isEditing}
            />
          ))
        )}
      </div>

      {/* ── Desktop Spreadsheet Table (>= md) ── */}
      <div className="hidden md:block overflow-x-auto rounded-xl shadow-md border border-slate-200">
        <table className="w-full border-collapse" style={{ minWidth: `${Math.max(500, (cols.length + 2) * 150)}px` }}>
          <thead>
            <tr className="group">
              <th className="px-3 py-3 w-10 text-center bg-blue-800 text-white text-xs font-semibold border-r border-blue-600">#</th>

              {isEditing
                ? cols.map((col, i) => (
                    <ColHeader
                      key={col._id}
                      col={col}
                      cols={cols}
                      sectionId={section._id}
                      onUpdate={onItineraryUpdate}
                      isFirst={i === 0}
                      isLast={i === cols.length - 1}
                    />
                  ))
                : cols.map(col => (
                    <th key={col._id}
                      className="px-4 py-3 text-left bg-gradient-to-b from-blue-700 to-blue-800 text-white text-sm font-semibold border-r border-blue-600 last:border-r-0 whitespace-nowrap">
                      {col.label}
                      {col.type === 'link' && <span className="ml-1 text-blue-300 text-xs">🔗</span>}
                      {col.type === 'multiline' && <span className="ml-1 text-blue-300 text-xs">¶</span>}
                    </th>
                  ))
              }

              {isEditing && (
                <th className="px-3 py-3 w-20 bg-blue-800 text-white text-xs font-semibold text-center">Actions</th>
              )}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={cols.length + (isEditing ? 2 : 1)}
                  className="text-center py-12 text-slate-400 italic text-sm"
                >
                  No rows yet.{isEditing ? ' Click "Add Row" below.' : ''}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <TableRow
                  key={row._id}
                  row={row}
                  idx={i}
                  cols={cols}
                  sectionId={section._id}
                  onUpdate={onItineraryUpdate}
                  isEditing={isEditing}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Add row button (edit mode) ── */}
      {isEditing && (
        <AddRowForm
          cols={cols}
          sectionId={section._id}
          onAdded={onItineraryUpdate}
        />
      )}
    </div>
  )
}
