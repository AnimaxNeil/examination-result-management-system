// home page logic

// to use express for serving files
const express = require("express");
const router = express.Router();

// file handling
const fs = require("fs");

// log files handling
const logger = require(global.__basedir + "/custom-modules/logger");
// quick log support function
const loggerLog = (req, err, info) => {
    const level = err ? "error" : "info";
    if (req.method == "GET")
        logger.writeToFile(level, logger.getFormattedMessage({ user: req.session.user, get: req.originalUrl, info: info, error: err }));
    else if (req.method == "POST")
        logger.writeToFile(level, logger.getFormattedMessage({ user: req.session.user, post: req.originalUrl, info: info, error: err }));
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

// handle file upload from forms
const fileUpload = require('express-fileupload');
router.use(fileUpload({
    useTempFiles: true,
    tempFileDir: global.__basedir + "/data/temp"
}));

// url attributes from forms
router.use(express.json());
router.use(express.urlencoded({ extended: false }));


router.get("/", (req, res) => {
    if (req.session.user) {
        const errorMsg = req.session.errorMsg;
        const successMsg = req.session.successMsg;
        req.session.errorMsg = req.session.successMsg = null;
        res.render("home", {
            userType: req.session.user.type,
            errorMsg: errorMsg,
            successMsg: successMsg
        });
        loggerLog(req, null, "sent");
    }
    else {
        res.redirect("/login");
        loggerLog(req, null, "permission denied");
    }
});

router.get("/forgot", (req, res) => {
    if (!req.session.user) {
        res.render("forgot");
        loggerLog(req, null, "sent");
    }
    else {
        res.redirect("/");
        loggerLog(req, null, "permission denied");
    }
});

router.get("/logout", (req, res) => {
    if (req.session.user) {
        req.session.user = null;
        req.session.successMsg = "Log out successful.";
        res.redirect("/login");
        loggerLog(req, null, "sent");
    }
    else {
        res.redirect("/login");
        loggerLog(req, null, "permission denied");
    }
});

router.get("/profile", (req, res) => {
    if (req.session.user && req.session.user.type == "student") {
        db.query(sql.get_students_with_id(req.session.user.userid), (err, students) => {
            if (err) {
                res.redirect("/");
                loggerLog(req, err, null);
            }
            else {
                res.render("profile", {
                    student: students[0],
                });
                loggerLog(req, null, "sent");
            }
        });
    }
    else if (req.session.user && req.session.user.type == "teacher") {
        db.query(sql.get_teachers_with_id(req.session.user.userid), (err, teachers) => {
            if (err) {
                res.redirect("/");
                loggerLog(req, err, null);
            }
            else {
                res.render("profile", {
                    teacher: teachers[0],
                });
                loggerLog(req, null, "sent");
            }
        });
    }
    else {
        res.redirect("/");
        loggerLog(req, null, "permission denied");
    }
});

router.get("/users", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        db.query(sql.get_all_users, (err, users) => {
            if (err) {
                res.redirect("/");
                loggerLog(req, err, null);
            }
            else {
                const errorMsg = req.session.errorMsg;
                const successMsg = req.session.successMsg;
                req.session.errorMsg = req.session.successMsg = null;
                res.render("list-users", {
                    users: users,
                    errorMsg: errorMsg,
                    successMsg: successMsg
                });
                loggerLog(req, null, "sent");
            }
        });
    }
    else {
        res.redirect("/");
        loggerLog(req, null, "permission denied");
    }
});

router.get("/user/:userid", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        if (vfv.verify_userid(req.params.userid)) {
            req.params.userid = vfv.get_real_userid(req.params.userid);
            db.query(sql.get_users_with_id(req.params.userid), (err, users) => {
                if (err) {
                    res.redirect("/users");
                    loggerLog(req, err, null);
                }
                else if (users[0].type == "student") {
                    db.query(sql.get_students_with_id(req.params.userid), (err, students) => {
                        if (err) {
                            res.redirect("/users");
                            loggerLog(req, err, null);
                        }
                        else {
                            const errorMsg = req.session.errorMsg;
                            const successMsg = req.session.successMsg;
                            req.session.errorMsg = req.session.successMsg = null;
                            res.render("edit-user", {
                                user: users[0],
                                userInfo: students[0],
                                rgx: rgxub,
                                errorMsg: errorMsg,
                                successMsg: successMsg
                            });
                            loggerLog(req, null, "sent");
                        }
                    });
                }
                else if (users[0].type == "teacher") {
                    db.query(sql.get_teachers_with_id(req.params.userid), (err, teachers) => {
                        if (err) {
                            res.redirect("/users");
                            loggerLog(req, err, null);
                        }
                        else {
                            const errorMsg = req.session.errorMsg;
                            const successMsg = req.session.successMsg;
                            req.session.errorMsg = req.session.successMsg = null;
                            res.render("edit-user", {
                                user: users[0],
                                userInfo: teachers[0],
                                rgx: rgxub,
                                errorMsg: errorMsg,
                                successMsg: successMsg
                            });
                            loggerLog(req, null, "sent");
                        }
                    });
                }
                else {
                    res.redirect("/users");
                    loggerLog(req, null, "not found");
                }
            });
        }
        else {
            res.redirect("/users");
            loggerLog(req, null, "invalid input");
        }
    }
    else {
        res.redirect("/");
        loggerLog(req, null, "permission denied");
    }
});

router.get("/add-user", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        res.render("add-user", {
            rgx: rgxub
        });
        loggerLog(req, null, "sent");
    }
    else {
        res.redirect("/");
        loggerLog(req, null, "permission denied");
    }
});

router.post("/add-user", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        req.body.active = req.body.active && req.body.active == "true" ? "true" : "false";
        if (!req.body.address) { req.body.address = " "; }
        if (vfv.verify_password(req.body.password) && vfv.verify_type(req.body.type) && vfv.verify_active(req.body.active)
            && vfv.verify_name(req.body.name) && vfv.verify_course(req.body.course) && vfv.verify_dob(req.body.dob)
            && vfv.verify_email(req.body.email) && vfv.verify_phone(req.body.phone) && vfv.verify_address(req.body.address)
        ) {
            req.body.course = req.body.course.toLowerCase();
            req.body.email = req.body.email.toLowerCase();
            req.body.address = req.body.address.replaceAll(",\n", "\n").replaceAll("\n", ", ");
            db.query(sql.insert_users_table(req.body.password, req.body.type, req.body.active), (err, uRes) => {
                if (err) {
                    res.redirect("/add-user");
                    loggerLog(req, err, null);
                }
                else if (req.body.type == "student") {
                    db.query(sql.insert_students_table(uRes.insertId, req.body.name, req.body.course, req.body.dob, req.body.email, req.body.phone, req.body.address),
                        (err, sRes) => {
                            if (err) {
                                res.redirect("/add-user");
                                loggerLog(req, err, null);
                            }
                            else {
                                req.session.successMsg = "User added successfully.";
                                res.redirect("/user/" + vfv.get_valid_userid(uRes.insertId));
                                loggerLog(req, null, "submitted successfully");
                            }
                        });
                }
                else if (req.body.type == "teacher") {
                    db.query(sql.insert_teachers_table(uRes.insertId, req.body.name, req.body.course, req.body.dob, req.body.email, req.body.phone, req.body.address),
                        (err, tRes) => {
                            if (err) {
                                res.redirect("/add-user");
                                loggerLog(req, err, null);
                            }
                            else {
                                req.session.successMsg = "User added successfully.";
                                res.redirect("/user/" + vfv.get_valid_userid(uRes.insertId));
                                loggerLog(req, null, "submitted successfully");
                            }
                        });
                }
            });
        }
        else {
            res.redirect("/add-user");
            loggerLog(req, null, "invalid input");
        }
    }
    else {
        res.redirect("/");
        loggerLog(req, null, "permission denied");
    }
});

router.post("/edit-user", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        if (vfv.verify_userid(req.body.userid)) {
            req.body.userid = vfv.get_real_userid(req.body.userid);
            if (req.body.active) { req.body.active = req.body.active == "true" ? "true" : "false"; }
            else if (req.body.active_) { req.body.active = "false"; }
            if (!req.body.address && req.body.address_) { req.body.address = " "; }
            db.query(sql.get_users_with_id(req.body.userid), (err, users) => {
                if (err) {
                    res.redirect("/users");
                    loggerLog(req, err, null);
                }
                else if (users[0] && vfv.verify_type(users[0].type)) {
                    if (vfv.verify_password(req.body.password)) {
                        db.query(sql.update_users_with_id(users[0].userid, req.body.password, null, null), (err, qRes) => {
                            res.redirect("/user/" + vfv.get_valid_userid(users[0].userid));
                            if (err) loggerLog(req, err, null); else loggerLog(req, null, "updated");
                        });
                    }
                    else if (vfv.verify_active(req.body.active)) {
                        db.query(sql.update_users_with_id(users[0].userid, null, null, req.body.active), (err, qRes) => {
                            res.redirect("/user/" + vfv.get_valid_userid(users[0].userid));
                            if (err) loggerLog(req, err, null); else loggerLog(req, null, "updated");
                        });
                    }
                    else if (vfv.verify_name(req.body.name)) {
                        if (users[0].type == "student") {
                            db.query(sql.update_students_with_id(users[0].userid, req.body.name, null, null, null, null, null), (err, qRes) => {
                                res.redirect("/user/" + vfv.get_valid_userid(users[0].userid));
                                if (err) loggerLog(req, err, null); else loggerLog(req, null, "updated");
                            });
                        }
                        else if (users[0].type == "teacher") {
                            db.query(sql.update_teachers_with_id(users[0].userid, req.body.name, null, null, null, null, null), (err, qRes) => {
                                res.redirect("/user/" + vfv.get_valid_userid(users[0].userid));
                                if (err) loggerLog(req, err, null); else loggerLog(req, null, "updated");
                            });
                        }
                    }
                    else if (vfv.verify_course(req.body.course)) {
                        req.body.course = req.body.course.toLowerCase();
                        if (users[0].type == "student") {
                            db.query(sql.update_students_with_id(users[0].userid, null, req.body.course, null, null, null, null), (err, qRes) => {
                                res.redirect("/user/" + vfv.get_valid_userid(users[0].userid));
                                if (err) loggerLog(req, err, null); else loggerLog(req, null, "updated");
                            });
                        }
                        else if (users[0].type == "teacher") {
                            db.query(sql.update_teachers_with_id(users[0].userid, null, req.body.course, null, null, null, null), (err, qRes) => {
                                res.redirect("/user/" + vfv.get_valid_userid(users[0].userid));
                                if (err) loggerLog(req, err, null); else loggerLog(req, null, "updated");
                            });
                        }
                    }
                    else if (vfv.verify_dob(req.body.dob)) {
                        if (users[0].type == "student") {
                            db.query(sql.update_students_with_id(users[0].userid, null, null, req.body.dob, null, null, null), (err, qRes) => {
                                res.redirect("/user/" + vfv.get_valid_userid(users[0].userid));
                                if (err) loggerLog(req, err, null); else loggerLog(req, null, "updated");
                            });
                        }
                        else if (users[0].type == "teacher") {
                            db.query(sql.update_teachers_with_id(users[0].userid, null, null, req.body.dob, null, null, null), (err, qRes) => {
                                res.redirect("/user/" + vfv.get_valid_userid(users[0].userid));
                                if (err) loggerLog(req, err, null); else loggerLog(req, null, "updated");
                            });
                        }
                    }
                    else if (vfv.verify_email(req.body.email)) {
                        req.body.email = req.body.email.toLowerCase();
                        if (users[0].type == "student") {
                            db.query(sql.update_students_with_id(users[0].userid, null, null, null, req.body.email, null, null), (err, qRes) => {
                                res.redirect("/user/" + vfv.get_valid_userid(users[0].userid));
                                if (err) loggerLog(req, err, null); else loggerLog(req, null, "updated");
                            });
                        }
                        else if (users[0].type == "teacher") {
                            db.query(sql.update_teachers_with_id(users[0].userid, null, null, null, req.body.email, null, null), (err, qRes) => {
                                res.redirect("/user/" + vfv.get_valid_userid(users[0].userid));
                                if (err) loggerLog(req, err, null); else loggerLog(req, null, "updated");
                            });
                        }
                    }
                    else if (vfv.verify_phone(req.body.phone)) {
                        if (users[0].type == "student") {
                            db.query(sql.update_students_with_id(users[0].userid, null, null, null, null, req.body.phone, null), (err, qRes) => {
                                res.redirect("/user/" + vfv.get_valid_userid(users[0].userid));
                                if (err) loggerLog(req, err, null); else loggerLog(req, null, "updated");
                            });
                        }
                        else if (users[0].type == "teacher") {
                            db.query(sql.update_teachers_with_id(users[0].userid, null, null, null, null, req.body.phone, null), (err, qRes) => {
                                res.redirect("/user/" + vfv.get_valid_userid(users[0].userid));
                                if (err) loggerLog(req, err, null); else loggerLog(req, null, "updated");
                            });
                        }
                    }
                    else if (vfv.verify_address(req.body.address)) {
                        req.body.address = req.body.address.replaceAll(",\n", "\n").replaceAll("\n", ", ");
                        if (users[0].type == "student") {
                            db.query(sql.update_students_with_id(users[0].userid, null, null, null, null, null, req.body.address), (err, qRes) => {
                                res.redirect("/user/" + vfv.get_valid_userid(users[0].userid));
                                if (err) loggerLog(req, err, null); else loggerLog(req, null, "updated");
                            });
                        }
                        else if (users[0].type == "teacher") {
                            db.query(sql.update_teachers_with_id(users[0].userid, null, null, null, null, null, req.body.address), (err, qRes) => {
                                res.redirect("/user/" + vfv.get_valid_userid(users[0].userid));
                                if (err) loggerLog(req, err, null); else loggerLog(req, null, "updated");
                            });
                        }
                    }
                    else if (vfv.verify_type(req.body.type)) {
                        db.query(sql.update_users_with_id(users[0].userid, null, req.body.type, null), (err, qRes) => {
                            if (err) {
                                res.redirect("/user/" + vfv.get_valid_userid(users[0].userid));
                                loggerLog(req, err, null);
                            }
                            else if (users[0].type != req.body.type && users[0].type == "student") {
                                db.query(sql.get_students_with_id(users[0].userid), (err, sRes) => {
                                    if (err) {
                                        res.redirect("/user/" + vfv.get_valid_userid(users[0].userid));
                                        loggerLog(req, err, null);
                                    }
                                    else {
                                        db.query(sql.delete_students_with_id(users[0].userid), (err, dRes) => {
                                            if (err) {
                                                res.redirect("/user/" + vfv.get_valid_userid(users[0].userid));
                                                loggerLog(req, err, null);
                                            }
                                            else {
                                                db.query(sql.insert_teachers_table(
                                                    users[0].userid, sRes[0].name, sRes[0].course, sRes[0].dob, sRes[0].email, sRes[0].phone, sRes[0].address), (err, iRes) => {
                                                        res.redirect("/user/" + vfv.get_valid_userid(users[0].userid));
                                                        if (err) loggerLog(req, err, null); else loggerLog(req, null, "updated");
                                                    });
                                            }
                                        });
                                    }
                                });
                            }
                            else if (users[0].type != req.body.type && users[0].type == "teacher") {
                                db.query(sql.get_teachers_with_id(users[0].userid), (err, tRes) => {
                                    if (err) {
                                        res.redirect("/user/" + vfv.get_valid_userid(users[0].userid));
                                        loggerLog(req, err, null);
                                    }
                                    else {
                                        db.query(sql.delete_teachers_with_id(users[0].userid), (err, dRes) => {
                                            if (err) {
                                                res.redirect("/user/" + vfv.get_valid_userid(users[0].userid));
                                                loggerLog(req, err, null);
                                            }
                                            else {
                                                db.query(sql.insert_students_table(
                                                    users[0].userid, tRes[0].name, tRes[0].course, tRes[0].dob, tRes[0].email, tRes[0].phone, tRes[0].address), (err, iRes) => {
                                                        res.redirect("/user/" + vfv.get_valid_userid(users[0].userid));
                                                        if (err) loggerLog(req, err, null); else loggerLog(req, null, "updated");
                                                    });
                                            }
                                        });
                                    }
                                });
                            }
                            else {
                                res.redirect("/user/" + vfv.get_valid_userid(users[0].userid));
                                loggerLog(req, null, "already updated");
                            }
                        });
                    }
                    else {
                        res.redirect("/user/" + vfv.get_valid_userid(users[0].userid));
                        loggerLog(req, null, "invalid input");
                    }
                }
                else {
                    res.redirect("/users");
                    loggerLog(req, null, "not found");
                }
            });
        }
        else {
            res.redirect("/users");
            loggerLog(req, null, "missing input");
        }
    }
    else {
        res.redirect("/");
        loggerLog(req, null, "permission denied");
    }
});

router.post("/delete-users", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        if (vfv.verify(req.body.userid)) {
            req.body.userid = vfv.get_real_userid(req.body.userid);
            db.query(sql.get_users_with_id(req.body.userid), (err, users) => {
                if (err) {
                    res.redirect("/user/a");
                    loggerLog(req, err, null);
                }
                else if (users[0] && vfv.verify_type(users[0].type)) {
                    if (users[0].type == "student") {
                        db.query(sql.delete_students_with_id(users[0].userid), (err, qRes) => {
                            if (err) {
                                res.redirect("/user/n" + vfv.get_valid_userid(users[0].userid));
                                loggerLog(req, err, null);
                            }
                            else {
                                db.query(sql.delete_all_answer_papers_with_id(users[0].userid), (err, aRes) => {
                                    if (err) {
                                        res.redirect("/user/i" + vfv.get_valid_userid(users[0].userid));
                                        loggerLog(req, err, null);
                                    }
                                    else {
                                        db.query(sql.delete_users_with_id(users[0].userid), (err, uRes) => {
                                            if (err) {
                                                res.redirect("/user/m" + vfv.get_valid_userid(users[0].userid));
                                                loggerLog(req, err, null);
                                            }
                                            else {
                                                res.redirect("/user/a");
                                                loggerLog(req, null, "deleted");
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                    else if (users[0].type == "teacher") {
                        db.query(sql.delete_teachers_with_id(users[0].userid), (err, qRes) => {
                            if (err) {
                                res.redirect("/user/x" + vfv.get_valid_userid(users[0].userid));
                                loggerLog(req, err, null);
                            }
                            else {
                                db.query(sql.delete_all_answer_papers_with_id(users[0].userid), (err, aRes) => {
                                    if (err) {
                                        res.redirect("/user/n" + vfv.get_valid_userid(users[0].userid));
                                        loggerLog(req, err, null);
                                    }
                                    else {
                                        db.query(sql.delete_users_with_id(users[0].userid), (err, uRes) => {
                                            if (err) {
                                                res.redirect("/user/i" + vfv.get_valid_userid(users[0].userid));
                                                loggerLog(req, err, null);
                                            }
                                            else {
                                                res.redirect("/user/l");
                                                loggerLog(req, null, "deleted");
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                }
                else {
                    res.redirect("/user/created");
                    loggerLog(req, null, "not found");
                }
            });
        }
        else {
            res.redirect("/users");
            loggerLog(req, null, "missing input");
        }
    }
    else {
        res.redirect("/");
        logger.writeToFile("info", logger.getFormattedMessage({
            user: req.session.user, post: req.originalUrl, redirect: "/",
            context: "delete user in DB -> " + req.body.userid, info: "permission denied"
        }));
    }
});

router.post("/delete-user", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        if (vfv.verify_userid(req.body.userid)) {
            req.body.userid = vfv.get_real_userid(req.body.userid);
            db.query(sql.get_users_with_id(req.body.userid), (err, users) => {
                if (err) {
                    res.redirect("/users");
                    loggerLog(req, err, null);
                }
                else if (users[0] && vfv.verify_type(users[0].type)) {
                    if (users[0].type == "student") {
                        db.query(sql.delete_students_with_id(users[0].userid), (err, qRes) => {
                            if (err) {
                                req.session.errorMsg = "User deletion failed.";
                                res.redirect("/user/" + vfv.get_valid_userid(users[0].userid));
                                loggerLog(req, err, null);
                            }
                            else {
                                db.query(sql.delete_all_answer_papers_with_id(users[0].userid), (err, aRes) => {
                                    if (err) {
                                        res.redirect("/user/" + vfv.get_valid_userid(users[0].userid));
                                        loggerLog(req, err, null);
                                    }
                                    else {
                                        db.query(sql.delete_users_with_id(users[0].userid), (err, uRes) => {
                                            if (err) {
                                                res.redirect("/user/" + vfv.get_valid_userid(users[0].userid));
                                                loggerLog(req, err, null);
                                            }
                                            else {
                                                req.session.successMsg = "User deleted successfully.";
                                                res.redirect("/users");
                                                loggerLog(req, null, "deleted");
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                    else if (users[0].type == "teacher") {
                        db.query(sql.delete_teachers_with_id(users[0].userid), (err, qRes) => {
                            if (err) {
                                req.session.errorMsg = "User deletion failed."
                                res.redirect("/user/" + vfv.get_valid_userid(users[0].userid));
                                loggerLog(req, err, null);
                            }
                            else {
                                db.query(sql.delete_all_answer_papers_with_id(users[0].userid), (err, aRes) => {
                                    if (err) {
                                        res.redirect("/user/" + vfv.get_valid_userid(users[0].userid));
                                        loggerLog(req, err, null);
                                    }
                                    else {
                                        db.query(sql.delete_users_with_id(users[0].userid), (err, uRes) => {
                                            if (err) {
                                                res.redirect("/user/" + vfv.get_valid_userid(users[0].userid));
                                                loggerLog(req, err, null);
                                            }
                                            else {
                                                req.session.successMsg = "User deleted successfully."
                                                res.redirect("/users");
                                                loggerLog(req, null, "deleted");
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                }
                else {
                    res.redirect("/users");
                    loggerLog(req, null, "not found");
                }
            });
        }
        else {
            res.redirect("/users");
            loggerLog(req, null, "missing input");
        }
    }
    else {
        res.redirect("/");
        logger.writeToFile("info", logger.getFormattedMessage({
            user: req.session.user, post: req.originalUrl, redirect: "/",
            context: "delete user in DB -> " + req.body.userid, info: "permission denied"
        }));
    }
});

router.get("/question-papers", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher") {
        db.query(sql.get_teachers_with_id(req.session.user.userid), (err, teachers) => {
            if (err) {
                res.redirect("/");
                loggerLog(req, err, null);
            }
            else {
                db.query(sql.get_all_question_papers_with_course(teachers[0].course), (err, qPapers) => {
                    if (err) {
                        res.redirect("/");
                        loggerLog(req, err, null);
                    }
                    else {
                        res.render("list-question-papers", {
                            qPapers: qPapers
                        });
                        loggerLog(req, null, "sent");
                    }
                });
            }
        });
    }
    else {
        res.redirect("/");
        loggerLog(req, null, "permission denied");
    }
});

router.get("/question-paper/:Qname", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher") {
        if (vfv.verify_Qname(req.params.Qname)) {
            req.params.Qname = req.params.Qname.toLowerCase();
            db.query(sql.get_teachers_with_id(req.session.user.userid), (err, teachers) => {
                if (err) {
                    res.redirect("/");
                    loggerLog(req, err, null);
                }
                else if (teachers[0]) {
                    db.query(sql.get_question_papers_with_name(req.params.Qname), (err, qPapers) => {
                        if (err) {
                            res.redirect("/question-papers");
                            loggerLog(req, err, null);
                        }
                        else if (qPapers[0] && qPapers[0].course == teachers[0].course) {
                            db.query(sql.get_all_answer_papers_with_Qname(req.params.Qname), (err, aPapers) => {
                                if (err) {
                                    res.redirect("/question-papers");
                                    loggerLog(req, err, null);
                                }
                                else {
                                    const errorMsg = req.session.errorMsg;
                                    const successMsg = req.session.successMsg;
                                    req.session.errorMsg = req.session.successMsg = null;
                                    res.render("edit-question-paper", {
                                        qPaper: qPapers[0],
                                        aPapers: aPapers,
                                        errorMsg: errorMsg,
                                        successMsg: successMsg
                                    });
                                    loggerLog(req, null, "sent");
                                }
                            });
                        }
                        else {
                            res.redirect("/question-papers");
                            loggerLog(req, null, "not found");
                        }
                    });
                }
                else {
                    res.redirect("/");
                    loggerLog(req, null, "permission denied");
                }
            });
        }
        else {
            res.redirect("/question-papers");
            loggerLog(req, null, "invalid input");
        }
    }
    else {
        res.redirect("/");
        loggerLog(req, null, "permission denied");
    }
});

router.get("/add-question-paper", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher") {
        const errorMsg = req.session.errorMsg;
        const successMsg = req.session.successMsg;
        req.session.errorMsg = req.session.successMsg = null;
        res.render("add-question-paper", {
            rgx: rgxub,
            errorMsg: errorMsg,
            successMsg: successMsg
        });
        loggerLog(req, null, "sent");
    }
    else {
        res.redirect("/");
        loggerLog(req, null, "permission denied");
    }
});

const delete_file = (file) => {
    fs.unlink(file, (err) => {
        if (err) {
            logger.writeToFile("error", logger.getFormattedMessage({
                user: req.session.user, get: req.originalUrl, error: err
            }));
        }
    });
}

router.post("/add-question-paper", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher") {
        if (vfv.verify_Qname(req.body.Qname) && req.body.marks && req.body.marks >= 0 && req.body.marks <= 9999 && req.files && req.files.Qfile
            && req.files.Qfile.mimetype == "application/pdf" && parseInt(req.files.Qfile.size.toString()) < 3 * 1024 * 1024) {
            req.body.Qname = req.body.Qname.toLowerCase();
            db.query(sql.get_teachers_with_id(req.session.user.userid), (err, teachers) => {
                if (err) {
                    res.redirect("/add-question-papers");
                    delete_file(req.files.Qfile.tempFilePath);
                    loggerLog(req, err, null);
                }
                else {
                    db.query(sql.get_question_papers_with_name(req.body.Qname), (err, qPapers) => {
                        if (err) {
                            res.redirect("/add-question-paper");
                            delete_file(req.files.Qfile.tempFilePath);
                            loggerLog(req, err, null);
                        }
                        else if (!qPapers[0]) {
                            db.query(sql.insert_question_papers_table(req.body.Qname, teachers[0].course, req.body.marks), (err, qRes) => {
                                if (err) {
                                    res.redirect("/add-question-paper");
                                    delete_file(req.files.Qfile.tempFilePath);
                                    loggerLog(req, err, null);
                                }
                                else {
                                    req.files.Qfile.mv(global.__basedir + "/data/question-papers/" + req.body.Qname + ".pdf", (err) => {
                                        if (err) {
                                            res.redirect("/add-question-paper");
                                            delete_file(req.files.Qfile.tempFilePath);
                                            loggerLog(req, err, null);
                                        }
                                        else {
                                            req.session.successMsg = "Question Paper added successfully.";
                                            res.redirect("/question-paper/" + req.body.Qname);
                                            loggerLog(req, null, "submitted successfully");
                                        }
                                    });
                                }
                            });
                        }
                        else {
                            req.session.errorMsg = "Question Paper with the same name already exists."
                            res.redirect("/add-question-paper");
                            delete_file(req.files.Qfile.tempFilePath);
                            loggerLog(req, null, "already submitted");
                        }
                    });
                }
            });
        }
        else {
            res.redirect("/add-question-paper");
            delete_file(req.files.Qfile.tempFilePath);
            loggerLog(req, null, "invalid input");
        }
    }
    else {
        res.redirect("/");
        delete_file(req.files.Qfile.tempFilePath);
        loggerLog(req, null, "permission denied");
    }
});

router.post("/edit-question-paper", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher") {
        if (vfv.verify_Qname(req.body.Qname) && req.body.activate) {
            const active = req.body.activate == "true" ? true : false;
            db.query(sql.get_teachers_with_id(req.session.user.userid), (err, teachers) => {
                if (err) {
                    res.redirect("/");
                    loggerLog(req, err, null);
                }
                else if (teachers[0]) {
                    db.query(sql.get_question_papers_with_name(req.body.Qname), (err, qPapers) => {
                        if (err) {
                            res.redirect("/question-papers");
                            loggerLog(req, err, null);
                        }
                        else if (qPapers[0] && qPapers[0].course == teachers[0].course) {
                            db.query(sql.update_question_papers_table(qPapers[0].filename, active), (err, qRes) => {
                                if (err) {
                                    res.redirect("/question-paper/" + qPapers[0].filename);
                                    loggerLog(req, err, null);
                                }
                                if (active == true) {
                                    db.query(sql.update_all_question_papers_table_except(qPapers[0].filename, qPapers[0].course), (err, qRes) => {
                                        if (err) {
                                            res.redirect("/question-paper/" + qPapers[0].filename);
                                            loggerLog(req, err, null);
                                        }
                                        else {
                                            req.session.successMsg = "Question Paper activated successfully.";
                                            res.redirect("/question-paper/" + qPapers[0].filename);
                                            loggerLog(req, null, "updated");
                                        }
                                    });
                                }
                                else {
                                    req.session.successMsg = "Question Paper deactivated successfully.";
                                    res.redirect("/question-paper/" + qPapers[0].filename);
                                    loggerLog(req, null, "updated");
                                }
                            });
                        }
                        else {
                            res.redirect("/question-papers");
                            loggerLog(req, null, "not found");
                        }
                    });
                }
                else {
                    res.redirect("/");
                    loggerLog(req, null, "permission denied");
                }
            });
        }
        else {
            res.redirect("/question-paper/" + req.body.Qname);
            loggerLog(req, null, "invalid input");
        }
    }
    else {
        res.redirect("/");
        loggerLog(req, null, "permission denied");
    }
});

router.get("/answer-paper/:Aname", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher") {
        let Aname = req.params.Aname;
        const Qname = Aname.substring(0, Aname.indexOf("-ANS-"));
        let userid = Aname.substring(Aname.indexOf("-ANS-") + 5, Aname.length);
        if (vfv.verify_Qname(Qname) && vfv.verify_userid(userid)) {
            userid = vfv.get_real_userid(userid);
            Aname = Qname + "-ANS-" + userid;
            db.query(sql.get_answer_papers_with_Qname_id(Qname, userid), (err, aPapers) => {
                if (err) {
                    res.redirect("/question-paper/" + Qname);
                    loggerLog(req, err, null);
                }
                else if (aPapers[0]) {
                    const errorMsg = req.session.errorMsg;
                    const successMsg = req.session.successMsg;
                    req.session.errorMsg = req.session.successMsg = null;
                    res.render("edit-answer-paper", {
                        aPaper: aPapers[0],
                        errorMsg: errorMsg,
                        successMsg: successMsg
                    });
                    loggerLog(req, null, "sent");
                }
                else {
                    res.redirect("/question-paper/" + Qname);
                    loggerLog(req, null, "not found");
                }
            });
        }
        else {
            res.redirect("/");
            loggerLog(req, null, "invalid input");
        }
    }
    else {
        res.redirect("/");
        loggerLog(req, null, "permission denied");
    }
});

router.post("/edit-answer-paper", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher" && vfv.verify_Qname(req.body.Qname) && vfv.verify_userid(req.body.userid) && req.body.marks) {
        req.body.userid = vfv.get_real_userid(req.body.userid);
        req.body.marks = req.body.marks >= 0 && req.body.marks <= 9999 ? req.body.marks : null;
        db.query(sql.get_teachers_with_id(req.session.user.userid), (err, teachers) => {
            if (err) {
                res.redirect("/");
                loggerLog(req, err, null);
            }
            else if (teachers[0]) {
                db.query(sql.get_question_papers_with_name(req.body.Qname), (err, qPapers) => {
                    if (err) {
                        res.redirect("/answer-papers");
                        loggerLog(req, err, null);
                    }
                    else if (qPapers[0] && qPapers[0].course == teachers[0].course) {
                        db.query(sql.get_answer_papers_with_Qname_id(req.body.Qname, req.body.userid), (err, aPapers) => {
                            if (err) {
                                res.redirect("/answer-paper/" + req.body.Qname + "-ANS-" + vfv.get_valid_userid(req.body.userid));
                                loggerLog(req, err, null);
                            }
                            else if (aPapers[0]) {
                                db.query(sql.update_answer_papers_table(aPapers[0].question_filename, aPapers[0].userid, req.body.marks), (err, qRes) => {
                                    req.session.successMsg = "Marks set successfully.";
                                    res.redirect("/answer-paper/" + req.body.Qname + "-ANS-" + vfv.get_valid_userid(req.body.userid));
                                    if (err) loggerLog(req, err, null); else loggerLog(req, null, "updated");
                                });
                            }
                            else {
                                res.redirect("/question-paper/" + req.body.Qname);
                                loggerLog(req, null, "not found");
                            }
                        });
                    }
                    else {
                        res.redirect("/answer-papers");
                        loggerLog(req, null, "permission denied");
                    }
                });
            }
            else {
                res.redirect("/");
                loggerLog(req, null, "not found");
            }
        });
    }
    else {
        res.redirect("/");
        loggerLog(req, null, "permission denied");
    }
});

router.get("/students", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher") {
        db.query(sql.get_teachers_with_id(req.session.user.userid), (err, teachers) => {
            if (err) {
                res.redirect("/")
                loggerLog(req, err, null);
            }
            else {
                db.query(sql.get_all_students_with_course(teachers[0].course), (err, students) => {
                    if (err) {
                        res.redirect("/")
                        loggerLog(req, err, null);
                    }
                    else {
                        res.render("list-students", {
                            students: students
                        });
                        loggerLog(req, null, "sent");
                    }
                });
            }
        });
    }
    else {
        res.redirect("/");
        loggerLog(req, null, "permission denied");
    }
});

router.get("/exams", (req, res) => {
    if (req.session.user && req.session.user.type == "student") {
        db.query(sql.get_students_with_id(req.session.user.userid), (err, students) => {
            if (err) {
                res.redirect("/");
                loggerLog(req, err, null);
            }
            db.query(sql.get_question_papers_with_course_active(students[0].course), (err, qPapers) => {
                if (err) {
                    res.redirect("/");
                    loggerLog(req, err, null);
                }
                else if (qPapers[0]) {
                    db.query(sql.get_answer_papers_with_Qname_id(qPapers[0].filename, req.session.user.userid), (err, aPapers) => {
                        if (err) {
                            res.redirect("/");
                            loggerLog(req, err, null);
                        }
                        else {
                            const errorMsg = req.session.errorMsg;
                            const successMsg = req.session.successMsg;
                            req.session.errorMsg = req.session.successMsg = null;
                            res.render("list-exams", {
                                qPaper: qPapers[0],
                                aPaper: aPapers[0],
                                errorMsg: errorMsg,
                                successMsg: successMsg
                            });
                            loggerLog(req, null, "sent");
                        }
                    });
                }
                else {
                    res.render("list-exams", {
                        qPapers: null,
                        aPaper: null
                    });
                    loggerLog(req, null, "sent");
                }
            });
        });
    }
    else {
        res.redirect("/");
        loggerLog(req, null, "permission denied");
    }
});

router.post("/submit-exam", (req, res) => {
    if (req.session.user && req.session.user.type == "student") {
        if (vfv.verify_Qname(req.body.Qname) && req.files && req.files.Afile && req.files.Afile.mimetype == "application/pdf"
            && parseInt(req.files.Afile.size.toString()) < 10 * 1024 * 1024) {
            req.body.Qname = req.body.Qname.toLowerCase();
            db.query(sql.get_question_papers_with_name(req.body.Qname), (err, qPapers) => {
                if (err) {
                    res.redirect("/exams");
                    delete_file(req.files.Afile.tempFilePath);
                    loggerLog(req, err, null);
                }
                else if (qPapers[0] && qPapers[0].active === 1) {
                    db.query(sql.get_answer_papers_with_Qname_id(req.body.Qname, req.session.user.userid), (err, aPapers) => {
                        if (err) {
                            res.redirect("/exams");
                            delete_file(req.files.Afile.tempFilePath);
                            loggerLog(req, err, null);
                        }
                        else if (!aPapers[0]) {
                            db.query(sql.insert_answer_papers_table(req.body.Qname, req.session.user.userid), (err, qRes) => {
                                if (err) {
                                    res.redirect("/exams");
                                    delete_file(req.files.Afile.tempFilePath);
                                    loggerLog(req, err, null);
                                }
                                else {
                                    req.session.successMsg = "Answer Paper submitted successfully.";
                                    req.files.Afile.mv(global.__basedir + "/data/answer-papers/" + req.body.Qname + "-ANS-" + req.session.user.userid + ".pdf", (err) => {
                                        res.redirect("/exams");
                                        if (err) {
                                            delete_file(req.files.Afile.tempFilePath);
                                            loggerLog(req, err, null);
                                        }
                                        else {
                                            loggerLog(req, null, "submitted successfully");
                                        }
                                    });
                                }
                            });
                        }
                        else {
                            req.session.errorMsg = "Answer Paper already submitted.";
                            res.redirect("/exams");
                            delete_file(req.files.Afile.tempFilePath);
                            loggerLog(req, null, "already submitted");
                        }
                    });
                }
                else {
                    res.redirect("/exams");
                    delete_file(req.files.Afile.tempFilePath);
                    loggerLog(req, null, "not found");
                }
            });
        }
        else {
            res.redirect("/exams");
            delete_file(req.files.Afile.tempFilePath);
            loggerLog(req, null, "invalid input");
        }
    }
    else {
        res.redirect("/");
        delete_file(req.files.Afile.tempFilePath);
        loggerLog(req, null, "permission denied");
    }
});

router.get("/results", (req, res) => {
    if (req.session.user && req.session.user.type == "student") {
        db.query(sql.get_all_results_with_id(req.session.user.userid), (err, results) => {
            if (err) {
                redirect("/");
                loggerLog(req, err, null);
            }
            else {
                res.render("list-results", {
                    results: results
                });
                loggerLog(req, null, "sent");
            }
        });
    }
    else {
        res.redirect("/");
        loggerLog(req, null, "permission denied");
    }
});

router.get("/download/question-paper/:Qname", (req, res) => {
    if (req.session.user && vfv.verify_Qname(req.params.Qname)) {
        req.params.Qname = req.params.Qname.toLowerCase();
        db.query(sql.get_question_papers_with_name(req.params.Qname), (err, qPapers) => {
            if (err) {
                res.redirect("/");
                loggerLog(req, err, null);
            }
            else if (qPapers[0]) {
                res.download(global.__basedir + "/data/question-papers/" + req.params.Qname + ".pdf");
                loggerLog(req, null, "sent");
            }
            else {
                res.redirect("/");
                loggerLog(req, null, "not found");
            }
        });
    }
    else {
        res.redirect("/");
        loggerLog(req, null, "permission denied");
    }
});

const download_answer_paper = (req, res, Qname, userid, Aname) => {
    db.query(sql.get_answer_papers_with_Qname_id(Qname, userid), (err, aPapers) => {
        if (err) {
            res.redirect("/");
            loggerLog(req, err, null);
        }
        else if (aPapers[0]) {
            res.download(global.__basedir + "/data/answer-papers/" + Aname + ".pdf");
            loggerLog(req, null, "downloaded");
        }
        else {
            res.redirect("/");
            loggerLog(req, null, "not found");
        }
    });
}

router.get("/download/answer-paper/:Aname", (req, res) => {
    if (req.session.user) {
        let Aname = req.params.Aname;
        const Qname = Aname.substring(0, Aname.indexOf("-ANS-"));
        let userid = Aname.substring(Aname.indexOf("-ANS-") + 5, Aname.length);
        if (vfv.verify_Qname(Qname) && vfv.verify_userid(userid)) {
            userid = vfv.get_real_userid(userid);
            Aname = Qname + "-ANS-" + userid;
            if (req.session.user.type == "admin" || req.session.user.type == "teacher") {
                download_answer_paper(req, res, Qname, userid, Aname);
            }
            else if (req.session.user.type == "student" && req.session.user.userid == userid) {
                download_answer_paper(req, res, Qname, userid, Aname);
            }
            else {
                res.redirect("/");
                loggerLog(req, null, "permission denied");
            }
        }
        else {
            res.redirect("/");
            loggerLog(req, null, "invalid input");
        }
    }
    else {
        res.redirect("/");
        loggerLog(req, null, "permission denied");
    }
});

module.exports = router;

