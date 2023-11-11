const  REACT_APP_URL="http://localhost:3000"
const REACT_APP_ROOT_ID="emoji-root-peekaboo"

console.info("Emoji.js loaded")

function loadEmojiApp() {
    console.info("Loading emoji app - public/emoji.js")
    try {
        if(document.getElementById(REACT_APP_ROOT_ID)) {
            console.warn("Emoji app already loaded")
            return
        }

        /**
         * Make a bridge between the React app and the extension
         */
        window.addEventListener("message", (event) => {
            if(event.source !== window) {
                console.warn("Emoji app message from unknown source", event)
                return
            }
            if(event.data.recipient === "EMOJI_CONTENT_SCRIPT") {
                if(event.data.type === "APP_COMMUNICATION" && event.data.action === "SEND_MESSAGE") {
                    browser.runtime.sendMessage(event.data.payload.message)
                }
            }
        });

        console.log(`Connecting to the extension from tab ${window.location.href}`)
        let port = browser.runtime.connect({name: `emoji-${window.location.href}`});

        port.onMessage.addListener((message) => {
            console.info("Emoji app received message", message)
            window.postMessage({
                recipient: "EMOJI_APP",
                type: "APP_COMMUNICATION",
                action: "RECEIVE_MESSAGE",
                payload: message
            }, window.location.origin)
        });

        const rootNode = document.getElementsByTagName("html")[0];
        const emojiRoot = document.createElement("div")
        emojiRoot.id = REACT_APP_ROOT_ID
        const app = document.createElement("script")
        app.setAttribute("src", REACT_APP_URL + "/static/js/bundle.js")
        emojiRoot.appendChild(app)
        rootNode.appendChild(emojiRoot)
    } catch (e) {
        console.error("Error loading emoji app", e)
    }
}

loadEmojiApp();