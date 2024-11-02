const eventTATest = document.getElementById("eventTATest");

eventTATest.addEventListener("keydown", function (event) {
    event.stopPropagation();
});