import React from 'react';
import {createRoot, Root} from 'react-dom/client';
import Selector from "./Components/Selector";
import {Emoji} from "emojibase";
import {getCssTheme, getRecommendedThemeMode, mergeStyleSheets} from "@theme/theme-utils";

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

import {fetchGroups, getEmojisForGroup} from "@src/emoji/emoji-content";
import browser from "webextension-polyfill";

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
 * @property {function} onEmojiChosen - a callback function that will be executed when an emoji is selected (for example when the user click on the interface)
 */
export default class EmojiSelector {
    static observedAttributes = ["value", "mode", "x", "y", "placement", "h", "w", "background-blur", "theme-mode", "presentation"]

    private reactRoot: Root | null = null;
    private popupBackground: HTMLDivElement | null = null;
    private sr: ShadowRoot | null = null;
    private _display = false;
    private _focusedEmojiIndex = 0; // The index of the currently focused emoji in selector
    private _yIndex = 0;
    private _debugText = ""
    private _inDocument = false;
    private _elt: HTMLElement;
    private _favoriteEmojis: string[] = [];
    private _themePromise = getCssTheme(":root, :host").then((th: string) => (this._theme = th));
    private _theme: string | undefined = undefined;
    private _appliedColorScheme : "light" | "dark" | "system" = "system"
    private _currentGroup: number = 0;
    private _allGroups: Record<number, string> = {};
    private _browserContent: Emoji[][] = []
    // private readonly boundComponent = () => this.component();

    private observer: MutationObserver | null = null;
    private attributesObserver: MutationObserver | null = null;

    public onResize: (geometry: EmojiSelectorGeometry) => void = () => {};
    public onToggleEmojiFavorite: (emoji: Emoji) => void = (e) => {};
    public onEmojiChosen: (emoji: Emoji) => void = (e) => {};
    public onBlur: () => void = () => {};
    public onClose: () => void = () => {};
    public onGroupChanged: (groupId: number) => void = (groupId) => {};

    constructor(elt?: HTMLElement) {
        if(elt)
            this._elt = elt;
        else
            this._elt = document.createElement('div');
        this.elt.id = "emojeezer";
    }

    connectedCallback() {
        this.sr = this.elt.attachShadow({mode: 'open'});
        this.sr.addEventListener('focus', this.boundOnFocus, {capture: true});

        this.elt.classList.add('emojeezer');

        if(!this._theme)
            this._themePromise.then(() => this.updateTheme(this._theme!));
        else
            this.updateTheme(this._theme)

        this.popupBackground = document.createElement('div');
        /*        if(this.mode !== "static")
                    this.popupBackground.classList.add('popupBackground');*/
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
        this.popupBackground.addEventListener('blur', () => {this.onBlur()});

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
        this._inDocument = false;
    }

    connectedMoveCallback() {
        if(this._inDocument) {
            this.renderReact()
        }
    }

    private updateTheme(themeVariables: string) {
        const mergedSheet = mergeStyleSheets(resetSheet, baseSheet, /:host\s?/i);
        let styleSheet: CSSStyleSheet;
        if(this.themeMode === "color" && themeVariables !== "") {
            const themeSheet = new CSSStyleSheet();
            themeSheet.replaceSync(themeVariables);
            styleSheet = mergeStyleSheets(mergedSheet, themeSheet, /:host\s?/i);
            getRecommendedThemeMode().then((mode: any) => {
                this.appliedColorScheme = mode;
            })
        }
        else {
            const emptySheet = new CSSStyleSheet();
            emptySheet.replaceSync("");
            styleSheet = mergeStyleSheets(mergedSheet, emptySheet, /:host\s?/i);
            if(this.themeMode === "system" || this.themeMode === "color")
                this._appliedColorScheme = "system";
            else
                this._appliedColorScheme = this.themeMode
        }
        const sheets = [emojiCardSheet, componentSheet, styleSheet]
        if(!this.sr)
            return
        // @ts-ignore
        const unwrappedSr = this.sr.wrappedJSObject
        for(let i = unwrappedSr.adoptedStyleSheets.length - 1; i >= 0; i--) {
            unwrappedSr.adoptedStyleSheets.pop();
        }
        sheets.forEach((s) => {
            unwrappedSr.adoptedStyleSheets.push(s)
        })
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
            case "background-blur":
                this.backgroundBlur = (newValue === "true")
                break;
            case "theme-mode":
                if(newValue !== "light" && newValue !== "dark" && newValue !== "system" && newValue !== "color") {
                    console.warn("Invalid theme-mode attribute value: ", newValue, ". Using 'light' instead.")
                    this.themeMode = "light";
                }
                else
                    this.themeMode = newValue;
                break;
            case "presentation":
                this.presentation = newValue as "results" | "browser";
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

    getFocusedEmoji() {
        if(this.presentation === "results") {
            return this.options[this._focusedEmojiIndex];
        }
        else {
            return this._browserContent[this._focusedEmojiIndex][this._yIndex];
        }
    }
    setFocusedEmoji(index: number, y: number = -1) {
        if(this.presentation !== "browser") {
            if (index < 0 || index >= this.options.length) {
                if (index === -1) return;
                console.error("Invalid index for focused emoji: ", index, ". Must be between 0 and ", this.options.length - 1);
                return;
            }
        }
        else if(index < 0 || index >= this._browserContent.length) {
            console.error("Invalid index for focused emoji: ", index, ". Must be between 0 and ", this._browserContent.length - 1);
            return;
        }
        this._focusedEmojiIndex = index;
        if(y !== -1) {
            if(y < 0 || y >= this._browserContent[this._focusedEmojiIndex].length) {
                console.error("Invalid y index for focused emoji: ", y, ". Must be between 0 and ", this._browserContent[this._focusedEmojiIndex].length - 1);
                return;
            }
            this._yIndex = y
        }
        if(this._inDocument)
            this.renderReact()
    }
    getFocusedEmojiIndex() {
        if(this._yIndex !== -1) {
            return {x: this._focusedEmojiIndex, y: this._yIndex}
        }
        else
            return this._focusedEmojiIndex;
    }

    getEmojiIndex(ej: string): number | {x: number, y: number} {
        if(this.presentation === "browser") {
            const x = this._browserContent.findIndex(r => r.findIndex(e => e.emoji === ej) !== -1);
            const y = this._browserContent[x]?.findIndex(e => e.emoji === ej);
            return {x, y};
        }
        else
            return this.options.findIndex(e => e.emoji === ej);
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
        if(this._inDocument) {
            this.remove();
        }
        parent.appendChild(this.elt);
        this.connectedCallback();
    }

    remove() {
        this.elt.remove();
        this.disconnectedCallback();
    }

    focus() {
        if(this.popupBackground)
            this.popupBackground.focus();
        else
            this.elt.focus();
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
            themeMode: this._appliedColorScheme,
            backgroundBlur : this.backgroundBlur,
            shape : this.shape,
            searchResults : this.presentation === "results" ? this.options : this._browserContent,
            favorites : this.favoriteEmojis,
            selectedEmojiIndexX : this._focusedEmojiIndex,
            selectedEmojiIndexY : this._yIndex,
            children : heading,
            onEmojiSelected : this.onEmojiSelected,
            onResize : this.onResize,
            onToggleEmojiFavorite : this.onToggleEmojiFavorite,
            presentation : this.presentation,
            onSwitchGroup : this.onSwitchGroup.bind(this),
            currentGroup : this._currentGroup,
            groups : this._allGroups,
        });
    }

    private renderReact = () => {
        if(!this._inDocument) return;
        this.reactRoot!.render(this.component());
    }

    private onFocus(evt: Event) {
    }
    private boundOnFocus = this.onFocus.bind(this);

    private async onSwitchGroup(groupId: number) {
        if((groupId < 0) || (this._allGroups[groupId] == undefined)) {
            console.warn("Invalid group ID: ", groupId);
            return;
        }
        this._currentGroup = groupId;
        this.onGroupChanged(groupId);
        this._browserContent = []
        const emojis = await getEmojisForGroup(this._currentGroup)
        const columns = 10 // Math.ceil(Math.sqrt(emojis.length));

        this.geometry = {
            shape: {w: 0, h: 49 * 10},
        }
        let row = []
        for(let i = 0; i < emojis.length; i++) {
            for(let j = 0; j < columns; j++) {
                row.push(emojis[i]);
                i++;
            }
            this._browserContent.push(row);
            row = []
        }
        if(this._inDocument)
            this.renderReact();
    }

    private onEmojiSelected = (emoji: Emoji)=> {
        if(this.presentation == "results")
            this.setFocusedEmoji(this.options.findIndex(e => e.emoji === emoji.emoji) || 0);
        else {
            const x = this._browserContent.findIndex(r => r.findIndex(e => e.emoji === emoji.emoji) !== -1);
            const y = this._browserContent[x].findIndex(e => e.emoji === emoji.emoji);
            this.setFocusedEmoji(x, y);
        }
        this.value = emoji.emoji;
        //this.fireChangeEvent();
        this.onEmojiChosen(emoji);
    }

    private keydownListener(e: KeyboardEvent) {
        if(this.presentation !== "browser")
            return;
        console.log(e.key, e.ctrlKey);
        e.stopPropagation();
        e.preventDefault();
        const groupList = Object.entries(this._allGroups)
            .map(([key, value]) => ({id: parseInt(key), name: value}));
        const currentGroupIndex = groupList.findIndex(g => g.id === this._currentGroup);
        const nextGroupIndex = (currentGroupIndex + 1) % groupList.length ;
        const prevGroupIndex = (currentGroupIndex - 1 + groupList.length) % groupList.length;
        const nextGroup = groupList.length > 0 ? groupList[nextGroupIndex].id : 0;
        const prevGroup = groupList.length > 0 ? groupList[prevGroupIndex].id : 0;
        switch (e.key) {
            case "ArrowUp":
                if(this._focusedEmojiIndex > 0)
                    this.setFocusedEmoji(this._focusedEmojiIndex - 1, Math.min(this._yIndex, this._browserContent[this._focusedEmojiIndex-1].length - 1));
                else if(currentGroupIndex > 0) {
                    this.onSwitchGroup(prevGroup).then(() => {
                        const xIndex = Math.min(this._focusedEmojiIndex, this._browserContent[0].length)
                        this.setFocusedEmoji(xIndex, Math.min(this._yIndex, this._browserContent[xIndex].length - 1));
                    })
                }
                break;
            case "ArrowDown":
                if(this._focusedEmojiIndex < this._browserContent.length - 1)
                    this.setFocusedEmoji(this._focusedEmojiIndex + 1, Math.min(this._yIndex, this._browserContent[this._focusedEmojiIndex+1].length - 1));
                else if(currentGroupIndex < (groupList.length - 1)) {
                    this.onSwitchGroup(nextGroup + 1).then(() => {
                        this.setFocusedEmoji(0, Math.min(this._yIndex, this._browserContent[0].length - 1));
                    })
                }
                break;
            case "ArrowLeft":
                if(this._yIndex > 0)
                    this.setFocusedEmoji(this._focusedEmojiIndex, this._yIndex - 1);
                else if(this._focusedEmojiIndex > 0)
                    this.setFocusedEmoji(this._focusedEmojiIndex - 1, this._browserContent[this._focusedEmojiIndex-1].length - 1);
                else if(currentGroupIndex > 0) {
                    this.onSwitchGroup(prevGroup).then(() => {
                        const xIndex = Math.min(this._focusedEmojiIndex, this._browserContent.length)
                        this.setFocusedEmoji(xIndex, this._browserContent[xIndex].length - 1);
                    })
                }
                break;
            case "ArrowRight":
                if(this._yIndex < this._browserContent[this._focusedEmojiIndex].length - 1)
                    this.setFocusedEmoji(this._focusedEmojiIndex, this._yIndex + 1);
                else if(this._focusedEmojiIndex < this._browserContent.length - 1)
                    this.setFocusedEmoji(this._focusedEmojiIndex + 1, 0);
                else if(currentGroupIndex < (groupList.length - 1)) {
                    this.onSwitchGroup(nextGroup).then(() => {
                        this.setFocusedEmoji(0, 0);
                    })
                }
                break;
            case "Tab":
                if(e.shiftKey) {
                    if(currentGroupIndex > 0) {
                        this.onSwitchGroup(prevGroup).then(() => {
                            this.setFocusedEmoji(0, 0);
                        });
                    }
                }
                else if(currentGroupIndex < (groupList.length - 1)) {
                    this.onSwitchGroup(nextGroup).then(() => {
                        this.setFocusedEmoji(0, 0);
                    });
                }
                break;
            case "Enter":
                if(e.ctrlKey)
                    this.onToggleEmojiFavorite(this.getFocusedEmoji());
                else
                    this.onEmojiSelected(this.getFocusedEmoji());
                break;
            case "Escape":
                this.onClose();

        }
        // console.log(`x: ${this._focusedEmojiIndex}, y: ${this._yIndex}, h : ${this._browserContent.length}, w ${this._browserContent[this._focusedEmojiIndex]?.length}`)
    }
    boundKeydownListener = this.keydownListener.bind(this);
    //endregion

    //region getters and setters
    get theme(): string | undefined {
        return this._theme
    }
    set theme(value: string) {
        this._theme = value;
        this.updateTheme(value);
    }

    get groupIndex(): number {
        if (this.presentation === "results")
            return -1
        else
            return Object.entries(this._allGroups).findIndex(([key, value]) => parseInt(key) === this._currentGroup);
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
        /*        if(value === "static")
                    this.popupBackground?.classList.remove("popupBackground")
                else
                    this.popupBackground?.classList.add("popupBackground")*/
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
        if(this.presentation === "browser") {
            if (this.getEmojiIndex(emoji) !== -1) {
                const index = this.favoriteEmojis.indexOf(emoji);
                if(index !== -1)
                    this.favoriteEmojis.splice(index, 1);
                else
                    this.favoriteEmojis.push(emoji);
            }
        }
        else {
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

    set backgroundBlur(value: boolean) {
        this.elt.setAttribute("background-blur", value ? "true" : "false");
        if(this._inDocument)
            this.renderReact()
    }
    get backgroundBlur() {
        return this.elt.getAttribute("background-blur") === "true";
    }

    set themeMode(value: "light" | "dark" | "system" | "color") {
        if(value !== this.themeMode)
            this.elt.setAttribute("theme-mode", value);
        if(value === "color")
            this.updateTheme(this._theme || "");
        else
            this.updateTheme("")
        if(this._inDocument)
            this.renderReact()
    }
    get themeMode() {
        const attrValue = this.elt.getAttribute("theme-mode");
        if(attrValue !== "light" && attrValue !== "dark" && attrValue !== "system" && attrValue !== "color") {
            console.warn("Invalid theme-mode attribute value: ", attrValue, ". Using 'color' instead.")
            this.elt.setAttribute("theme-mode", "color");
            return "color";
        }
        return attrValue;
    }

    set presentation(value: "results" | "browser") {
        if(value !== this.presentation)
            this.elt.setAttribute("presentation", value);
        if(value === "browser") {
            fetchGroups().then(groups => {
                this._allGroups = groups
                if(this._inDocument)
                    this.renderReact()
            })
            getEmojisForGroup(this._currentGroup).then(emojis => {
                const columns = 10 // Math.ceil(Math.sqrt(emojis.length));

                this.geometry = {
                    shape: {w: 0, h: 49 * 10},
                }
                let row = []
                for(let i = 0; i < emojis.length; i++) {
                    for(let j = 0; j < columns; j++) {
                        row.push(emojis[i]);
                        i++;
                    }
                    this._browserContent.push(row);
                    row = []
                }
                this.elt.addEventListener("keydown", this.boundKeydownListener, {capture: true})
                if(this._inDocument)
                    this.renderReact()
            })
        }
        else {
            this._browserContent = [];
            this.elt.removeEventListener("keydown", this.boundKeydownListener, {capture: true})
        }
        if(this._inDocument)
            this.renderReact()
    }
    get presentation() {
        const attrValue = this.elt.getAttribute("presentation");
        if(attrValue !== "results" && attrValue !== "browser") {
            console.warn("Invalid presentation attribute value: ", attrValue, ". Using 'results' instead.")
            this.elt.setAttribute("presentation", "results");
            return "results";
        }
        return attrValue;
    }

    set appliedColorScheme(scheme: "light" | "dark" | "system") {
        this._appliedColorScheme = scheme;
        if(this._inDocument)
            this.renderReact()
    }
    get appliedColorScheme() {
        return this._appliedColorScheme;
    }

    /** set a text that will be shown in the selector for debugging purposes */
    set debugText(value: string) {
        this._debugText = value;
        if(this._inDocument)
            this.renderReact()
    }

    get hasFocus(): boolean {
        if(!this._inDocument) return false;
        return this.sr!.activeElement !== null;
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
    //endregion
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
