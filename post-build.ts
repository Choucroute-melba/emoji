// @ts-ignore
const fs = require("fs");

console.log("post-build.js loaded");

const assets = require("./build/asset-manifest.json");

// update manifest.json
const manifestContent = require("./build/manifest.json");
manifestContent.content_scripts[0].js = ["emoji.js"];
manifestContent.content_scripts[0].css = [assets.files["main.css"]];
manifestContent.options_ui.page = "options.html";


const manifestFile = fs.openSync("./build/manifest.json", "w");
fs.write(manifestFile, JSON.stringify(manifestContent, null, 2), () => {
    console.log("manifest.json updated");
});
fs.close(manifestFile);

// update emoji.js

let emojiContent = fs.readFileSync("./build/emoji.js", "utf8");
emojiContent = emojiContent.replace(
    "app.setAttribute(\"src\", REACT_APP_URL + \"/static/js/bundle.js\")"
    ,
    `        // eslint-disable-next-line no-undef
        const url = browser.runtime.getURL("${assets.files["main.js"]}")
        console.info("URL", url)
        app.setAttribute("src", url)
        `
    );

const emojiFile = fs.openSync("./build/emoji.js", "w");
fs.write(emojiFile, emojiContent, () => {
    console.log("emoji.js updated");
});

fs.close(emojiFile);

console.log("post-build.ts finished");