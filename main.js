// examination-result-system-cc9

// initializing base variables
global.__basedir = __dirname;
require("dotenv").config();

// need for working with Phusion Passenger (shared hosting)
global.__baseurl = process.env.BASE_URL;

// for cresting an express application
const express = require("express");
const app = express();

// setting the templating engine as pug
app.set("view engine", "pug");
app.set("views", global.__basedir + "/pug");

// database connection, promise version for compatibility
const db = require(global.__basedir + "/custom-modules/database-promise");
// for maintaining session information like logged in user
const session = require("express-session");
const mysqlStore = require('express-mysql-session')(session);
const sessionStore = new mysqlStore({}, db);
app.use(session({
    key: process.env.SESSION_NAME,
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    cookie: {
        maxAge: 24 * 60 * 1000,
        secure: process.env.NODE_ENV == "production",
        httpOnly: true,
        sameSite: true
    },
    resave: false,
    saveUninitialized: false,
}));

// file handling
const fs = require("fs");

// log files handling
const logger = require(global.__basedir + "/custom-modules/logger");

// for serving static files like stylesheets, javascripts, images
app.use(global.__baseurl + "/static", express.static(global.__basedir + "/static"));

//to handle base page requests
app.use(global.__baseurl + "/", require(global.__basedir + "/routes/home"));

// to handle login page requests
app.use(global.__baseurl + "/login", require(global.__basedir + "/routes/login"));

// simple test url
app.get(global.__baseurl + "/ok", (req, res) => {
    res.send("Website is working OK");
});
// simple post test url
app.post(global.__baseurl + "/ok", (req, res) => {
    res.send("Website is working OK");
});

// to redirect users when the page isnt available, can add a 404 here
app.all(global.__baseurl + "/*", (req, res) => {
    res.redirect(global.__baseurl + "/");
});

// start server
app.listen(process.env.PORT, () => {
    logger.writeToFile("info", logger.getFormattedMessage({ info: "Website started" }));
});

