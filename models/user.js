'use strict';
const { Model } = require('sequelize');
const { toHash } = require('../utils/password');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Event, {
        foreignKey: 'userId',
        as: 'events',
        onDelete: 'CASCADE',
      });
    }
  }
  User.init(
    {
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Full name is required' },
          len: { args: [3, 100], msg: 'Full name must be 3-100 characters' },
        },
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: { msg: 'Username already exists' },
        validate: {
          len: { args: [3, 100], msg: 'Username must be 3-100 characters' },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: {
            args: [6, 100],
            msg: 'Password must be at least 6 characters',
          },
        },
      },
      role: {
        type: DataTypes.ENUM('admin', 'manager'),
        allowNull: false,
        validate: {
          isIn: {
            args: [['admin', 'manager']],
            msg: 'Invalid role',
          },
        },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      maxDate: {
        type: DataTypes.DATE,
        defaultValue: null,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'tbl_users',
      hooks: {
        beforeCreate: async (user) => {
          user.password = await toHash(user.password);
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            user.password = await toHash(user.password);
          }
        },
      },
    }
  );
  return User;
};
