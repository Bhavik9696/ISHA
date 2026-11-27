const express  = require('express');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const Admin     = require('../models/Admin');

const router = express.Router();

// ── Rate limit: max 10 attempts per 15 min per IP ───────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password is required' });

    const admin = await Admin.findOne();
    if (!admin) return res.status(500).json({ error: 'Admin not configured' });

    const match = await bcrypt.compare(password, admin.passwordHash);
    if (!match) return res.status(401).json({ error: 'Incorrect password' });

    // Issue a short-lived JWT (4 hours)
    const token = jwt.sign(
      { admin: true },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );

    res.json({ token, expiresIn: 4 * 60 * 60 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/verify  — lightweight token check used by frontend on reload
router.post('/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) return res.json({ valid: false });

  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    res.json({ valid: Boolean(decoded.admin) });
  } catch {
    res.json({ valid: false });
  }
});

module.exports = router;

