import EmojiSelector, {EmojiSelectorGeometry} from "../selector/emojiselector";
import {getEmojiFromShortCode, searchEmoji} from "../emoji/emoji-content";
import {Emoji} from "emojibase"
import {
    EventMessage,
    GetFavoriteEmojisMessage,
    GetMostUsedEmojiMessage,
    GetSiteSettingsMessage,
    Message
} from "../background/messsaging";
import browser, {Menus} from "webextension-polyfill";
import {GlobalSettings, SiteSettings} from "@src/background/types";

const colors =
   ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6',
    '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
    '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A',
    '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
    '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC',
    '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
    '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680',
    '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
    '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3',
    '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];



export default abstract class Handler<EltType extends HTMLElement> {
    abstract readonly sites: string[]
    abstract readonly targets: string[]
    abstract readonly HandlerName: string

    abstract canHandleTarget(target: EltType): boolean

    static readonly sites: string[]
    static readonly targets: string[]
    static readonly HandlerName: string

    static canHandleTarget(target: HTMLElement): boolean {
        throw new Error("Method 'canHandleTarget' must be implemented in subclasses.");
    }

    protected static detectFrameworks() {
        const frameworks: string[] = [];
        if ((window as any).React || (window as any)['__REACT_DEVTOOLS_GLOBAL_HOOK__']) {
            frameworks.push('React');
        }
        if ((window as any).Vue || (window as any)['__VUE_DEVTOOLS_GLOBAL_HOOK__']) {
            frameworks.push('Vue');
        }
        if (!!(window as any).ng || !!document.querySelector('[ng-version]')) {
            frameworks.push('Angular');
        }
        if (!!document.querySelector('[class*="svelte-"]')) {
            frameworks.push('Svelte');
        }
        if (!!document.querySelector('#__next') || !!document.querySelector('[data-nextjs]')) {
            frameworks.push('Next.js');
        }
        return frameworks;
    }

    protected readonly detectedFrameworks: string[] = Handler.detectFrameworks();

    protected es: EmojiSelector = new EmojiSelector()
    protected esRoot: HTMLElement = document.createElement("div")
    protected _target: EltType;
    protected instanceId: number = Date.now()
    protected color = colors[Math.floor(Math.random() * colors.length)]
    private _search = ""
    protected searchResults: Emoji[] = []
    private _focusedIndex: number = -1
    private _status: HandlerStatus = HandlerStatus.NOT_READY
    private _userData : {
        settings: GlobalSettings,
        siteSettings: SiteSettings,
        favoriteEmojis: string[],
        frequentEmojis: { emojis: Emoji[], scores: Map<string, number>}
    } | undefined = undefined
    private _errors: HandlerError[] = []
    protected port?: browser.Runtime.Port

    private readyResolver!: (status: HandlerStatus) => void
    private readyRejecter!: (reason?: any) => void
    public readonly readyPromise = new Promise<HandlerStatus>((resolve, reject) => {
        this.readyResolver = resolve
        this.readyRejecter = reject
    })


    /** ---------------- **/
    /** public callbacks **/

    onExit: (() => void) = () => {console.warn("onExit not provided.")}
    onSearchFinished: ((selected: Emoji) => void) = (selected: Emoji) => {this.info(null, `onSearchFinished(selecte: ${selected}) not provided`)}
    onSearchCancelled: ((reason: string) => void) = (reason: string) => {this.info(null, `onSearchCancelled(reason: ${reason}) not provided`)}
    onStatusChanged: ((oldValue: HandlerStatus, newValue: HandlerStatus) => void) = () => {console.warn("onStatusChanged not provided.")}
    onError: ((error: HandlerError) => void) = (error: HandlerError) => {}

    /** ---------------- **/

    protected constructor(target: EltType) {
        this.log(null, "creating handler...\t---")
        this._target = target
        this.esRoot.id = "emoji-selector-root"

        this.updateUserData()
            .then(() => {
                this.port = browser.runtime.connect({name: `handler-${this.HandlerName}-${this.instanceId}`})
                this.port.onMessage.addListener(this.boundOnDataChanged)
                this.port.postMessage({action: "addDataChangeListener", data: {keys: "*"}})
                this.status = HandlerStatus.INACTIVE // handler is ready
                this.info(null, "Handler ready, idle.")
                this.es.favoriteEmojis = this.userData.favoriteEmojis
                this.readyResolver(this.status)
            })
            .catch((err) => {
                this.status = HandlerStatus.ERROR
                this.reportError(new HandlerError(err, "Error while reading user data", "fatal"))
                this.readyRejecter(err)
            })
    }


    /** ------- **/
    /** actions **/
    //region


    enable(hidden: boolean = false) {
        if(this.active) {
            this.reportError("Handler.enable() called while handler is already active. Current status : " + this.status, "warning")
            return
        }

        document.addEventListener('keydown', this.boundHandleDocumentKeydown, {capture: true})
        if(this.target.ownerDocument !== document) {
            this.target.ownerDocument.addEventListener('keydown', this.boundHandleDocumentKeydown, {capture: true})
        }
        document.addEventListener('pointerdown', this.boundOnDocumentPointerEvent);
        if(this.target.ownerDocument !== document) {
            this.target.ownerDocument.addEventListener('pointerdown', this.boundOnDocumentPointerEvent);
        }
        document.addEventListener('focusin', this.boundOnActiveElementChanged)
        if(this.target.ownerDocument !== document) {
            this.target.ownerDocument.addEventListener('focusin', this.boundOnActiveElementChanged)
        }
        this.target.addEventListener('blur', this.boundOnTargetBlur)

        this.status = hidden ? HandlerStatus.ACTIVE_HIDDEN : HandlerStatus.ACTIVE

        if(this.userData.settings.allowEmojiSuggestions || this.userData.favoriteEmojis.length > 0) {
            searchEmoji("", {
                useFavorites: true,
                useMostUsed: this.userData.settings.allowEmojiSuggestions,
            }).then(emojis => {
                this.searchResults = emojis
                this.onResultsUpdated()
            })
        }
        else {
            this.es.display = false
        }

        if(!hidden) {
            document.body.appendChild(this.esRoot)
            this.es.place(this.esRoot)
            this.es.onEmojiChosen = this.boundChooseEmoji
            this.es.onToggleEmojiFavorite = this.boundToggleFavorite
        }
    }

    disable() {
        if(!this.status.startsWith("active")) {
            this.reportError("Handler.disable() called while handler is not active. Current status : " + this.status, "warning")
            return
        }

        document.removeEventListener('keydown', this.boundHandleDocumentKeydown, {capture: true})
        if(this.target.ownerDocument !== document) {
            this.target.ownerDocument.removeEventListener('keydown', this.boundHandleDocumentKeydown, {capture: true})
        }
        document.removeEventListener('pointerdown', this.boundOnDocumentPointerEvent);
        if(this.target.ownerDocument !== document) {
            this.target.ownerDocument.removeEventListener('pointerdown', this.boundOnDocumentPointerEvent);
        }
        document.removeEventListener('focusin', this.boundOnActiveElementChanged)
        if(this.target.ownerDocument !== document) {
            this.target.ownerDocument.removeEventListener('focusin', this.boundOnActiveElementChanged)
        }
        this.target.removeEventListener('blur', this.boundOnTargetBlur)

        if(this.status === HandlerStatus.ACTIVE) {
            this.es.remove()
            this.esRoot.remove()
            this.es.onEmojiChosen = null as any
            this.es.onToggleEmojiFavorite = null as any
        }
        this.status = HandlerStatus.INACTIVE
    }

    hide() {
        if(this.status !== HandlerStatus.ACTIVE)
            this.reportError("Handler.hide() called while handler is not active. Current status : " + this.status, "warning")
        else {
            this.status = HandlerStatus.ACTIVE_HIDDEN
            this.es.remove()
            this.esRoot.remove()
            this.es.onEmojiChosen = null as any
            this.es.onToggleEmojiFavorite = null as any
        }
    }

    show() {
        if(this.status !== HandlerStatus.ACTIVE_HIDDEN)
            this.reportError("Handler.show() called while handler is not hidden. Current status : " + this.status, "warning")
        else {
            this.status = HandlerStatus.ACTIVE
            document.body.appendChild(this.esRoot)
            this.es.place(this.esRoot)
            this.es.onEmojiChosen = this.boundChooseEmoji
            this.es.onToggleEmojiFavorite = this.boundToggleFavorite
        }
    }

    destroy() {
        this.trace(null, "destroying...")
        if(this.active)
            this.disable()
        this.onDestroy()
        if(this.port) {
            this.port.onMessage.removeListener(this.boundOnDataChanged)
            this.port.disconnect()
            this.port = null as any
        }
        this.target = null as any
        this.onSearchFinished = () => {}
        this.onSearchCancelled = () => {}
        this.onStatusChanged = () => {}
        this.onError = () => {}
        this.onExit()
        this.onExit = () => {}
    }

    protected chooseEmoji(): void;
    protected chooseEmoji(emoji: Emoji): void;
    protected chooseEmoji(emoji?: Emoji) {
        if(!this.active) return
        if(!emoji)
            emoji = this.focusedEmoji
        if(!emoji) {
            this.info("NO_EMOJI_SELECTION")
            return
        }
        this.onEmojiChosen(emoji)
    }
    protected boundChooseEmoji = this.chooseEmoji.bind(this)

    protected dismissSearch(trigger: string) {
        this.onSearchCancelled(trigger) // public callback
        this.onSearchDismissed(trigger) // internal hook
    }

    protected toggleFavorite(emoji: string | Emoji) {
        this.sendMessageToBackground({action: "toggleFavoriteEmoji", data: {emoji: (typeof emoji === "string" ? emoji : emoji.emoji)}})
        // state will be updated when the background script notifies us of the change
    }
    protected boundToggleFavorite = this.toggleFavorite.bind(this)

    protected focusUp() {
        if(this.focusedIndex === -1)
            return
        if(this.focusedIndex === 0)
            this.focusedIndex = this.searchResults.length - 1
        else
            this.focusedIndex--

        if(this.focusedIndex >= 0)
            this.es.setFocusedEmoji(this.focusedIndex)
    }

    protected focusDown() {
        if(this.focusedIndex === -1)
            return
        if(this.focusedIndex === this.searchResults.length - 1)
            this.focusedIndex = 0
        else
            this.focusedIndex++

        if(this.focusedIndex >= 0)
            this.es.setFocusedEmoji(this.focusedIndex)
    }
//endregion

    /** --------------- **/
    /** protected hooks **/
    //region

    /** Called when an emoji is selected
     * Should call reportEmojiUsage if allowed by settings and use case
     * @param {Emoji} emoji - the selected emoji
     * @protected
     */
    protected abstract onEmojiChosen(emoji: Emoji): void

    /** Called when the handler is destroyed
     * you need to clean up any event listeners or references here
     * @protected
     */
    protected abstract onDestroy(): void

    /** Override if you want to change the way shortcodes are handled
     * default behavior: will trigger onEmojiChosen if a corresponding emoji is found
     *  */
    protected onShortcodeDetected(sc: string) {
        const em = getEmojiFromShortCode(sc).then(em => {
            if(em)
                this.chooseEmoji(em)
            else
                this.dismissSearch("INVALID_SHORTCODE")
        })
    }

    /** called when the search text is updated */
    protected onSearchUpdated() {
        if(this.search.length > 0)
            this.es.display = true
    }

    /** called when the search results are updated */
    protected onResultsUpdated(): void {
        if(!this.active) return
        // this.log(this.searchResults, `search results updated : ${this.searchResults.length}`, false)
        if(this.search.length === 0 && this.searchResults.length === 0) {
            // the user has not typed anything, no suggestions are allowed, and there are no favorites to display, don't show the ui
            this.es.display = false
            this.focusedIndex = -1
            this.es.options = []
            return
        }
        else if(this.status === HandlerStatus.ACTIVE) {
            this.es.display = true
            this.es.options = this.searchResults
        }

        if(this.searchResults.length === 0) {
            this.focusedIndex = -1
        }
        else {
            if(this.focusedIndex === -1)
                this.focusedIndex = 0
        }
    }

    /** Override if you want to change the behavior when the search is dismissed */
    protected onSearchDismissed(trigger: string) {
        this.trace(null, `search dismissed  ${trigger}`)
        this.destroy()
    }

    /** Focus lost by the selector (ex: user switched to another window or tab)
     * @protected
     */
    protected onSelectorBlur() {
        // TODO : check where is the focus and close or not the selector
        console.log("onSelectorBlur (FOCUS_LOST)")
    }
    private readonly boundOnSelectorBlur = this.onSelectorBlur.bind(this)

    /**
     * Selector closed because of user command (ex: esc. key, close button, or click outside)
     * @protected
     */
    protected onSelectorClose() {
        console.log("onSelectorClose (ES_CLOSE)")
        this.dismissSearch("ES_CLOSE")
    }
    private readonly boundOnSelectorClose = this.onSelectorClose.bind(this)
    //endregion

    /**---------------------------**/
    /** protected event listeners **/
    //region

    /** this listener listens only to events that happen at the document level */
    protected handleDocumentKeyDown(e: KeyboardEvent) {
        // this.log(null, "Handler.handleKeyDown : " + e.code)
        if(this.active)
            switch (e.code) {
                case "Enter":
                    e.stopPropagation()
                    e.preventDefault()
                    if(!this.focusedEmoji) {
                        this.warn("No emoji selected, cannot choose.")
                        break;
                    }
                    if(e.ctrlKey)
                        this.toggleFavorite(this.focusedEmoji.emoji)
                    else
                        this.chooseEmoji(this.focusedEmoji)
                    break;
                case "Escape":
                    e.preventDefault()
                    e.stopPropagation()
                    this.dismissSearch("KEY_ESCAPE")
                    break;
                case "ArrowUp":
                    e.preventDefault()
                    e.stopPropagation()
                    this.focusUp()
                    break;
                case "ArrowDown":
                    e.preventDefault()
                    e.stopPropagation()
                    this.focusDown()
                    break;
            }
    }
    private readonly boundHandleDocumentKeydown = this.handleDocumentKeyDown.bind(this)

    protected onActiveElementChanged(e: FocusEvent) {
        if(document.activeElement !== this.target && !this.es.hasFocus) {
            if(this.userData.settings.enableAutoHide)
                this.dismissSearch("FOCUS_LOST")
            else
                console.log("onActiveElementChanged (FOCUS_LOST)")
        }
    }
    private readonly boundOnActiveElementChanged = this.onActiveElementChanged.bind(this)

    protected onDocumentPointerEvent(e: MouseEvent) {
        if(e.target === this.target)
            return // console.log("target clicked")
        else if(e.target === this.es.element)
            return // console.log("selector clicked")
        else if(this.userData.settings.enableAutoHide)
            this.dismissSearch("OUTSIDE_CLICK")
        else
            console.log("onDocumentPointerEvent (OUTSIDE_CLICK)")
    }
    private boundOnDocumentPointerEvent = this.onDocumentPointerEvent.bind(this);

    /**
     * The text field used for search has lost focus (ex: user clicked on another element or used tab to change focus)
     * @protected
     */
    protected onTargetBlur(e: FocusEvent) {/*
        if(!this.es.hasFocus)
            if(this.userData.settings.enableAutoHide)
                this.dismissSearch("TARGET_LOST_FOCUS")
        else*/
            console.log("onTargetBlur (TARGET_LOST_FOCUS)")
    }
    private readonly boundOnTargetBlur = this.onTargetBlur.bind(this)

    protected async onDataChanged(m: unknown) {
        const msg = m as any as EventMessage
        if(msg.event !== "dataChanged") return
        if(!this._userData) {
            this.reportError("onDataChanged() called before userData was initialized", "fatal")
            this.status = HandlerStatus.ERROR
            return
        }
        this.log(msg.data, "Data changed : " + msg.data.key)
        if(msg.data.key.startsWith("settings")) {
            this._userData.settings = await this.getSettings()
            this._userData.siteSettings = await this.getSiteSettings()
        }
        else if(msg.data.key.startsWith("favoriteEmojis")) {
            this._userData.favoriteEmojis = await this.getFavoriteEmojis()
            this.es.favoriteEmojis = this._userData.favoriteEmojis
        }
        else if(msg.data.key.startsWith("emojiUsage")) {
            this._userData.frequentEmojis = await this.getEmojiUsage()
        }
    }
    protected boundOnDataChanged = this.onDataChanged.bind(this)

    //endregion

    /**------------------------------**/
    /** Protected methods, utilities*/
    //region

    abstract getSelectorGeometry(): Partial<EmojiSelectorGeometry>

    protected reportEmojiUsage(emoji: Emoji | string) {
        return this.sendMessageToBackground({
            action: "reportEmojiUsage",
            data: {
                emoji: typeof emoji === "string" ? emoji : emoji.emoji,
            }
        })
    }

    protected sendMessageToBackground(message: Message): Promise<any> {
        return browser.runtime.sendMessage(message)
    }

    protected reportError(error: string | HandlerError | Error, severity: Severity = "log") {
        let err = error
        if(typeof error == "string") {
            err = new HandlerError(error, severity)
            this._errors.push(err)
            this.onError(err)
        }
        else if(error instanceof HandlerError) {
            this._errors.push(error)
        }
        else {
            err = new HandlerError(error, severity)
            this._errors.push(err)
        }

        err = this._errors[this._errors.length -1]

        switch (err.severity) {
            case "fatal":
                this.error(err, "Fatal Error : " + err.message, false, true)
                break;
            case "error":
                this.error(err, "Error : " + err.message, false, true)
                break;
            case "warning":
                this.warn(err, "Warning : " + err.message, false, true)
                break;
            case "log":
                this.info(err, "Log : " + err.message, false, true)
        }

        this.onError(err);
    }

    protected async getSettings() {
        return await browser.runtime.sendMessage({
            action: "readData",
            data: {key: "settings"}
        }) as GlobalSettings
    }
    protected async getSiteSettings() {
        return await browser.runtime.sendMessage<GetSiteSettingsMessage>({
            action: "getSiteSettings",
        }) as SiteSettings
    }
    protected async getFavoriteEmojis() {
        const data = await browser.runtime.sendMessage<GetFavoriteEmojisMessage>({
            action: "getFavoriteEmojis"
        }) as Emoji[]
        return data.map((e) => e.emoji)
    }
    protected async getEmojiUsage() {
        return await browser.runtime.sendMessage<GetMostUsedEmojiMessage>({
            action: "getMostUsedEmoji"
        }) as { emojis: Emoji[], scores: Map<string, number>}
    }
    protected async updateUserData() {
        this._userData = {
            settings: await this.getSettings(),
            siteSettings: await this.getSiteSettings(),
            favoriteEmojis: await this.getFavoriteEmojis(),
            frequentEmojis: await this.getEmojiUsage()
        }
    }
    //region logging
    // TODO : implement logging levels for production
    protected log(message: any, title: string = "", collapsed = true, f = false) {
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
            console.error(message)
        console.trace()
        console.groupEnd()
    }

    protected info(message: any, title: string = "", collapsed = true, f = false) {
        if(!collapsed) {
            console.group(`[${this.HandlerName} %c${this.instanceId}%c] %c${title}`, `color: ${this.color}; font-weight: bold`, 'color: default, font-weight: normal', 'color: #0dc5dc;')
        }
        else {
            console.groupCollapsed(`[${this.HandlerName} %c${this.instanceId}%c] %c${title}`, `color: ${this.color}; font-weight: bold`, 'color: default, font-weight: normal', 'color: #0dc5dc;')
        }
        if (message)
            console.info(message)
        console.trace()
        console.groupEnd()
    }
    //endregion
    //endregion


    /** Getters and setters */
    // region

    /** changing the search value will automatically update search results.
     * shortcodes are automatically detected by default, override onSearchUpdated to change this */
    protected set search(value: string) {
        if(value !== this._search) {
            this._search = value;
            this.onSearchUpdated()
        }
        if(this.search.endsWith(":")) {
            let sc = this.search.slice(0, -1)
            this.onShortcodeDetected(sc)
        }
        else if(!this.search.match(/^[a-zA-Z0-9_]*$/)) {
            this.dismissSearch("INVALID_SEARCH")
        }
        searchEmoji(this._search).then(emojis => {
            this.searchResults = emojis
            this.onResultsUpdated()
        })
    }
    protected get search() { return this._search }

    private set target(value: EltType) {
        this._target = value;
    }
    get target(): EltType {
        return this._target;
    }

    protected set focusedIndex(value: number) {
        if(this.searchResults.length !== 0 && (value < 0 || value >= this.searchResults.length))
            throw new Error(`Selected index out of range : ${value} (max : ${this.searchResults.length - 1})`)
        this._focusedIndex = value
        if(this.status === HandlerStatus.ACTIVE)
            this.es.setFocusedEmoji(this._focusedIndex)
    }
    protected get focusedIndex() { return this._focusedIndex }

    protected get focusedEmoji() {
        if(this.focusedIndex === -1) {
            console.warn ("there is no focused emoji, focusedIndex is -1")
            return undefined
        }
        return this.searchResults[this.focusedIndex]
    }

    protected get userData() {
        if(!this._userData)
            throw new Error("userData not initialized, wait for the status to be something else than 'not_ready' or 'error' before using userData.")
        return this._userData
    }

    get active() { return this.status.startsWith("active") }

    protected set status(value: HandlerStatus) {
        const oldValue = this._status
        this._status = value
        this.log(null, `status : ${oldValue} -> ${value}`)
        this.onStatusChanged(oldValue, value)
    }
    get status() { return this._status }

    protected get errors() { return this._errors }
//endregion
}



export enum HandlerStatus {
    /** actively monitoring changes, searching emojis and displaying results **/
    ACTIVE = "active",
    /** monitoring changes, searching emojis, no UI displayed **/
    ACTIVE_HIDDEN = "active_hidden",
    /** inactive but have a target and a selector UI ready to be used **/
    INACTIVE = "inactive",
    /** incative, still initialising. **/
    NOT_READY = "not_ready",
    /** inactive, something went wrong and need to be fixed **/
    ERROR = "error"
}

export type Severity = "log" | "warning" | "error" | "fatal"
const severityValues = ["log", "warning", "error", "fatal"] as Severity[]
export class HandlerError {
    severity: Severity
    message: string
    error?: Error
    handlerName?: string
    handlerInstance?: number
    instanceColor?: string

    constructor(message: string, error?: Error);
    constructor(message: string, severity?: Severity)
    constructor(error: Error, severity?: Severity)
    constructor(error: Error, message?: string, severity?: Severity)
    constructor(arg1: string | Error, arg2?: Severity | string | Error, arg3?: Severity) {
        if (typeof arg1 === "string") {
            this.message = arg1
            if (arg2 instanceof Error) {
                this.error = arg2
                this.severity = "error"
            } else if(severityValues.includes(arg2 as Severity)) {
                this.severity = arg2 as Severity || "log"
            } else {
                this.severity = "log"
            }
        } else {
            this.error = arg1
            if(arg2 === "log" || arg2 === "warning" || arg2 === "error" || arg2 === "fatal") {
                this.message = arg1.message
                this.severity = arg2 || "error"
            }
            else if(typeof  arg2 === "string") {
                this.message = arg2
                this.severity = arg3 || "error"
            }
            else {
                this.message = arg1.message
                this.severity = "error"
            }
        }
    }
}