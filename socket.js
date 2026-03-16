const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const Redis = require('ioredis');

let io;

async function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  const pubClient = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
  });

  const subClient = pubClient.duplicate();

  try {
    await Promise.all([pubClient.connect(), subClient.connect()]);

    console.log('✅ Redis clients connected');

    io.adapter(createAdapter(pubClient, subClient));

    console.log('✅ Socket.io Redis adapter enabled');
  } catch (err) {
    console.error('❌ Redis adapter failed:', err);
  }

  // io.adapter(createAdapter(pubClient, subClient));

  console.log('✅ Socket.io Redis adapter enabled');

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.id;
    const role = socket.handshake.query.role;
    console.log(`User with ID ${role}-${userId} connected with ${socket.id}`);

    socket.join(`${role}-${userId}`);

    socket.on('disconnect', () => {
      console.log(`Client disconnected ${role}-${userId}: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

module.exports = {
  initializeSocket,
  getIO,
};
