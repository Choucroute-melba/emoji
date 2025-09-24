import EmojiSelector from "./selector/emojiselector";
import TextAreaHandler from "./features/textarea/handler";
import Handler from "./handler/handler";
import HTMLInputHandler from "./features/input/handler";
import AriaDivHandler from "./features/aria/handler";
import {
    buildShortcutString,
    chooseAndLoadHandler,
    getAvailableHandlers
} from "./handler/handlersManager";

console.log('Emoji on the go ✨')


const handlers = [HTMLInputHandler, TextAreaHandler, AriaDivHandler]
const availableHandlers = await getAvailableHandlers();

let es = new EmojiSelector()
let currentHandler: Handler<any> | null = null


async function mainListener(this: any, e: KeyboardEvent) {
    try {
        const sc = buildShortcutString(e);
        const isCombo = (sc !== e.key);
        console.groupCollapsed(`%c${e.code}%c ${isCombo ? sc : e.key} \tTarget : %c${e.target}`,
            'color: #FFC300; background-color: #201800; border-radius: 3px; padding: 2px 4px;',
            'color: default; background-color: default',
            'color: #999; ');
        console.log(e.target)
        console.log(buildShortcutString(e))

        const domain = window.location.hostname

        const h = await chooseAndLoadHandler(availableHandlers, e).catch((err: Error) => {
            if(err.message === "NO_HANDLER_TRIGGERED") {
                console.info("%cNo handler triggered for this event", 'color: #FF0000; font-weight: bold');
                console.groupEnd()
            }
            else {
                console.groupEnd()
                console.info("%cError while choosing handler: " + err.message, 'color: #FF0000; font-weight: bold');
            }
            return null;
        });

        console.groupEnd()
        if(h) {
            if(!currentHandler) {
                const onExit = () => {
                    currentHandler = null
                    console.log("EmojiSelector closed")
                    window.addEventListener('keydown', mainListener, true)
                }
                currentHandler = new h(es, e.target as any, onExit);
                if(currentHandler) { // Handler may be destroyed during the instantiation
                    console.log(currentHandler ? `%cHandled by ${currentHandler.HandlerName}` : "%cNo handler found", (currentHandler ? 'color: #00FF00' : 'color: #FF0000') + '; font-weight: bold')
                    window.removeEventListener('keydown', mainListener, true)
                }
                else {
                    console.error("Something went wrong while creating the handler");
                }
            }
            else {
                console.warn("there is already a handler active", currentHandler.HandlerName, "for", currentHandler.target);
            }
        }
    }
    catch (e) {
        console.group("Exception ---")
        console.error(e)
        if(currentHandler)
            currentHandler.destroy()
        console.groupEnd()
    }
}

async function bindIframeListeners() {
    const iframes: HTMLIFrameElement[] = Array.from(document.querySelectorAll('iframe'));
    for (const iframe of iframes) {
        let contentWindow = undefined
        try {
            contentWindow = iframe.contentWindow;
        } catch (e) {}
        if (contentWindow) {
            if((contentWindow as any)._hasEmojiListener) {
                console.groupCollapsed(`° #${iframe.id}.${iframe.className} - ${iframe.src}`);
                contentWindow.removeEventListener('keydown', mainListener, true);
            } else {
                console.groupCollapsed(`+ #${iframe.id}.${iframe.className} - ${iframe.src}`);
            }
            contentWindow.addEventListener('keydown', mainListener, true);
            (contentWindow as any)._hasEmojiListener = true;
            (contentWindow as any)._emojiListenerLocation = window.location.href;
            console.log(iframe)
            console.log(contentWindow)
            console.groupEnd();
            /*
            if(!(contentWindow as any)._hasEmojiListener) {
                console.groupCollapsed(`+ #${iframe.id}.${iframe.className} - ${iframe.src}`);
                contentWindow.addEventListener('keydown', mainListener, true);
                (contentWindow as any)._hasEmojiListener = true;
                (contentWindow as any)._emojiListenerLocation = window.location.href;
                console.log(iframe)
                console.log(contentWindow)
                console.groupEnd();
            }
            else if(contentWindow.location.href !== (contentWindow as any)._emojiListenerLocation) {
                console.groupCollapsed(`° #${iframe.id}.${iframe.className} - ${iframe.src}`);
                contentWindow.addEventListener('keydown', mainListener, true);
                (contentWindow as any)._hasEmojiListener = true;
                (contentWindow as any)._emojiListenerLocation = window.location.href;
                console.log(iframe)
                console.log(contentWindow)
                console.groupEnd();
            }*/
        } else {
            console.info(`%cNo document found in iframe`, 'color: #4444FF', `#${iframe.id}.${iframe.className} - ${iframe.src}`);
        }
    }
}

window.addEventListener('keydown', mainListener, true)
bindIframeListeners();

document.addEventListener('DOMContentLoaded', bindIframeListeners);
const observer = new MutationObserver(bindIframeListeners);

observer.observe(document.body, { childList: true, subtree: true });

window.addEventListener('keydown', (e) => {
    if(e.code == "NumpadDivide") {
        const mirror = document.querySelector("#mirrorForCaret") as HTMLDivElement
        if(mirror) {
            if (mirror.style.display === "none") {
                mirror.style.display = "block"
            }
            else {
                mirror.style.display = "none"
            }
        }
    }
});
