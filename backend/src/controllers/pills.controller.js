const Pill = require('../models/Pill');
const PillLog = require('../models/PillLog');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { isScheduledOnDate, getLastScheduledDateBefore, computeStreak } = require('../utils/scheduleUtils');

const getTodayDate = (timezone = 'UTC') => {
  return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
};

async function getUserTimezone(userId) {
  const user = await User.findById(userId).select('timezone').lean();
  return user?.timezone || 'UTC';
}

// GET /api/pills — list active pills with today's per-dose taken status
const getPills = asyncHandler(async (req, res) => {
  const tz = await getUserTimezone(req.userId);
  const pills = await Pill.find({ userId: req.userId, isActive: true }).lean();
  const today = getTodayDate(tz);

  // Filter pills by date range (startDate / endDate)
  const activePills = pills.filter((p) => {
    if (p.startDate && today < p.startDate) return false;
    if (p.endDate   && today > p.endDate)   return false;
    return true;
  });

  const pillIds = activePills.map((p) => p._id);

  // Single query: today's logs only (for dose status)
  const todayLogs = await PillLog.find({
    userId: req.userId,
    date: today,
    pillId: { $in: pillIds },
  }).lean();

  // Map: "pillId:scheduledHour" -> { takenAt }
  const doseMap = {};
  todayLogs.forEach((log) => {
    const key = `${log.pillId}:${log.scheduledHour}`;
    doseMap[key] = { takenAt: log.takenAt };
  });

  // Lazy migration: compute + cache streak for pills that have never had it calculated
  const needsMigration = activePills.filter((p) => !p.streakAnchorDate);
  if (needsMigration.length > 0) {
    await Promise.all(
      needsMigration.map(async (pill) => {
        const streak = await computeStreak(pill, today, PillLog);
        pill.streak = streak;
        pill.streakAnchorDate = today;
        Pill.findByIdAndUpdate(pill._id, { streak, streakAnchorDate: today }).catch(() => {});
      })
    );
  }

  const result = activePills.map((pill) => {
    // Streak validity check — pure date math, zero extra DB queries
    const lastScheduled = getLastScheduledDateBefore(pill, today);
    const effectiveStreak =
      lastScheduled && lastScheduled > (pill.streakAnchorDate || '')
        ? 0  // missed a scheduled day since last anchor
        : (pill.streak || 0);

    return {
      ...pill,
      doses: pill.reminderHours.map((h) => ({
        scheduledHour: h,
        taken: !!doseMap[`${pill._id}:${h}`],
        takenAt: doseMap[`${pill._id}:${h}`]?.takenAt || null,
      })),
      takenToday: pill.reminderHours.every((h) => !!doseMap[`${pill._id}:${h}`]),
      streak: effectiveStreak,
    };
  });

  res.json({ pills: result });
});

// POST /api/pills — create a new pill
const createPill = asyncHandler(async (req, res) => {
  const {
    name, reminderHours, emailStartHour, emailFrequencyMinutes, emailEndHour, color,
    scheduleType, scheduleInterval, scheduleWeekdays, scheduleMonthDay, scheduleStartDate,
    startDate, endDate,
  } = req.body;

  const today = new Date().toLocaleDateString('en-CA');

  const pill = await Pill.create({
    userId: req.userId,
    name,
    reminderHours,
    emailStartHour: emailStartHour || '09:00',
    emailFrequencyMinutes: emailFrequencyMinutes || 120,
    emailEndHour: emailEndHour || '22:00',
    color: color || '#6366f1',
    scheduleType: scheduleType || 'daily',
    scheduleInterval: scheduleInterval || 1,
    scheduleWeekdays: scheduleWeekdays || [],
    scheduleMonthDay: scheduleMonthDay || 1,
    scheduleStartDate: scheduleStartDate || today,
    startDate: startDate || today,
    endDate: endDate || '',
  });
  res.status(201).json({ pill });
});

// PATCH /api/pills/:id — update pill
const updatePill = asyncHandler(async (req, res) => {
  const scheduleFields = ['scheduleType', 'scheduleWeekdays', 'scheduleInterval', 'scheduleMonthDay', 'scheduleStartDate'];
  const scheduleChanged = scheduleFields.some((f) => f in req.body);

  const updateData = { ...req.body };
  if (scheduleChanged) {
    updateData.streak = 0;
    updateData.streakAnchorDate = '';
  }

  const pill = await Pill.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { $set: updateData },
    { new: true, runValidators: true }
  );
  if (!pill) return res.status(404).json({ message: 'Pill not found' });
  res.json({ pill });
});

// DELETE /api/pills/:id — soft delete (set isActive: false)
const deletePill = asyncHandler(async (req, res) => {
  const pill = await Pill.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { isActive: false },
    { new: true }
  );
  if (!pill) return res.status(404).json({ message: 'Pill not found' });
  res.json({ message: 'Pill removed' });
});

// POST /api/pills/:id/take — mark a specific dose as taken today
const takePill = asyncHandler(async (req, res) => {
  const tz = await getUserTimezone(req.userId);
  const pill = await Pill.findOne({ _id: req.params.id, userId: req.userId, isActive: true });
  if (!pill) return res.status(404).json({ message: 'Pill not found' });

  const now = new Date();
  const today = getTodayDate(tz);

  // Use scheduledHour from body if provided, otherwise compute nearest
  let doseHour = req.body.scheduledHour || '';
  if (!doseHour) {
    const localTimeStr = now.toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
    const [localH, localM] = localTimeStr.split(':').map(Number);
    const currentMinutes = localH * 60 + localM;
    let minDiff = Infinity;
    for (const h of pill.reminderHours) {
      const [hh, mm] = h.split(':').map(Number);
      const diff = Math.abs(hh * 60 + mm - currentMinutes);
      if (diff < minDiff) { minDiff = diff; doseHour = h; }
    }
  }

  const log = await PillLog.findOneAndUpdate(
    { pillId: pill._id, date: today, scheduledHour: doseHour },
    { userId: req.userId, pillId: pill._id, takenAt: now, date: today, scheduledHour: doseHour },
    { upsert: true, new: true }
  );

  // Recompute and cache streak
  const newStreak = await computeStreak(pill, today, PillLog);
  await Pill.findByIdAndUpdate(pill._id, { streak: newStreak, streakAnchorDate: today });

  res.json({ log });
});

// DELETE /api/pills/:id/take — unmark a specific dose taken today
const untakePill = asyncHandler(async (req, res) => {
  const tz = await getUserTimezone(req.userId);
  const today = getTodayDate(tz);
  const { scheduledHour } = req.body;

  const pill = await Pill.findOne({ _id: req.params.id, userId: req.userId });
  if (!pill) return res.status(404).json({ message: 'Pill not found' });

  if (scheduledHour) {
    await PillLog.findOneAndDelete({ pillId: req.params.id, userId: req.userId, date: today, scheduledHour });
  } else {
    await PillLog.deleteMany({ pillId: req.params.id, userId: req.userId, date: today });
  }

  // Recompute and cache streak after untake
  const newStreak = await computeStreak(pill, today, PillLog);
  const newAnchor = newStreak > 0 ? today : (getLastScheduledDateBefore(pill, today) || '');
  await Pill.findByIdAndUpdate(pill._id, { streak: newStreak, streakAnchorDate: newAnchor });

  res.json({ message: 'Unmarked' });
});

// GET /api/pills/:id/history — last 30 days history
const getPillHistory = asyncHandler(async (req, res) => {
  const tz = await getUserTimezone(req.userId);
  const pill = await Pill.findOne({ _id: req.params.id, userId: req.userId });
  if (!pill) return res.status(404).json({ message: 'Pill not found' });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const createdAtDate = new Date(pill.createdAt);
  const startDate = createdAtDate > thirtyDaysAgo ? createdAtDate : thirtyDaysAgo;
  const fromDate = startDate.toLocaleDateString('en-CA', { timeZone: tz });

  const logs = await PillLog.find({
    pillId: pill._id,
    date: { $gte: fromDate },
  })
    .sort({ date: -1, scheduledHour: 1 })
    .lean();

  // Group logs by date
  const logMap = {};
  logs.forEach((l) => {
    if (!logMap[l.date]) logMap[l.date] = [];
    logMap[l.date].push({ takenAt: l.takenAt, scheduledHour: l.scheduledHour });
  });

  const today = new Date();
  const calendar = [];
  const cursor = new Date(today);
  while (true) {
    const dateStr = cursor.toLocaleDateString('en-CA', { timeZone: tz });
    if (dateStr < fromDate) break;
    const dayLogs = logMap[dateStr] || [];
    const scheduled = isScheduledOnDate(pill, dateStr);
    calendar.push({
      date: dateStr,
      scheduled,
      taken: scheduled && dayLogs.length > 0,
      doses: pill.reminderHours.map((h) => {
        const doseLog = dayLogs.find((l) => l.scheduledHour === h);
        return { scheduledHour: h, taken: !!doseLog, takenAt: doseLog?.takenAt || null };
      }),
      // Legacy fields for chart compatibility
      takenAt: dayLogs[0]?.takenAt || null,
      scheduledHour: dayLogs[0]?.scheduledHour || (pill.reminderHours[0] || ''),
    });
    cursor.setDate(cursor.getDate() - 1);
    if (calendar.length > 30) break;
  }

  res.json({ pill, logs: calendar, timezone: tz });
});

// GET /api/pills/inactive — list soft-deleted (isActive: false) pills for the user
const getInactivePills = asyncHandler(async (req, res) => {
  const pills = await Pill.find({ userId: req.userId, isActive: false }).lean();
  res.json({ pills });
});

module.exports = { getPills, createPill, updatePill, deletePill, takePill, untakePill, getPillHistory, getInactivePills };
