import {createRoot} from "react-dom/client";
import SettingsPage from "./settings/SettingsPage";
import browser from "webextension-polyfill";
import {EventMessage, Message, SetKeepFreeSelectorEnabledMessage} from "./background/messsaging";
import {GlobalSettings} from "./background/dataManager";
import {parseStorageKey} from "./background/utils";
import {getEmojiFromUnicode, getMostUsedEmoji} from "./emoji/emoji-content";
import {Emoji} from "emojibase"
import React from "react";
import {calculateEmojiScore, calculateEmojiSignals} from "./emoji/emoji";

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

function toggleFavoriteEmoji(emoji: Emoji | string) {
    browser.runtime.sendMessage({
        action: "toggleFavoriteEmoji",
        data: {
            emoji: typeof emoji === "string" ? emoji : emoji.emoji
        }
    } as Message)
    const index = favoriteEmojis.findIndex((e) => e.emoji === (typeof emoji === "string" ? emoji : emoji.emoji));
    if(index >= 0) favoriteEmojis.splice(index, 1);
    else {
        if(typeof emoji === "string")
            getEmojiFromUnicode(emoji).then(emoji =>
                emoji && favoriteEmojis.push(emoji))
        else
            favoriteEmojis.push(emoji);
    }
    renderSettings();
}

function renderSettings() {
    root.render(React.createElement(SettingsPage, {
        settings,
        usageData: usageInfos,
        favoriteEmojis,
        toggleKeepFreeSelectorEnabled,
        toggleGloballyEnabled,
        toggleFreeSelectorGloballyEnabled,
        toggleSiteEnabled,
        toggleAllowEmojiSuggestions,
        deleteUsageData,
        toggleFavoriteEmoji
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

const mostUsed = (await getMostUsedEmoji()).emojis;
const usageData = await browser.runtime.sendMessage<Message>({
    action: "readData",
    data: {
        key: mostUsed.map(emoji => `emojiUsage[${emoji.emoji}]`)
    }
}) as {[key: string]: any}
const usageInfos = new Map<Emoji, {count: number, firstUsed: number, lastUsed: number, recency: number, frequency: number, score: number}>();
for (const emoji of mostUsed) {
    const usage = usageData[`emojiUsage[${emoji.emoji}]`] as {count: number, firstUsed: number, lastUsed: number}
    const signals = calculateEmojiSignals(usage)
    const score = calculateEmojiScore(usage)
    usageInfos.set(emoji, {
        count: usage.count,
        firstUsed: usage.firstUsed,
        lastUsed: usage.lastUsed,
        recency: signals.recency,
        frequency: signals.frequency,
        score: score
    });
}

const favoriteEmojis = (await browser.runtime.sendMessage({action: "getFavoriteEmojis"})) as Emoji[];

const rootElt = document.getElementById('react-root')!;
const root = createRoot(rootElt)



renderSettings();
