/**
 * Merge css1 into css2.
 * Properties from css2 override properties from css1 if the selector is the same without the phantomSelector.
 * the returned CSS will contain the phantomSelector.
 * @param css1
 * @param css2
 * @param phantomSelector
 */
export function mergeCss(css1: string, css2: string, phantomSelector: string | RegExp): string {
    let merged = ""
    const sheet1 = new CSSStyleSheet();
    sheet1.replaceSync(css1);
    const sheet2 = new CSSStyleSheet();
    sheet2.replaceSync(css2);
    const mergedSheet = new CSSStyleSheet();


    for (const rule1 of sheet1.cssRules) {
        const r1 = rule1 as CSSStyleRule;
        const correspondingIndex = findRuleIndex(sheet2, r1.selectorText.replace(phantomSelector, ""));
        if (correspondingIndex !== -1) {
            const r2 = sheet2.cssRules[correspondingIndex] as CSSStyleRule;
            console.log(r1.selectorText, "<-", r2.selectorText)
            for(const prop2 of r2.style) {
                const prop1Index = findPropIndex(r1, prop2);
                if(prop1Index === -1)
                    r1.style.setProperty(prop2, r2.style.getPropertyValue(prop2));
                else
                    r1.style.setProperty(prop2, r2.style.getPropertyValue(prop2), r1.style.getPropertyPriority(prop2));
            }
            sheet2.deleteRule(correspondingIndex);
        }
        mergedSheet.insertRule(r1.cssText)
    }
    for (const rule2 of sheet2.cssRules) {
        mergedSheet.insertRule(rule2.cssText)
    }

    for (const r of mergedSheet.cssRules) {
        const rule = r as CSSStyleRule;
        // remove every properties that modifies d, cx, cy, rx, ry, r
        for (const prop of ["d", "cx", "cy", "rx", "ry", "r"]) {
            rule.style.removeProperty(prop);
        }

        merged += rule.cssText + "\n";
    }

    return merged;
}

function findRuleIndex(sheet: CSSStyleSheet, selector: string) {
    for (let i = 0; i < sheet.cssRules.length; i++) {
        const rule = sheet.cssRules[i] as CSSStyleRule;
        if (rule.selectorText === selector) return i;
    }
    return -1;
}

function findPropIndex(rule: CSSStyleRule, prop: string) {
    for (let i = 0; i < rule.style.length; i++) {
        if (rule.style[i] === prop) return i;
    }
    return -1;
}