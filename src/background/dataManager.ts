import browser, {Runtime} from "webextension-polyfill";
import Port = Runtime.Port;
import {getStorageKey, parseStorageKey} from "./utils";
import {DataChangedEvent} from "./messsaging";

/**
 * Represents the configuration settings for a site.
 *
 * @property {string} url - The URL of the site (for the moment sites are identified by their domain name).
 * @property {boolean} enabled - Indicate if autocomplete is enabled for this site, independently of a global disable.
 * @property {boolean} freeSelector - Determines whether free selector is enabled for this site, independently of a global disable.
 */
export type SiteSettings = {
    url: string,
    enabled: boolean,
    freeSelector: boolean
}

export type GlobalSettings = {
    enabled: boolean,
    freeSelector: boolean,
    actionIcon: string,
    keepFreeSelectorEnabled: boolean
    sites: { [url: string]: SiteSettings },
}

export default class DataManager {
    private connections: Port[] = [];
    private listeners: Map<string, string[]> = new Map<string, string[]>()

    private _settings: {key: string, value: GlobalSettings} = {
        key: "settings",
        value: {
            enabled: true,
            freeSelector: true,
            keepFreeSelectorEnabled: true,
            actionIcon: "😉",
            sites: {} as {[url: string]: SiteSettings},
        }
    };

    private _emojiUsage = {
        key: "emojiUsage",
        value: {} as {[emoji: string]: { count: number, firstUsed: number, lastUsed: number }},
    }

    private proxyCache = new WeakMap<object, any>();
    private pendingWrites: Map<string, Promise<boolean>> = new Map<string, Promise<boolean>>();

    constructor() {
        browser.runtime.onConnect.addListener(this.onConnect.bind(this));
    }

    /** Creates a proxy for the given object and caches it and return it in later calls.
     *
     * @param obj - The object to proxy.
     * @param prefix - The prefix for the storage key.
     * @param replaceCache - If true, the proxy will be recreated even if it already exists in the cache.
     * */
    private getProxy(obj: any, prefix: string = "", replaceCache = false): any {
        if(!replaceCache)
            if (this.proxyCache.has(obj)) return this.proxyCache.get(obj);
        if(obj === undefined) {
            console.error(`Error creating proxy for ${prefix}: object is undefined`)
            return obj;
        }

        console.info(`Creating proxy for ${prefix}`)
        const self = this;
        const handler: ProxyHandler<any> = {
            get(target, prop, receiver) {
                const key = getStorageKey(prefix, prop);
                //console.groupCollapsed(`- proxy get ${key}`)
                const res = Reflect.get(target, prop, receiver);
                if(typeof res === 'object' && res !== null) {
                    /*console.log(res)
                    console.trace()
                    console.groupEnd()*/
                    return self.getProxy(res, key);
                }
/*                console.log(res)
                console.trace()
                console.groupEnd()*/
                return res;
            },
            set(target, prop, value, receiver) {
                const key = getStorageKey(prefix, prop);
                const oldValue = target[prop];
                if(oldValue === value) {
                    console.log(`- proxy set ${key}: no change (oldValue: ${oldValue})`)
                    return true;
                }

                const newValue = (typeof value === 'object' && value !== null)
                    ? self.getProxy(value, key)
                    : value;
                const plainValue = (typeof newValue === 'object' && newValue !== null)
                    ? JSON.parse(JSON.stringify(newValue))
                    : newValue;

                self.writeData(key, plainValue)
                    .then(() => {
                        const status = Reflect.set(target, prop, newValue, receiver);
                        if(status)
                            self.onDataChange(key, plainValue, oldValue);
                    })
                    .catch(err => {
                        console.error(`Error writing setting ${key}: failed to write data\n`, err)
                    });
                return true;
            },
            deleteProperty(target, prop): boolean {
                const key = getStorageKey(prefix, prop);
                const oldValue = target[prop];
                self.writeData(key, undefined)
                    .then(() => {
                        const res = Reflect.deleteProperty(target, prop);
                        if(res)
                            self.onDataChange(key, undefined, oldValue);
                    })
                    .catch(err => {
                    console.error(`Error deleting setting ${key}: failed to write data\n`, err)
                    return false;
                })

                return true;
            },
        }

        const proxy = new Proxy(obj, handler);
        this.proxyCache.set(obj, proxy);
        this.proxyCache.set(proxy, proxy)
        return proxy
    }
    private onDataChange(changedKey: string | null, value: any, oldValue: any) {
        console.log(`- Data changed: ${changedKey} : ${oldValue} -> ${value}`);
        const firedListeners: string[] = []
        if(changedKey == null) {
            this.listeners.forEach((keys, portName) => {
                firedListeners.push(portName)
            })
        }
        else {
            this.listeners.forEach((keys, portName) => {
                keys.forEach(k => {
                    if (k === changedKey) {// The designed object has changed
                        if (!firedListeners.includes(portName))
                            firedListeners.push(portName)
                    }
                    else if (k.endsWith(".**")) { // the listener key is a parent of the changed key
                        const baseKey = k.substring(0, k.length - 3)
                        if (changedKey.startsWith(baseKey + ".") || changedKey.startsWith(baseKey + "[")) {
                            if (!firedListeners.includes(portName))
                                firedListeners.push(portName)
                        }
                    }
                    else if (k.endsWith(".*")) { // the changed key is an immediate child of the listener key
                        const baseKey = k.substring(0, k.length - 2)
                        if(changedKey.startsWith(baseKey + ".") || changedKey.startsWith(baseKey + "[")) {
                            const subKey = changedKey.substring(baseKey.length + 1)
                            const parsedSubKey = parseStorageKey(subKey)
                            if(parsedSubKey != null && parsedSubKey.length === 1) {
                                if (!firedListeners.includes(portName))
                                    firedListeners.push(portName)
                            }
                        }
                    }
                })
            });
        }

        firedListeners.forEach(portName => {
            const p = this.getPort(portName);
            if(p) {
                p.postMessage({event: "dataChanged", data: {key: changedKey, value: value, oldValue: oldValue}} as DataChangedEvent)
            }
        });
    }

    private async _readData(key: string | null) {
        let parsedKey = parseStorageKey(key)
        if(parsedKey == null)
            return browser.storage.sync.get(null)
        let result = await browser.storage.sync.get(parsedKey[0])
        for(let segmentIndex = 0; segmentIndex < parsedKey.length; segmentIndex++) {
            if(result == undefined) {
                console.error(`Error reading setting ${key}: property ${parsedKey[segmentIndex-1]} not found`);
                return undefined;
            }
            result = result[parsedKey[segmentIndex]] as any
        }
        return result
    }

    async readData(key: string | null) {
        return await this._readData(key)
    }

    private async writeData(key: string, value: any): Promise<boolean> {
        let parsedKey = parseStorageKey(key)
        const queueKey = parsedKey == null ? "__GLOBAL__" : parsedKey[0];
        const doWrite = async () => {
            if (parsedKey == null) {
                return await browser.storage.sync.set(value).catch(err => {
                    console.error(`Error writing setting ${key}: ${err}`)
                    throw err
                }).then(() => true)
            }

            if (parsedKey.length === 0)
                return false

            const topKey = parsedKey[0]
            const res = await browser.storage.sync.get(topKey)
            let root = (res as any)[topKey]

            if (parsedKey.length === 1) {
                return await browser.storage.sync.set({[topKey]: value}).catch(err => {
                    console.error(`Error writing setting ${key}: ${err}`)
                    throw err
                }).then(() => true)
            }

            if (root === undefined || root === null)
                root = {}

            let current: any = root
            for (let i = 1; i < parsedKey.length - 1; i++) {
                const seg = parsedKey[i]
                if (current[seg] === undefined || current[seg] === null)
                    current[seg] = {}
                current = current[seg]
            }

            current[parsedKey[parsedKey.length - 1]] = value
            return await browser.storage.sync.set({[topKey]: root}).catch(err => {
                console.error(`Error writing setting ${key}: ${err}`)
                throw err
            }).then(() => true)
        }

        // Chaîner la nouvelle écriture après la précédente pour la même queueKey
        const prev = this.pendingWrites.get(queueKey) ?? Promise.resolve(true);
        const next = prev.then(() => doWrite()).catch(() => doWrite());
        // stocker la promesse courante (ne pas await ici)
        this.pendingWrites.set(queueKey, next);
        // quand la promesse est terminée, si c'était la dernière, on peut la retirer (optionnel)
        next.finally(() => {
            // si la promesse stockée est bien la même, la supprimer
            if (this.pendingWrites.get(queueKey) === next) this.pendingWrites.delete(queueKey);
        });
        return next;
    }

    async initializeStorage() {
        if(!(await this._readData("settings")))
            await this.writeData("settings", this._settings.value)
        else {
            this.settings = await this._readData(this._settings.key) as typeof this._settings.value;
        }
        if(!(await this._readData("emojiUsage")))
            await this.writeData("emojiUsage", this._emojiUsage.value)
        else {
            this.emojiUsage = await this._readData(this._emojiUsage.key) as typeof this._emojiUsage.value;
        }
        console.log("Storage initialized")
    }

    private onConnect(p: Port) {
        if(this.getPort(p.name)) {
            console.info(`Port ${p.name} already exists`)
            const i = this.getPortIndex(p.name);
            this.connections[i].onDisconnect.removeListener(this.boundOnDisconnect);
            this.connections[i].disconnect();
            this.connections[i] = p;
        }
        else
            this.connections.push(p);
//        console.log("Connected to " + p.name + " (" + p.sender?.url + ")")
        p.onDisconnect.addListener(this.boundOnDisconnect);
        p.onMessage.addListener(this.onMessage.bind(this));
        p.postMessage({action: "greeting"})
    }

    private onDisconnect(p: Port) {
        const i = this.getPortIndex(p.name);
        if(i === -1) return
        this.connections.splice(i, 1);
    }
    private boundOnDisconnect = this.onDisconnect.bind(this);

    private getPort(name: string) {
        return this.connections.find((p) => p.name == name);
    }

    private getPortIndex(name: string) {
        return this.connections.findIndex((p) => p.name == name);
    }

    private onMessage(message: any, sender: Port) {
//        console.log("Message received from " + sender.name + ": " + message.action)

        if(message.action == "addDataChangeListener") {
            if(!message.data.keys)
                return;
            if(typeof message.data.keys === "string")
                message.data.keys = [message.data.keys];
            const newListeners = message.data.keys.filter((k: any) => !this.listeners.has(sender.name) || !this.listeners.get(sender.name)?.includes(k))
            if(this.listeners.has(sender.name)) {
                const lst = this.listeners.get(sender.name)!.concat(newListeners)
                this.listeners.set(sender.name, lst)
            }
            else {
                this.listeners.set(sender.name, newListeners)
            }
        }
        else if(message.action == "removeDataChangeListener") {
            if(!message.data.keys)
                return;
            if(typeof message.data.keys === "string")
                message.data.keys = [message.data.keys];
            const lst = this.listeners.get(sender.name)!.filter((k: any) => !message.data.keys.includes(k))
            this.listeners.set(sender.name, lst)
        }
    }

    get settings():typeof this._settings.value {
        return this.getProxy(this._settings.value, this._settings.key);
    }

    get readonlySettings(): typeof this._settings.value {
        return JSON.parse(JSON.stringify(this._settings.value)) as typeof this._settings.value;
    }

    protected set settings(value: typeof this._settings.value) {
        this._settings.value = value;
        this.getProxy(this._settings.value, this._settings.key, true);
    }

    get emojiUsage():typeof this._emojiUsage.value {
        return this.getProxy(this._emojiUsage.value, this._emojiUsage.key);
    }

    get readonlyEmojiUsage(): typeof this._emojiUsage.value {
        return JSON.parse(JSON.stringify(this._emojiUsage.value)) as typeof this._emojiUsage.value;
    }

    protected set emojiUsage(value: typeof this._emojiUsage.value) {
        this._emojiUsage.value = value;
        this.getProxy(this._emojiUsage.value, this._emojiUsage.key, true);
    }
}