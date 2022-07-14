// home page logic

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

// handle file upload from forms
const fileUpload = require('express-fileupload');
router.use(fileUpload({
    useTempFiles: true,
    tempFileDir: global.__basedir + "/data/temp"
}));

// delete data files
const delfile = require(global.__basedir + "/custom-modules/file-deletion")

// url attributes from forms
router.use(express.json());
router.use(express.urlencoded({ extended: false }));


router.get("/", (req, res) => {
    if (req.session.user) {
        res.render("home", {
            userType: req.session.user.type,
            errorMsg: global.errorMsg,
            successMsg: global.successMsg
        });
        global.errorMsg = global.successMsg = null;
        logger.quickLog(req, null, "sent");
    }
    else {
        res.redirect(global.__baseurl + "/login");
        logger.quickLog(req, null, "permission denied");
    }
});

router.get("/forgot", (req, res) => {
    if (!req.session.user) {
        res.render("forgot");
        logger.quickLog(req, null, "sent");
    }
    else {
        res.redirect(global.__baseurl + "/");
        logger.quickLog(req, null, "permission denied");
    }
});

router.get("/logout", (req, res) => {
    if (req.session.user) {
        req.session.destroy();
        global.successMsg = "Log out successful.";
        res.redirect(global.__baseurl + "/login");
        logger.quickLog(req, null, "sent");
    }
    else {
        res.redirect(global.__baseurl + "/login");
        logger.quickLog(req, null, "permission denied");
    }
});

router.get("/profile", (req, res) => {
    if (req.session.user && req.session.user.type == "student") {
        db.query(sql.get_students_with_id(req.session.user.userid), (err, students) => {
            if (err) {
                res.redirect(global.__baseurl + "/");
                logger.quickLog(req, err, null);
            }
            else {
                res.render("profile", {
                    student: students[0],
                });
                logger.quickLog(req, null, "sent");
            }
        });
    }
    else if (req.session.user && req.session.user.type == "teacher") {
        db.query(sql.get_teachers_with_id(req.session.user.userid), (err, teachers) => {
            if (err) {
                res.redirect(global.__baseurl + "/");
                logger.quickLog(req, err, null);
            }
            else {
                res.render("profile", {
                    teacher: teachers[0],
                });
                logger.quickLog(req, null, "sent");
            }
        });
    }
    else {
        res.redirect(global.__baseurl + "/");
        logger.quickLog(req, null, "permission denied");
    }
});

router.get("/users", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        db.query(sql.get_all_users, (err, users) => {
            if (err) {
                res.redirect(global.__baseurl + "/");
                logger.quickLog(req, err, null);
            }
            else {
                res.render("list-users", {
                    users: users,
                    errorMsg: global.errorMsg,
                    successMsg: global.successMsg
                });
                global.errorMsg = global.successMsg = null;
                logger.quickLog(req, null, "sent");
            }
        });
    }
    else {
        res.redirect(global.__baseurl + "/");
        logger.quickLog(req, null, "permission denied");
    }
});

router.get("/user/:userid", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        if (vfv.verify_userid(req.params.userid)) {
            req.params.userid = vfv.get_real_userid(req.params.userid);
            db.query(sql.get_users_with_id(req.params.userid), (err, users) => {
                if (err) {
                    res.redirect(global.__baseurl + "/users");
                    logger.quickLog(req, err, null);
                }
                else if (users[0].type == "student") {
                    db.query(sql.get_students_with_id(req.params.userid), (err, students) => {
                        if (err) {
                            res.redirect(global.__baseurl + "/users");
                            logger.quickLog(req, err, null);
                        }
                        else {
                            res.render("edit-user", {
                                user: users[0],
                                userInfo: students[0],
                                rgx: rgxub,
                                errorMsg: global.errorMsg,
                                successMsg: global.successMsg
                            });
                            global.errorMsg = global.successMsg = null;
                            logger.quickLog(req, null, "sent");
                        }
                    });
                }
                else if (users[0].type == "teacher") {
                    db.query(sql.get_teachers_with_id(req.params.userid), (err, teachers) => {
                        if (err) {
                            res.redirect(global.__baseurl + "/users");
                            logger.quickLog(req, err, null);
                        }
                        else {
                            res.render("edit-user", {
                                user: users[0],
                                userInfo: teachers[0],
                                rgx: rgxub,
                                errorMsg: global.errorMsg,
                                successMsg: global.successMsg
                            });
                            global.errorMsg = global.successMsg = null;
                            logger.quickLog(req, null, "sent");
                        }
                    });
                }
                else {
                    res.redirect(global.__baseurl + "/users");
                    logger.quickLog(req, null, "not found");
                }
            });
        }
        else {
            res.redirect(global.__baseurl + "/users");
            logger.quickLog(req, null, "invalid input");
        }
    }
    else {
        res.redirect(global.__baseurl + "/");
        logger.quickLog(req, null, "permission denied");
    }
});

router.get("/add-user", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        res.render("add-user", {
            rgx: rgxub
        });
        logger.quickLog(req, null, "sent");
    }
    else {
        res.redirect(global.__baseurl + "/");
        logger.quickLog(req, null, "permission denied");
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
            db.query(sql.insert_users_table(req.body.password, req.body.type, req.body.active), (err, uRes) => {
                if (err) {
                    res.redirect(global.__baseurl + "/add-user");
                    logger.quickLog(req, err, null);
                }
                else if (req.body.type == "student") {
                    db.query(sql.insert_students_table(uRes.insertId, req.body.name, req.body.course, req.body.dob, req.body.email, req.body.phone, req.body.address),
                        (err, sRes) => {
                            if (err) {
                                res.redirect(global.__baseurl + "/add-user");
                                logger.quickLog(req, err, null);
                            }
                            else {
                                global.successMsg = "User added successfully.";
                                res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(uRes.insertId));
                                logger.quickLog(req, null, "submitted successfully");
                            }
                        });
                }
                else if (req.body.type == "teacher") {
                    db.query(sql.insert_teachers_table(uRes.insertId, req.body.name, req.body.course, req.body.dob, req.body.email, req.body.phone, req.body.address),
                        (err, tRes) => {
                            if (err) {
                                res.redirect(global.__baseurl + "/add-user");
                                logger.quickLog(req, err, null);
                            }
                            else {
                                global.successMsg = "User added successfully.";
                                res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(uRes.insertId));
                                logger.quickLog(req, null, "submitted successfully");
                            }
                        });
                }
            });
        }
        else {
            res.redirect(global.__baseurl + "/add-user");
            logger.quickLog(req, null, "invalid input");
        }
    }
    else {
        res.redirect(global.__baseurl + "/");
        logger.quickLog(req, null, "permission denied");
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
                    res.redirect(global.__baseurl + "/users");
                    logger.quickLog(req, err, null);
                }
                else if (users[0] && vfv.verify_type(users[0].type)) {
                    if (vfv.verify_password(req.body.password)) {
                        db.query(sql.update_users_with_id(users[0].userid, req.body.password, null, null), (err, qRes) => {
                            res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(users[0].userid));
                            if (err) logger.quickLog(req, err, null); else logger.quickLog(req, null, "updated");
                        });
                    }
                    else if (vfv.verify_active(req.body.active)) {
                        db.query(sql.update_users_with_id(users[0].userid, null, null, req.body.active), (err, qRes) => {
                            res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(users[0].userid));
                            if (err) logger.quickLog(req, err, null); else logger.quickLog(req, null, "updated");
                        });
                    }
                    else if (vfv.verify_name(req.body.name)) {
                        if (users[0].type == "student") {
                            db.query(sql.update_students_with_id(users[0].userid, req.body.name, null, null, null, null, null), (err, qRes) => {
                                res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(users[0].userid));
                                if (err) logger.quickLog(req, err, null); else logger.quickLog(req, null, "updated");
                            });
                        }
                        else if (users[0].type == "teacher") {
                            db.query(sql.update_teachers_with_id(users[0].userid, req.body.name, null, null, null, null, null), (err, qRes) => {
                                res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(users[0].userid));
                                if (err) logger.quickLog(req, err, null); else logger.quickLog(req, null, "updated");
                            });
                        }
                    }
                    else if (vfv.verify_course(req.body.course)) {
                        req.body.course = req.body.course.toLowerCase();
                        if (users[0].type == "student") {
                            db.query(sql.update_students_with_id(users[0].userid, null, req.body.course, null, null, null, null), (err, qRes) => {
                                res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(users[0].userid));
                                if (err) logger.quickLog(req, err, null); else logger.quickLog(req, null, "updated");
                            });
                        }
                        else if (users[0].type == "teacher") {
                            db.query(sql.update_teachers_with_id(users[0].userid, null, req.body.course, null, null, null, null), (err, qRes) => {
                                res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(users[0].userid));
                                if (err) logger.quickLog(req, err, null); else logger.quickLog(req, null, "updated");
                            });
                        }
                    }
                    else if (vfv.verify_dob(req.body.dob)) {
                        if (users[0].type == "student") {
                            db.query(sql.update_students_with_id(users[0].userid, null, null, req.body.dob, null, null, null), (err, qRes) => {
                                res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(users[0].userid));
                                if (err) logger.quickLog(req, err, null); else logger.quickLog(req, null, "updated");
                            });
                        }
                        else if (users[0].type == "teacher") {
                            db.query(sql.update_teachers_with_id(users[0].userid, null, null, req.body.dob, null, null, null), (err, qRes) => {
                                res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(users[0].userid));
                                if (err) logger.quickLog(req, err, null); else logger.quickLog(req, null, "updated");
                            });
                        }
                    }
                    else if (vfv.verify_email(req.body.email)) {
                        req.body.email = req.body.email.toLowerCase();
                        if (users[0].type == "student") {
                            db.query(sql.update_students_with_id(users[0].userid, null, null, null, req.body.email, null, null), (err, qRes) => {
                                res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(users[0].userid));
                                if (err) logger.quickLog(req, err, null); else logger.quickLog(req, null, "updated");
                            });
                        }
                        else if (users[0].type == "teacher") {
                            db.query(sql.update_teachers_with_id(users[0].userid, null, null, null, req.body.email, null, null), (err, qRes) => {
                                res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(users[0].userid));
                                if (err) logger.quickLog(req, err, null); else logger.quickLog(req, null, "updated");
                            });
                        }
                    }
                    else if (vfv.verify_phone(req.body.phone)) {
                        if (users[0].type == "student") {
                            db.query(sql.update_students_with_id(users[0].userid, null, null, null, null, req.body.phone, null), (err, qRes) => {
                                res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(users[0].userid));
                                if (err) logger.quickLog(req, err, null); else logger.quickLog(req, null, "updated");
                            });
                        }
                        else if (users[0].type == "teacher") {
                            db.query(sql.update_teachers_with_id(users[0].userid, null, null, null, null, req.body.phone, null), (err, qRes) => {
                                res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(users[0].userid));
                                if (err) logger.quickLog(req, err, null); else logger.quickLog(req, null, "updated");
                            });
                        }
                    }
                    else if (vfv.verify_address(req.body.address)) {
                        if (users[0].type == "student") {
                            db.query(sql.update_students_with_id(users[0].userid, null, null, null, null, null, req.body.address), (err, qRes) => {
                                res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(users[0].userid));
                                if (err) logger.quickLog(req, err, null); else logger.quickLog(req, null, "updated");
                            });
                        }
                        else if (users[0].type == "teacher") {
                            db.query(sql.update_teachers_with_id(users[0].userid, null, null, null, null, null, req.body.address), (err, qRes) => {
                                res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(users[0].userid));
                                if (err) logger.quickLog(req, err, null); else logger.quickLog(req, null, "updated");
                            });
                        }
                    }
                    else if (vfv.verify_type(req.body.type)) {
                        db.query(sql.update_users_with_id(users[0].userid, null, req.body.type, null), (err, qRes) => {
                            if (err) {
                                res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(users[0].userid));
                                logger.quickLog(req, err, null);
                            }
                            else if (users[0].type != req.body.type && users[0].type == "student") {
                                db.query(sql.get_students_with_id(users[0].userid), (err, sRes) => {
                                    if (err) {
                                        res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(users[0].userid));
                                        logger.quickLog(req, err, null);
                                    }
                                    else {
                                        db.query(sql.delete_students_with_id(users[0].userid), (err, dRes) => {
                                            if (err) {
                                                res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(users[0].userid));
                                                logger.quickLog(req, err, null);
                                            }
                                            else {
                                                db.query(sql.insert_teachers_table(
                                                    users[0].userid, sRes[0].name, sRes[0].course, sRes[0].dob, sRes[0].email, sRes[0].phone, sRes[0].address), (err, iRes) => {
                                                        res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(users[0].userid));
                                                        if (err) logger.quickLog(req, err, null); else logger.quickLog(req, null, "updated");
                                                    });
                                            }
                                        });
                                    }
                                });
                            }
                            else if (users[0].type != req.body.type && users[0].type == "teacher") {
                                db.query(sql.get_teachers_with_id(users[0].userid), (err, tRes) => {
                                    if (err) {
                                        res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(users[0].userid));
                                        logger.quickLog(req, err, null);
                                    }
                                    else {
                                        db.query(sql.delete_teachers_with_id(users[0].userid), (err, dRes) => {
                                            if (err) {
                                                res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(users[0].userid));
                                                logger.quickLog(req, err, null);
                                            }
                                            else {
                                                db.query(sql.insert_students_table(
                                                    users[0].userid, tRes[0].name, tRes[0].course, tRes[0].dob, tRes[0].email, tRes[0].phone, tRes[0].address), (err, iRes) => {
                                                        res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(users[0].userid));
                                                        if (err) logger.quickLog(req, err, null); else logger.quickLog(req, null, "updated");
                                                    });
                                            }
                                        });
                                    }
                                });
                            }
                            else {
                                res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(users[0].userid));
                                logger.quickLog(req, null, "already updated");
                            }
                        });
                    }
                    else {
                        res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(users[0].userid));
                        logger.quickLog(req, null, "invalid input");
                    }
                }
                else {
                    res.redirect(global.__baseurl + "/users");
                    logger.quickLog(req, null, "not found");
                }
            });
        }
        else {
            res.redirect(global.__baseurl + "/users");
            logger.quickLog(req, null, "missing input");
        }
    }
    else {
        res.redirect(global.__baseurl + "/");
        logger.quickLog(req, null, "permission denied");
    }
});

router.post("/delete-users", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        if (vfv.verify(req.body.userid)) {
            req.body.userid = vfv.get_real_userid(req.body.userid);
            db.query(sql.get_users_with_id(req.body.userid), (err, users) => {
                if (err) {
                    res.redirect(global.__baseurl + "/user/a");
                    logger.quickLog(req, err, null);
                }
                else if (users[0] && vfv.verify_type(users[0].type)) {
                    if (users[0].type == "student") {
                        db.query(sql.delete_students_with_id(users[0].userid), (err, qRes) => {
                            if (err) {
                                res.redirect(global.__baseurl + "/user/n" + vfv.get_valid_userid(users[0].userid));
                                logger.quickLog(req, err, null);
                            }
                            else {
                                db.query(sql.delete_all_answer_papers_with_id(users[0].userid), (err, aRes) => {
                                    if (err) {
                                        res.redirect(global.__baseurl + "/user/i" + vfv.get_valid_userid(users[0].userid));
                                        logger.quickLog(req, err, null);
                                    }
                                    else {
                                        db.query(sql.delete_users_with_id(users[0].userid), (err, uRes) => {
                                            if (err) {
                                                res.redirect(global.__baseurl + "/user/m" + vfv.get_valid_userid(users[0].userid));
                                                logger.quickLog(req, err, null);
                                            }
                                            else {
                                                res.redirect(global.__baseurl + "/user/a");
                                                logger.quickLog(req, null, "deleted");
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
                                res.redirect(global.__baseurl + "/user/x" + vfv.get_valid_userid(users[0].userid));
                                logger.quickLog(req, err, null);
                            }
                            else {
                                db.query(sql.delete_all_answer_papers_with_id(users[0].userid), (err, aRes) => {
                                    if (err) {
                                        res.redirect(global.__baseurl + "/user/n" + vfv.get_valid_userid(users[0].userid));
                                        logger.quickLog(req, err, null);
                                    }
                                    else {
                                        db.query(sql.delete_users_with_id(users[0].userid), (err, uRes) => {
                                            if (err) {
                                                res.redirect(global.__baseurl + "/user/i" + vfv.get_valid_userid(users[0].userid));
                                                logger.quickLog(req, err, null);
                                            }
                                            else {
                                                res.redirect(global.__baseurl + "/user/l");
                                                logger.quickLog(req, null, "deleted");
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                }
                else {
                    res.redirect(global.__baseurl + "/user/created");
                    logger.quickLog(req, null, "not found");
                }
            });
        }
        else {
            res.redirect(global.__baseurl + "/users");
            logger.quickLog(req, null, "missing input");
        }
    }
    else {
        res.redirect(global.__baseurl + "/");
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
                    res.redirect(global.__baseurl + "/users");
                    logger.quickLog(req, err, null);
                }
                else if (users[0] && vfv.verify_type(users[0].type)) {
                    if (users[0].type == "student") {
                        db.query(sql.delete_students_with_id(users[0].userid), (err, qRes) => {
                            if (err) {
                                global.errorMsg = "User deletion failed.";
                                res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(users[0].userid));
                                logger.quickLog(req, err, null);
                            }
                            else {
                                db.query(sql.get_all_answer_papers_with_id(users[0].userid), (err, aPapers) => {
                                    if (err) {
                                        res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(users[0].userid));
                                        logger.quickLog(req, err, null);
                                    }
                                    else {
                                        for (let i = 0; i < aPapers.length; i++) {
                                            delfile.delete_aPaper(aPapers[i].question_filename, aPapers[i].userid);
                                        }
                                        db.query(sql.delete_users_with_id(users[0].userid), (err, uRes) => {
                                            if (err) {
                                                res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(users[0].userid));
                                                logger.quickLog(req, err, null);
                                            }
                                            else {
                                                global.successMsg = "User and all associated Answer Papers deleted successfully."
                                                res.redirect(global.__baseurl + "/users");
                                                logger.quickLog(req, null, "deleted");
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
                                global.errorMsg = "User deletion failed."
                                res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(users[0].userid));
                                logger.quickLog(req, err, null);
                            }
                            else {
                                db.query(sql.get_all_answer_papers_with_id(users[0].userid), (err, aPapers) => {
                                    if (err) {
                                        res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(users[0].userid));
                                        logger.quickLog(req, err, null);
                                    }
                                    else {
                                        for (let i = 0; i < aPapers.length; i++) {
                                            delfile.delete_aPaper(aPapers[i].question_filename, aPapers[i].userid);
                                        }
                                        db.query(sql.delete_users_with_id(users[0].userid), (err, uRes) => {
                                            if (err) {
                                                res.redirect(global.__baseurl + "/user/" + vfv.get_valid_userid(users[0].userid));
                                                logger.quickLog(req, err, null);
                                            }
                                            else {
                                                global.successMsg = "User and all associated Answer Papers deleted successfully."
                                                res.redirect(global.__baseurl + "/users");
                                                logger.quickLog(req, null, "deleted");
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                }
                else {
                    res.redirect(global.__baseurl + "/users");
                    logger.quickLog(req, null, "not found");
                }
            });
        }
        else {
            res.redirect(global.__baseurl + "/users");
            logger.quickLog(req, null, "missing input");
        }
    }
    else {
        res.redirect(global.__baseurl + "/");
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
                res.redirect(global.__baseurl + "/");
                logger.quickLog(req, err, null);
            }
            else {
                db.query(sql.get_all_question_papers_with_course(teachers[0].course), (err, qPapers) => {
                    if (err) {
                        res.redirect(global.__baseurl + "/");
                        logger.quickLog(req, err, null);
                    }
                    else {
                        res.render("list-question-papers", {
                            qPapers: qPapers
                        });
                        logger.quickLog(req, null, "sent");
                    }
                });
            }
        });
    }
    else {
        res.redirect(global.__baseurl + "/");
        logger.quickLog(req, null, "permission denied");
    }
});

router.get("/question-paper/:Qname", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher") {
        if (vfv.verify_Qname(req.params.Qname)) {
            req.params.Qname = req.params.Qname.toLowerCase();
            db.query(sql.get_teachers_with_id(req.session.user.userid), (err, teachers) => {
                if (err) {
                    res.redirect(global.__baseurl + "/");
                    logger.quickLog(req, err, null);
                }
                else if (teachers[0]) {
                    db.query(sql.get_question_papers_with_name(req.params.Qname), (err, qPapers) => {
                        if (err) {
                            res.redirect(global.__baseurl + "/question-papers");
                            logger.quickLog(req, err, null);
                        }
                        else if (qPapers[0] && qPapers[0].course == teachers[0].course) {
                            db.query(sql.get_all_answer_papers_with_Qname(req.params.Qname), (err, aPapers) => {
                                if (err) {
                                    res.redirect(global.__baseurl + "/question-papers");
                                    logger.quickLog(req, err, null);
                                }
                                else {
                                    res.render("edit-question-paper", {
                                        qPaper: qPapers[0],
                                        aPapers: aPapers,
                                        errorMsg: global.errorMsg,
                                        successMsg: global.successMsg
                                    });
                                    global.errorMsg = global.successMsg = null;
                                    logger.quickLog(req, null, "sent");
                                }
                            });
                        }
                        else {
                            res.redirect(global.__baseurl + "/question-papers");
                            logger.quickLog(req, null, "not found");
                        }
                    });
                }
                else {
                    res.redirect(global.__baseurl + "/");
                    logger.quickLog(req, null, "permission denied");
                }
            });
        }
        else {
            res.redirect(global.__baseurl + "/question-papers");
            logger.quickLog(req, null, "invalid input");
        }
    }
    else {
        res.redirect(global.__baseurl + "/");
        logger.quickLog(req, null, "permission denied");
    }
});

router.get("/add-question-paper", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher") {
        res.render("add-question-paper", {
            rgx: rgxub,
            errorMsg: global.errorMsg,
            successMsg: global.successMsg
        });
        global.errorMsg = global.successMsg = null;
        logger.quickLog(req, null, "sent");
    }
    else {
        res.redirect(global.__baseurl + "/");
        logger.quickLog(req, null, "permission denied");
    }
});

router.post("/add-question-paper", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher") {
        if (vfv.verify_Qname(req.body.Qname) && req.body.marks && req.body.marks >= 0 && req.body.marks <= 9999 && req.files && req.files.Qfile
            && req.files.Qfile.mimetype == "application/pdf" && parseInt(req.files.Qfile.size.toString()) < 3 * 1024 * 1024) {
            req.body.Qname = req.body.Qname.toLowerCase();
            db.query(sql.get_teachers_with_id(req.session.user.userid), (err, teachers) => {
                if (err) {
                    res.redirect(global.__baseurl + "/add-question-papers");
                    logger.quickLog(req, err, null);
                }
                else {
                    db.query(sql.get_question_papers_with_name(req.body.Qname), (err, qPapers) => {
                        if (err) {
                            res.redirect(global.__baseurl + "/add-question-paper");
                            logger.quickLog(req, err, null);
                        }
                        else if (!qPapers[0]) {
                            db.query(sql.insert_question_papers_table(req.body.Qname, teachers[0].course, req.body.marks), (err, qRes) => {
                                if (err) {
                                    res.redirect(global.__baseurl + "/add-question-paper");
                                    logger.quickLog(req, err, null);
                                }
                                else {
                                    req.files.Qfile.mv(global.__basedir + "/data/question-papers/" + req.body.Qname + ".pdf", (err) => {
                                        if (err) {
                                            res.redirect(global.__baseurl + "/add-question-paper");
                                            logger.quickLog(req, err, null);
                                        }
                                        else {
                                            global.successMsg = "Question Paper added successfully.";
                                            res.redirect(global.__baseurl + "/question-paper/" + req.body.Qname);
                                            logger.quickLog(req, null, "submitted successfully");
                                        }
                                    });
                                }
                            });
                        }
                        else {
                            global.errorMsg = "Question Paper with the same name already exists."
                            res.redirect(global.__baseurl + "/add-question-paper");
                            logger.quickLog(req, null, "already submitted");
                        }
                    });
                }
            });
        }
        else {
            res.redirect(global.__baseurl + "/add-question-paper");
            logger.quickLog(req, null, "invalid input");
        }
    }
    else {
        res.redirect(global.__baseurl + "/");
        logger.quickLog(req, null, "permission denied");
    }
});

router.post("/edit-question-paper", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher") {
        if (vfv.verify_Qname(req.body.Qname) && req.body.activate) {
            const active = req.body.activate == "true" ? true : false;
            db.query(sql.get_teachers_with_id(req.session.user.userid), (err, teachers) => {
                if (err) {
                    res.redirect(global.__baseurl + "/");
                    logger.quickLog(req, err, null);
                }
                else if (teachers[0]) {
                    db.query(sql.get_question_papers_with_name(req.body.Qname), (err, qPapers) => {
                        if (err) {
                            res.redirect(global.__baseurl + "/question-papers");
                            logger.quickLog(req, err, null);
                        }
                        else if (qPapers[0] && qPapers[0].course == teachers[0].course) {
                            db.query(sql.update_question_papers_table(qPapers[0].filename, active), (err, qRes) => {
                                if (err) {
                                    res.redirect(global.__baseurl + "/question-paper/" + qPapers[0].filename);
                                    logger.quickLog(req, err, null);
                                }
                                if (active == true) {
                                    db.query(sql.update_all_question_papers_table_except(qPapers[0].filename, qPapers[0].course), (err, qRes) => {
                                        if (err) {
                                            res.redirect(global.__baseurl + "/question-paper/" + qPapers[0].filename);
                                            logger.quickLog(req, err, null);
                                        }
                                        else {
                                            global.successMsg = "Question Paper activated successfully.";
                                            res.redirect(global.__baseurl + "/question-paper/" + qPapers[0].filename);
                                            logger.quickLog(req, null, "updated");
                                        }
                                    });
                                }
                                else {
                                    global.successMsg = "Question Paper deactivated successfully.";
                                    res.redirect(global.__baseurl + "/question-paper/" + qPapers[0].filename);
                                    logger.quickLog(req, null, "updated");
                                }
                            });
                        }
                        else {
                            res.redirect(global.__baseurl + "/question-papers");
                            logger.quickLog(req, null, "not found");
                        }
                    });
                }
                else {
                    res.redirect(global.__baseurl + "/");
                    logger.quickLog(req, null, "permission denied");
                }
            });
        }
        else {
            res.redirect(global.__baseurl + "/question-paper/" + req.body.Qname);
            logger.quickLog(req, null, "invalid input");
        }
    }
    else {
        res.redirect(global.__baseurl + "/");
        logger.quickLog(req, null, "permission denied");
    }
});

router.get("/answer-paper/:Aname", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher") {
        let Aname = req.params.Aname;
        const Qname = Aname.slice(0, Aname.indexOf("-ANS-"));
        let userid = Aname.slice(Aname.indexOf("-ANS-") + 5);
        if (vfv.verify_Qname(Qname) && vfv.verify_userid(userid)) {
            userid = vfv.get_real_userid(userid);
            Aname = Qname + "-ANS-" + userid;
            db.query(sql.get_answer_papers_with_Qname_id(Qname, userid), (err, aPapers) => {
                if (err) {
                    res.redirect(global.__baseurl + "/question-paper/" + Qname);
                    logger.quickLog(req, err, null);
                }
                else if (aPapers[0]) {
                    res.render("edit-answer-paper", {
                        aPaper: aPapers[0],
                        errorMsg: global.errorMsg,
                        successMsg: global.successMsg
                    });
                    global.errorMsg = global.successMsg = null;
                    logger.quickLog(req, null, "sent");
                }
                else {
                    res.redirect(global.__baseurl + "/question-paper/" + Qname);
                    logger.quickLog(req, null, "not found");
                }
            });
        }
        else {
            res.redirect(global.__baseurl + "/");
            logger.quickLog(req, null, "invalid input");
        }
    }
    else {
        res.redirect(global.__baseurl + "/");
        logger.quickLog(req, null, "permission denied");
    }
});

router.post("/edit-answer-paper", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher" && vfv.verify_Qname(req.body.Qname) && vfv.verify_userid(req.body.userid) && req.body.marks) {
        req.body.userid = vfv.get_real_userid(req.body.userid);
        req.body.marks = req.body.marks >= 0 && req.body.marks <= 9999 ? req.body.marks : null;
        db.query(sql.get_teachers_with_id(req.session.user.userid), (err, teachers) => {
            if (err) {
                res.redirect(global.__baseurl + "/");
                logger.quickLog(req, err, null);
            }
            else if (teachers[0]) {
                db.query(sql.get_question_papers_with_name(req.body.Qname), (err, qPapers) => {
                    if (err) {
                        res.redirect(global.__baseurl + "/answer-papers");
                        logger.quickLog(req, err, null);
                    }
                    else if (qPapers[0] && qPapers[0].course == teachers[0].course) {
                        db.query(sql.get_answer_papers_with_Qname_id(req.body.Qname, req.body.userid), (err, aPapers) => {
                            if (err) {
                                res.redirect(global.__baseurl + "/answer-paper/" + req.body.Qname + "-ANS-" + vfv.get_valid_userid(req.body.userid));
                                logger.quickLog(req, err, null);
                            }
                            else if (aPapers[0]) {
                                db.query(sql.update_answer_papers_table(aPapers[0].question_filename, aPapers[0].userid, req.body.marks), (err, qRes) => {
                                    global.successMsg = "Marks set successfully.";
                                    res.redirect(global.__baseurl + "/answer-paper/" + req.body.Qname + "-ANS-" + vfv.get_valid_userid(req.body.userid));
                                    if (err) logger.quickLog(req, err, null); else logger.quickLog(req, null, "updated");
                                });
                            }
                            else {
                                res.redirect(global.__baseurl + "/question-paper/" + req.body.Qname);
                                logger.quickLog(req, null, "not found");
                            }
                        });
                    }
                    else {
                        res.redirect(global.__baseurl + "/answer-papers");
                        logger.quickLog(req, null, "permission denied");
                    }
                });
            }
            else {
                res.redirect(global.__baseurl + "/");
                logger.quickLog(req, null, "not found");
            }
        });
    }
    else {
        res.redirect(global.__baseurl + "/");
        logger.quickLog(req, null, "permission denied");
    }
});

router.get("/students", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher") {
        db.query(sql.get_teachers_with_id(req.session.user.userid), (err, teachers) => {
            if (err) {
                res.redirect(global.__baseurl + "/")
                logger.quickLog(req, err, null);
            }
            else {
                db.query(sql.get_all_students_with_course(teachers[0].course), (err, students) => {
                    if (err) {
                        res.redirect(global.__baseurl + "/")
                        logger.quickLog(req, err, null);
                    }
                    else {
                        res.render("list-students", {
                            students: students
                        });
                        logger.quickLog(req, null, "sent");
                    }
                });
            }
        });
    }
    else {
        res.redirect(global.__baseurl + "/");
        logger.quickLog(req, null, "permission denied");
    }
});

router.get("/exams", (req, res) => {
    if (req.session.user && req.session.user.type == "student") {
        db.query(sql.get_students_with_id(req.session.user.userid), (err, students) => {
            if (err) {
                res.redirect(global.__baseurl + "/");
                logger.quickLog(req, err, null);
            }
            db.query(sql.get_question_papers_with_course_active(students[0].course), (err, qPapers) => {
                if (err) {
                    res.redirect(global.__baseurl + "/");
                    logger.quickLog(req, err, null);
                }
                else if (qPapers[0]) {
                    db.query(sql.get_answer_papers_with_Qname_id(qPapers[0].filename, req.session.user.userid), (err, aPapers) => {
                        if (err) {
                            res.redirect(global.__baseurl + "/");
                            logger.quickLog(req, err, null);
                        }
                        else {
                            res.render("list-exams", {
                                qPaper: qPapers[0],
                                aPaper: aPapers[0],
                                errorMsg: global.errorMsg,
                                successMsg: global.successMsg
                            });
                            global.errorMsg = global.successMsg = null;
                            logger.quickLog(req, null, "sent");
                        }
                    });
                }
                else {
                    res.render("list-exams", {
                        qPapers: null,
                        aPaper: null
                    });
                    logger.quickLog(req, null, "sent");
                }
            });
        });
    }
    else {
        res.redirect(global.__baseurl + "/");
        logger.quickLog(req, null, "permission denied");
    }
});

router.post("/submit-exam", (req, res) => {
    if (req.session.user && req.session.user.type == "student") {
        if (vfv.verify_Qname(req.body.Qname) && req.files && req.files.Afile && req.files.Afile.mimetype == "application/pdf"
            && parseInt(req.files.Afile.size.toString()) < 10 * 1024 * 1024) {
            req.body.Qname = req.body.Qname.toLowerCase();
            db.query(sql.get_question_papers_with_name(req.body.Qname), (err, qPapers) => {
                if (err) {
                    res.redirect(global.__baseurl + "/exams");
                    logger.quickLog(req, err, null);
                }
                else if (qPapers[0] && qPapers[0].active === 1) {
                    db.query(sql.get_answer_papers_with_Qname_id(req.body.Qname, req.session.user.userid), (err, aPapers) => {
                        if (err) {
                            res.redirect(global.__baseurl + "/exams");
                            logger.quickLog(req, err, null);
                        }
                        else if (!aPapers[0]) {
                            db.query(sql.insert_answer_papers_table(req.body.Qname, req.session.user.userid), (err, qRes) => {
                                if (err) {
                                    res.redirect(global.__baseurl + "/exams");
                                    logger.quickLog(req, err, null);
                                }
                                else {
                                    global.successMsg = "Answer Paper submitted successfully.";
                                    req.files.Afile.mv(global.__basedir + "/data/answer-papers/" + req.body.Qname + "-ANS-" + req.session.user.userid + ".pdf", (err) => {
                                        res.redirect(global.__baseurl + "/exams");
                                        if (err) {
                                            logger.quickLog(req, err, null);
                                        }
                                        else {
                                            logger.quickLog(req, null, "submitted successfully");
                                        }
                                    });
                                }
                            });
                        }
                        else {
                            global.errorMsg = "Answer Paper already submitted.";
                            res.redirect(global.__baseurl + "/exams");
                            logger.quickLog(req, null, "already submitted");
                        }
                    });
                }
                else {
                    res.redirect(global.__baseurl + "/exams");
                    logger.quickLog(req, null, "not found");
                }
            });
        }
        else {
            res.redirect(global.__baseurl + "/exams");
            logger.quickLog(req, null, "invalid input");
        }
    }
    else {
        res.redirect(global.__baseurl + "/");
        // delete_file(req.files.Afile.tempFilePath);
        logger.quickLog(req, null, "permission denied");
    }
});

router.get("/results", (req, res) => {
    if (req.session.user && req.session.user.type == "student") {
        db.query(sql.get_all_results_with_id(req.session.user.userid), (err, results) => {
            if (err) {
                redirect(global.__baseurl + "/");
                logger.quickLog(req, err, null);
            }
            else {
                res.render("list-results", {
                    results: results
                });
                logger.quickLog(req, null, "sent");
            }
        });
    }
    else {
        res.redirect(global.__baseurl + "/");
        logger.quickLog(req, null, "permission denied");
    }
});

module.exports = router;

