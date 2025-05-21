const db = require('../db');

/**
 * Gets all admin settings.
 * @returns {Promise<Array<object>>} A list of all settings.
 */
const getAllSettings = async () => {
  const sql = `SELECT * FROM admin_settings`;
  return db.all(sql);
};

/**
 * Gets a specific setting by name.
 * @param {string} name - The name of the setting.
 * @returns {Promise<object|undefined>} The setting object or undefined.
 */
const getSetting = async (name) => {
  const sql = `SELECT * FROM admin_settings WHERE setting_name = ?`;
  return db.get(sql, [name]);
};

/**
 * Updates a specific setting by name (admin function).
 * @param {string} name - The name of the setting.
 * @param {boolean} value - The new boolean value for the setting.
 * @returns {Promise<object>} The result of the database update.
 */
const updateSetting = async (name, value) => {
  const sql = `UPDATE admin_settings SET setting_value = ? WHERE setting_name = ?`;
  return db.run(sql, [value ? 1 : 0, name]);
};

module.exports = {
  getAllSettings,
  getSetting,
  updateSetting,
};