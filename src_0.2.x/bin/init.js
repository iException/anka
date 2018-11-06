const path = require('path')
const fs = require('fs-extra')
const log = require('../lib/log')
const inquirer = require('inquirer')
const CONFIG = require('../config')
const download = require('download-git-repo')

/**
 * Make directory depending on whether it is related to current path.
 */
function mkdir(isRelative) {
    let defaultPath = isRelative ? 'wxApp' : `${process.cwd()}/wxApp`
    inquirer.prompt({
        name: 'dirName',
        type: 'input',
        message: `请输入小程序目录名称:(${defaultPath})`,
        default: defaultPath
    }).then((res) => {
        let path = isRelative ? './' + res.dirName : res.dirName
        return new Promise((resolve, reject) => {
            if (fs.existsSync(path)) {
                reject('该目录已存在')
            } else {
                resolve(path)
            }
        })
    }).then(res => {
        return new Promise((resolve, reject) => {
            download(CONFIG.scaffold, res, { clone: true }, function(err) {
                err ? reject(err) : resolve()
            })
        })
    }).then(res => {
        log.base('directory created successfully!')
    }).catch(err => {
        console.log(err)
    })
}

module.exports = function () {
    inquirer.prompt({
        name: 'currentPath',
        type: 'confirm',
        message: `是否在当前目录创建小程序？(${process.cwd()})`
    }).then((res) => {
        mkdir(res.currentPath)
    }).catch(err => {
        console.log(err)
    })
}

