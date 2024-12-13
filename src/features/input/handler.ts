import HTMLEditableHandler from "../../handler/editableHandler";
import EmojiSelector from "../../selector/emojiselector";
import {getPositionFromElement} from "../../selector/selector-utils";

export default class HTMLInputHandler extends HTMLEditableHandler<HTMLInputElement> {
    static sites = []
    static targets = ["input"]
    static HandlerName = "HTMLInput"

    readonly HandlerName: string = HTMLInputHandler.HandlerName;

    static canHandleTarget(target: HTMLInputElement): boolean {
        return target.tagName.toLowerCase() == "input" && target.type == "text"
    }
    canHandleTarget = HTMLInputHandler.canHandleTarget

    readonly sites: string[] = HTMLInputHandler.sites;
    readonly targets: string[] = HTMLInputHandler.targets;

    constructor(es: EmojiSelector, target: HTMLInputElement) {
        super(es, target);
        this.active = true;
    }

    getSelectorPosition(): {position: { x: number; y: number; }, positioning: "up" | "down"} {
        return getPositionFromElement(this.target);
    }
}