import browser, {Tabs} from "webextension-polyfill";
import Tab = Tabs.Tab;

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