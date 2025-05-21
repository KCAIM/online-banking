require('dotenv').config();

module.exports = {
  databaseUrl: process.env.DATABASE_URL || './src/db/online_banking.db',
  jwtSecret: process.env.JWT_SECRET || 'default_secret_key', // Fallback for safety, but .env is preferred
  port: process.env.PORT || 3000,
};