// download route logic

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


router.get("/question-paper/:Qname", (req, res) => {
    if (req.session.user && vfv.verify_Qname(req.params.Qname)) {
        req.params.Qname = req.params.Qname.toLowerCase();
        db.query(sql.select_question_papers_with_name, [req.params.Qname], (err, qPapers) => {
            if (err)
                redirecth.system_error(req, res, err, null);
            else if (qPapers[0])
                sendh.question_paper(req, res, req.params.Qname);
            else
                redirecth.not_found(req, res, null);
        });
    }
    else redirecth.permission_denied(req, res, null);
});

const download_answer_paper = (req, res, Qname, userid, Aname) => {
    db.query(sql.select_answer_papers_with_Qname_id, [Qname, userid], (err, aPapers) => {
        if (err)
            redirecth.system_error(req, res, err, null);
        else if (aPapers[0])
            sendh.answer_paper(req, res, Aname);
        else
            redirecth.not_found(req, res, null);
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
            if (req.session.user.type == "admin" || req.session.user.type == "teacher")
                download_answer_paper(req, res, Qname, userid, Aname);
            else if (req.session.user.type == "student" && req.session.user.userid == userid)
                download_answer_paper(req, res, Qname, userid, Aname);
            else
                redirecth.permission_denied(req, res, null);
        }
        else redirecth.invalid_input(req, res, null);
    }
    else redirecth.permission_denied(req, res, null);
});

module.exports = router;
