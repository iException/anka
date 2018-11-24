import * as path from 'path'
import resolveConfig from '../utils/resolveConfig'
import * as ankaDefaultConfig from './ankaDefaultConfig'

import {
    AnkaConfig
} from '../../types/types'

const cwd = process.cwd()
const customConfig = <AnkaConfig>resolveConfig(['anka.config.js', 'anka.config.json'])

function mergeArray <T> (...arrs: Array<T[]>): Array<T> {
    return arrs.filter(arr => arr && arr.length).reduce((prev, next) => {
        return prev.concat(next)
    }, [])
}

export default {
    ...ankaDefaultConfig,
    ...customConfig,
    template: customConfig.template ? {
        page: path.join(cwd, customConfig.template.page),
        component: path.join(cwd, customConfig.template.component)
    } : ankaDefaultConfig.template,
    parsers: mergeArray(customConfig.parsers, ankaDefaultConfig.parsers),
    plugins: mergeArray(customConfig.plugins, ankaDefaultConfig.plugins),
    ignored: mergeArray(customConfig.ignored, ankaDefaultConfig.ignored)
}
