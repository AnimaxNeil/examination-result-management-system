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
        if (user) {
            const v_userid = user.userid.toString();
            if (v_userid.substring(0, 2) == "II") user.userid = (parseInt(v_userid.substring(2, v_userid.length)) - 10000000);
        }
        message += user ? user.userid + "(" + user.type + ")" : "(null)";
        if (get) message += " |=get> " + get;
        if (post) message += " |=post> " + post;
        if (info) message += " |=info> " + info;
        if (error) message += " |=error> " + error;
        message += "\n";
        return message;
    },
    writeToFile: (level, message) => {
        message = "[" + logger.getCurrentTime() + "]" + "(" + level + ")+" + message;
        fs.writeFile(global.__basedir + "/debug/log/log-" + logger.getCurrentDate() + ".txt", message, { flag: "a+" }, err => { });
    },
};

module.exports = logger;