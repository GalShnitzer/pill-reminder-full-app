const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
    // Drop old unique index (pillId, date) so the new per-dose index can be created
    await mongoose.connection.collection('pilllogs')
      .dropIndex('pillId_1_date_1')
      .catch(() => {}); // silently ignore if already dropped or doesn't exist
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

module.exports = { connectDB };
