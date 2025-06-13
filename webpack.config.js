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
        clean: false,
    },
    devServer: {
        static: './dev',
        allowedHosts: "all",
        host: 'localhost',
        devMiddleware: {
            writeToDisk: true,
        },
        client: {
            webSocketURL: {
                hostname: 'localhost',
                port: 8080,
            }
        },
        watchFiles: {
            paths: ['src/**/*', 'assets/**/*', 'devEnv/**/*', 'manifest.json'],
            options: {
                ignored: ['dev/**/*', "extensions/**/*", "node_modules/**/*"],
            },
        },
    },
    devtool: 'source-map',
    mode: 'development',

    plugins: [
        new WebExtPlugin({
            sourceDir: path.resolve(__dirname, 'dev'),
            firefox: "C:\\Program Files\\Firefox Developer Edition\\firefox.exe",
            firefoxProfile: "C:\\Users\\Vivien\\AppData\\Roaming\\Mozilla\\Firefox\\Profiles\\kv2tckr8.dev-edition-default",
            startUrl: ["about:debugging#/runtime/this-firefox", "http://localhost:8080/test-site.html"],
        }),
        new CopyPlugin({
            patterns: [
                {from: 'assets', to: 'assets'},
                {from: 'devEnv', to: ''},
                {from: 'manifest.json', to: 'manifest.json'},
                {from: 'extensions/manifests', to: 'extensions/manifests'},
            ]
        })
    ]
};