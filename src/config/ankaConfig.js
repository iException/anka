import fs from 'fs-extra'
import path from 'path'

const ankaJsConfigPath = path.join(process.cwd(), 'anka.config.js')
const ankaJsonConfigPath = path.join(process.cwd(), 'anka.config.json')
const ankaConfig = {
    pages: './src/pages',
    components: './src/components'
}

if (fs.existsSync(ankaJsConfigPath)) {
    Object.assign(ankaConfig, require(ankaJsConfigPath))
} else if (fs.existsSync(ankaJsonConfigPath)) {
    Object.assign(ankaConfig, require(ankaJsonConfigPath))
}

export default ankaConfig