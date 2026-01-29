import * as path from "node:path";
import WebExtPlugin from "web-ext-plugin";
import CopyPlugin from "copy-webpack-plugin";
import {fileURLToPath} from "node:url";
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename);

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
                test: /\.module\.css$/i,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            esModule: false,
                            modules: {
                                localIdentName: '[name]__[local]___[hash:base64:5]',
                            },
                            sourceMap: true,
                        }
                    },
                ],
            },
            {
                test: /\.text\.css$/i,
                use: [
                    {
                        loader: 'css-loader',
                        options: {
                            exportType: 'string',
                            sourceMap: true,
                        }
                    },
                ],
            },
            {
                test: /\.css$/i,
                resourceQuery: /inline/,
                use: [
                    {
                        loader: 'css-loader',
                        options: {
                            exportType: 'string',
                            esModule: true,
                            sourceMap: true,
                        }
                    },
                ]
            },
            {
                test: /\.css$/i,
                exclude: [/\.module\.css$/i, /\.text\.css$/i],
                resourceQuery: { not: [/inline/]},
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            sourceMap: true,
                        }
                    }
                ],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        alias: {
            '@src': path.resolve(__dirname, 'src'),
            '@theme': path.resolve(__dirname, 'src/theme'),
        }
    },
    output: {
        filename: '[name]-bundle.js',
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