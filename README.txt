A USDT TRC-20 Payment System built with Node.js + TypeScript, using MySQL, WebSocket, TronWeb, and authentication via JWT or Basic Auth.
This backend project supports:
User registration and login
TRC-20 wallet creation
Balance and transaction tracking
Role-based access control (USER, ADMIN)
Admin features via API
Live transaction updates  WebSocket
Dual authentication: Bearer (JWT) and Basic Auth

Tech Stack
Node.js, Express.js
TypeScript
MySQL with mysql2
JWT, bcrypt
TronWeb for TRC-20
WebSocket (ws)
Joi for input validation
dotenv for environment config




Why MySQL:
Relational data
Optimized for high costs and handles large numbers of transactions.
Supports replication (master-slave), sharding, and other scaling methods.

.env config constants
DB_HOST=localhost
DB_PORT=***
DB_NAME=***
DB_USER=***
DB_PASS=
TRON_FULLNODE=***
JWT_SECRET=***
JWT_EXP=1h
SECRET_KEY=***
USDT_CONTR=***
IV_LENGTH = **



DB structure
-- CreateDB
DROP DATABASE IF EXISTS payment_system;
CREATE DATABASE payment_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE payment_system;

-- Tables of users
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
    username VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tables of orders
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(18,6) NOT NULL,
    status ENUM('Pending', 'Confirmed', 'Cancelled') NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tables of wallets
CREATE TABLE wallets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_id INT NULL,
    address VARCHAR(100) NOT NULL UNIQUE,
    private_key TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- Payment Table
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id INT NOT NULL,
    tx_id VARCHAR(100) NOT NULL UNIQUE,
    amount DECIMAL(18,6) NOT NULL,
    status ENUM('Pending', 'Confirmed', 'Cancelled') NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
);

-- Transactions Table
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id INT NOT NULL,
    tx_id VARCHAR(100) NOT NULL UNIQUE,
    amount DECIMAL(18,6) NOT NULL,
    status ENUM('Pending', 'Confirmed', 'Cancelled', 'Failed') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
);
