// manage files page logic

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

// delete data files
const delfile = require(global.__basedir + "/custom-modules/file-deletion")


router.get("/", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        res.render("manage-files");
        global.errorMsg = global.successMsg = null;
        logger.quickLog(req, null, "sent");
    }
    else {
        res.redirect(global.__baseurl + "/");
        logger.quickLog(req, null, "permission denied");
    }
});

router.get("/question-papers", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        db.query(sql.get_all_question_papers, (err, qPapers) => {
            if (err) {
                res.redirect(global.__baseurl + "/manage-files");
                logger.quickLog(req, err, null);
            }
            else {
                res.render("manage-list-question-papers", {
                    qPapers: qPapers
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

router.get("/answer-papers", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        db.query(sql.get_all_answer_papers, (err, aPapers) => {
            if (err) {
                res.redirect(global.__baseurl + "/manage-files");
                logger.quickLog(req, err, null);
            }
            else {
                res.render("manage-list-answer-papers", {
                    aPapers: aPapers
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

router.post("/delete-question-paper", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        if (vfv.verify_Qname(req.body.Qname)) {
            db.query(sql.get_question_papers_with_name(req.body.Qname), (err, qPapers) => {
                if (err) logger.quickLog(req, err, null);
                else if (qPapers[0]) {
                    db.query(sql.get_all_answer_papers_with_Qname(req.body.Qname), (err, aPapers) => {
                        if (err) logger.quickLog(req, err, null);
                        else {
                            for (let i = 0; i < aPapers.length; i++) {
                                delfile.delete_aPaper(aPapers[i].question_filename, aPapers[i].userid);
                            }
                            delfile.delete_qPaper(req.body.Qname);
                        }
                    });
                }
                else logger.quickLog(req, null, "not found");
                global.successMsg = "Question Paper and all associated Answer Papers deleted successfully."
                res.redirect(global.__baseurl + "/manage-files/question-papers");
            });
        }
        else {
            res.redirect(global.__baseurl + "/manage-files/question-papers");
            logger.quickLog(req, null, "invalid input");
        }
    }
    else {
        res.redirect(global.__baseurl + "/");
        logger.quickLog(req, null, "permission denied");
    }
});

router.post("/delete-answer-paper", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        if (vfv.verify_Qname(req.body.Qname), vfv.verify_userid(req.body.userid)) {
            req.body.userid = vfv.get_real_userid(req.body.userid);
            db.query(sql.get_answer_papers_with_Qname_id(req.body.Qname, req.body.userid), (err, aPapers) => {
                if (err) logger.quickLog(req, err, null);
                else if (aPapers[0]) delfile.delete_aPaper(req.body.Qname, req.body.userid);
                else logger.quickLog(req, null, "not found");
                global.successMsg = "Answer Paper deleted successfully."
                res.redirect(global.__baseurl + "/manage-files/answer-papers");
            });
        }
        else {
            res.redirect(global.__baseurl + "/manage-files/answer-papers");
            logger.quickLog(req, null, "invalid input");
        }
    }
    else {
        res.redirect(global.__baseurl + "/");
        logger.quickLog(req, null, "permission denied");
    }
});

module.exports = router;

