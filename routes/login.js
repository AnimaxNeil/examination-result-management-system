// login page logic

// to use express for serving files
const express = require("express");
const router = express.Router();

// custom redirect handler
const redirecth = require(global.__basedir + "custom-modules/redirect-handler");
// custom send handler
const sendh = require(global.__basedir + "custom-modules/send-handler");

// database connection
const db = require(global.__basedir + "custom-modules/database");
// formatted sql querries
const sql = require(global.__basedir + "custom-modules/sql-commands");
// check validity of various input feilds
const vfv = require(global.__basedir + "custom-modules/verify-values");
// valid regex for the front end
let rgxub = require(global.__basedir + "custom-modules/regex-unbounded");


router.get("/", (req, res) => {
    if (req.session.user)
        redirecth.login_duplicate(req, res, null);
    else
        sendh.page(req, res, "user-login", {
            rgx: rgxub
        });
});

const authenticate_user = (req, res) => {
    req.body.userid = vfv.get_real_userid(req.body.userid);
    db.query(sql.select_users_with_id_password, [req.body.userid, req.body.password], (err, users) => {
        if (err)
            redirecth.system_error(req, res, err, "login");
        else if (users[0] && users[0].active != 0) {
            req.session.user = Object.assign({}, {
                userid: users[0].userid,
                type: users[0].type,
            });
            redirecth.login_success(req, res, null);
        }
        else redirecth.login_fail(req, res, "login");
    });
};

router.post("/", (req, res) => {
    if (req.session.user)
        redirecth.login_duplicate(req, res, null);
    else if (req.body.userid && req.body.password && vfv.verify_userid(req.body.userid))
        authenticate_user(req, res);
    else
        redirecth.invalid_input(req, res, null);
});

module.exports = router;
