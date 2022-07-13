// login page logic

// to use express for serving files
const express = require("express");
const router = express.Router();

// log files handling
const logger = require(global.__basedir + "/custom-modules/logger");

// database connection
const db = require(global.__basedir + "/custom-modules/database");
// formatted sql querries
const sql = require(global.__basedir + "/custom-modules/sql-commands");

// check validity of various input feilds
const vfv = require(global.__basedir + "/custom-modules/verify-values");
// valid regex for the front end
let rgxub = require(global.__basedir + "/custom-modules/regex-unbounded");


router.get("/", (req, res) => {
    if (req.session.user) {
        res.redirect(global.__baseurl + "/");
        logger.quickLog(req, null, "permission denied");
    }
    else {
        res.render("login", {
            rgx: rgxub,
            errorMsg: global.errorMsg,
            successMsg: global.successMsg
        });
        global.errorMsg = global.successMsg = null;
        logger.quickLog(req, null, "sent");
    }
});

const authenticate_user = (req, res) => {
    req.body.userid = vfv.get_real_userid(req.body.userid);
    db.query(sql.get_users_with_id_password(req.body.userid, req.body.password), (err, users) => {
        if (err) {
            res.redirect(global.__baseurl + "/login");
            logger.quickLog(req, err, null);
        }
        else if (users[0] && users[0].active != 0) {
            req.session.user = Object.assign({}, {
                userid: users[0].userid,
                type: users[0].type,
            });
            global.successMsg = "Login successful.";
            res.redirect(global.__baseurl + "/");
            logger.quickLog(req, null, "login successful, userid:" + req.body.userid);
        }
        else {
            global.errorMsg = "Login failed. Incorrect credentials or the associated user account is inactive.";
            res.redirect(global.__baseurl + "/login");
            logger.quickLog(req, null, "login failed, userid:" + req.body.userid);
        }
    });
};

router.post("/", (req, res) => {
    if (req.session.user) {
        res.redirect(global.__baseurl + "/");
        logger.quickLog(req, null, "already logged in, userid:" + req.session.user.userid);
    }
    else if (req.body.userid && req.body.password && vfv.verify_userid(req.body.userid)) {
        authenticate_user(req, res);
    }
    else {
        res.redirect(global.__baseurl + "/login");
        logger.quickLog(req, null, "invalid input");
    }
});

module.exports = router;

