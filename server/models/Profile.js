const { DataTypes} = require('sequelize');
const sequelize = require('../config/database');

const Profile = sequelize.define('Profile', {
     user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          unique: true,
          references: {
               model: 'users',
               key: 'id'
          },
          onDelete: 'CASCADE'
     },
     username: {
          type: DataTypes.STRING(50),
          allowNull: true,
          unique: true
     },
     full_name: {
          type: DataTypes.STRING(100),
          allowNull: true
     },
     bio: {
          type: DataTypes.TEXT,
          allowNull: true,
     },
     website: {
          type: DataTypes.TEXT,
          allowNull: true
     },
     avatar_url: {
          type: DataTypes.TEXT,
          allowNull: true
     }
},   {
     tableName: 'profiles',
     timestamps: true,
     createdAt: 'created_at',
     updatedAt: false
});

Profile.associate = (models) => {
     Profile.belongsTo(models.User, { foreignKey: 'user_id', as: 'user'});
};

module.exports = Profile;