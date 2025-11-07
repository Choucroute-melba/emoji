import React from 'react';
import {createRoot, Root} from 'react-dom/client';
import ActionPopup from "./action-popup/action-popup";
import browser from "webextension-polyfill";
import {EventMessage, Message} from "./background/messsaging";
import {GlobalSettings, SiteSettings} from "./settings/settingsManager";

console.log("action.ts");
console.log(window.location.href);

const port = browser.runtime.connect({name: "action-popup"});

function sendMessage(message: Message) {
    return browser.runtime.sendMessage(message);
}

function onToggleEnabled(enabled: boolean) {
    console.log(enabled ? "Enable" : "Disable");
    sendMessage({
        action: "enable",
        data: {
            enabled,
        }
    }).catch((e) => console.error(e))
}

function onToggleEnabledForSite(enabled: boolean, url?: string) {
    console.log(enabled ? "Enable" : "Disable", "for site:", url);
    sendMessage({
        action: "enableForSite",
        data: {
            enabled,
            url,
        }
    }).catch((e) => console.error(e))
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


const root = createRoot(document.getElementById('react-root')!);

port.onMessage.addListener((message: any) => {
    if(message.action && message.action === "greeting") {
        getSettingsForSite().then((siteSettings) => {
            console.log("siteSettings", siteSettings);
            root.render(ActionPopup({siteSettings, onToggleEnabled, onToggleEnabledForSite}));
        })
    }
    const e = message as EventMessage;
    console.log("Event received:", e);
    switch (e.event) {
        case "siteSettingsUpdated":
            console.log("new siteSettings", e.data.settings);
            root.render(ActionPopup({siteSettings: e.data.settings, onToggleEnabled, onToggleEnabledForSite}));
            break;
        case "settingsUpdated":
            console.log("new settings", e.data.settings);
            getSettingsForSite().then((siteSettings) => {
                console.log("siteSettings", siteSettings);
                root.render(ActionPopup({siteSettings, onToggleEnabled, onToggleEnabledForSite}));
            })
            break;
    }
})

port.postMessage({action: "addSiteSettingsListener"} as Message)
port.postMessage({action: "addSettingsListener"} as Message)

// root.render(ActionPopup({siteSettings, onToggleEnabled, onToggleEnabledForSite}));