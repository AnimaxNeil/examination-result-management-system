// login page logic

// to use express for serving files
const express = require("express");
const router = express.Router();

// log files handling
const logger = require(global.__basedir + "/custom-modules/logger");
// quick log support function
const loggerLog = (req, err, info) => {
    const level = err ? "error" : "info";
    if (req.method == "GET")
        logger.writeToFile(level, logger.getFormattedMessage({ get: req.originalUrl, error: err, info: info }));
    else if (req.method == "POST")
        logger.writeToFile(level, logger.getFormattedMessage({ post: req.originalUrl, error: err, info: info }));
}

// database connection
const db = require(global.__basedir + "/custom-modules/database");
db.connect((err) => {
    logger.writeToFile("info", logger.getFormattedMessage({ info: "db connection", error: err }));
});
// formatted sql querries
const sql = require(global.__basedir + "/custom-modules/sql-commands");

// check validity of various input feilds
const vfv = require(global.__basedir + "/custom-modules/verify-values");
// valid regex for the front end
let rgxub = require(global.__basedir + "/custom-modules/regex-unbounded");


router.get("/", (req, res) => {
    if (req.session.user) {
        res.redirect("/");
        loggerLog(req, null, "permission denied");
    }
    else {
        const errorMsg = req.session.errorMsg;
        const successMsg = req.session.successMsg;
        req.session.errorMsg = req.session.successMsg = null;
        res.render("login", {
            rgx: rgxub,
            errorMsg: errorMsg,
            successMsg: successMsg
        });
        loggerLog(req, null, "sent");
    }
});

const authenticate_user = (req, res) => {
    req.body.userid = vfv.get_real_userid(req.body.userid);
    db.query(sql.get_users_with_id_password(req.body.userid, req.body.password), (err, users) => {
        if (err) {
            res.redirect("/login");
            loggerLog(req, err, null);
        }
        else if (users[0] && users[0].active != 0) {
            req.session.user = Object.assign({}, {
                userid: users[0].userid,
                type: users[0].type,
            });
            req.session.successMsg = "Login successfull. User Id: " + req.session.user.userid;
            res.redirect("/");
            loggerLog(req, null, "login successfull, userid:" + req.body.userid);
        }
        else {
            req.session.errorMsg = "Login failed. Incorrect credentials or the associated user account is inactive.";
            res.redirect("/login");
            loggerLog(req, null, "login failed, userid:" + req.body.userid);
        }
    });
};

router.post("/", (req, res) => {
    if (req.session.user) {
        res.redirect("/");
        loggerLog(req, null, "already logged in, userid:" + req.session.user.userid);
    }
    else if (req.body.userid && req.body.password && vfv.verify_userid(req.body.userid)) {
        authenticate_user(req, res);
    }
    else {
        res.redirect("/login");
        loggerLog(req, null, "invalid input");
    }
});

module.exports = router;
