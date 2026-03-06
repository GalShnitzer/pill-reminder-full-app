require('dotenv').config();
const { validateEnv } = require('./config/env');
validateEnv();

const { connectDB } = require('./config/db');
const app = require('./app');
const { startScheduler } = require('./services/scheduler.service');

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startScheduler();
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
