const cron = require('node-cron');
const Pill = require('../models/Pill');
const PillLog = require('../models/PillLog');
const User = require('../models/User');
const { sendPillReminder } = require('./email.service');
const { sendPillReminderSms } = require('./sms.service');

// Returns true if the pill should be active on the given date string (YYYY-MM-DD)
function isScheduledToday(pill, dateStr) {
  const type = pill.scheduleType || 'daily';
  if (type === 'daily') return true;

  const date = new Date(dateStr + 'T12:00:00'); // noon avoids DST edge cases
  if (type === 'weekly') {
    return (pill.scheduleWeekdays || []).includes(date.getDay());
  }
  if (type === 'monthly') {
    return date.getDate() === pill.scheduleMonthDay;
  }
  if (type === 'every_n_days') {
    if (!pill.scheduleStartDate) return true;
    const start = new Date(pill.scheduleStartDate + 'T12:00:00');
    const diffDays = Math.round((date - start) / 86400000);
    return diffDays >= 0 && diffDays % (pill.scheduleInterval || 1) === 0;
  }
  return true;
}

// Runs every 15 minutes
function startScheduler() {
  cron.schedule('*/15 * * * *', async () => {
    await checkAndSendReminders();
  });
  console.log('[Scheduler] Started — running every 15 minutes');
}

async function checkAndSendReminders() {
  const now = new Date();

  try {
    const activePills = await Pill.find({ isActive: true }).lean();

    for (const pill of activePills) {
      try {
        const user = await User.findById(pill.userId).lean();
        if (!user) continue;

        const timezone = user.timezone || 'Asia/Jerusalem';
        const today = now.toLocaleDateString('en-CA', { timeZone: timezone });

        // Skip if this pill isn't scheduled for today
        if (!isScheduledToday(pill, today)) continue;

        const localTime = now.toLocaleTimeString('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit' });
        const [currentHour, currentMinute] = localTime.split(':').map(Number);
        const currentTotalMinutes = currentHour * 60 + currentMinute;

        // Check email window constraints
        const [startH, startM] = pill.emailStartHour.split(':').map(Number);
        const [endH, endM] = pill.emailEndHour.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        if (currentTotalMinutes < startMinutes || currentTotalMinutes > endMinutes) continue;

        // Check each reminder hour individually (per-dose logging)
        for (const h of pill.reminderHours) {
          const [hh, mm] = h.split(':').map(Number);
          const scheduledMinutes = hh * 60 + mm;

          // Is this dose within the current 15-min trigger window?
          const inWindow = Math.abs(scheduledMinutes - currentTotalMinutes) <= 15;

          // Is this a follow-up window for this dose?
          const minutesSinceDose = currentTotalMinutes - scheduledMinutes;
          const isFollowUp =
            minutesSinceDose > 0 &&
            minutesSinceDose % pill.emailFrequencyMinutes < 15;

          if (!inWindow && !isFollowUp) continue;

          // Check if this specific dose was already taken today
          const doseTaken = await PillLog.findOne({ pillId: pill._id, date: today, scheduledHour: h }).lean();
          if (doseTaken) continue;

          const channels = pill.reminderChannels?.length ? pill.reminderChannels : ['email'];
          if (channels.includes('email')) await sendPillReminder({ user, pill });
          if (channels.includes('sms'))   await sendPillReminderSms({ user, pill });
          break; // send at most one reminder per cron tick per pill
        }
      } catch (err) {
        console.error(`[Scheduler] Error processing pill ${pill._id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[Scheduler] Fatal error:', err.message);
  }
}

module.exports = { startScheduler };
