import path from 'path'
import fs from 'fs-extra'
import system from '../config'

const appConfigFile = path.join(system.cwd, './src/app.json')
const customConfig = fs.existsSync(appConfigFile) ? require(appConfigFile) : {}

export const appConfig = Object.assign({
    pages: [],
    subPackages: [],
    window: {
        navigationBarTitleText: 'Wechat'
    }
    // tabBar: {
    //     list: []
    // },
}, customConfig)
