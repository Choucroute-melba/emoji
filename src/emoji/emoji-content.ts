import {Emoji} from "emojibase"
import browser from "webextension-polyfill";
import {Message, ReadDataMessage} from "../background/messsaging";
import {SearchOption} from "./types";
import * as EmojiUtils from "./emoji"
import {Locale} from "@src/background/types";


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

export async function fetchGroups(onlineFirst: boolean = true): Promise<Record<number, string>> {
    const locale = await browser.runtime.sendMessage<ReadDataMessage>({action: "readData", data: {key: "settings.emojiLocale"}}) as Locale;
    let groups = EmojiUtils.getGroupsDataset(locale)
    if(groups)
        return groups
    return await browser.runtime.sendMessage<Message>({action: "fetchGroups"}) as Record<number, string>;
}

export async function getEmojisForGroup(group: number, onlineFirst: boolean = true) {
    const locale = await browser.runtime.sendMessage({action: "readData", data: {key: "settings.emojiLocale"}}) as Locale;
    let emojis = EmojiUtils.getEmojisForGroup(group, locale)
    if(emojis)
        return emojis
    return await browser.runtime.sendMessage<Message>({action: "getEmojisForGroup", data: {group}}) as Emoji[];
}