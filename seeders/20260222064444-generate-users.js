'use strict';

const dayjs = require('dayjs');
const { toHash } = require('../utils/password');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const password = await toHash('test12345');

    const users = [
      {
        fullName: 'admin',
        username: 'admin',
        role: 'admin',
        isActive: true,
        maxDate: dayjs().add(1, 'M').toDate(),
        password,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      ...Array.from({ length: 10 }, (_, i) => i + 1).map((row) => ({
        fullName: `Manager-${row}`,
        username: `user${row}`,
        role: 'manager',
        isActive: true,
        maxDate: dayjs().add(1, 'M').toDate(),
        password,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    ];

    await queryInterface.bulkInsert('tbl_users', users, {});

    /**
     * Add seed commands here.
     *
     * Example:
     
     */
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('tbl_users', null, {});
  },
};
