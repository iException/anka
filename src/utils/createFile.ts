import {
    readFile
} from './editor'
import * as path from 'path'
import * as fs from 'fs-extra'
import File from '../core/class/File'

export default function createFile (sourceFile: string): Promise<File> {
    return readFile(sourceFile).then(content => {
        return Promise.resolve(new File({
            sourceFile,
            content
        }))
    })
}
