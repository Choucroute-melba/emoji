import HTMLEditableHandler from "../../handler/editableHandler";
import EmojiSelector, { EmojiSelectorGeometry } from "../../selector/emojiselector";
import AriaDivHandler from "../aria/handler";
import {Emoji} from "../../emoji/emoji";


export default class HTMLIFrameHandler extends AriaDivHandler {
    sites: string[] = ["*"];
    targets: string[] = ["*"];
    HandlerName: string = "HTMLIFrame";
    static canHandleTarget(target: HTMLElement): boolean {
        // Only handle contentEditable elements within iframes
        if (!target.isContentEditable) {
            return false;
        }
        
        // Ensure we're in an iframe context
        const isInIframe = target.ownerDocument !== window.document;
        if (!isInIframe) {
            return false;
        }
        
        // Validate that the selection and focus node exist and have a valid nodeValue
        const win = target.ownerDocument?.defaultView;
        if (!win) {
            return false;
        }
        
        const selection = win.getSelection();
        if (!selection || !selection.focusNode || selection.focusNode.nodeValue === null) {
            return false;
        }
        
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
        const selection = this.window.getSelection();
        if (!selection || !selection.focusNode || selection.focusNode.nodeValue === null) {
            return "";
        }
        return selection.focusNode.nodeValue;
    }
}