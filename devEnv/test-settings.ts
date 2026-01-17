import {createRoot} from "react-dom/client";
import React from "react";
import SettingsPage from "../src/settings/SettingsPage";
import {EventMessage, Message} from "../src/background/messsaging";
import {GlobalSettings} from "../src/background/types";
import {parseStorageKey} from "../src/background/utils";
import {getEmojiFromUnicode} from "../src/emoji/emoji-content";
import {Emoji} from "emojibase"
import {getMostUsedEmoji} from "../src/emoji/emoji-content";
import {calculateEmojiScore, calculateEmojiSignals} from "../src/emoji/emoji";

export type EmojiUsageEntry = {
    count: number;
    firstUsed: number; // timestamp ms
    lastUsed: number;  // timestamp ms
};

export type EmojiUsage = { [emoji: string]: EmojiUsageEntry };

export type SiteSettings = {
    url: string;
    enabled: boolean;
    freeSelector: boolean;
};

export type SitesMap = Record<string, SiteSettings>;

export type Settings = {
    enabled: boolean;
    freeSelector: boolean;
    keepFreeSelectorEnabled: boolean;
    actionIcon: string;
    allowEmojiSuggestions: boolean;
    sites: SitesMap;
};

export type SampleData = {
    emojiUsage: EmojiUsage;
    favoriteEmojis: string[];
    settings: GlobalSettings;
};

function toggleKeepFreeSelectorEnabled(enable: boolean) {
    console.log("toggleKeepFreeSelectorEnabled", enable);
}

function toggleGloballyEnabled(enable: boolean) {
    console.log("toggleGloballyEnabled", enable);
}

function toggleFreeSelectorGloballyEnabled(enable: boolean) {
    console.log("toggleFreeSelectorGloballyEnabled", enable);
}

function toggleSiteEnabled(url: string, enable: boolean) {
    console.log("toggleSiteEnabled", url, enable);
}

function toggleAllowEmojiSuggestions(allow: boolean) {
    console.log("toggleAllowEmojiSuggestions", allow);
}

async function deleteUsageData() {
    console.log("deleteUsageData");
    window.location.reload();
}

function toggleFavoriteEmoji(emoji: Emoji | string) {
    console.log("toggleFavoriteEmoji", emoji);
    const index = favoriteEmojis.findIndex((e) => e.emoji === (typeof emoji === "string" ? emoji : emoji.emoji));
    if(index >= 0) favoriteEmojis.splice(index, 1);
    else {
        if(typeof emoji === "string")
            getEmojiFromUnicode(emoji)!.then(emoji =>
                emoji && favoriteEmojis.push(emoji))
        else
            favoriteEmojis.push(emoji);
    }
}

function setEmojiLocale(locale: string) {
    console.log("setEmojiLocale", locale);
    // @ts-expect-error
    settings.emojiLocale = locale
    renderSettings()
}

function renderSettings() {
/*    root.render(React.createElement(SettingsPage, {
        settings,
        usageData,
        favoriteEmojis,
        toggleKeepFreeSelectorEnabled,
        toggleGloballyEnabled,
        toggleFreeSelectorGloballyEnabled,
        toggleSiteEnabled,
        toggleAllowEmojiSuggestions,
        deleteUsageData,
        toggleFavoriteEmoji,
        setEmojiLocale
    }))*/

}

const messageListener = (message: any) => {
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

                }
            }
        }
    }
    renderSettings();
}

const res = await fetch("sample-data.json")
const ejData = await res.json() as SampleData;

let settings = ejData.settings;

const ejUsageData = ejData.emojiUsage
const data = await getMostUsedEmoji()
const scores = data.scores
const mostUsedEmojis = data.emojis

const usageData = new Map<Emoji, {count: number, firstUsed: number, lastUsed: number, recency: number, frequency: number, score: number}>();
for (const emoji of mostUsedEmojis) {
    const usage = ejUsageData[emoji.emoji];
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

const favoriteEmojisUnicodes = ejData.favoriteEmojis;
const favoriteEmojis: Emoji[] = [];
for(const u of favoriteEmojisUnicodes) {
    const emojiData = await getEmojiFromUnicode(u) // TODO: avoid repeated calls to this function
    favoriteEmojis.push(emojiData!);
}

const rootElt = document.getElementById('react-root')!;
const root = createRoot(rootElt)



renderSettings();
