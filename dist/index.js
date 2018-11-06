#!/usr/bin/env node
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = require('fs');
var path = require('path');
var fs$1 = require('fs-extra');
var chalk = _interopDefault(require('chalk'));
var tslib_1 = require('tslib');
var chokidar = require('chokidar');
var sass = require('node-sass');
var postcssrc = _interopDefault(require('postcss-load-config'));
var acorn = require('acorn');
var escodegen = require('escodegen');
var acornWalker = require('acorn-walk');
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
        err && console.error(err);
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
        if (!option.sourceFile)
            throw new Error('Invalid value: FileConstructorOption.sourceFile');
        if (!option.content)
            throw new Error('Invalid value: FileConstructorOption.content');
        this.sourceFile = option.sourceFile;
        this.targetFile = option.targetFile || option.sourceFile.replace(config.srcDir, config.distDir);
        this.content = option.content;
        this.sourceMap = option.sourceMap;
    }
    Object.defineProperty(File.prototype, "dirname", {
        get: function () {
            return path.dirname(this.sourceFile);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(File.prototype, "basename", {
        get: function () {
            return path.basename(this.sourceFile);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(File.prototype, "extname", {
        get: function () {
            return path.extname(this.sourceFile);
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
        this.editor.writeJSON(filepath, contents, replacer, space);
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
        logger.error('Missing dependency', id, !ankaConfig.quiet ? options : null);
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

var scriptParser = (function (file, compilation, cb) {
    file.updateExt('.js');
    cb();
});

var writeFile$1 = writeFile;
var saveFilePlugin = (function () {
    this.on('after-compile', function (compilation, cb) {
        var file = compilation.file;
        fs$1.ensureFile(file.targetFile).then(function () {
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

var dependencyPool = new Map();
var extractDependencyPlugin = (function () {
    var compiler = this.getCompiler();
    var config = this.getSystemConfig();
    var testNodeModules = new RegExp("^" + config.sourceNodeModules);
    this.on('before-compile', function (compilation, cb) {
        var file = compilation.file;
        var localDependencyPool = new Map();
        if (file.extname === '.js') {
            if (file.ast === void (0)) {
                file.ast = acorn.parse(file.content instanceof Buffer ? file.content.toString() : file.content, {
                    sourceType: 'module'
                });
            }
            acornWalker.simple(file.ast, {
                ImportDeclaration: function (node) {
                    var source = node.source;
                    if (source &&
                        source.value &&
                        source.type === 'Literal' &&
                        typeof source.value === 'string') {
                        resolve(source, file.sourceFile, file.targetFile, localDependencyPool);
                    }
                },
                CallExpression: function (node) {
                    var callee = node.callee;
                    var args = node.arguments;
                    if (args &&
                        callee &&
                        args[0] &&
                        args[0].value &&
                        callee.name === 'require' &&
                        args[0].type === 'Literal' &&
                        typeof args[0].value === 'string') {
                        resolve(args[0], file.sourceFile, file.targetFile, localDependencyPool);
                    }
                }
            });
            file.content = escodegen.generate(file.ast);
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
        var dependency = resolveModule(node.value, {
            paths: [sourceBaseName]
        });
        if (testNodeModules.test(dependency)) {
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
var pages = path.join(sourceDir, './pages');
var components = path.join(sourceDir, './components');
var template = {
    page: path.join(__dirname, '../template/page'),
    component: path.join(__dirname, '../template/component')
};
var subPackages = path.join(sourceDir, './subPackages');
var quiet = false;
var devMode = false;
var parsers = [
    {
        match: /.*\.(js|es)$/,
        parsers: [
            {
                parser: scriptParser,
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
var defaultScaffold = 'direct:https://github.com/iException/anka-quickstart';

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
                            return matchers.match.test(file.targetFile);
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
        var _this = _super.call(this, 'dev [pages...]', 'Development Mode') || this;
        _this.setExamples('$ anka dev', '$ anka dev index', '$ anka dev /pages/log/log /pages/user/user');
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
                        return [4, this.$compiler.launch()];
                    case 1:
                        _a.sent();
                        return [4, this.$compiler.watchFiles()];
                    case 2:
                        _a.sent();
                        logger.success("Startup: " + (Date.now() - startupTime) + "ms", "Anka is waiting for changes...");
                        return [2];
                }
            });
        });
    };
    return DevCommand;
}(Command));

var DevCommand$1 = (function (_super) {
    tslib_1.__extends(DevCommand, _super);
    function DevCommand() {
        var _this = _super.call(this, 'prod', 'Production Mode') || this;
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
                        return [4, this.$compiler.launch()];
                    case 1:
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
        _this.setOptions('-R, --root <subpackage>', 'save page to subpackages');
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
            var CwdRegExp, _a, ankaConfig, projectConfig, pagePath, pageName, context, appConfigPath, absolutePath, rootPath_1, subPkg, tpls;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        CwdRegExp = new RegExp("^" + config.cwd);
                        _a = config, ankaConfig = _a.ankaConfig, projectConfig = _a.projectConfig;
                        pagePath = page.split(path.sep).length === 1 ?
                            path.join(ankaConfig.pages, page, page) : page;
                        pageName = pagePath.split(path.sep).pop();
                        context = {
                            pageName: pageName
                        };
                        appConfigPath = path.join(config.srcDir, 'app.json');
                        absolutePath = config.cwd;
                        if (root) {
                            rootPath_1 = path.join(path.relative(ankaConfig.sourceDir, ankaConfig.subPackages), root);
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

var commands = [
    new DevCommand$1(),
    new DevCommand(),
    new CreatePageCommand()
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlscy9yZXNvbHZlQ29uZmlnLnRzIiwiLi4vc3JjL3V0aWxzL2ZzLnRzIiwiLi4vc3JjL3V0aWxzL2xvZ2dlci50cyIsIi4uL3NyYy9jb3JlL2NsYXNzL0ZpbGUudHMiLCIuLi9zcmMvdXRpbHMvY3JlYXRlRmlsZS50cyIsIi4uL3NyYy91dGlscy9lZGl0b3IudHMiLCIuLi9zcmMvdXRpbHMvcmVzb2x2ZU1vZHVsZS50cyIsIi4uL3NyYy91dGlscy9jYWxsUHJvbWlzZUluQ2hhaW4udHMiLCIuLi9zcmMvdXRpbHMvYXN5bmNGdW5jdGlvbldyYXBwZXIudHMiLCIuLi9zcmMvdXRpbHMvZ2VuRmlsZVdhdGNoZXIudHMiLCIuLi9zcmMvdXRpbHMvaXNOcG1EZXBlbmRlbmN5LnRzIiwiLi4vc3JjL3BhcnNlcnMvc2Fzc1BhcnNlci50cyIsIi4uL3NyYy9wYXJzZXJzL3N0eWxlUGFyc2VyL3Bvc3Rjc3NXeGltcG9ydC50cyIsIi4uL3NyYy9wYXJzZXJzL3N0eWxlUGFyc2VyL2luZGV4LnRzIiwiLi4vc3JjL3BhcnNlcnMvc2NyaXB0UGFyc2VyLnRzIiwiLi4vc3JjL3BsdWdpbnMvc2F2ZUZpbGVQbHVnaW4vaW5kZXgudHMiLCIuLi9zcmMvcGx1Z2lucy9leHRyYWN0RGVwZW5kZW5jeVBsdWdpbi9pbmRleC50cyIsIi4uL3NyYy9jb25maWcvYW5rYURlZmF1bHRDb25maWcudHMiLCIuLi9zcmMvY29uZmlnL2Fua2FDb25maWcudHMiLCIuLi9zcmMvY29uZmlnL3N5c3RlbUNvbmZpZy50cyIsIi4uL3NyYy9jb25maWcvcHJvamVjdENvbmZpZy50cyIsIi4uL3NyYy9jb25maWcvaW5kZXgudHMiLCIuLi9zcmMvY29yZS9jbGFzcy9JbmplY3Rpb24udHMiLCIuLi9zcmMvY29yZS9jbGFzcy9Db21waWxhdGlvbi50cyIsIi4uL3NyYy9jb3JlL2NsYXNzL0NvbXBpbGVyLnRzIiwiLi4vc3JjL2NvcmUvY2xhc3MvQ29tbWFuZC50cyIsIi4uL3NyYy9jb21tYW5kcy9kZXYudHMiLCIuLi9zcmMvY29tbWFuZHMvcHJvZC50cyIsIi4uL3NyYy9jb21tYW5kcy9jcmVhdGVQYWdlLnRzIiwiLi4vc3JjL2NvbW1hbmRzLnRzIiwiLi4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJ1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuXG5jb25zdCBjd2QgPSBwcm9jZXNzLmN3ZCgpXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChuYW1lczogQXJyYXk8c3RyaW5nPiA9IFtdLCByb290Pzogc3RyaW5nKTogT2JqZWN0IHtcbiAgICBjb25zdCBkZWZhdWx0VmFsdWUgPSB7fVxuICAgIGNvbnN0IGNvbmZpZ1BhdGhzID0gbmFtZXMubWFwKG5hbWUgPT4gcGF0aC5qb2luKHJvb3QgfHwgY3dkLCBuYW1lKSlcblxuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBjb25maWdQYXRocy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgY29uc3QgY29uZmlnUGF0aCA9IGNvbmZpZ1BhdGhzW2luZGV4XVxuXG4gICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGNvbmZpZ1BhdGgpKSB7XG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKGRlZmF1bHRWYWx1ZSwgcmVxdWlyZShjb25maWdQYXRoKSlcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZGVmYXVsdFZhbHVlXG59XG4iLCJpbXBvcnQgKiBhcyBHbG9iIGZyb20gJ2dsb2InXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSdcbmNvbnN0IGdsb2IgPSByZXF1aXJlKCdnbG9iJylcblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRGaWxlIChzb3VyY2VGaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxCdWZmZXI+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBmcy5yZWFkRmlsZShzb3VyY2VGaWxlUGF0aCwgKGVyciwgYnVmZmVyKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShidWZmZXIpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlRmlsZSAodGFyZ2V0RmlsZVBhdGg6IHN0cmluZywgY29udGVudDogQ29udGVudCk6IFByb21pc2U8dW5kZWZpbmVkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgZnMud3JpdGVGaWxlKHRhcmdldEZpbGVQYXRoLCBjb250ZW50LCBlcnIgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikgdGhyb3cgZXJyXG4gICAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgfSlcbiAgICB9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VhcmNoRmlsZXMgKHNjaGVtZTogc3RyaW5nLCBvcHRpb25zPzogR2xvYi5JT3B0aW9ucyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBnbG9iKHNjaGVtZSwgb3B0aW9ucywgKGVycjogKEVycm9yIHwgbnVsbCksIGZpbGVzOiBBcnJheTxzdHJpbmc+KTogdm9pZCA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShmaWxlcylcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9KVxufVxuIiwiaW1wb3J0IGNoYWxrIGZyb20gJ2NoYWxrJ1xuY29uc3Qgb3JhID0gcmVxdWlyZSgnb3JhJylcblxuZXhwb3J0IGZ1bmN0aW9uIHRvRml4IChudW1iZXI6IG51bWJlcik6IHN0cmluZyB7XG4gICAgcmV0dXJuICgnMDAnICsgbnVtYmVyKS5zbGljZSgtMilcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRUaW1lICgpOiBzdHJpbmcge1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKClcbiAgICByZXR1cm4gYCR7dG9GaXgobm93LmdldEhvdXJzKCkpfToke3RvRml4KG5vdy5nZXRNaW51dGVzKCkpfToke3RvRml4KG5vdy5nZXRTZWNvbmRzKCkpfWBcbn1cblxuZXhwb3J0IGNsYXNzIExvZ2dlciB7XG4gICAgb3JhSW5zdGFuY2U6IGFueVxuXG4gICAgZ2V0IHRpbWUgKCkge1xuICAgICAgICByZXR1cm4gY2hhbGsuZ3JleShgWyR7Z2V0Q3VycmVudFRpbWUoKX1dYClcbiAgICB9XG5cbiAgICBzdGFydExvYWRpbmcgKG1zZzogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMub3JhSW5zdGFuY2UgPSBvcmEobXNnKS5zdGFydCgpXG4gICAgfVxuXG4gICAgc3RvcExvYWRpbmcgKCkge1xuICAgICAgICB0aGlzLm9yYUluc3RhbmNlICYmIHRoaXMub3JhSW5zdGFuY2Uuc3RvcCgpXG4gICAgfVxuXG4gICAgbG9nICguLi5tc2c6IEFycmF5PHN0cmluZz4pIHtcbiAgICAgICAgcmV0dXJuIGNvbnNvbGUubG9nKHRoaXMudGltZSwgLi4ubXNnKVxuICAgIH1cblxuICAgIGVycm9yICh0aXRsZTogc3RyaW5nID0gJycsIG1zZzogc3RyaW5nID0gJycsIGVycj86IEVycm9yKSB7XG4gICAgICAgIHRoaXMubG9nKGNoYWxrLnJlZCgn4pyYJyksIGNoYWxrLnJlc2V0KHRpdGxlKSwgY2hhbGsuZ3JleShtc2cpKVxuICAgICAgICBlcnIgJiYgY29uc29sZS5lcnJvcihlcnIpXG4gICAgfVxuXG4gICAgaW5mbyAodGl0bGU6IHN0cmluZyA9ICcnLCBtc2c6IHN0cmluZyA9ICcnKSB7XG4gICAgICAgIHRoaXMubG9nKGNoYWxrLmN5YW4oJ+KXiycpLCBjaGFsay5yZXNldCh0aXRsZSksIGNoYWxrLmdyZXkobXNnKSlcbiAgICB9XG5cbiAgICB3YXJuICh0aXRsZTogc3RyaW5nID0gJycsIG1zZzogc3RyaW5nID0gJycpIHtcbiAgICAgICAgdGhpcy5sb2coY2hhbGsueWVsbG93KCfimqAnKSwgY2hhbGsucmVzZXQodGl0bGUpLCBjaGFsay5ncmV5KG1zZykpXG4gICAgfVxuXG4gICAgc3VjY2VzcyAodGl0bGU6IHN0cmluZyA9ICcnLCBtc2c6IHN0cmluZyA9ICcnKSB7XG4gICAgICAgIHRoaXMubG9nKGNoYWxrLmdyZWVuKCfinJQnKSwgY2hhbGsucmVzZXQodGl0bGUpLCBjaGFsay5ncmV5KG1zZykpXG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBuZXcgTG9nZ2VyKClcbiIsImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIGFjb3JuIGZyb20gJ2Fjb3JuJ1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnXG5pbXBvcnQgY29uZmlnIGZyb20gJy4uLy4uL2NvbmZpZydcblxuY29uc3QgcmVwbGFjZUV4dCA9IHJlcXVpcmUoJ3JlcGxhY2UtZXh0JylcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRmlsZSB7XG4gICAgcHVibGljIHNvdXJjZUZpbGU6IHN0cmluZ1xuICAgIHB1YmxpYyBjb250ZW50OiBDb250ZW50XG4gICAgcHVibGljIHRhcmdldEZpbGU6IHN0cmluZ1xuICAgIHB1YmxpYyBhc3Q/OiBhY29ybi5Ob2RlXG4gICAgcHVibGljIHNvdXJjZU1hcD86IENvbnRlbnRcblxuICAgIGNvbnN0cnVjdG9yIChvcHRpb246IEZpbGVDb25zdHJ1Y3Rvck9wdGlvbikge1xuICAgICAgICBpZiAoIW9wdGlvbi5zb3VyY2VGaWxlKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgdmFsdWU6IEZpbGVDb25zdHJ1Y3Rvck9wdGlvbi5zb3VyY2VGaWxlJylcbiAgICAgICAgaWYgKCFvcHRpb24uY29udGVudCkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHZhbHVlOiBGaWxlQ29uc3RydWN0b3JPcHRpb24uY29udGVudCcpXG5cbiAgICAgICAgdGhpcy5zb3VyY2VGaWxlID0gb3B0aW9uLnNvdXJjZUZpbGVcbiAgICAgICAgdGhpcy50YXJnZXRGaWxlID0gb3B0aW9uLnRhcmdldEZpbGUgfHwgb3B0aW9uLnNvdXJjZUZpbGUucmVwbGFjZShjb25maWcuc3JjRGlyLCBjb25maWcuZGlzdERpcikgLy8gRGVmYXVsdCB2YWx1ZVxuICAgICAgICB0aGlzLmNvbnRlbnQgPSBvcHRpb24uY29udGVudFxuICAgICAgICB0aGlzLnNvdXJjZU1hcCA9IG9wdGlvbi5zb3VyY2VNYXBcbiAgICB9XG5cbiAgICBnZXQgZGlybmFtZSAoKSB7XG4gICAgICAgIHJldHVybiBwYXRoLmRpcm5hbWUodGhpcy5zb3VyY2VGaWxlKVxuICAgIH1cblxuICAgIGdldCBiYXNlbmFtZSAoKSB7XG4gICAgICAgIHJldHVybiBwYXRoLmJhc2VuYW1lKHRoaXMuc291cmNlRmlsZSlcbiAgICB9XG5cbiAgICBnZXQgZXh0bmFtZSAoKSB7XG4gICAgICAgIHJldHVybiBwYXRoLmV4dG5hbWUodGhpcy5zb3VyY2VGaWxlKVxuICAgIH1cblxuICAgIGFzeW5jIHNhdmVUbyAocGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGF3YWl0IGZzLmVuc3VyZUZpbGUocGF0aClcblxuICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwYXRoJylcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVwZGF0ZUV4dCAoZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgdGhpcy50YXJnZXRGaWxlID0gcmVwbGFjZUV4dCh0aGlzLnRhcmdldEZpbGUsIGV4dClcbiAgICB9XG59XG4iLCJpbXBvcnQge1xuICAgIHJlYWRGaWxlXG59IGZyb20gJy4vZnMnXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSdcbmltcG9ydCBGaWxlIGZyb20gJy4uL2NvcmUvY2xhc3MvRmlsZSdcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUZpbGUgKHNvdXJjZUZpbGU6IHN0cmluZyk6IFByb21pc2U8RmlsZT4ge1xuICAgIHJldHVybiByZWFkRmlsZShzb3VyY2VGaWxlKS50aGVuKGNvbnRlbnQgPT4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5ldyBGaWxlKHtcbiAgICAgICAgICAgIHNvdXJjZUZpbGUsXG4gICAgICAgICAgICBjb250ZW50XG4gICAgICAgIH0pKVxuICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVGaWxlU3luYyAoc291cmNlRmlsZTogc3RyaW5nKSB7XG4gICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhzb3VyY2VGaWxlKVxuICAgIHJldHVybiBuZXcgRmlsZSh7XG4gICAgICAgIHNvdXJjZUZpbGUsXG4gICAgICAgIGNvbnRlbnRcbiAgICB9KVxufVxuIiwiaW1wb3J0IHsgT3B0aW9ucyBhcyBUZW1wbGF0ZU9wdGlvbnMgfSBmcm9tICdlanMnXG5pbXBvcnQgeyBtZW1Gc0VkaXRvciBhcyBNZW1Gc0VkaXRvciB9IGZyb20gJ21lbS1mcy1lZGl0b3InXG5cbmNvbnN0IG1lbUZzID0gcmVxdWlyZSgnbWVtLWZzJylcbmNvbnN0IG1lbUZzRWRpdG9yID0gcmVxdWlyZSgnbWVtLWZzLWVkaXRvcicpXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZzRWRpdG9yIHtcbiAgICBlZGl0b3I6IE1lbUZzRWRpdG9yLkVkaXRvclxuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgY29uc3Qgc3RvcmUgPSBtZW1Gcy5jcmVhdGUoKVxuXG4gICAgICAgIHRoaXMuZWRpdG9yID0gbWVtRnNFZGl0b3IuY3JlYXRlKHN0b3JlKVxuICAgIH1cblxuICAgIGNvcHkgKGZyb206IHN0cmluZywgdG86IHN0cmluZywgY29udGV4dDogb2JqZWN0LCB0ZW1wbGF0ZU9wdGlvbnM/OiBUZW1wbGF0ZU9wdGlvbnMsIGNvcHlPcHRpb25zPzogTWVtRnNFZGl0b3IuQ29weU9wdGlvbnMpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5lZGl0b3IuY29weVRwbChmcm9tLCB0bywgY29udGV4dCwgdGVtcGxhdGVPcHRpb25zLCBjb3B5T3B0aW9ucylcbiAgICB9XG5cbiAgICB3cml0ZSAoZmlsZXBhdGg6IHN0cmluZywgY29udGVudHM6IE1lbUZzRWRpdG9yLkNvbnRlbnRzKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZWRpdG9yLndyaXRlKGZpbGVwYXRoLCBjb250ZW50cylcbiAgICB9XG5cbiAgICB3cml0ZUpTT04gKGZpbGVwYXRoOiBzdHJpbmcsIGNvbnRlbnRzOiBhbnksIHJlcGxhY2VyPzogTWVtRnNFZGl0b3IuUmVwbGFjZXJGdW5jLCBzcGFjZT86IE1lbUZzRWRpdG9yLlNwYWNlKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZWRpdG9yLndyaXRlSlNPTihmaWxlcGF0aCwgY29udGVudHMsIHJlcGxhY2VyLCBzcGFjZSlcbiAgICB9XG5cbiAgICByZWFkIChmaWxlcGF0aDogc3RyaW5nLCBvcHRpb25zPzogeyByYXc6IGJvb2xlYW4sIGRlZmF1bHRzOiBzdHJpbmcgfSk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLmVkaXRvci5yZWFkKGZpbGVwYXRoLCBvcHRpb25zKVxuICAgIH1cblxuICAgIHJlYWRKU09OIChmaWxlcGF0aDogc3RyaW5nLCBkZWZhdWx0cz86IGFueSk6IHZvaWQge1xuICAgICAgICB0aGlzLmVkaXRvci5yZWFkSlNPTihmaWxlcGF0aCwgZGVmYXVsdHMpXG4gICAgfVxuXG4gICAgc2F2ZSAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgdGhpcy5lZGl0b3IuY29tbWl0KHJlc29sdmUpXG4gICAgICAgIH0pXG4gICAgfVxufVxuIiwiaW1wb3J0IGxvZyBmcm9tICcuL2xvZ2dlcidcbmltcG9ydCBhbmthQ29uZmlnIGZyb20gJy4uL2NvbmZpZy9hbmthQ29uZmlnJ1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAoaWQ6IHN0cmluZywgb3B0aW9ucz86IHsgcGF0aHM/OiBzdHJpbmdbXSB9KSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUucmVzb2x2ZShpZCwgb3B0aW9ucylcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgbG9nLmVycm9yKCdNaXNzaW5nIGRlcGVuZGVuY3knLCBpZCwgIWFua2FDb25maWcucXVpZXQgPyBvcHRpb25zIDogbnVsbClcbiAgICB9XG59XG4iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjYWxsUHJvbWlzZUluQ2hhaW4gKGxpc3Q6IEFycmF5PCguLi5wYXJhbXM6IGFueVtdKSA9PiBQcm9taXNlPGFueT4+ID0gW10sIC4uLnBhcmFtczogQXJyYXk8YW55Pikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGlmICghbGlzdC5sZW5ndGgpICB7XG4gICAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIGxldCBzdGVwID0gbGlzdFswXSguLi5wYXJhbXMpXG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBzdGVwID0gc3RlcC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGlzdFtpXSguLi5wYXJhbXMpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgc3RlcC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgfSwgZXJyID0+IHtcbiAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgIH0pXG4gICAgfSlcbn1cbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChmbjogRnVuY3Rpb24pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKC4uLnBhcmFtczogQXJyYXk8YW55Pikge1xuICAgICAgICBjb25zdCBsaW1pdGF0aW9uID0gcGFyYW1zLmxlbmd0aFxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIGlmIChmbi5sZW5ndGggPiBsaW1pdGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgZm4oLi4ucGFyYW1zLCByZXNvbHZlKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKGZuKC4uLnBhcmFtcykpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgY2hva2lkYXIgZnJvbSAnY2hva2lkYXInXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChkaXI6IHN0cmluZyB8IHN0cmluZ1tdLCBvcHRpb25zPzogY2hva2lkYXIuV2F0Y2hPcHRpb25zKSB7XG4gICAgcmV0dXJuIGNob2tpZGFyLndhdGNoKGRpciwge1xuICAgICAgICBwZXJzaXN0ZW50OiB0cnVlLFxuICAgICAgICBpZ25vcmVJbml0aWFsOiB0cnVlLFxuICAgICAgICAuLi5vcHRpb25zXG4gICAgfSlcbn1cbiIsImRlY2xhcmUgdHlwZSBWYWxpZGF0ZU5wbVBhY2thZ2VOYW1lID0ge1xuICAgIHZhbGlkRm9yTmV3UGFja2FnZXM6IGJvb2xlYW4sXG4gICAgdmFsaWRGb3JPbGRQYWNrYWdlczogYm9vbGVhblxufVxuXG5jb25zdCB2YWxpZGF0ZSA9IHJlcXVpcmUoJ3ZhbGlkYXRlLW5wbS1wYWNrYWdlLW5hbWUnKVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAocmVxdWlyZWQ6IHN0cmluZyA9ICcnKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gPFZhbGlkYXRlTnBtUGFja2FnZU5hbWU+dmFsaWRhdGUocmVxdWlyZWQuc3BsaXQoJy8nKS5zbGljZSgwLCAyKS5qb2luKCcvJykpXG5cbiAgICByZXR1cm4gcmVzdWx0LnZhbGlkRm9yTmV3UGFja2FnZXMgfHwgcmVzdWx0LnZhbGlkRm9yT2xkUGFja2FnZXNcbn1cbiIsImltcG9ydCBjb25maWcgZnJvbSAnLi4vY29uZmlnJ1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vdXRpbHMnXG5pbXBvcnQgKiBhcyBzYXNzIGZyb20gJ25vZGUtc2FzcydcbmltcG9ydCBGaWxlIGZyb20gJy4uL2NvcmUvY2xhc3MvRmlsZSdcblxuLyoqXG4gKiBTYXNzIGZpbGUgcGFyc2VyLlxuICogQGZvciBhbnkgZmlsZSB0aGF0IGRvZXMgbm90IG1hdGNoZSBwYXJzZXJzLlxuICovXG5leHBvcnQgZGVmYXVsdCA8UGFyc2VyPmZ1bmN0aW9uICh0aGlzOiBQYXJzZXJJbmplY3Rpb24sIGZpbGU6IEZpbGUsIGNvbXBpbGF0aW9uOiBDb21waWxhdGlvbiwgY2FsbGJhY2s/OiBGdW5jdGlvbikge1xuICAgIGZpbGUuY29udGVudCA9IGZpbGUuY29udGVudCBpbnN0YW5jZW9mIEJ1ZmZlciA/IGZpbGUuY29udGVudC50b1N0cmluZygpIDogZmlsZS5jb250ZW50XG5cbiAgICBzYXNzLnJlbmRlcih7XG4gICAgICAgIGZpbGU6IGZpbGUuc291cmNlRmlsZSxcbiAgICAgICAgZGF0YTogZmlsZS5jb250ZW50LFxuICAgICAgICBvdXRwdXRTdHlsZTogIWNvbmZpZy5hbmthQ29uZmlnLmRldk1vZGUgPyAnbmVzdGVkJyA6ICdjb21wcmVzc2VkJ1xuICAgIH0sIChlcnI6IEVycm9yLCByZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICB1dGlscy5sb2dnZXIuZXJyb3IoJ0NvbXBpbGUnLCBlcnIubWVzc2FnZSwgZXJyKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZmlsZS5jb250ZW50ID0gcmVzdWx0LmNzc1xuICAgICAgICAgICAgZmlsZS51cGRhdGVFeHQoJy53eHNzJylcbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjaygpXG4gICAgfSlcbn1cbiIsImNvbnN0IHBvc3Rjc3MgPSByZXF1aXJlKCdwb3N0Y3NzJylcblxuZXhwb3J0IGRlZmF1bHQgcG9zdGNzcy5wbHVnaW4oJ3Bvc3Rjc3Mtd3hpbXBvcnQnLCAoKSA9PiB7XG4gICAgcmV0dXJuIChyb290OiBhbnkpID0+IHtcbiAgICAgICAgcm9vdC53YWxrQXRSdWxlcygnd3hpbXBvcnQnLCAocnVsZTogYW55KSA9PiB7XG4gICAgICAgICAgICBydWxlLm5hbWUgPSAnaW1wb3J0J1xuICAgICAgICAgICAgcnVsZS5wYXJhbXMgPSBydWxlLnBhcmFtcy5yZXBsYWNlKC9cXC5cXHcrKD89WydcIl0kKS8sICcud3hzcycpXG4gICAgICAgIH0pXG4gICAgfVxufSlcbiIsImltcG9ydCAqIGFzIFBvc3Rjc3MgZnJvbSAncG9zdGNzcydcbmltcG9ydCBwb3N0Y3NzcmMgZnJvbSAncG9zdGNzcy1sb2FkLWNvbmZpZydcbmltcG9ydCBwb3N0Y3NzV3hJbXBvcnQgZnJvbSAnLi9wb3N0Y3NzV3hpbXBvcnQnXG5cbmNvbnN0IHBvc3Rjc3MgPSByZXF1aXJlKCdwb3N0Y3NzJylcbmNvbnN0IHBvc3Rjc3NDb25maWc6IGFueSA9IHt9XG5cbi8qKlxuICogU3R5bGUgZmlsZSBwYXJzZXIuXG4gKiBAZm9yIC53eHNzIC5jc3MgPT4gLnd4c3NcbiAqL1xuZXhwb3J0IGRlZmF1bHQgPFBhcnNlcj5mdW5jdGlvbiAodGhpczogUGFyc2VySW5qZWN0aW9uLCBmaWxlOiBGaWxlLCBjb21waWxhdGlvbjogQ29tcGlsYXRpb24sIGNiOiBGdW5jdGlvbik6IHZvaWQge1xuICAgIGdlblBvc3Rjc3NDb25maWcoKS50aGVuKChjb25maWc6IGFueSkgPT4ge1xuICAgICAgICBmaWxlLmNvbnRlbnQgPSBmaWxlLmNvbnRlbnQgaW5zdGFuY2VvZiBCdWZmZXIgPyBmaWxlLmNvbnRlbnQudG9TdHJpbmcoKSA6IGZpbGUuY29udGVudFxuXG4gICAgICAgIHJldHVybiBwb3N0Y3NzKGNvbmZpZy5wbHVnaW5zLmNvbmNhdChbcG9zdGNzc1d4SW1wb3J0XSkpLnByb2Nlc3MoZmlsZS5jb250ZW50LCB7XG4gICAgICAgICAgICAuLi5jb25maWcub3B0aW9ucyxcbiAgICAgICAgICAgIGZyb206IGZpbGUuc291cmNlRmlsZVxuICAgICAgICB9IGFzIFBvc3Rjc3MuUHJvY2Vzc09wdGlvbnMpXG4gICAgfSkudGhlbigocm9vdDogUG9zdGNzcy5MYXp5UmVzdWx0KSA9PiB7XG4gICAgICAgIGZpbGUuY29udGVudCA9IHJvb3QuY3NzXG4gICAgICAgIGZpbGUudXBkYXRlRXh0KCcud3hzcycpXG4gICAgICAgIGNiKClcbiAgICB9KVxufVxuXG5cbmZ1bmN0aW9uIGdlblBvc3Rjc3NDb25maWcgKCkge1xuICAgIHJldHVybiBwb3N0Y3NzQ29uZmlnLnBsdWdpbnMgPyBQcm9taXNlLnJlc29sdmUocG9zdGNzc0NvbmZpZykgOiBwb3N0Y3NzcmMoe30pLnRoZW4oKGNvbmZpZzogYW55KSA9PiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoT2JqZWN0LmFzc2lnbihwb3N0Y3NzQ29uZmlnLCBjb25maWcpKVxuICAgIH0pXG59XG4iLCJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgY29uZmlnIGZyb20gJy4uL2NvbmZpZydcbmltcG9ydCBGaWxlIGZyb20gJy4uL2NvcmUvY2xhc3MvRmlsZSdcblxuLyoqXG4gKiBTY3JpcHQgRmlsZSBwYXJzZXIuXG4gKiBAZm9yIC5qcyAuZXNcbiAqL1xuZXhwb3J0IGRlZmF1bHQgPFBhcnNlcj5mdW5jdGlvbiAodGhpczogUGFyc2VySW5qZWN0aW9uLCBmaWxlOiBGaWxlLCBjb21waWxhdGlvbjogQ29tcGlsYXRpb24sIGNiOiBGdW5jdGlvbikge1xuICAgIC8vIHRoaXMucmVzb3VyY2VUeXBlID0gUkVTT1VSQ0VfVFlQRS5PVEhFUlxuICAgIC8vIGZpbGUudGFyZ2V0RmlsZSA9IGZpbGUudGFyZ2V0RmlsZS5yZXBsYWNlKGNvbmZpZy5zcmNEaXIsIGNvbmZpZy5kaXN0RGlyKVxuICAgIGZpbGUudXBkYXRlRXh0KCcuanMnKVxuICAgIGNiKClcbn1cbiIsImltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uLy4uL3V0aWxzJ1xuaW1wb3J0IGxvZ2dlciBmcm9tICcuLi8uLi91dGlscy9sb2dnZXInXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSdcblxuY29uc3QgeyB3cml0ZUZpbGUgfSA9IHV0aWxzXG5cbmV4cG9ydCBkZWZhdWx0IDxQbHVnaW4+ZnVuY3Rpb24gKHRoaXM6IFBsdWdpbkluamVjdGlvbikge1xuICAgIHRoaXMub24oJ2FmdGVyLWNvbXBpbGUnLCA8UGx1Z2luSGFuZGxlcj5mdW5jdGlvbiAoY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYjogRnVuY3Rpb24pIHtcbiAgICAgICAgY29uc3QgZmlsZSA9IGNvbXBpbGF0aW9uLmZpbGVcblxuICAgICAgICAvLyBUT0RPOiBVc2UgbWVtLWZzXG4gICAgICAgIGZzLmVuc3VyZUZpbGUoZmlsZS50YXJnZXRGaWxlKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB3cml0ZUZpbGUoZmlsZS50YXJnZXRGaWxlLCBmaWxlLmNvbnRlbnQpXG4gICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgY29tcGlsYXRpb24uZGVzdHJveSgpXG4gICAgICAgICAgICBjYigpXG4gICAgICAgIH0sIGVyciA9PiB7XG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yJywgZXJyLm1lc3NhZ2UsIGVycilcbiAgICAgICAgICAgIGNvbXBpbGF0aW9uLmRlc3Ryb3koKVxuICAgICAgICAgICAgY2IoKVxuICAgICAgICB9KVxuICAgIH0pXG59XG4iLCJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgKiBhcyBhY29ybiBmcm9tICdhY29ybidcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uLy4uL3V0aWxzJ1xuaW1wb3J0ICogYXMgZXNjb2RlZ2VuIGZyb20gJ2VzY29kZWdlbidcbmltcG9ydCAqIGFzIGFjb3JuV2Fsa2VyIGZyb20gJ2Fjb3JuLXdhbGsnXG5cbmNvbnN0IGRlcGVuZGVuY3lQb29sID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKVxuXG5leHBvcnQgZGVmYXVsdCA8UGx1Z2luPiBmdW5jdGlvbiAodGhpczogUGx1Z2luSW5qZWN0aW9uKSB7XG4gICAgY29uc3QgY29tcGlsZXIgPSB0aGlzLmdldENvbXBpbGVyKClcbiAgICBjb25zdCBjb25maWcgPSB0aGlzLmdldFN5c3RlbUNvbmZpZygpXG4gICAgY29uc3QgdGVzdE5vZGVNb2R1bGVzID0gbmV3IFJlZ0V4cChgXiR7Y29uZmlnLnNvdXJjZU5vZGVNb2R1bGVzfWApXG5cbiAgICB0aGlzLm9uKCdiZWZvcmUtY29tcGlsZScsIGZ1bmN0aW9uIChjb21waWxhdGlvbjogQ29tcGlsYXRpb24sIGNiOiBGdW5jdGlvbikge1xuICAgICAgICBjb25zdCBmaWxlID0gY29tcGlsYXRpb24uZmlsZVxuICAgICAgICBjb25zdCBsb2NhbERlcGVuZGVuY3lQb29sID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKVxuXG4gICAgICAgIC8vIE9ubHkgcmVzb2x2ZSBqcyBmaWxlLlxuICAgICAgICBpZiAoZmlsZS5leHRuYW1lID09PSAnLmpzJykge1xuICAgICAgICAgICAgaWYgKGZpbGUuYXN0ID09PSB2b2lkICgwKSkge1xuICAgICAgICAgICAgICAgIGZpbGUuYXN0ID0gYWNvcm4ucGFyc2UoXG4gICAgICAgICAgICAgICAgICAgIGZpbGUuY29udGVudCBpbnN0YW5jZW9mIEJ1ZmZlciA/IGZpbGUuY29udGVudC50b1N0cmluZygpIDogZmlsZS5jb250ZW50LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VUeXBlOiAnbW9kdWxlJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYWNvcm5XYWxrZXIuc2ltcGxlIChmaWxlLmFzdCwge1xuICAgICAgICAgICAgICAgIEltcG9ydERlY2xhcmF0aW9uIChub2RlOiBhbnkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc291cmNlID0gbm9kZS5zb3VyY2VcblxuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2UgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZS52YWx1ZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlLnR5cGUgPT09ICdMaXRlcmFsJyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIHNvdXJjZS52YWx1ZSA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHNvdXJjZSwgZmlsZS5zb3VyY2VGaWxlLCBmaWxlLnRhcmdldEZpbGUsIGxvY2FsRGVwZW5kZW5jeVBvb2wpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIENhbGxFeHByZXNzaW9uIChub2RlOiBhbnkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2FsbGVlID0gbm9kZS5jYWxsZWVcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXJncyA9IG5vZGUuYXJndW1lbnRzXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgYXJncyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGVlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzWzBdICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzWzBdLnZhbHVlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsZWUubmFtZSA9PT0gJ3JlcXVpcmUnICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzWzBdLnR5cGUgPT09ICdMaXRlcmFsJyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIGFyZ3NbMF0udmFsdWUgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShhcmdzWzBdLCBmaWxlLnNvdXJjZUZpbGUsIGZpbGUudGFyZ2V0RmlsZSwgbG9jYWxEZXBlbmRlbmN5UG9vbClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBmaWxlLmNvbnRlbnQgPSBlc2NvZGVnZW4uZ2VuZXJhdGUoZmlsZS5hc3QpXG5cbiAgICAgICAgICAgIGNvbnN0IGRlcGVuZGVuY3lMaXN0ID0gQXJyYXkuZnJvbShsb2NhbERlcGVuZGVuY3lQb29sLmtleXMoKSkuZmlsdGVyKGRlcGVuZGVuY3kgPT4gIWRlcGVuZGVuY3lQb29sLmhhcyhkZXBlbmRlbmN5KSlcblxuICAgICAgICAgICAgUHJvbWlzZS5hbGwoZGVwZW5kZW5jeUxpc3QubWFwKGRlcGVuZGVuY3kgPT4gdHJhdmVyc2VOcG1EZXBlbmRlbmN5KGRlcGVuZGVuY3kpKSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgY2IoKVxuICAgICAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBjYigpXG4gICAgICAgICAgICAgICAgdXRpbHMubG9nZ2VyLmVycm9yKGZpbGUuc291cmNlRmlsZSwgZXJyLm1lc3NhZ2UsIGVycilcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYigpXG4gICAgICAgIH1cbiAgICB9IGFzIFBsdWdpbkhhbmRsZXIpXG5cbiAgICBmdW5jdGlvbiByZXNvbHZlIChub2RlOiBhbnksIHNvdXJjZUZpbGU6IHN0cmluZywgdGFyZ2V0RmlsZTogc3RyaW5nLCBsb2NhbERlcGVuZGVuY3lQb29sOiBNYXA8c3RyaW5nLCBzdHJpbmc+KSB7XG4gICAgICAgIGNvbnN0IHNvdXJjZUJhc2VOYW1lID0gcGF0aC5kaXJuYW1lKHNvdXJjZUZpbGUpXG4gICAgICAgIGNvbnN0IHRhcmdldEJhc2VOYW1lID0gcGF0aC5kaXJuYW1lKHRhcmdldEZpbGUpXG4gICAgICAgIGNvbnN0IGRlcGVuZGVuY3kgPSB1dGlscy5yZXNvbHZlTW9kdWxlKG5vZGUudmFsdWUsIHtcbiAgICAgICAgICAgIHBhdGhzOiBbc291cmNlQmFzZU5hbWVdXG4gICAgICAgIH0pXG5cbiAgICAgICAgaWYgKHRlc3ROb2RlTW9kdWxlcy50ZXN0KGRlcGVuZGVuY3kpKSB7XG4gICAgICAgICAgICBjb25zdCBkaXN0UGF0aCA9IGRlcGVuZGVuY3kucmVwbGFjZShjb25maWcuc291cmNlTm9kZU1vZHVsZXMsIGNvbmZpZy5kaXN0Tm9kZU1vZHVsZXMpXG5cbiAgICAgICAgICAgIG5vZGUudmFsdWUgPSBwYXRoLnJlbGF0aXZlKHRhcmdldEJhc2VOYW1lLCBkaXN0UGF0aClcblxuICAgICAgICAgICAgaWYgKGxvY2FsRGVwZW5kZW5jeVBvb2wuaGFzKGRlcGVuZGVuY3kpKSByZXR1cm5cbiAgICAgICAgICAgIGxvY2FsRGVwZW5kZW5jeVBvb2wuc2V0KGRlcGVuZGVuY3ksIGRlcGVuZGVuY3kpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBmdW5jdGlvbiB0cmF2ZXJzZU5wbURlcGVuZGVuY3kgKGRlcGVuZGVuY3k6IHN0cmluZykge1xuICAgICAgICBkZXBlbmRlbmN5UG9vbC5zZXQoZGVwZW5kZW5jeSwgZGVwZW5kZW5jeSlcbiAgICAgICAgY29uc3QgZmlsZSA9IGF3YWl0IHV0aWxzLmNyZWF0ZUZpbGUoZGVwZW5kZW5jeSlcblxuICAgICAgICBmaWxlLnRhcmdldEZpbGUgPSBmaWxlLnNvdXJjZUZpbGUucmVwbGFjZShjb25maWcuc291cmNlTm9kZU1vZHVsZXMsIGNvbmZpZy5kaXN0Tm9kZU1vZHVsZXMpXG4gICAgICAgIGF3YWl0IGNvbXBpbGVyLmdlbmVyYXRlQ29tcGlsYXRpb24oZmlsZSkucnVuKClcbiAgICB9XG5cbn1cbiIsIi8vIGltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBzYXNzUGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvc2Fzc1BhcnNlcidcbmltcG9ydCBmaWxlUGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvZmlsZVBhcnNlcidcbmltcG9ydCBzdHlsZVBhcnNlciBmcm9tICcuLi9wYXJzZXJzL3N0eWxlUGFyc2VyJ1xuaW1wb3J0IHNjcmlwdFBhcnNlciBmcm9tICcuLi9wYXJzZXJzL3NjcmlwdFBhcnNlcidcbmltcG9ydCB0ZW1wbGF0ZVBhcnNlciBmcm9tICcuLi9wYXJzZXJzL3RlbXBsYXRlUGFyc2VyJ1xuaW1wb3J0IHNhdmVGaWxlUGx1Z2luIGZyb20gJy4uL3BsdWdpbnMvc2F2ZUZpbGVQbHVnaW4nXG5pbXBvcnQgZXh0cmFjdERlcGVuZGVuY3lQbHVnaW4gZnJvbSAnLi4vcGx1Z2lucy9leHRyYWN0RGVwZW5kZW5jeVBsdWdpbidcblxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICAgICAgICAgICAgICAgICAgIERhbmdlciB6b25lXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbi8qKlxuICogVGhlIHBhdGggd2hlcmUgV2VDaGF0IG1pbmlwcm9ncmFtIHNvdXJjZSBmaWxlcyBleGlzdC5cbiAqIEBkZWZhdWx0ICcuL3NyYydcbiAqL1xuZXhwb3J0IGNvbnN0IHNvdXJjZURpciA9ICcuL3NyYydcblxuLyoqXG4gKiBUaGUgcGF0aCB3aGVyZSBXZUNoYXQgbWluaXByb2dyYW0gY29tcGlsZWQgZmlsZXMgZXhpc3QuXG4gKiBAZGVmYXVsdCAnLi9kaXN0J1xuICovXG5leHBvcnQgY29uc3Qgb3V0cHV0RGlyID0gJy4vZGlzdCdcblxuLyoqXG4gKiBUaGUgcGF0aCB3aGVyZSBXZUNoYXQgbWluaXByb2dyYW0gcGFnZXMgZXhpc3QuXG4gKiBAZGVmYXVsdCAnLi9zcmMvcGFnZXMnXG4gKi9cbmV4cG9ydCBjb25zdCBwYWdlcyA9IHBhdGguam9pbihzb3VyY2VEaXIsICcuL3BhZ2VzJylcblxuLyoqXG4gKiBUaGUgcGF0aCB3aGVyZSBXZUNoYXQgbWluaXByb2dyYW0gY29tcG9uZW50cyBleGlzdC5cbiAqIEBkZWZhdWx0ICcuL3NyYy9jb21wb25lbnRzJ1xuICovXG5leHBvcnQgY29uc3QgY29tcG9uZW50cyA9IHBhdGguam9pbihzb3VyY2VEaXIsICcuL2NvbXBvbmVudHMnKVxuXG4vKipcbiAqIFRlbXBsYXRlIGZvciBjcmVhdGluZyBwYWdlIGFuZCBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCBjb25zdCB0ZW1wbGF0ZSA9IHtcbiAgICBwYWdlOiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vdGVtcGxhdGUvcGFnZScpLFxuICAgIGNvbXBvbmVudDogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL3RlbXBsYXRlL2NvbXBvbmVudCcpXG59XG5cbi8qKlxuICogVGhlIHBhdGggd2hlcmUgV2VDaGF0IG1pbmlwcm9ncmFtIHN1YnBhY2thZ2VzIGV4aXN0LlxuICogQGRlZmF1bHQgJy4vc3JjL3N1YlBhY2thZ2VzJ1xuICovXG5leHBvcnQgY29uc3Qgc3ViUGFja2FnZXMgPSBwYXRoLmpvaW4oc291cmNlRGlyLCAnLi9zdWJQYWNrYWdlcycpXG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogICAgICAgICAgICAgICAgIEN1c3RvbSBjb25maWd1cmVcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuLyoqXG4gKiBXaGV0aGVyIHRvIG91dHB1dCBjb21waWxlIGluZm9ybWF0aW9uLlxuICogQGRlZmF1bHQgZmFsc2VcbiAqL1xuZXhwb3J0IGNvbnN0IHF1aWV0ID0gZmFsc2VcblxuLyoqXG4gKiBBbmthIGRldmVsb3BtZW50IG1vZGUuXG4gKiBAZGVmYXVsdCBmYWxzZVxuICovXG5leHBvcnQgY29uc3QgZGV2TW9kZSA9IGZhbHNlXG5cbi8qKlxuICogUmVnaXN0ZXIgZmlsZSBwYXJzZXIuXG4gKi9cbmV4cG9ydCBjb25zdCBwYXJzZXJzOiBQYXJzZXJzQ29uZmlncmF0aW9uID0gW1xuICAgIHtcbiAgICAgICAgbWF0Y2g6IC8uKlxcLihqc3xlcykkLyxcbiAgICAgICAgcGFyc2VyczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcnNlcjogc2NyaXB0UGFyc2VyLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IHt9XG4gICAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbWF0Y2g6IC8uKlxcLih3eHNzfGNzc3xwb3N0Y3NzKSQvLFxuICAgICAgICBwYXJzZXJzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGFyc2VyOiBzdHlsZVBhcnNlcixcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB7fVxuICAgICAgICAgICAgfVxuICAgICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG1hdGNoOiAvLipcXC4oc2Fzc3xzY3NzKSQvLFxuICAgICAgICBwYXJzZXJzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGFyc2VyOiBzYXNzUGFyc2VyLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IHt9XG4gICAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICB9XG5dXG5cbi8qKlxuICogV2hldGhlciB0byBvdXRwdXQgZGVidWcgaW5mb3JtYXRpb24uXG4gKiBAZGVmYXVsdCBmYWxzZVxuICovXG5leHBvcnQgY29uc3QgZGVidWc6IGJvb2xlYW4gPSBmYWxzZVxuXG4vKipcbiAqIFJlZ2lzdGVyIHBsdWdpbi5cbiAqL1xuZXhwb3J0IGNvbnN0IHBsdWdpbnM6IFBsdWdpbnNDb25maWdyYXRpb24gPSBbXG4gICAge1xuICAgICAgICBwbHVnaW46IGV4dHJhY3REZXBlbmRlbmN5UGx1Z2luLFxuICAgICAgICBvcHRpb25zOiB7fVxuICAgIH0sXG4gICAge1xuICAgICAgICBwbHVnaW46IHNhdmVGaWxlUGx1Z2luLFxuICAgICAgICBvcHRpb25zOiB7fVxuICAgIH1cbl1cblxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICAgICAgICAgICAgICAgZXhwZXJpbWVudGFsIGNvbmZpZ3VyZVxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4iLCJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgcmVzb2x2ZUNvbmZpZyBmcm9tICcuLi91dGlscy9yZXNvbHZlQ29uZmlnJ1xuaW1wb3J0ICogYXMgYW5rYURlZmF1bHRDb25maWcgZnJvbSAnLi9hbmthRGVmYXVsdENvbmZpZydcblxuY29uc3QgY3dkID0gcHJvY2Vzcy5jd2QoKVxuY29uc3QgY3VzdG9tQ29uZmlnID0gPEFua2FDb25maWc+cmVzb2x2ZUNvbmZpZyhbJ2Fua2EuY29uZmlnLmpzJywgJ2Fua2EuY29uZmlnLmpzb24nXSlcblxuZXhwb3J0IGRlZmF1bHQge1xuICAgIC4uLmFua2FEZWZhdWx0Q29uZmlnLFxuICAgIC4uLmN1c3RvbUNvbmZpZyxcbiAgICB0ZW1wbGF0ZTogY3VzdG9tQ29uZmlnLnRlbXBsYXRlID8ge1xuICAgICAgICBwYWdlOiBwYXRoLmpvaW4oY3dkLCBjdXN0b21Db25maWcudGVtcGxhdGUucGFnZSksXG4gICAgICAgIGNvbXBvbmVudDogcGF0aC5qb2luKGN3ZCwgY3VzdG9tQ29uZmlnLnRlbXBsYXRlLmNvbXBvbmVudClcbiAgICB9IDogYW5rYURlZmF1bHRDb25maWcudGVtcGxhdGUsXG4gICAgcGFyc2VyczogY3VzdG9tQ29uZmlnLnBhcnNlcnMgPyBjdXN0b21Db25maWcucGFyc2Vycy5jb25jYXQoYW5rYURlZmF1bHRDb25maWcucGFyc2VycykgOiBhbmthRGVmYXVsdENvbmZpZy5wYXJzZXJzLFxuICAgIHBsdWdpbnM6IGFua2FEZWZhdWx0Q29uZmlnLnBsdWdpbnMuY29uY2F0KGN1c3RvbUNvbmZpZy5wbHVnaW5zIHx8IFtdKVxufVxuIiwiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IGFua2FDb25maWcgZnJvbSAnLi9hbmthQ29uZmlnJ1xuXG5leHBvcnQgY29uc3QgY3dkID0gcHJvY2Vzcy5jd2QoKVxuZXhwb3J0IGNvbnN0IHNyY0RpciA9IHBhdGgucmVzb2x2ZShjd2QsIGFua2FDb25maWcuc291cmNlRGlyKVxuZXhwb3J0IGNvbnN0IGRpc3REaXIgPSBwYXRoLnJlc29sdmUoY3dkLCBhbmthQ29uZmlnLm91dHB1dERpcilcbmV4cG9ydCBjb25zdCBhbmthTW9kdWxlcyA9IHBhdGgucmVzb2x2ZShzcmNEaXIsICdhbmthX21vZHVsZXMnKVxuZXhwb3J0IGNvbnN0IHNvdXJjZU5vZGVNb2R1bGVzID0gcGF0aC5yZXNvbHZlKGN3ZCwgJy4vbm9kZV9tb2R1bGVzJylcbmV4cG9ydCBjb25zdCBkaXN0Tm9kZU1vZHVsZXMgPSBwYXRoLnJlc29sdmUoZGlzdERpciwgJy4vbnBtX21vZHVsZXMnKVxuZXhwb3J0IGNvbnN0IGRlZmF1bHRTY2FmZm9sZCA9ICAnZGlyZWN0Omh0dHBzOi8vZ2l0aHViLmNvbS9pRXhjZXB0aW9uL2Fua2EtcXVpY2tzdGFydCdcbiIsImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJ1xuaW1wb3J0IGFua2FDb25maWcgZnJvbSAnLi9hbmthQ29uZmlnJ1xuaW1wb3J0ICogYXMgc3lzdGVtIGZyb20gJy4vc3lzdGVtQ29uZmlnJ1xuaW1wb3J0IHJlc29sdmVDb25maWcgZnJvbSAnLi4vdXRpbHMvcmVzb2x2ZUNvbmZpZydcblxuY29uc3QgY3VzdG9tQ29uZmlnID0gcmVzb2x2ZUNvbmZpZyhbJ2FwcC5qc29uJ10sIHN5c3RlbS5zcmNEaXIpXG5cbmV4cG9ydCBkZWZhdWx0IE9iamVjdC5hc3NpZ24oe1xuICAgIHBhZ2VzOiBbXSxcbiAgICBzdWJQYWNrYWdlczogW10sXG4gICAgd2luZG93OiB7XG4gICAgICAgIG5hdmlnYXRpb25CYXJUaXRsZVRleHQ6ICdXZWNoYXQnXG4gICAgfVxuICAgIC8vIHRhYkJhcjoge1xuICAgIC8vICAgICBsaXN0OiBbXVxuICAgIC8vIH0sXG59LCBjdXN0b21Db25maWcpXG4iLCJpbXBvcnQgKiBhcyBzeXN0ZW1Db25maWcgZnJvbSAnLi9zeXN0ZW1Db25maWcnXG5pbXBvcnQgYW5rYUNvbmZpZyBmcm9tICcuL2Fua2FDb25maWcnXG5pbXBvcnQgcHJvamVjdENvbmZpZyBmcm9tICcuL3Byb2plY3RDb25maWcnXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICAuLi5zeXN0ZW1Db25maWcsXG4gICAgYW5rYUNvbmZpZyxcbiAgICBwcm9qZWN0Q29uZmlnXG59XG4iLCJpbXBvcnQgQ29tcGlsZXIgZnJvbSAnLi9Db21waWxlcidcbmltcG9ydCBjb25maWcgZnJvbSAnLi4vLi4vY29uZmlnJ1xuaW1wb3J0IENvbXBpbGF0aW9uIGZyb20gJy4vQ29tcGlsYXRpb24nXG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBJbmplY3Rpb24ge1xuICAgIGNvbXBpbGVyOiBDb21waWxlclxuICAgIG9wdGlvbnM6IG9iamVjdFxuXG4gICAgY29uc3RydWN0b3IgKGNvbXBpbGVyOiBDb21waWxlciwgb3B0aW9ucz86IG9iamVjdCkge1xuICAgICAgICB0aGlzLmNvbXBpbGVyID0gY29tcGlsZXJcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9uc1xuICAgIH1cblxuICAgIGFic3RyYWN0IGdldE9wdGlvbnMgKCk6IG9iamVjdFxuXG4gICAgZ2V0Q29tcGlsZXIgKCk6IENvbXBpbGVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcGlsZXJcbiAgICB9XG5cbiAgICBnZXRBbmthQ29uZmlnICgpOiBBbmthQ29uZmlnIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5hbmthQ29uZmlnXG4gICAgfVxuXG4gICAgZ2V0U3lzdGVtQ29uZmlnICgpOiBDb21waWxlckNvbmZpZyB7XG4gICAgICAgIHJldHVybiBjb25maWdcbiAgICB9XG5cbiAgICBnZXRQcm9qZWN0Q29uZmlnICgpOiBQcm9qZWN0Q29uZmlnIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5wcm9qZWN0Q29uZmlnXG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgUGx1Z2luSW5qZWN0aW9uIGV4dGVuZHMgSW5qZWN0aW9uIHtcblxuICAgIGNvbnN0cnVjdG9yIChjb21waWxlcjogQ29tcGlsZXIsIG9wdGlvbnM6IFBsdWdpbk9wdGlvbnNbJ29wdGlvbnMnXSkge1xuICAgICAgICBzdXBlcihjb21waWxlciwgb3B0aW9ucylcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gUGx1Z2luIG9wdGlvbnNcbiAgICAgKi9cbiAgICBnZXRPcHRpb25zICgpOiBvYmplY3Qge1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zIHx8IHt9XG4gICAgfVxuXG4gICAgb24gKGV2ZW50OiBzdHJpbmcsIGhhbmRsZXI6IFBsdWdpbkhhbmRsZXIpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jb21waWxlci5vbihldmVudCwgaGFuZGxlcilcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBQYXJzZXJJbmplY3Rpb24gZXh0ZW5kcyBJbmplY3Rpb24ge1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIFBhcnNlck9wdGlvbnNcbiAgICAgKi9cbiAgICBnZXRPcHRpb25zICgpOiBvYmplY3Qge1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zIHx8IHt9XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IgKGNvbXBpbGVyOiBDb21waWxlciwgb3B0aW9uczogUGFyc2VyT3B0aW9uc1snb3B0aW9ucyddKSB7XG4gICAgICAgIHN1cGVyKGNvbXBpbGVyLCBvcHRpb25zKVxuICAgIH1cbn1cbiIsImltcG9ydCB7XG4gICAgUGFyc2VySW5qZWN0aW9uXG59IGZyb20gJy4vSW5qZWN0aW9uJ1xuaW1wb3J0IEZpbGUgZnJvbSAnLi9GaWxlJ1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuLi8uLi9jb25maWcnXG5pbXBvcnQgQ29tcGlsZXIgZnJvbSAnLi9Db21waWxlcidcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uLy4uL3V0aWxzJ1xuXG4vKipcbiAqIEEgY29tcGlsYXRpb24gdGFza1xuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb21waWxhdGlvbiB7XG4gICAgY29uZmlnOiBDb21waWxlckNvbmZpZ1xuICAgIHJlYWRvbmx5IGNvbXBpbGVyOiBDb21waWxlclxuICAgIGlkOiBudW1iZXIgICAgICAgIC8vIFVuaXF1Ze+8jGZvciBlYWNoIENvbXBpbGF0aW9uXG4gICAgZmlsZTogRmlsZVxuICAgIHNvdXJjZUZpbGU6IHN0cmluZ1xuICAgIGRlc3Ryb3llZDogYm9vbGVhblxuXG4gICAgY29uc3RydWN0b3IgKGZpbGU6IEZpbGUgfCBzdHJpbmcsIGNvbmY6IENvbXBpbGVyQ29uZmlnLCBjb21waWxlcjogQ29tcGlsZXIpIHtcbiAgICAgICAgdGhpcy5jb21waWxlciA9IGNvbXBpbGVyXG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZlxuICAgICAgICB0aGlzLmlkID0gQ29tcGlsZXIuY29tcGlsYXRpb25JZCsrXG5cbiAgICAgICAgaWYgKGZpbGUgaW5zdGFuY2VvZiBGaWxlKSB7XG4gICAgICAgICAgICB0aGlzLmZpbGUgPSBmaWxlXG4gICAgICAgICAgICB0aGlzLnNvdXJjZUZpbGUgPSBmaWxlLnNvdXJjZUZpbGVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc291cmNlRmlsZSA9IGZpbGVcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZW5yb2xsKClcbiAgICB9XG5cbiAgICBhc3luYyBydW4gKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCB0aGlzLmxvYWRGaWxlKClcbiAgICAgICAgYXdhaXQgdGhpcy5pbnZva2VQYXJzZXJzKClcbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlKClcbiAgICB9XG5cbiAgICBhc3luYyBsb2FkRmlsZSAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICh0aGlzLmRlc3Ryb3llZCkgcmV0dXJuXG5cbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlci5lbWl0KCdiZWZvcmUtbG9hZC1maWxlJywgdGhpcylcbiAgICAgICAgaWYgKCEodGhpcy5maWxlIGluc3RhbmNlb2YgRmlsZSkpIHtcbiAgICAgICAgICAgIHRoaXMuZmlsZSA9IGF3YWl0IHV0aWxzLmNyZWF0ZUZpbGUodGhpcy5zb3VyY2VGaWxlKVxuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlci5lbWl0KCdhZnRlci1sb2FkLWZpbGUnLCB0aGlzKVxuICAgIH1cblxuICAgIGFzeW5jIGludm9rZVBhcnNlcnMgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBpZiAodGhpcy5kZXN0cm95ZWQpIHJldHVyblxuXG4gICAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLmZpbGVcbiAgICAgICAgY29uc3QgcGFyc2VycyA9IDxQYXJzZXJbXT50aGlzLmNvbXBpbGVyLnBhcnNlcnMuZmlsdGVyKChtYXRjaGVyczogTWF0Y2hlcikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoZXJzLm1hdGNoLnRlc3QoZmlsZS50YXJnZXRGaWxlKVxuICAgICAgICB9KS5tYXAoKG1hdGNoZXJzOiBNYXRjaGVyKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hlcnMucGFyc2Vyc1xuICAgICAgICB9KS5yZWR1Y2UoKHByZXYsIG5leHQpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBwcmV2LmNvbmNhdChuZXh0KVxuICAgICAgICB9LCBbXSlcbiAgICAgICAgY29uc3QgdGFza3MgPSBwYXJzZXJzLm1hcChwYXJzZXIgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHV0aWxzLmFzeW5jRnVuY3Rpb25XcmFwcGVyKHBhcnNlcilcbiAgICAgICAgfSlcblxuICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGVyLmVtaXQoJ2JlZm9yZS1wYXJzZScsIHRoaXMpXG4gICAgICAgIGF3YWl0IHV0aWxzLmNhbGxQcm9taXNlSW5DaGFpbih0YXNrcywgZmlsZSwgdGhpcylcbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlci5lbWl0KCdhZnRlci1wYXJzZScsIHRoaXMpXG4gICAgfVxuXG4gICAgYXN5bmMgY29tcGlsZSAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICh0aGlzLmRlc3Ryb3llZCkgcmV0dXJuXG5cbiAgICAgICAgLy8gSW52b2tlIEV4dHJhY3REZXBlbmRlbmN5UGx1Z2luLlxuICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGVyLmVtaXQoJ2JlZm9yZS1jb21waWxlJywgdGhpcylcbiAgICAgICAgLy8gRG8gc29tZXRoaW5nIGVsc2UuXG4gICAgICAgIGF3YWl0IHRoaXMuY29tcGlsZXIuZW1pdCgnYWZ0ZXItY29tcGlsZScsIHRoaXMpXG4gICAgICAgICF0aGlzLmNvbmZpZy5hbmthQ29uZmlnLnF1aWV0ICYmICB1dGlscy5sb2dnZXIuaW5mbygnQ29tcGlsZScsICB0aGlzLmZpbGUuc291cmNlRmlsZS5yZXBsYWNlKGNvbmZpZy5jd2QsICcnKSlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBvbiBDb21waWxlciBhbmQgZGVzdHJveSB0aGUgcHJldmlvdXMgb25lIGlmIGNvbmZsaWN0IGFyaXNlcy5cbiAgICAgKi9cbiAgICBlbnJvbGwgKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBvbGRDb21waWxhdGlvbiA9IENvbXBpbGVyLmNvbXBpbGF0aW9uUG9vbC5nZXQodGhpcy5zb3VyY2VGaWxlKVxuXG4gICAgICAgIGlmIChvbGRDb21waWxhdGlvbikge1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5hbmthQ29uZmlnLmRlYnVnKSBjb25zb2xlLmxvZygnXGJEZXN0cm95IENvbXBpbGF0aW9uJywgb2xkQ29tcGlsYXRpb24uaWQsIG9sZENvbXBpbGF0aW9uLnNvdXJjZUZpbGUpXG5cbiAgICAgICAgICAgIG9sZENvbXBpbGF0aW9uLmRlc3Ryb3koKVxuICAgICAgICB9XG4gICAgICAgIENvbXBpbGVyLmNvbXBpbGF0aW9uUG9vbC5zZXQodGhpcy5zb3VyY2VGaWxlLCB0aGlzKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVucmVnaXN0ZXIgdGhlbXNlbHZlcyBmcm9tIENvbXBpbGVyLlxuICAgICAqL1xuICAgIGRlc3Ryb3kgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmRlc3Ryb3llZCA9IHRydWVcbiAgICAgICAgQ29tcGlsZXIuY29tcGlsYXRpb25Qb29sLmRlbGV0ZSh0aGlzLnNvdXJjZUZpbGUpXG4gICAgfVxufVxuIiwiaW1wb3J0IHtcbiAgICBQYXJzZXJJbmplY3Rpb24sXG4gICAgUGx1Z2luSW5qZWN0aW9uXG59IGZyb20gJy4vSW5qZWN0aW9uJ1xuaW1wb3J0IEZpbGUgZnJvbSAnLi9GaWxlJ1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnXG5pbXBvcnQgY29uZmlnIGZyb20gJy4uLy4uL2NvbmZpZydcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uLy4uL3V0aWxzJ1xuaW1wb3J0IENvbXBpbGF0aW9uIGZyb20gJy4vQ29tcGlsYXRpb24nXG5pbXBvcnQgY2FsbFByb21pc2VJbkNoYWluIGZyb20gJy4uLy4uL3V0aWxzL2NhbGxQcm9taXNlSW5DaGFpbidcbmltcG9ydCBhc3luY0Z1bmN0aW9uV3JhcHBlciBmcm9tICcuLi8uLi91dGlscy9hc3luY0Z1bmN0aW9uV3JhcHBlcidcblxuY29uc3QgeyBsb2dnZXIgfSA9IHV0aWxzXG5cbi8qKlxuICogVGhlIGNvcmUgY29tcGlsZXIuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbXBpbGVyIHtcbiAgICByZWFkb25seSBjb25maWc6IENvbXBpbGVyQ29uZmlnXG4gICAgcHVibGljIHN0YXRpYyBjb21waWxhdGlvbklkID0gMVxuICAgIHB1YmxpYyBzdGF0aWMgY29tcGlsYXRpb25Qb29sID0gbmV3IE1hcDxzdHJpbmcsIENvbXBpbGF0aW9uPigpXG4gICAgcGx1Z2luczoge1xuICAgICAgICBbZXZlbnROYW1lOiBzdHJpbmddOiBBcnJheTxQbHVnaW5IYW5kbGVyPlxuICAgIH0gPSB7XG4gICAgICAgICdiZWZvcmUtbG9hZC1maWxlJzogW10sXG4gICAgICAgICdhZnRlci1sb2FkLWZpbGUnOiBbXSxcbiAgICAgICAgJ2JlZm9yZS1wYXJzZSc6IFtdLFxuICAgICAgICAnYWZ0ZXItcGFyc2UnOiBbXSxcbiAgICAgICAgJ2JlZm9yZS1jb21waWxlJzogW10sXG4gICAgICAgICdhZnRlci1jb21waWxlJzogW11cbiAgICB9XG4gICAgcGFyc2VyczogQXJyYXk8e1xuICAgICAgICBtYXRjaDogUmVnRXhwLFxuICAgICAgICBwYXJzZXJzOiBBcnJheTxQYXJzZXI+XG4gICAgfT4gPSBbXVxuXG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZ1xuICAgICAgICB0aGlzLmluaXRQYXJzZXJzKClcbiAgICAgICAgdGhpcy5pbml0UGx1Z2lucygpXG5cbiAgICAgICAgaWYgKGNvbmZpZy5hbmthQ29uZmlnLmRlYnVnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh0aGlzLmNvbmZpZywgKGtleSwgdmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBGdW5jdGlvbikgcmV0dXJuICdbRnVuY3Rpb25dJ1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZVxuICAgICAgICAgICAgfSwgNCkpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBQbHVnaW4uXG4gICAgICogQHBhcmFtIGV2ZW50XG4gICAgICogQHBhcmFtIGhhbmRsZXJcbiAgICAgKi9cbiAgICBvbiAoZXZlbnQ6IHN0cmluZywgaGFuZGxlcjogUGx1Z2luSGFuZGxlcik6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5wbHVnaW5zW2V2ZW50XSA9PT0gdm9pZCAoMCkpIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBob29rOiAke2V2ZW50fWApXG4gICAgICAgIHRoaXMucGx1Z2luc1tldmVudF0ucHVzaChoYW5kbGVyKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEludm9rZSBsaWZlY3ljbGUgaG9va3MoUHJvbWlzZSBjaGFpbmluZykuXG4gICAgICogQHBhcmFtIGV2ZW50XG4gICAgICogQHBhcmFtIGNvbXBpbGF0aW9uXG4gICAgICovXG4gICAgYXN5bmMgZW1pdCAoZXZlbnQ6IHN0cmluZywgY29tcGlsYXRpb246IENvbXBpbGF0aW9uKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKGNvbXBpbGF0aW9uLmRlc3Ryb3llZCkgcmV0dXJuXG5cbiAgICAgICAgY29uc3QgcGx1Z2lucyA9IHRoaXMucGx1Z2luc1tldmVudF1cblxuICAgICAgICBpZiAoIXBsdWdpbnMgfHwgIXBsdWdpbnMubGVuZ3RoKSByZXR1cm5cblxuICAgICAgICBjb25zdCB0YXNrcyA9IHBsdWdpbnMubWFwKHBsdWdpbiA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYXN5bmNGdW5jdGlvbldyYXBwZXIocGx1Z2luKVxuICAgICAgICB9KVxuXG4gICAgICAgIGF3YWl0IGNhbGxQcm9taXNlSW5DaGFpbih0YXNrcywgY29tcGlsYXRpb24pXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRXZlcnl0aGluZyBzdGFydCBmcm9tIGhlcmUuXG4gICAgICovXG4gICAgYXN5bmMgbGF1bmNoICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBsb2dnZXIuaW5mbygnTGF1bmNoaW5nLi4uJylcblxuICAgICAgICBjb25zdCBmaWxlUGF0aHM6IHN0cmluZ1tdID0gYXdhaXQgdXRpbHMuc2VhcmNoRmlsZXMoYCR7Y29uZmlnLnNyY0Rpcn0vKiovKmAsIHtcbiAgICAgICAgICAgIG5vZGlyOiB0cnVlLFxuICAgICAgICAgICAgc2lsZW50OiBmYWxzZSxcbiAgICAgICAgICAgIGFic29sdXRlOiB0cnVlXG4gICAgICAgIH0pXG4gICAgICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgUHJvbWlzZS5hbGwoZmlsZVBhdGhzLm1hcChmaWxlID0+IHtcbiAgICAgICAgICAgIHJldHVybiB1dGlscy5jcmVhdGVGaWxlKGZpbGUpXG4gICAgICAgIH0pKVxuICAgICAgICBjb25zdCBjb21waWxhdGlvbnMgPSBmaWxlcy5tYXAoZmlsZSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IENvbXBpbGF0aW9uKGZpbGUsIHRoaXMuY29uZmlnLCB0aGlzKVxuICAgICAgICB9KVxuXG4gICAgICAgIGZzLmVuc3VyZURpclN5bmMoY29uZmlnLmRpc3ROb2RlTW9kdWxlcylcblxuICAgICAgICAvLyBhd2FpdCBQcm9taXNlLmFsbChjb21waWxhdGlvbnMubWFwKGNvbXBpbGF0aW9uID0+IGNvbXBpbGF0aW9uLmxvYWRGaWxlKCkpKVxuICAgICAgICAvLyBhd2FpdCBQcm9taXNlLmFsbChjb21waWxhdGlvbnMubWFwKGNvbXBpbGF0aW9uID0+IGNvbXBpbGF0aW9uLmludm9rZVBhcnNlcnMoKSkpXG5cbiAgICAgICAgLy8gVE9ETzogR2V0IGFsbCBmaWxlc1xuICAgICAgICAvLyBDb21waWxlci5jb21waWxhdGlvblBvb2wudmFsdWVzKClcblxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChjb21waWxhdGlvbnMubWFwKGNvbXBpbGF0aW9ucyA9PiBjb21waWxhdGlvbnMucnVuKCkpKVxuICAgIH1cblxuICAgIHdhdGNoRmlsZXMgKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHdhdGNoZXIgPSB1dGlscy5nZW5GaWxlV2F0Y2hlcihgJHtjb25maWcuc3JjRGlyfS8qKi8qYCwge1xuICAgICAgICAgICAgICAgIGZvbGxvd1N5bWxpbmtzOiBmYWxzZVxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgd2F0Y2hlci5vbignYWRkJywgYXN5bmMgKGZpbGVOYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlID0gYXdhaXQgdXRpbHMuY3JlYXRlRmlsZShmaWxlTmFtZSlcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmdlbmVyYXRlQ29tcGlsYXRpb24oZmlsZSkucnVuKClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB3YXRjaGVyLm9uKCd1bmxpbmsnLCBhc3luYyAoZmlsZU5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIGF3YWl0IGZzLnVubGluayhmaWxlTmFtZS5yZXBsYWNlKGNvbmZpZy5zcmNEaXIsIGNvbmZpZy5kaXN0RGlyKSlcbiAgICAgICAgICAgICAgICBsb2dnZXIuc3VjY2VzcygnUmVtb3ZlJywgZmlsZU5hbWUpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgd2F0Y2hlci5vbignY2hhbmdlJywgYXN5bmMgKGZpbGVOYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlID0gYXdhaXQgdXRpbHMuY3JlYXRlRmlsZShmaWxlTmFtZSlcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmdlbmVyYXRlQ29tcGlsYXRpb24oZmlsZSkucnVuKClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB3YXRjaGVyLm9uKCdyZWFkeScsICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIG5ldyBDb21waWxhdGlvbi5cbiAgICAgKiBAcGFyYW0gZmlsZVxuICAgICAqL1xuICAgIGdlbmVyYXRlQ29tcGlsYXRpb24gKGZpbGU6IEZpbGUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb21waWxhdGlvbihmaWxlLCB0aGlzLmNvbmZpZywgdGhpcylcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNb3VudCBwYXJzZXJzLlxuICAgICAqL1xuICAgIGluaXRQYXJzZXJzICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jb25maWcuYW5rYUNvbmZpZy5wYXJzZXJzLmZvckVhY2goKHsgbWF0Y2gsIHBhcnNlcnMgfSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wYXJzZXJzLnB1c2goe1xuICAgICAgICAgICAgICAgIG1hdGNoLFxuICAgICAgICAgICAgICAgIHBhcnNlcnM6IHBhcnNlcnMubWFwKCh7IHBhcnNlciwgb3B0aW9ucyB9KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZXIuYmluZCh0aGlzLmdlbmVyYXRlUGFyc2VySW5qZWN0aW9uKG9wdGlvbnMpKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1vdW50IFBsdWdpbnMuXG4gICAgICovXG4gICAgaW5pdFBsdWdpbnMgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmNvbmZpZy5hbmthQ29uZmlnLnBsdWdpbnMuZm9yRWFjaCgoeyBwbHVnaW4sIG9wdGlvbnMgfSkgPT4ge1xuICAgICAgICAgICAgcGx1Z2luLmNhbGwodGhpcy5nZW5lcmF0ZVBsdWdpbkluamVjdGlvbihvcHRpb25zKSlcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBnZW5lcmF0ZVBsdWdpbkluamVjdGlvbiAob3B0aW9uczogUGx1Z2luT3B0aW9uc1snb3B0aW9ucyddKTogUGx1Z2luSW5qZWN0aW9uIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQbHVnaW5JbmplY3Rpb24odGhpcywgb3B0aW9ucylcbiAgICB9XG5cbiAgICBnZW5lcmF0ZVBhcnNlckluamVjdGlvbiAob3B0aW9uczogUGFyc2VyT3B0aW9uc1snb3B0aW9ucyddKTogUGFyc2VySW5qZWN0aW9uIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQYXJzZXJJbmplY3Rpb24odGhpcywgb3B0aW9ucylcbiAgICB9XG59XG4iLCJpbXBvcnQgQ29tcGlsZXIgZnJvbSAnLi9Db21waWxlcidcblxuZXhwb3J0IGRlZmF1bHQgYWJzdHJhY3QgY2xhc3MgQ29tbWFuZCB7XG4gICAgcHVibGljIGNvbW1hbmQ6IHN0cmluZ1xuICAgIHB1YmxpYyBvcHRpb25zOiBBcnJheTxBcnJheTxzdHJpbmc+PlxuICAgIHB1YmxpYyBhbGlhczogc3RyaW5nXG4gICAgcHVibGljIHVzYWdlOiBzdHJpbmdcbiAgICBwdWJsaWMgZGVzY3JpcHRpb246IHN0cmluZ1xuICAgIHB1YmxpYyBleGFtcGxlczogQXJyYXk8c3RyaW5nPlxuICAgIHB1YmxpYyAkY29tcGlsZXI6IENvbXBpbGVyXG4gICAgcHVibGljIG9uOiB7XG4gICAgICAgIFtrZXk6IHN0cmluZ106ICguLi5hcmc6IGFueVtdKSA9PiB2b2lkXG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IgKGNvbW1hbmQ6IHN0cmluZywgZGVzYz86IHN0cmluZykge1xuICAgICAgICB0aGlzLmNvbW1hbmQgPSBjb21tYW5kXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IFtdXG4gICAgICAgIHRoaXMuYWxpYXMgPSAnJ1xuICAgICAgICB0aGlzLnVzYWdlID0gJydcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IGRlc2NcbiAgICAgICAgdGhpcy5leGFtcGxlcyA9IFtdXG4gICAgICAgIHRoaXMub24gPSB7fVxuICAgIH1cblxuICAgIGFic3RyYWN0IGFjdGlvbiAocGFyYW06IHN0cmluZyB8IEFycmF5PHN0cmluZz4sIG9wdGlvbnM6IE9iamVjdCwgLi4ub3RoZXI6IGFueVtdKTogUHJvbWlzZTxhbnk+IHwgdm9pZFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSBhbmthIGNvcmUgY29tcGlsZXJcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgaW5pdENvbXBpbGVyICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy4kY29tcGlsZXIgPSBuZXcgQ29tcGlsZXIoKVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBzZXRVc2FnZSAodXNhZ2U6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICB0aGlzLnVzYWdlID0gdXNhZ2VcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgc2V0T3B0aW9ucyAoLi4ub3B0aW9uczogQXJyYXk8c3RyaW5nPik6IHZvaWQge1xuICAgICAgICB0aGlzLm9wdGlvbnMucHVzaChvcHRpb25zKVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBzZXRFeGFtcGxlcyAoLi4uZXhhbXBsZTogQXJyYXk8c3RyaW5nPik6IHZvaWQge1xuICAgICAgICB0aGlzLmV4YW1wbGVzID0gdGhpcy5leGFtcGxlcy5jb25jYXQoZXhhbXBsZSlcbiAgICB9XG5cbiAgICBwdWJsaWMgcHJpbnRUaXRsZSAoLi4uYXJnOiBBcnJheTxhbnk+KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdcXHJcXG4gJywgLi4uYXJnLCAnXFxyXFxuJylcbiAgICB9XG5cbiAgICBwdWJsaWMgcHJpbnRDb250ZW50ICguLi5hcmc6IEFycmF5PGFueT4pIHtcbiAgICAgICAgY29uc29sZS5sb2coJyAgICcsIC4uLmFyZylcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBsb2dnZXIgfSBmcm9tICcuLi91dGlscydcbmltcG9ydCB7IENvbW1hbmQsIENvbXBpbGVyIH0gZnJvbSAnLi4vY29yZSdcblxuZXhwb3J0IHR5cGUgRGV2Q29tbWFuZE9wdHMgPSBPYmplY3QgJiB7fVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEZXZDb21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBzdXBlcihcbiAgICAgICAgICAgICdkZXYgW3BhZ2VzLi4uXScsXG4gICAgICAgICAgICAnRGV2ZWxvcG1lbnQgTW9kZSdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0RXhhbXBsZXMoXG4gICAgICAgICAgICAnJCBhbmthIGRldicsXG4gICAgICAgICAgICAnJCBhbmthIGRldiBpbmRleCcsXG4gICAgICAgICAgICAnJCBhbmthIGRldiAvcGFnZXMvbG9nL2xvZyAvcGFnZXMvdXNlci91c2VyJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy4kY29tcGlsZXIgPSBuZXcgQ29tcGlsZXIoKVxuICAgIH1cblxuICAgIGFzeW5jIGFjdGlvbiAocGFnZXM/OiBBcnJheTxzdHJpbmc+LCBvcHRpb25zPzogRGV2Q29tbWFuZE9wdHMpIHtcbiAgICAgICAgY29uc3Qgc3RhcnR1cFRpbWUgPSBEYXRlLm5vdygpXG4gICAgICAgIHRoaXMuaW5pdENvbXBpbGVyKClcbiAgICAgICAgYXdhaXQgdGhpcy4kY29tcGlsZXIubGF1bmNoKClcbiAgICAgICAgYXdhaXQgdGhpcy4kY29tcGlsZXIud2F0Y2hGaWxlcygpXG4gICAgICAgIGxvZ2dlci5zdWNjZXNzKGBTdGFydHVwOiAke0RhdGUubm93KCkgLSBzdGFydHVwVGltZX1tc2AsIGBBbmthIGlzIHdhaXRpbmcgZm9yIGNoYW5nZXMuLi5gKVxuICAgIH1cbn1cbiIsImltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uL3V0aWxzJ1xuaW1wb3J0IHsgQ29tbWFuZCwgQ29tcGlsZXIgfSBmcm9tICcuLi9jb3JlJ1xuXG5leHBvcnQgdHlwZSBEZXZDb21tYW5kT3B0cyA9IE9iamVjdCAmIHt9XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERldkNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHN1cGVyKFxuICAgICAgICAgICAgJ3Byb2QnLFxuICAgICAgICAgICAgJ1Byb2R1Y3Rpb24gTW9kZSdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0RXhhbXBsZXMoXG4gICAgICAgICAgICAnJCBhbmthIHByb2QnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLiRjb21waWxlciA9IG5ldyBDb21waWxlcigpXG4gICAgfVxuXG4gICAgYXN5bmMgYWN0aW9uIChwYWdlcz86IEFycmF5PHN0cmluZz4sIG9wdGlvbnM/OiBEZXZDb21tYW5kT3B0cykge1xuICAgICAgICBjb25zdCBzdGFydHVwVGltZSA9IERhdGUubm93KClcbiAgICAgICAgdGhpcy5pbml0Q29tcGlsZXIoKVxuICAgICAgICBhd2FpdCB0aGlzLiRjb21waWxlci5sYXVuY2goKVxuICAgICAgICBsb2dnZXIuc3VjY2VzcyhgRG9uZTogJHtEYXRlLm5vdygpIC0gc3RhcnR1cFRpbWV9bXNgLCAnSGF2ZSBhIG5pY2UgZGF5IPCfjokgIScpXG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgY29uZmlnICBmcm9tICcuLi9jb25maWcnXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi91dGlscydcbmltcG9ydCB7IENvbW1hbmQsIENvbXBpbGVyIH0gZnJvbSAnLi4vY29yZSdcbmltcG9ydCB7IGRlZmF1bHQgYXMgRnNFZGl0b3JDb25zdHJ1Y3RvciB9IGZyb20gJy4uL3V0aWxzL2VkaXRvcidcblxuY29uc3QgeyBsb2dnZXIsIEZzRWRpdG9yIH0gPSB1dGlsc1xuXG5leHBvcnQgdHlwZSBDcmVhdGVQYWdlQ29tbWFuZE9wdHMgPSB7XG4gICAgcm9vdDogc3RyaW5nXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENyZWF0ZVBhZ2VDb21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBzdXBlcihcbiAgICAgICAgICAgICduZXctcGFnZSA8cGFnZXMuLi4+JyxcbiAgICAgICAgICAgICdDcmVhdGUgYSBtaW5pcHJvZ3JhbSBwYWdlJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRFeGFtcGxlcyhcbiAgICAgICAgICAgICckIGFua2EgbmV3LXBhZ2UgaW5kZXgnLFxuICAgICAgICAgICAgJyQgYW5rYSBuZXctcGFnZSAvcGFnZXMvaW5kZXgvaW5kZXgnLFxuICAgICAgICAgICAgJyQgYW5rYSBuZXctcGFnZSAvcGFnZXMvaW5kZXgvaW5kZXggLS1yb290PXBhY2thZ2VBJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRPcHRpb25zKFxuICAgICAgICAgICAgJy1SLCAtLXJvb3QgPHN1YnBhY2thZ2U+JyxcbiAgICAgICAgICAgICdzYXZlIHBhZ2UgdG8gc3VicGFja2FnZXMnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLiRjb21waWxlciA9IG5ldyBDb21waWxlcigpXG4gICAgfVxuXG4gICAgYXN5bmMgYWN0aW9uIChwYWdlcz86IEFycmF5PHN0cmluZz4sIG9wdGlvbnM/OiBDcmVhdGVQYWdlQ29tbWFuZE9wdHMpIHtcbiAgICAgICAgY29uc3Qgcm9vdCA9IG9wdGlvbnMucm9vdFxuICAgICAgICBjb25zdCBlZGl0b3IgPSBuZXcgRnNFZGl0b3IoKVxuXG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHBhZ2VzLm1hcChwYWdlID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdlbmVyYXRlUGFnZShwYWdlLCBlZGl0b3IsIHJvb3QpXG4gICAgICAgIH0pKVxuXG4gICAgICAgIGxvZ2dlci5zdWNjZXNzKCdEb25lJywgJ0hhdmUgYSBuaWNlIGRheSDwn46JICEnKVxuICAgIH1cblxuICAgIGFzeW5jIGdlbmVyYXRlUGFnZSAocGFnZTogc3RyaW5nLCBlZGl0b3I6IEZzRWRpdG9yQ29uc3RydWN0b3IsIHJvb3Q/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgQ3dkUmVnRXhwID0gbmV3IFJlZ0V4cChgXiR7Y29uZmlnLmN3ZH1gKVxuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICBhbmthQ29uZmlnLFxuICAgICAgICAgICAgcHJvamVjdENvbmZpZ1xuICAgICAgICB9ID0gPENvbXBpbGVyQ29uZmlnPmNvbmZpZ1xuICAgICAgICBjb25zdCBwYWdlUGF0aCA9IHBhZ2Uuc3BsaXQocGF0aC5zZXApLmxlbmd0aCA9PT0gMSA/XG4gICAgICAgICAgICBwYXRoLmpvaW4oIGFua2FDb25maWcucGFnZXMsIHBhZ2UsIHBhZ2UpIDogcGFnZVxuICAgICAgICBjb25zdCBwYWdlTmFtZSA9IHBhZ2VQYXRoLnNwbGl0KHBhdGguc2VwKS5wb3AoKVxuICAgICAgICBjb25zdCBjb250ZXh0ID0ge1xuICAgICAgICAgICAgcGFnZU5hbWVcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhcHBDb25maWdQYXRoID0gcGF0aC5qb2luKGNvbmZpZy5zcmNEaXIsICdhcHAuanNvbicpXG4gICAgICAgIGxldCBhYnNvbHV0ZVBhdGggPSBjb25maWcuY3dkXG5cbiAgICAgICAgaWYgKHJvb3QpIHtcbiAgICAgICAgICAgIGNvbnN0IHJvb3RQYXRoID0gcGF0aC5qb2luKHBhdGgucmVsYXRpdmUoYW5rYUNvbmZpZy5zb3VyY2VEaXIsIGFua2FDb25maWcuc3ViUGFja2FnZXMpLCByb290KVxuICAgICAgICAgICAgY29uc3Qgc3ViUGtnID0gcHJvamVjdENvbmZpZy5zdWJQYWNrYWdlcy5maW5kKChwa2c6IGFueSkgPT4gcGtnLnJvb3QgPT09IHJvb3RQYXRoKVxuICAgICAgICAgICAgYWJzb2x1dGVQYXRoID0gcGF0aC5qb2luKGFic29sdXRlUGF0aCwgYW5rYUNvbmZpZy5zdWJQYWNrYWdlcywgcm9vdCwgcGFnZVBhdGgpXG5cbiAgICAgICAgICAgIGlmIChzdWJQa2cpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3ViUGtnLnBhZ2VzLmluY2x1ZGVzKHBhZ2VQYXRoKSkge1xuICAgICAgICAgICAgICAgICAgICBsb2dnZXIud2FybignVGhlIHBhZ2UgYWxyZWFkeSBleGlzdHMnLCBhYnNvbHV0ZVBhdGgpXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHN1YlBrZy5wYWdlcy5wdXNoKHBhZ2VQYXRoKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcHJvamVjdENvbmZpZy5zdWJQYWNrYWdlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgcm9vdDogcm9vdFBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHBhZ2VzOiBbcGFnZVBhdGhdXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFic29sdXRlUGF0aCA9IHBhdGguam9pbihhYnNvbHV0ZVBhdGgsIHBhZ2VQYXRoKVxuXG4gICAgICAgICAgICBpZiAocHJvamVjdENvbmZpZy5wYWdlcy5pbmNsdWRlcyhwYWdlUGF0aCkpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIud2FybignVGhlIHBhZ2UgYWxyZWFkeSBleGlzdHMnLCBhYnNvbHV0ZVBhdGgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHByb2plY3RDb25maWcucGFnZXMucHVzaChwYWdlUGF0aClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRwbHMgPSBhd2FpdCB1dGlscy5zZWFyY2hGaWxlcyhgJHtwYXRoLmpvaW4oYW5rYUNvbmZpZy50ZW1wbGF0ZS5wYWdlLCAnKi4qJyl9YClcblxuICAgICAgICB0cGxzLmZvckVhY2godHBsID0+IHtcbiAgICAgICAgICAgIGVkaXRvci5jb3B5KFxuICAgICAgICAgICAgICAgIHRwbCxcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKGFic29sdXRlUGF0aCksIHBhZ2VOYW1lICsgcGF0aC5leHRuYW1lKHRwbCkpLFxuICAgICAgICAgICAgICAgIGNvbnRleHRcbiAgICAgICAgICAgIClcbiAgICAgICAgfSlcbiAgICAgICAgZWRpdG9yLndyaXRlSlNPTihhcHBDb25maWdQYXRoLCBwcm9qZWN0Q29uZmlnLCBudWxsLCA0KVxuXG4gICAgICAgIGF3YWl0IGVkaXRvci5zYXZlKClcblxuICAgICAgICBsb2dnZXIuc3VjY2VzcygnQ3JlYXRlIHBhZ2UnLCBhYnNvbHV0ZVBhdGgucmVwbGFjZShDd2RSZWdFeHAsICcnKSlcbiAgICB9XG59XG4iLCJpbXBvcnQgRGV2IGZyb20gJy4vY29tbWFuZHMvZGV2J1xuaW1wb3J0IFByb2QgZnJvbSAnLi9jb21tYW5kcy9wcm9kJ1xuaW1wb3J0IENyZWF0ZVBhZ2UgZnJvbSAnLi9jb21tYW5kcy9jcmVhdGVQYWdlJ1xuXG5leHBvcnQgZGVmYXVsdCBbXG4gICAgbmV3IFByb2QoKSxcbiAgICBuZXcgRGV2KCksXG4gICAgbmV3IENyZWF0ZVBhZ2UoKVxuXVxuIiwiaW1wb3J0IGNvbmZpZyBmcm9tICcuL2NvbmZpZydcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4vdXRpbHMnXG5pbXBvcnQgKiBhcyBjZm9udHMgZnJvbSAnY2ZvbnRzJ1xuaW1wb3J0IGNvbW1hbmRzIGZyb20gJy4vY29tbWFuZHMnXG5pbXBvcnQgKiBhcyBjb21tYW5kZXIgZnJvbSAnY29tbWFuZGVyJ1xuaW1wb3J0IENvbXBpbGVyIGZyb20gJy4vY29yZS9jbGFzcy9Db21waWxlcidcblxuY29uc3QgcGtnSnNvbiA9IHJlcXVpcmUoJy4uL3BhY2thZ2UuanNvbicpXG5cbnJlcXVpcmUoJ3NvdXJjZS1tYXAtc3VwcG9ydCcpLmluc3RhbGwoKVxuXG5pZiAocHJvY2Vzcy5hcmd2LmluZGV4T2YoJy0tZGVidWcnKSA+IC0xKSB7XG4gICAgY29uZmlnLmFua2FDb25maWcuZGVidWcgPSB0cnVlXG59XG5cbmlmIChwcm9jZXNzLmFyZ3YuaW5kZXhPZignLS1zbGllbnQnKSA+IC0xKSB7XG4gICAgY29uZmlnLmFua2FDb25maWcucXVpZXQgPSB0cnVlXG59XG5cbmNvbW1hbmRlclxuICAgIC5vcHRpb24oJy0tZGVidWcnLCAnZW5hYmxlIGRlYnVnIG1vZGUnKVxuICAgIC5vcHRpb24oJy0tcXVpZXQnLCAnaGlkZSBjb21waWxlIGxvZycpXG4gICAgLnZlcnNpb24ocGtnSnNvbi52ZXJzaW9uKVxuICAgIC51c2FnZSgnPGNvbW1hbmQ+IFtvcHRpb25zXScpXG5cbmNvbW1hbmRzLmZvckVhY2goY29tbWFuZCA9PiB7XG4gICAgY29uc3QgY21kID0gY29tbWFuZGVyLmNvbW1hbmQoY29tbWFuZC5jb21tYW5kKVxuXG4gICAgaWYgKGNvbW1hbmQuZGVzY3JpcHRpb24pIHtcbiAgICAgICAgY21kLmRlc2NyaXB0aW9uKGNvbW1hbmQuZGVzY3JpcHRpb24pXG4gICAgfVxuXG4gICAgaWYgKGNvbW1hbmQudXNhZ2UpIHtcbiAgICAgICAgY21kLnVzYWdlKGNvbW1hbmQudXNhZ2UpXG4gICAgfVxuXG4gICAgaWYgKGNvbW1hbmQub24pIHtcbiAgICAgICAgZm9yIChsZXQga2V5IGluIGNvbW1hbmQub24pIHtcbiAgICAgICAgICAgIGNtZC5vbihrZXksIGNvbW1hbmQub25ba2V5XSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjb21tYW5kLm9wdGlvbnMpIHtcbiAgICAgICAgY29tbWFuZC5vcHRpb25zLmZvckVhY2goKG9wdGlvbjogW2FueSwgYW55LCBhbnksIGFueV0pID0+IHtcbiAgICAgICAgICAgIGNtZC5vcHRpb24oLi4ub3B0aW9uKVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGlmIChjb21tYW5kLmFjdGlvbikge1xuICAgICAgICBjbWQuYWN0aW9uKGFzeW5jICguLi5hcmdzKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IGNvbW1hbmQuYWN0aW9uKC4uLmFyZ3MpXG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoZXJyLm1lc3NhZ2UgfHwgJycpXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGlmIChjb21tYW5kLmV4YW1wbGVzKSB7XG4gICAgICAgIGNtZC5vbignLS1oZWxwJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY29tbWFuZC5wcmludFRpdGxlKCdFeGFtcGxlczonKVxuICAgICAgICAgICAgY29tbWFuZC5leGFtcGxlcy5mb3JFYWNoKGV4YW1wbGUgPT4ge1xuICAgICAgICAgICAgICAgIGNvbW1hbmQucHJpbnRDb250ZW50KGV4YW1wbGUpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgIH1cbn0pXG5cbmlmIChwcm9jZXNzLmFyZ3YubGVuZ3RoID09PSAyKSB7XG4gICAgY2ZvbnRzLnNheSgnQW5rYScsIHtcbiAgICAgICAgZm9udDogJ3NpbXBsZScsXG4gICAgICAgIGNvbG9yczogWydncmVlbkJyaWdodCddXG4gICAgfSlcbiAgICBjb25zb2xlLmxvZygnICBWZXJzaW9uOiAnICsgcGtnSnNvbi52ZXJzaW9uKVxuICAgIGNvbW1hbmRlci5vdXRwdXRIZWxwKClcbn1cblxuY29tbWFuZGVyLnBhcnNlKHByb2Nlc3MuYXJndilcblxuZXhwb3J0IGRlZmF1bHQgQ29tcGlsZXJcbiJdLCJuYW1lcyI6WyJwYXRoLmpvaW4iLCJmcy5leGlzdHNTeW5jIiwiZnMucmVhZEZpbGUiLCJmcy53cml0ZUZpbGUiLCJwYXRoLmRpcm5hbWUiLCJwYXRoLmJhc2VuYW1lIiwicGF0aC5leHRuYW1lIiwicGF0aCIsImZzLmVuc3VyZUZpbGUiLCJsb2ciLCJjaG9raWRhci53YXRjaCIsInNhc3MucmVuZGVyIiwidXRpbHMubG9nZ2VyIiwicG9zdGNzcyIsInRzbGliXzEuX19hc3NpZ24iLCJ3cml0ZUZpbGUiLCJhY29ybi5wYXJzZSIsImFjb3JuV2Fsa2VyLnNpbXBsZSIsImVzY29kZWdlbi5nZW5lcmF0ZSIsInV0aWxzLnJlc29sdmVNb2R1bGUiLCJwYXRoLnJlbGF0aXZlIiwidXRpbHMuY3JlYXRlRmlsZSIsImN3ZCIsImFua2FEZWZhdWx0Q29uZmlnLnRlbXBsYXRlIiwiYW5rYURlZmF1bHRDb25maWcucGFyc2VycyIsImFua2FEZWZhdWx0Q29uZmlnLnBsdWdpbnMiLCJwYXRoLnJlc29sdmUiLCJjdXN0b21Db25maWciLCJzeXN0ZW0uc3JjRGlyIiwidHNsaWJfMS5fX2V4dGVuZHMiLCJ1dGlscy5hc3luY0Z1bmN0aW9uV3JhcHBlciIsInV0aWxzLmNhbGxQcm9taXNlSW5DaGFpbiIsImxvZ2dlciIsInV0aWxzLnNlYXJjaEZpbGVzIiwiZnMuZW5zdXJlRGlyU3luYyIsInV0aWxzLmdlbkZpbGVXYXRjaGVyIiwiZnMudW5saW5rIiwiRnNFZGl0b3IiLCJwYXRoLnNlcCIsIlByb2QiLCJEZXYiLCJDcmVhdGVQYWdlIiwiY29tbWFuZGVyXG4gICAgLm9wdGlvbiIsImNvbW1hbmRlci5jb21tYW5kIiwiY2ZvbnRzLnNheSIsImNvbW1hbmRlci5vdXRwdXRIZWxwIiwiY29tbWFuZGVyLnBhcnNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBR0EsSUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFBO0FBRXpCLHdCQUF5QixLQUF5QixFQUFFLElBQWE7SUFBeEMsc0JBQUEsRUFBQSxVQUF5QjtJQUM5QyxJQUFNLFlBQVksR0FBRyxFQUFFLENBQUE7SUFDdkIsSUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFBLElBQUksSUFBSSxPQUFBQSxTQUFTLENBQUMsSUFBSSxJQUFJLEdBQUcsRUFBRSxJQUFJLENB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
