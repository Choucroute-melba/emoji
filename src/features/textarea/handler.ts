import HTMLEditableHandler from "../../handler/editableHandler";
import EmojiSelector from "../../selector/emojiselector";


export default class TextAreaHandler extends HTMLEditableHandler<HTMLTextAreaElement> {
    static sites = []
    static targets = ["textarea"]
    static HandlerName = "TextArea"

    readonly HandlerName: string = TextAreaHandler.HandlerName;

    static canHandleTarget(target: HTMLTextAreaElement): boolean {
        return target.tagName.toLowerCase() == "textarea"
    }
    canHandleTarget = TextAreaHandler.canHandleTarget

    readonly sites: string[] = TextAreaHandler.sites;
    readonly targets: string[] = TextAreaHandler.targets;

    constructor(es: EmojiSelector, target: HTMLTextAreaElement) {
        super(es, target);
    }
}