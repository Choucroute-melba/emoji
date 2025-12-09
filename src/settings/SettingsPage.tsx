import '@src/base.css'
import './SettingsPage.css'
import React from 'react';
import {GlobalSettings, SiteSettings} from "../background/dataManager";
import {Emoji} from "../emoji/emoji";

export default function SettingsPage({settings, usageData,
     toggleKeepFreeSelectorEnabled,
     toggleGloballyEnabled,
     toggleFreeSelectorGloballyEnabled,
     toggleSiteEnabled,
     toggleAllowEmojiSuggestions

} : {
    settings: GlobalSettings
    usageData: Map<Emoji, {count: number, firstUsed: number, lastUsed: number, recency: number, frequency: number, score: number}>,
    toggleKeepFreeSelectorEnabled: (enable: boolean) => void,
    toggleGloballyEnabled: (enable: boolean) => void,
    toggleFreeSelectorGloballyEnabled: (enable: boolean) => void,
    toggleSiteEnabled: (url: string, enable: boolean) => void,
    toggleAllowEmojiSuggestions: (enable: boolean) => void
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
            <h3>Usage data</h3>
            <label>
                <input type={"checkbox"} checked={settings.allowEmojiSuggestions} onChange={(e) => {
                    toggleAllowEmojiSuggestions(e.target.checked);
                }} />
                Show emoji suggestions based on your usage (stored locally)
            </label>
            <div className={"emojiUsageList"}>
                {
                    usageData.size === 0 ? <p>No usage data yet</p> : Array.from(usageData.entries()).map(([emoji, data]) => {
                        return <EmojiUsageItem emoji={emoji} data={data} key={emoji.unicode}/>
                    })
                }
            </div>
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

function EmojiUsageItem({emoji, data}: {
    emoji: Emoji,
    data: {count: number, firstUsed: number, lastUsed: number, recency: number, frequency: number, score: number}
}) {
    const [displayDetails, setDisplayDetails] = React.useState(false);
    return (
        <>
            <p onMouseEnter={() => setDisplayDetails(true)}
                     onMouseLeave={() => setDisplayDetails(false)}
                     style={{cursor: "pointer", display: "inline-block", padding: "5px", border: "1px solid lightgray", borderRadius: "5px", margin: "5px", fontSize: "20px"}}
                     onClick={() => {
                         setDisplayDetails(!displayDetails)
                     }}
            >{emoji.unicode}</p>
            {displayDetails && <EmojiUsageDetails emoji={emoji} data={data}/>}
        </>

    )
}

function EmojiUsageDetails({emoji, data}: {
    emoji: Emoji
    data: {count: number, firstUsed: number, lastUsed: number, recency: number, frequency: number, score: number}
}) {
    return (
        <div className={"emojiUsageDetails"}>
            <p style={{fontSize: "16px", color: "white", fontWeight: "bold", marginBottom: "3px"}}>{emoji.name}</p>
            <p style={{fontSize: "14px", color: "lightgrey", marginTop: "0px"}}>{emoji.shortcodes.join(", ")}</p>
            <div style={{marginTop: "7px", fontSize: "12px", color: "white"}}>
                <p>Used {data.count} times</p>
                <p>First used: {new Date(data.firstUsed).toLocaleDateString()}</p>
                <p>Last used: {new Date(data.lastUsed).toLocaleDateString()}</p>
                <p>Recency score: {data.recency.toFixed(4)}</p>
                <p>Frequency score: {data.frequency.toFixed(4)}</p>
                <p>Total score: {data.score.toFixed(4)}</p>
            </div>
        </div>
    )
}