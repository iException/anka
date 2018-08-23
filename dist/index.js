#!/usr/bin/env node
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var ora = _interopDefault(require('ora'));
var chalk = _interopDefault(require('chalk'));
var path = _interopDefault(require('path'));
var fs = _interopDefault(require('fs-extra'));
var glob = _interopDefault(require('glob'));
var memFs = _interopDefault(require('mem-fs'));
var chokidar = _interopDefault(require('chokidar'));
var memFsEditor = _interopDefault(require('mem-fs-editor'));
var babel = _interopDefault(require('babel-core'));
var traverse = _interopDefault(require('babel-traverse'));
require('fs');
var postcss = _interopDefault(require('postcss'));
var sass = _interopDefault(require('node-sass'));
var postcssrc = _interopDefault(require('postcss-load-config'));
var download = _interopDefault(require('download-git-repo'));
var cfonts = _interopDefault(require('cfonts'));
var commander = _interopDefault(require('commander'));

function toFix(number) {
    return ('00' + number).slice(-2);
}

function getCurrentTime() {
    const now = new Date();
    return `${toFix(now.getHours())}:${toFix(now.getMinutes())}:${toFix(now.getSeconds())}`;
}

var log = {
    oraInstance: null,

    loading(msg) {
        this.oraInstance = ora(msg).start();
    },

    stop() {
        this.oraInstance && this.oraInstance.stop();
    },

    time() {
        return chalk.grey(`[${getCurrentTime()}]`);
    },

    log(...msg) {
        return console.log(this.time(), ...msg);
    },

    error(title = '', msg = '', err) {
        this.log(chalk.red('✘'), chalk.reset(title), chalk.grey(msg));
        console.log('\r\n', err);
    },

    info(title = '', msg) {
        this.log(chalk.cyan('○'), chalk.reset(title), chalk.grey(msg));
    },

    warn(title = '', msg = '') {
        this.log(chalk.yellow('⚠'), chalk.reset(title), chalk.grey(msg));
    },

    success(title = '', msg = '') {
        this.log(chalk.green('✔'), chalk.reset(title), chalk.grey(msg));
    }
};

const cwd = process.cwd();

var system = {
    // 开发模式
    cwd,
    devMode: true,
    srcDir: path.resolve(cwd, 'src'),
    distDir: path.resolve(cwd, 'dist'),
    distNodeModules: './dist/npm_modules',
    sourceNodeModules: './node_modules',
    scaffold: 'github:iException/mini-program-scaffold'
};

const FILE_TYPES = {
    STYLE: 'style',
    SCRIPT: 'script',
    TPL: 'tpl',
    JSON: 'json',
    UNKNOWN: 'unknown'
};

const ACTIONS = {
    COMPILE: '编译',
    WATCH: '监听',
    REMOVE: '移除',
    READY: '就绪',
    COPY: '拷贝'
};

function copyFile(src, dist) {
    if (path.parse(dist).ext) {
        fs.ensureFileSync(dist);
    } else {
        fs.ensureDirSync(path.dirname(dist));
    }
    fs.copyFileSync(src, dist);
}

function extractFileConfig(filePath) {
    let type = '';
    const ext = path.extname(filePath);
    const basename = path.basename(filePath);
    const src = path.resolve(system.cwd, filePath);

    if (/\.js$/.test(ext)) {
        type = FILE_TYPES.SCRIPT;
    } else if (/\.(wxml|html|xml)$/.test(ext)) {
        type = FILE_TYPES.TPL;
    } else if (/\.(wxss|scss|sass|less|css)$/.test(ext)) {
        type = FILE_TYPES.STYLE;
    } else if (/\.json/.test(ext)) {
        type = FILE_TYPES.JSON;
    }

    const fileConfig = {
        type,
        src,
        ext: ext.replace(/^\./, ''),
        name: basename.replace(ext, '')
    };
    return fileConfig;
}

function saveFile(dist, content) {
    fs.ensureFileSync(dist);
    fs.writeFileSync(dist, content, 'utf-8');
}

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

const store = memFs.create();
const editor = memFsEditor.create(store);

function copy(sourceFile, targetFile, context) {
    return editor.copyTpl(sourceFile, targetFile, context);
}

function write(targetFile, content) {
    return editor.write(targetFile, content);
}

function writeJSON(...args) {
    return editor.writeJSON(...args);
}

function readJSON(...args) {
    return editor.readJSON(...args);
}

function save() {
    return new Promise(resolve => {
        editor.commit(resolve);
    });
}

function search(scheme, options = {}) {
    return new Promise((resolve, reject) => {
        glob(scheme, options, (err, files) => {
            if (err) {
                reject(err);
            } else {
                resolve(files);
            }
        });
    });
}

function watch(dir, options = {}) {
    return chokidar.watch(dir, _extends({
        persistent: true,
        ignoreInitial: true
    }, options));
}

class Dependence {
    isNpmDependence(dependence) {
        if (/^(@|[A-Za-z0-1])/.test(dependence)) {
            const dependencePath = path.resolve(system.cwd, system.sourceNodeModules, dependence);
            if (fs.existsSync(dependencePath)) {
                return true;
            }
        }
    }

    isLocalDependence(dependence) {
        return (/^[/|.|\\]/.test(dependence)
        );
    }
}

class File extends Dependence {
    constructor(src) {
        super();
        const ext = path.extname(src);
        this.ext = ext.replace(/^\./, '');
        this.basename = path.basename(src);
        this.name = this.basename.replace(ext, '');
        this.src = path.resolve(system.cwd, src);
        this.originalContent = '';
        this.compiledContent = '';
        this.dist = src.replace(system.srcDir, system.distDir);
        this.distDir = path.dirname(this.dist);
    }

    unlinkFromDist() {
        fs.unlinkSync(this.dist);
        log.info(ACTIONS.REMOVE, this.dist);
    }

    updateContent() {
        this.originalContent = fs.readFileSync(this.src);
    }

    save() {
        if (!this.src || !this.compiledContent || !this.dist) return;
        saveFile(this.dist, this.compiledContent);
    }
}

const ankaJsConfigPath = path.join(process.cwd(), 'anka.config.js');
const ankaJsonConfigPath = path.join(process.cwd(), 'anka.config.json');
const ankaConfig = {
    pages: './src/pages',
    components: './src/components'
};

if (fs.existsSync(ankaJsConfigPath)) {
    Object.assign(ankaConfig, require(ankaJsConfigPath));
} else if (fs.existsSync(ankaJsonConfigPath)) {
    Object.assign(ankaConfig, require(ankaJsonConfigPath));
}

class Cache {
    constructor() {
        this.store = {};
    }

    remove(name) {
        delete this.store[name];
    }

    set(name, data) {
        this.store[name] = data;
        return data;
    }

    find(name) {
        return this.store[name];
    }

    list() {
        return Object.values(this.store);
    }
}

const localDependenceCache = new Cache();
const npmDependenceCache = new Cache();

const cwd$1 = system.cwd;

class NpmDependence extends Dependence {
    constructor(dependence) {
        super();
        this.localDependencies = {};
        this.npmDependencies = {};
        this.name = dependence;
        this.src = path.resolve(cwd$1, system.sourceNodeModules, dependence);
        this.dist = path.resolve(cwd$1, system.distNodeModules, dependence);
        this.pkgInfo = Object.assign({
            main: 'index.js'
        }, require(path.join(this.src, './package.json')));
        this.main = this.resolveLocalDependence(this.name);
    }

    /**
     * 提取 npm 包内部的所有依赖
     * @param {string} filePath 依赖文件的绝对路径
     */
    traverse(filePath) {
        if (this.localDependencies[filePath]) return;
        const { ast } = babel.transformFileSync(filePath, {
            ast: true,
            babelrc: false
        });
        traverse(ast, {
            enter: astNode => {
                const node = astNode.node;
                if (astNode.isImportDeclaration()) {
                    const dependence = node.source.value;
                    if (this.isLocalDependence(dependence)) {
                        this.traverse(this.resolveLocalDependence(dependence, filePath));
                    } else if (this.isNpmDependence(dependence)) {
                        const npmDependence = new NpmDependence(dependence);

                        node.source.value = this.resolveNpmDependence(npmDependence, filePath);
                    }
                } else if (astNode.isCallExpression() && node.callee.name === 'require' && node.arguments[0] && node.arguments[0].value) {
                    const dependence = node.arguments[0].value;
                    if (this.isLocalDependence(dependence)) {
                        this.traverse(this.resolveLocalDependence(dependence, filePath));
                    } else if (this.isNpmDependence(dependence)) {
                        const npmDependence = new NpmDependence(dependence);
                        node.arguments[0].value = this.resolveNpmDependence(npmDependence, filePath);
                    }
                }
            }
        });
        this.localDependencies[filePath] = {
            ast,
            filePath
        };
    }

    /**
     * 将该 npm 模块从 node_modules 移到 system.distNodeModules
     */
    compile() {
        this.traverse(this.main);
        Object.values(this.localDependencies).map(localDependence => {
            const filePath = localDependence.filePath;
            const dist = filePath.replace(this.src, this.dist);
            const { code } = babel.transformFromAst(localDependence.ast);
            saveFile(dist, code);
        });
        this.updateNpmDependenceCache();
        log.info(ACTIONS.COMPILE, this.src);
    }

    /**
     * 根据依赖名或者相对路径获取依赖的绝对路径，eg: ./index => /A/B/index.js
     * @param localDependence
     * @param filePath
     * @returns {string}
     */
    resolveLocalDependence(localDependence = '', filePath = this.src) {
        if (path.parse(filePath).ext) {
            filePath = path.dirname(filePath);
        }
        return require.resolve(localDependence, {
            paths: [filePath]
        });
    }

    resolveNpmDependence(npmDependence, filePath = this.main) {
        this.npmDependencies[npmDependence.name] = npmDependence;
        return path.join(path.relative(path.dirname(filePath), npmDependence.src), npmDependence.pkgInfo.main);
    }

    updateNpmDependenceCache() {
        Object.values(this.npmDependencies).forEach(npmDependence => {
            if (!npmDependenceCache.find(npmDependence.name)) {
                npmDependenceCache.set(npmDependence.name, npmDependence);
                npmDependence.compile();
            }
        });
    }
}

class ScriptFile extends File {
    constructor(fileConfig) {
        super(fileConfig);
        this.type = FILE_TYPES.SCRIPT;
        this.localDependencies = {};
        this.npmDependencies = {};
    }

    compile() {
        this.traverse();
        this.compiledContent = babel.transformFromAst(this.$ast).code;
        this.updateNpmDependenceCache();
        this.save();
        log.info(ACTIONS.COMPILE, this.src);
    }

    traverse() {
        this.updateContent();
        this.$ast = babel.transform(this.originalContent, {
            ast: true,
            babelrc: false
        }).ast;

        traverse(this.$ast, {
            enter: astNode => {
                const node = astNode.node;
                if (astNode.isImportDeclaration()) {
                    const dependence = node.source.value;
                    if (this.isNpmDependence(dependence)) {
                        const npmDependence = new NpmDependence(dependence);
                        node.source.value = this.resolveNpmDependence(npmDependence);
                    } else if (this.isLocalDependence(dependence)) {
                        this.resolveLocalDependence(dependence);
                    }
                } else if (astNode.isCallExpression() && node.callee.name === 'require' && node.arguments[0] && node.arguments[0].value) {
                    const dependence = node.arguments[0].value;
                    if (this.isNpmDependence(dependence)) {
                        const npmDependence = new NpmDependence(dependence);
                        node.arguments[0].value = this.resolveNpmDependence(npmDependence);
                    } else if (this.isLocalDependence(dependence)) {
                        this.resolveLocalDependence(dependence);
                    }
                }
            }
        });
    }

    resolveNpmDependence(npmDependence) {
        this.npmDependencies[npmDependence.name] = npmDependence;
        return path.join(path.relative(this.distDir, npmDependence.dist), npmDependence.pkgInfo.main);
    }

    resolveLocalDependence(localDependence) {
        this.localDependencies[localDependence.dist] = localDependence;
    }

    updateNpmDependenceCache() {
        Object.values(this.npmDependencies).forEach(npmDependence => {
            if (!npmDependenceCache.find(npmDependence.name)) {
                npmDependenceCache.set(npmDependence.name, npmDependence);
                npmDependence.compile();
            }
        });
    }
}

var postcssWxImport = postcss.plugin('postcss-wximport', () => {
    return root => {
        root.walkAtRules('wximport', rule => {
            rule.name = 'import';
            rule.params = rule.params.replace(/\.\w+(?=['"]$)/, '.wxss');
        });
    };
});

const postcssConfig = {};

var loader = {
    sass({ file, content }) {
        return sass.renderSync({
            file,
            data: content,
            outputStyle: 'nested'
        }).css;
    },

    scss(content) {
        return this.sass(content);
    },

    async css({ file, content }) {
        const config = await genPostcssConfig();
        const root = await postcss(config.plugins.concat([postcssWxImport])).process(content, _extends({}, config.options, {
            from: file
        }));
        fs.writeFileSync(system.cwd + '/postcss-ast.json', JSON.stringify(root, null, 4), 'utf-8');
        return root.css;
    }

    // less (content) {
    //     return content
    // },
    //
    // wxss (content) {
    //     return content
    // }
};

function genPostcssConfig() {
    return postcssConfig.plugins ? Promise.resolve(postcssConfig) : postcssrc({}).then(config => {
        return Promise.resolve(Object.assign(postcssConfig, config));
    });
}

class StyleFile extends File {
    constructor(src) {
        super(src);
        this.type = FILE_TYPES.STYLE;
        this.dist = path.join(this.distDir, `${this.name}.wxss`);
    }

    async compile() {
        const parser = loader[this.ext];
        if (parser) {
            try {
                this.updateContent();
                this.compiledContent = await loader[this.ext]({
                    file: this.src,
                    content: this.originalContent.toString('utf8')
                });
                this.save();
                log.info(ACTIONS.COMPILE, this.src);
            } catch (err) {
                log.error(ACTIONS.COMPILE, this.src, err.formatted || err);
            }
        } else {
            copyFile(this.src, this.dist);
            log.info(ACTIONS.COPY, this.src);
        }
    }
}

class UnknownFile extends File {
    constructor(src) {
        super(src);
        this.type = FILE_TYPES.UNKNOWN;
    }

    /**
     * 未知类型文件直接使用拷贝
     */
    compile() {
        log.info(ACTIONS.COPY, this.src);
        copyFile(this.src, this.dist);
    }
}

class LocalDependence {
    constructor(src) {
        const fileConfig = extractFileConfig(src);

        switch (fileConfig.type) {
            case FILE_TYPES.SCRIPT:
                this.file = new ScriptFile(src);
                break;
            case FILE_TYPES.STYLE:
                this.file = new StyleFile(src);
                break;
            default:
                this.file = new UnknownFile(src);
                break;
        }
    }

    updateContent() {
        this.file.updateContent();
    }

    async compile() {
        await this.file.compile();
    }

    get type() {
        return this.file.type;
    }

    get src() {
        return this.file.src;
    }

    get dist() {
        return this.file.dist;
    }
}

class DevCommand {
    addDependence(filePath) {
        const localDependence = new LocalDependence(filePath);
        if (!localDependenceCache.find(localDependence.src)) {
            localDependenceCache.set(localDependence.src, localDependence);
            localDependence.compile();
        }
    }

    unlinkDependence(filePath) {
        const fileConfig = extractFileConfig(filePath);
        const file = localDependenceCache.find(fileConfig.src);
        if (file) {
            file.unlinkFromDist();
            localDependenceCache.remove(fileConfig.src);
        }
    }

    async updateDependence(filePath) {
        const fileConfig = extractFileConfig(filePath);
        const file = localDependenceCache.find(fileConfig.src);
        if (file) {
            await file.compile();
        }
    }

    async run() {
        const files = await search(`${system.srcDir}/**/*.*`);

        this.clean();

        files.forEach(filePath => {
            const localDependence = new LocalDependence(filePath);
            localDependenceCache.set(localDependence.src, localDependence);
        });

        const list = localDependenceCache.list();

        for (let index = 0; index < list.length; index++) {
            await list[index].compile();
        }

        this.watch();
    }

    clean() {
        fs.emptyDirSync(system.distDir);
    }

    watch() {
        const watcher = watch(system.srcDir);
        watcher.on('add', this.addDependence.bind(this));
        watcher.on('unlink', this.unlinkDependence.bind(this));
        watcher.on('change', this.updateDependence.bind(this));
        watcher.on('ready', () => {
            log.success(ACTIONS.READY, system.srcDir);
        });
    }
}

var dev = {
    command: 'dev',
    alias: '',
    usage: '[projectName]',
    description: '开发模式',
    async action(...args) {
        const cmd = new DevCommand();
        await cmd.run(...args);
    }
};

function downloadRepo (repo, path$$1) {
    return new Promise((resolve, reject) => {
        download(repo, path$$1, { clone: true }, err => {
            err ? reject(err) : resolve();
        });
    });
}

var init = {
    command: 'init [projectName]',
    alias: '',
    usage: '[projectName]',
    description: '创建小程序页面',
    options: [['--repo']],
    on: {
        '--help'() {
            console.log(`
                init [project-name] 初始化项目
                --repo=[template-path]
            `);
        }
    },
    async action(projectName, options) {
        const repo = options.repe || ankaConfig.scaffold;
        const exists = await fs.pathExists(projectName);

        if (exists) throw new Error(`${projectName}目录已存在`);
        log.loading('Downloading template...');
        await downloadRepo(repo, projectName);
        log.stop();
        log.success('创建成功', projectName);
    }
};

class BuildCommand {
    addDependence(filePath) {
        const localDependence = new LocalDependence(filePath);
        if (!localDependenceCache.find(localDependence.src)) {
            localDependenceCache.set(localDependence.src, localDependence);
            localDependence.compile();
        }
    }

    unlinkDependence(filePath) {
        const fileConfig = extractFileConfig(filePath);
        const file = localDependenceCache.find(fileConfig.src);
        if (file) {
            file.unlinkFromDist();
            localDependenceCache.remove(fileConfig.src);
        }
    }

    async updateDependence(filePath) {
        const fileConfig = extractFileConfig(filePath);
        const file = localDependenceCache.find(fileConfig.src);
        if (file) {
            await file.compile();
        }
    }

    async run() {
        const files = await search(`${system.srcDir}/**/*.*`);

        this.clean();

        files.forEach(filePath => {
            const localDependence = new LocalDependence(filePath);
            localDependenceCache.set(localDependence.src, localDependence);
        });

        localDependenceCache.list().forEach(localDependence => localDependence.compile());
    }

    clean() {
        fs.emptyDirSync(system.distDir);
    }

    watch() {
        const watcher = watch(system.srcDir);
        watcher.on('add', this.addDependence.bind(this));
        watcher.on('unlink', this.unlinkDependence.bind(this));
        watcher.on('change', this.updateDependence.bind(this));
        watcher.on('ready', () => {
            log.success(ACTIONS.READY, system.srcDir);
        });
    }
}

var build = {
    command: 'build',
    alias: '',
    usage: '[projectName]',
    description: '构建模式',
    async action(...args) {
        const cmd = new BuildCommand();
        await cmd.run(...args);
    }
};

const space = '  ';

function commandInfo (infos = []) {
    return `${space}Information:\r\n\r\n` + infos.map(info => {
        return space.repeat(2) + info.group + '\r\n' + info.messages.map(m => space.repeat(3) + m + '\r\n').join('\r\n');
    }).join('\r\n');
}

const appConfig = Object.assign({
    pages: [],
    subPackages: [],
    window: {
        navigationBarTitleText: 'Wechat'
        // tabBar: {
        //     list: []
        // },
    } }, require(path.join(process.cwd(), './src/app.json')));

async function genPage(targetPage, options) {
    const root = options.root;
    const pathArr = targetPage.split(path.sep);
    const name = pathArr.pop();
    const pagePath = path.join(pathArr.length === 0 ? targetPage : pathArr.join(path.sep), name);
    const absolutePath = path.join(process.cwd(), './src', root || ankaConfig.pages, pagePath);
    const scriptFilePath = `${absolutePath}.js`;
    const jsonFilePath = `${absolutePath}.json`;
    const tplFilePath = `${absolutePath}.wxml`;
    const styleFilePath = `${absolutePath}.wxss`;
    const context = {
        name
    };

    if (fs.existsSync(scriptFilePath)) throw new Error(`页面已经存在 ${absolutePath}`);

    if (root) {
        const subPackage = appConfig.subPackages.find(pkg => {
            return pkg.root === root;
        });
        if (subPackage) {
            subPackage.pages.includes(pagePath) && subPackage.pages.push(pagePath);
        } else {
            appConfig.subPackages.push({
                root,
                pages: [pagePath]
            });
        }
    } else {
        appConfig.pages.push(path.join(ankaConfig.pages, pagePath));
    }

    copy(path.resolve(__dirname, '../template/page/index.js'), scriptFilePath, context);
    copy(path.resolve(__dirname, '../template/page/index.wxml'), tplFilePath, context);
    copy(path.resolve(__dirname, '../template/page/index.wxss'), styleFilePath, context);
    copy(path.resolve(__dirname, '../template/page/index.json'), jsonFilePath, context);
    write(path.resolve(process.cwd(), './src/app.json'), JSON.stringify(appConfig, null, 4));

    await save();

    log.success('创建页面', absolutePath);
    log.success('注册页面', absolutePath);
}

var genPage$1 = {
    command: 'page [targetPage]',
    alias: '',
    usage: '[targetPage]',
    description: '创建小程序页面',
    options: [['--root [value]', '注册页面到subPackages']],
    on: {
        '--help'() {
            console.log(commandInfo([{
                group: 'page',
                messages: ['创建小程序页面']
            }]));
        }
    },
    async action(targetPage, options) {
        await genPage(targetPage, options);
    }
};

async function genComponent(targetComponent, options) {
    const pathArr = targetComponent.split(path.sep);
    const name = pathArr.pop();
    const componentPath = path.join(ankaConfig.components, pathArr.length === 0 ? targetComponent : pathArr.join(path.sep), name);
    const absolutePath = path.join(process.cwd(), './src', componentPath);
    const scriptFilePath = `${absolutePath}.js`;
    const jsonFilePath = `${absolutePath}.json`;
    const tplFilePath = `${absolutePath}.wxml`;
    const styleFilePath = `${absolutePath}.wxss`;
    const context = {
        name
    };

    copy(path.resolve(__dirname, '../template/component/index.js'), scriptFilePath, context);
    copy(path.resolve(__dirname, '../template/component/index.wxml'), tplFilePath, context);
    copy(path.resolve(__dirname, '../template/component/index.wxss'), styleFilePath, context);
    copy(path.resolve(__dirname, '../template/component/index.json'), jsonFilePath, context);

    await save();

    log.success('组件创建成功', absolutePath);
}

var genComponent$1 = {
    command: 'component [componentName]',
    alias: '',
    usage: '[componentName]',
    description: '创建小程序组件',
    on: {
        '--help'() {
            console.log(commandInfo([{
                group: 'component',
                messages: ['创建小程序组件']
            }]));
        }
    },
    async action(targetComponent, options) {
        await genComponent(targetComponent, options);
    }
};

async function genComponent$2(targetComponent, options) {
    const page = options.page;
    const pathArr = targetComponent.split(path.sep);
    const name = pathArr.pop();
    const componentPath = path.join(ankaConfig.components, pathArr.length === 0 ? targetComponent : pathArr.join(path.sep), name);
    const absolutePath = path.join(process.cwd(), './src', componentPath);
    const jsonFilePath = `${absolutePath}.json`;
    const pageJsonPath = path.join(process.cwd(), './src', `${page}.json`);

    if (!fs.existsSync(pageJsonPath)) throw new Error(`页面不存在 ${pageJsonPath}`);
    if (!fs.existsSync(jsonFilePath)) throw new Error(`组件不存在 ${jsonFilePath}`);

    const pageConfig = readJSON(pageJsonPath);
    if (!pageConfig.usingComponents) {
        pageConfig.usingComponents = {};
    }
    if (!pageConfig.usingComponents[name]) {
        pageConfig.usingComponents[name] = path.join('/', componentPath);
    } else {
        throw new Error(`组件已经注册 ${componentPath}`);
    }
    writeJSON(pageJsonPath, pageConfig, null, 4);
    await save();

    log.success('组件注册成功', absolutePath);
}

var addComponent = {
    command: 'add [componentName]',
    alias: '',
    options: [['--page [value]', 'eg: anka add [componentName] --page=pages/index/index']],
    usage: '[componentName]',
    description: '注册组件',
    async action(targetComponent, options) {
        await genComponent$2(targetComponent, options);
    }
};

async function genComponent$3(targetComponent, options) {
    const page = options.page;
    const pathArr = targetComponent.split(path.sep);
    const name = pathArr.pop();
    const componentPath = path.join(ankaConfig.components, pathArr.length === 0 ? targetComponent : pathArr.join(path.sep), name);
    const absolutePath = path.join(process.cwd(), './src', componentPath);
    const jsonFilePath = `${absolutePath}.json`;
    const pageJsonPath = path.join(process.cwd(), './src', `${page}.json`);

    if (!fs.existsSync(pageJsonPath)) throw new Error(`页面不存在 ${pageJsonPath}`);
    if (!fs.existsSync(jsonFilePath)) throw new Error(`组件不存在 ${jsonFilePath}`);

    const pageConfig = readJSON(pageJsonPath);
    if (!pageConfig.usingComponents) {
        pageConfig.usingComponents = {};
    }
    if (pageConfig.usingComponents[name]) {
        delete pageConfig.usingComponents[name];
    } else {
        throw new Error(`组件未注册 ${componentPath}`);
    }
    writeJSON(pageJsonPath, pageConfig, null, 4);
    await save();

    log.success('组件移除成功', absolutePath);
}

var removeComponent = {
    command: 'remove [componentName]',
    alias: '',
    options: [['--page [value]', 'eg: anka remove [componentName] --page=pages/index/index']],
    usage: '[componentName]',
    description: '移除组件',
    async action(targetComponent, options) {
        await genComponent$3(targetComponent, options);
    }
};

var commands = [init, dev, build, genPage$1, genComponent$1, addComponent, removeComponent];

var name = "@anka-dev/cli";
var version = "0.0.1";
var description = "WeChat miniprogram helper";
var bin = {
	anka: "dist/index.js"
};
var scripts = {
	dev: "rollup -c build/rollup.config.dev.js -w",
	test: "echo \"Error: no test specified\" && exit 1"
};
var repository = {
	type: "git",
	url: "https://github.com/joe223/anka/"
};
var author = "";
var license = "MIT";
var bugs = {
	url: "https://github.com/joe223/anka/issues"
};
var homepage = "https://github.com/joe223/anka";
var dependencies = {
	"await-to-js": "^2.0.1",
	"babel-core": "^6.26.3",
	cfonts: "^2.1.3",
	chalk: "^2.4.1",
	commander: "^2.15.1",
	"download-git-repo": "^1.0.2",
	figlet: "^1.2.0",
	"fs-extra": "^6.0.1",
	glob: "^7.1.2",
	inquirer: "^5.2.0",
	"mem-fs": "^1.1.3",
	"mem-fs-editor": "^5.1.0",
	"node-sass": "^4.9.3",
	ora: "^3.0.0",
	postcss: "^7.0.2",
	"postcss-load-config": "^2.0.0"
};
var devDependencies = {
	"babel-plugin-external-helpers": "^6.22.0",
	"babel-plugin-transform-object-rest-spread": "^6.26.0",
	"babel-preset-env": "^1.7.0",
	"eslint-config-standard": "^11.0.0",
	"eslint-plugin-import": "^2.14.0",
	"eslint-plugin-node": "^7.0.1",
	"eslint-plugin-promise": "^4.0.0",
	"eslint-plugin-standard": "^3.1.0",
	rollup: "^0.64.1",
	"rollup-plugin-babel": "^3.0.7",
	"rollup-plugin-commonjs": "^9.1.5",
	"rollup-plugin-eslint": "^5.0.0",
	"rollup-plugin-json": "^3.0.0",
	"rollup-plugin-node-resolve": "^3.3.0",
	"rollup-watch": "^4.3.1"
};
var pkgJson = {
	name: name,
	version: version,
	description: description,
	bin: bin,
	scripts: scripts,
	repository: repository,
	author: author,
	license: license,
	bugs: bugs,
	homepage: homepage,
	dependencies: dependencies,
	devDependencies: devDependencies
};

commander.version(pkgJson.version).usage('<command> [options]').option('-v', '--version', () => {
    console.log(pkgJson.version);
});

commands.forEach(command => {
    const cmd = commander.command(command.command);

    if (command.description) {
        cmd.description(command.description);
    }

    if (command.usage) {
        cmd.usage(command.usage);
    }

    if (command.on) {
        for (let key in command.on) {
            cmd.on(key, command.on[key]);
        }
    }

    if (command.options) {
        command.options.forEach(option => {
            cmd.option(...option);
        });
    }

    if (command.action) {
        cmd.action(async (...args) => {
            try {
                await command.action(...args);
            } catch (err) {
                log.error(err.message);
                console.log(err);
            }
        });
    }
});

if (process.argv.length === 2) {
    cfonts.say('Anka', {
        font: 'block',
        align: 'center'
    });
    commander.outputHelp();
}

commander.parse(process.argv);
