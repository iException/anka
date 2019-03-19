import chalk from 'chalk'
import messager from './messager'

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
        return console.log([this.time, ...msg].join(' '))
    }

    error (title: string = '', msg: string = '', err?: Error) {
        if (err === void (0)) {
            err = new Error('')
        }
        err.message = chalk.hex('#333333').bgRedBright(` ${title.trim()} `) + ' ' + chalk.grey(msg) + '\r\n' + err.message
        messager.push(err)
    }

    info (title: string = '', msg: string = '') {
        messager.push(this.time + ' ' + chalk.reset(title) + ' ' + chalk.grey(msg))
    }

    warn (title: string = '', msg: string = '') {
        this.stopLoading()
        console.clear()
        this.log(chalk.hex('#333333').bgYellowBright(` ${title.trim()} `), chalk.grey(msg))
    }

    success (title: string = '', msg: string = '') {
        this.stopLoading()
        console.clear()
        this.log(chalk.hex('#333333').bgGreenBright(` ${title.trim()} `), chalk.grey(msg))
    }
}

export default new Logger()
