const { Op } = require('sequelize');
const {
  Question,
  Event,
  Participant,
  AnswerOption,
  TestAnswer,
} = require('../models');
const { catchAsync } = require('../utils/catchAsync');

exports.myScore = catchAsync(async (req, res, next) => {
  const { join } = req.params;
  const event = await Event.findOne({ where: { join } });

  if (!event) return res.status(404).json({ message: 'Event not found' });

  const questionIds = await Question.findAll({
    where: { eventId: event.id },
    attributes: ['id'],
  }).then((questions) => questions.map((q) => q.id));

  const answers = await TestAnswer.findAll({
    where: {
      participantId: req.user.id,
      isCorrect: true,
      questionId: { [Op.in]: questionIds },
    },
  });
  let timeSpent = 0;
  answers.forEach((answer) => {
    timeSpent += answer.timeSpent;
  });

  res.status(200).json({
    status: 'success',
    data: {
      score: answers.length,
      total: questionIds.length,
      timeSpent,
    },
  });
});
