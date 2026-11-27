const mongoose = require('mongoose')

// ── Column definition (admin-customisable) ───────────────────────────────────
const columnSchema = new mongoose.Schema({
  key:   { type: String, required: true }, // stable key used in row.data map
  label: { type: String, default: 'Column' },
  type:  { type: String, default: 'text', enum: ['text', 'multiline', 'link'] },
  order: { type: Number, default: 0 },
}, { _id: true })

// ── Row  (data stored as a flexible key→value map) ───────────────────────────
const rowSchema = new mongoose.Schema({
  data:  { type: Map, of: String, default: () => ({}) },
  order: { type: Number, default: 0 },
}, { _id: true })

// ── Section (was "Day" — now fully generic) ──────────────────────────────────
const sectionSchema = new mongoose.Schema({
  title:   { type: String, default: 'Section 1' },
  date:    { type: String, default: '' },        // optional date label
  columns: [columnSchema],
  rows:    [rowSchema],
  order:   { type: Number, default: 0 },
}, { _id: true })

// ── Top-level document ────────────────────────────────────────────────────────
const docSchema = new mongoose.Schema({
  title:    { type: String, default: 'My Document' },
  subtitle: { type: String, default: '' },
  sections: [sectionSchema],
  updatedAt: { type: Date, default: Date.now },
})

docSchema.pre('save', function (next) {
  this.updatedAt = new Date()
  next()
})

module.exports = mongoose.model('Itinerary', docSchema)
