import React from 'react';
import {createRoot, Root} from 'react-dom/client';
import ActionPopup from "./action-popup/action-popup";
import browser from "webextension-polyfill";
import {
    DataChangedEvent,
    EnableForSiteMessage,
    EnableMessage,
    EventMessage,
    Message,
    ReadDataMessage
} from "./background/messsaging";
import {GlobalSettings, SiteSettings} from "./background/dataManager";
import {parseStorageKey} from "./background/utils";

console.log("action.ts");
console.log(window.location.href);


async function sendMessage(message: Message) {
        return await browser.runtime.sendMessage(message).catch((e) => {
            console.error(e);
            throw e;
        })
}

function onToggleEnabled(enabled: boolean) {
    console.log(enabled ? "Enable" : "Disable");
    browser.runtime.sendMessage<EnableMessage>({
        action: "enable",
        data: {
            enabled,
        }
    }).catch((e) => console.error(e))
}

function onToggleEnabledForSite(enabled: boolean, url?: string) {
    console.log(enabled ? "Enable" : "Disable", "for site:", url);
    browser.runtime.sendMessage<EnableForSiteMessage>({
        action: "enableForSite",
        data: {
            enabled,
            url,
        }
    }).catch((e) => console.error(e))
}

async function readData(key: string) {
    const data: any = await browser.runtime.sendMessage<ReadDataMessage>({action: "readData", data: {key}})
    return data;
}

async function getSettings(): Promise<{
    enabled: boolean,
    keepFreeSelectorEnabled: boolean,
    freeSelector: boolean,
    actionIcon: string
}> {
    const s = {
        enabled: await readData("settings.enabled"),
        keepFreeSelectorEnabled: await readData("settings.keepFreeSelectorEnabled"),
        freeSelector: await readData("settings.freeSelector"),
        actionIcon: await readData("settings.actionIcon")
    };
    console.log("Settings:", s);
    return s;
}

async function getSettingsForSite(): Promise<SiteSettings> {
    console.log("Getting settings");
    const settings: any = await browser.runtime.sendMessage<Message>({
        action: "getSiteSettings"
    });
    console.log("Site settings:", settings);
    return settings;
}


const root = createRoot(document.getElementById('react-root')!);

console.log("calling getSettingsForSite()")
let siteSettings: SiteSettings = await getSettingsForSite();
console.log('done')
const domainName = siteSettings.url;
let settings = await getSettings();


const port = browser.runtime.connect({name: "action-popup"});
port.onMessage.addListener(async (message: any) => {
    if(message.action && message.action === "greeting") {
        console.log("Greeting received:", message);
        siteSettings = await getSettingsForSite()
        settings = await getSettings();
        console.log("siteSettings", siteSettings);
        root.render(ActionPopup({siteSettings, enabledGlobally: settings.enabled, onToggleEnabled, onToggleEnabledForSite}));
    }
    const e = message as DataChangedEvent;
    console.log("Event received:");
    if(e.event !== "dataChanged") return;
    console.log("key : ", e.data.key, "\nvalue : ", e.data.value)
    if(e.data.key === "settings.enabled")
        root.render(ActionPopup({siteSettings, enabledGlobally: e.data.value, onToggleEnabled, onToggleEnabledForSite}));
    else if(e.data.key.startsWith("settings.sites")) {
        const changedKey = parseStorageKey(e.data.key)!.pop() as string;
        siteSettings = await getSettingsForSite();
        console.log("new siteSettings: ", siteSettings, "\nchangedKey:", changedKey);
        root.render(ActionPopup({siteSettings, enabledGlobally: settings.enabled, onToggleEnabled, onToggleEnabledForSite}));
    }
})

port.postMessage({action: "addDataChangeListener", data: {keys: [
    "settings.**"
        ]}})

root.render(ActionPopup({siteSettings, enabledGlobally: settings.enabled, onToggleEnabled, onToggleEnabledForSite}));