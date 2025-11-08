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
    actionIcon?: string,
    keepFreeSelectorEnabled: boolean
    sites: { [url: string]: SiteSettings },
}

export type SubscriptionScope = "siteSettings" | "globalSettings";

export default class SettingsManager {
    private connections: Port[] = [];
    private listeners: {name: string, subscriptions: SubscriptionScope[]}[] = []
    private defaultActionIcon = "U+1F609"

    constructor() {
        browser.runtime.onConnect.addListener(this.onConnect.bind(this));
    }

    async initializeStorage() {
        const s = await browser.storage.sync.get([
            "settings.enabled",
            "settings.freeSelectorEnabled",
            "settings.keepFreeSelectorEnabled",
            "settings.disabledSites",
            "settings.freeSelectorDisabledSites",
            "settings.actionIcon"
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
        if(!s["settings.actionIcon"])
            await browser.storage.sync.set({
                "settings.actionIcon": this.defaultActionIcon
            })
        if(!s["settings.keepFreeSelectorEnabled"])
            await browser.storage.sync.set({
                "settings.keepFreeSelectorEnabled": true
            })
        console.log("Storage initialized")
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
        console.log("Connected to " + p.name + " (" + p.sender?.url + ")")
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
        const alreadyExists = this.listeners.findIndex((l) => l.name == name);
        if(alreadyExists >= 0) {
            const l = this.listeners[alreadyExists];
            subs.forEach(s => {
                if(!l.subscriptions.includes(s))
                    l.subscriptions.push(s);
            })
        }
        else {
            this.listeners.push({
                name,
                subscriptions: subs
            })
        }
    }

    private async onSettingsChanged() {
        console.log("Settings changed")
        const toRemove: string[] = [];
        for (const l of this.listeners) {
            if(l.subscriptions.includes("globalSettings")) {
                const p = this.getPort(l.name);
                if(p) {
                    console.log("Sending settings to " + l.name, "port :", p.name);
                    try {
                        p.postMessage({
                            event: "settingsUpdated",
                            data: {
                                settings: await this.getSettings()
                            }
                        })
                    } catch (e: any) {
                        if(e.message.includes("Attempt to postMessage on disconnected port")) {
                            console.log(`Port ${p.name} disconnected, removing listener`);
                            toRemove.push(l.name);
                        }
                    }
                }
                else
                    console.error("Port not found");
            }
        }
        for(const r of toRemove) {
            let i = this.listeners.findIndex((l) => l.name == r);
            if(i >= 0)
                this.listeners.splice(i, 1);
            i = this.connections.findIndex((p) => p.name == r);
            if(i >= 0)
                this.connections.splice(i, 1);
        }
    }

    private async onSiteSettingsChanged(url: string) {
        console.log("Settings changed for " + url)
        let domain = new URL(url).host;
        if(domain === "") domain = url;
        const sitePorts = this.connections.filter((p) => p.sender?.url?.includes(domain));
        if(this.listeners.findIndex((l) => l.name == "action-popup") >= 0)
            sitePorts.push(this.getPort("action-popup")!);
        if(this.listeners.findIndex((l) => l.name == "settings-page") >= 0)
            sitePorts.push(this.getPort("settings-page")!);
        console.log(sitePorts)
        const toRemove: string[] = [];

        for (const p of sitePorts) {
            const listener = this.listeners.find((l) => l.name == p.name)
            if(listener && listener.subscriptions.includes("siteSettings")) {
                try {
                    p.postMessage({
                        event: "siteSettingsUpdated",
                        data: {
                            settings: await this.getSettingsForSite(url)
                        }
                    })
                }
                catch (e: any) {
                    if(e.message.includes("Attempt to postMessage on disconnected port")) {
                        console.log(`Port ${p.name} disconnected, removing listener`);
                        toRemove.push(listener.name);
                    }
                }
            }
        }
        for(const r of toRemove) {
            let i = this.listeners.findIndex((l) => l.name == r);
            if(i >= 0)
                this.listeners.splice(i, 1);
            i = this.connections.findIndex((p) => p.name == r);
            if(i >= 0)
                this.connections.splice(i, 1);
        }
    }

    async enableOnSite(url: string, enable: boolean) {
        console.log(enable ? "Enable on" : "Disable on", url);
        const disabledSites = await browser.storage.sync.get("settings.disabledSites").then((result: any) => {
            return result["settings.disabledSites"];
        })
        const keepFreeSelectorEnabled = await browser.storage.sync.get("settings.keepFreeSelectorEnabled").then((result: any) => {
            return result["settings.keepFreeSelectorEnabled"];
        })
        let domain = new URL(url).host
        if(domain === "") domain = url;
        const index = disabledSites.indexOf(domain);
        if(enable && index >= 0)
                disabledSites.splice(index, 1);
        else if(!enable && index < 0)
                disabledSites.push(domain);
        else return
        await browser.storage.sync.set({
            "settings.disabledSites": disabledSites
        })
        await this.onSiteSettingsChanged(url);
    }

    async enableGlobally(enable: boolean) {
        console.log((enable ? "Enabled" : "Disabled") + " on all sites");
        const enabledGlobally = await browser.storage.sync.get("settings.enabled").then((result: any) => {return result["settings.enabled"]})
        const keepFreeSelectorEnabled = await browser.storage.sync.get("settings.keepFreeSelectorEnabled").then((result: any) => {
            return result["settings.keepFreeSelectorEnabled"];
        })
        if(enabledGlobally == enable) return;
        await browser.storage.sync.set({
            "settings.enabled": enable
        })
        if(!keepFreeSelectorEnabled)
            await browser.storage.sync.set({
                "settings.freeSelectorEnabled": enable
            })
        await this.onSettingsChanged();
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
            let domain = new URL(url).host;
            if(domain === "") domain = url;
            const index = freeSelectorDisabledSites.indexOf(domain);
            if(enabled && index >= 0)
                freeSelectorDisabledSites.splice(index, 1);
            else if(!enabled && index < 0)
                freeSelectorDisabledSites.push(domain);
            else return
            await browser.storage.sync.set({
                "settings.freeSelectorDisabledSites": freeSelectorDisabledSites
            })
            await this.onSiteSettingsChanged(url);
        }
    }

    async toggleKeepFreeSelectorEnabled(enable: boolean) {
        console.log((enable ? "Enabled" : "Disabled") + " keep free selector enabled");
        const keepFreeSelectorEnabled = await browser.storage.sync.get("settings.keepFreeSelectorEnabled").then((result: any) => {
            return result["settings.keepFreeSelectorEnabled"];
        })
        if(keepFreeSelectorEnabled == enable) return;
        await browser.storage.sync.set({
            "settings.keepFreeSelectorEnabled": enable
        })
        await this.onSettingsChanged();
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
        const keepFreeSelectorEnabled = await browser.storage.sync.get("settings.keepFreeSelectorEnabled").then((result: any) => {
            return result["settings.keepFreeSelectorEnabled"];
        })
        let domain = new URL(url).host;
        if(domain === "") domain = url;
        const siteSettings: SiteSettings = {
            url: domain,
            enabled: !disabledSites.includes(domain),
            freeSelector: globallyEnabled || keepFreeSelectorEnabled
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
        const keepFreeSelectorEnabled = await browser.storage.sync.get("settings.keepFreeSelectorEnabled").then((result: any) => {
            return result["settings.keepFreeSelectorEnabled"];
        })
        return {
            enabled: globallyEnabled,
            freeSelector: globallyEnabled || keepFreeSelectorEnabled,
            keepFreeSelectorEnabled: keepFreeSelectorEnabled,
            sites: {...disabledSites.reduce((acc, url) => {
                acc[url] = {
                    url: url,
                    enabled: false,
                    freeSelector: keepFreeSelectorEnabled,
                }
                return acc;
            }, {} as {[url: string]: SiteSettings})}
        }
    }
}