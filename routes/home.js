// home page logic

// to use express for serving files
const express = require("express");
const router = express.Router();

// custom redirect handler
const redirecth = require(global.__basedir + "custom-modules/redirect-handler");
// custom send handler
const sendh = require(global.__basedir + "custom-modules/send-handler");
// custom files handler
const fileh = require(global.__basedir + "custom-modules/file-handler")

// database connection
const db = require(global.__basedir + "custom-modules/database");
// formatted sql querries
const sql = require(global.__basedir + "custom-modules/sql-commands");
// check validity of various input feilds
const vfv = require(global.__basedir + "custom-modules/verify-values");
// valid regex for the front end
let rgxub = require(global.__basedir + "custom-modules/regex-unbounded");

// url attributes from forms
router.use(express.json());
router.use(express.urlencoded({ extended: false }));

// handle file upload from forms
const fileUpload = require('express-fileupload');
router.use(fileUpload({
    useTempFiles: true,
    tempFileDir: global.__basedir + "data/temp"
}));


router.get("/", (req, res) => {
    if (req.session.user)
        sendh.page(req, res, "home", {
            userType: req.session.user.type
        });
    else redirecth.permission_denied(req, res, "login");
});

router.get("/forgot", (req, res) => {
    if (!req.session.user)
        sendh.page(req, res, "forgot", null);
    else
        redirecth.permission_denied(req, res, null);
});

router.get("/logout", (req, res) => {
    if (req.session.user)
        redirecth.logout_success(req, res, "login");
    else
        redirecth.permission_denied(req, res, null);
});

router.get("/profile", (req, res) => {
    if (req.session.user && req.session.user.type == "student") {
        db.query(sql.select_students_with_id, [req.session.user.userid], (err, students) => {
            if (err)
                redirecth.system_error(req, res, err, null);
            else
                sendh.page(req, res, "profile", {
                    student: students[0]
                });
        });
    }
    else if (req.session.user && req.session.user.type == "teacher") {
        db.query(sql.select_teachers_with_id, [req.session.user.userid], (err, teachers) => {
            if (err)
                redirecth.system_error(req, res, err, null);
            else
                sendh.page(req, res, "profile", {
                    teacher: teachers[0]
                });
        });
    }
    else redirecth.permission_denied(req, res, null);
});

router.get("/users", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        db.query(sql.select_all_users, (err, users) => {
            if (err)
                redirecth.system_error(req, res, err, null);
            else
                sendh.page(req, res, "list-users", {
                    users: users
                });
        });
    }
    else redirecth.permission_denied(req, res, null);
});

router.get("/user/:userid", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        if (vfv.verify_userid(req.params.userid)) {
            req.params.userid = vfv.get_real_userid(req.params.userid);
            db.query(sql.select_users_with_id, [req.params.userid], (err, users) => {
                if (err)
                    redirecth.system_error(req, res, err, "users");
                else if (users[0].type == "student") {
                    db.query(sql.select_students_with_id, [req.params.userid], (err, students) => {
                        if (err)
                            redirecth.system_error(req, res, err, "users");
                        else
                            sendh.page(req, res, "edit-user", {
                                user: users[0],
                                userInfo: students[0],
                                rgx: rgxub
                            });
                    });
                }
                else if (users[0].type == "teacher") {
                    db.query(sql.select_teachers_with_id, [req.params.userid], (err, teachers) => {
                        if (err)
                            redirecth.system_error(req, res, err, "users");
                        else
                            sendh.page(req, res, "edit-user", {
                                user: users[0],
                                userInfo: teachers[0],
                                rgx: rgxub
                            });
                    });
                }
                else redirecth.not_found(req, res, "users");
            });
        }
        else redirecth.invalid_input(req, res, "users");
    }
    else redirecth.permission_denied(req, res, null);
});

router.get("/add-user", (req, res) => {
    if (req.session.user && req.session.user.type == "admin")
        sendh.page(req, res, "add-user", {
            rgx: rgxub
        });
    else redirecth.permission_denied(req, res, null);
});

router.post("/add-user", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        req.body.active = req.body.active && req.body.active == "true" ? 1 : 0;
        if (!req.body.address) { req.body.address = " "; }
        if (vfv.verify_password(req.body.password) && vfv.verify_type(req.body.type) && vfv.verify_active(req.body.active)
            && vfv.verify_name(req.body.name) && vfv.verify_course(req.body.course) && vfv.verify_dob(req.body.dob)
            && vfv.verify_email(req.body.email) && vfv.verify_phone(req.body.phone) && vfv.verify_address(req.body.address)
        ) {
            req.body.course = req.body.course.toLowerCase();
            req.body.email = req.body.email.toLowerCase();
            db.query(sql.insert_users_table, [req.body.password, req.body.type, req.body.active], (err, uRes) => {
                if (err)
                    redirecth.system_error(req, res, err, "add-user");
                else if (req.body.type == "student") {
                    db.query(sql.insert_students_table, [uRes.insertId, req.body.name, req.body.course, req.body.dob, req.body.email, req.body.phone, req.body.address],
                        (err, sRes) => {
                            if (err)
                                redirecth.system_error(req, res, err, "add-user");
                            else
                                redirecth.user_added(req, res, uRes.insertId, "add-user");
                        });
                }
                else if (req.body.type == "teacher") {
                    db.query(sql.insert_teachers_table, [uRes.insertId, req.body.name, req.body.course, req.body.dob, req.body.email, req.body.phone, req.body.address],
                        (err, tRes) => {
                            if (err)
                                redirecth.system_error(req, res, err, "add-user");
                            else
                                redirecth.user_added(req, res, uRes.insertId, "add-user");
                        });
                }
                else redirecth.invalid_input(req, res, "add-user");
            });
        }
        else redirecth.permission_denied(req, res, "add-user");
    }
    else redirecth.permission_denied(req, res, null);
});

const show_updated_user = (req, res, err) => {
    if (err)
        redirecth.system_error(req, res, err, "user/" + vfv.get_valid_userid(req.body.userid));
    else
        redirecth.user_updated(req, res, "user/" + vfv.get_valid_userid(req.body.userid));
};

router.post("/edit-user", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        if (vfv.verify_userid(req.body.userid)) {
            req.body.userid = vfv.get_real_userid(req.body.userid);
            if (req.body.active) { req.body.active = req.body.active == "true" ? 1 : 0; }
            else if (req.body.active_) { req.body.active = 0; }
            if (!req.body.address && req.body.address_) { req.body.address = " "; }
            db.query(sql.select_users_with_id, [req.body.userid], (err, users) => {
                if (err)
                    redirecth.system_error(req, res, err, "users");
                else if (users[0] && vfv.verify_type(users[0].type)) {
                    if (vfv.verify_password(req.body.password)) {
                        db.query(sql.update_users_with_id("password"), [req.body.password, users[0].userid], (err, qRes) => {
                            show_updated_user(req, res, err);
                        });
                    }
                    else if (vfv.verify_active(req.body.active)) {
                        db.query(sql.update_users_with_id("active"), [req.body.active, users[0].userid], (err, qRes) => {
                            show_updated_user(req, res, err);
                        });
                    }
                    else if (vfv.verify_name(req.body.name)) {
                        if (users[0].type == "student") {
                            db.query(sql.update_students_with_id("name"), [req.body.name, users[0].userid], (err, qRes) => {
                                show_updated_user(req, res, err);
                            });
                        }
                        else if (users[0].type == "teacher") {
                            db.query(sql.update_teachers_with_id("name"), [req.body.name, users[0].userid], (err, qRes) => {
                                show_updated_user(req, res, err);
                            });
                        }
                    }
                    else if (vfv.verify_course(req.body.course)) {
                        req.body.course = req.body.course.toLowerCase();
                        if (users[0].type == "student") {
                            db.query(sql.update_students_with_id("course"), [req.body.course, users[0].userid], (err, qRes) => {
                                show_updated_user(req, res, err);
                            });
                        }
                        else if (users[0].type == "teacher") {
                            db.query(sql.update_teachers_with_id("course"), [req.body.course, users[0].userid], (err, qRes) => {
                                show_updated_user(req, res, err);
                            });
                        }
                    }
                    else if (vfv.verify_dob(req.body.dob)) {
                        if (users[0].type == "student") {
                            db.query(sql.update_students_with_id("dob"), [req.body.dob, users[0].userid], (err, qRes) => {
                                show_updated_user(req, res, err);
                            });
                        }
                        else if (users[0].type == "teacher") {
                            db.query(sql.update_teachers_with_id("dob"), [req.body.dob, users[0].userid], (err, qRes) => {
                                show_updated_user(req, res, err);
                            });
                        }
                    }
                    else if (vfv.verify_email(req.body.email)) {
                        req.body.email = req.body.email.toLowerCase();
                        if (users[0].type == "student") {
                            db.query(sql.update_students_with_id("email"), [req.body.email, users[0].userid], (err, qRes) => {
                                show_updated_user(req, res, err);
                            });
                        }
                        else if (users[0].type == "teacher") {
                            db.query(sql.update_teachers_with_id("email"), [req.body.email, users[0].userid], (err, qRes) => {
                                show_updated_user(req, res, err);
                            });
                        }
                    }
                    else if (vfv.verify_phone(req.body.phone)) {
                        if (users[0].type == "student") {
                            db.query(sql.update_students_with_id("phone"), [req.body.phone, users[0].userid], (err, qRes) => {
                                show_updated_user(req, res, err);
                            });
                        }
                        else if (users[0].type == "teacher") {
                            db.query(sql.update_teachers_with_id("phone"), [req.body.phone, users[0].userid], (err, qRes) => {
                                show_updated_user(req, res, err);
                            });
                        }
                    }
                    else if (vfv.verify_address(req.body.address)) {
                        if (users[0].type == "student") {
                            db.query(sql.update_students_with_id("address"), [req.body.address, users[0].userid], (err, qRes) => {
                                show_updated_user(req, res, err);
                            });
                        }
                        else if (users[0].type == "teacher") {
                            db.query(sql.update_teachers_with_id("address"), [req.body.address, users[0].userid], (err, qRes) => {
                                show_updated_user(req, res, err);
                            });
                        }
                    }
                    else if (vfv.verify_type(req.body.type)) {
                        db.query(sql.update_users_with_id("type"), [req.body.type, users[0].userid], (err, qRes) => {
                            if (err)
                                redirecth.system_error(req, res, err, "user/" + vfv.get_valid_userid(req.body.userid));
                            else if (users[0].type != req.body.type && users[0].type == "student") {
                                db.query(sql.select_students_with_id, [users[0].userid], (err, sRes) => {
                                    if (err)
                                        redirecth.system_error(req, res, err, "user/" + vfv.get_valid_userid(req.body.userid));
                                    else {
                                        db.query(sql.delete_students_with_id, [users[0].userid], (err, dRes) => {
                                            if (err)
                                                redirecth.system_error(req, res, err, "user/" + vfv.get_valid_userid(req.body.userid));
                                            else {
                                                db.query(sql.insert_teachers_table,
                                                    [users[0].userid, sRes[0].name, sRes[0].course, sRes[0].dob, sRes[0].email, sRes[0].phone, sRes[0].address],
                                                    (err, iRes) => {
                                                        show_updated_user(req, res, err);
                                                    });
                                            }
                                        });
                                    }
                                });
                            }
                            else if (users[0].type != req.body.type && users[0].type == "teacher") {
                                db.query(sql.select_teachers_with_id, [users[0].userid], (err, tRes) => {
                                    if (err)
                                        redirecth.system_error(req, res, err, "user/" + vfv.get_valid_userid(req.body.userid));
                                    else {
                                        db.query(sql.delete_teachers_with_id, [users[0].userid], (err, dRes) => {
                                            if (err)
                                                redirecth.system_error(req, res, err, "user/" + vfv.get_valid_userid(req.body.userid));
                                            else {
                                                db.query(sql.insert_students_table,
                                                    [users[0].userid, tRes[0].name, tRes[0].course, tRes[0].dob, tRes[0].email, tRes[0].phone, tRes[0].address],
                                                    (err, iRes) => {
                                                        show_updated_user(req, res, err);
                                                    });
                                            }
                                        });
                                    }
                                });
                            }
                            else
                                redirecth.with_fail(req, res, "unchanged user type, " + req.body.userid,
                                    "User is already of the specified type.", "user/" + vfv.get_valid_userid(req.body.userid));
                        });
                    }
                    else redirecth.invalid_input(req, res, "user/" + vfv.get_valid_userid(req.body.userid));
                }
                else redirecth.not_found(req, res, "users");
            });
        }
        else redirecth.invalid_input(req, res, "users");
    }
    else redirecth.permission_denied(req, res, null);
});

router.post("/delete-users", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        if (vfv.verify(req.body.userid)) {
            req.body.userid = vfv.get_real_userid(req.body.userid);
            db.query(sql.select_users_with_id, [req.body.userid], (err, users) => {
                if (err) {
                    global.errorMsg = "System Error.";
                    res.redirect(global.__baseurl + "/user/a");
                    logger.quickLog(req, err, null);
                }
                else if (users[0] && vfv.verify_type(users[0].type)) {
                    if (users[0].type == "student") {
                        db.query(sql.delete_students_with_id, [users[0].userid], (err, qRes) => {
                            if (err) {
                                global.errorMsg = "System Error.";
                                res.redirect(global.__baseurl + "/user/n" + vfv.get_valid_userid(users[0].userid));
                                logger.quickLog(req, err, null);
                            }
                            else {
                                db.query(sql.delete_all_answer_papers_with_id, [users[0].userid], (err, aRes) => {
                                    if (err) {
                                        global.errorMsg = "System Error.";
                                        res.redirect(global.__baseurl + "/user/i" + vfv.get_valid_userid(users[0].userid));
                                        logger.quickLog(req, err, null);
                                    }
                                    else {
                                        db.query(sql.delete_users_with_id, [users[0].userid], (err, uRes) => {
                                            if (err) {
                                                global.errorMsg = "System Error.";
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
                        db.query(sql.delete_teachers_with_id, [users[0].userid], (err, qRes) => {
                            if (err) {
                                global.errorMsg = "System Error.";
                                res.redirect(global.__baseurl + "/user/x" + vfv.get_valid_userid(users[0].userid));
                                logger.quickLog(req, err, null);
                            }
                            else {
                                db.query(sql.delete_all_answer_papers_with_id, [users[0].userid], (err, aRes) => {
                                    if (err) {
                                        global.errorMsg = "System Error.";
                                        res.redirect(global.__baseurl + "/user/n" + vfv.get_valid_userid(users[0].userid));
                                        logger.quickLog(req, err, null);
                                    }
                                    else {
                                        db.query(sql.delete_users_with_id, [users[0].userid], (err, uRes) => {
                                            if (err) {
                                                global.errorMsg = "System Error.";
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
        logger.quickLog(req, null, "permission denied");
    }
});

router.post("/delete-user", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        if (vfv.verify_userid(req.body.userid)) {
            req.body.userid = vfv.get_real_userid(req.body.userid);
            db.query(sql.select_users_with_id, [req.body.userid], (err, users) => {
                if (err)
                    redirecth.system_error(req, res, err, "users");
                else if (users[0] && vfv.verify_type(users[0].type)) {
                    if (users[0].type == "student") {
                        db.query(sql.delete_students_with_id, [users[0].userid], (err, qRes) => {
                            if (err)
                                redirecth.system_error(req, res, err, "user/" + vfv.get_valid_userid(req.body.userid));
                            else {
                                db.query(sql.select_all_answer_papers_with_id, [users[0].userid], (err, aPapers) => {
                                    if (err)
                                        redirecth.system_error(req, res, err, "user/" + vfv.get_valid_userid(req.body.userid));
                                    else {
                                        for (let i = 0; i < aPapers.length; i++) {
                                            fileh.delete_aPaper(aPapers[i].question_filename, aPapers[i].userid);
                                        }
                                        db.query(sql.delete_users_with_id, [users[0].userid], (err, uRes) => {
                                            if (err)
                                                redirecth.system_error(req, res, err, "user/" + vfv.get_valid_userid(req.body.userid));
                                            else
                                                redirecth.user_deleted(req, res, "users");
                                        });
                                    }
                                });
                            }
                        });
                    }
                    else if (users[0].type == "teacher") {
                        db.query(sql.delete_teachers_with_id, [users[0].userid], (err, qRes) => {
                            if (err)
                                redirecth.system_error(req, res, err, "user/" + vfv.get_valid_userid(req.body.userid));
                            else {
                                db.query(sql.select_all_answer_papers_with_id, [users[0].userid], (err, aPapers) => {
                                    if (err)
                                        redirecth.system_error(req, res, err, "user/" + vfv.get_valid_userid(req.body.userid));
                                    else {
                                        for (let i = 0; i < aPapers.length; i++) {
                                            fileh.delete_aPaper(aPapers[i].question_filename, aPapers[i].userid);
                                        }
                                        db.query(sql.delete_users_with_id, [users[0].userid], (err, uRes) => {
                                            if (err)
                                                redirecth.system_error(req, res, err, "user/" + vfv.get_valid_userid(req.body.userid));
                                            else
                                                redirecth.user_deleted(req, res, "users");
                                        });
                                    }
                                });
                            }
                        });
                    }
                }
                else redirecth.not_found(req, res, "users");
            });
        }
        else redirecth.invalid_input(req, res, "users");
    }
    else redirecth.permission_denied(req, res, null);
});

router.get("/question-papers", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher") {
        db.query(sql.select_teachers_with_id, [req.session.user.userid], (err, teachers) => {
            if (err)
                redirecth.system_error(req, res, err, null);
            else {
                db.query(sql.select_all_question_papers_with_course, [teachers[0].course], (err, qPapers) => {
                    if (err)
                        redirecth.system_error(req, res, err, null);
                    else
                        sendh.page(req, res, "list-question-papers", {
                            qPapers: qPapers
                        });
                });
            }
        });
    }
    else redirecth.permission_denied(req, res, null);
});

router.get("/question-paper/:Qname", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher") {
        if (vfv.verify_Qname(req.params.Qname)) {
            req.params.Qname = req.params.Qname.toLowerCase();
            db.query(sql.select_teachers_with_id, [req.session.user.userid], (err, teachers) => {
                if (err)
                    redirecth.system_error(req, res, err, null);
                else if (teachers[0]) {
                    db.query(sql.select_question_papers_with_name, [req.params.Qname], (err, qPapers) => {
                        if (err)
                            redirecth.system_error(req, res, err, "question-papers");
                        else if (qPapers[0] && qPapers[0].course == teachers[0].course) {
                            db.query(sql.select_all_answer_papers_with_Qname, [req.params.Qname], (err, aPapers) => {
                                if (err)
                                    redirecth.system_error(req, res, err, "question-papers");
                                else
                                    sendh.page(req, res, "edit-question-paper", {
                                        qPaper: qPapers[0],
                                        aPapers: aPapers
                                    });
                            });
                        }
                        else redirecth.not_found(req, res, "question-papers");
                    });
                }
                else redirecth.permission_denied(req, res, null);
            });
        }
        else redirecth.invalid_input(req, res, "question-papers");
    }
    else redirecth.permission_denied(req, res, null);
});

router.get("/add-question-paper", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher")
        sendh.page(req, res, "add-question-paper", {
            rgx: rgxub
        });
    else redirecth.permission_denied(req, res, null);
});

router.post("/add-question-paper", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher") {
        if (vfv.verify_Qname(req.body.Qname) && req.body.marks && req.body.marks >= 0 && req.body.marks <= 9999 && req.files && req.files.Qfile
            && req.files.Qfile.mimetype == "application/pdf" && parseInt(req.files.Qfile.size.toString()) < 3 * 1024 * 1024) {
            req.body.Qname = req.body.Qname.toLowerCase();
            db.query(sql.select_teachers_with_id, [req.session.user.userid], (err, teachers) => {
                if (err)
                    redirecth.system_error(req, res, err, "add-question-paper");
                else {
                    db.query(sql.select_question_papers_with_name, [req.body.Qname], (err, qPapers) => {
                        if (err)
                            redirecth.system_error(req, res, err, "add-question-paper");
                        else if (!qPapers[0]) {
                            db.query(sql.insert_question_papers_table, [req.body.Qname, teachers[0].course, req.body.marks], (err, qRes) => {
                                if (err)
                                    redirecth.system_error(req, res, err, "add-question-paper");
                                else {
                                    req.files.Qfile.mv(global.__basedir + "data/question-papers/" + req.body.Qname + ".pdf", (err) => {
                                        if (err)
                                            redirecth.system_error(req, res, err, "add-question-paper");
                                        else
                                            redirecth.with_success(req, res, "question paper added, " + req.body.Qname,
                                                "Question Paper [" + req.body.Qname + "] added successfully.", "add-question-paper");
                                    });
                                }
                            });
                        }
                        else
                            redirecth.with_fail(req, res, "question paper name not unique",
                                "Question Paper name must be unique.", "add-question-paper");
                    });
                }
            });
        }
        else redirecth.invalid_input(req, res, "add-question-paper");
    }
    else redirecth.permission_denied(req, res, null);
});

router.post("/edit-question-paper", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher") {
        if (vfv.verify_Qname(req.body.Qname) && req.body.activate) {
            const active = req.body.activate == "true" ? 1 : 0;
            db.query(sql.select_teachers_with_id, [req.session.user.userid], (err, teachers) => {
                if (err)
                    redirecth.system_error(req, res, err, null);
                else if (teachers[0]) {
                    db.query(sql.select_question_papers_with_name, [req.body.Qname], (err, qPapers) => {
                        if (err)
                            redirecth.system_error(req, res, err, "question-papers");
                        else if (qPapers[0] && qPapers[0].course == teachers[0].course) {
                            db.query(sql.update_question_papers_with_name, [active, qPapers[0].filename], (err, qRes) => {
                                if (err)
                                    redirecth.system_error(req, res, err, "question-paper/" + req.body.Qname);
                                if (active == true) {
                                    db.query(sql.update_all_question_papers_in_course_except_name, [qPapers[0].course, qPapers[0].filename], (err, qRes) => {
                                        if (err)
                                            redirecth.system_error(req, res, err, "question-paper/" + req.body.Qname);
                                        else
                                            redirecth.with_success(req, res, "question paper activated, " + req.body.Qname,
                                                "Question Paper activated successfully.", "question-paper/" + req.body.Qname);
                                    });
                                }
                                else
                                    redirecth.with_success(req, res, "question paper activated, " + req.body.Qname,
                                        "Question Paper activated successfully.", "question-paper/" + req.body.Qname);
                            });
                        }
                        else
                            redirecth.not_found(req, res, "question-paper/" + req.body.Qname);
                    });
                }
                else redirecth.permission_denied(req, res, null);
            });
        }
        else redirecth.invalid_input(req, res, "question-paper/" + req.body.Qname);
    }
    else redirecth.permission_denied(req, res, null);
});

router.get("/answer-paper/:Aname", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher") {
        let Aname = req.params.Aname;
        const Qname = Aname.slice(0, Aname.indexOf("-ANS-"));
        let userid = Aname.slice(Aname.indexOf("-ANS-") + 5);
        if (vfv.verify_Qname(Qname) && vfv.verify_userid(userid)) {
            userid = vfv.get_real_userid(userid);
            Aname = Qname + "-ANS-" + userid;
            db.query(sql.select_answer_papers_with_Qname_id, [Qname, userid], (err, aPapers) => {
                if (err)
                    redirecth.system_error(req, res, err, "answer-papers");
                else if (aPapers[0])
                    sendh.page(req, res, "edit-answer-paper", {
                        aPaper: aPapers[0]
                    });
                else redirecth.not_found(req, res, "question-paper/" + Qname);
            });
        }
        else redirecth.invalid_input(req, res, "question-paper/" + Qname);
    }
    else redirecth.permission_denied(req, res, null);
});

router.post("/edit-answer-paper", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher" && vfv.verify_Qname(req.body.Qname) && vfv.verify_userid(req.body.userid) && req.body.marks) {
        req.body.userid = vfv.get_real_userid(req.body.userid);
        req.body.marks = req.body.marks >= 0 && req.body.marks <= 9999 ? req.body.marks : null;
        db.query(sql.select_teachers_with_id, [req.session.user.userid], (err, teachers) => {
            if (err)
                redirecth.system_error(req, res, err, "answer-papers");
            else if (teachers[0]) {
                db.query(sql.select_question_papers_with_name, [req.body.Qname], (err, qPapers) => {
                    if (err)
                        redirecth.system_error(req, res, err, "answer-papers");
                    else if (qPapers[0] && qPapers[0].course == teachers[0].course) {
                        db.query(sql.select_answer_papers_with_Qname_id, [req.body.Qname, req.body.userid], (err, aPapers) => {
                            if (err)
                                redirecth.system_error(req, res, err, "answer-paper/" + req.body.Qname + "-ANS-" + vfv.get_valid_userid(req.body.userid));
                            else if (aPapers[0]) {
                                db.query(sql.update_answer_papers_table, [req.body.marks, aPapers[0].question_filename, aPapers[0].userid], (err, qRes) => {
                                    if (err)
                                        redirecth.system_error(req, res, err, "answer-paper/" + req.body.Qname + "-ANS-" + vfv.get_valid_userid(req.body.userid));
                                    else
                                        redirecth.with_success(req, res, "answer paper marked, " + req.body.Qname + ", " + req.body.userid,
                                            "Answer Paper marked successfully.", "answer-paper/" + req.body.Qname + "-ANS-" + vfv.get_valid_userid(req.body.userid));
                                });
                            }
                            else redirecth.not_found(req, res, "question-paper/" + req.body.Qname);
                        });
                    }
                    else redirecth.permission_denied(req, res, "question-paper/" + req.body.Qname);
                });
            }
            else redirecth.not_found(req, res, null);
        });
    }
    else redirecth.permission_denied(req, res, null);
});

router.get("/students", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher") {
        db.query(sql.select_teachers_with_id, [req.session.user.userid], (err, teachers) => {
            if (err)
                redirecth.system_error(req, res, err, null);
            else {
                db.query(sql.select_all_students_with_course, [teachers[0].course], (err, students) => {
                    if (err)
                        redirecth.system_error(req, res, err, null);
                    else
                        sendh.page(req, res, "list-students", {
                            students: students
                        });
                });
            }
        });
    }
    else redirecth.permission_denied(req, res, null);
});

router.get("/exams", (req, res) => {
    if (req.session.user && req.session.user.type == "student") {
        db.query(sql.select_students_with_id, [req.session.user.userid], (err, students) => {
            if (err)
                redirecth.system_error(req, res, err, null);
            db.query(sql.select_question_papers_with_course_active, [students[0].course], (err, qPapers) => {
                if (err)
                    redirecth.system_error(req, res, err, null);
                else if (qPapers[0]) {
                    db.query(sql.select_answer_papers_with_Qname_id, [qPapers[0].filename, req.session.user.userid], (err, aPapers) => {
                        if (err)
                            redirecth.system_error(req, res, err, null);
                        else
                            sendh.page(req, res, "list-exams", {
                                qPaper: qPapers[0],
                                aPaper: aPapers[0]
                            });
                    });
                }
                else
                    sendh.page(req, res, "list-exams", {
                        qPapers: null,
                        aPaper: null
                    });
            });
        });
    }
    else redirecth.permission_denied(req, res, null);
});

router.post("/submit-exam", (req, res) => {
    if (req.session.user && req.session.user.type == "student") {
        if (vfv.verify_Qname(req.body.Qname) && req.files && req.files.Afile && req.files.Afile.mimetype == "application/pdf"
            && parseInt(req.files.Afile.size.toString()) < 10 * 1024 * 1024) {
            req.body.Qname = req.body.Qname.toLowerCase();
            db.query(sql.select_question_papers_with_name, [req.body.Qname], (err, qPapers) => {
                if (err)
                    redirecth.system_error(req, res, err, "exams");
                else if (qPapers[0] && qPapers[0].active === 1) {
                    db.query(sql.select_answer_papers_with_Qname_id, [req.body.Qname, req.session.user.userid], (err, aPapers) => {
                        if (err)
                            redirecth.system_error(req, res, err, "exams");
                        else if (!aPapers[0]) {
                            db.query(sql.insert_answer_papers_table, [req.body.Qname, req.session.user.userid], (err, qRes) => {
                                if (err)
                                    redirecth.system_error(req, res, err, "exams");
                                else {
                                    req.files.Afile.mv(global.__basedir + "data/answer-papers/" + req.body.Qname + "-ANS-" + req.session.user.userid + ".pdf", (err) => {
                                        if (err)
                                            redirecth.system_error(req, res, err, "exams");
                                        else
                                            redirecth.with_success(req, res, "answer paper submitted, " + req.body.Qname + ", " + req.session.user.userid,
                                                "Answer Paper has been submitted successfully.", "exams");
                                    });
                                }
                            });
                        }
                        else 
                        redirecth.with_fail(req, res, "answer paper already submitted",
                                "Answer Paper already submitted. Please contact your teacher, if you want to re-submit", "exams");
                    });
                }
                else redirecth.not_found(req, res, "exams");
            });
        }
        else redirecth.not_found(req, res, "exams");
    }
    else redirecth.permission_denied(req, res, null);
});

router.get("/results", (req, res) => {
    if (req.session.user && req.session.user.type == "student") {
        db.query(sql.select_all_results_with_id, [req.session.user.userid], (err, results) => {
            if (err)
                redirecth.system_error(req, res, err, null);
            else
                sendh.page(req, res, "list-results", {
                    results: results
                });
        });
    }
    else redirecth.permission_denied(req, res, null);
});

module.exports = router;
