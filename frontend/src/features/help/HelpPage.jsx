import { useState, useEffect } from 'react';

const NAV = [
  { id: 'overview',  label: 'Overview',    emoji: '💊' },
  { id: 'adding',    label: 'Adding Pills', emoji: '➕' },
  { id: 'dashboard', label: 'Dashboard',   emoji: '🏠' },
  { id: 'color',     label: 'Colors',      emoji: '🎨' },
  { id: 'history',   label: 'History',     emoji: '📊' },
  { id: 'email',     label: 'Reminders',   emoji: '✉️' },
  { id: 'edit',      label: 'Edit & Delete', emoji: '✏️' },
  { id: 'darkmode',  label: 'Dark Mode',   emoji: '🌙' },
];

export default function HelpPage() {
  const [active, setActive] = useState('overview');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: '-15% 0px -75% 0px', threshold: 0 }
    );
    NAV.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="max-w-3xl mx-auto pb-16">

      {/* ── Hero ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl mb-8 px-8 py-10
                      bg-gradient-to-br from-indigo-600 via-primary-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
        {/* decorative blobs */}
        <div className="pointer-events-none select-none">
          <span className="absolute -right-4 -top-4 text-[9rem] opacity-10">💊</span>
          <span className="absolute right-20 bottom-0 text-[5rem] opacity-[0.07]">🔔</span>
          <span className="absolute right-44 top-6 text-[3rem] opacity-[0.08]">✓</span>
        </div>
        <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest mb-2">Documentation</p>
        <h1 className="text-3xl font-bold leading-tight mb-2">How to use<br/>PillReminder</h1>
        <p className="text-indigo-100/80 text-sm max-w-xs">
          Everything you need to know to stay on schedule and never miss a dose.
        </p>
      </div>

      {/* ── Sticky nav ────────────────────────────────────── */}
      <nav className="sticky top-14 z-30 -mx-4 sm:-mx-0 px-4 sm:px-0 py-2.5
                      bg-gray-100/80 dark:bg-slate-950/80 backdrop-blur-md mb-8
                      border-b border-gray-200/60 dark:border-slate-800/60">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          {NAV.map(({ id, label, emoji }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium
                         transition-all duration-200 border
                         ${active === id
                           ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-400/30 scale-[1.03]'
                           : 'bg-white dark:bg-slate-800/80 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700/50 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-600/40'
                         }`}
            >
              <span aria-hidden="true">{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ── Sections ──────────────────────────────────────── */}
      <div className="space-y-6">

        <HelpSection id="overview" accent="indigo" icon="💊" title="What is PillReminder?">
          <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
            PillReminder helps you track your daily medications. Add your pills, set reminder times,
            and mark them as taken each day. The app sends you email reminders so you never miss a dose.
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard icon="💊" label="Track pills" desc="Any schedule — daily, weekly, monthly" />
            <StatCard icon="✉️" label="Email alerts" desc="Smart reminders that stop when you take it" />
            <StatCard icon="🔥" label="Streaks" desc="Build habits with schedule-aware streaks" />
          </div>
        </HelpSection>

        <HelpSection id="adding" accent="violet" icon="➕" title="Adding a pill">
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-5">
            Click <Chip>+ Add Pill</Chip> on the dashboard to open the form.
          </p>
          <Timeline>
            <TimelineStep n={1} title="Pill name">
              Enter the medication name (e.g. "Vitamin D").
            </TimelineStep>
            <TimelineStep n={2} title="Pill color">
              Pick a color from the palette — it shows on the card as a capsule icon.
              You can change it any time by clicking the capsule icon on the card.
            </TimelineStep>
            <TimelineStep n={3} title="How often">
              <p className="mb-2">Choose your schedule:</p>
              <ScheduleGrid>
                <ScheduleItem label="Every day" desc="Taken daily (default)" />
                <ScheduleItem label="Every N days" desc="E.g. every 2 days from when you add it" />
                <ScheduleItem label="Days of the week" desc="Toggle any combination of Sun–Sat" />
                <ScheduleItem label="Once a month" desc="Choose the day of month (1–31)" />
              </ScheduleGrid>
            </TimelineStep>
            <TimelineStep n={4} title="Reminder times">
              Add one or more times per scheduled day (up to 5).
              Each time is tracked as a separate dose — you can mark and unmark them individually.
            </TimelineStep>
            <TimelineStep n={5} title="Reminder window" isLast>
              <ul className="space-y-1 text-gray-500 dark:text-slate-400">
                <li><Chip small>Start sending at</Chip> — earliest time reminders will be sent.</li>
                <li><Chip small>Re-send every X minutes</Chip> — how often to repeat (minimum 15 min).</li>
                <li><Chip small>Stop sending at</Chip> — cut-off time for reminders that day.</li>
              </ul>
            </TimelineStep>
          </Timeline>
        </HelpSection>

        <HelpSection id="dashboard" accent="emerald" icon="🏠" title="The dashboard">
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-5">
            Your dashboard has two sections:
          </p>
          <div className="space-y-3 mb-5">
            <FeatureCard
              icon="🗓️"
              label="Today's Schedule"
              accent="bg-indigo-500/10 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20"
            >
              A chronological timeline of every dose for today. Past untaken doses are highlighted
              in red. Tap <Chip>Take</Chip> to log a dose or <Chip>Undo</Chip> to reverse it.
              Each dose button becomes active 30 minutes before its scheduled time.
            </FeatureCard>
            <FeatureCard
              icon="💊"
              label="Your Pills"
              accent="bg-violet-500/10 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20"
            >
              A grid of all active pills. Each card shows the name, color, and dose time badges
              (green = taken). The card button targets the <strong className="text-gray-800 dark:text-slate-200">next upcoming dose</strong> —
              once marked, it advances to the next one automatically.
            </FeatureCard>
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">Each pill card also shows:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <MiniFeature label="Dose time badges" icon="🟢">
              Green when taken, indigo when pending.
            </MiniFeature>
            <MiniFeature label="Current dose" icon="⏱️">
              "Next: HH:MM" or "Taken at X" for the active dose.
            </MiniFeature>
            <MiniFeature label="🔥 Streak badge" icon="🔥">
              Shows consecutive scheduled days taken. Appears at 2+ day streaks.
              Non-scheduled days never count against you.
            </MiniFeature>
            <MiniFeature label="Mark as Taken / Undo" icon="✓">
              Marks or unmarks the current dose. Use the timeline for multi-dose pills.
            </MiniFeature>
          </div>
        </HelpSection>

        <HelpSection id="color" accent="pink" icon="🎨" title="Changing a pill's color">
          <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
            Click the <Chip>capsule icon</Chip> in the top-right corner of any pill card.
            A color palette will appear — pick any of the 8 colors to instantly update it.
            The change is saved to the server immediately.
          </p>
        </HelpSection>

        <HelpSection id="history" accent="blue" icon="📊" title="Pill history & charts">
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-5">
            Click <Chip>Details →</Chip> on any card to open the detail view. It shows:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
            <MiniFeature label="Adherence rate" icon="📈">
              % of <strong className="text-gray-800 dark:text-slate-200">scheduled</strong> days
              taken (last 30 days). Non-scheduled days are excluded from the count.
            </MiniFeature>
            <MiniFeature label="Streak" icon="🔥">
              Consecutive scheduled days with <em>all</em> doses taken.
              Off-days (weekly/monthly) are skipped and never break the streak.
            </MiniFeature>
            <MiniFeature label="Bar chart" icon="📊">
              Compares actual take time vs. scheduled time, day by day.
            </MiniFeature>
            <MiniFeature label="Heatmap calendar" icon="🗓️">
              30-day grid. <span className="inline-block w-2.5 h-2.5 rounded-sm bg-indigo-500 align-middle mr-0.5" /> taken &nbsp;
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-400/70 align-middle mr-0.5" /> missed &nbsp;
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-gray-300 dark:bg-slate-600 align-middle mr-0.5" /> not scheduled
            </MiniFeature>
          </div>
          <Note>
            Days before you added a pill are never shown as "missed" — history starts from the creation date.
          </Note>
        </HelpSection>

        <HelpSection id="email" accent="amber" icon="✉️" title="Setting up email reminders">
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-5">
            Email reminders require a free <strong className="text-gray-800 dark:text-slate-200">Resend</strong> API
            key. Each user provides their own key so emails come from your own account.
          </p>
          <Timeline>
            <TimelineStep n={1} title="Go to Settings">
              Click your name in the top-right → Settings, or use the sidebar.
            </TimelineStep>
            <TimelineStep n={2} title="Follow the guide">
              In Settings, click <Chip>How to get a Resend API key</Chip> for a step-by-step walkthrough.
            </TimelineStep>
            <TimelineStep n={3} title="Paste your key" isLast>
              Enter the API key and click Save. The key is encrypted before being stored.
            </TimelineStep>
          </Timeline>
          <Note className="mt-5">
            Reminders are sent based on each pill's reminder times, email settings, and schedule.
            Each dose is tracked independently — reminders stop once you mark a dose taken.
            Non-daily pills (weekly, monthly, every N days) only send reminders on scheduled days.
          </Note>
        </HelpSection>

        <HelpSection id="edit" accent="red" icon="✏️" title="Editing or deleting a pill">
          <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
            Open a pill's detail view (click the card or <Chip>Details →</Chip>), then use the{' '}
            <Chip>Edit</Chip> button to update the name, color, reminder times, or email settings.
            To remove a pill, click <Chip>Delete</Chip> — you'll be asked to confirm.
            Deleted pills disappear from the dashboard but their history is preserved.
          </p>
          <Note className="mt-4">
            Changing a pill's schedule (e.g. switching from daily to weekly) will reset its streak
            to 0, since the new schedule changes what counts as a "required" day.
          </Note>
        </HelpSection>

        <HelpSection id="darkmode" accent="slate" icon="🌙" title="Dark & light mode">
          <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
            Click the <Chip>sun / moon icon</Chip> in the top-right of the navbar to toggle
            between dark and light mode. Your preference is saved in the browser.
          </p>
        </HelpSection>

      </div>
    </div>
  );
}

/* ── Layout components ─────────────────────────────────────────── */

const ACCENT_CLASSES = {
  indigo: 'from-indigo-500/20 to-transparent border-indigo-200 dark:border-indigo-500/20',
  violet: 'from-violet-500/20 to-transparent border-violet-200 dark:border-violet-500/20',
  emerald: 'from-emerald-500/20 to-transparent border-emerald-200 dark:border-emerald-500/20',
  blue:   'from-blue-500/20 to-transparent border-blue-200 dark:border-blue-500/20',
  amber:  'from-amber-500/20 to-transparent border-amber-200 dark:border-amber-500/20',
  pink:   'from-pink-500/20 to-transparent border-pink-200 dark:border-pink-500/20',
  red:    'from-red-500/20 to-transparent border-red-200 dark:border-red-500/20',
  slate:  'from-slate-500/20 to-transparent border-slate-200 dark:border-slate-700/40',
};

const ICON_BG = {
  indigo: 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
  violet: 'bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400',
  emerald:'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  blue:   'bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400',
  amber:  'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400',
  pink:   'bg-pink-100 dark:bg-pink-500/15 text-pink-600 dark:text-pink-400',
  red:    'bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400',
  slate:  'bg-slate-100 dark:bg-slate-700/40 text-slate-600 dark:text-slate-300',
};

function HelpSection({ id, accent = 'indigo', icon, title, children }) {
  return (
    <section
      id={id}
      className={`glass-card overflow-hidden scroll-mt-28`}
    >
      {/* Gradient strip header */}
      <div className={`px-6 py-4 bg-gradient-to-r ${ACCENT_CLASSES[accent]} border-b`}>
        <div className="flex items-center gap-3">
          <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${ICON_BG[accent]}`}>
            {icon}
          </span>
          <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">{title}</h2>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

function StatCard({ icon, label, desc }) {
  return (
    <div className="rounded-xl bg-white/60 dark:bg-slate-800/40 border border-white/80 dark:border-slate-700/40 px-4 py-3 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xs font-semibold text-gray-800 dark:text-slate-200 mb-0.5">{label}</div>
      <div className="text-xs text-gray-500 dark:text-slate-400">{desc}</div>
    </div>
  );
}

function Timeline({ children }) {
  return <ol className="space-y-0">{children}</ol>;
}

function TimelineStep({ n, title, children, isLast }) {
  return (
    <li className="flex gap-4">
      {/* Line + number */}
      <div className="flex flex-col items-center">
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600/15 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400
                         text-xs font-bold flex items-center justify-center border border-indigo-200 dark:border-indigo-500/30">
          {n}
        </span>
        {!isLast && <div className="w-px flex-1 bg-indigo-200/60 dark:bg-indigo-500/15 mt-1 mb-1" />}
      </div>
      {/* Content */}
      <div className={`pb-4 flex-1 ${isLast ? '' : ''}`}>
        <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 leading-7">{title}</p>
        <div className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{children}</div>
      </div>
    </li>
  );
}

function ScheduleGrid({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">{children}</div>;
}

function ScheduleItem({ label, desc }) {
  return (
    <div className="rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/40 px-3 py-2">
      <div className="text-xs font-semibold text-gray-800 dark:text-slate-200">{label}</div>
      <div className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">{desc}</div>
    </div>
  );
}

function FeatureCard({ icon, label, accent, children }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${accent}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-base">{icon}</span>
        <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">{label}</span>
      </div>
      <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed">{children}</p>
    </div>
  );
}

function MiniFeature({ icon, label, children }) {
  return (
    <div className="flex gap-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700/40 px-3 py-2.5">
      <span className="text-sm mt-0.5 shrink-0">{icon}</span>
      <div>
        <div className="text-xs font-semibold text-gray-800 dark:text-slate-200 mb-0.5">{label}</div>
        <div className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function Chip({ children, small }) {
  return (
    <code className={`inline-block font-mono bg-gray-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400
                      rounded-md border border-gray-200 dark:border-slate-700
                      ${small ? 'text-[10px] px-1.5 py-px' : 'text-xs px-2 py-0.5'}`}>
      {children}
    </code>
  );
}

function Note({ children, className = '' }) {
  return (
    <div className={`flex gap-3 rounded-xl bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/20
                     px-4 py-3 text-xs text-amber-800 dark:text-amber-300 leading-relaxed ${className}`}>
      <span className="text-base shrink-0 mt-px">💡</span>
      <p>{children}</p>
    </div>
  );
}
