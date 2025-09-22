// Utility: apply CSS module class rules inline so host page styles cannot override them
export function collectCssDeclarationsForClass(className: string): Array<{ property: string; value: string; priority: string }> {
    const props: Array<{ property: string; value: string; priority: string }> = [];
    const targetToken = "." + className;
    for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRuleList | undefined;
        try {
            // Access can throw for cross-origin stylesheets
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            rules = sheet.cssRules as CSSRuleList;
        } catch {
            continue;
        }
        if (!rules) continue;
        for (const rule of Array.from(rules)) {
            if ((rule as CSSStyleRule).style && (rule as CSSStyleRule).selectorText) {
                const styleRule = rule as CSSStyleRule;
                const sel = styleRule.selectorText;
                if (!sel) continue;
                // Basic match: any selector containing the class token (unique with CSS modules)
                if (sel.includes(targetToken)) {
                    const styleDecl = styleRule.style;
                    for (let i = 0; i < styleDecl.length; i++) {
                        const prop = styleDecl.item(i);
                        if (!prop) continue;
                        if (prop.toLowerCase() === "all") continue; // avoid unexpected global resets inline
                        const val = styleDecl.getPropertyValue(prop);
                        // Always force important so host !important cannot override
                        const priority = "important";
                        props.push({ property: prop, value: val, priority });
                    }
                }
            }
        }
    }
    return props;
}

export function applyInlineFromClasses(el: HTMLElement, classNames: string[]) {
    el.style.setProperty("all", "initial");
    // apply in order; later classes can override earlier ones
    let applied = 0;
    for (const cn of classNames) {
        if (!cn) continue;
        const decls = collectCssDeclarationsForClass(cn);
        for (const { property, value, priority } of decls) {
            try {
                el.style.setProperty(property, value, priority);
                applied++;
            } catch {
                // ignore unsupported properties
            }
        }
    }
    // If nothing applied (styles not yet loaded), retry on next animation frame once
    if (applied === 0) {
        requestAnimationFrame(() => {
            for (const cn of classNames) {
                if (!cn) continue;
                const decls = collectCssDeclarationsForClass(cn);
                for (const { property, value, priority } of decls) {
                    try { el.style.setProperty(property, value, priority); } catch {}
                }
            }
        });
    }
}