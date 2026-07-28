const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { loginValidators, registerValidators } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

// POST /api/auth/login
router.post('/login', authLimiter, loginValidators, (req, res) => {
  const { phone, password } = req.body;
  try {
    const user = db.get('users').find({ phone: phone.trim() }).value();
    if (!user) {
      return res.status(401).json({ error: 'Phone number not found. Please check or register.' });
    }
    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }
    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role, village: user.village },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );
    res.json({
      token,
      user: { id: user.id, name: user.name, role: user.role, village: user.village, phone: user.phone }
    });
  } catch (err) {
    console.error('[Auth/Login Error]', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// POST /api/auth/register
router.post('/register', authLimiter, registerValidators, (req, res) => {
  const { name, phone, password, village } = req.body;
  try {
    const existing = db.get('users').find({ phone: phone.trim() }).value();
    if (existing) {
      return res.status(409).json({ error: 'This phone number is already registered.' });
    }
    const hash = bcrypt.hashSync(password, 12);
    const newUser = {
      id: uuidv4(),
      name: name.trim(),
      phone: phone.trim(),
      role: 'patient',
      password: hash,
      village: village.trim(),
      created_at: new Date().toISOString()
    };
    db.get('users').push(newUser).write();
    const token = jwt.sign(
      { id: newUser.id, name: newUser.name, role: newUser.role, village: newUser.village },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );
    res.status(201).json({
      token,
      user: { id: newUser.id, name: newUser.name, role: newUser.role, village: newUser.village, phone: newUser.phone }
    });
  } catch (err) {
    console.error('[Auth/Register Error]', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// GET /api/auth/me  (verify token)
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    res.json({ user: decoded });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
