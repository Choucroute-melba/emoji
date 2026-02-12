import browser, {Manifest} from "webextension-polyfill";
import ThemeType = Manifest.ThemeType;
import ThemeTypeColorsType = Manifest.ThemeTypeColorsType;
import {colord} from "colord";

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
    // const mergedSheet = new CSSStyleSheet();

    const mergeRule = (rule1: CSSStyleRule | CSSMediaRule, rule2: CSSStyleRule | CSSMediaRule, rulePath: string[] = [])=> {
        if(rule2 instanceof CSSMediaRule) {
            if(rule1 instanceof CSSMediaRule && rule1.conditionText === rule2.conditionText) {
                for(const rule of rule2.cssRules) {
                    rulePath.push(rule2.conditionText);
                    mergeRule(rule1, rule as CSSStyleRule | CSSMediaRule, rulePath);
                }
                return
            }
        }

        rulePath.push((rule2 as CSSStyleRule).selectorText);
        let r1 = getRuleForPath(rule1.cssRules, rulePath.slice(1));
        if(r1) { // If we find a corresponding style rule in rule1, we merge the properties of rule2 into it
            for(const prop2 of(rule2 as CSSStyleRule).style) {
                const prop1Index = findPropIndex(r1 as CSSStyleRule, prop2);
                if(prop1Index === -1 && !prop2.startsWith("--")) // if prop2 doesn't exist in r1 and is not a custom CSS variable, we add it without priority
                    (r1 as CSSStyleRule).style.setProperty(prop2, (rule2 as CSSStyleRule).style.getPropertyValue(prop2));
                else
                    (r1 as CSSStyleRule).style.setProperty(prop2, (rule2 as CSSStyleRule).style.getPropertyValue(prop2), (rule2 as CSSStyleRule).style.getPropertyPriority(prop2));
            }
            return;
        }
        else { // We try to find the nearest common media rule between rule1 and rule2, and insert rule2 there. If we don't find any, we insert it at the root of mergedSheet
            while (!r1 && rulePath.length > 0) {
                rulePath.pop();
                r1 = getRuleForPath(rule1.cssRules, rulePath);
            }
            if(r1) { // common CSSMediaRule ancestor found, adding rule to this ancestor
                (r1 as CSSMediaRule).insertRule(ruleToString(rule2 as CSSStyleRule, true, (r1 as CSSMediaRule).conditionText));
            }
            else {// no common media rule, create one at the root of mergedSheet
                sheet1.insertRule(ruleToString(rule2 as CSSStyleRule))
            }
        }
    }

    const mergeRules = (rules1: CSSRuleList, rules2: CSSRuleList, mediaCondition: string[] = [])=>
    {
        for(const rule2 of rules2) {
            let ruleID
            if(rule2 instanceof CSSMediaRule) {
                ruleID = rule2.conditionText;
            }
            else ruleID = (rule2 as CSSStyleRule).selectorText.replace(phantomSelector, "");
            const r1Index = findRuleIndex(rules1, ruleID)

            if(r1Index === -1) // insert rule2 at root of mergedSheet
                sheet1.insertRule(ruleToString(rule2 as CSSStyleRule, true, mediaCondition.join(" and ")))
            else
                mergeRule(rules1[r1Index] as CSSStyleRule | CSSMediaRule, rule2 as CSSStyleRule | CSSMediaRule, mediaCondition)
        }
    }

    mergeRules(sheet1.cssRules, sheet2.cssRules);

    const cleanUnwantedProperties= (rules: CSSRuleList, fromMedia: boolean = false) => {
        for (const r of rules) {
            let rule = r as CSSStyleRule | CSSMediaRule;
            if((rule as CSSMediaRule).media) {
                cleanUnwantedProperties((rule as CSSMediaRule).cssRules, true)
                merged += rule.cssText + "\n";
            }
            else {
                // remove every properties that modifies d, cx, cy, rx, ry, r
                for (const prop of ["d", "cx", "cy", "rx", "ry", "r"]) {
                    (rule as CSSStyleRule).style.removeProperty(prop);
                }
            }
            if (!fromMedia && (rule as CSSMediaRule).media === undefined) {
                merged += rule.cssText + "\n";
            }
        }
    }

    cleanUnwantedProperties(sheet1.cssRules);

    return merged;
}

function findRuleIndex(rules: CSSRuleList, selector: string) {
    for (let i = 0; i < rules.length; i++) {
        const rule = rules[i] as CSSStyleRule | CSSMediaRule;
        if ((rule as CSSStyleRule).selectorText === selector || (rule as CSSMediaRule).conditionText === selector)
            return i;
    }
    return -1;
}

function findNestedMediaRuleIndex(rules: CSSRuleList, conditions: string[], previousIndex?: number) {
    if(conditions.length === 0 && previousIndex !== undefined && previousIndex !== -1)
        return previousIndex || 0;
    else if(conditions.length === 0)
        return -1
    conditions.forEach((condition) => {
        const index = findRuleIndex(rules, condition);
        if(index !== -1) {
            return findNestedMediaRuleIndex((rules[index] as CSSMediaRule).cssRules, conditions.slice(1), previousIndex = index);
        }
    })
}

function getRuleForPath(rules: CSSRuleList, path: string[]) {
    for(const rule of rules) {
        if((rule as CSSMediaRule).media) {
            if((rule as CSSMediaRule).conditionText === path[0]) {
                if(path.length === 1) return rule as CSSMediaRule;
                return getRuleForPath((rule as CSSMediaRule).cssRules, path.slice(1));
            }
        }
        else if((rule as CSSStyleRule).selectorText === path[0]) {
            return rule as CSSStyleRule;
        }
    }
}

function ruleToString(rule: CSSStyleRule | CSSMediaRule, recursive: boolean = true, baseRule?: string) {
    if(recursive) {
        while (rule.parentRule && (rule.parentRule as CSSMediaRule).conditionText !== baseRule) {
            rule = rule.parentRule as CSSMediaRule;
        }
        return rule.cssText;
    }
    else return rule.cssText;
}

function findPropIndex(rule: CSSStyleRule, prop: string) {
    for (let i = 0; i < rule.style.length; i++) {
        if (rule.style[i] === prop) return i;
    }
    return -1;
}