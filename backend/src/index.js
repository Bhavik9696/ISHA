require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth');
const itineraryRoutes = require('./routes/itinerary');
const { seedAdminPassword } = require('./middleware/seedAdmin');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Database connection (cached for serverless + local) ─────────────────────
let dbReady = null;
async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  if (!dbReady) {
    dbReady = mongoose
      .connect(process.env.MONGODB_URI)
      .then(async () => {
        console.log('✅  MongoDB connected');
        await seedAdminPassword();
      })
      .catch((err) => {
        dbReady = null;
        throw err;
      });
  }
  await dbReady;
}

// ── Security middleware ─────────────────────────────────────────────────────
const allowedOrigin = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.replace(/\/+$/, '')
  : '*';

app.use(helmet());
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));

// Ensure DB is connected before handling API requests
app.use(async (req, res, next) => {
  if (req.path === '/api/health') return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('❌  MongoDB connection failed:', err.message);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/itinerary', itineraryRoutes);

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'ISHA Backend API is running' });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 & Error handler ─────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Start server locally / on Render (skip on Vercel serverless) ────────────
if (!process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => console.log(`🚀  Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error('❌  MongoDB connection failed:', err.message);
      process.exit(1);
    });
}

module.exports = app;
