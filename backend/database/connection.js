const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = new sqlite3.Database(path.join(__dirname, 'flowfli.db'));
    this.init();
  }

  init() {
    this.db.serialize(() => {
      // Payments table
      this.db.run(`CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paymentId TEXT UNIQUE,
        amount REAL,
        customer TEXT,
        processed BOOLEAN,
        aiDecision TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Events table
      this.db.run(`CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT,
        data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Pump status table
      this.db.run(`CREATE TABLE IF NOT EXISTS pump_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pumpId TEXT,
        status TEXT,
        duration INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Analytics table
      this.db.run(`CREATE TABLE IF NOT EXISTS analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric TEXT,
        value REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
    });
  }

  async query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }
}

module.exports = new Database();
