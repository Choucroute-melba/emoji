import React from 'react';
import "./emojiselector.css"
import {createRoot, Root} from 'react-dom/client';
import Selector from "./Components/Selector";
import {Emoji} from "emojibase";
import {mergeCss} from "@theme/theme-utils";

import resetCss from "@theme/reset.text.css"
const resetSheet = new CSSStyleSheet();
resetSheet.replaceSync(resetCss);
import baseCss from "@src/base.css?inline"
const baseSheet = new CSSStyleSheet();
baseSheet.replaceSync(baseCss);
import SelectorCss from "./Components/Selector.css?inline"
const componentSheet = new CSSStyleSheet();
componentSheet.replaceSync(SelectorCss);
import EmojiCardCss from "./Components/EmojiCard.css?inline"
const emojiCardSheet = new CSSStyleSheet();
emojiCardSheet.replaceSync(EmojiCardCss);

export type EmojiSelectorPosition = {
    position: {
        x: number;
        y: number;
    };
    placement: "up" | "down";
    mode?: "static" | "absolute" | "relative" | "fixed" | "sticky";
}

export type EmojiSelectorGeometry = {
    position: { x: number, y: number };
    placement: "up" | "down";
    positionMode: "static" | "absolute" | "relative" | "fixed" | "sticky";
    shape: { w: number, h: number };
}

interface EmojiSelectorEventMap extends HTMLElementEventMap {
    'input': Event;
    'change': Event;
}

/** @class EmojiSelector
 * This class is responsible for managing the emoji selector component
 * it offers a simple API to control the selector's interface and properties
 * @property {function} onEmojiSelected - a callback function that will be executed when an emoji is selected (for example when the user click on the interface)
 */
export default class EmojiSelector {
    static observedAttributes = ["value", "mode", "x", "y", "placement", "h", "w"]

    private reactRoot: Root | null = null;
    private popupBackground: HTMLDivElement | null = null;
    private sr: ShadowRoot | null = null;
    private _display = false;
    private _focusedEmojiIndex = 0; // The index of the currently focused emoji in selector
    private _debugText = ""
    private _inDocument = false;
    private _elt: HTMLElement;
    private _favoriteEmojis: string[] = [];
    // private readonly boundComponent = () => this.component();

    private observer: MutationObserver | null = null;
    private attributesObserver: MutationObserver | null = null;
    private readonly boundKeydownListener = (evt: KeyboardEvent | Event) => this.onKeyDown(evt)

    public onResize: (geometry: EmojiSelectorGeometry) => void = () => {};
    public onToggleEmojiFavorite: (emoji: Emoji) => void = (e) => {};
    public onBlur: () => void = () => {};
    public onClose: () => void = () => {};

    constructor(elt?: HTMLElement) {
        if(elt)
            this._elt = elt;
        else
            this._elt = document.createElement('div');
        this.elt.id = "emojeezer";
    }

    connectedCallback() {
        this.sr = this.elt.attachShadow({mode: 'open'});
        this.sr.addEventListener('keydown', this.boundKeydownListener, {capture: true});
        this.elt.addEventListener('blur', () => {this.onBlur()});

        this.elt.classList.add('emojeezer');
        const mergedCss = mergeCss(resetCss, baseCss, /:host\s?/i);
        const styleSheet = new CSSStyleSheet();
        styleSheet.replaceSync(mergedCss);
        const sheets = [styleSheet, emojiCardSheet, componentSheet]
        // @ts-ignore
        const unwrappedSr = this.sr.wrappedJSObject
        sheets.forEach((s) => {
            unwrappedSr.adoptedStyleSheets.push(s)
        })

        this.popupBackground = document.createElement('div');
        if(this.mode !== "static")
            this.popupBackground.classList.add('popupBackground');
        this.popupBackground.tabIndex = 0;
        this.popupBackground.addEventListener('click', (e) => {
            const path = e.composedPath();
            for(const p of path) {
                const el = p as HTMLElement;
                if(el && el.dataset && el.dataset.stopPropagation)
                    return;
            }
            this.onClose();
        });

        this.reactRoot = createRoot(this.popupBackground);
        this.sr.appendChild(this.popupBackground);
        this._inDocument = true;
        this.observer = new MutationObserver((mutations) => this.onMutation(mutations));
        this.observer.observe(this.elt, {childList: true, subtree: true, characterData: true, characterDataOldValue: true});
        this.attributesObserver = new MutationObserver((mutations) => this.onAttributeMutation(mutations));
        this.attributesObserver.observe(this.elt, {attributes: true, subtree: false, attributeOldValue: true});
        this.renderReact();
    }

    disconnectedCallback() {
        this.reactRoot?.unmount();
        this.reactRoot = null;
        this.sr = null;
        this.popupBackground?.remove();
        this.popupBackground = null;
        this.options = [];
        this._inDocument = false;
    }

    connectedMoveCallback() {
        if(this._inDocument) {
            this.renderReact()
        }
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if(oldValue == newValue) return;
        console.log(`${name} : ${oldValue} -> ${newValue}`);
        switch (name) {
            case "value":
                this.value = newValue;
                break;
            case "mode":
                this.mode = newValue as any;
                break;
            case "x":
                this.position = {x: parseInt(newValue)};
                break;
            case "y":
                this.position = {y: parseInt(newValue)};
                break;
            case "placement":
                this.placement = newValue as any;
                break;
            case "h":
                this.shape = {h: parseInt(newValue)};
                break;
            case "w":
                this.shape = {w: parseInt(newValue)};
                break;
        }
        if(this._inDocument)
            this.renderReact()
    }

    private onAttributeMutation = (mutations: MutationRecord[])=> {
        for(const mutation of mutations) {
            if(mutation.type === "attributes" && mutation.attributeName) {
                this.attributeChangedCallback(mutation.attributeName, mutation.oldValue || "", this.elt.getAttribute(mutation.attributeName) || "")
            }
        }
    }

    private onMutation = (mutations: MutationRecord[])=> {
        this.validateChildList();
        if(this._inDocument)
            this.renderReact();
    }

    private validateChildList() {
        const foundEmojiOptions: string[] = []
        for(let i = this.elt.children.length - 1; i >= 0; i--) {
            const child = this.elt.children[i];
            if(!child.className.toLowerCase().includes("emoji-option") && child.id.toLowerCase() !== "selector-heading") {
                console.warn("EmojiSelector only accepts EmojiOption or SelectorHeading elements as children. Ignoring: ", child, " (index: ", i, ")");
                this.elt.removeChild(child);
            }
            if(child.className.toLowerCase().includes("emoji-option")) {
                const opt = new EmojiSelectorOption(child as HTMLElement);
                if(opt.emoji && !foundEmojiOptions.includes(opt.emoji))
                    foundEmojiOptions.push(opt.emoji);
                else if(opt.emoji && foundEmojiOptions.includes(opt.emoji)) {
                    console.warn("Duplicate emoji found in EmojiSelector children: ", opt.emoji, ". Ignoring: ", child, " (index: ", i, ")")
                    console.groupCollapsed("trace : ")
                    console.trace()
                    console.groupEnd()
                    this.elt.removeChild(child);
                }
                else {
                    console.warn("EmojiSelector child does not contain an emoji: ", child, " (index: ", i, ")")
                    console.groupCollapsed("trace : ")
                    console.trace()
                    console.groupEnd()
                    this.elt.removeChild(child);
                }
            }
        }
    }

    focusUp() {
        if(this._focusedEmojiIndex > 0) {
            this._focusedEmojiIndex--;
        }
        else
            this._focusedEmojiIndex = this.options.length - 1;
        this.fireInputEvent()
        if(this._inDocument)
            this.renderReact()
    }
    focusDown() {
        if(this._focusedEmojiIndex < this.options.length - 1) {
            this._focusedEmojiIndex++;
        }
        else
            this._focusedEmojiIndex = 0;
        this.fireInputEvent()
        if(this._inDocument)
            this.renderReact()
    }

    getFocusedEmoji() {
        return this.options[this._focusedEmojiIndex];
    }
    setFocusedEmoji(index: number) {
        if(index < 0 || index >= this.options.length) return;
        this._focusedEmojiIndex = index;
        if(this._inDocument)
            this.renderReact()
    }

    private fireInputEvent() {
        const evt = new Event('input', {bubbles: true});
        this.elt.dispatchEvent(evt);
    }

    private fireChangeEvent() {
        const evt = new Event('change', {bubbles: true});
        this.elt.dispatchEvent(evt);
    }

    addEventListener<K extends keyof EmojiSelectorEventMap>(type: K, listener: (this: HTMLElement, ev: EmojiSelectorEventMap[K]) => any, options?: boolean | AddEventListenerOptions) {
        this.elt.addEventListener(type, listener, options);
    }

    removeEventListener<K extends keyof EmojiSelectorEventMap>(type: K, listener: (this: HTMLElement, ev: EmojiSelectorEventMap[K]) => any, options?: boolean | EventListenerOptions) {
        this.elt.removeEventListener(type, listener, options);
    }

    place(parent: HTMLElement) {
        parent.appendChild(this.elt);
        this.connectedCallback();
    }

    remove() {
        this.elt.remove();
        this.disconnectedCallback();
    }

    private component = () => {
        const result = this.elt.querySelector("#selector-heading") as HTMLElement | null;
        let headingElt = result ? new SelectorHeadingComponent(result) : null;

        let heading: React.ReactNode = React.createElement("p", {}, "");
        if(headingElt && headingElt.render) {
            heading = headingElt.render()
        }
        return React.createElement(Selector, {
            position : this.position,
            displayAbove : this.placement == "up",
            positionMode : this.mode,
            shape : this.shape,
            searchResults : this.options,
            favorites : this.favoriteEmojis,
            selectedEmojiIndex : this._focusedEmojiIndex,
            children : heading,
            onEmojiSelected : this.onEmojiSelected,
            onResize : this.onResize,
            onToggleEmojiFavorite : this.onToggleEmojiFavorite
        });
    }

    private renderReact = () => {
        if(!this._inDocument) return;
        this.reactRoot!.render(this.component());
    }

    private onKeyDown(evt: KeyboardEvent | Event) {
        const e = evt as KeyboardEvent;
        if(e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            this.onClose();
        }
        else if(e.key === "ArrowUp") {
            e.preventDefault();
            e.stopPropagation();
            this.focusUp();
        }
        else if(e.key === "ArrowDown") {
            e.preventDefault();
            e.stopPropagation();
            this.focusDown();
        }
        else if(e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            if(e.ctrlKey)
                this.toggleFavorite(this.getFocusedEmoji()!.emoji);
            else
                this.onEmojiSelected(this.getFocusedEmoji()!);
        }
    }

    private onEmojiSelected = (emoji: Emoji)=> {
        this.value = emoji.emoji;
        this.fireChangeEvent();
    }

    set options(value: Emoji[]) {
        for(let i = this.elt.children.length - 1; i >= 0; i--) {
            const child = this.elt.children[i];
            if(child.className.includes("emoji-option"))
                this.elt.removeChild(child);
        }
        for(const emoji of value) {
            const opt = new EmojiSelectorOption();
            opt.JSONData = emoji;
            if(this.favoriteEmojis.includes(emoji.emoji))
                opt.favorite = true;
            this.elt.appendChild(opt.element);
        }
        if(this._inDocument)
            this.renderReact()
    }
    get options() {
        const list: Emoji[] = [];
        for(const child of this.elt.children) {
            if(child.className.includes("emoji-option")) {
                const opt = new EmojiSelectorOption(child as HTMLElement);
                list.push(opt.JSONData as Emoji);
            }
        }
        return list;
    }

    set display(value: boolean) {
        this._display = value;
        this.elt.style.display = this._display ? 'block' : 'none';
        if(this._inDocument && this._display)
            this.renderReact();
    }
    get display() {return this._display;}

    /** set the absolute position of the selector on the page */
    set position(value: Partial<{x: number, y: number}>) {
        if(value.x !== undefined) this.elt.setAttribute("x", value.x.toString());
        if(value.y !== undefined) this.elt.setAttribute("y", value.y.toString());
        if(this._inDocument)
            this.renderReact()
    }
    get position(): {x: number, y: number} {
        return {
            x: parseInt(this.elt.getAttribute("x") || "0"),
            y: parseInt(this.elt.getAttribute("y") || "0")
        };
    }

    set placement(value: "up" | "down") {
        this.elt.setAttribute("placement", value);
        if(this._inDocument)
            this.renderReact()
    }
    get placement() {
        const attrValue = this.elt.getAttribute("placement");
        if(attrValue !== "up" && attrValue !== "down") {
            console.warn("Invalid placement attribute value: ", attrValue, ". Using 'down' instead.")
            this.elt.setAttribute("placement", "down");
            return "down";
        }
        return attrValue;
    }

    set mode(value: "static" | "absolute" | "relative" | "fixed" | "sticky") {
        if(value === "static")
            this.popupBackground?.classList.remove("popupBackground")
        else
            this.popupBackground?.classList.add("popupBackground")
        this.elt.setAttribute("mode", value);
    }
    get mode() {
        const attrValue = this.elt.getAttribute("mode");
        if(attrValue !== "static" && attrValue !== "absolute" && attrValue !== "relative" && attrValue !== "fixed" && attrValue !== "sticky") {
            console.warn("Invalid mode attribute value: ", attrValue, ". Using 'static' instead.")
            this.elt.setAttribute("mode", "static");
            return "static";
        }
        return attrValue;
    }

    set shape(value: Partial<{w: number, h: number}>) {
        if(value.w !== undefined) this.elt.setAttribute("w", value.w.toString());
        if(value.h !== undefined) this.elt.setAttribute("h", value.h.toString());
        if(this._inDocument)
            this.renderReact()
    }
    get shape(): {w: number, h: number} {
        return {
            w: parseInt(this.elt.getAttribute("w") || "0"),
            h: parseInt(this.elt.getAttribute("h") || "0")
        };
    }

    get geometry(): EmojiSelectorGeometry {
        return {
            position: this.position,
            placement: this.placement,
            positionMode: this.mode,
            shape: this.shape,
        };
    }
    set geometry(value: Partial<EmojiSelectorGeometry>) {
        if(value.position)
            this.position = value.position;
        if(value.placement)
            this.placement = value.placement;
        if(value.positionMode)
            this.mode = value.positionMode;
        if(value.shape)
            this.shape = value.shape;
        if(this._inDocument)
            this.renderReact()
    }

    set favoriteEmojis(value: string[]) {
        this._favoriteEmojis = value;
        for(const child of this.elt.children) {
            if(child.className.includes("emoji-option")) {
                const opt = new EmojiSelectorOption(child as HTMLElement);
                if(opt.emoji && value.includes(opt.emoji))
                    opt.favorite = true;
                else
                    opt.favorite = false;
            }
        }
        if(this._inDocument)
            this.renderReact()
    }
    toggleFavorite(emoji: string) {
        for(const child of this.elt.children) {
            if(child.className.includes("emoji-option")) {
                const opt = new EmojiSelectorOption(child as HTMLElement);
                if(opt.emoji && emoji === opt.emoji) {
                    opt.favorite = !opt.favorite;
                    const index = this.favoriteEmojis.indexOf(emoji);
                    if(index !== -1) {
                        if(!opt.favorite)
                            this.favoriteEmojis.splice(index, 1);
                    }
                    else if(opt.favorite)
                        this.favoriteEmojis.push(emoji);
                }
            }
        }
        if(this._inDocument)
            this.renderReact()
    }
    get favoriteEmojis() {
/*        const list: string[] = [];
        for(const elt of this.elt.children) {
            if(elt.className.includes("emoji-option")) {
                const opt = new EmojiSelectorOption(elt as HTMLElement);
                if(opt.favorite && opt.emoji !== undefined)
                    list.push(opt.emoji);
            }
        }
        return list;*/
        return this._favoriteEmojis
    }

    /** set a text that will be shown in the selector for debugging purposes */
    set debugText(value: string) {
        this._debugText = value;
        if(this._inDocument)
            this.renderReact()
    }

    get hasFocus(): boolean {
        return this.elt.contains(document.activeElement);
    }

    set value(name: string) {
        // TODO: A way to declare possible values (search results)
        const index = this.options.findIndex(e => e.emoji === name);
        if(index !== -1 && index !== this._focusedEmojiIndex) {
            this.setFocusedEmoji(index);
            this.fireInputEvent()
        }
    }
    get value() {
        return this.getFocusedEmoji()?.emoji || "";
    }

    get element() {return this.elt;}
    set element(elt: HTMLElement) {
        throw new Error("TODO: implement");
    }

    private get elt(): HTMLElement {
        return this._elt!;
    }
    private set elt(elt: HTMLElement) {
        this._elt = elt;
    }
}


export class EmojiSelectorOption {
    static observedAttributes = ["emoji", "label", "shortcodes", "tags", "favorite"]

    private _elt: HTMLElement;
    private get elt() {
        return this._elt;
    }
    private set elt(elt: HTMLElement) {
        this._elt = elt;
    }

    private attributesObserver: MutationObserver | null = null;

    constructor(elt?: HTMLElement) {
        if(elt) {
            this._elt = elt;
            if(!this._elt.classList.contains("emoji-option"))
                this._elt.classList.add("emoji-option");
        }
        else {
            this._elt = document.createElement("div");
            this._elt.classList.add("emoji-option");
        }
    }

    connectedCallback() {
        this.elt.textContent = JSON.stringify(this.attributesToObject());
        this.attributesObserver = new MutationObserver(mutations => this.onAttributeMutation(mutations))
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if(oldValue == newValue) return;
        this.elt.textContent = JSON.stringify(this.attributesToObject());
    }

    onAttributeMutation = (mutations: MutationRecord[])=> {
        if(this._elt === undefined) return; // attribute change is handled by the custom element itself
        for(const mutation of mutations) {
            if(mutation.type === "attributes" && mutation.attributeName) {
                if(mutation.oldValue === undefined) continue;
                this.attributeChangedCallback(mutation.attributeName, mutation.oldValue || "", this.elt.getAttribute(mutation.attributeName) || "")
            }
        }
    }

    private attributesToObject() {
        const result: {[key: string]: any} = {};
        const attributes = this.elt.attributes;
        for(let i = 0; i < attributes.length; i++) {
            switch (attributes[i].name) {
                case "shortcodes":
                    result[attributes[i].name] = attributes[i].value.split(",").map(s => s.trim());
                    break;
                case "tags":
                    result[attributes[i].name] = attributes[i].value.split(",").map(s => s.trim());
                    break;
                default:
                    result[attributes[i].name] = attributes[i].value;
            }
        }
        return result;
    }

    set emoji(value: string | undefined) {
        if(value === undefined) {
            if (this.elt.hasAttribute("emoji"))
                this.elt.removeAttribute("emoji");
            return;
        }
        this.elt.setAttribute("emoji", value);
    }
    get emoji() {return this.elt.getAttribute("emoji") || undefined}

    set label(value: string | undefined) {
        if(value === undefined) {
            if (this.elt.hasAttribute("label"))
                this.elt.removeAttribute("label");
            return;
        }
        this.elt.setAttribute("label", value);
    }
    get label() {return this.elt.getAttribute("label") || undefined;}

    set shortcodes(value: string[] | string | undefined) {
        if(value === undefined) {
            if (this.elt.hasAttribute("shortcodes"))
                this.elt.removeAttribute("shortcodes");
            return;
        }
        if(typeof value === "string")
            this.elt.setAttribute("shortcodes", value);
        else
            this.elt.setAttribute("shortcodes", value.join(","));
    }
    get shortcodes(): string[] {return (this.elt.getAttribute("shortcodes") || "").split(",").map(s => s.trim());}

    set tags(value: string[] | string | undefined) {
        if(value === undefined) {
            if (this.elt.hasAttribute("tags"))
                this.elt.removeAttribute("tags");
            return;
        }
        if(typeof value === "string")
            this.elt.setAttribute("tags", value);
        else
            this.elt.setAttribute("tags", value.join(","));
    }
    get tags(): string[] {return (this.elt.getAttribute("tags") || "").split(",").map(s => s.trim());}

    set favorite(value: boolean) {
        if(!value) {
            if (this.elt.hasAttribute("favorite"))
                this.elt.removeAttribute("favorite");
            return;
        }
        this.elt.setAttribute("favorite", value ? "true" : "false");
    }
    get favorite() {return this.elt.hasAttribute("favorite") && this.elt.getAttribute("favorite") === "true";}

    set JSONData(value: Partial<Emoji>) {
        this.elt.textContent = JSON.stringify(value);
        for(const attr of EmojiSelectorOption.observedAttributes) {
            // @ts-ignore
            if(value[attr] !== undefined)
                // @ts-ignore
                this.elt.setAttribute(attr, value[attr]);
        }
    }
    get JSONData(): Partial<Emoji> {
        if(this.elt.textContent !== "") {
            try {
                return JSON.parse(this.elt.textContent || "{}") as Emoji;
            } catch (e) {
                console.error("Error parsing emoji option: ", this.elt.textContent);
            }
        }
        return {
            emoji: this.emoji || "",
            label: this.label || "",
            tags: this.tags,
            shortcodes: this.shortcodes,
        }
    }

    get element() {return this.elt;}
    set element(value: HTMLElement) {// TODO
    }
}

function domNodeToReact(node: Node | null): React.ReactNode {
    if (!node) return null;
    if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        const tag = el.tagName.toLowerCase();
        const props: { [k: string]: any } = {};
        for (let i = 0; i < el.attributes.length; i++) {
            const attr = el.attributes[i];
            const name = attr.name === "class" ? "className" : attr.name;
            if(name === "style") {
                props[name] = {};
                for(const style of attr.value.split(";")) {
                    const [key, value] = style.split(":");
                    props[name][key.trim()] = value.trim();
                }
            }
            else
                props[name] = attr.value;
        }
        const children = Array.from(el.childNodes).map((n) => domNodeToReact(n));
        return React.createElement(tag, props, ...children);
    }
    return null;
}

export class SelectorHeadingComponent {
    private _elt: HTMLElement;
    private get elt() {
        return this._elt;
    }
    private set elt(elt: HTMLElement) {
        this._elt = elt;
    }

    constructor(elt?: HTMLElement) {
        this._elt = elt || document.createElement("div");
        this._elt.id = "selector-heading";
    }

    connectedCallback() {
        this.validateContent()
    }

    render() {
        if(!this.validateContent()) return;
        const child = this.elt.children[0];
        if(!child) return;
        else {
            return domNodeToReact(child);
        }
    }


    /**
     * check if the content of the element is valid
     * this element should contain a single child (text node or normal node with other children)
     * @private
     */
    private validateContent(): boolean {
        if(this.elt.children.length > 1) {
            console.error("SelectorHeadingComponent should contain a single child element.")
            return false;
        }
        return true;
    }
}
