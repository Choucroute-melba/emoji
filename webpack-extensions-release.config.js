import * as path from "node:path";
import fs from "node:fs";
import CopyPlugin from "copy-webpack-plugin";

const __dirname = path.resolve();
const extensionsDir = path.resolve(__dirname, 'extensions');
const manifestsPath = path.resolve(extensionsDir, 'manifests/extensions.json');

const extensionsManifestList = JSON.parse(fs.readFileSync(manifestsPath, 'utf8'));
const extensionEntries = extensionsManifestList.reduce((entries, manifestFile) => {
    const base = path.parse(manifestFile).name.replace('.manifest', '');
    if(base !== 'input' && base !== 'textarea' && base !== 'editable' && base !== 'aria')
        entries[base] = path.join(extensionsDir, `${base}.ts`);
    return entries;
}, {});
const outputDir = path.resolve(__dirname, 'dist/extensions/build');
console.log("Extensions output to : ", outputDir);
if(!fs.existsSync(outputDir)){
    const dir = fs.mkdirSync(outputDir, { recursive: true });
    console.log("Created output directory");
}

export default {
    entry: extensionEntries,
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    output: {
        filename: 'build/[name].bundle.mjs',
        path: path.resolve(__dirname, 'dist/extensions'),
        clean: false,
        library: {
            type: 'module',
        },
    },
    experiments: {
        outputModule: true,
    },
    mode: 'production',
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: "extensions/manifests", to: "manifests" },
            ]
        })
    ]
};
