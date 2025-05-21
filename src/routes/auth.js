const express = require('express');
const router = express.Router();
const userModel = require('../models/user');
const { generateToken } = require('../utils/auth');
const { authenticate } = require('../middleware/auth');

// POST /api/signup
// Register a new user
router.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // Check if user already exists
    const existingUser = await userModel.findUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    // Create the user - assuming createUser now handles default is_active: true
    // and other potential fields if passed in an options object.
    // For a basic signup, only username and password are provided here.
    await userModel.createUser(username, password);

    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Error creating user' });
  }
});

// POST /api/login
// Authenticate a user and return a JWT
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // Find the user
    const user = await userModel.findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if the account is active
    if (!user.is_active) {
      return res.status(403).json({ message: 'Account is disabled. Please contact support.' });
    }

    // Compare password
    const isMatch = await userModel.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = generateToken(user); // generateToken expects user.id and user.is_admin

    // Respond with token and minimal user info
    res.json({
        token,
        user: {
            id: user.id,
            username: user.username,
            is_admin: user.is_admin,
            // It's good practice to also return isActive status if frontend needs it immediately
            isActive: user.is_active
        },
        message: 'Login successful'
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// GET /api/user
// Get authenticated user's details
router.get('/user', authenticate, (req, res) => {
  // req.user is populated by the authenticate middleware
  // Exclude sensitive info like password
  const userDetails = {
    id: req.user.id,
    username: req.user.username,
    isAdmin: req.user.is_admin, // This comes from the token payload or db lookup
    isActive: req.user.is_active, // Ensure this is available on req.user
    createdAt: req.user.created_at,
    // Add other non-sensitive fields as needed, like email, fullName
    email: req.user.email,
    fullName: req.user.fullName
  };
  res.json(userDetails);
});

// POST /api/logout
// Client-side should just discard the token. This endpoint is optional
// but could be used for server-side token invalidation if needed (more complex).
// For JWT, typically logout is handled purely client-side by removing the token.
router.post('/logout', (req, res) => {
    // If using server-side sessions, clear session here.
    // For JWT, just acknowledge. Client discards the token.
    res.json({ message: 'Logout successful (client should discard token)' });
});

module.exports = router;