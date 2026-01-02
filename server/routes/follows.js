// server/routes/follows.js
const express = require('express');
const authenticate = require('../middleware/auth');
const Follow = require('../models/Follow');
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

const router = express.Router();

// Follow user
router.post('/', authenticate, async (req, res) => {
     try {
          const { following_id } = req.body;
          if (following_id == req.user.userId) {
               return res.status(400).json({ error: 'Cannot follow yourself' });
          }
    
     // Create follow record — the trigger will auto-create notification
     const follow = await Follow.create({
          follower_id: req.user.userId,
          following_id
     });

     // Compute updated counts
     const followersRes = await sequelize.query(
          'SELECT COUNT(*)::int AS count FROM follows WHERE following_id = :id',
          { replacements: { id: following_id }, type: QueryTypes.SELECT }
     );
     const followingRes = await sequelize.query(
          'SELECT COUNT(*)::int AS count FROM follows WHERE follower_id = :id',
          { replacements: { id: req.user.userId }, type: QueryTypes.SELECT }
     );

     const followers_count = followersRes[0]?.count || 0;
     const following_count = followingRes[0]?.count || 0;

     res.status(201).json({ 
          follow, 
          userId: following_id, 
          followers_count, 
          following_count 
     });
     } catch (err) {
          if (err.name === 'SequelizeUniqueConstraintError') {
               return res.status(400).json({ error: 'Already following' });
          }
          console.error('Follow error:', err);
          res.status(500).json({ error: 'Server error' });
     }
});

// Unfollow
router.delete('/:followingId', authenticate, async (req, res) => {
     try {
     const deleted = await Follow.destroy({
          where: {
               follower_id: req.user.userId,
               following_id: req.params.followingId
          }
     });
          if (deleted) {
               // Compute updated counts after unfollow
               const followersRes = await sequelize.query(
               'SELECT COUNT(*)::int AS count FROM follows WHERE following_id = :id',
               { replacements: { id: req.params.followingId }, type: QueryTypes.SELECT }
               );
               const followingRes = await sequelize.query(
               'SELECT COUNT(*)::int AS count FROM follows WHERE follower_id = :id',
               { replacements: { id: req.user.userId }, type: QueryTypes.SELECT }
               );

          const followers_count = followersRes[0]?.count || 0;
          const following_count = followingRes[0]?.count || 0;

          res.json({ 
               message: 'Unfollowed', 
               userId: req.params.followingId, 
               followers_count, 
               following_count 
          });
          } else {
               res.status(404).json({ error: 'Follow not found' });
          }
          } catch (err) {
               console.error('Unfollow error:', err);
               res.status(500).json({ error: 'Server error' });
          }
});

// Check if current user follows a given user
router.get('/me/following/:userId', authenticate, async (req, res) => {
     try {
          const { userId } = req.params;
          const currentUserId = req.user.userId;

          const follow = await Follow.findOne({
               where: {
                    follower_id: currentUserId,
                    following_id: userId
               }
          });

          res.json({ isFollowing: !!follow });
     } catch (err) {
          console.error('Follow check error:', err);
          res.status(500).json({ error: 'Server error' });
     }
});

module.exports = router;