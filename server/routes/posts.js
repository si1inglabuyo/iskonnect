const express = require('express');
const router = express.Router(); // 
const authenticate = require('../middleware/auth');
const sequelize  = require('../config/database'); 
const { QueryTypes } = require('sequelize');
const Post = require('../models/Post');
const User = require('../models/User');
const Like = require('../models/Like');
const Profile = require('../models/Profile');

//  Create a new post
router.post('/', authenticate, async (req, res) => {
     try {
          const { content, image_url, shared_post_id } = req.body;
          console.log('Creating post for user ID:', req.user.userId);
          console.log('Post payload:', req.body);

          // If creating a normal post, require content or image. If sharing, shared_post_id is sufficient.
          if (!shared_post_id && !content && !image_url) {
               return res.status(400).json({ error: 'Post must have content, an image, or be a share' });
          }

          const post = await Post.create({
          user_id: req.user.userId,
          content: content || null,
          image_url: image_url || null,
          shared_post_id: shared_post_id || null
     });

     // Re-fetch created post including user  so the response shape matches GET /api/posts
     const createdPost = await Post.findOne({
          where: { id: post.id },
          include: [{
               model: User,
               attributes: ['id', 'email']
          }]
     });

     res.status(201).json({
          ...createdPost.toJSON(),
          like_count: 0,
          liked_by_user: false
     });
     } catch (err) {
          console.error('Post creation error:', err && err.stack ? err.stack : err);
          // include error message in response for easier debugging (remove in production)
          res.status(500).json({ error: 'Server error', message: err.message || err });
     }
});

// Get personalized feed (posts from users you follow + your own)
router.get('/', authenticate, async (req, res) => {
     try {
     const userId = req.user.userId;
     
     // Get IDs of users this user follows
     const following = await sequelize.query(
          `SELECT following_id FROM follows WHERE follower_id = :userId`,
          {
          replacements: { userId },
          type: QueryTypes.SELECT
          }
     );

     const followingIds = following.map(f => f.following_id);
     const followingIdSet = new Set(followingIds);

     followingIds.push(userId); // include own posts

     const posts = await Post.findAll({
          where: {
               user_id: followingIds
          },
          include: [
               {
               model: User,
               attributes: ['id', 'email'],
               include: [{
                    model: Profile,
                    as: 'Profile',
                    attributes: ['username', 'full_name', 'avatar_url']
               }]
               },
               // Include shared post info (if this post is a share)
               {
                    model: Post,
                    as: 'SharedPost',
                    include: [{
                         model: User,
                         attributes: ['id', 'email'],
                         include: [{
                              model: Profile,
                              as: 'Profile',
                              attributes: ['username', 'full_name', 'avatar_url']
                         }]
                    }]
               }
          ],
               order: [['created_at', 'DESC']]
          });

     // Augment each post with like_count and whether the current user liked it
     const postsWithLikesAndComments = await Promise.all(posts.map(async (p) => {
          const postId = p.id;
          
          // Like count
          const likeCount = await Like.count({ where: { post_id: postId } });

          // Comment count
          const commentResult = await sequelize.query(
               'SELECT COUNT(*)::int AS count FROM comments WHERE post_id = :postId',
               {
                    replacements: {
                         postId
                    },
                    type: QueryTypes.SELECT
               }
          );

          const commentCount = commentResult[0]?.count || 0;

          // Check if curr user liked the post
          const likedByUser = await Like.findOne({
               where: { post_id: postId, user_id: userId }
          });

          const savedByUser = await sequelize.query(
               'SELECT 1 FROM saved_posts WHERE user_id = :userId AND post_id = :postId',
               {
                    replacements: { userId, postId: p.id },
                    type: QueryTypes.SELECT 
               }
          );

          const isFollowing = followingIdSet.has(p.user_id);

          return {
               ...p.toJSON(),
               like_count: likeCount,
               comment_count: commentCount,
               liked_by_user: likedByUser !== null,
               saved_by_user: savedByUser.length > 0,
               user_is_following: isFollowing
          };
     }));

          res.json(postsWithLikesAndComments);
     } catch (err) {
          console.error('Feed fetch error:', err);
          res.status(500).json({ error: 'Server error' });
     }
});

// Get post by user ID (for public profiles)
router.get('/user/:userId', async (req, res) => {
     try {
          const { userId } = req.params;

          const posts = await Post.findAll({
               where: { user_id: userId },
               order: [['created_at', 'DESC']],
               include: [{
                    model: User,
                    attributes: ['id', 'email'],
                    include: [{
                         model: Profile,
                         as: 'Profile',
                         attributes: ['username', 'full_name', 'avatar_url']
                    }]
               }]
          });

          res.json(posts)
     } catch (err) {
          console.error('Fetch user posts error:', err);
          res.status(500).json({ error: 'Server error' });
     }
});

// DELETE /api/posts/:id - Delete a post (only by the post owner)
router.delete('/:id', authenticate, async (req, res) => {
     try {
          const { id } = req.params;
          const userId = req.user.userId;

          const post = await Post.findByPk(id);
          if (!post) {
               return res.status(404).json({ error: 'Post not found' });
          }

          if (post.user_id !== userId) {
               return res.status(403).json({ error: 'Not authorized to delete this post' });
          }

          // Delete related data due to foreign key constraints
          // Delete notifications related to this post's comments
          await sequelize.query(
               `DELETE FROM notifications WHERE comment_id IN (SELECT id FROM comments WHERE post_id = :postId)`,
               {
                    replacements: { postId: id },
                    type: QueryTypes.DELETE
               }
          );

          // Delete notifications related to this post (likes)
          await sequelize.query(
               `DELETE FROM notifications WHERE post_id = :postId`,
               {
                    replacements: { postId: id },
                    type: QueryTypes.DELETE
               }
          );

          // Delete comments
          await sequelize.query(
               `DELETE FROM comments WHERE post_id = :postId`,
               {
                    replacements: { postId: id },
                    type: QueryTypes.DELETE
               }
          );

          // Delete likes
          await sequelize.query(
               `DELETE FROM likes WHERE post_id = :postId`,
               {
                    replacements: { postId: id },
                    type: QueryTypes.DELETE
               }
          );

          // Delete saved posts
          await sequelize.query(
               `DELETE FROM saved_posts WHERE post_id = :postId`,
               {
                    replacements: { postId: id },
                    type: QueryTypes.DELETE
               }
          );

          // Finally delete the post
          await post.destroy();
          res.json({ message: 'Post deleted successfully' });
     } catch (err) {
          console.error('Delete post error:', err);
          res.status(500).json({ error: 'Server error', details: err.message });
     }
});

// GET /api/posts/:id — get single post with like/comment stats
router.get('/:id', authenticate, async (req, res) => {
     try {
          const { id } = req.params;
          const userId = req.user.userId;

          const post = await Post.findByPk(id, {
               include: [
                    {
                    model: User,
                    attributes: ['id', 'email'],
                    include: [{
                         model: Profile,
                         as: 'Profile',
                         attributes: ['username', 'full_name', 'avatar_url']
                    }]
                    },
                    {
                         model: Post,
                         as: 'SharedPost',
                         include: [{
                              model: User,
                              attributes: ['id', 'email'],
                              include: [{
                                   model: Profile,
                                   as: 'Profile',
                                   attributes: ['username', 'full_name', 'avatar_url']
                              }]
                         }]
                    }
               ]
          });

          if (!post) {
               return res.status(404).json({ error: 'Post not found' });
          }

          const likeCount = await Like.count({ where: { post_id: id} });
          const commentResult = await sequelize.query(
               'SELECT COUNT(*)::int AS count FROM comments WHERE post_id = :postId',
               {
                    replacements: { postId: id },
                    type: QueryTypes.SELECT
               }
          );
          const commentCount = commentResult[0]?.count || 0;

          const likedByUser = await Like.findOne({
               where: { post_id: id, user_id: userId }
          });

          const savedByUser = await sequelize.query(
               'SELECT 1 FROM saved_posts WHERE user_id = :userId AND post_id = :postId',
               {
                    replacements: { userId, postId: id },
                    type: QueryTypes.SELECT
               }
          );

          res.json({
               ...post.toJSON(),
               like_count: likeCount,
               comment_count: commentCount,
               liked_by_user: !!likedByUser,
               saved_by_user: savedByUser.length > 0
          });
     } catch (err) {
          console.error('Fetch single post error:', err);
          res.status(500).json({ error: 'Server error' });
     }
})

// PUT /api/posts/:id - Edit a post (only by the post owner)
router.put('/:id', authenticate, async (req, res) => {
     try {
          const { id } = req.params;
          const userId = req.user.userId;
          const { content, image_url } = req.body;

          // stored procedure to update post
          await sequelize.query(
               'CALL update_post(:postId, :userId, :content, :imageUrl)',
               {
                    replacements: {
                         postId: id,
                         userId: userId,
                         content: content !== undefined ? content : null,
                         imageUrl: image_url !== undefined ? image_url : null
                    },
                    type: QueryTypes.RAW
               }
          );

          // Re-fetch full post with includes to return same shape as GET
          const updated = await Post.findByPk(id, {
               include: [
                    {
                    model: User,
                    attributes: ['id', 'email'],
                    include: [{
                         model: Profile,
                         as: 'Profile',
                         attributes: ['username', 'full_name', 'avatar_url']
                    }]
                    },
                    {
                         model: Post,
                         as: 'SharedPost',
                         include: [{
                              model: User,
                              attributes: ['id', 'email'],
                              include: [{
                                   model: Profile,
                                   as: 'Profile',
                                   attributes: ['username', 'full_name', 'avatar_url']
                              }]
                         }]
                    }
               ]
          });

          res.json({ ...updated.toJSON() });
     } catch (err) {
          console.error('Edit post error:', err);
          res.status(500).json({ error: err.message || 'Server error' });
     }
});

module.exports = router;