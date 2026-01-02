const express = require('express');
const authenticate = require('../middleware/auth');
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

const router = express.Router();


// GET /api/messages - List all convo
router.get('/', authenticate, async (req, res) => {
     try {
          const userId = req.user.userId;

          const conversations = await sequelize.query(
               `SELECT
                    c.id,
                    c.created_at,
                    c.is_group,
                    c.group_name,
                    c.group_avatar_url,
                    -- for 1-on-1, pick the other participant via subquery
                    (SELECT p.user_id FROM participants p WHERE p.conversation_id = c.id AND p.user_id != :userId LIMIT 1) AS other_user_id,
                    (SELECT pr.username FROM profiles pr WHERE pr.user_id = (SELECT p.user_id FROM participants p WHERE p.conversation_id = c.id AND p.user_id != :userId LIMIT 1)) AS other_username,
                    (SELECT pr.avatar_url FROM profiles pr WHERE pr.user_id = (SELECT p.user_id FROM participants p WHERE p.conversation_id = c.id AND p.user_id != :userId LIMIT 1)) AS other_avatar,
                    m.content AS last_message,
                    m.created_at AS last_message_at,
                    m.sender_id,
                    (SELECT pr.username FROM profiles pr WHERE pr.user_id = m.sender_id) AS sender_username,
                    m.sender_id = :userId AS is_own_message,
                    COUNT(unread.id) AS unread_count
               FROM conversations c
               JOIN participants p1
                    ON c.id = p1.conversation_id AND p1.user_id = :userId
               LEFT JOIN messages m 
                    ON m.id = (
                         SELECT id FROM messages
                         WHERE conversation_id = c.id
                         ORDER BY created_at DESC
                         LIMIT 1
                    )
               LEFT JOIN messages unread ON unread.conversation_id = c.id
                    AND unread.sender_id != :userId
                    AND unread.is_read = false
               WHERE p1.user_id = :userId
               GROUP BY c.id, c.created_at, c.is_group, c.group_name, c.group_avatar_url, m.content, m.created_at, m.sender_id
               ORDER BY m.created_at DESC NULLS LAST, c.created_at DESC`,
                    {
                         replacements: { userId },
                         type: QueryTypes.SELECT
                    }
          );

          res.json(conversations);
     } catch (err) {
          console.error('Fetch conversations error:', err);
          res.status(500).json({ error: 'Failed to fetch conversations' });
     }
});

// POST api/messages/create - Create new conversation without initial message
router.post('/create', authenticate, async (req, res) => {
     const { recipient_id } = req.body;
     const sender_id = req.user.userId;

     if (!recipient_id) {
          return res.status(400).json({ error: 'recipient_id required' });
     }

     if (sender_id === recipient_id) {
          return res.status(400).json({ error: 'Cannot message yourself' });
     }

     try {
          // Check if conversation exists already
          const existingConv = await sequelize.query(
               `SELECT c.id
               FROM conversations c
               JOIN participants p1
                    ON c.id = p1.conversation_id AND p1.user_id = :sender_id
               JOIN participants p2
                    ON c.id = p2.conversation_id AND p2.user_id = :recipient_id`,
               {
                    replacements: { sender_id, recipient_id },
                    type: QueryTypes.SELECT
               }
          );

          let conversation_id;
          if (existingConv.length > 0) {
               conversation_id = existingConv[0].id;
          } else {
               // Create new conversation without message
               const convResult = await sequelize.query(
                    'INSERT INTO conversations DEFAULT VALUES RETURNING id',
                    { type: QueryTypes.INSERT }
               );
               conversation_id = convResult[0][0].id;

               // Add participants
               await sequelize.query(
                    'INSERT INTO participants (conversation_id, user_id) VALUES (:cid, :uid1), (:cid, :uid2)',
                    {
                         replacements: { cid: conversation_id, uid1: sender_id, uid2: recipient_id },
                         type: QueryTypes.INSERT
                    }
               );
          }

          res.status(201).json({
               conversation_id,
               message: 'Conversation created'
          });
     } catch (err) {
          console.error('Create conversation error:', err);
          res.status(500).json({ error: 'Failed to create conversation' });
     }
});

// POST api/messages - Send message (to user or group)
router.post('/', authenticate, async (req, res) => {
     const { recipient_id, conversation_id, content, parent_message_id } = req.body;
     const sender_id = req.user.userId;

     if (!content) {
          return res.status(400).json({ error: 'content required' });
     }

     // Either conversation_id (for group) or recipient_id (for 1-on-1)
     if (!conversation_id && !recipient_id) {
          return res.status(400).json({ error: 'conversation_id or recipient_id required' });
     }

     if (recipient_id && sender_id === recipient_id) {
          return res.status(400).json({ error: 'Cannot message yourself' });
     }

     try {
          let convo_id = conversation_id;

          // If no conversation_id, find or create 1-on-1 conversation
          if (!convo_id) {
               const existingConv = await sequelize.query(
                    `SELECT c.id
                    FROM conversations c
                    WHERE c.is_group = false
                    AND c.id IN (
                         SELECT conversation_id FROM participants WHERE user_id = :sender_id
                    )
                    AND c.id IN (
                         SELECT conversation_id FROM participants WHERE user_id = :recipient_id
                    )`,
                    {
                         replacements: { sender_id, recipient_id },
                         type: QueryTypes.SELECT
                    }
               );

               if (existingConv.length > 0) {
                    convo_id = existingConv[0].id;
               } else {
                    // Create new conversation
                    const convResult = await sequelize.query(
                         'INSERT INTO conversations (is_group, created_at) VALUES (false, NOW()) RETURNING id',
                         { type: QueryTypes.INSERT }
                    );
                    convo_id = convResult[0][0].id;

                    // Add participants
                    await sequelize.query(
                         'INSERT INTO participants (conversation_id, user_id) VALUES (:cid, :uid1), (:cid, :uid2)',
                         {
                              replacements: { cid: convo_id, uid1: sender_id, uid2: recipient_id },
                              type: QueryTypes.INSERT
                         }
                    );
               }
          }

          // Verify user is participant in conversation
          const isParticipant = await sequelize.query(
               'SELECT 1 FROM participants WHERE conversation_id = :cid AND user_id = :uid',
               {
                    replacements: { cid: convo_id, uid: sender_id },
                    type: QueryTypes.SELECT
               }
          );

          if (isParticipant.length === 0) {
               return res.status(403).json({ error: 'Not authorized' });
          }

          // Insert message
          const messageResult = await sequelize.query(
               `INSERT INTO messages (conversation_id, sender_id, content, parent_message_id, created_at)
               VALUES (:cid, :sid, :content, :parent_id, NOW())
               RETURNING id, created_at`,
               {
                    replacements: { cid: convo_id, sid: sender_id, content, parent_id: parent_message_id || null },
                    type: QueryTypes.INSERT
               }
          );

          const message = {
               id: messageResult[0][0].id,
               conversation_id: convo_id,
               sender_id,
               content,
               parent_message_id: parent_message_id || null,
               created_at: messageResult[0][0].created_at
          };

          res.status(201).json(message);
     } catch (err) {
          console.error('Send message error:', err);
          res.status(500).json({ error: 'Failed to send message' });
     }
});


// POST /api/messages/group/create - Create a group conversation
router.post('/group/create', authenticate, async (req, res) => {
     const { group_name, member_ids } = req.body;
     const creator_id = req.user.userId;

     if (!group_name || !member_ids || !Array.isArray(member_ids)) {
          return res.status(400).json({ error: 'group_name and member_ids array required' });
     }

     if (member_ids.length < 2) {
          return res.status(400).json({ error: 'Group must have at least 2 members' });
     }

     if (!member_ids.includes(creator_id)) {
          member_ids.push(creator_id);
     }

     try {
          // Create group conversation
          const convResult = await sequelize.query(
               `INSERT INTO conversations (is_group, group_name, created_by, created_at)
               VALUES (true, :group_name, :creator_id, NOW())
               RETURNING id`,
               {
                    replacements: { group_name, creator_id },
                    type: QueryTypes.INSERT
               }
          );

          const conversation_id = convResult[0][0].id;

          // Add all members as participants
          const participantValues = member_ids
               .map((id, idx) => `(:cid, :uid${idx})`)
               .join(',');
          const participantReplacements = { cid: conversation_id };
          member_ids.forEach((id, idx) => {
               participantReplacements[`uid${idx}`] = id;
          });

          await sequelize.query(
               `INSERT INTO participants (conversation_id, user_id) VALUES ${participantValues}`,
               {
                    replacements: participantReplacements,
                    type: QueryTypes.INSERT
               }
          );

          res.status(201).json({
               conversation_id,
               group_name,
               is_group: true,
               members: member_ids,
               message: 'Group conversation created'
          });
     } catch (err) {
          console.error('Create group conversation error:', err);
          res.status(500).json({ error: 'Failed to create group conversation' });
     }
});

// POST /api/messages/group/:id/members - Add members to group
router.post('/group/:id/members', authenticate, async (req, res) => {
     const { id } = req.params;
     const { member_ids } = req.body;
     const userId = req.user.userId;

     if (!member_ids || !Array.isArray(member_ids)) {
          return res.status(400).json({ error: 'member_ids array required' });
     }

     try {
          // Check if user is group member
          const isParticipant = await sequelize.query(
               'SELECT 1 FROM participants WHERE conversation_id = :cid AND user_id = :uid',
               {
                    replacements: { cid: id, uid: userId },
                    type: QueryTypes.SELECT
               }
          );

          if (isParticipant.length === 0) {
               return res.status(403).json({ error: 'Not authorized' });
          }

          // Add new members --- determine which are actually new so we can create system messages
          const idPlaceholders = member_ids.map((_, idx) => `:mid${idx}`).join(',');
          const existsReplacements = { cid: id };
          member_ids.forEach((memberId, idx) => {
               existsReplacements[`mid${idx}`] = memberId;
          });

          const existing = await sequelize.query(
               `SELECT user_id FROM participants WHERE conversation_id = :cid AND user_id IN (${idPlaceholders})`,
               {
                    replacements: existsReplacements,
                    type: QueryTypes.SELECT
               }
          );

          const existingIds = new Set(existing.map(r => r.user_id));
          const newMemberIds = member_ids.filter(mid => !existingIds.has(mid));

          // Insert participants (use ON CONFLICT to avoid duplicates)
          const values = member_ids
               .map((memberId, idx) => `(:cid, :mid${idx})`)
               .join(',');
          const replacements = { cid: id };
          member_ids.forEach((memberId, idx) => {
               replacements[`mid${idx}`] = memberId;
          });

          await sequelize.query(
               `INSERT INTO participants (conversation_id, user_id) VALUES ${values}
               ON CONFLICT DO NOTHING`,
               {
                    replacements,
                    type: QueryTypes.INSERT
               }
          );

          // If there are newly added members, create a system message announcing them
          if (newMemberIds.length > 0) {
               // Get adder username
               const adderRes = await sequelize.query(
                    'SELECT username FROM profiles WHERE user_id = :uid',
                    { replacements: { uid: userId }, type: QueryTypes.SELECT }
               );
               const adderUsername = adderRes[0]?.username || 'User';

               // Get usernames for new members
               const memberPlaceholders = newMemberIds.map((_, idx) => `:nm${idx}`).join(',');
               const memberRepls = {};
               newMemberIds.forEach((m, idx) => memberRepls[`nm${idx}`] = m);

               const newMembersInfo = await sequelize.query(
                    `SELECT u.id, COALESCE(pr.username, 'User') AS username
                    FROM users u
                    LEFT JOIN profiles pr ON u.id = pr.user_id
                    WHERE u.id IN (${memberPlaceholders})`,
                    { replacements: memberRepls, type: QueryTypes.SELECT }
               );

               const addedNames = newMembersInfo.map(r => r.username);
               const content = `${adderUsername} added ${addedNames.join(', ')}`;

               await sequelize.query(
                    'INSERT INTO messages (conversation_id, sender_id, content, created_at) VALUES (:cid, :uid, :content, NOW())',
                    {
                         replacements: { cid: id, uid: userId, content },
                         type: QueryTypes.INSERT
                    }
               );
          }

          res.json({ message: 'Members added successfully' });
     } catch (err) {
          console.error('Add members error:', err);
          res.status(500).json({ error: 'Failed to add members' });
     }
});

// GET /api/messages/group/:id - Get group info and members
router.get('/group/:id', authenticate, async (req, res) => {
     try {
          const { id } = req.params;
          const userId = req.user.userId;

          // Verify user is participant
          const isParticipant = await sequelize.query(
               'SELECT 1 FROM participants WHERE conversation_id = :cid AND user_id = :uid',
               {
                    replacements: { cid: id, uid: userId },
                    type: QueryTypes.SELECT
               }
          );

          if (isParticipant.length === 0) {
               return res.status(403).json({ error: 'Not authorized' });
          }

          // Get group info
          const groupInfo = await sequelize.query(
               `SELECT c.id, c.group_name, c.group_avatar_url, c.group_description, c.created_by, c.created_at
               FROM conversations c
               WHERE c.id = :cid AND c.is_group = true`,
               {
                    replacements: { cid: id },
                    type: QueryTypes.SELECT
               }
          );

          if (groupInfo.length === 0) {
               return res.status(404).json({ error: 'Group not found' });
          }

          // Get all members
          const members = await sequelize.query(
               `SELECT u.id, pr.username, pr.avatar_url
               FROM participants p
               JOIN users u ON p.user_id = u.id
               LEFT JOIN profiles pr ON u.id = pr.user_id
               WHERE p.conversation_id = :cid`,
               {
                    replacements: { cid: id },
                    type: QueryTypes.SELECT
               }
          );

          res.json({
               ...groupInfo[0],
               members
          });
     } catch (err) {
          console.error('Fetch group info error:', err);
          res.status(500).json({ error: 'Failed to fetch group info' });
     }
});


router.get('/:id', authenticate, async (req, res) => {
     try {
          const { id } = req.params;
          const userId = req.user.userId;

          // Verify user 
          const isParticipant = await sequelize.query(
               'SELECT 1 FROM participants WHERE conversation_id = :cid AND user_id = :uid',
               {
                    replacements: { cid: id, uid: userId},
                    type: QueryTypes.SELECT
               }
          );

          if (isParticipant.length === 0) {
               return res.status(403).json({ error: 'Not authorized' });
          }
          // Mark as read
          await sequelize.query(
               `UPDATE messages 
               SET is_read = true 
               WHERE conversation_id = :cid 
                    AND sender_id != :uid`,
               {
                    replacements: { cid: id, uid: userId },
                    type: QueryTypes.UPDATE
               }
          );

          // Fetch messages with parent message info
          const messages = await sequelize.query(
               `SELECT 
                    m.id,
                    m.content,
                    (m.content LIKE '% left the conversation' OR m.content LIKE '% added %') AS is_system_message,
                    m.created_at,
                    m.sender_id,
                    m.parent_message_id,
                    u.id AS sender_user_id,
                    pr.username AS sender_username,
                    pr.avatar_url AS sender_avatar,
                    pm.content AS parent_content,
                    pm.sender_id AS parent_sender_id,
                    ppr.username AS parent_sender_username
               FROM messages m
               JOIN users u 
                    ON m.sender_id = u.id
               LEFT JOIN profiles pr 
                    ON u.id = pr.user_id
               LEFT JOIN messages pm
                    ON m.parent_message_id = pm.id
               LEFT JOIN users pu
                    ON pm.sender_id = pu.id
               LEFT JOIN profiles ppr
                    ON pu.id = ppr.user_id
               WHERE m.conversation_id = :cid
               ORDER BY m.created_at ASC`,
               {
                    replacements: { cid: id },
                    type: QueryTypes.SELECT
               }    
          );
          res.json(messages);
     } catch (err) {
          console.error('Fetch messages error:', err);
          res.status(500).json({ error: 'Failed to fetch messages' });
     }
});

// GET /api/messages/:id/info - Get other participant info for a conversation
router.get('/:id/info', authenticate, async (req, res) => {
     try {
          const { id } = req.params;
          const userId = req.user.userId;

          // Verify participation
          const isParticipant = await sequelize.query(
               'SELECT 1 FROM participants WHERE conversation_id = :cid AND user_id = :uid',
               {
                    replacements: { cid: id, uid: userId},
                    type: QueryTypes.SELECT
               }
          );

          if (isParticipant.length === 0) {
               return res.status(403).json({ error: 'Not authorized' });
          }

          const other = await sequelize.query(
               `SELECT u.id, pr.username, pr.avatar_url
               FROM participants p
               JOIN users u ON p.user_id = u.id
               LEFT JOIN profiles pr ON u.id = pr.user_id
               WHERE p.conversation_id = :cid AND p.user_id != :uid
               LIMIT 1`,
               {
                    replacements: { cid: id, uid: userId },
                    type: QueryTypes.SELECT
               }
          );

          if (!other || other.length === 0) {
               return res.status(404).json({ error: 'Other participant not found' });
          }

          res.json(other[0]);
     } catch (err) {
          console.error('Fetch conversation info error:', err);
          res.status(500).json({ error: 'Failed to fetch conversation info' });
     }
});

// DELETE /api/messages/:messageId - Delete a message (only own messages)
router.delete('/:messageId', authenticate, async (req, res) => {
     try {
          const { messageId } = req.params;
          const userId = req.user.userId;

          // Check if message exists and belongs to user
          const message = await sequelize.query(
               `SELECT id, sender_id, conversation_id FROM messages WHERE id = :msgId`,
               {
                    replacements: { msgId: messageId },
                    type: QueryTypes.SELECT
               }
          );

          if (!message || message.length === 0) {
               return res.status(404).json({ error: 'Message not found' });
          }

          if (message[0].sender_id !== userId) {
               return res.status(403).json({ error: 'Cannot delete other users messages' });
          }

          // Delete the message
          await sequelize.query(
               `DELETE FROM messages WHERE id = :msgId`,
               {
                    replacements: { msgId: messageId },
                    type: QueryTypes.DELETE
               }
          );

          res.json({ message: 'Message deleted successfully' });
     } catch (err) {
          console.error('Delete message error:', err);
          res.status(500).json({ error: 'Failed to delete message' });
     }
});

// PUT /api/messages/group/:id/name - Update group name
router.put('/group/:id/name', authenticate, async (req, res) => {
     const { id } = req.params;
     const { group_name } = req.body;
     const userId = req.user.userId;

     if (!group_name || group_name.trim() === '') {
          return res.status(400).json({ error: 'group_name required' });
     }

     try {
          // Check if user is group member
          const isParticipant = await sequelize.query(
               'SELECT 1 FROM participants WHERE conversation_id = :cid AND user_id = :uid',
               {
                    replacements: { cid: id, uid: userId },
                    type: QueryTypes.SELECT
               }
          );

          if (isParticipant.length === 0) {
               return res.status(403).json({ error: 'Not a group member' });
          }

          // Update group name
          await sequelize.query(
               'UPDATE conversations SET group_name = :group_name WHERE id = :cid',
               {
                    replacements: { group_name, cid: id },
                    type: QueryTypes.UPDATE
               }
          );

          res.json({ message: 'Group name updated', group_name });
     } catch (err) {
          console.error('Update group name error:', err);
          res.status(500).json({ error: 'Failed to update group name' });
     }
});

// PUT /api/messages/group/:id/photo - Update group photo
router.put('/group/:id/photo', authenticate, async (req, res) => {
     const { id } = req.params;
     const { group_avatar_url } = req.body;
     const userId = req.user.userId;

     if (!group_avatar_url) {
          return res.status(400).json({ error: 'group_avatar_url required' });
     }

     try {
          // Check if user is group member
          const isParticipant = await sequelize.query(
               'SELECT 1 FROM participants WHERE conversation_id = :cid AND user_id = :uid',
               {
                    replacements: { cid: id, uid: userId },
                    type: QueryTypes.SELECT
               }
          );

          if (isParticipant.length === 0) {
               return res.status(403).json({ error: 'Not a group member' });
          }

          // Update group photo
          await sequelize.query(
               'UPDATE conversations SET group_avatar_url = :group_avatar_url WHERE id = :cid',
               {
                    replacements: { group_avatar_url, cid: id },
                    type: QueryTypes.UPDATE
               }
          );

          res.json({ message: 'Group photo updated', group_avatar_url });
     } catch (err) {
          console.error('Update group photo error:', err);
          res.status(500).json({ error: 'Failed to update group photo' });
     }
});

// DELETE /api/messages/group/:id/leave - Leave group
router.delete('/group/:id/leave', authenticate, async (req, res) => {
     const { id } = req.params;
     const userId = req.user.userId;

     try {
          // Check if user is group member
          const isParticipant = await sequelize.query(
               'SELECT 1 FROM participants WHERE conversation_id = :cid AND user_id = :uid',
               {
                    replacements: { cid: id, uid: userId },
                    type: QueryTypes.SELECT
               }
          );

          if (isParticipant.length === 0) {
               return res.status(403).json({ error: 'Not a group member' });
          }

          // Get user info for system message
          // Fetch username from profiles (usernames are stored in profiles table)
          const userRes = await sequelize.query(
               'SELECT username FROM profiles WHERE user_id = :uid',
               {
                    replacements: { uid: userId },
                    type: QueryTypes.SELECT
               }
          );
          const username = userRes[0]?.username || 'User';

          // Remove user from group
          await sequelize.query(
               'DELETE FROM participants WHERE conversation_id = :cid AND user_id = :uid',
               {
                    replacements: { cid: id, uid: userId },
                    type: QueryTypes.DELETE
               }
          );

          // Create system message (insert as regular message; client will detect by content)
          await sequelize.query(
               'INSERT INTO messages (conversation_id, sender_id, content, created_at) VALUES (:cid, :uid, :content, NOW())',
               {
                    replacements: { 
                      cid: id, 
                      uid: userId,
                      content: `${username} left the conversation`
                    },
                    type: QueryTypes.INSERT
               }
          );

          res.json({ message: 'Left group successfully' });
     } catch (err) {
          console.error('Leave group error:', err);
          res.status(500).json({ error: 'Failed to leave group' });
     }
});

module.exports = router;


