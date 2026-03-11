const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { encrypt, decrypt } = require('../utils/crypto.utils');
const { sendConnectionTest } = require('../services/email.service');

// GET /api/users/profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId).lean();
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      timezone: user.timezone,
      hasResendKey: !!user.resendApiKey,
    },
  });
});

// PATCH /api/users/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, timezone } = req.body;
  const update = {};
  if (name) update.name = name;
  if (phone !== undefined) update.phone = phone;
  if (timezone) update.timezone = timezone;

  const user = await User.findByIdAndUpdate(req.userId, update, { new: true, runValidators: true });
  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      timezone: user.timezone,
      hasResendKey: !!user.resendApiKey,
    },
  });
});

// PUT /api/users/resend-key
const saveResendKey = asyncHandler(async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
    return res.status(400).json({ message: 'Invalid API key' });
  }

  const encrypted = encrypt(apiKey.trim());
  await User.findByIdAndUpdate(req.userId, { resendApiKey: encrypted });
  res.json({ message: 'Resend API key saved' });
});

// DELETE /api/users/resend-key
const deleteResendKey = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.userId, { resendApiKey: '' });
  res.json({ message: 'Resend API key removed' });
});

// POST /api/users/test-email
const sendTestEmail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId).lean();
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!user.resendApiKey) return res.status(400).json({ message: 'No Resend API key configured' });

  const result = await sendConnectionTest({ user });
  if (result.skipped || result.error) {
    return res.status(500).json({ message: result.error || 'Failed to send email' });
  }
  res.json({ message: 'Test email sent successfully' });
});

// GET /api/users/vapid-public-key
const getVapidPublicKey = asyncHandler(async (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// POST /api/users/push-subscription
const subscribePush = asyncHandler(async (req, res) => {
  const { endpoint, p256dh, auth } = req.body;
  // Remove any existing entry for this endpoint before adding (handles re-subscription)
  await User.findByIdAndUpdate(req.userId, {
    $pull: { pushSubscriptions: { endpoint } },
  });
  await User.findByIdAndUpdate(req.userId, {
    $push: { pushSubscriptions: { endpoint, p256dh, auth } },
  });
  res.json({ message: 'Subscribed to push notifications' });
});

// DELETE /api/users/push-subscription
const unsubscribePush = asyncHandler(async (req, res) => {
  const { endpoint } = req.body;
  await User.findByIdAndUpdate(req.userId, {
    $pull: { pushSubscriptions: { endpoint } },
  });
  res.json({ message: 'Unsubscribed from push notifications' });
});

module.exports = { getProfile, updateProfile, saveResendKey, deleteResendKey, sendTestEmail, getVapidPublicKey, subscribePush, unsubscribePush };
