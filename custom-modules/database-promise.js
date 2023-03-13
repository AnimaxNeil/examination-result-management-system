// database connection object

const mysql = require("mysql2/promise");

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dateStrings: true,
    connectionLimit: 1,
    connectTimeout: 60000,
});

module.exports = db;