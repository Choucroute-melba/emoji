import path from "path";
import fs from "fs";
import {fileURLToPath} from "node:url";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename);

export default class EmojeezerWebpackPlugin {
    static defaultOptions = {
        devVersion: false
    }
    constructor(options) {
        this.options = {...EmojeezerWebpackPlugin.defaultOptions, ...options};
    }

    apply(compiler) {
        compiler.hooks.emit.tap('EmojeezerWebpackPlugin', (compilation, callback) => {
            try {
                // Read the original manifest file
                const manifestPath = path.join(__dirname, 'manifest.json');
                const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                const version = manifest.version;

                if(!this.options.devVersion) {
                    manifest.name = "Emojeezer";
                    manifest.icons = {
                        "48": "assets/icon@48px.png",
                        "72": "assets/icon@72px.png",
                        "256": "assets/icon@256px.png"
                    };
                }
                else {
                    console.log("Dev version: ", manifest.version);
                    manifest.name = 'Emoji Dev - ' + version;
                    manifest.icons = {
                        "48": "assets/ninja.png",
                        "72": "assets/ninja-2.png",
                        "256": "assets/ninja-3.png"
                    };
                }

                // Ensure the dist directory exists
                const distDir = path.join(__dirname, 'dist');
                if (!fs.existsSync(distDir)) {
                    fs.mkdirSync(distDir);
                }

                // Write the modified manifest to the dist directory
                const distManifestPath = path.join(distDir, 'manifest.json');
                fs.writeFileSync(distManifestPath, JSON.stringify(manifest, null, 2));

                console.log("Manifest file for distribution successfully created in dist directory");

                // Update version in package.json
                const packageJsonPath = path.join(__dirname, 'package.json');
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                packageJson.version = version;
                fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
                console.log("Version updated in package.json");

                // Extract changelog
                const changelogPath = path.join(__dirname, 'changelog.md');
                const fullChangelog = fs.readFileSync(changelogPath, 'utf8');
                let changelog = "";
                let goodVersion = false;
                let stop = false;
                fullChangelog.split('\n').forEach((line) => {
                    if(goodVersion && line.startsWith('#')) {
                        stop = true;
                        return;
                    }
                    if(!stop)
                        changelog += line + '\n';
                    if(line.startsWith('#') && line.includes(version)) {
                        goodVersion = true;
                    }
                });

                fs.writeFileSync(path.join(distDir, 'changelog.txt'), changelog);

                console.log("Changelog extracted");
                console.log(changelog);

                // creating amo metadata
                const amoMetadata = {
                    version: {
                        release_notes: changelog,
                    }
                }
                fs.writeFileSync(path.join(distDir, 'amo_metadata.json'), JSON.stringify(amoMetadata, null, 2));
                console.log("AMO metadata created");


            } catch (e) {
                console.error("Error building extension", e);
            }
        });
    }
}