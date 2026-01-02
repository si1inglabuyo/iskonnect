const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Like = sequelize.define('Like', {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  post_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'posts',
      key: 'id'
    }
  }
}, {
  tableName: 'likes',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'post_id']
    }
  ]
});

// Optional: Define associations (useful for includes)
Like.associate = (models) => {
  Like.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  Like.belongsTo(models.Post, { foreignKey: 'post_id', as: 'post' });
};

module.exports = Like;