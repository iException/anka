import * as path from 'path'
import * as fs from 'fs-extra'
import * as utils from '../utils'
import * as system from './systemConfig'
import ankaConfig from './ankaConfig'

const customConfig = utils.resolveConfig(['app.json'], system.srcDir)

export default Object.assign({
    pages: [],
    subPackages: [],
    window: {
        navigationBarTitleText: 'Wechat'
    }
    // tabBar: {
    //     list: []
    // },
}, customConfig)
