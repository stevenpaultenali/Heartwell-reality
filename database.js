const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "database.sqlite");
const db = new Database(dbPath);

db.pragma("foreign_keys = ON");

// ENQUIRIES
db.prepare(`
    CREATE TABLE IF NOT EXISTS enquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        property_interest TEXT,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'New',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();

// PROPERTIES
db.prepare(`
    CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        location TEXT NOT NULL,
        property_type TEXT,
        price REAL,
        bedrooms INTEGER,
        bathrooms INTEGER,
        area INTEGER,
        description TEXT,
        image_url TEXT,
        status TEXT DEFAULT 'For sale',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();

// ADMINS
db.prepare(`
    CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();

console.log("Database connected successfully.");
console.log("Enquiries, properties and admins tables are ready.");

module.exports = db;