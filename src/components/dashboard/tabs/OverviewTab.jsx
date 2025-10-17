import { Package } from '../../Icons'

/**
 * OverviewTab - Dashboard overview showing recent activity and quick stats
 * 
 * @param {Object} props
 * @param {Array} props.myPurchases - User's recent purchases
 * @param {Array} props.myDatasets - User's datasets
 * @param {Object} props.earnings - Earnings data with transactions
 * @param {Function} props.handleDownload - Function to download a purchased dataset
 * @param {Function} props.setActiveTab - Function to switch tabs
 */
export function OverviewTab({ 
  myPurchases,
  myDatasets,
  earnings,
  handleDownload,
  setActiveTab 
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-extrabold">Recent Activity</h3>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 border-2 border-black rounded-xl bg-yellow-100">
        <p className="font-bold text-black/80 max-w-2xl">
          Check out what the curators and buyers you follow are doing in the Activity Feed tab. Track fresh datasets, trending purchases, and more!
        </p>
        <button
          onClick={() => setActiveTab('activity')}
          className="self-start md:self-auto bg-[linear-gradient(90deg,#ffea00,#00ffff)] text-black font-extrabold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition"
        >
          View Activity Feed
        </button>
      </div>
      
      {/* Recent Purchases */}
      {myPurchases.length > 0 && (
        <div>
          <h4 className="text-lg font-extrabold mb-3">Recent Purchases</h4>
          <div className="space-y-2">
            {myPurchases.slice(0, 3).map((purchase) => (
              <div
                key={purchase.id}
                className="flex justify-between items-center p-3 bg-cyan-100 border-2 border-black rounded-lg"
              >
                <div>
                  <div className="font-bold">{purchase.datasets.title}</div>
                  <div className="text-sm text-black/60">
                    {new Date(purchase.purchased_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(purchase.dataset_id)}
                  className="bg-[linear-gradient(90deg,#ffea00,#00ffff)] text-black font-bold px-4 py-2 rounded-full border-2 border-black hover:scale-105 transition text-sm"
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Dataset Purchases */}
      {earnings && earnings.transactions.length > 0 && (
        <div>
          <h4 className="text-lg font-extrabold mb-3">Recent Purchases from Your Datasets</h4>
          <div className="space-y-2">
            {earnings.transactions.slice(0, 3).map((transaction) => (
              <div
                key={transaction.id}
                className="flex justify-between items-center p-3 bg-pink-100 border-2 border-black rounded-lg"
              >
                <div>
                  <div className="font-bold">Purchase #{transaction.id.substring(0, 8)}</div>
                  <div className="text-sm text-black/60">
                    {new Date(transaction.earned_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-lg">
                    +${parseFloat(transaction.creator_net).toFixed(2)}
                  </div>
                  <div className="text-xs font-bold text-black/60">
                    {transaction.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {myPurchases.length === 0 && myDatasets.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto mb-4 text-black/30" />
          <p className="font-bold text-black/60">
            No activity yet. Start by creating a dataset or purchasing one!
          </p>
        </div>
      )}
    </div>
  )
}
