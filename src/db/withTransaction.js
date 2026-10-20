const pool = require('./pool');

/**
 * Executes a callback within a database transaction.
 * Callers pass tx down to model functions. Controllers never call this.
 *
 * @template T
 * @param {(tx: import('pg').PoolClient) => Promise<T>} fn
 * @returns {Promise<T>}
 */
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    client.release();
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
      client.release();
    } catch (rollbackErr) {
      client.release(rollbackErr);
    }
    throw err;
  }
}

module.exports = withTransaction;
