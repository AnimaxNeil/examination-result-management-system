// download route logic

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


router.get("/question-paper/:Qname", (req, res) => {
    if (req.session.user && vfv.verify_Qname(req.params.Qname)) {
        req.params.Qname = req.params.Qname.toLowerCase();
        db.query(sql.get_question_papers_with_name(req.params.Qname), (err, qPapers) => {
            if (err) {
                res.redirect(global.__baseurl + "/");
                logger.quickLog(req, err, null);
            }
            else if (qPapers[0]) {
                res.download(global.__basedir + "/data/question-papers/" + req.params.Qname + ".pdf");
                logger.quickLog(req, null, "sent");
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

const download_answer_paper = (req, res, Qname, userid, Aname) => {
    db.query(sql.get_answer_papers_with_Qname_id(Qname, userid), (err, aPapers) => {
        if (err) {
            res.redirect(global.__baseurl + "/");
            logger.quickLog(req, err, null);
        }
        else if (aPapers[0]) {
            res.download(global.__basedir + "/data/answer-papers/" + Aname + ".pdf");
            logger.quickLog(req, null, "downloaded");
        }
        else {
            res.redirect(global.__baseurl + "/");
            logger.quickLog(req, null, "not found");
        }
    });
}

router.get("/answer-paper/:Aname", (req, res) => {
    if (req.session.user) {
        let Aname = req.params.Aname;
        const Qname = Aname.slice(0, Aname.indexOf("-ANS-"));
        let userid = Aname.slice(Aname.indexOf("-ANS-") + 5);
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
                res.redirect(global.__baseurl + "/");
                logger.quickLog(req, null, "permission denied");
            }
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

module.exports = router;

