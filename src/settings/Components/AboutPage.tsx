import React, {useState} from "react";
import browser from "webextension-polyfill";
import './AboutPage.css'
import LinkNewTab from "@src/Components/LinkNewTab";

export default function AboutPage() {
    const manifest = browser.runtime.getManifest();
    const [freeSelectorCommand, setFreeSelectorCommand] = useState<string | null>(null);
    browser.commands.getAll().then((commands) => {
        const cmd = commands.find((command) => command.name === "show-free-selector");
        if(cmd) {
            setFreeSelectorCommand(cmd.shortcut || "null");
        }
    })
    return (
        <div className={"aboutPage"}>
            <div className={"mainContent"}>
                <h1>About Emojeezer {manifest.name.includes("Dev") && "Beta"} {manifest.version}</h1>
                <p>Emojeezer is a Firefox extension designed to make using emojis online easier. Its main feature is the
                    ability to insert emojis while typing anywhere on the web, using the :colon: syntax.</p>
                <p>Emojeezer is open source and available on <a href={"https://github.com/Choucroute-melba/emoji"}>GitHub</a></p>
                <h3>Keyboard Shortcuts</h3>
                <table className={"keyboardShortcuts"}>
                    <tbody>
                    <tr>
                        <td>Open a selector with a search bar on any website</td>
                        <td><pre>{freeSelectorCommand || "Crtl + Comma"}</pre></td>
                        <td><LinkNewTab href={"about:addons"} onClick={(e) => {
                            e.preventDefault();
                            browser.commands.openShortcutSettings()
                        }}>Change</LinkNewTab></td>
                    </tr>
                    <tr>
                        <td>Add the selected emoji to favorites</td>
                        <td><pre>Ctrl + Enter</pre></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td>Insert / Copy emoji</td>
                        <td><pre>Enter</pre></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td>Navigate Up or Down in emoji list</td>
                        <td><pre>Arrows Up / Down</pre></td>
                        <td></td>
                    </tr>
                    </tbody>
                </table>
                <h3>Help and Bug Reports</h3>
                <p>Everything happens here : <a href={"https://github.com/Choucroute-melba/emoji"}>GitHub Issues</a></p>
                <h3>Support Developpement</h3>
                <p>You can show that you like this extension by leaving a five-star review at <a href={"https://addons.mozilla.org/en-US/firefox/addon/emojeezer/"}>
                    addons.mozilla.org
                </a> </p>
            </div>
            <footer>
                <pre>This add-on was 🧑‍🍳 by <a href={"https://github.com/Choucroute-melba"}>Choucroute-melba</a>.</pre>
                <pre>Contact : <a href={"mailto:vivien@netc.fr"}
                                  style={{color: "inherit"}}
                >vivien@netc.fr</a></pre>
            </footer>
        </div>
    )
}