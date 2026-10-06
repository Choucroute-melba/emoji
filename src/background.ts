import './background/user-engagement'
import browser, {Runtime} from "webextension-polyfill";
import {listener} from "@src/background/messagesListener";
import DataManager from "./background/dataManager";
import MessageSender = Runtime.MessageSender;
import {
    getEmojiImageUrl, getEmojiOfTheDay, setActionIcon
} from "./emoji/emoji";
import {handleActivatedTab, handleExtensionInstalled, handleTabUpdated} from "@src/background/contentScriptLoader";

console.log("background.ts");


const dm = new DataManager();

console.log("1 - Initializing storage")
dm.initializeStorage()

if(!dm.storageReady) {
    console.log("Waiting for storage to be ready...")
    await dm.storageReadyPromise
}

console.log("2 - Setting up message listener")
browser.runtime.onMessage.addListener(async (message: any, sender: MessageSender) => {
    return listener(message, sender, dm)
})

console.log("3 - Setting up command listener")
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
    browser.tabs.sendMessage<string>(tab.id, command).catch((e) => {
        console.error("Error while sending command to tab", tab.id, e)
    })
})

console.log("4 - Setting up script loaders")
browser.tabs.onActivated.addListener(activeInfo => {
    handleActivatedTab(activeInfo, dm)
})

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    handleTabUpdated(tabId, changeInfo, tab, dm)
}, {
    properties: ["status"]
})

console.log("5 - Loading content scripts for all active tabs")
await handleExtensionInstalled(dm)

console.log("done")

console.log("Loading done, getting daily emoji.")

getEmojiOfTheDay(dm.settings.emojiLocale)
    .then(emoji => {
        if(dm.settings.useEmojiOfTheDay && emoji) { // set emoji as the action icon
            console.log("Setting action icon to emoji of the day:", emoji)
            setActionIcon(getEmojiImageUrl(emoji))
        }
        else {
            console.log("Setting action icon to default emoji:", dm.settings.actionIcon)
            setActionIcon(getEmojiImageUrl(dm.settings.actionIcon))
        }
    })

