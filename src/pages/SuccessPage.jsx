import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

function SuccessPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [dataset, setDataset] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verifyPurchase = async () => {
      // Get session ID from URL
      const params = new URLSearchParams(window.location.search)
      const sessionId = params.get('session_id')

      if (!sessionId || !user) {
        navigate('/')
        return
      }

      try {
        // Find the purchase
        const { data: purchase, error } = await supabase
          .from('purchases')
          .select(
            `
            *,
            datasets (*)
          `
          )
          .eq('stripe_session_id', sessionId)
          .eq('user_id', user.id)
          .single()

        if (error) throw error

        setDataset(purchase.datasets)
      } catch (error) {
        console.error('Error verifying purchase:', error)
      } finally {
        setLoading(false)
      }
    }

    verifyPurchase()
  }, [user, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-pink-400 to-cyan-300 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto mb-4"></div>
          <p className="text-2xl font-extrabold text-black">
            Verifying your purchase...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-pink-400 to-cyan-300 text-black font-sans p-4 sm:p-8">
      <div className="max-w-2xl mx-auto mt-20">
        <div className="bg-white border-4 border-black rounded-3xl shadow-[12px_12px_0_#000] p-8 text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-4xl font-extrabold mb-4">
            Purchase Successful!
          </h1>
          {dataset && (
            <>
              <p className="text-xl font-semibold mb-6 text-black/80">
                You now own: <strong>{dataset.title}</strong>
              </p>
              <div className="bg-yellow-200 border-2 border-black rounded-xl p-6 mb-6 text-left">
                <h2 className="text-2xl font-extrabold mb-4">
                  What happens next?
                </h2>
                <ul className="space-y-3 font-semibold">
                  <li className="flex items-start gap-2">
                    <span className="text-2xl">📧</span>
                    <span>
                      A download link has been sent to your email address
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-2xl">💾</span>
                    <span>
                      You can also access your purchase from your account dashboard
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-2xl">🔒</span>
                    <span>
                      Your data is securely stored and ready for download
                    </span>
                  </li>
                </ul>
              </div>
              <div className="bg-cyan-200 border-2 border-black rounded-xl p-4 mb-6">
                <p className="font-extrabold text-lg mb-2">
                  Dataset Details
                </p>
                <p className="text-sm font-semibold">{dataset.description}</p>
                <p className="text-lg font-extrabold mt-3">
                  Price: ${dataset.price}
                </p>
              </div>
            </>
          )}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-bold border-2 border-black rounded-full px-8 py-3 hover:opacity-90 active:scale-95"
            >
              Back to Marketplace
            </button>
            <button
              onClick={() =>
                alert(
                  'Account dashboard coming soon! Check your email for the download link.'
                )
              }
              className="bg-yellow-400 text-black font-bold border-2 border-black rounded-full px-8 py-3 hover:bg-yellow-300 active:scale-95"
            >
              View My Purchases
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SuccessPage
