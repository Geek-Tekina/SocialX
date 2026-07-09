const winston = require("winston");

const SENSITIVE_KEY_PARTS = [
  "password",
  "credential",
  "token",
  "authorization",
  "cookie",
  "secret",
  "api_key",
  "api_secret",
];

const isSensitiveKey = (key = "") =>
  SENSITIVE_KEY_PARTS.some((part) => key.toLowerCase().includes(part));

const safeMeta = (value) => {
  if (value instanceof Error) {
    return { message: value.message, stack: value.stack };
  }
  return value;
};

const formatMeta = (meta) => {
  const cleanMeta = Object.entries(meta).reduce((safe, [key, value]) => {
    safe[key] = isSensitiveKey(key) ? "[REDACTED]" : safeMeta(value);
    return safe;
  }, {});

  if (Object.keys(cleanMeta).length === 0) return "";

  try {
    return ` ${JSON.stringify(cleanMeta)}`;
  } catch {
    return " [Unserializable metadata]";
  }
};

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, stack, service, ...meta }) => {
    return `${timestamp} ${level}: ${stack || message}${formatMeta(meta)}`;
  })
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: "api-gateway" },
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

module.exports = logger;
