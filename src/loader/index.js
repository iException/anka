import fs from 'fs-extra'
import sass from 'node-sass'
import postcss from 'postcss'
import system from '../config'
import postcssrc from 'postcss-load-config'
import postcssWxImport from './postcss-wximport'

const postcssConfig = {}

export default {
    sass ({ file, content }) {
        return sass.renderSync({
            file,
            data: content,
            outputStyle: system.devMode ? 'nested' : 'compressed'
        }).css
    },

    scss (content) {
        return this.sass(content)
    },

    async css ({ file, content }) {
        const config = await genPostcssConfig()
        const root = await postcss(config.plugins.concat([postcssWxImport])).process(content, {
            ...config.options,
            from: file
        })
        fs.writeFileSync(system.cwd + '/postcss-ast.json', JSON.stringify(root, null, 4), 'utf-8')
        return root.css
    }

    // less (content) {
    //     return content
    // },
    //
    // wxss (content) {
    //     return content
    // }
}

export function genPostcssConfig () {
    return postcssConfig.plugins ? Promise.resolve(postcssConfig) : postcssrc({}).then(config => {
        return Promise.resolve(Object.assign(postcssConfig, config))
    })
}
