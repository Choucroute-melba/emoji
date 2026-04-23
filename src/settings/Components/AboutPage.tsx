import React from "react";
import browser from "webextension-polyfill";
import './AboutPage.css'

export default function AboutPage() {
    const manifest = browser.runtime.getManifest();
    return (
        <div className={"aboutPage"}>
            <div className={"mainContent"}>
                <h1>About Emojeezer {manifest.name.includes("Dev") && "Beta"} {manifest.version}</h1>
                <p>Emojeezer is a Firefox extension designed to make using emojis online easier. Its main feature is the
                    ability to insert emojis while typing anywhere on the web, using the :colon: syntax.</p>
                <p>Emojeezer is open source and available on <a href={"https://github.com/Choucroute-melba/emoji"}>GitHub</a></p>
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