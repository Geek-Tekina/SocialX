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

const redactForLog = (value, seen = new WeakSet(), depth = 0) => {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;
  if (Buffer.isBuffer(value)) return `[Buffer length=${value.length}]`;
  if (value instanceof Date) return value.toISOString();
  if (seen.has(value)) return "[Circular]";
  if (depth >= 4) return "[Object]";

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redactForLog(item, seen, depth + 1));
  }

  return Object.entries(value).reduce((safe, [key, item]) => {
    safe[key] = isSensitiveKey(key)
      ? "[REDACTED]"
      : redactForLog(item, seen, depth + 1);
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
