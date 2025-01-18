const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./currency_exchange.db', (err) => {
    if (err) console.error('Error opening database:', err.message);
    else console.log('Connected to SQLite database.');
});

// Create tables
db.run(`
    CREATE TABLE IF NOT EXISTS ExchangeRates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        currency_from TEXT NOT NULL,
        currency_to TEXT NOT NULL,
        rate REAL NOT NULL,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

db.run(`
    CREATE TABLE IF NOT EXISTS Transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        currency_from TEXT NOT NULL,
        currency_to TEXT NOT NULL,
        amount_from REAL NOT NULL,
        amount_to REAL NOT NULL,
        rate REAL NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

module.exports = db;
