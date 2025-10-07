import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SignInModal } from '../components/SignInModal';

/**
 * LoginPage Component
 * 
 * Dedicated login page that displays the sign-in modal.
 * Redirects to dashboard if user is already authenticated.
 */
export default function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Redirect to dashboard if already logged in
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    } else if (!loading && !user) {
      // Show modal after auth check completes
      setShowModal(true);
    }
  }, [user, loading, navigate]);

  const handleClose = () => {
    // When closing modal, go back to home
    navigate('/');
  };

  // Show loading while checking auth state
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

  return (
    <div className="min-h-screen bg-[#F5F5DC]">
      {/* Render the sign-in modal */}
      <SignInModal isOpen={showModal} onClose={handleClose} />
    </div>
  );
}
