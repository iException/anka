import * as ankaDefaultConfig from './ankaDefaultConfig'
import resolveConfig from '../utils/resolveConfig'

export default {
    ...ankaDefaultConfig,
    ...resolveConfig(['anka.config.js', 'anka.config.json'])
}
