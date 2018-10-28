/// <reference path="..//types/index.d.ts" />

import * as cfonts from 'cfonts'
import log from './util/log'
import * as commander from 'commander'
import commands from './commands'

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
        command.options.forEach(option => {
            cmd.option(...option)
        })
    }

    if (command.action) {
        cmd.action(async (...args) => {
            try {
                await command.action(...args)
            } catch (err) {
                log.error(err.message || '')
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
