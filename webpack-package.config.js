import pkg from "./package.json" with { type: "json" };
import * as path from "node:path";
import {fileURLToPath} from "node:url";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename);


// Liste des dépendances à exclure du bundle (peer + externes)
const externals = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
  'react',
  'react-dom'
];

export default {
  mode: 'production',
  entry: './src/package-entry.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: {
      type: 'commonjs2',
    },
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
        {
            test: /\.css$/i,
            use: ['style-loader', 'css-loader'],
        },
    ],
  },
  externals: externals.reduce((acc, dep) => { acc[dep] = dep; return acc; }, {}),
  target: 'node',
};
