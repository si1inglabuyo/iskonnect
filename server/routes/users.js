const express = require('express');
const authenticate = require('../middleware/auth');
const User = require('../models/User');
const Profile = require('../models/Profile');
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const { Op } = require('sequelize'); 

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
     try {
          const userId = parseInt(req.user.userId, 10);

          // Get IDs of users already following
          const following = await sequelize.query(
               `SELECT following_id FROM follows WHERE follower_id = :userId`,
               {
                    replacements: { userId },
                    type: QueryTypes.SELECT
               }
          );
          const followingIds = following.map(f => parseInt(f.following_id), 10);

          // Get followers (for mutual count)
          const followers = await sequelize.query(
               `SELECT follower_id FROM follows WHERE following_id = :userId`,
               {
                    replacements: { userId },
                    type: QueryTypes.SELECT
               }
          );
          const followerIds = followers.map(f => parseInt(f.follower_id, 10));

          // Fetch users you dont follow
          const users = await User.findAll({
               where: {
                    id: {
                         [Op.notIn] : [...followingIds, userId] //excluse self and followed users
                    }
               },
               
               attributes: ['id'],
               include: [{
                    model: Profile,
                    as: 'Profile',
                    attributes: ['username', 'full_name', 'avatar_url']
               }],
               order: [['created_at', 'DESC']]
          });

          // Add is_following and mutual info
          const usersWithExtras = await Promise.all(
               users
                    .filter(user => user.Profile)
                    .map(async (user) => {
                         // Mutual count
                         let mutualCount = 0;
                         let mutualUsername = null;

                         if (followerIds.length > 0) {
                              // Count mutual followers
                              const countResult = await sequelize.query(
                                   `SELECT COUNT(*)::int AS count
                                   FROM follows
                                   WHERE following_id = :suggestedUserId
                                   AND follower_id = ANY(ARRAY[:followerIds]::int[])`,
                                   {
                                        replacements: {
                                             suggestedUserId: user.id,
                                             followerIds: followerIds
                                        },
                                        type: QueryTypes.SELECT
                                   }
                              );
                              mutualCount = countResult[0]?.count || 0;

                              // Get one mutual username
                              if (mutualCount > 0) {
                                   const mutualResult = await sequelize.query(
                                        `SELECT p.username
                                        FROM follows f
                                        JOIN profiles p
                                             ON f.follower_id = p.user_id
                                             WHERE f.following_id = :suggestedUserId
                                             AND f.follower_id = ANY(ARRAY[:followerIds]::int[])
                                             LIMIT 1`,
                                             {
                                                  replacements: {
                                                       suggestedUserId: user.id,
                                                       followerIds: followerIds
                                                  },
                                                  type: QueryTypes.SELECT
                                             }
                                   );
                                   mutualUsername = mutualResult[0]?.username;
                              }
                         }
                         return {
                              ...user.toJSON(),
                              is_following: false,
                              mutual_count: mutualCount,
                              mutual_username: mutualUsername
                         };
                    })
          );

          res.json(usersWithExtras);
     } catch(err) {
          console.error('Fetching users for discovery ERROR!', err);
          res.status(500).json({ error: 'Failed to fetch users' });
     }
});

// GET /api/users/:id - Get a specific user by ID
router.get('/:id', authenticate, async (req, res) => {
     try {
          const { id } = req.params;
          
          const user = await User.findByPk(id, {
               attributes: ['id', 'email', 'created_at'],
               include: [{
                    model: Profile,
                    as: 'Profile',
                    attributes: ['username', 'full_name', 'avatar_url', 'bio', 'website']
               }]
          });

          if (!user) {
               return res.status(404).json({ error: 'User not found' });
          }

          res.json(user);
     } catch (err) {
          console.error('Failed to fetch user:', err);
          res.status(500).json({ error: 'Failed to fetch user' });
     }
});

module.exports = router;


