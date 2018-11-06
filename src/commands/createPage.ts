import * as _ from 'lodash'
import * as path from 'path'
import config  from '../config'
import * as utils from '../utils'
import { Command, Compiler } from '../core'
import { default as FsEditorConstructor } from '../utils/editor'

const { logger, FsEditor } = utils

export type CreatePageCommandOpts = {
    root: string
}

export default class CreatePageCommand extends Command {
    constructor () {
        super(
            'new-page <pages...>',
            'Create a miniprogram page'
        )

        this.setExamples(
            '$ anka new-page index',
            '$ anka new-page /pages/index/index',
            '$ anka new-page /pages/index/index --root=packageA'
        )

        this.setOptions(
            '-r, --root <subpackage>',
            'save page to subpackages'
        )

        this.$compiler = new Compiler()
    }

    async action (pages?: Array<string>, options?: CreatePageCommandOpts) {
        const root = options.root
        const editor = new FsEditor()

        await Promise.all(pages.map(page => {
            return this.generatePage(page, editor, root)
        }))

        logger.success('Done', 'Have a nice day 🎉 !')
    }

    async generatePage (page: string, editor: FsEditorConstructor, root?: string): Promise<void> {
        const {
            ankaConfig,
            projectConfig
        } = <CompilerConfig>config
        const CwdRegExp = new RegExp(`^${config.cwd}`)
        const pagePath = page.split(path.sep).length === 1 ?
            path.join(ankaConfig.pages, page, page) : page
        const pageName = path.basename(pagePath)
        const context = {
            pageName
        }
        const appConfigPath = path.join(config.srcDir, 'app.json')
        let absolutePath = config.srcDir

        if (root) {
            const rootPath = path.join(ankaConfig.subPackages, root)
            const subPkg = projectConfig.subPackages.find((pkg: any) => pkg.root === rootPath)

            absolutePath = path.join(absolutePath, ankaConfig.subPackages, root, pagePath)

            if (subPkg) {
                if (subPkg.pages.includes(pagePath)) {
                    logger.warn('The page already exists', absolutePath)
                    return
                } else {
                    subPkg.pages.push(pagePath)
                }
            } else {
                projectConfig.subPackages.push({
                    root: rootPath,
                    pages: [pagePath]
                })
            }
        } else {
            absolutePath = path.join(absolutePath, pagePath)

            if (projectConfig.pages.includes(pagePath)) {
                logger.warn('The page already exists', absolutePath)
                return
            } else {
                projectConfig.pages.push(pagePath)
            }
        }

        const tpls = await utils.searchFiles(`${path.join(ankaConfig.template.page, '*.*')}`)

        tpls.forEach(tpl => {
            editor.copy(
                tpl,
                path.join(path.dirname(absolutePath), pageName + path.extname(tpl)),
                context
            )
        })
        editor.writeJSON(appConfigPath, projectConfig, null, 4)

        await editor.save()

        logger.success('Create page', absolutePath.replace(CwdRegExp, ''))
    }
}
