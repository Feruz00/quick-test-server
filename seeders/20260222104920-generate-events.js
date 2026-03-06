'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    return;
    const users = await queryInterface.sequelize.query(
      `SELECT id FROM tbl_users WHERE role = 'manager';`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!users.length) return;

    const now = new Date();
    const events = [];

    for (const user of users) {
      for (let i = 1; i <= 100; i++) {
        let startsAt = null;
        let status = 'finished';
        if (i <= 30) {
          const past = new Date(now);
          past.setDate(past.getDate() - (i + 2));
          startsAt = past;
        }

        // 31–60 → active
        else if (i <= 60) {
          const active = new Date(now);
          active.setMinutes(active.getMinutes() - 30);
          startsAt = active;
          status = 'active';
        }

        // 61–100 → upcoming (not started)
        else {
          startsAt = null;
          status = 'upcoming';
        }

        events.push({
          title: `Event ${i} - Wedding Quiz`,

          duration: Math.floor(Math.random() * 60) + 50, // 30–90 mins
          startsAt,
          status,
          join: uuidv4(),
          isActive: i > 30 && i <= 60,
          userId: user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    await queryInterface.bulkInsert('tbl_events', events, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('tbl_events', null, {});
  },
};
