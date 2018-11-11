#!/usr/bin/env node
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = require('fs');
var path = require('path');
var fs$1 = require('fs-extra');
var chalk = _interopDefault(require('chalk'));
var tslib_1 = require('tslib');
var chokidar = require('chokidar');
var downloadRepo = _interopDefault(require('download-git-repo'));
var sass = require('node-sass');
var postcssrc = _interopDefault(require('postcss-load-config'));
var babel = require('@babel/core');
var ts = require('typescript');
var traverse = _interopDefault(require('@babel/traverse'));
var cfonts = require('cfonts');
var commander = require('commander');

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
        this.log(chalk.red('✘'), chalk.reset(title), chalk.grey(msg));
        err && console.log(err);
    };
    Logger.prototype.info = function (title, msg) {
        if (title === void 0) { title = ''; }
        if (msg === void 0) { msg = ''; }
        this.log(chalk.cyan('○'), chalk.reset(title), chalk.grey(msg));
    };
    Logger.prototype.warn = function (title, msg) {
        if (title === void 0) { title = ''; }
        if (msg === void 0) { msg = ''; }
        this.log(chalk.yellow('⚠'), chalk.reset(title), chalk.grey(msg));
    };
    Logger.prototype.success = function (title, msg) {
        if (title === void 0) { title = ''; }
        if (msg === void 0) { msg = ''; }
        this.log(chalk.green('✔'), chalk.reset(title), chalk.grey(msg));
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

var sassParser = (function (file, compilation, callback) {
    file.content = file.content instanceof Buffer ? file.content.toString() : file.content;
    sass.render({
        file: file.sourceFile,
        data: file.content,
        outputStyle: !config.ankaConfig.devMode ? 'nested' : 'compressed'
    }, function (err, result) {
        if (err) {
            logger.error('Compile', err.message, err);
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
    if (file.isInSrcDir) {
        if (!babelConfig) {
            babelConfig = resolveConfig(['babel.config.js'], config.cwd);
        }
        file.content = file.content instanceof Buffer ? file.content.toString() : file.content;
        var result = babel.transformSync(file.content, tslib_1.__assign({ babelrc: false, filename: file.sourceFile, sourceType: 'module', sourceMaps: config.ankaConfig.devMode }, babelConfig));
        file.sourceMap = JSON.stringify(result.map);
        file.content = result.code;
    }
    file.updateExt('.js');
    cb();
});

var inlineSourceMapComment = require('inline-source-map-comment');
var writeFile$1 = writeFile;
var saveFilePlugin = (function () {
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
            return writeFile$1(file.targetFile, file.content);
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

var logger$1 = logger;
var tsConfig = null;
var typescriptParser = (function (file, compilation, callback) {
    file.content = file.content instanceof Buffer ? file.content.toString() : file.content;
    var sourceMap = {
        sourcesContent: [file.content]
    };
    if (!tsConfig) {
        tsConfig = resolveConfig(['tsconfig.json', 'tsconfig.js'], config.cwd);
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
        logger$1.error('Compile error', err.message, err);
    }
    callback();
});

var dependencyPool = new Map();
var resovleModuleName = require('require-package-name');
var extractDependencyPlugin = (function () {
    var compiler = this.getCompiler();
    var config = this.getSystemConfig();
    var testNodeModules = new RegExp("^" + config.sourceNodeModules);
    this.on('before-compile', function (compilation, cb) {
        var file = compilation.file;
        var localDependencyPool = new Map();
        if (file.extname === '.js') {
            if (file.ast === void (0)) {
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
            file.content = babel.transformFromAstSync(file.ast).code;
            var dependencyList = Array.from(localDependencyPool.keys()).filter(function (dependency) { return !dependencyPool.has(dependency); });
            Promise.all(dependencyList.map(function (dependency) { return traverseNpmDependency(dependency); })).then(function () {
                cb();
            }).catch(function (err) {
                cb();
                logger.error(file.sourceFile, err.message, err);
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
        if (isNpmDependency(moduleName) || testNodeModules.test(sourceFile)) {
            var dependency = resolveModule(node.value, {
                paths: [sourceBaseName]
            });
            if (!dependency)
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
                        return [4, createFile(dependency)];
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
    } : template, parsers: customConfig.parsers ? customConfig.parsers.concat(parsers) : parsers, plugins: plugins.concat(customConfig.plugins || []) });

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

var Injection = (function () {
    function Injection(compiler, options) {
        this.compiler = compiler;
        this.options = options;
    }
    Injection.prototype.getCompiler = function () {
        return this.compiler;
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

var logger$2 = logger;
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
                    case 0: return [4, del([path.join(config.distDir, '**/*')])];
                    case 1:
                        _a.sent();
                        logger$2.success('Clean', config.distDir);
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
                        logger$2.info('Launching...');
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
                            logger$2.success('Remove', fileName);
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
                        logger.success("Startup: " + (Date.now() - startupTime) + "ms", "Anka is waiting for changes...");
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

var logger$3 = logger, FsEditor$1 = FsEditor;
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
                        logger$3.success('Done', 'Have a nice day 🎉 !');
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
                                    logger$3.warn('The page already exists', absolutePath);
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
                                logger$3.warn('The page already exists', absolutePath);
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
                        logger$3.success('Create page', absolutePath.replace(CwdRegExp, ''));
                        return [2];
                }
            });
        });
    };
    return CreatePageCommand;
}(Command));

var logger$4 = logger, FsEditor$2 = FsEditor;
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
                        logger$4.success('Done', 'Have a nice day 🎉 !');
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
                            logger$4.warn('The component already exists', absolutePath);
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
                        logger$4.success('Create component', absolutePath.replace(CwdRegExp, ''));
                        return [2];
                }
            });
        });
    };
    return CreateComponentCommand;
}(Command));

var logger$5 = logger, FsEditor$3 = FsEditor;
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
                            logger$5.warn('Where components enroll to?');
                            return [2];
                        }
                        return [4, Promise.all(components.map(function (component) {
                                return _this.enrollComponent(component, editor, global ? '' : page);
                            }))];
                    case 1:
                        _a.sent();
                        logger$5.success('Done', 'Have a nice day 🎉 !');
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
                            logger$5.warn('Component dose not exists', componentAbsPath);
                            return [2];
                        }
                        if (!page) return [3, 2];
                        pageAbsPath = path.join(config.srcDir, page);
                        pageJsonPath = path.join(path.dirname(pageAbsPath), path.basename(pageAbsPath) + '.json');
                        if (!fs.existsSync(pageJsonPath)) {
                            logger$5.warn('Page dose not exists', pageAbsPath);
                            return [2];
                        }
                        pageJson = JSON.parse(fs.readFileSync(pageJsonPath, {
                            encoding: 'utf8'
                        }) || '{}');
                        this.ensureUsingComponents(pageJson);
                        if (pageJson.usingComponents[componentName]) {
                            logger$5.warn('Component already enrolled in', pageAbsPath);
                            return [2];
                        }
                        pageJson.usingComponents[componentName] = path.relative(path.dirname(pageAbsPath), componentAbsPath);
                        editor.writeJSON(pageJsonPath, pageJson);
                        return [4, editor.save()];
                    case 1:
                        _b.sent();
                        logger$5.success("Enroll " + componentPath + " in", pageAbsPath.replace(CwdRegExp, ''));
                        return [3, 4];
                    case 2:
                        this.ensureUsingComponents(projectConfig);
                        if (projectConfig.usingComponents[componentName]) {
                            logger$5.warn('Component already enrolled in', 'app.json');
                            return [2];
                        }
                        projectConfig.usingComponents[componentName] = path.relative(path.dirname(appConfigPath), componentAbsPath);
                        editor.writeJSON(appConfigPath, projectConfig);
                        return [4, editor.save()];
                    case 3:
                        _b.sent();
                        logger$5.success("Enroll " + componentPath + " in", 'app.json');
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
var pkgJson = require('../package.json');
require('source-map-support').install();
if (process.argv.indexOf('--debug') > -1) {
    config.ankaConfig.debug = true;
}
if (process.argv.indexOf('--slient') > -1) {
    config.ankaConfig.quiet = true;
}
commander.option('--debug', 'enable debug mode')
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
    cfonts.say('Anka', {
        font: 'simple',
        colors: ['greenBright']
    });
    console.log('  Version: ' + pkgJson.version);
    commander.outputHelp();
}
commander.parse(process.argv);

module.exports = Compiler;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlscy9yZXNvbHZlQ29uZmlnLnRzIiwiLi4vc3JjL3V0aWxzL2ZzLnRzIiwiLi4vc3JjL3V0aWxzL2xvZ2dlci50cyIsIi4uL3NyYy9jb3JlL2NsYXNzL0ZpbGUudHMiLCIuLi9zcmMvdXRpbHMvY3JlYXRlRmlsZS50cyIsIi4uL3NyYy91dGlscy9lZGl0b3IudHMiLCIuLi9zcmMvdXRpbHMvcmVzb2x2ZU1vZHVsZS50cyIsIi4uL3NyYy91dGlscy9jYWxsUHJvbWlzZUluQ2hhaW4udHMiLCIuLi9zcmMvdXRpbHMvYXN5bmNGdW5jdGlvbldyYXBwZXIudHMiLCIuLi9zcmMvdXRpbHMvZ2VuRmlsZVdhdGNoZXIudHMiLCIuLi9zcmMvdXRpbHMvaXNOcG1EZXBlbmRlbmN5LnRzIiwiLi4vc3JjL3V0aWxzL2Rvd25sb2FkUmVwZS50cyIsIi4uL3NyYy9wYXJzZXJzL3Nhc3NQYXJzZXIudHMiLCIuLi9zcmMvcGFyc2Vycy9zdHlsZVBhcnNlci9wb3N0Y3NzV3hpbXBvcnQudHMiLCIuLi9zcmMvcGFyc2Vycy9zdHlsZVBhcnNlci9pbmRleC50cyIsIi4uL3NyYy9wYXJzZXJzL2JhYmVsUGFyc2VyLnRzIiwiLi4vc3JjL3BsdWdpbnMvc2F2ZUZpbGVQbHVnaW4vaW5kZXgudHMiLCIuLi9zcmMvcGFyc2Vycy90eXBlc2NyaXB0UGFyc2VyLnRzIiwiLi4vc3JjL3BsdWdpbnMvZXh0cmFjdERlcGVuZGVuY3lQbHVnaW4vaW5kZXgudHMiLCIuLi9zcmMvY29uZmlnL2Fua2FEZWZhdWx0Q29uZmlnLnRzIiwiLi4vc3JjL2NvbmZpZy9hbmthQ29uZmlnLnRzIiwiLi4vc3JjL2NvbmZpZy9zeXN0ZW1Db25maWcudHMiLCIuLi9zcmMvY29uZmlnL3Byb2plY3RDb25maWcudHMiLCIuLi9zcmMvY29uZmlnL2luZGV4LnRzIiwiLi4vc3JjL2NvcmUvY2xhc3MvSW5qZWN0aW9uLnRzIiwiLi4vc3JjL2NvcmUvY2xhc3MvQ29tcGlsYXRpb24udHMiLCIuLi9zcmMvY29yZS9jbGFzcy9Db21waWxlci50cyIsIi4uL3NyYy9jb3JlL2NsYXNzL0NvbW1hbmQudHMiLCIuLi9zcmMvY29tbWFuZHMvZGV2LnRzIiwiLi4vc3JjL2NvbW1hbmRzL2luaXQudHMiLCIuLi9zcmMvY29tbWFuZHMvcHJvZC50cyIsIi4uL3NyYy9jb21tYW5kcy9jcmVhdGVQYWdlLnRzIiwiLi4vc3JjL2NvbW1hbmRzL2NyZWF0ZUNvbXBvbmVudC50cyIsIi4uL3NyYy9jb21tYW5kcy9lbnJvbGxDb21wb25lbnQudHMiLCIuLi9zcmMvY29tbWFuZHMudHMiLCIuLi9zcmMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5cbmNvbnN0IGN3ZCA9IHByb2Nlc3MuY3dkKClcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKG5hbWVzOiBBcnJheTxzdHJpbmc+ID0gW10sIHJvb3Q/OiBzdHJpbmcpOiBPYmplY3Qge1xuICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IHt9XG4gICAgY29uc3QgY29uZmlnUGF0aHMgPSBuYW1lcy5tYXAobmFtZSA9PiBwYXRoLmpvaW4ocm9vdCB8fCBjd2QsIG5hbWUpKVxuXG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGNvbmZpZ1BhdGhzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICBjb25zdCBjb25maWdQYXRoID0gY29uZmlnUGF0aHNbaW5kZXhdXG5cbiAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoY29uZmlnUGF0aCkpIHtcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oZGVmYXVsdFZhbHVlLCByZXF1aXJlKGNvbmZpZ1BhdGgpKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkZWZhdWx0VmFsdWVcbn1cbiIsImltcG9ydCAqIGFzIEdsb2IgZnJvbSAnZ2xvYidcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJ1xuY29uc3QgZ2xvYiA9IHJlcXVpcmUoJ2dsb2InKVxuXG5pbXBvcnQge1xuICAgIENvbnRlbnRcbn0gZnJvbSAnLi4vLi4vdHlwZXMvdHlwZXMnXG5cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRGaWxlIChzb3VyY2VGaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxCdWZmZXI+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBmcy5yZWFkRmlsZShzb3VyY2VGaWxlUGF0aCwgKGVyciwgYnVmZmVyKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShidWZmZXIpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlRmlsZSAodGFyZ2V0RmlsZVBhdGg6IHN0cmluZywgY29udGVudDogQ29udGVudCk6IFByb21pc2U8dW5kZWZpbmVkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgZnMud3JpdGVGaWxlKHRhcmdldEZpbGVQYXRoLCBjb250ZW50LCBlcnIgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikgdGhyb3cgZXJyXG4gICAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgfSlcbiAgICB9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VhcmNoRmlsZXMgKHNjaGVtZTogc3RyaW5nLCBvcHRpb25zPzogR2xvYi5JT3B0aW9ucyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBnbG9iKHNjaGVtZSwgb3B0aW9ucywgKGVycjogKEVycm9yIHwgbnVsbCksIGZpbGVzOiBBcnJheTxzdHJpbmc+KTogdm9pZCA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShmaWxlcylcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9KVxufVxuIiwiaW1wb3J0IGNoYWxrIGZyb20gJ2NoYWxrJ1xuY29uc3Qgb3JhID0gcmVxdWlyZSgnb3JhJylcblxuZXhwb3J0IGZ1bmN0aW9uIHRvRml4IChudW1iZXI6IG51bWJlcik6IHN0cmluZyB7XG4gICAgcmV0dXJuICgnMDAnICsgbnVtYmVyKS5zbGljZSgtMilcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRUaW1lICgpOiBzdHJpbmcge1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKClcbiAgICByZXR1cm4gYCR7dG9GaXgobm93LmdldEhvdXJzKCkpfToke3RvRml4KG5vdy5nZXRNaW51dGVzKCkpfToke3RvRml4KG5vdy5nZXRTZWNvbmRzKCkpfWBcbn1cblxuZXhwb3J0IGNsYXNzIExvZ2dlciB7XG4gICAgb3JhSW5zdGFuY2U6IGFueVxuXG4gICAgZ2V0IHRpbWUgKCkge1xuICAgICAgICByZXR1cm4gY2hhbGsuZ3JleShgWyR7Z2V0Q3VycmVudFRpbWUoKX1dYClcbiAgICB9XG5cbiAgICBzdGFydExvYWRpbmcgKG1zZzogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMub3JhSW5zdGFuY2UgPSBvcmEobXNnKS5zdGFydCgpXG4gICAgfVxuXG4gICAgc3RvcExvYWRpbmcgKCkge1xuICAgICAgICB0aGlzLm9yYUluc3RhbmNlICYmIHRoaXMub3JhSW5zdGFuY2Uuc3RvcCgpXG4gICAgfVxuXG4gICAgbG9nICguLi5tc2c6IEFycmF5PHN0cmluZz4pIHtcbiAgICAgICAgcmV0dXJuIGNvbnNvbGUubG9nKHRoaXMudGltZSwgLi4ubXNnKVxuICAgIH1cblxuICAgIGVycm9yICh0aXRsZTogc3RyaW5nID0gJycsIG1zZzogc3RyaW5nID0gJycsIGVycj86IGFueSkge1xuICAgICAgICB0aGlzLmxvZyhjaGFsay5yZWQoJ+KcmCcpLCBjaGFsay5yZXNldCh0aXRsZSksIGNoYWxrLmdyZXkobXNnKSlcbiAgICAgICAgZXJyICYmIGNvbnNvbGUubG9nKGVycilcbiAgICB9XG5cbiAgICBpbmZvICh0aXRsZTogc3RyaW5nID0gJycsIG1zZzogc3RyaW5nID0gJycpIHtcbiAgICAgICAgdGhpcy5sb2coY2hhbGsuY3lhbign4peLJyksIGNoYWxrLnJlc2V0KHRpdGxlKSwgY2hhbGsuZ3JleShtc2cpKVxuICAgIH1cblxuICAgIHdhcm4gKHRpdGxlOiBzdHJpbmcgPSAnJywgbXNnOiBzdHJpbmcgPSAnJykge1xuICAgICAgICB0aGlzLmxvZyhjaGFsay55ZWxsb3coJ+KaoCcpLCBjaGFsay5yZXNldCh0aXRsZSksIGNoYWxrLmdyZXkobXNnKSlcbiAgICB9XG5cbiAgICBzdWNjZXNzICh0aXRsZTogc3RyaW5nID0gJycsIG1zZzogc3RyaW5nID0gJycpIHtcbiAgICAgICAgdGhpcy5sb2coY2hhbGsuZ3JlZW4oJ+KclCcpLCBjaGFsay5yZXNldCh0aXRsZSksIGNoYWxrLmdyZXkobXNnKSlcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IG5ldyBMb2dnZXIoKVxuIiwiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnXG5pbXBvcnQgY29uZmlnIGZyb20gJy4uLy4uL2NvbmZpZydcbmltcG9ydCAqIGFzIHQgZnJvbSAnQGJhYmVsL3R5cGVzJ1xuXG5pbXBvcnQge1xuICAgIENvbnRlbnQsXG4gICAgRmlsZUNvbnN0cnVjdG9yT3B0aW9uXG59IGZyb20gJy4uLy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5jb25zdCByZXBsYWNlRXh0ID0gcmVxdWlyZSgncmVwbGFjZS1leHQnKVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGaWxlIHtcbiAgICBwdWJsaWMgc291cmNlRmlsZTogc3RyaW5nXG4gICAgcHVibGljIGNvbnRlbnQ6IENvbnRlbnRcbiAgICBwdWJsaWMgdGFyZ2V0RmlsZTogc3RyaW5nXG4gICAgcHVibGljIGFzdD86IHQuRmlsZVxuICAgIHB1YmxpYyBzb3VyY2VNYXA/OiBDb250ZW50XG4gICAgcHVibGljIGlzSW5TcmNEaXI/OiBib29sZWFuXG5cbiAgICBjb25zdHJ1Y3RvciAob3B0aW9uOiBGaWxlQ29uc3RydWN0b3JPcHRpb24pIHtcbiAgICAgICAgY29uc3QgaXNJblNyY0RpclRlc3QgPSBuZXcgUmVnRXhwKGBeJHtjb25maWcuc3JjRGlyfWApXG5cbiAgICAgICAgaWYgKCFvcHRpb24uc291cmNlRmlsZSkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHZhbHVlOiBGaWxlQ29uc3RydWN0b3JPcHRpb24uc291cmNlRmlsZScpXG4gICAgICAgIGlmICghb3B0aW9uLmNvbnRlbnQpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCB2YWx1ZTogRmlsZUNvbnN0cnVjdG9yT3B0aW9uLmNvbnRlbnQnKVxuXG4gICAgICAgIHRoaXMuc291cmNlRmlsZSA9IG9wdGlvbi5zb3VyY2VGaWxlXG4gICAgICAgIHRoaXMudGFyZ2V0RmlsZSA9IG9wdGlvbi50YXJnZXRGaWxlIHx8IG9wdGlvbi5zb3VyY2VGaWxlLnJlcGxhY2UoY29uZmlnLnNyY0RpciwgY29uZmlnLmRpc3REaXIpIC8vIERlZmF1bHQgdmFsdWVcbiAgICAgICAgdGhpcy5jb250ZW50ID0gb3B0aW9uLmNvbnRlbnRcbiAgICAgICAgdGhpcy5zb3VyY2VNYXAgPSBvcHRpb24uc291cmNlTWFwXG4gICAgICAgIHRoaXMuaXNJblNyY0RpciA9IGlzSW5TcmNEaXJUZXN0LnRlc3QodGhpcy5zb3VyY2VGaWxlKVxuICAgIH1cblxuICAgIGdldCBkaXJuYW1lICgpIHtcbiAgICAgICAgcmV0dXJuIHBhdGguZGlybmFtZSh0aGlzLnRhcmdldEZpbGUpXG4gICAgfVxuXG4gICAgZ2V0IGJhc2VuYW1lICgpIHtcbiAgICAgICAgcmV0dXJuIHBhdGguYmFzZW5hbWUodGhpcy50YXJnZXRGaWxlKVxuICAgIH1cblxuICAgIGdldCBleHRuYW1lICgpIHtcbiAgICAgICAgcmV0dXJuIHBhdGguZXh0bmFtZSh0aGlzLnRhcmdldEZpbGUpXG4gICAgfVxuXG4gICAgYXN5bmMgc2F2ZVRvIChwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgYXdhaXQgZnMuZW5zdXJlRmlsZShwYXRoKVxuXG4gICAgICAgIGlmICghcGF0aCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHBhdGgnKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlRXh0IChleHQ6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICB0aGlzLnRhcmdldEZpbGUgPSByZXBsYWNlRXh0KHRoaXMudGFyZ2V0RmlsZSwgZXh0KVxuICAgIH1cbn1cbiIsImltcG9ydCB7XG4gICAgcmVhZEZpbGVcbn0gZnJvbSAnLi9mcydcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJ1xuaW1wb3J0IEZpbGUgZnJvbSAnLi4vY29yZS9jbGFzcy9GaWxlJ1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRmlsZSAoc291cmNlRmlsZTogc3RyaW5nKTogUHJvbWlzZTxGaWxlPiB7XG4gICAgcmV0dXJuIHJlYWRGaWxlKHNvdXJjZUZpbGUpLnRoZW4oY29udGVudCA9PiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IEZpbGUoe1xuICAgICAgICAgICAgc291cmNlRmlsZSxcbiAgICAgICAgICAgIGNvbnRlbnRcbiAgICAgICAgfSkpXG4gICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUZpbGVTeW5jIChzb3VyY2VGaWxlOiBzdHJpbmcpIHtcbiAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHNvdXJjZUZpbGUpXG4gICAgcmV0dXJuIG5ldyBGaWxlKHtcbiAgICAgICAgc291cmNlRmlsZSxcbiAgICAgICAgY29udGVudFxuICAgIH0pXG59XG4iLCJpbXBvcnQgeyBPcHRpb25zIGFzIFRlbXBsYXRlT3B0aW9ucyB9IGZyb20gJ2VqcydcbmltcG9ydCB7IG1lbUZzRWRpdG9yIGFzIE1lbUZzRWRpdG9yIH0gZnJvbSAnbWVtLWZzLWVkaXRvcidcblxuY29uc3QgbWVtRnMgPSByZXF1aXJlKCdtZW0tZnMnKVxuY29uc3QgbWVtRnNFZGl0b3IgPSByZXF1aXJlKCdtZW0tZnMtZWRpdG9yJylcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRnNFZGl0b3Ige1xuICAgIGVkaXRvcjogTWVtRnNFZGl0b3IuRWRpdG9yXG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBjb25zdCBzdG9yZSA9IG1lbUZzLmNyZWF0ZSgpXG5cbiAgICAgICAgdGhpcy5lZGl0b3IgPSBtZW1Gc0VkaXRvci5jcmVhdGUoc3RvcmUpXG4gICAgfVxuXG4gICAgY29weSAoZnJvbTogc3RyaW5nLCB0bzogc3RyaW5nLCBjb250ZXh0OiBvYmplY3QsIHRlbXBsYXRlT3B0aW9ucz86IFRlbXBsYXRlT3B0aW9ucywgY29weU9wdGlvbnM/OiBNZW1Gc0VkaXRvci5Db3B5T3B0aW9ucyk6IHZvaWQge1xuICAgICAgICB0aGlzLmVkaXRvci5jb3B5VHBsKGZyb20sIHRvLCBjb250ZXh0LCB0ZW1wbGF0ZU9wdGlvbnMsIGNvcHlPcHRpb25zKVxuICAgIH1cblxuICAgIHdyaXRlIChmaWxlcGF0aDogc3RyaW5nLCBjb250ZW50czogTWVtRnNFZGl0b3IuQ29udGVudHMpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5lZGl0b3Iud3JpdGUoZmlsZXBhdGgsIGNvbnRlbnRzKVxuICAgIH1cblxuICAgIHdyaXRlSlNPTiAoZmlsZXBhdGg6IHN0cmluZywgY29udGVudHM6IGFueSwgcmVwbGFjZXI/OiBNZW1Gc0VkaXRvci5SZXBsYWNlckZ1bmMsIHNwYWNlPzogTWVtRnNFZGl0b3IuU3BhY2UpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5lZGl0b3Iud3JpdGVKU09OKGZpbGVwYXRoLCBjb250ZW50cywgcmVwbGFjZXIgfHwgbnVsbCwgc3BhY2UgPSA0KVxuICAgIH1cblxuICAgIHJlYWQgKGZpbGVwYXRoOiBzdHJpbmcsIG9wdGlvbnM/OiB7IHJhdzogYm9vbGVhbiwgZGVmYXVsdHM6IHN0cmluZyB9KTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWRpdG9yLnJlYWQoZmlsZXBhdGgsIG9wdGlvbnMpXG4gICAgfVxuXG4gICAgcmVhZEpTT04gKGZpbGVwYXRoOiBzdHJpbmcsIGRlZmF1bHRzPzogYW55KTogdm9pZCB7XG4gICAgICAgIHRoaXMuZWRpdG9yLnJlYWRKU09OKGZpbGVwYXRoLCBkZWZhdWx0cylcbiAgICB9XG5cbiAgICBzYXZlICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICB0aGlzLmVkaXRvci5jb21taXQocmVzb2x2ZSlcbiAgICAgICAgfSlcbiAgICB9XG59XG4iLCJpbXBvcnQgbG9nIGZyb20gJy4vbG9nZ2VyJ1xuaW1wb3J0IGFua2FDb25maWcgZnJvbSAnLi4vY29uZmlnL2Fua2FDb25maWcnXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChpZDogc3RyaW5nLCBvcHRpb25zPzogeyBwYXRocz86IHN0cmluZ1tdIH0pIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gcmVxdWlyZS5yZXNvbHZlKGlkLCBvcHRpb25zKVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBsb2cuZXJyb3IoJ01pc3NpbmcgZGVwZW5kZW5jeScsIGlkLCAhYW5rYUNvbmZpZy5xdWlldCA/IGBpbiAke29wdGlvbnMucGF0aHN9YCA6IG51bGwpXG4gICAgfVxufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY2FsbFByb21pc2VJbkNoYWluIChsaXN0OiBBcnJheTwoLi4ucGFyYW1zOiBhbnlbXSkgPT4gUHJvbWlzZTxhbnk+PiA9IFtdLCAuLi5wYXJhbXM6IEFycmF5PGFueT4pIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBpZiAoIWxpc3QubGVuZ3RoKSAge1xuICAgICAgICAgICAgcmVzb2x2ZSgpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBsZXQgc3RlcCA9IGxpc3RbMF0oLi4ucGFyYW1zKVxuXG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgc3RlcCA9IHN0ZXAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxpc3RbaV0oLi4ucGFyYW1zKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIHN0ZXAudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgcmVzb2x2ZSgpXG4gICAgICAgIH0sIGVyciA9PiB7XG4gICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICB9KVxuICAgIH0pXG59XG4iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAoZm46IEZ1bmN0aW9uKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICguLi5wYXJhbXM6IEFycmF5PGFueT4pIHtcbiAgICAgICAgY29uc3QgbGltaXRhdGlvbiA9IHBhcmFtcy5sZW5ndGhcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICBpZiAoZm4ubGVuZ3RoID4gbGltaXRhdGlvbikge1xuICAgICAgICAgICAgICAgIGZuKC4uLnBhcmFtcywgcmVzb2x2ZSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShmbiguLi5wYXJhbXMpKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cbn1cbiIsImltcG9ydCAqIGFzIGNob2tpZGFyIGZyb20gJ2Nob2tpZGFyJ1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAoZGlyOiBzdHJpbmcgfCBzdHJpbmdbXSwgb3B0aW9ucz86IGNob2tpZGFyLldhdGNoT3B0aW9ucykge1xuICAgIHJldHVybiBjaG9raWRhci53YXRjaChkaXIsIHtcbiAgICAgICAgcGVyc2lzdGVudDogdHJ1ZSxcbiAgICAgICAgaWdub3JlSW5pdGlhbDogdHJ1ZSxcbiAgICAgICAgLi4ub3B0aW9uc1xuICAgIH0pXG59XG4iLCJkZWNsYXJlIHR5cGUgVmFsaWRhdGVOcG1QYWNrYWdlTmFtZSA9IHtcbiAgICB2YWxpZEZvck5ld1BhY2thZ2VzOiBib29sZWFuLFxuICAgIHZhbGlkRm9yT2xkUGFja2FnZXM6IGJvb2xlYW5cbn1cblxuY29uc3QgdmFsaWRhdGUgPSByZXF1aXJlKCd2YWxpZGF0ZS1ucG0tcGFja2FnZS1uYW1lJylcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKHJlcXVpcmVkOiBzdHJpbmcgPSAnJykge1xuICAgIGNvbnN0IHJlc3VsdCA9IDxWYWxpZGF0ZU5wbVBhY2thZ2VOYW1lPnZhbGlkYXRlKHJlcXVpcmVkKVxuXG4gICAgcmV0dXJuIHJlc3VsdC52YWxpZEZvck5ld1BhY2thZ2VzIHx8IHJlc3VsdC52YWxpZEZvck9sZFBhY2thZ2VzXG59XG4iLCJpbXBvcnQgZG93bmxvYWRSZXBvIGZyb20gJ2Rvd25sb2FkLWdpdC1yZXBvJ1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAocmVwbzogc3RyaW5nLCBwYXRoOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBkb3dubG9hZFJlcG8ocmVwbywgcGF0aCwgeyBjbG9uZTogZmFsc2UgfSwgKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgIGVyciA/IHJlamVjdChlcnIpIDogcmVzb2x2ZSgpXG4gICAgICAgIH0pXG4gICAgfSlcbn1cbiIsImltcG9ydCBjb25maWcgZnJvbSAnLi4vY29uZmlnJ1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vdXRpbHMnXG5pbXBvcnQgKiBhcyBzYXNzIGZyb20gJ25vZGUtc2FzcydcblxuaW1wb3J0IHtcbiAgICBGaWxlLFxuICAgIFBhcnNlcixcbiAgICBDb21waWxhdGlvbixcbiAgICBQYXJzZXJJbmplY3Rpb25cbn0gZnJvbSAnLi4vLi4vdHlwZXMvdHlwZXMnXG5cbi8qKlxuICogU2FzcyBmaWxlIHBhcnNlci5cbiAqIEBmb3IgYW55IGZpbGUgdGhhdCBkb2VzIG5vdCBtYXRjaGUgcGFyc2Vycy5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgPFBhcnNlcj5mdW5jdGlvbiAodGhpczogUGFyc2VySW5qZWN0aW9uLCBmaWxlOiBGaWxlLCBjb21waWxhdGlvbjogQ29tcGlsYXRpb24sIGNhbGxiYWNrPzogRnVuY3Rpb24pIHtcbiAgICBmaWxlLmNvbnRlbnQgPSBmaWxlLmNvbnRlbnQgaW5zdGFuY2VvZiBCdWZmZXIgPyBmaWxlLmNvbnRlbnQudG9TdHJpbmcoKSA6IGZpbGUuY29udGVudFxuXG4gICAgc2Fzcy5yZW5kZXIoe1xuICAgICAgICBmaWxlOiBmaWxlLnNvdXJjZUZpbGUsXG4gICAgICAgIGRhdGE6IGZpbGUuY29udGVudCxcbiAgICAgICAgb3V0cHV0U3R5bGU6ICFjb25maWcuYW5rYUNvbmZpZy5kZXZNb2RlID8gJ25lc3RlZCcgOiAnY29tcHJlc3NlZCdcbiAgICB9LCAoZXJyOiBFcnJvciwgcmVzdWx0OiBhbnkpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgdXRpbHMubG9nZ2VyLmVycm9yKCdDb21waWxlJywgZXJyLm1lc3NhZ2UsIGVycilcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZpbGUuY29udGVudCA9IHJlc3VsdC5jc3NcbiAgICAgICAgICAgIGZpbGUudXBkYXRlRXh0KCcud3hzcycpXG4gICAgICAgIH1cbiAgICAgICAgY2FsbGJhY2soKVxuICAgIH0pXG59XG4iLCJjb25zdCBwb3N0Y3NzID0gcmVxdWlyZSgncG9zdGNzcycpXG5cbmV4cG9ydCBkZWZhdWx0IHBvc3Rjc3MucGx1Z2luKCdwb3N0Y3NzLXd4aW1wb3J0JywgKCkgPT4ge1xuICAgIHJldHVybiAocm9vdDogYW55KSA9PiB7XG4gICAgICAgIHJvb3Qud2Fsa0F0UnVsZXMoJ3d4aW1wb3J0JywgKHJ1bGU6IGFueSkgPT4ge1xuICAgICAgICAgICAgcnVsZS5uYW1lID0gJ2ltcG9ydCdcbiAgICAgICAgICAgIHJ1bGUucGFyYW1zID0gcnVsZS5wYXJhbXMucmVwbGFjZSgvXFwuXFx3Kyg/PVsnXCJdJCkvLCAnLnd4c3MnKVxuICAgICAgICB9KVxuICAgIH1cbn0pXG4iLCJpbXBvcnQgKiBhcyBQb3N0Y3NzIGZyb20gJ3Bvc3Rjc3MnXG5pbXBvcnQgcG9zdGNzc3JjIGZyb20gJ3Bvc3Rjc3MtbG9hZC1jb25maWcnXG5pbXBvcnQgcG9zdGNzc1d4SW1wb3J0IGZyb20gJy4vcG9zdGNzc1d4aW1wb3J0J1xuXG5pbXBvcnQge1xuICAgIEZpbGUsXG4gICAgUGFyc2VyLFxuICAgIENvbXBpbGF0aW9uLFxuICAgIFBhcnNlckluamVjdGlvblxufSBmcm9tICcuLi8uLi8uLi90eXBlcy90eXBlcydcblxuY29uc3QgcG9zdGNzcyA9IHJlcXVpcmUoJ3Bvc3Rjc3MnKVxuY29uc3QgcG9zdGNzc0NvbmZpZzogYW55ID0ge31cblxuLyoqXG4gKiBTdHlsZSBmaWxlIHBhcnNlci5cbiAqIEBmb3IgLnd4c3MgLmNzcyA9PiAud3hzc1xuICovXG5leHBvcnQgZGVmYXVsdCA8UGFyc2VyPmZ1bmN0aW9uICh0aGlzOiBQYXJzZXJJbmplY3Rpb24sIGZpbGU6IEZpbGUsIGNvbXBpbGF0aW9uOiBDb21waWxhdGlvbiwgY2I6IEZ1bmN0aW9uKTogdm9pZCB7XG4gICAgZ2VuUG9zdGNzc0NvbmZpZygpLnRoZW4oKGNvbmZpZzogYW55KSA9PiB7XG4gICAgICAgIGZpbGUuY29udGVudCA9IGZpbGUuY29udGVudCBpbnN0YW5jZW9mIEJ1ZmZlciA/IGZpbGUuY29udGVudC50b1N0cmluZygpIDogZmlsZS5jb250ZW50XG5cbiAgICAgICAgcmV0dXJuIHBvc3Rjc3MoY29uZmlnLnBsdWdpbnMuY29uY2F0KFtwb3N0Y3NzV3hJbXBvcnRdKSkucHJvY2VzcyhmaWxlLmNvbnRlbnQsIHtcbiAgICAgICAgICAgIC4uLmNvbmZpZy5vcHRpb25zLFxuICAgICAgICAgICAgZnJvbTogZmlsZS5zb3VyY2VGaWxlXG4gICAgICAgIH0gYXMgUG9zdGNzcy5Qcm9jZXNzT3B0aW9ucylcbiAgICB9KS50aGVuKChyb290OiBQb3N0Y3NzLkxhenlSZXN1bHQpID0+IHtcbiAgICAgICAgZmlsZS5jb250ZW50ID0gcm9vdC5jc3NcbiAgICAgICAgZmlsZS51cGRhdGVFeHQoJy53eHNzJylcbiAgICAgICAgY2IoKVxuICAgIH0pXG59XG5cblxuZnVuY3Rpb24gZ2VuUG9zdGNzc0NvbmZpZyAoKSB7XG4gICAgcmV0dXJuIHBvc3Rjc3NDb25maWcucGx1Z2lucyA/IFByb21pc2UucmVzb2x2ZShwb3N0Y3NzQ29uZmlnKSA6IHBvc3Rjc3NyYyh7fSkudGhlbigoY29uZmlnOiBhbnkpID0+IHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShPYmplY3QuYXNzaWduKHBvc3Rjc3NDb25maWcsIGNvbmZpZykpXG4gICAgfSlcbn1cbiIsImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBjb25maWcgZnJvbSAnLi4vY29uZmlnJ1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vdXRpbHMnXG5pbXBvcnQgKiBhcyBiYWJlbCBmcm9tICdAYmFiZWwvY29yZSdcbmltcG9ydCBGaWxlIGZyb20gJy4uL2NvcmUvY2xhc3MvRmlsZSdcblxuaW1wb3J0IHtcbiAgICBQYXJzZXIsXG4gICAgQ29tcGlsYXRpb24sXG4gICAgUGFyc2VySW5qZWN0aW9uXG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5sZXQgYmFiZWxDb25maWcgPSA8YmFiZWwuVHJhbnNmb3JtT3B0aW9ucz5udWxsXG5cbi8qKlxuICogU2NyaXB0IEZpbGUgcGFyc2VyLlxuICogQGZvciAuanMgLmVzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IDxQYXJzZXI+ZnVuY3Rpb24gKHRoaXM6IFBhcnNlckluamVjdGlvbiwgZmlsZTogRmlsZSwgY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYjogRnVuY3Rpb24pIHtcbiAgICBpZiAoZmlsZS5pc0luU3JjRGlyKSB7XG4gICAgICAgIGlmICghYmFiZWxDb25maWcpIHtcbiAgICAgICAgICAgIGJhYmVsQ29uZmlnID0gPGJhYmVsLlRyYW5zZm9ybU9wdGlvbnM+dXRpbHMucmVzb2x2ZUNvbmZpZyhbJ2JhYmVsLmNvbmZpZy5qcyddLCBjb25maWcuY3dkKVxuICAgICAgICB9XG5cbiAgICAgICAgZmlsZS5jb250ZW50ID0gZmlsZS5jb250ZW50IGluc3RhbmNlb2YgQnVmZmVyID8gZmlsZS5jb250ZW50LnRvU3RyaW5nKCkgOiBmaWxlLmNvbnRlbnRcblxuICAgICAgICBjb25zdCByZXN1bHQgPSBiYWJlbC50cmFuc2Zvcm1TeW5jKGZpbGUuY29udGVudCwge1xuICAgICAgICAgICAgYmFiZWxyYzogZmFsc2UsXG4gICAgICAgICAgICBmaWxlbmFtZTogZmlsZS5zb3VyY2VGaWxlLFxuICAgICAgICAgICAgc291cmNlVHlwZTogJ21vZHVsZScsXG4gICAgICAgICAgICBzb3VyY2VNYXBzOiBjb25maWcuYW5rYUNvbmZpZy5kZXZNb2RlLFxuICAgICAgICAgICAgLi4uYmFiZWxDb25maWdcbiAgICAgICAgfSlcblxuICAgICAgICBmaWxlLnNvdXJjZU1hcCA9IEpTT04uc3RyaW5naWZ5KHJlc3VsdC5tYXApXG4gICAgICAgIGZpbGUuY29udGVudCA9IHJlc3VsdC5jb2RlXG4gICAgfVxuXG4gICAgZmlsZS51cGRhdGVFeHQoJy5qcycpXG4gICAgY2IoKVxufVxuIiwiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnXG5pbXBvcnQgY29uZmlnIGZyb20gJy4uLy4uL2NvbmZpZydcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uLy4uL3V0aWxzJ1xuaW1wb3J0IGxvZ2dlciBmcm9tICcuLi8uLi91dGlscy9sb2dnZXInXG5cbmltcG9ydCB7XG4gICAgUGx1Z2luLFxuICAgIENvbXBpbGF0aW9uLFxuICAgIFBsdWdpbkhhbmRsZXIsXG4gICAgUGx1Z2luSW5qZWN0aW9uXG59IGZyb20gJy4uLy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5jb25zdCBpbmxpbmVTb3VyY2VNYXBDb21tZW50ID0gcmVxdWlyZSgnaW5saW5lLXNvdXJjZS1tYXAtY29tbWVudCcpXG5jb25zdCB7IHdyaXRlRmlsZSB9ID0gdXRpbHNcblxuZXhwb3J0IGRlZmF1bHQgPFBsdWdpbj5mdW5jdGlvbiAodGhpczogUGx1Z2luSW5qZWN0aW9uKSB7XG4gICAgdGhpcy5vbignYWZ0ZXItY29tcGlsZScsIDxQbHVnaW5IYW5kbGVyPmZ1bmN0aW9uIChjb21waWxhdGlvbjogQ29tcGlsYXRpb24sIGNiOiBGdW5jdGlvbikge1xuICAgICAgICBjb25zdCBmaWxlID0gY29tcGlsYXRpb24uZmlsZVxuXG4gICAgICAgIC8vIFRPRE86IFVzZSBtZW0tZnNcbiAgICAgICAgZnMuZW5zdXJlRmlsZShmaWxlLnRhcmdldEZpbGUpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5hbmthQ29uZmlnLmRldk1vZGUgJiYgZmlsZS5zb3VyY2VNYXApIHtcbiAgICAgICAgICAgICAgICBpZiAoZmlsZS5jb250ZW50IGluc3RhbmNlb2YgQnVmZmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGUuY29udGVudCA9IGZpbGUuY29udGVudC50b1N0cmluZygpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZpbGUuY29udGVudCA9IGZpbGUuY29udGVudCArICdcXHJcXG5cXHJcXG4nICsgaW5saW5lU291cmNlTWFwQ29tbWVudChmaWxlLnNvdXJjZU1hcCwge1xuICAgICAgICAgICAgICAgICAgICBibG9jazogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgc291cmNlc0NvbnRlbnQ6IHRydWVcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHdyaXRlRmlsZShmaWxlLnRhcmdldEZpbGUsIGZpbGUuY29udGVudClcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBjb21waWxhdGlvbi5kZXN0cm95KClcbiAgICAgICAgICAgIGNiKClcbiAgICAgICAgfSwgZXJyID0+IHtcbiAgICAgICAgICAgIGxvZ2dlci5lcnJvcignRXJyb3InLCBlcnIubWVzc2FnZSwgZXJyKVxuICAgICAgICAgICAgY29tcGlsYXRpb24uZGVzdHJveSgpXG4gICAgICAgICAgICBjYigpXG4gICAgICAgIH0pXG4gICAgfSlcbn1cbiIsImltcG9ydCBjb25maWcgZnJvbSAnLi4vY29uZmlnJ1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCdcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uL3V0aWxzJ1xuXG5pbXBvcnQge1xuICAgIEZpbGUsXG4gICAgUGFyc2VyLFxuICAgIENvbXBpbGF0aW9uLFxuICAgIFBhcnNlckluamVjdGlvblxufSBmcm9tICcuLi8uLi90eXBlcy90eXBlcydcblxuY29uc3QgeyBsb2dnZXIgfSA9IHV0aWxzXG5cbmxldCB0c0NvbmZpZyA9IDx0cy5UcmFuc3BpbGVPcHRpb25zPm51bGxcbi8qKlxuICogVHlwZXNjcmlwdCBmaWxlIHBhcnNlci5cbiAqXG4gKiBAZm9yIGFueSBmaWxlIHRoYXQgZG9lcyBub3QgbWF0Y2hlIHBhcnNlcnMuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IDxQYXJzZXI+ZnVuY3Rpb24gKHRoaXM6IFBhcnNlckluamVjdGlvbiwgZmlsZTogRmlsZSwgY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYWxsYmFjaz86IEZ1bmN0aW9uKSB7XG4gICAgZmlsZS5jb250ZW50ID0gZmlsZS5jb250ZW50IGluc3RhbmNlb2YgQnVmZmVyID8gZmlsZS5jb250ZW50LnRvU3RyaW5nKCkgOiBmaWxlLmNvbnRlbnRcbiAgICBjb25zdCBzb3VyY2VNYXAgPSAge1xuICAgICAgICBzb3VyY2VzQ29udGVudDogW2ZpbGUuY29udGVudF1cbiAgICB9XG5cbiAgICBpZiAoIXRzQ29uZmlnKSB7XG4gICAgICAgIHRzQ29uZmlnID0gPHRzLlRyYW5zcGlsZU9wdGlvbnM+dXRpbHMucmVzb2x2ZUNvbmZpZyhbJ3RzY29uZmlnLmpzb24nLCAndHNjb25maWcuanMnXSwgY29uZmlnLmN3ZClcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQgPSB0cy50cmFuc3BpbGVNb2R1bGUoZmlsZS5jb250ZW50LCB7XG4gICAgICAgIGNvbXBpbGVyT3B0aW9uczogdHNDb25maWcuY29tcGlsZXJPcHRpb25zLFxuICAgICAgICBmaWxlTmFtZTogZmlsZS5zb3VyY2VGaWxlXG4gICAgfSlcblxuICAgIHRyeSB7XG4gICAgICAgIGZpbGUuY29udGVudCA9IHJlc3VsdC5vdXRwdXRUZXh0XG4gICAgICAgIGlmIChjb25maWcuYW5rYUNvbmZpZy5kZXZNb2RlKSB7XG4gICAgICAgICAgICBmaWxlLnNvdXJjZU1hcCA9IHtcbiAgICAgICAgICAgICAgICAuLi5KU09OLnBhcnNlKHJlc3VsdC5zb3VyY2VNYXBUZXh0KSxcbiAgICAgICAgICAgICAgICAuLi5zb3VyY2VNYXBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmaWxlLnVwZGF0ZUV4dCgnLmpzJylcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgbG9nZ2VyLmVycm9yKCdDb21waWxlIGVycm9yJywgZXJyLm1lc3NhZ2UsIGVycilcbiAgICB9XG5cbiAgICBjYWxsYmFjaygpXG59XG4iLCJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgKiBhcyB0IGZyb20gJ0BiYWJlbC90eXBlcydcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uLy4uL3V0aWxzJ1xuaW1wb3J0ICogYXMgYmFiZWwgZnJvbSAnQGJhYmVsL2NvcmUnXG5pbXBvcnQgdHJhdmVyc2UgZnJvbSAnQGJhYmVsL3RyYXZlcnNlJ1xuXG5pbXBvcnQge1xuICAgIFBsdWdpbixcbiAgICBDb21waWxhdGlvbixcbiAgICBQbHVnaW5IYW5kbGVyLFxuICAgIFBsdWdpbkluamVjdGlvblxufSBmcm9tICcuLi8uLi8uLi90eXBlcy90eXBlcydcblxuY29uc3QgZGVwZW5kZW5jeVBvb2wgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpXG5jb25zdCByZXNvdmxlTW9kdWxlTmFtZSA9IHJlcXVpcmUoJ3JlcXVpcmUtcGFja2FnZS1uYW1lJylcblxuZXhwb3J0IGRlZmF1bHQgPFBsdWdpbj4gZnVuY3Rpb24gKHRoaXM6IFBsdWdpbkluamVjdGlvbikge1xuICAgIGNvbnN0IGNvbXBpbGVyID0gdGhpcy5nZXRDb21waWxlcigpXG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5nZXRTeXN0ZW1Db25maWcoKVxuICAgIGNvbnN0IHRlc3ROb2RlTW9kdWxlcyA9IG5ldyBSZWdFeHAoYF4ke2NvbmZpZy5zb3VyY2VOb2RlTW9kdWxlc31gKVxuXG4gICAgdGhpcy5vbignYmVmb3JlLWNvbXBpbGUnLCBmdW5jdGlvbiAoY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYjogRnVuY3Rpb24pIHtcbiAgICAgICAgY29uc3QgZmlsZSA9IGNvbXBpbGF0aW9uLmZpbGVcbiAgICAgICAgY29uc3QgbG9jYWxEZXBlbmRlbmN5UG9vbCA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KClcblxuICAgICAgICAvLyBPbmx5IHJlc29sdmUganMgZmlsZS5cbiAgICAgICAgaWYgKGZpbGUuZXh0bmFtZSA9PT0gJy5qcycpIHtcblxuICAgICAgICAgICAgaWYgKGZpbGUuYXN0ID09PSB2b2lkICgwKSkge1xuICAgICAgICAgICAgICAgIGZpbGUuYXN0ID0gPHQuRmlsZT5iYWJlbC5wYXJzZShcbiAgICAgICAgICAgICAgICAgICAgZmlsZS5jb250ZW50IGluc3RhbmNlb2YgQnVmZmVyID8gZmlsZS5jb250ZW50LnRvU3RyaW5nKCkgOiBmaWxlLmNvbnRlbnQsXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhYmVscmM6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlVHlwZTogJ21vZHVsZSdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdHJhdmVyc2UoZmlsZS5hc3QsIHtcbiAgICAgICAgICAgICAgICBlbnRlciAocGF0aCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocGF0aC5pc0ltcG9ydERlY2xhcmF0aW9uKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBwYXRoLm5vZGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNvdXJjZSA9IG5vZGUuc291cmNlXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2UgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2UudmFsdWUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlb2Ygc291cmNlLnZhbHVlID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShzb3VyY2UsIGZpbGUuc291cmNlRmlsZSwgZmlsZS50YXJnZXRGaWxlLCBsb2NhbERlcGVuZGVuY3lQb29sKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhdGguaXNDYWxsRXhwcmVzc2lvbigpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBub2RlID0gcGF0aC5ub2RlXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjYWxsZWUgPSA8dC5JZGVudGlmaWVyPm5vZGUuY2FsbGVlXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhcmdzID0gPHQuU3RyaW5nTGl0ZXJhbFtdPm5vZGUuYXJndW1lbnRzXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGVlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJnc1swXSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3NbMF0udmFsdWUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsZWUubmFtZSA9PT0gJ3JlcXVpcmUnICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIGFyZ3NbMF0udmFsdWUgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGFyZ3NbMF0sIGZpbGUuc291cmNlRmlsZSwgZmlsZS50YXJnZXRGaWxlLCBsb2NhbERlcGVuZGVuY3lQb29sKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgZmlsZS5jb250ZW50ID0gYmFiZWwudHJhbnNmb3JtRnJvbUFzdFN5bmMoZmlsZS5hc3QpLmNvZGVcblxuICAgICAgICAgICAgY29uc3QgZGVwZW5kZW5jeUxpc3QgPSBBcnJheS5mcm9tKGxvY2FsRGVwZW5kZW5jeVBvb2wua2V5cygpKS5maWx0ZXIoZGVwZW5kZW5jeSA9PiAhZGVwZW5kZW5jeVBvb2wuaGFzKGRlcGVuZGVuY3kpKVxuXG4gICAgICAgICAgICBQcm9taXNlLmFsbChkZXBlbmRlbmN5TGlzdC5tYXAoZGVwZW5kZW5jeSA9PiB0cmF2ZXJzZU5wbURlcGVuZGVuY3koZGVwZW5kZW5jeSkpKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBjYigpXG4gICAgICAgICAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIGNiKClcbiAgICAgICAgICAgICAgICB1dGlscy5sb2dnZXIuZXJyb3IoZmlsZS5zb3VyY2VGaWxlLCBlcnIubWVzc2FnZSwgZXJyKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNiKClcbiAgICAgICAgfVxuICAgIH0gYXMgUGx1Z2luSGFuZGxlcilcblxuICAgIGZ1bmN0aW9uIHJlc29sdmUgKG5vZGU6IGFueSwgc291cmNlRmlsZTogc3RyaW5nLCB0YXJnZXRGaWxlOiBzdHJpbmcsIGxvY2FsRGVwZW5kZW5jeVBvb2w6IE1hcDxzdHJpbmcsIHN0cmluZz4pIHtcbiAgICAgICAgY29uc3Qgc291cmNlQmFzZU5hbWUgPSBwYXRoLmRpcm5hbWUoc291cmNlRmlsZSlcbiAgICAgICAgY29uc3QgdGFyZ2V0QmFzZU5hbWUgPSBwYXRoLmRpcm5hbWUodGFyZ2V0RmlsZSlcbiAgICAgICAgY29uc3QgbW9kdWxlTmFtZSA9IHJlc292bGVNb2R1bGVOYW1lKG5vZGUudmFsdWUpXG5cblxuICAgICAgICBpZiAodXRpbHMuaXNOcG1EZXBlbmRlbmN5KG1vZHVsZU5hbWUpIHx8IHRlc3ROb2RlTW9kdWxlcy50ZXN0KHNvdXJjZUZpbGUpKSB7XG4gICAgICAgICAgICBjb25zdCBkZXBlbmRlbmN5ID0gdXRpbHMucmVzb2x2ZU1vZHVsZShub2RlLnZhbHVlLCB7XG4gICAgICAgICAgICAgICAgcGF0aHM6IFtzb3VyY2VCYXNlTmFtZV1cbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIGlmICghZGVwZW5kZW5jeSkgcmV0dXJuXG5cbiAgICAgICAgICAgIGNvbnN0IGRpc3RQYXRoID0gZGVwZW5kZW5jeS5yZXBsYWNlKGNvbmZpZy5zb3VyY2VOb2RlTW9kdWxlcywgY29uZmlnLmRpc3ROb2RlTW9kdWxlcylcblxuICAgICAgICAgICAgbm9kZS52YWx1ZSA9IHBhdGgucmVsYXRpdmUodGFyZ2V0QmFzZU5hbWUsIGRpc3RQYXRoKVxuXG4gICAgICAgICAgICBpZiAobG9jYWxEZXBlbmRlbmN5UG9vbC5oYXMoZGVwZW5kZW5jeSkpIHJldHVyblxuICAgICAgICAgICAgbG9jYWxEZXBlbmRlbmN5UG9vbC5zZXQoZGVwZW5kZW5jeSwgZGVwZW5kZW5jeSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGZ1bmN0aW9uIHRyYXZlcnNlTnBtRGVwZW5kZW5jeSAoZGVwZW5kZW5jeTogc3RyaW5nKSB7XG4gICAgICAgIGRlcGVuZGVuY3lQb29sLnNldChkZXBlbmRlbmN5LCBkZXBlbmRlbmN5KVxuICAgICAgICBjb25zdCBmaWxlID0gYXdhaXQgdXRpbHMuY3JlYXRlRmlsZShkZXBlbmRlbmN5KVxuXG4gICAgICAgIGZpbGUudGFyZ2V0RmlsZSA9IGZpbGUuc291cmNlRmlsZS5yZXBsYWNlKGNvbmZpZy5zb3VyY2VOb2RlTW9kdWxlcywgY29uZmlnLmRpc3ROb2RlTW9kdWxlcylcbiAgICAgICAgYXdhaXQgY29tcGlsZXIuZ2VuZXJhdGVDb21waWxhdGlvbihmaWxlKS5ydW4oKVxuICAgIH1cblxufVxuIiwiLy8gaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IHNhc3NQYXJzZXIgZnJvbSAnLi4vcGFyc2Vycy9zYXNzUGFyc2VyJ1xuaW1wb3J0IGZpbGVQYXJzZXIgZnJvbSAnLi4vcGFyc2Vycy9maWxlUGFyc2VyJ1xuaW1wb3J0IHN0eWxlUGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvc3R5bGVQYXJzZXInXG5pbXBvcnQgYmFiZWxQYXJzZXIgZnJvbSAnLi4vcGFyc2Vycy9iYWJlbFBhcnNlcidcbmltcG9ydCBzY3JpcHRQYXJzZXIgZnJvbSAnLi4vcGFyc2Vycy9zY3JpcHRQYXJzZXInXG5pbXBvcnQgdGVtcGxhdGVQYXJzZXIgZnJvbSAnLi4vcGFyc2Vycy90ZW1wbGF0ZVBhcnNlcidcbmltcG9ydCBzYXZlRmlsZVBsdWdpbiBmcm9tICcuLi9wbHVnaW5zL3NhdmVGaWxlUGx1Z2luJ1xuaW1wb3J0IHR5cGVzY3JpcHRQYXJzZXIgZnJvbSAnLi4vcGFyc2Vycy90eXBlc2NyaXB0UGFyc2VyJ1xuaW1wb3J0IGV4dHJhY3REZXBlbmRlbmN5UGx1Z2luIGZyb20gJy4uL3BsdWdpbnMvZXh0cmFjdERlcGVuZGVuY3lQbHVnaW4nXG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogICAgICAgICAgICAgICAgICAgRGFuZ2VyIHpvbmVcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuLyoqXG4gKiBUaGUgcGF0aCB3aGVyZSBXZUNoYXQgbWluaXByb2dyYW0gc291cmNlIGZpbGVzIGV4aXN0LlxuICogQGRlZmF1bHQgJy4vc3JjJ1xuICovXG5leHBvcnQgY29uc3Qgc291cmNlRGlyID0gJy4vc3JjJ1xuXG4vKipcbiAqIFRoZSBwYXRoIHdoZXJlIFdlQ2hhdCBtaW5pcHJvZ3JhbSBjb21waWxlZCBmaWxlcyBleGlzdC5cbiAqIEBkZWZhdWx0ICcuL2Rpc3QnXG4gKi9cbmV4cG9ydCBjb25zdCBvdXRwdXREaXIgPSAnLi9kaXN0J1xuXG4vKipcbiAqIFRoZSBwYXRoIHdoZXJlIFdlQ2hhdCBtaW5pcHJvZ3JhbSBwYWdlcyBleGlzdC5cbiAqIEBkZWZhdWx0ICcuL3NyYy9wYWdlcydcbiAqL1xuZXhwb3J0IGNvbnN0IHBhZ2VzID0gJy4vcGFnZXMnXG5cbi8qKlxuICogVGhlIHBhdGggd2hlcmUgV2VDaGF0IG1pbmlwcm9ncmFtIGNvbXBvbmVudHMgZXhpc3QuXG4gKiBAZGVmYXVsdCAnLi9zcmMvY29tcG9uZW50cydcbiAqL1xuZXhwb3J0IGNvbnN0IGNvbXBvbmVudHMgPSAnLi9jb21wb25lbnRzJ1xuXG4vKipcbiAqIFRlbXBsYXRlIGZvciBjcmVhdGluZyBwYWdlIGFuZCBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCBjb25zdCB0ZW1wbGF0ZSA9IHtcbiAgICBwYWdlOiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vdGVtcGxhdGUvcGFnZScpLFxuICAgIGNvbXBvbmVudDogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL3RlbXBsYXRlL2NvbXBvbmVudCcpXG59XG5cbi8qKlxuICogVGhlIHBhdGggd2hlcmUgV2VDaGF0IG1pbmlwcm9ncmFtIHN1YnBhY2thZ2VzIGV4aXN0LlxuICogQGRlZmF1bHQgJy4vc3JjL3N1YlBhY2thZ2VzJ1xuICovXG5leHBvcnQgY29uc3Qgc3ViUGFja2FnZXMgPSAnLi9zdWJQYWNrYWdlcydcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgICAgICAgICAgICAgICAgQ3VzdG9tIGNvbmZpZ3VyZVxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4vKipcbiAqIFdoZXRoZXIgdG8gb3V0cHV0IGNvbXBpbGUgaW5mb3JtYXRpb24uXG4gKiBAZGVmYXVsdCBmYWxzZVxuICovXG5leHBvcnQgY29uc3QgcXVpZXQgPSBmYWxzZVxuXG4vKipcbiAqIEFua2EgZGV2ZWxvcG1lbnQgbW9kZS5cbiAqIEBkZWZhdWx0IGZhbHNlXG4gKi9cbmV4cG9ydCBjb25zdCBkZXZNb2RlID0gZmFsc2VcblxuLyoqXG4gKiBSZWdpc3RlciBmaWxlIHBhcnNlci5cbiAqL1xuZXhwb3J0IGNvbnN0IHBhcnNlcnM6IFBhcnNlcnNDb25maWdyYXRpb24gPSBbXG4gICAge1xuICAgICAgICBtYXRjaDogLy4qXFwuKGpzfGVzKSQvLFxuICAgICAgICBwYXJzZXJzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGFyc2VyOiBiYWJlbFBhcnNlcixcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB7fVxuICAgICAgICAgICAgfVxuICAgICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG1hdGNoOiAvLipcXC4od3hzc3xjc3N8cG9zdGNzcykkLyxcbiAgICAgICAgcGFyc2VyczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcnNlcjogc3R5bGVQYXJzZXIsXG4gICAgICAgICAgICAgICAgb3B0aW9uczoge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgIH0sXG4gICAge1xuICAgICAgICBtYXRjaDogLy4qXFwuKHNhc3N8c2NzcykkLyxcbiAgICAgICAgcGFyc2VyczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcnNlcjogc2Fzc1BhcnNlcixcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB7fVxuICAgICAgICAgICAgfVxuICAgICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG1hdGNoOiAvLipcXC4odHN8dHlwZXNjcmlwdCkkLyxcbiAgICAgICAgcGFyc2VyczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcnNlcjogdHlwZXNjcmlwdFBhcnNlcixcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB7fVxuICAgICAgICAgICAgfVxuICAgICAgICBdXG4gICAgfVxuXVxuXG4vKipcbiAqIFdoZXRoZXIgdG8gb3V0cHV0IGRlYnVnIGluZm9ybWF0aW9uLlxuICogQGRlZmF1bHQgZmFsc2VcbiAqL1xuZXhwb3J0IGNvbnN0IGRlYnVnOiBib29sZWFuID0gZmFsc2VcblxuLyoqXG4gKiBSZWdpc3RlciBwbHVnaW4uXG4gKi9cbmV4cG9ydCBjb25zdCBwbHVnaW5zOiBQbHVnaW5zQ29uZmlncmF0aW9uID0gW1xuICAgIHtcbiAgICAgICAgcGx1Z2luOiBleHRyYWN0RGVwZW5kZW5jeVBsdWdpbixcbiAgICAgICAgb3B0aW9uczoge31cbiAgICB9LFxuICAgIHtcbiAgICAgICAgcGx1Z2luOiBzYXZlRmlsZVBsdWdpbixcbiAgICAgICAgb3B0aW9uczoge31cbiAgICB9XG5dXG5cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgICAgICAgICAgICAgIGV4cGVyaW1lbnRhbCBjb25maWd1cmVcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuIiwiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IHJlc29sdmVDb25maWcgZnJvbSAnLi4vdXRpbHMvcmVzb2x2ZUNvbmZpZydcbmltcG9ydCAqIGFzIGFua2FEZWZhdWx0Q29uZmlnIGZyb20gJy4vYW5rYURlZmF1bHRDb25maWcnXG5cbmNvbnN0IGN3ZCA9IHByb2Nlc3MuY3dkKClcbmNvbnN0IGN1c3RvbUNvbmZpZyA9IDxBbmthQ29uZmlnPnJlc29sdmVDb25maWcoWydhbmthLmNvbmZpZy5qcycsICdhbmthLmNvbmZpZy5qc29uJ10pXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICAuLi5hbmthRGVmYXVsdENvbmZpZyxcbiAgICAuLi5jdXN0b21Db25maWcsXG4gICAgdGVtcGxhdGU6IGN1c3RvbUNvbmZpZy50ZW1wbGF0ZSA/IHtcbiAgICAgICAgcGFnZTogcGF0aC5qb2luKGN3ZCwgY3VzdG9tQ29uZmlnLnRlbXBsYXRlLnBhZ2UpLFxuICAgICAgICBjb21wb25lbnQ6IHBhdGguam9pbihjd2QsIGN1c3RvbUNvbmZpZy50ZW1wbGF0ZS5jb21wb25lbnQpXG4gICAgfSA6IGFua2FEZWZhdWx0Q29uZmlnLnRlbXBsYXRlLFxuICAgIHBhcnNlcnM6IGN1c3RvbUNvbmZpZy5wYXJzZXJzID8gY3VzdG9tQ29uZmlnLnBhcnNlcnMuY29uY2F0KGFua2FEZWZhdWx0Q29uZmlnLnBhcnNlcnMpIDogYW5rYURlZmF1bHRDb25maWcucGFyc2VycyxcbiAgICBwbHVnaW5zOiBhbmthRGVmYXVsdENvbmZpZy5wbHVnaW5zLmNvbmNhdChjdXN0b21Db25maWcucGx1Z2lucyB8fCBbXSlcbn1cbiIsImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBhbmthQ29uZmlnIGZyb20gJy4vYW5rYUNvbmZpZydcblxuZXhwb3J0IGNvbnN0IGN3ZCA9IHByb2Nlc3MuY3dkKClcbmV4cG9ydCBjb25zdCBzcmNEaXIgPSBwYXRoLnJlc29sdmUoY3dkLCBhbmthQ29uZmlnLnNvdXJjZURpcilcbmV4cG9ydCBjb25zdCBkaXN0RGlyID0gcGF0aC5yZXNvbHZlKGN3ZCwgYW5rYUNvbmZpZy5vdXRwdXREaXIpXG5leHBvcnQgY29uc3QgYW5rYU1vZHVsZXMgPSBwYXRoLnJlc29sdmUoc3JjRGlyLCAnYW5rYV9tb2R1bGVzJylcbmV4cG9ydCBjb25zdCBzb3VyY2VOb2RlTW9kdWxlcyA9IHBhdGgucmVzb2x2ZShjd2QsICcuL25vZGVfbW9kdWxlcycpXG5leHBvcnQgY29uc3QgZGlzdE5vZGVNb2R1bGVzID0gcGF0aC5yZXNvbHZlKGRpc3REaXIsICcuL25wbV9tb2R1bGVzJylcbmV4cG9ydCBjb25zdCBkZWZhdWx0U2NhZmZvbGQgPSAgJ2lFeGNlcHRpb24vYW5rYS1xdWlja3N0YXJ0J1xuIiwiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnXG5pbXBvcnQgYW5rYUNvbmZpZyBmcm9tICcuL2Fua2FDb25maWcnXG5pbXBvcnQgKiBhcyBzeXN0ZW0gZnJvbSAnLi9zeXN0ZW1Db25maWcnXG5pbXBvcnQgcmVzb2x2ZUNvbmZpZyBmcm9tICcuLi91dGlscy9yZXNvbHZlQ29uZmlnJ1xuXG5jb25zdCBjdXN0b21Db25maWcgPSByZXNvbHZlQ29uZmlnKFsnYXBwLmpzb24nXSwgc3lzdGVtLnNyY0RpcilcblxuZXhwb3J0IGRlZmF1bHQgT2JqZWN0LmFzc2lnbih7XG4gICAgcGFnZXM6IFtdLFxuICAgIHN1YlBhY2thZ2VzOiBbXSxcbiAgICB3aW5kb3c6IHtcbiAgICAgICAgbmF2aWdhdGlvbkJhclRpdGxlVGV4dDogJ1dlY2hhdCdcbiAgICB9XG4gICAgLy8gdGFiQmFyOiB7XG4gICAgLy8gICAgIGxpc3Q6IFtdXG4gICAgLy8gfSxcbn0sIGN1c3RvbUNvbmZpZylcbiIsImltcG9ydCAqIGFzIHN5c3RlbUNvbmZpZyBmcm9tICcuL3N5c3RlbUNvbmZpZydcbmltcG9ydCBhbmthQ29uZmlnIGZyb20gJy4vYW5rYUNvbmZpZydcbmltcG9ydCBwcm9qZWN0Q29uZmlnIGZyb20gJy4vcHJvamVjdENvbmZpZydcblxuZXhwb3J0IGRlZmF1bHQge1xuICAgIC4uLnN5c3RlbUNvbmZpZyxcbiAgICBhbmthQ29uZmlnLFxuICAgIHByb2plY3RDb25maWdcbn1cbiIsImltcG9ydCBDb21waWxlciBmcm9tICcuL0NvbXBpbGVyJ1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuLi8uLi9jb25maWcnXG5cbmltcG9ydCB7XG4gICAgQW5rYUNvbmZpZyxcbiAgICBQYXJzZXJPcHRpb25zLFxuICAgIFByb2plY3RDb25maWcsXG4gICAgUGx1Z2luSGFuZGxlcixcbiAgICBQbHVnaW5PcHRpb25zLFxuICAgIENvbXBpbGVyQ29uZmlnXG59IGZyb20gJy4uLy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgSW5qZWN0aW9uIHtcbiAgICBjb21waWxlcjogQ29tcGlsZXJcbiAgICBvcHRpb25zOiBvYmplY3RcblxuICAgIGNvbnN0cnVjdG9yIChjb21waWxlcjogQ29tcGlsZXIsIG9wdGlvbnM/OiBvYmplY3QpIHtcbiAgICAgICAgdGhpcy5jb21waWxlciA9IGNvbXBpbGVyXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnNcbiAgICB9XG5cbiAgICBhYnN0cmFjdCBnZXRPcHRpb25zICgpOiBvYmplY3RcblxuICAgIGdldENvbXBpbGVyICgpOiBDb21waWxlciB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbXBpbGVyXG4gICAgfVxuXG4gICAgZ2V0QW5rYUNvbmZpZyAoKTogQW5rYUNvbmZpZyB7XG4gICAgICAgIHJldHVybiBjb25maWcuYW5rYUNvbmZpZ1xuICAgIH1cblxuICAgIGdldFN5c3RlbUNvbmZpZyAoKTogQ29tcGlsZXJDb25maWcge1xuICAgICAgICByZXR1cm4gY29uZmlnXG4gICAgfVxuXG4gICAgZ2V0UHJvamVjdENvbmZpZyAoKTogUHJvamVjdENvbmZpZyB7XG4gICAgICAgIHJldHVybiBjb25maWcucHJvamVjdENvbmZpZ1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFBsdWdpbkluamVjdGlvbiBleHRlbmRzIEluamVjdGlvbiB7XG5cbiAgICBjb25zdHJ1Y3RvciAoY29tcGlsZXI6IENvbXBpbGVyLCBvcHRpb25zOiBQbHVnaW5PcHRpb25zWydvcHRpb25zJ10pIHtcbiAgICAgICAgc3VwZXIoY29tcGlsZXIsIG9wdGlvbnMpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIFBsdWdpbiBvcHRpb25zXG4gICAgICovXG4gICAgZ2V0T3B0aW9ucyAoKTogb2JqZWN0IHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucyB8fCB7fVxuICAgIH1cblxuICAgIG9uIChldmVudDogc3RyaW5nLCBoYW5kbGVyOiBQbHVnaW5IYW5kbGVyKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY29tcGlsZXIub24oZXZlbnQsIGhhbmRsZXIpXG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgUGFyc2VySW5qZWN0aW9uIGV4dGVuZHMgSW5qZWN0aW9uIHtcblxuICAgIC8qKlxuICAgICAqIFJldHVybiBQYXJzZXJPcHRpb25zXG4gICAgICovXG4gICAgZ2V0T3B0aW9ucyAoKTogb2JqZWN0IHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucyB8fCB7fVxuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yIChjb21waWxlcjogQ29tcGlsZXIsIG9wdGlvbnM6IFBhcnNlck9wdGlvbnNbJ29wdGlvbnMnXSkge1xuICAgICAgICBzdXBlcihjb21waWxlciwgb3B0aW9ucylcbiAgICB9XG59XG4iLCJpbXBvcnQgRmlsZSBmcm9tICcuL0ZpbGUnXG5pbXBvcnQgY29uZmlnIGZyb20gJy4uLy4uL2NvbmZpZydcbmltcG9ydCBDb21waWxlciBmcm9tICcuL0NvbXBpbGVyJ1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vLi4vdXRpbHMnXG5cbmltcG9ydCB7XG4gICAgUGFyc2VyLFxuICAgIE1hdGNoZXIsXG4gICAgUGx1Z2luSGFuZGxlcixcbiAgICBQbHVnaW5PcHRpb25zLFxuICAgIENvbXBpbGVyQ29uZmlnXG59IGZyb20gJy4uLy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG4vKipcbiAqIEEgY29tcGlsYXRpb24gdGFza1xuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb21waWxhdGlvbiB7XG4gICAgY29uZmlnOiBDb21waWxlckNvbmZpZ1xuICAgIHJlYWRvbmx5IGNvbXBpbGVyOiBDb21waWxlclxuICAgIGlkOiBudW1iZXIgICAgICAgIC8vIFVuaXF1Ze+8jGZvciBlYWNoIENvbXBpbGF0aW9uXG4gICAgZmlsZTogRmlsZVxuICAgIHNvdXJjZUZpbGU6IHN0cmluZ1xuICAgIGRlc3Ryb3llZDogYm9vbGVhblxuXG4gICAgY29uc3RydWN0b3IgKGZpbGU6IEZpbGUgfCBzdHJpbmcsIGNvbmY6IENvbXBpbGVyQ29uZmlnLCBjb21waWxlcjogQ29tcGlsZXIpIHtcbiAgICAgICAgdGhpcy5jb21waWxlciA9IGNvbXBpbGVyXG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZlxuICAgICAgICB0aGlzLmlkID0gQ29tcGlsZXIuY29tcGlsYXRpb25JZCsrXG5cbiAgICAgICAgaWYgKGZpbGUgaW5zdGFuY2VvZiBGaWxlKSB7XG4gICAgICAgICAgICB0aGlzLmZpbGUgPSBmaWxlXG4gICAgICAgICAgICB0aGlzLnNvdXJjZUZpbGUgPSBmaWxlLnNvdXJjZUZpbGVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc291cmNlRmlsZSA9IGZpbGVcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZW5yb2xsKClcbiAgICB9XG5cbiAgICBhc3luYyBydW4gKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCB0aGlzLmxvYWRGaWxlKClcbiAgICAgICAgYXdhaXQgdGhpcy5pbnZva2VQYXJzZXJzKClcbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlKClcbiAgICB9XG5cbiAgICBhc3luYyBsb2FkRmlsZSAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICh0aGlzLmRlc3Ryb3llZCkgcmV0dXJuXG5cbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlci5lbWl0KCdiZWZvcmUtbG9hZC1maWxlJywgdGhpcylcbiAgICAgICAgaWYgKCEodGhpcy5maWxlIGluc3RhbmNlb2YgRmlsZSkpIHtcbiAgICAgICAgICAgIHRoaXMuZmlsZSA9IGF3YWl0IHV0aWxzLmNyZWF0ZUZpbGUodGhpcy5zb3VyY2VGaWxlKVxuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlci5lbWl0KCdhZnRlci1sb2FkLWZpbGUnLCB0aGlzKVxuICAgIH1cblxuICAgIGFzeW5jIGludm9rZVBhcnNlcnMgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBpZiAodGhpcy5kZXN0cm95ZWQpIHJldHVyblxuXG4gICAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLmZpbGVcbiAgICAgICAgY29uc3QgcGFyc2VycyA9IDxQYXJzZXJbXT50aGlzLmNvbXBpbGVyLnBhcnNlcnMuZmlsdGVyKChtYXRjaGVyczogTWF0Y2hlcikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoZXJzLm1hdGNoLnRlc3QoZmlsZS5zb3VyY2VGaWxlKVxuICAgICAgICB9KS5tYXAoKG1hdGNoZXJzOiBNYXRjaGVyKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hlcnMucGFyc2Vyc1xuICAgICAgICB9KS5yZWR1Y2UoKHByZXYsIG5leHQpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBwcmV2LmNvbmNhdChuZXh0KVxuICAgICAgICB9LCBbXSlcbiAgICAgICAgY29uc3QgdGFza3MgPSBwYXJzZXJzLm1hcChwYXJzZXIgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHV0aWxzLmFzeW5jRnVuY3Rpb25XcmFwcGVyKHBhcnNlcilcbiAgICAgICAgfSlcblxuICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGVyLmVtaXQoJ2JlZm9yZS1wYXJzZScsIHRoaXMpXG4gICAgICAgIGF3YWl0IHV0aWxzLmNhbGxQcm9taXNlSW5DaGFpbih0YXNrcywgZmlsZSwgdGhpcylcbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlci5lbWl0KCdhZnRlci1wYXJzZScsIHRoaXMpXG4gICAgfVxuXG4gICAgYXN5bmMgY29tcGlsZSAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICh0aGlzLmRlc3Ryb3llZCkgcmV0dXJuXG5cbiAgICAgICAgLy8gSW52b2tlIEV4dHJhY3REZXBlbmRlbmN5UGx1Z2luLlxuICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGVyLmVtaXQoJ2JlZm9yZS1jb21waWxlJywgdGhpcylcbiAgICAgICAgLy8gRG8gc29tZXRoaW5nIGVsc2UuXG4gICAgICAgIGF3YWl0IHRoaXMuY29tcGlsZXIuZW1pdCgnYWZ0ZXItY29tcGlsZScsIHRoaXMpXG4gICAgICAgICF0aGlzLmNvbmZpZy5hbmthQ29uZmlnLnF1aWV0ICYmICB1dGlscy5sb2dnZXIuaW5mbygnQ29tcGlsZScsICB0aGlzLmZpbGUuc291cmNlRmlsZS5yZXBsYWNlKGNvbmZpZy5jd2QsICcnKSlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBvbiBDb21waWxlciBhbmQgZGVzdHJveSB0aGUgcHJldmlvdXMgb25lIGlmIGNvbmZsaWN0IGFyaXNlcy5cbiAgICAgKi9cbiAgICBlbnJvbGwgKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBvbGRDb21waWxhdGlvbiA9IENvbXBpbGVyLmNvbXBpbGF0aW9uUG9vbC5nZXQodGhpcy5zb3VyY2VGaWxlKVxuXG4gICAgICAgIGlmIChvbGRDb21waWxhdGlvbikge1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5hbmthQ29uZmlnLmRlYnVnKSBjb25zb2xlLmxvZygnXGJEZXN0cm95IENvbXBpbGF0aW9uJywgb2xkQ29tcGlsYXRpb24uaWQsIG9sZENvbXBpbGF0aW9uLnNvdXJjZUZpbGUpXG5cbiAgICAgICAgICAgIG9sZENvbXBpbGF0aW9uLmRlc3Ryb3koKVxuICAgICAgICB9XG4gICAgICAgIENvbXBpbGVyLmNvbXBpbGF0aW9uUG9vbC5zZXQodGhpcy5zb3VyY2VGaWxlLCB0aGlzKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVucmVnaXN0ZXIgdGhlbXNlbHZlcyBmcm9tIENvbXBpbGVyLlxuICAgICAqL1xuICAgIGRlc3Ryb3kgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmRlc3Ryb3llZCA9IHRydWVcbiAgICAgICAgQ29tcGlsZXIuY29tcGlsYXRpb25Qb29sLmRlbGV0ZSh0aGlzLnNvdXJjZUZpbGUpXG4gICAgfVxufVxuIiwiaW1wb3J0IHtcbiAgICBQYXJzZXJJbmplY3Rpb24sXG4gICAgUGx1Z2luSW5qZWN0aW9uXG59IGZyb20gJy4vSW5qZWN0aW9uJ1xuaW1wb3J0IEZpbGUgZnJvbSAnLi9GaWxlJ1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnXG5pbXBvcnQgY29uZmlnIGZyb20gJy4uLy4uL2NvbmZpZydcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uLy4uL3V0aWxzJ1xuaW1wb3J0IENvbXBpbGF0aW9uIGZyb20gJy4vQ29tcGlsYXRpb24nXG5pbXBvcnQgY2FsbFByb21pc2VJbkNoYWluIGZyb20gJy4uLy4uL3V0aWxzL2NhbGxQcm9taXNlSW5DaGFpbidcbmltcG9ydCBhc3luY0Z1bmN0aW9uV3JhcHBlciBmcm9tICcuLi8uLi91dGlscy9hc3luY0Z1bmN0aW9uV3JhcHBlcidcblxuaW1wb3J0IHtcbiAgICBQYXJzZXIsXG4gICAgUGFyc2VyT3B0aW9ucyxcbiAgICBQbHVnaW5IYW5kbGVyLFxuICAgIFBsdWdpbk9wdGlvbnMsXG4gICAgQ29tcGlsZXJDb25maWdcbn0gZnJvbSAnLi4vLi4vLi4vdHlwZXMvdHlwZXMnXG5cbmNvbnN0IHsgbG9nZ2VyIH0gPSB1dGlsc1xuY29uc3QgZGVsID0gcmVxdWlyZSgnZGVsJylcblxuLyoqXG4gKiBUaGUgY29yZSBjb21waWxlci5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29tcGlsZXIge1xuICAgIHJlYWRvbmx5IGNvbmZpZzogQ29tcGlsZXJDb25maWdcbiAgICBwdWJsaWMgc3RhdGljIGNvbXBpbGF0aW9uSWQgPSAxXG4gICAgcHVibGljIHN0YXRpYyBjb21waWxhdGlvblBvb2wgPSBuZXcgTWFwPHN0cmluZywgQ29tcGlsYXRpb24+KClcbiAgICBwbHVnaW5zOiB7XG4gICAgICAgIFtldmVudE5hbWU6IHN0cmluZ106IEFycmF5PFBsdWdpbkhhbmRsZXI+XG4gICAgfSA9IHtcbiAgICAgICAgJ2JlZm9yZS1sb2FkLWZpbGUnOiBbXSxcbiAgICAgICAgJ2FmdGVyLWxvYWQtZmlsZSc6IFtdLFxuICAgICAgICAnYmVmb3JlLXBhcnNlJzogW10sXG4gICAgICAgICdhZnRlci1wYXJzZSc6IFtdLFxuICAgICAgICAnYmVmb3JlLWNvbXBpbGUnOiBbXSxcbiAgICAgICAgJ2FmdGVyLWNvbXBpbGUnOiBbXVxuICAgIH1cbiAgICBwYXJzZXJzOiBBcnJheTx7XG4gICAgICAgIG1hdGNoOiBSZWdFeHAsXG4gICAgICAgIHBhcnNlcnM6IEFycmF5PFBhcnNlcj5cbiAgICB9PiA9IFtdXG5cbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnXG4gICAgICAgIHRoaXMuaW5pdFBhcnNlcnMoKVxuICAgICAgICB0aGlzLmluaXRQbHVnaW5zKClcblxuICAgICAgICBpZiAoY29uZmlnLmFua2FDb25maWcuZGVidWcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHRoaXMuY29uZmlnLCAoa2V5LCB2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSByZXR1cm4gJ1tGdW5jdGlvbl0nXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlXG4gICAgICAgICAgICB9LCA0KSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVyIFBsdWdpbi5cbiAgICAgKiBAcGFyYW0gZXZlbnRcbiAgICAgKiBAcGFyYW0gaGFuZGxlclxuICAgICAqL1xuICAgIG9uIChldmVudDogc3RyaW5nLCBoYW5kbGVyOiBQbHVnaW5IYW5kbGVyKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLnBsdWdpbnNbZXZlbnRdID09PSB2b2lkICgwKSkgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGhvb2s6ICR7ZXZlbnR9YClcbiAgICAgICAgdGhpcy5wbHVnaW5zW2V2ZW50XS5wdXNoKGhhbmRsZXIpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW52b2tlIGxpZmVjeWNsZSBob29rcyhQcm9taXNlIGNoYWluaW5nKS5cbiAgICAgKiBAcGFyYW0gZXZlbnRcbiAgICAgKiBAcGFyYW0gY29tcGlsYXRpb25cbiAgICAgKi9cbiAgICBhc3luYyBlbWl0IChldmVudDogc3RyaW5nLCBjb21waWxhdGlvbjogQ29tcGlsYXRpb24pOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBpZiAoY29tcGlsYXRpb24uZGVzdHJveWVkKSByZXR1cm5cblxuICAgICAgICBjb25zdCBwbHVnaW5zID0gdGhpcy5wbHVnaW5zW2V2ZW50XVxuXG4gICAgICAgIGlmICghcGx1Z2lucyB8fCAhcGx1Z2lucy5sZW5ndGgpIHJldHVyblxuXG4gICAgICAgIGNvbnN0IHRhc2tzID0gcGx1Z2lucy5tYXAocGx1Z2luID0+IHtcbiAgICAgICAgICAgIHJldHVybiBhc3luY0Z1bmN0aW9uV3JhcHBlcihwbHVnaW4pXG4gICAgICAgIH0pXG5cbiAgICAgICAgYXdhaXQgY2FsbFByb21pc2VJbkNoYWluKHRhc2tzLCBjb21waWxhdGlvbilcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDbGVhbiBkaXN0IGRpcmVjdG9yeS5cbiAgICAgKi9cbiAgICBhc3luYyBjbGVhbiAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGF3YWl0IGRlbChbcGF0aC5qb2luKGNvbmZpZy5kaXN0RGlyLCAnKiovKicpXSlcbiAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoJ0NsZWFuJywgY29uZmlnLmRpc3REaXIpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRXZlcnl0aGluZyBzdGFydCBmcm9tIGhlcmUuXG4gICAgICovXG4gICAgYXN5bmMgbGF1bmNoICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBsb2dnZXIuaW5mbygnTGF1bmNoaW5nLi4uJylcblxuICAgICAgICBjb25zdCBmaWxlUGF0aHM6IHN0cmluZ1tdID0gYXdhaXQgdXRpbHMuc2VhcmNoRmlsZXMoYCR7Y29uZmlnLnNyY0Rpcn0vKiovKmAsIHtcbiAgICAgICAgICAgIG5vZGlyOiB0cnVlLFxuICAgICAgICAgICAgc2lsZW50OiBmYWxzZSxcbiAgICAgICAgICAgIGFic29sdXRlOiB0cnVlXG4gICAgICAgIH0pXG4gICAgICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgUHJvbWlzZS5hbGwoZmlsZVBhdGhzLm1hcChmaWxlID0+IHtcbiAgICAgICAgICAgIHJldHVybiB1dGlscy5jcmVhdGVGaWxlKGZpbGUpXG4gICAgICAgIH0pKVxuICAgICAgICBjb25zdCBjb21waWxhdGlvbnMgPSBmaWxlcy5tYXAoZmlsZSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IENvbXBpbGF0aW9uKGZpbGUsIHRoaXMuY29uZmlnLCB0aGlzKVxuICAgICAgICB9KVxuXG4gICAgICAgIGZzLmVuc3VyZURpclN5bmMoY29uZmlnLmRpc3ROb2RlTW9kdWxlcylcblxuICAgICAgICAvLyBhd2FpdCBQcm9taXNlLmFsbChjb21waWxhdGlvbnMubWFwKGNvbXBpbGF0aW9uID0+IGNvbXBpbGF0aW9uLmxvYWRGaWxlKCkpKVxuICAgICAgICAvLyBhd2FpdCBQcm9taXNlLmFsbChjb21waWxhdGlvbnMubWFwKGNvbXBpbGF0aW9uID0+IGNvbXBpbGF0aW9uLmludm9rZVBhcnNlcnMoKSkpXG5cbiAgICAgICAgLy8gVE9ETzogR2V0IGFsbCBmaWxlc1xuICAgICAgICAvLyBDb21waWxlci5jb21waWxhdGlvblBvb2wudmFsdWVzKClcblxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChjb21waWxhdGlvbnMubWFwKGNvbXBpbGF0aW9ucyA9PiBjb21waWxhdGlvbnMucnVuKCkpKVxuICAgIH1cblxuICAgIHdhdGNoRmlsZXMgKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHdhdGNoZXIgPSB1dGlscy5nZW5GaWxlV2F0Y2hlcihgJHtjb25maWcuc3JjRGlyfS8qKi8qYCwge1xuICAgICAgICAgICAgICAgIGZvbGxvd1N5bWxpbmtzOiBmYWxzZVxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgd2F0Y2hlci5vbignYWRkJywgYXN5bmMgKGZpbGVOYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlID0gYXdhaXQgdXRpbHMuY3JlYXRlRmlsZShmaWxlTmFtZSlcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmdlbmVyYXRlQ29tcGlsYXRpb24oZmlsZSkucnVuKClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB3YXRjaGVyLm9uKCd1bmxpbmsnLCBhc3luYyAoZmlsZU5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIGF3YWl0IGZzLnVubGluayhmaWxlTmFtZS5yZXBsYWNlKGNvbmZpZy5zcmNEaXIsIGNvbmZpZy5kaXN0RGlyKSlcbiAgICAgICAgICAgICAgICBsb2dnZXIuc3VjY2VzcygnUmVtb3ZlJywgZmlsZU5hbWUpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgd2F0Y2hlci5vbignY2hhbmdlJywgYXN5bmMgKGZpbGVOYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlID0gYXdhaXQgdXRpbHMuY3JlYXRlRmlsZShmaWxlTmFtZSlcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmdlbmVyYXRlQ29tcGlsYXRpb24oZmlsZSkucnVuKClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB3YXRjaGVyLm9uKCdyZWFkeScsICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIG5ldyBDb21waWxhdGlvbi5cbiAgICAgKiBAcGFyYW0gZmlsZVxuICAgICAqL1xuICAgIGdlbmVyYXRlQ29tcGlsYXRpb24gKGZpbGU6IEZpbGUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb21waWxhdGlvbihmaWxlLCB0aGlzLmNvbmZpZywgdGhpcylcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNb3VudCBwYXJzZXJzLlxuICAgICAqL1xuICAgIGluaXRQYXJzZXJzICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jb25maWcuYW5rYUNvbmZpZy5wYXJzZXJzLmZvckVhY2goKHsgbWF0Y2gsIHBhcnNlcnMgfSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wYXJzZXJzLnB1c2goe1xuICAgICAgICAgICAgICAgIG1hdGNoLFxuICAgICAgICAgICAgICAgIHBhcnNlcnM6IHBhcnNlcnMubWFwKCh7IHBhcnNlciwgb3B0aW9ucyB9KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZXIuYmluZCh0aGlzLmdlbmVyYXRlUGFyc2VySW5qZWN0aW9uKG9wdGlvbnMpKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1vdW50IFBsdWdpbnMuXG4gICAgICovXG4gICAgaW5pdFBsdWdpbnMgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmNvbmZpZy5hbmthQ29uZmlnLnBsdWdpbnMuZm9yRWFjaCgoeyBwbHVnaW4sIG9wdGlvbnMgfSkgPT4ge1xuICAgICAgICAgICAgcGx1Z2luLmNhbGwodGhpcy5nZW5lcmF0ZVBsdWdpbkluamVjdGlvbihvcHRpb25zKSlcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBnZW5lcmF0ZVBsdWdpbkluamVjdGlvbiAob3B0aW9uczogUGx1Z2luT3B0aW9uc1snb3B0aW9ucyddKTogUGx1Z2luSW5qZWN0aW9uIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQbHVnaW5JbmplY3Rpb24odGhpcywgb3B0aW9ucylcbiAgICB9XG5cbiAgICBnZW5lcmF0ZVBhcnNlckluamVjdGlvbiAob3B0aW9uczogUGFyc2VyT3B0aW9uc1snb3B0aW9ucyddKTogUGFyc2VySW5qZWN0aW9uIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQYXJzZXJJbmplY3Rpb24odGhpcywgb3B0aW9ucylcbiAgICB9XG59XG4iLCJpbXBvcnQgQ29tcGlsZXIgZnJvbSAnLi9Db21waWxlcidcblxuZXhwb3J0IGRlZmF1bHQgYWJzdHJhY3QgY2xhc3MgQ29tbWFuZCB7XG4gICAgcHVibGljIGNvbW1hbmQ6IHN0cmluZ1xuICAgIHB1YmxpYyBvcHRpb25zOiBBcnJheTxBcnJheTxzdHJpbmc+PlxuICAgIHB1YmxpYyBhbGlhczogc3RyaW5nXG4gICAgcHVibGljIHVzYWdlOiBzdHJpbmdcbiAgICBwdWJsaWMgZGVzY3JpcHRpb246IHN0cmluZ1xuICAgIHB1YmxpYyBleGFtcGxlczogQXJyYXk8c3RyaW5nPlxuICAgIHB1YmxpYyAkY29tcGlsZXI6IENvbXBpbGVyXG4gICAgcHVibGljIG9uOiB7XG4gICAgICAgIFtrZXk6IHN0cmluZ106ICguLi5hcmc6IGFueVtdKSA9PiB2b2lkXG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IgKGNvbW1hbmQ6IHN0cmluZywgZGVzYz86IHN0cmluZykge1xuICAgICAgICB0aGlzLmNvbW1hbmQgPSBjb21tYW5kXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IFtdXG4gICAgICAgIHRoaXMuYWxpYXMgPSAnJ1xuICAgICAgICB0aGlzLnVzYWdlID0gJydcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IGRlc2NcbiAgICAgICAgdGhpcy5leGFtcGxlcyA9IFtdXG4gICAgICAgIHRoaXMub24gPSB7fVxuICAgIH1cblxuICAgIGFic3RyYWN0IGFjdGlvbiAocGFyYW06IHN0cmluZyB8IEFycmF5PHN0cmluZz4sIG9wdGlvbnM6IE9iamVjdCwgLi4ub3RoZXI6IGFueVtdKTogUHJvbWlzZTxhbnk+IHwgdm9pZFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSBhbmthIGNvcmUgY29tcGlsZXJcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgaW5pdENvbXBpbGVyICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy4kY29tcGlsZXIgPSBuZXcgQ29tcGlsZXIoKVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBzZXRVc2FnZSAodXNhZ2U6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICB0aGlzLnVzYWdlID0gdXNhZ2VcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgc2V0T3B0aW9ucyAoLi4ub3B0aW9uczogQXJyYXk8c3RyaW5nPik6IHZvaWQge1xuICAgICAgICB0aGlzLm9wdGlvbnMucHVzaChvcHRpb25zKVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBzZXRFeGFtcGxlcyAoLi4uZXhhbXBsZTogQXJyYXk8c3RyaW5nPik6IHZvaWQge1xuICAgICAgICB0aGlzLmV4YW1wbGVzID0gdGhpcy5leGFtcGxlcy5jb25jYXQoZXhhbXBsZSlcbiAgICB9XG5cbiAgICBwdWJsaWMgcHJpbnRUaXRsZSAoLi4uYXJnOiBBcnJheTxhbnk+KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdcXHJcXG4gJywgLi4uYXJnLCAnXFxyXFxuJylcbiAgICB9XG5cbiAgICBwdWJsaWMgcHJpbnRDb250ZW50ICguLi5hcmc6IEFycmF5PGFueT4pIHtcbiAgICAgICAgY29uc29sZS5sb2coJyAgICcsIC4uLmFyZylcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBsb2dnZXIgfSBmcm9tICcuLi91dGlscydcbmltcG9ydCB7IENvbW1hbmQsIENvbXBpbGVyIH0gZnJvbSAnLi4vY29yZSdcblxuZXhwb3J0IHR5cGUgRGV2Q29tbWFuZE9wdHMgPSBPYmplY3QgJiB7fVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEZXZDb21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBzdXBlcihcbiAgICAgICAgICAgICdkZXYgW3BhZ2VzLi4uXScsXG4gICAgICAgICAgICAnRGV2ZWxvcG1lbnQgbW9kZSdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0RXhhbXBsZXMoXG4gICAgICAgICAgICAnJCBhbmthIGRldicsXG4gICAgICAgICAgICAnJCBhbmthIGRldiBpbmRleCcsXG4gICAgICAgICAgICAnJCBhbmthIGRldiAvcGFnZXMvbG9nL2xvZyAvcGFnZXMvdXNlci91c2VyJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy4kY29tcGlsZXIgPSBuZXcgQ29tcGlsZXIoKVxuICAgICAgICB0aGlzLiRjb21waWxlci5jb25maWcuYW5rYUNvbmZpZy5kZXZNb2RlID0gdHJ1ZVxuICAgIH1cblxuICAgIGFzeW5jIGFjdGlvbiAocGFnZXM/OiBBcnJheTxzdHJpbmc+LCBvcHRpb25zPzogRGV2Q29tbWFuZE9wdHMpIHtcbiAgICAgICAgY29uc3Qgc3RhcnR1cFRpbWUgPSBEYXRlLm5vdygpXG4gICAgICAgIHRoaXMuaW5pdENvbXBpbGVyKClcbiAgICAgICAgYXdhaXQgdGhpcy4kY29tcGlsZXIuY2xlYW4oKVxuICAgICAgICBhd2FpdCB0aGlzLiRjb21waWxlci5sYXVuY2goKVxuICAgICAgICBhd2FpdCB0aGlzLiRjb21waWxlci53YXRjaEZpbGVzKClcbiAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoYFN0YXJ0dXA6ICR7RGF0ZS5ub3coKSAtIHN0YXJ0dXBUaW1lfW1zYCwgYEFua2EgaXMgd2FpdGluZyBmb3IgY2hhbmdlcy4uLmApXG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuLi9jb25maWcnXG5pbXBvcnQgeyBkb3dubG9hZFJlcG8sIGxvZ2dlciB9IGZyb20gJy4uL3V0aWxzJ1xuaW1wb3J0IHsgQ29tbWFuZCwgQ29tcGlsZXIgfSBmcm9tICcuLi9jb3JlJ1xuXG5leHBvcnQgdHlwZSBJbml0Q29tbWFuZE9wdHMgPSB7XG4gICAgcmVwbzogc3RyaW5nXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEluaXRDb21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBzdXBlcihcbiAgICAgICAgICAgICdpbml0IDxwcm9qZWN0LW5hbWU+JyxcbiAgICAgICAgICAgICdJbml0aWFsaXplIG5ldyBwcm9qZWN0J1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRFeGFtcGxlcyhcbiAgICAgICAgICAgICckIGFua2EgaW5pdCcsXG4gICAgICAgICAgICBgJCBhbmthIGluaXQgYW5rYS1pbi1hY3Rpb24gLS1yZXBvPSR7Y29uZmlnLmRlZmF1bHRTY2FmZm9sZH1gXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldE9wdGlvbnMoXG4gICAgICAgICAgICAnLXIsIC0tcmVwbycsXG4gICAgICAgICAgICAndGVtcGxhdGUgcmVwb3NpdG9yeSdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuJGNvbXBpbGVyID0gbmV3IENvbXBpbGVyKClcbiAgICB9XG5cbiAgICBhc3luYyBhY3Rpb24gKHByb2plY3ROYW1lOiBzdHJpbmcsIG9wdGlvbnM/OiBJbml0Q29tbWFuZE9wdHMpIHtcbiAgICAgICAgY29uc3QgcHJvamVjdCA9IHBhdGgucmVzb2x2ZShjb25maWcuY3dkLCBwcm9qZWN0TmFtZSlcbiAgICAgICAgY29uc3QgcmVwbyA9IG9wdGlvbnMucmVwbyB8fCBjb25maWcuZGVmYXVsdFNjYWZmb2xkXG5cbiAgICAgICAgbG9nZ2VyLnN0YXJ0TG9hZGluZygnRG93bmxvYWRpbmcgdGVtcGxhdGUuLi4nKVxuICAgICAgICBhd2FpdCBkb3dubG9hZFJlcG8ocmVwbywgcHJvamVjdClcbiAgICAgICAgbG9nZ2VyLnN0b3BMb2FkaW5nKClcbiAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoJ0RvbmUnLCBwcm9qZWN0KVxuICAgIH1cbn1cbiIsImltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uL3V0aWxzJ1xuaW1wb3J0IHsgQ29tbWFuZCwgQ29tcGlsZXIgfSBmcm9tICcuLi9jb3JlJ1xuXG5leHBvcnQgdHlwZSBEZXZDb21tYW5kT3B0cyA9IE9iamVjdCAmIHt9XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERldkNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHN1cGVyKFxuICAgICAgICAgICAgJ3Byb2QnLFxuICAgICAgICAgICAgJ1Byb2R1Y3Rpb24gbW9kZSdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0RXhhbXBsZXMoXG4gICAgICAgICAgICAnJCBhbmthIHByb2QnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLiRjb21waWxlciA9IG5ldyBDb21waWxlcigpXG4gICAgfVxuXG4gICAgYXN5bmMgYWN0aW9uIChwYWdlcz86IEFycmF5PHN0cmluZz4sIG9wdGlvbnM/OiBEZXZDb21tYW5kT3B0cykge1xuICAgICAgICBjb25zdCBzdGFydHVwVGltZSA9IERhdGUubm93KClcbiAgICAgICAgdGhpcy5pbml0Q29tcGlsZXIoKVxuICAgICAgICBhd2FpdCB0aGlzLiRjb21waWxlci5jbGVhbigpXG4gICAgICAgIGF3YWl0IHRoaXMuJGNvbXBpbGVyLmxhdW5jaCgpXG4gICAgICAgIGxvZ2dlci5zdWNjZXNzKGBEb25lOiAke0RhdGUubm93KCkgLSBzdGFydHVwVGltZX1tc2AsICdIYXZlIGEgbmljZSBkYXkg8J+OiSAhJylcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCdcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBjb25maWcgIGZyb20gJy4uL2NvbmZpZydcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uL3V0aWxzJ1xuaW1wb3J0IHsgQ29tbWFuZCwgQ29tcGlsZXIgfSBmcm9tICcuLi9jb3JlJ1xuaW1wb3J0IHsgZGVmYXVsdCBhcyBGc0VkaXRvckNvbnN0cnVjdG9yIH0gZnJvbSAnLi4vdXRpbHMvZWRpdG9yJ1xuXG5jb25zdCB7IGxvZ2dlciwgRnNFZGl0b3IgfSA9IHV0aWxzXG5cbmV4cG9ydCB0eXBlIENyZWF0ZVBhZ2VDb21tYW5kT3B0cyA9IHtcbiAgICByb290OiBzdHJpbmdcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ3JlYXRlUGFnZUNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHN1cGVyKFxuICAgICAgICAgICAgJ25ldy1wYWdlIDxwYWdlcy4uLj4nLFxuICAgICAgICAgICAgJ0NyZWF0ZSBhIG1pbmlwcm9ncmFtIHBhZ2UnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldEV4YW1wbGVzKFxuICAgICAgICAgICAgJyQgYW5rYSBuZXctcGFnZSBpbmRleCcsXG4gICAgICAgICAgICAnJCBhbmthIG5ldy1wYWdlIC9wYWdlcy9pbmRleC9pbmRleCcsXG4gICAgICAgICAgICAnJCBhbmthIG5ldy1wYWdlIC9wYWdlcy9pbmRleC9pbmRleCAtLXJvb3Q9cGFja2FnZUEnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldE9wdGlvbnMoXG4gICAgICAgICAgICAnLXIsIC0tcm9vdCA8c3VicGFja2FnZT4nLFxuICAgICAgICAgICAgJ3NhdmUgcGFnZSB0byBzdWJwYWNrYWdlcydcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuJGNvbXBpbGVyID0gbmV3IENvbXBpbGVyKClcbiAgICB9XG5cbiAgICBhc3luYyBhY3Rpb24gKHBhZ2VzPzogQXJyYXk8c3RyaW5nPiwgb3B0aW9ucz86IENyZWF0ZVBhZ2VDb21tYW5kT3B0cykge1xuICAgICAgICBjb25zdCByb290ID0gb3B0aW9ucy5yb290XG4gICAgICAgIGNvbnN0IGVkaXRvciA9IG5ldyBGc0VkaXRvcigpXG5cbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwocGFnZXMubWFwKHBhZ2UgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2VuZXJhdGVQYWdlKHBhZ2UsIGVkaXRvciwgcm9vdClcbiAgICAgICAgfSkpXG5cbiAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoJ0RvbmUnLCAnSGF2ZSBhIG5pY2UgZGF5IPCfjokgIScpXG4gICAgfVxuXG4gICAgYXN5bmMgZ2VuZXJhdGVQYWdlIChwYWdlOiBzdHJpbmcsIGVkaXRvcjogRnNFZGl0b3JDb25zdHJ1Y3Rvciwgcm9vdD86IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICBhbmthQ29uZmlnLFxuICAgICAgICAgICAgcHJvamVjdENvbmZpZ1xuICAgICAgICB9ID0gPENvbXBpbGVyQ29uZmlnPmNvbmZpZ1xuICAgICAgICBjb25zdCBDd2RSZWdFeHAgPSBuZXcgUmVnRXhwKGBeJHtjb25maWcuY3dkfWApXG4gICAgICAgIGNvbnN0IHBhZ2VQYXRoID0gcGFnZS5zcGxpdChwYXRoLnNlcCkubGVuZ3RoID09PSAxID9cbiAgICAgICAgICAgIHBhdGguam9pbihhbmthQ29uZmlnLnBhZ2VzLCBwYWdlLCBwYWdlKSA6IHBhZ2VcbiAgICAgICAgY29uc3QgcGFnZU5hbWUgPSBwYXRoLmJhc2VuYW1lKHBhZ2VQYXRoKVxuICAgICAgICBjb25zdCBjb250ZXh0ID0ge1xuICAgICAgICAgICAgcGFnZU5hbWVcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhcHBDb25maWdQYXRoID0gcGF0aC5qb2luKGNvbmZpZy5zcmNEaXIsICdhcHAuanNvbicpXG4gICAgICAgIGxldCBhYnNvbHV0ZVBhdGggPSBjb25maWcuc3JjRGlyXG5cbiAgICAgICAgaWYgKHJvb3QpIHtcbiAgICAgICAgICAgIGNvbnN0IHJvb3RQYXRoID0gcGF0aC5qb2luKGFua2FDb25maWcuc3ViUGFja2FnZXMsIHJvb3QpXG4gICAgICAgICAgICBjb25zdCBzdWJQa2cgPSBwcm9qZWN0Q29uZmlnLnN1YlBhY2thZ2VzLmZpbmQoKHBrZzogYW55KSA9PiBwa2cucm9vdCA9PT0gcm9vdFBhdGgpXG5cbiAgICAgICAgICAgIGFic29sdXRlUGF0aCA9IHBhdGguam9pbihhYnNvbHV0ZVBhdGgsIGFua2FDb25maWcuc3ViUGFja2FnZXMsIHJvb3QsIHBhZ2VQYXRoKVxuXG4gICAgICAgICAgICBpZiAoc3ViUGtnKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN1YlBrZy5wYWdlcy5pbmNsdWRlcyhwYWdlUGF0aCkpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLndhcm4oJ1RoZSBwYWdlIGFscmVhZHkgZXhpc3RzJywgYWJzb2x1dGVQYXRoKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzdWJQa2cucGFnZXMucHVzaChwYWdlUGF0aClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHByb2plY3RDb25maWcuc3ViUGFja2FnZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHJvb3Q6IHJvb3RQYXRoLFxuICAgICAgICAgICAgICAgICAgICBwYWdlczogW3BhZ2VQYXRoXVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhYnNvbHV0ZVBhdGggPSBwYXRoLmpvaW4oYWJzb2x1dGVQYXRoLCBwYWdlUGF0aClcblxuICAgICAgICAgICAgaWYgKHByb2plY3RDb25maWcucGFnZXMuaW5jbHVkZXMocGFnZVBhdGgpKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLndhcm4oJ1RoZSBwYWdlIGFscmVhZHkgZXhpc3RzJywgYWJzb2x1dGVQYXRoKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwcm9qZWN0Q29uZmlnLnBhZ2VzLnB1c2gocGFnZVBhdGgpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0cGxzID0gYXdhaXQgdXRpbHMuc2VhcmNoRmlsZXMoYCR7cGF0aC5qb2luKGFua2FDb25maWcudGVtcGxhdGUucGFnZSwgJyouKicpfWApXG5cbiAgICAgICAgdHBscy5mb3JFYWNoKHRwbCA9PiB7XG4gICAgICAgICAgICBlZGl0b3IuY29weShcbiAgICAgICAgICAgICAgICB0cGwsXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHBhdGguZGlybmFtZShhYnNvbHV0ZVBhdGgpLCBwYWdlTmFtZSArIHBhdGguZXh0bmFtZSh0cGwpKSxcbiAgICAgICAgICAgICAgICBjb250ZXh0XG4gICAgICAgICAgICApXG4gICAgICAgIH0pXG4gICAgICAgIGVkaXRvci53cml0ZUpTT04oYXBwQ29uZmlnUGF0aCwgcHJvamVjdENvbmZpZywgbnVsbCwgNClcblxuICAgICAgICBhd2FpdCBlZGl0b3Iuc2F2ZSgpXG5cbiAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoJ0NyZWF0ZSBwYWdlJywgYWJzb2x1dGVQYXRoLnJlcGxhY2UoQ3dkUmVnRXhwLCAnJykpXG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgY29uZmlnICBmcm9tICcuLi9jb25maWcnXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi91dGlscydcbmltcG9ydCB7IENvbW1hbmQsIENvbXBpbGVyIH0gZnJvbSAnLi4vY29yZSdcbmltcG9ydCB7IGRlZmF1bHQgYXMgRnNFZGl0b3JDb25zdHJ1Y3RvciB9IGZyb20gJy4uL3V0aWxzL2VkaXRvcidcblxuY29uc3QgeyBsb2dnZXIsIEZzRWRpdG9yIH0gPSB1dGlsc1xuXG5leHBvcnQgdHlwZSBDcmVhdGVDb21wb25lbnRDb21tYW5kT3B0cyA9IHtcbiAgICByb290OiBzdHJpbmdcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ3JlYXRlQ29tcG9uZW50Q29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgc3VwZXIoXG4gICAgICAgICAgICAnbmV3LWNtcHQgPGNvbXBvbmVudHMuLi4+JyxcbiAgICAgICAgICAgICdDcmVhdGUgYSBtaW5pcHJvZ3JhbSBjb21wb25lbnQnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldEV4YW1wbGVzKFxuICAgICAgICAgICAgJyQgYW5rYSBuZXctY21wdCBidXR0b24nLFxuICAgICAgICAgICAgJyQgYW5rYSBuZXctY21wdCAvY29tcG9uZW50cy9idXR0b24vYnV0dG9uJyxcbiAgICAgICAgICAgICckIGFua2EgbmV3LWNtcHQgL2NvbXBvbmVudHMvYnV0dG9uL2J1dHRvbiAtLWdsb2JhbCdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0T3B0aW9ucyhcbiAgICAgICAgICAgICctciwgLS1yb290IDxzdWJwYWNrYWdlPicsXG4gICAgICAgICAgICAnc2F2ZSBjb21wb25lbnQgdG8gc3VicGFja2FnZXMnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLiRjb21waWxlciA9IG5ldyBDb21waWxlcigpXG4gICAgfVxuXG4gICAgYXN5bmMgYWN0aW9uIChjb21wb25lbnRzPzogQXJyYXk8c3RyaW5nPiwgb3B0aW9ucz86IENyZWF0ZUNvbXBvbmVudENvbW1hbmRPcHRzKSB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIHJvb3RcbiAgICAgICAgfSA9IG9wdGlvbnNcbiAgICAgICAgY29uc3QgZWRpdG9yID0gbmV3IEZzRWRpdG9yKClcblxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChjb21wb25lbnRzLm1hcChjb21wb25lbnQgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2VuZXJhdGVDb21wb25lbnQoY29tcG9uZW50LCBlZGl0b3IsIHJvb3QpXG4gICAgICAgIH0pKVxuXG4gICAgICAgIGxvZ2dlci5zdWNjZXNzKCdEb25lJywgJ0hhdmUgYSBuaWNlIGRheSDwn46JICEnKVxuICAgIH1cblxuICAgIGFzeW5jIGdlbmVyYXRlQ29tcG9uZW50IChjb21wb25lbnQ6IHN0cmluZywgZWRpdG9yOiBGc0VkaXRvckNvbnN0cnVjdG9yLCByb290Pzogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIGFua2FDb25maWcsXG4gICAgICAgICAgICBwcm9qZWN0Q29uZmlnXG4gICAgICAgIH0gPSA8Q29tcGlsZXJDb25maWc+Y29uZmlnXG4gICAgICAgIGNvbnN0IEN3ZFJlZ0V4cCA9IG5ldyBSZWdFeHAoYF4ke2NvbmZpZy5jd2R9YClcbiAgICAgICAgY29uc3QgY29tcG9uZW50UGF0aCA9IGNvbXBvbmVudC5zcGxpdChwYXRoLnNlcCkubGVuZ3RoID09PSAxID9cbiAgICAgICAgICAgIHBhdGguam9pbihhbmthQ29uZmlnLmNvbXBvbmVudHMsIGNvbXBvbmVudCwgY29tcG9uZW50KSA6XG4gICAgICAgICAgICBjb21wb25lbnRcbiAgICAgICAgY29uc3QgY29tcG9uZW50TmFtZSA9IHBhdGguYmFzZW5hbWUoY29tcG9uZW50UGF0aClcbiAgICAgICAgY29uc3QgY29udGV4dCA9IHtcbiAgICAgICAgICAgIGNvbXBvbmVudE5hbWVcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhYnNvbHV0ZVBhdGggPSByb290ID9cbiAgICAgICAgICAgIHBhdGguam9pbihjb25maWcuc3JjRGlyLCBhbmthQ29uZmlnLnN1YlBhY2thZ2VzLCByb290LCBjb21wb25lbnRQYXRoKSA6XG4gICAgICAgICAgICBwYXRoLmpvaW4oY29uZmlnLnNyY0RpciwgY29tcG9uZW50UGF0aClcblxuICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKGFic29sdXRlUGF0aCksIGNvbXBvbmVudE5hbWUgKyAnLmpzb24nKSkpIHtcbiAgICAgICAgICAgIGxvZ2dlci53YXJuKCdUaGUgY29tcG9uZW50IGFscmVhZHkgZXhpc3RzJywgYWJzb2x1dGVQYXRoKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0cGxzID0gYXdhaXQgdXRpbHMuc2VhcmNoRmlsZXMoYCR7cGF0aC5qb2luKGFua2FDb25maWcudGVtcGxhdGUuY29tcG9uZW50LCAnKi4qJyl9YClcblxuICAgICAgICB0cGxzLmZvckVhY2godHBsID0+IHtcbiAgICAgICAgICAgIGVkaXRvci5jb3B5KFxuICAgICAgICAgICAgICAgIHRwbCxcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKGFic29sdXRlUGF0aCksIGNvbXBvbmVudE5hbWUgKyBwYXRoLmV4dG5hbWUodHBsKSksXG4gICAgICAgICAgICAgICAgY29udGV4dFxuICAgICAgICAgICAgKVxuICAgICAgICB9KVxuXG4gICAgICAgIGF3YWl0IGVkaXRvci5zYXZlKClcblxuICAgICAgICBsb2dnZXIuc3VjY2VzcygnQ3JlYXRlIGNvbXBvbmVudCcsIGFic29sdXRlUGF0aC5yZXBsYWNlKEN3ZFJlZ0V4cCwgJycpKVxuICAgIH1cbn1cbiIsImltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJ1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IGNvbmZpZyAgZnJvbSAnLi4vY29uZmlnJ1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vdXRpbHMnXG5pbXBvcnQgeyBDb21tYW5kLCBDb21waWxlciB9IGZyb20gJy4uL2NvcmUnXG5pbXBvcnQgeyBkZWZhdWx0IGFzIEZzRWRpdG9yQ29uc3RydWN0b3IgfSBmcm9tICcuLi91dGlscy9lZGl0b3InXG5cbmNvbnN0IHsgbG9nZ2VyLCBGc0VkaXRvciB9ID0gdXRpbHNcblxuZXhwb3J0IHR5cGUgRW5yb2xsQ29tcG9uZW50Q29tbWFuZE9wdHMgPSB7XG4gICAgcGFnZTogc3RyaW5nXG4gICAgZ2xvYmFsOiBzdHJpbmdcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRW5yb2xsQ29tcG9uZW50Q29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgc3VwZXIoXG4gICAgICAgICAgICAnZW5yb2xsIDxjb21wb25lbnRzLi4uPicsXG4gICAgICAgICAgICAnRW5yb2xsIGEgbWluaXByb2dyYW0gY29tcG9uZW50J1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRFeGFtcGxlcyhcbiAgICAgICAgICAgICckIGFua2EgZW5yb2xsIGJ1dHRvbiAtLWdsb2JhbCcsXG4gICAgICAgICAgICAnJCBhbmthIGVucm9sbCAvY29tcG9uZW50cy9idXR0b24vYnV0dG9uIC0tZ2xvYmFsJyxcbiAgICAgICAgICAgICckIGFua2EgZW5yb2xsIC9jb21wb25lbnRzL2J1dHRvbi9idXR0b24gLS1wYWdlPS9wYWdlcy9pbmRleC9pbmRleCdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0T3B0aW9ucyhcbiAgICAgICAgICAgICctcCwgLS1wYWdlIDxwYWdlPicsXG4gICAgICAgICAgICAnd2hpY2ggcGFnZSBjb21wb25lbnRzIGVucm9sbCB0bydcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0T3B0aW9ucyhcbiAgICAgICAgICAgICctZywgLS1nbG9iYWwnLFxuICAgICAgICAgICAgJ2Vucm9sbCBjb21wb25lbnRzIHRvIGFwcC5qc29uJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy4kY29tcGlsZXIgPSBuZXcgQ29tcGlsZXIoKVxuICAgIH1cblxuICAgIGFzeW5jIGFjdGlvbiAoY29tcG9uZW50cz86IEFycmF5PHN0cmluZz4sIG9wdGlvbnM/OiBFbnJvbGxDb21wb25lbnRDb21tYW5kT3B0cykge1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICBwYWdlLFxuICAgICAgICAgICAgZ2xvYmFsXG4gICAgICAgIH0gPSBvcHRpb25zXG4gICAgICAgIGNvbnN0IGVkaXRvciA9IG5ldyBGc0VkaXRvcigpXG5cbiAgICAgICAgaWYgKCFnbG9iYWwgJiYgIXBhZ2UpIHtcbiAgICAgICAgICAgIGxvZ2dlci53YXJuKCdXaGVyZSBjb21wb25lbnRzIGVucm9sbCB0bz8nKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChjb21wb25lbnRzLm1hcChjb21wb25lbnQgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZW5yb2xsQ29tcG9uZW50KGNvbXBvbmVudCwgZWRpdG9yLCBnbG9iYWwgPyAnJyA6IHBhZ2UpXG4gICAgICAgIH0pKVxuXG4gICAgICAgIGxvZ2dlci5zdWNjZXNzKCdEb25lJywgJ0hhdmUgYSBuaWNlIGRheSDwn46JICEnKVxuICAgIH1cblxuICAgIGFzeW5jIGVucm9sbENvbXBvbmVudCAoY29tcG9uZW50OiBzdHJpbmcsIGVkaXRvcjogRnNFZGl0b3JDb25zdHJ1Y3RvciwgcGFnZT86IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICBhbmthQ29uZmlnLFxuICAgICAgICAgICAgcHJvamVjdENvbmZpZ1xuICAgICAgICB9ID0gPENvbXBpbGVyQ29uZmlnPmNvbmZpZ1xuICAgICAgICBjb25zdCBDd2RSZWdFeHAgPSBuZXcgUmVnRXhwKGBeJHtjb25maWcuY3dkfWApXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudFBhdGggPSBjb21wb25lbnQuc3BsaXQocGF0aC5zZXApLmxlbmd0aCA9PT0gMSA/XG4gICAgICAgICAgICBwYXRoLmpvaW4oYW5rYUNvbmZpZy5jb21wb25lbnRzLCBjb21wb25lbnQsIGNvbXBvbmVudCkgOlxuICAgICAgICAgICAgY29tcG9uZW50XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudE5hbWUgPSBjb21wb25lbnRQYXRoLnNwbGl0KHBhdGguc2VwKS5wb3AoKVxuICAgICAgICBjb25zdCBhcHBDb25maWdQYXRoID0gcGF0aC5qb2luKGNvbmZpZy5zcmNEaXIsICdhcHAuanNvbicpXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudEFic1BhdGggPSBwYXRoLmpvaW4oY29uZmlnLnNyY0RpciwgY29tcG9uZW50UGF0aClcblxuICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMocGF0aC5qb2luKHBhdGguZGlybmFtZShjb21wb25lbnRBYnNQYXRoKSwgY29tcG9uZW50TmFtZSArICcuanNvbicpKSkge1xuICAgICAgICAgICAgbG9nZ2VyLndhcm4oJ0NvbXBvbmVudCBkb3NlIG5vdCBleGlzdHMnLCBjb21wb25lbnRBYnNQYXRoKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAocGFnZSkge1xuICAgICAgICAgICAgY29uc3QgcGFnZUFic1BhdGggPSBwYXRoLmpvaW4oY29uZmlnLnNyY0RpciwgcGFnZSlcbiAgICAgICAgICAgIGNvbnN0IHBhZ2VKc29uUGF0aCA9IHBhdGguam9pbihwYXRoLmRpcm5hbWUocGFnZUFic1BhdGgpLCBwYXRoLmJhc2VuYW1lKHBhZ2VBYnNQYXRoKSArICcuanNvbicpXG4gICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMocGFnZUpzb25QYXRoKSkge1xuICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKCdQYWdlIGRvc2Ugbm90IGV4aXN0cycsIHBhZ2VBYnNQYXRoKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBwYWdlSnNvbiA9IDxhbnk+SlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMocGFnZUpzb25QYXRoLCB7XG4gICAgICAgICAgICAgICAgZW5jb2Rpbmc6ICd1dGY4J1xuICAgICAgICAgICAgfSkgfHwgJ3t9JylcblxuICAgICAgICAgICAgdGhpcy5lbnN1cmVVc2luZ0NvbXBvbmVudHMocGFnZUpzb24pXG5cbiAgICAgICAgICAgIGlmIChwYWdlSnNvbi51c2luZ0NvbXBvbmVudHNbY29tcG9uZW50TmFtZV0pIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIud2FybignQ29tcG9uZW50IGFscmVhZHkgZW5yb2xsZWQgaW4nLCBwYWdlQWJzUGF0aClcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcGFnZUpzb24udXNpbmdDb21wb25lbnRzW2NvbXBvbmVudE5hbWVdID0gcGF0aC5yZWxhdGl2ZShwYXRoLmRpcm5hbWUocGFnZUFic1BhdGgpLCBjb21wb25lbnRBYnNQYXRoKVxuICAgICAgICAgICAgZWRpdG9yLndyaXRlSlNPTihwYWdlSnNvblBhdGgsIHBhZ2VKc29uKVxuICAgICAgICAgICAgYXdhaXQgZWRpdG9yLnNhdmUoKVxuXG4gICAgICAgICAgICBsb2dnZXIuc3VjY2VzcyhgRW5yb2xsICR7Y29tcG9uZW50UGF0aH0gaW5gLCBwYWdlQWJzUGF0aC5yZXBsYWNlKEN3ZFJlZ0V4cCwgJycpKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5lbnN1cmVVc2luZ0NvbXBvbmVudHMocHJvamVjdENvbmZpZylcblxuICAgICAgICAgICAgaWYgKHByb2plY3RDb25maWcudXNpbmdDb21wb25lbnRzW2NvbXBvbmVudE5hbWVdKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLndhcm4oJ0NvbXBvbmVudCBhbHJlYWR5IGVucm9sbGVkIGluJywgJ2FwcC5qc29uJylcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJvamVjdENvbmZpZy51c2luZ0NvbXBvbmVudHNbY29tcG9uZW50TmFtZV0gPSBwYXRoLnJlbGF0aXZlKHBhdGguZGlybmFtZShhcHBDb25maWdQYXRoKSwgY29tcG9uZW50QWJzUGF0aClcbiAgICAgICAgICAgIGVkaXRvci53cml0ZUpTT04oYXBwQ29uZmlnUGF0aCwgcHJvamVjdENvbmZpZylcbiAgICAgICAgICAgIGF3YWl0IGVkaXRvci5zYXZlKClcblxuICAgICAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoYEVucm9sbCAke2NvbXBvbmVudFBhdGh9IGluYCwgJ2FwcC5qc29uJylcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgZW5zdXJlVXNpbmdDb21wb25lbnRzIChjb25maWc6IGFueSkge1xuICAgICAgICBpZiAoIWNvbmZpZy51c2luZ0NvbXBvbmVudHMpIHtcbiAgICAgICAgICAgIGNvbmZpZy51c2luZ0NvbXBvbmVudHMgPSB7fVxuICAgICAgICB9XG4gICAgfVxufVxuIiwiaW1wb3J0IERldiBmcm9tICcuL2NvbW1hbmRzL2RldidcbmltcG9ydCBJbml0IGZyb20gJy4vY29tbWFuZHMvaW5pdCdcbmltcG9ydCBQcm9kIGZyb20gJy4vY29tbWFuZHMvcHJvZCdcbmltcG9ydCBDcmVhdGVQYWdlIGZyb20gJy4vY29tbWFuZHMvY3JlYXRlUGFnZSdcbmltcG9ydCBDcmVhdGVDb21wb25lbnQgZnJvbSAnLi9jb21tYW5kcy9jcmVhdGVDb21wb25lbnQnXG5pbXBvcnQgRW5yb2xsQ29tcG9uZW50IGZyb20gJy4vY29tbWFuZHMvZW5yb2xsQ29tcG9uZW50J1xuXG5leHBvcnQgZGVmYXVsdCBbXG4gICAgbmV3IFByb2QoKSxcbiAgICBuZXcgRGV2KCksXG4gICAgbmV3IEluaXQoKSxcbiAgICBuZXcgQ3JlYXRlUGFnZSgpLFxuICAgIG5ldyBDcmVhdGVDb21wb25lbnQoKSxcbiAgICBuZXcgRW5yb2xsQ29tcG9uZW50KClcbl1cbiIsImltcG9ydCBjb25maWcgZnJvbSAnLi9jb25maWcnXG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tICcuL3V0aWxzJ1xuaW1wb3J0ICogYXMgY2ZvbnRzIGZyb20gJ2Nmb250cydcbmltcG9ydCBjb21tYW5kcyBmcm9tICcuL2NvbW1hbmRzJ1xuaW1wb3J0ICogYXMgY29tbWFuZGVyIGZyb20gJ2NvbW1hbmRlcidcbmltcG9ydCBDb21waWxlciBmcm9tICcuL2NvcmUvY2xhc3MvQ29tcGlsZXInXG5cbmNvbnN0IHBrZ0pzb24gPSByZXF1aXJlKCcuLi9wYWNrYWdlLmpzb24nKVxuXG5yZXF1aXJlKCdzb3VyY2UtbWFwLXN1cHBvcnQnKS5pbnN0YWxsKClcblxuaWYgKHByb2Nlc3MuYXJndi5pbmRleE9mKCctLWRlYnVnJykgPiAtMSkge1xuICAgIGNvbmZpZy5hbmthQ29uZmlnLmRlYnVnID0gdHJ1ZVxufVxuXG5pZiAocHJvY2Vzcy5hcmd2LmluZGV4T2YoJy0tc2xpZW50JykgPiAtMSkge1xuICAgIGNvbmZpZy5hbmthQ29uZmlnLnF1aWV0ID0gdHJ1ZVxufVxuXG5jb21tYW5kZXJcbiAgICAub3B0aW9uKCctLWRlYnVnJywgJ2VuYWJsZSBkZWJ1ZyBtb2RlJylcbiAgICAub3B0aW9uKCctLXF1aWV0JywgJ2hpZGUgY29tcGlsZSBsb2cnKVxuICAgIC52ZXJzaW9uKHBrZ0pzb24udmVyc2lvbilcbiAgICAudXNhZ2UoJzxjb21tYW5kPiBbb3B0aW9uc10nKVxuXG5jb21tYW5kcy5mb3JFYWNoKGNvbW1hbmQgPT4ge1xuICAgIGNvbnN0IGNtZCA9IGNvbW1hbmRlci5jb21tYW5kKGNvbW1hbmQuY29tbWFuZClcblxuICAgIGlmIChjb21tYW5kLmRlc2NyaXB0aW9uKSB7XG4gICAgICAgIGNtZC5kZXNjcmlwdGlvbihjb21tYW5kLmRlc2NyaXB0aW9uKVxuICAgIH1cblxuICAgIGlmIChjb21tYW5kLnVzYWdlKSB7XG4gICAgICAgIGNtZC51c2FnZShjb21tYW5kLnVzYWdlKVxuICAgIH1cblxuICAgIGlmIChjb21tYW5kLm9uKSB7XG4gICAgICAgIGZvciAobGV0IGtleSBpbiBjb21tYW5kLm9uKSB7XG4gICAgICAgICAgICBjbWQub24oa2V5LCBjb21tYW5kLm9uW2tleV0pXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY29tbWFuZC5vcHRpb25zKSB7XG4gICAgICAgIGNvbW1hbmQub3B0aW9ucy5mb3JFYWNoKChvcHRpb246IFthbnksIGFueSwgYW55LCBhbnldKSA9PiB7XG4gICAgICAgICAgICBjbWQub3B0aW9uKC4uLm9wdGlvbilcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAoY29tbWFuZC5hY3Rpb24pIHtcbiAgICAgICAgY21kLmFjdGlvbihhc3luYyAoLi4uYXJncykgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBjb21tYW5kLmFjdGlvbiguLi5hcmdzKVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKGVyci5tZXNzYWdlIHx8ICcnKVxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAoY29tbWFuZC5leGFtcGxlcykge1xuICAgICAgICBjbWQub24oJy0taGVscCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbW1hbmQucHJpbnRUaXRsZSgnRXhhbXBsZXM6JylcbiAgICAgICAgICAgIGNvbW1hbmQuZXhhbXBsZXMuZm9yRWFjaChleGFtcGxlID0+IHtcbiAgICAgICAgICAgICAgICBjb21tYW5kLnByaW50Q29udGVudChleGFtcGxlKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICB9XG59KVxuXG5pZiAocHJvY2Vzcy5hcmd2Lmxlbmd0aCA9PT0gMikge1xuICAgIGNmb250cy5zYXkoJ0Fua2EnLCB7XG4gICAgICAgIGZvbnQ6ICdzaW1wbGUnLFxuICAgICAgICBjb2xvcnM6IFsnZ3JlZW5CcmlnaHQnXVxuICAgIH0pXG4gICAgY29uc29sZS5sb2coJyAgVmVyc2lvbjogJyArIHBrZ0pzb24udmVyc2lvbilcbiAgICBjb21tYW5kZXIub3V0cHV0SGVscCgpXG59XG5cbmNvbW1hbmRlci5wYXJzZShwcm9jZXNzLmFyZ3YpXG5cbmV4cG9ydCBkZWZhdWx0IENvbXBpbGVyXG4iXSwibmFtZXMiOlsicGF0aC5qb2luIiwiZnMuZXhpc3RzU3luYyIsImZzLnJlYWRGaWxlIiwiZnMud3JpdGVGaWxlIiwicGF0aC5kaXJuYW1lIiwicGF0aC5iYXNlbmFtZSIsInBhdGguZXh0bmFtZSIsInBhdGgiLCJmcy5lbnN1cmVGaWxlIiwibG9nIiwiY2hva2lkYXIud2F0Y2giLCJzYXNzLnJlbmRlciIsInV0aWxzLmxvZ2dlciIsInBvc3Rjc3MiLCJ0c2xpYl8xLl9fYXNzaWduIiwidXRpbHMucmVzb2x2ZUNvbmZpZyIsImJhYmVsLnRyYW5zZm9ybVN5bmMiLCJ3cml0ZUZpbGUiLCJsb2dnZXIiLCJ0cy50cmFuc3BpbGVNb2R1bGUiLCJiYWJlbC5wYXJzZSIsImJhYmVsLnRyYW5zZm9ybUZyb21Bc3RTeW5jIiwidXRpbHMuaXNOcG1EZXBlbmRlbmN5IiwidXRpbHMucmVzb2x2ZU1vZHVsZSIsInBhdGgucmVsYXRpdmUiLCJ1dGlscy5jcmVhdGVGaWxlIiwiY3dkIiwiYW5rYURlZmF1bHRDb25maWcudGVtcGxhdGUiLCJhbmthRGVmYXVsdENvbmZpZy5wYXJzZXJzIiwiYW5rYURlZmF1bHRDb25maWcucGx1Z2lucyIsInBhdGgucmVzb2x2ZSIsImN1c3RvbUNvbmZpZyIsInN5c3RlbS5zcmNEaXIiLCJ0c2xpYl8xLl9fZXh0ZW5kcyIsInV0aWxzLmFzeW5jRnVuY3Rpb25XcmFwcGVyIiwidXRpbHMuY2FsbFByb21pc2VJbkNoYWluIiwidXRpbHMuc2VhcmNoRmlsZXMiLCJmcy5lbnN1cmVEaXJTeW5jIiwidXRpbHMuZ2VuRmlsZVdhdGNoZXIiLCJmcy51bmxpbmsiLCJkb3dubG9hZFJlcG8iLCJGc0VkaXRvciIsInBhdGguc2VwIiwiZnMucmVhZEZpbGVTeW5jIiwiY29uZmlnIiwiUHJvZCIsIkRldiIsIkluaXQiLCJDcmVhdGVQYWdlIiwiQ3JlYXRlQ29tcG9uZW50IiwiRW5yb2xsQ29tcG9uZW50IiwiY29tbWFuZGVyXG4gICAgLm9wdGlvbiIsImNvbW1hbmRlci5jb21tYW5kIiwiY2ZvbnRzLnNheSIsImNvbW1hbmRlci5vdXRwdXRIZWxwIiwiY29tbWFuZGVyLnBhcnNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUdBLElBQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQTtBQUV6Qix3QkFBeUIsS0FBeUIsRUFBRSxJQUFhO0lBQXhDLHNCQUFBLEVBQUEsVUFBeUI7SUFDOUMsSUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFBO0lBQ3ZCLElBQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsVUFBQSxJQUFJLElBQUksT0FBQUEsU0FBUyxDQUFDLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUEsQ0FBQyxDQUFBO0lBRW5FLEtBQUssSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFLEtBQUssR0FBRyxXQUFXLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFO1FBQ3JELElBQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQyxLQUFLLENB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
