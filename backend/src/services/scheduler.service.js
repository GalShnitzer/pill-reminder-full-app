const cron = require('node-cron');
const Pill = require('../models/Pill');
const PillLog = require('../models/PillLog');
const User = require('../models/User');
const { sendPillReminder } = require('./email.service');

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
        // Get user's timezone for today's date
        const user = await User.findById(pill.userId).lean();
        if (!user) continue;

        const timezone = user.timezone || 'Asia/Jerusalem';
        const today = now.toLocaleDateString('en-CA', { timeZone: timezone });

        // Use user's local time for hour/minute comparison
        const localTime = now.toLocaleTimeString('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit' });
        const [currentHour, currentMinute] = localTime.split(':').map(Number);
        const currentTotalMinutes = currentHour * 60 + currentMinute;

        // Check if pill already taken today
        const alreadyTaken = await PillLog.findOne({ pillId: pill._id, date: today });
        if (alreadyTaken) continue;

        // Check email window constraints
        const [startH, startM] = pill.emailStartHour.split(':').map(Number);
        const [endH, endM] = pill.emailEndHour.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        if (currentTotalMinutes < startMinutes || currentTotalMinutes > endMinutes) continue;

        // Check if any reminder hour falls in the current 15-min window
        // OR if it's a frequency follow-up window
        const shouldSend = pill.reminderHours.some((h) => {
          const [hh, mm] = h.split(':').map(Number);
          const scheduledMinutes = hh * 60 + mm;
          // First reminder: within 15 min of scheduled time
          if (Math.abs(scheduledMinutes - currentTotalMinutes) <= 15) return true;
          return false;
        });

        // Frequency follow-up: after start, every frequencyMinutes, if within window
        const minutesSinceStart = currentTotalMinutes - startMinutes;
        const isFollowUpWindow =
          minutesSinceStart > 0 &&
          minutesSinceStart % pill.emailFrequencyMinutes < 15;

        // Only send if a reminder hour triggered OR it's a follow-up
        const firstReminderPassed = pill.reminderHours.some((h) => {
          const [hh, mm] = h.split(':').map(Number);
          return hh * 60 + mm <= currentTotalMinutes;
        });

        if (!shouldSend && !(isFollowUpWindow && firstReminderPassed)) continue;

        await sendPillReminder({ user, pill });
      } catch (err) {
        console.error(`[Scheduler] Error processing pill ${pill._id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[Scheduler] Fatal error:', err.message);
  }
}

module.exports = { startScheduler };
