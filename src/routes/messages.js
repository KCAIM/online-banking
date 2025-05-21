const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const messageModel = require('../models/message');

// GET /api/messages/inbox
// Get messages for the authenticated user's inbox
router.get('/inbox', authenticate, async (req, res) => {
  try {
    const messages = await messageModel.getUserMessages(req.user.id);
    res.json(messages);
  } catch (err) {
    console.error('Error fetching user messages:', err);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// PUT /api/messages/inbox/:messageId/read
// Mark a user message as read
router.put('/inbox/:messageId/read', authenticate, async (req, res) => {
  const messageId = parseInt(req.params.messageId, 10);

  if (isNaN(messageId)) {
      return res.status(400).json({ message: 'Invalid message ID' });
  }

  try {
    // Ensure the message belongs to the user before marking as read
    // A more robust check would fetch the message first
    const result = await messageModel.markUserMessageAsRead(messageId, req.user.id);

    if (result.changes === 0) {
        // Message not found or didn't belong to the user
        return res.status(404).json({ message: 'Message not found or already read' });
    }

    res.json({ message: 'Message marked as read' });
  } catch (err) {
    console.error('Error marking message as read:', err);
    res.status(500).json({ message: 'Error marking message as read' });
  }
});

// GET /api/messages/flash
// Get active flash messages (can be accessed without authentication)
router.get('/flash', async (req, res) => {
  try {
    const flashMessages = await messageModel.getActiveFlashMessages();
    res.json(flashMessages);
  } catch (err) {
    console.error('Error fetching flash messages:', err);
    res.status(500).json({ message: 'Error fetching flash messages' });
  }
});

module.exports = router;