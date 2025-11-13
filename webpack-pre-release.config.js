import * as path from "node:path";
import WebExtPlugin from "web-ext-plugin";
import CopyPlugin from "copy-webpack-plugin";
import {fileURLToPath} from "node:url";
import EmojeezerWebpackPlugin from "./emojeezerWebpackPlugin.js";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename);

const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
const version = manifest.version;

export default {
    entry: {
        'content-script': './src/index.ts',
        'action-popup': './src/action.ts',
        'background-script': './src/background.ts',
        'settings': './src/settings.ts',
    },
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
        extensions: ['.tsx', '.ts', '.js'],
        alias: {
            '@src': path.resolve(__dirname, 'src'),
        }
    },
    output: {
        filename: '[name]-bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    mode: 'development',

    plugins: [
        new WebExtPlugin({
            sourceDir: path.resolve(__dirname, 'dist'),
            firefox: "C:\\Program Files\\Firefox Developer Edition\\firefox.exe",
            firefoxProfile: "C:\\Users\\Vivien\\AppData\\Roaming\\Mozilla\\Firefox\\Profiles\\kv2tckr8.dev-edition-default",
            buildPackage: true,
            outputFilename: `emojeezer-b-${version}.zip`,
            overwriteDest: true
        }),
        new CopyPlugin({
            patterns: [
                {from: 'assets', to: 'assets'}
            ]
        }),
        new EmojeezerWebpackPlugin({devVersion: true})
    ]
};