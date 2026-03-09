/**
 * Schedule utility functions shared between the scheduler service and controllers.
 */

/**
 * Returns true if `pill` is scheduled to be taken on `dateStr` (YYYY-MM-DD).
 * Respects scheduleType, scheduleWeekdays, scheduleMonthDay, scheduleInterval,
 * scheduleStartDate, startDate, and endDate.
 */
function isScheduledOnDate(pill, dateStr) {
  // Respect regimen date bounds
  if (pill.startDate && dateStr < pill.startDate) return false;
  if (pill.endDate   && dateStr > pill.endDate)   return false;

  const type = pill.scheduleType || 'daily';
  if (type === 'daily') return true;

  // Use noon to avoid DST edge cases
  const date = new Date(dateStr + 'T12:00:00');

  if (type === 'weekly') {
    return (pill.scheduleWeekdays || []).includes(date.getDay());
  }
  if (type === 'monthly') {
    return date.getDate() === (pill.scheduleMonthDay || 1);
  }
  if (type === 'every_n_days') {
    if (!pill.scheduleStartDate) return true;
    const start = new Date(pill.scheduleStartDate + 'T12:00:00');
    const diffDays = Math.round((date - start) / 86400000);
    return diffDays >= 0 && diffDays % (pill.scheduleInterval || 1) === 0;
  }
  return true;
}

/**
 * Returns the most recent date strictly before `dateStr` on which `pill` is scheduled.
 * Walks backward up to 400 days. Returns null if none found (brand-new pill).
 */
function getLastScheduledDateBefore(pill, dateStr) {
  const cursor = new Date(dateStr + 'T12:00:00');
  cursor.setDate(cursor.getDate() - 1); // start from the day before

  for (let i = 0; i < 400; i++) {
    const d = cursor.toISOString().slice(0, 10);
    if (isScheduledOnDate(pill, d)) return d;
    cursor.setDate(cursor.getDate() - 1);
  }
  return null;
}

/**
 * Computes the streak for `pill` up to and including `upToDate` (YYYY-MM-DD).
 * Queries PillLog for taken dates, then walks backward through scheduled days.
 * Non-scheduled days are skipped; the first scheduled day with no log breaks the streak.
 *
 * @param {Object} pill  - Mongoose pill document (or lean object)
 * @param {string} upToDate - YYYY-MM-DD
 * @param {Model}  PillLog  - Mongoose PillLog model
 * @returns {Promise<number>} streak count
 */
async function computeStreak(pill, upToDate, PillLog) {
  const windowStart = new Date(upToDate + 'T12:00:00');
  windowStart.setDate(windowStart.getDate() - 400);
  const windowStartStr = windowStart.toISOString().slice(0, 10);

  // Fetch all logs (need scheduledHour to verify every dose was taken)
  const logs = await PillLog.find({
    pillId: pill._id,
    date: { $gte: windowStartStr, $lte: upToDate },
  }).select('date scheduledHour').lean();

  // Build map: date -> Set of scheduledHours taken that day
  const logMap = {};
  logs.forEach((log) => {
    if (!logMap[log.date]) logMap[log.date] = new Set();
    logMap[log.date].add(log.scheduledHour);
  });

  const requiredHours = pill.reminderHours || [];

  // Returns true only if every required dose was taken on that date
  function allDosesTaken(date) {
    const taken = logMap[date];
    if (!taken) return false;
    return requiredHours.every((h) => taken.has(h));
  }

  // Walk backward from upToDate through scheduled days
  let streak = 0;
  const cursor = new Date(upToDate + 'T12:00:00');

  for (let i = 0; i < 400; i++) {
    const d = cursor.toISOString().slice(0, 10);
    if (isScheduledOnDate(pill, d)) {
      if (d === upToDate) {
        // For today: only count if all doses done; if partial, skip (day not over yet)
        if (allDosesTaken(d)) streak++;
        // else: don't break — today is still in progress
      } else {
        // Past day: all doses must be taken or streak breaks
        if (allDosesTaken(d)) {
          streak++;
        } else {
          break;
        }
      }
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

module.exports = { isScheduledOnDate, getLastScheduledDateBefore, computeStreak };
