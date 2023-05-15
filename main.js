// examination-result-management-system

// initializing base variables
require("dotenv").config();
// for creating an express application
const express = require("express");
const app = express();

// need for working with Phusion Passenger (shared hosting) or a sub level website
global.domain_url = process.env.DOMAIN_URL;
global.base_url = process.env.BASE_URL;
global.base_dir = __dirname + "/";
app.locals.domain_url = global.domain_url;
app.locals.base_url = global.base_url;
app.locals.base_dir = global.base_dir;

// setting the templating engine as pug
app.set("view engine", "pug");
app.set("views", global.base_dir + "pug");

// url attributes from forms
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// log files handling
const logger = require(global.base_dir + "custom-modules/logger");
// custom redirect handler
const redirecth = require(global.base_dir + "custom-modules/redirect-handler");
// custom send handler
const sendh = require(global.base_dir + "custom-modules/send-handler");
// database connection, promise version for compatibility
const db = require(global.base_dir + "custom-modules/database-promise");
app.set("db", db);

// for maintaining session information like logged in user
const session = require("express-session");
const mysqlStore = require("express-mysql-session")(session);
const create_session = (sessionStore) => {
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
}

const routes_before_session = () => {
    // for serving static files like stylesheets, javascripts, images
    app.use(global.base_url + "static", express.static(global.base_dir + "static"));
}

const routes_on_session_fail = () => {
    // database down page
    app.all(global.base_url, (req, res) => {
        redirecth.no_msg(req, res, "error");
    })
    app.get(global.base_url + "error", (req, res) => {
        sendh.page(req, res, "server-error");
    });
}

const routes_on_session_success = () => {
    // to handle base page requests
    app.use(global.base_url, require(global.base_dir + "routes/home"));
    // to handle login page requests
    app.use(global.base_url + "login", require(global.base_dir + "routes/login"));
    // to handle download requests
    app.use(global.base_url + "download", require(global.base_dir + "routes/download"));
    // to handle manage files requests
    app.use(global.base_url + "manage-files", require(global.base_dir + "routes/manage-files"));
}

const routes_after_session = () => {
    // simple test url
    app.all(global.base_url + "ok", (req, res) => {
        res.send("Website is working OK");
    });
    // to redirect users when the page isnt available, can add a 404 here
    app.all(global.base_url + "*", (req, res) => {
        redirecth.invalid_url(req, res, null);
    });
}

const sessionStore = new mysqlStore({}, db, (err) => {

    routes_before_session();
    if (err) {
        logger.writeToFile("error", logger.getFormattedMessage({ error: err, info: "Database unreachable" }));
        routes_on_session_fail();
    } else {
        logger.writeToFile("info", logger.getFormattedMessage({ info: "Database connection established" }));
        create_session(sessionStore);
        routes_on_session_success();
    }
    routes_after_session();

    // start server
    app.listen(process.env.PORT, () => {
        logger.writeToFile("info", logger.getFormattedMessage({ info: "Website started" }));
    });
});
