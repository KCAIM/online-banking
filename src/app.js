const express = require('express');
const config = require('./config');
const cors = require('cors'); // Import the cors package
const { connectDb } = require('./db');

// Import routes
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const transactionRoutes = require('./routes/transactions');
const messageRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');

const app = express();

// --- CORS Configuration ---
// Define the allowed origin(s) for your frontend
// For production, be specific with your frontend's Render URL
const allowedOrigins = [
  'https://online-banking-frontend.onrender.com', // Your deployed frontend URL
  // Add your local frontend development URL here if needed, e.g.:
  // 'http://localhost:5173', // Vite's default local dev port
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    // and allow origins in the allowedOrigins list
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Specify allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
  credentials: true // Important if your frontend sends cookies or uses Authorization header
};

// Use the cors middleware
app.use(cors(corsOptions));
// --- End CORS Configuration ---

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
  // Check if the error is a CORS error and customize response if needed
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'CORS Error: Access Denied' });
  }
  res.status(500).send('Something broke!');
});

// Start the server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Database URL: ${config.databaseUrl}`);
});