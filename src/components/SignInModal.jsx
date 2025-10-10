import { useState, useEffect } from 'react'
import { useSearchParams, useLocation } from 'react-router-dom'
import { X } from './Icons'
import { useAuth } from '../contexts/AuthContext'

export const SignInModal = ({ isOpen, onClose }) => {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()

  // Set initial mode based on URL parameter or route
  useEffect(() => {
    if (searchParams.get('signup') === 'true' || location.pathname === '/signup') {
      setIsSignUp(true)
    } else {
      setIsSignUp(false)
    }
  }, [searchParams, location])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        if (!username.trim()) {
          setError('Username is required')
          setLoading(false)
          return
        }
        const { error } = await signUp(email, password, username)
        if (error) {
          setError(error.message)
        } else {
          // Don't show alert, just close and let them access the app
          // BetaProtectedRoute will show them the beta gate
          onClose()
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          setError(error.message)
        } else {
          onClose()
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="modal-backdrop absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="modal-panel relative bg-white text-black max-w-sm w-full border-4 border-black rounded-3xl shadow-[12px_12px_0_#000] p-6 z-10">
        <button
          className="absolute top-3 right-3 border-2 border-black rounded-full p-1 bg-yellow-300 active:scale-95"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>
        <h4 className="text-3xl font-extrabold mb-4">
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white border-2 border-black rounded-md font-semibold p-3"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white border-2 border-black rounded-md font-semibold p-3"
            autoComplete="email"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white border-2 border-black rounded-md font-semibold p-3"
            autoComplete="current-password"
            required
            minLength={6}
          />
          {error && (
            <div className="text-red-600 text-sm font-semibold">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-bold border-2 border-black rounded-full py-3 hover:opacity-90 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-sm mt-4 font-semibold text-black/60">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
            }}
            className="underline font-bold"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  )
}
