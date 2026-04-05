const express = require('express');
const { db } = require('../db');
const { adminAuth } = require('../middleware/auth');
const router = express.Router();

// GET /api/admin/stats
router.get('/stats', adminAuth, (req, res) => {
  res.json({
    totalUsers: db.users.filter(u => u.role !== 'admin').length,
    totalItems: db.items.length,
    lostItems: db.items.filter(i => i.type === 'lost' && i.status === 'active').length,
    foundItems: db.items.filter(i => i.type === 'found' && i.status === 'active').length,
    resolvedItems: db.items.filter(i => i.status === 'resolved').length,
    totalMessages: db.messages.length
  });
});

// GET /api/admin/users
router.get('/users', adminAuth, (req, res) => {
  const users = db.users.map(({ password, ...u }) => ({
    ...u,
    itemsCount: db.items.filter(i => i.userId === u.id).length
  }));
  res.json(users);
});

// GET /api/admin/items
router.get('/items', adminAuth, (req, res) => {
  const items = [...db.items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(items);
});

// DELETE /api/admin/items/:id
router.delete('/items/:id', adminAuth, (req, res) => {
  const idx = db.items.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  db.items.splice(idx, 1);
  res.json({ message: 'Deleted' });
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', adminAuth, (req, res) => {
  const idx = db.users.findIndex(u => u.id === req.params.id && u.role !== 'admin');
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  db.users.splice(idx, 1);
  res.json({ message: 'Deleted' });
});

module.exports = router;
