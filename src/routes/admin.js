const express = require('express');
const router = express.Router();
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const userModel = require('../models/user');
const accountModel = require('../models/account');
const transactionModel = require('../models/transaction');
const messageModel = require('../models/message');
const adminSettingsModel = require('../models/adminSettings');

// All admin routes require authentication and admin privileges
router.use(authenticate);
router.use(authorizeAdmin);

// --- User Management ---

// GET /api/admin/users
// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await userModel.getAllUsers();
    // Exclude passwords from the list
    const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    });
    res.json(usersWithoutPasswords);
  } catch (err) {
    console.error('Admin error fetching users:', err);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// POST /api/admin/users
// Create a new user (by an admin)
router.post('/users', async (req, res) => {
  const { username, password, email, fullName, role } = req.body;

  if (!username || !password || !email || !fullName || !role) {
    return res.status(400).json({ message: 'Username, password, email, full name, and role are required' });
  }
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role specified. Must be "user" or "admin".' });
  }

  try {
    const existingUser = await userModel.findUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }
    // Optional: Check if email already exists if emails should be unique
    // const existingUserByEmail = await userModel.findUserByEmail(email);
    // if (existingUserByEmail) {
    //   return res.status(409).json({ message: 'Email already exists' });
    // }

    const newUserDetails = {
      email,
      fullName,
      is_admin: role === 'admin',
      // Add any other fields your userModel.createUser might expect for admin creation
    };

    // IMPORTANT: userModel.createUser needs to be adapted to handle these additional details
    // and the is_admin flag. The one in auth.js only takes username and password.
    const newUser = await userModel.createUser(username, password, newUserDetails);

    // Exclude password from response
    const { password: _, ...userToReturn } = newUser;

    res.status(201).json(userToReturn);
  } catch (err) {
    console.error('Admin error creating user:', err);
    res.status(500).json({ message: 'Error creating user' });
  }
});

// GET /api/admin/users/:userId
// Get a specific user's details
router.get('/users/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }
  try {
    const user = await userModel.findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Exclude password
    const { password, ...userDetails } = user;
    res.json(userDetails);
  } catch (err) {
    console.error('Admin error fetching user:', err);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// PUT /api/admin/users/:userId
// Update a user's details (by an admin)
router.put('/users/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const { username, email, fullName, role } = req.body;

  if (isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }
  if (!username || !email || !fullName || !role) {
    return res.status(400).json({ message: 'Username, email, full name, and role are required for update' });
  }
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role specified. Must be "user" or "admin".' });
  }

  try {
    const userToUpdate = await userModel.findUserById(userId);
    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if new username is already taken by another user
    if (username !== userToUpdate.username) {
        const existingUserWithNewUsername = await userModel.findUserByUsername(username);
        if (existingUserWithNewUsername) {
            return res.status(409).json({ message: 'New username is already taken.' });
        }
    }

    const updateData = {
      username,
      email,
      fullName, // Assuming your model stores this as full_name or similar
      is_admin: role === 'admin',
      // Do NOT update password here. Password changes should be a separate, secure process.
    };

    // IMPORTANT: You'll need an updateUserById method in your userModel
    const updatedUser = await userModel.updateUserById(userId, updateData);
    if (!updatedUser) { // If updateUserById returns null/undefined on failure
        return res.status(500).json({ message: 'Failed to update user details.' });
    }


    const { password, ...userToReturn } = updatedUser;
    res.json(userToReturn);
  } catch (err) {
    console.error('Admin error updating user:', err);
    res.status(500).json({ message: 'Error updating user' });
  }
});

// PATCH /api/admin/users/:userId/toggle-status
// Toggle a user's active status (enable/disable)
router.patch('/users/:userId/toggle-status', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    const user = await userModel.findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Assuming user object has an 'is_active' field (boolean)
    // And userModel.updateUserById can update this field.
    const newStatus = !user.is_active; // Toggles the current status
    const updatedUser = await userModel.updateUserById(userId, { is_active: newStatus });

    if (!updatedUser) {
        return res.status(500).json({ message: 'Failed to toggle user status.' });
    }

    // Ensure the returned user object reflects the change, especially the isActive field for the frontend
    const { password, ...userToReturn } = updatedUser;
    // Make sure userToReturn.isActive (or userToReturn.is_active) is correctly set
    // If updateUserById returns the full updated object, this should be fine.
    // If not, you might need to manually set it: userToReturn.isActive = newStatus;
    res.json(userToReturn);
  } catch (err) {
    console.error('Admin error toggling user status:', err);
    res.status(500).json({ message: 'Error toggling user status' });
  }
});


// --- Account Management (Admin) ---

// GET /api/admin/accounts
// Get all accounts for admin overview
router.get('/accounts', async (req, res) => {
  try {
    // accountModel.getAllAccountsAdmin now returns data with camelCase properties
    const accounts = await accountModel.getAllAccountsAdmin();

    // The model is now responsible for formatting, so we just send the result
    res.json(accounts);
  } catch (err) {
    console.error('Admin error fetching all accounts:', err);
    res.status(500).json({ message: 'Error fetching all accounts' });
  }
});

// GET /api/admin/accounts/:accountId/transactions
// Get all transactions for a specific account (admin view)
router.get('/accounts/:accountId/transactions', async (req, res) => {
  const accountId = parseInt(req.params.accountId, 10);
  if (isNaN(accountId)) {
    return res.status(400).json({ message: 'Invalid account ID' });
  }
  try {
    const account = await accountModel.findAccountById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    // transactionModel.getTransactionsByAccountId now returns data with camelCase properties
    const transactions = await transactionModel.getTransactionsByAccountId(accountId);

    // The model is now responsible for formatting, so we just send the result
    res.json(transactions);
  } catch (err) {
    console.error(`Admin error fetching transactions for account ${accountId}:`, err);
    res.status(500).json({ message: 'Error fetching account transactions' });
  }
});

// PATCH /api/admin/accounts/:accountId/toggle-transfers
// Enable or disable transfers for a specific account
router.patch('/accounts/:accountId/toggle-transfers', async (req, res) => {
  const accountId = parseInt(req.params.accountId, 10);
  if (isNaN(accountId)) {
    return res.status(400).json({ message: 'Invalid account ID' });
  }

  try {
    const accountToToggle = await accountModel.findAccountById(accountId);
    if (!accountToToggle) {
      return res.status(404).json({ message: 'Account not found for toggling.' });
    }

    // Determine the new status based on the camelCase property from the model
    const newStatus = !accountToToggle.transfersEnabled;

    // accountModel.updateAccountById expects DB column names in dataToUpdate
    // and the new boolean status.
    const updatedAccountFromModel = await accountModel.updateAccountById(accountId, { transfers_enabled: newStatus });

    if (!updatedAccountFromModel) {
      return res.status(500).json({ message: 'Failed to toggle account transfer status or account not found after update.' });
    }
    // The updatedAccountFromModel already has camelCase properties like transfersEnabled
    // because updateAccountById calls findAccountById which does the mapping.
    res.json(updatedAccountFromModel); // Send it directly
  } catch (err) {
    console.error(`Admin error toggling transfer status for account ${accountId}:`, err);
    res.status(500).json({ message: 'Error toggling account transfer status' });
  }
});


// PUT /api/admin/accounts/:accountId/balance  (Existing Route - Kept for completeness)
// Increase or decrease account balance
router.put('/accounts/:accountId/balance', async (req, res) => {
  const accountId = parseInt(req.params.accountId, 10);
  const { amount, type, description } = req.body; // type: 'increase' or 'decrease'
  const amountNum = parseFloat(amount);

  if (isNaN(accountId) || isNaN(amountNum) || amountNum <= 0 || !['increase', 'decrease'].includes(type)) {
    return res.status(400).json({ message: 'Invalid input: accountId, positive amount, and type ("increase" or "decrease") are required.' });
  }

  try {
    const account = await accountModel.findAccountById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    let newBalance = account.balance;
    let transactionAmount = amountNum;
    let transactionType = 'admin_adjust';
    let transactionDescription = description || `Admin ${type} adjustment`;

    if (type === 'increase') {
      newBalance += amountNum;
      // transactionAmount is positive for increase
    } else { // type === 'decrease'
      if (account.balance < amountNum) {
        return res.status(400).json({ message: 'Insufficient funds for decrease adjustment.' });
      }
      newBalance -= amountNum;
      transactionAmount = -amountNum; // Negative for decrease
    }

    // Update balance
    await accountModel.updateAccountBalance(accountId, newBalance);

    // Log transaction
    // Need to fetch the account again to get the updated balance_after for the transaction log
    const updatedAccount = await accountModel.findAccountById(accountId);
    await transactionModel.createTransaction(
        accountId,
        transactionType,
        transactionAmount,
        transactionDescription,
        null, // relatedAccountId
        updatedAccount ? updatedAccount.balance : null // balanceAfter
    );

    res.json({ message: `Account balance ${type}d successfully.`, newBalance });

  } catch (err) {
    console.error('Admin error adjusting balance:', err);
    res.status(500).json({ message: 'Error adjusting account balance.' });
  }
});

// --- Transaction Management (Admin) ---

// POST /api/admin/transactions
// Generate a transaction entry (useful for manual adjustments not tied to balance change)
router.post('/transactions', async (req, res) => {
    const { accountId, type, amount, description, relatedAccountId } = req.body;
    const accountIdNum = parseInt(accountId, 10);
    const amountNum = parseFloat(amount);
    const relatedAccountIdNum = relatedAccountId ? parseInt(relatedAccountId, 10) : null;

    if (isNaN(accountIdNum) || !type || isNaN(amountNum) || !description) {
         return res.status(400).json({ message: 'Invalid input: accountId, type, amount, and description are required.' });
    }

    try {
        const account = await accountModel.findAccountById(accountIdNum);
        if (!account) {
             return res.status(404).json({ message: 'Account not found.' });
        }

        // For manual transaction entries, balanceAfter might not be directly applicable
        // or would need to be calculated based on the current balance + amount.
        // For simplicity here, we'll pass null or calculate it if needed.
        // Let's calculate it for consistency if the type implies a balance change.
        let balanceAfter = null;
        if (['deposit', 'withdrawal', 'admin_adjust'].includes(type)) {
             // Fetch current balance to calculate balanceAfter
             const currentAccount = await accountModel.findAccountById(accountIdNum);
             if (currentAccount) {
                 balanceAfter = currentAccount.balance + amountNum; // Add amount to current balance
             }
        }


        await transactionModel.createTransaction(
            accountIdNum,
            type,
            amountNum,
            description,
            relatedAccountIdNum,
            balanceAfter // Pass calculated balanceAfter
        );

        res.status(201).json({ message: 'Transaction entry created successfully.' });

    } catch (err) {
        console.error('Admin error creating transaction entry:', err);
        res.status(500).json({ message: 'Error creating transaction entry.' });
    }
});

// GET /api/admin/transactions
// Get all transactions
router.get('/transactions', async (req, res) => {
    try {
        // transactionModel.getAllTransactions now returns data with camelCase properties
        const transactions = await transactionModel.getAllTransactions();
        res.json(transactions);
    } catch (err) {
        console.error('Admin error fetching all transactions:', err);
        res.status(500).json({ message: 'Error fetching all transactions.' });
    }
});

// --- Settings Management (Existing Routes) ---

// GET /api/admin/settings/activities
// Get current activity settings
router.get('/settings/activities', async (req, res) => {
    try {
        const settings = await adminSettingsModel.getAllSettings();
        const formattedSettings = settings.reduce((acc, setting) => {
            acc[setting.setting_name] = setting.setting_value === 1; // Convert to boolean
            return acc;
        }, {});
        res.json(formattedSettings);
    } catch (err) {
        console.error('Admin error fetching settings:', err);
        res.status(500).json({ message: 'Error fetching settings.' });
    }
});

// PUT /api/admin/settings/activities
// Update activity settings (wire, ach, billpay)
router.put('/settings/activities', async (req, res) => {
    const { allow_wire_transfer, allow_ach, allow_bill_pay } = req.body;

    const updates = [];
    if (typeof allow_wire_transfer === 'boolean') updates.push({ name: 'allow_wire_transfer', value: allow_wire_transfer });
    if (typeof allow_ach === 'boolean') updates.push({ name: 'allow_ach', value: allow_ach });
    if (typeof allow_bill_pay === 'boolean') updates.push({ name: 'allow_bill_pay', value: allow_bill_pay });

    if (updates.length === 0) {
        return res.status(400).json({ message: 'No valid settings provided for update.' });
    }

    try {
        for (const update of updates) {
            await adminSettingsModel.updateSetting(update.name, update.value);
        }
        res.json({ message: 'Activity settings updated successfully.' });
    } catch (err) {
        console.error('Admin error updating settings:', err);
        res.status(500).json({ message: 'Error updating settings.' });
    }
});

// --- Message Management (Existing Routes) ---

// POST /api/admin/messages/inbox
// Send a message to a specific user's inbox
router.post('/messages/inbox', async (req, res) => {
    const { userId, subject, body } = req.body;
    const userIdNum = parseInt(userId, 10);

    if (isNaN(userIdNum) || !subject || !body) {
        return res.status(400).json({ message: 'Invalid input: userId, subject, and body are required.' });
    }

    try {
        const user = await userModel.findUserById(userIdNum);
        if (!user) {
            return res.status(404).json({ message: 'Recipient user not found.' });
        }
        await messageModel.sendUserMessage(userIdNum, subject, body);
        res.status(201).json({ message: 'Message sent to user inbox successfully.' });
    } catch (err)
    {
        console.error('Admin error sending user message:', err);
        res.status(500).json({ message: 'Error sending user message.' });
    }
});

// POST /api/admin/messages/flash
// Create a new flash message
router.post('/messages/flash', async (req, res) => {
    const { message, expiresAt } = req.body;

    if (!message) {
        return res.status(400).json({ message: 'Flash message text is required.' });
    }

    try {
        await messageModel.createFlashMessage(message, expiresAt);
        res.status(201).json({ message: 'Flash message created successfully.' });
    } catch (err) {
        console.error('Admin error creating flash message:', err);
        res.status(500).json({ message: 'Error creating flash message.' });
    }
});

// PUT /api/admin/messages/flash/:messageId/deactivate
// Deactivate a flash message
router.put('/messages/flash/:messageId/deactivate', async (req, res) => {
    const messageId = parseInt(req.params.messageId, 10);

    if (isNaN(messageId)) {
        return res.status(400).json({ message: 'Invalid message ID.' });
    }

    try {
        const result = await messageModel.deactivateFlashMessage(messageId);
        if (result.changes === 0) { // Check if any row was affected
             return res.status(404).json({ message: 'Flash message not found or already inactive.' });
        }
        res.json({ message: 'Flash message deactivated successfully.' });
    } catch (err) {
        console.error('Admin error deactivating flash message:', err);
        res.status(500).json({ message: 'Error deactivating flash message.' });
    }
});

module.exports = router;