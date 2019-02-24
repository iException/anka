import * as t from '../types'
import * as chokidar from 'chokidar'
import { Options as TemplateOptions } from 'ejs'
import { memFsEditor as MemFsEditor } from 'mem-fs-editor'
import * as fs from "fs-extra";
import {Content} from "./types";
import * as Glob from "glob";

export type logger = {
    oraInstance: any

    time: string

    startLoading(msg: string): void

    stopLoading(): void

    log(...msg: Array<string>): void

    error(title: string, msg: string, err?: Error): void

    info(title: string, msg: string): void

    warn(title: string, msg: string): void

    success(title: string, msg: string): void
}
export type FsEditor = {
    editor: MemFsEditor.Editor

    copy (from: string, to: string, context: object, templateOptions?: TemplateOptions, copyOptions?: MemFsEditor.CopyOptions): void

    write (filepath: string, contents: MemFsEditor.Contents): void

    writeJSON (filepath: string, contents: any, replacer?: MemFsEditor.ReplacerFunc, space?: MemFsEditor.Space): void

    read (filepath: string, options?: { raw: boolean, defaults: string }): string

    readJSON (filepath: string, defaults?: any): void

    save (): Promise<any>
}

export function createFile (sourceFile: string): Promise<t.File>
export function createFileSync (sourceFile: string): t.File
export function resolveModule (id: string, options?: { paths?: string[] }): string
export function resolveConfig (names: Array<string> , root?: string): Object
export function callPromiseInChain (list: Array<(...params: any[]) => Promise<any>>, ...params: Array<any>): Promise<void>
export function asyncFunctionWrapper (fn: Function): () => Promise<void>
export function genFileWatcher (dir: string | string[], options?: chokidar.WatchOptions): chokidar.FSWatcher
export function isNpmDependency (required: string): boolean
export function downloadRepo (repo: string, path: string): Promise<void>
export function readFile (sourceFilePath: string): Promise<Buffer>
export function writeFile (targetFilePath: string, content: Content): Promise<undefined>
export function searchFiles (scheme: string, options?: Glob.IOptions): Promise<string[]>

type utils = {
    logger: logger
    FsEditor: () => FsEditor
    readFile (sourceFilePath: string): Promise<Buffer>
    writeFile (targetFilePath: string, content: Content): Promise<undefined>
    searchFiles (scheme: string, options?: Glob.IOptions): Promise<string[]>
    createFile (sourceFile: string): Promise<t.File>
    createFileSync (sourceFile: string): t.File
    resolveModule (id: string, options?: { paths?: string[] }): string
    resolveConfig (names: Array<string> , root?: string): Object
    callPromiseInChain (list: Array<(...params: any[]) => Promise<any>>, ...params: Array<any>): Promise<void>
    asyncFunctionWrapper (fn: Function): () => Promise<void>
    genFileWatcher (dir: string | string[], options?: chokidar.WatchOptions): chokidar.FSWatcher
    isNpmDependency (required: string): boolean
    downloadRepo (repo: string, path: string): Promise<void>
}

export default utils
