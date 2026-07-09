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

const MAX_DEPTH = 4;

const isSensitiveKey = (key = "") => {
  const normalized = key.toLowerCase();
  return SENSITIVE_KEY_PARTS.some((part) => normalized.includes(part));
};

const redactForLog = (value, depth = 0, seen = new WeakSet()) => {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;
  if (Buffer.isBuffer(value)) return `[Buffer length=${value.length}]`;
  if (value instanceof Date) return value.toISOString();
  if (seen.has(value)) return "[Circular]";
  if (depth >= MAX_DEPTH) return "[Object]";

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redactForLog(item, depth + 1, seen));
  }

  return Object.entries(value).reduce((safe, [key, item]) => {
    safe[key] = isSensitiveKey(key) ? "[REDACTED]" : redactForLog(item, depth + 1, seen);
    return safe;
  }, {});
};

const safeJson = (value) => {
  try {
    return JSON.stringify(redactForLog(value));
  } catch {
    return '"[Unserializable]"';
  }
};

const requestLogger = (logger) => (req, res, next) => {
  const body = req.body && Object.keys(req.body).length > 0 ? safeJson(req.body) : "{}";
  logger.info(`Received ${req.method} request to ${req.originalUrl || req.url} body=${body}`);
  next();
};

module.exports = { redactForLog, safeJson, requestLogger };
