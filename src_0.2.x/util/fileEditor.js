import memFs from 'mem-fs'
import chokidar from 'chokidar'
import memFsEditor from 'mem-fs-editor'

const glob = require('glob')
const store = memFs.create()
const editor = memFsEditor.create(store)

export function copy (sourceFile, targetFile, context) {
    return editor.copyTpl(sourceFile, targetFile, context)
}

export function write (targetFile, content) {
    return editor.write(targetFile, content)
}

export function writeJSON (...args) {
    return editor.writeJSON(...args)
}

export function read (...args) {
    return editor.read(...args)
}

export function readJSON (...args) {
    return editor.readJSON(...args)
}

export function save () {
    return new Promise(resolve => {
        editor.commit(resolve)
    })
}

export function search (scheme, options = {}) {
    return new Promise((resolve, reject) => {
        glob(scheme, options, (err, files) => {
            if (err) {
                reject(err)
            } else {
                resolve(files)
            }
        })
    })
}

export function watch (dir, options = {}) {
    return chokidar.watch(dir, {
        persistent: true,
        ignoreInitial: true,
        ...options
    })
}
