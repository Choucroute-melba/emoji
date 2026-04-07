# class Handler(target: HTMLElement)

Handlers are responsible for monitoring changes in the target element to search relevant emojis, displaying (or not) results in the UI
and handling the user interactions with the target and the selector's UI. They are also responsible for inserting the emoji
if needed.

`Handler` is the base class providing logic that every handler will need. It must be extended to create handlers adapted to 
specific use cases, websites and target types. This class is abstract and cannot be instantiated.

Every handler should have an associated manifest file that describes the handler's behaviour and defines when it should be used.

## **Base external requirements**

1. Tell the loader when to choose this handler
   1. information must be precise enough to rank the handler among others
   2. Must be able to check if it can indeed handle the target before being instantiated.
2. Search for emojis
   1. Search, according to user's input
   2. Respect user's preferences (e.g. search by name, by category, include favorites, most used...)
3. Display search results
   1. Have an UI adapted to the use case
   2. Respect theming preferences
   3. Respect user's preferences (e.g. number of results, order...)
4. Respond to user interactions
   1. Respond to interactions with the target
   2. Allow user to interact with search results
   3. Block target default behaviour if needed
5. Handle emoji selection (when the user chooses an emoji)
6. Communicate about important events
   1. When the user has selected an emoji
   2. When the user cancels the search
   3. When the status changes
   4. When errors happen
7. Have a clear status indication that tells the usability of the handler
   1. Tell if it is ready to be used
   2. Tell if it is currently active
   3. Tell if it is currently inactive
   4. Tell if it is currently not ready (initialising)
   5. Tell if it encountered an error (broken and cannot work)
8. Can be easily disabled and destroyed
   1. Do not leave any trace
      1. No memory leaks
      2. Remove all listeners
      3. Remove all traces from the DOM
   2. Allow garbage collection

### Solutions

| Requirement              | Solution                                                                                                                                     |
|--------------------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| 1 ---------              | _**Tell the loader when to choose this handler**_                                                                                            |
| 1.1                      | Provide an array of supported webstites and another one of supported HTML elemenst as static fields. Websites can be described as RegEx.     |
| 1.2                      | Provide a static method `canHandleTarget` that will be called before instantiating the handler to check if it can handle the target element. |
| 2 ---------              | _**Search for emojis**_                                                                                                                      |
| 2.1                      | Search using the background service each time the search value is updated                                                                    |
| 2.2                      | Check for settings that tunes the searching algorithm                                                                                        |
| 3 ---------              | _**Display search results**_                                                                                                                 |
| 3.1                      | Sublclasses of `Handler` can have a different UI that inherit `EmojiSelector`                                                                |
| 3.2                      | Make theme settings available to subclasses. // TODO                                                                                         |
| 3.3                      | Provide a `settings` object and `async updateSettings()` function                                                                            |
| 4 ---------              | _**Respond to user interactions**_                                                                                                           |
| 4.1                      | Event listeners                                                                                                                              |
| 4.2                      | Event listeners on document level, interactive UI                                                                                            |
| 4.3                      | Use capture listeners, `Event.preventDefault()`, `Even.stopPropagation()`                                                                    |
| 5 ---------              | _**Handle emoji selection (when the user chooses an emoji)**_                                                                                |
|                          | Do what the handler was designed for (e.g. insert emoji, copy it...). Close the handler as default behaviour                                 |
| 6 ---------              | _**Communicate about important events**_                                                                                                     |
| 6.1                      | `onSearchFinished(selected: Emoji)` callback                                                                                                 |
| 6.2                      | `onSearchCancelled(reason: string)` callback                                                                                                 |
| 6.3                      | `onStatusChanged(old: string, new: string)` callback, `readyPromise` that will resolve when firt initialized                                 |
| 6.4                      | Throw exceptions and set the status to `"error"`, or call the `onError(error: string)` callback                                              |
| 7 ---------              | _**Have a clear status indication**_                                                                                                         |
| 7.1, 7.2, 7.3, 7.4, 7.5  | `status` readonly public fields                                                                                                              |
| 8 ---------              | _**Can be easily disabled and destroyed**_                                                                                                   |
| 8.1.1, 8.1.2, 8.1.3, 8.2 | Keep refereces to every allocated rescources, listeners and changes made to the dom in the object fields.                                    |
| 8.2                      | Provide a `destroy()` function                                                                                                               |

## public fields

`readonly status : "active | "active_hidden" | "inactive" | "not_ready" | "error"` :
  - `active` : actively monitoring changes, searching emojis and displaying results
  - `active_hidden` : monitoring changes, searching emojis, no UI displayed
  - `inactive` : inactive but have a target and a selector UI ready to be used
  - `not_ready` : incative, still initialising or there is something wrong
  - `error` : inactive, something went wrong and need to be fixed

`readyPromise: Promise<HandlerStatus>` : Will resolve when the handler is first ready to be used.

`abstract static readonly sites : string[]` : list of sites that the handler can be used on

`abstract static readonly targets: string[]` : list of target types that the handler can be used on (targets type meaning HTML tag name)

`abstract static readonly HandlerName: string`

`readonly target: EltType` : The targeted element. EltType changes with the different types of handlers

`readonly errors: HandlerError[]` : list of errors that happened during the handler's life, starting from the oldest one.

## public methods

`abstract static canHandleTarget(target: HTMLElement): boolean` : last check to see if the handler can handle the target element.

[action] `enable(hidden: boolean = false): Promise<void>` : Activate the handler, register listeners, load data and 
show the UI (if hidden is false).

[action] `hide()` : hide the UI when the handler is active.

[action] `show()` : show the UI when the handler is active.

[action] `disable()` : set the status to inactive. It will unload all listeners, hide the UI and remove all traces from the DOM.

[action] `destroy()` : Same as `disable()` but also call `onDestroy()` and allow garbage collection. The handle cannot
be re-used after that.

### public callbacks

`onSearchFinished(selected: Emoji)` : called when the user has selected an emoji and the apropriate action associated 
with it is done.

`onSearchCancelled(reason: string)` : called when the user has dismissed the search UI (cliked outside, escape key...)

`onStatusChanged(old : string, new: string)` : called after the status changes.

`onError(error: string)` : called when an error happened. All previous errors will be available in the `errors` array. If
the severity is `"fatal"`, the status will be set to `ERROR`.

`onExit(): void` : Called when the handler has been destroyed.

## **Base internal requirements**

1. Be consistent regarding external requirements
2. Provide access to settings and user's data
   1. Keep them up to date
3. Handle user's actions
   1. Prevent default behaviours
   2. Prevent propagation
   3. Update search state
      1. Keep the state consistent
4. Manage the application state
   1. Keep the state consistent
      1. Provide easy and secure ways to change the state
   2. Notify subclasses when the state changes
5. Keep the UI in sync with the state

### Solutions
| Requirement | Solution                                                                                                                 |
|-------------|--------------------------------------------------------------------------------------------------------------------------|
| 1 --------- | _**Be consistent regarding external requirements**_                                                                      |
| e/2.1       | Implement a method `async search(query: string): Promise<Emoji>` that calls the serch algorithm in the bakcground script |
| e/2.2       | Provide a `settings` object and `async updateSettings()` function                                                        |      
| 2 --------- | _**Provide easy access to settings and user's data**_                                                                    |
|             | `protected readolny userData` object                                                                                     |
| 2.1         | Whatch for changes in data                                                                                               |
| 3 --------- | _**Handle user's actions**_                                                                                              |
| 3.1         | Use `Event.preventDefault`, document level listeners and capture events                                                  |
| 3.2         | Use `Event.stopPropagation`                                                                                              |
| 3.3         | Handle the selection management using `focusedIndex`, `searchResult`                                                     |
| 3.3.1       | Provide getters and setters and functions for precise actions.                                                           |
| 4 --------- | _**Manage the application state**_                                                                                       |
| 4.1, 4.1.1  | Provide getters, setters and actions to change the state. make fields readonly.                                          |
| 4.2         | Call protected hooks corresponding to an action                                                                          |
| 5 --------- | _**Keep the UI in sync with the state**_                                                                                 |
|             |                                                                                                                          |



## protected methods

`constructor(target: HTMLElement)`

[action] `focusUp()` : focus on the previous emoji in the search results.

[action] `focusDown()` : focus on the next emoji in the search results.

[action] `chooseEmoji()` : select the currently focused emoji. this will trigger the `onSearchFinished` callback.

[action] `chooseEmoji(emoji: Emoji)` : select the emoji passed as argument. this will trigger the `onSearchFinished` callback.

[action] `dismissSearch(reason: string)` : dismiss the search. this will trigger the `onSearchCancelled` callback.

[action] `toggleFavorites(emoji: string): Promise<void>` : toggle the emoji in the favorites list.

`sendMessageToBackground(message: Message): Promise<any>`

`reportError(error: HandlerError | string | Error, severity?: Severity)` : Report an error that happened during the handler's life. It will 
update the `errors` array and call the `onError` callback.

`async updateSettings()`
`async updateSiteSettings()`
`async updateFavoriteEmojis()`
`async updateEmojiUsage()`
`async updateUserData()` : update every data stored in `userData`.

#### protected hooks

`onEmojiChosen(emoji: Emoji)` : Report emoji usage if needed. Called before `onSearchFinished` public callback.

`abstract onDestroy()` : Called before the handler is destroyed. Use it to clean up listeners, refs and close the selector to allow garbage collection of the handler.

`onShortcodeDetected(sc: string)` : Called when a shortcode is detected in the new search value

`onSearchUpdated()` : Called when the search value is updated and doesn't contain a shortcode.

`abstract onResultsUpdated()` : Called when the search results are updated.

`onSearchDismissed(reason: string)` : Called when the search is dismissed (you can't cancel it).

`onSelectorBlur()` : Called when the selector UI loses focus.

`onSelectorClose()` : Called when the selector UI is closes following a user action.

#### Protected event listeners

`handleDocumentKeydown(e: KeyboardEvent)` : Listen to keydown events at the document level at the capture phase.

`onActiveElementChanged(e: FocusEvent)` : Listen to focus events at the document level.

`onDocumentPointerEvent(e: MouseEvent)` : Listen to pointer events at the document level.

`onTargetBlur(e: FocusEvent)` : Listen to blur events on the target element.

`onDataChanged(msg: EventMessage)` : Listen to messages from the background script.

#### Protected setters

[action] `set search(value: string)` : update the search string.

[action] `set focusedIndex(value: number)`

[action] `set status(value: HandlerStatus)` : will trigger `onStatusChanged` callback.


## protected fields

`es: EmojiSelector` : Object managing the UI component.

[state] `search: string` : the current search string. Changing it will update the search results.

`readonly userData: {
        settings: GlobalSettings,
        siteSettings: SiteSettings,
        favoriteEmojis: string[],
        frequentEmojis: { emojis: Emoji[], scores: Map<string, number>}
    }`

[state] `searchResults: Emoji[]`

[state] `focusedIndex: number` : index of the curently focused emoji in the search results.

[state] `readonly active: boolean` : make it easy to know if the handler is active or not: return `this.status.startsWith("active")`

[state] `readonly focusedEmoji: Emoji | undefined` : get the currently focused emoji.

`instanceId: number` : Id to help with logging and debugging, set to `Date.now()` by default.

`color: string` : a random colour to help with debugging.

`errors: HandlerError[]` : list of errors that happened during the handler's life, starting from the oldest one.





