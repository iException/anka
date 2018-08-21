import fs from 'fs-extra'
import log from '../util/log'
import ankaConfig from '../config/ankaConfig'
import downloadRepo from '../util/downloadRepe'

export default {
    command: 'init [projectName]',
    alias: '',
    usage: '[projectName]',
    description: '创建小程序页面',
    options: [
        ['--repo']
    ],
    on: {
        '--help' () {
            console.log(`
                init [project-name] 初始化项目
                --repo=[template-path]
            `)
        }
    },
    async action (projectName, options) {
        const repo = options.repe || ankaConfig.scaffold
        const exists = await fs.pathExists(projectName)

        if (exists) throw new Error(`${projectName}目录已存在`)
        log.loading('Downloading template...')
        await downloadRepo(repo, projectName)
        log.stop()
        log.success('创建成功', projectName)
    }
}
