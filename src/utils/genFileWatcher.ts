import * as chokidar from 'chokidar'

export default function (dir: string | string[], options?: chokidar.WatchOptions): chokidar.FSWatcher {
    return chokidar.watch(dir, {
        persistent: true,
        ignoreInitial: true,
        ...options
    })
}
