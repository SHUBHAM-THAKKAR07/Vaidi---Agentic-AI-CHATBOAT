const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

const llmLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment before trying again.' },
  keyGenerator: (req) => {
    // Prefer user ID for per-user rate limiting; fall back to IP (IPv6-safe)
    if (req.user && req.user.id) return `user:${req.user.id}`;
    return ipKeyGenerator(req);
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' }
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Request limit reached. Please slow down.' }
});

module.exports = { llmLimiter, authLimiter, generalLimiter };
