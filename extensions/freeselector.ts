import { Emoji } from "emojibase";
import {EmojiSelectorGeometry} from "@src/selector/emojiselector";
import EditableHandler from "../src/handler/editableHandler";

import css from "./freeselector.css?inline";
const sheet = new CSSStyleSheet();
sheet.replaceSync(css);
import resetCss from "@theme/reset.text.css"
import {getRecommendedThemeMode, mergeStyleSheets} from "@theme/theme-utils";
import baseCss from "@src/base.css?inline";
const resetSheet = new CSSStyleSheet();
resetSheet.replaceSync(resetCss);
const baseSheet = new CSSStyleSheet();
baseSheet.replaceSync(baseCss);

export default class FreeSelectorHandler extends EditableHandler<any> {
    static sites: string[] = ["*"];
    static targets: string[] = ["*"];
    static HandlerName: string = "FreeSelector";
    static canHandleTarget(target: any): boolean {
        return true;
    }

    sites: string[] = ["*"];
    targets: string[] = ["*"];
    HandlerName: string = "FreeSelector";
    canHandleTarget(target: any): boolean {
        return true;
    }

    searchBar: HTMLInputElement
    container: HTMLDivElement
    infoLine: HTMLParagraphElement
    modeSelector: HTMLDivElement
    searchButton: HTMLButtonElement
    browseButton: HTMLButtonElement
    navHint = document.createElement("span")
    root: HTMLDivElement = document.createElement("div");
    sr: ShadowRoot = this.root.attachShadow({mode: "open"});

    previousActiveElement: HTMLElement | null = null;
    private _browseMode = false;

    constructor(target: any) {
        const searchBar = document.createElement("input");
        const container = document.createElement("div");
        const info = document.createElement("p");
        const modeSelector = document.createElement("div");
        const searchButton = document.createElement("button");
        const browseButton = document.createElement("button");
        modeSelector.className = "modeSelector";
        searchBar.placeholder = "Search for emojis...";
        searchBar.type = "text";
        searchButton.onclick = () => this.switchMode("search");
        browseButton.onclick = () => this.switchMode("browse");
        searchButton.textContent = "Search";
        browseButton.textContent = "Browse";
        modeSelector.appendChild(searchButton);
        modeSelector.appendChild(browseButton);
        container.appendChild(modeSelector);
        container.appendChild(searchBar)
        info.innerHTML = `Press <span class="navigation-hint">Enter</span> to copy to the clipboard, <span class="navigation-hint">Ctrl + Enter</span> to set as favorite.<br/>`+
            `Use arrow keys to navigate.`

        container.appendChild(info)

        super(searchBar);

        this.sr.appendChild(container);
        this.readyPromise.then(() => {
            this.updateTheme();
        })

        this.mode = "default";

        this.searchBar = searchBar;
        this.container = container;
        this.infoLine = info;
        this.modeSelector = modeSelector
        this.searchButton = searchButton
        this.browseButton = browseButton

        this.container.className = "container"
        this.searchBar.className = "searchBar"
        this.infoLine.className = "info"
        this.navHint.className = "navigation-hint"

        this.navHint.textContent = "Tab"
        this.browseButton.appendChild(this.navHint)
        this._browseMode = false
        this.searchButton.classList.add("active");
    }

    //region actions ---

    enable(hidden: boolean = false): void {
        document.body.appendChild(this.root);
        this.searchBar.addEventListener("input", this.onSearchBarInput.bind(this));
        this.updateSearchBarGeometry()

        this.previousActiveElement = document.activeElement as HTMLElement | null;
        this.log(this.previousActiveElement)

        // get caret position
        const selection = window.getSelection();
        if(selection && selection.rangeCount > 0) {
            const caretPosition = selection.getRangeAt(0).startOffset || 0;
            this.log(null, "Caret position detected at: " + caretPosition);
        }
        this.searchBar.focus()
        this.es.onGroupChanged = this.onGroupChanged.bind(this)
        if(!hidden)
            this.es.display = true

        super.enable();
    }

    disable() {
        document.body.removeChild(this.root);
        this.searchBar.removeEventListener("input", this.onSearchBarInput.bind(this));
        if(this.previousActiveElement) {
            this.previousActiveElement.focus();
        }
        super.disable();
    }

    switchMode(mode: "search" | "browse") {
        if(mode === "search") {
            this.es.presentation = "results"
            this._browseMode = false
            this.es.geometry = this.getSelectorGeometry()
            this.searchButton.classList.add("active");
            this.navHint.remove()
            this.browseButton.classList.remove("active");
            this.browseButton.appendChild(this.navHint)
            this.searchBar.style.display = "block"
            this.searchBar.focus()
            this.navHint.textContent = "Tab"
        }
        else if (mode === "browse") {
            this.es.presentation = "browser"
            this._browseMode = true
            this.es.focus()
            this.browseButton.classList.add("active");
            this.navHint.remove()
            this.searchButton.classList.remove("active");
            this.searchButton.appendChild(this.navHint)
            this.searchBar.style.display = "none"
            this.navHint.textContent = "Shift + Tab"
        }
    }

    //endregion

    //region listeners ---

    protected handleDocumentKeyDown(e: KeyboardEvent) {

        if(e.key === "Tab") {
            e.preventDefault();
            if(this._browseMode && e.shiftKey) {
                if(this.es.groupIndex === 0) {
                    e.stopPropagation();
                    this.switchMode("search")
                    return
                }
            }
            else if(!e.shiftKey && !this._browseMode) {
                this.switchMode("browse")
                return;
            }
        }
        if(this._browseMode) {
            if(e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight")
                return
        }
        else
            super.handleDocumentKeyDown(e);
    }

    private onGroupChanged(groupId: number) {
        if(!this._browseMode)
            return
        if(this.es.groupIndex === 0) {
            this.searchButton.appendChild(this.navHint)
        }
        else
            this.navHint.remove()
    }

    //endregion

    //region protected methods ---

    private updateTheme() {
        const themeVariables = this.themeVariables
        const mergedCss = mergeStyleSheets(resetSheet, baseSheet, /:host\s?/i);
        const emptySheet = new CSSStyleSheet()
        emptySheet.replaceSync("")
        let styleSheet = mergeStyleSheets(mergedCss, emptySheet, "")
        if(this.userData.settings.themeMode === "color") {
            getRecommendedThemeMode().then((mode) => {
                if(mode === "system")
                    this.container.style.colorScheme = "light dark"
                else
                    this.container.style.colorScheme = mode;
            })
            const themeSheet = new CSSStyleSheet();
            themeSheet.replaceSync(themeVariables);
            styleSheet = mergeStyleSheets(mergedCss, themeSheet, /:host\s?/i);
        }
        else if (this.userData.settings.themeMode === "system")
            this.container.style.colorScheme = "light dark"
        else
            this.container.style.colorScheme = this.userData.settings.themeMode;

        if(this.userData.settings.transparentBackground)
            this.container.classList.add("transparent")
        else
            this.container.classList.remove("transparent")

        const sheets = [styleSheet, sheet]
        // @ts-ignore
        const unwrappedSr = this.sr.wrappedJSObject
        for(let i = unwrappedSr.adoptedStyleSheets.length - 1; i >= 0; i--) {
            unwrappedSr.adoptedStyleSheets.pop();
        }
        sheets.forEach((s) => {
            unwrappedSr.adoptedStyleSheets.push(s)
        })
    }

    protected onThemeUpdated() {
        this.updateTheme()
        super.onThemeUpdated();
    }

    getSelectorGeometry(): Partial<EmojiSelectorGeometry> {
        const g = this.getSearchBarGeometry();
        return {
            position: {
                x: g.x,
                y: g.y + g.height + 30,
            },
            shape: this._browseMode ? {
                w: 0,
                h: 0,
            } : {
                w: g.width - 10,
                h: 0
            },
            placement: "down",
            positionMode: "fixed"
        };
    }

    getSearchBarGeometry(sg?: EmojiSelectorGeometry) {
        return {
            x: window.innerWidth / 2 - 200,
            y: 150,
            width: 400,
            height: 150
        };
    }

    updateSearchBarGeometry(selectorGeometry?: EmojiSelectorGeometry) {
        this.log(selectorGeometry, "Updating search bar geometry");
        const g = this.getSearchBarGeometry(selectorGeometry);
        this.container.style.left = g.x + "px";
        this.container.style.top = g.y + "px";
        this.container.style.width = g.width + "px";
        this.container.style.height = g.height + "px";
    }

    protected async insertEmoji(emoji: Emoji) {
        navigator.clipboard.writeText(emoji.emoji).then(() => {
            this.log(null, "Emoji copied to clipboard: " + emoji.emoji);
        }, (err) => {
            this.error(null, "Could not copy emoji: ", err);
        });
    }

    dismissSearch(trigger: string) {
        if(trigger == "SEARCH_EMPTIED" || trigger == "INVALID_SEARCH") {
            return
        }
        super.dismissSearch(trigger);
    }
    //endregion

    //region protected event listeners ---

    protected onActiveElementChanged(e: FocusEvent): void  {
        if(this.root.contains(document.activeElement))
            return
        super.onActiveElementChanged(e);
    }

        protected onDocumentPointerEvent(e: MouseEvent) {
            if(this.root.contains(e.target as Node))
                return
            super.onDocumentPointerEvent(e);
        }

    onSearchBarInput(e: Event): void {
        this.search = this.searchBar.value;
    }
    //endregion

    //region getters and setters ---
    get browseMode(): "search" | "browse" {
        return this._browseMode ? "browse" : "search";
    }
    //endregion

    //region protected hooks ---

    protected onDestroy(): void {
        this.searchButton.onclick = null;
        this.browseButton.onclick = null;
        super.onDestroy();
    }
    //endregion
}