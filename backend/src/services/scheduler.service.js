const cron = require('node-cron');
const Pill = require('../models/Pill');
const PillLog = require('../models/PillLog');
const User = require('../models/User');
const { sendPillReminder } = require('./email.service');
const { isScheduledOnDate } = require('../utils/scheduleUtils');

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
    console.log(`[Scheduler] Tick — ${activePills.length} active pill(s)`);

    for (const pill of activePills) {
      try {
        const user = await User.findById(pill.userId).lean();
        if (!user) {
          console.log(`[Scheduler] "${pill.name}": no user found — skipping`);
          continue;
        }

        const timezone = user.timezone || 'Asia/Jerusalem';
        const today = now.toLocaleDateString('en-CA', { timeZone: timezone });

        // Skip if pill hasn't started yet or has already ended
        if (pill.startDate && today < pill.startDate) {
          console.log(`[Scheduler] "${pill.name}": before start date (${pill.startDate}) — skipping`);
          continue;
        }
        if (pill.endDate && today > pill.endDate) {
          console.log(`[Scheduler] "${pill.name}": past end date (${pill.endDate}) — skipping`);
          continue;
        }

        // Skip if this pill isn't scheduled for today
        if (!isScheduledOnDate(pill, today)) {
          console.log(`[Scheduler] "${pill.name}": not scheduled today (${pill.scheduleType}) — skipping`);
          continue;
        }

        const localTime = now.toLocaleTimeString('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit' });
        const [currentHour, currentMinute] = localTime.split(':').map(Number);
        const currentTotalMinutes = currentHour * 60 + currentMinute;

        // Check email window constraints (null-safe defaults)
        const emailStart = pill.emailStartHour || '09:00';
        const emailEnd = pill.emailEndHour || '22:00';
        const [startH, startM] = emailStart.split(':').map(Number);
        const [endH, endM] = emailEnd.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        if (currentTotalMinutes < startMinutes || currentTotalMinutes > endMinutes) {
          console.log(`[Scheduler] "${pill.name}": outside email window (${emailStart}–${emailEnd}, now=${localTime}) — skipping`);
          continue;
        }

        // Check each reminder hour individually (per-dose logging)
        let sentForPill = false;
        for (const h of pill.reminderHours) {
          const [hh, mm] = h.split(':').map(Number);
          const scheduledMinutes = hh * 60 + mm;

          // Minutes elapsed since the scheduled dose time (negative = not yet reached)
          const minutesSinceDose = currentTotalMinutes - scheduledMinutes;

          // Initial trigger: only fire in the [0, 15) window after the scheduled time
          const inWindow = minutesSinceDose >= 0 && minutesSinceDose < 15;

          // Follow-up: re-send every emailFrequencyMinutes after the initial window
          const isFollowUp =
            minutesSinceDose >= 15 &&
            minutesSinceDose % pill.emailFrequencyMinutes < 15;

          console.log(`[Scheduler] "${pill.name}" dose ${h}: offset=${minutesSinceDose}min inWindow=${inWindow} isFollowUp=${isFollowUp}`);

          if (!inWindow && !isFollowUp) continue;

          // Check if this specific dose was already taken today
          const doseTaken = await PillLog.findOne({ pillId: pill._id, date: today, scheduledHour: h }).lean();
          if (doseTaken) {
            console.log(`[Scheduler] "${pill.name}" dose ${h}: already taken — skipping`);
            continue;
          }

          await sendPillReminder({ user, pill });
          sentForPill = true;
          break; // send at most one reminder per cron tick per pill
        }

        if (!sentForPill) {
          console.log(`[Scheduler] "${pill.name}": no reminder sent this tick`);
        }
      } catch (err) {
        console.error(`[Scheduler] Error processing pill "${pill.name}" (${pill._id}):`, err.message);
      }
    }
  } catch (err) {
    console.error('[Scheduler] Fatal error:', err.message);
  }
}

module.exports = { startScheduler };
