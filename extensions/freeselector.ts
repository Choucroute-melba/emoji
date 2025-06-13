import { Emoji } from "../src/emoji/emoji";
import EmojiSelector from "../src/selector/emojiselector";
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

    constructor(es: EmojiSelector, target: any) {
        const searchBar = document.createElement("input");
        document.body.appendChild(searchBar);
        super(es, searchBar);
        this.mode = "default";
        this.searchBar = searchBar;
        this.searchBar.type = "text";
        this.searchBar.style.position = "absolute";
        this.searchBar.style.zIndex = "9999";
        this.searchBar.style.width = "200px";
        this.searchBar.style.height = "30px";
        this.searchBar.style.boxShadow = "0 0 10px 0 rgba(0, 0, 0, 0.5)";
        this.searchBar.style.display = "block";
        this.searchBar.addEventListener("input", this.onSearchBarInput.bind(this));
        this.active = true;
        this.updateSearchBarGeometry()
        this.searchBar.focus();
    }

    onSearchBarInput(e: Event): void {
        this.search = this.searchBar.value;
    }

    getSelectorPosition(): { position: { x: number; y: number; }; positioning: "up" | "down"; } {
        return {
            position:
                {
                    x: window.innerWidth / 2 - 100,
                    y: 185
                },
            positioning: "down",
        };
    }

    getSearchBarGeometry() {
        return {
            x: window.innerWidth / 2 - 100,
            y: 150,
            width: this.es.geometry.width,
            height: 30
        };
    }

    updateSearchBarGeometry() {
        const g = this.getSearchBarGeometry();
        this.searchBar.style.left = g.x + "px";
        this.searchBar.style.top = g.y + "px";
        this.searchBar.style.width = g.width + "px";
        this.searchBar.style.height = g.height + "px";
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
        document.body.removeChild(this.searchBar);
    }

}