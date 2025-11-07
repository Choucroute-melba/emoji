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
    const [enabled, setEnabled] = useState(siteSettings.disabledGlobally || false);
    const onSetEnabled = () => {
        setEnabled(!enabled);
        onToggleEnabled(enabled);
    }
    const [enabledForSite, setEnabledForSite] = useState(siteSettings.enabled);
    const onSetEnabledForSite = () => {
        setEnabledForSite(!enabledForSite);
        onToggleEnabledForSite(enabledForSite, siteSettings.url);
    }

    return (
        <>
            <button className={"browser-style"} onClick={onSetEnabled}>{enabled ? "Pause Extension" : "Activate"}</button>
            <button className={"browser-style"} onClick={onSetEnabledForSite} style={{display: enabled ? "inline" : "none"}}>{enabledForSite ? "Enable" : "Disable"} For This Site</button>
            <p>
                <a href="#">Settings</a> - <a href="https://github.com/Choucroute-melba/Emoji2">GitHub</a> - <a href="https://github.com/Choucroute-melba/Emoji2/issues">Report a bug</a>
            </p>
        </>
    )
}