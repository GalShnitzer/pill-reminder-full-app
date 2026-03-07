import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import Modal from '../../components/ui/Modal';
import { createPill, updatePill } from '../../services/pills.service';
import { getApiError, timeToMinutes } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_HOURS = 5;

const PILL_COLORS = [
  { hex: '#6366f1', label: 'Indigo' },
  { hex: '#8b5cf6', label: 'Violet' },
  { hex: '#ec4899', label: 'Pink' },
  { hex: '#ef4444', label: 'Red' },
  { hex: '#f97316', label: 'Orange' },
  { hex: '#eab308', label: 'Yellow' },
  { hex: '#22c55e', label: 'Green' },
  { hex: '#06b6d4', label: 'Cyan' },
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DEFAULT_FORM = {
  name: '',
  color: '#6366f1',
  reminderHours: ['09:00'],
  emailStartHour: '09:00',
  emailFrequency: 120,
  emailEndHour: '22:00',
  scheduleType: 'daily',
  scheduleInterval: 2,
  scheduleWeekdays: [],
  scheduleMonthDay: 1,
  reminderChannels: ['email'],
};

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function buildInitialForm(existingPill) {
  if (!existingPill) return { ...DEFAULT_FORM, reminderHours: ['09:00'] };

  return {
    name: existingPill.name ?? '',
    color: existingPill.color ?? '#6366f1',
    reminderHours:
      Array.isArray(existingPill.reminderHours) && existingPill.reminderHours.length
        ? [...existingPill.reminderHours]
        : ['09:00'],
    emailStartHour: existingPill.emailStartHour ?? '09:00',
    emailFrequency: existingPill.emailFrequencyMinutes ?? 120,
    emailEndHour: existingPill.emailEndHour ?? '22:00',
    scheduleType: existingPill.scheduleType ?? 'daily',
    scheduleInterval: existingPill.scheduleInterval ?? 2,
    scheduleWeekdays: existingPill.scheduleWeekdays ?? [],
    scheduleMonthDay: existingPill.scheduleMonthDay ?? 1,
    reminderChannels: existingPill.reminderChannels ?? ['email'],
  };
}

// ---------------------------------------------------------------------------
// Field-level error helpers
// ---------------------------------------------------------------------------

function validate(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = 'Pill name is required.';
  }

  if (!form.reminderHours.length) {
    errors.reminderHours = 'At least one reminder hour is required.';
  }

  if (!form.reminderChannels.length) {
    errors.reminderChannels = 'Select at least one reminder channel.';
  }

  if (
    form.emailEndHour &&
    form.emailStartHour &&
    timeToMinutes(form.emailEndHour) <= timeToMinutes(form.emailStartHour)
  ) {
    errors.emailEndHour = 'End time must be after start time.';
  }

  if (form.emailFrequency < 15 || form.emailFrequency > 1440) {
    errors.emailFrequency = 'Frequency must be between 15 and 1440 minutes.';
  }

  if (form.scheduleType === 'weekly' && form.scheduleWeekdays.length === 0) {
    errors.scheduleWeekdays = 'Select at least one day.';
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-400">{message}</p>;
}

function Label({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
      {children}
    </label>
  );
}

function TrashIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function PlusIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function ChannelCheckbox({ id, label, icon, checked, disabled, disabledReason, onChange }) {
  return (
    <div className="relative group">
      <label
        htmlFor={id}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors cursor-pointer ${
          disabled
            ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-slate-700'
            : checked
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
            : 'border-gray-200 dark:border-slate-700 hover:border-indigo-400'
        }`}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="accent-indigo-500 w-4 h-4 flex-shrink-0"
        />
        <span className="text-lg" aria-hidden="true">{icon}</span>
        <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{label}</span>
        {disabled && (
          <span className="ml-auto text-xs text-gray-400 dark:text-slate-500 italic truncate max-w-[140px]">
            {disabledReason}
          </span>
        )}
      </label>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AddPillModal({ isOpen, onClose, onCreated, existingPill }) {
  const isEditing = Boolean(existingPill);
  const { user } = useAuth();

  const [form, setForm] = useState(buildInitialForm(existingPill));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(buildInitialForm(existingPill));
      setErrors({});
    }
  }, [isOpen, existingPill]);

  // ---------------------------------------------------------------------------
  // Channel availability
  // ---------------------------------------------------------------------------
  const emailAvailable = !!user?.hasResendKey;
  const smsAvailable = !!(user?.hasTwilioSms && user?.phone);
  const smsDisabledReason = !user?.hasTwilioSms
    ? 'SMS not configured on this server'
    : 'No phone number — go to Settings';

  // ---------------------------------------------------------------------------
  // Field handlers
  // ---------------------------------------------------------------------------

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function toggleChannel(channel, checked) {
    const channels = checked
      ? [...form.reminderChannels, channel]
      : form.reminderChannels.filter((c) => c !== channel);
    setField('reminderChannels', channels);
  }

  function toggleWeekday(day) {
    const days = form.scheduleWeekdays.includes(day)
      ? form.scheduleWeekdays.filter((d) => d !== day)
      : [...form.scheduleWeekdays, day];
    setField('scheduleWeekdays', days);
  }

  function addReminderHour() {
    if (form.reminderHours.length >= MAX_HOURS) return;
    setForm((prev) => ({
      ...prev,
      reminderHours: [...prev.reminderHours, '09:00'],
    }));
    if (errors.reminderHours) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.reminderHours;
        return next;
      });
    }
  }

  function updateReminderHour(index, value) {
    setForm((prev) => {
      const next = [...prev.reminderHours];
      next[index] = value;
      return { ...prev, reminderHours: next };
    });
  }

  function removeReminderHour(index) {
    setForm((prev) => ({
      ...prev,
      reminderHours: prev.reminderHours.filter((_, i) => i !== index),
    }));
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  async function handleSubmit(e) {
    e.preventDefault();

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        color: form.color,
        reminderHours: form.reminderHours,
        emailStartHour: form.emailStartHour,
        emailFrequencyMinutes: Number(form.emailFrequency),
        emailEndHour: form.emailEndHour,
        scheduleType: form.scheduleType,
        scheduleInterval: Number(form.scheduleInterval),
        scheduleWeekdays: form.scheduleWeekdays,
        scheduleMonthDay: Number(form.scheduleMonthDay),
        reminderChannels: form.reminderChannels,
      };

      if (isEditing) {
        await updatePill(existingPill._id, payload);
        toast.success('Pill updated successfully.');
      } else {
        await createPill(payload);
        toast.success('Pill added successfully.');
      }

      onCreated?.();
      onClose();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Pill' : 'Add New Pill'}
      size="lg"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-5">
          {/* ---- 1. Pill name ---- */}
          <div>
            <Label htmlFor="pill-name">Pill name</Label>
            <input
              id="pill-name"
              type="text"
              className="input-field"
              placeholder="e.g. Vitamin D"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              disabled={submitting}
              autoFocus
            />
            <FieldError message={errors.name} />
          </div>

          {/* ---- 2. Pill color ---- */}
          <div>
            <Label>Pill color</Label>
            <div className="flex flex-wrap gap-3">
              {PILL_COLORS.map(({ hex, label }) => (
                <button
                  key={hex}
                  type="button"
                  title={label}
                  disabled={submitting}
                  onClick={() => setField('color', hex)}
                  className="w-8 h-8 rounded-full transition-transform focus:outline-none disabled:opacity-40"
                  style={{
                    backgroundColor: hex,
                    boxShadow: form.color === hex
                      ? `0 0 0 2.5px ${hex}, 0 0 12px 4px ${hex}aa`
                      : 'none',
                  }}
                  aria-label={`${label} color`}
                  aria-pressed={form.color === hex}
                />
              ))}
            </div>
          </div>

          {/* ---- 3. Schedule frequency ---- */}
          <div>
            <Label>How often</Label>
            <div className="space-y-2">
              {[
                { value: 'daily', label: 'Every day' },
                { value: 'every_n_days', label: 'Every N days' },
                { value: 'weekly', label: 'Specific days of the week' },
                { value: 'monthly', label: 'Once a month' },
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scheduleType"
                    value={value}
                    checked={form.scheduleType === value}
                    onChange={() => setField('scheduleType', value)}
                    disabled={submitting}
                    className="accent-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-slate-300">{label}</span>
                </label>
              ))}
            </div>

            {form.scheduleType === 'every_n_days' && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-slate-400">Every</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  className="input-field w-20"
                  value={form.scheduleInterval}
                  onChange={(e) => setField('scheduleInterval', Number(e.target.value))}
                  disabled={submitting}
                />
                <span className="text-sm text-gray-600 dark:text-slate-400">days</span>
              </div>
            )}

            {form.scheduleType === 'weekly' && (
              <div className="mt-3 flex flex-wrap gap-2">
                {WEEKDAYS.map((day, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={submitting}
                    onClick={() => toggleWeekday(i)}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition-colors disabled:opacity-40 ${
                      form.scheduleWeekdays.includes(i)
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-indigo-400'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            )}
            <FieldError message={errors.scheduleWeekdays} />

            {form.scheduleType === 'monthly' && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-slate-400">On the</span>
                <input
                  type="number"
                  min={1}
                  max={31}
                  className="input-field w-20"
                  value={form.scheduleMonthDay}
                  onChange={(e) => setField('scheduleMonthDay', Number(e.target.value))}
                  disabled={submitting}
                />
                <span className="text-sm text-gray-600 dark:text-slate-400">of each month</span>
              </div>
            )}
          </div>

          {/* ---- 4. Reminder hours ---- */}
          <div>
            <Label>Reminder times</Label>

            <div className="space-y-2">
              {form.reminderHours.map((hour, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="time"
                    className="input-field"
                    value={hour}
                    onChange={(e) => updateReminderHour(index, e.target.value)}
                    disabled={submitting}
                    aria-label={`Reminder time ${index + 1}`}
                  />
                  {form.reminderHours.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeReminderHour(index)}
                      disabled={submitting}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30 transition-colors disabled:opacity-40 flex-shrink-0"
                      aria-label={`Remove reminder time ${index + 1}`}
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <FieldError message={errors.reminderHours} />

            {form.reminderHours.length < MAX_HOURS && (
              <button
                type="button"
                onClick={addReminderHour}
                disabled={submitting}
                className="mt-2 flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors disabled:opacity-40"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Add hour
              </button>
            )}
            {form.reminderHours.length >= MAX_HOURS && (
              <p className="mt-1.5 text-xs text-gray-400 dark:text-slate-500">Maximum of {MAX_HOURS} reminder times reached.</p>
            )}
          </div>

          {/* ---- 5. Reminder channels ---- */}
          <div>
            <Label>Send reminders via</Label>
            <div className="space-y-2">
              <ChannelCheckbox
                id="ch-email"
                label="Email"
                icon="📧"
                checked={form.reminderChannels.includes('email')}
                disabled={!emailAvailable || submitting}
                disabledReason="No Resend API key — go to Settings"
                onChange={(checked) => toggleChannel('email', checked)}
              />
              <ChannelCheckbox
                id="ch-sms"
                label="SMS"
                icon="📱"
                checked={form.reminderChannels.includes('sms')}
                disabled={!smsAvailable || submitting}
                disabledReason={smsDisabledReason}
                onChange={(checked) => toggleChannel('sms', checked)}
              />
            </div>
            <FieldError message={errors.reminderChannels} />
          </div>

          {/* ---- Divider ---- */}
          <div className="border-t border-gray-200 dark:border-slate-700/50 pt-1">
            <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wide font-medium mb-4">
              Reminder window
            </p>

            <div className="space-y-4">
              <div>
                <Label htmlFor="email-start">Start sending reminders at</Label>
                <input
                  id="email-start"
                  type="time"
                  className="input-field"
                  value={form.emailStartHour}
                  onChange={(e) => setField('emailStartHour', e.target.value)}
                  disabled={submitting}
                />
                <FieldError message={errors.emailStartHour} />
              </div>

              <div>
                <Label htmlFor="email-frequency">Re-send every X minutes</Label>
                <input
                  id="email-frequency"
                  type="number"
                  className="input-field"
                  min={15}
                  max={1440}
                  value={form.emailFrequency}
                  onChange={(e) => setField('emailFrequency', e.target.value)}
                  disabled={submitting}
                  placeholder="120"
                />
                <FieldError message={errors.emailFrequency} />
              </div>

              <div>
                <Label htmlFor="email-end">Stop sending reminders at</Label>
                <input
                  id="email-end"
                  type="time"
                  className="input-field"
                  value={form.emailEndHour}
                  onChange={(e) => setField('emailEndHour', e.target.value)}
                  disabled={submitting}
                />
                <FieldError message={errors.emailEndHour} />
              </div>
            </div>
          </div>
        </div>

        {/* ---- Actions ---- */}
        <div className="flex items-center justify-end gap-3 mt-7 pt-5 border-t border-gray-200 dark:border-slate-700/50">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center gap-2 min-w-[110px] justify-center"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                  />
                </svg>
                {isEditing ? 'Saving…' : 'Adding…'}
              </>
            ) : isEditing ? (
              'Save changes'
            ) : (
              'Add pill'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
