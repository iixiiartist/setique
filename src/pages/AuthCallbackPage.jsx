import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * AuthCallbackPage
 * 
 * Handles email confirmation and other auth callbacks from Supabase.
 * After confirming email, redirects user to home where they'll see the beta gate.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Confirming your email...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the token hash from URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const tokenHash = hashParams.get('token_hash');
        const type = hashParams.get('type');

        if (!tokenHash) {
          setStatus('error');
          setMessage('Invalid confirmation link. Please try signing up again.');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // Exchange the token hash for a session
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type || 'email'
        });

        if (error) {
          console.error('Email confirmation error:', error);
          setStatus('error');
          setMessage('Failed to confirm email. The link may have expired.');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // Success!
        setStatus('success');
        setMessage('Email confirmed! Redirecting...');
        
        // Redirect to home where BetaAccessGate will show
        setTimeout(() => navigate('/'), 2000);

      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage('Something went wrong. Please try again.');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#F5F5DC] flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black rounded-3xl shadow-[12px_12px_0_#000] p-8 max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <div className="text-6xl mb-4">⏳</div>
            <h1 className="text-3xl font-bold mb-4">Confirming Email</h1>
            <p className="text-gray-700">{message}</p>
            <div className="mt-4">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            </div>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold mb-4">Email Confirmed!</h1>
            <p className="text-gray-700">{message}</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-3xl font-bold mb-4">Confirmation Failed</h1>
            <p className="text-gray-700 mb-4">{message}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-bold border-2 border-black rounded-full px-6 py-3 hover:opacity-90 active:scale-95"
            >
              Go to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}
