const express = require('express');
const authenticate = require('../middleware/auth');
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

const router = express.Router();

// Save post 
router.post('/', authenticate, async (req, res) => {
     try {
          const userId = req.user.userId;
          const { post_id } = req.body;

          if (!post_id) {
               return res.status(400).json({ error: 'post_id is required' });
          }

          // Check if post exists
          const postExists = await sequelize.query(
               'SELECT 1 FROM posts WHERE id = :postId',
               { replacements: { postId: post_id }, type: QueryTypes.SELECT }
          );
          if (postExists.length === 0) {
               return res.status(400).json({ error: 'Post not found' });
          }

          // Save post
          await sequelize.query(
               `INSERT INTO saved_posts (user_id, post_id)
               VALUES (:userId, :postId)
               ON CONFLICT (user_id, post_id) DO NOTHING`,
               {
                    replacements: { userId, postId: post_id },
                    type: QueryTypes.INSERT
               }
          );

          res.status(201).json({ message: 'Post saved' });
     } catch (err) {
          console.error('Save post error', err);
          res.status(500).json({ error: 'Server error' });
     }
});

// Unsave post
router.delete('/:postId', authenticate, async (req, res) => {
     try {
          const { postId } = req.params;
          const userId = req.user.userId;

          const deleted = await sequelize.query(
               `DELETE FROM saved_posts
               WHERE user_id = :userId AND post_id = :postId`,
               {
                    replacements: { userId, postId },
                    type: QueryTypes.DELETE
               }
          );

          if (deleted[1] === 0) {
               return res.status(404).json({ error: 'Save not found' });
          }

          res.json({ message: 'Post unsaved' });
     } catch (err) {
          console.error('Unsave post error:', err);
          res.status(500).json({ error: 'Server error' });
     }
});

// Ger all saved posts for current user
router.get('/', authenticate, async (req, res) => {
     try {
          const userId = req.user.userId;

          const savedPosts = await sequelize.query(
               `SELECT
                    p.id, p.content, p.image_url, p.created_at,
                    u.id AS user_id,
                    pr.username AS author_username,
                    pr.avatar_url AS author_avatar
                    
               FROM saved_posts sp
               JOIN posts p
                    ON sp.post_id = p.id
               JOIN users u
                    ON p.user_id = u.id
               LEFT JOIN profiles pr
                    ON u.id = pr.user_id
               WHERE sp.user_id = :userId
               ORDER BY sp.created_at DESC`,
               {
                    replacements: { userId },
                    type: QueryTypes.SELECT
               }
          );
          res.json(savedPosts);
     } catch (err) {
          console.error('Fetch saved posts error:', err);
     }
});

module.exports = router;