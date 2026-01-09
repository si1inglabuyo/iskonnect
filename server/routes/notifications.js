// server/routes/notifications.js
const express = require('express');
const authenticate = require('../middleware/auth');
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

const router = express.Router();

// GET /api/notifications — fetch user's notifications (excluding message type)
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    const notifications = await sequelize.query(
      `
      SELECT 
        n.id,
        n.user_id,
        n.actor_id,
        n.action_type,
        n.post_id,
        n.comment_id,
        n.conversation_id,
        n.is_read,
        n.created_at,
        actor_profile.username AS actor_username,
        actor_profile.avatar_url AS actor_avatar
      FROM notifications n
      LEFT JOIN profiles actor_profile ON n.actor_id = actor_profile.user_id
      WHERE n.user_id = :userId
        AND n.action_type != 'message'
      ORDER BY n.created_at DESC
      LIMIT 50
      `,
      {
        replacements: { userId },
        type: QueryTypes.SELECT
      }
    );

    res.json(notifications);
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PATCH /api/notifications/:id — mark single as read
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await sequelize.query(
      `
      UPDATE notifications 
      SET is_read = true 
      WHERE id = :id AND user_id = :userId
      RETURNING id
      `,
      {
        replacements: { id, userId },
        type: QueryTypes.UPDATE
      }
    );

    if (result[1] === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// PATCH /api/notifications — mark all as read
router.patch('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    await sequelize.query(
      `
      UPDATE notifications 
      SET is_read = true 
      WHERE user_id = :userId AND is_read = false
      `,
      {
        replacements: { userId },
        type: QueryTypes.UPDATE
      }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

module.exports = router;