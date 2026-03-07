import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { googleSignIn } from '../../services/auth.service';
import { updateProfile } from '../../services/user.service';
import { useAuth } from '../../context/AuthContext';
import { getApiError } from '../../utils/helpers';
import PhoneInput from '../../components/ui/PhoneInput';

const FEATURES = [
  { emoji: '📅', title: 'Flexible schedules', desc: 'Daily, weekly, monthly, or every N days — whatever fits your routine.' },
  { emoji: '✉️', title: 'Email reminders', desc: 'Automatic reminders sent straight to your inbox until you mark a dose taken.' },
  { emoji: '📊', title: 'History & charts', desc: 'Track your adherence rate, streaks, and timing with per-pill charts.' },
  { emoji: '💊', title: 'Multiple pills', desc: 'Manage all your medications in one clean dashboard.' },
  { emoji: '🌙', title: 'Dark mode', desc: 'Full dark mode support — easy on the eyes, day or night.' },
  { emoji: '🔒', title: 'Private & secure', desc: 'Google sign-in only. Your API keys are encrypted at rest.' },
];

const STEPS = [
  { n: 1, title: 'Add your pills', desc: 'Enter the name, color, and how often you need to take each medication.' },
  { n: 2, title: 'Set reminder times', desc: 'Choose the times you want to be reminded and your preferred email window.' },
  { n: 3, title: 'Get notified', desc: 'Receive email reminders that repeat until you mark the dose as taken.' },
];

export default function LandingPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('main'); // 'main' | 'phone'
  const [pendingUser, setPendingUser] = useState(null);
  const [phone, setPhone] = useState('');

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
    <div className="min-h-screen bg-gray-100 dark:bg-slate-950">

      {/* Phone step modal overlay */}
      {step === 'phone' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="glass-card p-8 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">One last thing</h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
              Add your phone number (optional). You can always update this later in Settings.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                Phone number <span className="text-gray-400 dark:text-slate-500">(optional)</span>
              </label>
              <PhoneInput value={phone} onChange={setPhone} disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => handlePhoneContinue(false)} disabled={loading} className="btn-primary w-full">
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
          </div>
        </div>
      )}

      {/* Navbar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-gray-200/80 dark:border-slate-800/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">💊</span>
            <span className="font-bold text-gray-900 dark:text-white text-lg">PillReminder</span>
          </div>
          <div className="scale-90 origin-right">
            <GoogleSignInButton loading={loading} onCredential={handleCredential} compact />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700/10 via-transparent to-gray-100 dark:from-primary-700/20 dark:to-slate-950 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-600/20 border border-primary-500/30 mb-6">
            <span className="text-4xl">💊</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-4">
            Never miss a dose again
          </h1>
          <p className="text-lg text-gray-500 dark:text-slate-400 mb-10 max-w-xl mx-auto">
            Track your pills, get email reminders, and build healthy habits — completely free.
          </p>
          <div className="flex justify-center">
            <GoogleSignInButton loading={loading} onCredential={handleCredential} />
          </div>
          <p className="mt-4 text-xs text-gray-400 dark:text-slate-500">
            No password needed. Sign in with your Google account.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white mb-2">Everything you need</h2>
        <p className="text-center text-sm text-gray-500 dark:text-slate-400 mb-10">Simple, focused, and built around your medication routine.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ emoji, title, desc }) => (
            <div key={title} className="glass-card p-6">
              <span className="text-3xl mb-3 block">{emoji}</span>
              <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white dark:bg-slate-900/40 border-y border-gray-200 dark:border-slate-800/60 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white mb-2">How it works</h2>
          <p className="text-center text-sm text-gray-500 dark:text-slate-400 mb-12">Up and running in under two minutes.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary-600/20 border border-primary-500/30 flex items-center justify-center mb-4">
                  <span className="text-primary-600 dark:text-primary-400 font-bold text-lg">{n}</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="bg-primary-600/10 dark:bg-primary-600/10 border border-primary-500/20 rounded-2xl px-8 py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ready to start?</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-8">
            Join and never miss a dose again.
          </p>
          <div className="flex justify-center">
            <GoogleSignInButton loading={loading} onCredential={handleCredential} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-slate-800/60 py-6 text-center text-xs text-gray-400 dark:text-slate-500">
        PillReminder — built to help you stay on track.
      </footer>
    </div>
  );
}

// Renders the Google Identity Services button
function GoogleSignInButton({ onCredential, loading, compact = false }) {
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
        width: compact ? 160 : 300,
        text: compact ? 'signin' : 'continue_with',
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
    <div className="flex justify-center">
      <div ref={divRef} style={{ minHeight: 44 }} />
    </div>
  );
}
