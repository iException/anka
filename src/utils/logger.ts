import chalk from 'chalk'
const ora = require('ora')

export function toFix (number: number): string {
    return ('00' + number).slice(-2)
}

export function getCurrentTime (): string {
    const now = new Date()
    return `${toFix(now.getHours())}:${toFix(now.getMinutes())}:${toFix(now.getSeconds())}`
}

export class Logger {
    oraInstance: any

    get time () {
        return chalk.grey(`[${getCurrentTime()}]`)
    }

    startLoading (msg: string) {
        this.oraInstance = ora(msg).start()
    }

    stopLoading () {
        this.oraInstance && this.oraInstance.stop()
    }

    log (...msg: Array<string>) {
        return console.log(this.time, ...msg)
    }

    error (title: string = '', msg: string = '', err: Error) {
        this.log(chalk.red('✘'), chalk.reset(title), chalk.grey(msg))
        console.error(err)
    }

    info (title: string = '', msg: string = '') {
        this.log(chalk.cyan('○'), chalk.reset(title), chalk.grey(msg))
    }

    warn (title: string = '', msg: string = '') {
        this.log(chalk.yellow('⚠'), chalk.reset(title), chalk.grey(msg))
    }

    success (title: string = '', msg: string = '') {
        this.log(chalk.green('✔'), chalk.reset(title), chalk.grey(msg))
    }
}

export default new Logger()
