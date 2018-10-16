import log from './log'
import ankaConfig from '../config/anka.config'

export default function (...params) {
    try {
        return require.resolve(...params)
    } catch (err) {
        !ankaConfig.silent && log.error('Missing dependency', params[0], err)
    }
}
