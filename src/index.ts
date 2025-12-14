import EmojiSelector from "./selector/emojiselector";
import TextAreaHandler from "./features/textarea/handler";
import Handler from "./handler/handler";
import HTMLInputHandler from "./features/input/handler";
import AriaDivHandler from "./features/aria/handler";
import {
    buildShortcutString,
    chooseAndLoadHandler,
    getAvailableHandlers, HandlerManifest
} from "./handler/handlersManager";
import browser, {Tabs} from "webextension-polyfill";
import {SiteSettings} from "./background/dataManager";
import {
    AddDataChangeListenerMessage,
    AddSiteSettingsListenerMessage,
    EventMessage,
    Message
} from "./background/messsaging";
import {getDomainName} from "./background/utils";
import Tab = Tabs.Tab;

console.log('Emoji on the go ✨')


const handlers = [HTMLInputHandler, TextAreaHandler, AriaDivHandler]
const availableHandlers = await getAvailableHandlers();
const disabledHandlers: HandlerManifest[] = []

function disableHandler(handlerName: string) {
    const handlerIndex = availableHandlers.findIndex(h => h.name === handlerName)
    if(handlerIndex !== -1) {
        disabledHandlers.push(availableHandlers[handlerIndex])
        availableHandlers.splice(handlerIndex, 1)
    }
    if(currentHandler && currentHandler.HandlerName === handlerName) {
        currentHandler.destroy()
        currentHandler = null
    }
}

function disableEveryHandleExcept(handlerNames: string[]) {
    for (let i = availableHandlers.length - 1; i >= 0; i--) {
        const handler = availableHandlers[i]
        if (!handlerNames.includes(handler.name))
            disableHandler(handler.name)
    }
    for(let i = disabledHandlers.length - 1; i >= 0; i--) {
        const handler = disabledHandlers[i]
        if (handlerNames.includes(handler.name))
            enableHandler(handler.name)
    }
    console.log(availableHandlers)
    console.log(disabledHandlers)
}

function enableHandler(handlerName: string) {
    const handlerIndex = disabledHandlers.findIndex(h => h.name === handlerName)
    if(handlerIndex !== -1) {
        availableHandlers.push(disabledHandlers[handlerIndex])
        disabledHandlers.splice(handlerIndex, 1)
    }
}

function enableEveryHandlerExcept(handlerNames: string[]) {
    for (let i = disabledHandlers.length - 1; i >= 0; i--) {
        const handler = disabledHandlers[i]
        if (!handlerNames.includes(handler.name))
            enableHandler(handler.name)
    }
    for (let i = availableHandlers.length - 1; i >= 0; i--) {
        const handler = availableHandlers[i]
        if (handlerNames.includes(handler.name))
            disableHandler(handler.name)
    }
    console.log(availableHandlers)
    console.log(disabledHandlers)
}

function isHandlerEnabled(handlerName: string) {
    return availableHandlers.findIndex(h => h.name === handlerName) !== -1
}

let es = new EmojiSelector()
let currentHandler: Handler<any> | null = null
let listening = false

const tabId = (await browser.runtime.sendMessage({ action: "getTabId" })) as number;


async function mainListener(this: any, e: KeyboardEvent | string) {
    try {
        const isCommand = (typeof e === "string")
        const sc = isCommand ? e : buildShortcutString(e);
        const isCombo = isCommand? false : (sc !== e.key);
        console.groupCollapsed(`%c${isCommand ? e : e.code}%c ${isCombo ? sc : (isCommand ? e : e.key)} \tTarget : %c${isCommand ? "" : e.target}`,
            'color: #FFC300; background-color: #201800; border-radius: 3px; padding: 2px 4px;',
            'color: default; background-color: default',
            'color: #999; ');
        console.log(isCommand ? "Command Event" : e.target)
        console.log(sc)

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
                currentHandler = new h(es, (isCommand ? document.activeElement : e.target) as any, onExit);
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

const commandsListener = (command: any, tab: any) => {
    if(typeof command !== "string")
        return;
    mainListener(command)
}

async function bindIframeListeners() {
    const iframes: HTMLIFrameElement[] = Array.from(document.querySelectorAll('iframe'));
    for (const iframe of iframes) {
        let contentWindow = undefined
        try {
            contentWindow = iframe.contentWindow;
        } catch (e) {}
        if (contentWindow) {
            let hasEmojiListener: boolean
            try {
                hasEmojiListener = (contentWindow as any)._hasEmojiListener;
            } catch (e) {
                hasEmojiListener = false
            }
            if(hasEmojiListener) {
                console.groupCollapsed(`° #${iframe.id}.${iframe.className} - ${iframe.src}`);
            } else {
                console.groupCollapsed(`+ #${iframe.id}.${iframe.className} - ${iframe.src}`);
            }
            contentWindow.addEventListener('keydown', mainListener, true);
            (contentWindow as any)._hasEmojiListener = true;
            (contentWindow as any)._emojiListenerLocation = window.location.href;
            console.log(iframe)
            console.log(contentWindow)
            console.groupEnd();
        } else {
            console.info(`%cNo document found in iframe`, 'color: #4444FF', `#${iframe.id}.${iframe.className} - ${iframe.src}`);
        }
    }
}

async function removeIframeListeners() {
    const iframes: HTMLIFrameElement[] = Array.from(document.querySelectorAll('iframe'));
    for (const iframe of iframes) {
        let contentWindow = undefined
        try {
            contentWindow = iframe.contentWindow;
        } catch (e) {}
        if (contentWindow) {
            console.groupCollapsed(`- #${iframe.id}.${iframe.className} - ${iframe.src}`);
            contentWindow.removeEventListener('keydown', mainListener, true);
            (contentWindow as any)._hasEmojiListener = false;
            console.groupEnd()
        }
    }
}

let mainListenerLoaded = false
let DOMChangesListenerLoaded = false

async function applySettings(settings: SiteSettings) {
    if(settings.enabled || settings.freeSelector) {
        if(!mainListenerLoaded) {
            window.addEventListener('keydown', mainListener, true)
            browser.runtime.onMessage.addListener(commandsListener);
            mainListenerLoaded = true
        }
        if(!DOMChangesListenerLoaded) {
            document.addEventListener('DOMContentLoaded', bindIframeListeners);
            await bindIframeListeners();
            observer.observe(document.body, {childList: true, subtree: true});
            DOMChangesListenerLoaded = true
        }
        es.addToDom()
    }
    else {
        window.removeEventListener('keydown', mainListener, true)
        browser.runtime.onMessage.removeListener(commandsListener);
        mainListenerLoaded = false
        document.removeEventListener('DOMContentLoaded', bindIframeListeners);
        DOMChangesListenerLoaded = false
        observer.disconnect();
        await removeIframeListeners();
        es.removeFromDom()
    }

    if(settings.enabled && settings.freeSelector) {
        enableEveryHandlerExcept([])
    }
    else if(settings.enabled && !settings.freeSelector) {
        enableEveryHandlerExcept(["FreeSelector"])
    }
    else if(!settings.enabled && settings.freeSelector) {
        disableEveryHandleExcept(["FreeSelector"])
    }
    else if(!settings.enabled && !settings.freeSelector) {
        disableEveryHandleExcept([])
    }
    siteSettings = settings
    console.log(`Site settings (${tabId}) :`, siteSettings);
}

const observer = new MutationObserver(bindIframeListeners);

let siteSettings = await browser.runtime.sendMessage({ action: "getEffectiveModeOnSite", data: { url: window.location.href }}) as SiteSettings

const port = browser.runtime.connect({ name: `emoji-tab-${tabId}` });
port.onMessage.addListener(async (message) => {
    const msg = message as EventMessage
    if(msg.event === "dataChanged") {
        console.log(`dataChanged event : ${msg.data.key} = ${msg.data.value}`)
        const newSettings = await browser.runtime.sendMessage({ action: "getEffectiveModeOnSite", data: { url: window.location.href }}) as SiteSettings
        await applySettings(newSettings)
    }
})

port.postMessage({
    action: "addDataChangeListener",
    data: {
        keys: [
            "settings.*",
            "settings.sites[" + getDomainName(window.location.href) + "]",
            "settings.sites[" + getDomainName(window.location.href) + "].**",
        ]
    }
} as AddDataChangeListenerMessage)

console.log(`Site settings (${tabId}) :`, siteSettings);

await applySettings(siteSettings)

/*window.addEventListener('keydown', (e) => {
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
});*/
