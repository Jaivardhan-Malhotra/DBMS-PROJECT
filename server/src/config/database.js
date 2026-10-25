const mysql = require('mysql2');
const path  = require('path');

// Always load .env from the server/ directory, regardless of where the process is started
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ipl_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true
}).promise();

/**
 * Pings the database to verify connectivity.
 * @returns {Promise<boolean>}
 */
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`✅ Connected to MySQL database [${process.env.DB_NAME || 'ipl_management'}] at ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Attach helpers directly onto the pool object (does NOT break the default export)
pool.testConnection = testConnection;

// Export the pool itself as default — controllers do: const pool = require('../config/database')
module.exports = pool;
