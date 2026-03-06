'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Participant extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Participant.belongsTo(models.Event, {
        foreignKey: 'eventId',
        as: 'event',
        onDelete: 'CASCADE',
      });
      // Participant.hasOne(models.Result, {
      //   foreignKey: 'participantId',
      //   as: 'result',
      // });
    }
  }
  Participant.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Name required' },
        },
      },
      eventId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      kinship: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,

      modelName: 'Participant',
      tableName: 'tbl_participants',
      hooks: {
        afterUpdate: async (participant, options) => {
          if (
            participant.changed('finished') &&
            participant.finished === true
          ) {
            const { Result } = sequelize.models;

            await Result.create(
              {
                participantId: participant.id,
                eventId: participant.eventId,
                totalScore: participant.score,
                totalTime: participant.totalTime,
              },
              { transaction: options.transaction }
            );
          }
        },
      },
    }
  );
  return Participant;
};
