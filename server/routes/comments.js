const express = require('express');
const authenticate = require('../middleware/auth');
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

const router = express.Router();

// POST create a comment
router.post('/:postId', authenticate, async (req, res) => {
     try {
          const { postId } = req.params;
          const { content, parent_comment_id } = req.body;
          const userId = req.user.userId;

          if(!content?.trim()) {
               return res.status(400).json({ error: 'Comment content is required' });
          }

          // Validates if the posts exists (prevents crash)
          const postExists = await sequelize.query(
               'SELECT 1 FROM posts WHERE id = :postId',
               { 
                    replacements: { postId },
                    type: QueryTypes.SELECT
               }
          );
          if (postExists.length === 0) {
               return res.status(400).json({ error: 'Post not found' });
          }

          // validate parent comment
          if (parent_comment_id) {
               const parentExists = await sequelize.query(
                    'SELECT 1 FROM comments WHERE id = :id AND post_id = :postId',
                    {
                         replacements: {
                              id: parent_comment_id,
                              postId
                         },
                         type: QueryTypes.SELECT
                         
                    }
               );
               if (parentExists.length === 0) {
                    return res.status(400).json({ error: 'Parent comment not found' });
               }
          }

          const result = await sequelize.query(
               `INSERT INTO comments (user_id, post_id, parent_comment_id, content, created_at)
               VALUES (:userId, :postId, :parent_comment_id, :content, NOW())
               RETURNING id, user_id, post_id, parent_comment_id, content, created_at
               `,
               {
                    replacements: {
                         userId,
                         postId,
                         parent_comment_id: parent_comment_id || null,
                         content: content.trim()
                    },
                    type: QueryTypes.INSERT
               }
          );

          const newComment = result[0][0];

          // Fetch comments's profile for response
          const profile = await sequelize.query(
               'SELECT username, avatar_url FROM profiles WHERE user_id = :userId',
               {
                    replacements: {
                         userId
                    },
                    type: QueryTypes.SELECT
               }
          );

          res.status(201).json({
               ...newComment,
               commenter: {
                    username: profile[0]?.username || 'Anonymous',
                    avatar_url: profile[0]?.avatar_url || null
               }
          });
     } catch (err) {
          console.error('Create comment error:', err);
          res.status(500).json({ error: 'Failed to create a comment' });
     }
});

// DELETE /api/comments/:commentId - Delete a comment
// User can delete: own comments on any post OR comments on their own post
router.delete('/:commentId', authenticate, async (req, res) => {
     try {
          const { commentId } = req.params;
          const userId = req.user.userId;

          console.log('Delete comment request - commentId:', commentId, 'userId:', userId);

          // Get comment with post owner info
          const comment = await sequelize.query(
               `SELECT c.id, c.user_id, c.post_id, p.user_id as post_owner_id
                FROM comments c
                JOIN posts p ON c.post_id = p.id
                WHERE c.id = :commentId`,
               {
                    replacements: { commentId },
                    type: QueryTypes.SELECT
               }
          );

          console.log('Comment found:', comment);

          if (comment.length === 0) {
               return res.status(404).json({ error: 'Comment not found' });
          }

          const { user_id: commentOwner, post_owner_id: postOwner } = comment[0];

          console.log('Authorization check - commentOwner:', commentOwner, 'postOwner:', postOwner, 'userId:', userId);

          // Authorization: can delete if own comment OR if own post
          if (userId !== commentOwner && userId !== postOwner) {
               return res.status(403).json({ error: 'Not authorized to delete this comment' });
          }

          // Delete related notifications first (foreign key constraint)
          await sequelize.query(
               'DELETE FROM notifications WHERE comment_id = :commentId',
               {
                    replacements: { commentId },
                    type: QueryTypes.DELETE
               }
          );

          const deleteResult = await sequelize.query(
               'DELETE FROM comments WHERE id = :commentId',
               {
                    replacements: { commentId },
                    type: QueryTypes.DELETE
               }
          );

          console.log('Delete result:', deleteResult);

          res.json({ message: 'Comment deleted successfully' });
     } catch (err) {
          console.error('Delete comment error:', err);
          res.status(500).json({ error: 'Failed to delete comment', details: err.message });
     }
});

// GET get all comments for a post
router.get('/:postId', authenticate, async (req, res) => {
     try {
          const { postId }  = req.params;

          const comments = await sequelize.query(
               `
               SELECT
                    c.id,
                    c.user_id,
                    c.post_id,
                    c.parent_comment_id,
                    c.content,
                    c.created_at,
                    p.username AS commenter_username,
                    p.avatar_url AS commenter_avatar
               FROM comments c
               LEFT JOIN profiles p
                    ON c.user_id = p.user_id
               WHERE c.post_id = :postId
               ORDER BY c.created_at DESC
               `,
               {
                    replacements: {
                         postId
                    },
                    type: QueryTypes.SELECT
               }       
          );
          res.json(comments);
     } catch (err) {
          console.error('Fetch comments error:', err);
          res.status(500).json({ error: 'Failed to fetch comments' });
     }
});

module.exports = router;
