import { Options as TemplateOptions } from 'ejs'
import { memFsEditor as MemFsEditor } from 'mem-fs-editor'

const memFs = require('mem-fs')
const memFsEditor = require('mem-fs-editor')

export default class FsEditor {
    editor: MemFsEditor.Editor
    constructor () {
        const store = memFs.create()

        this.editor = memFsEditor.create(store)
    }

    copy (from: string, to: string, context: object, templateOptions?: TemplateOptions, copyOptions?: MemFsEditor.CopyOptions): void {
        this.editor.copyTpl(from, to, context, templateOptions, copyOptions)
    }

    write (filepath: string, contents: MemFsEditor.Contents): void {
        this.editor.write(filepath, contents)
    }

    writeJSON (filepath: string, contents: any, replacer?: MemFsEditor.ReplacerFunc, space?: MemFsEditor.Space): void {
        this.editor.writeJSON(filepath, contents, replacer, space)
    }

    read (filepath: string, options?: { raw: boolean, defaults: string }): string {
        return this.editor.read(filepath, options)
    }

    readJSON (filepath: string, defaults?: any): void {
        this.editor.readJSON(filepath, defaults)
    }

    save (): Promise<any> {
        return new Promise(resolve => {
            this.editor.commit(resolve)
        })
    }
}
