// files deletion handler object

const fs = require("fs");
const db = require(global.base_dir + "custom-modules/database");
const sql = require(global.base_dir + "custom-modules/sql-commands");
const logger = require(global.base_dir + "custom-modules/logger");

const file_handler = {
    delete_file: (file) => {
        fs.unlink(file, (err) => {
            if (err) logger.quickLog(null, err, "file=>" + file);
            else logger.quickLog(null, null, "deleted: file=>" + file);
        });
    },
    delete_qPaper: (Qname) => {
        db.query(sql.delete_question_papers_with_name, [Qname], (err, qRes) => {
            if (err) logger.quickLog(null, err, null);
            else {
                const file = global.base_dir + "data/question-papers/" + Qname + ".pdf";
                file_handler.delete_file(file);
            }
        });
    },
    delete_aPaper: (Qname, userid) => {
        db.query(sql.delete_answer_papers_with_Qname_id, [Qname, userid], (err, aRes) => {
            if (err) logger.quickLog(null, err, null);
            else {
                const file = global.base_dir + "data/answer-papers/" + Qname + "-ANS-" + userid + ".pdf";
                file_handler.delete_file(file);
            }
        });
    }
}

module.exports = file_handler;

