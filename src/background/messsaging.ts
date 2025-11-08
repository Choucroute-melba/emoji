import {GlobalSettings, SiteSettings} from "../settings/settingsManager";

export type Message = GetSiteSettingsMessage | EnableForSiteMessage | EnableMessage | SetFreeSelectorMessage | AddSiteSettingsListenerMessage | SetKeepFreeSelectorEnabledMessage |
    {
        action: "greeting" | "getSettings" | "addSettingsListener" | "getTabId"
    };

export type EventMessage = SettingsUpdatedEvent | SiteSettingsUpdatedEvent;

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

export type GetSiteSettingsMessage = {
    action: "getSiteSettings",
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

export type SetFreeSelectorMessage = {
    action: "setFreeSelector",
    data: {
        enabled: boolean,
        thisSiteOnly?: boolean,
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