const mongoose = require('mongoose');

// ── Admin credential store (singleton) ──────────────────────────────────────
const adminSchema = new mongoose.Schema({
  passwordHash: { type: String, required: true },
  updatedAt:    { type: Date,   default: Date.now },
});

module.exports = mongoose.model('Admin', adminSchema);

