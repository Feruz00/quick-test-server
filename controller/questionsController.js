const { getRedis } = require('../config/redis');
const {
  Question,
  Event,
  Participant,
  AnswerOption,
  TestAnswer,
} = require('../models');
const { getIO } = require('../socket');
const { catchAsync } = require('../utils/catchAsync');
const { Op, literal } = require('sequelize');

exports.createQuestion = catchAsync(async (req, res) => {
  const { text, options } = req.body;

  const event = await Event.findOne({
    where: { id: req.params.eventId, userId: req.user.id },
  });

  if (!event) return res.status(404).json({ message: 'Event not found' });

  if (event.status !== 'upcoming')
    return res
      .status(400)
      .json({ message: 'Cannot add questions after event started' });

  const question = await Question.create({
    text,
    eventId: req.params.eventId,
  });

  if (options && options.length) {
    const formatted = options.map((opt) => ({
      text: opt.text,
      isCorrect: opt.isCorrect,
      questionId: question.id,
    }));

    await AnswerOption.bulkCreate(formatted);
  }

  res.status(201).json({
    status: 'success',
    data: question,
  });
});

exports.updateQuestion = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { text, options } = req.body;

  const question = await Question.findByPk(id, {
    include: [{ model: Event, as: 'event' }],
  });

  if (!question) return res.status(404).json({ message: 'Question not found' });

  if (question.event.userId !== req.user.id)
    return res.status(403).json({ message: 'Unauthorized' });

  if (question.event.status !== 'upcoming')
    return res.status(400).json({ message: 'Cannot edit after event started' });

  if (text) question.text = text;
  await question.save();

  if (options) {
    await AnswerOption.destroy({ where: { questionId: id } });

    const formatted = options.map((opt) => ({
      text: opt.text,
      isCorrect: opt.isCorrect,
      questionId: id,
    }));

    await AnswerOption.bulkCreate(formatted);
  }

  res.status(200).json({
    status: 'success',
    data: question,
  });
});

exports.getQuestion = catchAsync(async (req, res) => {
  const question = await Question.findByPk(req.params.id, {
    include: [
      {
        model: AnswerOption,
        as: 'answers',
        attributes: ['id', 'text', 'isCorrect'],
      },
      { model: Event, as: 'event' },
    ],
  });

  if (!question) return res.status(404).json({ message: 'Question not found' });
  if (question.event.userId !== req.user.id)
    return res.status(403).json({ message: 'Unauthorized' });

  res.status(200).json({
    status: 'success',
    data: question,
  });
});

exports.deleteQuestion = catchAsync(async (req, res) => {
  const question = await Question.findByPk(req.params.id, {
    include: [{ model: Event, as: 'event' }],
  });

  if (!question) return res.status(404).json({ message: 'Question not found' });

  if (question.event.userId !== req.user.id)
    return res.status(403).json({ message: 'Unauthorized' });

  if (question.event.status !== 'upcoming')
    return res
      .status(400)
      .json({ message: 'Cannot delete after event started' });

  await question.destroy();

  res.status(204).json({
    status: 'success',
  });
});

exports.getQuestions = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const event = await Event.findOne({
    where: { id: eventId, userId: req.user.id },
    attributes: ['id', 'title'],
  });
  if (!event) return res.status(404).json({ message: 'Event not found' });
  const { rows, count } = await Question.findAndCountAll({
    where: { eventId },
    order: [['id', 'DESC']],
  });

  res.status(200).json({
    status: 'success',
    count: count,
    data: rows,
    event: event,
  });
});
exports.getSuffleQuestion = catchAsync(async (req, res) => {
  const redis = getRedis();
  const { join } = req.params;

  const event = await Event.findOne({
    where: { join: join },
  });

  if (!event) return res.status(404).json({ message: 'Event not found' });

  if (event.status === 'finished')
    return res
      .status(200)
      .json({ status: 'finished', message: 'Event finished' });

  if (event.id !== req.user.eventId) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  if (event.endsAt && new Date() > event.endsAt) {
    event.status = 'finished';
    event.isActive = false;
    await event.save();
    return res
      .status(200)
      .json({ status: 'finished', message: 'Event finished' });
  }

  const qId = await redis.get(`participant-${req.user.id}`);
  if (qId) {
    const question = await Question.findByPk(qId, {
      include: [
        {
          model: AnswerOption,
          as: 'answers',
          attributes: ['id', 'text'],
        },
      ],
    });
    if (question) {
      return res.status(200).json({
        status: 'success',
        data: question,
      });
    } else {
      await redis.del(`participant-${req.user.id}`);
    }
  }
  const answered = await TestAnswer.findAll({
    where: {
      participantId: req.user.id,
    },
  });

  const ids = answered.map((a) => a.questionId);

  const randomQuestion = await Question.findOne({
    where: {
      eventId: event.id,
      id: { [Op.notIn]: ids.length ? ids : [0] },
    },
    order: literal('RAND()'),
    attributes: ['id', 'text'],

    include: [
      {
        model: AnswerOption,
        as: 'answers',
        attributes: ['id', 'text'],
      },
    ],
  });
  if (!randomQuestion) {
    return res.status(200).json({
      status: 'finished',
      message: 'No more questions',
    });
  }

  randomQuestion.answers.sort(() => Math.random() - 0.5);

  await redis.set(`participant-${req.user.id}`, randomQuestion.id);

  res.status(200).json({
    status: 'success',
    data: randomQuestion,
  });
});

exports.answerQuestion = catchAsync(async (req, res) => {
  const { questionId } = req.params;
  const io = getIO();

  const { selectedOptionId } = req.body;
  const redis = getRedis();
  const question = await Question.findByPk(questionId, {
    include: [{ model: Event, as: 'event' }],
  });

  if (!question) return res.status(404).json({ message: 'Question not found' });
  if (question.event.status !== 'active')
    return res.status(400).json({ message: 'Event is not active' });

  if (question.event.id !== req.user.eventId) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  const option = await AnswerOption.findOne({
    where: { id: selectedOptionId, questionId },
  });
  if (!option)
    return res.status(404).json({ message: 'Answer option not found' });

  let lastTime = await TestAnswer.findOne({
    where: {
      participantId: req.user.id,
      questionId,
    },
    order: [['createdAt', 'DESC']],
  });
  if (!lastTime) {
    lastTime = req.user.createdAt;
  } else {
    lastTime = lastTime.createdAt;
  }
  const timeSpent = Math.floor((new Date() - new Date(lastTime)) / 1000);

  await TestAnswer.create({
    participantId: req.user.id,
    questionId,
    selectedOptionId,
    isCorrect: option.isCorrect,
    timeSpent,
  });

  await redis.del(`participant-${req.user.id}`);
  if (option.isCorrect) {
    console.log(
      'Correct answer! Emitting to manager...',
      `manager-${question.event.userId}`
    );
    io.to(`manager-${question.event.userId}`).emit('answer', {
      timeSpent,
      questionId: question.id,
      ...req.user,
    });
  }

  res.status(200).json({
    status: 'success',
  });
});
