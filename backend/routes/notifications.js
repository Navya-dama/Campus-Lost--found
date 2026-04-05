const express = require('express');
const { db } = require('../db');
const { auth } = require('../middleware/auth');
const router = express.Router();

// GET /api/notifications
router.get('/', auth, (req, res) => {
  const notifications = db.notifications
    .filter(n => n.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 50);
  res.json(notifications);
});

// GET /api/notifications/unread-count
router.get('/unread-count', auth, (req, res) => {
  const count = db.notifications.filter(n => n.userId === req.user.id && !n.read).length;
  res.json({ count });
});

// PUT /api/notifications/:id/read
router.put('/:id/read', auth, (req, res) => {
  const notif = db.notifications.find(n => n.id === req.params.id && n.userId === req.user.id);
  if (!notif) return res.status(404).json({ message: 'Not found' });
  notif.read = true;
  res.json(notif);
});

// PUT /api/notifications/read-all
router.put('/read-all/mark', auth, (req, res) => {
  db.notifications.filter(n => n.userId === req.user.id).forEach(n => n.read = true);
  res.json({ message: 'All marked read' });
});

module.exports = router;
