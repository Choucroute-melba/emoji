import HTMLEditableHandler from "../../handler/editableHandler";
import {EmojiSelectorGeometry} from "@src/selector/emojiselector";
import {getPositionFromElement} from "@src/selector/selector-utils";

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

    constructor( target: HTMLInputElement) {
        super(target);
    }

    //region protected methods ---

    getSelectorGeometry(): Partial<EmojiSelectorGeometry> {
        const {position, placement} = getPositionFromElement(this.target);
        return {
            position,
            placement,
        };
    }
    //endregion
}