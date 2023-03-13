// manage files page logic

// to use express for serving files
const router = require("express").Router();
// custom redirect handler
const redirecth = require(global.base_dir + "custom-modules/redirect-handler");
// custom send handler
const sendh = require(global.base_dir + "custom-modules/send-handler");
// custom file handler
const fileh = require(global.base_dir + "custom-modules/file-handler")
// formatted sql querries
const sql = require(global.base_dir + "custom-modules/sql-commands");
// check validity of various input feilds
const vfv = require(global.base_dir + "custom-modules/verify-values");


router.get("/", (req, res) => {
    if (req.session.user && req.session.user.type == "admin")
        sendh.page(req, res, "manage-files", null);
    else redirecth.permission_denied(req, res, null);
});

router.get("/question-papers", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        const db = req.app.get("db");
        const qry = db.query(sql.select_all_question_papers);
        qry.then(([qPapers]) => sendh.page(req, res, "manage-list-question-papers", { qPapers: qPapers }))
            .catch(err => redirecth.system_error(req, res, err, "manage-files"));
    } else redirecth.permission_denied(req, res, null);
});

router.get("/answer-papers", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        const db = req.app.get("db");
        const qry = db.query(sql.select_all_answer_papers,);
        qry.then(([aPapers]) => sendh.page(req, res, "manage-list-answer-papers", { aPapers: aPapers }))
            .catch(err => redirecth.system_error(req, res, err, "manage-files"));
    } else redirecth.permission_denied(req, res, null);
});

router.post("/delete-question-paper", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        if (vfv.verify_Qname(req.body.Qname)) {
            const db = req.app.get("db");
            const qry = db.query(sql.select_question_papers_with_name, [req.body.Qname]);
            qry.then(([qPapers]) => {
                if (qPapers.length > 0 && qPapers[0])
                    return db.query(sql.select_all_answer_papers_with_Qname, [req.body.Qname]);
                else redirecth.not_found(req, res, "manage-files/question-papers");
                return [null];
            }).then(([aPapers]) => {
                if (!aPapers) return;
                for (let i = 0; i < aPapers.length; i++) {
                    fileh.delete_aPaper(req.app.get("db"), aPapers[i].question_filename, aPapers[i].userid);
                }
                fileh.delete_qPaper(req.app.get("db"), req.body.Qname);
                redirecth.with_success(req, res, "question paper deleted, " + req.body.Qname,
                    "Question Paper [" + req.body.Qname + "] and all associated Answer Papers has been deleted successfully.",
                    "manage-files/question-papers"
                );
            }).catch(err => redirecth.system_error(req, res, err, "manage-files/question-papers"));
        } else redirecth.invalid_input(req, res, "manage-files/question-papers");
    } else redirecth.permission_denied(req, res, null);
});

router.post("/delete-answer-paper", (req, res) => {
    if (req.session.user && req.session.user.type == "admin") {
        if (vfv.verify_Qname(req.body.Qname), vfv.verify_userid(req.body.userid)) {
            req.body.userid = vfv.get_real_userid(req.body.userid);
            const db = req.app.get("db");
            const qry = db.query(sql.select_answer_papers_with_Qname_id, [req.body.Qname, req.body.userid]);
            qry.then(([aPapers]) => {
                if (aPapers.length > 0 && aPapers[0]) {
                    fileh.delete_aPaper(req.app.get("db"), req.body.Qname, req.body.userid);
                    redirecth.with_success(req, res, "answer paper deleted, " + req.body.Qname + "," + req.body.userid,
                        "Answer Paper [" + req.body.Qname + "," + req.body.userid + "] has been deleted successfully.",
                        "manage-files/answer-papers"
                    );
                } else redirecth.not_found(req, res, "manage-files/answer-papers");
            }).catch(err => redirecth.system_error(req, res, err, "manage-files/answer-papers"));
        } else redirecth.invalid_input(req, res, "manage-files/answer-papers");
    } else redirecth.permission_denied(req, res, null);
});

module.exports = router;
