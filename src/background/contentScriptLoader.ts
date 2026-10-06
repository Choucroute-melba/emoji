import browser, {tabs} from "webextension-polyfill";
import DataManager from "@src/background/dataManager";

export function handleActivatedTab(activeInfo: browser.Tabs.OnActivatedActiveInfoType, dm: DataManager) {
    console.log("Activated tab", activeInfo.tabId);

    if(!dm.hasConnection(`emoji-tab-${activeInfo.tabId}`)) {
        loadContentScript(activeInfo.tabId);
    }
    else {
        // Check if the content script is still responsive by sending a ping message
        tabs.sendMessage(activeInfo.tabId, "ping")
            .then(response => {
                if(!(response as string).startsWith("pong")) {
                    console.warn("Unexpected response from content script:", response);
                }
                else {
                    console.log("Content script is already loaded for tab", activeInfo.tabId);
                }
            })
            .catch(err => {
                console.error("Error sending ping message:", err);
                loadContentScript(activeInfo.tabId);
            });
    }
}

export function handleTabUpdated(tabId: number, changeInfo: browser.Tabs.OnUpdatedChangeInfoType, tab: browser.Tabs.Tab, dm: DataManager) {
    if(changeInfo.status !== "complete")
        return;
    console.log("Updated tab", tabId);
    if(tab.active) {
        if(!dm.hasConnection(`emoji-tab-${tabId}`)) {
            loadContentScript(tabId);
        }
        else {
            // Check if the content script is still responsive by sending a ping message
            tabs.sendMessage(tabId, "ping")
                .then(response => {
                    if(!(response as string).startsWith("pong")) {
                        console.warn("Unexpected response from content script:", response);
                    }
                    else {
                        console.log("Content script is already loaded for tab", tabId);
                    }
                })
                .catch(err => {
                    console.error("Error sending ping message:", err);
                    loadContentScript(tabId);
                });
        }
    }
}

export async function handleExtensionInstalled(dm: DataManager) {
    console.log("Extension installed or updated");
    const tabsList = await tabs.query({active: true, currentWindow: true});
    for(const tab of tabsList) {
        if (tab.id !== undefined) {
            if (!dm.hasConnection(`emoji-tab-${tab.id}`)) {
                loadContentScript(tab.id);
            }
        }
    }
}

function loadContentScript(tabId: number) {
    tabs.executeScript(tabId, {file: "content-script-bundle.js"})
        .then(() => {
            console.log("Content script loaded for tab", tabId);
        })
        .catch(err => {
        console.error("Error loading content script:", err);
    });
}