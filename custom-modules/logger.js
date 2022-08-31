// log files handler object

const fs = require("fs");

const logger = {
    getCurrentDate: () => {
        const date = new Date();
        return date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2);
    },
    getCurrentTime: () => {
        const date = new Date();
        return ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2) + ":" + ("0" + date.getSeconds()).slice(-2);
    },
    getFormattedMessage: ({ user, get, post, info, error } = {}) => {
        let message = " |=user> ";
        message += user ? user.userid + "(" + user.type + ")" : "(null)";
        if (get) message += " |=get> " + get.slice(global.base_url.length);
        if (post) message += " |=post> " + post.slice(global.base_url.length);
        if (info) message += " |=info> " + info;
        if (error) message += " |=error> " + error;
        message += "\n";
        return message;
    },
    writeToFile: (level, message) => {
        message = "[" + logger.getCurrentTime() + "]" + "(" + level + ")+" + message;
        fs.writeFile(global.base_dir + "/debug/log/log-" + logger.getCurrentDate() + ".txt", message, { flag: "a+" }, err => { });
    },
    quickLog: (req, err, info) => {
        const level = err ? "error" : "info";
        if (!req)
            logger.writeToFile(level, logger.getFormattedMessage({ info: info, error: err }));
        else if (req.method == "GET")
            if (req.session && req.session.user)
                logger.writeToFile(level, logger.getFormattedMessage({ user: req.session.user, get: req.originalUrl, info: info, error: err }));
            else logger.writeToFile(level, logger.getFormattedMessage({ get: req.originalUrl, info: info, error: err }));
        else if (req.method == "POST")
            if (req.session && req.session.user)
                logger.writeToFile(level, logger.getFormattedMessage({ user: req.session.user, post: req.originalUrl, info: info, error: err }));
            else logger.writeToFile(level, logger.getFormattedMessage({ post: req.originalUrl, info: info, error: err }));
    }
};

module.exports = logger;