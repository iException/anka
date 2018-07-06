const chalk = require('chalk')

module.exports = {
    base (msg = '') {
        console.log(msg)
    },

    error (msg = '') {
        console.log(chalk.red(`[Error] ${msg}`))
    },

    info (msg = '') {
        console.log(chalk.cyan(`[Info] ${msg}`))
    },

    success (msg = '') {
        console.log(chalk.green(`[Success] ${msg}`))
    }
}