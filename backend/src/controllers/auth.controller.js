const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleSignIn = asyncHandler(async (req, res) => {
  const { idToken, phone, timezone } = req.body;

  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();

  if (!payload?.email_verified) {
    return res.status(401).json({ message: 'Google account email not verified' });
  }

  let user = await User.findOne({ googleId: payload.sub });
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    user = await User.create({
      googleId: payload.sub,
      name: payload.name,
      email: payload.email,
      phone: phone || '',
      timezone: timezone || 'UTC',
    });
  } else {
    user.name = payload.name;
    if (phone && !user.phone) user.phone = phone;
    if (timezone) user.timezone = timezone;
    await user.save();
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      hasResendKey: !!user.resendApiKey,
    },
    token,
    isNewUser,
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId).select('-resendApiKey');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      hasResendKey: !!(await User.findById(req.userId).select('resendApiKey')).resendApiKey,
    },
  });
});

const signOut = (req, res) => {
  res.json({ message: 'Signed out' });
};

module.exports = { googleSignIn, getMe, signOut };
