const db = require('../db');

/**
 * Sends a message to a specific user's inbox (admin function).
 * @param {number} userId - The ID of the recipient user.
 * @param {string} subject - The message subject.
 * @param {string} body - The message body.
 * @returns {Promise<object>} The result of the database insertion.
 */
const sendUserMessage = async (userId, subject, body) => {
  const sql = `INSERT INTO user_messages (user_id, subject, body) VALUES (?, ?, ?)`;
  return db.run(sql, [userId, subject, body]);
};

/**
 * Gets messages for a specific user's inbox.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<Array<object>>} A list of user message objects.
 */
const getUserMessages = async (userId) => {
  const sql = `SELECT * FROM user_messages WHERE user_id = ? ORDER BY sent_at DESC`;
  return db.all(sql, [userId]);
};

/**
 * Marks a user message as read.
 * @param {number} messageId - The ID of the message to mark.
 * @param {number} userId - The ID of the user (to ensure they own the message).
 * @returns {Promise<object>} The result of the database update.
 */
const markUserMessageAsRead = async (messageId, userId) => {
  const sql = `UPDATE user_messages SET is_read = 1 WHERE id = ? AND user_id = ?`;
  return db.run(sql, [messageId, userId]);
};

/**
 * Creates a new flash message (admin function).
 * @param {string} message - The flash message text.
 * @param {string} [expiresAt=null] - Optional expiration date string (e.g., 'YYYY-MM-DD HH:MM:SS').
 * @returns {Promise<object>} The result of the database insertion.
 */
const createFlashMessage = async (message, expiresAt = null) => {
  const sql = `INSERT INTO flash_messages (message, expires_at) VALUES (?, ?)`;
  return db.run(sql, [message, expiresAt]);
};

/**
 * Gets all active flash messages.
 * @returns {Promise<Array<object>>} A list of active flash message objects.
 */
const getActiveFlashMessages = async () => {
  // Filter by is_active and optionally expires_at
  const sql = `
    SELECT * FROM flash_messages
    WHERE is_active = 1 AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    ORDER BY created_at DESC
  `;
  return db.all(sql);
};

/**
 * Deactivates a flash message by ID (admin function).
 * @param {number} messageId - The ID of the flash message to deactivate.
 * @returns {Promise<object>} The result of the database update.
 */
const deactivateFlashMessage = async (messageId) => {
  const sql = `UPDATE flash_messages SET is_active = 0 WHERE id = ?`;
  return db.run(sql, [messageId]);
};

module.exports = {
  sendUserMessage,
  getUserMessages,
  markUserMessageAsRead,
  createFlashMessage,
  getActiveFlashMessages,
  deactivateFlashMessage,
};