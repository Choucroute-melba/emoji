import Handler from "./handler";
import EmojiSelector from "../selector/emojiselector";
import {Emoji} from "../emoji/emoji";

type EditableElement = HTMLInputElement | HTMLTextAreaElement

export default abstract class HTMLEditableHandler<EditableType extends  EditableElement> extends Handler<EditableType> {

    abstract readonly sites: string[]
    abstract readonly targets: string[]
    abstract readonly HandlerName: string

    abstract canHandleTarget(target: EditableType): boolean

    protected searchPosition: {
        begin: number,
        end: number,
        caret: number
    }

    private readonly boundHandleKeydown: (e: KeyboardEvent) => void
    private readonly boundHandleSelectionChange: (e: Event) => void

    protected constructor(es: EmojiSelector, target: EditableType) {
        super(es, target);

        this.boundHandleKeydown = this.handleKeydown.bind(this)
        this.boundHandleSelectionChange = this.handleSelectionChange.bind(this)

        this.target.addEventListener('selectionchange', this.boundHandleSelectionChange)
        this.target.addEventListener('keydown', this.boundHandleKeydown as EventListener, {capture: true})

        this.searchPosition = this.getSearchPosition()
        this.es.position = this.getSelectorPosition()
        this.es.display = false
    }

    protected onEmojiSelected(emoji: Emoji): void {
        this.active = false
        this.insertEmoji(emoji)
        this.destroy()
    }

    protected insertEmoji(emoji: Emoji) {
        this.target.value = this.target.value.slice(0, this.searchPosition.begin) + emoji.unicode + this.target.value.slice(this.searchPosition.end)
        this.target.setSelectionRange(this.searchPosition.begin + emoji.unicode.length, this.searchPosition.begin + emoji.unicode.length)
        this.target.dispatchEvent(new Event('input', {bubbles: true}))
    }

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
        // this.log(null, `Selection : ${newPos.start} -> ${newPos.end} : ${newPos.direction}`)
        return newPos
    }

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

    onDestroy() {
        this.target.removeEventListener('selectionchange', this.boundHandleSelectionChange)
        this.target.removeEventListener('keydown', this.boundHandleKeydown as EventListener, {capture: true})
        this.log(null, "onDestroy")
    }
}