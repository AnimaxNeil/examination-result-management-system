// files deletion handler object

const fs = require("fs");
const db = require(global.__basedir + "/custom-modules/database");
const sql = require(global.__basedir + "/custom-modules/sql-commands");
const logger = require(global.__basedir + "/custom-modules/logger");

const file_deletion = {
    delete_file: (file) => {
        fs.unlink(file, (err) => {
            if (err) logger.quickLog(null, err, "file=>" + file);
            else logger.quickLog(null, null, "deleted: file=>" + file);
        });
    },
    delete_qPaper: (Qname) => {
        db.query(sql.delete_question_papers_with_name(Qname), (err, qRes) => {
            if (err) logger.quickLog(null, err, null);
            else {
                const file = global.__basedir + "/data/question-papers/" + Qname + ".pdf";
                file_deletion.delete_file(file);
            }
        });
    },
    delete_aPaper: (Qname, userid) => {
        db.query(sql.delete_answer_papers_with_Qname_id(Qname, userid), (err, aRes) => {
            if (err) logger.quickLog(null, err, null);
            else {
                const file = global.__basedir + "/data/answer-papers/" + Qname + "-ANS-" + userid + ".pdf";
                file_deletion.delete_file(file);
            }
        });
    }
}

module.exports = file_deletion;

