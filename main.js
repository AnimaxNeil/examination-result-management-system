// examination-result-system-cc9

// initializing base variables
global.__basedir = __dirname;
require("dotenv").config();

// for cresting an express application
const express = require("express");
const app = express();

// setting the templating engine as pug
app.set("view engine", "pug");
app.set("views", global.__basedir + "/pug");

// for maintaining session information like logged in user
const session = require("express-session");
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// for serving static files like stylesheets, javascripts, images
app.use("/static", express.static(global.__basedir + "/static"));

//to handle base page requests
app.use("/", require(global.__basedir + "/routes/home"));

// to handle login page requests
app.use("/login", require(global.__basedir + "/routes/login"));

app.get("/ok", (req, res) => {
    res.send("Website is working OK");
});

// to redirect users when the page isnt available, can add a 404 here
app.all("*", (req, res) => {
    res.redirect("/");
});

global.__server = app.listen(process.env.PORT, () => console.log("website started ..."));

