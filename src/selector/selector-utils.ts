

export function getRelativeVerticalPlacement(y: number) :"up" | "down";
export function getRelativeVerticalPlacement(element: Element) :"up" | "down";

export function getRelativeVerticalPlacement(y: number | Element) :"up" | "down" {
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
 * @param placement - return the bottom left corner position if "up" and top left corner if "down"
 */
export function calculateXYFromElt(elt: Element, placement: "up" | "down" | "auto" = "auto"): {x: number, y: number} {
    const doc = elt.ownerDocument || document;
    const fromWin = doc.defaultView || window;
    const rect = elt.getBoundingClientRect();
    const topRect = rectToTopViewport(rect, fromWin);

    const topWin = (fromWin.top || window);

    // Determine placement relative to the top window viewport if auto
    if (placement == "auto") {
        placement = getRelativeVerticalPlacement(topRect.top);
    }

    const scrollX = topWin.scrollX || topWin.document.documentElement.scrollLeft;
    const scrollY = topWin.scrollY || topWin.document.documentElement.scrollTop;

    if (placement == "up")
        return {x: topRect.left + scrollX, y: -(topRect.top + (scrollY - topWin.innerHeight))};
    else
        return {x: topRect.left + scrollX, y: topRect.bottom + scrollY};

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
 * Calculate and update the selector's position using the given text input
 */
export function getPositionFromElement(elt: HTMLInputElement | HTMLTextAreaElement) {
    const placement = getRelativeVerticalPlacement(elt);
    const position = calculateXYFromElt(elt, placement)
    return {
        placement,
        position
    }
}

/**
 * Calculate and update the selector's position using the selection within the given element
 * @param elt
 * @param selection
 */
export function getPositionFromEditableDivCaret(elt: HTMLElement, selection?: Selection | null){
    // Calculate caret absolute position for a contenteditable element (e.g., aria role textbox)
    // IMPORTANT: build the caret range using selection offsets (focus/anchor) rather than relying solely on getRangeAt(0)
    const doc = elt.ownerDocument || document;
    const win = doc.defaultView || window;

    const sel = selection ?? win.getSelection();
    if (!sel) {
        return getPositionFromElement(elt as any);
    }

    // Build a collapsed range from selection offsets so the caret position truly reflects focusNode/focusOffset
    let range: Range | null = null;
    try {
        const focusNode = sel.focusNode ?? sel.anchorNode;
        const focusOffset = (sel.focusNode != null ? sel.focusOffset : sel.anchorOffset) ?? 0;
        if (focusNode) {
            const r = doc.createRange();
            // Range.setStart accepts both Text and Element nodes. For Element nodes, offset is the child index.
            // We clamp offsets for text nodes to avoid IndexSizeError.
            if (focusNode.nodeType === Node.TEXT_NODE) {
                const textLen = (focusNode.nodeValue || '').length;
                r.setStart(focusNode, Math.min(Math.max(focusOffset, 0), textLen));
            } else {
                const el = focusNode as Element;
                const safeOffset = Math.min(Math.max(focusOffset, 0), el.childNodes.length);
                r.setStart(el, safeOffset);
            }
            r.collapse(true);
            range = r;
        }
    } catch (e) {
        range = null;
    }

    if (!range) {
        // Fallback to the current selection's range if offsets could not be used
        if (!sel.rangeCount) {
            return getPositionFromElement(elt as any);
        }
        range = sel.getRangeAt(0).cloneRange();
        range.collapse(sel.type === 'Caret' ? true : false);
    }

    let rect: DOMRect | null = null;
    const clientRects = range.getClientRects();
    if (clientRects && clientRects.length > 0) {
        rect = clientRects[clientRects.length - 1] as DOMRect;
    } else {
        // If the range has no rects (e.g., at the end of a line or on element boundary), insert a temporary zero-width marker
        const marker = doc.createElement('span');
        marker.textContent = '\u200b'; // zero-width space
        marker.style.fontSize = 'inherit';
        marker.style.lineHeight = 'inherit';
        try {
            // Insert at the computed caret range
            range.insertNode(marker);
            rect = marker.getBoundingClientRect();
        } catch (e) {
            // As a last resort, fall back to element position
            return getPositionFromElement(elt as any);
        } finally {
            // Clean up marker while keeping selection intact
            if (marker.parentNode) marker.parentNode.removeChild(marker);
        }
    }

    if (!rect) {
        return getPositionFromElement(elt as any);
    }

    // Map caret rect to the top window viewport coordinates (handles nested iframes)
    const topRect = rectToTopViewport(rect, win);
    const topWin = (win.top || window);

    const caretX = topRect.left + (topWin.scrollX || topWin.document.documentElement.scrollLeft);
    const caretYTop = topRect.top + (topWin.scrollY || topWin.document.documentElement.scrollTop);
    const caretYBottom = topRect.bottom + (topWin.scrollY || topWin.document.documentElement.scrollTop);

    // Determine whether to place the selector above or below based on top window viewport position
    const placement = getRelativeVerticalPlacement(topRect.top);

    if (placement === 'up') {
        // When placing up, the y coordinate expects a negative offset from the bottom of the top window viewport
        return {
            placement,
            position: { x: caretX, y: -(topRect.top + ((topWin.scrollY || topWin.document.documentElement.scrollTop) - topWin.innerHeight)) }
        };
    } else {
        // When placing down, use the absolute bottom position of the caret line in the top document
        return {
            placement,
            position: { x: caretX, y: caretYBottom }
        };
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
    const placement = getRelativeVerticalPlacement(position.y - window.scrollY);
    if(placement == "up") {
        return {
            placement,
            position: {x: position.x, y: -(position.y - window.innerHeight)}
        }
    }
    else {
        return {
            placement,
            position: {x: position.x, y: position.y + position.lineH}
        }
    }
}

/**
 * returns x, y coordinates for relative placement of a span within a given textarea
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
        div.style[prop as any] = copyStyle[prop as any]
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
    // return an object with the x and y of the caret. account for input placement so that you don't need to wrap the input
    return {
        x: spanX,
        y: spanY,
        lineH: lineH
    }
}

// Helper: map a rect from a given window (possibly inside iframes) to the top window viewport coordinates
export function rectToTopViewport(rect: DOMRect, fromWin: Window): { left: number, top: number, right: number, bottom: number, width: number, height: number } {
    let left = rect.left;
    let top = rect.top;
    let right = rect.right;
    let bottom = rect.bottom;
    let currentWin: Window | null = fromWin;

    // Walk up through nested iframes, accumulating each frameElement's client rect
    try {
        while (currentWin && currentWin.parent && currentWin !== currentWin.parent) {
            const frameEl = (currentWin.frameElement as Element | null);
            if (!frameEl) break;
            const frameRect = frameEl.getBoundingClientRect();
            left += frameRect.left;
            top += frameRect.top;
            right += frameRect.left;
            bottom += frameRect.top;
            currentWin = currentWin.parent;
        }
    } catch {
        // Cross-origin may prevent access to parent; in that case, best effort with available frameElement
        // If cross-origin prevents traversal, we still got the immediate frame offset above.
    }

    return { left, top, right, bottom, width: rect.width, height: rect.height };
}
