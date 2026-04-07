import { Emoji } from "emojibase";
import {EmojiSelectorGeometry} from "@src/selector/emojiselector";
import EditableHandler from "../src/handler/editableHandler";

import css from "./freeselector.css?inline";
const sheet = new CSSStyleSheet();
sheet.replaceSync(css);
import resetCss from "@theme/reset.text.css"
import {mergeCss} from "@theme/theme-utils";
import baseCss from "@src/base.css?inline";
const resetSheet = new CSSStyleSheet();
resetSheet.replaceSync(resetCss);
console.log(css, baseCss, resetCss)

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
    root: HTMLDivElement = document.createElement("div");
    sr: ShadowRoot = this.root.attachShadow({mode: "open"});

    previousActiveElement: HTMLElement | null = null;

    constructor(target: any) {
        const searchBar = document.createElement("input");
        const container = document.createElement("div");
        const info = document.createElement("p");
        searchBar.placeholder = "Search for emojis...";
        searchBar.type = "text";
        container.appendChild(searchBar)
        info.textContent = "Press Enter to copy the selected emoji to clipboard";
        container.appendChild(info)

        super(searchBar);

        this.sr.appendChild(container);
        this.updateTheme();

        this.mode = "default";

        this.searchBar = searchBar;
        this.container = container;
        this.infoLine = info;

        this.container.className = "container"
        this.searchBar.className = "searchBar"
        this.infoLine.className = "info"
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

        super.enable();
        if(!hidden)
            this.es.display = true
    }

    disable() {
        document.body.removeChild(this.root);
        this.searchBar.removeEventListener("input", this.onSearchBarInput.bind(this));
        if(this.previousActiveElement) {
            this.previousActiveElement.focus();
        }
        super.disable();
    }

    //endregion

    //region protected methods ---

    private updateTheme() {
        const themeVariables = this.es.theme || ""
        if(themeVariables === "")
            this.warn(null, "No theme variables found for EmojiSelector. Using default theme.")
        const mergedCss = mergeCss(resetCss, baseCss, /:host\s?/i);
        const styleSheet = new CSSStyleSheet()
        styleSheet.replaceSync(mergeCss(mergedCss, themeVariables, /:host\s?/i));
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

    getSelectorGeometry(): Partial<EmojiSelectorGeometry> {
        const g = this.getSearchBarGeometry();
        return {
            position: {
                x: g.x,
                y: g.y + g.height + 5,
            },
            shape: {
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
            height: 50
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

    //region protected hooks ---

    protected onDestroy(): void {
        super.onDestroy();
    }
    //endregion
}