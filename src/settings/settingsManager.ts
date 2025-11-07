import browser, {Runtime} from "webextension-polyfill";
import Port = Runtime.Port;
import {Message} from "../background/messsaging";

export type SiteSettings = {
    url: string,
    enabled: boolean,
    freeSelector: boolean,
    disabledGlobally?: boolean,
    freeSelectorDisabledGlobally?: boolean,
}

export type GlobalSettings = {
    enabled: boolean,
    freeSelector: boolean,
    sites: { [url: string]: SiteSettings },
}

export type SubscriptionScope = "siteSettings" | "globalSettings";

export default class SettingsManager {
    private connections: Port[] = [];
    private listeners: {name: string, subscriptions: SubscriptionScope[]}[] = []

    constructor() {
        browser.runtime.onConnect.addListener(this.onConnect.bind(this));
    }

    async initializeStorage() {
        const s = await browser.storage.sync.get([
            "settings.enabled",
            "settings.freeSelectorEnabled",
            "settings.disabledSites",
            "settings.freeSelectorDisabledSites",
        ])
        if(!s["settings.enabled"])
            await browser.storage.sync.set({
                "settings.enabled": true
            })
        if(!s["settings.freeSelectorEnabled"])
            await browser.storage.sync.set({
                "settings.freeSelectorEnabled": true
            })
        if(!s["settings.disabledSites"])
            await browser.storage.sync.set({
                "settings.disabledSites": []
            })
        if(!s["settings.freeSelectorDisabledSites"])
            await browser.storage.sync.set({
                "settings.freeSelectorDisabledSites": []
            })
    }

    private onConnect(p: Port) {
        if(this.getPort(p.name)) {
            console.info(`Port ${p.name} already exists`)
            const i = this.getPortIndex(p.name);
            this.connections[i].disconnect();
            this.connections[i] = p;
        }
        else
            this.connections.push(p);
        console.log("Connected to " + p.name + " (" + p.sender?.url + ")", JSON.stringify(p.sender?.tab))
        p.onMessage.addListener(this.onMessage.bind(this));
        p.postMessage({action: "greeting"})
    }

    private getPort(name: string) {
        return this.connections.find((p) => p.name == name);
    }

    private getPortIndex(name: string) {
        return this.connections.findIndex((p) => p.name == name);
    }

    private onMessage(message: any, sender: Port) {
        if(!message.action) throw new Error("Message has no action");
        let m = message as Message;
        console.log(`${m.action} from ${sender.name}`);
        switch (m.action) {
            case "addSiteSettingsListener":
                this.addListener(sender.name, ["siteSettings"]);
                break;
            case "addSettingsListener":
                this.addListener(sender.name, ["globalSettings"]);
                break;
        }
    }

    private addListener(name: string, subs: SubscriptionScope[]) {
        this.listeners.forEach(l => {
            if(l.name == name) {
                subs.forEach(s => {
                    if(!l.subscriptions.includes(s))
                        l.subscriptions.push(s);
                })
            }
        })
    }

    private async onSettingsChanged() {
        for (const l of this.listeners) {
            if(l.subscriptions.includes("globalSettings")) {
                const p = this.getPort(l.name);
                if(p) {
                    p.postMessage({
                        action: "settingsUpdated",
                        data: await this.getSettings()
                    })
                }
                else
                    console.error("Port not found");
            }
        }
    }

    private onSiteSettingsChanged(url: string) {
        const domain = new URL(url).hostname;
        const sitePorts = this.connections.filter((p) => p.sender?.url?.includes(domain));
        for (const p of sitePorts) {
            const listener = this.listeners.find((l) => l.name == p.name)
            if(listener && listener.subscriptions.includes("siteSettings")) {
                p.postMessage({
                    action: "siteSettingsUpdated",
                    data: {
                        settings: this.getSettingsForSite(url)
                    }
                })
            }
        }
    }

    async enableOnSite(url: string, enable: boolean) {
        console.log(enable ? "Enabled on" : "Disabled on", url);
        const disabledSites = await browser.storage.sync.get("settings.disabledSites").then((result: any) => {
            return result["settings.disabledSites"];
        })
        const domain = new URL(url).hostname;
        const index = disabledSites.indexOf(domain);
        if(enable && index >= 0)
                disabledSites.splice(index, 1);
        else if(!enable && index < 0)
                disabledSites.push(domain);
        else return
        await browser.storage.sync.set({
            "settings.disabledSites": disabledSites
        })
        this.onSiteSettingsChanged(url);
    }

    async enableGlobally(enable: boolean) {
        console.log((enable ? "Enabled" : "Disabled") + " on all sites");
        const enabledGlobally = await browser.storage.sync.get("settings.enabled").then((result: any) => {return result["settings.enabled"]})
        if(enabledGlobally == enable) return;
        await browser.storage.sync.set({
            "settings.enabled": enable
        })
        this.onSettingsChanged();
    }

    async enableFreeSelector(enabled: boolean, url?: string) {
        if(url)
            console.log((enabled ? "Enabled" : "Disabled") + " free selector on " + url);
        else
            console.log((enabled ? "Enabled" : "Disabled") + " free selector");
        if(url) {
            const freeSelectorDisabledSites = await browser.storage.sync.get("settings.freeSelectorDisabledSites").then((result: any) => {
                return result["settings.freeSelectorDisabledSites"];
            })
            const domain = new URL(url).hostname;
            const index = freeSelectorDisabledSites.indexOf(domain);
            if(enabled && index >= 0)
                freeSelectorDisabledSites.splice(index, 1);
            else if(!enabled && index < 0)
                freeSelectorDisabledSites.push(domain);
            else return
            await browser.storage.sync.set({
                "settings.freeSelectorDisabledSites": freeSelectorDisabledSites
            })
            this.onSiteSettingsChanged(url);
        }
    }

    async getSettingsForSite(url: string): Promise<SiteSettings> {
        let globallyEnabled: boolean;
        let globallyFreeSelector: boolean;
        let disabledSites: string[];
        let freeSelectorDisabledSites: string[];
        globallyEnabled = await browser.storage.sync.get("settings.enabled").then((result: any) => {return result["settings.enabled"]})
        globallyFreeSelector = await browser.storage.sync.get("settings.freeSelectorEnabled").then((result: any) => {return result["settings.freeSelectorEnabled"]})
        disabledSites = await browser.storage.sync.get("settings.disabledSites").then((result: any) => {return result["settings.disabledSites"]})
        freeSelectorDisabledSites = await browser.storage.sync.get("settings.freeSelectorDisabledSites").then((result: any) => {return result["settings.freeSelectorDisabledSites"]})
        const domain = new URL(url).hostname;
        const siteSettings: SiteSettings = {
            url: domain,
            enabled: globallyEnabled && !disabledSites.includes(domain),
            freeSelector: globallyFreeSelector && !freeSelectorDisabledSites.includes(domain)
        }
        if(!globallyEnabled)
            siteSettings.disabledGlobally = true;
        if(!globallyFreeSelector)
            siteSettings.freeSelectorDisabledGlobally = true;
        return siteSettings;
    }

    async getSettings(): Promise<GlobalSettings> {
        let globallyEnabled: boolean;
        let globallyFreeSelector: boolean;
        let disabledSites: string[];
        let freeSelectorDisabledSites: string[] = [];
        globallyEnabled = await browser.storage.sync.get("settings.enabled").then((result: any) => {return result["settings.enabled"]})
        globallyFreeSelector = await browser.storage.sync.get("settings.freeSelectorEnabled").then((result: any) => {return result["settings.freeSelectorEnabled"]})
        disabledSites = await browser.storage.sync.get("settings.disabledSites").then((result: any) => {return result["settings.disabledSites"]})
        freeSelectorDisabledSites = await browser.storage.sync.get("settings.freeSelectorDisabledSites").then((result: any) => {return result["settings.freeSelectorDisabledSites"]})
        return {
            enabled: globallyEnabled,
            freeSelector: globallyFreeSelector,
            sites: {...disabledSites.reduce((acc, url) => {
                acc[url] = {
                    url: url,
                    enabled: false,
                    freeSelector: !freeSelectorDisabledSites.includes(url),
                }
                return acc;
            }, {} as {[url: string]: SiteSettings})}
        }
    }
}