import browser from "webextension-polyfill";


const build = browser.runtime.getManifest().name.includes("Dev") ? "beta" : "stable"
const version = browser.runtime.getManifest().version;
browser.runtime.setUninstallURL(`https://emojeezer-website.vercel.app/uninstallation/feedback?version=${version}&buildtype=${build}`)
    .then(() => console.log(`Uninstall URL set to https://emojeezer-website.vercel.app/uninstallation/feedback?version=${version}&buildtype=${build}`))
    .catch(err => console.error("Error while setting uninstall URL:", err))

browser.runtime.onInstalled.addListener(({reason, temporary}) => {
    console.info("extension", reason, "temporary :", temporary)
    if(temporary) return;
    if(reason !== "install" && reason !== "update") return;
    console.info(reason + " extension")
    fetch("https://emojeezer-website.vercel.app/api/usage", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            version: version,
            beta: (build === "beta"),
            action: reason === "install" ? "installation" : "update"
        })
    })
})

console.log("User engagement initialized")