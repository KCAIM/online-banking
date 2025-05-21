const { verifyToken } = require('../utils/auth');
const userModel = require('../models/user');

/**
 * Middleware to authenticate requests using JWT.
 * Attaches the user object to the request if authentication is successful.
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    return res.sendStatus(401); // No token provided
  }

  const payload = verifyToken(token);

  if (!payload) {
    return res.sendStatus(403); // Invalid or expired token
  }

  // Fetch the user from the database to ensure they still exist and get current info
  const user = await userModel.findUserById(payload.id);

  if (!user) {
    return res.sendStatus(404); // User not found (maybe deleted)
  }

  req.user = user; // Attach user object to request
  next();
};

/**
 * Middleware to check if the authenticated user is an admin.
 */
const authorizeAdmin = (req, res, next) => {
  if (!req.user || !req.user.is_admin) {
    return res.sendStatus(403); // Forbidden - not an admin
  }
  next();
};

module.exports = {
  authenticate,
  authorizeAdmin,
};