import React from 'react';
import {createRoot, Root} from 'react-dom/client';
import ActionPopup from "./action-popup/action-popup";
import browser from "webextension-polyfill";
import {EventMessage, Message} from "./background/messsaging";
import {GlobalSettings, SiteSettings} from "./settings/settingsManager";

console.log("action.ts");
console.log(window.location.href);

function sendMessage(message: Message) {
    return browser.runtime.sendMessage(message);
}

function onToggleEnabled(enabled: boolean) {
    console.log("Enabled:", enabled);
    sendMessage({
        action: "enable",
        data: {
            enabled,
        }
    });
}

function onToggleEnabledForSite(enabled: boolean, url?: string) {
    console.log("Enabled:", enabled, "for site:", url);
    sendMessage({
        action: "enableForSite",
        data: {
            enabled,
            url,
        }
    });
}

async function getSettings(): Promise<GlobalSettings> {
    const settings: any = await sendMessage({
        action: "getSettings",
    });
    return settings;
}

async function getSettingsForSite(): Promise<SiteSettings> {
    const settings: any = await sendMessage({
        action: "getSiteSettings"
    });
    return settings;
}
const siteSettings = await getSettingsForSite();
console.log("siteSettings", siteSettings);

const port = browser.runtime.connect({name: "action-popup"});


const root = createRoot(document.getElementById('react-root')!);

port.onMessage.addListener((message: any) => {
    const e = message as EventMessage;
    console.log("Event received:", e);
    switch (e.event) {
        case "siteSettingsUpdated":
            root.render(ActionPopup({siteSettings: e.data.settings, onToggleEnabled, onToggleEnabledForSite}));
            break;
    }
})

port.postMessage({
    action: "addSiteSettingsListener"
} as Message)

root.render(ActionPopup({siteSettings, onToggleEnabled, onToggleEnabledForSite}));