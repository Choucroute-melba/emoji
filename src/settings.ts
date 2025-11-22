import {createRoot} from "react-dom/client";
import SettingsPage from "./settings/SettingsPage";
import browser from "webextension-polyfill";
import {EventMessage, Message, SetKeepFreeSelectorEnabledMessage} from "./background/messsaging";
import {GlobalSettings} from "./settings/settingsManager";

function toggleKeepFreeSelectorEnabled(enable: boolean) {
    browser.runtime.sendMessage({
        action: "setKeepFreeSelectorEnabled",
        data: {
            enabled: enable,
        }
    } as SetKeepFreeSelectorEnabledMessage)
}

function toggleGloballyEnabled(enable: boolean) {
    browser.runtime.sendMessage({
        action: "enable",
        data: {
            enabled: enable,
        }
    } as Message)
}

function toggleSiteEnabled(url: string, enable: boolean) {
    browser.runtime.sendMessage({
        action: "enableForSite",
        data: {
            enabled: enable,
            url: url,
        }
    })
}

const port = browser.runtime.connect({name: "settings-page"});

port.onMessage.addListener((message: any) => {
    console.log("Message received:", message);
    const m = message as EventMessage;
    switch (m.event) {
        case "settingsUpdated":
            root.render(SettingsPage({settings: m.data.settings, toggleKeepFreeSelectorEnabled, toggleGloballyEnabled, toggleSiteEnabled}));
            break;
        case "siteSettingsUpdated":
            browser.runtime.sendMessage({action: "getSettings"}).then((settings) => {
                root.render(SettingsPage({settings: settings as GlobalSettings, toggleKeepFreeSelectorEnabled, toggleGloballyEnabled, toggleSiteEnabled}));
            })
    }
})

port.postMessage({action: "addSettingsListener"} as Message)
port.postMessage({action: "addSiteSettingsListener"} as Message)

const settings = (await browser.runtime.sendMessage({action: "getSettings"})) as GlobalSettings;

const rootElt = document.getElementById('react-root')!;
const root = createRoot(rootElt)

root.render(SettingsPage({settings, toggleKeepFreeSelectorEnabled, toggleGloballyEnabled, toggleSiteEnabled}));
