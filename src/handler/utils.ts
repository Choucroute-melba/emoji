export function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
    const prototype = Object.getPrototypeOf(element);
    const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    if (setter) {
        setter.call(element, value);
    } else {
        element.value = value; // fallback
    }
}

/**
 * This will set the value of the element from a script tag inside the document, which may avoid some security issues with some frameworks.
 * remember to replace the cursor position after setting the value.
 * @param element
 * @param value
 */
export async function setValueFromSafeOrigin(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
    const attr = 'data-emojeezer-id';
    const uniqueId = `emojeezer-${Date.now()}-${Math.random()}`;
    element.setAttribute(attr, uniqueId);

    const script = document.createElement('script');
    script.textContent = `
        (() => {
            const originalValue = ${JSON.stringify(value)};
            const emojeezerElement = document.querySelector('[${attr}="${uniqueId}"]');;
            console.log("Setting value from safe origin", emojeezerElement);
            if (emojeezerElement) {
                const setter = Object.getOwnPropertyDescriptor(emojeezerElement.__proto__, 'value')?.set;
                setter?.call(emojeezerElement, originalValue);
                console.log("Value set to:", emojeezerElement.value);
                console.log(emojeezerElement);
                emojeezerElement.dispatchEvent(new Event('input', { bubbles: true }));
                emojeezerElement.dispatchEvent(new Event('change', { bubbles: true }));
            }
        })();
    `;
    document.documentElement.appendChild(script);
    setTimeout(() => script.remove(), 0);
    element.removeAttribute(attr);
}

export async function verifyEmojiInsertion(
    el: HTMLInputElement | HTMLTextAreaElement,
    expectedValue: string,
    fallback?: () => void,
    delay = 100
): Promise<boolean> {
    await new Promise((res) => setTimeout(res, delay));

    const isCorrect = el.value === expectedValue;
    if (!isCorrect) {
        console.warn(`[Emojeezer] Value reverted. Current: '${el.value}', Expected: '${expectedValue}'`);
        if (fallback) fallback();
    } else {
        console.debug(`[Emojeezer] Emoji successfully inserted.`);
    }
    return isCorrect;
}