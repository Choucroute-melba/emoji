import browser, {Runtime} from "webextension-polyfill";
import {Message} from "./background/messsaging";
import {callOnActiveTab, getActiveTab} from "./background/utils";
import SettingsManager from "./settings/settingsManager";
import MessageSender = Runtime.MessageSender;

console.log("background.ts");

const sm = new SettingsManager();
console.log("Initializing storage")
await sm.initializeStorage();

browser.browserAction.onClicked.addListener(async (tab, click) => {
    console.log(`Action clicked on ${tab.id} - ${tab.url}`);
    if(!click)
        throw new Error("No click data");
    if(!tab.url)
        throw new Error("No tab url");
    const siteSettings = await sm.getSettingsForSite(tab.url)
    const globalSettings = await sm.getSettings()
    if(click.modifiers.length > 0) {
        switch (click.modifiers) {
            case ["Shift"]:
                sm.enableOnSite(tab.url, !siteSettings.enabled);
                break;
            case ["Alt"]:
                sm.enableGlobally(!globalSettings.enabled);
                break;
        }
        return;
    }

    // browser.browserAction.openPopup();
})

async function messageListener(message: any, sender: MessageSender, sendResponse: (response?: any) => void): Promise<true> {
    const m = message as Message;
    switch (m.action) {
        case "getSettings":
            await sm.getSettings().then((settings) => {
                sendResponse(settings);
            })
            break;
        case "getSiteSettings":
            if(!m.data?.url) {
                const tab = await getActiveTab();
                if(!tab) throw new Error("No active tab");
                if(!tab.url || tab.url === "") throw new Error("No tab url (maybe no active tab?)");
                const settings = await sm.getSettingsForSite(tab.url)
                sendResponse(settings);
            }
            else
                await sm.getSettingsForSite(m.data.url).then((settings) => {
                    sendResponse(settings);
                });
            break;
        case "enable":
            await sm.enableGlobally(m.data.enabled);
            break;
        case "enableForSite":
            const tab = await getActiveTab();
            if(!tab) throw new Error("No active tab");
            if(!tab.url) throw new Error("No tab url (maybe no active tab?)");
            await sm.enableOnSite(tab.url, m.data.enabled);
            break;
        case "setFreeSelector":
            if(m.data.thisSiteOnly || m.data.url) {
                if (!m.data.url) {
                    const tab = await getActiveTab();
                    if(!tab) throw new Error("No active tab");
                    if(!tab.url) throw new Error("No tab url (maybe no active tab?)");
                    await sm.enableOnSite(tab.url, m.data.enabled);
                }
                else
                    await sm.enableOnSite(m.data.url, m.data.enabled);
            }
            else
                await sm.enableFreeSelector(m.data.enabled);
            break;
        case "getTabId":
            sendResponse(sender.tab?.id);
            break;
    }
    sendResponse(true);
    return true;
}

browser.runtime.onMessage.addListener((message: any, sender, sendResponse): true => {
    messageListener(message, sender, sendResponse).then(() => {
        return true
    });
    return true
});

