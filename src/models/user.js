const db = require('../db');
const bcrypt = require('bcrypt');

const saltRounds = 10; // For bcrypt hashing

/**
 * Hashes a password.
 * @param {string} password - The plain text password.
 * @returns {Promise<string>} The hashed password.
 */
const hashPassword = async (password) => {
  return bcrypt.hash(password, saltRounds);
};

/**
 * Compares a plain text password with a hashed password.
 * @param {string} password - The plain text password.
 * @param {string} hash - The hashed password from the database.
 * @returns {Promise<boolean>} True if passwords match, false otherwise.
 */
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Creates a new user.
 * @param {string} username - The username.
 * @param {string} password - The plain text password.
 * @param {object} [details={}] - Optional details object including email, fullName, is_admin, is_active.
 * @returns {Promise<object>} The created user object (excluding password).
 */
const createUser = async (username, password, details = {}) => {
  const hashedPassword = await hashPassword(password);
  const {
    email = null,
    fullName = null,
    is_admin = false,
    is_active = true // New users are active by default
  } = details;

  // Adjust 'fullName' to 'full_name' if that's your database column name
  const dbFullName = fullName;

  const sql = `
    INSERT INTO users (username, password, email, full_name, is_admin, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const params = [username, hashedPassword, email, dbFullName, is_admin ? 1 : 0, is_active ? 1 : 0];

  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        console.error('Error creating user in model:', err.message);
        return reject(err);
      }
      // Resolve with the structure expected by the frontend (camelCase fullName, boolean flags)
      resolve({
        id: this.lastID,
        username,
        email,
        fullName: dbFullName, // This is already correct as per input `fullName`
        is_admin: Boolean(is_admin), // Ensure boolean
        is_active: Boolean(is_active)  // Ensure boolean
      });
    });
  });
};

/**
 * Finds a user by username.
 * @param {string} username - The username to find.
 * @returns {Promise<object|undefined>} The user object or undefined if not found.
 */
const findUserByUsername = async (username) => {
  const sql = `SELECT * FROM users WHERE username = ?`;
  const user = await db.get(sql, [username]);
  if (user) {
    // Map full_name to fullName for consistency and ensure boolean types
    user.fullName = user.full_name;
    delete user.full_name;
    user.is_admin = Boolean(user.is_admin);
    user.is_active = Boolean(user.is_active);
  }
  return user;
};

/**
 * Finds a user by ID.
 * @param {number} id - The user ID to find.
 * @returns {Promise<object|undefined>} The user object or undefined if not found.
 */
const findUserById = async (id) => {
  const sql = `SELECT * FROM users WHERE id = ?`;
  const user = await db.get(sql, [id]);
  if (user) {
    // Map full_name to fullName for consistency and ensure boolean types
    user.fullName = user.full_name;
    // Only delete if full_name exists, to avoid issues if schema is different or already mapped
    if (user.hasOwnProperty('full_name')) {
        delete user.full_name;
    }
    user.is_admin = Boolean(user.is_admin);
    user.is_active = Boolean(user.is_active);
  }
  return user;
};

/**
 * Gets all users (admin function).
 * @returns {Promise<Array<object>>} A list of all user objects.
 */
const getAllUsers = async () => {
  const sql = `SELECT id, username, email, full_name, is_admin, is_active, created_at FROM users`;
  const users = await db.all(sql);
  // Map full_name to fullName for consistency and ensure boolean types for each user
  return users.map(user => {
    const { full_name, password, ...rest } = user; // Exclude password explicitly if it were selected
    return {
      ...rest,
      fullName: full_name,
      is_admin: Boolean(user.is_admin),
      is_active: Boolean(user.is_active)
    };
  });
};

/**
 * Updates a user's details by ID.
 * @param {number} userId - The ID of the user to update.
 * @param {object} updateData - An object containing fields to update.
 * @returns {Promise<object|null>} The updated user object or null if not found/not changed.
 */
const updateUserById = async (userId, updateData) => {
  const fieldsToUpdate = [];
  const params = [];

  if (updateData.hasOwnProperty('username')) {
    fieldsToUpdate.push('username = ?');
    params.push(updateData.username);
  }
  if (updateData.hasOwnProperty('email')) {
    fieldsToUpdate.push('email = ?');
    params.push(updateData.email);
  }
  if (updateData.hasOwnProperty('fullName')) {
    // Adjust 'full_name' if your database column is different
    fieldsToUpdate.push('full_name = ?');
    params.push(updateData.fullName);
  }
  if (updateData.hasOwnProperty('is_admin')) {
    fieldsToUpdate.push('is_admin = ?');
    params.push(Boolean(updateData.is_admin) ? 1 : 0);
  }
  if (updateData.hasOwnProperty('is_active')) {
    fieldsToUpdate.push('is_active = ?');
    params.push(Boolean(updateData.is_active) ? 1 : 0);
  }

  if (fieldsToUpdate.length === 0) {
    console.warn('updateUserById called with no fields to update for userId:', userId);
    return findUserById(userId); // Return current user data if no updates
  }

  params.push(userId);

  const sql = `
    UPDATE users
    SET ${fieldsToUpdate.join(', ')}
    WHERE id = ?
  `;

  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        console.error(`Error updating user ${userId} in model:`, err.message);
        return reject(err);
      }
      if (this.changes === 0) {
        // No rows were updated, could mean user not found or data was the same
        // Fetch current user data to return in this case as well, or handle as an error
        return findUserById(userId).then(resolve).catch(reject);
      }
      // Fetch and return the updated user to confirm changes
      findUserById(userId).then(resolve).catch(reject);
    });
  });
};

/**
 * Updates a user's admin status (admin function).
 * @param {number} userId - The ID of the user to update.
 * @param {boolean} isAdmin - The new admin status.
 * @returns {Promise<object>} The result of the database update.
 */
const updateUserAdminStatus = async (userId, isAdmin) => {
  const sql = `UPDATE users SET is_admin = ? WHERE id = ?`;
  // This method might become redundant if updateUserById is always used.
  // For now, let's make it also return the updated user for consistency.
  return new Promise((resolve, reject) => {
    db.run(sql, [isAdmin ? 1 : 0, userId], function(err) {
        if (err) {
            console.error(`Error updating admin status for user ${userId}:`, err.message);
            return reject(err);
        }
        if (this.changes === 0) {
            return findUserById(userId).then(resolve).catch(reject); // User not found or status was already set
        }
        findUserById(userId).then(resolve).catch(reject);
    });
  });
};


module.exports = {
  hashPassword,
  comparePassword,
  createUser,
  findUserByUsername,
  findUserById,
  getAllUsers,
  updateUserAdminStatus,
  updateUserById,
};