const  REACT_APP_URL="http://localhost:3000"
const REACT_APP_ROOT_ID="emoji-root-peekaboo"

function loadEmojiApp() {
    const rootNode = document.getElementsByTagName("html")[0];
    const emojiRoot = document.createElement("div")
        emojiRoot.id = REACT_APP_ROOT_ID
    const app = document.createElement("script")
        app.setAttribute("src", REACT_APP_URL + "/static/js/bundle.js")
    emojiRoot.appendChild(app)
    rootNode.appendChild(emojiRoot)
}

loadEmojiApp();