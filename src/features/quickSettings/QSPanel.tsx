import {selectEnabled} from "../preferences/settingsSlice";
import {useState} from "react";
import {useSelector} from "react-redux";

export default function QSPanel() {
    let emojiEnabled = useSelector(selectEnabled)
    const toggleEnabled = () => {
        // @ts-ignore
        browser.runtime.sendMessage({
            type: "toggle-emoji",
            emoji_active: !emojiEnabled
        })
    }

    return (
        <>
            <button>Disable for this site</button>
            <button onClick={toggleEnabled}>{emojiEnabled ? "Disable extension" : "Enable extension"}</button>
        </>
    )
}