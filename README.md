# 🎓 Campus Lost & Found

AI-powered Lost & Found platform for college campuses. When a lost item matches a found item, both users get automatic notifications!

---

## ✨ Features

- 📤 Post lost/found items with photo upload
- 🔍 Search & filter items by type, category, keyword
- 🤖 **AI Matching** — Claude API auto-matches lost ↔ found items
- 🔔 **Clickable Notifications** — Click to see matched item & poster details
- 💬 In-app chat between users
- 👤 My Items dashboard (resolve / delete)
- ⚙️ Admin panel — stats, manage items & users
- 🔐 JWT authentication

---

## 🚀 Setup & Run

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — add your ANTHROPIC_API_KEY and set JWT_SECRET
node server.js
```

Backend runs on: `http://localhost:5000`

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs on: `http://localhost:3000`

---

## 🔑 Default Admin Login

```
Email:    admin@campus.edu
Password: password
```

> ⚠️ Change the admin password in `backend/db.js` after setup!

---

## 📁 Project Structure

```
campus-lost-found/
├── backend/
│   ├── server.js          # Express entry point
│   ├── db.js              # In-memory store (replace with MongoDB for production)
│   ├── middleware/auth.js  # JWT middleware
│   └── routes/
│       ├── auth.js         # Login / Register
│       ├── items.js        # Post items + AI matching
│       ├── chat.js         # Messaging
│       ├── notifications.js
│       └── admin.js
└── frontend/
    └── src/
        ├── pages/          # All page components
        ├── components/     # Navbar, ItemCard
        ├── context/        # AuthContext
        └── utils/api.js    # Axios instance
```

---

## 🗄️ Production Upgrade (optional)

Replace `backend/db.js` in-memory store with **MongoDB** or **PostgreSQL**:

```
npm install mongoose    # for MongoDB
npm install pg          # for PostgreSQL
```

---



Built with ❤️ for campus communities.
