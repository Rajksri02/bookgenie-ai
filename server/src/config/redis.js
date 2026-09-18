const Redis = require('ioredis');

// Connect to Redis. Defaults to localhost:6379 if REDIS_URL is not provided
const redisConnection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

redisConnection.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redisConnection.on('connect', () => {
  console.log('Connected to Redis successfully');
});

module.exports = redisConnection;
