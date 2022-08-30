// custom redirect handler object

const logger = require(global.__basedir + "custom-modules/logger");
const vfv = require(global.__basedir + "custom-modules/verify-values");

const redirect_handler = {
    in_site: (req, res, err, info, msgType, msg, link) => {
        if (msgType && msg && req.session) req.session.responseMsg = { type: msgType, text: msg };
        if (link) res.redirect(global.__baseurl + link); else res.redirect(global.__baseurl);
        logger.quickLog(req, err, info);
    },
    no_msg: (req, res, link) => {
        redirect_handler.in_site(req, res, null, null, null, null, link);
    },
    with_success: (req, res, info, msg, link) => {
        redirect_handler.in_site(req, res, null, info, "success", msg, link);
    },
    with_fail: (req, res, info, msg, link) => {
        redirect_handler.in_site(req, res, null, info, "error", msg, link);
    },
    system_error: (req, res, err, link) => {
        redirect_handler.in_site(req, res, err, null, "error", "System error.", link);
    },
    invalid_url: (req, res, link) => {
        redirect_handler.in_site(req, res, null, "invalid url", "error", "Invalid url. Page does not exist.", link);
    },
    not_found: (req, res, link) => {
        redirect_handler.in_site(req, res, null, "not found", "error", "Resource not found.", link);
    },
    invalid_input: (req, res, link) => {
        redirect_handler.in_site(req, res, null, "invalid input", "error", "Invalid input.", link);
    },
    permission_denied: (req, res, link) => {
        redirect_handler.in_site(req, res, null, "permission denied", "error", "Permission denied.", link);
    },
    login_success: (req, res, link) => {
        redirect_handler.in_site(req, res, null, "login successful, " + req.body.userid, "success", "Login successful. Userid: " + vfv.get_valid_userid(req.body.userid), link);
    },
    login_fail: (req, res, link) => {
        redirect_handler.in_site(req, res, null, "login failed, " + req.body.userid, "error",
            "Login failed. Incorrect credentials or the associated user account is inactive.", link);
    },
    login_duplicate: (req, res, link) => {
        redirect_handler.in_site(req, res, null, "already logged in", "error", "An user is already logged in.", link);
    },
    logout_success: (req, res, link) => {
        const userid = req.session.user.userid;
        req.session.destroy();
        redirect_handler.in_site(req, res, null, "logout successful, " + userid, "success", "Logged out successfully. Userid: " + vfv.get_valid_userid(userid), link);
    },
    user_added: (req, res, userid, link) => {
        redirect_handler.in_site(req, res, null, "user added successfully, " + userid, "success", "User added successfully. Userid: " + vfv.get_valid_userid(userid), link);
    },
    user_updated: (req, res, link) => {
        redirect_handler.in_site(req, res, null, "user updated successfully, " + req.body.userid, "success", "User updated successfully.", link);
    },
    user_deleted: (req, res, link) => {
        redirect_handler.in_site(req, res, null, "user deleted successfully, " + req.body.userid, "success",
            "User [" + vfv.get_valid_userid(req.body.userid) + "] and all associated Answer Papers has been deleted successfully.", link);
    },
};

module.exports = redirect_handler;