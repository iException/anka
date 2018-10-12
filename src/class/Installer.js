import npm from 'npm'
import fs from 'fs-extra'
import ncp from 'ncp'
import path from 'path'
import system from '../config/index'
import * as editor from '../util/fileEditor'
import ankaConfig from '../config/anka.config'

const ANKA_CONFIG = 'anka.config.json'
const COMPONENT_DIR = 'miniprogram_dist'

export default class Installer {
    constructor (packages) {
        this.packages = packages
        this.ankaModulesDir = path.join(system.cwd, ankaConfig.outputDir, ankaConfig.ankaModulesDir)
    }

    init () {
        fs.ensureDirSync(this.ankaModulesDir)

        return new Promise(resolve => {
            npm.load(error => {
                error ? process.exit(1) : resolve()
            })
        })
    }

    async install () {
        await this.init()
        return new Promise((resolve, reject) => {
            npm.commands.install(this.packages, (error, data) => {
                error ? reject(error) : resolve(data)
            })
        })
    }

    async uninstall () {
        await this.init()
        return new Promise((resolve, reject) => {
            npm.commands.uninstall(this.packages, (error, data) => {
                error ? reject(error) : resolve(data)
            })
        })
    }

    inject (paths) {
        return Promise.all(paths.map(item => {
            const pkgName = item[0].replace(/@(\d+\.?)+/, '')
            const componentPath = path.join(item[1])
            const dest = path.join(this.ankaModulesDir, pkgName)
            const pkg = editor.readJSON(path.join(system.cwd, 'package.json'), {})

            if (pkg && pkg.anka && pkg.anka.type === 'component') {
                fs.ensureDirSync(dest)
                ncp(`${componentPath}/*
                */*`, dest, function (err) {
                    if (err) {
                        throw err
                    }
                })
            }
        }))
    }
}
