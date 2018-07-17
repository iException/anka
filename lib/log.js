const chalk = require('chalk')

module.exports = {
    base (msg) {
        console.log('[Anka]', msg)
    },

    error (msg) {
        console.log(chalk.red(`[Error]`), chalk.reset(msg))
    },

    info (msg) {
        console.log(chalk.cyan(`[Info]`), chalk.reset(msg))
    },

    success (msg) {
        console.log(chalk.green(`[Success]`), chalk.reset(msg))
    }
}