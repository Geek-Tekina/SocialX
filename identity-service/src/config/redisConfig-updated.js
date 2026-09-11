const Redis = require("ioredis");
const { Redis: UpstashRedis } = require("@upstash/redis");
const logger = require("../utils/logger");

/**
 * Adapter: Wraps Upstash Redis to provide ioredis-compatible interface
 */
class UpstashRedisAdapter {
  constructor(upstashClient) {
    this.client = upstashClient;
  }

  async call(...args) {
    try {
      const [command, ...params] = args;
      const cmd = command.toLowerCase();

      if (cmd === "incr" || cmd === "incrby") {
        const key = params[0];
        const amount = params[1] || 1;
        return await this.client.incrby(key, amount);
      }

      if (cmd === "get") {
        return await this.client.get(params[0]);
      }

      if (cmd === "set") {
        return await this.client.set(params[0], params[1]);
      }

      if (cmd === "expire" || cmd === "pexpire") {
        const key = params[0];
        const ttl = params[1];
        if (cmd === "pexpire") {
          return await this.client.expire(key, ttl / 1000);
        }
        return await this.client.expire(key, ttl);
      }

      if (cmd === "ttl" || cmd === "pttl") {
        return await this.client.ttl(params[0]);
      }

      if (cmd === "del") {
        return await this.client.del(params[0]);
      }

      if (cmd === "exists") {
        return (await this.client.exists(params[0])) ? 1 : 0;
      }

      if (cmd === "flushdb") {
        return await this.client.flushdb();
      }

      logger.warn(`Upstash adapter: Unmapped command "${command}"`);
      return await this.client[cmd](...params);
    } catch (error) {
      logger.error(`Upstash Redis call error for ${args[0]}:`, error.message);
      throw error;
    }
  }

  async ping() {
    try {
      await this.client.ping();
      return "PONG";
    } catch (error) {
      logger.error("Upstash ping error:", error.message);
      throw error;
    }
  }

  disconnect() {
    return this.client.close?.();
  }
}

/**
 * Initialize Redis client - supports both local Redis and Upstash Redis
 */
const initializeRedisClient = () => {
  const useUpstash = process.env.USE_UPSTASH_REDIS === "true";

  if (useUpstash) {
    try {
      logger.info("Initializing Upstash Redis...");
      const upstashClient = new UpstashRedis({
        url: process.env.UPSTASH_REDIS_URL,
        token: process.env.UPSTASH_REDIS_TOKEN,
      });

      const adapter = new UpstashRedisAdapter(upstashClient);

      adapter
        .ping()
        .then(() => {
          logger.info("✅ Upstash Redis connected successfully");
        })
        .catch((err) => {
          logger.error("❌ Upstash Redis connection failed:", err.message);
        });

      return adapter;
    } catch (error) {
      logger.error("Failed to initialize Upstash Redis:", error.message);
      process.exit(1);
    }
  } else {
    try {
      logger.info("Initializing Local Redis (ioredis)...");
      const redisClient = new Redis(process.env.REDIS_URL);

      redisClient.on("connect", () => {
        logger.info("✅ Local Redis connected successfully");
      });

      redisClient.on("error", (err) => {
        logger.error("❌ Local Redis connection error:", err.message);
      });

      return redisClient;
    } catch (error) {
      logger.error("Failed to initialize Local Redis:", error.message);
      process.exit(1);
    }
  }
};

module.exports = { initializeRedisClient };
