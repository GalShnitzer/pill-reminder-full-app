const mongoose = require('mongoose');

const pillLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pill', required: true },
    takenAt: { type: Date, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD for daily queries
    scheduledHour: { type: String, default: '' }, // HH:MM nearest scheduled hour
  },
  { timestamps: true }
);

// One log per pill per day (upsert on mark-taken)
pillLogSchema.index({ pillId: 1, date: 1 }, { unique: true });
pillLogSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('PillLog', pillLogSchema);
