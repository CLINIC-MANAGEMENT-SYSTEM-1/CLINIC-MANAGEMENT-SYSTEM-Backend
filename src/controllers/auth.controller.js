const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const userModel = require('../models/user.model');
const { sendSuccess, sendError } = require('../common/response');

// this is for reducing the time difference when the user does not exist in the system (the attack won't know if an email does or doesn't exist in the system)
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 10);

async function login(req, res) {
  const { email, password } = req.body;

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password)
    return sendError(res, 400, 'VALIDATION_ERROR', 'Email and Password are required'); // 400: bad request

  try {
    const user = await userModel.findByEmail(email.trim().toLowerCase());

    // we should always compare with a hash password so it will not appear that a user or an email does exist in the system or not
    const isPasswordValid = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);

    // is_active added here intentionally for more security
    if (!user || !isPasswordValid || !user.is_active)
      return sendError(res, 401, 'INVALIDE_CREDENTIALS', 'Invalid email or password'); // 401: invalid authentication credentials

    const token = jwt.sign({ userId: user.user_id }, env.JWT_SECRET, { expiresIn: '12h' });

    res.cookie('token', token, {
      httpOnly: true, // protection against XSS attacks
      secure: env.NODE_ENV === 'production', // for using https instead of http in production
      sameSite: 'strict', // protection against CSRF attacks
      maxAge: 12 * 60 * 60 * 1000, // how long it will stay in the cookie (12h, the same as token expiration)
    });

    return sendSuccess(res, { first_name: user.first_name, roles: user.roles }, 200);
  } catch (err) {
    console.error('Login error: ', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { login };
