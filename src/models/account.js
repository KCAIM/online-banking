const db = require('../db');
const { generateAccountNumber } = require('../utils/account'); // We'll create this utility

/**
 * Creates a new account for a user.
 * @param {number} userId - The ID of the user.
 * @param {string} accountType - The type of account (e.g., 'checking', 'savings').
 * @param {number} [initialBalance=0.0] - The initial balance.
 * @returns {Promise<object>} The created account object.
 */
const createAccount = async (userId, accountType, initialBalance = 0.0) => {
  const accountNumber = generateAccountNumber(); // Generate a unique number
  // New accounts have transfers enabled by default
  const transfersEnabled = true;
  const sql = `
    INSERT INTO accounts (user_id, account_number, account_type, balance, transfers_enabled)
    VALUES (?, ?, ?, ?, ?)
  `;
  // For SQLite, db.run callback provides this.lastID for the rowid of the last inserted row
  return new Promise((resolve, reject) => {
    db.run(sql, [userId, accountNumber, accountType, initialBalance, transfersEnabled ? 1 : 0], function (err) {
      if (err) {
        console.error('Error creating account in model:', err.message);
        return reject(err);
      }
      // Fetch the newly created account to include created_at and ensure consistent field naming
      db.get('SELECT id, user_id, account_number, account_type, balance, transfers_enabled, created_at FROM accounts WHERE id = ?', [this.lastID], (fetchErr, row) => {
        if (fetchErr) {
          console.error('Error fetching created account:', fetchErr.message);
          // Even if fetching fails, the transaction was created.
          // Resolve with what we know, or reject if this fetch is critical.
          return reject(fetchErr);
        }
        if (!row) {
            return reject(new Error('Failed to retrieve created account.'));
        }
        resolve({
          id: row.id,
          userId: row.user_id,
          accountNumber: row.account_number,
          accountType: row.account_type,
          balance: row.balance,
          transfersEnabled: !!row.transfers_enabled,
          createdAt: row.created_at
        });
      });
    });
  });
};

/**
 * Finds accounts for a specific user.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<Array<object>>} A list of account objects.
 */
const findAccountsByUserId = async (userId) => {
  const sql = `SELECT id, user_id, account_number, account_type, balance, transfers_enabled, created_at FROM accounts WHERE user_id = ?`;
  const rows = await db.all(sql, [userId]);
  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    accountNumber: row.account_number,
    accountType: row.account_type,
    balance: row.balance,
    transfersEnabled: !!row.transfers_enabled, // Ensure boolean
    createdAt: row.created_at // camelCase for consistency
  }));
};

/**
 * Finds an account by its ID.
 * @param {number} accountId - The ID of the account.
 * @returns {Promise<object|undefined>} The account object or undefined if not found.
 */
const findAccountById = async (accountId) => {
  const sql = `SELECT id, user_id, account_number, account_type, balance, transfers_enabled, created_at FROM accounts WHERE id = ?`;
  const row = await db.get(sql, [accountId]);
  if (row) {
    return {
      id: row.id,
      userId: row.user_id,
      accountNumber: row.account_number,
      accountType: row.account_type,
      balance: row.balance,
      transfersEnabled: !!row.transfers_enabled, // Ensure boolean
      createdAt: row.created_at // camelCase for consistency
    };
  }
  return undefined;
};

/**
 * Finds an account by its account number.
 * @param {string} accountNumber - The account number.
 * @returns {Promise<object|undefined>} The account object or undefined if not found.
 */
const findAccountByNumber = async (accountNumber) => {
  const sql = `SELECT id, user_id, account_number, account_type, balance, transfers_enabled, created_at FROM accounts WHERE account_number = ?`;
  const row = await db.get(sql, [accountNumber]);
    if (row) {
    return {
      id: row.id,
      userId: row.user_id,
      accountNumber: row.account_number,
      accountType: row.account_type,
      balance: row.balance,
      transfersEnabled: !!row.transfers_enabled,
      createdAt: row.created_at // camelCase for consistency
    };
  }
  return undefined;
};

/**
 * Updates the balance of an account.
 * @param {number} accountId - The ID of the account.
 * @param {number} newBalance - The new balance.
 * @returns {Promise<object>} The result of the database update.
 */
const updateAccountBalance = async (accountId, newBalance) => {
  const sql = `UPDATE accounts SET balance = ? WHERE id = ?`;
  return db.run(sql, [newBalance, accountId]);
};

/**
 * Atomically updates account balances for a transfer.
 * IMPORTANT: This is a simplified example. Real banking requires robust transactions.
 * @param {number} fromAccountId - The ID of the sending account.
 * @param {number} toAccountId - The ID of the receiving account.
 * @param {number} amount - The amount to transfer.
 * @returns {Promise<void>}
 */
const performTransfer = async (fromAccountId, toAccountId, amount) => {
  const fromAccount = await findAccountById(fromAccountId);
  const toAccount = await findAccountById(toAccountId);

  if (!fromAccount || !toAccount) {
    throw new Error('Invalid account(s)');
  }

  if (fromAccount.balance < amount) {
    throw new Error('Insufficient funds');
  }

  // Ensure transfers are enabled for the source account
  if (!fromAccount.transfersEnabled) {
    throw new Error('Transfers are disabled for the source account.');
  }
  // Optionally, check if transfers are enabled for the destination account if it's an internal transfer
  // if (!toAccount.transfersEnabled) {
  //   throw new Error('Transfers are disabled for the destination account.');
  // }


  const newFromBalance = fromAccount.balance - amount;
  const newToBalance = toAccount.balance + amount;

  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        await db.run('BEGIN TRANSACTION');
        await updateAccountBalance(fromAccountId, newFromBalance);
        await updateAccountBalance(toAccountId, newToBalance);

        const transactionModel = require('./transaction'); // Lazy require
        // Log transactions with balanceAfter
        await transactionModel.createTransaction(fromAccountId, 'transfer_out', -amount, `Transfer to ${toAccount.accountNumber}`, toAccountId, newFromBalance);
        await transactionModel.createTransaction(toAccountId, 'transfer_in', amount, `Transfer from ${fromAccount.accountNumber}`, fromAccountId, newToBalance);

        await db.run('COMMIT');
        resolve();
      } catch (err) {
        console.error('Transfer transaction failed, rolling back:', err);
        await db.run('ROLLBACK');
        reject(err);
      }
    });
  });
};


// --- Admin Specific Methods ---

/**
 * Fetches all accounts for admin overview.
 * Optionally joins with user data to include username and fullName.
 */
const getAllAccountsAdmin = async () => {
  const query = `
    SELECT
      a.id,
      a.user_id,
      a.account_number,
      a.account_type,
      a.balance,
      a.transfers_enabled,
      a.created_at,
      u.username,
      u.full_name AS userFullName
    FROM accounts a
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.id DESC;
  `;
  try {
    const rows = await db.all(query);
    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      accountNumber: row.account_number,
      accountType: row.account_type,
      balance: row.balance,
      transfersEnabled: !!row.transfers_enabled, // Ensure boolean
      createdAt: row.created_at,
      user: row.username ? { username: row.username, fullName: row.userFullName } : null
    }));
  } catch (err) {
    console.error('Error in getAllAccountsAdmin model:', err);
    throw err;
  }
};

/**
 * Updates specific fields of an account by its ID.
 * @param {number} accountId - The ID of the account to update.
 * @param {object} dataToUpdate - An object containing fields to update, e.g., { transfers_enabled: true }
 * @returns {Promise<object|null>} The updated account object or null if not found/failed.
 */
const updateAccountById = async (accountId, dataToUpdate) => {
  const fields = [];
  const values = [];

  const allowedFields = {
    transfers_enabled: 'transfers_enabled', // DB column name
    account_type: 'account_type',         // DB column name
    // Add other updatable fields here, mapping frontend name to DB column name if different
  };

  for (const dbColumnName in dataToUpdate) { // Iterate over keys which should be DB column names
    if (dataToUpdate.hasOwnProperty(dbColumnName) && allowedFields[dbColumnName]) {
      fields.push(`${allowedFields[dbColumnName]} = ?`);
      // Ensure boolean values are converted to 1 or 0 for SQLite
      if (typeof dataToUpdate[dbColumnName] === 'boolean') {
        values.push(dataToUpdate[dbColumnName] ? 1 : 0);
      } else {
        values.push(dataToUpdate[dbColumnName]);
      }
    }
  }


  if (fields.length === 0) {
    console.warn('updateAccountById: No valid fields provided for update for accountId:', accountId);
    return findAccountById(accountId); // Return current state if no valid fields
  }

  values.push(accountId); // For the WHERE clause

  const query = `
    UPDATE accounts
    SET ${fields.join(', ')}
    WHERE id = ?;
  `;

  return new Promise((resolve, reject) => {
    db.run(query, values, async function(err) {
      if (err) {
        console.error(`Error in updateAccountById model for account ${accountId}:`, err);
        return reject(err);
      }
      // Regardless of this.changes, fetch the current state to return.
      // If this.changes === 0, it might mean the value was already set to the new value.
      try {
        const updatedAccount = await findAccountById(accountId);
        if (!updatedAccount) {
          // This case should ideally not be hit if the ID was valid,
          // but good to handle if the account somehow got deleted between operations.
          return reject(new Error(`Account with ID ${accountId} not found after update attempt.`));
        }
        resolve(updatedAccount);
      } catch (fetchErr) {
        console.error(`Error fetching account ${accountId} after update attempt:`, fetchErr);
        reject(fetchErr);
      }
    });
  });
};


module.exports = {
  createAccount,
  findAccountsByUserId,
  findAccountById,
  findAccountByNumber,
  updateAccountBalance,
  performTransfer,
  // Admin methods
  getAllAccountsAdmin,
  updateAccountById,
};