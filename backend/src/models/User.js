const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    resendApiKey: { type: String, default: '' }, // AES-256-GCM encrypted
    timezone: { type: String, default: 'Asia/Jerusalem' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
