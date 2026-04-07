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

    //region protected methods ---

    protected getFieldValue(): string {
        // this.log(window.getSelection()!.focusNode, "field value : '" + window.getSelection()!.focusNode!.nodeValue! + "'", true)
        return this.window.getSelection()!.focusNode!.nodeValue!;
    }
    //endregion

    //region getters and setters ---

    protected get window() {
        return this.target.ownerDocument?.defaultView || window;
    }
    //endregion
}