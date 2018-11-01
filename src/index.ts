import { logger } from './utils'
import * as cfonts from 'cfonts'
import commands from './commands'
import * as commander from 'commander'
import Compiler from './core/class/Compiler'

const pkgJson = require('../package.json')

commander.version(pkgJson.version)
    .usage('<command> [options]')

commands.forEach(command => {
    const cmd = commander.command(command.command)

    if (command.description) {
        cmd.description(command.description)
    }

    if (command.usage) {
        cmd.usage(command.usage)
    }

    if (command.on) {
        for (let key in command.on) {
            cmd.on(key, command.on[key])
        }
    }

    if (command.options) {
        command.options.forEach((option: [any, any, any, any]) => {
            cmd.option(...option)
        })
    }

    if (command.action) {
        cmd.action(async (...args) => {
            try {
                await command.action(...args)
            } catch (err) {
                logger.error(err.message || '')
                console.log(err)
            }
        })
    }
})

if (process.argv.length === 2) {
    cfonts.say('Anka', {
        font: 'simple',
        colors: ['greenBright']
    })
    console.log('  v' + pkgJson.version)
    commander.outputHelp()
}

commander.parse(process.argv)

export default Compiler
