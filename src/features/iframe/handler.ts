import HTMLEditableHandler from "../../handler/editableHandler";
import EmojiSelector, { EmojiSelectorGeometry } from "../../selector/emojiselector";
import AriaDivHandler from "../aria/handler";
import {Emoji} from "../../emoji/emoji";


export default class HTMLIFrameHandler extends AriaDivHandler {
    sites: string[] = ["*"];
    targets: string[] = ["*"];
    HandlerName: string = "HTMLIFrame";
    static canHandleTarget(target: HTMLElement): boolean {
        return target.isContentEditable;
    }
    canHandleTarget = HTMLIFrameHandler.canHandleTarget

    get iframeWindow(): Window | null {
        return this.target.ownerDocument?.defaultView || null;
    }


    constructor(es: EmojiSelector, target: HTMLTextAreaElement, onExit: () => void = () => {}) {
        super(es, target, onExit);
        if(!this.iframeWindow) {
            this.error(null, "Could not get iframe window")
        }
    }

    protected getSelectionPosition(): { start: number; end: number; direction: string } {
        if(this.focusedChild == null) {
            // this.warn(this.focusedChild, "No focused child", true);
        }
        const selection = this.iframeWindow?.getSelection();
        if(!selection) return {start: 0, end: 0, direction: "forward"}
        const newSelect = {
            start: selection.anchorOffset,
            end: selection.focusOffset!,
            direction: selection.type == "Caret" ? "none" : selection.anchorNode == selection.focusNode ? selection.anchorOffset < selection.focusOffset ? "forward" : "backward" : "forward"
        }
        // this.log(selection, `${newSelect.start} -> ${newSelect.end} (${newSelect.direction})`, true)
        return newSelect
    }

    protected getFieldValue(): string {
        // this.log(window.getSelection()!.focusNode, "field value : '" + window.getSelection()!.focusNode!.nodeValue! + "'", true)
        return this.iframeWindow?.getSelection()!.focusNode!.nodeValue!;
    }

    protected getSearchPosition(): { begin: number; end: number; caret: number } {
        const newSelection = this.getSelectionPosition();
        let newSearchPosition = this.searchPosition;

        if(!this.iframeWindow?.getSelection()!.focusNode!.isEqualNode(this.focusedChild)) {
            //this.warn([window.getSelection()!.focusNode, this.focusedChild], "Focus node changed", true)
            if(this.iframeWindow?.getSelection()!.focusNode!.nodeValue) {
                const nodeValue = this.iframeWindow?.getSelection()!.focusNode!.nodeValue!, caret = this.iframeWindow?.getSelection()!.focusOffset
                for(let i = caret; i > 0; i--) {
                    if(nodeValue[caret] == ":") {
                        newSearchPosition = {
                            begin: i - 1,
                            end: caret,
                            caret: caret
                        }
                        break;
                    }
                }
            }
            else {
                newSearchPosition = {
                    begin: 0,
                    end: this.iframeWindow?.getSelection()!.focusOffset || 0,
                    caret: this.iframeWindow?.getSelection()!.focusOffset || 0
                }
            }
        }

        if(!newSearchPosition) {
            newSearchPosition = {
                begin: newSelection.start,
                end: newSelection.end,
                caret: newSelection.start
            }
        }
        else if(newSelection.start == newSelection.end) {
            newSearchPosition.caret = newSelection.start
            newSearchPosition.end = newSelection.end
        }
        else {
            newSearchPosition.end = newSelection.end
            newSelection.direction == "forward" ? newSearchPosition.caret = newSelection.end! : newSearchPosition.caret = newSelection.start!
        }
        // this.log(null, `searchPosition : ${newSearchPosition.begin} -> ${newSearchPosition.end} : ${newSearchPosition.caret}`)
        return newSearchPosition
    }

    protected async insertEmoji(emoji: Emoji) {
        const selection = this.iframeWindow?.getSelection();
        if(!selection) return;
        // this.log((selection), `Insert Emoji - ${this.searchPosition.begin} -> ${this.searchPosition.end} : ${this.searchPosition.caret}`, true)
        // this.log(null, selection.focusNode!.nodeValue?.toString())

        selection.focusNode!.nodeValue = selection.focusNode!.nodeValue!.slice(0, this.searchPosition.begin) + emoji.unicode + selection.focusNode!.nodeValue!.slice(this.searchPosition.end)
        //this.log(null, selection.focusNode!.nodeValue?.toString())
        try {
            //this.log(selection.focusNode, "setting position : " + (this.searchPosition.begin + emoji.unicode.length).toString())
            selection.setPosition(selection.focusNode, this.searchPosition.begin + emoji.unicode.length)
        }
        catch (e) {
            this.error(e, "Error setting position")
        }
        this.target.dispatchEvent(new Event('input', {bubbles: true}));
    }

}