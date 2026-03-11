const webpush = require('web-push');
const User = require('../models/User');

const cleanKey = (k) => k?.replace(/[\s=]/g, '') || null;
const vapidPublicKey = cleanKey(process.env.VAPID_PUBLIC_KEY);
const vapidPrivateKey = cleanKey(process.env.VAPID_PRIVATE_KEY);
const vapidSubject = process.env.VAPID_SUBJECT?.trim() || null;

if (vapidPublicKey && vapidPrivateKey && vapidSubject) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} else {
  console.warn('[push] VAPID keys not configured — push notifications disabled');
}

async function sendPushNotification({ user, pill, scheduledHour }) {
  if (!user.pushSubscriptions?.length) {
    console.log(`[Push] user ${user._id}: no subscriptions — skipping`);
    return;
  }
  console.log(`[Push] user ${user._id}: sending to ${user.pushSubscriptions.length} subscription(s)`);

  const payload = JSON.stringify({
    title: '💊 Pill Reminder',
    body: `Time to take your ${pill.name} (${scheduledHour})`,
    url: '/',
  });

  const results = await Promise.allSettled(
    user.pushSubscriptions.map((sub) => webpush.sendNotification(sub, payload))
  );

  // Remove subscriptions that the browser reported as expired/invalid (410 Gone)
  const expiredEndpoints = [];
  results.forEach((r, i) => {
    if (r.status === 'rejected' && r.reason?.statusCode === 410) {
      expiredEndpoints.push(user.pushSubscriptions[i].endpoint);
    }
  });
  if (expiredEndpoints.length > 0) {
    await User.findByIdAndUpdate(user._id, {
      $pull: { pushSubscriptions: { endpoint: { $in: expiredEndpoints } } },
    });
  }
}

module.exports = { sendPushNotification };
