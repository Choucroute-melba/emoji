/**
 * Represents the configuration settings for a site.
 *
 * @property {string} url - The URL of the site (for the moment sites are identified by their domain name).
 * @property {boolean} enabled - Indicate if autocomplete is enabled for this site, independently of a global disable.
 * @property {boolean} freeSelector - Determines whether free selector is enabled for this site, independently of a global disable.
 */
export type SiteSettings = {
    url: string,
    enabled: boolean,
    freeSelector: boolean
}

type Locale =
    | 'bn'
    | 'da'
    | 'de'
    | 'en-gb'
    | 'en'
    | 'es-mx'
    | 'es'
    | 'et'
    | 'fi'
    | 'fr'
    | 'hi'
    | 'hu'
    | 'it'
    | 'ja'
    | 'ko'
    | 'lt'
    | 'ms'
    | 'nb'
    | 'nl'
    | 'pl'
    | 'pt'
    | 'ru'
    | 'sv'
    | 'th'
    | 'uk'
    | 'zh-hant'
    | 'zh';


export type GlobalSettings = {
    enabled: boolean,
    freeSelector: boolean,
    actionIcon: string,
    keepFreeSelectorEnabled: boolean,
    allowEmojiSuggestions: boolean,
    emojiLocale: Locale,
    sites: { [url: string]: SiteSettings },
}