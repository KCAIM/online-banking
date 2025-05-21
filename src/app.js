const express = require('express');
const config = require('./config');
const { connectDb } = require('./db');

// Import routes
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const transactionRoutes = require('./routes/transactions');
const messageRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');

const app = express();

// Middleware
app.use(express.json()); // Parse JSON request bodies

// Connect to database
connectDb();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);

// Basic root route (optional)
app.get('/', (req, res) => {
  res.send('Online Banking Backend API');
});

// Error handling middleware (basic example)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Database URL: ${config.databaseUrl}`);
});