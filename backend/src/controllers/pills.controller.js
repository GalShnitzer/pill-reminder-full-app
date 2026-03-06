const Pill = require('../models/Pill');
const PillLog = require('../models/PillLog');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const getTodayDate = (timezone = 'UTC') => {
  return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
};

async function getUserTimezone(userId) {
  const user = await User.findById(userId).select('timezone').lean();
  return user?.timezone || 'UTC';
}

// GET /api/pills — list active pills with today's taken status
const getPills = asyncHandler(async (req, res) => {
  const tz = await getUserTimezone(req.userId);
  const pills = await Pill.find({ userId: req.userId, isActive: true }).lean();
  const today = getTodayDate(tz);

  const logs = await PillLog.find({
    userId: req.userId,
    date: today,
    pillId: { $in: pills.map((p) => p._id) },
  }).lean();

  const takenMap = {};
  logs.forEach((log) => {
    takenMap[log.pillId.toString()] = log.takenAt;
  });

  const result = pills.map((pill) => ({
    ...pill,
    takenToday: !!takenMap[pill._id.toString()],
    takenAt: takenMap[pill._id.toString()] || null,
  }));

  res.json({ pills: result });
});

// POST /api/pills — create a new pill
const createPill = asyncHandler(async (req, res) => {
  const { name, reminderHours, emailStartHour, emailFrequencyMinutes, emailEndHour, color } = req.body;
  const pill = await Pill.create({
    userId: req.userId,
    name,
    reminderHours,
    emailStartHour: emailStartHour || '09:00',
    emailFrequencyMinutes: emailFrequencyMinutes || 120,
    emailEndHour: emailEndHour || '22:00',
    color: color || '#6366f1',
  });
  res.status(201).json({ pill });
});

// PATCH /api/pills/:id — update pill
const updatePill = asyncHandler(async (req, res) => {
  const pill = await Pill.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { $set: req.body },
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

// POST /api/pills/:id/take — mark pill as taken today
const takePill = asyncHandler(async (req, res) => {
  const tz = await getUserTimezone(req.userId);
  const pill = await Pill.findOne({ _id: req.params.id, userId: req.userId, isActive: true });
  if (!pill) return res.status(404).json({ message: 'Pill not found' });

  const now = new Date();
  const today = getTodayDate(tz);

  // Current local time in user's timezone
  const localTimeStr = now.toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
  const [localH, localM] = localTimeStr.split(':').map(Number);
  const currentMinutes = localH * 60 + localM;
  let nearestHour = '';
  let minDiff = Infinity;
  for (const h of pill.reminderHours) {
    const [hh, mm] = h.split(':').map(Number);
    const diff = Math.abs(hh * 60 + mm - currentMinutes);
    if (diff < minDiff) {
      minDiff = diff;
      nearestHour = h;
    }
  }

  const log = await PillLog.findOneAndUpdate(
    { pillId: pill._id, date: today },
    { userId: req.userId, pillId: pill._id, takenAt: now, date: today, scheduledHour: nearestHour },
    { upsert: true, new: true }
  );

  res.json({ log });
});

// DELETE /api/pills/:id/take — unmark pill taken today
const untakePill = asyncHandler(async (req, res) => {
  const tz = await getUserTimezone(req.userId);
  const today = getTodayDate(tz);
  await PillLog.findOneAndDelete({ pillId: req.params.id, userId: req.userId, date: today });
  res.json({ message: 'Unmarked' });
});

// GET /api/pills/:id/history — last 30 days history
const getPillHistory = asyncHandler(async (req, res) => {
  const tz = await getUserTimezone(req.userId);
  const pill = await Pill.findOne({ _id: req.params.id, userId: req.userId });
  if (!pill) return res.status(404).json({ message: 'Pill not found' });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Never go further back than when the pill was actually created
  const createdAtDate = new Date(pill.createdAt);
  const startDate = createdAtDate > thirtyDaysAgo ? createdAtDate : thirtyDaysAgo;
  const fromDate = startDate.toLocaleDateString('en-CA', { timeZone: tz });

  const logs = await PillLog.find({
    pillId: pill._id,
    date: { $gte: fromDate },
  })
    .sort({ date: -1 })
    .lean();

  const logMap = {};
  logs.forEach((l) => {
    logMap[l.date] = { takenAt: l.takenAt, scheduledHour: l.scheduledHour };
  });

  // Build calendar only from pill creation date (or 30 days ago) up to today
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-CA', { timeZone: tz });
  const calendar = [];
  const cursor = new Date(today);
  while (true) {
    const dateStr = cursor.toLocaleDateString('en-CA', { timeZone: tz });
    if (dateStr < fromDate) break;
    calendar.push({
      date: dateStr,
      taken: !!logMap[dateStr],
      takenAt: logMap[dateStr]?.takenAt || null,
      scheduledHour: logMap[dateStr]?.scheduledHour || (pill.reminderHours[0] || ''),
    });
    cursor.setDate(cursor.getDate() - 1);
    if (calendar.length > 30) break; // safety cap
  }

  res.json({ pill, logs: calendar, timezone: tz });
});

module.exports = { getPills, createPill, updatePill, deletePill, takePill, untakePill, getPillHistory };
