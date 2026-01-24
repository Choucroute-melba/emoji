import DataManager from "./dataManager";

export function getDomainName(url: string) {
    let domain = ""
    try {
        domain = new URL(url).host
    } catch (e) {
        domain = url
    }
    if(domain === "")
        domain = url
    return domain
}

export function parseStorageKey(key: string | null) {
    let parsedKey: string[] | null = []
    if(key == null) {
        parsedKey = null
    }
    else {
        let k = ""
        for (let i = 0; i < key.length; i++ ) {
            const c = key[i];
            if (c == ".") {
                if(k === "") continue;
                parsedKey.push(k)
                k = ""
            }
            else if (c == "[") {
                if(k !== "") parsedKey.push(k);
                k = ""
                const end = key.indexOf("]", i);
                if (end === -1) {
                    console.error(`Error reading setting ${key}: missing closing bracket ']'`);
                    return undefined;
                }
                parsedKey.push(k + key.substring(i + 1, end))
                i = end
                if(i + 1 < key.length && key[i+1] == ".")
                    i++
            }
            else
                k += c
        }
        if(k !== "")
            parsedKey.push(k)
    }
    return parsedKey;
}
export function getStorageKey(prefix: string, prop: symbol | string): string {
    let key = prefix
    if (typeof prop === "string" && prop !== "") {
        if(prop.includes(".") || prop.includes("[") ||
            prop.includes("]") || prop.includes(" ") ||
            prop.includes("'") || prop.includes('"') || prop.includes(":") ||
            prop.includes("/")
        )
            key += "[" + prop + "]"
        else
            key += "." + prop
    } else {
        key += "[" + prop.toString() + "]"
    }
    return key
}