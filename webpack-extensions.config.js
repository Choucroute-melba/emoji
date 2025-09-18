import * as path from "node:path";
import fs from "node:fs";

const __dirname = path.resolve();
const extensionsDir = path.resolve(__dirname, 'extensions');
const manifestsPath = path.resolve(extensionsDir, 'manifests/extensions.json');

const extensionsManifestList = JSON.parse(fs.readFileSync(manifestsPath, 'utf8'));
const extensionEntries = extensionsManifestList.reduce((entries, manifestFile) => {
    const manifest = JSON.parse(fs.readFileSync("extensions/manifests/" + manifestFile, 'utf8'));
    if(manifest.file !== "bundled") {
        const base = path.parse(manifestFile).name.replace('.manifest', '');
        entries[base] = path.join(extensionsDir, `${base}.ts`);
    } else {
        console.log("Skipping bundled extension: ", manifestFile);
    }
    console.log(entries)
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
                test: /\.module\.css$/i,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                        },
                    },
                ],
            },
            {
                test: /(?<!\.module)\.css$/i,
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
