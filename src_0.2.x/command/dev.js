import fs from 'fs-extra'
import log from '../util/log'
import system from '../config'
import { ACTIONS } from '../config/types'
import { extractFileConfig } from '../util'
import * as editor from '../util/fileEditor'
import LocalDependence from '../class/LocalDependence'
import { localDependenceCache } from '../util/cache'

class DevCommand {
    addDependence (filePath) {
        const localDependence = new LocalDependence(filePath)
        if (!localDependenceCache.find(localDependence.src)) {
            localDependenceCache.set(localDependence.src, localDependence)
            localDependence.compile()
        }
    }

    unlinkDependence (filePath) {
        const fileConfig = extractFileConfig(filePath)
        const file = localDependenceCache.find(fileConfig.src)
        if (file) {
            file.unlinkFromDist()
            localDependenceCache.remove(fileConfig.src)
        }
    }

    async updateDependence (filePath) {
        const fileConfig = extractFileConfig(filePath)
        const file = localDependenceCache.find(fileConfig.src)
        if (file) {
            await file.compile()
        }
    }

    async run () {
        const files = await editor.search(`${system.srcDir}/**/*.*`)

        this.clean()

        files.forEach(filePath => {
            const localDependence = new LocalDependence(filePath)
            localDependenceCache.set(localDependence.src, localDependence)
        })

        const list = localDependenceCache.list()

        for (let index = 0; index < list.length; index++) {
            await list[index].compile()
        }

        this.watch()
    }

    clean () {
        fs.emptyDirSync(system.distDir)
    }

    watch () {
        const watcher = editor.watch(system.srcDir)
        watcher.on('add', this.addDependence.bind(this))
        watcher.on('unlink', this.unlinkDependence.bind(this))
        watcher.on('change', this.updateDependence.bind(this))
        watcher.on('ready', () => {
            log.success(ACTIONS.READY, system.srcDir)
        })
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
