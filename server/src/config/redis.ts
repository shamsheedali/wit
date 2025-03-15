import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL,
  password: process.env.REDIS_PASSWORD,
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("Connected to Redis Cloud!");
  } catch (error) {
    console.error("Redis connection failed:", error);
  }
};

export default redisClient;