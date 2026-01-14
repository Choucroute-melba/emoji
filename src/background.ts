import browser, {Runtime, Tabs} from "webextension-polyfill";
import {Message} from "./background/messsaging";
import {getDomainName} from "./background/utils";
import {callOnActiveTab, getActiveTab, getActiveTabUrl} from './background/tabs-utils'
import DataManager, {SiteSettings} from "./background/dataManager";
import MessageSender = Runtime.MessageSender;
import {
    getEmojiDataset,
    getEmojiFromShortCode,
    getEmojiFromUnicode,
    getMostUsedEmoji,
    loadEmojiDataset,
    searchEmoji
} from "./emoji/emoji";
import {Emoji} from "emojibase";

console.log("background.ts");

const build = browser.runtime.getManifest().name.includes("Dev") ? "beta" : "stable"
browser.runtime.setUninstallURL("https://emojeezer-website.vercel.app/?b=" + build)
    .then(() => console.log("Uninstall URL set to https://emojeezer-website.vercel.app/"))
    .catch(err => console.error("Error while setting uninstall URL:", err))

browser.runtime.onInstalled.addListener(async ({reason, temporary}) => {
    if(temporary) return;
    switch (reason) {
        case "install": {
            console.log("Installing extension")
            fetch("https://emojeezer-website.vercel.app/api/onboard", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    version: browser.runtime.getManifest().version,
                    build: build
                })
            }).catch(err => console.error("Error while sending onboard request:", err))
        }
        break;
        case "update": {
            console.log("Updating extension")
            fetch("https://emojeezer-website.vercel.app/api/update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    toVersion: browser.runtime.getManifest().version,
                    build: build
                })
            }).catch(err => console.error("Error while sending update request:", err))
        }
    }
})

const dm = new DataManager();
console.log("Initializing storage")
dm.initializeStorage();

function listener(message: any, sender: MessageSender): Promise<unknown> {

    const p = new Promise<unknown>(async (r, reject) => {
        const resolve = (value: unknown) => {
            console.groupEnd();
            r(value);
        }
        const m = message as Message;
        const activeTab = await getActiveTab()
        console.groupCollapsed(`%c${message.action || message.event}%c`,
            'color: #FFC300; background-color: #201800; border-radius: 3px; padding: 2px 4px;',
            'color: default; background-color: default', message.data);
        console.log("from: ", sender.tab ? `${sender.tab.id} ${sender.tab.url}` : `${sender.url} - ${activeTab?.id} ${activeTab?.url}`);

        switch (m.action) {
            case "readData":
                if(typeof m.data.key === "string")
                    resolve(await dm.readData(m.data.key));
                else if(Array.isArray(m.data.key)) {
                    const result: {[key: string]: any} = {};
                    for(const key of m.data.key) {
                        result[key] = await dm.readData(key);
                    }
                    resolve(result);
                }
                resolve(undefined);
                break;
            case "getSettings":
                resolve(dm.readonlySettings)
                break;
            case "getSiteSettings": {
                let url = ""
                if (!m.data?.url) {
                    url = await getActiveTabUrl()
                } else url = m.data.url;

                const domain = getDomainName(url)
                let settings: SiteSettings = dm.readonlySettings.sites[domain];
                if (!settings) {
                    settings = {
                        url: domain,
                        enabled: true,
                        freeSelector: true
                    }
                }
                resolve(settings);
            }
                break;
            case "getEffectiveModeOnSite": {
                let url = ""
                if(!m.data?.url)
                    url = await getActiveTabUrl()
                else url = m.data.url
                const domain = getDomainName(url)
                let settings: SiteSettings = dm.readonlySettings.sites[domain];
                if (!settings) {
                    settings = {
                        url: domain,
                        enabled: true,
                        freeSelector: true
                    }
                }
                 if(!dm.settings.freeSelector) // free selector is disabled globally
                    settings.freeSelector = false;
                if(!dm.settings.enabled) { // autocomplete is disabled globally
                    settings.enabled = false;
                    if(!dm.settings.keepFreeSelectorEnabled)
                        settings.freeSelector = false;
                }
                if(!settings.enabled && !dm.settings.keepFreeSelectorEnabled) // don't keep the free selector if autocomplete is disabled for the site
                    settings.freeSelector = false;
                resolve(settings);
            }
                break;
            case "enable":
                dm.settings.enabled = m.data.enabled;
                resolve(true);
                break;
            case "enableForSite": {
                let url = ""
                if (!m.data.url) {
                    url = await getActiveTabUrl()
                } else url = m.data.url;
                if (dm.settings.sites[url]) {
                    dm.settings.sites[url].enabled = m.data.enabled;
                }
                else if(!m.data.enabled) {
                    dm.settings.sites[url] = {
                        url: url,
                        enabled: m.data.enabled,
                        freeSelector: true,
                    }
                }
                resolve(true);
            }
                break;
            case "enableFreeSelector":
                dm.settings.freeSelector = m.data.enabled;
                resolve(true);
                break;
            case "enableFreeSelectorForSite": {
                console.info("enableFreeSelectorForSite not implemented yet") // TODO
                resolve(true);
            }
                break;
            case "setKeepFreeSelectorEnabled":
                dm.settings.keepFreeSelectorEnabled = m.data.enabled;
                resolve(true);
                break
            case "reportEmojiUsage":
                if(!dm.emojiUsage[m.data.emoji]) {
                    dm.emojiUsage[m.data.emoji] = {count: 1, firstUsed: Date.now(), lastUsed: Date.now()}
                }
                else {
                    dm.emojiUsage[m.data.emoji].count++;
                    dm.emojiUsage[m.data.emoji].lastUsed = Date.now();
                }
                resolve(true);
                break;
            case "getMostUsedEmoji": {
                const data = getMostUsedEmoji(dm, m.data?.count)
                resolve(data);
            }
            break;
            case "setAllowEmojiSuggestions":
                dm.settings.allowEmojiSuggestions = m.data.allow
                resolve(true);
                break;
            case "deleteUsageData":
                dm.deleteEmojiUsage();
                resolve(true);
                break;
            case "toggleFavoriteEmoji": {
                const index = dm.favoriteEmojis.indexOf(m.data.emoji)
                if(index == -1)
                    dm.favoriteEmojis.push(m.data.emoji);
                else {
                    await dm.removeFavoriteEmoji(m.data.emoji);
                }
                resolve(true);
            }
            break
            case "getFavoriteEmojis": {
                const unicodes = dm.favoriteEmojis;
                const emojis: Emoji[] = []
                for(const e of unicodes) {
                    const emojiData = getEmojiFromUnicode(e)
                    if(!emojiData)
                        throw new Error(`non existent emoji: ${e}`)
                    emojis.push(emojiData);
                }
                resolve(emojis);
            }
            break;
            case "searchEmojis": {
                if(!getEmojiDataset("en"))
                    await loadEmojiDataset("en")
                resolve(searchEmoji(m.data.query, dm, m.data.options))
            }
            break;
            case "getEmojiFromShortCode":
                resolve(getEmojiFromShortCode(m.data.sc))
                break;
            case "getEmojiFromUnicode":
                resolve(getEmojiFromUnicode(m.data.u))
                break;
            case "getTabId":
                resolve(sender.tab?.id);
                break;
            default:
                reject(`Unknown action: ${m.action}`)
                break;
        }
    })
    return p;
}

browser.runtime.onMessage.addListener(listener)

browser.commands.onCommand.addListener((command, tab) => {
    console.log(`Command ${command} for tab ${tab?.id} triggered.`)
    if(!tab) {
        console.warn("No tab information available for command:", command)
        return
    }
    if(tab.id === undefined) {
        console.warn("Tab id is undefined for command:", command)
        return
    }
    browser.tabs.sendMessage<string>(tab.id, command)
})