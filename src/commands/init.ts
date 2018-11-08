import * as path from 'path'
import config from '../config'
import { downloadRepo, logger } from '../utils'
import { Command, Compiler } from '../core'

export type InitCommandOpts = {
    repo: string
}

export default class InitCommand extends Command {
    constructor () {
        super(
            'init <project-name>',
            'Initialize new project'
        )

        this.setExamples(
            '$ anka init',
            `$ anka init anka-in-action --repo=${config.defaultScaffold}`
        )

        this.setOptions(
            '-r, --repo',
            'template repository'
        )

        this.$compiler = new Compiler()
    }

    async action (projectName: string, options?: InitCommandOpts) {
        const project = path.resolve(config.cwd, projectName)
        const repo = options.repo || config.defaultScaffold

        logger.startLoading('Downloading template...')
        await downloadRepo(repo, project)
        logger.stopLoading()
        logger.success('Done', project)
    }
}
