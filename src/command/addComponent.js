import path from 'path'
import fs from 'fs-extra'
import log from '../util/log'
import ankaConfig from '../config/ankaConfig'
import * as fileEditor from '../util/fileEditor'

async function genComponent (targetComponent, options) {
    const page = options.page
    const pathArr = targetComponent.split(path.sep)
    const name = pathArr.pop()
    const componentPath = path.join(ankaConfig.components, pathArr.length === 0 ? targetComponent : pathArr.join(path.sep), name)
    const absolutePath = path.join(process.cwd(), './src', componentPath)
    const jsonFilePath = `${absolutePath}.json`
    const pageJsonPath = path.join(process.cwd(), './src', `${page}.json`)

    if (!fs.existsSync(pageJsonPath)) throw new Error(`页面不存在 ${pageJsonPath}`)
    if (!fs.existsSync(jsonFilePath)) throw new Error(`组件不存在 ${jsonFilePath}`)

    const pageConfig = fileEditor.readJSON(pageJsonPath)
    if (!pageConfig.usingComponents) {
        pageConfig.usingComponents = {}
    }
    if (!pageConfig.usingComponents[name]) {
        pageConfig.usingComponents[name] = path.join('/', componentPath)
    } else {
        throw new Error(`组件已经注册 ${componentPath}`)
    }
    fileEditor.writeJSON(pageJsonPath, pageConfig, null, 4)
    await fileEditor.save()

    log.success('组件注册成功', absolutePath)
}

export default {
    command: 'add [componentName]',
    alias: '',
    options: [
        ['--page [value]', 'eg: anka add [componentName] --page=pages/index/index']
    ],
    usage: '[componentName]',
    description: '注册组件',
    async action (targetComponent, options) {
        await genComponent(targetComponent, options)
    }
}