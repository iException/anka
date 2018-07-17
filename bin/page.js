const path = require('path')
const fs = require('fs-extra')
const log = require('../lib/log')
const utils = require('../lib/utils')
const CONTENT = require('../config/page')
const CONFIG = utils.genConfig()
const APP_CONFIG = utils.getAppConfig()

function generatePage (targetPath) {
    const pathArr = targetPath.split(path.sep)
    const name = pathArr.pop()
    const pagePath = pathArr.length === 0 ? targetPath : pathArr.join(path.sep)
    const dir = path.join(process.cwd(), CONFIG.pages, pagePath)
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
            reject(new Error(`页面 ${jsonFilePath} 已经存在`))
        }
    }).then(res => {
        return Promise.all([
            fs.outputFile(jsFilePath, CONTENT.js),
            fs.outputFile(jsonFilePath, CONTENT.json),
            fs.outputFile(wxmlFilePath, CONTENT.wxml),
            fs.outputFile(wxssFilePath, CONTENT.wxss)
        ])
    }).then(res => {
        log.success(`页面 ${targetPath} 创建成功 \r\n\tpath: ${jsonFilePath}`)
        APP_CONFIG['pages'].push(path.join(CONFIG.pages, ...pagePath.split(path.sep), name))
        return fs.writeFile(utils.appConfigPath, JSON.stringify(APP_CONFIG, null, 4))
    }).then(res => {
        log.success(`页面 ${targetPath} 注册成功`)
    }).catch(err => {
        log.error(err.message)
        console.log(err)
    })
}

module.exports = generatePage