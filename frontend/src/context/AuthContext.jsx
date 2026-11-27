import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { verifyToken } from '../api/itinerary'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin]   = useState(false)
  const [checking, setChecking] = useState(true)

  // On mount: verify stored token
  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) { setChecking(false); return }

    verifyToken()
      .then(({ valid }) => setIsAdmin(valid))
      .catch(() => setIsAdmin(false))
      .finally(() => setChecking(false))
  }, [])

  const setToken = useCallback((token) => {
    if (token) {
      localStorage.setItem('admin_token', token)
      setIsAdmin(true)
    } else {
      localStorage.removeItem('admin_token')
      setIsAdmin(false)
    }
  }, [])

  const logout = useCallback(() => setToken(null), [setToken])

  return (
    <AuthContext.Provider value={{ isAdmin, checking, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

