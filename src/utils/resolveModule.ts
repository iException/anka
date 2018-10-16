import log from './logger'

export default function (id: string, options?: { paths?: string[] }) {
    try {
        return require.resolve(id, options)
    } catch (err) {
        log.error('Missing dependency', id[0], err)
    }
}
