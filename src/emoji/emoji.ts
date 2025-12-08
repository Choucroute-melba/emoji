import data from "emojibase-data/en/compact.json";
import shortcodes from "emojibase-data/en/shortcodes/emojibase.json";
import Fuse from "fuse.js";


export type Emoji = {
    name: string,
    unicode: string,
    keywords: string[] | undefined,
    shortcodes: string[]
}

export function getEmojiDataset() : Emoji[] {
    return data.map((e: any) => {
        let sc = shortcodes[e.hexcode]
        if(typeof sc === "string")
            sc = [sc];
        return {
            name: e.label,
            unicode: e.unicode,
            keywords: e.tags,
            shortcodes: sc
        }
    })
}

export const emojis = getEmojiDataset();
const emojiIndex = Fuse.createIndex(["shortcodes", "name", "keywords"], emojis)

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
    fuse.remove((doc: Emoji, idx: number) => fav.some(f => f.unicode.includes(doc.unicode)))
    let result = fuse.search(searchValue, {limit: maxResults - fav.length});
    const otherEmojis = result.map((r: any) => r.item);
    console.log(fav, otherEmojis);
    return fav.concat(otherEmojis);
}

export function getEmojiFromShortCode(shortcode: string): Emoji | undefined {
    return emojis.find((e) => e.shortcodes.includes(shortcode));
}

export function getEmojiFromUnicode(unicode: string): Emoji | undefined {
    return emojis.find((e) => e.unicode === unicode);
}
