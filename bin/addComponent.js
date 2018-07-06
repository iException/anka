const fs = require('fs-extra')
const path = require('path')
const log = require('../lib/log')
const utils = require('../lib/utils')
const CONFIG = utils.genConfig()

module.exports = function (component, options) {
    const page = options.scope
    const componentPath = path.join(process.cwd(), CONFIG.components, component)
    const pagePath = path.join(process.cwd(), CONFIG.pages, page)
    const componentJsonPath = path.join(componentPath, `${component}.json`)
    const pageJsonPath = path.join(pagePath, `${page}.json`)
    Promise.all([
        fs.exists(componentJsonPath),
        fs.exists(pageJsonPath)
    ]).then(res => {
        const pageJson = JSON.parse(fs.readFileSync(pageJsonPath, {
            encoding: 'utf-8'
        }))
        const relativePath = path.relative(pagePath, componentPath)
        if (pageJson['usingComponents'][component]) {
            throw new Error(`component ${component} is registered!`)
        }
        if (pageJson['usingComponents'] === void(0)) {
            pageJson['usingComponents'] = {}
        }
        pageJson['usingComponents'][component] = relativePath
        return fs.writeFile(pageJsonPath, JSON.stringify(pageJson, null, 4))
    }).then(res => {
        log.success(`component ${component} registered!, page:
            ${pageJsonPath}
        `)
    }).catch(err => {
        log.error(err)
    })
}