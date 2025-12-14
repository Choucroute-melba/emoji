import {createRoot} from "react-dom/client";
import SettingsPage from "./settings/SettingsPage";
import browser from "webextension-polyfill";
import {EventMessage, Message, SetKeepFreeSelectorEnabledMessage} from "./background/messsaging";
import {GlobalSettings} from "./background/dataManager";
import {calculateEmojiScore, calculateEmojiSignals, parseStorageKey} from "./background/utils";
import {Emoji} from "./emoji/emoji";
import React from "react";

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

function toggleFreeSelectorGloballyEnabled(enable: boolean) {
    browser.runtime.sendMessage({
        action: "enableFreeSelector",
        data: {
            enabled: enable,
        }
    })
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

function toggleAllowEmojiSuggestions(allow: boolean) {
    browser.runtime.sendMessage({
        action: "setAllowEmojiSuggestions",
        data: {
            allow: allow,
        }
    })
}

async function deleteUsageData() {
    await browser.runtime.sendMessage({action: "deleteUsageData"})
    window.location.reload();
}

function renderSettings() {
    root.render(React.createElement(SettingsPage, {
        settings,
        usageData,
        toggleKeepFreeSelectorEnabled,
        toggleGloballyEnabled,
        toggleFreeSelectorGloballyEnabled,
        toggleSiteEnabled,
        toggleAllowEmojiSuggestions,
        deleteUsageData
    }))

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
            case "settings.freeSelector":
                settings.freeSelector = m.data.value;
                break;
            case "settings.allowEmojiSuggestions":
                settings.allowEmojiSuggestions = m.data.value;
                break;
            default: {
                if(m.data.key.startsWith("settings.sites[") || m.data.key.startsWith("settings.sites.")) {
                    const changedSite = parseStorageKey(m.data.key)![2] as string;
                    browser.runtime.sendMessage({action: "getSiteSettings", data: {url: changedSite}})
                        .then((siteSettings: any) => {
                            settings.sites[changedSite] = siteSettings
                            renderSettings();
                        })
                }
            }
        }
    }
    renderSettings();
})

port.postMessage({action: "addDataChangeListener", data: {keys: [
    "settings.**"
]}})

const mostUsedEmojis = (await browser.runtime.sendMessage({action: "getMostUsedEmoji", data: {limit: -1}})) as Emoji[];
const usageData = new Map<Emoji, {count: number, firstUsed: number, lastUsed: number, recency: number, frequency: number, score: number}>();
for (const emoji of mostUsedEmojis) {
    const usage = await browser.runtime.sendMessage({action: "readData", data: {key: "emojiUsage[" + emoji.unicode + "]"}} as Message) as {count: number, firstUsed: number, lastUsed: number}
    const signals = calculateEmojiSignals(usage)
    const score = calculateEmojiScore(usage)
    usageData.set(emoji, {
        count: usage.count,
        firstUsed: usage.firstUsed,
        lastUsed: usage.lastUsed,
        recency: signals.recency,
        frequency: signals.frequency,
        score: score
    });
}



const rootElt = document.getElementById('react-root')!;
const root = createRoot(rootElt)



renderSettings();
