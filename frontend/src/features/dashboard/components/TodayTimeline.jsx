import { useState } from 'react';
import { formatTime } from '../../../utils/helpers';

function SpinnerIcon() {
  return (
    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export default function TodayTimeline({ pills, onTake, onUntake }) {
  const [loadingKey, setLoadingKey] = useState(null); // "pillId:scheduledHour"

  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  // Flatten all doses from all pills into a sorted list
  const entries = pills
    .flatMap((pill) =>
      (pill.doses || []).map((dose) => ({
        ...dose,
        pill,
        key: `${pill._id}:${dose.scheduledHour}`,
      }))
    )
    .sort((a, b) => a.scheduledHour.localeCompare(b.scheduledHour));

  if (!entries.length) return null;

  const handleTake = async (entry) => {
    if (loadingKey) return;
    setLoadingKey(entry.key);
    try {
      await onTake(entry.pill, entry.scheduledHour);
    } finally {
      setLoadingKey(null);
    }
  };

  const handleUntake = async (entry) => {
    if (loadingKey) return;
    setLoadingKey(entry.key);
    try {
      await onUntake(entry.pill, entry.scheduledHour);
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="glass-card p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400 mb-4">
        Today's Schedule
      </h2>
      <div className="space-y-3">
        {entries.map((entry) => {
          const isPast = entry.scheduledHour < currentTime;
          const isLoading = loadingKey === entry.key;

          return (
            <div key={entry.key} className="flex items-center gap-3">
              {/* Time */}
              <span
                className={`text-sm font-mono w-12 shrink-0 ${
                  isPast && !entry.taken
                    ? 'text-red-400'
                    : 'text-gray-500 dark:text-slate-400'
                }`}
              >
                {entry.scheduledHour}
              </span>

              {/* Pill color dot + name */}
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.pill.color }}
              />
              <span className="text-sm text-gray-800 dark:text-slate-200 flex-1 truncate min-w-0">
                {entry.pill.name}
              </span>

              {/* Status + action */}
              {entry.taken ? (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-green-400">✓ {formatTime(entry.takenAt)}</span>
                  <button
                    onClick={() => handleUntake(entry)}
                    disabled={!!loadingKey}
                    className="text-xs text-gray-400 hover:text-red-400 transition-colors disabled:opacity-40"
                  >
                    {isLoading ? <SpinnerIcon /> : 'Undo'}
                  </button>
                </div>
              ) : isPast ? (
                <button
                  onClick={() => handleTake(entry)}
                  disabled={!!loadingKey}
                  className="text-xs px-2.5 py-1 rounded-lg shrink-0 transition-colors disabled:opacity-40 bg-red-500/20 text-red-300 hover:bg-red-500/30"
                >
                  {isLoading ? <SpinnerIcon /> : 'Take'}
                </button>
              ) : (
                <span className="text-xs text-gray-400 dark:text-slate-500 shrink-0">Upcoming</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
