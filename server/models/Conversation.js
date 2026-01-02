const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  is_group: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  group_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  group_avatar_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  group_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'conversations',
  timestamps: false
});

module.exports = Conversation;
