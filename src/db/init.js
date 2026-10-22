const fs = require('node:fs/promises');
const path = require('node:path');
const pool = require('./pool');

async function initDb() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = await fs.readFile(schemaPath, 'utf8');

  await pool.query(schema);

  console.log('Database schema initialized successfully.');
}

module.exports = initDb;
