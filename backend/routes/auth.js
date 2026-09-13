const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Hardcoded admin credentials
const ADMIN_USER = {
  username: 'admin',
  password: 'admin123'
};

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (username === ADMIN_USER.username && password === ADMIN_USER.password) {
    const token = jwt.sign(
      { username: ADMIN_USER.username, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    return res.json({ token, username: ADMIN_USER.username });
  }

  return res.status(401).json({ error: 'Invalid username or password' });
});

module.exports = router;
