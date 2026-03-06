'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Event extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Event.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'manager',
      });
      Event.hasMany(models.Question, {
        foreignKey: 'eventId',
        as: 'questions',
        onDelete: 'CASCADE',
      });
    }
  }
  Event.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Event title required' },
        },
      },

      startsAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
      },
      join: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      status: {
        type: DataTypes.ENUM('upcoming', 'active', 'finished'),
        defaultValue: 'upcoming',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: 'Event',
      tableName: 'tbl_events',
    }
  );
  return Event;
};
/*

*/
