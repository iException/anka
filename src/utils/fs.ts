import * as Glob from 'glob'
import * as fs from 'fs-extra'
const glob = require('glob')

import {
    Content
} from '../../types/types'


export function readFile (sourceFilePath: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        fs.readFile(sourceFilePath, (err, buffer) => {
            if (err) {
                reject(err)
            } else {
                resolve(buffer)
            }
        })
    })
}

export function writeFile (targetFilePath: string, content: Content): Promise<undefined> {
    return new Promise((resolve, reject) => {
        fs.writeFile(targetFilePath, content, err => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

export function searchFiles (scheme: string, options?: Glob.IOptions): Promise<string[]> {
    return new Promise((resolve, reject) => {
        glob(scheme, options, (err: (Error | null), files: Array<string>): void => {
            if (err) {
                reject(err)
            } else {
                resolve(files)
            }
        })
    })
}
