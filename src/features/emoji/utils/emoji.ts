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

export function searchEmoji(searchValue: string) :Emoji[] {
    const fuse = new Fuse(emojis, {
        threshold: 0.1,
        keys: ["shortcodes", "name", "keywords"]
    }, emojiIndex);
    let result = fuse.search(searchValue);
    return result.map((r: any) => r.item);
}
