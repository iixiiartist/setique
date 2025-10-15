import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { CheckCircle, Clock, Mail } from './Icons'

export default function BetaAccessGate() {
  const { user } = useAuth()
  const [betaStatus, setBetaStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accessCode, setAccessCode] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) {
      fetchBetaStatus()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchBetaStatus = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('beta_access')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No beta_access record (shouldn't happen with trigger, but handle it)
          setBetaStatus({ status: 'pending_approval', created_at: new Date().toISOString() })
        } else {
          throw error
        }
      } else {
        setBetaStatus(data)
      }
    } catch (error) {
      console.error('Error fetching beta status:', error)
      setError('Failed to load beta access status')
    } finally {
      setLoading(false)
    }
  }

  const handleRedeemCode = async (e) => {
    e.preventDefault()
    
    if (!accessCode.trim()) {
      setError('Please enter an access code')
      return
    }

    try {
      setRedeeming(true)
      setError(null)
      
      const { data, error } = await supabase.rpc('redeem_access_code', {
        code: accessCode.trim().toUpperCase()
      })

      if (error) throw error

      alert(data.message)
      
      // Reload the page to update auth context
      window.location.reload()
    } catch (error) {
      console.error('Error redeeming code:', error)
      setError(error.message || 'Invalid or expired access code')
    } finally {
      setRedeeming(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white border-4 border-black rounded-2xl p-8 max-w-md w-full text-center shadow-[8px_8px_0_#000]">
          <Clock className="h-16 w-16 animate-spin mx-auto mb-4" />
          <p className="font-bold text-lg">Checking your beta access...</p>
        </div>
      </div>
    )
  }

  // User has approved access and code is redeemed
  if (betaStatus?.status === 'approved' && betaStatus?.code_used_at) {
    return null // Don't show gate, user has full access
  }

  // User is pending approval
  if (betaStatus?.status === 'pending_approval') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-cyan-100 flex items-center justify-center p-4">
        <div className="bg-white border-4 border-black rounded-2xl p-8 max-w-2xl w-full shadow-[12px_12px_0_#000]">
          <div className="text-center mb-6">
            <Clock className="h-20 w-20 mx-auto mb-4 text-yellow-500" />
            <h1 className="text-4xl font-extrabold mb-2">You&apos;re in the Beta Queue!</h1>
            <p className="text-lg text-gray-700 font-semibold">
              Thanks for signing up for SETIQUE
            </p>
          </div>

          <div className="bg-yellow-100 border-3 border-black rounded-xl p-6 mb-6">
            <h2 className="text-xl font-extrabold mb-3">What happens next?</h2>
            <ol className="space-y-3 text-sm font-semibold">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-yellow-400 border-2 border-black rounded-full flex items-center justify-center font-bold">
                  1
                </span>
                <div>
                  <strong>We&apos;ll review your signup</strong>
                  <p className="text-gray-600">Our team reviews all beta applications to ensure quality</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-yellow-400 border-2 border-black rounded-full flex items-center justify-center font-bold">
                  2
                </span>
                <div>
                  <strong>You&apos;ll receive an email notification</strong>
                  <p className="text-gray-600">Check <strong>{betaStatus?.email}</strong> for your approval email</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-yellow-400 border-2 border-black rounded-full flex items-center justify-center font-bold">
                  3
                </span>
                <div>
                  <strong>Enter your access code</strong>
                  <p className="text-gray-600">Use the code from the email to unlock full platform access</p>
                </div>
              </li>
            </ol>
          </div>

          <div className="bg-blue-50 border-3 border-blue-500 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Mail className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="text-sm">
                <p className="font-bold mb-1">Already got your code?</p>
                <p className="text-gray-700">Enter it below to activate your account!</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleRedeemCode} className="space-y-4">
            <div>
              <label htmlFor="accessCode" className="block font-bold mb-2">
                Access Code
              </label>
              <input
                type="text"
                id="accessCode"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="BETA-XXXX-XXXX"
                className="w-full px-4 py-3 border-4 border-black focus:outline-none focus:ring-4 focus:ring-yellow-400 font-mono text-lg text-center"
                disabled={redeeming}
              />
            </div>

            {error && (
              <div className="bg-red-100 border-3 border-red-500 rounded-xl p-4">
                <p className="text-red-700 font-semibold text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={redeeming || !accessCode.trim()}
              className="w-full px-6 py-4 font-extrabold text-lg border-4 border-black bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-[4px_4px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#000] transition-all disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[4px_4px_0_#000]"
            >
              {redeeming ? 'Activating...' : 'Activate Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Signed up on {new Date(betaStatus?.created_at).toLocaleDateString()}</p>
            <p className="mt-2">
              Questions? Email us at{' '}
              <a href="mailto:info@setique.com" className="text-purple-600 underline hover:no-underline">
                info@setique.com
              </a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // User is approved but hasn't redeemed code yet
  if (betaStatus?.status === 'approved' && !betaStatus?.code_used_at) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 via-yellow-100 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white border-4 border-black rounded-2xl p-8 max-w-2xl w-full shadow-[12px_12px_0_#000]">
          <div className="text-center mb-6">
            <CheckCircle className="h-20 w-20 mx-auto mb-4 text-green-500" />
            <h1 className="text-4xl font-extrabold mb-2">You&apos;ve Been Approved!</h1>
            <p className="text-lg text-gray-700 font-semibold">
              Welcome to the SETIQUE beta program 🎉
            </p>
          </div>

          <div className="bg-green-100 border-3 border-green-500 rounded-xl p-6 mb-6">
            <p className="font-bold mb-2">Your Access Code:</p>
            <div className="bg-white border-3 border-black rounded-lg p-4 text-center">
              <code className="text-2xl font-mono font-bold">
                {betaStatus?.access_code}
              </code>
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">
              This code was sent to your email: {betaStatus?.email}
            </p>
          </div>

          <form onSubmit={handleRedeemCode} className="space-y-4">
            <div>
              <label htmlFor="accessCode" className="block font-bold mb-2">
                Enter Your Access Code to Continue
              </label>
              <input
                type="text"
                id="accessCode"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="BETA-XXXX-XXXX"
                className="w-full px-4 py-3 border-4 border-black focus:outline-none focus:ring-4 focus:ring-yellow-400 font-mono text-lg text-center"
                disabled={redeeming}
              />
            </div>

            {error && (
              <div className="bg-red-100 border-3 border-red-500 rounded-xl p-4">
                <p className="text-red-700 font-semibold text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={redeeming || !accessCode.trim()}
              className="w-full px-6 py-4 font-extrabold text-lg border-4 border-black bg-green-400 hover:bg-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-[4px_4px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#000] transition-all disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[4px_4px_0_#000]"
            >
              {redeeming ? 'Unlocking Access...' : '🚀 Unlock Full Access'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // User is on waitlist
  if (betaStatus?.status === 'waitlist') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white border-4 border-black rounded-2xl p-8 max-w-2xl w-full shadow-[12px_12px_0_#000]">
          <div className="text-center mb-6">
            <Clock className="h-20 w-20 mx-auto mb-4 text-blue-500" />
            <h1 className="text-4xl font-extrabold mb-2">You&apos;re on the Waitlist</h1>
            <p className="text-lg text-gray-700 font-semibold">
              Thanks for your interest in SETIQUE
            </p>
          </div>

          <div className="bg-blue-100 border-3 border-blue-500 rounded-xl p-6 mb-6">
            <p className="font-semibold text-gray-700">
              We&apos;re currently at capacity, but we&apos;ve added you to our priority waitlist. 
              We&apos;ll notify you at <strong>{betaStatus?.email}</strong> as soon as a spot opens up!
            </p>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>Added to waitlist on {new Date(betaStatus?.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    )
  }

  // User was rejected
  if (betaStatus?.status === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 via-pink-100 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white border-4 border-black rounded-2xl p-8 max-w-2xl w-full shadow-[12px_12px_0_#000]">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-extrabold mb-2">Beta Application Status</h1>
            <p className="text-lg text-gray-700 font-semibold">
              Thank you for your interest in SETIQUE
            </p>
          </div>

          <div className="bg-gray-100 border-3 border-gray-400 rounded-xl p-6 mb-6">
            <p className="font-semibold text-gray-700">
              Unfortunately, we&apos;re unable to approve your beta application at this time. 
              This could be due to capacity constraints or program requirements.
            </p>
            {betaStatus?.admin_notes && (
              <div className="mt-4 p-4 bg-white border-2 border-gray-300 rounded">
                <p className="text-sm"><strong>Note:</strong> {betaStatus.admin_notes}</p>
              </div>
            )}
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>
              Questions? Contact us at{' '}
              <a href="mailto:info@setique.com" className="text-purple-600 underline hover:no-underline">
                info@setique.com
              </a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
