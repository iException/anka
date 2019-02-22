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
        this.messages.forEach(console.error)
        this.messages = []
    },
    printInfo (): void {
        this.errors.forEach(console.log)
        this.errors = []
    }
}
