#!/usr/bin/env node
import config from './config'
import * as semver from 'semver'
import { logger } from './utils'
import * as cfonts from 'cfonts'
import commands from './commands'
import Compiler from './core/class/Compiler'

const commander = require('commander')
const pkgJson = require('../package.json')

require('source-map-support').install()


if (!semver.satisfies(semver.clean(process.version), pkgJson.engines.node)) {
    logger.error('Required node version ' + pkgJson.engines.node)
    process.exit(1)
}

if (process.argv.indexOf('--debug') > -1) {
    config.ankaConfig.debug = true
}

if (process.argv.indexOf('--slient') > -1) {
    config.ankaConfig.quiet = true
}

commander
    .option('--debug', 'enable debug mode')
    .option('--quiet', 'hide compile log')
    .version(pkgJson.version)
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
        cmd.action(command.exec.bind(command))
    }

    if (command.examples) {
        cmd.on('--help', function () {
            command.printTitle('Examples:')
            command.examples.forEach(example => {
                command.printContent(example)
            })
        })
    }
})

if (process.argv.length === 2) {
    const Logo = cfonts.render('Anka', {
        font: 'simple',
        colors: ['greenBright']
    })

    console.log(Logo.string.replace(/(\s+)$/, ` ${pkgJson.version}\r\n`))
    commander.outputHelp()
}

commander.parse(process.argv)

export default Compiler
