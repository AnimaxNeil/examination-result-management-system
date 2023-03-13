// home page logic

// to use express for serving files 
const express = require("express");
const router = express.Router();
// custom redirect handler
const redirecth = require(global.base_dir + "custom-modules/redirect-handler");
// custom send handler
const sendh = require(global.base_dir + "custom-modules/send-handler");
// custom files handler
const fileh = require(global.base_dir + "custom-modules/file-handler");
// formatted sql querries
const sql = require(global.base_dir + "custom-modules/sql-commands");
// check validity of various input feilds
const vfv = require(global.base_dir + "custom-modules/verify-values");
// valid regex for the front end
let rgxub = require(global.base_dir + "custom-modules/regex-unbounded");

// url attributes from forms
router.use(express.json());
router.use(express.urlencoded({ extended: false }));

// handle file upload from forms
const fileUpload = require('express-fileupload');
router.use(fileUpload({
    useTempFiles: true,
    tempFileDir: global.base_dir + "data/temp"
}));

router.get("/", (req, res) => {
    if (req.session.user)
        sendh.page(req, res, "user-home", { userType: req.session.user.type });
    else redirecth.permission_denied(req, res, "login");
});

router.get("/home", (req, res) => {
    redirecth.no_msg(req, res, null);
});

router.get("/forgot", (req, res) => {
    if (!req.session.user)
        sendh.page(req, res, "forgot-login", null);
    else redirecth.permission_denied(req, res, null);
});

router.get("/logout", (req, res) => {
    if (req.session.user)
        redirecth.logout_success(req, res, "login");
    else redirecth.permission_denied(req, res, null);
});

router.get("/profile", (req, res) => {
    const db = req.app.get("db");
    if (req.session.user && req.session.user.type == "student") {
        const qry1 = db.query(sql.select_students_with_id, [req.session.user.userid]);
        qry1.then(([students]) => {
            if (students.length > 0 && students[0])
                sendh.page(req, res, "user-profile", { student: students[0] });
            else sendh.page(req, res, "user-profile", { student: null });
        }).catch(err => redirecth.system_error(req, res, err, null));
    }
    else if (req.session.user && req.session.user.type == "teacher") {
        const qry2 = db.query(sql.select_teachers_with_id, [req.session.user.userid]);
        qry2.then(([teachers]) => {
            if (teachers.length > 0 && teachers[0])
                sendh.page(req, res, "user-profile", { teacher: teachers[0] });
            else sendh.page(req, res, "user-profile", { teacher: null });
        }).catch(err => redirecth.system_error(req, res, err, null));
    }
    else redirecth.permission_denied(req, res, null);
});

router.get("/users", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        const db = req.app.get("db");
        const qry = db.query(sql.select_all_users);
        qry.then(([users]) => sendh.page(req, res, "list-users", { users: users }))
            .catch(err => redirecth.system_error(req, res, err, null));
    } else redirecth.permission_denied(req, res, null);
});

router.get("/user/:userid", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        if (vfv.verify_userid(req.params.userid)) {
            req.params.userid = vfv.get_real_userid(req.params.userid);
            let v_user;
            const db = req.app.get("db");
            const qry = db.query(sql.select_users_with_id, [req.params.userid]);
            qry.then(([users]) => {
                if (users.length > 0 && users[0]) {
                    v_user = users[0];
                    if (v_user.type == "student")
                        return db.query(sql.select_students_with_id, [req.params.userid]);
                    else if (v_user.type == "teacher")
                        return db.query(sql.select_teachers_with_id, [req.params.userid]);
                    else
                        sendh.page(req, res, "edit-user", {
                            user: v_user,
                            userInfo: null,
                            rgx: rgxub
                        });
                } else redirecth.not_found(req, res, "users");
                return [null];
            }).then(([specificUsers]) => {
                if (!specificUsers) return;
                if (specificUsers.length > 0 && specificUsers[0])
                    sendh.page(req, res, "edit-user", {
                        user: v_user,
                        userInfo: specificUsers[0],
                        rgx: rgxub
                    });
                else
                    sendh.page(req, res, "edit-user", {
                        user: v_user,
                        userInfo: null,
                        rgx: rgxub
                    });
            }).catch(err => redirecth.system_error(req, res, err, "users"));
        } else redirecth.invalid_input(req, res, "users");
    } else redirecth.permission_denied(req, res, null);
});

router.get("/add-user", (req, res) => {
    if (req.session.user && req.session.user.type == "admin")
        sendh.page(req, res, "add-user", { rgx: rgxub });
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
            let v_insertedUser;
            const db = req.app.get("db");
            const qry = db.query(sql.insert_users_table, [req.body.password, req.body.type, req.body.active]);
            qry.then(([insertedUser]) => {
                v_insertedUser = insertedUser;
                if (req.body.type == "student")
                    return db.query(sql.insert_students_table,
                        [v_insertedUser.insertId, req.body.name, req.body.course, req.body.dob, req.body.email, req.body.phone, req.body.address]);
                else if (req.body.type == "teacher")
                    return db.query(sql.insert_teachers_table,
                        [v_insertedUser.insertId, req.body.name, req.body.course, req.body.dob, req.body.email, req.body.phone, req.body.address]);
                else redirecth.invalid_input(req, res, "add-user");
            }).then((result) => {
                if (!result) return;
                redirecth.user_added(req, res, v_insertedUser.insertId, "add-user");
            }).catch(err => redirecth.system_error(req, res, err, "add-user"));
        } else redirecth.permission_denied(req, res, "add-user");
    } else redirecth.permission_denied(req, res, null);
});

const relocate_student_to_teacher_and_respond = (req, res, userid) => {
    let v_student;
    const db = req.app.get("db");
    const qry = db.query(sql.select_students_with_id, [userid]);
    qry.then(([students]) => {
        if (students.length > 0 && students[0]) {
            v_student = students[0];
            return db.query(sql.delete_students_with_id, [v_student.userid]);
        } else redirecth.not_found(req, res, "users");
    }).then((result) => {
        if (!result) return;
        return db.query(sql.insert_teachers_table,
            [v_student.userid, v_student.name, v_student.course, v_student.dob, v_student.email, v_student.phone, v_student.address]);
    }).then((result) => {
        if (!result) return;
        redirecth.user_updated(req, res, "user/" + vfv.get_valid_userid(userid))
    }).catch(err => redirecth.system_error(req, res, err, "user/" + vfv.get_valid_userid(userid)));
}

const relocate_teacher_to_student_and_respond = (req, res, userid) => {
    let v_teacher;
    const db = req.app.get("db");
    const qry = db.query(sql.select_teachers_with_id, [userid]);
    qry.then(([teachers]) => {
        if (teachers.length > 0 && teachers[0]) {
            v_teacher = teachers[0];
            return db.query(sql.delete_teachers_with_id, [v_teacher.userid]);
        } else redirecth.not_found(req, res, "users");
    }).then((result) => {
        if (!result) return;
        return db.query(sql.insert_students_table,
            [v_teacher.userid, v_teacher.name, v_teacher.course, v_teacher.dob, v_teacher.email, v_teacher.phone, v_teacher.address]);
    }).then((results) => {
        if (!results) return;
        redirecth.user_updated(req, res, "user/" + vfv.get_valid_userid(userid))
    }).catch(err => redirecth.system_error(req, res, err, "user/" + vfv.get_valid_userid(userid)));
}

router.post("/edit-user", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        if (vfv.verify_userid(req.body.userid)) {
            req.body.userid = vfv.get_real_userid(req.body.userid);
            if (req.body.active) req.body.active = req.body.active == "true" ? 1 : 0;
            else if (req.body.active_) req.body.active = 0;
            if (!req.body.address && req.body.address_) { req.body.address = " "; }
            const db = req.app.get("db");
            const qry = db.query(sql.select_users_with_id, [req.body.userid]);
            qry.then(([users]) => {
                if (users.length > 0 && users[0] && vfv.verify_type(users[0].type)) {
                    if (vfv.verify_password(req.body.password))
                        return db.query(sql.update_users_with_id("password"), [req.body.password, users[0].userid]);
                    else if (vfv.verify_active(req.body.active))
                        return db.query(sql.update_users_with_id("active"), [req.body.active, users[0].userid]);
                    else if (vfv.verify_name(req.body.name) && users[0].type == "student")
                        return db.query(sql.update_students_with_id("name"), [req.body.name, users[0].userid]);
                    else if (vfv.verify_name(req.body.name) && users[0].type == "teacher")
                        return db.query(sql.update_teachers_with_id("name"), [req.body.name, users[0].userid]);
                    else if (vfv.verify_course(req.body.course) && users[0].type == "student")
                        return db.query(sql.update_students_with_id("course"), [req.body.course.toLowerCase(), users[0].userid]);
                    else if (vfv.verify_course(req.body.course) && users[0].type == "teacher")
                        return db.query(sql.update_teachers_with_id("course"), [req.body.course.toLowerCase(), users[0].userid]);
                    else if (vfv.verify_dob(req.body.dob) && users[0].type == "student")
                        return db.query(sql.update_students_with_id("dob"), [req.body.dob, users[0].userid]);
                    else if (vfv.verify_dob(req.body.dob) && users[0].type == "teacher")
                        return db.query(sql.update_teachers_with_id("dob"), [req.body.dob, users[0].userid]);
                    else if (vfv.verify_email(req.body.email) && users[0].type == "student")
                        return db.query(sql.update_students_with_id("email"), [req.body.email.toLowerCase(), users[0].userid]);
                    else if (vfv.verify_email(req.body.email) && users[0].type == "teacher")
                        return db.query(sql.update_teachers_with_id("email"), [req.body.email.toLowerCase(), users[0].userid]);
                    else if (vfv.verify_phone(req.body.phone) && users[0].type == "student")
                        return db.query(sql.update_students_with_id("phone"), [req.body.phone, users[0].userid]);
                    else if (vfv.verify_phone(req.body.phone) && users[0].type == "teacher")
                        return db.query(sql.update_teachers_with_id("phone"), [req.body.phone, users[0].userid]);
                    else if (vfv.verify_address(req.body.address) && users[0].type == "student")
                        return db.query(sql.update_students_with_id("address"), [req.body.address, users[0].userid]);
                    else if (vfv.verify_address(req.body.address) && users[0].type == "teacher")
                        return db.query(sql.update_teachers_with_id("address"), [req.body.address, users[0].userid]);
                    else if (vfv.verify_type(req.body.type) && users[0].type == req.body.type)
                        redirecth.with_fail(req, res, "unchanged user type, " + req.body.userid,
                            "User is already of the specified type.", "user/" + vfv.get_valid_userid(req.body.userid));
                    else if (vfv.verify_type(req.body.type) && users[0].type != req.body.type && users[0].type == "student") {
                        db.query(sql.update_users_with_id("type"), [req.body.type, users[0].userid])
                            .then(() => relocate_student_to_teacher_and_respond(req, res, users[0].userid))
                            .catch(err => redirecth.system_error(req, res, err, "user/" + vfv.get_valid_userid(req.body.userid)));
                    }
                    else if (vfv.verify_type(req.body.type) && users[0].type != req.body.type && users[0].type == "teacher") {
                        db.query(sql.update_users_with_id("type"), [req.body.type, users[0].userid])
                            .then(() => relocate_teacher_to_student_and_respond(req, res, users[0].userid))
                            .catch(err => redirecth.system_error(req, res, err, "user/" + vfv.get_valid_userid(req.body.userid)));
                    }
                    else redirecth.invalid_input(req, res, "user/" + vfv.get_valid_userid(req.body.userid));
                } else redirecth.not_found(req, res, "users");
            }).then((result) => {
                if (!result) return;
                redirecth.user_updated(req, res, "user/" + vfv.get_valid_userid(req.body.userid));
            }).catch(err => redirecth.system_error(req, res, err, "user/" + vfv.get_valid_userid(req.body.userid)));
        } else redirecth.invalid_input(req, res, "users");
    } else redirecth.permission_denied(req, res, null);
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
            const db = req.app.get("db");
            const qry = db.query(sql.select_users_with_id, [req.body.userid]);
            let v_user;
            qry.then(([users]) => {
                if (users.length > 0 && users[0]) {
                    v_user = users[0];
                    if (vfv.verify_type(v_user.type) && v_user.type == "student")
                        return db.query(sql.delete_students_with_id, [v_user.userid]);
                    else if (vfv.verify_type(v_user.type) && v_user.type == "teacher")
                        return db.query(sql.delete_teachers_with_id, [v_user.userid]);
                    else redirecth.not_found(req, res, "users");
                } else redirecth.not_found(req, res, "users");
            }).catch(err => redirecth.system_error(req, res, err, "users"))
                .then((result) => {
                    if (!result) return [null];
                    return db.query(sql.select_all_answer_papers_with_id, [v_user.userid]);
                }).then(([aPapers]) => {
                    if (!aPapers) return;
                    for (let i = 0; i < aPapers.length; i++) {
                        fileh.delete_aPaper(req.app.get("db"), aPapers[i].question_filename, aPapers[i].userid);
                    }
                    return db.query(sql.delete_users_with_id, [v_user.userid]);
                }).then((result) => {
                    if (!result) return;
                    redirecth.user_deleted(req, res, "users")
                }).catch(err => redirecth.system_error(req, res, err, "user/" + vfv.get_valid_userid(v_user.userid)));
        } else redirecth.invalid_input(req, res, "users");
    } else redirecth.permission_denied(req, res, null);
});

router.get("/question-papers", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher") {
        const db = req.app.get("db");
        const qry = db.query(sql.select_teachers_with_id, [req.session.user.userid]);
        qry.then(([teachers]) => {
            if (teachers.length > 0 && teachers[0])
                return db.query(sql.select_all_question_papers_with_course, [teachers[0].course]);
            else redirecth.permission_denied(req, res, null);
            return [null];
        }).then(([qPapers]) => {
            if (!qPapers) return;
            sendh.page(req, res, "list-question-papers", { qPapers: qPapers })
        }).catch(err => redirecth.system_error(req, res, err, null));
    } else redirecth.permission_denied(req, res, null);
});

router.get("/question-paper/:Qname", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher") {
        if (vfv.verify_Qname(req.params.Qname)) {
            req.params.Qname = req.params.Qname.toLowerCase();
            let v_teacher, v_qPaper;
            const db = req.app.get("db");
            const qry = db.query(sql.select_teachers_with_id, [req.session.user.userid]);
            qry.then(([teachers]) => {
                if (teachers.length > 0 && teachers[0]) {
                    v_teacher = teachers[0];
                    return db.query(sql.select_question_papers_with_name, [req.params.Qname]);
                } else redirecth.permission_denied(req, res, "question-papers");
                return [null];
            }).then(([qPapers]) => {
                if (!qPapers) return [null];
                if (qPapers.length > 0 && qPapers[0] && qPapers[0].course == v_teacher.course) {
                    v_qPaper = qPapers[0];
                    return db.query(sql.select_all_answer_papers_with_Qname, [v_qPaper.filename]);
                } else redirecth.not_found(req, res, "question-papers");
                return [null];
            }).then(([aPapers]) => {
                if (!aPapers) return;
                sendh.page(req, res, "edit-question-paper", {
                    qPaper: v_qPaper,
                    aPapers: aPapers
                });
            }).catch(err => redirecth.system_error(req, res, err, null));
        } else redirecth.invalid_input(req, res, "question-papers");
    } else redirecth.permission_denied(req, res, null);
});

router.get("/add-question-paper", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher")
        sendh.page(req, res, "add-question-paper", { rgx: rgxub });
    else redirecth.permission_denied(req, res, null);
});

router.post("/add-question-paper", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher") {
        if (vfv.verify_Qname(req.body.Qname) && req.body.marks && req.body.marks >= 0 && req.body.marks <= 9999 && req.files && req.files.Qfile
            && req.files.Qfile.mimetype == "application/pdf" && parseInt(req.files.Qfile.size.toString()) < 3 * 1024 * 1024) {
            req.body.Qname = req.body.Qname.toLowerCase();
            let v_teacher;
            const db = req.app.get("db");
            const qry = db.query(sql.select_teachers_with_id, [req.session.user.userid]);
            qry.then(([teachers]) => {
                if (teachers.length > 0 && teachers[0]) {
                    v_teacher = teachers[0];
                    return db.query(sql.select_question_papers_with_name, [req.body.Qname]);
                } else redirecth.permission_denied(req, res, null);
                return [null];
            }).then(([qPapers]) => {
                if (!qPapers) return;
                if (qPapers.length == 0)
                    return db.query(sql.insert_question_papers_table, [req.body.Qname, v_teacher.course, req.body.marks]);
                else redirecth.with_fail(req, res, "question paper name not unique",
                    "Question Paper name must be unique.", "add-question-paper");
            }).then((result) => {
                if (!result) return;
                req.files.Qfile.mv(global.base_dir + "data/question-papers/" + req.body.Qname + ".pdf", (err) => {
                    if (err) redirecth.system_error(req, res, err, "add-question-paper");
                    else redirecth.with_success(req, res, "question paper added, " + req.body.Qname,
                        "Question Paper [" + req.body.Qname + "] added successfully.", "add-question-paper");
                });
            }).catch(err => redirecth.system_error(req, res, err, "add-question-paper"));
        } else redirecth.invalid_input(req, res, "add-question-paper");
    } else redirecth.permission_denied(req, res, null);
});

router.post("/edit-question-paper", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher") {
        if (vfv.verify_Qname(req.body.Qname) && req.body.activate) {
            const active = req.body.activate == "true" ? 1 : 0;
            let v_teacher, v_qPaper;
            const db = req.app.get("db");
            const qry = db.query(sql.select_teachers_with_id, [req.session.user.userid]);
            qry.then(([teachers]) => {
                if (teachers.length > 0 && teachers[0]) {
                    v_teacher = teachers[0];
                    return db.query(sql.select_question_papers_with_name, [req.body.Qname]);
                }
                else redirecth.permission_denied(req, res, null);
                return [null];
            }).catch(err => redirecth.system_error(req, res, err, null))
                .then(([qPapers]) => {
                    if (!qPapers) return;
                    if (qPapers[0] && qPapers[0].course == v_teacher.course) {
                        v_qPaper = qPapers[0];
                        return db.query(sql.update_question_papers_with_name, [active, v_qPaper.filename]);
                    }
                    else redirecth.not_found(req, res, "question-paper/" + req.body.Qname);
                }).then((result) => {
                    if (!result) return;
                    return db.query(sql.update_all_question_papers_in_course_except_name, [v_qPaper.course, v_qPaper.filename]);
                }).then((result) => {
                    if (!result) return;
                    redirecth.with_success(req, res, "question paper activated, " + req.body.Qname,
                        "Question Paper activated successfully.", "question-paper/" + req.body.Qname)
                }).catch(err => redirecth.system_error(req, res, err, "question-paper/" + req.body.Qname));
        } else redirecth.invalid_input(req, res, "question-paper/" + req.body.Qname);
    } else redirecth.permission_denied(req, res, null);
});

router.get("/answer-paper/:Aname", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher") {
        let Aname = req.params.Aname;
        const Qname = Aname.slice(0, Aname.indexOf("-ANS-"));
        let userid = Aname.slice(Aname.indexOf("-ANS-") + 5);
        if (vfv.verify_Qname(Qname) && vfv.verify_userid(userid)) {
            userid = vfv.get_real_userid(userid);
            Aname = Qname + "-ANS-" + userid;
            const db = req.app.get("db");
            const qry = db.query(sql.select_answer_papers_with_Qname_id, [Qname, userid]);
            qry.then(([aPapers]) => {
                if (aPapers.length > 0 && aPapers[0])
                    sendh.page(req, res, "edit-answer-paper", { aPaper: aPapers[0] });
                else redirecth.not_found(req, res, "question-paper/" + Qname);
            }).catch(err => redirecth.system_error(req, res, err, "answer-papers"));
        } else redirecth.invalid_input(req, res, "question-paper/" + Qname);
    } else redirecth.permission_denied(req, res, null);
});

router.post("/edit-answer-paper", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher" && vfv.verify_Qname(req.body.Qname) && vfv.verify_userid(req.body.userid) && req.body.marks) {
        req.body.userid = vfv.get_real_userid(req.body.userid);
        req.body.marks = req.body.marks >= 0 && req.body.marks <= 9999 ? req.body.marks : null;
        let v_teacher;
        const db = req.app.get("db");
        const qry = db.query(sql.select_teachers_with_id, [req.session.user.userid]);
        qry.then(([teachers]) => {
            if (teachers.length > 0 && teachers[0]) {
                v_teacher = teachers[0];
                return db.query(sql.select_question_papers_with_name, [req.body.Qname]);
            } else redirecth.permission_denied(req, res, "question-paper/" + req.body.Qname);
            return [null];
        }).then(([qPapers]) => {
            if (!qPapers) return [null];
            if (qPapers.length > 0 && qPapers[0] && qPapers[0].course == v_teacher.course)
                return db.query(sql.select_answer_papers_with_Qname_id, [qPapers[0].filename, req.body.userid]);
            else redirecth.permission_denied(req, res, "question-paper/" + req.body.Qname);
            return [null];
        }).catch(err => redirecth.system_error(req, res, err, "answer-papers"))
            .then(([aPapers]) => {
                if (!aPapers) return;
                if (aPapers.length > 0 && aPapers[0])
                    return db.query(sql.update_answer_papers_table, [req.body.marks, aPapers[0].question_filename, aPapers[0].userid]);
                else redirecth.not_found(req, res, "question-paper/" + req.body.Qname);
            }).then((result) => {
                if (!result) return;
                redirecth.with_success(req, res, "answer paper marked, " + req.body.Qname + ", " + req.body.userid,
                    "Answer Paper marked successfully.", "answer-paper/" + req.body.Qname + "-ANS-" + vfv.get_valid_userid(req.body.userid))
            }).catch(err => redirecth.system_error(req, res, err, "answer-paper/" + req.body.Qname + "-ANS-" + vfv.get_valid_userid(req.body.userid)));
    } else redirecth.permission_denied(req, res, null);
});

router.get("/students", (req, res) => {
    if (req.session.user && req.session.user.type == "teacher") {
        const db = req.app.get("db");
        const qry = db.query(sql.select_teachers_with_id, [req.session.user.userid]);
        qry.then(([teachers]) => {
            if (teachers.length > 0 && teachers[0])
                return db.query(sql.select_all_students_with_course, [teachers[0].course]);
            else redirecth.permission_denied(req, res, null);
            return [null];
        }).then(([students]) => {
            if (!students) return;
            sendh.page(req, res, "list-students", { students: students })
        }).catch(err => redirecth.system_error(req, res, err, null));
    } else redirecth.permission_denied(req, res, null);
});

router.get("/exams", (req, res) => {
    if (req.session.user && req.session.user.type == "student") {
        let v_qPaper;
        const db = req.app.get("db");
        const qry = db.query(sql.select_students_with_id, [req.session.user.userid]);
        qry.then(([students]) => {
            if (students.length > 0 && students[0])
                return db.query(sql.select_question_papers_with_course_active, [students[0].course]);
            else redirecth.permission_denied(req, res, null);
            return [null];
        }).then(([qPapers]) => {
            if (!qPapers) return [null];
            if (qPapers.length > 0 && qPapers[0]) {
                v_qPaper = qPapers[0];
                return db.query(sql.select_answer_papers_with_Qname_id, [v_qPaper.filename, req.session.user.userid]);
            } else sendh.page(req, res, "list-exams", { qPapers: null, aPaper: null });
            return [null];
        }).then(([aPapers]) => {
            if (!aPapers) return;
            if (aPapers.length > 0 && aPapers[0])
                sendh.page(req, res, "list-exams", { qPaper: v_qPaper, aPaper: aPapers[0] });
            else sendh.page(req, res, "list-exams", { qPaper: v_qPaper, aPaper: null });
        }).catch(err => redirecth.system_error(req, res, err, null));
    } else redirecth.permission_denied(req, res, null);
});

router.post("/submit-exam", (req, res) => {
    if (req.session.user && req.session.user.type == "student") {
        if (vfv.verify_Qname(req.body.Qname) && req.files && req.files.Afile && req.files.Afile.mimetype == "application/pdf"
            && parseInt(req.files.Afile.size.toString()) < 10 * 1024 * 1024) {
            req.body.Qname = req.body.Qname.toLowerCase();
            const db = req.app.get("db");
            const qry = db.query(sql.select_question_papers_with_name, [req.body.Qname]);
            qry.then(([qPapers]) => {
                if (qPapers.length > 0 && qPapers[0] && qPapers[0].active == true)
                    return db.query(sql.select_answer_papers_with_Qname_id, [qPapers[0].filename, req.session.user.userid]);
                else redirecth.not_found(req, res, "exams");
                return [null];
            }).then(([aPapers]) => {
                if (!aPapers) return;
                if (aPapers.length == 0)
                    return db.query(sql.insert_answer_papers_table, [req.body.Qname, req.session.user.userid]);
                else redirecth.with_fail(req, res, "answer paper already submitted",
                    "Answer Paper already submitted. Please contact your teacher, if you want to re-submit", "exams");
                return null;
            }).then((result) => {
                if (!result) return;
                req.files.Afile.mv(global.base_dir + "data/answer-papers/" + req.body.Qname + "-ANS-" + req.session.user.userid + ".pdf", (err) => {
                    if (err) redirecth.system_error(req, res, err, "exams");
                    else redirecth.with_success(req, res, "answer paper submitted, " + req.body.Qname + ", " + req.session.user.userid,
                        "Answer Paper has been submitted successfully.", "exams");
                });
            }).catch(err => redirecth.system_error(req, res, err, "exams"));
        } else redirecth.not_found(req, res, "exams");
    } else redirecth.permission_denied(req, res, null);
});

router.get("/results", (req, res) => {
    if (req.session.user && req.session.user.type == "student") {
        const db = req.app.get("db");
        const qry = db.query(sql.select_all_results_with_id, [req.session.user.userid]);
        qry.then(([results]) => sendh.page(req, res, "list-results", { results: results }))
            .catch(err => redirecth.system_error(req, res, err, null));
    } else redirecth.permission_denied(req, res, null);
});


module.exports = router;
