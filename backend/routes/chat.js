const express = require('express');
const { db, uuidv4 } = require('../db');
const { auth } = require('../middleware/auth');
const router = express.Router();

// GET /api/chat/conversations - Get all conversations for user
router.get('/conversations', auth, (req, res) => {
  const userId = req.user.id;
  const convMap = {};

  db.messages.forEach(msg => {
    const isParticipant = msg.senderId === userId || msg.receiverId === userId;
    if (!isParticipant) return;
    const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
    const key = [userId, otherId].sort().join('-');
    if (!convMap[key] || new Date(msg.createdAt) > new Date(convMap[key].lastMessage.createdAt)) {
      convMap[key] = { key, otherId, lastMessage: msg };
    }
  });

  const conversations = Object.values(convMap).map(conv => {
    const other = db.users.find(u => u.id === conv.otherId);
    const unread = db.messages.filter(
      m => m.senderId === conv.otherId && m.receiverId === userId && !m.read
    ).length;
    return {
      key: conv.key,
      user: other ? { id: other.id, name: other.name, rollNumber: other.rollNumber } : null,
      lastMessage: conv.lastMessage,
      unread
    };
  });

  conversations.sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));
  res.json(conversations);
});

// GET /api/chat/:userId - Get messages with a user
router.get('/:userId', auth, (req, res) => {
  const { userId } = req.params;
  const myId = req.user.id;

  const messages = db.messages.filter(
    m => (m.senderId === myId && m.receiverId === userId) ||
         (m.senderId === userId && m.receiverId === myId)
  );

  // Mark as read
  messages.forEach(m => {
    if (m.receiverId === myId) m.read = true;
  });

  messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  res.json(messages);
});

// POST /api/chat/:userId - Send message
router.post('/:userId', auth, (req, res) => {
  const { text } = req.body;
  const { userId } = req.params;

  if (!text?.trim()) return res.status(400).json({ message: 'Message empty' });

  const receiver = db.users.find(u => u.id === userId);
  if (!receiver) return res.status(404).json({ message: 'User not found' });

  const message = {
    id: uuidv4(),
    senderId: req.user.id,
    receiverId: userId,
    senderName: req.user.name,
    text: text.trim(),
    read: false,
    createdAt: new Date().toISOString()
  };

  db.messages.push(message);

  // Create notification for receiver
  db.notifications.push({
    id: uuidv4(),
    userId: userId,
    type: 'message',
    title: `💬 New message from ${req.user.name}`,
    message: text.trim().substring(0, 60),
    redirectUserId: req.user.id,
    read: false,
    createdAt: new Date().toISOString()
  });

  res.status(201).json(message);
});

module.exports = router;
