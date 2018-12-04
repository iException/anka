import * as fs from 'fs'
import * as path from 'path'
import config  from '../config'
import * as utils from '../utils'
import { Command, Compiler } from '../core'
import { default as FsEditorConstructor } from '../utils/editor'

import {
    CompilerConfig
} from '../../types/types'

const { logger, FsEditor } = utils

export type CreateComponentCommandOpts = {
    root: string
}

export default class CreateComponentCommand extends Command {
    constructor () {
        super(
            'new-cmpt <components...>',
            'Create a miniprogram component'
        )

        this.setExamples(
            '$ anka new-cmpt button',
            '$ anka new-cmpt /components/button/button',
            '$ anka new-cmpt /components/button/button --global'
        )

        this.setOptions(
            '-r, --root <subpackage>',
            'save component to subpackages'
        )

        this.$compiler = new Compiler()
    }

    async action (components?: Array<string>, options?: CreateComponentCommandOpts) {
        const {
            root
        } = options
        const editor = new FsEditor()

        await Promise.all(components.map(component => {
            return this.generateComponent(component, editor, root)
        }))

        logger.success('Done', 'Have a nice day 🎉 !')
    }

    async generateComponent (component: string, editor: FsEditorConstructor, root?: string): Promise<void> {
        const {
            ankaConfig,
            projectConfig
        } = <CompilerConfig>config
        const CwdRegExp = new RegExp(`^${config.cwd}`)
        const componentPath = component.split(path.sep).length === 1 ?
            path.join(ankaConfig.components, component, component) :
            component
        const componentName = path.basename(componentPath)
        const context = {
            componentName,
            time: new Date().toLocaleString()
        }
        const absolutePath = root ?
            path.join(config.srcDir, ankaConfig.subPackages, root, componentPath) :
            path.join(config.srcDir, componentPath)

        if (fs.existsSync(path.join(path.dirname(absolutePath), componentName + '.json'))) {
            logger.warn('The component already exists', absolutePath)
            return
        }

        const tpls = await utils.searchFiles(`${path.join(ankaConfig.template.component, '*.*')}`)

        tpls.forEach(tpl => {
            editor.copy(
                tpl,
                path.join(path.dirname(absolutePath), componentName + path.extname(tpl)),
                context
            )
        })

        await editor.save()

        logger.success('Create component', absolutePath.replace(CwdRegExp, ''))
    }
}
