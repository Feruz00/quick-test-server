'use strict';
const { Model, Op } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AnswerOption extends Model {
    static associate(models) {
      AnswerOption.belongsTo(models.Question, {
        foreignKey: 'questionId',
        as: 'question',
        onDelete: 'CASCADE',
      });
    }
  }
  AnswerOption.init(
    {
      text: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isCorrect: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      questionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Question is required' },
          isInt: { msg: 'Question ID must be an integer' },
        },
      },
    },
    {
      sequelize,
      modelName: 'AnswerOption',
      tableName: 'tbl_answer_options',
      hooks: {
        beforeSave: async (option, options) => {
          if (option.isCorrect) {
            const existingCorrect = await AnswerOption.findOne({
              where: {
                questionId: option.questionId,
                isCorrect: true,
                id: { [Op.ne]: option.id || null },
              },
              transaction: options.transaction,
            });

            if (existingCorrect) {
              throw new Error('Only one correct answer allowed per question');
            }
          }
        },
      },
    }
  );
  return AnswerOption;
};
