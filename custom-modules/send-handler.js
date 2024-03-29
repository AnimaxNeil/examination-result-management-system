// custom render handler object

const logger = require(global.base_dir + "custom-modules/logger");

const send_handler = {
    page: (req, res, fileName, params) => {
        if (params) {
            if (req.session && req.session.responseMsg) {
                params.responseMsg = req.session.responseMsg;
                delete req.session.responseMsg;
            }
            res.render(fileName, params);
        }
        else res.render(fileName);
        logger.quickLog(req, null, "page sent");
    },
    file: (req, res, file) => {
        res.download(global.base_dir + file);
        logger.quickLog(req, null, "file sent, " + file);
    },
    question_paper: (req, res, fileName) => {
        send_handler.file(req, res, "data/question-papers/" + fileName + ".pdf")
    },
    answer_paper: (req, res, fileName) => {
        send_handler.file(req, res, "data/answer-papers/" + fileName + ".pdf")
    },
};

module.exports = send_handler;
