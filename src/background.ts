import browser, {Runtime} from "webextension-polyfill";
import {Message} from "./background/messsaging";
import {callOnActiveTab, getActiveTab, getActiveTabUrl, getDomainName, getMostUsedEmoji} from "./background/utils";
import DataManager, {SiteSettings} from "./background/dataManager";
import MessageSender = Runtime.MessageSender;
import {Emoji, getEmojiFromUnicode} from "./emoji/emoji";

console.log("background.ts");

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
                resolve(await dm.readData(m.data.key));
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
                const scores = getMostUsedEmoji(dm.readonlyEmojiUsage, m.data?.count)
                const emojis: Emoji[] = []
                for(const e of scores) {
                    const emojiData = getEmojiFromUnicode(e.e)
                    if(!emojiData)
                        throw new Error(`non existent emoji: ${e.e}`)
                    emojis.push(emojiData);
                }
                resolve(emojis);
            }
            break;
            case "setAllowEmojiSuggestions":
                dm.settings.allowEmojiSuggestions = m.data.allow
                resolve(true);
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