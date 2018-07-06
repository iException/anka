#!/usr/bin/env node

const commander = require('commander')
const package = require('./package.json')
const initProject = require('./bin/init')
const generatePage = require('./bin/page')
const generateComponent = require('./bin/component')
const addComponent = require('./bin/addComponent')
const removeComponent = require('./bin/removeComponent')

commander
    .version(package.version, '-v, --version')
    .command('init')
    .description('initialize WeChat miniprogram project')
    .action(initProject)

commander
    .command('page [page-name]')
    .description('initialize WeChat miniprogram page')
    .action(generatePage)

commander
    .command('component [component-name]')
    .description('initialize WeChat miniprogram component')
    .action(generateComponent)

commander
    .command('add [component-name]')
    .option('s-, --scope [page-name]', 'Which page')
    .description('page that is going to register component')
    .action(addComponent)

commander
    .command('rm [component-name]')
    .option('s-, --scope [page-name]', 'Which page')
    .description('remove component from page')
    .action(removeComponent)

commander.parse(process.argv)