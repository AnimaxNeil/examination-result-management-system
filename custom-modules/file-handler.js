// files deletion handler object

const fs = require("fs");
const sql = require(global.base_dir + "custom-modules/sql-commands");
const logger = require(global.base_dir + "custom-modules/logger");

const file_handler = {
    delete_file: (file) => {
        fs.unlink(file, (err) => {
            if (err) logger.quickLog(null, err, "file=>" + file);
            else logger.quickLog(null, null, "deleted: file=>" + file);
        });
    },
    delete_qPaper: (db, Qname) => {
        const qry = db.query(sql.delete_question_papers_with_name, [Qname]);
        qry.then(() => {
            const file = global.base_dir + "data/question-papers/" + Qname + ".pdf";
            file_handler.delete_file(file);
        }).catch(err => logger.quickLog(null, err, null));
    },
    delete_aPaper: (db, Qname, userid) => {
        const qry = db.query(sql.delete_answer_papers_with_Qname_id, [Qname, userid]);
        qry.then(() => {
            const file = global.base_dir + "data/answer-papers/" + Qname + "-ANS-" + userid + ".pdf";
            file_handler.delete_file(file);
        }).catch(err => logger.quickLog(null, err, null));
    }
}

module.exports = file_handler;


