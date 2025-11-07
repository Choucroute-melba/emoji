import browser, {Tabs} from "webextension-polyfill";
import Tab = Tabs.Tab;

export function getCurrentWindowTabs() {
    return browser.tabs.query({currentWindow: true});
}

export function callOnActiveTab(callback: (tab: Tab, tabs: Tab[]) => void) {
    getCurrentWindowTabs().then((tabs) => {
        for (let tab of tabs) {
            if (tab.active) {
                callback(tab, tabs);
            }
        }
    });
}