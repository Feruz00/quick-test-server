'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Question extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Question.belongsTo(models.Event, {
        foreignKey: 'eventId',
        as: 'event',
      });
      Question.hasMany(models.AnswerOption, {
        foreignKey: 'questionId',
        as: 'answers',
        onDelete: 'CASCADE',
      });
    }
  }
  Question.init(
    {
      text: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Question text required' },
        },
      },
    },
    {
      sequelize,
      modelName: 'Question',

      tableName: 'tbl_questions',
      hooks: {
        afterUpdate: async (question, options) => {
          const { AnswerOption } = sequelize.models;

          const correctCount = await AnswerOption.count({
            where: {
              questionId: question.id,
              isCorrect: true,
            },
            transaction: options.transaction,
          });

          if (correctCount !== 1) {
            throw new Error('Question must have exactly one correct answer');
          }
        },
      },
    }
  );
  return Question;
};
