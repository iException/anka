import json from 'rollup-plugin-json'
import ts from 'rollup-plugin-typescript'
import tslint from 'rollup-plugin-tslint'
import typescript from 'rollup-plugin-typescript'
import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'

export default {
    input: './src/index.ts',
    output: {
        file: 'dist/index.js',
        format: 'cjs',
        banner: '#!/usr/bin/env node'
    },
    external: id => {
        return !id.startsWith('.') && !id.startsWith('/') && !id.startsWith('\0')
    },
    plugins: [
        json(),
        ts({
            typescript
        }),
        resolve(),
        commonjs()
    ]
}
