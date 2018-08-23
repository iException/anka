import path from 'path'
import fs from 'fs-extra'
import system from '../config'
import {FILE_TYPES} from '../config/types'

export function copyFile (src, dist) {
    if (path.parse(dist).ext) {
        fs.ensureFileSync(dist)
    } else {
        fs.ensureDirSync(path.dirname(dist))
    }
    fs.copyFileSync(src, dist)
}

export function extractFileConfig (filePath) {
    let type = ''
    const ext = path.extname(filePath)
    const basename = path.basename(filePath)
    const src = path.resolve(system.cwd, filePath)

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
        src,
        ext: ext.replace(/^\./, ''),
        name: basename.replace(ext, '')
    }
    return fileConfig
}

export function saveFile (dist, content) {
    fs.ensureFileSync(dist)
    fs.writeFileSync(dist, content, 'utf-8')
}
