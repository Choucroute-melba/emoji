import {GlobalSettings, SiteSettings} from "./dataManager";
import {SearchOption} from "../emoji/types";

export type Message = GetSiteSettingsMessage | GetEffectiveModeOnSiteMessage | EnableForSiteMessage |
    EnableMessage | EnableFreeSelectorMessage | EnableFreeSelectorForSiteMessage | AddSiteSettingsListenerMessage |
    SetKeepFreeSelectorEnabledMessage | ReadDataMessage | AddDataChangeListenerMessage | RemoveDataChangeListenerMessage |
    GetMostUsedEmojiMessage | ReportEmojiUsageMessage | SetAllowEmojiSuggestionsMessage | DeleteUsageDataMessage |
    ToggleFavoriteEmojiMessage | GetFavoriteEmojisMessage | SearchEmojisMessage | GetEmojiFromShortCodeMessage | GetEmojiFromUnicodeMessage |
    {
        action: "greeting" | "getSettings" | "addSettingsListener" | "getTabId"
    };

export type EventMessage = SettingsUpdatedEvent | SiteSettingsUpdatedEvent | DataChangedEvent;

export type SettingsUpdatedEvent = {
    event: "settingsUpdated",
    data: {
        settings: GlobalSettings,
    }
}

export type SiteSettingsUpdatedEvent = {
    event: "siteSettingsUpdated",
    data: {
        settings: SiteSettings,
    }
}

export type DataChangedEvent = {
    event: "dataChanged",
    data: {
        key: string,
        value: any,
        oldValue: any,
    }
}

export type GetMostUsedEmojiMessage = {
    action: "getMostUsedEmoji",
    data?: {
        count?: number,
    }
}

export type ReportEmojiUsageMessage = {
    action: "reportEmojiUsage",
    data: {
        emoji: string,
    }
}

export type GetSiteSettingsMessage = {
    action: "getSiteSettings",
    data?: {
        url?: string,
    }
}

export type GetEffectiveModeOnSiteMessage = {
    action: "getEffectiveModeOnSite",
    data?: {
        url?: string,
    }
}

export type EnableForSiteMessage = {
    action: "enableForSite",
    data: {
        enabled: boolean,
        url?: string,
    }
}

export type EnableMessage = {
    action: "enable",
    data: {
        enabled: boolean,
    }
}

export type EnableFreeSelectorMessage = {
    action: "enableFreeSelector",
    data: {
        enabled: boolean
    }
}

export type EnableFreeSelectorForSiteMessage = {
    action: "enableFreeSelectorForSite",
    data: {
        enabled: boolean,
        url?: string,
    }
}

export type SetKeepFreeSelectorEnabledMessage = {
    action: "setKeepFreeSelectorEnabled",
    data: {
        enabled: boolean,
    }
}

export type AddSiteSettingsListenerMessage = {
    action: "addSiteSettingsListener",
    data?: {
        url?: string,
    }
}

export type ReadDataMessage = {
    action: "readData",
    data: {
        key: string | string[],
    }
}

export type SetAllowEmojiSuggestionsMessage = {
    action: "setAllowEmojiSuggestions",
    data: {
        allow: boolean,
    }
}

export type ToggleFavoriteEmojiMessage = {
    action: "toggleFavoriteEmoji",
    data: {
        emoji: string,
    }
}

export type GetFavoriteEmojisMessage = {
    action: "getFavoriteEmojis",
    data?: {
        count?: number,
    }
}
/**
 * to Add a new data change listener, send this through the port you opened with the background. The listener will be
 * called whenever one of the specified keys changes.
 * key syntax: `base.subkey1.subkey2`. use [www.keyname.com] if your key name contains a dot.
 * use `base.subkey1.*` to listen to all immediate subkeys of `base.subkey1`, not including `base.subkey1` itself.
 * use `base.subkey1.**` to listen to all subkeys of `base.subkey1`, not including `base.subkey1` itself.
 *
 * @param action - "addDataChangeListener"
 * @param data.keys - One key string, or an array of keys to listen to.
 */
export type AddDataChangeListenerMessage = {
    action: "addDataChangeListener",
    data: {
        keys: string | string[],
    }
}

export type RemoveDataChangeListenerMessage = {
    action: "removeDataChangeListener",
    data: {
        keys: string | string[],
    }
}

export type SearchEmojisMessage = {
    action: "searchEmojis",
    data: {
        query: string,
        options?: SearchOption
    }
}

export type GetEmojiFromShortCodeMessage = {
    action: "getEmojiFromShortCode",
    data: {
        sc: string,
    }
}

export type GetEmojiFromUnicodeMessage = {
    action: "getEmojiFromUnicode",
    data: {
        u: string,
    }
}

/**
 * Deletes all emoji usage data.
 */
export type DeleteUsageDataMessage = {
    action: "deleteUsageData"
}