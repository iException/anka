const path = require('path')
const fs = require('fs-extra')
const log = require('../lib/log')
const inquirer = require('inquirer')
const CONFIG = require('../config')
const download = require('download-git-repo')

module.exports = function () {
    inquirer.prompt({
        name: 'currentPath',
        type: 'confirm',
        message: `是否在当前目录创建小程序？(${process.cwd()})`
    }).then((...currentPath) => {
        if (currentPath) {
            return new Promise((resolve, reject) => {
                log.base('downloading....')
                download(CONFIG.scaffold, './wxApp', { clone: true }, function(err) {
                    err ? reject(err) : resolve()
                })
            })
        } else {
            reject(new Error('已取消'))
        }
    }).then(res => {
        log.success('')
    }).catch(err => {
        console.log(err)
    })
}

