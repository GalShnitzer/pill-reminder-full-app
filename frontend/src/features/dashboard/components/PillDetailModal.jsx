import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts';

import Modal from '../../../components/ui/Modal';
import { getPillHistory } from '../../../services/pills.service';
import { formatDate, formatTime, getApiError } from '../../../utils/helpers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse "HH:MM" string into decimal hours (e.g. "14:30" → 14.5) */
function hmToDecimal(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  return h + m / 60;
}

/** Format a decimal hour back to "HH:MM" for axis labels */
function decimalToHM(value) {
  if (value == null) return '';
  const h = Math.floor(value);
  const m = Math.round((value - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Short date label for bar chart X-axis ("Jun 1") */
function shortDate(dateStr) {
  // Parse YYYY-MM-DD as local date to avoid UTC offset shift
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Returns today's date as "YYYY-MM-DD" in the user's timezone */
function todayStr() {
  return new Date().toLocaleDateString('en-CA', { timeZone: userTZ });
}

/** Generate last N date strings in user's timezone, oldest first */
function lastNDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toLocaleDateString('en-CA', { timeZone: userTZ });
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({ label, value, sub }) {
  return (
    <div className="glass-card px-3 py-3 flex flex-col gap-0.5 min-w-0">
      <span className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide truncate">{label}</span>
      <span className="text-xl font-bold text-gray-900 dark:text-slate-100 leading-tight">{value}</span>
      {sub && <span className="text-xs text-gray-400 dark:text-slate-500">{sub}</span>}
    </div>
  );
}

function SkeletonBlock({ className = '' }) {
  return (
    <div className={`bg-gray-200 dark:bg-slate-700/50 rounded-xl animate-pulse ${className}`} />
  );
}

function SkeletonStats() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[0, 1, 2].map((i) => (
        <SkeletonBlock key={i} className="h-20" />
      ))}
    </div>
  );
}

function SkeletonChart({ height = 200 }) {
  return <SkeletonBlock style={{ height }} className="w-full" />;
}

// Custom compact 30-day grid heatmap (replaces react-calendar-heatmap)
function MiniHeatmap({ logMap, pillCreatedDate }) {
  const allDays = lastNDays(30);
  const shownDays = pillCreatedDate
    ? allDays.filter((d) => d >= pillCreatedDate)
    : allDays;

  if (!shownDays.length) {
    return <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-2">No history yet.</p>;
  }

  // Pad start to align with correct day of week (Sun = 0)
  const [y, m, d] = shownDays[0].split('-').map(Number);
  const startDOW = new Date(y, m - 1, d).getDay();
  const cells = [...Array(startDOW).fill(null), ...shownDays];

  const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div>
      <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: 'repeat(7, 1.75rem)' }}>
        {DOW.map((label) => (
          <div key={label} className="w-7 text-center text-[10px] text-gray-400 dark:text-slate-500 font-medium">
            {label}
          </div>
        ))}
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1.75rem)' }}>
        {cells.map((date, i) => {
          if (!date) return <div key={`pad-${i}`} className="w-7 h-7 opacity-0" />;
          const taken = logMap[date]?.taken;
          return (
            <div
              key={date}
              title={`${date}: ${taken ? '✓ Taken' : '✗ Missed'}`}
              className={`w-7 h-7 rounded-sm ${
                taken ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-slate-700'
              }`}
            />
          );
        })}
      </div>
      <div className="flex gap-3 mt-2 justify-end text-xs text-gray-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-indigo-500" /> Taken
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-gray-200 dark:bg-slate-700" /> Missed
        </span>
      </div>
    </div>
  );
}

// Custom dark tooltip for Recharts
function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-300 font-semibold mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.fill ?? entry.color }}>
          {entry.name}: <span className="font-bold">{decimalToHM(entry.value)}</span>
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PillDetailModal({ pill, isOpen, onClose, onDelete }) {
  const [data, setData] = useState(null);   // { pill, logs }
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Fetch history whenever the modal opens
  useEffect(() => {
    if (!isOpen || !pill?._id) return;

    let cancelled = false;
    setData(null);
    setConfirmDelete(false);
    setLoading(true);

    getPillHistory(pill._id)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) toast.error(getApiError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, pill?._id]);

  if (!pill) return null;

  // ---------------------------------------------------------------------------
  // Derived stats (computed from logs)
  // ---------------------------------------------------------------------------
  const today = todayStr();

  // Pill creation date in user's timezone (YYYY-MM-DD)
  const pillCreatedDate = data?.pill?.createdAt
    ? new Date(data.pill.createdAt).toLocaleDateString('en-CA', { timeZone: userTZ })
    : null;

  // Filter logs: exclude any entries from before the pill was created
  const logs = (data?.logs ?? []).filter((l) => !pillCreatedDate || l.date >= pillCreatedDate);

  const logMap = Object.fromEntries(logs.map((l) => [l.date, l]));

  // "Taken today?"
  const todayLog = logMap[today];
  const takenToday = todayLog?.taken ?? false;

  // Only count days since the pill was created (within last 30 days)
  const allDays30 = lastNDays(30).filter((d) => !pillCreatedDate || d >= pillCreatedDate);

  // Current streak: count consecutive days (ending today, going back) that were taken
  let streak = 0;
  for (let i = allDays30.length - 1; i >= 0; i--) {
    if (logMap[allDays30[i]]?.taken) {
      streak++;
    } else {
      break;
    }
  }

  // Rate since creation (or last 30 days)
  const takenCount30 = allDays30.filter((d) => logMap[d]?.taken).length;
  const totalDays = allDays30.length;
  const rate30 = totalDays > 0 ? Math.round((takenCount30 / totalDays) * 100) : 0;
  const rateLabel = totalDays < 30 ? `${totalDays}-day rate` : '30-day rate';

  // ---------------------------------------------------------------------------
  // Chart 1 data — last 14 days (only since creation)
  // ---------------------------------------------------------------------------
  const last14 = lastNDays(14).filter((d) => !pillCreatedDate || d >= pillCreatedDate);
  const chartData = last14.map((date) => {
    const log = logMap[date];
    const scheduled = log?.scheduledHour ? hmToDecimal(log.scheduledHour) : null;
    const actual =
      log?.taken && log?.takenAt ? new Date(log.takenAt).getHours() + new Date(log.takenAt).getMinutes() / 60 : null;

    return {
      date,
      label: shortDate(date),
      scheduled,
      actual,
    };
  });

  // Y-axis domain: find min/max across all values, then pad
  const allHourValues = chartData.flatMap((d) =>
    [d.scheduled, d.actual].filter((v) => v != null)
  );
  const yMin = allHourValues.length ? Math.max(0, Math.floor(Math.min(...allHourValues)) - 1) : 0;
  const yMax = allHourValues.length ? Math.min(24, Math.ceil(Math.max(...allHourValues)) + 1) : 24;

  // ---------------------------------------------------------------------------
  // Delete handler
  // ---------------------------------------------------------------------------
  const handleDeleteConfirm = () => {
    onDelete(pill);
    setConfirmDelete(false);
  };

  // ---------------------------------------------------------------------------
  // Chart theme (class-based dark mode)
  // ---------------------------------------------------------------------------
  const isDark = document.documentElement.classList.contains('dark');
  const chartColors = {
    grid: isDark ? '#334155' : '#e2e8f0',
    tick: isDark ? '#94a3b8' : '#64748b',
    axis: isDark ? '#475569' : '#cbd5e1',
    cursor: isDark ? '#1e293b80' : '#94a3b820',
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
      <div className="space-y-6">
        {/* ---- Header row ---- */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 truncate max-w-xs">
            {pill.name}
          </h2>

          {!confirmDelete ? (
            <button
              className="btn-danger py-1.5 px-3 text-sm"
              onClick={() => setConfirmDelete(true)}
            >
              Delete Pill
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 dark:bg-red-950/60 dark:border-red-700/50 rounded-xl px-3 py-1.5">
              <span className="text-sm text-red-600 dark:text-red-300">Are you sure?</span>
              <button
                className="text-xs font-bold text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 transition-colors"
                onClick={handleDeleteConfirm}
              >
                Yes, delete
              </button>
              <button
                className="text-xs text-gray-400 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* ---- Stats row ---- */}
        {loading ? (
          <SkeletonStats />
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="Taken today"
              value={takenToday ? 'Yes' : 'No'}
              sub={takenToday && todayLog?.takenAt ? `at ${formatTime(todayLog.takenAt)}` : undefined}
            />
            <StatCard
              label="Streak"
              value={`${streak}d`}
              sub="consecutive days"
            />
            <StatCard
              label={rateLabel}
              value={`${rate30}%`}
              sub={`${takenCount30} / ${totalDays} days`}
            />
          </div>
        )}

        {/* ---- Chart 1 — Time Distribution ---- */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-300 mb-3 uppercase tracking-wide">
            Take time vs scheduled
          </h3>
          {loading ? (
            <SkeletonChart height={220} />
          ) : chartData.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-6">No data yet.</p>
          ) : (
            <div className="bg-gray-100 dark:bg-slate-800/50 rounded-2xl p-3">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 28 }}
                  barCategoryGap="30%"
                  barGap={2}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chartColors.grid}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: chartColors.tick, fontSize: 10 }}
                    axisLine={{ stroke: chartColors.axis }}
                    tickLine={false}
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                    dy={4}
                  />
                  <YAxis
                    domain={[yMin, yMax]}
                    tickFormatter={decimalToHM}
                    tick={{ fill: chartColors.tick, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={46}
                    ticks={Array.from(
                      { length: Math.ceil(yMax - yMin) + 1 },
                      (_, i) => yMin + i
                    ).filter((_, i) => i % 2 === 0)}
                  />
                  <Tooltip content={<DarkTooltip />} cursor={{ fill: chartColors.cursor }} />
                  {/* Scheduled bar — indigo */}
                  <Bar dataKey="scheduled" name="Scheduled" maxBarSize={18} radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`sched-${index}`}
                        fill={entry.scheduled != null ? '#6366f1' : 'transparent'}
                      />
                    ))}
                  </Bar>
                  {/* Actual taken bar — emerald */}
                  <Bar dataKey="actual" name="Taken at" maxBarSize={18} radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`actual-${index}`}
                        fill={entry.actual != null ? '#10b981' : 'transparent'}
                      />
                    ))}
                  </Bar>
                  {/* Reference line at current hour */}
                  <ReferenceLine
                    y={new Date().getHours()}
                    stroke="#f59e0b"
                    strokeDasharray="4 3"
                    strokeWidth={1}
                    label={{ value: 'Now', fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }}
                  />
                </BarChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex gap-4 justify-center mt-1 text-xs text-gray-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-sm bg-indigo-500" />
                  Scheduled
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500" />
                  Taken
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-1 bg-amber-400" />
                  Now
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ---- Chart 2 — Streak Calendar ---- */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-300 mb-3 uppercase tracking-wide">
            30-day history
          </h3>
          {loading ? (
            <SkeletonBlock className="h-24 w-full" />
          ) : (
            <div className="bg-gray-100 dark:bg-slate-800/50 rounded-2xl p-4">
              <MiniHeatmap logMap={logMap} pillCreatedDate={pillCreatedDate} />
            </div>
          )}
        </div>

        {/* ---- History list ---- */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-300 mb-3 uppercase tracking-wide">
            Log
          </h3>
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2, 4].map((i) => (
                <SkeletonBlock key={i} className="h-10" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">No history yet.</p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {logs.slice(0, 7).map((log, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-colors ${
                    log.taken
                      ? 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/25 dark:border-emerald-700/30'
                      : 'bg-gray-100 border border-gray-200 dark:bg-slate-800/40 dark:border-slate-700/30'
                  }`}
                >
                  {/* Date */}
                  <span className={`font-medium ${log.taken ? 'text-gray-800 dark:text-slate-200' : 'text-gray-500 dark:text-slate-400'}`}>
                    {formatDate(log.date)}
                  </span>

                  {/* Status + time */}
                  <div className="flex items-center gap-3 text-xs">
                    {log.taken ? (
                      <>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Taken
                        </span>
                        <span className="text-gray-500 dark:text-slate-400">{log.takenAt ? formatTime(log.takenAt) : '—'}</span>
                      </>
                    ) : (
                      <span className="text-gray-400 dark:text-slate-500 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Missed
                      </span>
                    )}
                    {log.scheduledHour && (
                      <span className="text-gray-400 dark:text-slate-500">
                        sched: <span className="text-indigo-500 dark:text-indigo-400">{log.scheduledHour}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
