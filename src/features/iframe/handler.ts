import HTMLEditableHandler from "../../handler/editableHandler";
import EmojiSelector, { EmojiSelectorGeometry } from "../../selector/emojiselector";
import AriaDivHandler from "../aria/handler";
import {Emoji} from "../../emoji/emoji";


export default class HTMLIFrameHandler extends AriaDivHandler {
    sites: string[] = ["*"];
    targets: string[] = ["*"];
    HandlerName: string = "HTMLIFrame";
    static canHandleTarget(target: HTMLElement): boolean {
        // return target.isContentEditable;
        return true;
    }
    canHandleTarget = HTMLIFrameHandler.canHandleTarget

    protected get window() {
        return this.target.ownerDocument?.defaultView || window;
    }


    constructor(es: EmojiSelector, target: HTMLTextAreaElement, onExit: () => void = () => {}) {
        super(es, target, onExit);
    }


    protected getFieldValue(): string {
        // this.log(window.getSelection()!.focusNode, "field value : '" + window.getSelection()!.focusNode!.nodeValue! + "'", true)
        return this.window.getSelection()!.focusNode!.nodeValue!;
    }
}