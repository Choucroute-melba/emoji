import {SkinTone, Gender, Locale} from "emojibase"

/**
 * Represents configuration options for an emoji search operation.
 * @property limit - limit the number of results
 * @property useFavorites - include favorite emojis first in the search results. default to settings value
 * @property useMostUsed - include most used emojis first in the search results. default to settings value
 * @property usePreferredSkinTone - use skin tone from settings instead of the default skin tone. default to true
 * @property usePreferredGender - use gender from settings instead of the default gender. default to true
 * @property useSkinTone - skin tone to use for the search (will override usePreferredSkinTone or the default skin tone)
 * @property useGender - gender to use for the search (will override usePreferredGender or the default gender)
 */
export type SearchOption = {
    limit?: number
    useFavorites?: boolean
    useMostUsed?: boolean
    usePreferredSkinTone?: boolean
    usePreferredGender?: boolean
    useSkinTone?: SkinTone
    useGender?: Gender
}


export type LocaleItem = { locale: Locale; displayName: string; emoji: string };

export const LOCALES: LocaleItem[] = [
    { locale: "bn", displayName: "Bengali (Bangla)", emoji: "🇧🇩" },
    { locale: "da", displayName: "Danish", emoji: "🇩🇰" },
    { locale: "de", displayName: "German (Deutsch)", emoji: "🇩🇪" },
    { locale: "en-gb", displayName: "English (Great Britain)", emoji: "🇬🇧" },
    { locale: "en", displayName: "English (United States of America)", emoji: "🇺🇸" },
    { locale: "es-mx", displayName: "Spanish (Mexico)", emoji: "🇲🇽" },
    { locale: "es", displayName: "Spanish (Spain)", emoji: "🇪🇸" },
    { locale: "et", displayName: "Estonian", emoji: "🇪🇪" },
    { locale: "fi", displayName: "Finnish", emoji: "🇫🇮" },
    { locale: "fr", displayName: "French", emoji: "🇫🇷" },
    { locale: "hi", displayName: "Hindi", emoji: "🇮🇳" },
    { locale: "hu", displayName: "Hungarian", emoji: "🇭🇺" },
    { locale: "it", displayName: "Italian", emoji: "🇮🇹" },
    { locale: "ja", displayName: "Japanese", emoji: "🇯🇵" },
    { locale: "ko", displayName: "Korean", emoji: "🇰🇷" },
    { locale: "lt", displayName: "Lithuanian", emoji: "🇱🇹" },
    { locale: "ms", displayName: "Malay", emoji: "🇲🇾" },
    { locale: "nb", displayName: "Norwegian Bokmål", emoji: "🇳🇴" },
    { locale: "nl", displayName: "Dutch", emoji: "🇳🇱" },
    { locale: "pl", displayName: "Polish", emoji: "🇵🇱" },
    { locale: "pt", displayName: "Portuguese", emoji: "🇵🇹" },
    { locale: "ru", displayName: "Russian", emoji: "🇷🇺" },
    { locale: "sv", displayName: "Swedish", emoji: "🇸🇪" },
    { locale: "th", displayName: "Thai", emoji: "🇹🇭" },
    { locale: "uk", displayName: "Ukrainian", emoji: "🇺🇦" },
    { locale: "zh-hant", displayName: "Chinese (Traditional)", emoji: "🇹🇼" },
    { locale: "zh", displayName: "Chinese (Simplified)", emoji: "🇨🇳" }
];
