import * as fs from 'fs'
import * as path from 'path'
import config  from '../config'
import * as utils from '../utils'
import { Command, Compiler } from '../core'
import { default as FsEditorConstructor } from '../utils/editor'

import {
    CommandOpts,
    CompilerConfig
} from '../../types/types'

const { logger, FsEditor } = utils

export default class EnrollComponentCommand extends Command {
    constructor () {
        super(
            'enroll <components...>',
            'Enroll a miniprogram component'
        )

        this.setExamples(
            '$ anka enroll button --global',
            '$ anka enroll /components/button/button --global',
            '$ anka enroll /components/button/button --page=/pages/index/index'
        )

        this.setOptions(
            '-p, --page <page>',
            'which page components enroll to'
        )

        this.setOptions(
            '-g, --global',
            'enroll components to app.json'
        )

        this.$compiler = new Compiler()
    }

    async action (components?: Array<string>, options?: CommandOpts.EnrollComponentCommandOpts) {
        const {
            page,
            global
        } = options
        const editor = new FsEditor()

        if (!global && !page) {
            logger.warn('Where components enroll to?')
            return
        }

        await Promise.all(components.map(component => {
            return this.enrollComponent(component, editor, global ? '' : page)
        }))

        logger.success('Done', 'Have a nice day 🎉 !')
    }

    async enrollComponent (component: string, editor: FsEditorConstructor, page?: string): Promise<void> {
        const {
            ankaConfig,
            projectConfig
        } = <CompilerConfig>config
        const CwdRegExp = new RegExp(`^${config.cwd}`)
        const componentPath = component.split(path.sep).length === 1 ?
            path.join(ankaConfig.components, component, component) :
            component
        const componentName = componentPath.split(path.sep).pop()
        const appConfigPath = path.join(config.srcDir, 'app.json')
        const componentAbsPath = path.join(config.srcDir, componentPath)

        if (!fs.existsSync(path.join(path.dirname(componentAbsPath), componentName + '.json'))) {
            logger.warn('Component dose not exists', componentAbsPath)
            return
        }

        if (page) {
            const pageAbsPath = path.join(config.srcDir, page)
            const pageJsonPath = path.join(path.dirname(pageAbsPath), path.basename(pageAbsPath) + '.json')
            if (!fs.existsSync(pageJsonPath)) {
                logger.warn('Page dose not exists', pageAbsPath)
                return
            }

            const pageJson = <any>JSON.parse(fs.readFileSync(pageJsonPath, {
                encoding: 'utf8'
            }) || '{}')

            this.ensureUsingComponents(pageJson)

            if (pageJson.usingComponents[componentName]) {
                logger.warn('Component already enrolled in', pageAbsPath)
                return
            }

            pageJson.usingComponents[componentName] = path.relative(path.dirname(pageAbsPath), componentAbsPath)
            editor.writeJSON(pageJsonPath, pageJson)
            await editor.save()

            logger.success(`Enroll ${componentPath} in`, pageAbsPath.replace(CwdRegExp, ''))
        } else {
            this.ensureUsingComponents(projectConfig)

            if (projectConfig.usingComponents[componentName]) {
                logger.warn('Component already enrolled in', 'app.json')
                return
            }

            projectConfig.usingComponents[componentName] = path.relative(path.dirname(appConfigPath), componentAbsPath)
            editor.writeJSON(appConfigPath, projectConfig)
            await editor.save()

            logger.success(`Enroll ${componentPath} in`, 'app.json')
        }

    }

    ensureUsingComponents (config: any) {
        if (!config.usingComponents) {
            config.usingComponents = {}
        }
    }
}
