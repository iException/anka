import path from 'path'
import fs from 'fs-extra'
import system from '../config'
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
    const basename = path.basename(filePath)
    const sourcePath = path.resolve(system.cwd, filePath)

    if (/\.js$/.test(ext)) {
        type = FILE_TYPES.SCRIPT
    } else if (/\.(wxml|html|xml)$/.test(ext)) {
        type = FILE_TYPES.TPL
    } else if (/\.(wxss|scss|sass|less|css)$/.test(ext)) {
        type = FILE_TYPES.STYLE
    } else if (/\.json/.test(ext)) {
        type = FILE_TYPES.JSON
    }

    const fileConfig = {
        type,
        sourcePath,
        ext: ext.replace(/^\./, ''),
        name: basename.replace(ext, '')
    }
    return fileConfig
}

export function saveFile (targetPath, content) {
    fs.ensureFileSync(targetPath)
    fs.writeFileSync(targetPath, content, 'utf-8')
}
