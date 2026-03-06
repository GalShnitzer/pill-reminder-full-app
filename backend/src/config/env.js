const required = ['MONGODB_URI', 'JWT_SECRET', 'ENCRYPTION_KEY', 'GOOGLE_CLIENT_ID'];

function validateEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  if (process.env.ENCRYPTION_KEY.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
}

module.exports = { validateEnv };
