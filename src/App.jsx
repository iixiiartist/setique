import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import SuccessPage from './pages/SuccessPage'
import DashboardPage from './pages/DashboardPage'
import MarketplacePage from './pages/MarketplacePage'
import AdminDashboard from './pages/AdminDashboard'
import UserProfilePage from './pages/UserProfilePage'
import UserDiscoveryPage from './pages/UserDiscoveryPage'
import ActivityFeedPage from './pages/ActivityFeedPage'
import ProfileSettingsPage from './pages/ProfileSettingsPage'
import { AIAssistant } from './components/AIAssistant'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/profile/:username" element={<UserProfilePage />} />
        <Route path="/discover" element={<UserDiscoveryPage />} />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <ProfileSettingsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/feed" 
          element={
            <ProtectedRoute>
              <ActivityFeedPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
      
      {/* AI Assistant - Available on all pages */}
      <AIAssistant />
    </>
  )
}

export default App
