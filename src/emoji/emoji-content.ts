import {Emoji} from "emojibase"
import browser from "webextension-polyfill";
import {Message} from "../background/messsaging";
import {SearchOption} from "./types";


export async function searchEmoji(query: string, options?: SearchOption) {
    return await browser.runtime.sendMessage<Message>({action: "searchEmojis", data: {query: query, options}}) as Emoji[];
}

export async function getEmojiFromShortCode(sc: string) {
    return await browser.runtime.sendMessage<Message>({action: "getEmojiFromShortCode", data: {sc}}) as Emoji | null;
}

export async function getEmojiFromUnicode(u: string) {
    return await browser.runtime.sendMessage<Message>({action: "getEmojiFromUnicode", data: {u}}) as Emoji | null;
}

export async function getMostUsedEmoji() {
    return await browser.runtime.sendMessage<Message>({action: "getMostUsedEmoji"}) as { emojis: Emoji[], scores: Map<string, number> };
}