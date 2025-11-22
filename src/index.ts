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
import browser from "webextension-polyfill";
import {SiteSettings} from "./settings/settingsManager";
import {AddSiteSettingsListenerMessage, EventMessage, Message} from "./background/messsaging";

console.log('Emoji on the go ✨')


const handlers = [HTMLInputHandler, TextAreaHandler, AriaDivHandler]
const availableHandlers = await getAvailableHandlers();

let es = new EmojiSelector()
let currentHandler: Handler<any> | null = null

const tabId = (await browser.runtime.sendMessage({ action: "getTabId" })) as number;
let freeSelectorEnabled = false


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

async function freeSelectorOnlyListener(this: any, e: KeyboardEvent) {

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
        if(!(sc === "Ctrl+," || sc === "AltGraph+,")) {
            console.info("%cNot a free selector shortcut, and autocomplete is disabled", 'color: #FF0000; font-weight: bold');
            console.groupEnd()
            return
        }
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
                    window.addEventListener('keydown', freeSelectorOnlyListener, true)
                }
                currentHandler = new h(es, e.target as any, onExit);
                if(currentHandler) { // Handler may be destroyed during the instantiation
                    console.log(currentHandler ? `%cHandled by ${currentHandler.HandlerName}` : "%cNo handler found", (currentHandler ? 'color: #00FF00' : 'color: #FF0000') + '; font-weight: bold')
                    window.removeEventListener('keydown', freeSelectorOnlyListener, true)
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

async function enableEmojiOnTheGo() {
    console.log(`enableEmojiOnTheGo() \tcurrentHandler=${currentHandler ? currentHandler.HandlerName : "null"}\tfreeSelectorEnabled=${freeSelectorEnabled}`);
    window.addEventListener('keydown', mainListener, true)
    await bindIframeListeners();
    if (!freeSelectorEnabled) {
        document.addEventListener('DOMContentLoaded', bindIframeListeners);

        observer.observe(document.body, {childList: true, subtree: true});
        es.addToDom()
    }
    else {
        window.removeEventListener('keydown', freeSelectorOnlyListener, true)
    }

    freeSelectorEnabled = true
}

async function disableEmojiOnTheGo(keepFreeSelector: boolean = false) {
    console.log(`disableEmojiOnTheGo(keepFreeSelector=${keepFreeSelector}) \tcurrentHandler=${currentHandler ? currentHandler.HandlerName : "null"}\tfreeSelectorEnabled=${freeSelectorEnabled}`);
    window.removeEventListener('keydown', mainListener, true)
    if (!keepFreeSelector) {
        window.removeEventListener('keydown', freeSelectorOnlyListener, true)
        es.removeFromDom()
        document.removeEventListener('DOMContentLoaded', bindIframeListeners);
        await removeIframeListeners();
        observer.disconnect();
        freeSelectorEnabled = false
    }
    if(currentHandler && (!keepFreeSelector || currentHandler.HandlerName != "FreeSelector")) {
        currentHandler.destroy()
        currentHandler = null
    }
    if(keepFreeSelector) {
        console.info("Keeping free selector enabled")
        window.addEventListener('keydown', freeSelectorOnlyListener, true)
        es.addToDom()
        freeSelectorEnabled = true
    }
}


const observer = new MutationObserver(bindIframeListeners);

let siteSettings = await browser.runtime.sendMessage({ action: "getSiteSettings", data: { url: window.location.href }}) as SiteSettings

const port = browser.runtime.connect({ name: `emoji-tab-${tabId}` });
port.onMessage.addListener(async (message) => {
    const msg = message as EventMessage
    if(msg.event === "siteSettingsUpdated") {
        console.log("siteSettingsUpdated", msg.data)
        const newSettings = msg.data.settings
        if(newSettings.enabled !== siteSettings.enabled) {
            if(newSettings.enabled) {
                await enableEmojiOnTheGo()
            }
            else {
                await disableEmojiOnTheGo(newSettings.freeSelector)
            }
            siteSettings = newSettings
            console.log(`Site settings (${tabId}) :`, siteSettings);
        }
    }
    if(msg.event === "settingsUpdated") {
        console.log("Global settings updated", msg.data.settings)
        let newSiteSettings = await browser.runtime.sendMessage({ action: "getSiteSettings", data: { url: window.location.href }}) as SiteSettings;
        if(msg.data.settings.enabled && newSiteSettings.enabled) {
            await enableEmojiOnTheGo()
            console.log(`Site settings (${tabId}) :`, newSiteSettings);
        }
        else if(!msg.data.settings.enabled) {
            await disableEmojiOnTheGo(msg.data.settings.keepFreeSelectorEnabled)
            console.log(`Site settings (${tabId}) :`, newSiteSettings);
        }
        else if(!newSiteSettings.enabled && siteSettings.enabled) {
            await disableEmojiOnTheGo(siteSettings.freeSelector)
            console.log(`Site settings (${tabId}) :`, newSiteSettings);
        }
        else if(newSiteSettings.enabled && !siteSettings.enabled) {
            await enableEmojiOnTheGo()
            console.log(`Site settings (${tabId}) :`, newSiteSettings);
        }
        else if(newSiteSettings.freeSelector !== siteSettings.freeSelector) {
            await disableEmojiOnTheGo(newSiteSettings.freeSelector)
            console.log(`Site settings (${tabId}) :`, newSiteSettings);
        }
        siteSettings = newSiteSettings
    }
})

port.postMessage({action: "addSiteSettingsListener", data: {url: window.location.href}} as AddSiteSettingsListenerMessage)
port.postMessage({action: "addSettingsListener", data: {url: window.location.href}} as Message)

console.log(`Site settings (${tabId}) :`, siteSettings);

if(siteSettings.enabled && !siteSettings.disabledGlobally) {
    console.log("Emoji on the go is enabled for this site");
    await enableEmojiOnTheGo()
}
else {
    console.log("autocomplete is disabled for this site");
    if(siteSettings.freeSelector)
        await enableEmojiOnTheGo()
    await disableEmojiOnTheGo(siteSettings.freeSelector)
}

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
