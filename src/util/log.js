import ora from 'ora'
import chalk from 'chalk'

function toFix (number) {
    return ('00' + number).slice(-2)
}

function getCurrentTime () {
    const now = new Date()
    return `${toFix(now.getHours())}:${toFix(now.getMinutes())}:${toFix(now.getSeconds())}`
}

export default {
    oraInstance: null,

    loading (msg) {
        this.oraInstance = ora(msg).start()
    },

    stop () {
        this.oraInstance && this.oraInstance.stop()
    },

    time () {
        return chalk.grey(`[${getCurrentTime()}]`)
    },

    log (...msg) {
        return console.log(this.time(), ...msg)
    },

    error (title = '', msg = '', err) {
        this.log(chalk.red('✘'), chalk.reset(title), chalk.grey(msg))
        console.log('\r\n', err)
    },

    info (title = '', msg) {
        this.log(chalk.cyan('○'), chalk.reset(title), chalk.grey(msg))
    },

    warn (title = '', msg = '') {
        this.log(chalk.yellow('⚠'), chalk.reset(title), chalk.grey(msg))
    },

    success (title = '', msg = '') {
        this.log(chalk.green('✔'), chalk.reset(title), chalk.grey(msg))
    }
}
