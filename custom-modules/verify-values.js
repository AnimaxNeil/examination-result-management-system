// checks if the value is as desired

const rgx = require(global.base_dir + "custom-modules/regex");

const verify_values = {
    verify_userid: (userid) => {
        return userid && rgx.userid.test(userid) == true;
    },
    get_valid_userid: (userid) => {
        return "II" + (userid + 10000000);
    },
    get_real_userid: (userid) => {
        const v_userid = userid.toString();
        return parseInt(v_userid.slice(2)) - 10000000;
    },
    verify_password: (password) => {
        return password && rgx.password.test(password) == true;
    },
    verify_type: (type) => {
        return type == "student" || type == "teacher";
    },
    verify_active: (active) => {
        return active === 1 || active === 0;
    },
    verify_name: (name) => {
        return name && rgx.name.test(name) == true;
    },
    verify_course: (course) => {
        return course && rgx.course.test(course) == true;
    },
    verify_dob: (dob) => {
        return dob && rgx.dob.test(dob) == true;
    },
    verify_email: (email) => {
        return email && email.length <= 50 && rgx.email.test(email) == true;
    },
    verify_phone: (phone) => {
        return phone && rgx.phone.test(phone) == true;
    },
    verify_password: (password) => {
        return password && rgx.password.test(password) == true;
    },
    verify_address: (address) => {
        return address && address.length <= 100;
    },
    verify_Qname: (Qname) => {
        return Qname && rgx.Qname.test(Qname) == true;
    },
}

module.exports = verify_values;