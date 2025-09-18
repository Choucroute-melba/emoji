import Handler from "./handler";
import EmojiSelector from "../selector/emojiselector";
import {Emoji} from "../emoji/emoji";
import {setNativeValue, setValueFromSafeOrigin, verifyEmojiInsertion} from "./utils";

type EditableElement = HTMLInputElement | HTMLTextAreaElement

export default abstract class HTMLEditableHandler<EditableType extends  EditableElement> extends Handler<EditableType> {

    abstract readonly sites: string[]
    abstract readonly targets: string[]
    abstract readonly HandlerName: string

    abstract canHandleTarget(target: EditableType): boolean

    static readonly sites: string[]
    static readonly targets: string[]
    static readonly HandlerName: string

    static canHandleTarget(target: HTMLElement): boolean {
        throw new Error("Method 'canHandleTarget' must be implemented in subclasses.");
    }

    protected searchPosition: {
        begin: number,
        end: number,
        caret: number
    }

    private readonly boundHandleKeydown: (e: KeyboardEvent) => void
    private readonly boundHandleSelectionChange: (e: Event) => void

    private _mode: "selection" | "default" = "selection"

    protected constructor(es: EmojiSelector, target: EditableType) {
        super(es, target);

        this.boundHandleKeydown = this.handleKeydown.bind(this)
        this.boundHandleSelectionChange = this.handleSelectionChange.bind(this)

        this.target.addEventListener('selectionchange', this.boundHandleSelectionChange)
        this.target.addEventListener('keydown', this.boundHandleKeydown as EventListener, {capture: true})

        this.searchPosition = this.getSearchPosition()
        this.es.geometry = this.getSelectorGeometry()
        this.es.display = false
    }

    protected async onEmojiSelected(emoji: Emoji): Promise<void> {
        this.active = false
        await this.insertEmoji(emoji)
        this.destroy()
    }

    protected async insertEmoji(emoji: Emoji) {
        const newValue =
            this.target.value.slice(0, this.searchPosition.begin) +
            emoji.unicode +
            this.target.value.slice(this.searchPosition.end);

        const setCursor = () => {
            this.target.setSelectionRange(
                this.searchPosition.begin + emoji.unicode.length,
                this.searchPosition.begin + emoji.unicode.length
            );
        };

        if (this.detectedFrameworks.includes("Next.js")) {
            this.info(this.target, `Inserting emoji using setValueFromSafeOrigin for Next.js compatibility`, true);
            setValueFromSafeOrigin(this.target, newValue);
            setCursor();
            return;
        }

        // Default: Native setter + input event
        setNativeValue(this.target, newValue);
        setCursor();
        this.target.dispatchEvent(new Event("input", { bubbles: true }));
        this.target.dispatchEvent(new Event("change", { bubbles: true }));

        // Verify and fallback if needed
        await verifyEmojiInsertion(this.target, newValue, () => {
            this.warn(this.target, `Emoji not inserted correctly, falling back to safe-origin injection...`);
            setValueFromSafeOrigin(this.target, newValue);
            setCursor();
        });
    }

    /**
     *
     * @param e
     * @protected
     */
    protected handleSelectionChange(e: Event) {
        if(!this.active) return
        // this.log(null, "Selection changed")
        const newSearchPosition = this.getSearchPosition()
        if(this.searchPosition.begin >= newSearchPosition.caret) {
            this.dismissSearch("SEARCH_EMPTIED")
            return;
        }
        this.searchPosition = newSearchPosition
        const newSearchValue = this.getSearchValue()
        if(!this.active) return
        this.search = newSearchValue
    }

    protected getSelectionPosition(): {start: number, end: number, direction: string} {
        const newPos =  {
            start: this.target.selectionStart!,
            end: this.target.selectionEnd!,
            direction: this.target.selectionDirection!
        }
        return newPos
    }

    /**
     * Return information about the current search position: begin and end of searched text and the caret position.
     * Used by EditableHandler.handleSelectionChange to update the searched text.
     * @protected
     */
    protected getSearchPosition(): {begin: number, end: number, caret: number} {
        const newSelection = this.getSelectionPosition()
        let newSearchPosition = this.searchPosition
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

    /**
     * Working mode of the handler:
     * - "selection" means that the search value will be updated using a selection range in the target, update triggered by the `selectionchange` event.
     * - "default" means that the search value will be updated using the input value, update triggered when the search value is changed.
     * @protected
     */
    protected set mode(mode: "selection" | "default") {
        if(this._mode === mode) return
        this._mode = mode
        if(mode == "selection") {
            this.target.addEventListener('selectionchange', this.boundHandleSelectionChange)
        }
        else {
            this.target.removeEventListener('selectionchange', this.boundHandleSelectionChange)
        }
    }
    protected get mode(): "selection" | "default" {
        return this._mode
    }

    protected getFieldValue(): string {
        return this.target.value
    }

    protected getSearchValue(): string {
        return this.getFieldValue().slice(this.searchPosition.begin+1 , this.searchPosition.end)
    }

    protected onSearchUpdated() {
        super.onSearchUpdated();
        if(this.search.length > 0 && !this.es.display)
            this.es.display = true
    }

    protected handleKeydown(e: KeyboardEvent): void {
        if(!this.active) return
        if(e.key == "Enter") {
            e.stopPropagation()
            e.preventDefault()
            this.selectEmoji(this.es.getFocusedEmoji())
        }
    }

    protected onDestroy() {
        this.target.removeEventListener('selectionchange', this.boundHandleSelectionChange)
        this.target.removeEventListener('keydown', this.boundHandleKeydown as EventListener, {capture: true})
        this.log(null, "onDestroy")
    }
}