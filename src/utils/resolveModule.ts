import log from './logger'
import ankaConfig from '../config/ankaConfig'

export default function (id: string, options?: { paths?: string[] }) {
    try {
        return require.resolve(id, options)
    } catch (err) {
        log.error('Missing dependency', id, !ankaConfig.quiet ? `in ${options.paths}` : null)
    }
}
