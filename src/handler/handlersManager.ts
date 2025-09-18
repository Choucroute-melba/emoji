import browser from "webextension-polyfill";
import Handler from "./handler";
import EmojiSelector from "../selector/emojiselector";
import AriaDivHandler from "../features/aria/handler";
import HTMLInputHandler from "../features/input/handler";
import TextAreaHandler from "../features/textarea/handler";
import HTMLIFrameHandler from "../features/iframe/handler";

export type HandlerManifest = {
    name: string;
    sites: string[];
    targets: string[];
    trigger: HandlerTrigger<"combo" | "default" | "key">[]
    uri: string | undefined;
    file: string | undefined;
    sources: {
        file: string;
        repo: string;
    }
}

export type TriggerType = "default" | "combo" | "key";

export type HandlerTrigger<T extends TriggerType> =
    T extends "default" ? {type: T} :
    T extends "combo" ? {type: T, combo: string} :
    T extends "key" ? {type: T, key: string} :
    never;

let availableHandlers: {
    time: number;
    handlers: HandlerManifest[];
}

const remoteHandlersUrl = "https://raw.githubusercontent.com/Choucroute-melba/emoji/master/extensions"
const localHandlersUrl = browser.runtime.getURL("/extensions")

export async function getAvailableHandlers(): Promise<HandlerManifest[]> {
    let handlers: HandlerManifest[] = []
    // TODO: create extensions repository
/*    console.log("Fetching handlers list from GitHub...");
    try {
        const handlersList: string[] = await fetch(remoteHandlersUrl + "/manifests/extensions.json").then(response => response.json())
        for(const handler of handlersList) {
            const manifest = await fetch(remoteHandlersUrl + "/manifests/" + handler).then(response => response.json())
            handlers.push(manifest)
            console.log("+ " + manifest.name)
        }
    }
    catch (e) {
        console.error("Error fetching handlers list from GitHub", e);
    }*/

    console.log("Fetching local handlers...");
    try {
        const handlersList: string[] = await fetch(localHandlersUrl + "/manifests/extensions.json").then(response => response.json())
        for(const handler of handlersList) {
            const manifest: HandlerManifest = await fetch(localHandlersUrl + "/manifests/" + handler).then(response => response.json())
            handlers.push(manifest)
            console.log("+ " + manifest.name)
        }
    }
    catch (e) {
        console.error("Error fetching local handlers list", e);
    }

    console.log("done.")
    return handlers;
}

export async function loadHandler(handler: HandlerManifest): Promise<string> {
    let txt: string | null = null;
    if(handler.file) {
        txt = await fetch(localHandlersUrl + "/build/" + handler.file).then(response => response.text()).catch((e) => {
            console.error("Error fetching handler local file", e);
            return null;
        })
    }
    if(!txt && handler.uri) {
        txt = await fetch(handler.uri).then(response => response.text()).catch((e) => {
            console.error("Error fetching handler remote file", e);
            return null;
        })
    }

    if(!txt) {
        throw new Error("Handler file not found: " + handler.name);
    }
    console.log("Loaded handler: " + handler.name);
    return txt;
}

export function buildShortcutString(e: KeyboardEvent) {
    let keys = [];
    if (e.ctrlKey) keys.push("Ctrl");
    if (e.shiftKey) keys.push("Shift");
    if (e.altKey) keys.push("Alt");
    if (e.metaKey) keys.push("Meta");
    if (e.getModifierState("AltGraph")) keys.push("AltGraph");
    keys.push(e.key);
    return keys.join("+");
}

/**
 * Comment sont choisis les handlers (par priorité, de la plus haute à la plus basse) :
 * 1. Le domaine du site correspond à un des domaines du handler
 * 2. Le type de cible correspond à un des types de cibles du handler
 *
 * Pour qu'un handler puisse être choisi, il faut que :
 * - le trigger corresponde à l'événement.
 * - la fonction canHandleTarget retourne true.
 *
 * @param handlers
 * @param e
 */
export async function chooseAndLoadHandler(handlers: HandlerManifest[], e: KeyboardEvent): Promise<new (es: EmojiSelector, target: any, onExit: () => void) => Handler<any>> {
    const sc = buildShortcutString(e);
    const isCombo = (sc !== e.key);
    const domain = window.location.hostname;
    const target = e.target as HTMLElement | null;
    const targetTag = target ? target.tagName.toLowerCase() : null;

    // Filtrer les handlers en fonction du trigger
    const triggeredHandlers = handlers.filter(h => {
        return h.trigger.some((tr: HandlerTrigger<TriggerType>) => {
            console.log(tr)
            if (tr.type === "combo" && isCombo) {
                return tr.combo === sc;
            }
            if (tr.type === "key" && !isCombo) {
                return tr.key === e.key;
            }
            return tr.type === "default" && !isCombo && e.code === "Period";

        });
    })

    if(triggeredHandlers.length === 0)
        throw new Error("NO_HANDLER_TRIGGERED");


    // 1. Filtrer par domaine
    let domainHandlers = triggeredHandlers.filter(h =>
        h.sites.some(site => domain.endsWith(site) || site === "*")
    );
    // Filtrer par domaine exact
    const exactDomainHandlers = domainHandlers.filter(h =>
        h.sites.some(site => site === domain)
    );
    if (exactDomainHandlers.length > 0) {
        domainHandlers = exactDomainHandlers;
    }
    if( domainHandlers.length === 0) {
        console.info("No handlers found for domain: " + domain);
        throw new Error("NO_HANDLER_FOR_DOMAIN");
    }

    // 2. Filtrer par type de cible (balise HTML)
    let targetHandlers = domainHandlers.filter(h =>
        h.targets.some(t => t === "*" || t === targetTag)
    );
    // Filtrer par cible exacte
    const exactTargetHandlers = targetHandlers.filter(h =>
        h.targets.some(t => t === targetTag)
    );
    if (exactTargetHandlers.length > 0) {
        targetHandlers = exactTargetHandlers;
    }
    if (targetHandlers.length === 0) {
        console.info("No handlers found for target: " + targetTag);
        throw new Error("NO_HANDLER_FOR_TARGET");
    }

    // 4. Charger le premier handler valide
    for (const handler of targetHandlers) {
        console.log(`Handler ${handler.name} found for target: ${targetTag}`);
        let handlerClass;
        if(handler.name === "AriaDiv")
            handlerClass = AriaDivHandler;
        else if(handler.name === "HTMLInput")
            handlerClass = HTMLInputHandler;
        else if(handler.name === "TextArea")
            handlerClass = TextAreaHandler;
        else if(handler.name === "HTMLIframe")
            handlerClass = HTMLIFrameHandler;
        else {
            // Charger dynamiquement la classe du handler via import()
            try {
                const moduleUrl = browser.runtime.getURL(`/extensions/build/${handler.file}`);
                console.log(moduleUrl);
                const mod = await import(/* webpackIgnore: true */ moduleUrl);
                console.log("mod: ", mod);
                handlerClass = mod.default;
            } catch (e) {
                console.error('Erreur lors de l\'import dynamique du handler', e);
                continue
                // throw new Error('HANDLER_IMPORT_ERROR');
            }
        }
        console.log("handlerClass: ", handlerClass);

        // Vérifier la méthode canHandleTarget si elle existe
        if (typeof handlerClass?.canHandleTarget === "function") {
            if (handlerClass.canHandleTarget((target || document.createElement("div")) as any)) {
                console.group(`Handler ${handler.name} can handle target: ${targetTag}`);
                console.log("The following compatible handlers were found:");
                console.table(targetHandlers.map(h => ({ name: h.name, targets: h.targets.join(", "), sites: h.sites.join(", ") })));
                console.groupEnd();
                return handlerClass;
            }
            else {
                console.info(`Handler ${handler.name} cannot handle target: ${targetTag}`);
                continue
                // throw new Error("TARGET_REFUSED");
            }
        } else {
            console.warn(`Handler ${handler.name} does not have a canHandleTarget method.`);
            throw new Error("HANDLER_INCOMPLETE_OR_MISSING");
        }
    }
    throw new Error("NO_HANDLER_FOUND");
}