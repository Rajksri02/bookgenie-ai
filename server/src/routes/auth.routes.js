const express = require('express');
const { register, login, refresh, getMe, logout } = require('../controllers/auth.controller');
const validateRequest = require('../middlewares/validateRequest');
const { registerSchema, loginSchema } = require('../validations/auth.validation');
const requireAuth = require('../middlewares/requireAuth');
const { apiRateLimiter } = require('../middlewares/rateLimiter');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Stricter rate limit for login to prevent brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per window
  message: {
    success: false,
    error: { message: 'Too many login attempts, please try again after 15 minutes' },
  },
});

router.post('/register', apiRateLimiter, validateRequest(registerSchema), register);
router.post('/login', loginLimiter, validateRequest(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Protected route
router.get('/me', requireAuth, getMe);

module.exports = router;
