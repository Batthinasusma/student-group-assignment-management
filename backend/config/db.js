

const { Pool } = require("pg");
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

const pool = isProduction
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    })
    : new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

pool.connect()
    .then(client => {
        console.log("PostgreSQL Connected Successfully");
        client.release();
    })
    .catch(err => {
        console.error("Database connection error:", err.message);
    });

module.exports = pool;
