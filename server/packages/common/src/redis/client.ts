import dotenv from "dotenv";
dotenv.config({
  path: ".env",
});
import Redis from "ioredis";
import { logger } from "../logger";

const PORT = process.env.REDIS_PORT;
const HOST = process.env.REDIS_HOST;
const USERNAME = process.env.REDIS_USERNAME;
const PASSWORD = process.env.REDIS_PASSWORD;
const DB = process.env.REDIS_DB;

if (!PORT || !HOST || !USERNAME || !PASSWORD || !DB) {
  logger.error("Redis info not found in .env!");
  process.exit(1);
}

//* Default client
export const redisClient = new Redis({
  port: Number(PORT),
  host: HOST,
  username: USERNAME,
  password: PASSWORD,
  db: Number(DB),
});

redisClient.on("error", (err) => {
  logger.error(`[Redis Error]: ${err}`);
});

redisClient.on("connect", () => {
  logger.info("[Redis] Connected");
});

//* Client used only for pub/sub
export const redisSubClient = new Redis({
  port: Number(PORT),
  host: HOST,
  username: USERNAME,
  password: PASSWORD,
  db: Number(DB),
});

//* Client used only for pub/sub
export const redisPubClient = new Redis({
  port: Number(PORT),
  host: HOST,
  username: USERNAME,
  password: PASSWORD,
  db: Number(DB),
});
