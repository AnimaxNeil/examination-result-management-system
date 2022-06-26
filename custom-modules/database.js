// database connection object

const mysql = require("mysql2");

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.db_USER,
    password: process.env.DB_PASSWORD,
    dateStrings: true,
    database: process.env.DB_NAME,
    // port: process.env.PORT
});

module.exports = db;