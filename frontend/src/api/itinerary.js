import axios from 'axios'

// In production (Vercel), route /api/* through same-origin vercel.json rewrite to avoid CORS
const BASE = import.meta.env.PROD
  ? ''
  : (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

const api = axios.create({ baseURL: BASE })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login       = (password) => api.post('/api/auth/login',  { password }).then(r => r.data)
export const verifyToken = ()         => api.post('/api/auth/verify').then(r => r.data)

// ── Document ──────────────────────────────────────────────────────────────────
export const getItinerary   = ()     => api.get('/api/itinerary').then(r => r.data)
export const patchItinerary = (data) => api.patch('/api/itinerary', data).then(r => r.data)

// ── Sections ──────────────────────────────────────────────────────────────────
export const addSection    = (data)        => api.post(`/api/itinerary/sections`, data).then(r => r.data)
export const patchSection  = (sid, data)   => api.patch(`/api/itinerary/sections/${sid}`, data).then(r => r.data)
export const deleteSection = (sid)         => api.delete(`/api/itinerary/sections/${sid}`).then(r => r.data)

// ── Columns ───────────────────────────────────────────────────────────────────
export const addColumn      = (sid, data)       => api.post(`/api/itinerary/sections/${sid}/columns`, data).then(r => r.data)
export const patchColumn    = (sid, cid, data)  => api.patch(`/api/itinerary/sections/${sid}/columns/${cid}`, data).then(r => r.data)
export const deleteColumn   = (sid, cid)        => api.delete(`/api/itinerary/sections/${sid}/columns/${cid}`).then(r => r.data)
export const reorderColumns = (sid, orderedIds) => api.put(`/api/itinerary/sections/${sid}/columns/reorder`, { orderedIds }).then(r => r.data)

// ── Rows ──────────────────────────────────────────────────────────────────────
export const addRow      = (sid, data)       => api.post(`/api/itinerary/sections/${sid}/rows`, data).then(r => r.data)
export const patchRow    = (sid, rid, data)  => api.patch(`/api/itinerary/sections/${sid}/rows/${rid}`, data).then(r => r.data)
export const deleteRow   = (sid, rid)        => api.delete(`/api/itinerary/sections/${sid}/rows/${rid}`).then(r => r.data)
export const reorderRows = (sid, orderedIds) => api.put(`/api/itinerary/sections/${sid}/rows/reorder`, { orderedIds }).then(r => r.data)
