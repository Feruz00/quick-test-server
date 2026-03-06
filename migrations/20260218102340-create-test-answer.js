'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tbl_test_answers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      participantId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'tbl_participants',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      questionId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'tbl_questions',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      selectedOptionId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'tbl_answer_options',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      isCorrect: {
        type: Sequelize.BOOLEAN,
      },
      timeSpent: {
        type: Sequelize.INTEGER,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addIndex('tbl_test_answers', ['participantId']);

    await queryInterface.addIndex('tbl_test_answers', ['questionId']);

    // Prevent duplicate answers for same question
    await queryInterface.addIndex(
      'tbl_test_answers',
      ['participantId', 'questionId'],
      {
        unique: true,
        name: 'unique_participant_question',
      }
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tbl_test_answers');
  },
};
