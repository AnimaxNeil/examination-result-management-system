// manage files page logic

// to use express for serving files
const express = require("express");
const router = express.Router();

// custom redirect handler
const redirecth = require(global.__basedir + "custom-modules/redirect-handler");
// custom send handler
const sendh = require(global.__basedir + "custom-modules/send-handler");
// custom file handler
const fileh = require(global.__basedir + "custom-modules/file-handler")

// database connection
const db = require(global.__basedir + "custom-modules/database");
// formatted sql querries
const sql = require(global.__basedir + "custom-modules/sql-commands");
// check validity of various input feilds
const vfv = require(global.__basedir + "custom-modules/verify-values");


router.get("/", (req, res) => {
    if (req.session.user && req.session.user.type == "admin")
        sendh.page(req, res, "manage-files", null);
    else
        redirecth.permission_denied(req, res, null);
});

router.get("/question-papers", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        db.query(sql.select_all_question_papers, (err, qPapers) => {
            if (err)
                redirecth.system_error(req, res, err, "manage-files");
            else
                sendh.page(req, res, "manage-list-question-papers", {
                    qPapers: qPapers
                });
        });
    }
    else redirecth.permission_denied(req, res, null);
});

router.get("/answer-papers", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        db.query(sql.select_all_answer_papers, (err, aPapers) => {
            if (err)
                redirecth.system_error(req, res, err, "manage-files");
            else
                sendh.page(req, res, "manage-list-answer-papers", {
                    aPapers: aPapers
                });
        });
    }
    else redirecth.permission_denied(req, res, null);
});

router.post("/delete-question-paper", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        if (vfv.verify_Qname(req.body.Qname)) {
            db.query(sql.select_question_papers_with_name, [req.body.Qname], (err, qPapers) => {
                if (err)
                    redirecth.system_error(req, res, err, "manage-files/question-papers");
                else if (qPapers[0]) {
                    db.query(sql.select_all_answer_papers_with_Qname, [req.body.Qname], (err, aPapers) => {
                        if (err)
                            redirecth.system_error(req, res, err, "manage-files/question-papers");
                        else {
                            for (let i = 0; i < aPapers.length; i++) {
                                fileh.delete_aPaper(aPapers[i].question_filename, aPapers[i].userid);
                            }
                            fileh.delete_qPaper(req.body.Qname);
                            redirecth.with_success(req, res, "question paper deleted, " + req.body.Qname,
                                "Question Paper [" + req.body.Qname + "] and all associated Answer Papers has been deleted successfully.",
                                "manage-files/question-papers");
                        }
                    });
                }
                else redirecth.not_found(req, res, "manage-files/question-papers");
            });
        }
        else redirecth.invalid_input(req, res, "manage-files/question-papers");
    }
    else redirecth.permission_denied(req, res, null);
});

router.post("/delete-answer-paper", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        if (vfv.verify_Qname(req.body.Qname), vfv.verify_userid(req.body.userid)) {
            req.body.userid = vfv.get_real_userid(req.body.userid);
            db.query(sql.select_answer_papers_with_Qname_id, [req.body.Qname, req.body.userid], (err, aPapers) => {
                if (err)
                    redirecth.system_error(req, res, err, "manage-files/answer-papers");
                else if (aPapers[0]) {
                    fileh.delete_aPaper(req.body.Qname, req.body.userid);
                    redirecth.with_success(req, res, "answer paper deleted, " + req.body.Qname + "," + req.body.userid,
                        "Answer Paper [" + req.body.Qname + "," + req.body.userid + "] has been deleted successfully.",
                        "manage-files/answer-papers");
                }
                else redirecth.not_found(req, res, "manage-files/answer-papers");
            });
        }
        else redirecth.invalid_input(req, res, "manage-files/answer-papers");
    }
    else redirecth.permission_denied(req, res, null);
});

module.exports = router;
