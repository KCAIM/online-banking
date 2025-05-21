const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generates a JWT token for a user.
 * @param {object} user - The user object (should contain id and isAdmin).
 * @returns {string} The generated JWT token.
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    isAdmin: user.is_admin,
  };
  // Token expires in 1 hour (adjust as needed)
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' });
};

/**
 * Verifies a JWT token.
 * @param {string} token - The JWT token.
 * @returns {object|null} The decoded payload if valid, null otherwise.
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (err) {
    return null; // Token is invalid or expired
  }
};

module.exports = {
  generateToken,
  verifyToken,
};