import EmojiSelector from "../../selector/emojiselector";
import AriaDivHandler from "../aria/handler";


export default class HTMLIFrameHandler extends AriaDivHandler {
    sites: string[] = ["*"];
    targets: string[] = ["*"];
    HandlerName: string = "HTMLIFrame";
    static canHandleTarget(target: HTMLElement): boolean {
        // return target.isContentEditable;
        return true;
    }
    canHandleTarget = HTMLIFrameHandler.canHandleTarget

    constructor(target: HTMLTextAreaElement) {
        super(target);
    }


    constructor(es: EmojiSelector, target: HTMLTextAreaElement, onExit: () => void = () => {}) {
        super(es, target, onExit);
    }


    protected getFieldValue(): string {
        // this.log(window.getSelection()!.focusNode, "field value : '" + window.getSelection()!.focusNode!.nodeValue! + "'", true)
        return this.window.getSelection()!.focusNode!.nodeValue!;
    }
}