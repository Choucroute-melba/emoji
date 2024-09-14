# Emoji on the go

A firefox extension to quickly insert emoji into text fields, using the :emoji_name: syntax.

# Development instructions

## prerequisites
- nodejs and npm
- windows

## steps
1. Clone the repository or unzip emoji-src.zip
2. run `npm install`
3. run `npm start` to start the development server
4. Load as a temporary addon in firefox
5. open `http://localhost:3000/test-site.html` to test the extension

## build instructions
1. run `npm run build`

``./build/emoji.zip`` is the built extension and ``./build/emoji-src.zip`` is the source code

# Behaviour on any editable field
```mermaid
graph TD
    A[Start] -->|user types `:`| B[Show emoji list]
    B -->|continues typing| C[Update emoji list]
    B -->|press up or down| F[Update selected emoji]
    B -->|press enter| G[Insert selected emoji]
    B -->|type a non-letter| E[Close selector]
    B -->|press `esc`| E[Close selector]
    B -->|type a second `:`| D[Insert emoji from shortcode\n- if found -]
    D --> E
    G --> E
    E --> J[End]
```
# Developer's corner
## building extension
the ./build.bat script allows you to build the extension in a zip file, and zip the sources. If you provide
a version number as the -v argument, it will create commit and a tag and then push to remote.

## API description
### `EmojiSelector` class
This class is an interface to the selector's UI. It is used to interact with the user and display the emoji list.
#### Properties
- `onEmojiSelected: (emoji: Emoji) => void` : a callback that will be called when an emoji is selected
- `searchResults: Emoji[]` : the list of emojis that are currently displayed
- `disply: boolean` : whether the selector should be shown or not
- `position: {position: { x: number; y: number; }, positioning: "up" | "down"}` : the position of the selector, and 
whether it should be displayed above or below the target element
- `debugText: string` : a text that will be displayed in the selector for debugging purposes
#### Methods
- `focusUp()` : move the focus up in the emoji list
- `focusDown()` : move the focus down in the emoji list
- `getFocusedEmoji(): Emoji` : return the emoji that is currently focused
- `setFocusedEmoji(index: number)` : change the focused emoji in the list

### Utilities
package : `./src/selector/selctor-utils.ts`

this package contains utility functions that you can use in your handlers.
- `function getRelativeVerticalPositioning(y: number) :"up" | "down";` : return whether the selector should be displayed
above or below the target element, based on the vertical position of the target element
- `function getRelativeVerticalPositioning(element: Element) :"up" | "down";` : same but calculate it directly from the
element
- `function calculateXYFromElt(elt: Element, positioning: "up" | "down" | "auto" = "auto"): {x: number, y: number}` :
 return the absolute position of the selector based on the target element and the positioning parameter
- `function getAbsoluteCaretPosition(element: HTMLTextAreaElement) : {x: number, y: number, lineH: number}` : 
return the absolute position of the caret in the given textarea
- `function getPositionFromElement(elt: HTMLInputElement | HTMLTextAreaElement)` -> you should use this
- `function getPositionFromTextareaCaret(elt: HTMLTextAreaElement)` -> same but for textareas.
return type : `{position: { x: number; y: number; }, positioning: "up" | "down"}`


### `Handler` classes
Handlers are classes handling all the logic between the selector's UI, the website to act on and the user's actions.

Two base handlers are already available and provide base logic that is valid for every use cases. If you want to add 
support for a specific website or an input method that is not handled by default, you will need to write a handler 
based on one of those two base Handlers. Depending on your use case, you will extend either `Handler` or `EditableHandler`

- `Handler` is the minimal base class that have a few predefined logic, only to ensure the behaviour of the extension 
is respected. Here is what you can use to fulfill your needs :

```typescript

/** 
 * Here are the public or protected fields and methods from base class that you can use for your specific case : 
 */
class Handler<TypeOfTarget> {

    /** These are useful properties and objects accessible from MyHandler that you can use */
    // The EmojiSelector object can be used to act on the selector's interface
    protected es: EmojiSelector
    // This is the targeted element, the one in wich the emoji should be injected
    // and the one from where most of the events come from
    protected target: TypeOfTarget
    protected searchResults: Emoji[]
    // changing this vcalue will automatically update search results
    protected search: string
    // active = listeners on, react to inputs and with interface displayed (in most of the cases)
    // inactive = waiting to be reactivated or destroyed. keep the instance alive.
    protected active: boolean
    
    
    /**
     *  methods 
     */
    
    /** select the currently focused emoji */
    protected selectEmoji() {}
    /** select the given emoji */
    protected selectEmoji(emoji: Emoji) {}
    protected dismissSearch(reason: string) {}

    /**
     * do pretty logs, useful for debugging.
     * @param message - displayed with formatting and all
     * @param title - dispalyed as the title of the console group
     * @protected
     */
    protected log(message: any, title: string = "") {}
    
    /**
     * will destroy the instance. Every listeners and references should be freed
     * so that garbage collector can do his job.
     * fire the onDestroy callback
     */
    destroy() {}
    
}

/**
 * This base handler provide logic for handling editable fields.
 * it contains these additional properties and methods :
 */
abstract class HTMLEditableHandler<TypeOfTarget> extends Handler<TypeOfTarget> {

    /**
     * Here are the public or protected fields and methods from base class that you can use for your specific case :
     */
    protected searchPosition: {
        begin: number,
        end: number,
        caret: number
    }

    /**
     *  methods
     */

    /**
     *  callbacks
     */
}



class MyHandler extends HTMLEditableHandler<TypeOfTarget> {

    /** these three fields are used to select the handler that will be best to use in a particular
    context (website and type of target).
    you need to declare them before anything else */
    static sites: string[] = ["array of specific websites your extension support. Leave empty for all wabsites"]
    static targets: string[] = ["array of tag names that your extension support. Leave empty for every elements"]
    static HandlerName: string = "A pretty name for your handler"
    
    /** this function will be called for you to confirm that this handler can work with the target,
     before giving you the lead. */
    static canHandleTarget(target: TypeOfTarget): boolean {}

    /**
     * Here are the callbacks that you can implement.
     * Most of them have a default behaviour that you can modify.
     * Others are mandatory to implement
     */
    
    onEnabled() {}
    onDisabled() {}
    
    onEmojiSelected(emoji: Emoji) {} // mandatory
    onShortcodeDetected(shortcode: string): Emoji | null {}
    onSearchUpdated() {}
    onSearchDissmissed(reason: string) {}
    
    /** mandatory to implement : **/
    /** Here you need to clean up every references and listeners to enable garbage collection */
    onDestroy() {}
    /** Return the position of the selector that you want */
    getSelectorPosition(): {position: { x: number; y: number; }, positioning: "up" | "down"}  {}
    
}

```


.