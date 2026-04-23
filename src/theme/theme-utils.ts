import browser, {Manifest} from "webextension-polyfill";
import ThemeType = Manifest.ThemeType;
import ThemeTypeColorsType = Manifest.ThemeTypeColorsType;
import {colord} from "colord";

//region NEW MERGE MECHANISM
// @ts-ignore
import {process} from "cssomtools";
// {nestedSelector: string, styles: {propName: string, propValue: string}}
type RuleMap = Map<string, CSSStyleRule | CSSNestedDeclarations>;

function normalizePattern(pattern: RegExp | string): RegExp {
    return typeof pattern === "string" ? new RegExp(pattern) : pattern;
}

function collectRules(
    sheet: CSSStyleSheet,
    ignored: RegExp,
    map: RuleMap,
    nestedContext: string[] = []
) {
    process(sheet, (rule: CSSRule) => {
        let nestedSelector: string[] = []
        if(rule instanceof CSSStyleRule) {
            nestedSelector = [rule.selectorText!]
        }
        else if(rule instanceof CSSMediaRule) {
            nestedSelector = [`@media ${rule.conditionText}`]
        }
        if(rule.parentRule) {
            let parentRule: CSSRule | null = rule.parentRule;
            while (parentRule) {
                if(parentRule instanceof CSSMediaRule)
                    nestedSelector = [`@media ${parentRule.conditionText}`, ...nestedSelector]
                else
                    nestedSelector = [(parentRule as CSSStyleRule).selectorText!, ...nestedSelector ]

                parentRule = parentRule.parentRule
            }
        }
/*        console.log(nestedSelector.join("|"))
        console.log(rule)*/


        if(rule instanceof CSSStyleRule && rule.style.length > 0) {
            if(map.has(nestedSelector.join("|"))) {
                const rule1 = map.get(nestedSelector.join("|"))!;
                mergeRules(rule1, rule)
                map.set(nestedSelector.join("|"), rule1)
            }
            else {
                map.set(nestedSelector.join("|"), rule)
            }
        }
        if(rule instanceof CSSNestedDeclarations) {
            if(map.has(nestedSelector.join("|"))) {
                const rule1 = map.get(nestedSelector.join("|"))!;
                mergeRules(rule1, rule)
                map.set(nestedSelector.join("|"), rule1)
            }
            else {
                map.set(nestedSelector.join("|"), rule as any)
            }
        }
    });

}

function mergeRules(rule1: CSSStyleRule | CSSNestedDeclarations, rule2: CSSStyleRule | CSSNestedDeclarations) {
    for(const propName of rule2.style) {
        rule1.style.setProperty(propName, rule2.style.getPropertyValue(propName));
    }
}

function rebuildStyleSheet(map: RuleMap): CSSStyleSheet {
    const sheet = new CSSStyleSheet();

    for (const [key, rule] of map.entries()) {
        const keys = key.split("|");
        let cssText = ""
        for(let i = 0; i < keys.length; i++) {
            const nestedKey = keys[i];
            if(i === keys.length - 1) { // last key
                if(rule instanceof CSSStyleRule) {
                    cssText += rule.cssText;
                }
                else if(rule instanceof CSSNestedDeclarations) {
                    cssText += `${nestedKey} {\n` + rule.cssText;
                }
            }
            else
                cssText += `${nestedKey} {\n`;
        }
        sheet.insertRule(cssText);
    }

    return sheet;
}

/**
 * Merge sheet2 into sheet1 by overriding matching selectors
 */
export function mergeStyleSheets(
    sheet1: CSSStyleSheet,
    sheet2: CSSStyleSheet,
    ignoredPattern: RegExp | string
): CSSStyleSheet {
    const ignored = normalizePattern(ignoredPattern);

    const map: RuleMap = new Map();

    // 1. collect sheet1 rules
    collectRules(sheet1, ignored, map);

    // 2. override / add from sheet2
    collectRules(sheet2, ignored, map);

    // 3. rebuild final stylesheet
    return rebuildStyleSheet(map);
}

export function styleSheetToText(sheet: CSSStyleSheet) {
    const rules = Array.from(sheet.cssRules);
    return rules.map(rule => rule.cssText).join("\n\n");
}
//endregion


function pickColor(c: ThemeTypeColorsType | undefined, ...keys: (keyof ThemeTypeColorsType)[]): string | undefined {
    if (!c) return undefined;
    for (const key of keys) {
        const value = c[key];
        if (typeof value === "string" && value.trim().length > 0) {
            console.log(`${key}: %c${value} \t\t%c     %c`, ``, `background-color: ${value};`, "background-color: inherit; color: inherit;")
            return value;
        }
    }
    return undefined;
}

const colorTokens = [
    "--ejz-accent",
    "--ejz-accent-hover",
    "--ejz-accent-active",
    "--ejz-background",
    "--ejz-surface",
    "--ejz-surfaceHover",
    "--ejz-backgroundHover",
    "--ejz-onSurface",
    "--ejz-onBackground",
    "--ejz-onBackgroundVariant",
    "--ejz-onSurfaceVariant",
    "--ejz-dangerSurface",
    "--ejz-dangerOnSurface",
]
/**
 * return CSS variables set to the current firefox's theme.
 * Defaults are defined in base.css
 * Meant to run in content scripts.
 * @param selector - the scope of the variables.
 */
export async function getCssTheme(selector: string): Promise<string> {
    const assignedColors = new Map<string, { light: string, dark: string } | undefined>()
    const theme = await browser.runtime.sendMessage({action: "getCurrentTheme"}) as ThemeType
    const c = theme.colors
    const preferredSheme = theme.properties?.color_scheme ||
        window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    console.log(theme)
    let ruleText = `${selector} {\n`
    let pickedColor: string | undefined = undefined
    let assignedColor: { light: string, dark: string } | undefined
    for (const token of colorTokens) {
        let color: { light: string, dark: string } | undefined = undefined;
        switch (token) {
            case "--ejz-accent":
                pickedColor = pickColor(c, "icons_attention", "icons")
                color = pickedColor ? { light: pickedColor, dark: pickedColor } : undefined
                break;
            case "--ejz-accent-hover":
                assignedColor = assignedColors.get("--ejz-accent")
                if(assignedColor) {
                    color = {
                        dark: colord(assignedColor.dark).lighten(0.1).toHex(),
                        light: colord(assignedColor.light).darken(0.1).toHex()
                    }
                }
                break;
            case "--ejz-accent-active":
                assignedColor = assignedColors.get("--ejz-accent")
                if(assignedColor) {
                    color = {
                        dark: colord(assignedColor.dark).lighten(0.2).toHex(),
                        light: colord(assignedColor.light).darken(0.2).toHex()
                    }
                }
                break
            case "--ejz-background":
                pickedColor = pickColor(c, "frame", "frame_inactive")
                color = pickedColor ? {dark: pickedColor, light: pickedColor} : undefined
                break;
            case "--ejz-surface":
                pickedColor = pickColor(c, "popup")
                color = pickedColor ? {dark: pickedColor, light: pickedColor} : undefined
                break;
            case "--ejz-surfaceHover":
                pickedColor = pickColor(c, "popup")
                color = pickedColor ? {
                    dark: colord(pickedColor).lighten(0.1).toHex(),
                    light: colord(pickedColor).darken(0.1).toHex()
                } : undefined
                break;
            case "--ejz-backgroundHover":
                pickedColor = pickColor(c, "frame", "frame_inactive")
                color = pickedColor ? {
                    dark: colord(pickedColor).lighten(0.1).toHex(),
                    light: colord(pickedColor).darken(0.1).toHex()
                } : undefined
                break;
            case "--ejz-onSurface":
                pickedColor = pickColor(c, "popup_text")
                color = pickedColor ? {dark: pickedColor, light: pickedColor} : undefined
                break;
            case "--ejz-onBackground":
                pickedColor = pickColor(c, "bookmark_text", "icons")
                color = pickedColor ? {dark: pickedColor, light: pickedColor} : undefined
                break;
            case "--ejz-onBackgroundVariant":
                assignedColor = assignedColors.get("--ejz-onBackground")
                if(assignedColor)
                    color = {
                        dark: colord(assignedColor.dark).darken(0.3).toHex(),
                        light: colord(assignedColor.light).lighten(0.3).toHex()
                    }

                break;
            case "--ejz-onSurfaceVariant":
                assignedColor = assignedColors.get("--ejz-onSurface")
                if(assignedColor)
                    color = {
                        dark: colord(assignedColor.dark).darken(0.5).toHex(),
                        light: colord(assignedColor.light).lighten(0.5).toHex()
                    }
                break;

        }
        assignedColors.set(token, color)
    }
    // then generate variables from the firefox theme
    if(c) {
        const keys = Object.keys(c) as (keyof ThemeTypeColorsType)[]
        for (const key of keys) {
            let varName = `--th-${key.replaceAll('_', '-').toLowerCase()}`
            if (c[key] && typeof c[key] === "string" && c[key] !== "")
                assignedColors.set(varName, {light: c[key], dark: c[key]})
        }
    }

    // finally generate the rule text
    console.log(ruleText)
    assignedColors.forEach((value, key) => {
        if(value) {
            ruleText += `    ${key}: light-dark(${value.light}, ${value.dark});\n`
            console.log(`${key}: light-dark(${value.light}, ${value.dark}); \t\t %c     %c / %c     %c`,
                `background-color: ${value.light};`, "background-color: inherit; color: inherit;",
                `background-color: ${value.dark};`, "background-color: inherit; color: inherit;")
        }
    })
    ruleText += "}\n"
    return ruleText;
}

export async function applyTheme() {
    const css = await getCssTheme(":root")
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    console.log("apply theme", sheet)
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
}

export async function getRecommendedThemeMode() {
    const theme = await browser.runtime.sendMessage({action: "getCurrentTheme"}) as ThemeType
    const c = theme.colors
    const preferredSheme = theme.properties?.color_scheme
    if(preferredSheme && preferredSheme !== "auto")
        return preferredSheme;
    else if (!c)
        return "system"
    else {
        const foregroundColors = ["popup_text", "icons", "icons_attention"]
        const backgroundColors = ["frame", "frame_inactive", "popup" ]
        let darkSchemeScore = 0;
        let lightSchemeScore = 0;
        for(const key of foregroundColors) {
            // @ts-ignore
            const color = c[key]
            if(color) {
                console.log(`FOREG ${key}: ${color} \t\t %c     %c ${colord(color).isDark() ? "dark" : "light"}`,
                    `background-color: ${color};`, "background-color: inherit; color: inherit;")
                if(colord(color).isDark())
                    lightSchemeScore++;
                else
                    darkSchemeScore++;
            }
        }
        for(const key of backgroundColors) {
            //@ts-ignore
            const color = c[key]
            if(color) {
                console.log(`BACKG ${key}: ${color} \t\t %c     %c ${colord(color).isDark() ? "dark" : "light"}`,
                    `background-color: ${color};`, "background-color: inherit; color: inherit;")
                if(colord(color).isDark())
                    darkSchemeScore++;
                else
                    lightSchemeScore++;
            }
        }
        console.log(`dark : ${darkSchemeScore}; light : ${lightSchemeScore};`)
        return darkSchemeScore > lightSchemeScore ? "dark" : "light"
    }
}