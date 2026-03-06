'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Result extends Model {
    static associate(models) {
      Result.belongsTo(models.Participant, {
        foreignKey: 'participantId',
        as: 'participant',
        onDelete: 'CASCADE',
      });

      Result.belongsTo(models.Event, {
        foreignKey: 'eventId',
        as: 'event',
        onDelete: 'CASCADE',
      });
    }
  }

  Result.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      participantId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        validate: {
          isUUID: 4,
        },
      },

      eventId: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: {
          isUUID: 4,
        },
      },

      totalScore: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },

      totalTime: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },

      rank: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Result',
      tableName: 'tbl_results',
    }
  );

  return Result;
};
