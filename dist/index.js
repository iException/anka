#!/usr/bin/env node
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = require('fs');
var path = require('path');
var sass = require('node-sass');
var tslib_1 = require('tslib');
var postcssrc = _interopDefault(require('postcss-load-config'));
var babel = require('@babel/core');
var fs$1 = require('fs-extra');
var ts = require('typescript');
var traverse = _interopDefault(require('@babel/traverse'));
var codeGenerator = _interopDefault(require('@babel/generator'));
var chalk = _interopDefault(require('chalk'));
var chokidar = require('chokidar');
var downloadRepo = _interopDefault(require('download-git-repo'));
var semver = require('semver');
var cfonts = require('cfonts');

var cwd = process.cwd();
function resolveConfig (names, root) {
    if (names === void 0) { names = []; }
    var defaultValue = {};
    var configPaths = names.map(function (name) { return path.join(root || cwd, name); });
    for (var index = 0; index < configPaths.length; index++) {
        var configPath = configPaths[index];
        if (fs.existsSync(configPath)) {
            Object.assign(defaultValue, require(configPath));
            break;
        }
    }
    return defaultValue;
}

var sassParser = (function (file, compilation, callback) {
    var utils = this.getUtils();
    var config = this.getSystemConfig();
    file.content = file.content instanceof Buffer ? file.content.toString() : file.content;
    sass.render({
        file: file.sourceFile,
        data: file.content,
        outputStyle: !config.ankaConfig.devMode ? 'nested' : 'compressed'
    }, function (err, result) {
        if (err) {
            utils.logger.error('Compile', err.message, err);
        }
        else {
            file.content = result.css;
            file.updateExt('.wxss');
        }
        callback();
    });
});

var postcss = require('postcss');
var postcssWxImport = postcss.plugin('postcss-wximport', function () {
    return function (root) {
        root.walkAtRules('wximport', function (rule) {
            rule.name = 'import';
            rule.params = rule.params.replace(/\.\w+(?=['"]$)/, '.wxss');
        });
    };
});

var postcss$1 = require('postcss');
var postcssConfig = {};
var styleParser = (function (file, compilation, cb) {
    genPostcssConfig().then(function (config) {
        file.content = file.content instanceof Buffer ? file.content.toString() : file.content;
        return postcss$1(config.plugins.concat([postcssWxImport])).process(file.content, tslib_1.__assign({}, config.options, { from: file.sourceFile }));
    }).then(function (root) {
        file.content = root.css;
        file.updateExt('.wxss');
        cb();
    });
});
function genPostcssConfig() {
    return postcssConfig.plugins ? Promise.resolve(postcssConfig) : postcssrc({}).then(function (config) {
        return Promise.resolve(Object.assign(postcssConfig, config));
    });
}

var babelConfig = null;
var babelParser = (function (file, compilation, cb) {
    var utils = this.getUtils();
    var config = this.getSystemConfig();
    if (file.isInSrcDir) {
        if (!babelConfig) {
            babelConfig = utils.resolveConfig(['babel.config.js'], config.cwd);
        }
        file.content = file.content instanceof Buffer ? file.content.toString() : file.content;
        var result = babel.transformSync(file.content, tslib_1.__assign({ babelrc: false, ast: true, filename: file.sourceFile, sourceType: 'module', sourceMaps: config.ankaConfig.devMode }, babelConfig));
        file.sourceMap = JSON.stringify(result.map);
        file.content = result.code;
        file.ast = result.ast;
    }
    file.updateExt('.js');
    cb();
});

var inlineSourceMapComment = require('inline-source-map-comment');
var saveFilePlugin = (function () {
    var utils = this.getUtils();
    var config = this.getSystemConfig();
    var logger = utils.logger, writeFile = utils.writeFile;
    this.on('after-compile', function (compilation, cb) {
        var file = compilation.file;
        fs$1.ensureFile(file.targetFile).then(function () {
            if (config.ankaConfig.devMode && file.sourceMap) {
                if (file.content instanceof Buffer) {
                    file.content = file.content.toString();
                }
                file.content = file.content + '\r\n\r\n' + inlineSourceMapComment(file.sourceMap, {
                    block: true,
                    sourcesContent: true
                });
            }
            return writeFile(file.targetFile, file.content);
        }).then(function () {
            compilation.destroy();
            cb();
        }, function (err) {
            logger.error('Error', err.message, err);
            compilation.destroy();
            cb();
        });
    });
});

var tsConfig = null;
var typescriptParser = (function (file, compilation, callback) {
    var utils = this.getUtils();
    var config = this.getSystemConfig();
    var logger = utils.logger;
    file.content = file.content instanceof Buffer ? file.content.toString() : file.content;
    var sourceMap = {
        sourcesContent: [file.content]
    };
    if (!tsConfig) {
        tsConfig = utils.resolveConfig(['tsconfig.json', 'tsconfig.js'], config.cwd);
    }
    var result = ts.transpileModule(file.content, {
        compilerOptions: tsConfig.compilerOptions,
        fileName: file.sourceFile
    });
    try {
        file.content = result.outputText;
        if (config.ankaConfig.devMode) {
            file.sourceMap = tslib_1.__assign({}, JSON.parse(result.sourceMapText), sourceMap);
        }
        file.updateExt('.js');
    }
    catch (err) {
        logger.error('Compile error', err.message, err);
    }
    callback();
});

var dependencyPool = new Map();
var resovleModuleName = require('require-package-name');
var extractDependencyPlugin = (function () {
    var utils = this.getUtils();
    var compiler = this.getCompiler();
    var config = this.getSystemConfig();
    var testSrcDir = new RegExp("^" + config.srcDir);
    var testNodeModules = new RegExp("^" + config.sourceNodeModules);
    this.on('before-compile', function (compilation, cb) {
        var file = compilation.file;
        var localDependencyPool = new Map();
        if (file.extname === '.js') {
            if (!file.ast) {
                file.ast = babel.parse(file.content instanceof Buffer ? file.content.toString() : file.content, {
                    babelrc: false,
                    sourceType: 'module'
                });
            }
            traverse(file.ast, {
                enter: function (path$$1) {
                    if (path$$1.isImportDeclaration()) {
                        var node = path$$1.node;
                        var source = node.source;
                        if (source &&
                            source.value &&
                            typeof source.value === 'string') {
                            resolve(source, file.sourceFile, file.targetFile, localDependencyPool);
                        }
                    }
                    if (path$$1.isCallExpression()) {
                        var node = path$$1.node;
                        var callee = node.callee;
                        var args = node.arguments;
                        if (args &&
                            callee &&
                            args[0] &&
                            args[0].value &&
                            callee.name === 'require' &&
                            typeof args[0].value === 'string') {
                            resolve(args[0], file.sourceFile, file.targetFile, localDependencyPool);
                        }
                    }
                }
            });
            file.content = codeGenerator(file.ast).code;
            var dependencyList = Array.from(localDependencyPool.keys()).filter(function (dependency) { return !dependencyPool.has(dependency); });
            Promise.all(dependencyList.map(function (dependency) { return traverseNpmDependency(dependency); })).then(function () {
                cb();
            }).catch(function (err) {
                cb();
                utils.logger.error(file.sourceFile, err.message, err);
            });
        }
        else {
            cb();
        }
    });
    function resolve(node, sourceFile, targetFile, localDependencyPool) {
        var sourceBaseName = path.dirname(sourceFile);
        var targetBaseName = path.dirname(targetFile);
        var moduleName = resovleModuleName(node.value);
        if (utils.isNpmDependency(moduleName) || testNodeModules.test(sourceFile)) {
            var dependency = utils.resolveModule(node.value, {
                paths: [sourceBaseName]
            });
            if (!dependency || testSrcDir.test(dependency))
                return;
            var distPath = dependency.replace(config.sourceNodeModules, config.distNodeModules);
            node.value = path.relative(targetBaseName, distPath);
            if (localDependencyPool.has(dependency))
                return;
            localDependencyPool.set(dependency, dependency);
        }
    }
    function traverseNpmDependency(dependency) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var file;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dependencyPool.set(dependency, dependency);
                        return [4, utils.createFile(dependency)];
                    case 1:
                        file = _a.sent();
                        file.targetFile = file.sourceFile.replace(config.sourceNodeModules, config.distNodeModules);
                        return [4, compiler.generateCompilation(file).run()];
                    case 2:
                        _a.sent();
                        return [2];
                }
            });
        });
    }
});

var sourceDir = './src';
var outputDir = './dist';
var pages = './pages';
var components = './components';
var template = {
    page: path.join(__dirname, '../template/page'),
    component: path.join(__dirname, '../template/component')
};
var subPackages = './subPackages';
var quiet = false;
var devMode = false;
var parsers = [
    {
        match: /.*\.(js|es)$/,
        parsers: [
            {
                parser: babelParser,
                options: {}
            }
        ]
    },
    {
        match: /.*\.(wxss|css|postcss)$/,
        parsers: [
            {
                parser: styleParser,
                options: {}
            }
        ]
    },
    {
        match: /.*\.(sass|scss)$/,
        parsers: [
            {
                parser: sassParser,
                options: {}
            }
        ]
    },
    {
        match: /.*\.(ts|typescript)$/,
        parsers: [
            {
                parser: typescriptParser,
                options: {}
            }
        ]
    }
];
var debug = false;
var plugins = [
    {
        plugin: extractDependencyPlugin,
        options: {}
    },
    {
        plugin: saveFilePlugin,
        options: {}
    }
];

var ankaDefaultConfig = /*#__PURE__*/Object.freeze({
    sourceDir: sourceDir,
    outputDir: outputDir,
    pages: pages,
    components: components,
    template: template,
    subPackages: subPackages,
    quiet: quiet,
    devMode: devMode,
    parsers: parsers,
    debug: debug,
    plugins: plugins
});

var cwd$1 = process.cwd();
var customConfig = resolveConfig(['anka.config.js', 'anka.config.json']);
var ankaConfig = tslib_1.__assign({}, ankaDefaultConfig, customConfig, { template: customConfig.template ? {
        page: path.join(cwd$1, customConfig.template.page),
        component: path.join(cwd$1, customConfig.template.component)
    } : template, parsers: customConfig.parsers ? customConfig.parsers.concat(parsers) : parsers, plugins: customConfig.plugins ? customConfig.plugins.concat(plugins) : plugins });

var cwd$2 = process.cwd();
var srcDir = path.resolve(cwd$2, ankaConfig.sourceDir);
var distDir = path.resolve(cwd$2, ankaConfig.outputDir);
var ankaModules = path.resolve(srcDir, 'anka_modules');
var sourceNodeModules = path.resolve(cwd$2, './node_modules');
var distNodeModules = path.resolve(distDir, './npm_modules');
var defaultScaffold = 'iException/anka-quickstart';

var systemConfig = /*#__PURE__*/Object.freeze({
    cwd: cwd$2,
    srcDir: srcDir,
    distDir: distDir,
    ankaModules: ankaModules,
    sourceNodeModules: sourceNodeModules,
    distNodeModules: distNodeModules,
    defaultScaffold: defaultScaffold
});

var customConfig$1 = resolveConfig(['app.json'], srcDir);
var projectConfig = Object.assign({
    pages: [],
    subPackages: [],
    window: {
        navigationBarTitleText: 'Wechat'
    }
}, customConfig$1);

var config = tslib_1.__assign({}, systemConfig, { ankaConfig: ankaConfig,
    projectConfig: projectConfig });

var glob = require('glob');
function readFile(sourceFilePath) {
    return new Promise(function (resolve, reject) {
        fs$1.readFile(sourceFilePath, function (err, buffer) {
            if (err) {
                reject(err);
            }
            else {
                resolve(buffer);
            }
        });
    });
}
function writeFile(targetFilePath, content) {
    return new Promise(function (resolve, reject) {
        fs$1.writeFile(targetFilePath, content, function (err) {
            if (err)
                throw err;
            resolve();
        });
    });
}
function searchFiles(scheme, options) {
    return new Promise(function (resolve, reject) {
        glob(scheme, options, function (err, files) {
            if (err) {
                reject(err);
            }
            else {
                resolve(files);
            }
        });
    });
}

var ora = require('ora');
function toFix(number) {
    return ('00' + number).slice(-2);
}
function getCurrentTime() {
    var now = new Date();
    return toFix(now.getHours()) + ":" + toFix(now.getMinutes()) + ":" + toFix(now.getSeconds());
}
var Logger = (function () {
    function Logger() {
    }
    Object.defineProperty(Logger.prototype, "time", {
        get: function () {
            return chalk.grey("[" + getCurrentTime() + "]");
        },
        enumerable: true,
        configurable: true
    });
    Logger.prototype.startLoading = function (msg) {
        this.oraInstance = ora(msg).start();
    };
    Logger.prototype.stopLoading = function () {
        this.oraInstance && this.oraInstance.stop();
    };
    Logger.prototype.log = function () {
        var msg = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            msg[_i] = arguments[_i];
        }
        return console.log.apply(console, [this.time].concat(msg));
    };
    Logger.prototype.error = function (title, msg, err) {
        if (title === void 0) { title = ''; }
        if (msg === void 0) { msg = ''; }
        this.log(chalk.redBright(title), chalk.grey(msg));
        err && console.log(chalk.redBright(err || err.stack));
    };
    Logger.prototype.info = function (title, msg) {
        if (title === void 0) { title = ''; }
        if (msg === void 0) { msg = ''; }
        this.log(chalk.reset(title), chalk.grey(msg));
    };
    Logger.prototype.warn = function (title, msg) {
        if (title === void 0) { title = ''; }
        if (msg === void 0) { msg = ''; }
        this.log(chalk.yellowBright(title), chalk.grey(msg));
    };
    Logger.prototype.success = function (title, msg) {
        if (title === void 0) { title = ''; }
        if (msg === void 0) { msg = ''; }
        this.log(chalk.greenBright(title), chalk.grey(msg));
    };
    return Logger;
}());
var logger = new Logger();

var replaceExt = require('replace-ext');
var File = (function () {
    function File(option) {
        var isInSrcDirTest = new RegExp("^" + config.srcDir);
        if (!option.sourceFile)
            throw new Error('Invalid value: FileConstructorOption.sourceFile');
        if (!option.content)
            throw new Error('Invalid value: FileConstructorOption.content');
        this.sourceFile = option.sourceFile;
        this.targetFile = option.targetFile || option.sourceFile.replace(config.srcDir, config.distDir);
        this.content = option.content;
        this.sourceMap = option.sourceMap;
        this.isInSrcDir = isInSrcDirTest.test(this.sourceFile);
    }
    Object.defineProperty(File.prototype, "dirname", {
        get: function () {
            return path.dirname(this.targetFile);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(File.prototype, "basename", {
        get: function () {
            return path.basename(this.targetFile);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(File.prototype, "extname", {
        get: function () {
            return path.extname(this.targetFile);
        },
        enumerable: true,
        configurable: true
    });
    File.prototype.saveTo = function (path$$1) {
        return tslib_1.__awaiter(this, void 0, Promise, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, fs$1.ensureFile(path$$1)];
                    case 1:
                        _a.sent();
                        if (!path$$1) {
                            throw new Error('Invalid path');
                        }
                        return [2];
                }
            });
        });
    };
    File.prototype.updateExt = function (ext) {
        this.targetFile = replaceExt(this.targetFile, ext);
    };
    return File;
}());

function createFile(sourceFile) {
    return readFile(sourceFile).then(function (content) {
        return Promise.resolve(new File({
            sourceFile: sourceFile,
            content: content
        }));
    });
}
function createFileSync(sourceFile) {
    var content = fs$1.readFileSync(sourceFile);
    return new File({
        sourceFile: sourceFile,
        content: content
    });
}

var memFs = require('mem-fs');
var memFsEditor = require('mem-fs-editor');
var FsEditor = (function () {
    function FsEditor() {
        var store = memFs.create();
        this.editor = memFsEditor.create(store);
    }
    FsEditor.prototype.copy = function (from, to, context, templateOptions, copyOptions) {
        this.editor.copyTpl(from, to, context, templateOptions, copyOptions);
    };
    FsEditor.prototype.write = function (filepath, contents) {
        this.editor.write(filepath, contents);
    };
    FsEditor.prototype.writeJSON = function (filepath, contents, replacer, space) {
        this.editor.writeJSON(filepath, contents, replacer || null, space = 4);
    };
    FsEditor.prototype.read = function (filepath, options) {
        return this.editor.read(filepath, options);
    };
    FsEditor.prototype.readJSON = function (filepath, defaults) {
        this.editor.readJSON(filepath, defaults);
    };
    FsEditor.prototype.save = function () {
        var _this = this;
        return new Promise(function (resolve) {
            _this.editor.commit(resolve);
        });
    };
    return FsEditor;
}());

function resolveModule (id, options) {
    try {
        return require.resolve(id, options);
    }
    catch (err) {
        logger.error('Missing dependency', id, !ankaConfig.quiet ? "in " + options.paths : null);
    }
}

function callPromiseInChain(list) {
    if (list === void 0) { list = []; }
    var params = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        params[_i - 1] = arguments[_i];
    }
    return new Promise(function (resolve, reject) {
        if (!list.length) {
            resolve();
            return;
        }
        var step = list[0].apply(list, params);
        var _loop_1 = function (i) {
            step = step.then(function () {
                return list[i].apply(list, params);
            });
        };
        for (var i = 1; i < list.length; i++) {
            _loop_1(i);
        }
        step.then(function (res) {
            resolve();
        }, function (err) {
            reject(err);
        });
    });
}

function asyncFunctionWrapper (fn) {
    return function () {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i] = arguments[_i];
        }
        var limitation = params.length;
        return new Promise(function (resolve) {
            if (fn.length > limitation) {
                fn.apply(void 0, params.concat([resolve]));
            }
            else {
                resolve(fn.apply(void 0, params));
            }
        });
    };
}

function genFileWatcher (dir, options) {
    return chokidar.watch(dir, tslib_1.__assign({ persistent: true, ignoreInitial: true }, options));
}

var validate = require('validate-npm-package-name');
function isNpmDependency (required) {
    if (required === void 0) { required = ''; }
    var result = validate(required);
    return result.validForNewPackages || result.validForOldPackages;
}

function downloadRepo$1 (repo, path$$1) {
    return new Promise(function (resolve, reject) {
        downloadRepo(repo, path$$1, { clone: false }, function (err) {
            err ? reject(err) : resolve();
        });
    });
}



var utils = /*#__PURE__*/Object.freeze({
    logger: logger,
    createFile: createFile,
    createFileSync: createFileSync,
    FsEditor: FsEditor,
    resolveModule: resolveModule,
    resolveConfig: resolveConfig,
    callPromiseInChain: callPromiseInChain,
    asyncFunctionWrapper: asyncFunctionWrapper,
    genFileWatcher: genFileWatcher,
    isNpmDependency: isNpmDependency,
    downloadRepo: downloadRepo$1,
    readFile: readFile,
    writeFile: writeFile,
    searchFiles: searchFiles
});

var Injection = (function () {
    function Injection(compiler, options) {
        this.compiler = compiler;
        this.options = options;
    }
    Injection.prototype.getCompiler = function () {
        return this.compiler;
    };
    Injection.prototype.getUtils = function () {
        return utils;
    };
    Injection.prototype.getAnkaConfig = function () {
        return config.ankaConfig;
    };
    Injection.prototype.getSystemConfig = function () {
        return config;
    };
    Injection.prototype.getProjectConfig = function () {
        return config.projectConfig;
    };
    return Injection;
}());
var PluginInjection = (function (_super) {
    tslib_1.__extends(PluginInjection, _super);
    function PluginInjection(compiler, options) {
        return _super.call(this, compiler, options) || this;
    }
    PluginInjection.prototype.getOptions = function () {
        return this.options || {};
    };
    PluginInjection.prototype.on = function (event, handler) {
        this.compiler.on(event, handler);
    };
    return PluginInjection;
}(Injection));
var ParserInjection = (function (_super) {
    tslib_1.__extends(ParserInjection, _super);
    function ParserInjection(compiler, options) {
        return _super.call(this, compiler, options) || this;
    }
    ParserInjection.prototype.getOptions = function () {
        return this.options || {};
    };
    return ParserInjection;
}(Injection));

var Compilation = (function () {
    function Compilation(file, conf, compiler) {
        this.compiler = compiler;
        this.config = conf;
        this.id = Compiler.compilationId++;
        if (file instanceof File) {
            this.file = file;
            this.sourceFile = file.sourceFile;
        }
        else {
            this.sourceFile = file;
        }
        this.enroll();
    }
    Compilation.prototype.run = function () {
        return tslib_1.__awaiter(this, void 0, Promise, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.loadFile()];
                    case 1:
                        _a.sent();
                        return [4, this.invokeParsers()];
                    case 2:
                        _a.sent();
                        return [4, this.compile()];
                    case 3:
                        _a.sent();
                        return [2];
                }
            });
        });
    };
    Compilation.prototype.loadFile = function () {
        return tslib_1.__awaiter(this, void 0, Promise, function () {
            var _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.destroyed)
                            return [2];
                        return [4, this.compiler.emit('before-load-file', this)];
                    case 1:
                        _b.sent();
                        if (!!(this.file instanceof File)) return [3, 3];
                        _a = this;
                        return [4, createFile(this.sourceFile)];
                    case 2:
                        _a.file = _b.sent();
                        _b.label = 3;
                    case 3: return [4, this.compiler.emit('after-load-file', this)];
                    case 4:
                        _b.sent();
                        return [2];
                }
            });
        });
    };
    Compilation.prototype.invokeParsers = function () {
        return tslib_1.__awaiter(this, void 0, Promise, function () {
            var file, parsers, tasks;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.destroyed)
                            return [2];
                        file = this.file;
                        parsers = this.compiler.parsers.filter(function (matchers) {
                            return matchers.match.test(file.sourceFile);
                        }).map(function (matchers) {
                            return matchers.parsers;
                        }).reduce(function (prev, next) {
                            return prev.concat(next);
                        }, []);
                        tasks = parsers.map(function (parser) {
                            return asyncFunctionWrapper(parser);
                        });
                        return [4, this.compiler.emit('before-parse', this)];
                    case 1:
                        _a.sent();
                        return [4, callPromiseInChain(tasks, file, this)];
                    case 2:
                        _a.sent();
                        return [4, this.compiler.emit('after-parse', this)];
                    case 3:
                        _a.sent();
                        return [2];
                }
            });
        });
    };
    Compilation.prototype.compile = function () {
        return tslib_1.__awaiter(this, void 0, Promise, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.destroyed)
                            return [2];
                        return [4, this.compiler.emit('before-compile', this)];
                    case 1:
                        _a.sent();
                        return [4, this.compiler.emit('after-compile', this)];
                    case 2:
                        _a.sent();
                        !this.config.ankaConfig.quiet && logger.info('Compile', this.file.sourceFile.replace(config.cwd, ''));
                        return [2];
                }
            });
        });
    };
    Compilation.prototype.enroll = function () {
        var oldCompilation = Compiler.compilationPool.get(this.sourceFile);
        if (oldCompilation) {
            if (config.ankaConfig.debug)
                console.log('Destroy Compilation', oldCompilation.id, oldCompilation.sourceFile);
            oldCompilation.destroy();
        }
        Compiler.compilationPool.set(this.sourceFile, this);
    };
    Compilation.prototype.destroy = function () {
        this.destroyed = true;
        Compiler.compilationPool.delete(this.sourceFile);
    };
    return Compilation;
}());

var logger$1 = logger;
var del = require('del');
var Compiler = (function () {
    function Compiler() {
        this.plugins = {
            'before-load-file': [],
            'after-load-file': [],
            'before-parse': [],
            'after-parse': [],
            'before-compile': [],
            'after-compile': []
        };
        this.parsers = [];
        this.config = config;
        this.initParsers();
        this.initPlugins();
        if (config.ankaConfig.debug) {
            console.log(JSON.stringify(this.config, function (key, value) {
                if (value instanceof Function)
                    return '[Function]';
                return value;
            }, 4));
        }
    }
    Compiler.prototype.on = function (event, handler) {
        if (this.plugins[event] === void (0))
            throw new Error("Unknown hook: " + event);
        this.plugins[event].push(handler);
    };
    Compiler.prototype.emit = function (event, compilation) {
        return tslib_1.__awaiter(this, void 0, Promise, function () {
            var plugins, tasks;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (compilation.destroyed)
                            return [2];
                        plugins = this.plugins[event];
                        if (!plugins || !plugins.length)
                            return [2];
                        tasks = plugins.map(function (plugin) {
                            return asyncFunctionWrapper(plugin);
                        });
                        return [4, callPromiseInChain(tasks, compilation)];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        });
    };
    Compiler.prototype.clean = function () {
        return tslib_1.__awaiter(this, void 0, Promise, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, del([
                            path.join(config.distDir, '**/*'),
                            "!" + path.join(config.distDir, 'app.js'),
                            "!" + path.join(config.distDir, 'app.json'),
                            "!" + path.join(config.distDir, 'project.config.json')
                        ])];
                    case 1:
                        _a.sent();
                        logger$1.success('Clean workshop', config.distDir);
                        return [2];
                }
            });
        });
    };
    Compiler.prototype.launch = function () {
        return tslib_1.__awaiter(this, void 0, Promise, function () {
            var filePaths, files, compilations;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger$1.info('Launching...');
                        return [4, searchFiles(config.srcDir + "/**/*", {
                                nodir: true,
                                silent: false,
                                absolute: true
                            })];
                    case 1:
                        filePaths = _a.sent();
                        return [4, Promise.all(filePaths.map(function (file) {
                                return createFile(file);
                            }))];
                    case 2:
                        files = _a.sent();
                        compilations = files.map(function (file) {
                            return new Compilation(file, _this.config, _this);
                        });
                        fs$1.ensureDirSync(config.distNodeModules);
                        return [4, Promise.all(compilations.map(function (compilations) { return compilations.run(); }))];
                    case 3:
                        _a.sent();
                        return [2];
                }
            });
        });
    };
    Compiler.prototype.watchFiles = function () {
        var _this = this;
        return new Promise(function (resolve) {
            var watcher = genFileWatcher(config.srcDir + "/**/*", {
                followSymlinks: false
            });
            watcher.on('add', function (fileName) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                var file;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4, createFile(fileName)];
                        case 1:
                            file = _a.sent();
                            return [4, this.generateCompilation(file).run()];
                        case 2:
                            _a.sent();
                            return [2];
                    }
                });
            }); });
            watcher.on('unlink', function (fileName) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4, fs$1.unlink(fileName.replace(config.srcDir, config.distDir))];
                        case 1:
                            _a.sent();
                            logger$1.success('Remove', fileName);
                            return [2];
                    }
                });
            }); });
            watcher.on('change', function (fileName) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                var file;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4, createFile(fileName)];
                        case 1:
                            file = _a.sent();
                            return [4, this.generateCompilation(file).run()];
                        case 2:
                            _a.sent();
                            return [2];
                    }
                });
            }); });
            watcher.on('ready', function () {
                resolve();
            });
        });
    };
    Compiler.prototype.generateCompilation = function (file) {
        return new Compilation(file, this.config, this);
    };
    Compiler.prototype.initParsers = function () {
        var _this = this;
        this.config.ankaConfig.parsers.forEach(function (_a) {
            var match = _a.match, parsers = _a.parsers;
            _this.parsers.push({
                match: match,
                parsers: parsers.map(function (_a) {
                    var parser = _a.parser, options = _a.options;
                    return parser.bind(_this.generateParserInjection(options));
                })
            });
        });
    };
    Compiler.prototype.initPlugins = function () {
        var _this = this;
        this.config.ankaConfig.plugins.forEach(function (_a) {
            var plugin = _a.plugin, options = _a.options;
            plugin.call(_this.generatePluginInjection(options));
        });
    };
    Compiler.prototype.generatePluginInjection = function (options) {
        return new PluginInjection(this, options);
    };
    Compiler.prototype.generateParserInjection = function (options) {
        return new ParserInjection(this, options);
    };
    Compiler.compilationId = 1;
    Compiler.compilationPool = new Map();
    return Compiler;
}());

var Command = (function () {
    function Command(command, desc) {
        this.command = command;
        this.options = [];
        this.alias = '';
        this.usage = '';
        this.description = desc;
        this.examples = [];
        this.on = {};
    }
    Command.prototype.initCompiler = function () {
        this.$compiler = new Compiler();
    };
    Command.prototype.setUsage = function (usage) {
        this.usage = usage;
    };
    Command.prototype.setOptions = function () {
        var options = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            options[_i] = arguments[_i];
        }
        this.options.push(options);
    };
    Command.prototype.setExamples = function () {
        var example = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            example[_i] = arguments[_i];
        }
        this.examples = this.examples.concat(example);
    };
    Command.prototype.printTitle = function () {
        var arg = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            arg[_i] = arguments[_i];
        }
        console.log.apply(console, ['\r\n '].concat(arg, ['\r\n']));
    };
    Command.prototype.printContent = function () {
        var arg = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            arg[_i] = arguments[_i];
        }
        console.log.apply(console, ['   '].concat(arg));
    };
    return Command;
}());

var DevCommand = (function (_super) {
    tslib_1.__extends(DevCommand, _super);
    function DevCommand() {
        var _this = _super.call(this, 'dev [pages...]', 'Development mode') || this;
        _this.setExamples('$ anka dev', '$ anka dev index', '$ anka dev /pages/log/log /pages/user/user');
        _this.$compiler = new Compiler();
        _this.$compiler.config.ankaConfig.devMode = true;
        return _this;
    }
    DevCommand.prototype.action = function (pages, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var startupTime;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startupTime = Date.now();
                        this.initCompiler();
                        return [4, this.$compiler.clean()];
                    case 1:
                        _a.sent();
                        return [4, this.$compiler.launch()];
                    case 2:
                        _a.sent();
                        return [4, this.$compiler.watchFiles()];
                    case 3:
                        _a.sent();
                        logger.success("Startup: " + (Date.now() - startupTime) + "ms \uD83C\uDF89 , Anka is waiting for changes...");
                        return [2];
                }
            });
        });
    };
    return DevCommand;
}(Command));

var InitCommand = (function (_super) {
    tslib_1.__extends(InitCommand, _super);
    function InitCommand() {
        var _this = _super.call(this, 'init <project-name>', 'Initialize new project') || this;
        _this.setExamples('$ anka init', "$ anka init anka-in-action --repo=" + config.defaultScaffold);
        _this.setOptions('-r, --repo', 'template repository');
        _this.$compiler = new Compiler();
        return _this;
    }
    InitCommand.prototype.action = function (projectName, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var project, repo;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        project = path.resolve(config.cwd, projectName);
                        repo = options.repo || config.defaultScaffold;
                        logger.startLoading('Downloading template...');
                        return [4, downloadRepo$1(repo, project)];
                    case 1:
                        _a.sent();
                        logger.stopLoading();
                        logger.success('Done', project);
                        return [2];
                }
            });
        });
    };
    return InitCommand;
}(Command));

var DevCommand$1 = (function (_super) {
    tslib_1.__extends(DevCommand, _super);
    function DevCommand() {
        var _this = _super.call(this, 'prod', 'Production mode') || this;
        _this.setExamples('$ anka prod');
        _this.$compiler = new Compiler();
        return _this;
    }
    DevCommand.prototype.action = function (pages, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var startupTime;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startupTime = Date.now();
                        this.initCompiler();
                        return [4, this.$compiler.clean()];
                    case 1:
                        _a.sent();
                        return [4, this.$compiler.launch()];
                    case 2:
                        _a.sent();
                        logger.success("Done: " + (Date.now() - startupTime) + "ms", 'Have a nice day 🎉 !');
                        return [2];
                }
            });
        });
    };
    return DevCommand;
}(Command));

var logger$2 = logger, FsEditor$1 = FsEditor;
var CreatePageCommand = (function (_super) {
    tslib_1.__extends(CreatePageCommand, _super);
    function CreatePageCommand() {
        var _this = _super.call(this, 'new-page <pages...>', 'Create a miniprogram page') || this;
        _this.setExamples('$ anka new-page index', '$ anka new-page /pages/index/index', '$ anka new-page /pages/index/index --root=packageA');
        _this.setOptions('-r, --root <subpackage>', 'save page to subpackages');
        _this.$compiler = new Compiler();
        return _this;
    }
    CreatePageCommand.prototype.action = function (pages, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var root, editor;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        root = options.root;
                        editor = new FsEditor$1();
                        return [4, Promise.all(pages.map(function (page) {
                                return _this.generatePage(page, editor, root);
                            }))];
                    case 1:
                        _a.sent();
                        logger$2.success('Done', 'Have a nice day 🎉 !');
                        return [2];
                }
            });
        });
    };
    CreatePageCommand.prototype.generatePage = function (page, editor, root) {
        return tslib_1.__awaiter(this, void 0, Promise, function () {
            var _a, ankaConfig, projectConfig, CwdRegExp, pagePath, pageName, context, appConfigPath, absolutePath, rootPath_1, subPkg, tpls;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = config, ankaConfig = _a.ankaConfig, projectConfig = _a.projectConfig;
                        CwdRegExp = new RegExp("^" + config.cwd);
                        pagePath = page.split(path.sep).length === 1 ?
                            path.join(ankaConfig.pages, page, page) : page;
                        pageName = path.basename(pagePath);
                        context = {
                            pageName: pageName
                        };
                        appConfigPath = path.join(config.srcDir, 'app.json');
                        absolutePath = config.srcDir;
                        if (root) {
                            rootPath_1 = path.join(ankaConfig.subPackages, root);
                            subPkg = projectConfig.subPackages.find(function (pkg) { return pkg.root === rootPath_1; });
                            absolutePath = path.join(absolutePath, ankaConfig.subPackages, root, pagePath);
                            if (subPkg) {
                                if (subPkg.pages.includes(pagePath)) {
                                    logger$2.warn('The page already exists', absolutePath);
                                    return [2];
                                }
                                else {
                                    subPkg.pages.push(pagePath);
                                }
                            }
                            else {
                                projectConfig.subPackages.push({
                                    root: rootPath_1,
                                    pages: [pagePath]
                                });
                            }
                        }
                        else {
                            absolutePath = path.join(absolutePath, pagePath);
                            if (projectConfig.pages.includes(pagePath)) {
                                logger$2.warn('The page already exists', absolutePath);
                                return [2];
                            }
                            else {
                                projectConfig.pages.push(pagePath);
                            }
                        }
                        return [4, searchFiles("" + path.join(ankaConfig.template.page, '*.*'))];
                    case 1:
                        tpls = _b.sent();
                        tpls.forEach(function (tpl) {
                            editor.copy(tpl, path.join(path.dirname(absolutePath), pageName + path.extname(tpl)), context);
                        });
                        editor.writeJSON(appConfigPath, projectConfig, null, 4);
                        return [4, editor.save()];
                    case 2:
                        _b.sent();
                        logger$2.success('Create page', absolutePath.replace(CwdRegExp, ''));
                        return [2];
                }
            });
        });
    };
    return CreatePageCommand;
}(Command));

var logger$3 = logger, FsEditor$2 = FsEditor;
var CreateComponentCommand = (function (_super) {
    tslib_1.__extends(CreateComponentCommand, _super);
    function CreateComponentCommand() {
        var _this = _super.call(this, 'new-cmpt <components...>', 'Create a miniprogram component') || this;
        _this.setExamples('$ anka new-cmpt button', '$ anka new-cmpt /components/button/button', '$ anka new-cmpt /components/button/button --global');
        _this.setOptions('-r, --root <subpackage>', 'save component to subpackages');
        _this.$compiler = new Compiler();
        return _this;
    }
    CreateComponentCommand.prototype.action = function (components, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var root, editor;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        root = options.root;
                        editor = new FsEditor$2();
                        return [4, Promise.all(components.map(function (component) {
                                return _this.generateComponent(component, editor, root);
                            }))];
                    case 1:
                        _a.sent();
                        logger$3.success('Done', 'Have a nice day 🎉 !');
                        return [2];
                }
            });
        });
    };
    CreateComponentCommand.prototype.generateComponent = function (component, editor, root) {
        return tslib_1.__awaiter(this, void 0, Promise, function () {
            var _a, ankaConfig, projectConfig, CwdRegExp, componentPath, componentName, context, absolutePath, tpls;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = config, ankaConfig = _a.ankaConfig, projectConfig = _a.projectConfig;
                        CwdRegExp = new RegExp("^" + config.cwd);
                        componentPath = component.split(path.sep).length === 1 ?
                            path.join(ankaConfig.components, component, component) :
                            component;
                        componentName = path.basename(componentPath);
                        context = {
                            componentName: componentName
                        };
                        absolutePath = root ?
                            path.join(config.srcDir, ankaConfig.subPackages, root, componentPath) :
                            path.join(config.srcDir, componentPath);
                        if (fs.existsSync(path.join(path.dirname(absolutePath), componentName + '.json'))) {
                            logger$3.warn('The component already exists', absolutePath);
                            return [2];
                        }
                        return [4, searchFiles("" + path.join(ankaConfig.template.component, '*.*'))];
                    case 1:
                        tpls = _b.sent();
                        tpls.forEach(function (tpl) {
                            editor.copy(tpl, path.join(path.dirname(absolutePath), componentName + path.extname(tpl)), context);
                        });
                        return [4, editor.save()];
                    case 2:
                        _b.sent();
                        logger$3.success('Create component', absolutePath.replace(CwdRegExp, ''));
                        return [2];
                }
            });
        });
    };
    return CreateComponentCommand;
}(Command));

var logger$4 = logger, FsEditor$3 = FsEditor;
var EnrollComponentCommand = (function (_super) {
    tslib_1.__extends(EnrollComponentCommand, _super);
    function EnrollComponentCommand() {
        var _this = _super.call(this, 'enroll <components...>', 'Enroll a miniprogram component') || this;
        _this.setExamples('$ anka enroll button --global', '$ anka enroll /components/button/button --global', '$ anka enroll /components/button/button --page=/pages/index/index');
        _this.setOptions('-p, --page <page>', 'which page components enroll to');
        _this.setOptions('-g, --global', 'enroll components to app.json');
        _this.$compiler = new Compiler();
        return _this;
    }
    EnrollComponentCommand.prototype.action = function (components, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var page, global, editor;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        page = options.page, global = options.global;
                        editor = new FsEditor$3();
                        if (!global && !page) {
                            logger$4.warn('Where components enroll to?');
                            return [2];
                        }
                        return [4, Promise.all(components.map(function (component) {
                                return _this.enrollComponent(component, editor, global ? '' : page);
                            }))];
                    case 1:
                        _a.sent();
                        logger$4.success('Done', 'Have a nice day 🎉 !');
                        return [2];
                }
            });
        });
    };
    EnrollComponentCommand.prototype.enrollComponent = function (component, editor, page) {
        return tslib_1.__awaiter(this, void 0, Promise, function () {
            var _a, ankaConfig, projectConfig, CwdRegExp, componentPath, componentName, appConfigPath, componentAbsPath, pageAbsPath, pageJsonPath, pageJson;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = config, ankaConfig = _a.ankaConfig, projectConfig = _a.projectConfig;
                        CwdRegExp = new RegExp("^" + config.cwd);
                        componentPath = component.split(path.sep).length === 1 ?
                            path.join(ankaConfig.components, component, component) :
                            component;
                        componentName = componentPath.split(path.sep).pop();
                        appConfigPath = path.join(config.srcDir, 'app.json');
                        componentAbsPath = path.join(config.srcDir, componentPath);
                        if (!fs.existsSync(path.join(path.dirname(componentAbsPath), componentName + '.json'))) {
                            logger$4.warn('Component dose not exists', componentAbsPath);
                            return [2];
                        }
                        if (!page) return [3, 2];
                        pageAbsPath = path.join(config.srcDir, page);
                        pageJsonPath = path.join(path.dirname(pageAbsPath), path.basename(pageAbsPath) + '.json');
                        if (!fs.existsSync(pageJsonPath)) {
                            logger$4.warn('Page dose not exists', pageAbsPath);
                            return [2];
                        }
                        pageJson = JSON.parse(fs.readFileSync(pageJsonPath, {
                            encoding: 'utf8'
                        }) || '{}');
                        this.ensureUsingComponents(pageJson);
                        if (pageJson.usingComponents[componentName]) {
                            logger$4.warn('Component already enrolled in', pageAbsPath);
                            return [2];
                        }
                        pageJson.usingComponents[componentName] = path.relative(path.dirname(pageAbsPath), componentAbsPath);
                        editor.writeJSON(pageJsonPath, pageJson);
                        return [4, editor.save()];
                    case 1:
                        _b.sent();
                        logger$4.success("Enroll " + componentPath + " in", pageAbsPath.replace(CwdRegExp, ''));
                        return [3, 4];
                    case 2:
                        this.ensureUsingComponents(projectConfig);
                        if (projectConfig.usingComponents[componentName]) {
                            logger$4.warn('Component already enrolled in', 'app.json');
                            return [2];
                        }
                        projectConfig.usingComponents[componentName] = path.relative(path.dirname(appConfigPath), componentAbsPath);
                        editor.writeJSON(appConfigPath, projectConfig);
                        return [4, editor.save()];
                    case 3:
                        _b.sent();
                        logger$4.success("Enroll " + componentPath + " in", 'app.json');
                        _b.label = 4;
                    case 4: return [2];
                }
            });
        });
    };
    EnrollComponentCommand.prototype.ensureUsingComponents = function (config$$1) {
        if (!config$$1.usingComponents) {
            config$$1.usingComponents = {};
        }
    };
    return EnrollComponentCommand;
}(Command));

var commands = [
    new DevCommand$1(),
    new DevCommand(),
    new InitCommand(),
    new CreatePageCommand(),
    new CreateComponentCommand(),
    new EnrollComponentCommand()
];

var _this = undefined;
var commander = require('commander');
var pkgJson = require('../package.json');
require('source-map-support').install();
if (!semver.satisfies(semver.clean(process.version), pkgJson.engines.node)) {
    logger.error('Required node version ' + pkgJson.engines.node);
    process.exit(1);
}
if (process.argv.indexOf('--debug') > -1) {
    config.ankaConfig.debug = true;
}
if (process.argv.indexOf('--slient') > -1) {
    config.ankaConfig.quiet = true;
}
commander
    .option('--debug', 'enable debug mode')
    .option('--quiet', 'hide compile log')
    .version(pkgJson.version)
    .usage('<command> [options]');
commands.forEach(function (command) {
    var cmd = commander.command(command.command);
    if (command.description) {
        cmd.description(command.description);
    }
    if (command.usage) {
        cmd.usage(command.usage);
    }
    if (command.on) {
        for (var key in command.on) {
            cmd.on(key, command.on[key]);
        }
    }
    if (command.options) {
        command.options.forEach(function (option) {
            cmd.option.apply(cmd, option);
        });
    }
    if (command.action) {
        cmd.action(function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return tslib_1.__awaiter(_this, void 0, void 0, function () {
                var err_1;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4, command.action.apply(command, args)];
                        case 1:
                            _a.sent();
                            return [3, 3];
                        case 2:
                            err_1 = _a.sent();
                            logger.error(err_1.message || '');
                            console.log(err_1);
                            return [3, 3];
                        case 3: return [2];
                    }
                });
            });
        });
    }
    if (command.examples) {
        cmd.on('--help', function () {
            command.printTitle('Examples:');
            command.examples.forEach(function (example) {
                command.printContent(example);
            });
        });
    }
});
if (process.argv.length === 2) {
    var Logo = cfonts.render('Anka', {
        font: 'simple',
        colors: ['greenBright']
    });
    console.log(Logo.string.replace(/(\s+)$/, " " + pkgJson.version + "\r\n"));
    commander.outputHelp();
}
commander.parse(process.argv);

module.exports = Compiler;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlscy9yZXNvbHZlQ29uZmlnLnRzIiwiLi4vc3JjL3BhcnNlcnMvc2Fzc1BhcnNlci50cyIsIi4uL3NyYy9wYXJzZXJzL3N0eWxlUGFyc2VyL3Bvc3Rjc3NXeGltcG9ydC50cyIsIi4uL3NyYy9wYXJzZXJzL3N0eWxlUGFyc2VyL2luZGV4LnRzIiwiLi4vc3JjL3BhcnNlcnMvYmFiZWxQYXJzZXIudHMiLCIuLi9zcmMvcGx1Z2lucy9zYXZlRmlsZVBsdWdpbi9pbmRleC50cyIsIi4uL3NyYy9wYXJzZXJzL3R5cGVzY3JpcHRQYXJzZXIudHMiLCIuLi9zcmMvcGx1Z2lucy9leHRyYWN0RGVwZW5kZW5jeVBsdWdpbi9pbmRleC50cyIsIi4uL3NyYy9jb25maWcvYW5rYURlZmF1bHRDb25maWcudHMiLCIuLi9zcmMvY29uZmlnL2Fua2FDb25maWcudHMiLCIuLi9zcmMvY29uZmlnL3N5c3RlbUNvbmZpZy50cyIsIi4uL3NyYy9jb25maWcvcHJvamVjdENvbmZpZy50cyIsIi4uL3NyYy9jb25maWcvaW5kZXgudHMiLCIuLi9zcmMvdXRpbHMvZnMudHMiLCIuLi9zcmMvdXRpbHMvbG9nZ2VyLnRzIiwiLi4vc3JjL2NvcmUvY2xhc3MvRmlsZS50cyIsIi4uL3NyYy91dGlscy9jcmVhdGVGaWxlLnRzIiwiLi4vc3JjL3V0aWxzL2VkaXRvci50cyIsIi4uL3NyYy91dGlscy9yZXNvbHZlTW9kdWxlLnRzIiwiLi4vc3JjL3V0aWxzL2NhbGxQcm9taXNlSW5DaGFpbi50cyIsIi4uL3NyYy91dGlscy9hc3luY0Z1bmN0aW9uV3JhcHBlci50cyIsIi4uL3NyYy91dGlscy9nZW5GaWxlV2F0Y2hlci50cyIsIi4uL3NyYy91dGlscy9pc05wbURlcGVuZGVuY3kudHMiLCIuLi9zcmMvdXRpbHMvZG93bmxvYWRSZXBlLnRzIiwiLi4vc3JjL2NvcmUvY2xhc3MvSW5qZWN0aW9uLnRzIiwiLi4vc3JjL2NvcmUvY2xhc3MvQ29tcGlsYXRpb24udHMiLCIuLi9zcmMvY29yZS9jbGFzcy9Db21waWxlci50cyIsIi4uL3NyYy9jb3JlL2NsYXNzL0NvbW1hbmQudHMiLCIuLi9zcmMvY29tbWFuZHMvZGV2LnRzIiwiLi4vc3JjL2NvbW1hbmRzL2luaXQudHMiLCIuLi9zcmMvY29tbWFuZHMvcHJvZC50cyIsIi4uL3NyYy9jb21tYW5kcy9jcmVhdGVQYWdlLnRzIiwiLi4vc3JjL2NvbW1hbmRzL2NyZWF0ZUNvbXBvbmVudC50cyIsIi4uL3NyYy9jb21tYW5kcy9lbnJvbGxDb21wb25lbnQudHMiLCIuLi9zcmMvY29tbWFuZHMudHMiLCIuLi9zcmMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5cbmNvbnN0IGN3ZCA9IHByb2Nlc3MuY3dkKClcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKG5hbWVzOiBBcnJheTxzdHJpbmc+ID0gW10sIHJvb3Q/OiBzdHJpbmcpOiBPYmplY3Qge1xuICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IHt9XG4gICAgY29uc3QgY29uZmlnUGF0aHMgPSBuYW1lcy5tYXAobmFtZSA9PiBwYXRoLmpvaW4ocm9vdCB8fCBjd2QsIG5hbWUpKVxuXG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGNvbmZpZ1BhdGhzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICBjb25zdCBjb25maWdQYXRoID0gY29uZmlnUGF0aHNbaW5kZXhdXG5cbiAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoY29uZmlnUGF0aCkpIHtcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oZGVmYXVsdFZhbHVlLCByZXF1aXJlKGNvbmZpZ1BhdGgpKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkZWZhdWx0VmFsdWVcbn1cbiIsImltcG9ydCAqIGFzIHNhc3MgZnJvbSAnbm9kZS1zYXNzJ1xuXG5pbXBvcnQge1xuICAgIEZpbGUsXG4gICAgUGFyc2VyLFxuICAgIENvbXBpbGF0aW9uLFxuICAgIFBhcnNlckluamVjdGlvblxufSBmcm9tICcuLi8uLi90eXBlcy90eXBlcydcblxuLyoqXG4gKiBTYXNzIGZpbGUgcGFyc2VyLlxuICogQGZvciBhbnkgZmlsZSB0aGF0IGRvZXMgbm90IG1hdGNoZSBwYXJzZXJzLlxuICovXG5leHBvcnQgZGVmYXVsdCA8UGFyc2VyPmZ1bmN0aW9uICh0aGlzOiBQYXJzZXJJbmplY3Rpb24sIGZpbGU6IEZpbGUsIGNvbXBpbGF0aW9uOiBDb21waWxhdGlvbiwgY2FsbGJhY2s/OiBGdW5jdGlvbikge1xuICAgIGNvbnN0IHV0aWxzID0gdGhpcy5nZXRVdGlscygpXG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5nZXRTeXN0ZW1Db25maWcoKVxuXG4gICAgZmlsZS5jb250ZW50ID0gZmlsZS5jb250ZW50IGluc3RhbmNlb2YgQnVmZmVyID8gZmlsZS5jb250ZW50LnRvU3RyaW5nKCkgOiBmaWxlLmNvbnRlbnRcblxuICAgIHNhc3MucmVuZGVyKHtcbiAgICAgICAgZmlsZTogZmlsZS5zb3VyY2VGaWxlLFxuICAgICAgICBkYXRhOiBmaWxlLmNvbnRlbnQsXG4gICAgICAgIG91dHB1dFN0eWxlOiAhY29uZmlnLmFua2FDb25maWcuZGV2TW9kZSA/ICduZXN0ZWQnIDogJ2NvbXByZXNzZWQnXG4gICAgfSwgKGVycjogRXJyb3IsIHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIHV0aWxzLmxvZ2dlci5lcnJvcignQ29tcGlsZScsIGVyci5tZXNzYWdlLCBlcnIpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmaWxlLmNvbnRlbnQgPSByZXN1bHQuY3NzXG4gICAgICAgICAgICBmaWxlLnVwZGF0ZUV4dCgnLnd4c3MnKVxuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrKClcbiAgICB9KVxufVxuIiwiY29uc3QgcG9zdGNzcyA9IHJlcXVpcmUoJ3Bvc3Rjc3MnKVxuXG5leHBvcnQgZGVmYXVsdCBwb3N0Y3NzLnBsdWdpbigncG9zdGNzcy13eGltcG9ydCcsICgpID0+IHtcbiAgICByZXR1cm4gKHJvb3Q6IGFueSkgPT4ge1xuICAgICAgICByb290LndhbGtBdFJ1bGVzKCd3eGltcG9ydCcsIChydWxlOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHJ1bGUubmFtZSA9ICdpbXBvcnQnXG4gICAgICAgICAgICBydWxlLnBhcmFtcyA9IHJ1bGUucGFyYW1zLnJlcGxhY2UoL1xcLlxcdysoPz1bJ1wiXSQpLywgJy53eHNzJylcbiAgICAgICAgfSlcbiAgICB9XG59KVxuIiwiaW1wb3J0ICogYXMgUG9zdGNzcyBmcm9tICdwb3N0Y3NzJ1xuaW1wb3J0IHBvc3Rjc3NyYyBmcm9tICdwb3N0Y3NzLWxvYWQtY29uZmlnJ1xuaW1wb3J0IHBvc3Rjc3NXeEltcG9ydCBmcm9tICcuL3Bvc3Rjc3NXeGltcG9ydCdcblxuaW1wb3J0IHtcbiAgICBGaWxlLFxuICAgIFBhcnNlcixcbiAgICBDb21waWxhdGlvbixcbiAgICBQYXJzZXJJbmplY3Rpb25cbn0gZnJvbSAnLi4vLi4vLi4vdHlwZXMvdHlwZXMnXG5cbmNvbnN0IHBvc3Rjc3MgPSByZXF1aXJlKCdwb3N0Y3NzJylcbmNvbnN0IHBvc3Rjc3NDb25maWc6IGFueSA9IHt9XG5cbi8qKlxuICogU3R5bGUgZmlsZSBwYXJzZXIuXG4gKiBAZm9yIC53eHNzIC5jc3MgPT4gLnd4c3NcbiAqL1xuZXhwb3J0IGRlZmF1bHQgPFBhcnNlcj5mdW5jdGlvbiAodGhpczogUGFyc2VySW5qZWN0aW9uLCBmaWxlOiBGaWxlLCBjb21waWxhdGlvbjogQ29tcGlsYXRpb24sIGNiOiBGdW5jdGlvbik6IHZvaWQge1xuICAgIGdlblBvc3Rjc3NDb25maWcoKS50aGVuKChjb25maWc6IGFueSkgPT4ge1xuICAgICAgICBmaWxlLmNvbnRlbnQgPSBmaWxlLmNvbnRlbnQgaW5zdGFuY2VvZiBCdWZmZXIgPyBmaWxlLmNvbnRlbnQudG9TdHJpbmcoKSA6IGZpbGUuY29udGVudFxuXG4gICAgICAgIHJldHVybiBwb3N0Y3NzKGNvbmZpZy5wbHVnaW5zLmNvbmNhdChbcG9zdGNzc1d4SW1wb3J0XSkpLnByb2Nlc3MoZmlsZS5jb250ZW50LCB7XG4gICAgICAgICAgICAuLi5jb25maWcub3B0aW9ucyxcbiAgICAgICAgICAgIGZyb206IGZpbGUuc291cmNlRmlsZVxuICAgICAgICB9IGFzIFBvc3Rjc3MuUHJvY2Vzc09wdGlvbnMpXG4gICAgfSkudGhlbigocm9vdDogUG9zdGNzcy5MYXp5UmVzdWx0KSA9PiB7XG4gICAgICAgIGZpbGUuY29udGVudCA9IHJvb3QuY3NzXG4gICAgICAgIGZpbGUudXBkYXRlRXh0KCcud3hzcycpXG4gICAgICAgIGNiKClcbiAgICB9KVxufVxuXG5cbmZ1bmN0aW9uIGdlblBvc3Rjc3NDb25maWcgKCkge1xuICAgIHJldHVybiBwb3N0Y3NzQ29uZmlnLnBsdWdpbnMgPyBQcm9taXNlLnJlc29sdmUocG9zdGNzc0NvbmZpZykgOiBwb3N0Y3NzcmMoe30pLnRoZW4oKGNvbmZpZzogYW55KSA9PiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoT2JqZWN0LmFzc2lnbihwb3N0Y3NzQ29uZmlnLCBjb25maWcpKVxuICAgIH0pXG59XG4iLCJpbXBvcnQgKiBhcyBiYWJlbCBmcm9tICdAYmFiZWwvY29yZSdcbmltcG9ydCBGaWxlIGZyb20gJy4uL2NvcmUvY2xhc3MvRmlsZSdcblxuaW1wb3J0IHtcbiAgICBQYXJzZXIsXG4gICAgQ29tcGlsYXRpb24sXG4gICAgUGFyc2VySW5qZWN0aW9uXG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5sZXQgYmFiZWxDb25maWcgPSA8YmFiZWwuVHJhbnNmb3JtT3B0aW9ucz5udWxsXG5cbi8qKlxuICogU2NyaXB0IEZpbGUgcGFyc2VyLlxuICogQGZvciAuanMgLmVzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IDxQYXJzZXI+ZnVuY3Rpb24gKHRoaXM6IFBhcnNlckluamVjdGlvbiwgZmlsZTogRmlsZSwgY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYjogRnVuY3Rpb24pIHtcbiAgICBjb25zdCB1dGlscyA9IHRoaXMuZ2V0VXRpbHMoKVxuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuZ2V0U3lzdGVtQ29uZmlnKClcblxuICAgIGlmIChmaWxlLmlzSW5TcmNEaXIpIHtcbiAgICAgICAgaWYgKCFiYWJlbENvbmZpZykge1xuICAgICAgICAgICAgYmFiZWxDb25maWcgPSA8YmFiZWwuVHJhbnNmb3JtT3B0aW9ucz51dGlscy5yZXNvbHZlQ29uZmlnKFsnYmFiZWwuY29uZmlnLmpzJ10sIGNvbmZpZy5jd2QpXG4gICAgICAgIH1cblxuICAgICAgICBmaWxlLmNvbnRlbnQgPSBmaWxlLmNvbnRlbnQgaW5zdGFuY2VvZiBCdWZmZXIgPyBmaWxlLmNvbnRlbnQudG9TdHJpbmcoKSA6IGZpbGUuY29udGVudFxuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGJhYmVsLnRyYW5zZm9ybVN5bmMoZmlsZS5jb250ZW50LCB7XG4gICAgICAgICAgICBiYWJlbHJjOiBmYWxzZSxcbiAgICAgICAgICAgIGFzdDogdHJ1ZSxcbiAgICAgICAgICAgIGZpbGVuYW1lOiBmaWxlLnNvdXJjZUZpbGUsXG4gICAgICAgICAgICBzb3VyY2VUeXBlOiAnbW9kdWxlJyxcbiAgICAgICAgICAgIHNvdXJjZU1hcHM6IGNvbmZpZy5hbmthQ29uZmlnLmRldk1vZGUsXG4gICAgICAgICAgICAuLi5iYWJlbENvbmZpZ1xuICAgICAgICB9KVxuXG4gICAgICAgIGZpbGUuc291cmNlTWFwID0gSlNPTi5zdHJpbmdpZnkocmVzdWx0Lm1hcClcbiAgICAgICAgZmlsZS5jb250ZW50ID0gcmVzdWx0LmNvZGVcbiAgICAgICAgZmlsZS5hc3QgPSByZXN1bHQuYXN0XG4gICAgfVxuXG4gICAgZmlsZS51cGRhdGVFeHQoJy5qcycpXG4gICAgY2IoKVxufVxuIiwiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnXG5cbmltcG9ydCB7XG4gICAgUGx1Z2luLFxuICAgIENvbXBpbGF0aW9uLFxuICAgIFBsdWdpbkhhbmRsZXIsXG4gICAgUGx1Z2luSW5qZWN0aW9uXG59IGZyb20gJy4uLy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5jb25zdCBpbmxpbmVTb3VyY2VNYXBDb21tZW50ID0gcmVxdWlyZSgnaW5saW5lLXNvdXJjZS1tYXAtY29tbWVudCcpXG5cbmV4cG9ydCBkZWZhdWx0IDxQbHVnaW4+ZnVuY3Rpb24gKHRoaXM6IFBsdWdpbkluamVjdGlvbikge1xuICAgIGNvbnN0IHV0aWxzID0gdGhpcy5nZXRVdGlscygpXG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5nZXRTeXN0ZW1Db25maWcoKVxuICAgIGNvbnN0IHtcbiAgICAgICAgbG9nZ2VyLFxuICAgICAgICB3cml0ZUZpbGVcbiAgICB9ID0gdXRpbHNcblxuICAgIHRoaXMub24oJ2FmdGVyLWNvbXBpbGUnLCA8UGx1Z2luSGFuZGxlcj5mdW5jdGlvbiAoY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYjogRnVuY3Rpb24pIHtcbiAgICAgICAgY29uc3QgZmlsZSA9IGNvbXBpbGF0aW9uLmZpbGVcblxuICAgICAgICAvLyBUT0RPOiBVc2UgbWVtLWZzXG4gICAgICAgIGZzLmVuc3VyZUZpbGUoZmlsZS50YXJnZXRGaWxlKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGlmIChjb25maWcuYW5rYUNvbmZpZy5kZXZNb2RlICYmIGZpbGUuc291cmNlTWFwKSB7XG4gICAgICAgICAgICAgICAgaWYgKGZpbGUuY29udGVudCBpbnN0YW5jZW9mIEJ1ZmZlcikge1xuICAgICAgICAgICAgICAgICAgICBmaWxlLmNvbnRlbnQgPSBmaWxlLmNvbnRlbnQudG9TdHJpbmcoKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmaWxlLmNvbnRlbnQgPSBmaWxlLmNvbnRlbnQgKyAnXFxyXFxuXFxyXFxuJyArIGlubGluZVNvdXJjZU1hcENvbW1lbnQoZmlsZS5zb3VyY2VNYXAsIHtcbiAgICAgICAgICAgICAgICAgICAgYmxvY2s6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZXNDb250ZW50OiB0cnVlXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB3cml0ZUZpbGUoZmlsZS50YXJnZXRGaWxlLCBmaWxlLmNvbnRlbnQpXG4gICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgY29tcGlsYXRpb24uZGVzdHJveSgpXG4gICAgICAgICAgICBjYigpXG4gICAgICAgIH0sIGVyciA9PiB7XG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yJywgZXJyLm1lc3NhZ2UsIGVycilcbiAgICAgICAgICAgIGNvbXBpbGF0aW9uLmRlc3Ryb3koKVxuICAgICAgICAgICAgY2IoKVxuICAgICAgICB9KVxuICAgIH0pXG59XG4iLCJpbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0J1xuXG5pbXBvcnQge1xuICAgIEZpbGUsXG4gICAgUGFyc2VyLFxuICAgIENvbXBpbGF0aW9uLFxuICAgIFBhcnNlckluamVjdGlvblxufSBmcm9tICcuLi8uLi90eXBlcy90eXBlcydcblxubGV0IHRzQ29uZmlnID0gPHRzLlRyYW5zcGlsZU9wdGlvbnM+bnVsbFxuXG4vKipcbiAqIFR5cGVzY3JpcHQgZmlsZSBwYXJzZXIuXG4gKlxuICogQGZvciBhbnkgZmlsZSB0aGF0IGRvZXMgbm90IG1hdGNoZSBwYXJzZXJzLlxuICovXG5leHBvcnQgZGVmYXVsdCA8UGFyc2VyPmZ1bmN0aW9uICh0aGlzOiBQYXJzZXJJbmplY3Rpb24sIGZpbGU6IEZpbGUsIGNvbXBpbGF0aW9uOiBDb21waWxhdGlvbiwgY2FsbGJhY2s/OiBGdW5jdGlvbikge1xuICAgIGNvbnN0IHV0aWxzID0gdGhpcy5nZXRVdGlscygpXG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5nZXRTeXN0ZW1Db25maWcoKVxuICAgIGNvbnN0IHsgbG9nZ2VyIH0gPSB1dGlsc1xuXG4gICAgZmlsZS5jb250ZW50ID0gZmlsZS5jb250ZW50IGluc3RhbmNlb2YgQnVmZmVyID8gZmlsZS5jb250ZW50LnRvU3RyaW5nKCkgOiBmaWxlLmNvbnRlbnRcbiAgICBjb25zdCBzb3VyY2VNYXAgPSAge1xuICAgICAgICBzb3VyY2VzQ29udGVudDogW2ZpbGUuY29udGVudF1cbiAgICB9XG5cbiAgICBpZiAoIXRzQ29uZmlnKSB7XG4gICAgICAgIHRzQ29uZmlnID0gPHRzLlRyYW5zcGlsZU9wdGlvbnM+dXRpbHMucmVzb2x2ZUNvbmZpZyhbJ3RzY29uZmlnLmpzb24nLCAndHNjb25maWcuanMnXSwgY29uZmlnLmN3ZClcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQgPSB0cy50cmFuc3BpbGVNb2R1bGUoZmlsZS5jb250ZW50LCB7XG4gICAgICAgIGNvbXBpbGVyT3B0aW9uczogdHNDb25maWcuY29tcGlsZXJPcHRpb25zLFxuICAgICAgICBmaWxlTmFtZTogZmlsZS5zb3VyY2VGaWxlXG4gICAgfSlcblxuICAgIHRyeSB7XG4gICAgICAgIGZpbGUuY29udGVudCA9IHJlc3VsdC5vdXRwdXRUZXh0XG4gICAgICAgIGlmIChjb25maWcuYW5rYUNvbmZpZy5kZXZNb2RlKSB7XG4gICAgICAgICAgICBmaWxlLnNvdXJjZU1hcCA9IHtcbiAgICAgICAgICAgICAgICAuLi5KU09OLnBhcnNlKHJlc3VsdC5zb3VyY2VNYXBUZXh0KSxcbiAgICAgICAgICAgICAgICAuLi5zb3VyY2VNYXBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmaWxlLnVwZGF0ZUV4dCgnLmpzJylcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgbG9nZ2VyLmVycm9yKCdDb21waWxlIGVycm9yJywgZXJyLm1lc3NhZ2UsIGVycilcbiAgICB9XG5cbiAgICBjYWxsYmFjaygpXG59XG4iLCJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgKiBhcyB0IGZyb20gJ0BiYWJlbC90eXBlcydcbmltcG9ydCAqIGFzIGJhYmVsIGZyb20gJ0BiYWJlbC9jb3JlJ1xuaW1wb3J0IHRyYXZlcnNlIGZyb20gJ0BiYWJlbC90cmF2ZXJzZSdcbmltcG9ydCBjb2RlR2VuZXJhdG9yIGZyb20gJ0BiYWJlbC9nZW5lcmF0b3InXG5cbmltcG9ydCB7XG4gICAgUGx1Z2luLFxuICAgIENvbXBpbGF0aW9uLFxuICAgIFBsdWdpbkhhbmRsZXIsXG4gICAgUGx1Z2luSW5qZWN0aW9uXG59IGZyb20gJy4uLy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5jb25zdCBkZXBlbmRlbmN5UG9vbCA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KClcbmNvbnN0IHJlc292bGVNb2R1bGVOYW1lID0gcmVxdWlyZSgncmVxdWlyZS1wYWNrYWdlLW5hbWUnKVxuXG5leHBvcnQgZGVmYXVsdCA8UGx1Z2luPiBmdW5jdGlvbiAodGhpczogUGx1Z2luSW5qZWN0aW9uKSB7XG4gICAgY29uc3QgdXRpbHMgPSB0aGlzLmdldFV0aWxzKClcbiAgICBjb25zdCBjb21waWxlciA9IHRoaXMuZ2V0Q29tcGlsZXIoKVxuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuZ2V0U3lzdGVtQ29uZmlnKClcbiAgICBjb25zdCB0ZXN0U3JjRGlyID0gbmV3IFJlZ0V4cChgXiR7Y29uZmlnLnNyY0Rpcn1gKVxuICAgIGNvbnN0IHRlc3ROb2RlTW9kdWxlcyA9IG5ldyBSZWdFeHAoYF4ke2NvbmZpZy5zb3VyY2VOb2RlTW9kdWxlc31gKVxuXG4gICAgdGhpcy5vbignYmVmb3JlLWNvbXBpbGUnLCBmdW5jdGlvbiAoY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYjogRnVuY3Rpb24pIHtcbiAgICAgICAgY29uc3QgZmlsZSA9IGNvbXBpbGF0aW9uLmZpbGVcbiAgICAgICAgY29uc3QgbG9jYWxEZXBlbmRlbmN5UG9vbCA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KClcblxuICAgICAgICAvLyBPbmx5IHJlc29sdmUganMgZmlsZS5cbiAgICAgICAgaWYgKGZpbGUuZXh0bmFtZSA9PT0gJy5qcycpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGZpbGUuc291cmNlRmlsZSwgZmlsZS5hc3QgPyAnb2JqZWN0JyA6IGZpbGUuYXN0KVxuICAgICAgICAgICAgaWYgKCFmaWxlLmFzdCkge1xuICAgICAgICAgICAgICAgIGZpbGUuYXN0ID0gPHQuRmlsZT5iYWJlbC5wYXJzZShcbiAgICAgICAgICAgICAgICAgICAgZmlsZS5jb250ZW50IGluc3RhbmNlb2YgQnVmZmVyID8gZmlsZS5jb250ZW50LnRvU3RyaW5nKCkgOiBmaWxlLmNvbnRlbnQsXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhYmVscmM6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlVHlwZTogJ21vZHVsZSdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdHJhdmVyc2UoZmlsZS5hc3QsIHtcbiAgICAgICAgICAgICAgICBlbnRlciAocGF0aCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocGF0aC5pc0ltcG9ydERlY2xhcmF0aW9uKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBwYXRoLm5vZGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNvdXJjZSA9IG5vZGUuc291cmNlXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2UgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2UudmFsdWUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlb2Ygc291cmNlLnZhbHVlID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShzb3VyY2UsIGZpbGUuc291cmNlRmlsZSwgZmlsZS50YXJnZXRGaWxlLCBsb2NhbERlcGVuZGVuY3lQb29sKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhdGguaXNDYWxsRXhwcmVzc2lvbigpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBub2RlID0gcGF0aC5ub2RlXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjYWxsZWUgPSA8dC5JZGVudGlmaWVyPm5vZGUuY2FsbGVlXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhcmdzID0gPHQuU3RyaW5nTGl0ZXJhbFtdPm5vZGUuYXJndW1lbnRzXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGVlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJnc1swXSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3NbMF0udmFsdWUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsZWUubmFtZSA9PT0gJ3JlcXVpcmUnICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIGFyZ3NbMF0udmFsdWUgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGFyZ3NbMF0sIGZpbGUuc291cmNlRmlsZSwgZmlsZS50YXJnZXRGaWxlLCBsb2NhbERlcGVuZGVuY3lQb29sKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgZmlsZS5jb250ZW50ID0gY29kZUdlbmVyYXRvcihmaWxlLmFzdCkuY29kZVxuXG4gICAgICAgICAgICBjb25zdCBkZXBlbmRlbmN5TGlzdCA9IEFycmF5LmZyb20obG9jYWxEZXBlbmRlbmN5UG9vbC5rZXlzKCkpLmZpbHRlcihkZXBlbmRlbmN5ID0+ICFkZXBlbmRlbmN5UG9vbC5oYXMoZGVwZW5kZW5jeSkpXG5cbiAgICAgICAgICAgIFByb21pc2UuYWxsKGRlcGVuZGVuY3lMaXN0Lm1hcChkZXBlbmRlbmN5ID0+IHRyYXZlcnNlTnBtRGVwZW5kZW5jeShkZXBlbmRlbmN5KSkpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNiKClcbiAgICAgICAgICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgY2IoKVxuICAgICAgICAgICAgICAgIHV0aWxzLmxvZ2dlci5lcnJvcihmaWxlLnNvdXJjZUZpbGUsIGVyci5tZXNzYWdlLCBlcnIpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2IoKVxuICAgICAgICB9XG4gICAgfSBhcyBQbHVnaW5IYW5kbGVyKVxuXG4gICAgZnVuY3Rpb24gcmVzb2x2ZSAobm9kZTogYW55LCBzb3VyY2VGaWxlOiBzdHJpbmcsIHRhcmdldEZpbGU6IHN0cmluZywgbG9jYWxEZXBlbmRlbmN5UG9vbDogTWFwPHN0cmluZywgc3RyaW5nPikge1xuICAgICAgICBjb25zdCBzb3VyY2VCYXNlTmFtZSA9IHBhdGguZGlybmFtZShzb3VyY2VGaWxlKVxuICAgICAgICBjb25zdCB0YXJnZXRCYXNlTmFtZSA9IHBhdGguZGlybmFtZSh0YXJnZXRGaWxlKVxuICAgICAgICBjb25zdCBtb2R1bGVOYW1lID0gcmVzb3ZsZU1vZHVsZU5hbWUobm9kZS52YWx1ZSlcblxuICAgICAgICBpZiAodXRpbHMuaXNOcG1EZXBlbmRlbmN5KG1vZHVsZU5hbWUpIHx8IHRlc3ROb2RlTW9kdWxlcy50ZXN0KHNvdXJjZUZpbGUpKSB7XG4gICAgICAgICAgICBjb25zdCBkZXBlbmRlbmN5ID0gdXRpbHMucmVzb2x2ZU1vZHVsZShub2RlLnZhbHVlLCB7XG4gICAgICAgICAgICAgICAgcGF0aHM6IFtzb3VyY2VCYXNlTmFtZV1cbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIC8vIEluIGNhc2UgYHJlcXVpcmUoJ2EnKWAsIGBhYCBpcyBsb2NhbCBmaWxlIGluIHNyYyBkaXJlY3RvcnlcbiAgICAgICAgICAgIGlmICghZGVwZW5kZW5jeSB8fCB0ZXN0U3JjRGlyLnRlc3QoZGVwZW5kZW5jeSkpIHJldHVyblxuXG4gICAgICAgICAgICBjb25zdCBkaXN0UGF0aCA9IGRlcGVuZGVuY3kucmVwbGFjZShjb25maWcuc291cmNlTm9kZU1vZHVsZXMsIGNvbmZpZy5kaXN0Tm9kZU1vZHVsZXMpXG5cbiAgICAgICAgICAgIG5vZGUudmFsdWUgPSBwYXRoLnJlbGF0aXZlKHRhcmdldEJhc2VOYW1lLCBkaXN0UGF0aClcblxuICAgICAgICAgICAgaWYgKGxvY2FsRGVwZW5kZW5jeVBvb2wuaGFzKGRlcGVuZGVuY3kpKSByZXR1cm5cbiAgICAgICAgICAgIGxvY2FsRGVwZW5kZW5jeVBvb2wuc2V0KGRlcGVuZGVuY3ksIGRlcGVuZGVuY3kpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBmdW5jdGlvbiB0cmF2ZXJzZU5wbURlcGVuZGVuY3kgKGRlcGVuZGVuY3k6IHN0cmluZykge1xuICAgICAgICBkZXBlbmRlbmN5UG9vbC5zZXQoZGVwZW5kZW5jeSwgZGVwZW5kZW5jeSlcbiAgICAgICAgY29uc3QgZmlsZSA9IGF3YWl0IHV0aWxzLmNyZWF0ZUZpbGUoZGVwZW5kZW5jeSlcblxuICAgICAgICBmaWxlLnRhcmdldEZpbGUgPSBmaWxlLnNvdXJjZUZpbGUucmVwbGFjZShjb25maWcuc291cmNlTm9kZU1vZHVsZXMsIGNvbmZpZy5kaXN0Tm9kZU1vZHVsZXMpXG4gICAgICAgIGF3YWl0IGNvbXBpbGVyLmdlbmVyYXRlQ29tcGlsYXRpb24oZmlsZSkucnVuKClcbiAgICB9XG5cbn1cbiIsIi8vIGltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBzYXNzUGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvc2Fzc1BhcnNlcidcbmltcG9ydCBmaWxlUGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvZmlsZVBhcnNlcidcbmltcG9ydCBzdHlsZVBhcnNlciBmcm9tICcuLi9wYXJzZXJzL3N0eWxlUGFyc2VyJ1xuaW1wb3J0IGJhYmVsUGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvYmFiZWxQYXJzZXInXG5pbXBvcnQgc2NyaXB0UGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvc2NyaXB0UGFyc2VyJ1xuaW1wb3J0IHRlbXBsYXRlUGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvdGVtcGxhdGVQYXJzZXInXG5pbXBvcnQgc2F2ZUZpbGVQbHVnaW4gZnJvbSAnLi4vcGx1Z2lucy9zYXZlRmlsZVBsdWdpbidcbmltcG9ydCB0eXBlc2NyaXB0UGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvdHlwZXNjcmlwdFBhcnNlcidcbmltcG9ydCBleHRyYWN0RGVwZW5kZW5jeVBsdWdpbiBmcm9tICcuLi9wbHVnaW5zL2V4dHJhY3REZXBlbmRlbmN5UGx1Z2luJ1xuXG5pbXBvcnQge1xuICAgIFBhcnNlcnNDb25maWdyYXRpb24sXG4gICAgUGx1Z2luc0NvbmZpZ3JhdGlvblxufSBmcm9tICcuLi8uLi90eXBlcy90eXBlcydcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgICAgICAgICAgICAgICAgICBEYW5nZXIgem9uZVxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4vKipcbiAqIFRoZSBwYXRoIHdoZXJlIFdlQ2hhdCBtaW5pcHJvZ3JhbSBzb3VyY2UgZmlsZXMgZXhpc3QuXG4gKiBAZGVmYXVsdCAnLi9zcmMnXG4gKi9cbmV4cG9ydCBjb25zdCBzb3VyY2VEaXIgPSAnLi9zcmMnXG5cbi8qKlxuICogVGhlIHBhdGggd2hlcmUgV2VDaGF0IG1pbmlwcm9ncmFtIGNvbXBpbGVkIGZpbGVzIGV4aXN0LlxuICogQGRlZmF1bHQgJy4vZGlzdCdcbiAqL1xuZXhwb3J0IGNvbnN0IG91dHB1dERpciA9ICcuL2Rpc3QnXG5cbi8qKlxuICogVGhlIHBhdGggd2hlcmUgV2VDaGF0IG1pbmlwcm9ncmFtIHBhZ2VzIGV4aXN0LlxuICogQGRlZmF1bHQgJy4vc3JjL3BhZ2VzJ1xuICovXG5leHBvcnQgY29uc3QgcGFnZXMgPSAnLi9wYWdlcydcblxuLyoqXG4gKiBUaGUgcGF0aCB3aGVyZSBXZUNoYXQgbWluaXByb2dyYW0gY29tcG9uZW50cyBleGlzdC5cbiAqIEBkZWZhdWx0ICcuL3NyYy9jb21wb25lbnRzJ1xuICovXG5leHBvcnQgY29uc3QgY29tcG9uZW50cyA9ICcuL2NvbXBvbmVudHMnXG5cbi8qKlxuICogVGVtcGxhdGUgZm9yIGNyZWF0aW5nIHBhZ2UgYW5kIGNvbXBvbmVudC5cbiAqL1xuZXhwb3J0IGNvbnN0IHRlbXBsYXRlID0ge1xuICAgIHBhZ2U6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi90ZW1wbGF0ZS9wYWdlJyksXG4gICAgY29tcG9uZW50OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vdGVtcGxhdGUvY29tcG9uZW50Jylcbn1cblxuLyoqXG4gKiBUaGUgcGF0aCB3aGVyZSBXZUNoYXQgbWluaXByb2dyYW0gc3VicGFja2FnZXMgZXhpc3QuXG4gKiBAZGVmYXVsdCAnLi9zcmMvc3ViUGFja2FnZXMnXG4gKi9cbmV4cG9ydCBjb25zdCBzdWJQYWNrYWdlcyA9ICcuL3N1YlBhY2thZ2VzJ1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICAgICAgICAgICAgICAgICBDdXN0b20gY29uZmlndXJlXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbi8qKlxuICogV2hldGhlciB0byBvdXRwdXQgY29tcGlsZSBpbmZvcm1hdGlvbi5cbiAqIEBkZWZhdWx0IGZhbHNlXG4gKi9cbmV4cG9ydCBjb25zdCBxdWlldCA9IGZhbHNlXG5cbi8qKlxuICogQW5rYSBkZXZlbG9wbWVudCBtb2RlLlxuICogQGRlZmF1bHQgZmFsc2VcbiAqL1xuZXhwb3J0IGNvbnN0IGRldk1vZGUgPSBmYWxzZVxuXG4vKipcbiAqIFJlZ2lzdGVyIGZpbGUgcGFyc2VyLlxuICovXG5leHBvcnQgY29uc3QgcGFyc2VyczogUGFyc2Vyc0NvbmZpZ3JhdGlvbiA9IFtcbiAgICB7XG4gICAgICAgIG1hdGNoOiAvLipcXC4oanN8ZXMpJC8sXG4gICAgICAgIHBhcnNlcnM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwYXJzZXI6IGJhYmVsUGFyc2VyLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IHt9XG4gICAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbWF0Y2g6IC8uKlxcLih3eHNzfGNzc3xwb3N0Y3NzKSQvLFxuICAgICAgICBwYXJzZXJzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGFyc2VyOiBzdHlsZVBhcnNlcixcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB7fVxuICAgICAgICAgICAgfVxuICAgICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG1hdGNoOiAvLipcXC4oc2Fzc3xzY3NzKSQvLFxuICAgICAgICBwYXJzZXJzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGFyc2VyOiBzYXNzUGFyc2VyLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IHt9XG4gICAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbWF0Y2g6IC8uKlxcLih0c3x0eXBlc2NyaXB0KSQvLFxuICAgICAgICBwYXJzZXJzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGFyc2VyOiB0eXBlc2NyaXB0UGFyc2VyLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IHt9XG4gICAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICB9XG5dXG5cbi8qKlxuICogV2hldGhlciB0byBvdXRwdXQgZGVidWcgaW5mb3JtYXRpb24uXG4gKiBAZGVmYXVsdCBmYWxzZVxuICovXG5leHBvcnQgY29uc3QgZGVidWc6IGJvb2xlYW4gPSBmYWxzZVxuXG4vKipcbiAqIFJlZ2lzdGVyIHBsdWdpbi5cbiAqL1xuZXhwb3J0IGNvbnN0IHBsdWdpbnM6IFBsdWdpbnNDb25maWdyYXRpb24gPSBbXG4gICAge1xuICAgICAgICBwbHVnaW46IGV4dHJhY3REZXBlbmRlbmN5UGx1Z2luLFxuICAgICAgICBvcHRpb25zOiB7fVxuICAgIH0sXG4gICAge1xuICAgICAgICBwbHVnaW46IHNhdmVGaWxlUGx1Z2luLFxuICAgICAgICBvcHRpb25zOiB7fVxuICAgIH1cbl1cblxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICAgICAgICAgICAgICAgZXhwZXJpbWVudGFsIGNvbmZpZ3VyZVxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4iLCJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgcmVzb2x2ZUNvbmZpZyBmcm9tICcuLi91dGlscy9yZXNvbHZlQ29uZmlnJ1xuaW1wb3J0ICogYXMgYW5rYURlZmF1bHRDb25maWcgZnJvbSAnLi9hbmthRGVmYXVsdENvbmZpZydcblxuaW1wb3J0IHtcbiAgICBBbmthQ29uZmlnXG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5jb25zdCBjd2QgPSBwcm9jZXNzLmN3ZCgpXG5jb25zdCBjdXN0b21Db25maWcgPSA8QW5rYUNvbmZpZz5yZXNvbHZlQ29uZmlnKFsnYW5rYS5jb25maWcuanMnLCAnYW5rYS5jb25maWcuanNvbiddKVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgLi4uYW5rYURlZmF1bHRDb25maWcsXG4gICAgLi4uY3VzdG9tQ29uZmlnLFxuICAgIHRlbXBsYXRlOiBjdXN0b21Db25maWcudGVtcGxhdGUgPyB7XG4gICAgICAgIHBhZ2U6IHBhdGguam9pbihjd2QsIGN1c3RvbUNvbmZpZy50ZW1wbGF0ZS5wYWdlKSxcbiAgICAgICAgY29tcG9uZW50OiBwYXRoLmpvaW4oY3dkLCBjdXN0b21Db25maWcudGVtcGxhdGUuY29tcG9uZW50KVxuICAgIH0gOiBhbmthRGVmYXVsdENvbmZpZy50ZW1wbGF0ZSxcbiAgICBwYXJzZXJzOiBjdXN0b21Db25maWcucGFyc2VycyA/IGN1c3RvbUNvbmZpZy5wYXJzZXJzLmNvbmNhdChhbmthRGVmYXVsdENvbmZpZy5wYXJzZXJzKSA6IGFua2FEZWZhdWx0Q29uZmlnLnBhcnNlcnMsXG4gICAgcGx1Z2luczogY3VzdG9tQ29uZmlnLnBsdWdpbnMgPyBjdXN0b21Db25maWcucGx1Z2lucy5jb25jYXQoYW5rYURlZmF1bHRDb25maWcucGx1Z2lucykgOiBhbmthRGVmYXVsdENvbmZpZy5wbHVnaW5zXG59XG4iLCJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgYW5rYUNvbmZpZyBmcm9tICcuL2Fua2FDb25maWcnXG5cbmV4cG9ydCBjb25zdCBjd2QgPSBwcm9jZXNzLmN3ZCgpXG5leHBvcnQgY29uc3Qgc3JjRGlyID0gcGF0aC5yZXNvbHZlKGN3ZCwgYW5rYUNvbmZpZy5zb3VyY2VEaXIpXG5leHBvcnQgY29uc3QgZGlzdERpciA9IHBhdGgucmVzb2x2ZShjd2QsIGFua2FDb25maWcub3V0cHV0RGlyKVxuZXhwb3J0IGNvbnN0IGFua2FNb2R1bGVzID0gcGF0aC5yZXNvbHZlKHNyY0RpciwgJ2Fua2FfbW9kdWxlcycpXG5leHBvcnQgY29uc3Qgc291cmNlTm9kZU1vZHVsZXMgPSBwYXRoLnJlc29sdmUoY3dkLCAnLi9ub2RlX21vZHVsZXMnKVxuZXhwb3J0IGNvbnN0IGRpc3ROb2RlTW9kdWxlcyA9IHBhdGgucmVzb2x2ZShkaXN0RGlyLCAnLi9ucG1fbW9kdWxlcycpXG5leHBvcnQgY29uc3QgZGVmYXVsdFNjYWZmb2xkID0gICdpRXhjZXB0aW9uL2Fua2EtcXVpY2tzdGFydCdcbiIsImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJ1xuaW1wb3J0IGFua2FDb25maWcgZnJvbSAnLi9hbmthQ29uZmlnJ1xuaW1wb3J0ICogYXMgc3lzdGVtIGZyb20gJy4vc3lzdGVtQ29uZmlnJ1xuaW1wb3J0IHJlc29sdmVDb25maWcgZnJvbSAnLi4vdXRpbHMvcmVzb2x2ZUNvbmZpZydcblxuY29uc3QgY3VzdG9tQ29uZmlnID0gcmVzb2x2ZUNvbmZpZyhbJ2FwcC5qc29uJ10sIHN5c3RlbS5zcmNEaXIpXG5cbmV4cG9ydCBkZWZhdWx0IE9iamVjdC5hc3NpZ24oe1xuICAgIHBhZ2VzOiBbXSxcbiAgICBzdWJQYWNrYWdlczogW10sXG4gICAgd2luZG93OiB7XG4gICAgICAgIG5hdmlnYXRpb25CYXJUaXRsZVRleHQ6ICdXZWNoYXQnXG4gICAgfVxuICAgIC8vIHRhYkJhcjoge1xuICAgIC8vICAgICBsaXN0OiBbXVxuICAgIC8vIH0sXG59LCBjdXN0b21Db25maWcpXG4iLCJpbXBvcnQgKiBhcyBzeXN0ZW1Db25maWcgZnJvbSAnLi9zeXN0ZW1Db25maWcnXG5pbXBvcnQgYW5rYUNvbmZpZyBmcm9tICcuL2Fua2FDb25maWcnXG5pbXBvcnQgcHJvamVjdENvbmZpZyBmcm9tICcuL3Byb2plY3RDb25maWcnXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICAuLi5zeXN0ZW1Db25maWcsXG4gICAgYW5rYUNvbmZpZyxcbiAgICBwcm9qZWN0Q29uZmlnXG59XG4iLCJpbXBvcnQgKiBhcyBHbG9iIGZyb20gJ2dsb2InXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSdcbmNvbnN0IGdsb2IgPSByZXF1aXJlKCdnbG9iJylcblxuaW1wb3J0IHtcbiAgICBDb250ZW50XG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkRmlsZSAoc291cmNlRmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8QnVmZmVyPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgZnMucmVhZEZpbGUoc291cmNlRmlsZVBhdGgsIChlcnIsIGJ1ZmZlcikgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoYnVmZmVyKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZUZpbGUgKHRhcmdldEZpbGVQYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IENvbnRlbnQpOiBQcm9taXNlPHVuZGVmaW5lZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGZzLndyaXRlRmlsZSh0YXJnZXRGaWxlUGF0aCwgY29udGVudCwgZXJyID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHRocm93IGVyclxuICAgICAgICAgICAgcmVzb2x2ZSgpXG4gICAgICAgIH0pXG4gICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlYXJjaEZpbGVzIChzY2hlbWU6IHN0cmluZywgb3B0aW9ucz86IEdsb2IuSU9wdGlvbnMpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgZ2xvYihzY2hlbWUsIG9wdGlvbnMsIChlcnI6IChFcnJvciB8IG51bGwpLCBmaWxlczogQXJyYXk8c3RyaW5nPik6IHZvaWQgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoZmlsZXMpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfSlcbn1cbiIsImltcG9ydCBjaGFsayBmcm9tICdjaGFsaydcbmNvbnN0IG9yYSA9IHJlcXVpcmUoJ29yYScpXG5cbmV4cG9ydCBmdW5jdGlvbiB0b0ZpeCAobnVtYmVyOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIHJldHVybiAoJzAwJyArIG51bWJlcikuc2xpY2UoLTIpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50VGltZSAoKTogc3RyaW5nIHtcbiAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpXG4gICAgcmV0dXJuIGAke3RvRml4KG5vdy5nZXRIb3VycygpKX06JHt0b0ZpeChub3cuZ2V0TWludXRlcygpKX06JHt0b0ZpeChub3cuZ2V0U2Vjb25kcygpKX1gXG59XG5cbmV4cG9ydCBjbGFzcyBMb2dnZXIge1xuICAgIG9yYUluc3RhbmNlOiBhbnlcblxuICAgIGdldCB0aW1lICgpIHtcbiAgICAgICAgcmV0dXJuIGNoYWxrLmdyZXkoYFske2dldEN1cnJlbnRUaW1lKCl9XWApXG4gICAgfVxuXG4gICAgc3RhcnRMb2FkaW5nIChtc2c6IHN0cmluZykge1xuICAgICAgICB0aGlzLm9yYUluc3RhbmNlID0gb3JhKG1zZykuc3RhcnQoKVxuICAgIH1cblxuICAgIHN0b3BMb2FkaW5nICgpIHtcbiAgICAgICAgdGhpcy5vcmFJbnN0YW5jZSAmJiB0aGlzLm9yYUluc3RhbmNlLnN0b3AoKVxuICAgIH1cblxuICAgIGxvZyAoLi4ubXNnOiBBcnJheTxzdHJpbmc+KSB7XG4gICAgICAgIHJldHVybiBjb25zb2xlLmxvZyh0aGlzLnRpbWUsIC4uLm1zZylcbiAgICB9XG5cbiAgICBlcnJvciAodGl0bGU6IHN0cmluZyA9ICcnLCBtc2c6IHN0cmluZyA9ICcnLCBlcnI/OiBhbnkpIHtcbiAgICAgICAgdGhpcy5sb2coY2hhbGsucmVkQnJpZ2h0KHRpdGxlKSwgY2hhbGsuZ3JleShtc2cpKVxuICAgICAgICBlcnIgJiYgY29uc29sZS5sb2coY2hhbGsucmVkQnJpZ2h0KGVyciB8fCBlcnIuc3RhY2spKVxuICAgIH1cblxuICAgIGluZm8gKHRpdGxlOiBzdHJpbmcgPSAnJywgbXNnOiBzdHJpbmcgPSAnJykge1xuICAgICAgICB0aGlzLmxvZyhjaGFsay5yZXNldCh0aXRsZSksIGNoYWxrLmdyZXkobXNnKSlcbiAgICB9XG5cbiAgICB3YXJuICh0aXRsZTogc3RyaW5nID0gJycsIG1zZzogc3RyaW5nID0gJycpIHtcbiAgICAgICAgdGhpcy5sb2coY2hhbGsueWVsbG93QnJpZ2h0KHRpdGxlKSwgY2hhbGsuZ3JleShtc2cpKVxuICAgIH1cblxuICAgIHN1Y2Nlc3MgKHRpdGxlOiBzdHJpbmcgPSAnJywgbXNnOiBzdHJpbmcgPSAnJykge1xuICAgICAgICB0aGlzLmxvZyhjaGFsay5ncmVlbkJyaWdodCh0aXRsZSksIGNoYWxrLmdyZXkobXNnKSlcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IG5ldyBMb2dnZXIoKVxuIiwiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnXG5pbXBvcnQgY29uZmlnIGZyb20gJy4uLy4uL2NvbmZpZydcbmltcG9ydCAqIGFzIHQgZnJvbSAnQGJhYmVsL3R5cGVzJ1xuXG5pbXBvcnQge1xuICAgIENvbnRlbnQsXG4gICAgRmlsZUNvbnN0cnVjdG9yT3B0aW9uXG59IGZyb20gJy4uLy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5jb25zdCByZXBsYWNlRXh0ID0gcmVxdWlyZSgncmVwbGFjZS1leHQnKVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGaWxlIHtcbiAgICBwdWJsaWMgc291cmNlRmlsZTogc3RyaW5nXG4gICAgcHVibGljIGNvbnRlbnQ6IENvbnRlbnRcbiAgICBwdWJsaWMgdGFyZ2V0RmlsZTogc3RyaW5nXG4gICAgcHVibGljIGFzdD86IHQuTm9kZVxuICAgIHB1YmxpYyBzb3VyY2VNYXA/OiBDb250ZW50XG4gICAgcHVibGljIGlzSW5TcmNEaXI/OiBib29sZWFuXG5cbiAgICBjb25zdHJ1Y3RvciAob3B0aW9uOiBGaWxlQ29uc3RydWN0b3JPcHRpb24pIHtcbiAgICAgICAgY29uc3QgaXNJblNyY0RpclRlc3QgPSBuZXcgUmVnRXhwKGBeJHtjb25maWcuc3JjRGlyfWApXG5cbiAgICAgICAgaWYgKCFvcHRpb24uc291cmNlRmlsZSkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHZhbHVlOiBGaWxlQ29uc3RydWN0b3JPcHRpb24uc291cmNlRmlsZScpXG4gICAgICAgIGlmICghb3B0aW9uLmNvbnRlbnQpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCB2YWx1ZTogRmlsZUNvbnN0cnVjdG9yT3B0aW9uLmNvbnRlbnQnKVxuXG4gICAgICAgIHRoaXMuc291cmNlRmlsZSA9IG9wdGlvbi5zb3VyY2VGaWxlXG4gICAgICAgIHRoaXMudGFyZ2V0RmlsZSA9IG9wdGlvbi50YXJnZXRGaWxlIHx8IG9wdGlvbi5zb3VyY2VGaWxlLnJlcGxhY2UoY29uZmlnLnNyY0RpciwgY29uZmlnLmRpc3REaXIpIC8vIERlZmF1bHQgdmFsdWVcbiAgICAgICAgdGhpcy5jb250ZW50ID0gb3B0aW9uLmNvbnRlbnRcbiAgICAgICAgdGhpcy5zb3VyY2VNYXAgPSBvcHRpb24uc291cmNlTWFwXG4gICAgICAgIHRoaXMuaXNJblNyY0RpciA9IGlzSW5TcmNEaXJUZXN0LnRlc3QodGhpcy5zb3VyY2VGaWxlKVxuICAgIH1cblxuICAgIGdldCBkaXJuYW1lICgpIHtcbiAgICAgICAgcmV0dXJuIHBhdGguZGlybmFtZSh0aGlzLnRhcmdldEZpbGUpXG4gICAgfVxuXG4gICAgZ2V0IGJhc2VuYW1lICgpIHtcbiAgICAgICAgcmV0dXJuIHBhdGguYmFzZW5hbWUodGhpcy50YXJnZXRGaWxlKVxuICAgIH1cblxuICAgIGdldCBleHRuYW1lICgpIHtcbiAgICAgICAgcmV0dXJuIHBhdGguZXh0bmFtZSh0aGlzLnRhcmdldEZpbGUpXG4gICAgfVxuXG4gICAgYXN5bmMgc2F2ZVRvIChwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgYXdhaXQgZnMuZW5zdXJlRmlsZShwYXRoKVxuXG4gICAgICAgIGlmICghcGF0aCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHBhdGgnKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlRXh0IChleHQ6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICB0aGlzLnRhcmdldEZpbGUgPSByZXBsYWNlRXh0KHRoaXMudGFyZ2V0RmlsZSwgZXh0KVxuICAgIH1cbn1cbiIsImltcG9ydCB7XG4gICAgcmVhZEZpbGVcbn0gZnJvbSAnLi9mcydcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJ1xuaW1wb3J0IEZpbGUgZnJvbSAnLi4vY29yZS9jbGFzcy9GaWxlJ1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRmlsZSAoc291cmNlRmlsZTogc3RyaW5nKTogUHJvbWlzZTxGaWxlPiB7XG4gICAgcmV0dXJuIHJlYWRGaWxlKHNvdXJjZUZpbGUpLnRoZW4oY29udGVudCA9PiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IEZpbGUoe1xuICAgICAgICAgICAgc291cmNlRmlsZSxcbiAgICAgICAgICAgIGNvbnRlbnRcbiAgICAgICAgfSkpXG4gICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUZpbGVTeW5jIChzb3VyY2VGaWxlOiBzdHJpbmcpIHtcbiAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHNvdXJjZUZpbGUpXG4gICAgcmV0dXJuIG5ldyBGaWxlKHtcbiAgICAgICAgc291cmNlRmlsZSxcbiAgICAgICAgY29udGVudFxuICAgIH0pXG59XG4iLCJpbXBvcnQgeyBPcHRpb25zIGFzIFRlbXBsYXRlT3B0aW9ucyB9IGZyb20gJ2VqcydcbmltcG9ydCB7IG1lbUZzRWRpdG9yIGFzIE1lbUZzRWRpdG9yIH0gZnJvbSAnbWVtLWZzLWVkaXRvcidcblxuY29uc3QgbWVtRnMgPSByZXF1aXJlKCdtZW0tZnMnKVxuY29uc3QgbWVtRnNFZGl0b3IgPSByZXF1aXJlKCdtZW0tZnMtZWRpdG9yJylcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRnNFZGl0b3Ige1xuICAgIGVkaXRvcjogTWVtRnNFZGl0b3IuRWRpdG9yXG5cbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIGNvbnN0IHN0b3JlID0gbWVtRnMuY3JlYXRlKClcblxuICAgICAgICB0aGlzLmVkaXRvciA9IG1lbUZzRWRpdG9yLmNyZWF0ZShzdG9yZSlcbiAgICB9XG5cbiAgICBjb3B5IChmcm9tOiBzdHJpbmcsIHRvOiBzdHJpbmcsIGNvbnRleHQ6IG9iamVjdCwgdGVtcGxhdGVPcHRpb25zPzogVGVtcGxhdGVPcHRpb25zLCBjb3B5T3B0aW9ucz86IE1lbUZzRWRpdG9yLkNvcHlPcHRpb25zKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZWRpdG9yLmNvcHlUcGwoZnJvbSwgdG8sIGNvbnRleHQsIHRlbXBsYXRlT3B0aW9ucywgY29weU9wdGlvbnMpXG4gICAgfVxuXG4gICAgd3JpdGUgKGZpbGVwYXRoOiBzdHJpbmcsIGNvbnRlbnRzOiBNZW1Gc0VkaXRvci5Db250ZW50cyk6IHZvaWQge1xuICAgICAgICB0aGlzLmVkaXRvci53cml0ZShmaWxlcGF0aCwgY29udGVudHMpXG4gICAgfVxuXG4gICAgd3JpdGVKU09OIChmaWxlcGF0aDogc3RyaW5nLCBjb250ZW50czogYW55LCByZXBsYWNlcj86IE1lbUZzRWRpdG9yLlJlcGxhY2VyRnVuYywgc3BhY2U/OiBNZW1Gc0VkaXRvci5TcGFjZSk6IHZvaWQge1xuICAgICAgICB0aGlzLmVkaXRvci53cml0ZUpTT04oZmlsZXBhdGgsIGNvbnRlbnRzLCByZXBsYWNlciB8fCBudWxsLCBzcGFjZSA9IDQpXG4gICAgfVxuXG4gICAgcmVhZCAoZmlsZXBhdGg6IHN0cmluZywgb3B0aW9ucz86IHsgcmF3OiBib29sZWFuLCBkZWZhdWx0czogc3RyaW5nIH0pOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5lZGl0b3IucmVhZChmaWxlcGF0aCwgb3B0aW9ucylcbiAgICB9XG5cbiAgICByZWFkSlNPTiAoZmlsZXBhdGg6IHN0cmluZywgZGVmYXVsdHM/OiBhbnkpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5lZGl0b3IucmVhZEpTT04oZmlsZXBhdGgsIGRlZmF1bHRzKVxuICAgIH1cblxuICAgIHNhdmUgKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yLmNvbW1pdChyZXNvbHZlKVxuICAgICAgICB9KVxuICAgIH1cbn1cbiIsImltcG9ydCBsb2cgZnJvbSAnLi9sb2dnZXInXG5pbXBvcnQgYW5rYUNvbmZpZyBmcm9tICcuLi9jb25maWcvYW5rYUNvbmZpZydcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKGlkOiBzdHJpbmcsIG9wdGlvbnM/OiB7IHBhdGhzPzogc3RyaW5nW10gfSk6IHN0cmluZyB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUucmVzb2x2ZShpZCwgb3B0aW9ucylcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgbG9nLmVycm9yKCdNaXNzaW5nIGRlcGVuZGVuY3knLCBpZCwgIWFua2FDb25maWcucXVpZXQgPyBgaW4gJHtvcHRpb25zLnBhdGhzfWAgOiBudWxsKVxuICAgIH1cbn1cbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNhbGxQcm9taXNlSW5DaGFpbiAobGlzdDogQXJyYXk8KC4uLnBhcmFtczogYW55W10pID0+IFByb21pc2U8YW55Pj4gPSBbXSwgLi4ucGFyYW1zOiBBcnJheTxhbnk+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgaWYgKCFsaXN0Lmxlbmd0aCkgIHtcbiAgICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgbGV0IHN0ZXAgPSBsaXN0WzBdKC4uLnBhcmFtcylcblxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHN0ZXAgPSBzdGVwLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsaXN0W2ldKC4uLnBhcmFtcylcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICBzdGVwLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICB9LCBlcnIgPT4ge1xuICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgfSlcbiAgICB9KVxufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKGZuOiBGdW5jdGlvbik6ICgpID0+IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBmdW5jdGlvbiAoLi4ucGFyYW1zOiBBcnJheTxhbnk+KSB7XG4gICAgICAgIGNvbnN0IGxpbWl0YXRpb24gPSBwYXJhbXMubGVuZ3RoXG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgaWYgKGZuLmxlbmd0aCA+IGxpbWl0YXRpb24pIHtcbiAgICAgICAgICAgICAgICBmbiguLi5wYXJhbXMsIHJlc29sdmUpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoZm4oLi4ucGFyYW1zKSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBjaG9raWRhciBmcm9tICdjaG9raWRhcidcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKGRpcjogc3RyaW5nIHwgc3RyaW5nW10sIG9wdGlvbnM/OiBjaG9raWRhci5XYXRjaE9wdGlvbnMpOiBjaG9raWRhci5GU1dhdGNoZXIge1xuICAgIHJldHVybiBjaG9raWRhci53YXRjaChkaXIsIHtcbiAgICAgICAgcGVyc2lzdGVudDogdHJ1ZSxcbiAgICAgICAgaWdub3JlSW5pdGlhbDogdHJ1ZSxcbiAgICAgICAgLi4ub3B0aW9uc1xuICAgIH0pXG59XG4iLCJkZWNsYXJlIHR5cGUgVmFsaWRhdGVOcG1QYWNrYWdlTmFtZSA9IHtcbiAgICB2YWxpZEZvck5ld1BhY2thZ2VzOiBib29sZWFuLFxuICAgIHZhbGlkRm9yT2xkUGFja2FnZXM6IGJvb2xlYW5cbn1cblxuY29uc3QgdmFsaWRhdGUgPSByZXF1aXJlKCd2YWxpZGF0ZS1ucG0tcGFja2FnZS1uYW1lJylcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKHJlcXVpcmVkOiBzdHJpbmcgPSAnJyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IDxWYWxpZGF0ZU5wbVBhY2thZ2VOYW1lPnZhbGlkYXRlKHJlcXVpcmVkKVxuXG4gICAgcmV0dXJuIHJlc3VsdC52YWxpZEZvck5ld1BhY2thZ2VzIHx8IHJlc3VsdC52YWxpZEZvck9sZFBhY2thZ2VzXG59XG4iLCJpbXBvcnQgZG93bmxvYWRSZXBvIGZyb20gJ2Rvd25sb2FkLWdpdC1yZXBvJ1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAocmVwbzogc3RyaW5nLCBwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBkb3dubG9hZFJlcG8ocmVwbywgcGF0aCwgeyBjbG9uZTogZmFsc2UgfSwgKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgIGVyciA/IHJlamVjdChlcnIpIDogcmVzb2x2ZSgpXG4gICAgICAgIH0pXG4gICAgfSlcbn1cbiIsImltcG9ydCBDb21waWxlciBmcm9tICcuL0NvbXBpbGVyJ1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuLi8uLi9jb25maWcnXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi8uLi91dGlscydcblxuaW1wb3J0IHtcbiAgICBVdGlscyxcbiAgICBBbmthQ29uZmlnLFxuICAgIFBhcnNlck9wdGlvbnMsXG4gICAgUHJvamVjdENvbmZpZyxcbiAgICBQbHVnaW5IYW5kbGVyLFxuICAgIFBsdWdpbk9wdGlvbnMsXG4gICAgQ29tcGlsZXJDb25maWdcbn0gZnJvbSAnLi4vLi4vLi4vdHlwZXMvdHlwZXMnXG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBJbmplY3Rpb24ge1xuICAgIGNvbXBpbGVyOiBDb21waWxlclxuICAgIG9wdGlvbnM6IG9iamVjdFxuXG4gICAgY29uc3RydWN0b3IgKGNvbXBpbGVyOiBDb21waWxlciwgb3B0aW9ucz86IG9iamVjdCkge1xuICAgICAgICB0aGlzLmNvbXBpbGVyID0gY29tcGlsZXJcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9uc1xuICAgIH1cblxuICAgIGFic3RyYWN0IGdldE9wdGlvbnMgKCk6IG9iamVjdFxuXG4gICAgZ2V0Q29tcGlsZXIgKCk6IENvbXBpbGVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcGlsZXJcbiAgICB9XG5cbiAgICBnZXRVdGlscyAoKSB7XG4gICAgICAgIHJldHVybiB1dGlsc1xuICAgIH1cblxuICAgIGdldEFua2FDb25maWcgKCk6IEFua2FDb25maWcge1xuICAgICAgICByZXR1cm4gY29uZmlnLmFua2FDb25maWdcbiAgICB9XG5cbiAgICBnZXRTeXN0ZW1Db25maWcgKCk6IENvbXBpbGVyQ29uZmlnIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZ1xuICAgIH1cblxuICAgIGdldFByb2plY3RDb25maWcgKCk6IFByb2plY3RDb25maWcge1xuICAgICAgICByZXR1cm4gY29uZmlnLnByb2plY3RDb25maWdcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBQbHVnaW5JbmplY3Rpb24gZXh0ZW5kcyBJbmplY3Rpb24ge1xuXG4gICAgY29uc3RydWN0b3IgKGNvbXBpbGVyOiBDb21waWxlciwgb3B0aW9uczogUGx1Z2luT3B0aW9uc1snb3B0aW9ucyddKSB7XG4gICAgICAgIHN1cGVyKGNvbXBpbGVyLCBvcHRpb25zKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybiBQbHVnaW4gb3B0aW9uc1xuICAgICAqL1xuICAgIGdldE9wdGlvbnMgKCk6IG9iamVjdCB7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMgfHwge31cbiAgICB9XG5cbiAgICBvbiAoZXZlbnQ6IHN0cmluZywgaGFuZGxlcjogUGx1Z2luSGFuZGxlcik6IHZvaWQge1xuICAgICAgICB0aGlzLmNvbXBpbGVyLm9uKGV2ZW50LCBoYW5kbGVyKVxuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFBhcnNlckluamVjdGlvbiBleHRlbmRzIEluamVjdGlvbiB7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gUGFyc2VyT3B0aW9uc1xuICAgICAqL1xuICAgIGdldE9wdGlvbnMgKCk6IG9iamVjdCB7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMgfHwge31cbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvciAoY29tcGlsZXI6IENvbXBpbGVyLCBvcHRpb25zOiBQYXJzZXJPcHRpb25zWydvcHRpb25zJ10pIHtcbiAgICAgICAgc3VwZXIoY29tcGlsZXIsIG9wdGlvbnMpXG4gICAgfVxufVxuIiwiaW1wb3J0IEZpbGUgZnJvbSAnLi9GaWxlJ1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuLi8uLi9jb25maWcnXG5pbXBvcnQgQ29tcGlsZXIgZnJvbSAnLi9Db21waWxlcidcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uLy4uL3V0aWxzJ1xuXG5pbXBvcnQge1xuICAgIFBhcnNlcixcbiAgICBNYXRjaGVyLFxuICAgIFBsdWdpbkhhbmRsZXIsXG4gICAgUGx1Z2luT3B0aW9ucyxcbiAgICBDb21waWxlckNvbmZpZ1xufSBmcm9tICcuLi8uLi8uLi90eXBlcy90eXBlcydcblxuLyoqXG4gKiBBIGNvbXBpbGF0aW9uIHRhc2tcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29tcGlsYXRpb24ge1xuICAgIGNvbmZpZzogQ29tcGlsZXJDb25maWdcbiAgICByZWFkb25seSBjb21waWxlcjogQ29tcGlsZXJcbiAgICBpZDogbnVtYmVyICAgICAgICAvLyBVbmlxdWXvvIxmb3IgZWFjaCBDb21waWxhdGlvblxuICAgIGZpbGU6IEZpbGVcbiAgICBzb3VyY2VGaWxlOiBzdHJpbmdcbiAgICBkZXN0cm95ZWQ6IGJvb2xlYW5cblxuICAgIGNvbnN0cnVjdG9yIChmaWxlOiBGaWxlIHwgc3RyaW5nLCBjb25mOiBDb21waWxlckNvbmZpZywgY29tcGlsZXI6IENvbXBpbGVyKSB7XG4gICAgICAgIHRoaXMuY29tcGlsZXIgPSBjb21waWxlclxuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZcbiAgICAgICAgdGhpcy5pZCA9IENvbXBpbGVyLmNvbXBpbGF0aW9uSWQrK1xuXG4gICAgICAgIGlmIChmaWxlIGluc3RhbmNlb2YgRmlsZSkge1xuICAgICAgICAgICAgdGhpcy5maWxlID0gZmlsZVxuICAgICAgICAgICAgdGhpcy5zb3VyY2VGaWxlID0gZmlsZS5zb3VyY2VGaWxlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNvdXJjZUZpbGUgPSBmaWxlXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmVucm9sbCgpXG4gICAgfVxuXG4gICAgYXN5bmMgcnVuICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgYXdhaXQgdGhpcy5sb2FkRmlsZSgpXG4gICAgICAgIGF3YWl0IHRoaXMuaW52b2tlUGFyc2VycygpXG4gICAgICAgIGF3YWl0IHRoaXMuY29tcGlsZSgpXG4gICAgfVxuXG4gICAgYXN5bmMgbG9hZEZpbGUgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBpZiAodGhpcy5kZXN0cm95ZWQpIHJldHVyblxuXG4gICAgICAgIGF3YWl0IHRoaXMuY29tcGlsZXIuZW1pdCgnYmVmb3JlLWxvYWQtZmlsZScsIHRoaXMpXG4gICAgICAgIGlmICghKHRoaXMuZmlsZSBpbnN0YW5jZW9mIEZpbGUpKSB7XG4gICAgICAgICAgICB0aGlzLmZpbGUgPSBhd2FpdCB1dGlscy5jcmVhdGVGaWxlKHRoaXMuc291cmNlRmlsZSlcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRoaXMuY29tcGlsZXIuZW1pdCgnYWZ0ZXItbG9hZC1maWxlJywgdGhpcylcbiAgICB9XG5cbiAgICBhc3luYyBpbnZva2VQYXJzZXJzICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKHRoaXMuZGVzdHJveWVkKSByZXR1cm5cblxuICAgICAgICBjb25zdCBmaWxlID0gdGhpcy5maWxlXG4gICAgICAgIGNvbnN0IHBhcnNlcnMgPSA8UGFyc2VyW10+dGhpcy5jb21waWxlci5wYXJzZXJzLmZpbHRlcigobWF0Y2hlcnM6IE1hdGNoZXIpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBtYXRjaGVycy5tYXRjaC50ZXN0KGZpbGUuc291cmNlRmlsZSlcbiAgICAgICAgfSkubWFwKChtYXRjaGVyczogTWF0Y2hlcikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoZXJzLnBhcnNlcnNcbiAgICAgICAgfSkucmVkdWNlKChwcmV2LCBuZXh0KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gcHJldi5jb25jYXQobmV4dClcbiAgICAgICAgfSwgW10pXG4gICAgICAgIGNvbnN0IHRhc2tzID0gcGFyc2Vycy5tYXAocGFyc2VyID0+IHtcbiAgICAgICAgICAgIHJldHVybiB1dGlscy5hc3luY0Z1bmN0aW9uV3JhcHBlcihwYXJzZXIpXG4gICAgICAgIH0pXG5cbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlci5lbWl0KCdiZWZvcmUtcGFyc2UnLCB0aGlzKVxuICAgICAgICBhd2FpdCB1dGlscy5jYWxsUHJvbWlzZUluQ2hhaW4odGFza3MsIGZpbGUsIHRoaXMpXG4gICAgICAgIGF3YWl0IHRoaXMuY29tcGlsZXIuZW1pdCgnYWZ0ZXItcGFyc2UnLCB0aGlzKVxuICAgIH1cblxuICAgIGFzeW5jIGNvbXBpbGUgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBpZiAodGhpcy5kZXN0cm95ZWQpIHJldHVyblxuXG4gICAgICAgIC8vIEludm9rZSBFeHRyYWN0RGVwZW5kZW5jeVBsdWdpbi5cbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlci5lbWl0KCdiZWZvcmUtY29tcGlsZScsIHRoaXMpXG4gICAgICAgIC8vIERvIHNvbWV0aGluZyBlbHNlLlxuICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGVyLmVtaXQoJ2FmdGVyLWNvbXBpbGUnLCB0aGlzKVxuICAgICAgICAhdGhpcy5jb25maWcuYW5rYUNvbmZpZy5xdWlldCAmJiAgdXRpbHMubG9nZ2VyLmluZm8oJ0NvbXBpbGUnLCAgdGhpcy5maWxlLnNvdXJjZUZpbGUucmVwbGFjZShjb25maWcuY3dkLCAnJykpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXIgb24gQ29tcGlsZXIgYW5kIGRlc3Ryb3kgdGhlIHByZXZpb3VzIG9uZSBpZiBjb25mbGljdCBhcmlzZXMuXG4gICAgICovXG4gICAgZW5yb2xsICgpOiB2b2lkIHtcbiAgICAgICAgY29uc3Qgb2xkQ29tcGlsYXRpb24gPSBDb21waWxlci5jb21waWxhdGlvblBvb2wuZ2V0KHRoaXMuc291cmNlRmlsZSlcblxuICAgICAgICBpZiAob2xkQ29tcGlsYXRpb24pIHtcbiAgICAgICAgICAgIGlmIChjb25maWcuYW5rYUNvbmZpZy5kZWJ1ZykgY29uc29sZS5sb2coJ1xiRGVzdHJveSBDb21waWxhdGlvbicsIG9sZENvbXBpbGF0aW9uLmlkLCBvbGRDb21waWxhdGlvbi5zb3VyY2VGaWxlKVxuXG4gICAgICAgICAgICBvbGRDb21waWxhdGlvbi5kZXN0cm95KClcbiAgICAgICAgfVxuICAgICAgICBDb21waWxlci5jb21waWxhdGlvblBvb2wuc2V0KHRoaXMuc291cmNlRmlsZSwgdGhpcylcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVbnJlZ2lzdGVyIHRoZW1zZWx2ZXMgZnJvbSBDb21waWxlci5cbiAgICAgKi9cbiAgICBkZXN0cm95ICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5kZXN0cm95ZWQgPSB0cnVlXG4gICAgICAgIENvbXBpbGVyLmNvbXBpbGF0aW9uUG9vbC5kZWxldGUodGhpcy5zb3VyY2VGaWxlKVxuICAgIH1cbn1cbiIsImltcG9ydCB7XG4gICAgUGFyc2VySW5qZWN0aW9uLFxuICAgIFBsdWdpbkluamVjdGlvblxufSBmcm9tICcuL0luamVjdGlvbidcbmltcG9ydCBGaWxlIGZyb20gJy4vRmlsZSdcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJ1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuLi8uLi9jb25maWcnXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi8uLi91dGlscydcbmltcG9ydCBDb21waWxhdGlvbiBmcm9tICcuL0NvbXBpbGF0aW9uJ1xuaW1wb3J0IGNhbGxQcm9taXNlSW5DaGFpbiBmcm9tICcuLi8uLi91dGlscy9jYWxsUHJvbWlzZUluQ2hhaW4nXG5pbXBvcnQgYXN5bmNGdW5jdGlvbldyYXBwZXIgZnJvbSAnLi4vLi4vdXRpbHMvYXN5bmNGdW5jdGlvbldyYXBwZXInXG5cbmltcG9ydCB7XG4gICAgUGFyc2VyLFxuICAgIFBhcnNlck9wdGlvbnMsXG4gICAgUGx1Z2luSGFuZGxlcixcbiAgICBQbHVnaW5PcHRpb25zLFxuICAgIENvbXBpbGVyQ29uZmlnXG59IGZyb20gJy4uLy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5jb25zdCB7IGxvZ2dlciB9ID0gdXRpbHNcbmNvbnN0IGRlbCA9IHJlcXVpcmUoJ2RlbCcpXG5cbi8qKlxuICogVGhlIGNvcmUgY29tcGlsZXIuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbXBpbGVyIHtcbiAgICByZWFkb25seSBjb25maWc6IENvbXBpbGVyQ29uZmlnXG4gICAgcHVibGljIHN0YXRpYyBjb21waWxhdGlvbklkID0gMVxuICAgIHB1YmxpYyBzdGF0aWMgY29tcGlsYXRpb25Qb29sID0gbmV3IE1hcDxzdHJpbmcsIENvbXBpbGF0aW9uPigpXG4gICAgcGx1Z2luczoge1xuICAgICAgICBbZXZlbnROYW1lOiBzdHJpbmddOiBBcnJheTxQbHVnaW5IYW5kbGVyPlxuICAgIH0gPSB7XG4gICAgICAgICdiZWZvcmUtbG9hZC1maWxlJzogW10sXG4gICAgICAgICdhZnRlci1sb2FkLWZpbGUnOiBbXSxcbiAgICAgICAgJ2JlZm9yZS1wYXJzZSc6IFtdLFxuICAgICAgICAnYWZ0ZXItcGFyc2UnOiBbXSxcbiAgICAgICAgJ2JlZm9yZS1jb21waWxlJzogW10sXG4gICAgICAgICdhZnRlci1jb21waWxlJzogW11cbiAgICB9XG4gICAgcGFyc2VyczogQXJyYXk8e1xuICAgICAgICBtYXRjaDogUmVnRXhwLFxuICAgICAgICBwYXJzZXJzOiBBcnJheTxQYXJzZXI+XG4gICAgfT4gPSBbXVxuXG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZ1xuICAgICAgICB0aGlzLmluaXRQYXJzZXJzKClcbiAgICAgICAgdGhpcy5pbml0UGx1Z2lucygpXG5cbiAgICAgICAgaWYgKGNvbmZpZy5hbmthQ29uZmlnLmRlYnVnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh0aGlzLmNvbmZpZywgKGtleSwgdmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBGdW5jdGlvbikgcmV0dXJuICdbRnVuY3Rpb25dJ1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZVxuICAgICAgICAgICAgfSwgNCkpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBQbHVnaW4uXG4gICAgICogQHBhcmFtIGV2ZW50XG4gICAgICogQHBhcmFtIGhhbmRsZXJcbiAgICAgKi9cbiAgICBvbiAoZXZlbnQ6IHN0cmluZywgaGFuZGxlcjogUGx1Z2luSGFuZGxlcik6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5wbHVnaW5zW2V2ZW50XSA9PT0gdm9pZCAoMCkpIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBob29rOiAke2V2ZW50fWApXG4gICAgICAgIHRoaXMucGx1Z2luc1tldmVudF0ucHVzaChoYW5kbGVyKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEludm9rZSBsaWZlY3ljbGUgaG9va3MoUHJvbWlzZSBjaGFpbmluZykuXG4gICAgICogQHBhcmFtIGV2ZW50XG4gICAgICogQHBhcmFtIGNvbXBpbGF0aW9uXG4gICAgICovXG4gICAgYXN5bmMgZW1pdCAoZXZlbnQ6IHN0cmluZywgY29tcGlsYXRpb246IENvbXBpbGF0aW9uKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKGNvbXBpbGF0aW9uLmRlc3Ryb3llZCkgcmV0dXJuXG5cbiAgICAgICAgY29uc3QgcGx1Z2lucyA9IHRoaXMucGx1Z2luc1tldmVudF1cblxuICAgICAgICBpZiAoIXBsdWdpbnMgfHwgIXBsdWdpbnMubGVuZ3RoKSByZXR1cm5cblxuICAgICAgICBjb25zdCB0YXNrcyA9IHBsdWdpbnMubWFwKHBsdWdpbiA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYXN5bmNGdW5jdGlvbldyYXBwZXIocGx1Z2luKVxuICAgICAgICB9KVxuXG4gICAgICAgIGF3YWl0IGNhbGxQcm9taXNlSW5DaGFpbih0YXNrcywgY29tcGlsYXRpb24pXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2xlYW4gZGlzdCBkaXJlY3RvcnkuXG4gICAgICovXG4gICAgYXN5bmMgY2xlYW4gKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCBkZWwoW1xuICAgICAgICAgICAgcGF0aC5qb2luKGNvbmZpZy5kaXN0RGlyLCAnKiovKicpLFxuICAgICAgICAgICAgYCEke3BhdGguam9pbihjb25maWcuZGlzdERpciwgJ2FwcC5qcycpfWAsXG4gICAgICAgICAgICBgISR7cGF0aC5qb2luKGNvbmZpZy5kaXN0RGlyLCAnYXBwLmpzb24nKX1gLFxuICAgICAgICAgICAgYCEke3BhdGguam9pbihjb25maWcuZGlzdERpciwgJ3Byb2plY3QuY29uZmlnLmpzb24nKX1gXG4gICAgICAgIF0pXG4gICAgICAgIGxvZ2dlci5zdWNjZXNzKCdDbGVhbiB3b3Jrc2hvcCcsIGNvbmZpZy5kaXN0RGlyKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV2ZXJ5dGhpbmcgc3RhcnQgZnJvbSBoZXJlLlxuICAgICAqL1xuICAgIGFzeW5jIGxhdW5jaCAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgbG9nZ2VyLmluZm8oJ0xhdW5jaGluZy4uLicpXG5cbiAgICAgICAgY29uc3QgZmlsZVBhdGhzOiBzdHJpbmdbXSA9IGF3YWl0IHV0aWxzLnNlYXJjaEZpbGVzKGAke2NvbmZpZy5zcmNEaXJ9LyoqLypgLCB7XG4gICAgICAgICAgICBub2RpcjogdHJ1ZSxcbiAgICAgICAgICAgIHNpbGVudDogZmFsc2UsXG4gICAgICAgICAgICBhYnNvbHV0ZTogdHJ1ZVxuICAgICAgICB9KVxuICAgICAgICBjb25zdCBmaWxlcyA9IGF3YWl0IFByb21pc2UuYWxsKGZpbGVQYXRocy5tYXAoZmlsZSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdXRpbHMuY3JlYXRlRmlsZShmaWxlKVxuICAgICAgICB9KSlcbiAgICAgICAgY29uc3QgY29tcGlsYXRpb25zID0gZmlsZXMubWFwKGZpbGUgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBDb21waWxhdGlvbihmaWxlLCB0aGlzLmNvbmZpZywgdGhpcylcbiAgICAgICAgfSlcblxuICAgICAgICBmcy5lbnN1cmVEaXJTeW5jKGNvbmZpZy5kaXN0Tm9kZU1vZHVsZXMpXG5cbiAgICAgICAgLy8gYXdhaXQgUHJvbWlzZS5hbGwoY29tcGlsYXRpb25zLm1hcChjb21waWxhdGlvbiA9PiBjb21waWxhdGlvbi5sb2FkRmlsZSgpKSlcbiAgICAgICAgLy8gYXdhaXQgUHJvbWlzZS5hbGwoY29tcGlsYXRpb25zLm1hcChjb21waWxhdGlvbiA9PiBjb21waWxhdGlvbi5pbnZva2VQYXJzZXJzKCkpKVxuXG4gICAgICAgIC8vIFRPRE86IEdldCBhbGwgZmlsZXNcbiAgICAgICAgLy8gQ29tcGlsZXIuY29tcGlsYXRpb25Qb29sLnZhbHVlcygpXG5cbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoY29tcGlsYXRpb25zLm1hcChjb21waWxhdGlvbnMgPT4gY29tcGlsYXRpb25zLnJ1bigpKSlcbiAgICB9XG5cbiAgICB3YXRjaEZpbGVzICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICBjb25zdCB3YXRjaGVyID0gdXRpbHMuZ2VuRmlsZVdhdGNoZXIoYCR7Y29uZmlnLnNyY0Rpcn0vKiovKmAsIHtcbiAgICAgICAgICAgICAgICBmb2xsb3dTeW1saW5rczogZmFsc2VcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIHdhdGNoZXIub24oJ2FkZCcsIGFzeW5jIChmaWxlTmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZSA9IGF3YWl0IHV0aWxzLmNyZWF0ZUZpbGUoZmlsZU5hbWUpXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5nZW5lcmF0ZUNvbXBpbGF0aW9uKGZpbGUpLnJ1bigpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgd2F0Y2hlci5vbigndW5saW5rJywgYXN5bmMgKGZpbGVOYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBmcy51bmxpbmsoZmlsZU5hbWUucmVwbGFjZShjb25maWcuc3JjRGlyLCBjb25maWcuZGlzdERpcikpXG4gICAgICAgICAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoJ1JlbW92ZScsIGZpbGVOYW1lKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIHdhdGNoZXIub24oJ2NoYW5nZScsIGFzeW5jIChmaWxlTmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZSA9IGF3YWl0IHV0aWxzLmNyZWF0ZUZpbGUoZmlsZU5hbWUpXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5nZW5lcmF0ZUNvbXBpbGF0aW9uKGZpbGUpLnJ1bigpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgd2F0Y2hlci5vbigncmVhZHknLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBuZXcgQ29tcGlsYXRpb24uXG4gICAgICogQHBhcmFtIGZpbGVcbiAgICAgKi9cbiAgICBnZW5lcmF0ZUNvbXBpbGF0aW9uIChmaWxlOiBGaWxlKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29tcGlsYXRpb24oZmlsZSwgdGhpcy5jb25maWcsIHRoaXMpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTW91bnQgcGFyc2Vycy5cbiAgICAgKi9cbiAgICBpbml0UGFyc2VycyAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY29uZmlnLmFua2FDb25maWcucGFyc2Vycy5mb3JFYWNoKCh7IG1hdGNoLCBwYXJzZXJzIH0pID0+IHtcbiAgICAgICAgICAgIHRoaXMucGFyc2Vycy5wdXNoKHtcbiAgICAgICAgICAgICAgICBtYXRjaCxcbiAgICAgICAgICAgICAgICBwYXJzZXJzOiBwYXJzZXJzLm1hcCgoeyBwYXJzZXIsIG9wdGlvbnMgfSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VyLmJpbmQodGhpcy5nZW5lcmF0ZVBhcnNlckluamVjdGlvbihvcHRpb25zKSlcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNb3VudCBQbHVnaW5zLlxuICAgICAqL1xuICAgIGluaXRQbHVnaW5zICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jb25maWcuYW5rYUNvbmZpZy5wbHVnaW5zLmZvckVhY2goKHsgcGx1Z2luLCBvcHRpb25zIH0pID0+IHtcbiAgICAgICAgICAgIHBsdWdpbi5jYWxsKHRoaXMuZ2VuZXJhdGVQbHVnaW5JbmplY3Rpb24ob3B0aW9ucykpXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgZ2VuZXJhdGVQbHVnaW5JbmplY3Rpb24gKG9wdGlvbnM6IFBsdWdpbk9wdGlvbnNbJ29wdGlvbnMnXSk6IFBsdWdpbkluamVjdGlvbiB7XG4gICAgICAgIHJldHVybiBuZXcgUGx1Z2luSW5qZWN0aW9uKHRoaXMsIG9wdGlvbnMpXG4gICAgfVxuXG4gICAgZ2VuZXJhdGVQYXJzZXJJbmplY3Rpb24gKG9wdGlvbnM6IFBhcnNlck9wdGlvbnNbJ29wdGlvbnMnXSk6IFBhcnNlckluamVjdGlvbiB7XG4gICAgICAgIHJldHVybiBuZXcgUGFyc2VySW5qZWN0aW9uKHRoaXMsIG9wdGlvbnMpXG4gICAgfVxufVxuIiwiaW1wb3J0IENvbXBpbGVyIGZyb20gJy4vQ29tcGlsZXInXG5cbmV4cG9ydCBkZWZhdWx0IGFic3RyYWN0IGNsYXNzIENvbW1hbmQge1xuICAgIHB1YmxpYyBjb21tYW5kOiBzdHJpbmdcbiAgICBwdWJsaWMgb3B0aW9uczogQXJyYXk8QXJyYXk8c3RyaW5nPj5cbiAgICBwdWJsaWMgYWxpYXM6IHN0cmluZ1xuICAgIHB1YmxpYyB1c2FnZTogc3RyaW5nXG4gICAgcHVibGljIGRlc2NyaXB0aW9uOiBzdHJpbmdcbiAgICBwdWJsaWMgZXhhbXBsZXM6IEFycmF5PHN0cmluZz5cbiAgICBwdWJsaWMgJGNvbXBpbGVyOiBDb21waWxlclxuICAgIHB1YmxpYyBvbjoge1xuICAgICAgICBba2V5OiBzdHJpbmddOiAoLi4uYXJnOiBhbnlbXSkgPT4gdm9pZFxuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yIChjb21tYW5kOiBzdHJpbmcsIGRlc2M/OiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5jb21tYW5kID0gY29tbWFuZFxuICAgICAgICB0aGlzLm9wdGlvbnMgPSBbXVxuICAgICAgICB0aGlzLmFsaWFzID0gJydcbiAgICAgICAgdGhpcy51c2FnZSA9ICcnXG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBkZXNjXG4gICAgICAgIHRoaXMuZXhhbXBsZXMgPSBbXVxuICAgICAgICB0aGlzLm9uID0ge31cbiAgICB9XG5cbiAgICBhYnN0cmFjdCBhY3Rpb24gKHBhcmFtOiBzdHJpbmcgfCBBcnJheTxzdHJpbmc+LCBvcHRpb25zOiBPYmplY3QsIC4uLm90aGVyOiBhbnlbXSk6IFByb21pc2U8YW55PiB8IHZvaWRcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemUgYW5rYSBjb3JlIGNvbXBpbGVyXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGluaXRDb21waWxlciAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuJGNvbXBpbGVyID0gbmV3IENvbXBpbGVyKClcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgc2V0VXNhZ2UgKHVzYWdlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgdGhpcy51c2FnZSA9IHVzYWdlXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHNldE9wdGlvbnMgKC4uLm9wdGlvbnM6IEFycmF5PHN0cmluZz4pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLnB1c2gob3B0aW9ucylcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgc2V0RXhhbXBsZXMgKC4uLmV4YW1wbGU6IEFycmF5PHN0cmluZz4pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5leGFtcGxlcyA9IHRoaXMuZXhhbXBsZXMuY29uY2F0KGV4YW1wbGUpXG4gICAgfVxuXG4gICAgcHVibGljIHByaW50VGl0bGUgKC4uLmFyZzogQXJyYXk8YW55Pikge1xuICAgICAgICBjb25zb2xlLmxvZygnXFxyXFxuICcsIC4uLmFyZywgJ1xcclxcbicpXG4gICAgfVxuXG4gICAgcHVibGljIHByaW50Q29udGVudCAoLi4uYXJnOiBBcnJheTxhbnk+KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCcgICAnLCAuLi5hcmcpXG4gICAgfVxufVxuIiwiaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi4vdXRpbHMnXG5pbXBvcnQgeyBDb21tYW5kLCBDb21waWxlciB9IGZyb20gJy4uL2NvcmUnXG5cbmV4cG9ydCB0eXBlIERldkNvbW1hbmRPcHRzID0gT2JqZWN0ICYge31cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGV2Q29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgc3VwZXIoXG4gICAgICAgICAgICAnZGV2IFtwYWdlcy4uLl0nLFxuICAgICAgICAgICAgJ0RldmVsb3BtZW50IG1vZGUnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldEV4YW1wbGVzKFxuICAgICAgICAgICAgJyQgYW5rYSBkZXYnLFxuICAgICAgICAgICAgJyQgYW5rYSBkZXYgaW5kZXgnLFxuICAgICAgICAgICAgJyQgYW5rYSBkZXYgL3BhZ2VzL2xvZy9sb2cgL3BhZ2VzL3VzZXIvdXNlcidcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuJGNvbXBpbGVyID0gbmV3IENvbXBpbGVyKClcbiAgICAgICAgdGhpcy4kY29tcGlsZXIuY29uZmlnLmFua2FDb25maWcuZGV2TW9kZSA9IHRydWVcbiAgICB9XG5cbiAgICBhc3luYyBhY3Rpb24gKHBhZ2VzPzogQXJyYXk8c3RyaW5nPiwgb3B0aW9ucz86IERldkNvbW1hbmRPcHRzKSB7XG4gICAgICAgIGNvbnN0IHN0YXJ0dXBUaW1lID0gRGF0ZS5ub3coKVxuICAgICAgICB0aGlzLmluaXRDb21waWxlcigpXG4gICAgICAgIGF3YWl0IHRoaXMuJGNvbXBpbGVyLmNsZWFuKClcbiAgICAgICAgYXdhaXQgdGhpcy4kY29tcGlsZXIubGF1bmNoKClcbiAgICAgICAgYXdhaXQgdGhpcy4kY29tcGlsZXIud2F0Y2hGaWxlcygpXG4gICAgICAgIGxvZ2dlci5zdWNjZXNzKGBTdGFydHVwOiAke0RhdGUubm93KCkgLSBzdGFydHVwVGltZX1tcyDwn46JICwgQW5rYSBpcyB3YWl0aW5nIGZvciBjaGFuZ2VzLi4uYClcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgY29uZmlnIGZyb20gJy4uL2NvbmZpZydcbmltcG9ydCB7IGRvd25sb2FkUmVwbywgbG9nZ2VyIH0gZnJvbSAnLi4vdXRpbHMnXG5pbXBvcnQgeyBDb21tYW5kLCBDb21waWxlciB9IGZyb20gJy4uL2NvcmUnXG5cbmV4cG9ydCB0eXBlIEluaXRDb21tYW5kT3B0cyA9IHtcbiAgICByZXBvOiBzdHJpbmdcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSW5pdENvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHN1cGVyKFxuICAgICAgICAgICAgJ2luaXQgPHByb2plY3QtbmFtZT4nLFxuICAgICAgICAgICAgJ0luaXRpYWxpemUgbmV3IHByb2plY3QnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldEV4YW1wbGVzKFxuICAgICAgICAgICAgJyQgYW5rYSBpbml0JyxcbiAgICAgICAgICAgIGAkIGFua2EgaW5pdCBhbmthLWluLWFjdGlvbiAtLXJlcG89JHtjb25maWcuZGVmYXVsdFNjYWZmb2xkfWBcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0T3B0aW9ucyhcbiAgICAgICAgICAgICctciwgLS1yZXBvJyxcbiAgICAgICAgICAgICd0ZW1wbGF0ZSByZXBvc2l0b3J5J1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy4kY29tcGlsZXIgPSBuZXcgQ29tcGlsZXIoKVxuICAgIH1cblxuICAgIGFzeW5jIGFjdGlvbiAocHJvamVjdE5hbWU6IHN0cmluZywgb3B0aW9ucz86IEluaXRDb21tYW5kT3B0cykge1xuICAgICAgICBjb25zdCBwcm9qZWN0ID0gcGF0aC5yZXNvbHZlKGNvbmZpZy5jd2QsIHByb2plY3ROYW1lKVxuICAgICAgICBjb25zdCByZXBvID0gb3B0aW9ucy5yZXBvIHx8IGNvbmZpZy5kZWZhdWx0U2NhZmZvbGRcblxuICAgICAgICBsb2dnZXIuc3RhcnRMb2FkaW5nKCdEb3dubG9hZGluZyB0ZW1wbGF0ZS4uLicpXG4gICAgICAgIGF3YWl0IGRvd25sb2FkUmVwbyhyZXBvLCBwcm9qZWN0KVxuICAgICAgICBsb2dnZXIuc3RvcExvYWRpbmcoKVxuICAgICAgICBsb2dnZXIuc3VjY2VzcygnRG9uZScsIHByb2plY3QpXG4gICAgfVxufVxuIiwiaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi4vdXRpbHMnXG5pbXBvcnQgeyBDb21tYW5kLCBDb21waWxlciB9IGZyb20gJy4uL2NvcmUnXG5cbmV4cG9ydCB0eXBlIERldkNvbW1hbmRPcHRzID0gT2JqZWN0ICYge31cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGV2Q29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgc3VwZXIoXG4gICAgICAgICAgICAncHJvZCcsXG4gICAgICAgICAgICAnUHJvZHVjdGlvbiBtb2RlJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRFeGFtcGxlcyhcbiAgICAgICAgICAgICckIGFua2EgcHJvZCdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuJGNvbXBpbGVyID0gbmV3IENvbXBpbGVyKClcbiAgICB9XG5cbiAgICBhc3luYyBhY3Rpb24gKHBhZ2VzPzogQXJyYXk8c3RyaW5nPiwgb3B0aW9ucz86IERldkNvbW1hbmRPcHRzKSB7XG4gICAgICAgIGNvbnN0IHN0YXJ0dXBUaW1lID0gRGF0ZS5ub3coKVxuICAgICAgICB0aGlzLmluaXRDb21waWxlcigpXG4gICAgICAgIGF3YWl0IHRoaXMuJGNvbXBpbGVyLmNsZWFuKClcbiAgICAgICAgYXdhaXQgdGhpcy4kY29tcGlsZXIubGF1bmNoKClcbiAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoYERvbmU6ICR7RGF0ZS5ub3coKSAtIHN0YXJ0dXBUaW1lfW1zYCwgJ0hhdmUgYSBuaWNlIGRheSDwn46JICEnKVxuICAgIH1cbn1cbiIsImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJ1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IGNvbmZpZyAgZnJvbSAnLi4vY29uZmlnJ1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vdXRpbHMnXG5pbXBvcnQgeyBDb21tYW5kLCBDb21waWxlciB9IGZyb20gJy4uL2NvcmUnXG5pbXBvcnQgeyBkZWZhdWx0IGFzIEZzRWRpdG9yQ29uc3RydWN0b3IgfSBmcm9tICcuLi91dGlscy9lZGl0b3InXG5cbmltcG9ydCB7XG4gICAgQ29tcGlsZXJDb25maWdcbn0gZnJvbSAnLi4vLi4vdHlwZXMvdHlwZXMnXG5cbmNvbnN0IHsgbG9nZ2VyLCBGc0VkaXRvciB9ID0gdXRpbHNcblxuZXhwb3J0IHR5cGUgQ3JlYXRlUGFnZUNvbW1hbmRPcHRzID0ge1xuICAgIHJvb3Q6IHN0cmluZ1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDcmVhdGVQYWdlQ29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgc3VwZXIoXG4gICAgICAgICAgICAnbmV3LXBhZ2UgPHBhZ2VzLi4uPicsXG4gICAgICAgICAgICAnQ3JlYXRlIGEgbWluaXByb2dyYW0gcGFnZSdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0RXhhbXBsZXMoXG4gICAgICAgICAgICAnJCBhbmthIG5ldy1wYWdlIGluZGV4JyxcbiAgICAgICAgICAgICckIGFua2EgbmV3LXBhZ2UgL3BhZ2VzL2luZGV4L2luZGV4JyxcbiAgICAgICAgICAgICckIGFua2EgbmV3LXBhZ2UgL3BhZ2VzL2luZGV4L2luZGV4IC0tcm9vdD1wYWNrYWdlQSdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0T3B0aW9ucyhcbiAgICAgICAgICAgICctciwgLS1yb290IDxzdWJwYWNrYWdlPicsXG4gICAgICAgICAgICAnc2F2ZSBwYWdlIHRvIHN1YnBhY2thZ2VzJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy4kY29tcGlsZXIgPSBuZXcgQ29tcGlsZXIoKVxuICAgIH1cblxuICAgIGFzeW5jIGFjdGlvbiAocGFnZXM/OiBBcnJheTxzdHJpbmc+LCBvcHRpb25zPzogQ3JlYXRlUGFnZUNvbW1hbmRPcHRzKSB7XG4gICAgICAgIGNvbnN0IHJvb3QgPSBvcHRpb25zLnJvb3RcbiAgICAgICAgY29uc3QgZWRpdG9yID0gbmV3IEZzRWRpdG9yKClcblxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChwYWdlcy5tYXAocGFnZSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZW5lcmF0ZVBhZ2UocGFnZSwgZWRpdG9yLCByb290KVxuICAgICAgICB9KSlcblxuICAgICAgICBsb2dnZXIuc3VjY2VzcygnRG9uZScsICdIYXZlIGEgbmljZSBkYXkg8J+OiSAhJylcbiAgICB9XG5cbiAgICBhc3luYyBnZW5lcmF0ZVBhZ2UgKHBhZ2U6IHN0cmluZywgZWRpdG9yOiBGc0VkaXRvckNvbnN0cnVjdG9yLCByb290Pzogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIGFua2FDb25maWcsXG4gICAgICAgICAgICBwcm9qZWN0Q29uZmlnXG4gICAgICAgIH0gPSA8Q29tcGlsZXJDb25maWc+Y29uZmlnXG4gICAgICAgIGNvbnN0IEN3ZFJlZ0V4cCA9IG5ldyBSZWdFeHAoYF4ke2NvbmZpZy5jd2R9YClcbiAgICAgICAgY29uc3QgcGFnZVBhdGggPSBwYWdlLnNwbGl0KHBhdGguc2VwKS5sZW5ndGggPT09IDEgP1xuICAgICAgICAgICAgcGF0aC5qb2luKGFua2FDb25maWcucGFnZXMsIHBhZ2UsIHBhZ2UpIDogcGFnZVxuICAgICAgICBjb25zdCBwYWdlTmFtZSA9IHBhdGguYmFzZW5hbWUocGFnZVBhdGgpXG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSB7XG4gICAgICAgICAgICBwYWdlTmFtZVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGFwcENvbmZpZ1BhdGggPSBwYXRoLmpvaW4oY29uZmlnLnNyY0RpciwgJ2FwcC5qc29uJylcbiAgICAgICAgbGV0IGFic29sdXRlUGF0aCA9IGNvbmZpZy5zcmNEaXJcblxuICAgICAgICBpZiAocm9vdCkge1xuICAgICAgICAgICAgY29uc3Qgcm9vdFBhdGggPSBwYXRoLmpvaW4oYW5rYUNvbmZpZy5zdWJQYWNrYWdlcywgcm9vdClcbiAgICAgICAgICAgIGNvbnN0IHN1YlBrZyA9IHByb2plY3RDb25maWcuc3ViUGFja2FnZXMuZmluZCgocGtnOiBhbnkpID0+IHBrZy5yb290ID09PSByb290UGF0aClcblxuICAgICAgICAgICAgYWJzb2x1dGVQYXRoID0gcGF0aC5qb2luKGFic29sdXRlUGF0aCwgYW5rYUNvbmZpZy5zdWJQYWNrYWdlcywgcm9vdCwgcGFnZVBhdGgpXG5cbiAgICAgICAgICAgIGlmIChzdWJQa2cpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3ViUGtnLnBhZ2VzLmluY2x1ZGVzKHBhZ2VQYXRoKSkge1xuICAgICAgICAgICAgICAgICAgICBsb2dnZXIud2FybignVGhlIHBhZ2UgYWxyZWFkeSBleGlzdHMnLCBhYnNvbHV0ZVBhdGgpXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHN1YlBrZy5wYWdlcy5wdXNoKHBhZ2VQYXRoKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcHJvamVjdENvbmZpZy5zdWJQYWNrYWdlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgcm9vdDogcm9vdFBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHBhZ2VzOiBbcGFnZVBhdGhdXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFic29sdXRlUGF0aCA9IHBhdGguam9pbihhYnNvbHV0ZVBhdGgsIHBhZ2VQYXRoKVxuXG4gICAgICAgICAgICBpZiAocHJvamVjdENvbmZpZy5wYWdlcy5pbmNsdWRlcyhwYWdlUGF0aCkpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIud2FybignVGhlIHBhZ2UgYWxyZWFkeSBleGlzdHMnLCBhYnNvbHV0ZVBhdGgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHByb2plY3RDb25maWcucGFnZXMucHVzaChwYWdlUGF0aClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRwbHMgPSBhd2FpdCB1dGlscy5zZWFyY2hGaWxlcyhgJHtwYXRoLmpvaW4oYW5rYUNvbmZpZy50ZW1wbGF0ZS5wYWdlLCAnKi4qJyl9YClcblxuICAgICAgICB0cGxzLmZvckVhY2godHBsID0+IHtcbiAgICAgICAgICAgIGVkaXRvci5jb3B5KFxuICAgICAgICAgICAgICAgIHRwbCxcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKGFic29sdXRlUGF0aCksIHBhZ2VOYW1lICsgcGF0aC5leHRuYW1lKHRwbCkpLFxuICAgICAgICAgICAgICAgIGNvbnRleHRcbiAgICAgICAgICAgIClcbiAgICAgICAgfSlcbiAgICAgICAgZWRpdG9yLndyaXRlSlNPTihhcHBDb25maWdQYXRoLCBwcm9qZWN0Q29uZmlnLCBudWxsLCA0KVxuXG4gICAgICAgIGF3YWl0IGVkaXRvci5zYXZlKClcblxuICAgICAgICBsb2dnZXIuc3VjY2VzcygnQ3JlYXRlIHBhZ2UnLCBhYnNvbHV0ZVBhdGgucmVwbGFjZShDd2RSZWdFeHAsICcnKSlcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcydcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBjb25maWcgIGZyb20gJy4uL2NvbmZpZydcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uL3V0aWxzJ1xuaW1wb3J0IHsgQ29tbWFuZCwgQ29tcGlsZXIgfSBmcm9tICcuLi9jb3JlJ1xuaW1wb3J0IHsgZGVmYXVsdCBhcyBGc0VkaXRvckNvbnN0cnVjdG9yIH0gZnJvbSAnLi4vdXRpbHMvZWRpdG9yJ1xuXG5pbXBvcnQge1xuICAgIENvbXBpbGVyQ29uZmlnXG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5jb25zdCB7IGxvZ2dlciwgRnNFZGl0b3IgfSA9IHV0aWxzXG5cbmV4cG9ydCB0eXBlIENyZWF0ZUNvbXBvbmVudENvbW1hbmRPcHRzID0ge1xuICAgIHJvb3Q6IHN0cmluZ1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDcmVhdGVDb21wb25lbnRDb21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBzdXBlcihcbiAgICAgICAgICAgICduZXctY21wdCA8Y29tcG9uZW50cy4uLj4nLFxuICAgICAgICAgICAgJ0NyZWF0ZSBhIG1pbmlwcm9ncmFtIGNvbXBvbmVudCdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0RXhhbXBsZXMoXG4gICAgICAgICAgICAnJCBhbmthIG5ldy1jbXB0IGJ1dHRvbicsXG4gICAgICAgICAgICAnJCBhbmthIG5ldy1jbXB0IC9jb21wb25lbnRzL2J1dHRvbi9idXR0b24nLFxuICAgICAgICAgICAgJyQgYW5rYSBuZXctY21wdCAvY29tcG9uZW50cy9idXR0b24vYnV0dG9uIC0tZ2xvYmFsJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRPcHRpb25zKFxuICAgICAgICAgICAgJy1yLCAtLXJvb3QgPHN1YnBhY2thZ2U+JyxcbiAgICAgICAgICAgICdzYXZlIGNvbXBvbmVudCB0byBzdWJwYWNrYWdlcydcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuJGNvbXBpbGVyID0gbmV3IENvbXBpbGVyKClcbiAgICB9XG5cbiAgICBhc3luYyBhY3Rpb24gKGNvbXBvbmVudHM/OiBBcnJheTxzdHJpbmc+LCBvcHRpb25zPzogQ3JlYXRlQ29tcG9uZW50Q29tbWFuZE9wdHMpIHtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgcm9vdFxuICAgICAgICB9ID0gb3B0aW9uc1xuICAgICAgICBjb25zdCBlZGl0b3IgPSBuZXcgRnNFZGl0b3IoKVxuXG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKGNvbXBvbmVudHMubWFwKGNvbXBvbmVudCA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZW5lcmF0ZUNvbXBvbmVudChjb21wb25lbnQsIGVkaXRvciwgcm9vdClcbiAgICAgICAgfSkpXG5cbiAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoJ0RvbmUnLCAnSGF2ZSBhIG5pY2UgZGF5IPCfjokgIScpXG4gICAgfVxuXG4gICAgYXN5bmMgZ2VuZXJhdGVDb21wb25lbnQgKGNvbXBvbmVudDogc3RyaW5nLCBlZGl0b3I6IEZzRWRpdG9yQ29uc3RydWN0b3IsIHJvb3Q/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgYW5rYUNvbmZpZyxcbiAgICAgICAgICAgIHByb2plY3RDb25maWdcbiAgICAgICAgfSA9IDxDb21waWxlckNvbmZpZz5jb25maWdcbiAgICAgICAgY29uc3QgQ3dkUmVnRXhwID0gbmV3IFJlZ0V4cChgXiR7Y29uZmlnLmN3ZH1gKVxuICAgICAgICBjb25zdCBjb21wb25lbnRQYXRoID0gY29tcG9uZW50LnNwbGl0KHBhdGguc2VwKS5sZW5ndGggPT09IDEgP1xuICAgICAgICAgICAgcGF0aC5qb2luKGFua2FDb25maWcuY29tcG9uZW50cywgY29tcG9uZW50LCBjb21wb25lbnQpIDpcbiAgICAgICAgICAgIGNvbXBvbmVudFxuICAgICAgICBjb25zdCBjb21wb25lbnROYW1lID0gcGF0aC5iYXNlbmFtZShjb21wb25lbnRQYXRoKVxuICAgICAgICBjb25zdCBjb250ZXh0ID0ge1xuICAgICAgICAgICAgY29tcG9uZW50TmFtZVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGFic29sdXRlUGF0aCA9IHJvb3QgP1xuICAgICAgICAgICAgcGF0aC5qb2luKGNvbmZpZy5zcmNEaXIsIGFua2FDb25maWcuc3ViUGFja2FnZXMsIHJvb3QsIGNvbXBvbmVudFBhdGgpIDpcbiAgICAgICAgICAgIHBhdGguam9pbihjb25maWcuc3JjRGlyLCBjb21wb25lbnRQYXRoKVxuXG4gICAgICAgIGlmIChmcy5leGlzdHNTeW5jKHBhdGguam9pbihwYXRoLmRpcm5hbWUoYWJzb2x1dGVQYXRoKSwgY29tcG9uZW50TmFtZSArICcuanNvbicpKSkge1xuICAgICAgICAgICAgbG9nZ2VyLndhcm4oJ1RoZSBjb21wb25lbnQgYWxyZWFkeSBleGlzdHMnLCBhYnNvbHV0ZVBhdGgpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRwbHMgPSBhd2FpdCB1dGlscy5zZWFyY2hGaWxlcyhgJHtwYXRoLmpvaW4oYW5rYUNvbmZpZy50ZW1wbGF0ZS5jb21wb25lbnQsICcqLionKX1gKVxuXG4gICAgICAgIHRwbHMuZm9yRWFjaCh0cGwgPT4ge1xuICAgICAgICAgICAgZWRpdG9yLmNvcHkoXG4gICAgICAgICAgICAgICAgdHBsLFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwYXRoLmRpcm5hbWUoYWJzb2x1dGVQYXRoKSwgY29tcG9uZW50TmFtZSArIHBhdGguZXh0bmFtZSh0cGwpKSxcbiAgICAgICAgICAgICAgICBjb250ZXh0XG4gICAgICAgICAgICApXG4gICAgICAgIH0pXG5cbiAgICAgICAgYXdhaXQgZWRpdG9yLnNhdmUoKVxuXG4gICAgICAgIGxvZ2dlci5zdWNjZXNzKCdDcmVhdGUgY29tcG9uZW50JywgYWJzb2x1dGVQYXRoLnJlcGxhY2UoQ3dkUmVnRXhwLCAnJykpXG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgY29uZmlnICBmcm9tICcuLi9jb25maWcnXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi91dGlscydcbmltcG9ydCB7IENvbW1hbmQsIENvbXBpbGVyIH0gZnJvbSAnLi4vY29yZSdcbmltcG9ydCB7IGRlZmF1bHQgYXMgRnNFZGl0b3JDb25zdHJ1Y3RvciB9IGZyb20gJy4uL3V0aWxzL2VkaXRvcidcblxuaW1wb3J0IHtcbiAgICBDb21waWxlckNvbmZpZ1xufSBmcm9tICcuLi8uLi90eXBlcy90eXBlcydcblxuY29uc3QgeyBsb2dnZXIsIEZzRWRpdG9yIH0gPSB1dGlsc1xuXG5leHBvcnQgdHlwZSBFbnJvbGxDb21wb25lbnRDb21tYW5kT3B0cyA9IHtcbiAgICBwYWdlOiBzdHJpbmdcbiAgICBnbG9iYWw6IHN0cmluZ1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBFbnJvbGxDb21wb25lbnRDb21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBzdXBlcihcbiAgICAgICAgICAgICdlbnJvbGwgPGNvbXBvbmVudHMuLi4+JyxcbiAgICAgICAgICAgICdFbnJvbGwgYSBtaW5pcHJvZ3JhbSBjb21wb25lbnQnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldEV4YW1wbGVzKFxuICAgICAgICAgICAgJyQgYW5rYSBlbnJvbGwgYnV0dG9uIC0tZ2xvYmFsJyxcbiAgICAgICAgICAgICckIGFua2EgZW5yb2xsIC9jb21wb25lbnRzL2J1dHRvbi9idXR0b24gLS1nbG9iYWwnLFxuICAgICAgICAgICAgJyQgYW5rYSBlbnJvbGwgL2NvbXBvbmVudHMvYnV0dG9uL2J1dHRvbiAtLXBhZ2U9L3BhZ2VzL2luZGV4L2luZGV4J1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRPcHRpb25zKFxuICAgICAgICAgICAgJy1wLCAtLXBhZ2UgPHBhZ2U+JyxcbiAgICAgICAgICAgICd3aGljaCBwYWdlIGNvbXBvbmVudHMgZW5yb2xsIHRvJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRPcHRpb25zKFxuICAgICAgICAgICAgJy1nLCAtLWdsb2JhbCcsXG4gICAgICAgICAgICAnZW5yb2xsIGNvbXBvbmVudHMgdG8gYXBwLmpzb24nXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLiRjb21waWxlciA9IG5ldyBDb21waWxlcigpXG4gICAgfVxuXG4gICAgYXN5bmMgYWN0aW9uIChjb21wb25lbnRzPzogQXJyYXk8c3RyaW5nPiwgb3B0aW9ucz86IEVucm9sbENvbXBvbmVudENvbW1hbmRPcHRzKSB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIHBhZ2UsXG4gICAgICAgICAgICBnbG9iYWxcbiAgICAgICAgfSA9IG9wdGlvbnNcbiAgICAgICAgY29uc3QgZWRpdG9yID0gbmV3IEZzRWRpdG9yKClcblxuICAgICAgICBpZiAoIWdsb2JhbCAmJiAhcGFnZSkge1xuICAgICAgICAgICAgbG9nZ2VyLndhcm4oJ1doZXJlIGNvbXBvbmVudHMgZW5yb2xsIHRvPycpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKGNvbXBvbmVudHMubWFwKGNvbXBvbmVudCA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5lbnJvbGxDb21wb25lbnQoY29tcG9uZW50LCBlZGl0b3IsIGdsb2JhbCA/ICcnIDogcGFnZSlcbiAgICAgICAgfSkpXG5cbiAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoJ0RvbmUnLCAnSGF2ZSBhIG5pY2UgZGF5IPCfjokgIScpXG4gICAgfVxuXG4gICAgYXN5bmMgZW5yb2xsQ29tcG9uZW50IChjb21wb25lbnQ6IHN0cmluZywgZWRpdG9yOiBGc0VkaXRvckNvbnN0cnVjdG9yLCBwYWdlPzogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIGFua2FDb25maWcsXG4gICAgICAgICAgICBwcm9qZWN0Q29uZmlnXG4gICAgICAgIH0gPSA8Q29tcGlsZXJDb25maWc+Y29uZmlnXG4gICAgICAgIGNvbnN0IEN3ZFJlZ0V4cCA9IG5ldyBSZWdFeHAoYF4ke2NvbmZpZy5jd2R9YClcbiAgICAgICAgY29uc3QgY29tcG9uZW50UGF0aCA9IGNvbXBvbmVudC5zcGxpdChwYXRoLnNlcCkubGVuZ3RoID09PSAxID9cbiAgICAgICAgICAgIHBhdGguam9pbihhbmthQ29uZmlnLmNvbXBvbmVudHMsIGNvbXBvbmVudCwgY29tcG9uZW50KSA6XG4gICAgICAgICAgICBjb21wb25lbnRcbiAgICAgICAgY29uc3QgY29tcG9uZW50TmFtZSA9IGNvbXBvbmVudFBhdGguc3BsaXQocGF0aC5zZXApLnBvcCgpXG4gICAgICAgIGNvbnN0IGFwcENvbmZpZ1BhdGggPSBwYXRoLmpvaW4oY29uZmlnLnNyY0RpciwgJ2FwcC5qc29uJylcbiAgICAgICAgY29uc3QgY29tcG9uZW50QWJzUGF0aCA9IHBhdGguam9pbihjb25maWcuc3JjRGlyLCBjb21wb25lbnRQYXRoKVxuXG4gICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKGNvbXBvbmVudEFic1BhdGgpLCBjb21wb25lbnROYW1lICsgJy5qc29uJykpKSB7XG4gICAgICAgICAgICBsb2dnZXIud2FybignQ29tcG9uZW50IGRvc2Ugbm90IGV4aXN0cycsIGNvbXBvbmVudEFic1BhdGgpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwYWdlKSB7XG4gICAgICAgICAgICBjb25zdCBwYWdlQWJzUGF0aCA9IHBhdGguam9pbihjb25maWcuc3JjRGlyLCBwYWdlKVxuICAgICAgICAgICAgY29uc3QgcGFnZUpzb25QYXRoID0gcGF0aC5qb2luKHBhdGguZGlybmFtZShwYWdlQWJzUGF0aCksIHBhdGguYmFzZW5hbWUocGFnZUFic1BhdGgpICsgJy5qc29uJylcbiAgICAgICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhwYWdlSnNvblBhdGgpKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLndhcm4oJ1BhZ2UgZG9zZSBub3QgZXhpc3RzJywgcGFnZUFic1BhdGgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHBhZ2VKc29uID0gPGFueT5KU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhwYWdlSnNvblBhdGgsIHtcbiAgICAgICAgICAgICAgICBlbmNvZGluZzogJ3V0ZjgnXG4gICAgICAgICAgICB9KSB8fCAne30nKVxuXG4gICAgICAgICAgICB0aGlzLmVuc3VyZVVzaW5nQ29tcG9uZW50cyhwYWdlSnNvbilcblxuICAgICAgICAgICAgaWYgKHBhZ2VKc29uLnVzaW5nQ29tcG9uZW50c1tjb21wb25lbnROYW1lXSkge1xuICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKCdDb21wb25lbnQgYWxyZWFkeSBlbnJvbGxlZCBpbicsIHBhZ2VBYnNQYXRoKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwYWdlSnNvbi51c2luZ0NvbXBvbmVudHNbY29tcG9uZW50TmFtZV0gPSBwYXRoLnJlbGF0aXZlKHBhdGguZGlybmFtZShwYWdlQWJzUGF0aCksIGNvbXBvbmVudEFic1BhdGgpXG4gICAgICAgICAgICBlZGl0b3Iud3JpdGVKU09OKHBhZ2VKc29uUGF0aCwgcGFnZUpzb24pXG4gICAgICAgICAgICBhd2FpdCBlZGl0b3Iuc2F2ZSgpXG5cbiAgICAgICAgICAgIGxvZ2dlci5zdWNjZXNzKGBFbnJvbGwgJHtjb21wb25lbnRQYXRofSBpbmAsIHBhZ2VBYnNQYXRoLnJlcGxhY2UoQ3dkUmVnRXhwLCAnJykpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmVuc3VyZVVzaW5nQ29tcG9uZW50cyhwcm9qZWN0Q29uZmlnKVxuXG4gICAgICAgICAgICBpZiAocHJvamVjdENvbmZpZy51c2luZ0NvbXBvbmVudHNbY29tcG9uZW50TmFtZV0pIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIud2FybignQ29tcG9uZW50IGFscmVhZHkgZW5yb2xsZWQgaW4nLCAnYXBwLmpzb24nKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcm9qZWN0Q29uZmlnLnVzaW5nQ29tcG9uZW50c1tjb21wb25lbnROYW1lXSA9IHBhdGgucmVsYXRpdmUocGF0aC5kaXJuYW1lKGFwcENvbmZpZ1BhdGgpLCBjb21wb25lbnRBYnNQYXRoKVxuICAgICAgICAgICAgZWRpdG9yLndyaXRlSlNPTihhcHBDb25maWdQYXRoLCBwcm9qZWN0Q29uZmlnKVxuICAgICAgICAgICAgYXdhaXQgZWRpdG9yLnNhdmUoKVxuXG4gICAgICAgICAgICBsb2dnZXIuc3VjY2VzcyhgRW5yb2xsICR7Y29tcG9uZW50UGF0aH0gaW5gLCAnYXBwLmpzb24nKVxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBlbnN1cmVVc2luZ0NvbXBvbmVudHMgKGNvbmZpZzogYW55KSB7XG4gICAgICAgIGlmICghY29uZmlnLnVzaW5nQ29tcG9uZW50cykge1xuICAgICAgICAgICAgY29uZmlnLnVzaW5nQ29tcG9uZW50cyA9IHt9XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJpbXBvcnQgRGV2IGZyb20gJy4vY29tbWFuZHMvZGV2J1xuaW1wb3J0IEluaXQgZnJvbSAnLi9jb21tYW5kcy9pbml0J1xuaW1wb3J0IFByb2QgZnJvbSAnLi9jb21tYW5kcy9wcm9kJ1xuaW1wb3J0IENyZWF0ZVBhZ2UgZnJvbSAnLi9jb21tYW5kcy9jcmVhdGVQYWdlJ1xuaW1wb3J0IENyZWF0ZUNvbXBvbmVudCBmcm9tICcuL2NvbW1hbmRzL2NyZWF0ZUNvbXBvbmVudCdcbmltcG9ydCBFbnJvbGxDb21wb25lbnQgZnJvbSAnLi9jb21tYW5kcy9lbnJvbGxDb21wb25lbnQnXG5cbmV4cG9ydCBkZWZhdWx0IFtcbiAgICBuZXcgUHJvZCgpLFxuICAgIG5ldyBEZXYoKSxcbiAgICBuZXcgSW5pdCgpLFxuICAgIG5ldyBDcmVhdGVQYWdlKCksXG4gICAgbmV3IENyZWF0ZUNvbXBvbmVudCgpLFxuICAgIG5ldyBFbnJvbGxDb21wb25lbnQoKVxuXVxuIiwiaW1wb3J0IGNvbmZpZyBmcm9tICcuL2NvbmZpZydcbmltcG9ydCAqIGFzIHNlbXZlciBmcm9tICdzZW12ZXInXG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tICcuL3V0aWxzJ1xuaW1wb3J0ICogYXMgY2ZvbnRzIGZyb20gJ2Nmb250cydcbmltcG9ydCBjb21tYW5kcyBmcm9tICcuL2NvbW1hbmRzJ1xuaW1wb3J0IENvbXBpbGVyIGZyb20gJy4vY29yZS9jbGFzcy9Db21waWxlcidcblxuY29uc3QgY29tbWFuZGVyID0gcmVxdWlyZSgnY29tbWFuZGVyJylcbmNvbnN0IHBrZ0pzb24gPSByZXF1aXJlKCcuLi9wYWNrYWdlLmpzb24nKVxuXG5yZXF1aXJlKCdzb3VyY2UtbWFwLXN1cHBvcnQnKS5pbnN0YWxsKClcblxuaWYgKCFzZW12ZXIuc2F0aXNmaWVzKHNlbXZlci5jbGVhbihwcm9jZXNzLnZlcnNpb24pLCBwa2dKc29uLmVuZ2luZXMubm9kZSkpIHtcbiAgICBsb2dnZXIuZXJyb3IoJ1JlcXVpcmVkIG5vZGUgdmVyc2lvbiAnICsgcGtnSnNvbi5lbmdpbmVzLm5vZGUpXG4gICAgcHJvY2Vzcy5leGl0KDEpXG59XG5cbmlmIChwcm9jZXNzLmFyZ3YuaW5kZXhPZignLS1kZWJ1ZycpID4gLTEpIHtcbiAgICBjb25maWcuYW5rYUNvbmZpZy5kZWJ1ZyA9IHRydWVcbn1cblxuaWYgKHByb2Nlc3MuYXJndi5pbmRleE9mKCctLXNsaWVudCcpID4gLTEpIHtcbiAgICBjb25maWcuYW5rYUNvbmZpZy5xdWlldCA9IHRydWVcbn1cblxuY29tbWFuZGVyXG4gICAgLm9wdGlvbignLS1kZWJ1ZycsICdlbmFibGUgZGVidWcgbW9kZScpXG4gICAgLm9wdGlvbignLS1xdWlldCcsICdoaWRlIGNvbXBpbGUgbG9nJylcbiAgICAudmVyc2lvbihwa2dKc29uLnZlcnNpb24pXG4gICAgLnVzYWdlKCc8Y29tbWFuZD4gW29wdGlvbnNdJylcblxuY29tbWFuZHMuZm9yRWFjaChjb21tYW5kID0+IHtcbiAgICBjb25zdCBjbWQgPSBjb21tYW5kZXIuY29tbWFuZChjb21tYW5kLmNvbW1hbmQpXG5cbiAgICBpZiAoY29tbWFuZC5kZXNjcmlwdGlvbikge1xuICAgICAgICBjbWQuZGVzY3JpcHRpb24oY29tbWFuZC5kZXNjcmlwdGlvbilcbiAgICB9XG5cbiAgICBpZiAoY29tbWFuZC51c2FnZSkge1xuICAgICAgICBjbWQudXNhZ2UoY29tbWFuZC51c2FnZSlcbiAgICB9XG5cbiAgICBpZiAoY29tbWFuZC5vbikge1xuICAgICAgICBmb3IgKGxldCBrZXkgaW4gY29tbWFuZC5vbikge1xuICAgICAgICAgICAgY21kLm9uKGtleSwgY29tbWFuZC5vbltrZXldKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNvbW1hbmQub3B0aW9ucykge1xuICAgICAgICBjb21tYW5kLm9wdGlvbnMuZm9yRWFjaCgob3B0aW9uOiBbYW55LCBhbnksIGFueSwgYW55XSkgPT4ge1xuICAgICAgICAgICAgY21kLm9wdGlvbiguLi5vcHRpb24pXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgaWYgKGNvbW1hbmQuYWN0aW9uKSB7XG4gICAgICAgIGNtZC5hY3Rpb24oYXN5bmMgKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgY29tbWFuZC5hY3Rpb24oLi4uYXJncylcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcihlcnIubWVzc2FnZSB8fCAnJylcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgaWYgKGNvbW1hbmQuZXhhbXBsZXMpIHtcbiAgICAgICAgY21kLm9uKCctLWhlbHAnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb21tYW5kLnByaW50VGl0bGUoJ0V4YW1wbGVzOicpXG4gICAgICAgICAgICBjb21tYW5kLmV4YW1wbGVzLmZvckVhY2goZXhhbXBsZSA9PiB7XG4gICAgICAgICAgICAgICAgY29tbWFuZC5wcmludENvbnRlbnQoZXhhbXBsZSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgfVxufSlcblxuaWYgKHByb2Nlc3MuYXJndi5sZW5ndGggPT09IDIpIHtcbiAgICBjb25zdCBMb2dvID0gY2ZvbnRzLnJlbmRlcignQW5rYScsIHtcbiAgICAgICAgZm9udDogJ3NpbXBsZScsXG4gICAgICAgIGNvbG9yczogWydncmVlbkJyaWdodCddXG4gICAgfSlcblxuICAgIGNvbnNvbGUubG9nKExvZ28uc3RyaW5nLnJlcGxhY2UoLyhcXHMrKSQvLCBgICR7cGtnSnNvbi52ZXJzaW9ufVxcclxcbmApKVxuICAgIGNvbW1hbmRlci5vdXRwdXRIZWxwKClcbn1cblxuY29tbWFuZGVyLnBhcnNlKHByb2Nlc3MuYXJndilcblxuZXhwb3J0IGRlZmF1bHQgQ29tcGlsZXJcbiJdLCJuYW1lcyI6WyJwYXRoLmpvaW4iLCJmcy5leGlzdHNTeW5jIiwic2Fzcy5yZW5kZXIiLCJwb3N0Y3NzIiwidHNsaWJfMS5fX2Fzc2lnbiIsImJhYmVsLnRyYW5zZm9ybVN5bmMiLCJmcy5lbnN1cmVGaWxlIiwidHMudHJhbnNwaWxlTW9kdWxlIiwiYmFiZWwucGFyc2UiLCJwYXRoIiwicGF0aC5kaXJuYW1lIiwicGF0aC5yZWxhdGl2ZSIsImN3ZCIsImFua2FEZWZhdWx0Q29uZmlnLnRlbXBsYXRlIiwiYW5rYURlZmF1bHRDb25maWcucGFyc2VycyIsImFua2FEZWZhdWx0Q29uZmlnLnBsdWdpbnMiLCJwYXRoLnJlc29sdmUiLCJjdXN0b21Db25maWciLCJzeXN0ZW0uc3JjRGlyIiwiZnMucmVhZEZpbGUiLCJmcy53cml0ZUZpbGUiLCJwYXRoLmJhc2VuYW1lIiwicGF0aC5leHRuYW1lIiwiZnMucmVhZEZpbGVTeW5jIiwibG9nIiwiY2hva2lkYXIud2F0Y2giLCJ0c2xpYl8xLl9fZXh0ZW5kcyIsInV0aWxzLmNyZWF0ZUZpbGUiLCJ1dGlscy5hc3luY0Z1bmN0aW9uV3JhcHBlciIsInV0aWxzLmNhbGxQcm9taXNlSW5DaGFpbiIsInV0aWxzLmxvZ2dlciIsImxvZ2dlciIsInV0aWxzLnNlYXJjaEZpbGVzIiwiZnMuZW5zdXJlRGlyU3luYyIsInV0aWxzLmdlbkZpbGVXYXRjaGVyIiwiZnMudW5saW5rIiwiZG93bmxvYWRSZXBvIiwiRnNFZGl0b3IiLCJwYXRoLnNlcCIsImNvbmZpZyIsIlByb2QiLCJEZXYiLCJJbml0IiwiQ3JlYXRlUGFnZSIsIkNyZWF0ZUNvbXBvbmVudCIsIkVucm9sbENvbXBvbmVudCIsInNlbXZlci5zYXRpc2ZpZXMiLCJzZW12ZXIuY2xlYW4iLCJjZm9udHMucmVuZGVyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHQSxJQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUE7QUFFekIsd0JBQXlCLEtBQXlCLEVBQUUsSUFBYTtJQUF4QyxzQkFBQSxFQUFBLFVBQXlC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
