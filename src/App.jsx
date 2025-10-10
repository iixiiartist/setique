import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import SuccessPage from './pages/SuccessPage'
import DashboardPage from './pages/DashboardPage'
import MarketplacePage from './pages/MarketplacePage'
import AdminDashboard from './pages/AdminDashboard'
import UserProfilePage from './pages/UserProfilePage'
import UserDiscoveryPage from './pages/UserDiscoveryPage'
import ActivityFeedPage from './pages/ActivityFeedPage'
import ProfileSettingsPage from './pages/ProfileSettingsPage'
import ModerationQueuePage from './pages/ModerationQueuePage'
import ProtectedRoute from './components/ProtectedRoute'
import BetaProtectedRoute from './components/BetaProtectedRoute'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <BetaProtectedRoute>
                <DashboardPage />
              </BetaProtectedRoute>
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
              <BetaProtectedRoute>
                <ProfileSettingsPage />
              </BetaProtectedRoute>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/moderation" 
          element={
            <ProtectedRoute>
              <BetaProtectedRoute>
                <ModerationQueuePage />
              </BetaProtectedRoute>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/feed" 
          element={
            <ProtectedRoute>
              <BetaProtectedRoute>
                <ActivityFeedPage />
              </BetaProtectedRoute>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </>
  )
}

export default App
