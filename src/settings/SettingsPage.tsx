import '@src/base.css'
import './SettingsPage.css'
import React from 'react';
import {GlobalSettings, SiteSettings} from "../background/dataManager";

export default function SettingsPage({settings, toggleKeepFreeSelectorEnabled, toggleGloballyEnabled, toggleFreeSelectorGloballyEnabled, toggleSiteEnabled} : {
    settings: GlobalSettings
    toggleKeepFreeSelectorEnabled: (enable: boolean) => void,
    toggleGloballyEnabled: (enable: boolean) => void,
    toggleFreeSelectorGloballyEnabled: (enable: boolean) => void,
    toggleSiteEnabled: (url: string, enable: boolean) => void,
}) {
    const disabledSites: SiteSettings[] = [];
    for (let sitesKey in settings.sites) {
        if(!settings.sites[sitesKey].enabled) {
            disabledSites.push(settings.sites[sitesKey]);
        }
    }
    return (
        <div>
            <h1>Emojeezer Settings</h1>
            <div>
                <button className={"globalEnableButton" + settings.enabled ? "" : " outlined"} onClick={() => {
                    toggleGloballyEnabled(!settings.enabled);
                }}>{settings.enabled ? "Disable Autocomplete" : "Enable Autocomplete"}</button>
            </div>
            <label>
                <input type={"checkbox"} checked={settings.freeSelector} onChange={(e) => {
                    toggleFreeSelectorGloballyEnabled(e.target.checked)
                }} />
                Enable the <code>Ctrl + ,</code> shortcut for easy copy-paste emoji
                <br/>
                <label style={{marginLeft: "20px", marginTop: "10px", color: (settings.freeSelector ? "inherit" : "gray")}}>
                    <input type={"checkbox"} checked={settings.keepFreeSelectorEnabled} onChange={(e) => {
                        toggleKeepFreeSelectorEnabled(e.target.checked);
                    }} disabled={!settings.freeSelector}/>
                    Keep it enabled even when autocomplete is off
                </label>
            </label>
            <h3>Sites where autocomplete is disabled : </h3>
            <div className={"siteBlacklist"}>
                {
                    disabledSites.map((siteSettings) => {
                        return <SiteBlacklistItem siteSettings={siteSettings} key={siteSettings.url} onEnable={() => {
                            toggleSiteEnabled(siteSettings.url, true)
                        }}/>
                    })
                }
            </div>
        </div>
    )
}

function SiteBlacklistItem({siteSettings, onEnable}: {
    siteSettings: SiteSettings,
    onEnable: () => void
}) {
    return (
        <div className={"siteBlacklistItem"}>
            <p>{siteSettings.url}</p>
            <button onClick={() => {onEnable()}}>
                Enable
            </button>
        </div>
    )
}