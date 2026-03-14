import "dotenv/config";
import { Redis } from "ioredis";
import { fatal } from "../fatal.js";

const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 5) {
      fatal(new Error(`redis connection failed after ${times} attempts`));
    }
    const delay = Math.min(times * 200, 2000);
    console.warn(`redis retry attempt ${times}, waiting ${delay}ms...`);
    return delay;
  },
  reconnectOnError(err) {
    const targetErrors = ["READONLY", "ECONNRESET", "ETIMEDOUT"];
    return targetErrors.some((e) => err.message.includes(e));
  },
  lazyConnect: false,
  enableOfflineQueue: true,
  connectTimeout: 10000,
  // commandTimeout: 5000,
});

redis.on("connect", () => {
  console.log("redis connected");
});

redis.on("error", (err) => {
  console.error("redis error", err.message);
});

redis.on("close", () => {
  console.warn("redis closed");
});

redis.on("reconnecting", () => {
  console.warn("redis reconnecting");
});

export { redis };
