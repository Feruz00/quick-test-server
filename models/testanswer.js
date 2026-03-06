'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TestAnswer extends Model {
    static associate(models) {
      TestAnswer.belongsTo(models.Participant, {
        foreignKey: 'participantId',
        as: 'participant',
        onDelete: 'CASCADE',
      });

      TestAnswer.belongsTo(models.Question, {
        foreignKey: 'questionId',
        as: 'question',
        onDelete: 'CASCADE',
      });

      TestAnswer.belongsTo(models.AnswerOption, {
        foreignKey: 'selectedOptionId',
        as: 'selectedOption',
        onDelete: 'SET NULL',
      });
    }
  }

  TestAnswer.init(
    {
      participantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Participant is required' },
        },
      },

      questionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Question is required' },
        },
      },

      selectedOptionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Answer option required' },
        },
      },

      isCorrect: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },

      timeSpent: {
        type: DataTypes.INTEGER,
        allowNull: false,
        // validate: {
        //   min: {
        //     args: [0],
        //     msg: 'Time spent cannot be negative',
        //   },
        //   max: {
        //     args: [300],
        //     msg: 'Time spent too large',
        //   },
        // },
      },
    },
    {
      sequelize,
      modelName: 'TestAnswer',
      tableName: 'tbl_test_answers',
      hooks: {},
    }
  );

  return TestAnswer;
};
