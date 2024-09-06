/**
 * determinate if the selector should be placed above or below the given element
 * @param element
 */
export function getRelativeVerticalPositioning(element: Element) :"up" | "down" {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;

    if (rect.top > (windowHeight / 3 * 2)) {
        return "up";
    } else {
        return "down";
    }
}

/**
 * Calculate the position of the selector to place it next to the given element
 * @param elt
 * @param positioning - return the bottom left corner position if "up" and top left corner if "down"
 */
export function calculateXYFromElt(elt: Element, positioning: "up" | "down" | "auto" = "auto"): {x: number, y: number} {
    const rect = elt.getBoundingClientRect();
    if (positioning == "auto") {
        positioning = getRelativeVerticalPositioning(elt);
    }
    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    if (positioning == "up")
        return {x: rect.left + scrollX, y: -(rect.top + (scrollY - window.innerHeight))};
    else
        return {x: rect.left + scrollX, y: rect.bottom + scrollY};

}

/** a fonction that returns the position of the caret in the given textarea in pixels */
export function getAbsoluteCaretPosition(element: HTMLTextAreaElement) : {x: number, y: number, lineH: number} {
    const rect = element.getBoundingClientRect()

    const result =  getCursorXY(element, element.selectionStart);
    return {
        x: result.x + (rect.x - element.scrollLeft) + window.scrollX,
        y: result.y + (rect.y - element.scrollTop) + window.scrollY,
        lineH: result.lineH
    };

}

/**
 * returns x, y coordinates for relative positioning of a span within a given text input
 * at a given selection point
 * @param {object} input - the input element to obtain coordinates for
 * @param {number} selectionPoint - the selection point for the input
 */
const getCursorXY = (input: HTMLTextAreaElement, selectionPoint: number) => {
    // create a dummy element that will be a clone of our input
    const div = document.createElement('div')
    // get the computed style of the input and clone it onto the dummy element
    const copyStyle = getComputedStyle(input)

    // @ts-ignore
    for (const prop of copyStyle) {
        div.style[prop] = copyStyle[prop]
    }
    // we need a character that will replace whitespace when filling our dummy element if it's a single line <input/>
    const swap = '.'
    const inputValue = input.tagName === 'INPUT' ? input.value.replace(/ /g, swap) : input.value
    // set the div content to that of the textarea up until selection
    const textContent = inputValue.substr(0, selectionPoint)
    // set the text content of the dummy element div
    div.textContent = textContent
    if (input.tagName === 'TEXTAREA') div.style.height = 'auto'
    // if a single line input then the div needs to be single line and not break out like a text area
    if (input.tagName === 'INPUT') div.style.width = 'auto'
    // create a marker element to obtain caret position
    const span = document.createElement('span')
    // give the span the textContent of remaining content so that the recreated dummy element is as close as possible
    span.textContent = inputValue.substr(selectionPoint) || '.'
    // append the span marker to the div
    div.appendChild(span)
    div.style.position = 'absolute'
    div.style.top = (window.innerHeight + window.scrollY) + "px"
    // append the dummy element to the body
    document.body.appendChild(div)
    // get the marker position, this is the caret position top and left relative to the input
    const { offsetLeft: spanX, offsetTop: spanY, scrollHeight: lineH } = span
    // lastly, remove that dummy element
    // NOTE:: can comment this out for debugging purposes if you want to see where that span is rendered
    document.body.removeChild(div)
    // return an object with the x and y of the caret. account for input positioning so that you don't need to wrap the input
    return {
        x: spanX,
        y: spanY,
        lineH: lineH
    }
}