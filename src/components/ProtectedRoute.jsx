import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute Component
 * 
 * Wraps routes that require authentication. Prevents rendering of protected
 * pages until auth state is confirmed, then redirects if not authenticated.
 * 
 * Features:
 * - Shows loading state while auth is being checked
 * - Redirects to home (/) if user is not authenticated
 * - Prevents flash of protected content
 * - Uses replace navigation to prevent back button issues
 * 
 * Usage:
 * <Route path="/dashboard" element={
 *   <ProtectedRoute>
 *     <DashboardPage />
 *   </ProtectedRoute>
 * } />
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The protected component to render
 * @returns {React.ReactNode} Loading state, redirect, or protected content
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Show loading state while checking authentication
  // This prevents flash of protected content before redirect
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5DC] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-bold text-black mb-4">⏳</div>
          <div className="text-2xl font-bold text-black">Loading...</div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  // Use replace to prevent back button from returning to protected page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated, render protected content
  return children;
}
