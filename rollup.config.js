import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from 'rollup-plugin-typescript2';
import { defineConfig } from 'rollup';
import importAssets from 'rollup-plugin-import-assets';
import polyfillNode from 'rollup-plugin-polyfill-node';

import { name } from "./plugin.json";

export default defineConfig({
  input: './src/index.tsx',
  plugins: [
    commonjs(),
    json(),
    polyfillNode(),
    typescript({
      include: ['src/**/*.ts', 'src/**/*.tsx', 'node_modules/@glowstudent/youversion/**/*.ts'],
      exclude: ['node_modules/!(glowstudent)/**/*.ts']
    }),
    nodeResolve({
      preferBuiltins: true,
    }),
    replace({
      preventAssignment: false,
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    importAssets({
      publicPath: `http://127.0.0.1:1337/plugins/${name}/`
    })
  ],
  context: 'window',
  external: ["react", "react-dom", "decky-frontend-lib"],
  output: {
    file: "dist/index.js",
    globals: {
      react: "SP_REACT",
      "react-dom": "SP_REACTDOM",
      "decky-frontend-lib": "DFL",
      'util': 'util',
      'stream': 'stream',
      'path': 'path',
      'http': 'http',
      'https': 'https',
      'url': 'url',
      'fs': 'fs',
      'assert': 'assert',
      'zlib': 'zlib',
      'events': 'events'
    },
    format: 'iife',
    exports: 'default',
  },
});