import { DollarSign } from '../../Icons'

/**
 * EarningsTab - Display earnings summary, payout account status, and transaction history
 * 
 * @param {Object} props
 * @param {Object} props.earnings - Earnings data { total, pending, paid, transactions }
 * @param {Object} props.payoutAccount - Stripe payout account data
 * @param {boolean} props.connectingStripe - Whether Stripe connection is in progress
 * @param {string} props.connectError - Error message from Stripe connection
 * @param {Function} props.handleConnectStripe - Function to initiate Stripe connection
 */
export function EarningsTab({ 
  earnings,
  payoutAccount,
  connectingStripe,
  connectError,
  handleConnectStripe
}) {
  return (
    <div>
      <h3 className="text-2xl font-extrabold mb-4">Earnings & Payouts</h3>
      
      {/* Earnings Summary */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-200 border-2 border-black rounded-xl p-4">
          <div className="text-sm font-bold text-black/60 uppercase mb-1">
            Total Earned
          </div>
          <div className="text-3xl font-extrabold">
            ${earnings?.total.toFixed(2) || '0.00'}
          </div>
        </div>
        <div className="bg-yellow-200 border-2 border-black rounded-xl p-4">
          <div className="text-sm font-bold text-black/60 uppercase mb-1">
            Pending
          </div>
          <div className="text-3xl font-extrabold">
            ${earnings?.pending.toFixed(2) || '0.00'}
          </div>
        </div>
        <div className="bg-blue-200 border-2 border-black rounded-xl p-4">
          <div className="text-sm font-bold text-black/60 uppercase mb-1">
            Paid Out
          </div>
          <div className="text-3xl font-extrabold">
            ${earnings?.paid.toFixed(2) || '0.00'}
          </div>
        </div>
      </div>

      {/* Payout Account Status */}
      {payoutAccount && payoutAccount.payouts_enabled ? (
        <div className="bg-white border-2 border-black rounded-xl p-4 mb-6">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-extrabold mb-2">Payout Account</h4>
              <p className="text-sm font-semibold">
                Status: <span className="font-extrabold">{payoutAccount.account_status}</span>
              </p>
              <p className="text-sm font-semibold">
                Payouts {payoutAccount.payouts_enabled ? 'Enabled ✅' : 'Disabled ❌'}
              </p>
            </div>
            <a
              href="https://dashboard.stripe.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-purple-200 text-black font-bold px-4 py-2 rounded-full border-2 border-black hover:scale-105 transition text-sm"
            >
              Manage on Stripe →
            </a>
          </div>
          {payoutAccount.current_balance >= payoutAccount.minimum_payout_threshold && (
            <button className="bg-green-300 text-black font-bold px-4 py-2 rounded-full border-2 border-black hover:scale-105 transition w-full">
              Request Payout (${payoutAccount.current_balance.toFixed(2)} available)
            </button>
          )}
        </div>
      ) : (
        <div className="bg-yellow-100 border-2 border-black rounded-xl p-4 mb-6">
          <h4 className="font-extrabold mb-2">⚠️ Setup Payout Account</h4>
          <p className="text-sm font-semibold mb-3">
            {payoutAccount ? 
              'Complete your Stripe onboarding to enable payouts' : 
              'Connect your Stripe account to receive payouts'
            }
          </p>
          {connectError && (
            <div className="bg-red-100 border-2 border-red-500 rounded-lg p-3 mb-3">
              <p className="text-sm font-bold text-red-800">❌ {connectError}</p>
            </div>
          )}
          <button 
            onClick={handleConnectStripe}
            disabled={connectingStripe}
            className="bg-[linear-gradient(90deg,#ffea00,#00ffff)] text-black font-bold px-4 py-2 rounded-full border-2 border-black hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed w-full"
          >
            {connectingStripe ? 'Connecting...' : (payoutAccount ? 'Complete Stripe Onboarding' : 'Connect Stripe Account')}
          </button>
        </div>
      )}

      {/* Transaction History */}
      {earnings && earnings.transactions.length > 0 ? (
        <div>
          <h4 className="font-extrabold mb-3">Transaction History</h4>
          <div className="space-y-2">
            {earnings.transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex justify-between items-center p-3 border-2 border-black rounded-lg bg-gray-50"
              >
                <div>
                  <div className="font-bold">
                    Sale #{transaction.id.substring(0, 8)}
                  </div>
                  <div className="text-xs text-black/60">
                    {new Date(transaction.earned_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold">
                    ${parseFloat(transaction.creator_net).toFixed(2)}
                  </div>
                  <div className="text-xs font-bold text-black/60">
                    {transaction.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <DollarSign className="h-16 w-16 mx-auto mb-4 text-black/30" />
          <p className="font-bold text-black/60">
            No earnings yet. Create and sell datasets to start earning!
          </p>
        </div>
      )}
    </div>
  )
}
