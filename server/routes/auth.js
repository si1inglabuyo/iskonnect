const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Profile = require('../models/Profile');
const authenticate = require('../middleware/auth');
const sequelize = require('../config/database');


const router = express.Router();

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: ['id', 'email'],
      include: [{
        model: Profile,
        as: 'Profile',
        attributes: ['username', 'avatar_url']
      }]
    });
    if(!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Me router error:', err);
    res.status(500).json({ error: 'Server error: ', err});
  }
});

//  Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, username, full_name } = req.body;

    // Basic validation
    if (!email || !password || !username || !full_name) {
      return res.status(400).json({ error: 'Email, username, full name, and password are required' });
    }

    if (full_name.trim().length < 2) {
      return res.status(400).json({ error: 'Full name must be at least 2 characters' });
    }

    // Check email
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
    }

    // Check username
    const existingProfile = await Profile.findOne({ where: { username } });

    if (existingProfile) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Create user (password auto-hashed by model)
    const user = await User.create({
      email,
      password_hash: password 
    });

    // Create profile with username + fullname
    await Profile.create({
      user_id: user.id,
      username,
      full_name: full_name.trim()
    });

    // Respond without password
    res.status(201).json({
      id: user.id,
      email: user.email
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 🔑 Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;