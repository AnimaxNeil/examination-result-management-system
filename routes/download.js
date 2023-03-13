// download route logic

// to use express for serving files
const router = require("express").Router();
// custom redirect handler
const redirecth = require(global.base_dir + "custom-modules/redirect-handler");
// custom send handler
const sendh = require(global.base_dir + "custom-modules/send-handler");
// formatted sql querries
const sql = require(global.base_dir + "custom-modules/sql-commands");
// check validity of various input feilds
const vfv = require(global.base_dir + "custom-modules/verify-values");


router.get("/question-paper/:Qname", (req, res) => {
    if (req.session.user && vfv.verify_Qname(req.params.Qname)) {
        req.params.Qname = req.params.Qname.toLowerCase();
        const qry = req.app.get("db").query(sql.select_question_papers_with_name, [req.params.Qname]);
        qry.then(([qPapers]) => {
            if (qPapers.length > 0 && qPapers[0]) sendh.question_paper(req, res, req.params.Qname);
            else redirecth.not_found(req, res, null);
        }).catch(err => redirecth.system_error(req, res, err, null));
    } else redirecth.permission_denied(req, res, null);
});

const download_answer_paper_and_respond = (req, res, Qname, userid, Aname) => {
    const qry = req.app.get("db").query(sql.select_answer_papers_with_Qname_id, [Qname, userid]);
    qry.then(([aPapers]) => {
        if (aPapers.length > 0 && aPapers[0]) sendh.answer_paper(req, res, Aname);
        else redirecth.not_found(req, res, null);
    }).catch(err => redirecth.system_error(req, res, err, null));
}

router.get("/answer-paper/:Aname", (req, res) => {
    if (req.session.user) {
        let Aname = req.params.Aname;
        const Qname = Aname.slice(0, Aname.indexOf("-ANS-"));
        let v_userid = Aname.slice(Aname.indexOf("-ANS-") + 5);
        if (vfv.verify_Qname(Qname) && vfv.verify_userid(v_userid)) {
            v_userid = vfv.get_real_userid(v_userid);
            Aname = Qname + "-ANS-" + v_userid;
            if (req.session.user.type == "admin" || req.session.user.type == "teacher")
                download_answer_paper_and_respond(req, res, Qname, v_userid, Aname);
            else if (req.session.user.type == "student" && req.session.user.userid == v_userid)
                download_answer_paper_and_respond(req, res, Qname, v_userid, Aname);
            else redirecth.permission_denied(req, res, null);
        } else redirecth.invalid_input(req, res, null);
    } else redirecth.permission_denied(req, res, null);
});

module.exports = router;
