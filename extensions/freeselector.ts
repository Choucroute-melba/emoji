import { Emoji } from "../src/emoji/emoji";
import EmojiSelector, {EmojiSelectorPosition} from "../src/selector/emojiselector";
import {EditableHandler} from "../src/package-entry";

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
    info: HTMLParagraphElement

    constructor(es: EmojiSelector, target: any) {
        const searchBar = document.createElement("input");
        const container = document.createElement("div");
        const info = document.createElement("p");
        searchBar.placeholder = "Search for emojis...";
        searchBar.style.width = "100%";
        container.appendChild(searchBar)
        info.textContent = "Press Enter to copy the selected emoji to clipboard";
        info.style.fontFamily = "TwitterChirp, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif"
        info.style.fontSize = "12px";
        container.appendChild(info)
        container.style.backgroundColor = "white";
        document.body.appendChild(container);
        super(es, searchBar);
        this.mode = "default";
        this.searchBar = searchBar;
        this.container = container;
        this.info = info;
        this.searchBar.type = "text";
        this.container.style.position = "fixed";
        this.container.style.zIndex = "9999";
        this.container.style.width = "200px";
        this.container.style.height = "30px";
        this.container.style.boxShadow = "0 0 10px 0 rgba(0, 0, 0, 0.5)";
        this.container.style.display = "flex";
        this.container.style.justifyContent = "center";
        this.container.style.alignItems = "center";
        this.container.style.flexDirection = "column";
        this.container.style.padding = "5px";
        this.searchBar.addEventListener("input", this.onSearchBarInput.bind(this));
        this.active = true;
        this.updateSearchBarGeometry()
        this.searchBar.focus();
        window.addEventListener("resize", this.updateSearchBarGeometry.bind(this));
    }

    onSearchBarInput(e: Event): void {
        this.search = this.searchBar.value;
    }

    getSelectorPosition(): EmojiSelectorPosition {
        return {
            position:
                {
                    x: window.innerWidth / 2 - 200,
                    y: 215
                },
            placement: "down",
            mode: "fixed"
        };
    }

    getSearchBarGeometry() {
        return {
            x: window.innerWidth / 2 - 200,
            y: 150,
            width: 400,
            height: 50
        };
    }

    updateSearchBarGeometry() {
        const g = this.getSearchBarGeometry();
        this.container.style.left = g.x + "px";
        this.container.style.top = g.y + "px";
        this.container.style.width = g.width + "px";
        this.container.style.height = g.height + "px";
    }

    protected onEmojiSelected(emoji: Emoji): void {
        // copy emoji to clipboard
        navigator.clipboard.writeText(emoji.unicode).then(() => {
            this.log(null, "Emoji copied to clipboard: " + emoji.unicode);
        }, (err) => {
            this.error(null, "Could not copy emoji: ", err);
        });
        super.onEmojiSelected(emoji);
    }

    dismissSearch(trigger: string) {
        if(trigger == "SEARCH_EMPTIED" || trigger == "INVALID_SEARCH") {
            return
        }
        super.dismissSearch(trigger);
    }

    protected onDestroy(): void {
        document.body.removeChild(this.container);
        window.removeEventListener("resize", this.updateSearchBarGeometry.bind(this));
        this.searchBar.removeEventListener("input", this.onSearchBarInput.bind(this));
    }

}