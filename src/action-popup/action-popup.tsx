import '@src/base.css'
import './action-popup.css';
import React from "react";
import {SiteSettings} from "../background/types";
import browser from "webextension-polyfill";
import {getDomainName} from "../background/storage-utils";
import ToggleButton from "@src/Components/ToggleButton";
import InformationIcon from "@src/Components/icons/Information";

export default function ActionPopup({
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
    const [keyboardShortcut, setKeyboardShortcut] = React.useState<string | null>(null);
    browser.commands.getAll().then((commands) => {
        const cmd = commands.find((command) => command.name === "show-free-selector");
        if(cmd) {
            setKeyboardShortcut(cmd.shortcut || "null");
        }
    })

    return (
        <div>
            <div className={"highlightSection " + (enabled ? "enabled" : "disabled")}>
                <ToggleButton onChange={onSetEnabled} checked={enabled}>{enabled ? "Autocomplete ON" : "Autocomplete OFF"}</ToggleButton>
            </div>
            <div className={"siteControlSection highlightSection outlined"}>
                <div className={"status"}>
                    <div className={"infoBox"}>
                        <svg style={{width: "10px", height: "10px", marginRight: "5px"}} viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="6" cy="6" r="5" fill={statusColor}/>
                        </svg>
                        <p style={{color: statusColor}} className={"info"}>{statusText}</p>
                    </div>
                    {
                        ((!siteSettings.enabled || !enabledGlobally) && keepFreeSelectorEnabled) && <div className={"infoBox"}>
                            <InformationIcon/>
                            <p className={"info"}>You can still copy emoji using the {keyboardShortcut} keyboard shortcut. Visit settings to change this.
                            </p>
                        </div>
                    }
                </div>

                <button className={"siteControlButton " + (enabledForSite ? "outlined" : "accent")} onClick={onSetEnabledForSite} style={{display: !enabledGlobally ? "none" : "block"}}>{enabledForSite ? "Disable" : "Enable"} For This Site</button>
            </div>
            <footer>
                <a href={browser.runtime.getURL("assets/settings.html")} target={"_blank"} >Settings</a> - <a href="https://github.com/Choucroute-melba/emoji/issues/new">Report a Bug</a> - <a href={"https://addons.mozilla.org/en-US/firefox/addon/emojeezer/"}>Leave a Review</a>
            </footer>
        </div>
    )
}