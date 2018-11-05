import * as ankaDefaultConfig from './ankaDefaultConfig'
import resolveConfig from '../utils/resolveConfig'

const customConfig = <AnkaConfig>resolveConfig(['anka.config.js', 'anka.config.json'])

export default {
    ...ankaDefaultConfig,
    ...customConfig,
    parsers: customConfig.parsers ? customConfig.parsers.concat(ankaDefaultConfig.parsers) : ankaDefaultConfig.parsers,
    plugins: ankaDefaultConfig.plugins.concat(customConfig.plugins || [])
}
