import HTMLEditableHandler from "../../handler/editableHandler";
import EmojiSelector, {EmojiSelectorGeometry, EmojiSelectorPosition} from "../../selector/emojiselector";
import {getPositionFromEditableDivCaret, getPositionFromElement} from "../../selector/selector-utils";
import {Emoji} from "../../emoji/emoji";


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
    private boundAriaHandleSelectionChange: (e: Event) => void = () => {};

    protected get window() {
        return window;
    }
    protected readonly focusedChild: Node | null = null;
    private backSpaceHandled: boolean = false;
    private tempInputListener = (e: Event) => {
        this.backSpaceHandled = true;
        this.target.removeEventListener('input', this.tempInputListener, {capture: true});
    }

    constructor(es: EmojiSelector, target: HTMLTextAreaElement, onExit: () => void = () => {}) {
        super(es, target, onExit);
        
        // Early validation: ensure selection is still valid
        const selection = this.window.getSelection();
        if (!selection || !selection.focusNode || selection.focusNode.nodeValue === null) {
            this.destroy();
            return;
        }
        
        this.log(this.focusedChild, "focusedChild")
        this.boundAriaHandleSelectionChange = this.handleSelectionChange.bind(this);
        target.addEventListener('input', this.boundAriaHandleSelectionChange, {capture: true});
        this.active = true;
    }

    getSelectorGeometry(): Partial<EmojiSelectorGeometry> {
        return getPositionFromEditableDivCaret(this.target, this.window.getSelection());
    }

    protected getSelectionPosition(): { start: number; end: number; direction: string } {
        if(this.focusedChild == null) {
           // this.warn(this.focusedChild, "No focused child", true);
        }
        const selection = this.window.getSelection();
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
        const selection = this.window.getSelection();
        if (!selection || !selection.focusNode || selection.focusNode.nodeValue === null) {
            return "";
        }
        return selection.focusNode.nodeValue;
    }

    protected getSearchPosition(): { begin: number; end: number; caret: number } {
        const newSelection = this.getSelectionPosition();
        let newSearchPosition = this.searchPosition;

        const selection = this.window.getSelection();
        if (!selection || !selection.focusNode) {
            return {
                begin: newSelection.start,
                end: newSelection.end,
                caret: newSelection.start
            };
        }

        if(!selection.focusNode.isEqualNode(this.focusedChild)) {
            //this.warn([this.window.getSelection()!.focusNode, this.focusedChild], "Focus node changed", true)
            if(selection.focusNode.nodeValue) {
                const nodeValue = selection.focusNode.nodeValue, caret = selection.focusOffset
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
                    end: selection.focusOffset,
                    caret: selection.focusOffset
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
        const selection = this.window.getSelection();
        if(!selection || !selection.focusNode || selection.focusNode.nodeValue === null) return;
        // this.log((selection), `Insert Emoji - ${this.searchPosition.begin} -> ${this.searchPosition.end} : ${this.searchPosition.caret}`, true)
        // this.log(null, selection.focusNode!.nodeValue?.toString())

        selection.focusNode.nodeValue = selection.focusNode.nodeValue.slice(0, this.searchPosition.begin) + emoji.unicode + selection.focusNode.nodeValue.slice(this.searchPosition.end)
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

    onDestroy() {
        this.target.removeEventListener('input', this.boundAriaHandleSelectionChange, {capture: true});
        this.target.removeEventListener('input', this.tempInputListener, {capture: true});
        super.onDestroy();
    }
}