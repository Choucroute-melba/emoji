import HTMLEditableHandler from "../../handler/editableHandler";
import EmojiSelector, {EmojiSelectorGeometry} from "../../selector/emojiselector";
import {getPositionFromElement} from "../../selector/selector-utils";

export default class HTMLInputHandler extends HTMLEditableHandler<HTMLInputElement> {
    static sites = []
    static targets = ["input"]
    static HandlerName = "HTMLInput"

    readonly HandlerName: string = HTMLInputHandler.HandlerName;

    static canHandleTarget(target: HTMLInputElement): boolean {
        return target.tagName.toLowerCase() == "input" && (target.type == "text" || target.type == "search");
    }
    canHandleTarget = HTMLInputHandler.canHandleTarget

    readonly sites: string[] = HTMLInputHandler.sites;
    readonly targets: string[] = HTMLInputHandler.targets;

    constructor(es: EmojiSelector, target: HTMLInputElement, onExit: () => void = () => {}) {
        super(es, target, onExit);
        this.active = true;
    }

    getSelectorGeometry(): Partial<EmojiSelectorGeometry> {
        const {position, placement} = getPositionFromElement(this.target);
        return {
            position,
            placement,
        };
    }
}