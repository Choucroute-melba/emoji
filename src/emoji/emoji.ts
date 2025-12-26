import Fuse from "fuse.js";
import {Emoji, Locale, fetchEmojis} from "emojibase"
import browser from "webextension-polyfill";

// Map<locale: string, dataset: Emoji[]>
const cachedDataStets = new Map<Locale, Emoji[]>();
const cachedDataStetsTimeStamps = new Map<Locale, number>();

// Load cached datasets from browser storage
const storedDatasets = await browser.storage.local.get(null);
for(const key in storedDatasets) {
    if(key.startsWith("emojiDataset.")) {
        const locale = key.replace("emojiDataset.", "") as Locale;
        const data = storedDatasets[key] as Emoji[];
        cachedDataStets.set(locale, data);
        const timestampKey = "emojiDataset." + locale + ".timestamp";
        const timestamp = storedDatasets[timestampKey] as number | undefined;
        if(timestamp)
            cachedDataStetsTimeStamps.set(locale, Date.now());
    }
}
// If there is no English dataset cached, fetch it immediately
if(!cachedDataStets.has("en")) {
    console.log("loading default emoji dataset...");
    await getEmojiDataset("en");
    console.log("default emoji dataset (en) loaded.");
}

/**
 * Get emoji dataset for a specific locale, using cached / stored data if available and not expired.
 * @param locale
 */
export async function getEmojiDataset(locale: Locale) : Promise<Emoji[]> {
    const cacheExpirationMs = 1000 * 60 * 60 * 24 * 7; // 7 days
    let cacheExpired = false
    if(cachedDataStets.has(locale)) {
        if(cachedDataStetsTimeStamps.get(locale) && Date.now() - cachedDataStetsTimeStamps.get(locale)! < cacheExpirationMs)
            return cachedDataStets.get(locale)!;
        else
            cacheExpired = true;
    }
    // if locale not cached or expired, fetch emoji data
    const emojiPromise = fetchEmojis(locale).then(data => {
        cachedDataStets.set(locale, data);
        cachedDataStetsTimeStamps.set(locale, Date.now());
        browser.storage.local.set({["emojiDataset." + locale]: data})
            .catch(e => console.error(e))
            .then(() => {
                browser.storage.local.set({["emojiDataset." + locale + ".timestamp"]: Date.now()});
            });
        return data;
    })
    if(cacheExpired) // don't make user wait for fetch if cache expired
        return cachedDataStets.get(locale)!;
    return emojiPromise;
}


const emojis = await fetchEmojis("en") // TODO : Change locale
const emojiIndex = Fuse.createIndex(["shortcodes", "name", "keywords"], emojis) // TODO : Change locale

export function searchEmoji(searchValue: string, favorites: Emoji[], maxResults: number = 10) :Emoji[] {
    const favIndex = Fuse.createIndex(["shortcodes", "name", "keywords"], favorites)
    const favFuse = new Fuse(favorites, {
        threshold: 0.1,
        keys: ["shortcodes", "name", "keywords"]
    }, favIndex);
    const favResults = favFuse.search(searchValue, {limit: maxResults});
    let fav = favResults.map((r: any) => r.item);

    const fuse = new Fuse(emojis, {
        threshold: 0.1,
        keys: ["shortcodes", "name", "keywords"],
        shouldSort: true,
    }, emojiIndex);
    fuse.remove((doc: Emoji, idx: number) => fav.some(f => f.unicode.includes(doc.emoji)))
    let result = fuse.search(searchValue, {limit: maxResults - fav.length});
    const otherEmojis = result.map((r: any) => r.item);
    console.log(fav, otherEmojis);
    return fav.concat(otherEmojis);
}

export function getEmojiFromShortCode(shortcode: string): Emoji | undefined {
    return emojis.find((e) => {
        if(!e.shortcodes) return false;
        return e.shortcodes.includes(shortcode)
    });
}

export function getEmojiFromUnicode(unicode: string): Emoji | undefined {
    return emojis.find((e) => e.emoji === unicode);
}
