const express = require('express');
const authenticate = require('../middleware/auth');
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const User = require('../models/User');
const Profile = require('../models/Profile');

const router = express.Router();

// GET /api/friends - mutual follows (friends)
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    const following = await sequelize.query(
      `SELECT following_id FROM follows WHERE follower_id = :userId`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );
    const followers = await sequelize.query(
      `SELECT follower_id FROM follows WHERE following_id = :userId`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );

    // Normalize IDs to numbers and dedupe
    const followingIds = [...new Set(following.map(f => Number(f.following_id)))].filter(Boolean);
    const followerIds = [...new Set(followers.map(f => Number(f.follower_id)))].filter(Boolean);

    // Intersection (mutual follows)
    const followerSet = new Set(followerIds);
    const friendIds = followingIds.filter(id => followerSet.has(id));

    if (friendIds.length === 0) {
      return res.json([]);
    }

    // Fetch user + profile for friends
    const friends = await User.findAll({
      where: { id: friendIds },
      attributes: ['id', 'email'],
      include: [{ model: Profile, as: 'Profile', attributes: ['username', 'avatar_url'] }]
    });

    res.json(friends.map(f => f.toJSON()));
  } catch (err) {
    console.error('Failed to fetch friends:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
