import log from './logger'
import ankaConfig from '../config/ankaConfig'

export default function (id: string, options?: { paths?: string[] }): string {
    try {
        return require.resolve(id, options)
    } catch (err) {
        log.error('Compile', id, new Error(`Missing dependency ${id} in ${options.paths}`))
    }
}
