import path from 'path'
import fs from 'fs-extra'
import {FILE_TYPES} from '../config/types'

export function copyFile (sourcePath, targetPath) {
    if (path.parse(targetPath).ext) {
        fs.ensureFileSync(targetPath)
    } else {
        fs.ensureDirSync(path.dirname(targetPath))
    }
    fs.copyFileSync(sourcePath, targetPath)
}

export function extractFileConfig (filePath) {
    let type = ''
    const ext = path.extname(filePath)
    const sourcePath = path.resolve(process.cwd(), filePath)

    if (/\.js$/.test(ext)) {
        type = FILE_TYPES.SCRIPT
    }

    // else if (/.wxml$/.test(ext)) {
    //     type = FILE_TYPES.TPL
    // }

    const fileConfig = {
        ext,
        type,
        sourcePath
    }
    return fileConfig
}


export function saveFile (targetPath, content) {
    fs.ensureFileSync(targetPath)
    fs.writeFileSync(targetPath, content, 'utf-8')
}
