import { logger } from './utils'
import commands from './commands'
import cfonts = require('cfonts')
import commander = require('commander')

const pkgJson = require('../package.json')

commander.version(pkgJson.version)
    .usage('<command> [options]')
    .option('-v', '--version', () => {
        console.log(pkgJson.version)
    })

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
        font: 'block'
    })
    commander.outputHelp()
}

commander.parse(process.argv)

export default Compiler
