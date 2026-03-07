import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { googleSignIn } from '../../services/auth.service';
import { updateProfile } from '../../services/user.service';
import { useAuth } from '../../context/AuthContext';
import { getApiError } from '../../utils/helpers';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('main'); // 'main' | 'phone'
  const [pendingUser, setPendingUser] = useState(null);

  // Called immediately when Google credential is received.
  // Signs in or creates account. Phone step is only shown for brand-new users.
  const handleCredential = async (idToken) => {
    setLoading(true);
    try {
      const { user, isNewUser } = await googleSignIn(idToken);
      if (isNewUser) {
        setPendingUser(user);
        setStep('phone');
      } else {
        login(user);
        toast.success(`Welcome back, ${user.name}!`);
        navigate('/');
      }
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // Called when new user submits or skips the phone step
  const handlePhoneContinue = async (skip = false) => {
    setLoading(true);
    try {
      if (!skip && phone.trim()) {
        await updateProfile({ phone: phone.trim() });
      }
      login(pendingUser);
      toast.success(`Welcome, ${pendingUser.name}!`);
      navigate('/');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-950 flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-700/10 via-transparent to-gray-100 dark:from-primary-700/20 dark:to-slate-950 pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-600/20 border border-primary-500/30 mb-4">
            <span className="text-4xl">💊</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">PillReminder</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-2">Never miss a dose again</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          {step === 'main' && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Sign in</h2>
              <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
                Use your Google account to get started. No password needed.
              </p>

              <GoogleSignInButton loading={loading} onCredential={handleCredential} />

              <p className="text-center text-xs text-gray-400 dark:text-slate-500 mt-6">
                By signing in you agree to use this service responsibly.
              </p>
            </>
          )}

          {step === 'phone' && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">One last thing</h2>
              <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
                Optionally add your phone number. You can always update this later in Settings.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Phone number <span className="text-gray-400 dark:text-slate-500">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+972 50 000 0000"
                  className="input-field"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handlePhoneContinue(false)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handlePhoneContinue(false)}
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? 'Saving…' : 'Get started →'}
                </button>
                <button
                  onClick={() => handlePhoneContinue(true)}
                  disabled={loading}
                  className="text-sm text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors py-1.5"
                >
                  Skip for now
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Renders the Google Identity Services button
function GoogleSignInButton({ onCredential, loading }) {
  const divRef = (node) => {
    if (!node || loading) return;
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: (response) => {
          onCredential(response.credential);
        },
      });
      window.google.accounts.id.renderButton(node, {
        theme: 'filled_black',
        size: 'large',
        width: node.offsetWidth || 320,
        text: 'continue_with',
        shape: 'rectangular',
      });
    }
  };

  if (typeof window !== 'undefined' && !window.google) {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  return (
    <div className="w-full flex justify-center">
      <div ref={divRef} className="w-full" style={{ minHeight: 44 }} />
    </div>
  );
}
