import EmojiSelector from "./selector/emojiselector";
import TextAreaHandler from "./features/textarea/handler";
import Handler from "./handler/handler";
import HTMLInputHandler from "./features/input/handler";

console.log('Emoji on the go ✨')

const handlers = [HTMLInputHandler, TextAreaHandler]

let es = new EmojiSelector()
let currentHandler: Handler<any> | null = null

function mainListener(this: any, e: KeyboardEvent) {
    console.groupCollapsed(`%c${e.code}%c ${e.key} \tTarget : %c${e.target}`,
        'color: #FFC300; background-color: #201800; border-radius: 3px; padding: 2px 4px;',
        'color: default; background-color: default',
        'color: #999; ');
    console.log(e.target)

    console.groupEnd()

    const domain = window.location.hostname

    switch (e.code) {
        case "Period":
/*            for (let h of handlers) {
                if (h.sites && h.sites.includes(domain)) {
                    if(h.canHandleTarget(e.target as any)) {
                        currentHandler = new h(es, e.target as any)
                        break;
                    }
                }
            }*/
            if (!currentHandler) {
                for (let h of handlers) {
                    if (h.targets && h.targets.includes((e.target as HTMLElement).tagName.toLowerCase())) {
                        if(h.canHandleTarget(e.target as any)) {
                            currentHandler = new h(es, e.target as any)
                            break;
                        }
                    }
                }
            }
            if(currentHandler) {
                currentHandler.onExit = () => {
                    currentHandler = null
                    console.log("EmojiSelector closed")
                    window.addEventListener('keydown', mainListener)
                }
                window.removeEventListener('keydown', mainListener)
            }
            console.log(currentHandler ? `%cHandled by ${currentHandler.HandlerName}` : "%cNo handler found", (currentHandler ? 'color: #00FF00' : 'color: #FF0000') + '; font-weight: bold')
            break;
    }
}


window.addEventListener('keydown', mainListener)