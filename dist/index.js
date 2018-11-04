#!/usr/bin/env node
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var tslib_1 = require('tslib');
var postcssrc = _interopDefault(require('postcss-load-config'));
var fs = require('fs-extra');
var chalk = _interopDefault(require('chalk'));
var path = require('path');
var fs$1 = require('fs');
var chokidar = require('chokidar');
var acorn = require('acorn');
var escodegen = require('escodegen');
var acornWalker = require('acorn-walk');
var cfonts = require('cfonts');
var commander = require('commander');

var scriptParser = (function (file, compilation, cb) {
    file.updateExt('.js');
    cb();
});
//# sourceMappingURL=scriptParser.js.map

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
        if (err === void 0) { err = ''; }
        this.log(chalk.red('✘'), chalk.reset(title), chalk.grey(msg));
        console.log(err);
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
function createFileSync(sourceFile) {
    var content = fs.readFileSync(sourceFile);
    return new File({
        sourceFile: sourceFile,
        content: content
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
function isNpmDependency (required) {
    if (required === void 0) { required = ''; }
    var result = validate(required.split('/').slice(0, 1).join('/'));
    return result.validForNewPackages || result.validForOldPackages;
}
//# sourceMappingURL=isNpmDependency.js.map

//# sourceMappingURL=index.js.map

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
                        resolve(source, file.sourceFile, file.targetFile);
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
                        resolve(args[0], file.sourceFile, file.targetFile);
                    }
                }
            });
            file.content = escodegen.generate(file.ast);
        }
        cb();
    });
    function resolve(node, sourceFile, targetFile) {
        var sourceBaseName = path.dirname(sourceFile);
        var targetBaseName = path.dirname(targetFile);
        if (isNpmDependency(node.value)) {
            var dependency = resolveModule(node.value, {
                paths: [sourceBaseName]
            });
            if (!dependency) {
                console.log(node.value, 'is not exist', sourceFile);
                return;
            }
            var distPath = dependency.replace(config.sourceNodeModules, config.distNodeModules);
            node.value = path.relative(targetBaseName, distPath);
            if (dependencyPool.has(dependency))
                return;
            traverseNpmDependency(dependency);
        }
        else {
            if (testNodeModules.test(sourceFile)) {
                var dependency = resolveModule(node.value, {
                    paths: [sourceBaseName]
                });
                var distPath = dependency.replace(config.sourceNodeModules, config.distNodeModules);
                node.value = path.relative(targetBaseName, distPath);
                if (dependencyPool.has(dependency))
                    return;
                traverseNpmDependency(dependency);
            }
        }
    }
    function traverseNpmDependency(dependency) {
        if (dependencyPool.has(dependency))
            return;
        dependencyPool.set(dependency, dependency);
        var file = createFileSync(dependency);
        file.targetFile = file.sourceFile.replace(config.sourceNodeModules, config.distNodeModules);
        compiler.generateCompilation(file).run().then(function () {
        }).catch(function (err) {
            logger.error(dependency, err.message, err);
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

var ankaConfig = tslib_1.__assign({}, ankaDefaultConfig, resolveConfig(['anka.config.js', 'anka.config.json']));
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

var customConfig = resolveConfig(['app.json'], srcDir);
var projectConfig = Object.assign({
    pages: [],
    subPackages: [],
    window: {
        navigationBarTitleText: 'Wechat'
    }
}, customConfig);
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
                        return [4, Promise.all(compilations.map(function (compilation) { return compilation.loadFile(); }))];
                    case 3:
                        _a.sent();
                        return [4, Promise.all(compilations.map(function (compilation) { return compilation.invokeParsers(); }))];
                    case 4:
                        _a.sent();
                        return [4, Promise.all(compilations.map(function (compilations) { return compilations.compile(); }))];
                    case 5:
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

module.exports = Compiler;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9wYXJzZXJzL3NjcmlwdFBhcnNlci50cyIsIi4uL3NyYy9wYXJzZXJzL3N0eWxlUGFyc2VyL3Bvc3Rjc3NXeGltcG9ydC50cyIsIi4uL3NyYy9wYXJzZXJzL3N0eWxlUGFyc2VyL2luZGV4LnRzIiwiLi4vc3JjL3V0aWxzL2VkaXRvci50cyIsIi4uL3NyYy91dGlscy9sb2dnZXIudHMiLCIuLi9zcmMvY29yZS9jbGFzcy9GaWxlLnRzIiwiLi4vc3JjL3V0aWxzL2NyZWF0ZUZpbGUudHMiLCIuLi9zcmMvdXRpbHMvcmVzb2x2ZU1vZHVsZS50cyIsIi4uL3NyYy91dGlscy9yZXNvbHZlQ29uZmlnLnRzIiwiLi4vc3JjL3V0aWxzL2NhbGxQcm9taXNlSW5DaGFpbi50cyIsIi4uL3NyYy91dGlscy9hc3luY0Z1bmN0aW9uV3JhcHBlci50cyIsIi4uL3NyYy91dGlscy9nZW5GaWxlV2F0Y2hlci50cyIsIi4uL3NyYy91dGlscy9pc05wbURlcGVuZGVuY3kudHMiLCIuLi9zcmMvcGx1Z2lucy9zYXZlRmlsZVBsdWdpbi9pbmRleC50cyIsIi4uL3NyYy9wbHVnaW5zL2V4dHJhY3REZXBlbmRlbmN5UGx1Z2luL2luZGV4LnRzIiwiLi4vc3JjL2NvbmZpZy9hbmthRGVmYXVsdENvbmZpZy50cyIsIi4uL3NyYy9jb25maWcvYW5rYUNvbmZpZy50cyIsIi4uL3NyYy9jb25maWcvc3lzdGVtQ29uZmlnLnRzIiwiLi4vc3JjL2NvbmZpZy9wcm9qZWN0Q29uZmlnLnRzIiwiLi4vc3JjL2NvbmZpZy9pbmRleC50cyIsIi4uL3NyYy9jb3JlL2NsYXNzL0luamVjdGlvbi50cyIsIi4uL3NyYy9jb3JlL2NsYXNzL0NvbXBpbGF0aW9uLnRzIiwiLi4vc3JjL2NvcmUvY2xhc3MvQ29tcGlsZXIudHMiLCIuLi9zcmMvY29yZS9jbGFzcy9Db21tYW5kLnRzIiwiLi4vc3JjL2NvbW1hbmRzL2Rldi50cyIsIi4uL3NyYy9jb21tYW5kcy9wcm9kLnRzIiwiLi4vc3JjL2NvbW1hbmRzLnRzIiwiLi4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBjb25maWcgZnJvbSAnLi4vY29uZmlnJ1xuaW1wb3J0IEZpbGUgZnJvbSAnLi4vY29yZS9jbGFzcy9GaWxlJ1xuXG4vKipcbiAqIFNjcmlwdCBGaWxlIHBhcnNlci5cbiAqIEBmb3IgLmpzIC5lc1xuICovXG5leHBvcnQgZGVmYXVsdCA8UGFyc2VyPmZ1bmN0aW9uICh0aGlzOiBQYXJzZXJJbmplY3Rpb24sIGZpbGU6IEZpbGUsIGNvbXBpbGF0aW9uOiBDb21waWxhdGlvbiwgY2I6IEZ1bmN0aW9uKSB7XG4gICAgLy8gdGhpcy5yZXNvdXJjZVR5cGUgPSBSRVNPVVJDRV9UWVBFLk9USEVSXG4gICAgLy8gZmlsZS50YXJnZXRGaWxlID0gZmlsZS50YXJnZXRGaWxlLnJlcGxhY2UoY29uZmlnLnNyY0RpciwgY29uZmlnLmRpc3REaXIpXG4gICAgZmlsZS51cGRhdGVFeHQoJy5qcycpXG4gICAgY2IoKVxufVxuIiwiY29uc3QgcG9zdGNzcyA9IHJlcXVpcmUoJ3Bvc3Rjc3MnKVxuXG5leHBvcnQgZGVmYXVsdCBwb3N0Y3NzLnBsdWdpbigncG9zdGNzcy13eGltcG9ydCcsICgpID0+IHtcbiAgICByZXR1cm4gKHJvb3Q6IGFueSkgPT4ge1xuICAgICAgICByb290LndhbGtBdFJ1bGVzKCd3eGltcG9ydCcsIChydWxlOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHJ1bGUubmFtZSA9ICdpbXBvcnQnXG4gICAgICAgICAgICBydWxlLnBhcmFtcyA9IHJ1bGUucGFyYW1zLnJlcGxhY2UoL1xcLlxcdysoPz1bJ1wiXSQpLywgJy53eHNzJylcbiAgICAgICAgfSlcbiAgICB9XG59KVxuIiwiaW1wb3J0ICogYXMgUG9zdGNzcyBmcm9tICdwb3N0Y3NzJ1xuaW1wb3J0IHBvc3Rjc3NyYyBmcm9tICdwb3N0Y3NzLWxvYWQtY29uZmlnJ1xuaW1wb3J0IHBvc3Rjc3NXeEltcG9ydCBmcm9tICcuL3Bvc3Rjc3NXeGltcG9ydCdcblxuY29uc3QgcG9zdGNzcyA9IHJlcXVpcmUoJ3Bvc3Rjc3MnKVxuY29uc3QgcG9zdGNzc0NvbmZpZzogYW55ID0ge31cblxuLyoqXG4gKiBTdHlsZSBmaWxlIHBhcnNlci5cbiAqIEBmb3IgLnd4c3MgLmNzcyA9PiAud3hzc1xuICovXG5leHBvcnQgZGVmYXVsdCA8UGFyc2VyPmZ1bmN0aW9uICh0aGlzOiBQYXJzZXJJbmplY3Rpb24sIGZpbGU6IEZpbGUsIGNvbXBpbGF0aW9uOiBDb21waWxhdGlvbiwgY2I6IEZ1bmN0aW9uKTogdm9pZCB7XG4gICAgZ2VuUG9zdGNzc0NvbmZpZygpLnRoZW4oKGNvbmZpZzogYW55KSA9PiB7XG4gICAgICAgIGZpbGUuY29udGVudCA9IGZpbGUuY29udGVudCBpbnN0YW5jZW9mIEJ1ZmZlciA/IGZpbGUuY29udGVudC50b1N0cmluZygpIDogZmlsZS5jb250ZW50XG5cbiAgICAgICAgcmV0dXJuIHBvc3Rjc3MoY29uZmlnLnBsdWdpbnMuY29uY2F0KFtwb3N0Y3NzV3hJbXBvcnRdKSkucHJvY2VzcyhmaWxlLmNvbnRlbnQsIHtcbiAgICAgICAgICAgIC4uLmNvbmZpZy5vcHRpb25zLFxuICAgICAgICAgICAgZnJvbTogZmlsZS5zb3VyY2VGaWxlXG4gICAgICAgIH0gYXMgUG9zdGNzcy5Qcm9jZXNzT3B0aW9ucylcbiAgICB9KS50aGVuKChyb290OiBQb3N0Y3NzLkxhenlSZXN1bHQpID0+IHtcbiAgICAgICAgZmlsZS5jb250ZW50ID0gcm9vdC5jc3NcbiAgICAgICAgZmlsZS51cGRhdGVFeHQoJy53eHNzJylcbiAgICAgICAgY2IoKVxuICAgIH0pXG59XG5cblxuZnVuY3Rpb24gZ2VuUG9zdGNzc0NvbmZpZyAoKSB7XG4gICAgcmV0dXJuIHBvc3Rjc3NDb25maWcucGx1Z2lucyA/IFByb21pc2UucmVzb2x2ZShwb3N0Y3NzQ29uZmlnKSA6IHBvc3Rjc3NyYyh7fSkudGhlbigoY29uZmlnOiBhbnkpID0+IHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShPYmplY3QuYXNzaWduKHBvc3Rjc3NDb25maWcsIGNvbmZpZykpXG4gICAgfSlcbn1cbiIsImltcG9ydCAqIGFzIEdsb2IgZnJvbSAnZ2xvYidcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJ1xuY29uc3QgZ2xvYiA9IHJlcXVpcmUoJ2dsb2InKVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZEZpbGUgKHNvdXJjZUZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPEJ1ZmZlcj4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGZzLnJlYWRGaWxlKHNvdXJjZUZpbGVQYXRoLCAoZXJyLCBidWZmZXIpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKGJ1ZmZlcilcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVGaWxlICh0YXJnZXRGaWxlUGF0aDogc3RyaW5nLCBjb250ZW50OiBDb250ZW50KTogUHJvbWlzZTx1bmRlZmluZWQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBmcy53cml0ZUZpbGUodGFyZ2V0RmlsZVBhdGgsIGNvbnRlbnQsIGVyciA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB0aHJvdyBlcnJcbiAgICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICB9KVxuICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZWFyY2hGaWxlcyAoc2NoZW1lOiBzdHJpbmcsIG9wdGlvbnM/OiBHbG9iLklPcHRpb25zKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGdsb2Ioc2NoZW1lLCBvcHRpb25zLCAoZXJyOiAoRXJyb3IgfCBudWxsKSwgZmlsZXM6IEFycmF5PHN0cmluZz4pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKGZpbGVzKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0pXG59XG4iLCJpbXBvcnQgY2hhbGsgZnJvbSAnY2hhbGsnXG5jb25zdCBvcmEgPSByZXF1aXJlKCdvcmEnKVxuXG5leHBvcnQgZnVuY3Rpb24gdG9GaXggKG51bWJlcjogbnVtYmVyKTogc3RyaW5nIHtcbiAgICByZXR1cm4gKCcwMCcgKyBudW1iZXIpLnNsaWNlKC0yKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudFRpbWUgKCk6IHN0cmluZyB7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKVxuICAgIHJldHVybiBgJHt0b0ZpeChub3cuZ2V0SG91cnMoKSl9OiR7dG9GaXgobm93LmdldE1pbnV0ZXMoKSl9OiR7dG9GaXgobm93LmdldFNlY29uZHMoKSl9YFxufVxuXG5leHBvcnQgY2xhc3MgTG9nZ2VyIHtcbiAgICBvcmFJbnN0YW5jZTogYW55XG5cbiAgICBnZXQgdGltZSAoKSB7XG4gICAgICAgIHJldHVybiBjaGFsay5ncmV5KGBbJHtnZXRDdXJyZW50VGltZSgpfV1gKVxuICAgIH1cblxuICAgIHN0YXJ0TG9hZGluZyAobXNnOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5vcmFJbnN0YW5jZSA9IG9yYShtc2cpLnN0YXJ0KClcbiAgICB9XG5cbiAgICBzdG9wTG9hZGluZyAoKSB7XG4gICAgICAgIHRoaXMub3JhSW5zdGFuY2UgJiYgdGhpcy5vcmFJbnN0YW5jZS5zdG9wKClcbiAgICB9XG5cbiAgICBsb2cgKC4uLm1zZzogQXJyYXk8c3RyaW5nPikge1xuICAgICAgICByZXR1cm4gY29uc29sZS5sb2codGhpcy50aW1lLCAuLi5tc2cpXG4gICAgfVxuXG4gICAgZXJyb3IgKHRpdGxlOiBzdHJpbmcgPSAnJywgbXNnOiBzdHJpbmcgPSAnJywgZXJyOiBzdHJpbmcgPSAnJykge1xuICAgICAgICB0aGlzLmxvZyhjaGFsay5yZWQoJ+KcmCcpLCBjaGFsay5yZXNldCh0aXRsZSksIGNoYWxrLmdyZXkobXNnKSlcbiAgICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgIH1cblxuICAgIGluZm8gKHRpdGxlOiBzdHJpbmcgPSAnJywgbXNnOiBzdHJpbmcgPSAnJykge1xuICAgICAgICB0aGlzLmxvZyhjaGFsay5jeWFuKCfil4snKSwgY2hhbGsucmVzZXQodGl0bGUpLCBjaGFsay5ncmV5KG1zZykpXG4gICAgfVxuXG4gICAgd2FybiAodGl0bGU6IHN0cmluZyA9ICcnLCBtc2c6IHN0cmluZyA9ICcnKSB7XG4gICAgICAgIHRoaXMubG9nKGNoYWxrLnllbGxvdygn4pqgJyksIGNoYWxrLnJlc2V0KHRpdGxlKSwgY2hhbGsuZ3JleShtc2cpKVxuICAgIH1cblxuICAgIHN1Y2Nlc3MgKHRpdGxlOiBzdHJpbmcgPSAnJywgbXNnOiBzdHJpbmcgPSAnJykge1xuICAgICAgICB0aGlzLmxvZyhjaGFsay5ncmVlbign4pyUJyksIGNoYWxrLnJlc2V0KHRpdGxlKSwgY2hhbGsuZ3JleShtc2cpKVxuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgbmV3IExvZ2dlcigpXG4iLCJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgKiBhcyBhY29ybiBmcm9tICdhY29ybidcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJ1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuLi8uLi9jb25maWcnXG5cbmNvbnN0IHJlcGxhY2VFeHQgPSByZXF1aXJlKCdyZXBsYWNlLWV4dCcpXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZpbGUge1xuICAgIHB1YmxpYyBzb3VyY2VGaWxlOiBzdHJpbmdcbiAgICBwdWJsaWMgY29udGVudDogQ29udGVudFxuICAgIHB1YmxpYyB0YXJnZXRGaWxlOiBzdHJpbmdcbiAgICBwdWJsaWMgYXN0PzogYWNvcm4uTm9kZVxuICAgIHB1YmxpYyBzb3VyY2VNYXA/OiBDb250ZW50XG5cbiAgICBjb25zdHJ1Y3RvciAob3B0aW9uOiBGaWxlQ29uc3RydWN0b3JPcHRpb24pIHtcbiAgICAgICAgaWYgKCFvcHRpb24uc291cmNlRmlsZSkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHZhbHVlOiBGaWxlQ29uc3RydWN0b3JPcHRpb24uc291cmNlRmlsZScpXG4gICAgICAgIGlmICghb3B0aW9uLmNvbnRlbnQpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCB2YWx1ZTogRmlsZUNvbnN0cnVjdG9yT3B0aW9uLmNvbnRlbnQnKVxuXG4gICAgICAgIHRoaXMuc291cmNlRmlsZSA9IG9wdGlvbi5zb3VyY2VGaWxlXG4gICAgICAgIHRoaXMudGFyZ2V0RmlsZSA9IG9wdGlvbi50YXJnZXRGaWxlIHx8IG9wdGlvbi5zb3VyY2VGaWxlLnJlcGxhY2UoY29uZmlnLnNyY0RpciwgY29uZmlnLmRpc3REaXIpIC8vIERlZmF1bHQgdmFsdWVcbiAgICAgICAgdGhpcy5jb250ZW50ID0gb3B0aW9uLmNvbnRlbnRcbiAgICAgICAgdGhpcy5zb3VyY2VNYXAgPSBvcHRpb24uc291cmNlTWFwXG4gICAgfVxuXG4gICAgZ2V0IGRpcm5hbWUgKCkge1xuICAgICAgICByZXR1cm4gcGF0aC5kaXJuYW1lKHRoaXMuc291cmNlRmlsZSlcbiAgICB9XG5cbiAgICBnZXQgYmFzZW5hbWUgKCkge1xuICAgICAgICByZXR1cm4gcGF0aC5iYXNlbmFtZSh0aGlzLnNvdXJjZUZpbGUpXG4gICAgfVxuXG4gICAgZ2V0IGV4dG5hbWUgKCkge1xuICAgICAgICByZXR1cm4gcGF0aC5leHRuYW1lKHRoaXMuc291cmNlRmlsZSlcbiAgICB9XG5cbiAgICBhc3luYyBzYXZlVG8gKHBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCBmcy5lbnN1cmVGaWxlKHBhdGgpXG5cbiAgICAgICAgaWYgKCFwYXRoKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgcGF0aCcpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1cGRhdGVFeHQgKGV4dDogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIHRoaXMudGFyZ2V0RmlsZSA9IHJlcGxhY2VFeHQodGhpcy50YXJnZXRGaWxlLCBleHQpXG4gICAgfVxufVxuIiwiaW1wb3J0IHtcbiAgICByZWFkRmlsZVxufSBmcm9tICcuL2VkaXRvcidcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJ1xuaW1wb3J0IEZpbGUgZnJvbSAnLi4vY29yZS9jbGFzcy9GaWxlJ1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRmlsZSAoc291cmNlRmlsZTogc3RyaW5nKTogUHJvbWlzZTxGaWxlPiB7XG4gICAgcmV0dXJuIHJlYWRGaWxlKHNvdXJjZUZpbGUpLnRoZW4oY29udGVudCA9PiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IEZpbGUoe1xuICAgICAgICAgICAgc291cmNlRmlsZSxcbiAgICAgICAgICAgIGNvbnRlbnRcbiAgICAgICAgfSkpXG4gICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUZpbGVTeW5jIChzb3VyY2VGaWxlOiBzdHJpbmcpIHtcbiAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHNvdXJjZUZpbGUpXG4gICAgcmV0dXJuIG5ldyBGaWxlKHtcbiAgICAgICAgc291cmNlRmlsZSxcbiAgICAgICAgY29udGVudFxuICAgIH0pXG59XG4iLCJpbXBvcnQgbG9nIGZyb20gJy4vbG9nZ2VyJ1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAoaWQ6IHN0cmluZywgb3B0aW9ucz86IHsgcGF0aHM/OiBzdHJpbmdbXSB9LCBzaWxlbnQ/OiBib29sZWFuKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUucmVzb2x2ZShpZCwgb3B0aW9ucylcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgIXNpbGVudCAmJiBsb2cuZXJyb3IoJ01pc3NpbmcgZGVwZW5kZW5jeScsIGlkLCBlcnIpXG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5cbmNvbnN0IGN3ZCA9IHByb2Nlc3MuY3dkKClcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKG5hbWVzOiBBcnJheTxzdHJpbmc+ID0gW10sIHJvb3Q/OiBzdHJpbmcpOiBPYmplY3Qge1xuICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IHt9XG4gICAgY29uc3QgY29uZmlnUGF0aHMgPSBuYW1lcy5tYXAobmFtZSA9PiBwYXRoLmpvaW4ocm9vdCB8fCBjd2QsIG5hbWUpKVxuXG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGNvbmZpZ1BhdGhzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICBjb25zdCBjb25maWdQYXRoID0gY29uZmlnUGF0aHNbaW5kZXhdXG5cbiAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoY29uZmlnUGF0aCkpIHtcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oZGVmYXVsdFZhbHVlLCByZXF1aXJlKGNvbmZpZ1BhdGgpKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkZWZhdWx0VmFsdWVcbn1cbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNhbGxQcm9taXNlSW5DaGFpbiAobGlzdDogQXJyYXk8KC4uLnBhcmFtczogYW55W10pID0+IFByb21pc2U8YW55Pj4gPSBbXSwgLi4ucGFyYW1zOiBBcnJheTxhbnk+KSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgaWYgKCFsaXN0Lmxlbmd0aCkgIHtcbiAgICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgbGV0IHN0ZXAgPSBsaXN0WzBdKC4uLnBhcmFtcylcblxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHN0ZXAgPSBzdGVwLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsaXN0W2ldKC4uLnBhcmFtcylcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICBzdGVwLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICB9LCBlcnIgPT4ge1xuICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgfSlcbiAgICB9KVxufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKGZuOiBGdW5jdGlvbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoLi4ucGFyYW1zOiBBcnJheTxhbnk+KSB7XG4gICAgICAgIGNvbnN0IGxpbWl0YXRpb24gPSBwYXJhbXMubGVuZ3RoXG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgaWYgKGZuLmxlbmd0aCA+IGxpbWl0YXRpb24pIHtcbiAgICAgICAgICAgICAgICBmbiguLi5wYXJhbXMsIHJlc29sdmUpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoZm4oLi4ucGFyYW1zKSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBjaG9raWRhciBmcm9tICdjaG9raWRhcidcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKGRpcjogc3RyaW5nIHwgc3RyaW5nW10sIG9wdGlvbnM/OiBjaG9raWRhci5XYXRjaE9wdGlvbnMpIHtcbiAgICByZXR1cm4gY2hva2lkYXIud2F0Y2goZGlyLCB7XG4gICAgICAgIHBlcnNpc3RlbnQ6IHRydWUsXG4gICAgICAgIGlnbm9yZUluaXRpYWw6IHRydWUsXG4gICAgICAgIC4uLm9wdGlvbnNcbiAgICB9KVxufVxuIiwiZGVjbGFyZSB0eXBlIFZhbGlkYXRlTnBtUGFja2FnZU5hbWUgPSB7XG4gICAgdmFsaWRGb3JOZXdQYWNrYWdlczogYm9vbGVhbixcbiAgICB2YWxpZEZvck9sZFBhY2thZ2VzOiBib29sZWFuXG59XG5cbmNvbnN0IHZhbGlkYXRlID0gcmVxdWlyZSgndmFsaWRhdGUtbnBtLXBhY2thZ2UtbmFtZScpXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChyZXF1aXJlZDogc3RyaW5nID0gJycpIHtcbiAgICBjb25zdCByZXN1bHQgPSA8VmFsaWRhdGVOcG1QYWNrYWdlTmFtZT52YWxpZGF0ZShyZXF1aXJlZC5zcGxpdCgnLycpLnNsaWNlKDAsIDEpLmpvaW4oJy8nKSlcblxuICAgIHJldHVybiByZXN1bHQudmFsaWRGb3JOZXdQYWNrYWdlcyB8fCByZXN1bHQudmFsaWRGb3JPbGRQYWNrYWdlc1xufVxuIiwiaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vLi4vdXRpbHMnXG5pbXBvcnQgbG9nZ2VyIGZyb20gJy4uLy4uL3V0aWxzL2xvZ2dlcidcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJ1xuXG5jb25zdCB7IHdyaXRlRmlsZSB9ID0gdXRpbHNcblxuZXhwb3J0IGRlZmF1bHQgPFBsdWdpbj5mdW5jdGlvbiAodGhpczogUGx1Z2luSW5qZWN0aW9uKSB7XG4gICAgdGhpcy5vbignYWZ0ZXItY29tcGlsZScsIDxQbHVnaW5IYW5kbGVyPmZ1bmN0aW9uIChjb21waWxhdGlvbjogQ29tcGlsYXRpb24sIGNiOiBGdW5jdGlvbikge1xuICAgICAgICBjb25zdCBmaWxlID0gY29tcGlsYXRpb24uZmlsZVxuXG4gICAgICAgIC8vIFRPRE86IFVzZSBtZW0tZnNcbiAgICAgICAgZnMuZW5zdXJlRmlsZShmaWxlLnRhcmdldEZpbGUpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHdyaXRlRmlsZShmaWxlLnRhcmdldEZpbGUsIGZpbGUuY29udGVudClcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBjb21waWxhdGlvbi5kZXN0cm95KClcbiAgICAgICAgICAgIGNiKClcbiAgICAgICAgfSwgZXJyID0+IHtcbiAgICAgICAgICAgIGxvZ2dlci5lcnJvcignRXJyb3InLCBlcnIubWVzc2FnZSwgZXJyKVxuICAgICAgICAgICAgY29tcGlsYXRpb24uZGVzdHJveSgpXG4gICAgICAgICAgICBjYigpXG4gICAgICAgIH0pXG4gICAgfSlcbn1cbiIsImltcG9ydCB7XG4gICAgRmlsZSxcbiAgICBDb21waWxlclxufSBmcm9tICcuLi8uLi9jb3JlJ1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0ICogYXMgYWNvcm4gZnJvbSAnYWNvcm4nXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi8uLi91dGlscydcbmltcG9ydCAqIGFzIGVzY29kZWdlbiBmcm9tICdlc2NvZGVnZW4nXG5pbXBvcnQgKiBhcyBhY29ybldhbGtlciBmcm9tICdhY29ybi13YWxrJ1xuXG5jb25zdCBkZXBlbmRlbmN5UG9vbCA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmcgfCB1bmRlZmluZWQ+KClcblxuZXhwb3J0IGRlZmF1bHQgPFBsdWdpbj4gZnVuY3Rpb24gKHRoaXM6IFBsdWdpbkluamVjdGlvbikge1xuICAgIGNvbnN0IGNvbXBpbGVyID0gdGhpcy5nZXRDb21waWxlcigpXG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5nZXRTeXN0ZW1Db25maWcoKVxuICAgIGNvbnN0IHRlc3ROb2RlTW9kdWxlcyA9IG5ldyBSZWdFeHAoYF4ke2NvbmZpZy5zb3VyY2VOb2RlTW9kdWxlc31gKVxuXG4gICAgdGhpcy5vbignYmVmb3JlLWNvbXBpbGUnLCBmdW5jdGlvbiAoY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYjogRnVuY3Rpb24pIHtcbiAgICAgICAgY29uc3QgZmlsZSA9IGNvbXBpbGF0aW9uLmZpbGVcblxuICAgICAgICAvLyBPbmx5IHJlc29sdmUganMgZmlsZS5cbiAgICAgICAgaWYgKGZpbGUuZXh0bmFtZSA9PT0gJy5qcycpIHtcbiAgICAgICAgICAgIGlmIChmaWxlLmFzdCA9PT0gdm9pZCAoMCkpIHtcbiAgICAgICAgICAgICAgICBmaWxlLmFzdCA9IGFjb3JuLnBhcnNlKFxuICAgICAgICAgICAgICAgICAgICBmaWxlLmNvbnRlbnQgaW5zdGFuY2VvZiBCdWZmZXIgPyBmaWxlLmNvbnRlbnQudG9TdHJpbmcoKSA6IGZpbGUuY29udGVudCxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlVHlwZTogJ21vZHVsZSdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFjb3JuV2Fsa2VyLnNpbXBsZSAoZmlsZS5hc3QsIHtcbiAgICAgICAgICAgICAgICBJbXBvcnREZWNsYXJhdGlvbiAobm9kZTogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNvdXJjZSA9IG5vZGUuc291cmNlXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2UudmFsdWUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZS50eXBlID09PSAnTGl0ZXJhbCcgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiBzb3VyY2UudmFsdWUgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShzb3VyY2UsIGZpbGUuc291cmNlRmlsZSwgZmlsZS50YXJnZXRGaWxlKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBDYWxsRXhwcmVzc2lvbiAobm9kZTogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNhbGxlZSA9IG5vZGUuY2FsbGVlXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFyZ3MgPSBub2RlLmFyZ3VtZW50c1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxlZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnc1swXSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnc1swXS52YWx1ZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGVlLm5hbWUgPT09ICdyZXF1aXJlJyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnc1swXS50eXBlID09PSAnTGl0ZXJhbCcgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiBhcmdzWzBdLnZhbHVlID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYXJnc1swXSwgZmlsZS5zb3VyY2VGaWxlLCBmaWxlLnRhcmdldEZpbGUpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgZmlsZS5jb250ZW50ID0gZXNjb2RlZ2VuLmdlbmVyYXRlKGZpbGUuYXN0KVxuICAgICAgICB9XG5cbiAgICAgICAgY2IoKVxuICAgICAgICAvLyBjb25zdCBuZXdDb21wdGhpcy5nZW5lcmF0ZUNvbXBpbGF0aW9uKClcbiAgICB9IGFzIFBsdWdpbkhhbmRsZXIpXG5cbiAgICBmdW5jdGlvbiByZXNvbHZlIChub2RlOiBhbnksIHNvdXJjZUZpbGU6IHN0cmluZywgdGFyZ2V0RmlsZTogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IHNvdXJjZUJhc2VOYW1lID0gcGF0aC5kaXJuYW1lKHNvdXJjZUZpbGUpXG4gICAgICAgIGNvbnN0IHRhcmdldEJhc2VOYW1lID0gcGF0aC5kaXJuYW1lKHRhcmdldEZpbGUpXG5cbiAgICAgICAgaWYgKHV0aWxzLmlzTnBtRGVwZW5kZW5jeShub2RlLnZhbHVlKSkge1xuICAgICAgICAgICAgY29uc3QgZGVwZW5kZW5jeSA9IHV0aWxzLnJlc29sdmVNb2R1bGUobm9kZS52YWx1ZSwge1xuICAgICAgICAgICAgICAgIHBhdGhzOiBbc291cmNlQmFzZU5hbWVdXG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICBpZiAoIWRlcGVuZGVuY3kpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhub2RlLnZhbHVlLCAnaXMgbm90IGV4aXN0Jywgc291cmNlRmlsZSlcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGRpc3RQYXRoID0gZGVwZW5kZW5jeS5yZXBsYWNlKGNvbmZpZy5zb3VyY2VOb2RlTW9kdWxlcywgY29uZmlnLmRpc3ROb2RlTW9kdWxlcylcblxuICAgICAgICAgICAgbm9kZS52YWx1ZSA9IHBhdGgucmVsYXRpdmUodGFyZ2V0QmFzZU5hbWUsIGRpc3RQYXRoKVxuICAgICAgICAgICAgaWYgKGRlcGVuZGVuY3lQb29sLmhhcyhkZXBlbmRlbmN5KSkgcmV0dXJuXG4gICAgICAgICAgICB0cmF2ZXJzZU5wbURlcGVuZGVuY3koZGVwZW5kZW5jeSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIElmIHRoZSBmaWxlIGV4aXN0cyBpbiBub2RlX21vZHVsZXNcbiAgICAgICAgICAgIGlmICh0ZXN0Tm9kZU1vZHVsZXMudGVzdChzb3VyY2VGaWxlKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRlcGVuZGVuY3kgPSB1dGlscy5yZXNvbHZlTW9kdWxlKG5vZGUudmFsdWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aHM6IFtzb3VyY2VCYXNlTmFtZV1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIGNvbnN0IGRpc3RQYXRoID0gZGVwZW5kZW5jeS5yZXBsYWNlKGNvbmZpZy5zb3VyY2VOb2RlTW9kdWxlcywgY29uZmlnLmRpc3ROb2RlTW9kdWxlcylcbiAgICAgICAgICAgICAgICBub2RlLnZhbHVlID0gcGF0aC5yZWxhdGl2ZSh0YXJnZXRCYXNlTmFtZSwgZGlzdFBhdGgpXG5cbiAgICAgICAgICAgICAgICBpZiAoZGVwZW5kZW5jeVBvb2wuaGFzKGRlcGVuZGVuY3kpKSByZXR1cm5cbiAgICAgICAgICAgICAgICB0cmF2ZXJzZU5wbURlcGVuZGVuY3koZGVwZW5kZW5jeSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRyYXZlcnNlTnBtRGVwZW5kZW5jeSAoZGVwZW5kZW5jeTogc3RyaW5nKSB7XG4gICAgICAgIGlmIChkZXBlbmRlbmN5UG9vbC5oYXMoZGVwZW5kZW5jeSkpIHJldHVyblxuICAgICAgICBkZXBlbmRlbmN5UG9vbC5zZXQoZGVwZW5kZW5jeSwgZGVwZW5kZW5jeSlcblxuICAgICAgICBjb25zdCBmaWxlID0gdXRpbHMuY3JlYXRlRmlsZVN5bmMoZGVwZW5kZW5jeSlcblxuICAgICAgICBmaWxlLnRhcmdldEZpbGUgPSBmaWxlLnNvdXJjZUZpbGUucmVwbGFjZShjb25maWcuc291cmNlTm9kZU1vZHVsZXMsIGNvbmZpZy5kaXN0Tm9kZU1vZHVsZXMpXG4gICAgICAgIGNvbXBpbGVyLmdlbmVyYXRlQ29tcGlsYXRpb24oZmlsZSkucnVuKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvLyBsb2dnZXIuaW5mbygnUmVzb2x2ZScsIGRlcGVuZGVuY3kpXG4gICAgICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICB1dGlscy5sb2dnZXIuZXJyb3IoZGVwZW5kZW5jeSwgZXJyLm1lc3NhZ2UsIGVycilcbiAgICAgICAgfSlcbiAgICB9XG5cbn1cbiIsIi8vIGltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBmaWxlUGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvZmlsZVBhcnNlcidcbmltcG9ydCBzY3JpcHRQYXJzZXIgZnJvbSAnLi4vcGFyc2Vycy9zY3JpcHRQYXJzZXInXG5pbXBvcnQgc3R5bGVQYXJzZXIgZnJvbSAnLi4vcGFyc2Vycy9zdHlsZVBhcnNlcidcbmltcG9ydCB0ZW1wbGF0ZVBhcnNlciBmcm9tICcuLi9wYXJzZXJzL3RlbXBsYXRlUGFyc2VyJ1xuaW1wb3J0IHNhdmVGaWxlUGx1Z2luIGZyb20gJy4uL3BsdWdpbnMvc2F2ZUZpbGVQbHVnaW4nXG5pbXBvcnQgZXh0cmFjdERlcGVuZGVuY3lQbHVnaW4gZnJvbSAnLi4vcGx1Z2lucy9leHRyYWN0RGVwZW5kZW5jeVBsdWdpbidcblxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICAgICAgICAgICAgICAgICAgIERhbmdlciB6b25lXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbi8qKlxuICogVGhlIHBhdGggd2hlcmUgV2VDaGF0IG1pbmlwcm9ncmFtIHNvdXJjZSBmaWxlcyBleGlzdC5cbiAqIEBkZWZhdWx0ICcuL3NyYydcbiAqL1xuZXhwb3J0IGNvbnN0IHNvdXJjZURpciA9ICcuL3NyYydcblxuLyoqXG4gKiBUaGUgcGF0aCB3aGVyZSBXZUNoYXQgbWluaXByb2dyYW0gY29tcGlsZWQgZmlsZXMgZXhpc3QuXG4gKiBAZGVmYXVsdCAnLi9kaXN0J1xuICovXG5leHBvcnQgY29uc3Qgb3V0cHV0RGlyID0gJy4vZGlzdCdcblxuLyoqXG4gKiBUaGUgcGF0aCB3aGVyZSBXZUNoYXQgbWluaXByb2dyYW0gcGFnZXMgZXhpc3QuXG4gKiBAZGVmYXVsdCAnLi9zcmMvcGFnZXMnXG4gKi9cbmV4cG9ydCBjb25zdCBwYWdlcyA9IHBhdGguam9pbihzb3VyY2VEaXIsICdwYWdlcycpXG5cbi8qKlxuICogVGhlIHBhdGggd2hlcmUgV2VDaGF0IG1pbmlwcm9ncmFtIGNvbXBvbmVudHMgZXhpc3QuXG4gKiBAZGVmYXVsdCAnLi9zcmMvY29tcG9uZW50cydcbiAqL1xuZXhwb3J0IGNvbnN0IGNvbXBvbmVudHMgPSBwYXRoLmpvaW4oc291cmNlRGlyLCAnY29tcG9uZW50cycpXG5cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgICAgICAgICAgICAgICAgQ3VzdG9tIGNvbmZpZ3VyZVxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4vKipcbiAqIFdoZXRoZXIgdG8gb3V0cHV0IGNvbXBpbGUgaW5mb3JtYXRpb24uXG4gKiBAZGVmYXVsdCBmYWxzZVxuICovXG5leHBvcnQgY29uc3Qgc2lsZW50ID0gZmFsc2VcblxuLyoqXG4gKiBBbmthIGRldmVsb3BtZW50IG1vZGUuXG4gKiBAZGVmYXVsdCBmYWxzZVxuICovXG5leHBvcnQgY29uc3QgZGV2TW9kZSA9IGZhbHNlXG5cbi8qKlxuICogUmVnaXN0ZXIgZmlsZSBwYXJzZXIuXG4gKi9cbmV4cG9ydCBjb25zdCBwYXJzZXJzOiBQYXJzZXJzQ29uZmlncmF0aW9uID0gW1xuICAgIHtcbiAgICAgICAgbWF0Y2g6IC8uKlxcLihqc3xlcykkLyxcbiAgICAgICAgcGFyc2VyczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcnNlcjogc2NyaXB0UGFyc2VyLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IHt9XG4gICAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbWF0Y2g6IC8uKlxcLih3eHNzfGNzc3xwb3N0Y3NzKSQvLFxuICAgICAgICBwYXJzZXJzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGFyc2VyOiBzdHlsZVBhcnNlcixcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB7fVxuICAgICAgICAgICAgfVxuICAgICAgICBdXG4gICAgfVxuXVxuXG4vKipcbiAqIFdoZXRoZXIgdG8gb3V0cHV0IGRlYnVnIGluZm9ybWF0aW9uLlxuICogQGRlZmF1bHQgZmFsc2VcbiAqL1xuZXhwb3J0IGNvbnN0IGRlYnVnOiBib29sZWFuID0gZmFsc2VcblxuLyoqXG4gKiBSZWdpc3RlciBwbHVnaW4uXG4gKi9cbmV4cG9ydCBjb25zdCBwbHVnaW5zOiBQbHVnaW5zQ29uZmlncmF0aW9uID0gW1xuICAgIHtcbiAgICAgICAgcGx1Z2luOiBleHRyYWN0RGVwZW5kZW5jeVBsdWdpbixcbiAgICAgICAgb3B0aW9uczoge31cbiAgICB9LFxuICAgIHtcbiAgICAgICAgcGx1Z2luOiBzYXZlRmlsZVBsdWdpbixcbiAgICAgICAgb3B0aW9uczoge31cbiAgICB9XG5dXG5cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgICAgICAgICAgICAgIGV4cGVyaW1lbnRhbCBjb25maWd1cmVcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuIiwiaW1wb3J0ICogYXMgYW5rYURlZmF1bHRDb25maWcgZnJvbSAnLi9hbmthRGVmYXVsdENvbmZpZydcbmltcG9ydCByZXNvbHZlQ29uZmlnIGZyb20gJy4uL3V0aWxzL3Jlc29sdmVDb25maWcnXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICAuLi5hbmthRGVmYXVsdENvbmZpZyxcbiAgICAuLi5yZXNvbHZlQ29uZmlnKFsnYW5rYS5jb25maWcuanMnLCAnYW5rYS5jb25maWcuanNvbiddKVxufVxuIiwiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IGFua2FDb25maWcgZnJvbSAnLi9hbmthQ29uZmlnJ1xuXG5leHBvcnQgY29uc3QgY3dkID0gcHJvY2Vzcy5jd2QoKVxuZXhwb3J0IGNvbnN0IHNyY0RpciA9IHBhdGgucmVzb2x2ZShjd2QsIGFua2FDb25maWcuc291cmNlRGlyKVxuZXhwb3J0IGNvbnN0IGRpc3REaXIgPSBwYXRoLnJlc29sdmUoY3dkLCBhbmthQ29uZmlnLm91dHB1dERpcilcbmV4cG9ydCBjb25zdCBhbmthTW9kdWxlcyA9IHBhdGgucmVzb2x2ZShzcmNEaXIsICdhbmthX21vZHVsZXMnKVxuZXhwb3J0IGNvbnN0IHNvdXJjZU5vZGVNb2R1bGVzID0gcGF0aC5yZXNvbHZlKGN3ZCwgJy4vbm9kZV9tb2R1bGVzJylcbmV4cG9ydCBjb25zdCBkaXN0Tm9kZU1vZHVsZXMgPSBwYXRoLnJlc29sdmUoZGlzdERpciwgJy4vbnBtX21vZHVsZXMnKVxuZXhwb3J0IGNvbnN0IGRlZmF1bHRTY2FmZm9sZCA9ICAnZGlyZWN0Omh0dHBzOi8vZ2l0aHViLmNvbS9pRXhjZXB0aW9uL2Fua2EtcXVpY2tzdGFydCdcbiIsImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJ1xuaW1wb3J0IGFua2FDb25maWcgZnJvbSAnLi9hbmthQ29uZmlnJ1xuaW1wb3J0ICogYXMgc3lzdGVtIGZyb20gJy4vc3lzdGVtQ29uZmlnJ1xuaW1wb3J0IHJlc29sdmVDb25maWcgZnJvbSAnLi4vdXRpbHMvcmVzb2x2ZUNvbmZpZydcblxuY29uc3QgY3VzdG9tQ29uZmlnID0gcmVzb2x2ZUNvbmZpZyhbJ2FwcC5qc29uJ10sIHN5c3RlbS5zcmNEaXIpXG5cbmV4cG9ydCBkZWZhdWx0IE9iamVjdC5hc3NpZ24oe1xuICAgIHBhZ2VzOiBbXSxcbiAgICBzdWJQYWNrYWdlczogW10sXG4gICAgd2luZG93OiB7XG4gICAgICAgIG5hdmlnYXRpb25CYXJUaXRsZVRleHQ6ICdXZWNoYXQnXG4gICAgfVxuICAgIC8vIHRhYkJhcjoge1xuICAgIC8vICAgICBsaXN0OiBbXVxuICAgIC8vIH0sXG59LCBjdXN0b21Db25maWcpXG4iLCJpbXBvcnQgKiBhcyBzeXN0ZW1Db25maWcgZnJvbSAnLi9zeXN0ZW1Db25maWcnXG5pbXBvcnQgYW5rYUNvbmZpZyBmcm9tICcuL2Fua2FDb25maWcnXG5pbXBvcnQgcHJvamVjdENvbmZpZyBmcm9tICcuL3Byb2plY3RDb25maWcnXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICAuLi5zeXN0ZW1Db25maWcsXG4gICAgYW5rYUNvbmZpZyxcbiAgICBwcm9qZWN0Q29uZmlnXG59XG4iLCJpbXBvcnQgQ29tcGlsZXIgZnJvbSAnLi9Db21waWxlcidcbmltcG9ydCBjb25maWcgZnJvbSAnLi4vLi4vY29uZmlnJ1xuaW1wb3J0IENvbXBpbGF0aW9uIGZyb20gJy4vQ29tcGlsYXRpb24nXG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBJbmplY3Rpb24ge1xuICAgIGNvbXBpbGVyOiBDb21waWxlclxuICAgIG9wdGlvbnM6IG9iamVjdFxuXG4gICAgY29uc3RydWN0b3IgKGNvbXBpbGVyOiBDb21waWxlciwgb3B0aW9ucz86IG9iamVjdCkge1xuICAgICAgICB0aGlzLmNvbXBpbGVyID0gY29tcGlsZXJcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9uc1xuICAgIH1cblxuICAgIGFic3RyYWN0IGdldE9wdGlvbnMgKCk6IG9iamVjdFxuXG4gICAgZ2V0Q29tcGlsZXIgKCk6IENvbXBpbGVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcGlsZXJcbiAgICB9XG5cbiAgICBnZXRBbmthQ29uZmlnICgpOiBBbmthQ29uZmlnIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5hbmthQ29uZmlnXG4gICAgfVxuXG4gICAgZ2V0U3lzdGVtQ29uZmlnICgpOiBDb21waWxlckNvbmZpZyB7XG4gICAgICAgIHJldHVybiBjb25maWdcbiAgICB9XG5cbiAgICBnZXRQcm9qZWN0Q29uZmlnICgpOiBQcm9qZWN0Q29uZmlnIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5wcm9qZWN0Q29uZmlnXG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgUGx1Z2luSW5qZWN0aW9uIGV4dGVuZHMgSW5qZWN0aW9uIHtcblxuICAgIGNvbnN0cnVjdG9yIChjb21waWxlcjogQ29tcGlsZXIsIG9wdGlvbnM6IFBsdWdpbk9wdGlvbnNbJ29wdGlvbnMnXSkge1xuICAgICAgICBzdXBlcihjb21waWxlciwgb3B0aW9ucylcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gUGx1Z2luIG9wdGlvbnNcbiAgICAgKi9cbiAgICBnZXRPcHRpb25zICgpOiBvYmplY3Qge1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zIHx8IHt9XG4gICAgfVxuXG4gICAgb24gKGV2ZW50OiBzdHJpbmcsIGhhbmRsZXI6IFBsdWdpbkhhbmRsZXIpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jb21waWxlci5vbihldmVudCwgaGFuZGxlcilcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBQYXJzZXJJbmplY3Rpb24gZXh0ZW5kcyBJbmplY3Rpb24ge1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIFBhcnNlck9wdGlvbnNcbiAgICAgKi9cbiAgICBnZXRPcHRpb25zICgpOiBvYmplY3Qge1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zIHx8IHt9XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IgKGNvbXBpbGVyOiBDb21waWxlciwgb3B0aW9uczogUGFyc2VyT3B0aW9uc1snb3B0aW9ucyddKSB7XG4gICAgICAgIHN1cGVyKGNvbXBpbGVyLCBvcHRpb25zKVxuICAgIH1cbn1cbiIsImltcG9ydCB7XG4gICAgUGFyc2VySW5qZWN0aW9uXG59IGZyb20gJy4vSW5qZWN0aW9uJ1xuaW1wb3J0IEZpbGUgZnJvbSAnLi9GaWxlJ1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuLi8uLi9jb25maWcnXG5pbXBvcnQgQ29tcGlsZXIgZnJvbSAnLi9Db21waWxlcidcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uLy4uL3V0aWxzJ1xuXG4vKipcbiAqIEEgY29tcGlsYXRpb24gdGFza1xuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb21waWxhdGlvbiB7XG4gICAgY29uZmlnOiBvYmplY3RcbiAgICByZWFkb25seSBjb21waWxlcjogQ29tcGlsZXJcbiAgICBpZDogbnVtYmVyICAgICAgICAvLyBVbmlxdWXvvIxmb3IgZWFjaCBDb21waWxhdGlvblxuICAgIGZpbGU6IEZpbGVcbiAgICBzb3VyY2VGaWxlOiBzdHJpbmdcbiAgICBkZXN0cm95ZWQ6IGJvb2xlYW5cblxuICAgIGNvbnN0cnVjdG9yIChmaWxlOiBGaWxlIHwgc3RyaW5nLCBjb25mOiBvYmplY3QsIGNvbXBpbGVyOiBDb21waWxlcikge1xuICAgICAgICB0aGlzLmNvbXBpbGVyID0gY29tcGlsZXJcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25mXG4gICAgICAgIHRoaXMuaWQgPSBDb21waWxlci5jb21waWxhdGlvbklkKytcblxuICAgICAgICBpZiAoZmlsZSBpbnN0YW5jZW9mIEZpbGUpIHtcbiAgICAgICAgICAgIHRoaXMuZmlsZSA9IGZpbGVcbiAgICAgICAgICAgIHRoaXMuc291cmNlRmlsZSA9IGZpbGUuc291cmNlRmlsZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zb3VyY2VGaWxlID0gZmlsZVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5lbnJvbGwoKVxuICAgIH1cblxuICAgIGFzeW5jIHJ1biAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGF3YWl0IHRoaXMubG9hZEZpbGUoKVxuICAgICAgICBhd2FpdCB0aGlzLmludm9rZVBhcnNlcnMoKVxuICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGUoKVxuICAgIH1cblxuICAgIGFzeW5jIGxvYWRGaWxlICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKHRoaXMuZGVzdHJveWVkKSByZXR1cm5cblxuICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGVyLmVtaXQoJ2JlZm9yZS1sb2FkLWZpbGUnLCB0aGlzKVxuICAgICAgICBpZiAoISh0aGlzLmZpbGUgaW5zdGFuY2VvZiBGaWxlKSkge1xuICAgICAgICAgICAgdGhpcy5maWxlID0gYXdhaXQgdXRpbHMuY3JlYXRlRmlsZSh0aGlzLnNvdXJjZUZpbGUpXG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlci5lbWl0KCdhZnRlci1sb2FkLWZpbGUnLCB0aGlzKVxuICAgIH1cblxuICAgIGFzeW5jIGludm9rZVBhcnNlcnMgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBpZiAodGhpcy5kZXN0cm95ZWQpIHJldHVyblxuXG4gICAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLmZpbGVcbiAgICAgICAgY29uc3QgcGFyc2VycyA9IDxQYXJzZXJbXT50aGlzLmNvbXBpbGVyLnBhcnNlcnMuZmlsdGVyKChtYXRjaGVyczogTWF0Y2hlcikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoZXJzLm1hdGNoLnRlc3QoZmlsZS50YXJnZXRGaWxlKVxuICAgICAgICB9KS5tYXAoKG1hdGNoZXJzOiBNYXRjaGVyKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hlcnMucGFyc2Vyc1xuICAgICAgICB9KS5yZWR1Y2UoKHByZXYsIG5leHQpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBwcmV2LmNvbmNhdChuZXh0KVxuICAgICAgICB9LCBbXSlcbiAgICAgICAgY29uc3QgdGFza3MgPSBwYXJzZXJzLm1hcChwYXJzZXIgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHV0aWxzLmFzeW5jRnVuY3Rpb25XcmFwcGVyKHBhcnNlcilcbiAgICAgICAgfSlcblxuICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGVyLmVtaXQoJ2JlZm9yZS1wYXJzZScsIHRoaXMpXG5cbiAgICAgICAgYXdhaXQgdXRpbHMuY2FsbFByb21pc2VJbkNoYWluKHRhc2tzLCBmaWxlLCB0aGlzKVxuXG4gICAgICAgIGF3YWl0IHRoaXMuY29tcGlsZXIuZW1pdCgnYWZ0ZXItcGFyc2UnLCB0aGlzKVxuICAgIH1cblxuICAgIGFzeW5jIGNvbXBpbGUgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBpZiAodGhpcy5kZXN0cm95ZWQpIHJldHVyblxuXG4gICAgICAgIC8vIEludm9rZSBFeHRyYWN0RGVwZW5kZW5jeVBsdWdpbi5cbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlci5lbWl0KCdiZWZvcmUtY29tcGlsZScsIHRoaXMpXG4gICAgICAgIC8vIERvIHNvbWV0aGluZyBlbHNlLlxuICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGVyLmVtaXQoJ2FmdGVyLWNvbXBpbGUnLCB0aGlzKVxuICAgICAgICB1dGlscy5sb2dnZXIuaW5mbygnQ29tcGlsZScsICB0aGlzLmZpbGUuc291cmNlRmlsZS5yZXBsYWNlKGNvbmZpZy5jd2QsICcnKSlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBvbiBDb21waWxlciBhbmQgZGVzdHJveSB0aGUgcHJldmlvdXMgb25lIGlmIGNvbmZsaWN0IGFyaXNlcy5cbiAgICAgKi9cbiAgICBlbnJvbGwgKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBvbGRDb21waWxhdGlvbiA9IENvbXBpbGVyLmNvbXBpbGF0aW9uUG9vbC5nZXQodGhpcy5zb3VyY2VGaWxlKVxuXG4gICAgICAgIGlmIChvbGRDb21waWxhdGlvbikge1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5hbmthQ29uZmlnLmRlYnVnKSBjb25zb2xlLmxvZygnXGJEZXN0cm95IENvbXBpbGF0aW9uJywgb2xkQ29tcGlsYXRpb24uaWQsIG9sZENvbXBpbGF0aW9uLnNvdXJjZUZpbGUpXG5cbiAgICAgICAgICAgIG9sZENvbXBpbGF0aW9uLmRlc3Ryb3koKVxuICAgICAgICB9XG4gICAgICAgIENvbXBpbGVyLmNvbXBpbGF0aW9uUG9vbC5zZXQodGhpcy5zb3VyY2VGaWxlLCB0aGlzKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVucmVnaXN0ZXIgdGhlbXNlbHZlcyBmcm9tIENvbXBpbGVyLlxuICAgICAqL1xuICAgIGRlc3Ryb3kgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmRlc3Ryb3llZCA9IHRydWVcbiAgICAgICAgQ29tcGlsZXIuY29tcGlsYXRpb25Qb29sLmRlbGV0ZSh0aGlzLnNvdXJjZUZpbGUpXG4gICAgfVxufVxuIiwiaW1wb3J0IHtcbiAgICBQYXJzZXJJbmplY3Rpb24sXG4gICAgUGx1Z2luSW5qZWN0aW9uXG59IGZyb20gJy4vSW5qZWN0aW9uJ1xuaW1wb3J0IEZpbGUgZnJvbSAnLi9GaWxlJ1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnXG5pbXBvcnQgY29uZmlnIGZyb20gJy4uLy4uL2NvbmZpZydcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uLy4uL3V0aWxzJ1xuaW1wb3J0IENvbXBpbGF0aW9uIGZyb20gJy4vQ29tcGlsYXRpb24nXG5pbXBvcnQgY2FsbFByb21pc2VJbkNoYWluIGZyb20gJy4uLy4uL3V0aWxzL2NhbGxQcm9taXNlSW5DaGFpbidcbmltcG9ydCBhc3luY0Z1bmN0aW9uV3JhcHBlciBmcm9tICcuLi8uLi91dGlscy9hc3luY0Z1bmN0aW9uV3JhcHBlcidcblxuY29uc3QgeyBsb2dnZXIgfSA9IHV0aWxzXG5cbi8qKlxuICogVGhlIGNvcmUgY29tcGlsZXIuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbXBpbGVyIHtcbiAgICByZWFkb25seSBjb25maWc6IENvbXBpbGVyQ29uZmlnXG4gICAgcHVibGljIHN0YXRpYyBjb21waWxhdGlvbklkID0gMVxuICAgIHB1YmxpYyBzdGF0aWMgY29tcGlsYXRpb25Qb29sID0gbmV3IE1hcDxzdHJpbmcsIENvbXBpbGF0aW9uPigpXG4gICAgcGx1Z2luczoge1xuICAgICAgICBbZXZlbnROYW1lOiBzdHJpbmddOiBBcnJheTxQbHVnaW5IYW5kbGVyPlxuICAgIH0gPSB7XG4gICAgICAgICdiZWZvcmUtbG9hZC1maWxlJzogW10sXG4gICAgICAgICdhZnRlci1sb2FkLWZpbGUnOiBbXSxcbiAgICAgICAgJ2JlZm9yZS1wYXJzZSc6IFtdLFxuICAgICAgICAnYWZ0ZXItcGFyc2UnOiBbXSxcbiAgICAgICAgJ2JlZm9yZS1jb21waWxlJzogW10sXG4gICAgICAgICdhZnRlci1jb21waWxlJzogW11cbiAgICB9XG4gICAgcGFyc2VyczogQXJyYXk8e1xuICAgICAgICBtYXRjaDogUmVnRXhwLFxuICAgICAgICBwYXJzZXJzOiBBcnJheTxQYXJzZXI+XG4gICAgfT4gPSBbXVxuXG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZ1xuICAgICAgICB0aGlzLmluaXRQYXJzZXJzKClcbiAgICAgICAgdGhpcy5pbml0UGx1Z2lucygpXG5cbiAgICAgICAgaWYgKGNvbmZpZy5hbmthQ29uZmlnLmRlYnVnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh0aGlzLmNvbmZpZywgKGtleSwgdmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBGdW5jdGlvbikgcmV0dXJuICdbRnVuY3Rpb25dJ1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZVxuICAgICAgICAgICAgfSwgNCkpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBQbHVnaW4uXG4gICAgICogQHBhcmFtIGV2ZW50XG4gICAgICogQHBhcmFtIGhhbmRsZXJcbiAgICAgKi9cbiAgICBvbiAoZXZlbnQ6IHN0cmluZywgaGFuZGxlcjogUGx1Z2luSGFuZGxlcik6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5wbHVnaW5zW2V2ZW50XSA9PT0gdm9pZCAoMCkpIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBob29rOiAke2V2ZW50fWApXG4gICAgICAgIHRoaXMucGx1Z2luc1tldmVudF0ucHVzaChoYW5kbGVyKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEludm9rZSBsaWZlY3ljbGUgaG9va3MoUHJvbWlzZSBjaGFpbmluZykuXG4gICAgICogQHBhcmFtIGV2ZW50XG4gICAgICogQHBhcmFtIGNvbXBpbGF0aW9uXG4gICAgICovXG4gICAgYXN5bmMgZW1pdCAoZXZlbnQ6IHN0cmluZywgY29tcGlsYXRpb246IENvbXBpbGF0aW9uKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgY29uc3QgcGx1Z2lucyA9IHRoaXMucGx1Z2luc1tldmVudF1cblxuICAgICAgICBpZiAoIXBsdWdpbnMgfHwgIXBsdWdpbnMubGVuZ3RoKSByZXR1cm5cblxuICAgICAgICBjb25zdCB0YXNrcyA9IHBsdWdpbnMubWFwKHBsdWdpbiA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYXN5bmNGdW5jdGlvbldyYXBwZXIocGx1Z2luKVxuICAgICAgICB9KVxuXG4gICAgICAgIGF3YWl0IGNhbGxQcm9taXNlSW5DaGFpbih0YXNrcywgY29tcGlsYXRpb24pXG4gICAgfVxuXG4gICAgYXN5bmMgbGF1bmNoICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBmaWxlUGF0aHM6IHN0cmluZ1tdID0gYXdhaXQgdXRpbHMuc2VhcmNoRmlsZXMoYCR7Y29uZmlnLnNyY0Rpcn0vKiovKmAsIHtcbiAgICAgICAgICAgIG5vZGlyOiB0cnVlLFxuICAgICAgICAgICAgc2lsZW50OiBmYWxzZSxcbiAgICAgICAgICAgIGFic29sdXRlOiB0cnVlXG4gICAgICAgIH0pXG4gICAgICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgUHJvbWlzZS5hbGwoZmlsZVBhdGhzLm1hcChmaWxlID0+IHtcbiAgICAgICAgICAgIHJldHVybiB1dGlscy5jcmVhdGVGaWxlKGZpbGUpXG4gICAgICAgIH0pKVxuICAgICAgICBjb25zdCBjb21waWxhdGlvbnMgPSBmaWxlcy5tYXAoZmlsZSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IENvbXBpbGF0aW9uKGZpbGUsIHRoaXMuY29uZmlnLCB0aGlzKVxuICAgICAgICB9KVxuXG4gICAgICAgIGZzLmVuc3VyZURpclN5bmMoY29uZmlnLmRpc3ROb2RlTW9kdWxlcylcblxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChjb21waWxhdGlvbnMubWFwKGNvbXBpbGF0aW9uID0+IGNvbXBpbGF0aW9uLmxvYWRGaWxlKCkpKVxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChjb21waWxhdGlvbnMubWFwKGNvbXBpbGF0aW9uID0+IGNvbXBpbGF0aW9uLmludm9rZVBhcnNlcnMoKSkpXG5cbiAgICAgICAgLy8gVE9ETzogR2V0IGFsbCBmaWxlc1xuICAgICAgICAvLyBDb21waWxlci5jb21waWxhdGlvblBvb2wudmFsdWVzKClcblxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChjb21waWxhdGlvbnMubWFwKGNvbXBpbGF0aW9ucyA9PiBjb21waWxhdGlvbnMuY29tcGlsZSgpKSlcbiAgICB9XG5cbiAgICB3YXRjaEZpbGVzICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICBjb25zdCB3YXRjaGVyID0gdXRpbHMuZ2VuRmlsZVdhdGNoZXIoYCR7Y29uZmlnLnNyY0Rpcn0vKiovKmAsIHtcbiAgICAgICAgICAgICAgICBmb2xsb3dTeW1saW5rczogZmFsc2VcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIHdhdGNoZXIub24oJ2FkZCcsIGFzeW5jIChmaWxlTmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZSA9IGF3YWl0IHV0aWxzLmNyZWF0ZUZpbGUoZmlsZU5hbWUpXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5nZW5lcmF0ZUNvbXBpbGF0aW9uKGZpbGUpLnJ1bigpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgd2F0Y2hlci5vbigndW5saW5rJywgYXN5bmMgKGZpbGVOYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBmcy51bmxpbmsoZmlsZU5hbWUucmVwbGFjZShjb25maWcuc3JjRGlyLCBjb25maWcuZGlzdERpcikpXG4gICAgICAgICAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoJ1JlbW92ZScsIGZpbGVOYW1lKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIHdhdGNoZXIub24oJ2NoYW5nZScsIGFzeW5jIChmaWxlTmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZSA9IGF3YWl0IHV0aWxzLmNyZWF0ZUZpbGUoZmlsZU5hbWUpXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5nZW5lcmF0ZUNvbXBpbGF0aW9uKGZpbGUpLnJ1bigpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgd2F0Y2hlci5vbigncmVhZHknLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGdlbmVyYXRlQ29tcGlsYXRpb24gKGZpbGU6IEZpbGUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb21waWxhdGlvbihmaWxlLCB0aGlzLmNvbmZpZywgdGhpcylcbiAgICB9XG5cbiAgICBpbml0UGFyc2VycyAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY29uZmlnLmFua2FDb25maWcucGFyc2Vycy5mb3JFYWNoKCh7IG1hdGNoLCBwYXJzZXJzIH0pID0+IHtcbiAgICAgICAgICAgIHRoaXMucGFyc2Vycy5wdXNoKHtcbiAgICAgICAgICAgICAgICBtYXRjaCxcbiAgICAgICAgICAgICAgICBwYXJzZXJzOiBwYXJzZXJzLm1hcCgoeyBwYXJzZXIsIG9wdGlvbnMgfSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VyLmJpbmQodGhpcy5nZW5lcmF0ZVBhcnNlckluamVjdGlvbihvcHRpb25zKSlcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBpbml0UGx1Z2lucyAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY29uZmlnLmFua2FDb25maWcucGx1Z2lucy5mb3JFYWNoKCh7IHBsdWdpbiwgb3B0aW9ucyB9KSA9PiB7XG4gICAgICAgICAgICBwbHVnaW4uY2FsbCh0aGlzLmdlbmVyYXRlUGx1Z2luSW5qZWN0aW9uKG9wdGlvbnMpKVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGdlbmVyYXRlUGx1Z2luSW5qZWN0aW9uIChvcHRpb25zOiBQbHVnaW5PcHRpb25zWydvcHRpb25zJ10pOiBQbHVnaW5JbmplY3Rpb24ge1xuICAgICAgICByZXR1cm4gbmV3IFBsdWdpbkluamVjdGlvbih0aGlzLCBvcHRpb25zKVxuICAgIH1cblxuICAgIGdlbmVyYXRlUGFyc2VySW5qZWN0aW9uIChvcHRpb25zOiBQYXJzZXJPcHRpb25zWydvcHRpb25zJ10pOiBQYXJzZXJJbmplY3Rpb24ge1xuICAgICAgICByZXR1cm4gbmV3IFBhcnNlckluamVjdGlvbih0aGlzLCBvcHRpb25zKVxuICAgIH1cbn1cbiIsImltcG9ydCBDb21waWxlciBmcm9tICcuL0NvbXBpbGVyJ1xuXG5leHBvcnQgZGVmYXVsdCBhYnN0cmFjdCBjbGFzcyBDb21tYW5kIHtcbiAgICBwdWJsaWMgY29tbWFuZDogc3RyaW5nXG4gICAgcHVibGljIG9wdGlvbnM6IEFycmF5PHVua25vd24+XG4gICAgcHVibGljIGFsaWFzOiBzdHJpbmdcbiAgICBwdWJsaWMgdXNhZ2U6IHN0cmluZ1xuICAgIHB1YmxpYyBkZXNjcmlwdGlvbjogc3RyaW5nXG4gICAgcHVibGljIGV4YW1wbGVzOiBBcnJheTxzdHJpbmc+XG4gICAgcHVibGljICRjb21waWxlcjogQ29tcGlsZXJcbiAgICBwdWJsaWMgb246IHtcbiAgICAgICAgW2tleTogc3RyaW5nXTogKC4uLmFyZzogYW55W10pID0+IHZvaWRcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvciAoY29tbWFuZDogc3RyaW5nLCBkZXNjPzogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuY29tbWFuZCA9IGNvbW1hbmRcbiAgICAgICAgdGhpcy5vcHRpb25zID0gW11cbiAgICAgICAgdGhpcy5hbGlhcyA9ICcnXG4gICAgICAgIHRoaXMudXNhZ2UgPSAnJ1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gZGVzY1xuICAgICAgICB0aGlzLmV4YW1wbGVzID0gW11cbiAgICAgICAgdGhpcy5vbiA9IHt9XG4gICAgfVxuXG4gICAgYWJzdHJhY3QgYWN0aW9uIChwYXJhbTogc3RyaW5nIHwgQXJyYXk8c3RyaW5nPiwgb3B0aW9uczogT2JqZWN0LCAuLi5vdGhlcjogYW55W10pOiBQcm9taXNlPGFueT4gfCB2b2lkXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplIGFua2EgY29yZSBjb21waWxlclxuICAgICAqL1xuICAgIHByb3RlY3RlZCBpbml0Q29tcGlsZXIgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLiRjb21waWxlciA9IG5ldyBDb21waWxlcigpXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHNldFVzYWdlICh1c2FnZTogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIHRoaXMudXNhZ2UgPSB1c2FnZVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBzZXRPcHRpb25zICguLi5vcHRpb25zOiBBcnJheTxzdHJpbmc+KTogdm9pZCB7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IHRoaXMub3B0aW9ucy5jb25jYXQob3B0aW9ucylcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgc2V0RXhhbXBsZXMgKC4uLmV4YW1wbGU6IEFycmF5PHN0cmluZz4pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5leGFtcGxlcyA9IHRoaXMuZXhhbXBsZXMuY29uY2F0KGV4YW1wbGUpXG4gICAgfVxuXG4gICAgcHVibGljIHByaW50VGl0bGUgKC4uLmFyZzogQXJyYXk8YW55Pikge1xuICAgICAgICBjb25zb2xlLmxvZygnXFxyXFxuICcsIC4uLmFyZywgJ1xcclxcbicpXG4gICAgfVxuXG4gICAgcHVibGljIHByaW50Q29udGVudCAoLi4uYXJnOiBBcnJheTxhbnk+KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCcgICAnLCAuLi5hcmcpXG4gICAgfVxufVxuIiwiaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi4vdXRpbHMnXG5pbXBvcnQgeyBDb21tYW5kLCBDb21waWxlciB9IGZyb20gJy4uL2NvcmUnXG5cbmV4cG9ydCB0eXBlIERldkNvbW1hbmRPcHRzID0gT2JqZWN0ICYge31cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGV2Q29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgc3VwZXIoXG4gICAgICAgICAgICAnZGV2IFtwYWdlcy4uLl0nLFxuICAgICAgICAgICAgJ0RldmVsb3BtZW50IE1vZGUnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldEV4YW1wbGVzKFxuICAgICAgICAgICAgJyQgYW5rYSBkZXYnLFxuICAgICAgICAgICAgJyQgYW5rYSBkZXYgaW5kZXgnLFxuICAgICAgICAgICAgJyQgYW5rYSBkZXYgL3BhZ2VzL2xvZy9sb2cgL3BhZ2VzL3VzZXIvdXNlcidcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuJGNvbXBpbGVyID0gbmV3IENvbXBpbGVyKClcbiAgICB9XG5cbiAgICBhc3luYyBhY3Rpb24gKHBhZ2VzPzogQXJyYXk8c3RyaW5nPiwgb3B0aW9ucz86IERldkNvbW1hbmRPcHRzKSB7XG4gICAgICAgIGNvbnN0IHN0YXJ0dXBUaW1lID0gRGF0ZS5ub3coKVxuICAgICAgICB0aGlzLmluaXRDb21waWxlcigpXG4gICAgICAgIGF3YWl0IHRoaXMuJGNvbXBpbGVyLmxhdW5jaCgpXG4gICAgICAgIGF3YWl0IHRoaXMuJGNvbXBpbGVyLndhdGNoRmlsZXMoKVxuICAgICAgICBsb2dnZXIuc3VjY2VzcyhgU3RhcnR1cDogJHtEYXRlLm5vdygpIC0gc3RhcnR1cFRpbWV9bXNgLCBgQW5rYSBpcyB3YWl0aW5nIGZvciBjaGFuZ2VzLi4uYClcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBDb21tYW5kLCBDb21waWxlciB9IGZyb20gJy4uL2NvcmUnXG5cbmV4cG9ydCB0eXBlIERldkNvbW1hbmRPcHRzID0gT2JqZWN0ICYge31cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGV2Q29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgc3VwZXIoXG4gICAgICAgICAgICAncHJvZCcsXG4gICAgICAgICAgICAnUHJvZHVjdGlvbiBNb2RlJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRFeGFtcGxlcyhcbiAgICAgICAgICAgICckIGFua2EgcHJvZCdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuJGNvbXBpbGVyID0gbmV3IENvbXBpbGVyKClcbiAgICB9XG5cbiAgICBhc3luYyBhY3Rpb24gKHBhZ2VzPzogQXJyYXk8c3RyaW5nPiwgb3B0aW9ucz86IERldkNvbW1hbmRPcHRzKSB7XG4gICAgICAgIHRoaXMuaW5pdENvbXBpbGVyKClcbiAgICAgICAgYXdhaXQgdGhpcy4kY29tcGlsZXIubGF1bmNoKClcbiAgICB9XG59XG4iLCJpbXBvcnQgRGV2IGZyb20gJy4vY29tbWFuZHMvZGV2J1xuaW1wb3J0IFByb2QgZnJvbSAnLi9jb21tYW5kcy9wcm9kJ1xuXG5leHBvcnQgZGVmYXVsdCBbXG4gICAgbmV3IFByb2QoKSxcbiAgICBuZXcgRGV2KClcbl1cbiIsImltcG9ydCBjb25maWcgZnJvbSAnLi9jb25maWcnXG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tICcuL3V0aWxzJ1xuaW1wb3J0ICogYXMgY2ZvbnRzIGZyb20gJ2Nmb250cydcbmltcG9ydCBjb21tYW5kcyBmcm9tICcuL2NvbW1hbmRzJ1xuaW1wb3J0ICogYXMgY29tbWFuZGVyIGZyb20gJ2NvbW1hbmRlcidcbmltcG9ydCBDb21waWxlciBmcm9tICcuL2NvcmUvY2xhc3MvQ29tcGlsZXInXG5cbmNvbnN0IHBrZ0pzb24gPSByZXF1aXJlKCcuLi9wYWNrYWdlLmpzb24nKVxuXG5yZXF1aXJlKCdzb3VyY2UtbWFwLXN1cHBvcnQnKS5pbnN0YWxsKClcblxuaWYgKHByb2Nlc3MuYXJndi5pbmRleE9mKCctLWRlYnVnJykgPiAtMSkge1xuICAgIGNvbmZpZy5hbmthQ29uZmlnLmRlYnVnID0gdHJ1ZVxufVxuXG5sb2dnZXIuaW5mbygnTGF1bmNoaW5nLi4uJylcblxuY29tbWFuZGVyXG4gICAgLm9wdGlvbignLS1kZWJ1ZycsICdlbmFibGUgZGVidWcgbW9kZScpXG4gICAgLnZlcnNpb24ocGtnSnNvbi52ZXJzaW9uKVxuICAgIC51c2FnZSgnPGNvbW1hbmQ+IFtvcHRpb25zXScpXG5cbmNvbW1hbmRzLmZvckVhY2goY29tbWFuZCA9PiB7XG4gICAgY29uc3QgY21kID0gY29tbWFuZGVyLmNvbW1hbmQoY29tbWFuZC5jb21tYW5kKVxuXG4gICAgaWYgKGNvbW1hbmQuZGVzY3JpcHRpb24pIHtcbiAgICAgICAgY21kLmRlc2NyaXB0aW9uKGNvbW1hbmQuZGVzY3JpcHRpb24pXG4gICAgfVxuXG4gICAgaWYgKGNvbW1hbmQudXNhZ2UpIHtcbiAgICAgICAgY21kLnVzYWdlKGNvbW1hbmQudXNhZ2UpXG4gICAgfVxuXG4gICAgaWYgKGNvbW1hbmQub24pIHtcbiAgICAgICAgZm9yIChsZXQga2V5IGluIGNvbW1hbmQub24pIHtcbiAgICAgICAgICAgIGNtZC5vbihrZXksIGNvbW1hbmQub25ba2V5XSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjb21tYW5kLm9wdGlvbnMpIHtcbiAgICAgICAgY29tbWFuZC5vcHRpb25zLmZvckVhY2goKG9wdGlvbjogW2FueSwgYW55LCBhbnksIGFueV0pID0+IHtcbiAgICAgICAgICAgIGNtZC5vcHRpb24oLi4ub3B0aW9uKVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGlmIChjb21tYW5kLmFjdGlvbikge1xuICAgICAgICBjbWQuYWN0aW9uKGFzeW5jICguLi5hcmdzKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IGNvbW1hbmQuYWN0aW9uKC4uLmFyZ3MpXG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoZXJyLm1lc3NhZ2UgfHwgJycpXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGlmIChjb21tYW5kLmV4YW1wbGVzKSB7XG4gICAgICAgIGNtZC5vbignLS1oZWxwJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY29tbWFuZC5wcmludFRpdGxlKCdFeGFtcGxlczonKVxuICAgICAgICAgICAgY29tbWFuZC5leGFtcGxlcy5mb3JFYWNoKGV4YW1wbGUgPT4ge1xuICAgICAgICAgICAgICAgIGNvbW1hbmQucHJpbnRDb250ZW50KGV4YW1wbGUpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgIH1cbn0pXG5cbmlmIChwcm9jZXNzLmFyZ3YubGVuZ3RoID09PSAyKSB7XG4gICAgY2ZvbnRzLnNheSgnQW5rYScsIHtcbiAgICAgICAgZm9udDogJ3NpbXBsZScsXG4gICAgICAgIGNvbG9yczogWydncmVlbkJyaWdodCddXG4gICAgfSlcbiAgICBjb25zb2xlLmxvZygnICBWZXJzaW9uOiAnICsgcGtnSnNvbi52ZXJzaW9uKVxuICAgIGNvbW1hbmRlci5vdXRwdXRIZWxwKClcbn1cblxuY29tbWFuZGVyLnBhcnNlKHByb2Nlc3MuYXJndilcblxuZXhwb3J0IGRlZmF1bHQgQ29tcGlsZXJcbiJdLCJuYW1lcyI6WyJwb3N0Y3NzIiwidHNsaWJfMS5fX2Fzc2lnbiIsImZzLnJlYWRGaWxlIiwiZnMud3JpdGVGaWxlIiwicGF0aC5kaXJuYW1lIiwicGF0aC5iYXNlbmFtZSIsInBhdGguZXh0bmFtZSIsInBhdGgiLCJmcy5lbnN1cmVGaWxlIiwiZnMucmVhZEZpbGVTeW5jIiwibG9nIiwicGF0aC5qb2luIiwiZnMuZXhpc3RzU3luYyIsImNob2tpZGFyLndhdGNoIiwid3JpdGVGaWxlIiwiYWNvcm4ucGFyc2UiLCJhY29ybldhbGtlci5zaW1wbGUiLCJlc2NvZGVnZW4uZ2VuZXJhdGUiLCJ1dGlscy5pc05wbURlcGVuZGVuY3kiLCJ1dGlscy5yZXNvbHZlTW9kdWxlIiwicGF0aC5yZWxhdGl2ZSIsInV0aWxzLmNyZWF0ZUZpbGVTeW5jIiwidXRpbHMubG9nZ2VyIiwiY3dkIiwicGF0aC5yZXNvbHZlIiwic3lzdGVtLnNyY0RpciIsInRzbGliXzEuX19leHRlbmRzIiwidXRpbHMuY3JlYXRlRmlsZSIsInV0aWxzLmFzeW5jRnVuY3Rpb25XcmFwcGVyIiwidXRpbHMuY2FsbFByb21pc2VJbkNoYWluIiwibG9nZ2VyIiwidXRpbHMuc2VhcmNoRmlsZXMiLCJmcy5lbnN1cmVEaXJTeW5jIiwidXRpbHMuZ2VuRmlsZVdhdGNoZXIiLCJmcy51bmxpbmsiLCJQcm9kIiwiRGV2IiwiY29tbWFuZGVyXG4gICAgLm9wdGlvbiIsImNvbW1hbmRlci5jb21tYW5kIiwiY2ZvbnRzLnNheSIsImNvbW1hbmRlci5vdXRwdXRIZWxwIiwiY29tbWFuZGVyLnBhcnNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFRQSxvQkFBdUIsVUFBaUMsSUFBVSxFQUFFLFdBQXdCLEVBQUUsRUFBWTtJQUd0RyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBQ3JCLEVBQUUsRUFBRSxDQUFBO0NBQ1AsRUFBQTs7O0FDYkQsSUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFBO0FBRWxDLHNCQUFlLE9BQU8sQ0FBQyxNQUFNLENBQUMsa0JB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
