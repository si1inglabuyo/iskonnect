const express = require('express');
const authenticate = require('../middleware/auth');
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
     try {
          const { q } = req.query;
          if (!q || q.trim().length < 2) {
               return res.status(400).json({ error: 'Search term must be at least 2 characters' });
          }

          const term = `%${q.trim()}%`;

          // Search users (by username or full name)
          const users = await sequelize.query(
               `
               SELECT
                    u.id,
                    p.username, 
                    p.full_name,
                    p.avatar_url
               FROM users u
               LEFT JOIN profiles p
                    ON u.id = p.user_id
               WHERE p.username ILIKE :term OR p.full_name ILIKE :term
               LIMIT 10
               `,
               { replacements: { term }, type: QueryTypes.SELECT }
          );

          // Search post (by content)
          const posts = await sequelize.query(
               `
               SELECT
                    po.id,
                    po.content,
                    po.image_url,
                    po.created_at,
                    u.id AS user_id,
                    pr.username AS author_username,
                    pr.avatar_url AS author_avatar
               FROM posts po
               JOIN users u 
                    ON po.user_id = u.id
               LEFT JOIN profiles pr 
                    ON u.id = pr.user_id
               WHERE po.content ILIKE :term
               ORDER BY po.created_at DESC
               LIMIT 10
               `,
               { replacements: { term }, type: QueryTypes.SELECT }
          );
          res.json({ users, posts });
     } catch (err) {
          console.error('Search error:', err);
          res.status(500).json({ error: 'Search failed' });
     }
});

module.exports = router;