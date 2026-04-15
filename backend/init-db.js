#!/usr/bin/env node
/**
 * Database initialization script
 * Run this before starting the app if MySQL auth is giving issues
 */

const mysql = require('mysql2/promise');
const config = require('./dist/config/env').config;

async function initializeDatabase() {
  let connection;
  
  try {
    // Try to connect as root without password first (socket auth)
    console.log('Attempting to connect to MySQL as root...');
    
    try {
      connection = await mysql.createConnection({
        host: config.db.host,
        port: config.db.port,
        user: 'root',
        password: '',
        multipleStatements: true,
      });
      console.log('✓ Connected to MySQL');
    } catch (socketError) {
      // If socket auth fails, try with password
      if (socketError.code === 'ER_ACCESS_DENIED_NO_PASSWORD_ERROR') {
        console.log('Socket auth failed, trying with password...');
        connection = await mysql.createConnection({
          host: config.db.host,
          port: config.db.port,
          user: config.db.username,
          password: config.db.password,
          multipleStatements: true,
        });
        console.log('✓ Connected with password');
      } else {
        throw socketError;
      }
    }

    // Create database
    console.log(`Creating database "${config.db.name}"...`);
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${config.db.name}\``);
    console.log('✓ Database created or already exists');

    // Create user if password is set
    if (config.db.password) {
      console.log(`Creating user "${config.db.username}"@"127.0.0.1"...`);
      try {
        await connection.execute(
          `CREATE USER IF NOT EXISTS '${config.db.username}'@'127.0.0.1' IDENTIFIED BY '${config.db.password}'`
        );
        await connection.execute(
          `GRANT ALL PRIVILEGES ON \`${config.db.name}\`.* TO '${config.db.username}'@'127.0.0.1'`
        );
        await connection.execute('FLUSH PRIVILEGES');
        console.log('✓ User created and permissions granted');
      } catch (userError) {
        if (userError.code !== 'ER_CANNOT_USER') {
          console.warn('User creation warning:', userError.message);
        }
      }
    }

    console.log('\n✓ Database initialization completed successfully!');
    console.log(`  Database: ${config.db.name}`);
    console.log(`  User: ${config.db.username}`);
    console.log(`  Host: ${config.db.host}:${config.db.port}\n`);
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('✗ Database initialization failed:');
    console.error('  Error:', error.message);
    console.error('  Code:', error.code);
    
    if (connection) {
      await connection.end().catch(() => {});
    }
    process.exit(1);
  }
}

// Run if this is the main module
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
