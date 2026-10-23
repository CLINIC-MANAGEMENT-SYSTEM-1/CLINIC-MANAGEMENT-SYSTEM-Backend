const rateLimit = require('express-rate-limit');
const { sendError } = require('../common/response');

// Limits failed login attempts per IP (protects against brute-force attacks)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 15, // only 15 attempts per IP in each window
  skipSuccessfulRequests: true, // only failed attempts count toward the limit
  standardHeaders: true, // sends a headers to the frontend about how many limits are left
  legacyHeaders: false, // to not send the old headers format

  handler: (req, res) => {
    return sendError(
      res,
      429, // rate limiting status code
      'TOO_MANY_REQUESTS',
      'Too many login attempts. Please try again after 15 minutes.',
    );
  },
});

module.exports = { loginLimiter };
