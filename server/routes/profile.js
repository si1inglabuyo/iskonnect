const express = require('express');
const authenticate = require('../middleware/auth');
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

const router = express.Router();

// Get /api/profle - get currentr user's profile and stats
router.get('/', authenticate, async (req, res) => {
     try {
          const userId = req.user.userId;

          let p;
          try {
               const result = await sequelize.query(
                    'SELECT * FROM get_user_profile(:userId)',
                    {
                         replacements: { userId },
                         type: QueryTypes.SELECT
                    }
               );

               if (result && result.length > 0) {
                    p = result[0];
               }
          } catch (innerErr) {
               console.warn('get_user_profile function failed, falling back to inline query:', innerErr && innerErr.message ? innerErr.message : innerErr);
          }

          // Fallback: if stored proc didn't return anything, build profile from tables
          if (!p) {
               const fallback = await sequelize.query(
                    `SELECT u.id, u.email, p.username, p.full_name, p.bio, p.avatar_url, p.website,
                            (SELECT COUNT(*) FROM posts WHERE user_id = u.id) AS posts_count,
                            (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers_count,
                            (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following_count
                     FROM users u
                     LEFT JOIN profiles p ON p.user_id = u.id
                     WHERE u.id = :userId`,
                    { replacements: { userId }, type: QueryTypes.SELECT }
               );

               if (!fallback || fallback.length === 0) {
                    return res.status(400).json({ error: 'Profile not found' });
               }
               p = fallback[0];
          }

          res.json({
               user: {
                    id: p.id,
                    username: p.username,
                    full_name: p.full_name,
                    bio: p.bio,
                    avatar_url: p.avatar_url,
                    website: p.website
               },
               stats: {
                    posts: parseInt(p.posts_count || 0, 10),
                    followers: parseInt(p.followers_count || 0, 10),
                    following: parseInt(p.following_count || 0, 10)
               }
          });
     } catch (err) {
          console.error('Profile fetch error:', err);
          res.status(500).json({ error: 'Server error' });
     }
});



// GET /api/profile/:id - get public profile and stats for a specific user (no auth required)
router.get('/:id', async (req, res) => {
     try {
          const { id } = req.params;

          let p;
          try {
               const result = await sequelize.query(
                    'SELECT * FROM get_user_profile(:userId)',
                    {
                         replacements: { userId: id },
                         type: QueryTypes.SELECT
                    }
               );

               if (result && result.length > 0) {
                    p = result[0];
               }
          } catch (innerErr) {
               console.warn('get_user_profile function failed, falling back to inline query:', innerErr && innerErr.message ? innerErr.message : innerErr);
          }

          // Fallback: if stored proc didn't return anything, build profile from tables
          if (!p) {
               const fallback = await sequelize.query(
                    `SELECT u.id, u.email, p.username, p.full_name, p.bio, p.avatar_url, p.website,
                            (SELECT COUNT(*) FROM posts WHERE user_id = u.id) AS posts_count,
                            (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers_count,
                            (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following_count
                     FROM users u
                     LEFT JOIN profiles p ON p.user_id = u.id
                     WHERE u.id = :userId`,
                    { replacements: { userId: id }, type: QueryTypes.SELECT }
               );

               if (!fallback || fallback.length === 0) {
                    return res.status(404).json({ error: 'Profile not found' });
               }
               p = fallback[0];
          }

          res.json({
               user: {
                    id: p.id,
                    email: p.email,
                    username: p.username,
                    full_name: p.full_name,
                    bio: p.bio,
                    avatar_url: p.avatar_url,
                    website: p.website
               },
               stats: {
                    posts: parseInt(p.posts_count || 0, 10),
                    followers: parseInt(p.followers_count || 0, 10),
                    following: parseInt(p.following_count || 0, 10)
               }
          });
     } catch (err) {
          console.error('Public profile fetch error:', err);
          res.status(500).json({ error: 'Server error' });
     }
});

// PUT /api/profile -> gagamitin dito yung stored proc na update_user_profile
router.put('/', authenticate, async (req, res) => {
     try {
          const userId = req.user.userId;
          const { username, full_name, bio, website, avatar_url } = req.body;

          // If username is provided, validate uniqueness and update the profiles table directly
          if (username != null) {
               const existing = await sequelize.query(
                    'SELECT id FROM profiles WHERE username = :username AND user_id != :userId',
                    { replacements: { username: username.trim(), userId }, type: QueryTypes.SELECT }
               );
               if (existing.length > 0) {
                    return res.status(400).json({ error: 'Username already taken' });
               }

               await sequelize.query(
                    'UPDATE profiles SET username = :username WHERE user_id = :userId',
                    { replacements: { username: username.trim() || null, userId }, type: QueryTypes.RAW }
               );
          }

          // Try to call stored procedure; if it fails, fall back to inline update
          try {
               await sequelize.query(
                    'CALL update_user_profile(:userId, :full_name, :bio, :website, :avatar_url)',
                    {
                         replacements: {
                              userId,
                              full_name: full_name?.trim() || null,
                              bio: bio?.trim() || null,
                              website: website?.trim() || null,
                              avatar_url: avatar_url || null
                         },
                         type: QueryTypes.RAW
                    }
               );
          } catch (procErr) {
               console.warn('update_user_profile failed, falling back to inline update:', procErr && procErr.message ? procErr.message : procErr);
               // Inline update profiles table
               await sequelize.query(
                    `UPDATE profiles SET 
                         full_name = :full_name,
                         bio = :bio,
                         website = :website,
                         avatar_url = :avatar_url
                     WHERE user_id = :userId`,
                    {
                         replacements: {
                              userId,
                              full_name: full_name?.trim() || null,
                              bio: bio?.trim() || null,
                              website: website?.trim() || null,
                              avatar_url: avatar_url || null
                         },
                         type: QueryTypes.RAW
                    }
               );
          }

          // Re-fetch updated profile using inline SELECT (avoid depending on stored proc)
          const result = await sequelize.query(
               `SELECT u.id, u.email, p.username, p.full_name, p.bio, p.avatar_url, p.website
                FROM users u
                LEFT JOIN profiles p ON p.user_id = u.id
                WHERE u.id = :userId`,
               { replacements: { userId }, type: QueryTypes.SELECT }
          );

          const p = result[0];
          res.json({
               id: p.id,
               username: p.username,
               bio: p.bio,
               avatar_url: p.avatar_url,
               website: p.website
          });
     } catch (err) {
          console.error('Profle update error:', err);
          if(err.message?.includes('Profile not found')) {
               return res.status(400).json({ error: 'Profile not found' });
          }
          res.status(500).json({ error: 'Server error' });
     }
})

module.exports = router;
