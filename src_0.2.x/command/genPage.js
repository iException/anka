import path from 'path'
import fs from 'fs-extra'
import log from '../util/log'
import commandInfo from '../util/commandInfo'
import ankaConfig from '../config/anka.config'
import { appConfig } from '../config/projectConfig'
import * as fileEditor from '../util/fileEditor'

async function genPage (targetPage, options) {
    const root = options.root
    const pathArr = targetPage.split(path.sep)
    const name = pathArr.pop()
    const pagePath = path.join(pathArr.length === 0 ? targetPage : pathArr.join(path.sep), name)
    const absolutePath = path.join(process.cwd(), ankaConfig.sourceDir, root || ankaConfig.pages, pagePath)
    const scriptFilePath = `${absolutePath}.js`
    const jsonFilePath = `${absolutePath}.json`
    const tplFilePath = `${absolutePath}.wxml`
    const styleFilePath = `${absolutePath}.wxss`
    const context = {
        name
    }

    if (fs.existsSync(scriptFilePath)) throw new Error(`页面已经存在 ${absolutePath}`)

    if (root) {
        const subPackage = appConfig.subPackages.find(pkg => {
            return pkg.root === root
        })
        if (subPackage) {
            subPackage.pages.includes(pagePath) && subPackage.pages.push(pagePath)
        } else {
            appConfig.subPackages.push({
                root,
                pages: [pagePath]
            })
        }
    } else {
        appConfig.pages.push(path.join(ankaConfig.pages, pagePath))
    }

    fileEditor.copy(path.resolve(__dirname, '../template/page/index.js'), scriptFilePath, context)
    fileEditor.copy(path.resolve(__dirname, '../template/page/index.wxml'), tplFilePath, context)
    fileEditor.copy(path.resolve(__dirname, '../template/page/index.wxss'), styleFilePath, context)
    fileEditor.copy(path.resolve(__dirname, '../template/page/index.json'), jsonFilePath, context)
    fileEditor.write(path.resolve(process.cwd(), ankaConfig.sourceDir, './app.json'), JSON.stringify(appConfig, null, 4))

    await fileEditor.save()

    log.success('创建页面', absolutePath)
    log.success('注册页面', absolutePath)
}

export default {
    command: 'page [targetPage]',
    alias: '',
    usage: '[targetPage]',
    description: '创建小程序页面',
    options: [
        ['--root [value]', '注册页面到subPackages']
    ],
    on: {
        '--help' () {
            console.log(commandInfo([
                {
                    group: 'page',
                    messages: ['创建小程序页面']
                }
            ]))
        }
    },
    async action (targetPage, options) {
        await genPage(targetPage, options)
    }
}
