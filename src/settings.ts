import {createRoot} from "react-dom/client";
import SettingsPage from "./settings/SettingsPage";
import browser from "webextension-polyfill";
import {EventMessage, Message, SetKeepFreeSelectorEnabledMessage} from "./background/messsaging";
import {GlobalSettings} from "./background/dataManager";
import {parseStorageKey} from "./background/utils";

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

let settings = (await browser.runtime.sendMessage({action: "getSettings"})) as GlobalSettings;
const port = browser.runtime.connect({name: "settings-page"});

port.onMessage.addListener((message: any) => {
    console.log("Message received:", message);
    const m = message as EventMessage;
    if(m.event !== "dataChanged") return
    console.log("key : ", m.data.key, "\nvalue : ", m.data.value)
    if(m.data.key === "settings") settings = m.data.value as GlobalSettings;
    else {
        switch (m.data.key) {
            case "settings.keepFreeSelectorEnabled":
                settings.keepFreeSelectorEnabled = m.data.value;
                break;
            case "settings.enabled":
                settings.enabled = m.data.value;
                break;
            case "settings.sites":
                settings.sites = m.data.value;
                break;
            default: {
                if(m.data.key.startsWith("settings.sites[") || m.data.key.startsWith("settings.sites.")) {
                    const changedSite = parseStorageKey(m.data.key)![2] as string;
                    browser.runtime.sendMessage({action: "getSiteSettings", data: {url: changedSite}})
                        .then((siteSettings: any) => {
                            settings.sites[changedSite] = siteSettings
                            root.render(SettingsPage({settings, toggleKeepFreeSelectorEnabled, toggleGloballyEnabled, toggleSiteEnabled}));
                        })
                }
            }
        }
    }
    root.render(SettingsPage({settings, toggleKeepFreeSelectorEnabled, toggleGloballyEnabled, toggleSiteEnabled}));
})

port.postMessage({action: "addDataChangeListener", data: {keys: [
    "settings.**"
]}})


const rootElt = document.getElementById('react-root')!;
const root = createRoot(rootElt)

root.render(SettingsPage({settings, toggleKeepFreeSelectorEnabled, toggleGloballyEnabled, toggleSiteEnabled}));
