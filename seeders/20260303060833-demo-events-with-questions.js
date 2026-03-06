'use strict';
const db = require('../models');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const { User, Event, Question, AnswerOption } = db;

    const t = await db.sequelize.transaction();

    try {
      const user = await User.findOne({
        where: { username: 'user1' },
        transaction: t,
      });

      if (!user) throw new Error('user1 not found');

      // 🔥 Real Question Bank
      const questionBank = [
        {
          text: 'Which method converts JSON string to JavaScript object?',
          answers: [
            { text: 'JSON.parse()', isCorrect: true },
            { text: 'JSON.stringify()', isCorrect: false },
            { text: 'JSON.object()', isCorrect: false },
            { text: 'JSON.convert()', isCorrect: false },
          ],
        },
        {
          text: 'Which SQL command is used to remove a table?',
          answers: [
            { text: 'DROP TABLE', isCorrect: true },
            { text: 'DELETE TABLE', isCorrect: false },
            { text: 'REMOVE TABLE', isCorrect: false },
            { text: 'CLEAR TABLE', isCorrect: false },
          ],
        },
        {
          text: 'What does HTTP stand for?',
          answers: [
            { text: 'HyperText Transfer Protocol', isCorrect: true },
            { text: 'High Transfer Text Protocol', isCorrect: false },
            { text: 'Hyper Transfer Text Process', isCorrect: false },
            { text: 'Home Tool Transfer Protocol', isCorrect: false },
          ],
        },
        {
          text: 'Which company developed Node.js?',
          answers: [
            { text: 'Ryan Dahl', isCorrect: true },
            { text: 'Google', isCorrect: false },
            { text: 'Microsoft', isCorrect: false },
            { text: 'Facebook', isCorrect: false },
          ],
        },
        {
          text: 'What is the result of 5 + "5" in JavaScript?',
          answers: [
            { text: '"55"', isCorrect: true },
            { text: '10', isCorrect: false },
            { text: 'Error', isCorrect: false },
            { text: 'undefined', isCorrect: false },
          ],
        },
        {
          text: 'Which keyword is used to define a constant in JavaScript?',
          answers: [
            { text: 'const', isCorrect: true },
            { text: 'let', isCorrect: false },
            { text: 'var', isCorrect: false },
            { text: 'constant', isCorrect: false },
          ],
        },
        {
          text: 'Which MySQL clause is used to filter records?',
          answers: [
            { text: 'WHERE', isCorrect: true },
            { text: 'FILTER', isCorrect: false },
            { text: 'HAVING ALL', isCorrect: false },
            { text: 'SELECT WHERE', isCorrect: false },
          ],
        },
        {
          text: 'Which protocol is used for secure websites?',
          answers: [
            { text: 'HTTPS', isCorrect: true },
            { text: 'HTTP', isCorrect: false },
            { text: 'FTP', isCorrect: false },
            { text: 'TCP', isCorrect: false },
          ],
        },
        {
          text: 'Which data structure uses FIFO principle?',
          answers: [
            { text: 'Queue', isCorrect: true },
            { text: 'Stack', isCorrect: false },
            { text: 'Tree', isCorrect: false },
            { text: 'Graph', isCorrect: false },
          ],
        },
        {
          text: 'Which port does HTTP use by default?',
          answers: [
            { text: '80', isCorrect: true },
            { text: '443', isCorrect: false },
            { text: '22', isCorrect: false },
            { text: '21', isCorrect: false },
          ],
        },
      ];

      // 🚀 Create 10 events
      for (let e = 1; e <= 10; e++) {
        const event = await Event.create(
          {
            title: `IT Knowledge Test ${e}`,
            userId: user.id,
            startsAt: null,
            duration: 60,
            join: uuidv4(),
            status: 'upcoming',
            isActive: false,
          },
          { transaction: t }
        );

        // 🔥 Insert 10 real questions per event
        for (const qData of questionBank) {
          const question = await Question.create(
            {
              text: qData.text,
              eventId: event.id,
            },
            { transaction: t }
          );

          for (const answer of qData.answers) {
            await AnswerOption.create(
              {
                text: answer.text,
                isCorrect: answer.isCorrect,
                questionId: question.id,
              },
              { transaction: t }
            );
          }
        }
      }

      await t.commit();
      console.log('✅ Real quiz data created successfully');
    } catch (err) {
      await t.rollback();
      console.error(err);
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('tbl_events', null, {});
  },
};
