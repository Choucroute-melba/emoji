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

    protected constructor(es: EmojiSelector, target: EditableType) {
        super(es, target);
        this.searchPosition = {
            begin: this.target.selectionStart!,
            end: this.target.selectionEnd!,
            caret: this.target.selectionEnd!
        }

        this.boundHandleKeydown = this.handleKeydown.bind(this)

        this.target.addEventListener('selectionchange', this.handleSelectionChange.bind(this))
        this.target.addEventListener('keydown', this.boundHandleKeydown as EventListener)

        this.es.position = this.getSelectorPosition()
        this.es.debugText = `${this.es.position.positioning}`
        this.es.display = true
        this.active = true
    }

    onEmojiSelected(emoji: Emoji): void {
        this.log(emoji)
        this.active = false
        this.target.value = this.target.value.slice(0, this.searchPosition.begin) + emoji.unicode + this.target.value.slice(this.searchPosition.end)
        this.destroy()
    }

    protected handleSelectionChange(e: Event) {
        if(!this.active) return
        if(this.target.selectionStart == this.target.selectionEnd) {
            this.searchPosition.caret = this.target.selectionStart!
            this.searchPosition.end = this.target.selectionEnd!
        }
        else {
            this.searchPosition.end = this.target.selectionEnd!
            this.target.selectionDirection == "forward" ? this.searchPosition.caret = this.target.selectionEnd! : this.searchPosition.caret = this.target.selectionStart!
        }
        if(this.target.selectionStart == this.searchPosition.begin) {
            this.dismissSearch("SEARCH_EMPTIED")
            return;
        }
        this.search = this.target.value.slice(this.searchPosition.begin+1 , this.searchPosition.end)
        if(!this.active) return
        this.log(null, "HTLMInputHandler.handleSelectionChange  " + this.search)
        this.es.debugText = `${this.es.position.positioning}`
    }
    private handleKeydown(e: KeyboardEvent): void {
        if(!this.active) return
        if(e.key == "Enter") {
            e.stopPropagation()
            e.preventDefault()
            this.selectEmoji(this.es.getFocusedEmoji())
        }
    }

    onDestroy() {
        this.target.removeEventListener('selectionchange', this.handleSelectionChange.bind(this))
        this.target.removeEventListener('keydown', this.boundHandleKeydown as EventListener)
        this.log(null, "onDestroy")
    }
}