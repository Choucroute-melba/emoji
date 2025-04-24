import EmojiSelector from "../selector/emojiselector";
import {Emoji, getEmojiFromShortCode, searchEmoji} from "../emoji/emoji";

const colors = ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6',
    '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
    '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A',
    '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
    '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC',
    '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
    '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680',
    '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
    '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3',
    '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];

/**
 * @class Handler
 * This class is the base class for all handlers.
 *
 * Handlers are classes handling all the logic between the selector's UI, the website to act on and the user's actions.
 * it is responsible for many things including :
 * - search for the emojis following user input
 * - know when the user want to insert the emoji, continue searching or exit selector
 * - display and manage the selector's UI
 *
 * This base class provide default behavior for most of the logic,
 * but is meant to be as generic as possible and does not react to events or inputs that are specific to a particular site or input method.
 * you will need to override it and create you own handler
 * that work with the specificities of a particular site or input method.
 *
 * Another abstract handler is available, specific to editable elements : HTMLEditableHandler.
 * you should use this class as a base only if you're on a very specific case if you want to handle a non-editable element.
 * (e.g. an element that does not fire keydown, value change or selection events)
 */
export default abstract class Handler<EltType extends HTMLElement> {
    abstract readonly sites: string[]
    abstract readonly targets: string[]
    abstract readonly HandlerName: string

    abstract canHandleTarget(target: EltType): boolean

    protected es: EmojiSelector;
    protected target: EltType;
    protected instanceId: number = Date.now()
    protected color = colors[Math.floor(Math.random() * colors.length)]
    private _search = ""
    protected searchResults: Emoji[] = []
    private _active = false
    private readonly boundHandleDocumentKeydown: (e: KeyboardEvent) => void;
    private readonly boundFocusLost: (e: FocusEvent) => void;

    onExit: (() => void) = () => {}

    protected constructor(es: EmojiSelector, target: EltType) {
        this.es = es
        this.target = target
        this.es.onEmojiSelected = this.onEmojiSelected
        this.boundHandleDocumentKeydown = this.handleDocumentKeyDown.bind(this)
        this.boundFocusLost = this.onFocusLost.bind(this)
        document.addEventListener('keydown', this.boundHandleDocumentKeydown)
        this.target.addEventListener('focusout', this.boundFocusLost)

        this.log("new handler", "\t\t\t---")
    }

    abstract getSelectorPosition(): {position: { x: number; y: number; }, positioning: "up" | "down"};

    selectEmoji(): void;
    selectEmoji(emoji: Emoji): void;

    selectEmoji(emoji?: Emoji) {
        if(!this.active) return
        if(!emoji)
            emoji = this.es.getFocusedEmoji()
        if(!emoji) {
            this.dismissSearch("NO_EMOJI_SELECTION")
            return
        }
        this.onEmojiSelected(emoji)
    }

    dismissSearch(trigger: string) {
        this.onSearchDismissed(trigger)
    }

    /** Called when an emoji is selected
     * @param {Emoji} emoji - the selected emoji
     * @protected
     */
    protected abstract onEmojiSelected(emoji: Emoji): void

    /** Called when the handler is destroyed
     * you need to clean up any event listeners or references here
     * @protected
     */
    protected abstract onDestroy(): void

    protected onDisabled(): void {}
    protected onEnabled(): void {}

    /** Override if you want to change the way shortcodes are handled
     * default behavior : will trigger onEmojiSelected if a corresponding emoji is found
     *  */
    protected onShortcodeDetected(sc: string) {
        const em = getEmojiFromShortCode(sc)
        if(em)
            this.selectEmoji(em)
        else
            this.dismissSearch("INVALID_SHORTCODE")
    }

    protected onSearchUpdated() {
        this.log(null, `'${this.search}'`)
        this.es.debugText = this.search
        if(this.search.endsWith(":")) {
            let sc = this.search.slice(0, -1)
            this.onShortcodeDetected(sc)
        }
        else if(!this.search.match(/^[a-zA-Z0-9_]*$/)) {
            this.dismissSearch("INVALID_SEARCH")
        }
        else {
            this.es.searchResults = this.searchResults
            this.es.setFocusedEmoji(0)
        }
    }

    /** Override if you want to change the behavior when the search is dismissed */
    protected onSearchDismissed(trigger: string) {
        this.trace(null, `search dismissed  ${trigger}`)
        this.destroy()
    }
    // TODO : implement logging levels for production
    protected log(message: any, title: string = "", collapsed = false, f = false) {
        if(!collapsed) {
            console.group(`[${this.HandlerName} %c${this.instanceId}%c] ${title}`, `color: ${this.color}; font-weight: bold`, 'color: default, font-weight: normal')
            if (message)
                console.log(message)
        }
        else {
            console.groupCollapsed(`[${this.HandlerName} %c${this.instanceId}%c] ${title}`, `color: ${this.color}; font-weight: bold`, 'color: default, font-weight: normal')
            if (message)
                console.log(message)
        }
        console.groupEnd()
    }

    protected trace(message: any, title: string = "", collapsed = true, f = false) {
        if(!collapsed) {
            console.group(`[${this.HandlerName} %c${this.instanceId}%c] ${title}`, `color: ${this.color}; font-weight: bold`, 'color: default, font-weight: normal')
        }
        else {
            console.groupCollapsed(`[${this.HandlerName} %c${this.instanceId}%c] ${title}`, `color: ${this.color}; font-weight: bold`, 'color: default, font-weight: normal')
        }
        if (message)
            console.log(message)
        console.trace()
        console.groupEnd()
    }

    protected warn(message: any, title: string = "", collapsed = false, f = false) {
        if(!collapsed) {
            console.group(`[${this.HandlerName} %c${this.instanceId}%c] %c${title}`, `color: ${this.color}; font-weight: bold`, 'color: default, font-weight: normal', 'color: #FFC300;')
        }
        else {
            console.groupCollapsed(`[${this.HandlerName} %c${this.instanceId}%c] %c${title}`, `color: ${this.color}; font-weight: bold`, 'color: default, font-weight: normal', 'color: #FFC300;')
        }
        if (message)
            console.warn(message)
        console.trace()
        console.groupEnd()
    }

    protected error(message: any, title: string = "", collapsed = false, f = false) {
        if(!collapsed) {
            console.group(`[${this.HandlerName} %c${this.instanceId}%c] %c${title}`, `color: ${this.color}; font-weight: bold`, 'color: default, font-weight: normal', 'color: #dc240d;')
        }
        else {
            console.groupCollapsed(`[${this.HandlerName} %c${this.instanceId}%c] %c${title}`, `color: ${this.color}; font-weight: bold`, 'color: default, font-weight: normal', 'color: #dc240d;')
        }
        if (message)
            console.warn(message)
        console.trace()
        console.groupEnd()
    }


    /** this listener listens only to events that happen at the document level */
    protected handleDocumentKeyDown(e: KeyboardEvent) {
        // this.log(null, "Handler.handleKeyDown : " + e.code)
        if(this.active)
            switch (e.code) {
                case "Enter":
                    e.stopPropagation()
                    e.preventDefault()
                    this.selectEmoji(this.es.getFocusedEmoji())
                    break;
                case "Escape":
                    e.preventDefault()
                    e.stopPropagation()
                    this.dismissSearch("KEY_ESCAPE")
                    break;
                case "ArrowUp":
                    e.preventDefault()
                    e.stopPropagation()
                    this.es.focusUp()
                    break;
                case "ArrowDown":
                    e.preventDefault()
                    e.stopPropagation()
                    this.es.focusDown()
                    break;
            }
    }

    protected onFocusLost() {
        this.dismissSearch("FOCUS_LOST")
    }

    destroy() {
        this.log(null, "destroying...")
        this.active = false
        this.onDestroy()
        document.removeEventListener('keydown', this.boundHandleDocumentKeydown)
        this.target.removeEventListener('focusout', this.boundFocusLost)
        this.es.display = false
        this.es.onEmojiSelected = () => {}
        this.es = null as any
        this.target = null as any
        this.onExit()
        this.onExit = () => {}
    }

    /** Getters and setters */

    /** changing search value will automatically update search results.
     * shortcodes are automatically detected by default, override onSearchUpdated to change this */
    protected set search(value: string) {
        this._search = value;
        this.searchResults = searchEmoji(this._search);
        this.onSearchUpdated()
    }
    protected get search() { return this._search }

    /** the selector is active (selector visible and modify user input) or idle (instance kept only for reactivation on the same target) */
    protected set active(value: boolean) {
        let valueChanged = this._active != value
        this._active = value
        if(valueChanged && this._active)
            this.onEnabled()
        else if(valueChanged && !this._active)
            this.onDisabled()
    }
    protected get active() { return this._active }
}