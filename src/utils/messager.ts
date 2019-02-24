import logger from './logger'

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
            logger.error('Error')
            console.error(err)
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
