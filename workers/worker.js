const { Worker } = require('bullmq');
const { Event, Participant } = require('../models');
const { getRedis } = require('../config/redis');
const { getIO } = require('../socket');

const connection = getRedis();

const worker = new Worker(
  'eventQueue',
  async (job) => {
    const { eventId } = job.data;
    const io = getIO();
    const event = await Event.findByPk(eventId);
    if (!event) return;

    event.status = 'finished';
    event.isActive = false;

    await event.save();

    io.to(`manager-${event.userId}`).emit('event-finished', {
      eventId: event.id,
      message: 'Event finished',
    });

    const participants = await Participant.findAll({ where: { eventId } });
    participants.forEach((participant) => {
      io.to(`participant-${participant.id}`).emit('event-finished', {
        eventId: event.id,
        message: 'Event finished',
      });
    });

    console.log(`🔥 Event ${eventId} auto-finished`);
  },
  { connection }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job failed:`, err);
});
