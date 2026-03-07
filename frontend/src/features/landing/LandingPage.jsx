import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { googleSignIn } from '../../services/auth.service';
import { updateProfile } from '../../services/user.service';
import { useAuth } from '../../context/AuthContext';
import { getApiError } from '../../utils/helpers';
import PhoneInput from '../../components/ui/PhoneInput';

/* ── Mock pill data ─────────────────────────────────────────────────── */
const MOCK_PILLS = [
  {
    name: 'Birth Control',
    color: '#ec4899',
    hours: ['08:00'],
    takenHours: ['08:00'],
    nextHour: null,
  },
  {
    name: 'Vitamin D',
    color: '#22c55e',
    hours: ['09:00', '21:00'],
    takenHours: ['09:00'],
    nextHour: '21:00',
  },
  {
    name: 'Omega-3',
    color: '#f97316',
    hours: ['20:00'],
    takenHours: [],
    nextHour: '20:00',
  },
];

/* ── Mini bar chart (adherence preview) ─────────────────────────────── */
const BAR_DATA = [
  { day: 'M', h: 72 }, { day: 'T', h: 85 }, { day: 'W', h: 60 },
  { day: 'T', h: 90 }, { day: 'F', h: 78 }, { day: 'S', h: 55 }, { day: 'S', h: 88 },
];
// 14-day heatmap — 1 = taken, 0 = missed
const HEATMAP = [1,1,1,0,1,1,1,1,1,0,1,1,1,1];

/* ── Features ───────────────────────────────────────────────────────── */
const FEATURES = [
  {
    emoji: '📅',
    title: 'Flexible schedules',
    desc: 'Daily, every N days, specific weekdays, or once a month — whatever fits your routine.',
    preview: null,
  },
  {
    emoji: '✉️',
    title: 'Email reminders',
    desc: 'Reminders arrive on schedule and keep repeating until you log the dose.',
    preview: 'email',
  },
  {
    emoji: '📊',
    title: 'History & charts',
    desc: 'Adherence rate, streaks, and a bar chart comparing scheduled vs. actual times.',
    preview: 'chart',
  },
  {
    emoji: '💊',
    title: 'All your medications',
    desc: 'Manage every pill in one dashboard with a live timeline of today\'s doses.',
    preview: null,
  },
];

const STEPS = [
  { n: 1, title: 'Add your pills', desc: 'Name, color, and how often — takes under 30 seconds.' },
  { n: 2, title: 'Set reminder times', desc: 'Pick the times you want reminders and how often to repeat them.' },
  { n: 3, title: 'Get notified', desc: 'Email reminders arrive on schedule and stop once you log the dose.' },
];

/* ── Google sign-in button ───────────────────────────────────────────── */
function GoogleSignInButton({ onCredential, loading, width = 300 }) {
  const initialized = useRef(false);

  const divRef = (node) => {
    if (!node || loading) return;

    const render = () => {
      if (!window.google) return;
      if (!initialized.current) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: (res) => onCredential(res.credential),
        });
        initialized.current = true;
      }
      window.google.accounts.id.renderButton(node, {
        theme: 'filled_black',
        size: 'large',
        width,
        text: 'continue_with',
        shape: 'rectangular',
      });
    };

    if (window.google) {
      render();
    } else if (!document.querySelector('script[src*="accounts.google.com/gsi"]')) {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.defer = true;
      s.onload = render;
      document.head.appendChild(s);
    } else {
      const id = setInterval(() => { if (window.google) { clearInterval(id); render(); } }, 100);
    }
  };

  return <div ref={divRef} style={{ minHeight: 44 }} />;
}

/* ── Pill capsule SVG ────────────────────────────────────────────────── */
function PillIcon({ color = '#6366f1', size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <g transform="rotate(-35, 14, 14)">
        <rect x="9" y="4" width="10" height="20" rx="5" fill={color} />
        <path d="M9 14 H19 V19 A5 5 0 1 1 9 19 Z" fill="white" fillOpacity="0.22" />
        <line x1="9" y1="14" x2="19" y2="14" stroke="white" strokeWidth="1.5" strokeOpacity="0.45" />
      </g>
    </svg>
  );
}

/* ── Static mock pill card ───────────────────────────────────────────── */
function MockPillCard({ pill }) {
  const allTaken = pill.takenHours.length === pill.hours.length;
  return (
    <div className="bg-white dark:bg-slate-900/80 border border-gray-200 dark:border-slate-700/60 rounded-xl p-4 flex flex-col gap-3 select-none">
      <div className="flex items-start justify-between gap-2">
        <span className="font-semibold text-sm text-gray-900 dark:text-slate-100">{pill.name}</span>
        <PillIcon color={pill.color} size={22} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {pill.hours.map((h) => (
          <span
            key={h}
            className={`text-xs px-2 py-0.5 rounded-full ${
              pill.takenHours.includes(h)
                ? 'bg-green-500/20 text-green-500 dark:text-green-400'
                : 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-300'
            }`}
          >
            {pill.takenHours.includes(h) ? '✓ ' : ''}{h}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-xs">
        {allTaken ? (
          <>
            <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-400 font-medium">All doses taken</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-400 dark:text-slate-400">Next: {pill.nextHour}</span>
          </>
        )}
      </div>
      <div className="mt-auto">
        {allTaken
          ? <button className="btn-secondary text-xs py-1.5 px-3 pointer-events-none" tabIndex={-1}>Undo</button>
          : <button className="btn-primary w-full text-xs py-1.5 pointer-events-none" tabIndex={-1}>Mark as Taken</button>
        }
      </div>
    </div>
  );
}

/* ── App preview (browser frame) ────────────────────────────────────── */
function AppPreview() {
  return (
    <div className="relative w-full max-w-sm mx-auto lg:mx-0">
      <div className="absolute -inset-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 rounded-3xl blur-2xl pointer-events-none" />
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200/80 dark:border-slate-700/60">
        {/* Title bar */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700/60">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <div className="ml-3 flex-1 bg-gray-100 dark:bg-slate-800 rounded-md px-3 py-0.5 text-xs text-gray-400 dark:text-slate-500 text-center">
            pillreminder.app
          </div>
        </div>
        {/* Content */}
        <div className="bg-gray-100 dark:bg-slate-950 p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="text-sm font-bold text-gray-900 dark:text-slate-100">My Pills</div>
              <div className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Today, Friday 7 March</div>
            </div>
            <div className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">+ Add Pill</div>
          </div>
          {MOCK_PILLS.map((p) => (
            <MockPillCard key={p.name} pill={p} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Mini bar chart preview ──────────────────────────────────────────── */
function MiniBarChart() {
  return (
    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700/50">
      <div className="flex items-end gap-1 h-14">
        {BAR_DATA.map(({ day, h }, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div
              className="w-full rounded-t-sm bg-indigo-500/70 dark:bg-indigo-400/60 transition-all"
              style={{ height: `${h}%` }}
            />
            <span className="text-gray-400 dark:text-slate-500 text-[9px] font-medium">{day}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500/70 shrink-0" />
        <span className="text-xs text-gray-400 dark:text-slate-500">Adherence — last 7 days</span>
        <span className="ml-auto text-xs font-semibold text-green-500">87%</span>
      </div>
    </div>
  );
}

/* ── Mini heatmap preview ────────────────────────────────────────────── */
function MiniEmailPreview() {
  return (
    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700/50">
      <div className="bg-gray-50 dark:bg-slate-800/60 rounded-xl p-3 border border-gray-200 dark:border-slate-700/40 text-xs space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 dark:text-slate-500 w-8 shrink-0">From</span>
          <span className="text-gray-600 dark:text-slate-300 font-medium">Pill Reminder</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 dark:text-slate-500 w-8 shrink-0">Subj</span>
          <span className="text-gray-700 dark:text-slate-200">⏰ Reminder: Take your Vitamin D</span>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-700/40 text-gray-500 dark:text-slate-400 leading-relaxed">
          Hi Sarah, this is a reminder to take your <span className="font-semibold text-gray-700 dark:text-slate-200">Vitamin D</span> scheduled at 09:00.
        </div>
      </div>
    </div>
  );
}

/* ── Feature card ────────────────────────────────────────────────────── */
function FeatureCard({ emoji, title, desc, preview }) {
  return (
    <div className="glass-card p-6 flex flex-col">
      <div className="flex gap-4">
        <span className="text-2xl mt-0.5 shrink-0">{emoji}</span>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{desc}</p>
        </div>
      </div>
      {preview === 'chart' && <MiniBarChart />}
      {preview === 'email' && <MiniEmailPreview />}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────── */
export default function LandingPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('main');
  const [pendingUser, setPendingUser] = useState(null);
  const [phone, setPhone] = useState('');
  const heroRef = useRef(null);

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
      if (!skip && phone.trim()) await updateProfile({ phone: phone.trim() });
      login(pendingUser);
      toast.success(`Welcome, ${pendingUser.name}!`);
      navigate('/');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      heroRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-950">

      {/* Phone step modal */}
      {step === 'phone' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">One last thing</h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
              Add your phone number (optional). You can always update this in Settings.
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

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-gray-200/80 dark:border-slate-800/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">💊</span>
            <span className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">PillReminder</span>
          </div>
          <button onClick={handleGetStarted} className="btn-primary text-sm py-1.5 px-4">
            Get started
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-purple-600/5 dark:from-indigo-600/15 dark:to-purple-600/5 pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left: copy */}
            <div className="flex flex-col items-start">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Free
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-4">
                Never miss<br />a dose again
              </h1>
              <p className="text-base text-gray-500 dark:text-slate-400 leading-relaxed mb-8 max-w-md">
                Track all your medications, get automatic email reminders, and build healthy habits with adherence charts and history.
              </p>

              <GoogleSignInButton loading={loading} onCredential={handleCredential} width={280} />

              <p className="mt-3 text-xs text-gray-400 dark:text-slate-500">
                Sign in with Google — no password needed.
              </p>
            </div>

            {/* Right: app preview */}
            <AppPreview />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Built around your routine</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">Simple to set up, powerful enough to track every dose.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => <FeatureCard key={f.title} {...f} />)}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-white dark:bg-slate-900/50 border-y border-gray-200 dark:border-slate-800/60 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Up and running in minutes</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">No setup required beyond signing in.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center mb-4 shrink-0">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">{n}</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-2 text-sm">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
        <div className="bg-gradient-to-br from-indigo-600/10 to-purple-600/5 dark:from-indigo-600/15 dark:to-purple-600/5 border border-indigo-500/20 rounded-2xl px-8 py-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ready to start?</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-8">
            Free forever. Sign in and add your first pill in under a minute.
          </p>
          <div className="flex justify-center">
            <GoogleSignInButton loading={loading} onCredential={handleCredential} width={280} />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 dark:border-slate-800/60 py-6 text-center text-xs text-gray-400 dark:text-slate-500">
        PillReminder — track your medications, build healthy habits.
      </footer>
    </div>
  );
}
