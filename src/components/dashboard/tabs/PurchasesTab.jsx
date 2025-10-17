import { Download, ShoppingBag } from '../../Icons'

/**
 * PurchasesTab - Display and manage purchased datasets
 * 
 * @param {Object} props
 * @param {Array} props.myPurchases - User's purchased datasets
 * @param {Function} props.handleDownload - Function to download a purchased dataset
 * @param {Function} props.navigate - Navigation function to browse datasets
 */
export function PurchasesTab({ myPurchases, handleDownload, navigate }) {
  return (
    <div>
      <h3 className="text-2xl font-extrabold mb-4">My Purchases</h3>
      {myPurchases.length > 0 ? (
        <div className="space-y-4">
          {myPurchases.map((purchase) => (
            <div
              key={purchase.id}
              className="border-2 border-black rounded-xl p-4 bg-cyan-100"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="text-xl font-extrabold">
                    {purchase.datasets.title}
                  </h4>
                  <p className="text-sm font-semibold text-black/70 mt-1">
                    {purchase.datasets.description}
                  </p>
                  <div className="flex gap-4 mt-2 text-sm font-bold">
                    <span>💰 ${purchase.amount}</span>
                    <span>
                      📅 {new Date(purchase.purchased_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(purchase.dataset_id)}
                  className="ml-4 bg-[linear-gradient(90deg,#ffea00,#00ffff)] text-black font-extrabold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-black/30" />
          <p className="font-bold text-black/60 mb-4">
            You haven&apos;t purchased any datasets yet
          </p>
          <button
            onClick={() => navigate('/datasets')}
            className="bg-[linear-gradient(90deg,#ffea00,#00ffff)] text-black font-extrabold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition"
          >
            Browse Datasets
          </button>
        </div>
      )}
    </div>
  )
}
