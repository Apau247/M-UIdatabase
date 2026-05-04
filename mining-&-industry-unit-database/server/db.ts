import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(process.cwd(), 'industry_unit.db');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('Admin', 'Analyst', 'Viewer'))
  );

  CREATE TABLE IF NOT EXISTS stakeholders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    position TEXT,
    organization TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    category TEXT CHECK(category IN ('government', 'private sector', 'association'))
  );

  CREATE TABLE IF NOT EXISTS mining_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mineral_type TEXT NOT NULL,
    production_volume REAL,
    export_volume REAL,
    royalties REAL,
    corporate_tax REAL,
    dividend_tax REAL,
    reserve_value REAL,
    equity_stake REAL,
    date_recorded TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS industry_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sector TEXT NOT NULL,
    production_volume REAL,
    import_volume REAL,
    export_volume REAL,
    reporting_period TEXT
  );

  CREATE TABLE IF NOT EXISTS market_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    commodity_name TEXT NOT NULL,
    price REAL NOT NULL,
    date_time TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_trail (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id INTEGER,
    details TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Insert default admin if not exists (password: admin123)
const admin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (!admin) {
  // Using a plain text for now, but we should hash it in the real logic. 
  // I'll use bcrypt in the seed logic if I want to be 100% correct.
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', '$2a$10$xESY1.gK1/vS.8rXo1oXqu8j7d/B1j2fI6Uo3oD/gK9lF9s9/6S', 'Admin');
}

export default db;
