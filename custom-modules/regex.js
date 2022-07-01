// contains all regular expressions

const regex = {
    userid: /^II1[0-9]{7}$/,
    password: /^[a-zA-Z0-9_\.\+\*\-#@]{5,10}$/,
    name: /^[a-zA-Z ]{1,50}$/,
    course: /^[a-zA-Z0-9]{1,10}$/,
    dob: /^[0-9]{4}\-[0-9]{2}\-[0-9]{2}$/,
    email: /^([a-zA-Z0-9_\.\-]+)@([a-zA-Z0-9\-]+)\.([a-zA-Z]+)(\.[a-zA-Z]+)?$/,
    phone: /^[0-9]{10}$/,
    Qname: /^[a-zA-Z0-9_\-]{6,30}$/,
}

module.exports = regex;