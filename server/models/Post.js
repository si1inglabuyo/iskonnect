// Maps to your posts table and links to users via user_id. 

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Post = sequelize.define('Post', {
     user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
               model: User,
               key: 'id'
          }
     },
     content: {
          type: DataTypes.TEXT,
          allowNull: true
     },
     image_url: {
          type: DataTypes.TEXT,
          allowNull: true
    },
    shared_post_id: {
         type: DataTypes.INTEGER,
         allowNull: true
    }
}, {
     tableName: 'posts',
     timestamps: true,
     createdAt: 'created_at',
     updatedAt: 'updated_at'
});

 // Import User
Post.belongsTo(User, { foreignKey: 'user_id' });
// Self-referential association for shared posts
Post.belongsTo(Post, { as: 'SharedPost', foreignKey: 'shared_post_id' });
module.exports = Post;

