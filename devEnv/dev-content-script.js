const body = document.getElementsByTagName('body')[0]
const ctScript = document.createElement('script')
ctScript.src = "http://localhost:8080/bundle.js"
body.appendChild(ctScript)