const webpush = require('web-push');
const User = require('../models/User');

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY?.replace(/=/g, ''),
  process.env.VAPID_PRIVATE_KEY?.replace(/=/g, '')
);

async function sendPushNotification({ user, pill, scheduledHour }) {
  if (!user.pushSubscriptions?.length) return;

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
