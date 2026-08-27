const rateLimit = require('express-rate-limit');

/**
 * Rate limiter specifically designed for AI endpoints.
 * AI endpoints are expensive, so we strictly limit usage.
 */
const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per `window` (here, per 15 minutes)
  message: {
    success: false,
    error: {
      message: 'Too many AI generation requests from this IP, please try again after 15 minutes',
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Standard API rate limiter for general routes (auth, fetching data).
 */
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later',
    },
  },
});

module.exports = {
  aiRateLimiter,
  apiRateLimiter,
};
