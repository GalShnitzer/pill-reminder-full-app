const mongoose = require('mongoose');

const pillSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    reminderHours: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0 && arr.every((h) => /^\d{2}:\d{2}$/.test(h)),
        message: 'reminderHours must be non-empty array of HH:MM strings',
      },
    },
    emailStartHour: { type: String, default: '09:00' },
    emailFrequencyMinutes: { type: Number, default: 120, min: 15 },
    emailEndHour: { type: String, default: '22:00' },
    color: { type: String, default: '#6366f1' },
    isActive: { type: Boolean, default: true },
    scheduleType: { type: String, enum: ['daily', 'every_n_days', 'weekly', 'monthly'], default: 'daily' },
    scheduleInterval: { type: Number, default: 1, min: 1, max: 365 },
    scheduleWeekdays: { type: [Number], default: [] }, // 0=Sun ... 6=Sat
    scheduleMonthDay: { type: Number, min: 1, max: 31, default: 1 },
    scheduleStartDate: { type: String, default: '' }, // YYYY-MM-DD, used by every_n_days
    reminderChannels: { type: [String], default: ['email'] }, // 'email', 'sms'
  },
  { timestamps: true }
);

pillSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('Pill', pillSchema);
