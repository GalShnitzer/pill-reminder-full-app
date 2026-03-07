const { Resend } = require('resend');
const { decrypt } = require('../utils/crypto.utils');

async function sendPillReminder({ user, pill }) {
  if (!user.resendApiKey) {
    console.log(`[Email] No Resend API key for user ${user.email} — skipping`);
    return { skipped: true };
  }

  let apiKey;
  try {
    apiKey = decrypt(user.resendApiKey);
  } catch {
    console.error(`[Email] Failed to decrypt API key for user ${user.email}`);
    return { error: 'decryption_failed' };
  }

  const resend = new Resend(apiKey);
  const hoursDisplay = pill.reminderHours.join(', ');
  const appUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  try {
    const result = await resend.emails.send({
      from: 'Pill Reminder <onboarding@resend.dev>',
      to: user.email,
      subject: `⏰ Reminder: Take your ${pill.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px 24px; background: #f9fafb; border-radius: 12px;">
          <div style="background: #ffffff; border-radius: 10px; padding: 28px; border: 1px solid #e5e7eb;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
              <span style="font-size: 28px;">💊</span>
              <h2 style="margin: 0; color: #4f46e5; font-size: 20px;">Pill Reminder</h2>
            </div>

            <p style="margin: 0 0 12px; color: #111827; font-size: 16px;">
              Hi <strong>${user.name}</strong>,
            </p>
            <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
              This is a reminder to take your <strong style="color: #4f46e5;">${pill.name}</strong>.
            </p>

            <div style="background: #f3f4f6; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
              <p style="margin: 0; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Scheduled times</p>
              <p style="margin: 4px 0 0; color: #111827; font-size: 15px; font-weight: 500;">${hoursDisplay}</p>
            </div>

            <a href="${appUrl}" style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">
              Open Pill Reminder →
            </a>
          </div>

          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
            You're receiving this because you set up reminders in
            <a href="${appUrl}" style="color: #6366f1; text-decoration: none;">PillReminder</a>.
          </p>
        </div>
      `,
    });
    console.log(`[Email] Sent reminder to ${user.email} for pill "${pill.name}"`);
    return { success: true, id: result.id };
  } catch (err) {
    console.error(`[Email] Failed to send to ${user.email}:`, err.message);
    return { error: err.message };
  }
}

async function sendConnectionTest({ user }) {
  if (!user.resendApiKey) return { skipped: true };

  let apiKey;
  try {
    apiKey = decrypt(user.resendApiKey);
  } catch {
    return { error: 'decryption_failed' };
  }

  const resend = new Resend(apiKey);
  const appUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  try {
    await resend.emails.send({
      from: 'Pill Reminder <onboarding@resend.dev>',
      to: user.email,
      subject: '✅ Your email is connected to PillReminder!',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px 24px; background: #f9fafb; border-radius: 12px;">
          <div style="background: #ffffff; border-radius: 10px; padding: 28px; border: 1px solid #e5e7eb;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
              <span style="font-size: 28px;">💊</span>
              <h2 style="margin: 0; color: #4f46e5; font-size: 20px;">PillReminder</h2>
            </div>

            <p style="margin: 0 0 12px; color: #111827; font-size: 16px;">
              Hi <strong>${user.name}</strong>,
            </p>
            <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
              Your email is successfully connected to <strong style="color: #4f46e5;">PillReminder</strong>!
              You'll now receive reminders whenever it's time to take your pills.
            </p>

            <a href="${appUrl}" style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">
              Start using PillReminder →
            </a>
          </div>

          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
            <a href="${appUrl}" style="color: #6366f1; text-decoration: none;">PillReminder</a> — Never miss a dose again.
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

module.exports = { sendPillReminder, sendConnectionTest };
