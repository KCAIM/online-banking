const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const accountModel = require('../models/account');
const transactionModel = require('../models/transaction');

// All routes in this file require authentication
router.use(authenticate);

// GET /api/accounts
// Get all accounts for the authenticated user
router.get('/', async (req, res) => {
  try {
    const accounts = await accountModel.findAccountsByUserId(req.user.id);
    res.json(accounts);
  } catch (err) {
    console.error('Error fetching accounts:', err);
    res.status(500).json({ message: 'Error fetching accounts' });
  }
});

// POST /api/accounts
// Open a new account for the authenticated user
router.post('/', async (req, res) => {
  const { accountType, initialBalance } = req.body;

  if (!accountType) {
    return res.status(400).json({ message: 'Account type is required' });
  }

  // Basic validation for initialBalance
  const balance = parseFloat(initialBalance) || 0.0;
  if (balance < 0) {
      return res.status(400).json({ message: 'Initial balance cannot be negative' });
  }

  try {
    const newAccount = await accountModel.createAccount(req.user.id, accountType, balance);

    // Log initial deposit if balance > 0
    if (balance > 0) {
        // When creating the initial deposit transaction, pass the balanceAfter
        await transactionModel.createTransaction(
            newAccount.id,
            'deposit',
            balance,
            'Initial Deposit',
            null, // relatedAccountId
            newAccount.balance // balanceAfter is the initialBalance itself
        );
    }

    res.status(201).json(newAccount);
  } catch (err) {
    console.error('Error creating account:', err);
    res.status(500).json({ message: 'Error creating account' });
  }
});

// GET /api/accounts/:accountId
// Get details for a specific account (must belong to the user)
router.get('/:accountId', async (req, res) => {
  const accountId = parseInt(req.params.accountId, 10);

  if (isNaN(accountId)) {
      return res.status(400).json({ message: 'Invalid account ID' });
  }

  try {
    const account = await accountModel.findAccountById(accountId);

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Ensure the account belongs to the authenticated user
    // Use account.userId (camelCase) as returned by the model
    if (account.userId !== req.user.id) {
      return res.sendStatus(403); // Forbidden
    }

    res.json(account);
  } catch (err) {
    console.error('Error fetching account details:', err);
    res.status(500).json({ message: 'Error fetching account details' });
  }
});

module.exports = router;