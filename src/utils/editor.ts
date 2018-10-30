import * as fs from 'fs-extra'
import * as glob from 'glob'
import { File } from '../core'

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
            if (err) throw err
            resolve()
        })
    })
}

export function searchFiles (scheme: string, options?: glob.IOptions): Promise<string[]> {
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
