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
export default class EmojiSelector extends HTMLElement {
    static observedAttributes = ["value", "mode", "x", "y", "placement", "h", "w"]

    private reactRoot: Root | null = null;
    private popupBackground: HTMLDivElement | null = null;
    private _display = false;
    private _focusedEmojiIndex = 0; // The index of the currently focused emoji in selector
    private _debugText: string = ""
    private _inDocument = false;

    private observer: MutationObserver | null = null;

    public onResize: (geometry: EmojiSelectorGeometry) => void = () => {};
    public onToggleEmojiFavorite: (emoji: Emoji) => void = (e) => {this.toggleFavorite(e.emoji)};
    public onBlur: () => void = () => {console.log("blur")};
    public onClose: () => void = () => {console.log("close")};
    private boundKeydownListener: (e: KeyboardEvent) => void = this.onKeyDown.bind(this);

    constructor() {
        super()
    }

    connectedCallback() {
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


        this.attachShadow({mode: 'open'});
        // @ts-ignore
        this.shadowRoot!.addEventListener('keydown', this.boundKeydownListener, {capture: true});
        this.addEventListener('blur', () => {this.onBlur()});

        this.classList.add('emojeezer');
        const mergedCss = mergeCss(resetCss, baseCss, /:host\s?/i);
        const styleSheet = new CSSStyleSheet();
        styleSheet.replaceSync(mergedCss);

        this.shadowRoot!.adoptedStyleSheets = [styleSheet, componentSheet, emojiCardSheet];

        this.reactRoot = createRoot(this.popupBackground);
        this.reactRoot.render(this.boundComponent());
        this.shadowRoot!.appendChild(this.popupBackground);
        this._inDocument = true;
        this.observer = new MutationObserver(this.onMutation.bind(this));
        this.observer.observe(this, {childList: true, subtree: true, characterData: true, characterDataOldValue: true});
    }

    disconnectedCallback() {
        this.reactRoot?.unmount();
        this.reactRoot = null;
        this.popupBackground?.remove();
        this.popupBackground = null;
        this._inDocument = false;
    }

    connectedMoveCallback() {
        if(this._inDocument) {
            this.reactRoot?.render(this.boundComponent());
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
            this.reactRoot!.render(this.component());
    }

    private onMutation(mutations: MutationRecord[]) {
        this.validateChildList();
        if(this._inDocument)
            this.reactRoot!.render(React.createElement(this.boundComponent));
    }

    private validateChildList() {
        for(let i = this.children.length - 1; i >= 0; i--) {
            const child = this.children[i];
            if(child.tagName.toLowerCase() !== "emoji-option" && child.tagName.toLowerCase() !== "selector-heading") {
                console.warn("EmojiSelector only accepts EmojiOption or SelectorHeading elements as children. Ignoring: ", child, " (index: ", i, ")");
                this.removeChild(child);
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
            this.reactRoot!.render(this.component());
    }
    focusDown() {
        if(this._focusedEmojiIndex < this.options.length - 1) {
            this._focusedEmojiIndex++;
        }
        else
            this._focusedEmojiIndex = 0;
        this.fireInputEvent()
        if(this._inDocument)
            this.reactRoot!.render(this.component());
    }

    getFocusedEmoji() {
        return this.options[this._focusedEmojiIndex];
    }
    setFocusedEmoji(index: number) {
        if(index < 0 || index >= this.options.length) return;
        this._focusedEmojiIndex = index;
        if(this._inDocument)
            this.reactRoot!.render(this.component());
    }

    private fireInputEvent() {
        const evt = new Event('input', {bubbles: true});
        this.dispatchEvent(evt);
    }

    private fireChangeEvent() {
        const evt = new Event('change', {bubbles: true});
        this.dispatchEvent(evt);
    }

    addEventListener<K extends keyof EmojiSelectorEventMap>(type: K, listener: (this: HTMLElement, ev: EmojiSelectorEventMap[K]) => any, options?: boolean | AddEventListenerOptions) {
        super.addEventListener(type, listener, options);
    }

    private component() {
        const headingElt = this.getElementsByTagName("selector-heading")[0] as SelectorHeadingComponent | undefined;
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
            onEmojiSelected : this.onEmojiSelected.bind(this),
            onResize : this.onResize,
            onToggleEmojiFavorite : this.onToggleEmojiFavorite
        });
    }
    private boundComponent = this.component.bind(this);

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

    private onEmojiSelected(emoji: Emoji) {
        this.value = emoji.emoji;
        this.fireChangeEvent();
    }

    set options(value: Emoji[]) {
        for(const child of this.children) {
            if(child.tagName.toLowerCase() === "emoji-option")
                this.removeChild(child);
        }
        for(const emoji of value) {
            const opt = document.createElement("emoji-option") as EmojiSelectorOptionElement;
            opt.JSONData = emoji;
            this.appendChild(opt);
        }
        if(this._inDocument)
            this.reactRoot!.render(React.createElement(this.boundComponent));
    }
    get options() {
        const list: Emoji[] = [];
        for(const child of this.children) {
            if(child.tagName.toLowerCase() === "emoji-option") {
                const opt = child as EmojiSelectorOptionElement;
                list.push(opt.JSONData as Emoji);
            }
        }
        return list;
    }

    set display(value: boolean) {
        this._display = value;
        this.style.display = this._display ? 'block' : 'none';
        if(this._inDocument && this._display) {}
            this.reactRoot!.render(React.createElement(this.boundComponent));
    }
    get display() {return this._display;}

    /** set the absolute position of the selector on the page */
    set position(value: Partial<{x: number, y: number}>) {
        if(value.x !== undefined) this.setAttribute("x", value.x.toString());
        if(value.y !== undefined) this.setAttribute("y", value.y.toString());
        if(this._inDocument)
            this.reactRoot!.render(React.createElement(this.boundComponent));
    }
    get position(): {x: number, y: number} {
        return {
            x: parseInt(this.getAttribute("x") || "0"),
            y: parseInt(this.getAttribute("y") || "0")
        };
    }

    set placement(value: "up" | "down") {
        this.setAttribute("placement", value);
        if(this._inDocument)
            this.reactRoot!.render(React.createElement(this.boundComponent));
    }
    get placement() {
        const attrValue = this.getAttribute("placement");
        if(attrValue !== "up" && attrValue !== "down") {
            console.warn("Invalid placement attribute value: ", attrValue, ". Using 'down' instead.")
            this.setAttribute("placement", "down");
            return "down";
        }
        return attrValue;
    }

    set mode(value: "static" | "absolute" | "relative" | "fixed" | "sticky") {
        if(value === "static")
            this.popupBackground?.classList.remove("popupBackground")
        else
            this.popupBackground?.classList.add("popupBackground")
        this.setAttribute("mode", value);
    }
    get mode() {
        const attrValue = this.getAttribute("mode");
        if(attrValue !== "static" && attrValue !== "absolute" && attrValue !== "relative" && attrValue !== "fixed" && attrValue !== "sticky") {
            console.warn("Invalid mode attribute value: ", attrValue, ". Using 'static' instead.")
            this.setAttribute("mode", "absolute");
            return "static";
        }
        return attrValue;
    }

    set shape(value: Partial<{w: number, h: number}>) {
        if(value.w !== undefined) this.setAttribute("w", value.w.toString());
        if(value.h !== undefined) this.setAttribute("h", value.h.toString());
        if(this._inDocument)
            this.reactRoot!.render(React.createElement(this.boundComponent));
    }
    get shape(): {w: number, h: number} {
        return {
            w: parseInt(this.getAttribute("w") || "0"),
            h: parseInt(this.getAttribute("h") || "0")
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
            this.reactRoot!.render(React.createElement(this.boundComponent));
    }

    set favoriteEmojis(value: string[]) {
        for(const child of this.children) {
            if(child.tagName.toLowerCase() === "emoji-option") {
                const opt = child as EmojiSelectorOptionElement
                if(opt.emoji && value.includes(opt.emoji))
                    opt.favorite = true;
                else
                    opt.favorite = false;
            }
        }
        if(this._inDocument)
            this.reactRoot!.render(React.createElement(this.boundComponent));
    }
    toggleFavorite(emoji: string) {
        for(const child of this.children) {
            if(child.tagName.toLowerCase() === "emoji-option") {
                const opt = child as EmojiSelectorOptionElement
                if(opt.emoji && emoji === opt.emoji)
                    opt.favorite = !opt.favorite;
            }
        }
    }
    get favoriteEmojis() {
        const list: string[] = [];
        for(const elt of this.children) {
            if(elt.tagName.toLowerCase() === "emoji-option") {
                const opt = elt as EmojiSelectorOptionElement;
                if(opt.favorite && opt.emoji !== undefined)
                    list.push(opt.emoji);
            }
        }
        return list;
    }

    /** set a text that will be shown in the selector for debugging purposes */
    set debugText(value: string) {
        this._debugText = value;
        if(this._inDocument)
            this.reactRoot!.render(React.createElement(this.boundComponent));
    }

    get hasFocus(): boolean {
        return this.contains(document.activeElement);
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

}

export class EmojiSelectorOptionElement extends HTMLElement {
    static observedAttributes = ["emoji", "label", "shortcodes", "tags", "favorite"]

    private observer: MutationObserver | null = null;

    constructor() {
        super();
    }

    connectedCallback() {
        this.textContent = JSON.stringify(this.attributesToObject());
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if(oldValue == newValue) return;
        this.textContent = JSON.stringify(this.attributesToObject());
    }

    private attributesToObject() {
        const result: {[key: string]: any} = {};
        const attributes = this.attributes;
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
            if (this.hasAttribute("emoji"))
                this.removeAttribute("emoji");
            return;
        }
        this.setAttribute("emoji", value);
    }
    get emoji() {return this.getAttribute("emoji") || undefined}

    set label(value: string | undefined) {
        if(value === undefined) {
            if (this.hasAttribute("label"))
                this.removeAttribute("label");
            return;
        }
        this.setAttribute("label", value);
    }
    get label() {return this.getAttribute("label") || undefined;}

    set shortcodes(value: string[] | string | undefined) {
        if(value === undefined) {
            if (this.hasAttribute("shortcodes"))
                this.removeAttribute("shortcodes");
            return;
        }
        if(typeof value === "string")
            this.setAttribute("shortcodes", value);
        else
            this.setAttribute("shortcodes", value.join(","));
    }
    get shortcodes(): string[] {return (this.getAttribute("shortcodes") || "").split(",").map(s => s.trim());}

    set tags(value: string[] | string | undefined) {
        if(value === undefined) {
            if (this.hasAttribute("tags"))
                this.removeAttribute("tags");
            return;
        }
        if(typeof value === "string")
            this.setAttribute("tags", value);
        else
            this.setAttribute("tags", value.join(","));
    }
    get tags(): string[] {return (this.getAttribute("tags") || "").split(",").map(s => s.trim());}

    set favorite(value: boolean) {
        if(!value) {
            if (this.hasAttribute("favorite"))
                this.removeAttribute("favorite");
            return;
        }
        this.setAttribute("favorite", value ? "true" : "false");
    }
    get favorite() {return this.hasAttribute("favorite") && this.getAttribute("favorite") === "true";}

    set JSONData(value: Partial<Emoji>) {
        this.textContent = JSON.stringify(value);
        for(const attr of EmojiSelectorOptionElement.observedAttributes) {
            // @ts-ignore
            if(value[attr] !== undefined)
                // @ts-ignore
                this.setAttribute(attr, value[attr]);
        }
    }
    get JSONData(): Partial<Emoji> {
        if(this.textContent !== "") {
            try {
                return JSON.parse(this.textContent || "{}") as Emoji;
            } catch (e) {
                console.error("Error parsing emoji option: ", this.textContent);
            }
        }
        return {
            emoji: this.emoji || "",
            label: this.label || "",
            tags: this.tags,
            shortcodes: this.shortcodes,
        }
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

export class SelectorHeadingComponent extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.validateContent()
    }

    render() {
        if(!this.validateContent()) return;
        const child = this.children[0];
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
        if(this.children.length > 1) {
            console.error("SelectorHeadingComponent should contain a single child element.")
            return false;
        }
        return true;
    }
}
