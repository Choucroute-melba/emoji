/**
    this file is meant to run in the background script
 */
import Fuse, {FuseIndex} from "fuse.js";
import {Emoji, Locale, fetchEmojis} from "emojibase"
import browser from "webextension-polyfill";
import {SearchOption} from "./types";
import DataManager from "../background/dataManager";

type FuseEmoji = {
    emoji: string;
    label: string;
    shortcodes: string[];
    tags: string[];
}
function emojibaseToFuse(e: Emoji): FuseEmoji {
    return {
        emoji: e.emoji,
        label: e.label,
        shortcodes: e.shortcodes || [],
        tags: e.tags || []
    }
}
function fuseToEmojiBase(e: FuseEmoji, dataset?: Emoji[]): Emoji {
    if(!dataset)
        dataset = cachedDataStets.get("en")!
    const i =  dataset.findIndex((em) => em.emoji === e.emoji);
    if(i === -1) throw new Error("Emoji not found in dataset: " + e.emoji);
    return dataset[i];
}
function createFuseIndex(dataset: Emoji[] | FuseEmoji[]): FuseIndex<FuseEmoji> {
    if(typeof dataset !== "object" || dataset.length === undefined) throw new Error("Invalid dataset provided");
    if(dataset.length === 0) return Fuse.createIndex([], []);
    return Fuse.createIndex(
        ["tags", "label", "shortcodes"],
        ((dataset[0] as Emoji).hexcode !== undefined) ?
            (dataset as Emoji[]).map(emojibaseToFuse) :
            dataset as FuseEmoji[])
}
function createFuseSearch(dataset: FuseEmoji[], index: FuseIndex<FuseEmoji>) {
    return new Fuse(dataset, {
        threshold: 0.3,
        keys: [
            {name: "label", weight: 0.3},
            {name: "shortcodes", weight: 0.5},
            {name: "tags", weight: 0.2}
        ],
        shouldSort: true,
        ignoreLocation: true,
    }, index);
}

const cachedDataStets = new Map<Locale, Emoji[]>();
const cachedIndex = new Map<Locale, FuseIndex<FuseEmoji>>();
const cachedDataStetsTimeStamps = new Map<Locale, number>();

// Load cached datasets from browser storage
const storedDatasets = await browser.storage.local.get(null);
for(const key in storedDatasets) {
    if(key.startsWith("emojiDataset.")) {
        if(!key.includes(".timestamp")) {
            const locale = key.replace("emojiDataset.", "") as Locale;
            const data = storedDatasets[key] as Emoji[];
            cachedDataStets.set(locale, data);
            console.log(`locale ${locale} loaded from storage`);
            const timestampKey = "emojiDataset." + locale + ".timestamp";
            const timestamp = storedDatasets[timestampKey] as number | undefined;
            if(timestamp)
                cachedDataStetsTimeStamps.set(locale, timestamp);
            else
                cachedDataStetsTimeStamps.set(locale, Date.now());
            const emojiIndex = createFuseIndex(data);
            cachedIndex.set(locale, emojiIndex);
        }
    }
}
// If there is no English dataset cached, fetch it immediately
if(!cachedDataStets.has("en")) {
    console.log("loading default emoji dataset...");
    const emojis = await loadEmojiDataset("en");
    console.log("creating index...")
    const emojiIndex = createFuseIndex(emojis);
    cachedIndex.set("en", emojiIndex);
    console.log("default emoji dataset (en) loaded.");
}

/**
 * Get emoji dataset for a specific locale, using cached / stored data if available and not expired.
 * @param locale
 * @return {Emoji[]} - return null if the locale is not found.
 */
export function getEmojiDataset(locale: Locale) : Emoji[] | null {
    const cacheExpirationMs = 1000 * 60 * 60 * 24 * 7; // 7 days
    let cacheExpired = false
    if(cachedDataStets.has(locale)) {
        if(cachedDataStetsTimeStamps.get(locale) && Date.now() - cachedDataStetsTimeStamps.get(locale)! < cacheExpirationMs)
            return cachedDataStets.get(locale)!;
        else
            cacheExpired = true;
    }

    if(cacheExpired) {
        loadEmojiDataset(locale) // renew the cache
        return cachedDataStets.get(locale)!; // don't make the user wait for the fetch
    }
    // if the dataset is not found, return null
    return null;
}

/**
 * will fetch the emoji dataset for a specific locale and store it in the cache.
 * @param locale
 */
export async function loadEmojiDataset(locale: Locale) {
    console.log("Fetching emoji dataset for locale " + locale + "...");
    return fetchEmojis(locale, {
        compact: false,
        flat: false,
        shortcodes: ['cldr', 'emojibase']
    }).then(data => {
        cachedDataStets.set(locale, data);
        cachedDataStetsTimeStamps.set(locale, Date.now());
        const index = createFuseIndex(data);
        cachedIndex.set(locale, index);
        browser.storage.local.set({["emojiDataset." + locale]: data})
            .catch(e => console.error(e))
            .then(() => {
                browser.storage.local.set({["emojiDataset." + locale + ".timestamp"]: Date.now()})
                    .then(() => console.log("Emoji dataset for locale " + locale + " stored in cache."));
            });
        return data;
    })
}

export function searchEmoji(searchValue: string, dm: DataManager, options?: SearchOption) : Emoji[] {
    if (!options) {
        options = {};
    }
    if(options.limit === undefined) options.limit = 10;
    if(options.useFavorites === undefined) options.useFavorites = true;
    if(options.useMostUsed === undefined) {
        options.useMostUsed = dm.settings.allowEmojiSuggestions
    }
    if(options.usePreferredGender === undefined) options.usePreferredGender = true;
    if(options.usePreferredSkinTone === undefined) options.usePreferredSkinTone = true;


    const maxResults = options.limit;

    const favorites = options.useFavorites ? dm.favoriteEmojis.map(e => getEmojiFromUnicode(e, dm.settings.emojiLocale)!).map(emojibaseToFuse) : [];
    const mostUsed = options.useMostUsed ? getMostUsedEmoji(dm, maxResults).emojis.map(emojibaseToFuse) : [];
    const emojis = getEmojiDataset(dm.settings.emojiLocale);
    if(!emojis) throw new Error("Emoji dataset not loaded yet");

    let favResults: FuseEmoji[] = [];
    let mostUsedResults: FuseEmoji[];

    if(searchValue !== "") {
        const favIndex = createFuseIndex(favorites);
        const favFuse = createFuseSearch(favorites, favIndex);
        favResults = favFuse.search(searchValue, {limit: maxResults})
            .map((r: any) => r.item);

        const mostUsedIndex = createFuseIndex(mostUsed);
        const mostUsedFuse = createFuseSearch(mostUsed, mostUsedIndex);
        mostUsedResults = mostUsedFuse.search(searchValue, {limit: maxResults + favResults.length})
            .map((r: any) => r.item);
    }
    else {
        favResults = favorites.slice(0, maxResults);
        mostUsedResults = mostUsed.slice(0, maxResults);
    }

    console.log("Fav results:", favResults);
    console.log("Most used results:", mostUsedResults);

    const mixedResults : FuseEmoji[] = []
    // first emojis that are used a lot and favorites :
    mostUsedResults.forEach(e => {
        if(favResults.some(f => e.emoji === f.emoji) && mixedResults.length < maxResults) {
            mixedResults.push(e)
        }
    })

    // second the remaining favorites
    if(mixedResults.length < maxResults) {
        const remainingFavs = favResults.filter(e => !mixedResults.some(f => e.emoji === f.emoji))
        mixedResults.push(...remainingFavs)
    }

    // third the remaining most used emojis
    if(mixedResults.length < maxResults) {
        const remainingMostUsed = mostUsedResults.filter(e => !mixedResults.some(f => e.emoji === f.emoji))
        mixedResults.push(...remainingMostUsed)
    }

    if(mixedResults.length >= maxResults) {
        return mixedResults.slice(0, maxResults).map(e => fuseToEmojiBase(e, emojis));
    }
    if(searchValue !== "") {
        // last, the search results from the full dataset
        const emojiIndex = cachedIndex.get(dm.settings.emojiLocale)!;
        const fuse = createFuseSearch(emojis.map(emojibaseToFuse), emojiIndex)
        let result = fuse.search(searchValue, {limit: maxResults});
        const otherEmojis = result.map((r: any) => r.item)
            .filter((doc: FuseEmoji) => !mixedResults.some(f => f.emoji === doc.emoji))
            .slice(0, maxResults - mixedResults.length);
        console.log(mixedResults, otherEmojis);
        return mixedResults.concat(otherEmojis).map(e => fuseToEmojiBase(e, emojis));
    }
    else { // no search value, return favs and most used only
        console.log("No search value, returning favs and most used only");
        console.log(mixedResults);
        return mixedResults.map(e => fuseToEmojiBase(e, emojis));
    }
}

export function getEmojiFromShortCode(shortcode: string, locale: Locale): Emoji | undefined {
    const emojis = getEmojiDataset(locale);
    if(!emojis) throw new Error("Emoji dataset for " + locale + " not loaded yet");
    return emojis.find((e) => {
        if(!e.shortcodes) return false;
        return e.shortcodes.includes(shortcode)
    });
}

export function getEmojiFromUnicode(unicode: string, locale: Locale): Emoji | undefined {
    const emojis = getEmojiDataset(locale)
    if(!emojis) throw new Error("Emoji dataset for " + locale + " not loaded yet");
    return emojis.find((e) => e.emoji === unicode);
}

/**
 *
 * @param dm - an instance of DataManager
 * @param items - max number of items to return
 * @returns {emojis: Emoji[], scores: Map<string, number>} an object where emojis is the sorted list of Emoji objects
 * and scores a map from Unicode to the emoji score
 */
export function getMostUsedEmoji(dm: DataManager, items: number = 10): { emojis: Emoji[], scores: Map<string, number>} {
    const emojis = dm.emojiUsage
    const results: Emoji[] = []
    let scores = new Map<string, number>()
    const emojisList = Object.keys(emojis)
    for (const emojiName of emojisList) {
        const emojiData = emojis[emojiName]
        const score = calculateEmojiScore(emojiData)
        scores.set(emojiName, score)
    }
    let mostUsedEmojis = Array.from(scores.entries()).sort((a, b) => b[1] - a[1])
    if(items != -1)
        mostUsedEmojis = mostUsedEmojis.slice(0, items)

    for(const e of mostUsedEmojis) {
        const emojiData = getEmojiFromUnicode(e[0], dm.settings.emojiLocale)!
        results.push(emojiData);
    }
    return {emojis: results, scores};
}

export function calculateEmojiSignals({count, firstUsed, lastUsed}: { count: number, firstUsed: number, lastUsed: number}) {
    let frequency = ((lastUsed - firstUsed)) / count
    let recency = 1 / ((Date.now() - lastUsed) / (1000 * 60 * 60 * 24))
    console.log(`Count: ${count}, DeltaTime: ${lastUsed - firstUsed}\nFrequency: ${frequency}, Recency: ${recency}`)
    return {frequency, recency}
}

export function calculateEmojiScore({count, firstUsed, lastUsed}: { count: number, firstUsed: number, lastUsed: number}): number {
    const {frequency, recency} = calculateEmojiSignals({count, firstUsed, lastUsed})
    return frequency * recency
}