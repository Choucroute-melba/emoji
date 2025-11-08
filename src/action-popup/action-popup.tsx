import '@src/base.css'
import './action-popup.css';
import React, {useState} from "react";
import {SiteSettings} from "../settings/settingsManager";

export default function Comp({
                              siteSettings,
                              onToggleEnabled,
                              onToggleEnabledForSite
                          }: {
    siteSettings: SiteSettings;
    onToggleEnabled: (enabled: boolean) => void;
    onToggleEnabledForSite: (enabled: boolean, url?: string) => void;
}) {
    return (
        <div>
            <ActionPopup siteSettings={siteSettings} onToggleEnabled={onToggleEnabled} onToggleEnabledForSite={onToggleEnabledForSite}/>
        </div>
    )
}

function ActionPopup({
    siteSettings,
    onToggleEnabled,
    onToggleEnabledForSite
}: {
    siteSettings: SiteSettings;
    onToggleEnabled: (enabled: boolean) => void;
    onToggleEnabledForSite: (enabled: boolean, url?: string) => void;
}) {
    const enabled = !siteSettings.disabledGlobally
    const onSetEnabled = () => {
        onToggleEnabled(!enabled);
    }
    const enabledForSite = siteSettings.enabled
    const onSetEnabledForSite = () => {
        onToggleEnabledForSite(!enabledForSite, siteSettings.url);
    }
    let hostname = new URL(siteSettings.url).host;
    if(hostname === "") hostname = siteSettings.url;

    console.log(`Re-Render : enabled=${enabled} , enabledForSite=${enabledForSite}\n\tParams : enabled=${siteSettings.enabled}, disabledGlobally=${siteSettings.disabledGlobally}, url=${siteSettings.url}`);
    const statusText = enabled ? (enabledForSite ? "Active on " : "Disabled for ") + hostname : "Disabled globally"
    const statusColor = enabled ? enabledForSite ? "green" : "orange" : "red"

    return (
        <>
            <button className={enabled ? "" : "outlined"} onClick={onSetEnabled}>{enabled ? "Pause Extension" : "Activate"}</button>
            <button className={enabledForSite ? "": "outlined"} onClick={onSetEnabledForSite} style={{display: siteSettings.disabledGlobally ? "none" : "inline"}}>{enabledForSite ? "Disable" : "Enable"} For This Site</button>
            <div className={"status"}>
                <svg style={{width: "10px", height: "10px", marginRight: "5px"}}>
                    <circle cx="5" cy="5" r="5" fill={statusColor}/>
                </svg>
                <p style={{color: statusColor}}>{statusText}</p>
            </div>
            <footer>
                <a href={"https://github.com/Choucroute-melba/Emoji2"}>GitHub</a> - <a href="https://github.com/Choucroute-melba/emoji/issues/new">Report a Bug</a> - <a href={"https://addons.mozilla.org/en-US/firefox/addon/emojeezer/"}>Leave a Review</a>
            </footer>
        </>
    )
}