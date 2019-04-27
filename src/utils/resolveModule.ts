import log from './logger'
import ankaConfig from '../config/ankaConfig'

const normalize = require('normalize-path')

export default function (id: string, options?: { paths?: string[] }): string {
    try {
        return normalize(require.resolve(id, options))
    } catch (err) {
        log.error('Compile', id, new Error(`Missing dependency ${id} in ${options.paths}`))
    }
}
