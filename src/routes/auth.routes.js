const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const rateLimiter = require('../middlewares/rateLimiter.middleware');

router.post('/login', rateLimiter.loginLimiter, authController.login);

module.exports = router;
