import {
    readFile
} from './fs'
import * as path from 'path'
import * as fs from 'fs-extra'
import File from '../core/class/File'

export function createFile (sourceFile: string): Promise<File> {
    return readFile(sourceFile).then(content => {
        return Promise.resolve(new File({
            sourceFile,
            content
        }))
    })
}

export function createFileSync (sourceFile: string) {
    const content = fs.readFileSync(sourceFile)
    return new File({
        sourceFile,
        content
    })
}
