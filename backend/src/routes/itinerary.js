const express   = require('express')
const Itinerary = require('../models/Itinerary')
const { requireAdmin } = require('../middleware/auth')

const router = express.Router()

// ── Helpers ───────────────────────────────────────────────────────────────────
function colKey () {
  return 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

async function getOrCreate () {
  let doc = await Itinerary.findOne()
  if (!doc) {
    doc = await Itinerary.create({ title: 'My Document', subtitle: '', sections: [] })
    console.log('📋  Created default document.')
  }
  return doc
}

// ══════════════════════════════════════════════════════════════════════════════
// DOCUMENT
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/itinerary  — public
router.get('/', async (_req, res) => {
  try { res.json(await getOrCreate()) }
  catch (e) { console.error(e); res.status(500).json({ error: 'Failed to fetch' }) }
})

// PATCH /api/itinerary  — admin: update title / subtitle
router.patch('/', requireAdmin, async (req, res) => {
  try {
    const doc = await getOrCreate()
    const { title, subtitle } = req.body
    if (title    !== undefined) doc.title    = title
    if (subtitle !== undefined) doc.subtitle = subtitle
    await doc.save()
    res.json(doc)
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to update' }) }
})

// ══════════════════════════════════════════════════════════════════════════════
// SECTIONS
// ══════════════════════════════════════════════════════════════════════════════

// POST /api/itinerary/sections  — admin: add section
router.post('/sections', requireAdmin, async (req, res) => {
  try {
    const doc  = await getOrCreate()
    const next = doc.sections.length + 1
    const { title = `Section ${next}`, date = '' } = req.body

    // Default 3 columns
    const defaultCols = [
      { key: colKey(), label: 'Column 1', type: 'text',      order: 0 },
      { key: colKey(), label: 'Column 2', type: 'text',      order: 1 },
      { key: colKey(), label: 'Column 3', type: 'multiline', order: 2 },
    ]
    doc.sections.push({ title, date, columns: defaultCols, rows: [], order: doc.sections.length })
    await doc.save()
    res.status(201).json(doc)
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to add section' }) }
})

// PATCH /api/itinerary/sections/:sid  — admin
router.patch('/sections/:sid', requireAdmin, async (req, res) => {
  try {
    const doc = await getOrCreate()
    const sec = doc.sections.id(req.params.sid)
    if (!sec) return res.status(404).json({ error: 'Section not found' })
    const { title, date } = req.body
    if (title !== undefined) sec.title = title
    if (date  !== undefined) sec.date  = date
    await doc.save()
    res.json(doc)
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to update section' }) }
})

// DELETE /api/itinerary/sections/:sid  — admin
router.delete('/sections/:sid', requireAdmin, async (req, res) => {
  try {
    const doc = await getOrCreate()
    const sec = doc.sections.id(req.params.sid)
    if (!sec) return res.status(404).json({ error: 'Section not found' })
    sec.deleteOne()
    await doc.save()
    res.json(doc)
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to delete section' }) }
})

// ══════════════════════════════════════════════════════════════════════════════
// COLUMNS
// ══════════════════════════════════════════════════════════════════════════════

// POST /api/itinerary/sections/:sid/columns  — admin: add column
router.post('/sections/:sid/columns', requireAdmin, async (req, res) => {
  try {
    const doc = await getOrCreate()
    const sec = doc.sections.id(req.params.sid)
    if (!sec) return res.status(404).json({ error: 'Section not found' })

    const { label = 'New Column', type = 'text' } = req.body
    sec.columns.push({ key: colKey(), label, type, order: sec.columns.length })
    await doc.save()
    res.status(201).json(doc)
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to add column' }) }
})

// PATCH /api/itinerary/sections/:sid/columns/:cid  — admin
router.patch('/sections/:sid/columns/:cid', requireAdmin, async (req, res) => {
  try {
    const doc = await getOrCreate()
    const sec = doc.sections.id(req.params.sid)
    if (!sec) return res.status(404).json({ error: 'Section not found' })
    const col = sec.columns.id(req.params.cid)
    if (!col) return res.status(404).json({ error: 'Column not found' })

    const { label, type, order } = req.body
    if (label !== undefined) col.label = label
    if (type  !== undefined) col.type  = type
    if (order !== undefined) col.order = order
    await doc.save()
    res.json(doc)
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to update column' }) }
})

// DELETE /api/itinerary/sections/:sid/columns/:cid  — admin
router.delete('/sections/:sid/columns/:cid', requireAdmin, async (req, res) => {
  try {
    const doc = await getOrCreate()
    const sec = doc.sections.id(req.params.sid)
    if (!sec) return res.status(404).json({ error: 'Section not found' })
    const col = sec.columns.id(req.params.cid)
    if (!col) return res.status(404).json({ error: 'Column not found' })
    col.deleteOne()
    await doc.save()
    res.json(doc)
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to delete column' }) }
})

// PUT /api/itinerary/sections/:sid/columns/reorder  — admin
router.put('/sections/:sid/columns/reorder', requireAdmin, async (req, res) => {
  try {
    const { orderedIds } = req.body
    if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds must be an array' })

    const doc = await getOrCreate()
    const sec = doc.sections.id(req.params.sid)
    if (!sec) return res.status(404).json({ error: 'Section not found' })

    const map = {}
    sec.columns.forEach(c => { map[c._id.toString()] = c })
    orderedIds.forEach((id, i) => { if (map[id]) map[id].order = i })
    sec.columns.sort((a, b) => a.order - b.order)
    await doc.save()
    res.json(doc)
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to reorder columns' }) }
})

// ══════════════════════════════════════════════════════════════════════════════
// ROWS
// ══════════════════════════════════════════════════════════════════════════════

// POST /api/itinerary/sections/:sid/rows  — admin
router.post('/sections/:sid/rows', requireAdmin, async (req, res) => {
  try {
    const doc = await getOrCreate()
    const sec = doc.sections.id(req.params.sid)
    if (!sec) return res.status(404).json({ error: 'Section not found' })

    const data = req.body.data || {}
    sec.rows.push({ data: new Map(Object.entries(data)), order: sec.rows.length })
    await doc.save()
    res.status(201).json(doc)
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to add row' }) }
})

// PATCH /api/itinerary/sections/:sid/rows/:rid  — admin
router.patch('/sections/:sid/rows/:rid', requireAdmin, async (req, res) => {
  try {
    const doc = await getOrCreate()
    const sec = doc.sections.id(req.params.sid)
    if (!sec) return res.status(404).json({ error: 'Section not found' })
    const row = sec.rows.id(req.params.rid)
    if (!row) return res.status(404).json({ error: 'Row not found' })

    if (req.body.data !== undefined) {
      row.data = new Map(Object.entries(req.body.data))
    }
    if (req.body.order !== undefined) row.order = req.body.order
    doc.markModified('sections')
    await doc.save()
    res.json(doc)
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to update row' }) }
})

// DELETE /api/itinerary/sections/:sid/rows/:rid  — admin
router.delete('/sections/:sid/rows/:rid', requireAdmin, async (req, res) => {
  try {
    const doc = await getOrCreate()
    const sec = doc.sections.id(req.params.sid)
    if (!sec) return res.status(404).json({ error: 'Section not found' })
    const row = sec.rows.id(req.params.rid)
    if (!row) return res.status(404).json({ error: 'Row not found' })
    row.deleteOne()
    sec.rows.forEach((r, i) => { r.order = i })
    await doc.save()
    res.json(doc)
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to delete row' }) }
})

// PUT /api/itinerary/sections/:sid/rows/reorder  — admin
router.put('/sections/:sid/rows/reorder', requireAdmin, async (req, res) => {
  try {
    const { orderedIds } = req.body
    if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds must be array' })
    const doc = await getOrCreate()
    const sec = doc.sections.id(req.params.sid)
    if (!sec) return res.status(404).json({ error: 'Section not found' })

    const map = {}
    sec.rows.forEach(r => { map[r._id.toString()] = r })
    const reordered = orderedIds.filter(id => map[id]).map((id, i) => { map[id].order = i; return map[id] })
    sec.rows = reordered
    await doc.save()
    res.json(doc)
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to reorder rows' }) }
})

module.exports = router
