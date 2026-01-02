const express = require('express')
const authenticate = require('../middleware/auth');
const Like = require('../models/Like');

const router = express.Router();

// likes a post
router.post('/', authenticate, async (req, res) => {
     try {
          const { post_id } = req.body;
          const postId = parseInt(post_id, 10);
          if (isNaN(postId)) {
               return res.status(400).json({ error: 'Invalid post_id' });
          }

          const like = await Like.create({
               user_id: req.user.userId,
               post_id: postId
          });
          res.status(201).json(like);
     } catch (err) {
          console.error('Like creation error:', {
               message: err.message,
               name: err.name,
               stack: err.stack,
               parent: err.parent,
               original: err.original,
               sql: err.sql
          });
          if(err.name === 'SequelizeUniqueConstraintError') {
               return res.status(400).json({ error: 'Already like this post' });
          }
          res.status(500).json({ error: 'Server error' });
     }
});

// Unlike a post
router.delete('/:postId', authenticate, async (req, res) => {
     try {

          const postId = parseInt(req.params.postId, 10);
          if (isNaN(postId)) {
               return res.status(400).json({ error: 'Invalid post ID' });
          }
          const deleted = await Like.destroy({
               where: {
                    user_id: req.user.userId,
                    post_id: req.params.postId
               }
          });
          if(deleted) {
               res.json({ message: 'Unliked' });
          } else {
               res.status(404).json({ error: 'Like not found'});
          }
     }    catch(err) {
              console.error('Like delete error:', err && err.stack ? err.stack : err);
              res.status(500).json({ error: 'Server error' });
     }
});

module.exports = router;