const Redis = require('ioredis');

let redis;

async function connectRedis() {
  redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    // password: process.env.REDIS_PASSWORD || undefined,

    maxRetriesPerRequest: null, // ✅ REQUIRED FOR BULLMQ
    enableReadyCheck: false, // ✅ recommended for BullMQ
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  redis.on('connect', () => {
    console.log('✅ Redis connected successfully.');
  });

  redis.on('error', (err) => {
    console.error('❌ Redis connection error:', err.message);
  });

  return redis;
}

function getRedis() {
  if (!redis) {
    throw new Error('Redis not initialized. Call connectRedis first.');
  }
  return redis;
}

async function closeRedis() {
  if (redis) {
    await redis.quit();
    console.log('🛑 Redis connection closed.');
  }
}

module.exports = {
  connectRedis,
  getRedis,

  closeRedis,
};
