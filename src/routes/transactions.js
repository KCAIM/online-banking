const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const accountModel = require('../models/account');
const transactionModel = require('../models/transaction');
const adminSettingsModel = require('../models/adminSettings');

// All routes in this file require authentication
router.use(authenticate);

// GET /api/transactions/:accountId
// Get transactions for a specific account (must belong to the user)
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

    const transactions = await transactionModel.getTransactionsByAccountId(accountId);
    res.json(transactions);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ message: 'Error fetching transactions' });
  }
});

// Helper function to handle transfers (Wire/ACH)
const handleTransfer = async (req, res, transferType) => {
    // Destructure all relevant fields sent by WireTransferPage.jsx
    const {
        fromAccountId,
        beneficiaryAccountNumber, // This is what the frontend sends for the destination account
        amount,
        // beneficiaryName, beneficiaryBankName, routingNumber, currency, purpose are also sent
        // by the frontend for wire transfers, but not strictly used by this internal transfer logic.
    } = req.body;
    const amountNum = parseFloat(amount);

    if (!fromAccountId || !beneficiaryAccountNumber || isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({ message: 'Invalid input: fromAccountId, toAccountNumber, and a positive amount are required.' });
    }

    try {
        // 1. Check if the transfer type is allowed by GLOBAL ADMIN SETTINGS
        let settingName = `allow_${transferType.toLowerCase()}`;
        if (transferType.toLowerCase() === 'wire') {
            settingName = 'allow_wire_transfer';
        }

        console.log(`[DEBUG] Checking admin setting: ${settingName}`);
        const setting = await adminSettingsModel.getSetting(settingName);
        console.log(`[DEBUG] Fetched setting object for ${settingName}:`, JSON.stringify(setting, null, 2));

        if (!setting || setting.setting_value !== 1) {
            return res.status(403).json({ message: `${transferType} transfers are currently disabled by system admin.` });
        }

        // 2. Find the 'from' account and ensure it belongs to the user
        const fromAccount = await accountModel.findAccountById(fromAccountId);
        if (!fromAccount || fromAccount.userId !== req.user.id) {
            return res.status(404).json({ message: 'Source account not found or does not belong to you.' });
        }

        // 3. Check if transfers are enabled FOR THIS SPECIFIC ACCOUNT
        if (!fromAccount.transfersEnabled) {
            return res.status(403).json({ message: `Transfers are currently disabled for your account ${fromAccount.accountNumber}. Please contact support.` });
        }

        // --- Differentiate logic based on transfer type ---
        if (transferType.toLowerCase() === 'wire') {
            // Check for sufficient funds in the source account
            if (fromAccount.balance < amountNum) { // Assuming wire fee is handled by frontend or not applicable here
                return res.status(400).json({ message: 'Insufficient funds for wire transfer.' });
            }

            const newBalance = fromAccount.balance - amountNum;
            await accountModel.updateAccountBalance(fromAccount.id, newBalance);

            const description = `Wire Transfer to ${beneficiaryAccountNumber} (${req.body.beneficiaryName || 'N/A'})`;
            await transactionModel.createTransaction(
                fromAccount.id,
                'wire_transfer_sent',
                -amountNum,
                description,
                null, 
                newBalance
            );
            res.json({ message: 'Wire transfer initiated successfully.' });

        } else if (transferType.toLowerCase() === 'ach') {
            if (fromAccount.balance < amountNum) {
                return res.status(400).json({ message: 'Insufficient funds for ACH transfer.' });
            }

            const newBalance = fromAccount.balance - amountNum;
            await accountModel.updateAccountBalance(fromAccount.id, newBalance);

            const description = `ACH Transfer to ${beneficiaryAccountNumber} (${req.body.beneficiaryName || 'N/A'}, Acc Type: ${req.body.beneficiaryAccountType || 'N/A'})`;
            await transactionModel.createTransaction(
                fromAccount.id,
                'ach_transfer_sent',
                -amountNum,
                description,
                null,
                newBalance
            );
            res.json({ message: `${transferType} transfer successful.` });
        } else {
            return res.status(501).json({ message: `${transferType} transfer type not implemented.` });
        }

    } catch (err) {
        console.error(`${transferType} transfer error:`, err);
        if (err.message === 'Insufficient funds') {
             return res.status(400).json({ message: 'Insufficient funds in the source account.' });
        }
        res.status(500).json({ message: `Error performing ${transferType} transfer.` });
    }
};

// POST /api/transactions/wire
// Perform a wire transfer
router.post('/wire', async (req, res) => {
    await handleTransfer(req, res, 'Wire');
});

// POST /api/transactions/ach
// Perform an ACH transfer
router.post('/ach', async (req, res) => {
    await handleTransfer(req, res, 'ACH');
});

// POST /api/transactions/billpay
// Perform a bill payment
router.post('/billpay', async (req, res) => {
    const { fromAccountId, payeeName, amount } = req.body;
    const amountNum = parseFloat(amount);

    if (!fromAccountId || !payeeName || isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({ message: 'Invalid input: fromAccountId, payeeName, and a positive amount are required.' });
    }

    try {
        // 1. Check if bill pay is allowed by GLOBAL ADMIN SETTINGS
        const setting = await adminSettingsModel.getSetting('allow_bill_pay');
        if (!setting || setting.setting_value !== 1) { 
            return res.status(403).json({ message: 'Bill payments are currently disabled by system admin.' });
        }

        // 2. Find the 'from' account and ensure it belongs to the user
        const fromAccount = await accountModel.findAccountById(fromAccountId);
        if (!fromAccount || fromAccount.userId !== req.user.id) {
            return res.status(404).json({ message: 'Source account not found or does not belong to you.' });
        }

        // 3. Check if transfers are enabled FOR THIS SPECIFIC ACCOUNT
        // (Bill Pay is a form of transfer out of the account)
        if (!fromAccount.transfersEnabled) {
            return res.status(403).json({ message: `Bill payments are currently disabled for your account ${fromAccount.accountNumber}. Please contact support.` });
        }

        // Check for sufficient funds
        if (fromAccount.balance < amountNum) {
            return res.status(400).json({ message: 'Insufficient funds for bill payment.' });
        }

        const newBalance = fromAccount.balance - amountNum;
        await accountModel.updateAccountBalance(fromAccount.id, newBalance);

        await transactionModel.createTransaction(
            fromAccount.id,
            'bill_pay',
            -amountNum, 
            `Bill payment to ${payeeName}`,
            null, 
            newBalance
        );

        res.json({ message: `Bill payment to ${payeeName} successful.` });

    } catch (err) {
        console.error('Bill pay error:', err);
        res.status(500).json({ message: 'Error performing bill payment.' });
    }
});

module.exports = router;