// Simple in-memory store (replace with MongoDB/PostgreSQL for production)
const { v4: uuidv4 } = require('uuid');

const db = {
  users: [
    {
      id: 'admin-001',
      name: 'Admin',
      email: 'admin@campus.edu',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'admin',
      rollNumber: 'ADMIN001',
      phone: '9999999999',
      createdAt: new Date().toISOString()
    }
  ],
  items: [],
  messages: [],
  notifications: []
};

module.exports = { db, uuidv4 };
