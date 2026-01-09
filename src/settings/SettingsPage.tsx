import '@src/base.css'
import './SettingsPage.css'
import React from 'react'
import {useState} from 'react';
import {GlobalSettings, SiteSettings} from "../background/dataManager";
import {Emoji} from "emojibase";
import EmojiCard from "../selector/Components/EmojiCard";

export default function SettingsPage({settings, usageData, favoriteEmojis,
    toggleKeepFreeSelectorEnabled,
    toggleGloballyEnabled,
    toggleFreeSelectorGloballyEnabled,
    toggleSiteEnabled,
    toggleAllowEmojiSuggestions,
    deleteUsageData,
    toggleFavoriteEmoji
} : {
    settings: GlobalSettings
    usageData: Map<Emoji, {count: number, firstUsed: number, lastUsed: number, recency: number, frequency: number, score: number}>,
    favoriteEmojis: Emoji[]
    toggleKeepFreeSelectorEnabled: (enable: boolean) => void,
    toggleGloballyEnabled: (enable: boolean) => void,
    toggleFreeSelectorGloballyEnabled: (enable: boolean) => void,
    toggleSiteEnabled: (url: string, enable: boolean) => void,
    toggleAllowEmojiSuggestions: (enable: boolean) => void
    deleteUsageData: () => void,
    toggleFavoriteEmoji: (emoji: Emoji | string) => void
}) {
    const disabledSites: SiteSettings[] = [];
    for (let sitesKey in settings.sites) {
        if(!settings.sites[sitesKey].enabled) {
            disabledSites.push(settings.sites[sitesKey]);
        }
    }
    const openShortcutManagementPage = (e: any) => {
        e.preventDefault();
        //browser.commands.openShortcutSettings()
    }

    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    return (
        <div>
            <h1>Emojeezer Settings</h1>
            <div>
                <button className={"globalEnableButton" + (settings.enabled ? "" : " outlined")} onClick={() => {
                    toggleGloballyEnabled(!settings.enabled);
                }}>{settings.enabled ? "Disable Autocomplete" : "Enable Autocomplete"}</button>
            </div>
            <div>
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
                <p style={{marginTop: "7px"}} className={"hint"}>You can <a href={"about:addons"} onClick={openShortcutManagementPage}>change this shortcut</a>.
                    See <a
                        href={"https://support.mozilla.org/en-US/kb/manage-extension-shortcuts-firefox"}
                        target={"_blank"}
                    >Mozilla documentation</a> for more information. </p>
            </div>
            <h3>Usage data and favorites</h3>
            <div>
                <label>
                    <input type={"checkbox"} checked={settings.allowEmojiSuggestions} onChange={(e) => {
                        toggleAllowEmojiSuggestions(e.target.checked);
                    }} />
                    Show emoji suggestions based on your usage
                    <br/>
                </label>
                <button className={"dangerButton"} onClick={() => {setShowDeleteConfirmation(true)}}>Delete History</button>
                {showDeleteConfirmation && <ConfirmUsageDataDeletion onConfirm={deleteUsageData} onCancel={() => {setShowDeleteConfirmation(false)}}/>}
            </div>
            <div className={"emojiUsageList"}>
                {
                    usageData.size === 0 ? <p>No usage data yet</p> : Array.from(usageData.entries()).map(([emoji, data]) => {
                        return <EmojiUsageItem emoji={emoji}
                                               data={data}
                                               key={emoji.emoji}
                                               isFavorite={favoriteEmojis.findIndex((e) => e.emoji === emoji.emoji) !== -1}
                                               onFavoriteToggle={toggleFavoriteEmoji.bind(null, emoji.emoji) as (emoji: Emoji) => void}
                        />
                    })
                }
            </div>
            <h3>You favorites</h3>
            <p className={"hint"}>Your favorites will be show first when searching for emojis.</p>
            <div className={"favoriteEmojisList"}>
                {
                    favoriteEmojis.length === 0 ? <p>No favorite emojis yet</p> : favoriteEmojis.map((emoji) => {
                        return <EmojiCard
                            emoji={emoji}
                            selected={true}
                            isFavorite={true}
                            onClick={() => {}}
                            onFavoriteToggle={(e) => {
                                toggleFavoriteEmoji(emoji)
                            }}
                            cardStyle={"full"}
                            key={emoji.emoji}
                        />
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

function EmojiUsageItem({emoji, data, isFavorite, onFavoriteToggle}: {
    emoji: Emoji,
    data: {count: number, firstUsed: number, lastUsed: number, recency: number, frequency: number, score: number}
    isFavorite: boolean,
    onFavoriteToggle: (emoji: Emoji) => void
}) {
    const [displayDetails, setDisplayDetails] = React.useState(false);
    return (
        <div style={{display: "inline-block", margin: "3px"}}>
            <EmojiCard
                emoji={emoji}
                selected={true}
                isFavorite={isFavorite}
                onClick={() => {setDisplayDetails(!displayDetails)}}
                onFavoriteToggle={onFavoriteToggle}
                cardStyle={"square"}/>
            {displayDetails && <EmojiUsageDetails emoji={emoji} data={data}/>}
        </div>

    )
}

function EmojiUsageDetails({emoji, data}: {
    emoji: Emoji
    data: {count: number, firstUsed: number, lastUsed: number, recency: number, frequency: number, score: number}
}) {
    return (
        <div className={"emojiUsageDetails"}>
            <p style={{fontSize: "16px", color: "white", fontWeight: "bold", marginBottom: "3px"}}>{emoji.label}</p>
            <p style={{fontSize: "14px", color: "lightgrey", marginTop: "0px"}}>{emoji.shortcodes ? emoji.shortcodes.join(", ") : ""}</p>
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

function ConfirmUsageDataDeletion({onConfirm, onCancel}: {onConfirm: () => void, onCancel: () => void}) {
    return (
        <div className={"popupBackground"} onClick={() => {onCancel()}}>
            <div className={"confirmationPopup"}>
                <p>Are you sure you want to delete all your usage data?</p>
                <p>This action cannot be undone.</p>
                <button className={"outlined"} style={{alignSelf: "end"}} onClick={() => {onCancel()}}>Cancel</button>
                <button className={"dangerButton"} style={{alignSelf: "end"}} onClick={() => {onConfirm()}}>Confirm</button>
            </div>
        </div>
    )
}