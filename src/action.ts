import {createRoot} from 'react-dom/client';
import ActionPopup from "./action-popup/action-popup";
import browser from "webextension-polyfill";
import {DataChangedEvent, EnableForSiteMessage, EnableMessage, Message, ReadDataMessage} from "./background/messsaging";
import {SiteSettings} from "./background/dataManager";
import {parseStorageKey} from "./background/utils";
import {applyTheme} from "@theme/theme-utils";

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
    return {
        enabled: await readData("settings.enabled"),
        keepFreeSelectorEnabled: await readData("settings.keepFreeSelectorEnabled"),
        freeSelector: await readData("settings.freeSelector"),
        actionIcon: await readData("settings.actionIcon")
    };
}

async function getSettingsForSite(): Promise<SiteSettings> {
    console.log("Getting settings");
    return (await browser.runtime.sendMessage<Message>({
        action: "getSiteSettings"
    })) as SiteSettings;
}

await applyTheme()
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
        root.render(ActionPopup({siteSettings, enabledGlobally: settings.enabled, keepFreeSelectorEnabled: settings.keepFreeSelectorEnabled, onToggleEnabled, onToggleEnabledForSite}));
    }
    const e = message as DataChangedEvent;
    if(e.event !== "dataChanged") return;

    if(e.data.key === "settings.enabled") {
        settings.enabled = e.data.value;
    }
    if(e.data.key === "settings.keepFreeSelectorEnabled") {
        settings.keepFreeSelectorEnabled = e.data.value;
    }
    if(e.data.key.startsWith("settings.sites")) {
        const changedKey = parseStorageKey(e.data.key)!.pop() as string;
        siteSettings = await getSettingsForSite();
        console.log("new siteSettings: ", siteSettings, "\nchangedKey:", changedKey);
    }
    root.render(ActionPopup({
        siteSettings,
        enabledGlobally: settings.enabled,
        keepFreeSelectorEnabled: settings.keepFreeSelectorEnabled,
        onToggleEnabled,
        onToggleEnabledForSite
    }));
})

port.postMessage({action: "addDataChangeListener", data: {keys: [
    "settings.**"
        ]}})

root.render(ActionPopup({siteSettings, enabledGlobally: settings.enabled, keepFreeSelectorEnabled: settings.keepFreeSelectorEnabled, onToggleEnabled, onToggleEnabledForSite}));