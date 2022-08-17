// custom redirect handler object

const logger = require(global.__basedir + "custom-modules/logger");
const vfv = require(global.__basedir + "custom-modules/verify-values");

const redirect_handler = {
    in_site: (req, res, err, info, successValue, msg, link) => {
        global.successMsg = successValue == 1 ? msg : null;
        global.errorMsg = successValue == 2 ? msg : null;
        if (link) res.redirect(global.__baseurl + link); else res.redirect(global.__baseurl);
        logger.quickLog(req, err, info);
    },
	no_msg: (req, res, link) => {
        redirect_handler.in_site(req, res, null, null, 0, null, link);
    },
    with_success: (req, res, info, msg, link) => {
        redirect_handler.in_site(req, res, null, info, 1, msg, link);
    },
    with_fail: (req, res, info, msg, link) => {
        redirect_handler.in_site(req, res, null, info, 2, msg, link);
    },
    system_error: (req, res, err, link) => {
        redirect_handler.in_site(req, res, err, null, 2, "System error.", link);
    },
    invalid_url: (req, res, link) => {
        redirect_handler.in_site(req, res, null, "invalid url", 2, "Invalid url. Page does not exist.", link);
    },
    not_found: (req, res, link) => {
        redirect_handler.in_site(req, res, null, "not found", 2, "Resource not found.", link);
    },
    invalid_input: (req, res, link) => {
        redirect_handler.in_site(req, res, null, "invalid input", 2, "Invalid input.", link);
    },
    permission_denied: (req, res, link) => {
        redirect_handler.in_site(req, res, null, "permission denied", 2, "Permission denied.", link);
    },
    login_success: (req, res, link) => {
        redirect_handler.in_site(req, res, null, "login successful, " + req.body.userid, 1, "Login successful. Userid: " + vfv.get_valid_userid(req.body.userid), link);
    },
    login_fail: (req, res, link) => {
        redirect_handler.in_site(req, res, null, "login failed, " + req.body.userid, 2,
            "Login failed. Incorrect credentials or the associated user account is inactive.", link);
    },
    login_duplicate: (req, res, link) => {
        redirect_handler.in_site(req, res, null, "already logged in", 2, "An user is already logged in.", link);
    },
    logout_success: (req, res, link) => {
        const userid = req.session.user.userid;
        req.session.destroy();
        redirect_handler.in_site(req, res, null, "logout successful, " + userid, 1, "Logged out successfully. Userid: " + vfv.get_valid_userid(userid), link);
    },
    user_added: (req, res, userid, link) => {
        redirect_handler.in_site(req, res, null, "user added successfully, " + userid, 1, "User added successfully. Userid: " + vfv.get_valid_userid(userid), link);
    },
    user_updated: (req, res, link) => {
        redirect_handler.in_site(req, res, null, "user updated successfully, " + req.body.userid, 1, "User updated successfully.", link);
    },
    user_deleted: (req, res, link) => {
        redirect_handler.in_site(req, res, null, "user deleted successfully, " + req.body.userid, 1,
            "User [" + vfv.get_valid_userid(req.body.userid) + "] and all associated Answer Papers has been deleted successfully.", link);
    },
};

module.exports = redirect_handler;