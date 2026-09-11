const Redis = require("ioredis");
const { Redis: UpstashRedis } = require("@upstash/redis");
const logger = require("../utils/logger");

/**
 * Adapter: Wraps Upstash Redis to provide ioredis-compatible interface
 */
class UpstashRedisAdapter {
  constructor(upstashClient) {
    this.client = upstashClient;
    this.scripts = new Map();
  }

  normalizeValue(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === "string") return value;
    if (Buffer.isBuffer(value)) return value.toString();
    return JSON.stringify(value);
  }

  async get(key) {
    const value = await this.client.get(key);
    if (value === null || value === undefined) return null;
    if (typeof value === "string") return value;
    if (Buffer.isBuffer(value)) return value.toString();
    return JSON.stringify(value);
  }

  async set(key, value) {
    return await this.client.set(key, this.normalizeValue(value));
  }

  async setex(key, seconds, value) {
    return await this.client.set(key, this.normalizeValue(value), {
      ex: seconds,
    });
  }

  async del(keyOrKeys) {
    const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
    if (keys.length === 1) {
      return await this.client.del(keys[0]);
    }
    return await Promise.all(keys.map((key) => this.client.del(key))).then(
      (results) => results.reduce((sum, value) => sum + Number(value || 0), 0)
    );
  }

  async keys(pattern) {
    return (await this.client.keys(pattern)) || [];
  }

  async ttl(key) {
    return await this.client.ttl(key);
  }

  async pttl(key) {
    const ttl = await this.ttl(key);
    return ttl < 0 ? ttl : ttl * 1000;
  }

  async expire(key, seconds) {
    return await this.client.expire(key, seconds);
  }

  async exists(key) {
    return (await this.client.exists(key)) ? 1 : 0;
  }

  async incr(key) {
    return await this.client.incr(key);
  }

  async incrby(key, amount = 1) {
    return await this.client.incrby(key, amount);
  }

  async decr(key) {
    return await this.client.decr(key);
  }

  async flushdb() {
    return await this.client.flushdb();
  }

  async call(...args) {
    try {
      const [command, ...params] = args;
      const cmd = String(command).toLowerCase();

      if (cmd === "incr") {
        return await this.incr(params[0]);
      }

      if (cmd === "incrby") {
        return await this.incrby(params[0], Number(params[1] || 1));
      }

      if (cmd === "decr") {
        return await this.decr(params[0]);
      }

      if (cmd === "get") {
        return await this.get(params[0]);
      }

      if (cmd === "set") {
        return await this.set(params[0], params[1]);
      }

      if (cmd === "setex") {
        return await this.setex(params[0], Number(params[1]), params[2]);
      }

      if (cmd === "expire" || cmd === "pexpire") {
        const key = params[0];
        const ttlValue = Number(params[1]);
        if (cmd === "pexpire") {
          return await this.expire(key, Math.ceil(ttlValue / 1000));
        }
        return await this.expire(key, ttlValue);
      }

      if (cmd === "ttl") {
        return await this.ttl(params[0]);
      }

      if (cmd === "pttl") {
        return await this.pttl(params[0]);
      }

      if (cmd === "del") {
        return await this.del(params);
      }

      if (cmd === "exists") {
        return await this.exists(params[0]);
      }

      if (cmd === "flushdb") {
        return await this.flushdb();
      }

      if (cmd === "script") {
        const subcommand = String(params[0] || "").toLowerCase();
        if (subcommand === "load") {
          const scriptText = String(params[1] || "");
          const sha = require("crypto")
            .createHash("sha1")
            .update(scriptText)
            .digest("hex");
          this.scripts.set(sha, scriptText);
          return sha;
        }
        if (subcommand === "exists") {
          return [1];
        }
        if (subcommand === "flush") {
          return "OK";
        }
      }

      if (cmd === "eval") {
        const script = params[0];
        const numKeys = Number(params[1] || 0);
        const keyArgs = params.slice(2, 2 + numKeys);
        const restArgs = params.slice(2 + numKeys);
        const result = await this.client.eval(script, keyArgs, restArgs);
        return result;
      }

      if (cmd === "evalsha") {
        const sha = String(params[0] || "");
        const script = this.scripts.get(sha);
        if (!script) {
          throw new Error("NOSCRIPT No matching script. Please use EVAL.");
        }

        const numKeys = Number(params[1] || 0);
        const keyArgs = params.slice(2, 2 + numKeys);
        const restArgs = params.slice(2 + numKeys);
        return await this.client.eval(script, keyArgs, restArgs);
      }

      logger.warn(`Upstash adapter: Unsupported command "${command}"`);
      return null;
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
