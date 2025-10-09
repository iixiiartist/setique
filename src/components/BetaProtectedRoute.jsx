import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import BetaAccessGate from './BetaAccessGate'

/**
 * Wrapper component that checks if user has beta access before allowing access to protected routes
 * Redirects to BetaAccessGate if user hasn't been approved or hasn't redeemed their access code
 */
export default function BetaProtectedRoute({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  const [hasAccess, setHasAccess] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const checkBetaAccess = async () => {
      try {
        setLoading(true)

        const { data, error } = await supabase.rpc('has_beta_access')

        if (error) throw error

        setHasAccess(data)
      } catch (error) {
        console.error('Error checking beta access:', error)
        // Fail open - if we can't check access, allow through
        // (Better to be permissive than break app)
        setHasAccess(true)
      } finally {
        setLoading(false)
      }
    }

    checkBetaAccess()
  }, [user])

  // Not logged in - redirect to home/login
  if (!user && !loading) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  // Still checking access
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500" />
      </div>
    )
  }

  // User doesn't have beta access - show gate
  if (!hasAccess) {
    return <BetaAccessGate />
  }

  // User has access - render children
  return children
}
