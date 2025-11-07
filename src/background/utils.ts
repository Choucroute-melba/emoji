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