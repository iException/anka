export class Cache {
    constructor () {
        this.store = {}
    }

    remove (name) {
        delete this.store[name]
    }

    set (name, data) {
        this.store[name] = data
        return data
    }

    find (name) {
        return this.store[name]
    }

    list () {
        return Object.values(this.store)
    }
}

export const localDependenceCache = new Cache()
export const npmDependenceCache = new Cache()
