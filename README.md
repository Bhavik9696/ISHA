# ISHA – Public Itinerary Management Web Application

A full-stack, production-ready travel itinerary manager.  
**Anyone** can view the itinerary. Only the **admin** (password-protected) can edit it.  
All data is stored permanently in **MongoDB Atlas**.

---

## 📁 Project Structure

```
ISHA/
├── backend/          # Node.js + Express + Mongoose API
│   ├── src/
│   │   ├── index.js
│   │   ├── models/
│   │   │   ├── Admin.js        # bcrypt-hashed admin credential
│   │   │   └── Itinerary.js    # itinerary → days → rows schema
│   │   ├── routes/
│   │   │   ├── auth.js         # POST /api/auth/login  |  POST /api/auth/verify
│   │   │   └── itinerary.js    # CRUD for itinerary / days / rows
│   │   └── middleware/
│   │       ├── auth.js         # JWT Bearer token guard
│   │       └── seedAdmin.js    # Seeds hashed password on first boot
│   ├── .env.example
│   ├── render.yaml
│   └── package.json
│
└── frontend/         # React 18 + Vite + Tailwind CSS
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── index.css
    │   ├── api/
    │   │   └── itinerary.js    # Axios wrappers for all API calls
    │   ├── context/
    │   │   └── AuthContext.jsx # JWT state, login/logout
    │   ├── components/
    │   │   ├── Header.jsx      # Title, Edit button, Admin banner
    │   │   ├── DaySelector.jsx # Day tab strip + Add Day
    │   │   ├── DayTable.jsx    # Spreadsheet table + inline editors
    │   │   └── LoginModal.jsx  # Password modal
    │   └── pages/
    │       └── ItineraryPage.jsx
    ├── .env.example
    ├── vercel.json
    └── package.json
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js >= 18
- A free MongoDB Atlas cluster (https://cloud.mongodb.com)

### 1 · Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env — fill in MONGODB_URI, JWT_SECRET, ADMIN_PASSWORD, FRONTEND_URL
npm install
npm run dev      # starts on :5000
```

Backend .env variables:

| Variable         | Description                                                                 |
|------------------|-----------------------------------------------------------------------------|
| MONGODB_URI      | MongoDB Atlas connection string                                             |
| JWT_SECRET       | Random 64-char hex (node -e "console.log(require('crypto').randomBytes(64).toString('hex'))") |
| ADMIN_PASSWORD   | Plain-text admin password — hashed on first boot                           |
| FRONTEND_URL     | CORS origin (http://localhost:5173 in dev, your Vercel URL in prod)        |
| PORT             | Defaults to 5000                                                            |

### 2 · Frontend Setup

```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:5000
npm install
npm run dev      # starts on :5173
```

Open http://localhost:5173 — itinerary loads immediately.

---

## ☁️ Production Deployment

### Backend → Render

1. Push backend/ to GitHub.
2. Create a new Web Service on Render.
3. Build Command: npm install | Start Command: npm start
4. Add all env vars in Render dashboard.
5. Your backend URL: https://isha-itinerary-backend.onrender.com

### Frontend → Vercel

1. Push frontend/ to GitHub.
2. Import to Vercel. Framework Preset: Vite.
3. Add env variable: VITE_API_URL=https://isha-itinerary-backend.onrender.com
4. Deploy.

IMPORTANT: After frontend deploy, update FRONTEND_URL in Render to your Vercel URL and redeploy backend.

---

## 🔐 Security Architecture

| Layer            | Mechanism                                                   |
|------------------|-------------------------------------------------------------|
| Password storage | bcryptjs hash (cost 12) stored in MongoDB                   |
| Auth token       | Short-lived JWT (4h), signed with JWT_SECRET                |
| Token transport  | Authorization: Bearer header — never URL/cookie             |
| Edit API guard   | requireAdmin middleware on every mutating route             |
| Rate limiting    | Max 10 login attempts / 15 min / IP                         |
| Secrets          | Backend env vars only — never sent to frontend              |
| CORS             | Restricted to FRONTEND_URL                                  |
| Helmet           | HTTP security headers on every response                     |

---

## 📡 API Reference

### Auth
| Method | Endpoint            | Auth  | Description                  |
|--------|---------------------|-------|------------------------------|
| POST   | /api/auth/login     | None  | Verify password → return JWT |
| POST   | /api/auth/verify    | Bearer| Check if token is still valid|

### Itinerary
| Method | Endpoint                                    | Auth  | Description              |
|--------|---------------------------------------------|-------|--------------------------|
| GET    | /api/itinerary                              | None  | Fetch full itinerary     |
| PATCH  | /api/itinerary                              | Admin | Update title/destination |
| POST   | /api/itinerary/days                         | Admin | Add a new day            |
| PATCH  | /api/itinerary/days/:dayId                  | Admin | Update day label/date    |
| DELETE | /api/itinerary/days/:dayId                  | Admin | Delete day + rows        |
| POST   | /api/itinerary/days/:dayId/rows             | Admin | Add a row                |
| PATCH  | /api/itinerary/days/:dayId/rows/:rowId      | Admin | Update a row             |
| DELETE | /api/itinerary/days/:dayId/rows/:rowId      | Admin | Delete a row             |
| PUT    | /api/itinerary/days/:dayId/rows/reorder     | Admin | Reorder rows             |

---

## ✅ Functional Checklist

- [x] Public read access — no login required
- [x] Password modal on Edit click
- [x] Incorrect password → error, no access
- [x] Correct password → JWT issued, Edit Mode enabled
- [x] Add / Edit / Delete rows with live DB persistence
- [x] Add / Edit / Delete days
- [x] Edit itinerary title and destination
- [x] Google Maps links & clickable URLs in Remarks
- [x] Alternating row colours, responsive table, horizontal scroll on mobile
- [x] Footer shows last-updated timestamp
- [x] Data survives backend restart / redeployment
- [x] Data identical across all browsers and devices

---

## 📝 Notes

- First backend start: hashes ADMIN_PASSWORD and stores it in MongoDB. Env var ignored thereafter.
- To reset password: delete the `admins` collection in Atlas, update ADMIN_PASSWORD env, restart backend.
- App auto-creates a sample itinerary on first visit if none exists.

