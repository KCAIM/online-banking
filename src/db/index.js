const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const config = require('../config');

const dbPath = path.resolve(__dirname, config.databaseUrl);
const schemaPath = path.resolve(__dirname, './schema.sql');

let db = null;

const connectDb = () => {
  if (db) {
    return db;
  }

  // Ensure the directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error connecting to database:', err.message);
      // In a real app, you might want to exit or handle this more gracefully
    } else {
      console.log('Connected to the SQLite database.');
      // Initialize schema if the database is new
      initializeDb();
    }
  });

  return db;
};

const initializeDb = () => {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema, (err) => {
    if (err) {
      console.error('Error initializing database schema:', err.message);
    } else {
      console.log('Database schema initialized or already exists.');
      // Optional: Create a default admin user if none exists
      createDefaultAdmin();
    }
  });
};

const createDefaultAdmin = () => {
  const bcrypt = require('bcrypt');
  const saltRounds = 10;
  const defaultAdminUsername = 'admin';
  const defaultAdminPassword = 'adminpassword'; // CHANGE THIS IN PRODUCTION!

  bcrypt.hash(defaultAdminPassword, saltRounds, (err, hash) => {
    if (err) {
      console.error('Error hashing default admin password:', err.message);
      return;
    }

    const query = `
      INSERT OR IGNORE INTO users (username, password, is_admin)
      VALUES (?, ?, ?)
    `;
    db.run(query, [defaultAdminUsername, hash, 1], function(err) {
      if (err) {
        console.error('Error creating default admin user:', err.message);
      } else if (this.changes > 0) {
        console.log(`Default admin user '${defaultAdminUsername}' created.`);
      } else {
        console.log(`Default admin user '${defaultAdminUsername}' already exists.`);
      }
    });
  });
};

// Helper function for running queries with promises
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        console.error('Error running query:', err.message, sql, params);
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

// Helper function for getting a single row with promises
const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('Error getting row:', err.message, sql, params);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Helper function for getting all rows with promises
const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Error getting all rows:', err.message, sql, params);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

module.exports = {
  connectDb,
  run,
  get,
  all,
  db // Export the raw db object if needed for complex transactions (use with caution)
};