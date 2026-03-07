const twilio = require('twilio');

async function sendPillReminderSms({ user, pill }) {
  const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: token, TWILIO_FROM_NUMBER: from } = process.env;

  if (!sid || !token || !from) {
    console.log('[SMS] Twilio not configured — skipping');
    return { skipped: 'not_configured' };
  }

  if (!user.phone) {
    console.log(`[SMS] No phone number for user ${user.email} — skipping`);
    return { skipped: 'no_phone' };
  }

  const client = twilio(sid, token);
  const hoursDisplay = pill.reminderHours.join(', ');

  try {
    await client.messages.create({
      body: `⏰ Reminder: Take your ${pill.name} (scheduled: ${hoursDisplay}). — PillReminder`,
      from,
      to: user.phone,
    });
    console.log(`[SMS] Sent reminder to ${user.phone} for "${pill.name}"`);
    return { success: true };
  } catch (err) {
    console.error(`[SMS] Failed to send to ${user.phone}:`, err.message);
    return { error: err.message };
  }
}

module.exports = { sendPillReminderSms };
