require('dotenv').config();
const http = require('http');

const PORT = process.env.PORT || 3005;
const app = require('./app');
const server = http.createServer(app);
const { connectRedis, closeRedis, getRedis } = require('./config/redis');

const db = require('./models');
const { initializeSocket } = require('./socket');

async function startServer() {
  try {
    await connectRedis();
    await db.sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    const io = await initializeSocket(server);
    io.on('connection', async (socket) => {
      const userId = socket.handshake.query.id;
      const role = socket.handshake.query.role;
      console.log(`User with ID ${role}-${userId} connected with ${socket.id}`);

      socket.join(`${role}-${userId}`);

      socket.on('disconnect', () => {
        console.log(`Client disconnected ${role}-${userId}: ${socket.id}`);
      });
    });

    require('./workers/worker');
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server started on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    console.log(error);
    console.log('⏳ Retrying server start in 5s...');
  }
}

startServer();

async function gracefulShutdown() {
  console.log('🛑 Gracefully shutting down...');

  try {
    const redis = getRedis();

    if (process.env.NODE_ENV !== 'production') {
      await redis.flushdb();
      console.log('🧹 Redis DB flushed.');
    }

    await closeRedis();
    await db.sequelize.close();

    process.exit(0);
  } catch (err) {
    console.error('Shutdown error:', err);
    process.exit(1);
  }
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Unhandled Rejection:', reason);
  gracefulShutdown();
});

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  gracefulShutdown();
});
