const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const userModel = require('../models/user.model');

// this is for reducing the time difference when the user does not exist in the system (the attack won't know if an email does or doesn't exist in the system)
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 10);

async function login(req, res) {
  const { email, password } = req.body;

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password)
    return res.status(400).json({ success: false, message: 'Email and Password are required' }); // 400: bad request

  try {
    const user = await userModel.findByEmail(email.trim().toLowerCase());

    // we should always compare with a hash password so it will not appear that a user or an email does exist in the system or not
    const isPasswordValid = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);

    if (!user || !isPasswordValid)
      return res.status(401).json({ success: false, message: 'Invalid email or password' }); // 401: a request failed because it lacks valid authentication credentials for the requested resource

    if (!user.is_active)
      return res.status(403).json({ success: false, message: 'The account is disabled' }); // 403: the credentials have been provided, but you still do not have permission to access the resource

    const token = jwt.sign({ userId: user.user_id }, env.JWT_SECRET, { expiresIn: '12h' });

    res.cookie('token', token, {
      httpOnly: true, // protection against XSS attacks
      secure: env.NODE_ENV === 'production', // for using https instead of http in production
      sameSite: 'strict', // protection against CSRF attacks
      maxAge: 12 * 60 * 60 * 1000, // how long it will stay in the cookie (12h, the same as token expiration)
    });

    return res
      .status(200)
      .json({ success: true, message: 'Logged in successfully', roles: user.roles });
  } catch (err) {
    console.error('Login error: ', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { login };
