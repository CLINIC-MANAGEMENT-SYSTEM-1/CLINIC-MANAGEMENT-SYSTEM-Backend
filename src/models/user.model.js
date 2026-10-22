const pool = require('../db/pool');

async function findByEmail(email) {
  const result = await pool.query(
    'SELECT user_id, password_hash, is_active, roles FROM users WHERE email = $1',
    [email],
  );
  return result.rows[0] || null;
}

module.exports = { findByEmail };
