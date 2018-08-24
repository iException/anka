import path from 'path'
import log from '../util/log'
import commandInfo from '../util/commandInfo'
import ankaConfig from '../config/ankaConfig'
import * as fileEditor from '../util/fileEditor'

async function genComponent (targetComponent, options) {
    const pathArr = targetComponent.split(path.sep)
    const name = pathArr.pop()
    const componentPath = path.join(ankaConfig.components, pathArr.length === 0 ? targetComponent : pathArr.join(path.sep), name)
    const absolutePath = path.join(process.cwd(), './src', componentPath)
    const scriptFilePath = `${absolutePath}.js`
    const jsonFilePath = `${absolutePath}.json`
    const tplFilePath = `${absolutePath}.wxml`
    const styleFilePath = `${absolutePath}.wxss`
    const context = {
        name
    }

    fileEditor.copy(path.resolve(__dirname, '../template/component/index.js'), scriptFilePath, context)
    fileEditor.copy(path.resolve(__dirname, '../template/component/index.wxml'), tplFilePath, context)
    fileEditor.copy(path.resolve(__dirname, '../template/component/index.wxss'), styleFilePath, context)
    fileEditor.copy(path.resolve(__dirname, '../template/component/index.json'), jsonFilePath, context)

    await fileEditor.save()

    log.success('组件创建成功', absolutePath)
}

export default {
    command: 'component [componentName]',
    alias: '',
    usage: '[componentName]',
    description: '创建小程序组件',
    on: {
        '--help' () {
            console.log(commandInfo([
                {
                    group: 'component',
                    messages: ['创建小程序组件']
                }
            ]))
        }
    },
    async action (targetComponent, options) {
        await genComponent(targetComponent, options)
    }
}
