// examination-result-management-system

// initializing base variables
require("dotenv").config();
global.__basedir = __dirname + "/";
// need for working with Phusion Passenger (shared hosting) or a sub directory website design
global.__baseurl = process.env.BASE_URL;

// for creating an express application
const express = require("express");
const app = express();

// setting the templating engine as pug
app.set("view engine", "pug");
app.set("views", global.__basedir + "pug");

// database connection, promise version for compatibility
const db = require(global.__basedir + "custom-modules/database-promise");
// for maintaining session information like logged in user
const session = require("express-session");
const mysqlStore = require("express-mysql-session")(session);
const sessionStore = new mysqlStore({}, db);
app.use(session({
    key: process.env.SESSION_NAME,
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
        sameSite: true,
        resave: false,
        proxy: true,
        secure: process.env.NODE_ENV == "production",
        secureProxy: process.env.NODE_ENV == "production",
    },
}));
if (process.env.NODE_ENV == "production") app.set("trust proxy", 1);

// log files handling
const logger = require(global.__basedir + "custom-modules/logger");

// custom redirect handler
const redirecth = require(global.__basedir + "custom-modules/redirect-handler");

// for serving static files like stylesheets, javascripts, images
app.use(global.__baseurl + "static", express.static(global.__basedir + "static"));

//to handle base page requests
app.use(global.__baseurl, require(global.__basedir + "routes/home"));

// to handle login page requests
app.use(global.__baseurl + "login", require(global.__basedir + "routes/login"));

// to handle download requests
app.use(global.__baseurl + "download", require(global.__basedir + "routes/download"));

// to handle manage files requests
app.use(global.__baseurl + "manage-files", require(global.__basedir + "routes/manage-files"));

// simple test url
app.all(global.__baseurl + "ok", (req, res) => {
    res.send("Website is working OK");
});

// to redirect users when the page isnt available, can add a 404 here
app.all(global.__baseurl + "*", (req, res) => {
    redirecth.invalid_url(req, res, null);
});

// start server
app.listen(process.env.PORT, () => {
    logger.writeToFile("info", logger.getFormattedMessage({ info: "Website started" }));
});

