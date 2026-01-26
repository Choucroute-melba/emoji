import * as path from "node:path";
import {fileURLToPath} from "node:url";
import CopyPlugin from "copy-webpack-plugin";
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename);

export default {
    entry: {
        'test-selector': './devEnv/test-selector.ts',
        'test-settings': './devEnv/test-settings.ts'
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
        extensions: ['.tsx', '.ts', '.js'],
        alias: {
            '@src': path.resolve(__dirname, 'src'),
            '@devEnv': path.resolve(__dirname, 'devEnv'),
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
        client: {
            webSocketURL: {
                hostname: 'localhost',
                port: 8080,
            }
        },
        watchFiles: {
            paths: ['src/**/*', 'assets/**/*', 'devEnv/**/*'],
            options: {
                ignored: ['dev/**/*', "extensions/**/*", "node_modules/**/*"],
            },
        },
    },
    devtool: 'source-map',
    mode: 'development',

    plugins: [
        new CopyPlugin({
            patterns: [
                {from: 'assets', to: 'assets'},
                {from: 'devEnv', to: ''},
            ]
        })
    ]
}