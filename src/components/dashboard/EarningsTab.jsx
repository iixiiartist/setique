import { DollarSign, TrendingUp, Calendar } from '../Icons'

export default function EarningsTab({ earnings, payouts }) {
  const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0)
  const totalPayouts = payouts.reduce((sum, p) => sum + p.amount, 0)
  const availableBalance = totalEarnings - totalPayouts

  return (
    <div className="space-y-6">
      {/* Balance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="text-sm font-bold text-gray-600">Total Earnings</h3>
          </div>
          <p className="text-3xl font-black text-green-600">${totalEarnings.toFixed(2)}</p>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-gray-600">Total Payouts</h3>
          </div>
          <p className="text-3xl font-black text-blue-600">${totalPayouts.toFixed(2)}</p>
        </div>

        <div className="bg-cyan-100 border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-cyan-800" />
            <h3 className="text-sm font-bold text-gray-600">Available Balance</h3>
          </div>
          <p className="text-3xl font-black text-cyan-800">${availableBalance.toFixed(2)}</p>
        </div>
      </div>

      {/* Earnings History */}
      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="border-b-4 border-black p-6">
          <h3 className="text-2xl font-black">Earnings History</h3>
        </div>
        <div className="p-6">
          {earnings.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No earnings yet. Start selling datasets to earn revenue!</p>
          ) : (
            <div className="space-y-3">
              {earnings.map((earning) => (
                <div
                  key={earning.id}
                  className="border-3 border-black p-4 bg-green-50 hover:bg-green-100 transition flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold">{earning.dataset_title}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(earning.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-green-600">+${earning.amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Purchase</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payout History */}
      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="border-b-4 border-black p-6">
          <h3 className="text-2xl font-black">Payout History</h3>
        </div>
        <div className="p-6">
          {payouts.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No payouts yet. Request a payout when you have available balance.</p>
          ) : (
            <div className="space-y-3">
              {payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="border-3 border-black p-4 bg-blue-50 hover:bg-blue-100 transition flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold capitalize">{payout.status}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(payout.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-blue-600">-${payout.amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      {payout.status === 'completed' ? 'Paid' : payout.status === 'pending' ? 'Processing' : 'Cancelled'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Request Payout Button */}
      {availableBalance >= 10 && (
        <div className="bg-yellow-100 border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <p className="mb-4 font-bold">You have ${availableBalance.toFixed(2)} available for payout</p>
          <button className="px-6 py-3 bg-green-400 hover:bg-green-500 border-3 border-black font-black transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1">
            Request Payout
          </button>
        </div>
      )}
    </div>
  )
}
