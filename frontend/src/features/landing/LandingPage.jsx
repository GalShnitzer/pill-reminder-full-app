import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { googleSignIn } from '../../services/auth.service';
import { updateProfile } from '../../services/user.service';
import { useAuth } from '../../context/AuthContext';
import { getApiError } from '../../utils/helpers';
import PhoneInput from '../../components/ui/PhoneInput';

/* ── Mock pill data ─────────────────────────────────────────────────── */
const MOCK_PILLS = [
  { name: 'Birth Control', color: '#ec4899', hours: ['08:00'], takenHours: ['08:00'], nextHour: null },
  { name: 'Vitamin D',     color: '#22c55e', hours: ['09:00', '21:00'], takenHours: ['09:00'], nextHour: '21:00' },
  { name: 'Omega-3',       color: '#f97316', hours: ['20:00'], takenHours: [], nextHour: '20:00' },
];

const BAR_DATA = [
  { day: 'M', h: 72 }, { day: 'T', h: 85 }, { day: 'W', h: 60 },
  { day: 'T', h: 90 }, { day: 'F', h: 78 }, { day: 'S', h: 55 }, { day: 'S', h: 88 },
];

const FEATURES = [
  { emoji: '📅', title: 'Flexible schedules',    desc: 'Daily, every N days, specific weekdays, or once a month — whatever fits your routine.', preview: 'schedule' },
  { emoji: '✉️', title: 'Email reminders',       desc: 'Reminders arrive on schedule and keep repeating until you log the dose.',              preview: 'email'    },
  { emoji: '📊', title: 'History & charts',      desc: 'Adherence rate, streaks, and a bar chart comparing scheduled vs. actual times.',        preview: 'chart'    },
  { emoji: '💊', title: 'All your medications',  desc: "Manage every pill in one dashboard with a live timeline of today's doses.",             preview: 'timeline' },
];

const STEPS = [
  { n: 1, icon: '💊', title: 'Add your pills',       desc: 'Name, color, and how often — takes under 30 seconds.' },
  { n: 2, icon: '⏰', title: 'Set reminder times',   desc: 'Pick your dose times and how often to re-send if you forget.' },
  { n: 3, icon: '✉️', title: 'Get notified',         desc: 'Email reminders arrive on schedule and stop once you log the dose.' },
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
        theme: 'filled_black', size: 'large', width, text: 'continue_with', shape: 'rectangular',
      });
    };
    if (window.google) {
      render();
    } else if (!document.querySelector('script[src*="accounts.google.com/gsi"]')) {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true; s.defer = true; s.onload = render;
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

/* ── Mock pill card — muted to signal "not interactive" ──────────────── */
function MockPillCard({ pill }) {
  const allTaken = pill.takenHours.length === pill.hours.length;
  return (
    <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/40 rounded-xl p-3.5 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <span className="font-semibold text-sm text-gray-900 dark:text-slate-100">{pill.name}</span>
        <PillIcon color={pill.color} size={20} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {pill.hours.map((h) => (
          <span key={h} className={`text-xs px-2 py-0.5 rounded-full ${
            pill.takenHours.includes(h)
              ? 'bg-green-500/20 text-green-500 dark:text-green-400'
              : 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-300'
          }`}>
            {pill.takenHours.includes(h) ? '✓ ' : ''}{h}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-xs">
        {allTaken ? (
          <>
            <svg className="w-3.5 h-3.5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-400 font-medium">All doses taken</span>
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-400 dark:text-slate-400">Next: {pill.nextHour}</span>
          </>
        )}
      </div>
      {/* Deliberately muted / ghost buttons so they don't look clickable */}
      <div className="mt-0.5">
        {allTaken
          ? <div className="text-center text-xs py-1.5 px-3 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-300 dark:text-slate-600 cursor-default select-none">Undo</div>
          : <div className="text-center text-xs py-1.5 rounded-lg bg-indigo-500/55 text-white/80 cursor-default select-none">Mark as Taken</div>
        }
      </div>
    </div>
  );
}

/* ── Animated clock SVG (for step 2) ────────────────────────────────── */
function AnimatedClockIcon() {
  // 12 radial tick marks — longer at 12, 3, 6, 9
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const isMain = i % 3 === 0;
    const r1 = isMain ? 11.5 : 13.5;
    const rad = (i * 30 * Math.PI) / 180;
    return {
      x1: 20 + r1 * Math.sin(rad), y1: 20 - r1 * Math.cos(rad),
      x2: 20 + 15.5 * Math.sin(rad), y2: 20 - 15.5 * Math.cos(rad),
      isMain,
    };
  });
  // Hour hand — 10 o'clock (300° from 12)
  const hRad = (300 * Math.PI) / 180;
  const hx = +(20 + 8.5 * Math.sin(hRad)).toFixed(2);   // 12.64
  const hy = +(20 - 8.5 * Math.cos(hRad)).toFixed(2);   // 15.75

  return (
    <svg width="44" height="44" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="face-grad" cx="38%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="100%" stopColor="#e8eaff" stopOpacity="1" />
        </radialGradient>
        <radialGradient id="bezel-grad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#3730a3" />
        </radialGradient>
      </defs>

      {/* Outer bezel with gradient */}
      <circle cx="20" cy="20" r="19" fill="url(#bezel-grad)" />
      {/* Bezel highlight ring */}
      <circle cx="20" cy="20" r="19" fill="none" stroke="#818cf8" strokeWidth="0.5" strokeOpacity="0.5" />

      {/* Light ivory face */}
      <circle cx="20" cy="20" r="16" fill="url(#face-grad)" stroke="#c7d2fe" strokeWidth="0.5" />
      {/* Face subtle inner shadow ring */}
      <circle cx="20" cy="20" r="15.5" fill="none" stroke="#6366f1" strokeWidth="0.3" strokeOpacity="0.25" />
      {/* Face gloss highlight */}
      <ellipse cx="16.5" cy="13" rx="6" ry="4" fill="white" fillOpacity="0.35" />

      {/* Tick marks on light face */}
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke={t.isMain ? '#3730a3' : '#a5b4fc'}
          strokeWidth={t.isMain ? 1.8 : 0.8}
          strokeLinecap="round"
        />
      ))}

      {/* Hour hand (static, deep indigo) */}
      <line x1={+(20 - 2.5 * Math.sin(hRad)).toFixed(2)} y1={+(20 + 2.5 * Math.cos(hRad)).toFixed(2)}
            x2={hx} y2={hy}
            stroke="#312e81" strokeWidth="2.5" strokeLinecap="round" />

      {/* Minute hand (spins, indigo-600) */}
      <g className="clock-hands-group">
        <line x1="20" y1="23" x2="20" y2="6" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round" />
      </g>

      {/* Center jewel */}
      <circle cx="20" cy="20" r="2.5" fill="#6366f1" stroke="white" strokeWidth="0.8" />
      <circle cx="20" cy="20" r="0.9" fill="white" fillOpacity="0.9" />
    </svg>
  );
}

/* ── App preview ─────────────────────────────────────────────────────── */
function AppPreview() {
  return (
    <div className="relative w-full max-w-sm mx-auto lg:mx-0">
      {/* Ambient glow */}
      <div className="absolute -inset-8 bg-gradient-to-br from-indigo-500/20 to-violet-500/10 rounded-[40px] blur-3xl pointer-events-none" />

      {/* Floating animated preview */}
      <div
        className="relative pointer-events-none select-none preview-float"
        style={{
          transformOrigin: 'left center',
          filter: 'drop-shadow(0 28px 44px rgba(0,0,0,0.28))',
        }}
      >
        {/* "PREVIEW" badge — top-right corner of the frame */}
        <div className="absolute -top-3 right-4 z-20 bg-amber-400 text-amber-900 text-[9px] font-black px-2.5 py-1 rounded-full tracking-widest uppercase shadow-lg">
          Preview
        </div>

        <div className="rounded-2xl overflow-hidden border border-white/10 dark:border-slate-700/50">
          {/* Titlebar */}
          <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700/60">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
            <div className="ml-3 flex-1 bg-gray-100 dark:bg-slate-800 rounded-md px-3 py-0.5 text-xs text-gray-400 dark:text-slate-500 text-center">
              pillreminder.app
            </div>
          </div>
          {/* App content */}
          <div className="bg-gray-50 dark:bg-[#0d1117] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between mb-1">
              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-slate-100">My Pills</div>
                <div className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Today, Friday 7 March</div>
              </div>
              <div className="bg-indigo-600/60 text-white/80 text-xs font-semibold px-2.5 py-1.5 rounded-lg cursor-default select-none">
                + Add Pill
              </div>
            </div>
            {MOCK_PILLS.map((p) => <MockPillCard key={p.name} pill={p} />)}
          </div>
        </div>
      </div>

    </div>
  );
}

/* ── Mini bar chart ──────────────────────────────────────────────────── */
const BAR_H = 56;
function MiniBarChart() {
  const max = Math.max(...BAR_DATA.map((d) => d.h));
  return (
    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700/50">
      <div className="flex items-end gap-1.5" style={{ height: BAR_H }}>
        {BAR_DATA.map(({ day, h }, i) => (
          <div key={i} className="flex flex-col items-center justify-end gap-1 flex-1">
            <div
              className="w-full rounded-sm bg-indigo-500 dark:bg-indigo-400"
              style={{ height: Math.round((h / max) * (BAR_H - 14)) }}
            />
            <span className="text-gray-400 dark:text-slate-500 text-[9px] font-medium leading-none">{day}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 shrink-0" />
        <span className="text-xs text-gray-400 dark:text-slate-500">Adherence — last 7 days</span>
        <span className="ml-auto text-xs font-semibold text-green-500">87%</span>
      </div>
    </div>
  );
}

/* ── Email preview ───────────────────────────────────────────────────── */
function MiniEmailPreview() {
  return (
    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700/50">
      <div className="bg-[#f9fafb] rounded-xl p-3 text-xs" style={{ fontFamily: 'sans-serif' }}>
        <div className="bg-white rounded-lg p-4 border border-[#e5e7eb] space-y-2.5">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <span className="text-xl leading-none">💊</span>
            <span className="font-semibold text-[#4f46e5] text-sm">Pill Reminder</span>
          </div>
          <p className="text-[#111827]">Hi <strong>Sarah</strong>,</p>
          <p className="text-[#374151]">
            This is a reminder to take your{' '}
            <strong className="text-[#4f46e5]">Vitamin D</strong>.
          </p>
          <div className="bg-[#f3f4f6] rounded-lg px-3 py-2">
            <p className="text-[#6b7280] text-[10px] uppercase font-semibold tracking-wide">Scheduled times</p>
            <p className="text-[#111827] font-medium mt-0.5">09:00</p>
          </div>
          <span className="inline-block bg-[#4f46e5] text-white px-4 py-1.5 rounded-lg font-semibold text-[11px]">
            Open Pill Reminder →
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Schedule preview ────────────────────────────────────────────────── */
function MiniSchedulePreview() {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const selected = [1, 3, 5];

  function Radio({ active, label, children }) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? 'border-indigo-500' : 'border-gray-300 dark:border-slate-600'}`}>
            {active && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
          </div>
          <span className={`font-medium ${active ? 'text-gray-800 dark:text-slate-200' : 'text-gray-400 dark:text-slate-500'}`}>{label}</span>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700/50 space-y-3">
      <Radio label="Every day" active={false} />
      <Radio label="Specific days of the week" active={true}>
        <div className="flex gap-1.5 pl-5">
          {days.map((d, i) => (
            <div key={i} className={`flex-1 h-6 rounded-md flex items-center justify-center text-xs font-semibold pointer-events-none select-none ${
              selected.includes(i) ? 'bg-indigo-600 text-white' : 'border border-gray-200 dark:border-slate-600 text-gray-400 dark:text-slate-500'
            }`}>
              {d}
            </div>
          ))}
        </div>
      </Radio>
      <Radio label="Every N days" active={false}>
        <div className="flex items-center gap-1.5 pl-5 text-xs text-gray-400 dark:text-slate-500">
          <span>Every</span>
          <span className="px-2 py-0.5 rounded border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 font-medium">3</span>
          <span>days</span>
        </div>
      </Radio>
      <Radio label="Once a month" active={false}>
        <div className="flex items-center gap-1.5 pl-5 text-xs text-gray-400 dark:text-slate-500">
          <span>On the</span>
          <span className="px-2 py-0.5 rounded border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 font-medium">1st</span>
          <span>of each month</span>
        </div>
      </Radio>
    </div>
  );
}

/* ── Timeline preview ────────────────────────────────────────────────── */
function MiniTimelinePreview() {
  const entries = [
    { time: '08:00', name: 'Birth Control', color: '#ec4899', taken: true  },
    { time: '09:00', name: 'Vitamin D',     color: '#22c55e', taken: true  },
    { time: '20:00', name: 'Omega-3',       color: '#f97316', taken: false },
    { time: '21:00', name: 'Vitamin D',     color: '#22c55e', taken: false },
  ];
  return (
    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700/50 space-y-2">
      {entries.map((e, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <span className="text-xs font-mono text-gray-400 dark:text-slate-500 w-10 shrink-0">{e.time}</span>
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
          <span className="text-xs text-gray-700 dark:text-slate-300 flex-1 truncate">{e.name}</span>
          {e.taken
            ? <span className="text-xs text-green-500 font-semibold shrink-0">✓</span>
            : <span className="text-[10px] text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-md font-medium pointer-events-none shrink-0">Take</span>
          }
        </div>
      ))}
    </div>
  );
}

/* ── Feature card ────────────────────────────────────────────────────── */
function FeatureCard({ emoji, title, desc, preview }) {
  return (
    <div className="feature-card relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col overflow-hidden group">
      {/* Hover accent stripe */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="flex gap-4">
        <span className="card-emoji text-2xl mt-0.5 shrink-0">{emoji}</span>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{desc}</p>
        </div>
      </div>
      {preview === 'schedule' && <MiniSchedulePreview />}
      {preview === 'chart'    && <MiniBarChart />}
      {preview === 'email'    && <MiniEmailPreview />}
      {preview === 'timeline' && <MiniTimelinePreview />}
    </div>
  );
}

/* ── Landing page ────────────────────────────────────────────────────── */
export default function LandingPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('main');
  const [pendingUser, setPendingUser] = useState(null);
  const [phone, setPhone] = useState('');
  const heroRef = useRef(null);

  /* Inject distinctive heading font */
  useEffect(() => {
    if (!document.querySelector('#landing-font')) {
      const link = document.createElement('link');
      link.id = 'landing-font';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&display=swap';
      document.head.appendChild(link);
    }
  }, []);

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
      const trimmed = phone.trim();
      if (!skip && trimmed) await updateProfile({ phone: trimmed });
      login({ ...pendingUser, phone: (!skip && trimmed) ? trimmed : pendingUser.phone });
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
    <div className="min-h-screen bg-white dark:bg-[#07090f] overflow-x-clip">

      {/* ── Scoped styles ── */}
      <style>{`
        .lh { font-family: 'Bricolage Grotesque', system-ui, sans-serif; letter-spacing: -0.025em; }
        .grad { background: linear-gradient(130deg, #818cf8 0%, #a78bfa 60%, #c084fc 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .orb { position: absolute; border-radius: 50%; pointer-events: none; filter: blur(80px); }
        @keyframes preview-float {
          0%, 100% { transform: perspective(1100px) rotateY(-5deg) rotateX(1.5deg) translateY(0px); }
          50%       { transform: perspective(1100px) rotateY(-5deg) rotateX(1.5deg) translateY(-6px); }
        }
        @keyframes preview-float-mobile {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-5px); }
        }
        .preview-float { animation: preview-float 5s ease-in-out infinite; }
        @media (max-width: 1023px) {
          .preview-float { animation-name: preview-float-mobile; }
        }
        @keyframes card-rise {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .feature-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .feature-card:hover { transform: translateY(-4px) scale(1.01); box-shadow: 0 16px 40px -8px rgba(99,102,241,0.18); }
        .feature-card:hover .card-emoji { transform: scale(1.2) rotate(-8deg); }
        .card-emoji { transition: transform 0.25s cubic-bezier(.34,1.56,.64,1); display: inline-block; }
        @keyframes step-pill-spin {
          0%    { transform: rotate(0deg) scale(1); }
          20%   { transform: rotate(720deg) scale(1.2); }
          28%   { transform: rotate(700deg) scale(1.05); }
          33%   { transform: rotate(720deg) scale(1); }
          100%  { transform: rotate(720deg) scale(1); }
        }
        @keyframes step-clock-spin {
          0%    { transform: rotate(0deg); }
          25%   { transform: rotate(360deg); }
          100%  { transform: rotate(360deg); }
        }
        @keyframes step-env-fly {
          0%, 100% { transform: translate(0,0) scale(1); opacity: 1; }
          18%      { transform: translate(22px,-18px) scale(0.5); opacity: 0; }
          19%      { transform: translate(-4px,6px) scale(0.85); opacity: 0.3; }
          33%      { transform: translate(0,0) scale(1); opacity: 1; }
        }
        @keyframes cta-pulse {
          0%, 100% { opacity: 0.12; }
          50%       { opacity: 0.26; }
        }
        .step-pill-icon { display: inline-block; animation: step-pill-spin 4.5s ease-out infinite; }
        .clock-hands-group { transform-origin: 20px 20px; animation: step-clock-spin 4.5s ease-out infinite 1.5s; }
        .step-env-icon { display: inline-block; animation: step-env-fly 4.5s ease-out infinite 3s; }
        @keyframes step-card-glow {
          0%, 34%, 100% { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
          10%  { box-shadow: 0 0 0 1.5px rgba(99,102,241,0.4), 0 6px 20px rgba(99,102,241,0.12); }
          33%  { box-shadow: 0 0 0 1px rgba(99,102,241,0.25), 0 3px 10px rgba(99,102,241,0.07); }
        }
        .step-card-1 { animation: step-card-glow 4.5s ease-out infinite; }
        .step-card-2 { animation: step-card-glow 4.5s ease-out infinite 1.5s; }
        .step-card-3 { animation: step-card-glow 4.5s ease-out infinite 3s; }
      `}</style>

      {/* ── Phone step modal ── */}
      {step === 'phone' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/10 flex items-center justify-center mb-5">
              <span className="text-xl">📱</span>
            </div>
            <h2 className="lh text-xl font-bold text-gray-900 dark:text-white mb-1">One last thing</h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
              Add your phone number — optional, always editable in Settings.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                Phone number <span className="text-gray-400 dark:text-slate-500 font-normal">(optional)</span>
              </label>
              <PhoneInput value={phone} onChange={setPhone} disabled={loading} />
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => handlePhoneContinue(false)} disabled={loading} className="btn-primary w-full">
                {loading ? 'Saving…' : 'Get started →'}
              </button>
              <button onClick={() => handlePhoneContinue(true)} disabled={loading} className="text-sm text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors py-1.5">
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#07090f]/90 backdrop-blur-md border-b border-gray-100 dark:border-slate-800/50">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/25">
              <span className="text-sm">💊</span>
            </div>
            <span className="lh font-bold text-gray-900 dark:text-white text-lg">PillReminder</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-xs text-gray-400 dark:text-slate-500 font-medium">Sign in with Google</span>
            <button
              onClick={handleGetStarted}
              className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold py-2 px-5 rounded-xl transition-colors shadow-md shadow-indigo-600/20"
            >
              Get started
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative overflow-hidden">
        {/* Background orbs */}
        <div className="orb w-[700px] h-[500px] top-[-100px] left-[-100px] bg-indigo-600/10 dark:bg-indigo-600/[0.07]" />
        <div className="orb w-[400px] h-[400px] bottom-0 right-0 bg-violet-600/8 dark:bg-violet-600/[0.06]" />

        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-10 pb-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">

            {/* Left: copy */}
            <div className="flex flex-col items-start lg:pt-4">
              <h1 className="lh text-5xl sm:text-6xl font-extrabold text-gray-900 dark:text-white leading-[1.06] mb-4">
                Never miss<br />
                <span className="grad">a dose</span><br />
                again.
              </h1>

              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed mb-5 max-w-md">
                Track all your medications, receive automatic email reminders, and build healthy habits — with adherence charts and full history.
              </p>

              <GoogleSignInButton loading={loading} onCredential={handleCredential} width={280} />

              {/* Trust signals */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4">
                {['🔒 Encrypted', '⚡ 2-min setup', '🌍 Works anywhere'].map((t) => (
                  <span key={t} className="text-xs text-gray-400 dark:text-slate-500">{t}</span>
                ))}
              </div>
            </div>

            {/* Right: tilted app preview */}
            <AppPreview />
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div className="border-y border-gray-100 dark:border-slate-800/50 bg-gray-50/70 dark:bg-slate-900/30 py-8">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { stat: '5',       label: 'schedule types'       },
            { stat: '∞',       label: 'medications tracked'  },
            { stat: 'Google',  label: 'sign-in, no password' },
            { stat: '100%',    label: 'private & encrypted'  },
          ].map(({ stat, label }) => (
            <div key={stat} className="text-center">
              <div className="lh text-xl font-extrabold text-gray-900 dark:text-white">{stat}</div>
              <div className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-24">
        <div className="text-center mb-14">
          <p className="text-xs font-bold tracking-widest text-indigo-500 uppercase mb-3">Features</p>
          <h2 className="lh text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
            Built around your routine
          </h2>
          <p className="text-gray-500 dark:text-slate-400 max-w-sm mx-auto text-sm">
            Simple to set up, powerful enough to track every dose.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map((f) => <FeatureCard key={f.title} {...f} />)}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-gray-50 dark:bg-slate-900/40 border-y border-gray-100 dark:border-slate-800/50 py-24">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest text-indigo-500 uppercase mb-3">How it works</p>
            <h2 className="lh text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
              Up and running in minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
            {/* Connecting dashes (desktop) */}
            <div className="hidden md:block absolute top-[2.125rem] left-[calc(33.333%-1px)] right-[calc(33.333%-1px)] h-px"
              style={{ background: 'repeating-linear-gradient(90deg, #6366f140 0, #6366f140 6px, transparent 6px, transparent 14px)' }}
            />

            {STEPS.map(({ n, icon, title, desc }) => (
              <div key={n} className={`relative flex flex-col items-center text-center p-7 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm step-card-${n}`}>
                {/* Step number badge */}
                <div className="absolute top-5 right-5 w-5 h-5 rounded-full bg-indigo-600/15 dark:bg-indigo-600/20 flex items-center justify-center">
                  <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400">{n}</span>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/8 dark:bg-indigo-600/12 flex items-center justify-center mb-5">
                  {n === 1 && <span className="text-3xl step-pill-icon">{icon}</span>}
                  {n === 2 && <AnimatedClockIcon />}
                  {n === 3 && <span className="text-3xl step-env-icon">{icon}</span>}
                </div>
                <h3 className="lh font-bold text-gray-900 dark:text-slate-100 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 py-24">
        <div
          className="relative overflow-hidden rounded-3xl px-8 py-20 text-center"
          style={{ background: 'linear-gradient(135deg, #3730a3 0%, #4f46e5 45%, #7c3aed 100%)' }}
        >
          {/* Animated center glow */}
          <div
            className="absolute inset-0 rounded-3xl"
            style={{
              background: 'radial-gradient(ellipse 75% 65% at 50% 50%, rgba(167,139,250,0.35) 0%, transparent 70%)',
              animation: 'cta-pulse 4s ease-in-out infinite',
            }}
          />
          {/* Dot grid texture */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }}
          />
          {/* Orbs */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-300/10 rounded-full blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm mb-5 text-3xl">
              💊
            </div>
            <h2 className="lh text-3xl sm:text-5xl font-extrabold text-white mb-4">
              Start tracking today
            </h2>
            <p className="text-indigo-200 text-base mb-10 max-w-md mx-auto">
              Sign in with Google and add your first pill in under a minute.
            </p>
            <div className="flex justify-center">
              <GoogleSignInButton loading={loading} onCredential={handleCredential} width={280} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 dark:border-slate-800/50 py-8">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <span className="text-[11px]">💊</span>
            </div>
            <span className="lh text-sm font-bold text-gray-600 dark:text-slate-400">PillReminder</span>
          </div>
          <p className="text-xs text-gray-400 dark:text-slate-600">
            Track your medications. Build healthy habits.
          </p>
        </div>
      </footer>
    </div>
  );
}
