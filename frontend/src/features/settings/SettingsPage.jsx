import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { saveResendKey, deleteResendKey, updateProfile, sendTestEmail } from '../../services/user.service';
import Modal from '../../components/ui/Modal';
import PhoneInput from '../../components/ui/PhoneInput';
import toast from 'react-hot-toast';
import { getApiError } from '../../utils/helpers';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [showGuide, setShowGuide] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [removingKey, setRemovingKey] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const handleSaveKey = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) return toast.error('Please enter your Resend API key');
    setSavingKey(true);
    try {
      await saveResendKey(apiKey.trim());
      await refreshUser();
      setApiKey('');
      toast.success('Resend API key saved securely');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSavingKey(false);
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      await sendTestEmail();
      toast.success('Test email sent! Check your inbox.');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setTestingEmail(false);
    }
  };

  const handleRemoveKey = async () => {
    if (!window.confirm('Remove your Resend API key? Email reminders will stop working.')) return;
    setRemovingKey(true);
    try {
      await deleteResendKey();
      await refreshUser();
      toast.success('API key removed');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setRemovingKey(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({ phone });
      await refreshUser();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">Manage your account and email reminders</p>
      </div>

      {/* Profile card */}
      <section className="glass-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>👤</span> Profile
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Full name</label>
            <p className="input-field bg-gray-50 dark:bg-slate-900/50 text-gray-500 dark:text-slate-400 cursor-not-allowed">{user?.name}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Name is synced from Google</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email</label>
            <p className="input-field bg-gray-50 dark:bg-slate-900/50 text-gray-500 dark:text-slate-400 cursor-not-allowed">{user?.email}</p>
          </div>
          <form onSubmit={handleSaveProfile}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Phone number <span className="text-gray-400 dark:text-slate-500 font-normal">(needed for SMS reminders)</span>
              </label>
              <PhoneInput
                value={phone}
                onChange={setPhone}
                disabled={savingProfile}
              />
            </div>
            <button type="submit" disabled={savingProfile} className="btn-primary">
              {savingProfile ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </div>
      </section>

      {/* Resend API key card */}
      <section className="glass-card p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span>📧</span> Email reminders
            </h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
              Connect your own Resend account to receive pill reminders.
            </p>
          </div>
          <button
            onClick={() => setShowGuide(true)}
            className="text-primary-400 hover:text-primary-300 text-sm underline underline-offset-2 transition-colors whitespace-nowrap ml-4"
          >
            How to get an API key?
          </button>
        </div>

        {user?.hasResendKey ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-sm font-medium">API key configured — reminders active</span>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleTestEmail}
                disabled={testingEmail}
                className="btn-primary text-sm"
              >
                {testingEmail ? 'Sending...' : 'Send test email'}
              </button>
              <button
                onClick={() => setShowGuide(false) || setApiKey('')}
                className="btn-secondary text-sm"
              >
                Replace key
              </button>
              <button
                onClick={handleRemoveKey}
                disabled={removingKey}
                className="btn-danger text-sm"
              >
                {removingKey ? 'Removing...' : 'Remove key'}
              </button>
            </div>
            {/* Allow replacing the key */}
            <form onSubmit={handleSaveKey} className="pt-2 border-t border-gray-200 dark:border-slate-700">
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">Replace with a new key:</p>
              <ApiKeyInput value={apiKey} onChange={setApiKey} show={showKey} onToggle={() => setShowKey(!showKey)} />
              <button type="submit" disabled={savingKey || !apiKey.trim()} className="btn-primary mt-3">
                {savingKey ? 'Saving...' : 'Update key'}
              </button>
            </form>
          </div>
        ) : (
          <form onSubmit={handleSaveKey} className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <span className="text-amber-400">⚠️</span>
              <span className="text-amber-300 text-sm">No API key set — email reminders are disabled</span>
            </div>
            <ApiKeyInput value={apiKey} onChange={setApiKey} show={showKey} onToggle={() => setShowKey(!showKey)} />
            <button type="submit" disabled={savingKey || !apiKey.trim()} className="btn-primary">
              {savingKey ? 'Saving...' : 'Save API key'}
            </button>
          </form>
        )}
      </section>

      {/* SMS reminders card */}
      <section className="glass-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>📱</span> SMS reminders
        </h2>
        {user?.hasTwilioSms ? (
          user?.phone ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-sm font-medium">
                SMS reminders available — phone number is set ({user.phone})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <span className="text-amber-400">⚠️</span>
              <span className="text-amber-300 text-sm">
                Add your phone number in the Profile section above to enable SMS reminders.
              </span>
            </div>
          )
        ) : (
          <p className="text-sm text-gray-500 dark:text-slate-400">
            SMS reminders are not enabled on this server. Contact the administrator to set up Twilio.
          </p>
        )}
      </section>

      {/* Resend Guide Modal */}
      <Modal isOpen={showGuide} onClose={() => setShowGuide(false)} title="How to get a Resend API key" size="lg">
        <div className="space-y-5 text-sm text-gray-700 dark:text-slate-300">
          <p className="text-gray-500 dark:text-slate-400">
            Resend is a free email API service. Follow these steps to get your key:
          </p>

          {[
            {
              step: 1,
              title: 'Create a free Resend account',
              desc: 'Go to resend.com and sign up for a free account. No credit card required.',
              note: 'Free plan: 3,000 emails/month',
            },
            {
              step: 2,
              title: 'Verify your email',
              desc: 'Check your inbox and click the verification link from Resend.',
            },
            {
              step: 3,
              title: 'Open API Keys',
              desc: 'In the Resend dashboard, click "API Keys" in the left sidebar.',
            },
            {
              step: 4,
              title: 'Create a new API key',
              desc: 'Click "+ Create API Key", give it a name like "Pill Reminder", and click "Add".',
            },
            {
              step: 5,
              title: 'Copy your key',
              desc: 'Your key starts with "re_". Copy it immediately — it won\'t be shown again.',
              note: '⚠️ Keep this key private. Do not share it.',
            },
            {
              step: 6,
              title: 'Paste it here',
              desc: 'Come back to this page and paste your key in the "Email reminders" section.',
            },
          ].map(({ step, title, desc, note }) => (
            <div key={step} className="flex gap-4">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-600/30 border border-primary-500/40 flex items-center justify-center text-primary-600 dark:text-primary-300 font-bold text-xs">
                {step}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{title}</p>
                <p className="text-gray-500 dark:text-slate-400 mt-0.5">{desc}</p>
                {note && <p className="text-amber-600 dark:text-amber-400 text-xs mt-1">{note}</p>}
              </div>
            </div>
          ))}

          <div className="pt-2 border-t border-gray-200 dark:border-slate-700 flex justify-end">
            <button onClick={() => setShowGuide(false)} className="btn-primary">
              Got it, close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ApiKeyInput({ value, onChange, show, onToggle }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Resend API key</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="re_xxxxxxxxxxxxxxxxxxxx"
          autoComplete="off"
          className="input-field pr-12"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          aria-label={show ? 'Hide key' : 'Show key'}
        >
          {show ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Your key is encrypted before being stored.</p>
    </div>
  );
}
