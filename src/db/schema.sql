-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT 0 CHECK (is_admin IN (0, 1)), -- 0 for regular user, 1 for admin
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    account_number TEXT UNIQUE NOT NULL,
    account_type TEXT NOT NULL, -- e.g., 'checking', 'savings'
    balance REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- e.g., 'deposit', 'withdrawal', 'transfer_out', 'transfer_in', 'bill_pay', 'admin_adjust'
    amount REAL NOT NULL,
    description TEXT,
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    related_account_id INTEGER, -- For transfers, the other account involved
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (related_account_id) REFERENCES accounts(id)
);

-- User Messages table (for inbox)
CREATE TABLE IF NOT EXISTS user_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0 CHECK (is_read IN (0, 1)),
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Flash Messages table (for UI-wide messages)
CREATE TABLE IF NOT EXISTS flash_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME -- Optional expiration date
);

-- Admin Settings table (for activity toggles)
CREATE TABLE IF NOT EXISTS admin_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_name TEXT UNIQUE NOT NULL, -- e.g., 'allow_wire_transfer', 'allow_ach', 'allow_bill_pay'
    setting_value BOOLEAN DEFAULT 1 CHECK (setting_value IN (0, 1)) -- 1 for allowed, 0 for disallowed
);

-- Initialize default admin settings
INSERT OR IGNORE INTO admin_settings (setting_name, setting_value) VALUES ('allow_wire_transfer', 1);
INSERT OR IGNORE INTO admin_settings (setting_name, setting_value) VALUES ('allow_ach', 1);
INSERT OR IGNORE INTO admin_settings (setting_name, setting_value) VALUES ('allow_bill_pay', 1);