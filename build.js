const fs = require('fs');
const path = require('path');

console.log("Building Emoji extension");

const args = process.argv.slice(2);

function getArgumentValue(flag) {
    const index = args.indexOf(flag);
    if (index !== -1 && index + 1 < args.length) {
        return args[index + 1];
    }
    return null;
}

const version = getArgumentValue('-v');
console.log(`Version: ${version}`);

let devVersion = false;
let simplifiedVersion = version;
if(version && version.includes("_")) {
    devVersion = true;
    simplifiedVersion = version.slice(0, version.indexOf('_'))
    // change the version number to avoid conflicts :
    let v = simplifiedVersion.split('.');
    v[2] = parseInt(v[2]) + 1;
    simplifiedVersion = v.join('.');
}

try {
    // Read the original manifest file
    const manifestPath = path.join(__dirname, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    if(version)
        manifest.version = simplifiedVersion;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log("Version updated in manifest")

    if(!devVersion) {
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
    // manifest.content_scripts[0].js = ["build.js"];

    // Ensure the dist directory exists
    const distDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir);
    }

    // Write the modified manifest to the dist directory
    const distManifestPath = path.join(distDir, 'manifest.json');
    fs.writeFileSync(distManifestPath, JSON.stringify(manifest, null, 2));

    console.log("Manifest file created successfully in dist directory");

    // Update version in package.json
    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    packageJson.version = version;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log("Version updated in package.json");

} catch (e) {
    console.error("Error building extension", e);
}

console.log("Build completed successfully");