import '@src/base.css'
import './action-popup.css';
import React, {useState} from "react";
import {SiteSettings} from "../background/dataManager";
import browser from "webextension-polyfill";
import {getDomainName} from "../background/utils";

export default function Comp({
                              siteSettings,
                              enabledGlobally,
                              keepFreeSelectorEnabled,
                              onToggleEnabled,
                              onToggleEnabledForSite
                          }: {
    siteSettings: SiteSettings;
    enabledGlobally: boolean;
    keepFreeSelectorEnabled: boolean;
    onToggleEnabled: (enabled: boolean) => void;
    onToggleEnabledForSite: (enabled: boolean, url?: string) => void;
}) {
    return (
        <div>
            <ActionPopup siteSettings={siteSettings} enabledGlobally={enabledGlobally} keepFreeSelectorEnabled={keepFreeSelectorEnabled} onToggleEnabled={onToggleEnabled} onToggleEnabledForSite={onToggleEnabledForSite}/>
        </div>
    )
}

function ActionPopup({
    siteSettings,
    enabledGlobally,
    keepFreeSelectorEnabled,
    onToggleEnabled,
    onToggleEnabledForSite
}: {
    siteSettings: SiteSettings;
    enabledGlobally: boolean;
    keepFreeSelectorEnabled: boolean;
    onToggleEnabled: (enabled: boolean) => void;
    onToggleEnabledForSite: (enabled: boolean, url?: string) => void;
}) {
    const enabled = enabledGlobally
    const onSetEnabled = () => {
        onToggleEnabled(!enabled);
    }
    const enabledForSite = siteSettings.enabled
    const onSetEnabledForSite = () => {
        onToggleEnabledForSite(!enabledForSite, siteSettings.url);
    }
    let hostname = ""
    try {
        hostname = getDomainName(siteSettings.url)
    } catch (e) {
        hostname = siteSettings.url
    }
    if(hostname === "") hostname = siteSettings.url;

    console.log(`Re-Render : enabled=${enabled} , enabledForSite=${enabledForSite}\n\tParams : enabled=${siteSettings.enabled}, disabledGlobally=${!enabledGlobally}, url=${siteSettings.url}`);
    const statusText = enabled ? (enabledForSite ? "Active on " : "Disabled for ") + hostname : "Disabled globally"
    const statusColor = enabled ? enabledForSite ? "var(--fx-success-text)" : "var(--fx-warning-text)" : "var(--fx-critical-text)"

    return (
        <>
            <button className={enabled ? "" : "outlined"} onClick={onSetEnabled}>{enabled ? "Pause Extension" : "Activate"}</button>
            <button className={enabledForSite ? "": "outlined"} onClick={onSetEnabledForSite} style={{display: !enabledGlobally ? "none" : "inline"}}>{enabledForSite ? "Disable" : "Enable"} For This Site</button>
            <div className={"status"}>
                <svg style={{width: "10px", height: "10px", marginRight: "5px"}}>
                    <circle cx="5" cy="5" r="5" fill={statusColor}/>
                </svg>
                <p style={{color: statusColor}}>{statusText}</p>
            </div>
            <footer>
                <a href={browser.runtime.getURL("assets/settings.html")} target={"_blank"} >Settings</a> - <a href="https://github.com/Choucroute-melba/emoji/issues/new">Report a Bug</a> - <a href={"https://addons.mozilla.org/en-US/firefox/addon/emojeezer/"}>Leave a Review</a>
            </footer>
        </>
    )
}