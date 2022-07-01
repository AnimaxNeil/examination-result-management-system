// front end script for edit-user page

const form_password = {
    form: document.getElementById("form-password"),
    inputF: document.getElementById("password"),
    hint: document.getElementById("form-password").getElementsByTagName("span")[0],
    editBtn: document.getElementById("form-password").getElementsByClassName("edit-btn")[0],
    cancelBtn: document.getElementById("form-password").getElementsByClassName("cancel-btn")[0],
    submitBtn: document.getElementById("form-password").getElementsByClassName("submit-btn")[0]
};
const form_type = {
    form: document.getElementById("form-type"),
    inputF: document.getElementById("type"),
    editBtn: document.getElementById("form-type").getElementsByClassName("edit-btn")[0],
    cancelBtn: document.getElementById("form-type").getElementsByClassName("cancel-btn")[0],
    submitBtn: document.getElementById("form-type").getElementsByClassName("submit-btn")[0]
};
const form_active = {
    form: document.getElementById("form-active"),
    inputF: document.getElementById("active"),
    editBtn: document.getElementById("form-active").getElementsByClassName("edit-btn")[0],
    cancelBtn: document.getElementById("form-active").getElementsByClassName("cancel-btn")[0],
    submitBtn: document.getElementById("form-active").getElementsByClassName("submit-btn")[0]
};
const form_name = {
    form: document.getElementById("form-name"),
    inputF: document.getElementById("name"),
    hint: document.getElementById("form-name").getElementsByTagName("span")[0],
    editBtn: document.getElementById("form-name").getElementsByClassName("edit-btn")[0],
    cancelBtn: document.getElementById("form-name").getElementsByClassName("cancel-btn")[0],
    submitBtn: document.getElementById("form-name").getElementsByClassName("submit-btn")[0]
};
const form_course = {
    form: document.getElementById("form-course"),
    inputF: document.getElementById("course"),
    hint: document.getElementById("form-course").getElementsByTagName("span")[0],
    editBtn: document.getElementById("form-course").getElementsByClassName("edit-btn")[0],
    cancelBtn: document.getElementById("form-course").getElementsByClassName("cancel-btn")[0],
    submitBtn: document.getElementById("form-course").getElementsByClassName("submit-btn")[0]
};
const form_dob = {
    form: document.getElementById("form-dob"),
    inputF: document.getElementById("dob"),
    editBtn: document.getElementById("form-dob").getElementsByClassName("edit-btn")[0],
    cancelBtn: document.getElementById("form-dob").getElementsByClassName("cancel-btn")[0],
    submitBtn: document.getElementById("form-dob").getElementsByClassName("submit-btn")[0]
};
const form_email = {
    form: document.getElementById("form-email"),
    inputF: document.getElementById("email"),
    editBtn: document.getElementById("form-email").getElementsByClassName("edit-btn")[0],
    cancelBtn: document.getElementById("form-email").getElementsByClassName("cancel-btn")[0],
    submitBtn: document.getElementById("form-email").getElementsByClassName("submit-btn")[0]
};
const form_phone = {
    form: document.getElementById("form-phone"),
    inputF: document.getElementById("phone"),
    hint: document.getElementById("form-phone").getElementsByTagName("span")[0],
    editBtn: document.getElementById("form-phone").getElementsByClassName("edit-btn")[0],
    cancelBtn: document.getElementById("form-phone").getElementsByClassName("cancel-btn")[0],
    submitBtn: document.getElementById("form-phone").getElementsByClassName("submit-btn")[0]
};
const form_address = {
    form: document.getElementById("form-address"),
    inputF: document.getElementById("address"),
    hint: document.getElementById("form-address").getElementsByTagName("span")[0],
    editBtn: document.getElementById("form-address").getElementsByClassName("edit-btn")[0],
    cancelBtn: document.getElementById("form-address").getElementsByClassName("cancel-btn")[0],
    submitBtn: document.getElementById("form-address").getElementsByClassName("submit-btn")[0]
};
const page_forms = [form_password, form_type, form_active, form_name, form_course, form_dob, form_email, form_phone, form_address];

function set_form_to_edit_mode(form_edit) {
    for (let i = 0; i < page_forms.length; i++) {
        if (page_forms[i].form.id == form_edit.form.id) {
            page_forms[i].inputF.disabled = false;
            page_forms[i].editBtn.hidden = true;
            page_forms[i].cancelBtn.hidden = false;
            page_forms[i].submitBtn.hidden = false;
            if (page_forms[i].hint) page_forms[i].hint.hidden = false;
        }
        else {
            page_forms[i].inputF.disabled = true;
            page_forms[i].editBtn.hidden = true;
            page_forms[i].cancelBtn.hidden = true;
            page_forms[i].submitBtn.hidden = true;
            if (page_forms[i].hint) page_forms[i].hint.hidden = true;
        }
    }
};

document.addEventListener("DOMContentLoaded", function () {

    // console.debug("DOM start");
    for (let i = 0; i < page_forms.length; i++) {
        page_forms[i].editBtn.addEventListener("click", function () { set_form_to_edit_mode(page_forms[i]); });
        page_forms[i].cancelBtn.addEventListener("click", function () { window.location.href = window.location.href; });
    };
    // console.debug("DOM end");

});

