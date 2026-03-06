export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-12">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">How to use PillReminder</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Everything you need to know to get the most out of the app.
        </p>
      </div>

      {/* Section: Overview */}
      <Section title="What is PillReminder?" emoji="💊">
        <p>
          PillReminder helps you track your daily medications. Add your pills, set reminder times,
          and mark them as taken each day. The app sends you email reminders so you never miss a dose.
        </p>
      </Section>

      {/* Section: Adding pills */}
      <Section title="Adding a pill" emoji="➕">
        <p className="mb-4">Click <Strong>+ Add Pill</Strong> on the dashboard to open the form.</p>
        <Steps>
          <Step n={1} title="Pill name">Enter the name of the medication (e.g. "Vitamin D").</Step>
          <Step n={2} title="Pill color">
            Pick a color from the palette — this color will show on the card as a capsule icon.
            You can change it at any time by clicking the capsule icon on the card.
          </Step>
          <Step n={3} title="Reminder times">
            Add one or more times you want to take this pill (up to 5). These are the times
            the app uses to send your email reminders.
          </Step>
          <Step n={4} title="Email reminder settings">
            <ul className="list-disc ml-4 space-y-1 mt-1">
              <li><Strong>Start sending at</Strong> — earliest time emails will be sent.</li>
              <li><Strong>Re-send every X minutes</Strong> — how often to repeat the reminder if the pill hasn't been marked taken (minimum 15 min).</li>
              <li><Strong>Stop sending at</Strong> — the cut-off time for reminders that day.</li>
            </ul>
          </Step>
        </Steps>
      </Section>

      {/* Section: Dashboard */}
      <Section title="The dashboard" emoji="🏠">
        <p className="mb-3">
          Your dashboard shows all active pills for today. Each card displays:
        </p>
        <ul className="space-y-2">
          <Feature label="Pill name & color">The name and your chosen capsule color in the top-right corner.</Feature>
          <Feature label="Reminder times">Badges showing when you're scheduled to take it.</Feature>
          <Feature label="Taken status">Whether you've taken it today, and at what time.</Feature>
          <Feature label="Mark as Taken">Tap the button to log that you've taken it right now. Tap Undo if you made a mistake.</Feature>
          <Feature label="Details →">Opens the full history and charts for that pill.</Feature>
        </ul>
      </Section>

      {/* Section: Changing pill color */}
      <Section title="Changing a pill's color" emoji="🎨">
        <p>
          Click the <Strong>capsule icon</Strong> in the top-right corner of any pill card.
          A color palette will appear — pick any of the 8 colors to instantly update it.
          The change is saved to the server immediately.
        </p>
      </Section>

      {/* Section: History */}
      <Section title="Pill history & charts" emoji="📊">
        <p className="mb-3">
          Click <Strong>Details →</Strong> on any card (or click anywhere on the card) to open the detail view.
          It shows:
        </p>
        <ul className="space-y-2">
          <Feature label="Adherence rate">Percentage of days you took the pill since you added it (up to 30 days).</Feature>
          <Feature label="Streak">How many consecutive days you've taken it.</Feature>
          <Feature label="Bar chart">Compares the time you actually took the pill vs. the scheduled time, day by day.</Feature>
          <Feature label="Heatmap calendar">A 30-day grid — filled squares mean taken, empty means missed. Only shows days since the pill was added.</Feature>
          <Feature label="History log">A list of every dose with the exact date and time.</Feature>
        </ul>
        <Note>Days before you added a pill are never shown as "missed" — the history starts from your creation date.</Note>
      </Section>

      {/* Section: Email reminders */}
      <Section title="Setting up email reminders" emoji="✉️">
        <p className="mb-4">
          Email reminders require a free <Strong>Resend</Strong> API key. Resend is the email
          service the app uses to send you reminders. Each user provides their own key so emails
          come from your own account.
        </p>
        <Steps>
          <Step n={1} title="Go to Settings">Click your name in the top-right → Settings, or use the sidebar.</Step>
          <Step n={2} title="Follow the guide">In the Settings page, click <Strong>How to get a Resend API key</Strong> for a step-by-step walkthrough.</Step>
          <Step n={3} title="Paste your key">Enter the API key in the field and click Save. The key is encrypted before being stored.</Step>
        </Steps>
        <Note>
          Reminders are sent based on each pill's <Strong>reminder times</Strong> and <Strong>email settings</Strong>.
          If a pill is already marked taken, no further reminders are sent for that day.
        </Note>
      </Section>

      {/* Section: Editing & deleting */}
      <Section title="Editing or deleting a pill" emoji="✏️">
        <p>
          Open a pill's detail view (click the card or Details →), then use the{' '}
          <Strong>Edit</Strong> button to update the name, color, reminder times, or email settings.
          To remove a pill, click <Strong>Delete</Strong> — you'll be asked to confirm.
          Deleted pills disappear from the dashboard but their history is preserved.
        </p>
      </Section>

      {/* Section: Dark mode */}
      <Section title="Dark & light mode" emoji="🌙">
        <p>
          Click the <Strong>sun / moon icon</Strong> in the top-right of the navbar to toggle
          between dark and light mode. Your preference is saved in the browser.
        </p>
      </Section>

    </div>
  );
}

/* ── Small sub-components ─────────────────────────────────────────── */

function Section({ title, emoji, children }) {
  return (
    <section className="glass-card p-6 space-y-3">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
        <span aria-hidden="true">{emoji}</span>
        {title}
      </h2>
      <div className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function Strong({ children }) {
  return <strong className="font-semibold text-gray-900 dark:text-slate-200">{children}</strong>;
}

function Steps({ children }) {
  return <ol className="space-y-3">{children}</ol>;
}

function Step({ n, title, children }) {
  return (
    <li className="flex gap-3">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center mt-0.5">
        {n}
      </span>
      <div>
        <p className="font-medium text-gray-800 dark:text-slate-200">{title}</p>
        <div className="text-gray-500 dark:text-slate-400 mt-0.5">{children}</div>
      </div>
    </li>
  );
}

function Feature({ label, children }) {
  return (
    <li className="flex gap-2">
      <span className="text-indigo-500 dark:text-indigo-400 font-semibold shrink-0">·</span>
      <span><strong className="text-gray-800 dark:text-slate-200">{label}</strong> — {children}</span>
    </li>
  );
}

function Note({ children }) {
  return (
    <div className="mt-4 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
      <span className="font-semibold">Note: </span>{children}
    </div>
  );
}
