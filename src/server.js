const env = require('./config/env');
const app = require('./app');
const initDb = require('./db/init');
const pool = require('./db/pool');

async function startServer() {
  try {
    await initDb();

    app.listen(env.PORT, () => {
      console.log(`Server listening on port ${env.PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize database:', error.message);

    try {
      await pool.end();
    } catch (closeError) {
      console.error('Failed to close database pool:', closeError.message);
    }

    process.exitCode = 1;
  }
}

startServer();
