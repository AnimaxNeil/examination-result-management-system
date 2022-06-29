// front end script for response message on all pages

let responseMsg;

if (window.errorMsgRecieved) {
    responseMsg = {
        message: document.getElementById("errorMsg"),
        closeBtn: document.getElementById("errorMsg").getElementsByTagName("img")[0],
    };
}
else if (window.successMsgRecieved) {
    responseMsg = {
        message: document.getElementById("successMsg"),
        closeBtn: document.getElementById("successMsg").getElementsByTagName("img")[0],
    };
}

document.addEventListener("DOMContentLoaded", function () {

    // console.debug("DOM start");
    if (window.errorMsgRecieved || window.successMsgRecieved) {
        responseMsg.closeBtn.addEventListener("click", function () { responseMsg.message.style.display = "none"; });
        setTimeout(function () { responseMsg.message.style.display = "none"; }, 5000);
    }
    // console.debug("DOM end");

});
