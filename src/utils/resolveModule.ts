import log from './logger'

export default function (id: string, options?: { paths?: string[] }, silent?: boolean) {
    try {
        return require.resolve(id, options)
    } catch (err) {
        !silent && log.error('Missing dependency', id, err)
    }
}
