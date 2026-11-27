import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ItineraryPage from './pages/ItineraryPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<ItineraryPage />} />
        <Route path="*" element={<ItineraryPage />} />
      </Routes>
    </AuthProvider>
  )
}

