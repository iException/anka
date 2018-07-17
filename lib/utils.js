const fs = require('fs-extra')
const DEFAULT_CONFIG = require('../config/defaultConfig')

module.exports = {
    genConfig () {
        const configPath = `${process.cwd()}/anka.config.json`
        const customConfig = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, {
            encoding: 'utf-8'
        })) : {}

        return Object.assign(DEFAULT_CONFIG, customConfig)
    },

    getAppConfig () {
        const configPath = this.appConfigPath
        const appConfig = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, {
            encoding: 'utf-8'
        })) : {}
        return appConfig
    },

    get appConfigPath () {
        return `${process.cwd()}/app.json`
    }
}