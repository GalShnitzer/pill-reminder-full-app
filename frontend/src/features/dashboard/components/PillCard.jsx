import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

import { updatePill } from '../../../services/pills.service';
import { formatTime, getApiError } from '../../../utils/helpers';

const PILL_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
];

/* ---------- icon helpers ---------- */

function CheckCircleIcon() {
  return (
    <svg
      className="w-5 h-5 text-green-400 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      className="w-5 h-5 text-slate-400 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function SpinnerIcon() {
  return (
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
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

/* ---------- pill capsule icon ---------- */

function PillIcon({ color = '#6366f1', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g transform="rotate(-35, 14, 14)">
        <rect x="9" y="4" width="10" height="20" rx="5" fill={color} />
        <path d="M9 14 H19 V19 A5 5 0 1 1 9 19 Z" fill="white" fillOpacity="0.22" />
        <line x1="9" y1="14" x2="19" y2="14" stroke="white" strokeWidth="1.5" strokeOpacity="0.45" />
      </g>
    </svg>
  );
}

/* ---------- color picker popover ---------- */

function ColorPickerPopover({ currentColor, onSelect, onClose, triggerRef }) {
  const ref = useRef(null);
  useEffect(() => {
    function handleClick(e) {
      const insidePopover = ref.current?.contains(e.target);
      const insideTrigger = triggerRef?.current?.contains(e.target);
      if (!insidePopover && !insideTrigger) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose, triggerRef]);

  return (
    <div
      ref={ref}
      className="absolute top-9 right-0 z-30 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex gap-1.5">
        {PILL_COLORS.map((hex) => (
          <button
            key={hex}
            type="button"
            className="w-5 h-5 rounded-full focus:outline-none shrink-0"
            style={{
              backgroundColor: hex,
              boxShadow: currentColor === hex
                ? `0 0 0 2px ${hex}, 0 0 10px 3px ${hex}aa`
                : 'none',
            }}
            onClick={() => onSelect(hex)}
            aria-label={hex}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

// Returns the "current dose" — the next upcoming dose based on local time.
// If all doses are in the past, returns the last one.
function getCurrentDose(doses) {
  if (!doses || doses.length === 0) return null;
  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const upcoming = doses.find((d) => d.scheduledHour >= currentTime);
  return upcoming || doses[doses.length - 1];
}

/* ---------- component ---------- */

export default function PillCard({ pill, onTake, onUntake, onClick, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorBtnRef = useRef(null);

  const { name, doses = [], reminderHours = [], takenToday, color = '#6366f1', streak = 0 } = pill;

  // Determine which dose to show on the card
  const currentDose = getCurrentDose(doses);
  const allTaken = takenToday;

  const handleColorChange = async (hex) => {
    setShowColorPicker(false);
    try {
      await updatePill(pill._id, { color: hex });
      onUpdate?.();
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  const handleTake = async (e) => {
    e.stopPropagation();
    if (loading || !currentDose) return;
    setLoading(true);
    try {
      await onTake(pill, currentDose.scheduledHour);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUntake = async (e) => {
    e.stopPropagation();
    if (loading || !currentDose) return;
    setLoading(true);
    try {
      await onUntake(pill, currentDose.scheduledHour);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`relative glass-card p-5 flex flex-col gap-4 cursor-pointer
                 border border-gray-200 dark:border-slate-700/50
                 hover:border-primary-500/50
                 transition-all duration-200
                 ${streak >= 2 ? 'border-l-[3px] border-l-amber-400/70 dark:border-l-amber-500/50' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={`View details for ${name}`}
    >
      {/* Top: name + reminder hour badges */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg font-semibold text-gray-900 dark:text-slate-100 leading-tight truncate">
              {name}
            </span>
            {streak >= 2 && (
              <span className="shrink-0 text-[11px] font-medium text-amber-500/80 dark:text-amber-400/60 tabular-nums select-none" title={`${streak}-day streak`}>
                🔥 {streak}d streak
              </span>
            )}
          </div>
          <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              ref={(el) => (colorBtnRef.current = el)}
              type="button"
              className="block rounded-full hover:scale-110 transition-transform focus:outline-none"
              onClick={() => setShowColorPicker((v) => !v)}
              title="Change color"
            >
              <PillIcon color={color} size={28} />
            </button>
            {showColorPicker && (
              <ColorPickerPopover
                currentColor={color}
                onSelect={handleColorChange}
                onClose={() => setShowColorPicker(false)}
                triggerRef={colorBtnRef}
              />
            )}
          </div>
        </div>

        {reminderHours.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {reminderHours.map((hour) => {
              const dose = doses.find((d) => d.scheduledHour === hour);
              return (
                <span
                  key={hour}
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    dose?.taken
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-primary-600/20 text-primary-300'
                  }`}
                >
                  {dose?.taken ? '✓ ' : ''}{hour}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Middle: current dose status */}
      <div className="flex items-center gap-2">
        {allTaken ? (
          <>
            <CheckCircleIcon />
            <span className="text-sm text-green-400 font-medium">All doses taken</span>
          </>
        ) : currentDose?.taken ? (
          <>
            <CheckCircleIcon />
            <span className="text-sm text-green-400 font-medium">
              {currentDose.scheduledHour} — Taken at {formatTime(currentDose.takenAt)}
            </span>
          </>
        ) : (
          <>
            <ClockIcon />
            <span className="text-sm text-gray-400 dark:text-slate-400">
              {currentDose ? `Next: ${currentDose.scheduledHour}` : 'Not taken yet'}
            </span>
          </>
        )}
      </div>

      {/* Bottom: actions */}
      <div
        className="flex items-center gap-3 mt-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {allTaken ? (
          <button
            className="btn-secondary text-sm py-1.5 px-4 flex items-center gap-2"
            onClick={handleUntake}
            disabled={loading}
            aria-label={`Undo last dose for ${name}`}
          >
            {loading ? (
              <>
                <SpinnerIcon />
                <span>Undoing…</span>
              </>
            ) : (
              'Undo'
            )}
          </button>
        ) : currentDose?.taken ? (
          <button
            className="btn-secondary text-sm py-1.5 px-4 flex items-center gap-2"
            onClick={handleUntake}
            disabled={loading}
            aria-label={`Undo ${currentDose.scheduledHour} dose for ${name}`}
          >
            {loading ? (
              <>
                <SpinnerIcon />
                <span>Undoing…</span>
              </>
            ) : (
              'Undo'
            )}
          </button>
        ) : (
          <button
            className="btn-primary w-full flex items-center justify-center gap-2"
            onClick={handleTake}
            disabled={loading}
            aria-label={`Mark ${name} as taken`}
          >
            {loading ? (
              <>
                <SpinnerIcon />
                <span>Marking…</span>
              </>
            ) : (
              'Mark as Taken'
            )}
          </button>
        )}

        <button
          className="text-sm text-primary-400 underline hover:text-primary-300 transition-colors shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          aria-label={`Open details for ${name}`}
        >
          Details →
        </button>
      </div>
    </div>
  );
}
