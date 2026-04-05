const express = require('express');
const multer = require('multer');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const { db, uuidv4 } = require('../db');
const { auth } = require('../middleware/auth');
const router = express.Router();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    cb(null, allowed.test(file.mimetype));
  }
});

// AI matching function
async function findMatches(newItem) {
  const oppositeType = newItem.type === 'lost' ? 'found' : 'lost';
  const candidates = db.items.filter(
    i => i.type === oppositeType && i.status === 'active' && i.id !== newItem.id
  );
  if (candidates.length === 0) return [];

  try {
    const prompt = `You are a campus Lost & Found matching system. 
A student has posted a ${newItem.type} item:
- Title: ${newItem.title}
- Description: ${newItem.description}
- Category: ${newItem.category}
- Location: ${newItem.location}
- Date: ${newItem.date}

Here are existing ${oppositeType} items (as JSON array):
${JSON.stringify(candidates.map(c => ({ id: c.id, title: c.title, description: c.description, category: c.category, location: c.location, date: c.date })))}

Return ONLY a JSON array of objects with fields: id (string), score (number 0-100), reason (string, max 20 words).
Only include items with score >= 50. Sort by score descending. Max 3 results.
Return [] if no good matches. No markdown, no explanation, just the JSON array.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].text.trim();
    const matches = JSON.parse(text);
    return matches.filter(m => m.score >= 50).slice(0, 3);
  } catch (err) {
    console.error('AI matching error:', err);
    return [];
  }
}

// Create notification helper
function createNotification(userId, type, title, message, itemId, redirectUserId) {
  const notification = {
    id: uuidv4(),
    userId,
    type,
    title,
    message,
    itemId,
    redirectUserId,
    read: false,
    createdAt: new Date().toISOString()
  };
  db.notifications.push(notification);
  return notification;
}

// POST /api/items - Create item
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { title, description, category, type, location, date, contact } = req.body;
    if (!title || !description || !type || !location) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const item = {
      id: uuidv4(),
      title, description, category: category || 'Other',
      type, location, date: date || new Date().toISOString().split('T')[0],
      contact: contact || req.user.phone,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRollNumber: req.user.rollNumber,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    db.items.push(item);

    // Run AI matching in background
    findMatches(item).then(matches => {
      matches.forEach(match => {
        const matchedItem = db.items.find(i => i.id === match.id);
        if (!matchedItem) return;

        // Notify the new item poster
        createNotification(
          item.userId,
          'match',
          `🎯 Possible match found!`,
          `Your ${item.type} item "${item.title}" may match a ${matchedItem.type} item: "${matchedItem.title}" (${match.score}% match) — ${match.reason}`,
          matchedItem.id,
          matchedItem.userId
        );

        // Notify the matched item poster
        createNotification(
          matchedItem.userId,
          'match',
          `🎯 Possible match found!`,
          `Your ${matchedItem.type} item "${matchedItem.title}" may match a ${item.type} item: "${item.title}" (${match.score}% match) — ${match.reason}`,
          item.id,
          item.userId
        );
      });
    });

    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/items - Get all items with search/filter
router.get('/', (req, res) => {
  const { type, category, search, status } = req.query;
  let items = [...db.items];

  if (type) items = items.filter(i => i.type === type);
  if (category) items = items.filter(i => i.category === category);
  if (status) items = items.filter(i => i.status === status);
  else items = items.filter(i => i.status === 'active');

  if (search) {
    const q = search.toLowerCase();
    items = items.filter(i =>
      i.title.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.location.toLowerCase().includes(q)
    );
  }

  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(items);
});

// GET /api/items/:id
router.get('/:id', (req, res) => {
  const item = db.items.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  res.json(item);
});

// GET /api/items/user/my - Get my items
router.get('/user/my', auth, (req, res) => {
  const items = db.items.filter(i => i.userId === req.user.id);
  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(items);
});

// PUT /api/items/:id/resolve
router.put('/:id/resolve', auth, (req, res) => {
  const item = db.items.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  if (item.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  item.status = 'resolved';
  item.resolvedAt = new Date().toISOString();
  res.json(item);
});

// DELETE /api/items/:id
router.delete('/:id', auth, (req, res) => {
  const idx = db.items.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Item not found' });
  const item = db.items[idx];
  if (item.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  db.items.splice(idx, 1);
  res.json({ message: 'Deleted' });
});

module.exports = router;
