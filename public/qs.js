console.log(window.location.href)
let rootPane = document.getElementById("qs-root")
rootPane.appendChild(document.createTextNode(window.location.href))
rootPane.appendChild(browser.runtime.getUrl("qs.html"))
