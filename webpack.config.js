import * as path from "node:path";
import WebExtPlugin from "web-ext-plugin";
import CopyPlugin from "copy-webpack-plugin";
import {fileURLToPath} from "node:url";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename);

export default {
    entry: './src/index.ts',
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
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dev'),
    },
    devServer: {
        static: './dev',
    },
    devtool: 'source-map',
    mode: 'development',

    plugins: [
        new WebExtPlugin({
            sourceDir: path.resolve(__dirname, 'dev'),
            firefox: "C:\\Program Files\\Firefox Developer Edition\\firefox.exe",
            firefoxProfile: "C:\\Users\\Vivien\\AppData\\Roaming\\Mozilla\\Firefox\\Profiles\\kv2tckr8.dev-edition-default",
        }),
        new CopyPlugin({
            patterns: [
                {from: 'assets', to: 'assets'},
                {from: 'devEnv', to: './'},
                {from: 'manifest.json', to: 'manifest.json'}
            ]
        })
    ]
};