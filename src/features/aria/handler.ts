import HTMLEditableHandler from "../../handler/editableHandler";
import {EmojiSelectorGeometry} from "@src/selector/emojiselector";
import {getPositionFromEditableDivCaret} from "@src/selector/selector-utils";
import {Emoji} from "emojibase";
import {HandlerError, HandlerStatus} from "@src/handler/handler";

export default class AriaDivHandler extends HTMLEditableHandler<HTMLTextAreaElement> {
    static sites = []
    static targets = ["div"]
    static HandlerName = "AriaDiv"

    readonly HandlerName: string = AriaDivHandler.HandlerName;

    static canHandleTarget(target: HTMLTextAreaElement): boolean {
        return target.tagName.toLowerCase() == "div" && target.contentEditable == "true" && target.role == "textbox";
    }
    canHandleTarget = AriaDivHandler.canHandleTarget

    readonly sites: string[] = AriaDivHandler.sites;
    readonly targets: string[] = AriaDivHandler.targets;

    protected readonly focusedChild: Node | null = null;
    private backSpaceHandled: boolean = false

    constructor(target: HTMLTextAreaElement) {
        super(target);
        this.boundAriaHandleSelectionChange = this.handleSelectionChange.bind(this);
        this.status = HandlerStatus.INACTIVE
    }

    //region actions ---

    enable() {
        this.target.addEventListener('input', this.boundAriaHandleSelectionChange, {capture: true});
        super.enable();
    }

    disable() {
        this.target.removeEventListener('input', this.boundAriaHandleSelectionChange, {capture: true});
        this.target.removeEventListener('input', this.tempInputListener, {capture: true});
        super.disable();
    }
    //endregion

    //region protected methods ---

    getSelectorGeometry(): Partial<EmojiSelectorGeometry> {
        return getPositionFromEditableDivCaret(this.target, this.window.getSelection());
    }

    protected getSelectionPosition(): { start: number; end: number; direction: string } {
        if(this.focusedChild == null) {
           // this.warn(this.focusedChild, "No focused child", true);
        }
        const selection = this.window.getSelection();
        if(!selection) return {start: 0, end: 0, direction: "forward"}
        return {
            start: selection.anchorOffset,
            end: selection.focusOffset!,
            direction: selection.type == "Caret" ? "none" : selection.anchorNode == selection.focusNode ? selection.anchorOffset < selection.focusOffset ? "forward" : "backward" : "forward"
        }
    }

    protected getFieldValue(): string {
        // this.log(this.window.getSelection()!.focusNode, "field value : '" + this.window.getSelection()!.focusNode!.nodeValue! + "'", true)
        return this.window.getSelection()!.focusNode!.nodeValue!;
    }

    protected getSearchPosition(): { begin: number; end: number; caret: number } {
        const newSelection = this.getSelectionPosition();
        let newSearchPosition = this.searchPosition;

        if(!this.window.getSelection()!.focusNode!.isEqualNode(this.focusedChild)) {
            //this.warn([this.window.getSelection()!.focusNode, this.focusedChild], "Focus node changed", true)
            if(this.window.getSelection()!.focusNode!.nodeValue) {
                const nodeValue = this.window.getSelection()!.focusNode!.nodeValue!, caret = this.window.getSelection()!.focusOffset
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
                    end: this.window.getSelection()!.focusOffset,
                    caret: this.window.getSelection()!.focusOffset
                }
            }
        }

        if(!newSearchPosition) {
            newSearchPosition = {
                begin: newSelection.start-1, // minus one to include the colon
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
        if(!this.searchPosition) {
            this.reportError("Search position is undefined, cannot insert emoji", this.active ? "fatal" : "warning");
            if(this.active) this.status = HandlerStatus.ERROR
            return;
        }
        const selection = this.window.getSelection();
        if(!selection) return;
        // this.log((selection), `Insert Emoji - ${this.searchPosition.begin} -> ${this.searchPosition.end} : ${this.searchPosition.caret}`, true)
        // this.log(null, selection.focusNode!.nodeValue?.toString())

        selection.focusNode!.nodeValue = selection.focusNode!.nodeValue!.slice(0, this.searchPosition.begin) + emoji.emoji + selection.focusNode!.nodeValue!.slice(this.searchPosition.end)
        //this.log(null, selection.focusNode!.nodeValue?.toString())
        try {
            //this.log(selection.focusNode, "setting position : " + (this.searchPosition.begin + emoji.unicode.length).toString())
            selection.setPosition(selection.focusNode, this.searchPosition.begin + emoji.emoji.length)
        }
        catch (e) {
            this.reportError(new HandlerError("Failed to set caret position after inserting emoji", e instanceof Error ? e : undefined), "error")
        }
        this.target.dispatchEvent(new Event('input', {bubbles: true}));
    }

    //endregion

    //region protected event listeners ---

    private boundAriaHandleSelectionChange: (e: Event) => void;

    protected handleKeydown(e: KeyboardEvent) {
        if(e.key == "Backspace") {
            this.target.addEventListener('input', this.tempInputListener, {capture: true});
            this.window.setTimeout(() => {
                if (!this.backSpaceHandled) {
                    this.target.dispatchEvent(new InputEvent('input', {bubbles: true}));
                    this.backSpaceHandled = false;
                } else {
                    this.backSpaceHandled = false;
                }
            }, 10);
        }
        super.handleKeydown(e);
    }

    private tempInputListener = (e: Event) => {
        this.backSpaceHandled = true;
        this.target.removeEventListener('input', this.tempInputListener, {capture: true});
    }

    //endregion

    //region getters and setters ---

    protected get window() {
        return window;
    }

    //endregion
}