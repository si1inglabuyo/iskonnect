const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');
const Profile = require('./Profile');

const User = sequelize.define('User', {
     email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
               isEmail: true
          }
     },

     password_hash: {
          type: DataTypes.TEXT,
          allowNull: false
     }
}, {
     tableName: 'users',
     timestamps: true,
     createdAt: 'created_at',
     updatedAt: 'updated_at'
});




// Hash password before saving
User.beforeCreate(async (user) => {
     const salt = await bcrypt.genSalt(12);
     user.password_hash = await bcrypt.hash(user.password_hash, salt);
});

// Instance to compare passwords
User.prototype.comparePassword = async function(candidatePassword) {
     return await bcrypt.compare(candidatePassword, this.password_hash);
};

User.hasOne(Profile, {
     foreignKey: 'user_id',
     as: 'Profile'
});

module.exports = User;


