const db = require('../db');

/**
 * Creates a new transaction record.
 * @param {number} accountId - The ID of the account involved.
 * @param {string} type - The type of transaction (e.g., 'deposit', 'withdrawal', 'transfer_out').
 * @param {number} amount - The amount of the transaction (positive for credit, negative for debit).
 * @param {string} description - A description of the transaction.
 * @param {number} [relatedAccountId=null] - The ID of a related account (e.g., for transfers).
 * @param {number} [balanceAfter=null] - The balance of the account after this transaction.
 * @returns {Promise<object>} The created transaction object with camelCase field names.
 */
const createTransaction = async (accountId, type, amount, description, relatedAccountId = null, balanceAfter = null) => {
  const sql = `
    INSERT INTO transactions (account_id, type, amount, description, related_account_id, balance_after, transaction_date)
    VALUES (?, ?, ?, ?, ?, ?, DATETIME('now'))
  `;
  return new Promise((resolve, reject) => {
    db.run(sql, [accountId, type, amount, description, relatedAccountId, balanceAfter], function (err) {
      if (err) {
        console.error('Error creating transaction in model:', err.message);
        return reject(err);
      }
      // Fetch the newly created transaction to return it with all fields, including the auto-generated date
      db.get('SELECT id, account_id, type, amount, description, related_account_id, balance_after, transaction_date FROM transactions WHERE id = ?', [this.lastID], (fetchErr, row) => {
        if (fetchErr) {
          console.error('Error fetching created transaction:', fetchErr.message);
          // Even if fetching fails, the transaction was created.
          // Resolve with what we know, or reject if this fetch is critical.
          return reject(fetchErr);
        }
        if (!row) {
            // Should not happen if insert was successful and this.lastID is valid
            return reject(new Error('Failed to retrieve created transaction.'));
        }
        resolve({
          id: row.id,
          accountId: row.account_id,
          type: row.type,
          amount: row.amount,
          description: row.description,
          relatedAccountId: row.related_account_id,
          balanceAfter: row.balance_after,
          date: row.transaction_date // Mapped to 'date'
        });
      });
    });
  });
};

/**
 * Gets transactions for a specific account.
 * @param {number} accountId - The ID of the account.
 * @returns {Promise<Array<object>>} A list of transaction objects with camelCase field names.
 */
const getTransactionsByAccountId = async (accountId) => {
  const sql = `
    SELECT id, account_id, type, amount, description, related_account_id, balance_after, transaction_date
    FROM transactions
    WHERE account_id = ?
    ORDER BY transaction_date DESC, id DESC
  `;
  try {
    const rows = await db.all(sql, [accountId]);
    return rows.map(row => ({
      id: row.id,
      accountId: row.account_id,
      type: row.type,
      amount: row.amount,
      description: row.description,
      relatedAccountId: row.related_account_id,
      balanceAfter: row.balance_after,
      date: row.transaction_date, // Mapped from transaction_date
      // For direct use by AccountDetailsPage.jsx if it expects snake_case
      transaction_date: row.transaction_date
    }));
  } catch (err) {
    console.error(`Error in getTransactionsByAccountId model for account ${accountId}:`, err);
    throw err;
  }
};

/**
 * Gets all transactions (admin function).
 * Joins with accounts and users tables for more context.
 * @returns {Promise<Array<object>>} A list of all transaction objects with camelCase field names.
 */
const getAllTransactions = async () => {
  const sql = `
    SELECT
      t.id,
      t.account_id,
      a.account_number,
      u.username AS user_username,
      u.full_name AS user_full_name,
      t.type,
      t.amount,
      t.description,
      t.related_account_id,
      t.balance_after,
      t.transaction_date
    FROM transactions t
    LEFT JOIN accounts a ON t.account_id = a.id
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY t.transaction_date DESC, t.id DESC
  `;
  try {
    const rows = await db.all(sql);
    return rows.map(row => ({
      id: row.id,
      accountId: row.account_id,
      accountNumber: row.account_number,
      userUsername: row.user_username,
      userFullName: row.user_full_name,
      type: row.type,
      amount: row.amount,
      description: row.description,
      relatedAccountId: row.related_account_id,
      balanceAfter: row.balance_after,
      date: row.transaction_date // Mapped from transaction_date
    }));
  } catch (err) {
    console.error('Error in getAllTransactions model:', err);
    throw err;
  }
};

module.exports = {
  createTransaction,
  getTransactionsByAccountId,
  getAllTransactions,
};