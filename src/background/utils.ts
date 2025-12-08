import browser, {Tabs} from "webextension-polyfill";
import Tab = Tabs.Tab;
import DataManager from "./dataManager";
import {Emoji} from "../emoji/emoji";

export function getCurrentWindowTabs() {
    return browser.tabs.query({currentWindow: true});
}

export async function callOnActiveTab(callback: (tab: Tab, tabs: Tab[]) => void) {
    const tabs = await getCurrentWindowTabs()
    for (let tab of tabs) {
        if (tab.active) {
            callback(tab, tabs);
        }
    }
    return null
}

export async function getActiveTab() {
    const tabs = await getCurrentWindowTabs()
    for (let tab of tabs) {
        if (tab.active) {
            return tab;
        }
    }
    return null
}

export async function getActiveTabUrl(): Promise<string> {
    const tab = await getActiveTab();
    if (!tab) throw new Error("No active tab");
    if (!tab.url || tab.url === "") throw new Error("No tab url (maybe no active tab?)");
    return tab.url;
}

export function getDomainName(url: string) {
    let domain = ""
    try {
        domain = new URL(url).host
    } catch (e) {
        domain = url
    }
    if(domain === "")
        domain = url
    return domain
}

export function parseStorageKey(key: string | null) {
    let parsedKey: string[] | null = []
    if(key == null) {
        parsedKey = null
    }
    else {
        let k = ""
        for (let i = 0; i < key.length; i++ ) {
            const c = key[i];
            if (c == ".") {
                if(k === "") continue;
                parsedKey.push(k)
                k = ""
            }
            else if (c == "[") {
                if(k !== "") parsedKey.push(k);
                k = ""
                const end = key.indexOf("]", i);
                if (end === -1) {
                    console.error(`Error reading setting ${key}: missing closing bracket ']'`);
                    return undefined;
                }
                parsedKey.push(k + key.substring(i + 1, end))
                i = end
                if(i + 1 < key.length && key[i+1] == ".")
                    i++
            }
            else
                k += c
        }
        if(k !== "")
            parsedKey.push(k)
    }
    return parsedKey;
}
export function getStorageKey(prefix: string, prop: symbol | string): string {
    let key = prefix
    if (typeof prop === "string" && prop !== "") {
        if(prop.includes(".") || prop.includes("[") ||
            prop.includes("]") || prop.includes(" ") ||
            prop.includes("'") || prop.includes('"') || prop.includes(":") ||
            prop.includes("/")
        )
            key += "[" + prop + "]"
        else
            key += "." + prop
    } else {
        key += "[" + prop.toString() + "]"
    }
    return key
}

export function getMostUsedEmoji(emojis: typeof DataManager.prototype.emojiUsage, items: number = 10): { e: string, score: number }[] {
    let map = new Map<string, number>()
    const emojisList = Object.keys(emojis)
    for (const emojiName of emojisList) {
        const emoji = emojis[emojiName]
        const score = calculateEmojiScore(emoji)
        map.set(emojiName, score)
    }
    const mostUsedEmojis = Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, items)
    return mostUsedEmojis.map(([e, score]) => ({e, score}))
}

export function calculateEmojiSignals({count, firstUsed, lastUsed}: { count: number, firstUsed: number, lastUsed: number}) {
    let frequency = ((lastUsed - firstUsed)) / count
    let recency = 1 / ((Date.now() - lastUsed) / (1000 * 60 * 60 * 24))
    console.log(`Count: ${count}, DeltaTime: ${lastUsed - firstUsed}\nFrequency: ${frequency}, Recency: ${recency}`)
    return {frequency, recency}
}

export function calculateEmojiScore({count, firstUsed, lastUsed}: { count: number, firstUsed: number, lastUsed: number}): number {
    const {frequency, recency} = calculateEmojiSignals({count, firstUsed, lastUsed})
    return frequency * recency
}