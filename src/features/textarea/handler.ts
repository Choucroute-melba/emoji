import HTMLEditableHandler from "../../handler/editableHandler";
import EmojiSelector, {EmojiSelectorPosition} from "../../selector/emojiselector";
import {getPositionFromTextareaCaret} from "../../selector/selector-utils";
import {Emoji} from "../../emoji/emoji";


export default class TextAreaHandler extends HTMLEditableHandler<HTMLTextAreaElement> {
    static sites = []
    static targets = ["textarea", "div"]
    static HandlerName = "TextArea"

    readonly HandlerName: string = TextAreaHandler.HandlerName;

    static canHandleTarget(target: HTMLTextAreaElement): boolean {
        if(target.tagName.toLowerCase() == "textarea") return true
        return false
    }
    canHandleTarget = TextAreaHandler.canHandleTarget

    readonly sites: string[] = TextAreaHandler.sites;
    readonly targets: string[] = TextAreaHandler.targets;

    constructor(es: EmojiSelector, target: HTMLTextAreaElement) {
        super(es, target);
        this.active = true;
    }

    getSelectorPosition(): EmojiSelectorPosition {
        const pos = getPositionFromTextareaCaret(this.target);
        return pos;
    }
}