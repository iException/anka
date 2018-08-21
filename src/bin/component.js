const path = require('path')
const fs = require('fs-extra')
const log = require('../lib/log')
const utils = require('../lib/utils')
const CONTENT = require('../config/component')
const CONFIG = utils.genConfig()

function generateComponent (targetPath) {
    const pathArr = targetPath.split(path.sep)
    const name = pathArr.pop()
    const componentPath = pathArr.length === 0 ? targetPath : pathArr.join(path.sep)
    const dir = path.join(process.cwd(), CONFIG.components, componentPath)
    const jsFilePath = path.join(dir, `${name}.js`)
    const jsonFilePath = path.join(dir, `${name}.json`)
    const wxmlFilePath = path.join(dir, `${name}.wxml`)
    const wxssFilePath = path.join(dir, `${name}.wxss`)

    new Promise((resolve, reject) => {
        if (!fs.existsSync(jsonFilePath)) {
            fs.ensureDir(dir).then(res => {
                resolve()
            }).catch(err => {
                reject(err)
            })
        } else {
            reject(new Error(`组件 ${jsonFilePath} 已经存在`))
        }
    }).then(() => {
        return Promise.all([
            fs.outputFile(jsFilePath, CONTENT.js),
            fs.outputFile(jsonFilePath, CONTENT.json),
            fs.outputFile(wxmlFilePath, CONTENT.wxml),
            fs.outputFile(wxssFilePath, CONTENT.wxss)
        ])
    }).then(res => {
        log.success(`组件 ${targetPath} 创建成功 \r\n\tpath: ${jsonFilePath}`)
    }).catch(err => {
        log.error(err.message)
        console.log(err)
    })
}

module.exports = generateComponent