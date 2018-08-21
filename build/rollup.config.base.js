import json from 'rollup-plugin-json'
import babel from 'rollup-plugin-babel'
import { eslint } from 'rollup-plugin-eslint'
import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'

export default {
    input: './src/index.js',
    output: {
        file: 'dist/index.js',
        format: 'cjs',
        banner: '#!/usr/bin/env node'
    },
    external: id => {
        return !id.startsWith('.') && !id.startsWith('/') && !id.startsWith('\0')
    },
    plugins: [
        resolve(),
        commonjs(),
        json(),
        eslint(),
        babel({
            exclude: 'node_modules/**'
        })
    ]
}