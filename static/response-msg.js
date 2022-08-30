// front end script for response message on all pages

let responseMsg;

if (window.responseMsgRecieved) {
    responseMsg = {
        message: document.getElementById("response-alert"),
        closeBtn: document.getElementById("response-alert").getElementsByTagName("img")[0],
    };
}

document.addEventListener("DOMContentLoaded", function () {

    // console.debug("DOM start");
    if (window.responseMsgRecieved) {
        responseMsg.closeBtn.addEventListener("click", function () { responseMsg.message.style.display = "none"; });
        setTimeout(function () { responseMsg.message.style.display = "none"; }, 4000);
    }
    // console.debug("DOM end");

});
