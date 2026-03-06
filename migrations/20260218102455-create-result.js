'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tbl_results', {
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
      eventId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'tbl_events',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      totalScore: {
        type: Sequelize.INTEGER,
      },
      totalTime: {
        type: Sequelize.INTEGER,
      },
      rank: {
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
    await queryInterface.addIndex('tbl_results', ['eventId']);

    await queryInterface.addIndex('tbl_results', [
      'eventId',
      'totalScore',
      'totalTime',
    ]);

    await queryInterface.addIndex('tbl_results', ['rank']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tbl_results');
  },
};
