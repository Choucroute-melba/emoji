import HTMLEditableHandler from "../../handler/editableHandler";
import EmojiSelector from "../../selector/emojiselector";
import {getPositionFromElement} from "../../selector/selector-utils";
import {Emoji} from "../../emoji/emoji";


export default class AriaDivHandler extends HTMLEditableHandler<HTMLTextAreaElement> {
    static sites = []
    static targets = ["div"]
    static HandlerName = "ArialDiv"

    readonly HandlerName: string = AriaDivHandler.HandlerName;

    static canHandleTarget(target: HTMLTextAreaElement): boolean {
        return target.tagName.toLowerCase() == "div" && target.contentEditable == "true" && target.role == "textbox";
    }
    canHandleTarget = AriaDivHandler.canHandleTarget

    readonly sites: string[] = AriaDivHandler.sites;
    readonly targets: string[] = AriaDivHandler.targets;
    private boundAriaHandleSelectionChange: (e: Event) => void;

    private readonly focusedChild: Node | null = null;
    private backSpaceHandled: boolean = false;
    private tempInputListener = (e: Event) => {
        this.backSpaceHandled = true;
        this.target.removeEventListener('input', this.tempInputListener, {capture: true});
    }

    constructor(es: EmojiSelector, target: HTMLTextAreaElement) {
        super(es, target);
        this.log(this.focusedChild, "focusedChild")
        this.boundAriaHandleSelectionChange = this.handleSelectionChange.bind(this);
        target.addEventListener('input', this.boundAriaHandleSelectionChange, {capture: true});
        this.active = true;
    }

    getSelectorPosition(): {position: { x: number; y: number; }, positioning: "up" | "down"} {
        return getPositionFromElement(this.target);
    }

    protected getSelectionPosition(): { start: number; end: number; direction: string } {
        if(this.focusedChild == null) {
            this.warn(this.focusedChild, "No focused child", true);
        }
        const selection = window.getSelection();
        if(!selection) return {start: 0, end: 0, direction: "forward"}
        const newSelect = {
            start: selection.anchorOffset,
            end: selection.focusOffset!,
            direction: selection.type == "Caret" ? "none" : selection.anchorNode == selection.focusNode ? selection.anchorOffset < selection.focusOffset ? "forward" : "backward" : "forward"
        }
        this.log(selection, `${newSelect.start} -> ${newSelect.end} (${newSelect.direction})`, true)
        return newSelect
    }

    protected getFieldValue(): string {
        this.log(window.getSelection()!.focusNode, "field value : '" + window.getSelection()!.focusNode!.nodeValue! + "'", true)
        return window.getSelection()!.focusNode!.nodeValue!;
    }

    protected getSearchPosition(): { begin: number; end: number; caret: number } {
        const newSelection = this.getSelectionPosition();
        let newSearchPosition = this.searchPosition;

        if(!window.getSelection()!.focusNode!.isEqualNode(this.focusedChild)) {
            this.warn([window.getSelection()!.focusNode, this.focusedChild], "Focus node changed", true)
            if(window.getSelection()!.focusNode!.nodeValue) {
                const nodeValue = window.getSelection()!.focusNode!.nodeValue!, caret = window.getSelection()!.focusOffset
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
                    end: window.getSelection()!.focusOffset,
                    caret: window.getSelection()!.focusOffset
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
        this.log(null, `searchPosition : ${newSearchPosition.begin} -> ${newSearchPosition.end} : ${newSearchPosition.caret}`)
        return newSearchPosition
    }

    protected insertEmoji(emoji: Emoji) {
        const selection = window.getSelection();
        if(!selection) return;
        this.log((selection), `Insert Emoji - ${this.searchPosition.begin} -> ${this.searchPosition.end} : ${this.searchPosition.caret}`, true)
        this.log(null, selection.focusNode!.nodeValue?.toString())

        selection.focusNode!.nodeValue = selection.focusNode!.nodeValue!.slice(0, this.searchPosition.begin) + emoji.unicode + selection.focusNode!.nodeValue!.slice(this.searchPosition.end)
        this.log(null, selection.focusNode!.nodeValue?.toString())
        try {
            this.log(selection.focusNode, "setting position : " + (this.searchPosition.begin + emoji.unicode.length).toString())
            selection.setPosition(selection.focusNode, this.searchPosition.begin + emoji.unicode.length)
        }
        catch (e) {
            this.log(e, "Error setting position")
        }
        this.target.dispatchEvent(new Event('input', {bubbles: true}));
    }

    protected handleKeydown(e: KeyboardEvent) {
        if(e.key == "Backspace") {
            this.target.addEventListener('input', this.tempInputListener, {capture: true});
            window.setTimeout(() => {
                if (!this.backSpaceHandled) {
                    this.log(null, "Backspace not handled")
                    this.target.dispatchEvent(new InputEvent('input', {bubbles: true}));
                    this.backSpaceHandled = false;
                } else {
                    this.log(null, "Backspace handled")
                    this.backSpaceHandled = false;
                }
            }, 10);
        }
        super.handleKeydown(e);
    }

    onDestroy() {
        this.target.removeEventListener('input', this.boundAriaHandleSelectionChange, {capture: true});
        this.target.removeEventListener('input', this.tempInputListener, {capture: true});
        super.onDestroy();
    }
}