import path from 'path'
import log from '../util/log'
import File from '../class/File'
import * as editor from '../util/fileEditor'
import ScriptFile from '../class/ScriptFile'
// import TplFile from '../class/TplFile'
import genDependenceData from '../util/genDependenceData'
import { localFilesCache, npmFilesCache } from '../util/cache'
import { ACTIONS, FILE_TYPES } from '../config/types'
import { extractFileConfig } from '../util'

class DevCommand {
    addFile (filePath) {
        let file = null
        const fileConfig = extractFileConfig(filePath)
        if (fileConfig.type === FILE_TYPES.SCRIPT) {
            file = new ScriptFile(fileConfig)
        } else {
            file = new File(fileConfig)
        }
        localFilesCache.set(fileConfig.sourcePath, file)
        file.compile()

        // else if (fileConfig.type === FILE_TYPES.TPL) {
        //     this.files[fileConfig.sourcePath] = new TplFile(fileConfig)
        // }
    }

    unlinkFile (filePath) {
        const fileConfig = extractFileConfig(filePath)
        const file = localFilesCache.find(fileConfig.sourcePath)
        if (file) {
            file.unlinkFromDist()
            localFilesCache.remove(fileConfig.sourcePath)
        }
    }

    changeFile (filePath) {
        const fileConfig = extractFileConfig(filePath)
        const file = localFilesCache.find(fileConfig.sourcePath)
        if (file) {
            file.updateContent()
            file.compile()
        }
    }

    extractNpmDependencies (dependenceData) {
        const pkg = require(path.join(dependenceData.sourcePath, './package.json'))
        const dependencies = Object.keys(pkg.dependencies)
        dependencies.map(dependence => {
            const dependenceData = genDependenceData(dependence)
            npmFilesCache.set(dependence, dependenceData)
            if (!npmFilesCache.find(dependence)) {
                this.extractNpmDependencies(dependenceData)
            }
        })
    }

    run () {
        const dir = path.resolve(process.cwd(), './src/')
        const watcher = editor.watch(dir)

        watcher.on('add', this.addFile.bind(this))
        watcher.on('unlink', this.unlinkFile.bind(this))
        watcher.on('change', this.changeFile.bind(this))
        watcher.on('ready', () => {
            npmFilesCache.list().map(dependence => {
                this.extractNpmDependencies(dependence)
            })
            npmFilesCache.list().map(pkg => {
                pkg.move()
            })
            log.success(ACTIONS.READY, dir)
        })
    }

    clean () {
        // TODO
    }
}

export default {
    command: 'dev',
    alias: '',
    usage: '[projectName]',
    description: '开发模式',
    async action (...args) {
        const cmd = new DevCommand()
        await cmd.run(...args)
    }
}
