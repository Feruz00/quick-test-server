const { Op, literal } = require('sequelize');
const { Event, Participant, TestAnswer, Question } = require('../models');
const { catchAsync } = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { v4: uuidv4 } = require('uuid');
const createEventQueue = require('../workers/queue');

const jwt = require('jsonwebtoken');
const { getIO } = require('../socket');
const dayjs = require('dayjs');

/**
 * GET ALL EVENTS
 */
exports.getAllEvents = catchAsync(async (req, res, next) => {
  let {
    page = 1,
    limit = 10,
    title,
    status,
    sort = 'createdAt',
    order = 'DESC',
  } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);
  if (page < 1) page = 1;
  if (limit < 1 || limit > 100) limit = 10;

  const offset = (page - 1) * limit;

  const where = {};

  where.userId = req.user.id;

  if (title) {
    where.title = {
      [Op.like]: `%${title}%`,
    };
  }

  const now = new Date();

  if (status && status !== 'all') {
    if (status === 'upcoming') {
      where[Op.or] = [{ startsAt: null }, { startsAt: { [Op.gt]: now } }];
    }

    if (status === 'active') {
      where[Op.and] = [
        { startsAt: { [Op.ne]: null } },
        literal(`DATE_ADD(startsAt, INTERVAL duration MINUTE) > NOW()`),
        { startsAt: { [Op.lte]: now } },
      ];
    }

    if (status === 'finished') {
      where[Op.and] = [
        { startsAt: { [Op.ne]: null } },
        literal(`DATE_ADD(startsAt, INTERVAL duration MINUTE) <= NOW()`),
      ];
    }
  }

  const allowedSortFields = ['title', 'createdAt', 'startsAt'];
  const allowedOrder = ['ASC', 'DESC'];

  if (!allowedSortFields.includes(sort)) sort = 'createdAt';
  if (!allowedOrder.includes(order.toUpperCase())) order = 'DESC';
  const { rows: events, count } = await Event.findAndCountAll({
    where,
    limit,
    offset,
    order: [[sort, order]],
  });

  res.status(200).json({
    status: 'success',
    count,
    data: events,
  });
});

exports.getOneEvent = catchAsync(async (req, res) => {
  const event = await Event.findOne({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!event) return res.status(404).json({ message: 'Event not found' });

  res.status(200).json({
    status: 'success',
    data: event,
  });
});

exports.createEvent = catchAsync(async (req, res) => {
  const now = dayjs();

  if (now.isAfter(dayjs(req.user.maxDate))) {
    return res.status(400).json({ message: 'You cannot create event anymore' });
  }
  const event = await Event.create({
    ...req.body,
    join: uuidv4(),

    userId: req.user.id,
  });

  res.status(201).json({
    status: 'success',
    data: event,
  });
});

exports.updateEvent = catchAsync(async (req, res) => {
  const event = await Event.findOne({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!event) return res.status(404).json({ message: 'Event not found' });

  if (event.userId !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  await event.update(req.body);

  res.status(200).json({
    status: 'success',
    data: event,
  });
});

exports.deleteEvent = catchAsync(async (req, res) => {
  const event = await Event.findOne({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!event) return res.status(404).json({ message: 'Event not found' });

  if (event.userId !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  await event.destroy();

  res.status(204).json({
    status: 'success',
  });
});

exports.startEvent = catchAsync(async (req, res) => {
  const event = await Event.findOne({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!event) return res.status(404).json({ message: 'Event not found' });

  if (event.startsAt) {
    return res.status(400).json({ message: 'Event already started' });
  }

  const now = new Date();

  event.startsAt = now;
  event.status = 'active';
  event.isActive = true;

  await event.save();

  const eventQueue = createEventQueue();

  await eventQueue.add(
    'finishEvent',
    { eventId: event.id },
    {
      jobId: `event-${event.id}`, // ⭐ important
      delay: event.duration * 60 * 1000,
      removeOnComplete: true,
      removeOnFail: true,
    }
  );
  res.status(200).json({
    status: 'success',
    message: 'Event started',
    data: event,
  });
});

exports.getEventByJoinCode = catchAsync(async (req, res) => {
  const event = await Event.findOne({
    where: {
      join: req.params.joinCode,
      // status: 'active',
    },
  });

  if (!event) return res.status(404).json({ message: 'Event not found' });

  res.status(200).json({
    status: 'success',
    data: event,
  });
});

exports.joinEvent = catchAsync(async (req, res) => {
  const { code } = req.params;
  const { name, kinship } = req.body;

  const event = await Event.findOne({
    where: { join: code },
  });

  if (!event) return res.status(404).json({ message: 'Invalid join code' });

  if (event.status !== 'active') {
    return res.status(400).json({
      message: `Event is ${event.status}`,
    });
  }

  const participate = await Participant.create({
    name,
    kinship,
    eventId: event.id,
  });

  const cookieOptions = {
    httpOnly: true, // prevent XSS
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'strict', // CSRF protection
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  };
  const token = jwt.sign(
    { id: participate.id, type: 'participant' },
    process.env.JWT_SECRET,
    {
      expiresIn: '1d',
    }
  );
  res.cookie('jwt', token, cookieOptions);
  const user = await participate.toJSON();
  user.role = 'participant';
  user.event = { join: event.join };
  res.status(200).json({
    status: 'success',
    data: {
      event,
      user,
    },
  });
});

exports.stopEvent = catchAsync(async (req, res, next) => {
  const io = getIO();
  const event = await Event.findOne({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });
  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }
  event.status = 'finished';
  // event.isActive = false;
  await event.save();
  // io.to(`manager-${event.userId}`).emit('event-finished', {
  //   eventId: event.id,
  //   message: 'Event finished',
  // });

  const participants = await Participant.findAll({
    where: { eventId: event.id },
  });

  participants.forEach((participant) => {
    console.log(`participant-${participant.id}`);

    io.to(`participant-${participant.id}`).emit('event-finished', {
      eventId: event.id,
      message: 'Event finished',
    });
  });
  const eventQueue = createEventQueue();

  const job = await eventQueue.getJob(`event-${event.id}`);
  if (job) {
    await job.remove();
  }
  res.status(200).json({
    status: 'success',
    message: 'Event stopped',
    data: event,
  });
});

exports.getResults = catchAsync(async (req, res) => {
  const totalQuestions = await Question.count({
    where: { eventId: req.params.id },
  });
  const event = await Event.findOne({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });
  let participants = await Participant.findAll({
    where: { eventId: req.params.id },
  });

  participants = await Promise.all(
    participants.map(async (participant) => {
      const total = await TestAnswer.findAll({
        where: {
          participantId: participant.id,
          isCorrect: true,
        },
      });
      const timeSpent = total.reduce(
        (sum, answer) => sum + answer.timeSpent,
        0
      );

      return {
        ...participant.toJSON(),
        timeSpent,
        score: total.length,
      };
    })
  );
  participants.sort((a, b) => {
    if (b.score === a.score) {
      return a.timeSpent - b.timeSpent; // less time is better
    }
    return b.score - a.score; // more score is better
  });

  res.status(200).json({
    status: 'success',
    data: {
      total: totalQuestions,
      participants,
      event: event,
    },
  });
});
