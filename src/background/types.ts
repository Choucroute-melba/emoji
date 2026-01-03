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

export type GlobalSettings = {
    enabled: boolean,
    freeSelector: boolean,
    actionIcon: string,
    keepFreeSelectorEnabled: boolean,
    allowEmojiSuggestions: boolean,
    sites: { [url: string]: SiteSettings },
}