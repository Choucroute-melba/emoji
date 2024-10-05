

export function getRelativeVerticalPositioning(y: number) :"up" | "down";
export function getRelativeVerticalPositioning(element: Element) :"up" | "down";

export function getRelativeVerticalPositioning(y: number | Element) :"up" | "down" {
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    if (y instanceof Element) {
        const rect = y.getBoundingClientRect();
        y = rect.y
    }
    if (y > (windowHeight / 3 * 2)) {
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
    const result =  getCursorXY(element);

    const marker = document.createElement('span');
/*    marker.style.backgroundColor = "green";
    marker.style.position = "absolute";
    marker.style.width = "1px";
    marker.style.height = result.lineH + "px";
    marker.style.left = (result.x + rect.left + window.scrollX - element.scrollLeft) + "px";
    marker.style.top = (result.y + rect.top + window.scrollY - element.scrollTop) + "px";*/
    document.body.appendChild(marker);

    return {
        x: result.x + (rect.x - element.scrollLeft) + window.scrollX,
        y: result.y + (rect.y - element.scrollTop) + window.scrollY,
        lineH: result.lineH
    };
}

/**
 * Calculate and update the selector's position using given text input
 */
export function getPositionFromElement(elt: HTMLInputElement | HTMLTextAreaElement) {
    const positioning = getRelativeVerticalPositioning(elt);
    const position = calculateXYFromElt(elt, positioning)
    return {
        positioning,
        position
    }
}

export function getPositionFromTextareaCaret(elt: HTMLTextAreaElement) {
    const position = getAbsoluteCaretPosition(elt);
/*    const marker = document.createElement('span');
    marker.style.backgroundColor = "red";
    marker.style.position = "absolute";
    marker.style.width = "1px";
    marker.style.height = position.lineH.toString() + "px";
    marker.style.left = position.x + "px";
    marker.style.top = position.y + "px";
    document.body.appendChild(marker);*/
    const positioning = getRelativeVerticalPositioning(position.y - window.scrollY);
    if(positioning == "up") {
        return {
            positioning,
            position: {x: position.x, y: -(position.y - window.innerHeight)}
        }
    }
    else {
        return {
            positioning,
            position: {x: position.x, y: position.y + position.lineH}
        }
    }
}

/**
 * returns x, y coordinates for relative positioning of a span within a given textarea
 * at a given selection point
 * @param {object} element - the input element to obtain coordinates for
 * // @ {number} selectionPoint - the selection point for the input
 */
const getCursorXY = (element: HTMLTextAreaElement) => {
    const selectionPoint = element.selectionStart
    // create a dummy element that will be a clone of our input
    if(document.body.querySelector("#mirrorForCaret"))
        document.body.removeChild(document.body.querySelector("#mirrorForCaret") as HTMLElement)

    const div = document.createElement('div')
    div.id = "mirrorForCaret"
    // get the computed style of the input and clone it onto the dummy element
    const copyStyle = getComputedStyle(element)

    // @ts-ignore
    for (const prop of copyStyle) {
        div.style[prop] = copyStyle[prop]
    }
    // we need a character that will replace whitespace when filling our dummy element if it's a single line <input/>
    const swap = '.'
    const inputValue = element.tagName === 'INPUT' ? element.value.replace(/ /g, swap) : element.value
    // set the div content to that of the textarea up until selection
    // set the text content of the dummy element div
    const beforeSpan = inputValue.slice(0, selectionPoint)
    const afterSpan = inputValue.slice(selectionPoint + 1)
    if (element.tagName === 'TEXTAREA') div.style.height = 'auto'
    // if a single line input then the div needs to be single line and not break out like a text area
    if (element.tagName === 'INPUT') div.style.width = 'auto'
    // create a marker element to obtain caret position
    const span = document.createElement('span')
    span.id = 'caret'
    // give the span the textContent of remaining content so that the recreated dummy element is as close as possible
    span.textContent = inputValue.slice(selectionPoint, selectionPoint + 1) || '.'
    span.style.border = "1px solid blue"
    // append the span marker to the div
    div.innerHTML = beforeSpan + span.outerHTML + afterSpan
    div.style.position = 'absolute'
    const rect = element.getBoundingClientRect()
    div.style.top = (rect.top + window.scrollY) + "px"
    div.style.left = (rect.left + window.scrollX) + "px"
    // append the dummy element to the body
    document.body.appendChild(div)
    // get the marker position, this is the caret position top and left relative to the input
    const span2 = div.querySelector('#caret')
    if(!span2) return {x: 0, y: 0, lineH: 0}
    const { offsetLeft: spanX, offsetTop: spanY, scrollHeight: lineH } = span2 as HTMLElement
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