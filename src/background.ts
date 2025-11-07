import browser from "webextension-polyfill";
import {Message} from "./background/messsaging";
import {callOnActiveTab} from "./background/utils";
import SettingsManager from "./settings/settingsManager";

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

browser.runtime.onMessage.addListener((message: any, sender, sendResponse): true => {
    const m = message as Message;
    switch (m.action) {
        case "getSettings":
            sm.getSettings().then((settings) => {
                sendResponse(settings);
            })
            break;
        case "getSiteSettings":
            if(!m.data?.url) {
                callOnActiveTab((tab) => {
                    if(!tab.url) throw new Error("No tab url (maybe no active tab?)");
                    sm.getSettingsForSite(tab.url).then((settings) => {
                        sendResponse(settings);
                    });
                })
            }
            else
                sm.getSettingsForSite(m.data.url).then((settings) => {
                    sendResponse(settings);
                });
            break;
        case "enable":
            sm.enableGlobally(m.data.enabled);
            break;
        case "enableForSite":
            callOnActiveTab((tab) => {
                if(!tab.url) throw new Error("No tab url (maybe no active tab?)");
                sm.enableOnSite(tab.url, m.data.enabled);
            })
            break;
        case "setFreeSelector":
            if(m.data.thisSiteOnly || m.data.url) {
                if (!m.data.url) {
                    callOnActiveTab((tab) => {
                        if (!tab.url) throw new Error("No tab url (maybe no active tab?)");
                        sm.enableOnSite(tab.url, m.data.enabled);
                    })
                }
                else
                    sm.enableOnSite(m.data.url, m.data.enabled);
            }
            else
                sm.enableFreeSelector(m.data.enabled);
            break;
        case "getTabId":
            sendResponse(sender.tab?.id);
            break;
    }
    return true;
});

