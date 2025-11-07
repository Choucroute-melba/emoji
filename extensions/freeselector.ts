import { Emoji } from "../src/emoji/emoji";
import EmojiSelector, {EmojiSelectorGeometry, EmojiSelectorPosition} from "../src/selector/emojiselector";
import EditableHandler from "../src/handler/editableHandler";
import s from "./freeselector.module.css";
import {applyInlineFromClasses} from "./freeselector-utils";

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

    previousActiveElement: HTMLElement | null = null;

    constructor(es: EmojiSelector, target: any, onExit: () => void = () => {}) {
        const searchBar = document.createElement("input");
        const container = document.createElement("div");
        const info = document.createElement("p");
        searchBar.placeholder = "Search for emojis...";
        searchBar.type = "text";
        container.appendChild(searchBar)
        info.textContent = "Press Enter to copy the selected emoji to clipboard";
        container.appendChild(info)
        document.body.appendChild(container);

        super(es, searchBar, onExit);

        this.mode = "default";

        this.searchBar = searchBar;
        this.container = container;
        this.infoLine = info;


        // Inline the CSS declarations from these classes to prevent host overrides
        applyInlineFromClasses(this.container, [s.reset, s.container]);
        applyInlineFromClasses(this.searchBar, [s.reset, s.searchBar]);
        applyInlineFromClasses(this.infoLine, [s.reset, s.info]);

        this.searchBar.addEventListener("input", this.onSearchBarInput.bind(this));
        this.active = true;
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
    }

/*    protected onFocusLost() {
        this.log(null, "Focus lost")
        super.onFocusLost();
    }*/

    onSearchBarInput(e: Event): void {
        this.search = this.searchBar.value;
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
        navigator.clipboard.writeText(emoji.unicode).then(() => {
            this.log(null, "Emoji copied to clipboard: " + emoji.unicode);
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

    protected onDestroy(): void {
        document.body.removeChild(this.container);
        this.searchBar.removeEventListener("input", this.onSearchBarInput.bind(this));
        if(this.previousActiveElement) {
            this.previousActiveElement.focus();
        }
        super.onDestroy();
    }

}