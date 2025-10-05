import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SuccessPage from './pages/SuccessPage'
import DashboardPage from './pages/DashboardPage'
import { AIAssistant } from './components/AIAssistant'
import CurationRequestBoard from './components/CurationRequestBoard'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
      </Routes>
      
      {/* AI Assistant - Available on all pages */}
      <AIAssistant />
    </>
  )
}

// Simple Marketplace Page wrapper
function MarketplacePage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#fde047_0%,#a78bfa_50%,#fb7185_100%)] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with back button */}
        <div className="mb-6 flex items-center justify-between">
          <a
            href="/"
            className="bg-white text-black font-extrabold px-6 py-3 rounded-full border-3 border-black shadow-[4px_4px_0_#000] hover:translate-y-1 hover:shadow-[2px_2px_0_#000] transition"
          >
            \u2190 Back to Home
          </a>
          <a
            href="#"
            className="text-4xl font-extrabold tracking-tighter text-black bg-[linear-gradient(90deg,#ff00c3,#00ffff,#ffea00)] bg-clip-text text-transparent drop-shadow-[2px_2px_0_#000] no-underline"
          >
            SETIQUE
          </a>
        </div>
        
        {/* Marketplace Board */}
        <CurationRequestBoard />
      </div>
    </div>
  )
}

export default App
