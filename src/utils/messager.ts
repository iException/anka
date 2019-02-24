import logger from './logger'
import ankaConfig from "../config/ankaConfig";

export default {
    errors: [],
    messages: [],
    push (msg: Object): void {
        if (msg instanceof Error) {
            this.errors.push(msg)
        } else {
            this.messages.push(msg)
        }
    },
    clear (): void {
        this.errors = []
        this.messages = []
    },
    hasError (): Boolean {
        return !!this.errors.length
    },
    printError (): void {
        console.clear()
        this.errors.forEach((err: Error) => {
            console.error(err.message)
            ankaConfig.debug && console.log(err.stack)
        })
        this.errors = []
    },
    printInfo (): void {
        this.messages.forEach((info: string) => {
            console.info(info)
        })

        this.messages = []
    }
}
