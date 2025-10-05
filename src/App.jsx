import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SuccessPage from './pages/SuccessPage'
import DashboardPage from './pages/DashboardPage'
import { AIAssistant } from './components/AIAssistant'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
      
      {/* AI Assistant - Available on all pages */}
      <AIAssistant />
    </>
  )
}

export default App
