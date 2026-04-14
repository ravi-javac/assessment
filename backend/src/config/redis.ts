import Redis from 'ioredis';
import { config } from './env';

export const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  console.log('✓ Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('✗ Redis connection error:', err);
});

export async function initializeRedis(): Promise<void> {
  try {
    await redis.ping();
    console.log('✓ Redis initialized');
  } catch (error) {
    console.error('✗ Redis initialization failed:', error);
    throw error;
  }
}