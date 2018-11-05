#!/usr/bin/env node
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = require('fs-extra');
var chalk = _interopDefault(require('chalk'));
var tslib_1 = require('tslib');
var path = require('path');
var fs$1 = require('fs');
var chokidar = require('chokidar');
var sass = require('node-sass');
var postcssrc = _interopDefault(require('postcss-load-config'));
var acorn = require('acorn');
var escodegen = require('escodegen');
var acornWalker = require('acorn-walk');
var cfonts = require('cfonts');
var commander = require('commander');

var glob = require('glob');
function readFile(sourceFilePath) {
    return new Promise(function (resolve, reject) {
        fs.readFile(sourceFilePath, function (err, buffer) {
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
        fs.writeFile(targetFilePath, content, function (err) {
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
//# sourceMappingURL=editor.js.map

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
        console.error(err);
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
//# sourceMappingURL=logger.js.map

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
                    case 0: return [4, fs.ensureFile(path$$1)];
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
//# sourceMappingURL=File.js.map

function createFile(sourceFile) {
    return readFile(sourceFile).then(function (content) {
        return Promise.resolve(new File({
            sourceFile: sourceFile,
            content: content
        }));
    });
}
//# sourceMappingURL=createFile.js.map

function resolveModule (id, options, silent) {
    try {
        return require.resolve(id, options);
    }
    catch (err) {
        !silent && logger.error('Missing dependency', id, err);
    }
}
//# sourceMappingURL=resolveModule.js.map

var cwd = process.cwd();
function resolveConfig (names, root) {
    if (names === void 0) { names = []; }
    var defaultValue = {};
    var configPaths = names.map(function (name) { return path.join(root || cwd, name); });
    for (var index = 0; index < configPaths.length; index++) {
        var configPath = configPaths[index];
        if (fs$1.existsSync(configPath)) {
            Object.assign(defaultValue, require(configPath));
            break;
        }
    }
    return defaultValue;
}
//# sourceMappingURL=resolveConfig.js.map

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
//# sourceMappingURL=callPromiseInChain.js.map

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
//# sourceMappingURL=asyncFunctionWrapper.js.map

function genFileWatcher (dir, options) {
    return chokidar.watch(dir, tslib_1.__assign({ persistent: true, ignoreInitial: true }, options));
}
//# sourceMappingURL=genFileWatcher.js.map

var validate = require('validate-npm-package-name');
//# sourceMappingURL=isNpmDependency.js.map

//# sourceMappingURL=index.js.map

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
//# sourceMappingURL=postcssWximport.js.map

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
//# sourceMappingURL=index.js.map

var scriptParser = (function (file, compilation, cb) {
    file.updateExt('.js');
    cb();
});
//# sourceMappingURL=scriptParser.js.map

var writeFile$1 = writeFile;
var saveFilePlugin = (function () {
    this.on('after-compile', function (compilation, cb) {
        var file = compilation.file;
        fs.ensureFile(file.targetFile).then(function () {
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
//# sourceMappingURL=index.js.map

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
//# sourceMappingURL=index.js.map

var sourceDir = './src';
var outputDir = './dist';
var pages = path.join(sourceDir, 'pages');
var components = path.join(sourceDir, 'components');
var silent = false;
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
//# sourceMappingURL=ankaDefaultConfig.js.map

var ankaDefaultConfig = /*#__PURE__*/Object.freeze({
    sourceDir: sourceDir,
    outputDir: outputDir,
    pages: pages,
    components: components,
    silent: silent,
    devMode: devMode,
    parsers: parsers,
    debug: debug,
    plugins: plugins
});

var customConfig = resolveConfig(['anka.config.js', 'anka.config.json']);
var ankaConfig = tslib_1.__assign({}, ankaDefaultConfig, customConfig, { parsers: customConfig.parsers ? customConfig.parsers.concat(parsers) : parsers, plugins: plugins.concat(customConfig.plugins || []) });
//# sourceMappingURL=ankaConfig.js.map

var cwd$1 = process.cwd();
var srcDir = path.resolve(cwd$1, ankaConfig.sourceDir);
var distDir = path.resolve(cwd$1, ankaConfig.outputDir);
var ankaModules = path.resolve(srcDir, 'anka_modules');
var sourceNodeModules = path.resolve(cwd$1, './node_modules');
var distNodeModules = path.resolve(distDir, './npm_modules');
var defaultScaffold = 'direct:https://github.com/iException/anka-quickstart';
//# sourceMappingURL=systemConfig.js.map

var systemConfig = /*#__PURE__*/Object.freeze({
    cwd: cwd$1,
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
//# sourceMappingURL=projectConfig.js.map

var config = tslib_1.__assign({}, systemConfig, { ankaConfig: ankaConfig,
    projectConfig: projectConfig });
//# sourceMappingURL=index.js.map

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
//# sourceMappingURL=Injection.js.map

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
                        logger.info('Compile', this.file.sourceFile.replace(config.cwd, ''));
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
//# sourceMappingURL=Compilation.js.map

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
                    case 0: return [4, searchFiles(config.srcDir + "/**/*", {
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
                        fs.ensureDirSync(config.distNodeModules);
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
                        case 0: return [4, fs.unlink(fileName.replace(config.srcDir, config.distDir))];
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
//# sourceMappingURL=Compiler.js.map

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
        this.options = this.options.concat(options);
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
//# sourceMappingURL=Command.js.map

//# sourceMappingURL=index.js.map

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
//# sourceMappingURL=dev.js.map

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
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.initCompiler();
                        return [4, this.$compiler.launch()];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        });
    };
    return DevCommand;
}(Command));
//# sourceMappingURL=prod.js.map

var commands = [
    new DevCommand$1(),
    new DevCommand()
];
//# sourceMappingURL=commands.js.map

var _this = undefined;
var pkgJson = require('../package.json');
require('source-map-support').install();
if (process.argv.indexOf('--debug') > -1) {
    config.ankaConfig.debug = true;
}
logger.info('Launching...');
commander.option('--debug', 'enable debug mode')
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
//# sourceMappingURL=index.js.map

module.exports = Compiler;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlscy9lZGl0b3IudHMiLCIuLi9zcmMvdXRpbHMvbG9nZ2VyLnRzIiwiLi4vc3JjL2NvcmUvY2xhc3MvRmlsZS50cyIsIi4uL3NyYy91dGlscy9jcmVhdGVGaWxlLnRzIiwiLi4vc3JjL3V0aWxzL3Jlc29sdmVNb2R1bGUudHMiLCIuLi9zcmMvdXRpbHMvcmVzb2x2ZUNvbmZpZy50cyIsIi4uL3NyYy91dGlscy9jYWxsUHJvbWlzZUluQ2hhaW4udHMiLCIuLi9zcmMvdXRpbHMvYXN5bmNGdW5jdGlvbldyYXBwZXIudHMiLCIuLi9zcmMvdXRpbHMvZ2VuRmlsZVdhdGNoZXIudHMiLCIuLi9zcmMvdXRpbHMvaXNOcG1EZXBlbmRlbmN5LnRzIiwiLi4vc3JjL3BhcnNlcnMvc2Fzc1BhcnNlci50cyIsIi4uL3NyYy9wYXJzZXJzL3N0eWxlUGFyc2VyL3Bvc3Rjc3NXeGltcG9ydC50cyIsIi4uL3NyYy9wYXJzZXJzL3N0eWxlUGFyc2VyL2luZGV4LnRzIiwiLi4vc3JjL3BhcnNlcnMvc2NyaXB0UGFyc2VyLnRzIiwiLi4vc3JjL3BsdWdpbnMvc2F2ZUZpbGVQbHVnaW4vaW5kZXgudHMiLCIuLi9zcmMvcGx1Z2lucy9leHRyYWN0RGVwZW5kZW5jeVBsdWdpbi9pbmRleC50cyIsIi4uL3NyYy9jb25maWcvYW5rYURlZmF1bHRDb25maWcudHMiLCIuLi9zcmMvY29uZmlnL2Fua2FDb25maWcudHMiLCIuLi9zcmMvY29uZmlnL3N5c3RlbUNvbmZpZy50cyIsIi4uL3NyYy9jb25maWcvcHJvamVjdENvbmZpZy50cyIsIi4uL3NyYy9jb25maWcvaW5kZXgudHMiLCIuLi9zcmMvY29yZS9jbGFzcy9JbmplY3Rpb24udHMiLCIuLi9zcmMvY29yZS9jbGFzcy9Db21waWxhdGlvbi50cyIsIi4uL3NyYy9jb3JlL2NsYXNzL0NvbXBpbGVyLnRzIiwiLi4vc3JjL2NvcmUvY2xhc3MvQ29tbWFuZC50cyIsIi4uL3NyYy9jb21tYW5kcy9kZXYudHMiLCIuLi9zcmMvY29tbWFuZHMvcHJvZC50cyIsIi4uL3NyYy9jb21tYW5kcy50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBHbG9iIGZyb20gJ2dsb2InXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSdcbmNvbnN0IGdsb2IgPSByZXF1aXJlKCdnbG9iJylcblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRGaWxlIChzb3VyY2VGaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxCdWZmZXI+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBmcy5yZWFkRmlsZShzb3VyY2VGaWxlUGF0aCwgKGVyciwgYnVmZmVyKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShidWZmZXIpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlRmlsZSAodGFyZ2V0RmlsZVBhdGg6IHN0cmluZywgY29udGVudDogQ29udGVudCk6IFByb21pc2U8dW5kZWZpbmVkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgZnMud3JpdGVGaWxlKHRhcmdldEZpbGVQYXRoLCBjb250ZW50LCBlcnIgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikgdGhyb3cgZXJyXG4gICAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgfSlcbiAgICB9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VhcmNoRmlsZXMgKHNjaGVtZTogc3RyaW5nLCBvcHRpb25zPzogR2xvYi5JT3B0aW9ucyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBnbG9iKHNjaGVtZSwgb3B0aW9ucywgKGVycjogKEVycm9yIHwgbnVsbCksIGZpbGVzOiBBcnJheTxzdHJpbmc+KTogdm9pZCA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShmaWxlcylcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9KVxufVxuIiwiaW1wb3J0IGNoYWxrIGZyb20gJ2NoYWxrJ1xuY29uc3Qgb3JhID0gcmVxdWlyZSgnb3JhJylcblxuZXhwb3J0IGZ1bmN0aW9uIHRvRml4IChudW1iZXI6IG51bWJlcik6IHN0cmluZyB7XG4gICAgcmV0dXJuICgnMDAnICsgbnVtYmVyKS5zbGljZSgtMilcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRUaW1lICgpOiBzdHJpbmcge1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKClcbiAgICByZXR1cm4gYCR7dG9GaXgobm93LmdldEhvdXJzKCkpfToke3RvRml4KG5vdy5nZXRNaW51dGVzKCkpfToke3RvRml4KG5vdy5nZXRTZWNvbmRzKCkpfWBcbn1cblxuZXhwb3J0IGNsYXNzIExvZ2dlciB7XG4gICAgb3JhSW5zdGFuY2U6IGFueVxuXG4gICAgZ2V0IHRpbWUgKCkge1xuICAgICAgICByZXR1cm4gY2hhbGsuZ3JleShgWyR7Z2V0Q3VycmVudFRpbWUoKX1dYClcbiAgICB9XG5cbiAgICBzdGFydExvYWRpbmcgKG1zZzogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMub3JhSW5zdGFuY2UgPSBvcmEobXNnKS5zdGFydCgpXG4gICAgfVxuXG4gICAgc3RvcExvYWRpbmcgKCkge1xuICAgICAgICB0aGlzLm9yYUluc3RhbmNlICYmIHRoaXMub3JhSW5zdGFuY2Uuc3RvcCgpXG4gICAgfVxuXG4gICAgbG9nICguLi5tc2c6IEFycmF5PHN0cmluZz4pIHtcbiAgICAgICAgcmV0dXJuIGNvbnNvbGUubG9nKHRoaXMudGltZSwgLi4ubXNnKVxuICAgIH1cblxuICAgIGVycm9yICh0aXRsZTogc3RyaW5nID0gJycsIG1zZzogc3RyaW5nID0gJycsIGVycjogRXJyb3IpIHtcbiAgICAgICAgdGhpcy5sb2coY2hhbGsucmVkKCfinJgnKSwgY2hhbGsucmVzZXQodGl0bGUpLCBjaGFsay5ncmV5KG1zZykpXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgIH1cblxuICAgIGluZm8gKHRpdGxlOiBzdHJpbmcgPSAnJywgbXNnOiBzdHJpbmcgPSAnJykge1xuICAgICAgICB0aGlzLmxvZyhjaGFsay5jeWFuKCfil4snKSwgY2hhbGsucmVzZXQodGl0bGUpLCBjaGFsay5ncmV5KG1zZykpXG4gICAgfVxuXG4gICAgd2FybiAodGl0bGU6IHN0cmluZyA9ICcnLCBtc2c6IHN0cmluZyA9ICcnKSB7XG4gICAgICAgIHRoaXMubG9nKGNoYWxrLnllbGxvdygn4pqgJyksIGNoYWxrLnJlc2V0KHRpdGxlKSwgY2hhbGsuZ3JleShtc2cpKVxuICAgIH1cblxuICAgIHN1Y2Nlc3MgKHRpdGxlOiBzdHJpbmcgPSAnJywgbXNnOiBzdHJpbmcgPSAnJykge1xuICAgICAgICB0aGlzLmxvZyhjaGFsay5ncmVlbign4pyUJyksIGNoYWxrLnJlc2V0KHRpdGxlKSwgY2hhbGsuZ3JleShtc2cpKVxuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgbmV3IExvZ2dlcigpXG4iLCJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgKiBhcyBhY29ybiBmcm9tICdhY29ybidcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJ1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuLi8uLi9jb25maWcnXG5cbmNvbnN0IHJlcGxhY2VFeHQgPSByZXF1aXJlKCdyZXBsYWNlLWV4dCcpXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZpbGUge1xuICAgIHB1YmxpYyBzb3VyY2VGaWxlOiBzdHJpbmdcbiAgICBwdWJsaWMgY29udGVudDogQ29udGVudFxuICAgIHB1YmxpYyB0YXJnZXRGaWxlOiBzdHJpbmdcbiAgICBwdWJsaWMgYXN0PzogYWNvcm4uTm9kZVxuICAgIHB1YmxpYyBzb3VyY2VNYXA/OiBDb250ZW50XG5cbiAgICBjb25zdHJ1Y3RvciAob3B0aW9uOiBGaWxlQ29uc3RydWN0b3JPcHRpb24pIHtcbiAgICAgICAgaWYgKCFvcHRpb24uc291cmNlRmlsZSkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHZhbHVlOiBGaWxlQ29uc3RydWN0b3JPcHRpb24uc291cmNlRmlsZScpXG4gICAgICAgIGlmICghb3B0aW9uLmNvbnRlbnQpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCB2YWx1ZTogRmlsZUNvbnN0cnVjdG9yT3B0aW9uLmNvbnRlbnQnKVxuXG4gICAgICAgIHRoaXMuc291cmNlRmlsZSA9IG9wdGlvbi5zb3VyY2VGaWxlXG4gICAgICAgIHRoaXMudGFyZ2V0RmlsZSA9IG9wdGlvbi50YXJnZXRGaWxlIHx8IG9wdGlvbi5zb3VyY2VGaWxlLnJlcGxhY2UoY29uZmlnLnNyY0RpciwgY29uZmlnLmRpc3REaXIpIC8vIERlZmF1bHQgdmFsdWVcbiAgICAgICAgdGhpcy5jb250ZW50ID0gb3B0aW9uLmNvbnRlbnRcbiAgICAgICAgdGhpcy5zb3VyY2VNYXAgPSBvcHRpb24uc291cmNlTWFwXG4gICAgfVxuXG4gICAgZ2V0IGRpcm5hbWUgKCkge1xuICAgICAgICByZXR1cm4gcGF0aC5kaXJuYW1lKHRoaXMuc291cmNlRmlsZSlcbiAgICB9XG5cbiAgICBnZXQgYmFzZW5hbWUgKCkge1xuICAgICAgICByZXR1cm4gcGF0aC5iYXNlbmFtZSh0aGlzLnNvdXJjZUZpbGUpXG4gICAgfVxuXG4gICAgZ2V0IGV4dG5hbWUgKCkge1xuICAgICAgICByZXR1cm4gcGF0aC5leHRuYW1lKHRoaXMuc291cmNlRmlsZSlcbiAgICB9XG5cbiAgICBhc3luYyBzYXZlVG8gKHBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCBmcy5lbnN1cmVGaWxlKHBhdGgpXG5cbiAgICAgICAgaWYgKCFwYXRoKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgcGF0aCcpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1cGRhdGVFeHQgKGV4dDogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIHRoaXMudGFyZ2V0RmlsZSA9IHJlcGxhY2VFeHQodGhpcy50YXJnZXRGaWxlLCBleHQpXG4gICAgfVxufVxuIiwiaW1wb3J0IHtcbiAgICByZWFkRmlsZVxufSBmcm9tICcuL2VkaXRvcidcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJ1xuaW1wb3J0IEZpbGUgZnJvbSAnLi4vY29yZS9jbGFzcy9GaWxlJ1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRmlsZSAoc291cmNlRmlsZTogc3RyaW5nKTogUHJvbWlzZTxGaWxlPiB7XG4gICAgcmV0dXJuIHJlYWRGaWxlKHNvdXJjZUZpbGUpLnRoZW4oY29udGVudCA9PiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IEZpbGUoe1xuICAgICAgICAgICAgc291cmNlRmlsZSxcbiAgICAgICAgICAgIGNvbnRlbnRcbiAgICAgICAgfSkpXG4gICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUZpbGVTeW5jIChzb3VyY2VGaWxlOiBzdHJpbmcpIHtcbiAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHNvdXJjZUZpbGUpXG4gICAgcmV0dXJuIG5ldyBGaWxlKHtcbiAgICAgICAgc291cmNlRmlsZSxcbiAgICAgICAgY29udGVudFxuICAgIH0pXG59XG4iLCJpbXBvcnQgbG9nIGZyb20gJy4vbG9nZ2VyJ1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAoaWQ6IHN0cmluZywgb3B0aW9ucz86IHsgcGF0aHM/OiBzdHJpbmdbXSB9LCBzaWxlbnQ/OiBib29sZWFuKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUucmVzb2x2ZShpZCwgb3B0aW9ucylcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgIXNpbGVudCAmJiBsb2cuZXJyb3IoJ01pc3NpbmcgZGVwZW5kZW5jeScsIGlkLCBlcnIpXG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5cbmNvbnN0IGN3ZCA9IHByb2Nlc3MuY3dkKClcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKG5hbWVzOiBBcnJheTxzdHJpbmc+ID0gW10sIHJvb3Q/OiBzdHJpbmcpOiBPYmplY3Qge1xuICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IHt9XG4gICAgY29uc3QgY29uZmlnUGF0aHMgPSBuYW1lcy5tYXAobmFtZSA9PiBwYXRoLmpvaW4ocm9vdCB8fCBjd2QsIG5hbWUpKVxuXG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGNvbmZpZ1BhdGhzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICBjb25zdCBjb25maWdQYXRoID0gY29uZmlnUGF0aHNbaW5kZXhdXG5cbiAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoY29uZmlnUGF0aCkpIHtcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oZGVmYXVsdFZhbHVlLCByZXF1aXJlKGNvbmZpZ1BhdGgpKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkZWZhdWx0VmFsdWVcbn1cbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNhbGxQcm9taXNlSW5DaGFpbiAobGlzdDogQXJyYXk8KC4uLnBhcmFtczogYW55W10pID0+IFByb21pc2U8YW55Pj4gPSBbXSwgLi4ucGFyYW1zOiBBcnJheTxhbnk+KSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgaWYgKCFsaXN0Lmxlbmd0aCkgIHtcbiAgICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgbGV0IHN0ZXAgPSBsaXN0WzBdKC4uLnBhcmFtcylcblxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHN0ZXAgPSBzdGVwLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsaXN0W2ldKC4uLnBhcmFtcylcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICBzdGVwLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICB9LCBlcnIgPT4ge1xuICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgfSlcbiAgICB9KVxufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKGZuOiBGdW5jdGlvbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoLi4ucGFyYW1zOiBBcnJheTxhbnk+KSB7XG4gICAgICAgIGNvbnN0IGxpbWl0YXRpb24gPSBwYXJhbXMubGVuZ3RoXG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgaWYgKGZuLmxlbmd0aCA+IGxpbWl0YXRpb24pIHtcbiAgICAgICAgICAgICAgICBmbiguLi5wYXJhbXMsIHJlc29sdmUpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoZm4oLi4ucGFyYW1zKSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBjaG9raWRhciBmcm9tICdjaG9raWRhcidcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKGRpcjogc3RyaW5nIHwgc3RyaW5nW10sIG9wdGlvbnM/OiBjaG9raWRhci5XYXRjaE9wdGlvbnMpIHtcbiAgICByZXR1cm4gY2hva2lkYXIud2F0Y2goZGlyLCB7XG4gICAgICAgIHBlcnNpc3RlbnQ6IHRydWUsXG4gICAgICAgIGlnbm9yZUluaXRpYWw6IHRydWUsXG4gICAgICAgIC4uLm9wdGlvbnNcbiAgICB9KVxufVxuIiwiZGVjbGFyZSB0eXBlIFZhbGlkYXRlTnBtUGFja2FnZU5hbWUgPSB7XG4gICAgdmFsaWRGb3JOZXdQYWNrYWdlczogYm9vbGVhbixcbiAgICB2YWxpZEZvck9sZFBhY2thZ2VzOiBib29sZWFuXG59XG5cbmNvbnN0IHZhbGlkYXRlID0gcmVxdWlyZSgndmFsaWRhdGUtbnBtLXBhY2thZ2UtbmFtZScpXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChyZXF1aXJlZDogc3RyaW5nID0gJycpIHtcbiAgICBjb25zdCByZXN1bHQgPSA8VmFsaWRhdGVOcG1QYWNrYWdlTmFtZT52YWxpZGF0ZShyZXF1aXJlZC5zcGxpdCgnLycpLnNsaWNlKDAsIDIpLmpvaW4oJy8nKSlcblxuICAgIHJldHVybiByZXN1bHQudmFsaWRGb3JOZXdQYWNrYWdlcyB8fCByZXN1bHQudmFsaWRGb3JPbGRQYWNrYWdlc1xufVxuIiwiaW1wb3J0IGNvbmZpZyBmcm9tICcuLi9jb25maWcnXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi91dGlscydcbmltcG9ydCAqIGFzIHNhc3MgZnJvbSAnbm9kZS1zYXNzJ1xuaW1wb3J0IEZpbGUgZnJvbSAnLi4vY29yZS9jbGFzcy9GaWxlJ1xuXG4vKipcbiAqIFNhc3MgZmlsZSBwYXJzZXIuXG4gKiBAZm9yIGFueSBmaWxlIHRoYXQgZG9lcyBub3QgbWF0Y2hlIHBhcnNlcnMuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IDxQYXJzZXI+ZnVuY3Rpb24gKHRoaXM6IFBhcnNlckluamVjdGlvbiwgZmlsZTogRmlsZSwgY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYWxsYmFjaz86IEZ1bmN0aW9uKSB7XG4gICAgZmlsZS5jb250ZW50ID0gZmlsZS5jb250ZW50IGluc3RhbmNlb2YgQnVmZmVyID8gZmlsZS5jb250ZW50LnRvU3RyaW5nKCkgOiBmaWxlLmNvbnRlbnRcblxuICAgIHNhc3MucmVuZGVyKHtcbiAgICAgICAgZmlsZTogZmlsZS5zb3VyY2VGaWxlLFxuICAgICAgICBkYXRhOiBmaWxlLmNvbnRlbnQsXG4gICAgICAgIG91dHB1dFN0eWxlOiAhY29uZmlnLmFua2FDb25maWcuZGV2TW9kZSA/ICduZXN0ZWQnIDogJ2NvbXByZXNzZWQnXG4gICAgfSwgKGVycjogRXJyb3IsIHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIHV0aWxzLmxvZ2dlci5lcnJvcignQ29tcGlsZScsIGVyci5tZXNzYWdlLCBlcnIpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmaWxlLmNvbnRlbnQgPSByZXN1bHQuY3NzXG4gICAgICAgICAgICBmaWxlLnVwZGF0ZUV4dCgnLnd4c3MnKVxuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrKClcbiAgICB9KVxufVxuIiwiY29uc3QgcG9zdGNzcyA9IHJlcXVpcmUoJ3Bvc3Rjc3MnKVxuXG5leHBvcnQgZGVmYXVsdCBwb3N0Y3NzLnBsdWdpbigncG9zdGNzcy13eGltcG9ydCcsICgpID0+IHtcbiAgICByZXR1cm4gKHJvb3Q6IGFueSkgPT4ge1xuICAgICAgICByb290LndhbGtBdFJ1bGVzKCd3eGltcG9ydCcsIChydWxlOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHJ1bGUubmFtZSA9ICdpbXBvcnQnXG4gICAgICAgICAgICBydWxlLnBhcmFtcyA9IHJ1bGUucGFyYW1zLnJlcGxhY2UoL1xcLlxcdysoPz1bJ1wiXSQpLywgJy53eHNzJylcbiAgICAgICAgfSlcbiAgICB9XG59KVxuIiwiaW1wb3J0ICogYXMgUG9zdGNzcyBmcm9tICdwb3N0Y3NzJ1xuaW1wb3J0IHBvc3Rjc3NyYyBmcm9tICdwb3N0Y3NzLWxvYWQtY29uZmlnJ1xuaW1wb3J0IHBvc3Rjc3NXeEltcG9ydCBmcm9tICcuL3Bvc3Rjc3NXeGltcG9ydCdcblxuY29uc3QgcG9zdGNzcyA9IHJlcXVpcmUoJ3Bvc3Rjc3MnKVxuY29uc3QgcG9zdGNzc0NvbmZpZzogYW55ID0ge31cblxuLyoqXG4gKiBTdHlsZSBmaWxlIHBhcnNlci5cbiAqIEBmb3IgLnd4c3MgLmNzcyA9PiAud3hzc1xuICovXG5leHBvcnQgZGVmYXVsdCA8UGFyc2VyPmZ1bmN0aW9uICh0aGlzOiBQYXJzZXJJbmplY3Rpb24sIGZpbGU6IEZpbGUsIGNvbXBpbGF0aW9uOiBDb21waWxhdGlvbiwgY2I6IEZ1bmN0aW9uKTogdm9pZCB7XG4gICAgZ2VuUG9zdGNzc0NvbmZpZygpLnRoZW4oKGNvbmZpZzogYW55KSA9PiB7XG4gICAgICAgIGZpbGUuY29udGVudCA9IGZpbGUuY29udGVudCBpbnN0YW5jZW9mIEJ1ZmZlciA/IGZpbGUuY29udGVudC50b1N0cmluZygpIDogZmlsZS5jb250ZW50XG5cbiAgICAgICAgcmV0dXJuIHBvc3Rjc3MoY29uZmlnLnBsdWdpbnMuY29uY2F0KFtwb3N0Y3NzV3hJbXBvcnRdKSkucHJvY2VzcyhmaWxlLmNvbnRlbnQsIHtcbiAgICAgICAgICAgIC4uLmNvbmZpZy5vcHRpb25zLFxuICAgICAgICAgICAgZnJvbTogZmlsZS5zb3VyY2VGaWxlXG4gICAgICAgIH0gYXMgUG9zdGNzcy5Qcm9jZXNzT3B0aW9ucylcbiAgICB9KS50aGVuKChyb290OiBQb3N0Y3NzLkxhenlSZXN1bHQpID0+IHtcbiAgICAgICAgZmlsZS5jb250ZW50ID0gcm9vdC5jc3NcbiAgICAgICAgZmlsZS51cGRhdGVFeHQoJy53eHNzJylcbiAgICAgICAgY2IoKVxuICAgIH0pXG59XG5cblxuZnVuY3Rpb24gZ2VuUG9zdGNzc0NvbmZpZyAoKSB7XG4gICAgcmV0dXJuIHBvc3Rjc3NDb25maWcucGx1Z2lucyA/IFByb21pc2UucmVzb2x2ZShwb3N0Y3NzQ29uZmlnKSA6IHBvc3Rjc3NyYyh7fSkudGhlbigoY29uZmlnOiBhbnkpID0+IHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShPYmplY3QuYXNzaWduKHBvc3Rjc3NDb25maWcsIGNvbmZpZykpXG4gICAgfSlcbn1cbiIsImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBjb25maWcgZnJvbSAnLi4vY29uZmlnJ1xuaW1wb3J0IEZpbGUgZnJvbSAnLi4vY29yZS9jbGFzcy9GaWxlJ1xuXG4vKipcbiAqIFNjcmlwdCBGaWxlIHBhcnNlci5cbiAqIEBmb3IgLmpzIC5lc1xuICovXG5leHBvcnQgZGVmYXVsdCA8UGFyc2VyPmZ1bmN0aW9uICh0aGlzOiBQYXJzZXJJbmplY3Rpb24sIGZpbGU6IEZpbGUsIGNvbXBpbGF0aW9uOiBDb21waWxhdGlvbiwgY2I6IEZ1bmN0aW9uKSB7XG4gICAgLy8gdGhpcy5yZXNvdXJjZVR5cGUgPSBSRVNPVVJDRV9UWVBFLk9USEVSXG4gICAgLy8gZmlsZS50YXJnZXRGaWxlID0gZmlsZS50YXJnZXRGaWxlLnJlcGxhY2UoY29uZmlnLnNyY0RpciwgY29uZmlnLmRpc3REaXIpXG4gICAgZmlsZS51cGRhdGVFeHQoJy5qcycpXG4gICAgY2IoKVxufVxuIiwiaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vLi4vdXRpbHMnXG5pbXBvcnQgbG9nZ2VyIGZyb20gJy4uLy4uL3V0aWxzL2xvZ2dlcidcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJ1xuXG5jb25zdCB7IHdyaXRlRmlsZSB9ID0gdXRpbHNcblxuZXhwb3J0IGRlZmF1bHQgPFBsdWdpbj5mdW5jdGlvbiAodGhpczogUGx1Z2luSW5qZWN0aW9uKSB7XG4gICAgdGhpcy5vbignYWZ0ZXItY29tcGlsZScsIDxQbHVnaW5IYW5kbGVyPmZ1bmN0aW9uIChjb21waWxhdGlvbjogQ29tcGlsYXRpb24sIGNiOiBGdW5jdGlvbikge1xuICAgICAgICBjb25zdCBmaWxlID0gY29tcGlsYXRpb24uZmlsZVxuXG4gICAgICAgIC8vIFRPRE86IFVzZSBtZW0tZnNcbiAgICAgICAgZnMuZW5zdXJlRmlsZShmaWxlLnRhcmdldEZpbGUpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHdyaXRlRmlsZShmaWxlLnRhcmdldEZpbGUsIGZpbGUuY29udGVudClcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBjb21waWxhdGlvbi5kZXN0cm95KClcbiAgICAgICAgICAgIGNiKClcbiAgICAgICAgfSwgZXJyID0+IHtcbiAgICAgICAgICAgIGxvZ2dlci5lcnJvcignRXJyb3InLCBlcnIubWVzc2FnZSwgZXJyKVxuICAgICAgICAgICAgY29tcGlsYXRpb24uZGVzdHJveSgpXG4gICAgICAgICAgICBjYigpXG4gICAgICAgIH0pXG4gICAgfSlcbn1cbiIsImltcG9ydCB7XG4gICAgRmlsZSxcbiAgICBDb21waWxlclxufSBmcm9tICcuLi8uLi9jb3JlJ1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0ICogYXMgYWNvcm4gZnJvbSAnYWNvcm4nXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi8uLi91dGlscydcbmltcG9ydCAqIGFzIGVzY29kZWdlbiBmcm9tICdlc2NvZGVnZW4nXG5pbXBvcnQgKiBhcyBhY29ybldhbGtlciBmcm9tICdhY29ybi13YWxrJ1xuXG5jb25zdCBkZXBlbmRlbmN5UG9vbCA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KClcblxuZXhwb3J0IGRlZmF1bHQgPFBsdWdpbj4gZnVuY3Rpb24gKHRoaXM6IFBsdWdpbkluamVjdGlvbikge1xuICAgIGNvbnN0IGNvbXBpbGVyID0gdGhpcy5nZXRDb21waWxlcigpXG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5nZXRTeXN0ZW1Db25maWcoKVxuICAgIGNvbnN0IHRlc3ROb2RlTW9kdWxlcyA9IG5ldyBSZWdFeHAoYF4ke2NvbmZpZy5zb3VyY2VOb2RlTW9kdWxlc31gKVxuXG4gICAgdGhpcy5vbignYmVmb3JlLWNvbXBpbGUnLCBmdW5jdGlvbiAoY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYjogRnVuY3Rpb24pIHtcbiAgICAgICAgY29uc3QgZmlsZSA9IGNvbXBpbGF0aW9uLmZpbGVcbiAgICAgICAgY29uc3QgbG9jYWxEZXBlbmRlbmN5UG9vbCA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KClcblxuICAgICAgICAvLyBPbmx5IHJlc29sdmUganMgZmlsZS5cbiAgICAgICAgaWYgKGZpbGUuZXh0bmFtZSA9PT0gJy5qcycpIHtcbiAgICAgICAgICAgIGlmIChmaWxlLmFzdCA9PT0gdm9pZCAoMCkpIHtcbiAgICAgICAgICAgICAgICBmaWxlLmFzdCA9IGFjb3JuLnBhcnNlKFxuICAgICAgICAgICAgICAgICAgICBmaWxlLmNvbnRlbnQgaW5zdGFuY2VvZiBCdWZmZXIgPyBmaWxlLmNvbnRlbnQudG9TdHJpbmcoKSA6IGZpbGUuY29udGVudCxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlVHlwZTogJ21vZHVsZSdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFjb3JuV2Fsa2VyLnNpbXBsZSAoZmlsZS5hc3QsIHtcbiAgICAgICAgICAgICAgICBJbXBvcnREZWNsYXJhdGlvbiAobm9kZTogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNvdXJjZSA9IG5vZGUuc291cmNlXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2UudmFsdWUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZS50eXBlID09PSAnTGl0ZXJhbCcgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiBzb3VyY2UudmFsdWUgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShzb3VyY2UsIGZpbGUuc291cmNlRmlsZSwgZmlsZS50YXJnZXRGaWxlLCBsb2NhbERlcGVuZGVuY3lQb29sKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBDYWxsRXhwcmVzc2lvbiAobm9kZTogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNhbGxlZSA9IG5vZGUuY2FsbGVlXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFyZ3MgPSBub2RlLmFyZ3VtZW50c1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxlZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnc1swXSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnc1swXS52YWx1ZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGVlLm5hbWUgPT09ICdyZXF1aXJlJyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnc1swXS50eXBlID09PSAnTGl0ZXJhbCcgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiBhcmdzWzBdLnZhbHVlID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYXJnc1swXSwgZmlsZS5zb3VyY2VGaWxlLCBmaWxlLnRhcmdldEZpbGUsIGxvY2FsRGVwZW5kZW5jeVBvb2wpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgZmlsZS5jb250ZW50ID0gZXNjb2RlZ2VuLmdlbmVyYXRlKGZpbGUuYXN0KVxuXG4gICAgICAgICAgICBjb25zdCBkZXBlbmRlbmN5TGlzdCA9IEFycmF5LmZyb20obG9jYWxEZXBlbmRlbmN5UG9vbC5rZXlzKCkpLmZpbHRlcihkZXBlbmRlbmN5ID0+ICFkZXBlbmRlbmN5UG9vbC5oYXMoZGVwZW5kZW5jeSkpXG5cbiAgICAgICAgICAgIFByb21pc2UuYWxsKGRlcGVuZGVuY3lMaXN0Lm1hcChkZXBlbmRlbmN5ID0+IHRyYXZlcnNlTnBtRGVwZW5kZW5jeShkZXBlbmRlbmN5KSkpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNiKClcbiAgICAgICAgICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgY2IoKVxuICAgICAgICAgICAgICAgIHV0aWxzLmxvZ2dlci5lcnJvcihmaWxlLnNvdXJjZUZpbGUsIGVyci5tZXNzYWdlLCBlcnIpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2IoKVxuICAgICAgICB9XG4gICAgfSBhcyBQbHVnaW5IYW5kbGVyKVxuXG4gICAgZnVuY3Rpb24gcmVzb2x2ZSAobm9kZTogYW55LCBzb3VyY2VGaWxlOiBzdHJpbmcsIHRhcmdldEZpbGU6IHN0cmluZywgbG9jYWxEZXBlbmRlbmN5UG9vbDogTWFwPHN0cmluZywgc3RyaW5nPikge1xuICAgICAgICBjb25zdCBzb3VyY2VCYXNlTmFtZSA9IHBhdGguZGlybmFtZShzb3VyY2VGaWxlKVxuICAgICAgICBjb25zdCB0YXJnZXRCYXNlTmFtZSA9IHBhdGguZGlybmFtZSh0YXJnZXRGaWxlKVxuICAgICAgICBjb25zdCBkZXBlbmRlbmN5ID0gdXRpbHMucmVzb2x2ZU1vZHVsZShub2RlLnZhbHVlLCB7XG4gICAgICAgICAgICBwYXRoczogW3NvdXJjZUJhc2VOYW1lXVxuICAgICAgICB9KVxuXG4gICAgICAgIGlmICh0ZXN0Tm9kZU1vZHVsZXMudGVzdChkZXBlbmRlbmN5KSkge1xuICAgICAgICAgICAgY29uc3QgZGlzdFBhdGggPSBkZXBlbmRlbmN5LnJlcGxhY2UoY29uZmlnLnNvdXJjZU5vZGVNb2R1bGVzLCBjb25maWcuZGlzdE5vZGVNb2R1bGVzKVxuXG4gICAgICAgICAgICBub2RlLnZhbHVlID0gcGF0aC5yZWxhdGl2ZSh0YXJnZXRCYXNlTmFtZSwgZGlzdFBhdGgpXG5cbiAgICAgICAgICAgIGlmIChsb2NhbERlcGVuZGVuY3lQb29sLmhhcyhkZXBlbmRlbmN5KSkgcmV0dXJuXG4gICAgICAgICAgICBsb2NhbERlcGVuZGVuY3lQb29sLnNldChkZXBlbmRlbmN5LCBkZXBlbmRlbmN5KVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdHJhdmVyc2VOcG1EZXBlbmRlbmN5MiAoZGVwZW5kZW5jeTogc3RyaW5nKSB7XG4gICAgICAgIGlmIChkZXBlbmRlbmN5UG9vbC5oYXMoZGVwZW5kZW5jeSkpIHJldHVyblxuICAgICAgICBkZXBlbmRlbmN5UG9vbC5zZXQoZGVwZW5kZW5jeSwgZGVwZW5kZW5jeSlcblxuICAgICAgICBjb25zdCBmaWxlID0gdXRpbHMuY3JlYXRlRmlsZVN5bmMoZGVwZW5kZW5jeSlcblxuICAgICAgICBmaWxlLnRhcmdldEZpbGUgPSBmaWxlLnNvdXJjZUZpbGUucmVwbGFjZShjb25maWcuc291cmNlTm9kZU1vZHVsZXMsIGNvbmZpZy5kaXN0Tm9kZU1vZHVsZXMpXG4gICAgICAgIGNvbXBpbGVyLmdlbmVyYXRlQ29tcGlsYXRpb24oZmlsZSkucnVuKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvLyBsb2dnZXIuaW5mbygnUmVzb2x2ZScsIGRlcGVuZGVuY3kpXG4gICAgICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICB1dGlscy5sb2dnZXIuZXJyb3IoZGVwZW5kZW5jeSwgZXJyLm1lc3NhZ2UsIGVycilcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBhc3luYyBmdW5jdGlvbiB0cmF2ZXJzZU5wbURlcGVuZGVuY3kgKGRlcGVuZGVuY3k6IHN0cmluZykge1xuICAgICAgICBkZXBlbmRlbmN5UG9vbC5zZXQoZGVwZW5kZW5jeSwgZGVwZW5kZW5jeSlcbiAgICAgICAgY29uc3QgZmlsZSA9IGF3YWl0IHV0aWxzLmNyZWF0ZUZpbGUoZGVwZW5kZW5jeSlcblxuICAgICAgICBmaWxlLnRhcmdldEZpbGUgPSBmaWxlLnNvdXJjZUZpbGUucmVwbGFjZShjb25maWcuc291cmNlTm9kZU1vZHVsZXMsIGNvbmZpZy5kaXN0Tm9kZU1vZHVsZXMpXG4gICAgICAgIGF3YWl0IGNvbXBpbGVyLmdlbmVyYXRlQ29tcGlsYXRpb24oZmlsZSkucnVuKClcbiAgICB9XG5cbn1cbiIsIi8vIGltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBzYXNzUGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvc2Fzc1BhcnNlcidcbmltcG9ydCBmaWxlUGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvZmlsZVBhcnNlcidcbmltcG9ydCBzdHlsZVBhcnNlciBmcm9tICcuLi9wYXJzZXJzL3N0eWxlUGFyc2VyJ1xuaW1wb3J0IHNjcmlwdFBhcnNlciBmcm9tICcuLi9wYXJzZXJzL3NjcmlwdFBhcnNlcidcbmltcG9ydCB0ZW1wbGF0ZVBhcnNlciBmcm9tICcuLi9wYXJzZXJzL3RlbXBsYXRlUGFyc2VyJ1xuaW1wb3J0IHNhdmVGaWxlUGx1Z2luIGZyb20gJy4uL3BsdWdpbnMvc2F2ZUZpbGVQbHVnaW4nXG5pbXBvcnQgZXh0cmFjdERlcGVuZGVuY3lQbHVnaW4gZnJvbSAnLi4vcGx1Z2lucy9leHRyYWN0RGVwZW5kZW5jeVBsdWdpbidcblxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICAgICAgICAgICAgICAgICAgIERhbmdlciB6b25lXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbi8qKlxuICogVGhlIHBhdGggd2hlcmUgV2VDaGF0IG1pbmlwcm9ncmFtIHNvdXJjZSBmaWxlcyBleGlzdC5cbiAqIEBkZWZhdWx0ICcuL3NyYydcbiAqL1xuZXhwb3J0IGNvbnN0IHNvdXJjZURpciA9ICcuL3NyYydcblxuLyoqXG4gKiBUaGUgcGF0aCB3aGVyZSBXZUNoYXQgbWluaXByb2dyYW0gY29tcGlsZWQgZmlsZXMgZXhpc3QuXG4gKiBAZGVmYXVsdCAnLi9kaXN0J1xuICovXG5leHBvcnQgY29uc3Qgb3V0cHV0RGlyID0gJy4vZGlzdCdcblxuLyoqXG4gKiBUaGUgcGF0aCB3aGVyZSBXZUNoYXQgbWluaXByb2dyYW0gcGFnZXMgZXhpc3QuXG4gKiBAZGVmYXVsdCAnLi9zcmMvcGFnZXMnXG4gKi9cbmV4cG9ydCBjb25zdCBwYWdlcyA9IHBhdGguam9pbihzb3VyY2VEaXIsICdwYWdlcycpXG5cbi8qKlxuICogVGhlIHBhdGggd2hlcmUgV2VDaGF0IG1pbmlwcm9ncmFtIGNvbXBvbmVudHMgZXhpc3QuXG4gKiBAZGVmYXVsdCAnLi9zcmMvY29tcG9uZW50cydcbiAqL1xuZXhwb3J0IGNvbnN0IGNvbXBvbmVudHMgPSBwYXRoLmpvaW4oc291cmNlRGlyLCAnY29tcG9uZW50cycpXG5cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgICAgICAgICAgICAgICAgQ3VzdG9tIGNvbmZpZ3VyZVxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4vKipcbiAqIFdoZXRoZXIgdG8gb3V0cHV0IGNvbXBpbGUgaW5mb3JtYXRpb24uXG4gKiBAZGVmYXVsdCBmYWxzZVxuICovXG5leHBvcnQgY29uc3Qgc2lsZW50ID0gZmFsc2VcblxuLyoqXG4gKiBBbmthIGRldmVsb3BtZW50IG1vZGUuXG4gKiBAZGVmYXVsdCBmYWxzZVxuICovXG5leHBvcnQgY29uc3QgZGV2TW9kZSA9IGZhbHNlXG5cbi8qKlxuICogUmVnaXN0ZXIgZmlsZSBwYXJzZXIuXG4gKi9cbmV4cG9ydCBjb25zdCBwYXJzZXJzOiBQYXJzZXJzQ29uZmlncmF0aW9uID0gW1xuICAgIHtcbiAgICAgICAgbWF0Y2g6IC8uKlxcLihqc3xlcykkLyxcbiAgICAgICAgcGFyc2VyczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcnNlcjogc2NyaXB0UGFyc2VyLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IHt9XG4gICAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbWF0Y2g6IC8uKlxcLih3eHNzfGNzc3xwb3N0Y3NzKSQvLFxuICAgICAgICBwYXJzZXJzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGFyc2VyOiBzdHlsZVBhcnNlcixcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB7fVxuICAgICAgICAgICAgfVxuICAgICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG1hdGNoOiAvLipcXC4oc2Fzc3xzY3NzKSQvLFxuICAgICAgICBwYXJzZXJzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGFyc2VyOiBzYXNzUGFyc2VyLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IHt9XG4gICAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICB9XG5dXG5cbi8qKlxuICogV2hldGhlciB0byBvdXRwdXQgZGVidWcgaW5mb3JtYXRpb24uXG4gKiBAZGVmYXVsdCBmYWxzZVxuICovXG5leHBvcnQgY29uc3QgZGVidWc6IGJvb2xlYW4gPSBmYWxzZVxuXG4vKipcbiAqIFJlZ2lzdGVyIHBsdWdpbi5cbiAqL1xuZXhwb3J0IGNvbnN0IHBsdWdpbnM6IFBsdWdpbnNDb25maWdyYXRpb24gPSBbXG4gICAge1xuICAgICAgICBwbHVnaW46IGV4dHJhY3REZXBlbmRlbmN5UGx1Z2luLFxuICAgICAgICBvcHRpb25zOiB7fVxuICAgIH0sXG4gICAge1xuICAgICAgICBwbHVnaW46IHNhdmVGaWxlUGx1Z2luLFxuICAgICAgICBvcHRpb25zOiB7fVxuICAgIH1cbl1cblxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICAgICAgICAgICAgICAgZXhwZXJpbWVudGFsIGNvbmZpZ3VyZVxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4iLCJpbXBvcnQgKiBhcyBhbmthRGVmYXVsdENvbmZpZyBmcm9tICcuL2Fua2FEZWZhdWx0Q29uZmlnJ1xuaW1wb3J0IHJlc29sdmVDb25maWcgZnJvbSAnLi4vdXRpbHMvcmVzb2x2ZUNvbmZpZydcblxuY29uc3QgY3VzdG9tQ29uZmlnID0gPEFua2FDb25maWc+cmVzb2x2ZUNvbmZpZyhbJ2Fua2EuY29uZmlnLmpzJywgJ2Fua2EuY29uZmlnLmpzb24nXSlcblxuZXhwb3J0IGRlZmF1bHQge1xuICAgIC4uLmFua2FEZWZhdWx0Q29uZmlnLFxuICAgIC4uLmN1c3RvbUNvbmZpZyxcbiAgICBwYXJzZXJzOiBjdXN0b21Db25maWcucGFyc2VycyA/IGN1c3RvbUNvbmZpZy5wYXJzZXJzLmNvbmNhdChhbmthRGVmYXVsdENvbmZpZy5wYXJzZXJzKSA6IGFua2FEZWZhdWx0Q29uZmlnLnBhcnNlcnMsXG4gICAgcGx1Z2luczogYW5rYURlZmF1bHRDb25maWcucGx1Z2lucy5jb25jYXQoY3VzdG9tQ29uZmlnLnBsdWdpbnMgfHwgW10pXG59XG4iLCJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgYW5rYUNvbmZpZyBmcm9tICcuL2Fua2FDb25maWcnXG5cbmV4cG9ydCBjb25zdCBjd2QgPSBwcm9jZXNzLmN3ZCgpXG5leHBvcnQgY29uc3Qgc3JjRGlyID0gcGF0aC5yZXNvbHZlKGN3ZCwgYW5rYUNvbmZpZy5zb3VyY2VEaXIpXG5leHBvcnQgY29uc3QgZGlzdERpciA9IHBhdGgucmVzb2x2ZShjd2QsIGFua2FDb25maWcub3V0cHV0RGlyKVxuZXhwb3J0IGNvbnN0IGFua2FNb2R1bGVzID0gcGF0aC5yZXNvbHZlKHNyY0RpciwgJ2Fua2FfbW9kdWxlcycpXG5leHBvcnQgY29uc3Qgc291cmNlTm9kZU1vZHVsZXMgPSBwYXRoLnJlc29sdmUoY3dkLCAnLi9ub2RlX21vZHVsZXMnKVxuZXhwb3J0IGNvbnN0IGRpc3ROb2RlTW9kdWxlcyA9IHBhdGgucmVzb2x2ZShkaXN0RGlyLCAnLi9ucG1fbW9kdWxlcycpXG5leHBvcnQgY29uc3QgZGVmYXVsdFNjYWZmb2xkID0gICdkaXJlY3Q6aHR0cHM6Ly9naXRodWIuY29tL2lFeGNlcHRpb24vYW5rYS1xdWlja3N0YXJ0J1xuIiwiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnXG5pbXBvcnQgYW5rYUNvbmZpZyBmcm9tICcuL2Fua2FDb25maWcnXG5pbXBvcnQgKiBhcyBzeXN0ZW0gZnJvbSAnLi9zeXN0ZW1Db25maWcnXG5pbXBvcnQgcmVzb2x2ZUNvbmZpZyBmcm9tICcuLi91dGlscy9yZXNvbHZlQ29uZmlnJ1xuXG5jb25zdCBjdXN0b21Db25maWcgPSByZXNvbHZlQ29uZmlnKFsnYXBwLmpzb24nXSwgc3lzdGVtLnNyY0RpcilcblxuZXhwb3J0IGRlZmF1bHQgT2JqZWN0LmFzc2lnbih7XG4gICAgcGFnZXM6IFtdLFxuICAgIHN1YlBhY2thZ2VzOiBbXSxcbiAgICB3aW5kb3c6IHtcbiAgICAgICAgbmF2aWdhdGlvbkJhclRpdGxlVGV4dDogJ1dlY2hhdCdcbiAgICB9XG4gICAgLy8gdGFiQmFyOiB7XG4gICAgLy8gICAgIGxpc3Q6IFtdXG4gICAgLy8gfSxcbn0sIGN1c3RvbUNvbmZpZylcbiIsImltcG9ydCAqIGFzIHN5c3RlbUNvbmZpZyBmcm9tICcuL3N5c3RlbUNvbmZpZydcbmltcG9ydCBhbmthQ29uZmlnIGZyb20gJy4vYW5rYUNvbmZpZydcbmltcG9ydCBwcm9qZWN0Q29uZmlnIGZyb20gJy4vcHJvamVjdENvbmZpZydcblxuZXhwb3J0IGRlZmF1bHQge1xuICAgIC4uLnN5c3RlbUNvbmZpZyxcbiAgICBhbmthQ29uZmlnLFxuICAgIHByb2plY3RDb25maWdcbn1cbiIsImltcG9ydCBDb21waWxlciBmcm9tICcuL0NvbXBpbGVyJ1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuLi8uLi9jb25maWcnXG5pbXBvcnQgQ29tcGlsYXRpb24gZnJvbSAnLi9Db21waWxhdGlvbidcblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEluamVjdGlvbiB7XG4gICAgY29tcGlsZXI6IENvbXBpbGVyXG4gICAgb3B0aW9uczogb2JqZWN0XG5cbiAgICBjb25zdHJ1Y3RvciAoY29tcGlsZXI6IENvbXBpbGVyLCBvcHRpb25zPzogb2JqZWN0KSB7XG4gICAgICAgIHRoaXMuY29tcGlsZXIgPSBjb21waWxlclxuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zXG4gICAgfVxuXG4gICAgYWJzdHJhY3QgZ2V0T3B0aW9ucyAoKTogb2JqZWN0XG5cbiAgICBnZXRDb21waWxlciAoKTogQ29tcGlsZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5jb21waWxlclxuICAgIH1cblxuICAgIGdldEFua2FDb25maWcgKCk6IEFua2FDb25maWcge1xuICAgICAgICByZXR1cm4gY29uZmlnLmFua2FDb25maWdcbiAgICB9XG5cbiAgICBnZXRTeXN0ZW1Db25maWcgKCk6IENvbXBpbGVyQ29uZmlnIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZ1xuICAgIH1cblxuICAgIGdldFByb2plY3RDb25maWcgKCk6IFByb2plY3RDb25maWcge1xuICAgICAgICByZXR1cm4gY29uZmlnLnByb2plY3RDb25maWdcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBQbHVnaW5JbmplY3Rpb24gZXh0ZW5kcyBJbmplY3Rpb24ge1xuXG4gICAgY29uc3RydWN0b3IgKGNvbXBpbGVyOiBDb21waWxlciwgb3B0aW9uczogUGx1Z2luT3B0aW9uc1snb3B0aW9ucyddKSB7XG4gICAgICAgIHN1cGVyKGNvbXBpbGVyLCBvcHRpb25zKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybiBQbHVnaW4gb3B0aW9uc1xuICAgICAqL1xuICAgIGdldE9wdGlvbnMgKCk6IG9iamVjdCB7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMgfHwge31cbiAgICB9XG5cbiAgICBvbiAoZXZlbnQ6IHN0cmluZywgaGFuZGxlcjogUGx1Z2luSGFuZGxlcik6IHZvaWQge1xuICAgICAgICB0aGlzLmNvbXBpbGVyLm9uKGV2ZW50LCBoYW5kbGVyKVxuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFBhcnNlckluamVjdGlvbiBleHRlbmRzIEluamVjdGlvbiB7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gUGFyc2VyT3B0aW9uc1xuICAgICAqL1xuICAgIGdldE9wdGlvbnMgKCk6IG9iamVjdCB7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMgfHwge31cbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvciAoY29tcGlsZXI6IENvbXBpbGVyLCBvcHRpb25zOiBQYXJzZXJPcHRpb25zWydvcHRpb25zJ10pIHtcbiAgICAgICAgc3VwZXIoY29tcGlsZXIsIG9wdGlvbnMpXG4gICAgfVxufVxuIiwiaW1wb3J0IHtcbiAgICBQYXJzZXJJbmplY3Rpb25cbn0gZnJvbSAnLi9JbmplY3Rpb24nXG5pbXBvcnQgRmlsZSBmcm9tICcuL0ZpbGUnXG5pbXBvcnQgY29uZmlnIGZyb20gJy4uLy4uL2NvbmZpZydcbmltcG9ydCBDb21waWxlciBmcm9tICcuL0NvbXBpbGVyJ1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vLi4vdXRpbHMnXG5cbi8qKlxuICogQSBjb21waWxhdGlvbiB0YXNrXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbXBpbGF0aW9uIHtcbiAgICBjb25maWc6IG9iamVjdFxuICAgIHJlYWRvbmx5IGNvbXBpbGVyOiBDb21waWxlclxuICAgIGlkOiBudW1iZXIgICAgICAgIC8vIFVuaXF1Ze+8jGZvciBlYWNoIENvbXBpbGF0aW9uXG4gICAgZmlsZTogRmlsZVxuICAgIHNvdXJjZUZpbGU6IHN0cmluZ1xuICAgIGRlc3Ryb3llZDogYm9vbGVhblxuXG4gICAgY29uc3RydWN0b3IgKGZpbGU6IEZpbGUgfCBzdHJpbmcsIGNvbmY6IG9iamVjdCwgY29tcGlsZXI6IENvbXBpbGVyKSB7XG4gICAgICAgIHRoaXMuY29tcGlsZXIgPSBjb21waWxlclxuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZcbiAgICAgICAgdGhpcy5pZCA9IENvbXBpbGVyLmNvbXBpbGF0aW9uSWQrK1xuXG4gICAgICAgIGlmIChmaWxlIGluc3RhbmNlb2YgRmlsZSkge1xuICAgICAgICAgICAgdGhpcy5maWxlID0gZmlsZVxuICAgICAgICAgICAgdGhpcy5zb3VyY2VGaWxlID0gZmlsZS5zb3VyY2VGaWxlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNvdXJjZUZpbGUgPSBmaWxlXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmVucm9sbCgpXG4gICAgfVxuXG4gICAgYXN5bmMgcnVuICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgYXdhaXQgdGhpcy5sb2FkRmlsZSgpXG4gICAgICAgIGF3YWl0IHRoaXMuaW52b2tlUGFyc2VycygpXG4gICAgICAgIGF3YWl0IHRoaXMuY29tcGlsZSgpXG4gICAgfVxuXG4gICAgYXN5bmMgbG9hZEZpbGUgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBpZiAodGhpcy5kZXN0cm95ZWQpIHJldHVyblxuXG4gICAgICAgIGF3YWl0IHRoaXMuY29tcGlsZXIuZW1pdCgnYmVmb3JlLWxvYWQtZmlsZScsIHRoaXMpXG4gICAgICAgIGlmICghKHRoaXMuZmlsZSBpbnN0YW5jZW9mIEZpbGUpKSB7XG4gICAgICAgICAgICB0aGlzLmZpbGUgPSBhd2FpdCB1dGlscy5jcmVhdGVGaWxlKHRoaXMuc291cmNlRmlsZSlcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRoaXMuY29tcGlsZXIuZW1pdCgnYWZ0ZXItbG9hZC1maWxlJywgdGhpcylcbiAgICB9XG5cbiAgICBhc3luYyBpbnZva2VQYXJzZXJzICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKHRoaXMuZGVzdHJveWVkKSByZXR1cm5cblxuICAgICAgICBjb25zdCBmaWxlID0gdGhpcy5maWxlXG4gICAgICAgIGNvbnN0IHBhcnNlcnMgPSA8UGFyc2VyW10+dGhpcy5jb21waWxlci5wYXJzZXJzLmZpbHRlcigobWF0Y2hlcnM6IE1hdGNoZXIpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBtYXRjaGVycy5tYXRjaC50ZXN0KGZpbGUudGFyZ2V0RmlsZSlcbiAgICAgICAgfSkubWFwKChtYXRjaGVyczogTWF0Y2hlcikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoZXJzLnBhcnNlcnNcbiAgICAgICAgfSkucmVkdWNlKChwcmV2LCBuZXh0KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gcHJldi5jb25jYXQobmV4dClcbiAgICAgICAgfSwgW10pXG4gICAgICAgIGNvbnN0IHRhc2tzID0gcGFyc2Vycy5tYXAocGFyc2VyID0+IHtcbiAgICAgICAgICAgIHJldHVybiB1dGlscy5hc3luY0Z1bmN0aW9uV3JhcHBlcihwYXJzZXIpXG4gICAgICAgIH0pXG5cbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlci5lbWl0KCdiZWZvcmUtcGFyc2UnLCB0aGlzKVxuICAgICAgICBhd2FpdCB1dGlscy5jYWxsUHJvbWlzZUluQ2hhaW4odGFza3MsIGZpbGUsIHRoaXMpXG4gICAgICAgIGF3YWl0IHRoaXMuY29tcGlsZXIuZW1pdCgnYWZ0ZXItcGFyc2UnLCB0aGlzKVxuICAgIH1cblxuICAgIGFzeW5jIGNvbXBpbGUgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBpZiAodGhpcy5kZXN0cm95ZWQpIHJldHVyblxuXG4gICAgICAgIC8vIEludm9rZSBFeHRyYWN0RGVwZW5kZW5jeVBsdWdpbi5cbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlci5lbWl0KCdiZWZvcmUtY29tcGlsZScsIHRoaXMpXG4gICAgICAgIC8vIERvIHNvbWV0aGluZyBlbHNlLlxuICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGVyLmVtaXQoJ2FmdGVyLWNvbXBpbGUnLCB0aGlzKVxuICAgICAgICB1dGlscy5sb2dnZXIuaW5mbygnQ29tcGlsZScsICB0aGlzLmZpbGUuc291cmNlRmlsZS5yZXBsYWNlKGNvbmZpZy5jd2QsICcnKSlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBvbiBDb21waWxlciBhbmQgZGVzdHJveSB0aGUgcHJldmlvdXMgb25lIGlmIGNvbmZsaWN0IGFyaXNlcy5cbiAgICAgKi9cbiAgICBlbnJvbGwgKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBvbGRDb21waWxhdGlvbiA9IENvbXBpbGVyLmNvbXBpbGF0aW9uUG9vbC5nZXQodGhpcy5zb3VyY2VGaWxlKVxuXG4gICAgICAgIGlmIChvbGRDb21waWxhdGlvbikge1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5hbmthQ29uZmlnLmRlYnVnKSBjb25zb2xlLmxvZygnXGJEZXN0cm95IENvbXBpbGF0aW9uJywgb2xkQ29tcGlsYXRpb24uaWQsIG9sZENvbXBpbGF0aW9uLnNvdXJjZUZpbGUpXG5cbiAgICAgICAgICAgIG9sZENvbXBpbGF0aW9uLmRlc3Ryb3koKVxuICAgICAgICB9XG4gICAgICAgIENvbXBpbGVyLmNvbXBpbGF0aW9uUG9vbC5zZXQodGhpcy5zb3VyY2VGaWxlLCB0aGlzKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVucmVnaXN0ZXIgdGhlbXNlbHZlcyBmcm9tIENvbXBpbGVyLlxuICAgICAqL1xuICAgIGRlc3Ryb3kgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmRlc3Ryb3llZCA9IHRydWVcbiAgICAgICAgQ29tcGlsZXIuY29tcGlsYXRpb25Qb29sLmRlbGV0ZSh0aGlzLnNvdXJjZUZpbGUpXG4gICAgfVxufVxuIiwiaW1wb3J0IHtcbiAgICBQYXJzZXJJbmplY3Rpb24sXG4gICAgUGx1Z2luSW5qZWN0aW9uXG59IGZyb20gJy4vSW5qZWN0aW9uJ1xuaW1wb3J0IEZpbGUgZnJvbSAnLi9GaWxlJ1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnXG5pbXBvcnQgY29uZmlnIGZyb20gJy4uLy4uL2NvbmZpZydcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uLy4uL3V0aWxzJ1xuaW1wb3J0IENvbXBpbGF0aW9uIGZyb20gJy4vQ29tcGlsYXRpb24nXG5pbXBvcnQgY2FsbFByb21pc2VJbkNoYWluIGZyb20gJy4uLy4uL3V0aWxzL2NhbGxQcm9taXNlSW5DaGFpbidcbmltcG9ydCBhc3luY0Z1bmN0aW9uV3JhcHBlciBmcm9tICcuLi8uLi91dGlscy9hc3luY0Z1bmN0aW9uV3JhcHBlcidcblxuY29uc3QgeyBsb2dnZXIgfSA9IHV0aWxzXG5cbi8qKlxuICogVGhlIGNvcmUgY29tcGlsZXIuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbXBpbGVyIHtcbiAgICByZWFkb25seSBjb25maWc6IENvbXBpbGVyQ29uZmlnXG4gICAgcHVibGljIHN0YXRpYyBjb21waWxhdGlvbklkID0gMVxuICAgIHB1YmxpYyBzdGF0aWMgY29tcGlsYXRpb25Qb29sID0gbmV3IE1hcDxzdHJpbmcsIENvbXBpbGF0aW9uPigpXG4gICAgcGx1Z2luczoge1xuICAgICAgICBbZXZlbnROYW1lOiBzdHJpbmddOiBBcnJheTxQbHVnaW5IYW5kbGVyPlxuICAgIH0gPSB7XG4gICAgICAgICdiZWZvcmUtbG9hZC1maWxlJzogW10sXG4gICAgICAgICdhZnRlci1sb2FkLWZpbGUnOiBbXSxcbiAgICAgICAgJ2JlZm9yZS1wYXJzZSc6IFtdLFxuICAgICAgICAnYWZ0ZXItcGFyc2UnOiBbXSxcbiAgICAgICAgJ2JlZm9yZS1jb21waWxlJzogW10sXG4gICAgICAgICdhZnRlci1jb21waWxlJzogW11cbiAgICB9XG4gICAgcGFyc2VyczogQXJyYXk8e1xuICAgICAgICBtYXRjaDogUmVnRXhwLFxuICAgICAgICBwYXJzZXJzOiBBcnJheTxQYXJzZXI+XG4gICAgfT4gPSBbXVxuXG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZ1xuICAgICAgICB0aGlzLmluaXRQYXJzZXJzKClcbiAgICAgICAgdGhpcy5pbml0UGx1Z2lucygpXG5cbiAgICAgICAgaWYgKGNvbmZpZy5hbmthQ29uZmlnLmRlYnVnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh0aGlzLmNvbmZpZywgKGtleSwgdmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBGdW5jdGlvbikgcmV0dXJuICdbRnVuY3Rpb25dJ1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZVxuICAgICAgICAgICAgfSwgNCkpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBQbHVnaW4uXG4gICAgICogQHBhcmFtIGV2ZW50XG4gICAgICogQHBhcmFtIGhhbmRsZXJcbiAgICAgKi9cbiAgICBvbiAoZXZlbnQ6IHN0cmluZywgaGFuZGxlcjogUGx1Z2luSGFuZGxlcik6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5wbHVnaW5zW2V2ZW50XSA9PT0gdm9pZCAoMCkpIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBob29rOiAke2V2ZW50fWApXG4gICAgICAgIHRoaXMucGx1Z2luc1tldmVudF0ucHVzaChoYW5kbGVyKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEludm9rZSBsaWZlY3ljbGUgaG9va3MoUHJvbWlzZSBjaGFpbmluZykuXG4gICAgICogQHBhcmFtIGV2ZW50XG4gICAgICogQHBhcmFtIGNvbXBpbGF0aW9uXG4gICAgICovXG4gICAgYXN5bmMgZW1pdCAoZXZlbnQ6IHN0cmluZywgY29tcGlsYXRpb246IENvbXBpbGF0aW9uKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKGNvbXBpbGF0aW9uLmRlc3Ryb3llZCkgcmV0dXJuXG5cbiAgICAgICAgY29uc3QgcGx1Z2lucyA9IHRoaXMucGx1Z2luc1tldmVudF1cblxuICAgICAgICBpZiAoIXBsdWdpbnMgfHwgIXBsdWdpbnMubGVuZ3RoKSByZXR1cm5cblxuICAgICAgICBjb25zdCB0YXNrcyA9IHBsdWdpbnMubWFwKHBsdWdpbiA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYXN5bmNGdW5jdGlvbldyYXBwZXIocGx1Z2luKVxuICAgICAgICB9KVxuXG4gICAgICAgIGF3YWl0IGNhbGxQcm9taXNlSW5DaGFpbih0YXNrcywgY29tcGlsYXRpb24pXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRXZlcnl0aGluZyBzdGFydCBmcm9tIGhlcmUuXG4gICAgICovXG4gICAgYXN5bmMgbGF1bmNoICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBmaWxlUGF0aHM6IHN0cmluZ1tdID0gYXdhaXQgdXRpbHMuc2VhcmNoRmlsZXMoYCR7Y29uZmlnLnNyY0Rpcn0vKiovKmAsIHtcbiAgICAgICAgICAgIG5vZGlyOiB0cnVlLFxuICAgICAgICAgICAgc2lsZW50OiBmYWxzZSxcbiAgICAgICAgICAgIGFic29sdXRlOiB0cnVlXG4gICAgICAgIH0pXG4gICAgICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgUHJvbWlzZS5hbGwoZmlsZVBhdGhzLm1hcChmaWxlID0+IHtcbiAgICAgICAgICAgIHJldHVybiB1dGlscy5jcmVhdGVGaWxlKGZpbGUpXG4gICAgICAgIH0pKVxuICAgICAgICBjb25zdCBjb21waWxhdGlvbnMgPSBmaWxlcy5tYXAoZmlsZSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IENvbXBpbGF0aW9uKGZpbGUsIHRoaXMuY29uZmlnLCB0aGlzKVxuICAgICAgICB9KVxuXG4gICAgICAgIGZzLmVuc3VyZURpclN5bmMoY29uZmlnLmRpc3ROb2RlTW9kdWxlcylcblxuICAgICAgICAvLyBhd2FpdCBQcm9taXNlLmFsbChjb21waWxhdGlvbnMubWFwKGNvbXBpbGF0aW9uID0+IGNvbXBpbGF0aW9uLmxvYWRGaWxlKCkpKVxuICAgICAgICAvLyBhd2FpdCBQcm9taXNlLmFsbChjb21waWxhdGlvbnMubWFwKGNvbXBpbGF0aW9uID0+IGNvbXBpbGF0aW9uLmludm9rZVBhcnNlcnMoKSkpXG5cbiAgICAgICAgLy8gVE9ETzogR2V0IGFsbCBmaWxlc1xuICAgICAgICAvLyBDb21waWxlci5jb21waWxhdGlvblBvb2wudmFsdWVzKClcblxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChjb21waWxhdGlvbnMubWFwKGNvbXBpbGF0aW9ucyA9PiBjb21waWxhdGlvbnMucnVuKCkpKVxuICAgIH1cblxuICAgIHdhdGNoRmlsZXMgKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHdhdGNoZXIgPSB1dGlscy5nZW5GaWxlV2F0Y2hlcihgJHtjb25maWcuc3JjRGlyfS8qKi8qYCwge1xuICAgICAgICAgICAgICAgIGZvbGxvd1N5bWxpbmtzOiBmYWxzZVxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgd2F0Y2hlci5vbignYWRkJywgYXN5bmMgKGZpbGVOYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlID0gYXdhaXQgdXRpbHMuY3JlYXRlRmlsZShmaWxlTmFtZSlcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmdlbmVyYXRlQ29tcGlsYXRpb24oZmlsZSkucnVuKClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB3YXRjaGVyLm9uKCd1bmxpbmsnLCBhc3luYyAoZmlsZU5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIGF3YWl0IGZzLnVubGluayhmaWxlTmFtZS5yZXBsYWNlKGNvbmZpZy5zcmNEaXIsIGNvbmZpZy5kaXN0RGlyKSlcbiAgICAgICAgICAgICAgICBsb2dnZXIuc3VjY2VzcygnUmVtb3ZlJywgZmlsZU5hbWUpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgd2F0Y2hlci5vbignY2hhbmdlJywgYXN5bmMgKGZpbGVOYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlID0gYXdhaXQgdXRpbHMuY3JlYXRlRmlsZShmaWxlTmFtZSlcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmdlbmVyYXRlQ29tcGlsYXRpb24oZmlsZSkucnVuKClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB3YXRjaGVyLm9uKCdyZWFkeScsICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIG5ldyBDb21waWxhdGlvbi5cbiAgICAgKiBAcGFyYW0gZmlsZVxuICAgICAqL1xuICAgIGdlbmVyYXRlQ29tcGlsYXRpb24gKGZpbGU6IEZpbGUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb21waWxhdGlvbihmaWxlLCB0aGlzLmNvbmZpZywgdGhpcylcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNb3VudCBwYXJzZXJzLlxuICAgICAqL1xuICAgIGluaXRQYXJzZXJzICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jb25maWcuYW5rYUNvbmZpZy5wYXJzZXJzLmZvckVhY2goKHsgbWF0Y2gsIHBhcnNlcnMgfSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wYXJzZXJzLnB1c2goe1xuICAgICAgICAgICAgICAgIG1hdGNoLFxuICAgICAgICAgICAgICAgIHBhcnNlcnM6IHBhcnNlcnMubWFwKCh7IHBhcnNlciwgb3B0aW9ucyB9KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZXIuYmluZCh0aGlzLmdlbmVyYXRlUGFyc2VySW5qZWN0aW9uKG9wdGlvbnMpKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1vdW50IFBsdWdpbnMuXG4gICAgICovXG4gICAgaW5pdFBsdWdpbnMgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmNvbmZpZy5hbmthQ29uZmlnLnBsdWdpbnMuZm9yRWFjaCgoeyBwbHVnaW4sIG9wdGlvbnMgfSkgPT4ge1xuICAgICAgICAgICAgcGx1Z2luLmNhbGwodGhpcy5nZW5lcmF0ZVBsdWdpbkluamVjdGlvbihvcHRpb25zKSlcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBnZW5lcmF0ZVBsdWdpbkluamVjdGlvbiAob3B0aW9uczogUGx1Z2luT3B0aW9uc1snb3B0aW9ucyddKTogUGx1Z2luSW5qZWN0aW9uIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQbHVnaW5JbmplY3Rpb24odGhpcywgb3B0aW9ucylcbiAgICB9XG5cbiAgICBnZW5lcmF0ZVBhcnNlckluamVjdGlvbiAob3B0aW9uczogUGFyc2VyT3B0aW9uc1snb3B0aW9ucyddKTogUGFyc2VySW5qZWN0aW9uIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQYXJzZXJJbmplY3Rpb24odGhpcywgb3B0aW9ucylcbiAgICB9XG59XG4iLCJpbXBvcnQgQ29tcGlsZXIgZnJvbSAnLi9Db21waWxlcidcblxuZXhwb3J0IGRlZmF1bHQgYWJzdHJhY3QgY2xhc3MgQ29tbWFuZCB7XG4gICAgcHVibGljIGNvbW1hbmQ6IHN0cmluZ1xuICAgIHB1YmxpYyBvcHRpb25zOiBBcnJheTx1bmtub3duPlxuICAgIHB1YmxpYyBhbGlhczogc3RyaW5nXG4gICAgcHVibGljIHVzYWdlOiBzdHJpbmdcbiAgICBwdWJsaWMgZGVzY3JpcHRpb246IHN0cmluZ1xuICAgIHB1YmxpYyBleGFtcGxlczogQXJyYXk8c3RyaW5nPlxuICAgIHB1YmxpYyAkY29tcGlsZXI6IENvbXBpbGVyXG4gICAgcHVibGljIG9uOiB7XG4gICAgICAgIFtrZXk6IHN0cmluZ106ICguLi5hcmc6IGFueVtdKSA9PiB2b2lkXG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IgKGNvbW1hbmQ6IHN0cmluZywgZGVzYz86IHN0cmluZykge1xuICAgICAgICB0aGlzLmNvbW1hbmQgPSBjb21tYW5kXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IFtdXG4gICAgICAgIHRoaXMuYWxpYXMgPSAnJ1xuICAgICAgICB0aGlzLnVzYWdlID0gJydcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IGRlc2NcbiAgICAgICAgdGhpcy5leGFtcGxlcyA9IFtdXG4gICAgICAgIHRoaXMub24gPSB7fVxuICAgIH1cblxuICAgIGFic3RyYWN0IGFjdGlvbiAocGFyYW06IHN0cmluZyB8IEFycmF5PHN0cmluZz4sIG9wdGlvbnM6IE9iamVjdCwgLi4ub3RoZXI6IGFueVtdKTogUHJvbWlzZTxhbnk+IHwgdm9pZFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSBhbmthIGNvcmUgY29tcGlsZXJcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgaW5pdENvbXBpbGVyICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy4kY29tcGlsZXIgPSBuZXcgQ29tcGlsZXIoKVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBzZXRVc2FnZSAodXNhZ2U6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICB0aGlzLnVzYWdlID0gdXNhZ2VcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgc2V0T3B0aW9ucyAoLi4ub3B0aW9uczogQXJyYXk8c3RyaW5nPik6IHZvaWQge1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSB0aGlzLm9wdGlvbnMuY29uY2F0KG9wdGlvbnMpXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHNldEV4YW1wbGVzICguLi5leGFtcGxlOiBBcnJheTxzdHJpbmc+KTogdm9pZCB7XG4gICAgICAgIHRoaXMuZXhhbXBsZXMgPSB0aGlzLmV4YW1wbGVzLmNvbmNhdChleGFtcGxlKVxuICAgIH1cblxuICAgIHB1YmxpYyBwcmludFRpdGxlICguLi5hcmc6IEFycmF5PGFueT4pIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1xcclxcbiAnLCAuLi5hcmcsICdcXHJcXG4nKVxuICAgIH1cblxuICAgIHB1YmxpYyBwcmludENvbnRlbnQgKC4uLmFyZzogQXJyYXk8YW55Pikge1xuICAgICAgICBjb25zb2xlLmxvZygnICAgJywgLi4uYXJnKVxuICAgIH1cbn1cbiIsImltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uL3V0aWxzJ1xuaW1wb3J0IHsgQ29tbWFuZCwgQ29tcGlsZXIgfSBmcm9tICcuLi9jb3JlJ1xuXG5leHBvcnQgdHlwZSBEZXZDb21tYW5kT3B0cyA9IE9iamVjdCAmIHt9XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERldkNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHN1cGVyKFxuICAgICAgICAgICAgJ2RldiBbcGFnZXMuLi5dJyxcbiAgICAgICAgICAgICdEZXZlbG9wbWVudCBNb2RlJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRFeGFtcGxlcyhcbiAgICAgICAgICAgICckIGFua2EgZGV2JyxcbiAgICAgICAgICAgICckIGFua2EgZGV2IGluZGV4JyxcbiAgICAgICAgICAgICckIGFua2EgZGV2IC9wYWdlcy9sb2cvbG9nIC9wYWdlcy91c2VyL3VzZXInXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLiRjb21waWxlciA9IG5ldyBDb21waWxlcigpXG4gICAgfVxuXG4gICAgYXN5bmMgYWN0aW9uIChwYWdlcz86IEFycmF5PHN0cmluZz4sIG9wdGlvbnM/OiBEZXZDb21tYW5kT3B0cykge1xuICAgICAgICBjb25zdCBzdGFydHVwVGltZSA9IERhdGUubm93KClcbiAgICAgICAgdGhpcy5pbml0Q29tcGlsZXIoKVxuICAgICAgICBhd2FpdCB0aGlzLiRjb21waWxlci5sYXVuY2goKVxuICAgICAgICBhd2FpdCB0aGlzLiRjb21waWxlci53YXRjaEZpbGVzKClcbiAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoYFN0YXJ0dXA6ICR7RGF0ZS5ub3coKSAtIHN0YXJ0dXBUaW1lfW1zYCwgYEFua2EgaXMgd2FpdGluZyBmb3IgY2hhbmdlcy4uLmApXG4gICAgfVxufVxuIiwiaW1wb3J0IHsgQ29tbWFuZCwgQ29tcGlsZXIgfSBmcm9tICcuLi9jb3JlJ1xuXG5leHBvcnQgdHlwZSBEZXZDb21tYW5kT3B0cyA9IE9iamVjdCAmIHt9XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERldkNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHN1cGVyKFxuICAgICAgICAgICAgJ3Byb2QnLFxuICAgICAgICAgICAgJ1Byb2R1Y3Rpb24gTW9kZSdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0RXhhbXBsZXMoXG4gICAgICAgICAgICAnJCBhbmthIHByb2QnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLiRjb21waWxlciA9IG5ldyBDb21waWxlcigpXG4gICAgfVxuXG4gICAgYXN5bmMgYWN0aW9uIChwYWdlcz86IEFycmF5PHN0cmluZz4sIG9wdGlvbnM/OiBEZXZDb21tYW5kT3B0cykge1xuICAgICAgICB0aGlzLmluaXRDb21waWxlcigpXG4gICAgICAgIGF3YWl0IHRoaXMuJGNvbXBpbGVyLmxhdW5jaCgpXG4gICAgfVxufVxuIiwiaW1wb3J0IERldiBmcm9tICcuL2NvbW1hbmRzL2RldidcbmltcG9ydCBQcm9kIGZyb20gJy4vY29tbWFuZHMvcHJvZCdcblxuZXhwb3J0IGRlZmF1bHQgW1xuICAgIG5ldyBQcm9kKCksXG4gICAgbmV3IERldigpXG5dXG4iLCJpbXBvcnQgY29uZmlnIGZyb20gJy4vY29uZmlnJ1xuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi91dGlscydcbmltcG9ydCAqIGFzIGNmb250cyBmcm9tICdjZm9udHMnXG5pbXBvcnQgY29tbWFuZHMgZnJvbSAnLi9jb21tYW5kcydcbmltcG9ydCAqIGFzIGNvbW1hbmRlciBmcm9tICdjb21tYW5kZXInXG5pbXBvcnQgQ29tcGlsZXIgZnJvbSAnLi9jb3JlL2NsYXNzL0NvbXBpbGVyJ1xuXG5jb25zdCBwa2dKc29uID0gcmVxdWlyZSgnLi4vcGFja2FnZS5qc29uJylcblxucmVxdWlyZSgnc291cmNlLW1hcC1zdXBwb3J0JykuaW5zdGFsbCgpXG5cbmlmIChwcm9jZXNzLmFyZ3YuaW5kZXhPZignLS1kZWJ1ZycpID4gLTEpIHtcbiAgICBjb25maWcuYW5rYUNvbmZpZy5kZWJ1ZyA9IHRydWVcbn1cblxubG9nZ2VyLmluZm8oJ0xhdW5jaGluZy4uLicpXG5cbmNvbW1hbmRlclxuICAgIC5vcHRpb24oJy0tZGVidWcnLCAnZW5hYmxlIGRlYnVnIG1vZGUnKVxuICAgIC52ZXJzaW9uKHBrZ0pzb24udmVyc2lvbilcbiAgICAudXNhZ2UoJzxjb21tYW5kPiBbb3B0aW9uc10nKVxuXG5jb21tYW5kcy5mb3JFYWNoKGNvbW1hbmQgPT4ge1xuICAgIGNvbnN0IGNtZCA9IGNvbW1hbmRlci5jb21tYW5kKGNvbW1hbmQuY29tbWFuZClcblxuICAgIGlmIChjb21tYW5kLmRlc2NyaXB0aW9uKSB7XG4gICAgICAgIGNtZC5kZXNjcmlwdGlvbihjb21tYW5kLmRlc2NyaXB0aW9uKVxuICAgIH1cblxuICAgIGlmIChjb21tYW5kLnVzYWdlKSB7XG4gICAgICAgIGNtZC51c2FnZShjb21tYW5kLnVzYWdlKVxuICAgIH1cblxuICAgIGlmIChjb21tYW5kLm9uKSB7XG4gICAgICAgIGZvciAobGV0IGtleSBpbiBjb21tYW5kLm9uKSB7XG4gICAgICAgICAgICBjbWQub24oa2V5LCBjb21tYW5kLm9uW2tleV0pXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY29tbWFuZC5vcHRpb25zKSB7XG4gICAgICAgIGNvbW1hbmQub3B0aW9ucy5mb3JFYWNoKChvcHRpb246IFthbnksIGFueSwgYW55LCBhbnldKSA9PiB7XG4gICAgICAgICAgICBjbWQub3B0aW9uKC4uLm9wdGlvbilcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAoY29tbWFuZC5hY3Rpb24pIHtcbiAgICAgICAgY21kLmFjdGlvbihhc3luYyAoLi4uYXJncykgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBjb21tYW5kLmFjdGlvbiguLi5hcmdzKVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKGVyci5tZXNzYWdlIHx8ICcnKVxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAoY29tbWFuZC5leGFtcGxlcykge1xuICAgICAgICBjbWQub24oJy0taGVscCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbW1hbmQucHJpbnRUaXRsZSgnRXhhbXBsZXM6JylcbiAgICAgICAgICAgIGNvbW1hbmQuZXhhbXBsZXMuZm9yRWFjaChleGFtcGxlID0+IHtcbiAgICAgICAgICAgICAgICBjb21tYW5kLnByaW50Q29udGVudChleGFtcGxlKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICB9XG59KVxuXG5pZiAocHJvY2Vzcy5hcmd2Lmxlbmd0aCA9PT0gMikge1xuICAgIGNmb250cy5zYXkoJ0Fua2EnLCB7XG4gICAgICAgIGZvbnQ6ICdzaW1wbGUnLFxuICAgICAgICBjb2xvcnM6IFsnZ3JlZW5CcmlnaHQnXVxuICAgIH0pXG4gICAgY29uc29sZS5sb2coJyAgVmVyc2lvbjogJyArIHBrZ0pzb24udmVyc2lvbilcbiAgICBjb21tYW5kZXIub3V0cHV0SGVscCgpXG59XG5cbmNvbW1hbmRlci5wYXJzZShwcm9jZXNzLmFyZ3YpXG5cbmV4cG9ydCBkZWZhdWx0IENvbXBpbGVyXG4iXSwibmFtZXMiOlsiZnMucmVhZEZpbGUiLCJmcy53cml0ZUZpbGUiLCJwYXRoLmRpcm5hbWUiLCJwYXRoLmJhc2VuYW1lIiwicGF0aC5leHRuYW1lIiwicGF0aCIsImZzLmVuc3VyZUZpbGUiLCJsb2ciLCJwYXRoLmpvaW4iLCJmcy5leGlzdHNTeW5jIiwiY2hva2lkYXIud2F0Y2giLCJzYXNzLnJlbmRlciIsInV0aWxzLmxvZ2dlciIsInBvc3Rjc3MiLCJ0c2xpYl8xLl9fYXNzaWduIiwid3JpdGVGaWxlIiwiYWNvcm4ucGFyc2UiLCJhY29ybldhbGtlci5zaW1wbGUiLCJlc2NvZGVnZW4uZ2VuZXJhdGUiLCJ1dGlscy5yZXNvbHZlTW9kdWxlIiwicGF0aC5yZWxhdGl2ZSIsInV0aWxzLmNyZWF0ZUZpbGUiLCJhbmthRGVmYXVsdENvbmZpZy5wYXJzZXJzIiwiYW5rYURlZmF1bHRDb25maWcucGx1Z2lucyIsImN3ZCIsInBhdGgucmVzb2x2ZSIsImN1c3RvbUNvbmZpZyIsInN5c3RlbS5zcmNEaXIiLCJ0c2xpYl8xLl9fZXh0ZW5kcyIsInV0aWxzLmFzeW5jRnVuY3Rpb25XcmFwcGVyIiwidXRpbHMuY2FsbFByb21pc2VJbkNoYWluIiwibG9nZ2VyIiwidXRpbHMuc2VhcmNoRmlsZXMiLCJmcy5lbnN1cmVEaXJTeW5jIiwidXRpbHMuZ2VuRmlsZVdhdGNoZXIiLCJmcy51bmxpbmsiLCJQcm9kIiwiRGV2IiwiY29tbWFuZGVyXG4gICAgLm9wdGlvbiIsImNvbW1hbmRlci5jb21tYW5kIiwiY2ZvbnRzLnNheSIsImNvbW1hbmRlci5vdXRwdXRIZWxwIiwiY29tbWFuZGVyLnBhcnNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsSUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFBO0FBRTVCLFNBQWdCLFFBQVEsQ0FBRSxjQUFzQjtJQUM1QyxPQUFPLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU07UUFDL0JBLFdBQVcsQ0FBQyxjQUFjLEVBQUUsVUFBQyxHQUFHLEVBQUUsTUFBTTtZQUNwQyxJQUFJLEdBQUcsRUFBRTtnQkFDTCxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUE7YUFD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
