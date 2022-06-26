// front end script for response message on all pages

const response = {
    body: document.getElementById("response"),
    cross: document.getElementById("response").getElementsByTagName("img")[0],
};

document.addEventListener("DOMContentLoaded", function () {

    // console.debug("DOM start");
    response.cross.addEventListener("click", function () { response.body.style.display="none"; });
    setTimeout( function() { response.body.style.display="none"; }, 5000);
    // console.debug("DOM end");

});
