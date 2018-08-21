#!/usr/bin/env node
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var ora = _interopDefault(require('ora'));
var chalk = _interopDefault(require('chalk'));
var path = _interopDefault(require('path'));
var fs = _interopDefault(require('fs-extra'));
require('glob');
var memFs = _interopDefault(require('mem-fs'));
var chokidar = _interopDefault(require('chokidar'));
var memFsEditor = _interopDefault(require('mem-fs-editor'));
var babel = _interopDefault(require('babel-core'));
var traverse = _interopDefault(require('babel-traverse'));
var fs$1 = _interopDefault(require('fs'));
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

    error(title = '', msg = '') {
        this.log(chalk.red('✘'), chalk.reset(title), chalk.grey(msg));
    },

    info(title = '', msg) {
        this.log(chalk.grey('○'), chalk.reset(title), chalk.grey(msg));
    },

    warn(title = '', msg = '') {
        this.log(chalk.yellow('⚠'), chalk.reset(title), chalk.grey(msg));
    },

    success(title = '', msg = '') {
        this.log(chalk.green('✔'), chalk.reset(title), chalk.grey(msg));
    }
};

const FILE_TYPES = {
    STYLE: 'style',
    SCRIPT: 'script',
    TPL: 'tpl',
    JSON: 'json'
};

const ACTIONS = {
    COMPILE: '编译',
    WATCH: '监听',
    REMOVE: '移除',
    READY: '就绪'
};

function copyFile(sourcePath, targetPath) {
    if (path.parse(targetPath).ext) {
        fs.ensureFileSync(targetPath);
    } else {
        fs.ensureDirSync(path.dirname(targetPath));
    }
    fs.copyFileSync(sourcePath, targetPath);
}

function extractFileConfig(filePath) {
    let type = '';
    const ext = path.extname(filePath);
    const sourcePath = path.resolve(process.cwd(), filePath);

    if (/\.js$/.test(ext)) {
        type = FILE_TYPES.SCRIPT;
    }

    // else if (/.wxml$/.test(ext)) {
    //     type = FILE_TYPES.TPL
    // }

    const fileConfig = {
        ext,
        type,
        sourcePath
    };
    return fileConfig;
}

function saveFile(targetPath, content) {
    fs.ensureFileSync(targetPath);
    fs.writeFileSync(targetPath, content, 'utf-8');
}

class File {
    constructor({ sourcePath = '', ext = '', type = '' }) {
        this.ext = ext;
        this.type = type;
        this.sourcePath = sourcePath;
        this.targetPath = sourcePath.replace(path.resolve(process.cwd(), 'src'), path.resolve(process.cwd(), 'dist'));
        this.targetDir = path.dirname(this.targetPath);
    }

    unlinkFromDist() {
        fs.unlinkSync(this.targetPath);
        log.info(ACTIONS.REMOVE, this.targetPath);
    }

    updateContent() {
        this.$content = fs.readFileSync(this.sourcePath);
    }

    save() {
        if (!this.sourcePath || !this.content || !this.targetPath) return;
        saveFile(this.targetPath, this.content);
    }

    /**
     * 未知类型文件直接使用拷贝
     */
    compile() {
        log.info('拷贝', this.sourcePath);
        copyFile(this.sourcePath, this.targetPath);
    }
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

function watch(dir, options = {}) {
    return chokidar.watch(dir, _extends({
        persistent: true
    }, options));
}

const ankaJsConfigPath = path.join(process.cwd(), 'anka.config.js');
const ankaJsonConfigPath = path.join(process.cwd(), 'anka.config.json');
const ankaConfig = {
    scaffold: 'github:iException/mini-program-scaffold',
    pages: './src/pages',
    components: './src/components',
    distNodeModules: './dist/npm_modules',
    sourceNodeModules: './node_modules'
};

if (fs.existsSync(ankaJsConfigPath)) {
    Object.assign(ankaConfig, require(ankaJsConfigPath));
} else if (fs.existsSync(ankaJsonConfigPath)) {
    Object.assign(ankaConfig, require(ankaJsonConfigPath));
}

const cwd = process.cwd();

class NpmDependence {
    constructor(dependence) {
        // 该 npm 包的内部所有依赖文件
        this.localDependencies = {};
        this.name = dependence;
        this.sourcePath = path.resolve(cwd, ankaConfig.sourceNodeModules, dependence);
        this.targetPath = path.resolve(cwd, ankaConfig.distNodeModules, dependence);
        this.pkgInfo = Object.assign({
            main: 'index.js'
        }, require(path.join(this.sourcePath, './package.json')));
    }

    /**
     * 提取 npm 包内部的所有依赖
     * @param {string} filePath 依赖文件的绝对路径
     */
    extractLocalDependencies(filePath) {
        if (this.localDependencies[filePath]) return;
        const fileConfig = extractFileConfig(filePath);
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
                        this.extractLocalDependencies(this.resolveModule(dependence, filePath));
                    } else {
                        const data = new NpmDependence(dependence);
                        node.source.value = path.join(path.relative(path.dirname(filePath), data.sourcePath), data.pkgInfo.main);
                    }
                } else if (astNode.isCallExpression() && node.callee.name === 'require' && node.arguments[0] && node.arguments[0].value) {
                    const dependence = node.arguments[0].value;
                    if (this.isLocalDependence(dependence)) {
                        this.extractLocalDependencies(this.resolveModule(dependence, filePath));
                    } else {
                        const data = new NpmDependence(dependence);
                        node.arguments[0].value = path.join(path.relative(path.dirname(filePath), data.sourcePath), data.pkgInfo.main);
                    }
                }
            }
        });
        this.localDependencies[filePath] = {
            ast,
            filePath,
            fileConfig
        };
    }

    /**
     * 将该 npm 模块从 node_modules 移到 ankaConfig.distNodeModules
     */
    move() {
        this.extractLocalDependencies(this.resolveModule(this.name));
        Object.values(this.localDependencies).map(dependence => {
            const filePath = dependence.filePath;
            const targetPath = filePath.replace(this.sourcePath, this.targetPath);
            const { code } = babel.transformFromAst(dependence.ast);
            saveFile(targetPath, code);
        });
    }

    resolveModule(dependence = '', relativePath = this.sourcePath) {
        if (path.parse(relativePath).ext) {
            relativePath = path.dirname(relativePath);
        }
        return require.resolve(dependence, {
            paths: [relativePath]
        });
    }

    isLocalDependence(dependence) {
        return (/^[/|.|\\]/.test(dependence)
        );
    }
}

function genDependenceData(dependence) {
    return new NpmDependence(dependence);
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

const localFilesCache = new Cache();
const npmFilesCache = new Cache();

class ScriptFile extends File {
    constructor(fileConfig) {
        super(fileConfig);
        this.updateContent();
    }

    /**
     * 将 node_modules 中存在的包加入依赖
     * @param {*} dependence
     */
    isThirdPartyModule(dependence) {
        if (/^(@|[A-Za-z0-1])/.test(dependence)) {
            const dependencePath = path.resolve(process.cwd(), ankaConfig.sourceNodeModules, dependence);
            if (fs$1.existsSync(dependencePath)) {
                return true;
            }
        }
    }

    compile() {
        log.info(ACTIONS.COMPILE, this.sourcePath);
        const { ast } = babel.transform(this.$content, {
            ast: true,
            babelrc: false
        });
        const _this = this;

        traverse(ast, {
            enter(astNode) {
                const node = astNode.node;
                if (astNode.isImportDeclaration()) {
                    const dependence = node.source.value;
                    if (_this.isThirdPartyModule(dependence)) {
                        const data = genDependenceData(dependence);
                        npmFilesCache.set(dependence, data);
                        node.source.value = path.join(path.relative(_this.targetDir, data.targetPath), data.pkgInfo.main);
                    }
                } else if (astNode.isCallExpression() && node.callee.name === 'require' && node.arguments[0] && node.arguments[0].value) {
                    const dependence = node.arguments[0].value;
                    if (_this.isThirdPartyModule(dependence)) {
                        const data = genDependenceData(dependence);
                        npmFilesCache.set(dependence, data);
                        node.arguments[0].value = path.join(path.relative(_this.targetDir, data.targetPath), data.pkgInfo.main);
                    }
                }
            }
        });

        const { code } = babel.transformFromAst(ast);
        this.$ast = ast;
        this.$content = code;
        this.save();
    }

    get content() {
        return this.$content;
    }
}

class DevCommand {
    addFile(filePath) {
        let file = null;
        const fileConfig = extractFileConfig(filePath);
        if (fileConfig.type === FILE_TYPES.SCRIPT) {
            file = new ScriptFile(fileConfig);
        } else {
            file = new File(fileConfig);
        }
        localFilesCache.set(fileConfig.sourcePath, file);
        file.compile();

        // else if (fileConfig.type === FILE_TYPES.TPL) {
        //     this.files[fileConfig.sourcePath] = new TplFile(fileConfig)
        // }
    }

    unlinkFile(filePath) {
        const fileConfig = extractFileConfig(filePath);
        const file = localFilesCache.find(fileConfig.sourcePath);
        if (file) {
            file.unlinkFromDist();
            localFilesCache.remove(fileConfig.sourcePath);
        }
    }

    changeFile(filePath) {
        const fileConfig = extractFileConfig(filePath);
        const file = localFilesCache.find(fileConfig.sourcePath);
        if (file) {
            file.updateContent();
            file.compile();
        }
    }

    extractNpmDependencies(dependenceData) {
        const pkg = require(path.join(dependenceData.sourcePath, './package.json'));
        const dependencies = Object.keys(pkg.dependencies);
        dependencies.map(dependence => {
            const dependenceData = genDependenceData(dependence);
            npmFilesCache.set(dependence, dependenceData);
            if (!npmFilesCache.find(dependence)) {
                this.extractNpmDependencies(dependenceData);
            }
        });
    }

    run() {
        const dir = path.resolve(process.cwd(), './src/');
        const watcher = watch(dir);

        watcher.on('add', this.addFile.bind(this));
        watcher.on('unlink', this.unlinkFile.bind(this));
        watcher.on('change', this.changeFile.bind(this));
        watcher.on('ready', () => {
            npmFilesCache.list().map(dependence => {
                this.extractNpmDependencies(dependence);
            });
            npmFilesCache.list().map(pkg => {
                pkg.move();
            });
            log.success(ACTIONS.READY, dir);
        });
    }

    clean() {
        // TODO
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

    log.success('页面创建成功', absolutePath);
    log.success('页面注册成功', absolutePath);
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

var commands = [dev, init, genPage$1, genComponent$1, addComponent, removeComponent];

var name = "@anka-dev/cli";
var version = "0.0.1";
var description = "WeChat miniprogram helper";
var bin = {
	anka2: "dist/index.js"
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
	ora: "^3.0.0"
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
