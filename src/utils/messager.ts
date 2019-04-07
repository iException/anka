import logger from './logger'
import ankaConfig from '../config/ankaConfig'

export class Messager {
    public errors: Array<Error> = []
    public messages: Array<Error | string> = []

    push (msg: Error | string): void {
        if (msg instanceof Error) {
            this.errors.push(msg)
        } else {
            this.messages.push(<string>msg)
        }
    }

    clear (): void {
        this.errors = []
        this.messages = []
    }

    hasError (): Boolean {
        return !!this.errors.length
    }

    printError (): void {
        logger.stopLoading()
        // console.clear()
        logger.error(`>>> ${this.errors.length} errors occurred`)
        console.log(this.errors.pop().message)
        this.errors.forEach((err: Error) => {
            console.error(err.message, '\r\n\r\n')
            ankaConfig.debug && console.log(err.stack)
        })
        this.errors = []
    }
    printInfo (): void {
        logger.stopLoading()
        this.messages.forEach((info: string) => {
            console.info(info)
        })

        this.messages = []
    }
}

export default new Messager()
