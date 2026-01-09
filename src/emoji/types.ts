import {SkinTone, Gender} from "emojibase"

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
