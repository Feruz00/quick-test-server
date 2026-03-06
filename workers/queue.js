const { Queue } = require('bullmq');
const { getRedis } = require('../config/redis');

function createEventQueue() {
  const connection = getRedis();

  return new Queue('eventQueue', {
    connection,
  });
}

module.exports = createEventQueue;
