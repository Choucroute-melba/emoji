import * as path from "node:path";
import fs from "node:fs";

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
const outputDir = path.resolve(__dirname, 'dev/extensions/build');
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
        filename: '[name].bundle.mjs',
        path: path.resolve(__dirname, 'dev/extensions/build'),
        clean: true,
        library: {
            type: 'module',
        },
    },
    experiments: {
        outputModule: true,
    },
    devServer: {
        watchFiles: {
            paths: ['src/**/*', 'assets/**/*', 'devEnv/**/*', 'manifest.json'],
            options: {
                ignored: ['dev/extensions/build/**/*'],
            },
        },
    },
    devtool: 'source-map',
    mode: 'development',
};
