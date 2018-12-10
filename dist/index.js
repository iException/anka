#!/usr/bin/env node
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = require('fs');
var path = require('path');
var sass = require('node-sass');
var chalk = _interopDefault(require('chalk'));
var tslib_1 = require('tslib');
var postcssrc = _interopDefault(require('postcss-load-config'));
var babel = require('@babel/core');
var fs$1 = require('fs-extra');
var postcss = require('postcss');
var ts = require('typescript');
var traverse = _interopDefault(require('@babel/traverse'));
var codeGenerator = _interopDefault(require('@babel/generator'));
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
        data: file.content
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

var postcss$1 = require('postcss');
var postcssConfig = {};
var internalPlugins = [];
var tasks = [];
var styleParser = (function (file, compilation, cb) {
    if (postcssConfig.plugins) {
        exec(postcssConfig, file, cb);
    }
    else {
        tasks.push(function () {
            exec(postcssConfig, file, cb);
        });
    }
});
genPostcssConfig().then(function (config) {
    tasks.forEach(function (task) { return task(); });
}).catch(function (err) {
    logger.error('loadConfig', err.message, err);
});
function exec(config, file, cb) {
    file.convertContentToString();
    postcss$1(config.plugins.concat(internalPlugins)).process(file.content, tslib_1.__assign({}, config.options, { from: file.sourceFile })).then(function (root) {
        file.content = root.css;
        file.ast = root.root.toResult();
        file.updateExt('.wxss');
        cb();
    });
}
function genPostcssConfig(tasks) {
    if (tasks === void 0) { tasks = []; }
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

var minifyJSON = require('jsonminify');
var inlineSourceMapComment = require('inline-source-map-comment');
var saveFilePlugin = (function () {
    var utils = this.getUtils();
    var config = this.getSystemConfig();
    var logger = utils.logger, writeFile = utils.writeFile;
    this.on('save', function (compilation, cb) {
        var file = compilation.file;
        fs$1.ensureFile(file.targetFile).then(function () {
            if (config.ankaConfig.devMode && file.sourceMap) {
                file.convertContentToString();
                file.content = file.content + '\r\n\r\n' + inlineSourceMapComment(file.sourceMap, {
                    block: true,
                    sourcesContent: true
                });
            }
            if (!config.ankaConfig.devMode) {
                switch (file.extname) {
                    case '.json':
                        file.convertContentToString();
                        file.content = minifyJSON(file.content);
                        break;
                }
            }
            return writeFile(file.targetFile, file.content);
        }).then(function () {
            cb();
        }).catch(function (err) {
            logger.error('Error', err.message, err);
            cb();
        });
    });
});

var postcssWxImport = postcss.plugin('postcss-wximport', function () {
    return function (root) {
        var imports = [];
        root.walkAtRules('wximport', function (rule) {
            imports.push(rule.params.replace(/\.\w+(?=['"]$)/, '.wxss'));
            rule.remove();
        });
        root.prepend.apply(root, imports.map(function (item) {
            return {
                name: 'import',
                params: item
            };
        }));
        imports.length = 0;
    };
});

var postcss$2 = require('postcss');
var cssnano = require('postcss-normalize-whitespace');
var internalPlugins$1 = [postcssWxImport];
var wxImportPlugin = (function () {
    var utils = this.getUtils();
    var logger = utils.logger;
    var config = this.getSystemConfig();
    var testSrcDir = new RegExp("^" + config.srcDir);
    this.on('before-compile', function (compilation, cb) {
        var file = compilation.file;
        if (!config.ankaConfig.devMode) {
            internalPlugins$1.push(cssnano);
        }
        var handler = postcss$2(internalPlugins$1);
        if (file.extname === '.wxss' && testSrcDir.test(file.sourceFile)) {
            handler.process((file.ast || file.content), {
                from: file.sourceFile
            }).then(function (root) {
                file.content = root.css;
                file.ast = root.root.toResult();
                cb();
            }, function (err) {
                logger.error('Error', err.message, err);
                cb();
            });
        }
        else {
            cb();
        }
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
        var devMode = config.ankaConfig.devMode;
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
            file.content = codeGenerator(file.ast, {
                compact: !devMode,
                minified: !devMode
            }).code;
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
        plugin: wxImportPlugin,
        options: {}
    },
    {
        plugin: saveFilePlugin,
        options: {}
    }
];
var ignored = [];

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
    plugins: plugins,
    ignored: ignored
});

var cwd$1 = process.cwd();
var customConfig = resolveConfig(['anka.config.js', 'anka.config.json']);
function mergeArray() {
    var arrs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        arrs[_i] = arguments[_i];
    }
    return arrs.filter(function (arr) { return arr && arr.length; }).reduce(function (prev, next) {
        return prev.concat(next);
    }, []);
}
var ankaConfig = tslib_1.__assign({}, ankaDefaultConfig, customConfig, { template: customConfig.template ? {
        page: path.join(cwd$1, customConfig.template.page),
        component: path.join(cwd$1, customConfig.template.component)
    } : template, parsers: mergeArray(customConfig.parsers, parsers), plugins: mergeArray(customConfig.plugins, plugins), ignored: mergeArray(customConfig.ignored, ignored) });

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
    File.prototype.convertContentToString = function () {
        if (this.content instanceof Buffer) {
            this.content = this.content.toString();
        }
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
            var e_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4, this.loadFile()];
                    case 1:
                        _a.sent();
                        return [4, this.invokeParsers()];
                    case 2:
                        _a.sent();
                        return [4, this.compile()];
                    case 3:
                        _a.sent();
                        return [3, 5];
                    case 4:
                        e_1 = _a.sent();
                        logger.error('Compile', e_1.message, e_1);
                        return [3, 5];
                    case 5: return [2];
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
                        return [4, this.compiler.emit('save', this)];
                    case 3:
                        _a.sent();
                        !this.config.ankaConfig.quiet && logger.info('Compile', this.file.sourceFile.replace(config.cwd + "/", ''));
                        this.destroy();
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
            'after-compile': [],
            'save': []
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
            var plugins, tasks, e_1;
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
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4, callPromiseInChain(tasks, compilation)];
                    case 2:
                        _a.sent();
                        return [3, 4];
                    case 3:
                        e_1 = _a.sent();
                        logger.error('Compile', e_1.message, e_1);
                        return [3, 4];
                    case 4: return [2];
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
                        return [4, searchFiles("**/*", {
                                cwd: config.srcDir,
                                nodir: true,
                                silent: false,
                                absolute: true,
                                ignore: config.ankaConfig.ignored
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
                followSymlinks: false,
                ignored: config.ankaConfig.ignored
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
        return _this;
    }
    DevCommand.prototype.action = function (pages, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var startupTime;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.$compiler.config.ankaConfig.devMode = true;
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
                        this.$compiler.config.ankaConfig.devMode = false;
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
                            pageName: pageName,
                            time: new Date().toLocaleString()
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
                            componentName: componentName,
                            time: new Date().toLocaleString()
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlscy9yZXNvbHZlQ29uZmlnLnRzIiwiLi4vc3JjL3BhcnNlcnMvc2Fzc1BhcnNlci50cyIsIi4uL3NyYy91dGlscy9sb2dnZXIudHMiLCIuLi9zcmMvcGFyc2Vycy9zdHlsZVBhcnNlci9pbmRleC50cyIsIi4uL3NyYy9wYXJzZXJzL2JhYmVsUGFyc2VyLnRzIiwiLi4vc3JjL3BsdWdpbnMvc2F2ZUZpbGVQbHVnaW4vaW5kZXgudHMiLCIuLi9zcmMvcGx1Z2lucy93eEltcG9ydFBsdWdpbi9wb3N0Y3NzV3hpbXBvcnQudHMiLCIuLi9zcmMvcGx1Z2lucy93eEltcG9ydFBsdWdpbi9pbmRleC50cyIsIi4uL3NyYy9wYXJzZXJzL3R5cGVzY3JpcHRQYXJzZXIudHMiLCIuLi9zcmMvcGx1Z2lucy9leHRyYWN0RGVwZW5kZW5jeVBsdWdpbi9pbmRleC50cyIsIi4uL3NyYy9jb25maWcvYW5rYURlZmF1bHRDb25maWcudHMiLCIuLi9zcmMvY29uZmlnL2Fua2FDb25maWcudHMiLCIuLi9zcmMvY29uZmlnL3N5c3RlbUNvbmZpZy50cyIsIi4uL3NyYy9jb25maWcvcHJvamVjdENvbmZpZy50cyIsIi4uL3NyYy9jb25maWcvaW5kZXgudHMiLCIuLi9zcmMvdXRpbHMvZnMudHMiLCIuLi9zcmMvY29yZS9jbGFzcy9GaWxlLnRzIiwiLi4vc3JjL3V0aWxzL2NyZWF0ZUZpbGUudHMiLCIuLi9zcmMvdXRpbHMvZWRpdG9yLnRzIiwiLi4vc3JjL3V0aWxzL3Jlc29sdmVNb2R1bGUudHMiLCIuLi9zcmMvdXRpbHMvY2FsbFByb21pc2VJbkNoYWluLnRzIiwiLi4vc3JjL3V0aWxzL2FzeW5jRnVuY3Rpb25XcmFwcGVyLnRzIiwiLi4vc3JjL3V0aWxzL2dlbkZpbGVXYXRjaGVyLnRzIiwiLi4vc3JjL3V0aWxzL2lzTnBtRGVwZW5kZW5jeS50cyIsIi4uL3NyYy91dGlscy9kb3dubG9hZFJlcGUudHMiLCIuLi9zcmMvY29yZS9jbGFzcy9JbmplY3Rpb24udHMiLCIuLi9zcmMvY29yZS9jbGFzcy9Db21waWxhdGlvbi50cyIsIi4uL3NyYy9jb3JlL2NsYXNzL0NvbXBpbGVyLnRzIiwiLi4vc3JjL2NvcmUvY2xhc3MvQ29tbWFuZC50cyIsIi4uL3NyYy9jb21tYW5kcy9kZXYudHMiLCIuLi9zcmMvY29tbWFuZHMvaW5pdC50cyIsIi4uL3NyYy9jb21tYW5kcy9wcm9kLnRzIiwiLi4vc3JjL2NvbW1hbmRzL2NyZWF0ZVBhZ2UudHMiLCIuLi9zcmMvY29tbWFuZHMvY3JlYXRlQ29tcG9uZW50LnRzIiwiLi4vc3JjL2NvbW1hbmRzL2Vucm9sbENvbXBvbmVudC50cyIsIi4uL3NyYy9jb21tYW5kcy50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcydcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcblxuY29uc3QgY3dkID0gcHJvY2Vzcy5jd2QoKVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAobmFtZXM6IEFycmF5PHN0cmluZz4gPSBbXSwgcm9vdD86IHN0cmluZyk6IE9iamVjdCB7XG4gICAgY29uc3QgZGVmYXVsdFZhbHVlID0ge31cbiAgICBjb25zdCBjb25maWdQYXRocyA9IG5hbWVzLm1hcChuYW1lID0+IHBhdGguam9pbihyb290IHx8IGN3ZCwgbmFtZSkpXG5cbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgY29uZmlnUGF0aHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZ1BhdGggPSBjb25maWdQYXRoc1tpbmRleF1cblxuICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhjb25maWdQYXRoKSkge1xuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihkZWZhdWx0VmFsdWUsIHJlcXVpcmUoY29uZmlnUGF0aCkpXG4gICAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlZmF1bHRWYWx1ZVxufVxuIiwiaW1wb3J0ICogYXMgc2FzcyBmcm9tICdub2RlLXNhc3MnXG5cbmltcG9ydCB7XG4gICAgRmlsZSxcbiAgICBQYXJzZXIsXG4gICAgQ29tcGlsYXRpb24sXG4gICAgUGFyc2VySW5qZWN0aW9uXG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG4vKipcbiAqIFNhc3MgZmlsZSBwYXJzZXIuXG4gKiBAZm9yIGFueSBmaWxlIHRoYXQgZG9lcyBub3QgbWF0Y2hlIHBhcnNlcnMuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IDxQYXJzZXI+ZnVuY3Rpb24gKHRoaXM6IFBhcnNlckluamVjdGlvbiwgZmlsZTogRmlsZSwgY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYWxsYmFjaz86IEZ1bmN0aW9uKSB7XG4gICAgY29uc3QgdXRpbHMgPSB0aGlzLmdldFV0aWxzKClcbiAgICBjb25zdCBjb25maWcgPSB0aGlzLmdldFN5c3RlbUNvbmZpZygpXG5cbiAgICBmaWxlLmNvbnRlbnQgPSBmaWxlLmNvbnRlbnQgaW5zdGFuY2VvZiBCdWZmZXIgPyBmaWxlLmNvbnRlbnQudG9TdHJpbmcoKSA6IGZpbGUuY29udGVudFxuXG4gICAgc2Fzcy5yZW5kZXIoe1xuICAgICAgICBmaWxlOiBmaWxlLnNvdXJjZUZpbGUsXG4gICAgICAgIGRhdGE6IGZpbGUuY29udGVudFxuICAgIH0sIChlcnI6IEVycm9yLCByZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICB1dGlscy5sb2dnZXIuZXJyb3IoJ0NvbXBpbGUnLCBlcnIubWVzc2FnZSwgZXJyKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZmlsZS5jb250ZW50ID0gcmVzdWx0LmNzc1xuICAgICAgICAgICAgZmlsZS51cGRhdGVFeHQoJy53eHNzJylcbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjaygpXG4gICAgfSlcbn1cbiIsImltcG9ydCBjaGFsayBmcm9tICdjaGFsaydcbmNvbnN0IG9yYSA9IHJlcXVpcmUoJ29yYScpXG5cbmV4cG9ydCBmdW5jdGlvbiB0b0ZpeCAobnVtYmVyOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIHJldHVybiAoJzAwJyArIG51bWJlcikuc2xpY2UoLTIpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50VGltZSAoKTogc3RyaW5nIHtcbiAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpXG4gICAgcmV0dXJuIGAke3RvRml4KG5vdy5nZXRIb3VycygpKX06JHt0b0ZpeChub3cuZ2V0TWludXRlcygpKX06JHt0b0ZpeChub3cuZ2V0U2Vjb25kcygpKX1gXG59XG5cbmV4cG9ydCBjbGFzcyBMb2dnZXIge1xuICAgIG9yYUluc3RhbmNlOiBhbnlcblxuICAgIGdldCB0aW1lICgpIHtcbiAgICAgICAgcmV0dXJuIGNoYWxrLmdyZXkoYFske2dldEN1cnJlbnRUaW1lKCl9XWApXG4gICAgfVxuXG4gICAgc3RhcnRMb2FkaW5nIChtc2c6IHN0cmluZykge1xuICAgICAgICB0aGlzLm9yYUluc3RhbmNlID0gb3JhKG1zZykuc3RhcnQoKVxuICAgIH1cblxuICAgIHN0b3BMb2FkaW5nICgpIHtcbiAgICAgICAgdGhpcy5vcmFJbnN0YW5jZSAmJiB0aGlzLm9yYUluc3RhbmNlLnN0b3AoKVxuICAgIH1cblxuICAgIGxvZyAoLi4ubXNnOiBBcnJheTxzdHJpbmc+KSB7XG4gICAgICAgIHJldHVybiBjb25zb2xlLmxvZyh0aGlzLnRpbWUsIC4uLm1zZylcbiAgICB9XG5cbiAgICBlcnJvciAodGl0bGU6IHN0cmluZyA9ICcnLCBtc2c6IHN0cmluZyA9ICcnLCBlcnI/OiBhbnkpIHtcbiAgICAgICAgdGhpcy5sb2coY2hhbGsucmVkQnJpZ2h0KHRpdGxlKSwgY2hhbGsuZ3JleShtc2cpKVxuICAgICAgICBlcnIgJiYgY29uc29sZS5sb2coY2hhbGsucmVkQnJpZ2h0KGVyciB8fCBlcnIuc3RhY2spKVxuICAgIH1cblxuICAgIGluZm8gKHRpdGxlOiBzdHJpbmcgPSAnJywgbXNnOiBzdHJpbmcgPSAnJykge1xuICAgICAgICB0aGlzLmxvZyhjaGFsay5yZXNldCh0aXRsZSksIGNoYWxrLmdyZXkobXNnKSlcbiAgICB9XG5cbiAgICB3YXJuICh0aXRsZTogc3RyaW5nID0gJycsIG1zZzogc3RyaW5nID0gJycpIHtcbiAgICAgICAgdGhpcy5sb2coY2hhbGsueWVsbG93QnJpZ2h0KHRpdGxlKSwgY2hhbGsuZ3JleShtc2cpKVxuICAgIH1cblxuICAgIHN1Y2Nlc3MgKHRpdGxlOiBzdHJpbmcgPSAnJywgbXNnOiBzdHJpbmcgPSAnJykge1xuICAgICAgICB0aGlzLmxvZyhjaGFsay5ncmVlbkJyaWdodCh0aXRsZSksIGNoYWxrLmdyZXkobXNnKSlcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IG5ldyBMb2dnZXIoKVxuIiwiaW1wb3J0ICogYXMgUG9zdGNzcyBmcm9tICdwb3N0Y3NzJ1xuaW1wb3J0IGxvZ2dlciBmcm9tICcuLi8uLi91dGlscy9sb2dnZXInXG5pbXBvcnQgcG9zdGNzc3JjIGZyb20gJ3Bvc3Rjc3MtbG9hZC1jb25maWcnXG5cbmltcG9ydCB7XG4gICAgRmlsZSxcbiAgICBQYXJzZXIsXG4gICAgQ29tcGlsYXRpb24sXG4gICAgUGFyc2VySW5qZWN0aW9uXG59IGZyb20gJy4uLy4uLy4uL3R5cGVzL3R5cGVzJ1xuaW1wb3J0ICogYXMgUG9zdENTUyBmcm9tICdwb3N0Y3NzJ1xuXG5jb25zdCBwb3N0Y3NzID0gcmVxdWlyZSgncG9zdGNzcycpXG5jb25zdCBwb3N0Y3NzQ29uZmlnOiBhbnkgPSB7fVxuY29uc3QgaW50ZXJuYWxQbHVnaW5zOiBBcnJheTxQb3N0Q1NTLkFjY2VwdGVkUGx1Z2luPiA9IFtdXG5jb25zdCB0YXNrczogYW55W10gPSBbXVxuXG4vLyBUT0RPOiBBZGQgbmV3IGhvb2s6IHByZXNldFxuXG4vKipcbiAqIFN0eWxlIGZpbGUgcGFyc2VyLlxuICogQGZvciAud3hzcyAuY3NzID0+IC53eHNzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IDxQYXJzZXI+ZnVuY3Rpb24gKHRoaXM6IFBhcnNlckluamVjdGlvbiwgZmlsZTogRmlsZSwgY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYjogRnVuY3Rpb24pOiB2b2lkIHtcblxuICAgIC8vIGdlblBvc3Rjc3NDb25maWcoKS50aGVuKChjb25maWc6IGFueSkgPT4ge1xuICAgIC8vICAgICBmaWxlLmNvbnZlcnRDb250ZW50VG9TdHJpbmcoKVxuICAgIC8vXG4gICAgLy8gICAgIHJldHVybiBwb3N0Y3NzKGNvbmZpZy5wbHVnaW5zLmNvbmNhdChpbnRlcm5hbFBsdWdpbnMpKS5wcm9jZXNzKGZpbGUuY29udGVudCwge1xuICAgIC8vICAgICAgICAgLi4uY29uZmlnLm9wdGlvbnMsXG4gICAgLy8gICAgICAgICBmcm9tOiBmaWxlLnNvdXJjZUZpbGVcbiAgICAvLyAgICAgfSBhcyBQb3N0Y3NzLlByb2Nlc3NPcHRpb25zKVxuICAgIC8vIH0pLnRoZW4oKHJvb3Q6IFBvc3Rjc3MuUmVzdWx0KSA9PiB7XG4gICAgLy8gICAgIGZpbGUuY29udGVudCA9IHJvb3QuY3NzXG4gICAgLy8gICAgIGZpbGUuYXN0ID0gcm9vdC5yb290LnRvUmVzdWx0KClcbiAgICAvLyAgICAgZmlsZS51cGRhdGVFeHQoJy53eHNzJylcbiAgICAvLyAgICAgY2IoKVxuICAgIC8vIH0pXG5cbiAgICBpZiAocG9zdGNzc0NvbmZpZy5wbHVnaW5zKSB7XG4gICAgICAgIGV4ZWMocG9zdGNzc0NvbmZpZywgZmlsZSwgY2IpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGFza3MucHVzaCgoKSA9PiB7XG4gICAgICAgICAgICBleGVjKHBvc3Rjc3NDb25maWcsIGZpbGUsIGNiKVxuICAgICAgICB9KVxuICAgIH1cbn1cblxuZ2VuUG9zdGNzc0NvbmZpZygpLnRoZW4oKGNvbmZpZzogYW55KSA9PiB7XG4gICAgdGFza3MuZm9yRWFjaCgodGFzazogRnVuY3Rpb24pID0+IHRhc2soKSlcbn0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgbG9nZ2VyLmVycm9yKCdsb2FkQ29uZmlnJywgZXJyLm1lc3NhZ2UsIGVycilcbn0pXG5cblxuZnVuY3Rpb24gZXhlYyAoY29uZmlnOiBhbnksIGZpbGU6IEZpbGUsIGNiOiBGdW5jdGlvbikge1xuICAgIGZpbGUuY29udmVydENvbnRlbnRUb1N0cmluZygpXG4gICAgcG9zdGNzcyhjb25maWcucGx1Z2lucy5jb25jYXQoaW50ZXJuYWxQbHVnaW5zKSkucHJvY2VzcyhmaWxlLmNvbnRlbnQsIHtcbiAgICAgICAgLi4uY29uZmlnLm9wdGlvbnMsXG4gICAgICAgIGZyb206IGZpbGUuc291cmNlRmlsZVxuICAgIH0gYXMgUG9zdGNzcy5Qcm9jZXNzT3B0aW9ucykudGhlbigocm9vdDogUG9zdGNzcy5SZXN1bHQpID0+IHtcbiAgICAgICAgZmlsZS5jb250ZW50ID0gcm9vdC5jc3NcbiAgICAgICAgZmlsZS5hc3QgPSByb290LnJvb3QudG9SZXN1bHQoKVxuICAgICAgICBmaWxlLnVwZGF0ZUV4dCgnLnd4c3MnKVxuICAgICAgICBjYigpXG4gICAgfSlcbn1cblxuZnVuY3Rpb24gZ2VuUG9zdGNzc0NvbmZpZyAodGFza3M6IEZ1bmN0aW9uW10gPSBbXSkge1xuICAgIHJldHVybiBwb3N0Y3NzQ29uZmlnLnBsdWdpbnMgPyBQcm9taXNlLnJlc29sdmUocG9zdGNzc0NvbmZpZykgOiBwb3N0Y3NzcmMoe30pLnRoZW4oKGNvbmZpZzogYW55KSA9PiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoT2JqZWN0LmFzc2lnbihwb3N0Y3NzQ29uZmlnLCBjb25maWcpKVxuICAgIH0pXG59XG4iLCJpbXBvcnQgKiBhcyBiYWJlbCBmcm9tICdAYmFiZWwvY29yZSdcbmltcG9ydCBGaWxlIGZyb20gJy4uL2NvcmUvY2xhc3MvRmlsZSdcblxuaW1wb3J0IHtcbiAgICBQYXJzZXIsXG4gICAgQ29tcGlsYXRpb24sXG4gICAgUGFyc2VySW5qZWN0aW9uXG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5sZXQgYmFiZWxDb25maWcgPSA8YmFiZWwuVHJhbnNmb3JtT3B0aW9ucz5udWxsXG5cbi8qKlxuICogU2NyaXB0IEZpbGUgcGFyc2VyLlxuICogQGZvciAuanMgLmVzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IDxQYXJzZXI+ZnVuY3Rpb24gKHRoaXM6IFBhcnNlckluamVjdGlvbiwgZmlsZTogRmlsZSwgY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYjogRnVuY3Rpb24pIHtcbiAgICBjb25zdCB1dGlscyA9IHRoaXMuZ2V0VXRpbHMoKVxuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuZ2V0U3lzdGVtQ29uZmlnKClcblxuICAgIGlmIChmaWxlLmlzSW5TcmNEaXIpIHtcbiAgICAgICAgaWYgKCFiYWJlbENvbmZpZykge1xuICAgICAgICAgICAgYmFiZWxDb25maWcgPSA8YmFiZWwuVHJhbnNmb3JtT3B0aW9ucz51dGlscy5yZXNvbHZlQ29uZmlnKFsnYmFiZWwuY29uZmlnLmpzJ10sIGNvbmZpZy5jd2QpXG4gICAgICAgIH1cblxuICAgICAgICBmaWxlLmNvbnRlbnQgPSBmaWxlLmNvbnRlbnQgaW5zdGFuY2VvZiBCdWZmZXIgPyBmaWxlLmNvbnRlbnQudG9TdHJpbmcoKSA6IGZpbGUuY29udGVudFxuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGJhYmVsLnRyYW5zZm9ybVN5bmMoZmlsZS5jb250ZW50LCB7XG4gICAgICAgICAgICBiYWJlbHJjOiBmYWxzZSxcbiAgICAgICAgICAgIGFzdDogdHJ1ZSxcbiAgICAgICAgICAgIGZpbGVuYW1lOiBmaWxlLnNvdXJjZUZpbGUsXG4gICAgICAgICAgICBzb3VyY2VUeXBlOiAnbW9kdWxlJyxcbiAgICAgICAgICAgIHNvdXJjZU1hcHM6IGNvbmZpZy5hbmthQ29uZmlnLmRldk1vZGUsXG4gICAgICAgICAgICAuLi5iYWJlbENvbmZpZ1xuICAgICAgICB9KVxuXG4gICAgICAgIGZpbGUuc291cmNlTWFwID0gSlNPTi5zdHJpbmdpZnkocmVzdWx0Lm1hcClcbiAgICAgICAgZmlsZS5jb250ZW50ID0gcmVzdWx0LmNvZGVcbiAgICAgICAgZmlsZS5hc3QgPSByZXN1bHQuYXN0XG4gICAgfVxuXG4gICAgZmlsZS51cGRhdGVFeHQoJy5qcycpXG4gICAgY2IoKVxufVxuIiwiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnXG5pbXBvcnQge1xuICAgIFBsdWdpbixcbiAgICBDb21waWxhdGlvbixcbiAgICBQbHVnaW5IYW5kbGVyLFxuICAgIFBsdWdpbkluamVjdGlvblxufSBmcm9tICcuLi8uLi8uLi90eXBlcy90eXBlcydcbmNvbnN0IG1pbmlmeUpTT04gPSByZXF1aXJlKCdqc29ubWluaWZ5JylcbmNvbnN0IGlubGluZVNvdXJjZU1hcENvbW1lbnQgPSByZXF1aXJlKCdpbmxpbmUtc291cmNlLW1hcC1jb21tZW50JylcblxuZXhwb3J0IGRlZmF1bHQgPFBsdWdpbj5mdW5jdGlvbiAodGhpczogUGx1Z2luSW5qZWN0aW9uKSB7XG4gICAgY29uc3QgdXRpbHMgPSB0aGlzLmdldFV0aWxzKClcbiAgICBjb25zdCBjb25maWcgPSB0aGlzLmdldFN5c3RlbUNvbmZpZygpXG4gICAgY29uc3Qge1xuICAgICAgICBsb2dnZXIsXG4gICAgICAgIHdyaXRlRmlsZVxuICAgIH0gPSB1dGlsc1xuXG4gICAgdGhpcy5vbignc2F2ZScsIDxQbHVnaW5IYW5kbGVyPmZ1bmN0aW9uIChjb21waWxhdGlvbjogQ29tcGlsYXRpb24sIGNiOiBGdW5jdGlvbikge1xuICAgICAgICBjb25zdCBmaWxlID0gY29tcGlsYXRpb24uZmlsZVxuXG4gICAgICAgIC8vIFRPRE86IFVzZSBtZW0tZnNcbiAgICAgICAgZnMuZW5zdXJlRmlsZShmaWxlLnRhcmdldEZpbGUpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5hbmthQ29uZmlnLmRldk1vZGUgJiYgZmlsZS5zb3VyY2VNYXApIHtcbiAgICAgICAgICAgICAgICBmaWxlLmNvbnZlcnRDb250ZW50VG9TdHJpbmcoKVxuICAgICAgICAgICAgICAgIGZpbGUuY29udGVudCA9IGZpbGUuY29udGVudCArICdcXHJcXG5cXHJcXG4nICsgaW5saW5lU291cmNlTWFwQ29tbWVudChmaWxlLnNvdXJjZU1hcCwge1xuICAgICAgICAgICAgICAgICAgICBibG9jazogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgc291cmNlc0NvbnRlbnQ6IHRydWVcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFjb25maWcuYW5rYUNvbmZpZy5kZXZNb2RlKSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChmaWxlLmV4dG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY2FzZSAnLmpzJzpcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICcuanNvbic6XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlLmNvbnZlcnRDb250ZW50VG9TdHJpbmcoKVxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5jb250ZW50ID0gbWluaWZ5SlNPTihmaWxlLmNvbnRlbnQpXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB3cml0ZUZpbGUoZmlsZS50YXJnZXRGaWxlLCBmaWxlLmNvbnRlbnQpXG4gICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgY2IoKVxuICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvcicsIGVyci5tZXNzYWdlLCBlcnIpXG4gICAgICAgICAgICBjYigpXG4gICAgICAgIH0pXG4gICAgfSlcbn1cbiIsImltcG9ydCAqIGFzIHBvc3Rjc3MgZnJvbSAncG9zdGNzcydcblxuZXhwb3J0IGRlZmF1bHQgcG9zdGNzcy5wbHVnaW4oJ3Bvc3Rjc3Mtd3hpbXBvcnQnLCAoKSA9PiB7XG4gICAgcmV0dXJuIChyb290OiBwb3N0Y3NzLlJvb3QpID0+IHtcbiAgICAgICAgbGV0IGltcG9ydHM6IEFycmF5PHN0cmluZz4gPSBbXVxuXG4gICAgICAgIHJvb3Qud2Fsa0F0UnVsZXMoJ3d4aW1wb3J0JywgKHJ1bGU6IHBvc3Rjc3MuQXRSdWxlKSA9PiB7XG4gICAgICAgICAgICBpbXBvcnRzLnB1c2gocnVsZS5wYXJhbXMucmVwbGFjZSgvXFwuXFx3Kyg/PVsnXCJdJCkvLCAnLnd4c3MnKSlcbiAgICAgICAgICAgIHJ1bGUucmVtb3ZlKClcbiAgICAgICAgfSlcbiAgICAgICAgcm9vdC5wcmVwZW5kKC4uLmltcG9ydHMubWFwKChpdGVtOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2ltcG9ydCcsXG4gICAgICAgICAgICAgICAgcGFyYW1zOiBpdGVtXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKVxuICAgICAgICBpbXBvcnRzLmxlbmd0aCA9IDBcbiAgICB9XG59KVxuIiwiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnXG5pbXBvcnQge1xuICAgIFBsdWdpbixcbiAgICBDb21waWxhdGlvbixcbiAgICBQbHVnaW5IYW5kbGVyLFxuICAgIFBsdWdpbkluamVjdGlvblxufSBmcm9tICcuLi8uLi8uLi90eXBlcy90eXBlcydcbmltcG9ydCAqIGFzIFBvc3RDU1MgZnJvbSAncG9zdGNzcydcbmltcG9ydCBwb3N0Y3NzV3hJbXBvcnQgZnJvbSAnLi9wb3N0Y3NzV3hpbXBvcnQnXG5cbmNvbnN0IHBvc3Rjc3MgPSByZXF1aXJlKCdwb3N0Y3NzJylcbmNvbnN0IGNzc25hbm8gPSByZXF1aXJlKCdwb3N0Y3NzLW5vcm1hbGl6ZS13aGl0ZXNwYWNlJylcbmNvbnN0IGludGVybmFsUGx1Z2luczogQXJyYXk8UG9zdENTUy5BY2NlcHRlZFBsdWdpbj4gPSBbcG9zdGNzc1d4SW1wb3J0XVxuXG5leHBvcnQgZGVmYXVsdCA8UGx1Z2luPmZ1bmN0aW9uICh0aGlzOiBQbHVnaW5JbmplY3Rpb24pIHtcbiAgICBjb25zdCB1dGlscyA9IHRoaXMuZ2V0VXRpbHMoKVxuICAgIGNvbnN0IHtcbiAgICAgICAgbG9nZ2VyXG4gICAgfSA9IHV0aWxzXG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5nZXRTeXN0ZW1Db25maWcoKVxuICAgIGNvbnN0IHRlc3RTcmNEaXIgPSBuZXcgUmVnRXhwKGBeJHtjb25maWcuc3JjRGlyfWApXG5cbiAgICB0aGlzLm9uKCdiZWZvcmUtY29tcGlsZScsIDxQbHVnaW5IYW5kbGVyPmZ1bmN0aW9uIChjb21waWxhdGlvbjogQ29tcGlsYXRpb24sIGNiOiBGdW5jdGlvbikge1xuICAgICAgICBjb25zdCBmaWxlID0gY29tcGlsYXRpb24uZmlsZVxuXG4gICAgICAgIGlmICghY29uZmlnLmFua2FDb25maWcuZGV2TW9kZSkge1xuICAgICAgICAgICAgaW50ZXJuYWxQbHVnaW5zLnB1c2goY3NzbmFubylcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGhhbmRsZXIgPSBwb3N0Y3NzKGludGVybmFsUGx1Z2lucylcblxuICAgICAgICBpZiAoZmlsZS5leHRuYW1lID09PSAnLnd4c3MnICYmIHRlc3RTcmNEaXIudGVzdChmaWxlLnNvdXJjZUZpbGUpKSB7XG4gICAgICAgICAgICBoYW5kbGVyLnByb2Nlc3MoKGZpbGUuYXN0IHx8IGZpbGUuY29udGVudCkgYXMgc3RyaW5nIHwgeyB0b1N0cmluZyAoKTogc3RyaW5nOyB9IHwgUG9zdENTUy5SZXN1bHQsIHtcbiAgICAgICAgICAgICAgICBmcm9tOiBmaWxlLnNvdXJjZUZpbGVcbiAgICAgICAgICAgIH0gYXMgUG9zdENTUy5Qcm9jZXNzT3B0aW9ucykudGhlbigocm9vdDogUG9zdENTUy5SZXN1bHQpOiB2b2lkID0+IHtcbiAgICAgICAgICAgICAgICBmaWxlLmNvbnRlbnQgPSByb290LmNzc1xuICAgICAgICAgICAgICAgIGZpbGUuYXN0ID0gcm9vdC5yb290LnRvUmVzdWx0KClcbiAgICAgICAgICAgICAgICBjYigpXG4gICAgICAgICAgICB9LCAoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcignRXJyb3InLCBlcnIubWVzc2FnZSwgZXJyKVxuICAgICAgICAgICAgICAgIGNiKClcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYigpXG4gICAgICAgIH1cbiAgICB9KVxufVxuIiwiaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCdcblxuaW1wb3J0IHtcbiAgICBGaWxlLFxuICAgIFBhcnNlcixcbiAgICBDb21waWxhdGlvbixcbiAgICBQYXJzZXJJbmplY3Rpb25cbn0gZnJvbSAnLi4vLi4vdHlwZXMvdHlwZXMnXG5cbmxldCB0c0NvbmZpZyA9IDx0cy5UcmFuc3BpbGVPcHRpb25zPm51bGxcblxuLyoqXG4gKiBUeXBlc2NyaXB0IGZpbGUgcGFyc2VyLlxuICpcbiAqIEBmb3IgYW55IGZpbGUgdGhhdCBkb2VzIG5vdCBtYXRjaGUgcGFyc2Vycy5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgPFBhcnNlcj5mdW5jdGlvbiAodGhpczogUGFyc2VySW5qZWN0aW9uLCBmaWxlOiBGaWxlLCBjb21waWxhdGlvbjogQ29tcGlsYXRpb24sIGNhbGxiYWNrPzogRnVuY3Rpb24pIHtcbiAgICBjb25zdCB1dGlscyA9IHRoaXMuZ2V0VXRpbHMoKVxuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuZ2V0U3lzdGVtQ29uZmlnKClcbiAgICBjb25zdCB7IGxvZ2dlciB9ID0gdXRpbHNcblxuICAgIGZpbGUuY29udGVudCA9IGZpbGUuY29udGVudCBpbnN0YW5jZW9mIEJ1ZmZlciA/IGZpbGUuY29udGVudC50b1N0cmluZygpIDogZmlsZS5jb250ZW50XG4gICAgY29uc3Qgc291cmNlTWFwID0gIHtcbiAgICAgICAgc291cmNlc0NvbnRlbnQ6IFtmaWxlLmNvbnRlbnRdXG4gICAgfVxuXG4gICAgaWYgKCF0c0NvbmZpZykge1xuICAgICAgICB0c0NvbmZpZyA9IDx0cy5UcmFuc3BpbGVPcHRpb25zPnV0aWxzLnJlc29sdmVDb25maWcoWyd0c2NvbmZpZy5qc29uJywgJ3RzY29uZmlnLmpzJ10sIGNvbmZpZy5jd2QpXG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gdHMudHJhbnNwaWxlTW9kdWxlKGZpbGUuY29udGVudCwge1xuICAgICAgICBjb21waWxlck9wdGlvbnM6IHRzQ29uZmlnLmNvbXBpbGVyT3B0aW9ucyxcbiAgICAgICAgZmlsZU5hbWU6IGZpbGUuc291cmNlRmlsZVxuICAgIH0pXG5cbiAgICB0cnkge1xuICAgICAgICBmaWxlLmNvbnRlbnQgPSByZXN1bHQub3V0cHV0VGV4dFxuICAgICAgICBpZiAoY29uZmlnLmFua2FDb25maWcuZGV2TW9kZSkge1xuICAgICAgICAgICAgZmlsZS5zb3VyY2VNYXAgPSB7XG4gICAgICAgICAgICAgICAgLi4uSlNPTi5wYXJzZShyZXN1bHQuc291cmNlTWFwVGV4dCksXG4gICAgICAgICAgICAgICAgLi4uc291cmNlTWFwXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZmlsZS51cGRhdGVFeHQoJy5qcycpXG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGxvZ2dlci5lcnJvcignQ29tcGlsZSBlcnJvcicsIGVyci5tZXNzYWdlLCBlcnIpXG4gICAgfVxuXG4gICAgY2FsbGJhY2soKVxufVxuIiwiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0ICogYXMgdCBmcm9tICdAYmFiZWwvdHlwZXMnXG5pbXBvcnQgKiBhcyBiYWJlbCBmcm9tICdAYmFiZWwvY29yZSdcbmltcG9ydCB0cmF2ZXJzZSBmcm9tICdAYmFiZWwvdHJhdmVyc2UnXG5pbXBvcnQgY29kZUdlbmVyYXRvciBmcm9tICdAYmFiZWwvZ2VuZXJhdG9yJ1xuXG5pbXBvcnQge1xuICAgIFBsdWdpbixcbiAgICBDb21waWxhdGlvbixcbiAgICBQbHVnaW5IYW5kbGVyLFxuICAgIFBsdWdpbkluamVjdGlvblxufSBmcm9tICcuLi8uLi8uLi90eXBlcy90eXBlcydcblxuY29uc3QgZGVwZW5kZW5jeVBvb2wgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpXG5jb25zdCByZXNvdmxlTW9kdWxlTmFtZSA9IHJlcXVpcmUoJ3JlcXVpcmUtcGFja2FnZS1uYW1lJylcblxuZXhwb3J0IGRlZmF1bHQgPFBsdWdpbj4gZnVuY3Rpb24gKHRoaXM6IFBsdWdpbkluamVjdGlvbikge1xuICAgIGNvbnN0IHV0aWxzID0gdGhpcy5nZXRVdGlscygpXG4gICAgY29uc3QgY29tcGlsZXIgPSB0aGlzLmdldENvbXBpbGVyKClcbiAgICBjb25zdCBjb25maWcgPSB0aGlzLmdldFN5c3RlbUNvbmZpZygpXG4gICAgY29uc3QgdGVzdFNyY0RpciA9IG5ldyBSZWdFeHAoYF4ke2NvbmZpZy5zcmNEaXJ9YClcbiAgICBjb25zdCB0ZXN0Tm9kZU1vZHVsZXMgPSBuZXcgUmVnRXhwKGBeJHtjb25maWcuc291cmNlTm9kZU1vZHVsZXN9YClcblxuICAgIHRoaXMub24oJ2JlZm9yZS1jb21waWxlJywgZnVuY3Rpb24gKGNvbXBpbGF0aW9uOiBDb21waWxhdGlvbiwgY2I6IEZ1bmN0aW9uKSB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSBjb21waWxhdGlvbi5maWxlXG4gICAgICAgIGNvbnN0IGRldk1vZGUgPSBjb25maWcuYW5rYUNvbmZpZy5kZXZNb2RlXG4gICAgICAgIGNvbnN0IGxvY2FsRGVwZW5kZW5jeVBvb2wgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpXG5cbiAgICAgICAgLy8gT25seSByZXNvbHZlIGpzIGZpbGUuXG4gICAgICAgIGlmIChmaWxlLmV4dG5hbWUgPT09ICcuanMnKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhmaWxlLnNvdXJjZUZpbGUsIGZpbGUuYXN0ID8gJ29iamVjdCcgOiBmaWxlLmFzdClcbiAgICAgICAgICAgIGlmICghZmlsZS5hc3QpIHtcbiAgICAgICAgICAgICAgICBmaWxlLmFzdCA9IDx0LkZpbGU+YmFiZWwucGFyc2UoXG4gICAgICAgICAgICAgICAgICAgIGZpbGUuY29udGVudCBpbnN0YW5jZW9mIEJ1ZmZlciA/IGZpbGUuY29udGVudC50b1N0cmluZygpIDogZmlsZS5jb250ZW50LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYWJlbHJjOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZVR5cGU6ICdtb2R1bGUnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyYXZlcnNlKGZpbGUuYXN0LCB7XG4gICAgICAgICAgICAgICAgZW50ZXIgKHBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhdGguaXNJbXBvcnREZWNsYXJhdGlvbigpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBub2RlID0gcGF0aC5ub2RlXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzb3VyY2UgPSBub2RlLnNvdXJjZVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlLnZhbHVlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIHNvdXJjZS52YWx1ZSA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoc291cmNlLCBmaWxlLnNvdXJjZUZpbGUsIGZpbGUudGFyZ2V0RmlsZSwgbG9jYWxEZXBlbmRlbmN5UG9vbClcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXRoLmlzQ2FsbEV4cHJlc3Npb24oKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHBhdGgubm9kZVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2FsbGVlID0gPHQuSWRlbnRpZmllcj5ub2RlLmNhbGxlZVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYXJncyA9IDx0LlN0cmluZ0xpdGVyYWxbXT5ub2RlLmFyZ3VtZW50c1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJncyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxlZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3NbMF0gJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzWzBdLnZhbHVlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGVlLm5hbWUgPT09ICdyZXF1aXJlJyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiBhcmdzWzBdLnZhbHVlID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShhcmdzWzBdLCBmaWxlLnNvdXJjZUZpbGUsIGZpbGUudGFyZ2V0RmlsZSwgbG9jYWxEZXBlbmRlbmN5UG9vbClcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBmaWxlLmNvbnRlbnQgPSBjb2RlR2VuZXJhdG9yKGZpbGUuYXN0LCB7XG4gICAgICAgICAgICAgICAgY29tcGFjdDogIWRldk1vZGUsXG4gICAgICAgICAgICAgICAgbWluaWZpZWQ6ICFkZXZNb2RlXG4gICAgICAgICAgICB9KS5jb2RlXG5cbiAgICAgICAgICAgIGNvbnN0IGRlcGVuZGVuY3lMaXN0ID0gQXJyYXkuZnJvbShsb2NhbERlcGVuZGVuY3lQb29sLmtleXMoKSkuZmlsdGVyKGRlcGVuZGVuY3kgPT4gIWRlcGVuZGVuY3lQb29sLmhhcyhkZXBlbmRlbmN5KSlcblxuICAgICAgICAgICAgUHJvbWlzZS5hbGwoZGVwZW5kZW5jeUxpc3QubWFwKGRlcGVuZGVuY3kgPT4gdHJhdmVyc2VOcG1EZXBlbmRlbmN5KGRlcGVuZGVuY3kpKSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgY2IoKVxuICAgICAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBjYigpXG4gICAgICAgICAgICAgICAgdXRpbHMubG9nZ2VyLmVycm9yKGZpbGUuc291cmNlRmlsZSwgZXJyLm1lc3NhZ2UsIGVycilcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYigpXG4gICAgICAgIH1cbiAgICB9IGFzIFBsdWdpbkhhbmRsZXIpXG5cbiAgICBmdW5jdGlvbiByZXNvbHZlIChub2RlOiBhbnksIHNvdXJjZUZpbGU6IHN0cmluZywgdGFyZ2V0RmlsZTogc3RyaW5nLCBsb2NhbERlcGVuZGVuY3lQb29sOiBNYXA8c3RyaW5nLCBzdHJpbmc+KSB7XG4gICAgICAgIGNvbnN0IHNvdXJjZUJhc2VOYW1lID0gcGF0aC5kaXJuYW1lKHNvdXJjZUZpbGUpXG4gICAgICAgIGNvbnN0IHRhcmdldEJhc2VOYW1lID0gcGF0aC5kaXJuYW1lKHRhcmdldEZpbGUpXG4gICAgICAgIGNvbnN0IG1vZHVsZU5hbWUgPSByZXNvdmxlTW9kdWxlTmFtZShub2RlLnZhbHVlKVxuXG4gICAgICAgIGlmICh1dGlscy5pc05wbURlcGVuZGVuY3kobW9kdWxlTmFtZSkgfHwgdGVzdE5vZGVNb2R1bGVzLnRlc3Qoc291cmNlRmlsZSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGRlcGVuZGVuY3kgPSB1dGlscy5yZXNvbHZlTW9kdWxlKG5vZGUudmFsdWUsIHtcbiAgICAgICAgICAgICAgICBwYXRoczogW3NvdXJjZUJhc2VOYW1lXVxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgLy8gSW4gY2FzZSBgcmVxdWlyZSgnYScpYCwgYGFgIGlzIGxvY2FsIGZpbGUgaW4gc3JjIGRpcmVjdG9yeVxuICAgICAgICAgICAgaWYgKCFkZXBlbmRlbmN5IHx8IHRlc3RTcmNEaXIudGVzdChkZXBlbmRlbmN5KSkgcmV0dXJuXG5cbiAgICAgICAgICAgIGNvbnN0IGRpc3RQYXRoID0gZGVwZW5kZW5jeS5yZXBsYWNlKGNvbmZpZy5zb3VyY2VOb2RlTW9kdWxlcywgY29uZmlnLmRpc3ROb2RlTW9kdWxlcylcblxuICAgICAgICAgICAgbm9kZS52YWx1ZSA9IHBhdGgucmVsYXRpdmUodGFyZ2V0QmFzZU5hbWUsIGRpc3RQYXRoKVxuXG4gICAgICAgICAgICBpZiAobG9jYWxEZXBlbmRlbmN5UG9vbC5oYXMoZGVwZW5kZW5jeSkpIHJldHVyblxuICAgICAgICAgICAgbG9jYWxEZXBlbmRlbmN5UG9vbC5zZXQoZGVwZW5kZW5jeSwgZGVwZW5kZW5jeSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGZ1bmN0aW9uIHRyYXZlcnNlTnBtRGVwZW5kZW5jeSAoZGVwZW5kZW5jeTogc3RyaW5nKSB7XG4gICAgICAgIGRlcGVuZGVuY3lQb29sLnNldChkZXBlbmRlbmN5LCBkZXBlbmRlbmN5KVxuICAgICAgICBjb25zdCBmaWxlID0gYXdhaXQgdXRpbHMuY3JlYXRlRmlsZShkZXBlbmRlbmN5KVxuXG4gICAgICAgIGZpbGUudGFyZ2V0RmlsZSA9IGZpbGUuc291cmNlRmlsZS5yZXBsYWNlKGNvbmZpZy5zb3VyY2VOb2RlTW9kdWxlcywgY29uZmlnLmRpc3ROb2RlTW9kdWxlcylcbiAgICAgICAgYXdhaXQgY29tcGlsZXIuZ2VuZXJhdGVDb21waWxhdGlvbihmaWxlKS5ydW4oKVxuICAgIH1cblxufVxuIiwiLy8gaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IHNhc3NQYXJzZXIgZnJvbSAnLi4vcGFyc2Vycy9zYXNzUGFyc2VyJ1xuaW1wb3J0IGZpbGVQYXJzZXIgZnJvbSAnLi4vcGFyc2Vycy9maWxlUGFyc2VyJ1xuaW1wb3J0IHN0eWxlUGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvc3R5bGVQYXJzZXInXG5pbXBvcnQgYmFiZWxQYXJzZXIgZnJvbSAnLi4vcGFyc2Vycy9iYWJlbFBhcnNlcidcbmltcG9ydCBzY3JpcHRQYXJzZXIgZnJvbSAnLi4vcGFyc2Vycy9zY3JpcHRQYXJzZXInXG5pbXBvcnQgdGVtcGxhdGVQYXJzZXIgZnJvbSAnLi4vcGFyc2Vycy90ZW1wbGF0ZVBhcnNlcidcbmltcG9ydCBzYXZlRmlsZVBsdWdpbiBmcm9tICcuLi9wbHVnaW5zL3NhdmVGaWxlUGx1Z2luJ1xuaW1wb3J0IHd4SW1wb3J0UGx1Z2luIGZyb20gJy4uL3BsdWdpbnMvd3hJbXBvcnRQbHVnaW4nXG5pbXBvcnQgdHlwZXNjcmlwdFBhcnNlciBmcm9tICcuLi9wYXJzZXJzL3R5cGVzY3JpcHRQYXJzZXInXG5pbXBvcnQgZXh0cmFjdERlcGVuZGVuY3lQbHVnaW4gZnJvbSAnLi4vcGx1Z2lucy9leHRyYWN0RGVwZW5kZW5jeVBsdWdpbidcblxuaW1wb3J0IHtcbiAgICBJZ25vcmVkQ29uZmlncmF0aW9uLFxuICAgIFBhcnNlcnNDb25maWdyYXRpb24sXG4gICAgUGx1Z2luc0NvbmZpZ3JhdGlvblxufSBmcm9tICcuLi8uLi90eXBlcy90eXBlcydcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgICAgICAgICAgICAgICAgICBEYW5nZXIgem9uZVxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4vKipcbiAqIFRoZSBwYXRoIHdoZXJlIFdlQ2hhdCBtaW5pcHJvZ3JhbSBzb3VyY2UgZmlsZXMgZXhpc3QuXG4gKiBAZGVmYXVsdCAnLi9zcmMnXG4gKi9cbmV4cG9ydCBjb25zdCBzb3VyY2VEaXIgPSAnLi9zcmMnXG5cbi8qKlxuICogVGhlIHBhdGggd2hlcmUgV2VDaGF0IG1pbmlwcm9ncmFtIGNvbXBpbGVkIGZpbGVzIGV4aXN0LlxuICogQGRlZmF1bHQgJy4vZGlzdCdcbiAqL1xuZXhwb3J0IGNvbnN0IG91dHB1dERpciA9ICcuL2Rpc3QnXG5cbi8qKlxuICogVGhlIHBhdGggd2hlcmUgV2VDaGF0IG1pbmlwcm9ncmFtIHBhZ2VzIGV4aXN0LlxuICogQGRlZmF1bHQgJy4vc3JjL3BhZ2VzJ1xuICovXG5leHBvcnQgY29uc3QgcGFnZXMgPSAnLi9wYWdlcydcblxuLyoqXG4gKiBUaGUgcGF0aCB3aGVyZSBXZUNoYXQgbWluaXByb2dyYW0gY29tcG9uZW50cyBleGlzdC5cbiAqIEBkZWZhdWx0ICcuL3NyYy9jb21wb25lbnRzJ1xuICovXG5leHBvcnQgY29uc3QgY29tcG9uZW50cyA9ICcuL2NvbXBvbmVudHMnXG5cbi8qKlxuICogVGVtcGxhdGUgZm9yIGNyZWF0aW5nIHBhZ2UgYW5kIGNvbXBvbmVudC5cbiAqL1xuZXhwb3J0IGNvbnN0IHRlbXBsYXRlID0ge1xuICAgIHBhZ2U6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi90ZW1wbGF0ZS9wYWdlJyksXG4gICAgY29tcG9uZW50OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vdGVtcGxhdGUvY29tcG9uZW50Jylcbn1cblxuLyoqXG4gKiBUaGUgcGF0aCB3aGVyZSBXZUNoYXQgbWluaXByb2dyYW0gc3VicGFja2FnZXMgZXhpc3QuXG4gKiBAZGVmYXVsdCAnLi9zcmMvc3ViUGFja2FnZXMnXG4gKi9cbmV4cG9ydCBjb25zdCBzdWJQYWNrYWdlcyA9ICcuL3N1YlBhY2thZ2VzJ1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICAgICAgICAgICAgICAgICBDdXN0b20gY29uZmlndXJlXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbi8qKlxuICogV2hldGhlciB0byBvdXRwdXQgY29tcGlsZSBpbmZvcm1hdGlvbi5cbiAqIEBkZWZhdWx0IGZhbHNlXG4gKi9cbmV4cG9ydCBjb25zdCBxdWlldCA9IGZhbHNlXG5cbi8qKlxuICogQW5rYSBkZXZlbG9wbWVudCBtb2RlLlxuICogQGRlZmF1bHQgZmFsc2VcbiAqL1xuZXhwb3J0IGNvbnN0IGRldk1vZGUgPSBmYWxzZVxuXG4vKipcbiAqIFJlZ2lzdGVyIGZpbGUgcGFyc2VyLlxuICovXG5leHBvcnQgY29uc3QgcGFyc2VyczogUGFyc2Vyc0NvbmZpZ3JhdGlvbiA9IFtcbiAgICB7XG4gICAgICAgIG1hdGNoOiAvLipcXC4oanN8ZXMpJC8sXG4gICAgICAgIHBhcnNlcnM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwYXJzZXI6IGJhYmVsUGFyc2VyLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IHt9XG4gICAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbWF0Y2g6IC8uKlxcLih3eHNzfGNzc3xwb3N0Y3NzKSQvLFxuICAgICAgICBwYXJzZXJzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGFyc2VyOiBzdHlsZVBhcnNlcixcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB7fVxuICAgICAgICAgICAgfVxuICAgICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG1hdGNoOiAvLipcXC4oc2Fzc3xzY3NzKSQvLFxuICAgICAgICBwYXJzZXJzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGFyc2VyOiBzYXNzUGFyc2VyLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IHt9XG4gICAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbWF0Y2g6IC8uKlxcLih0c3x0eXBlc2NyaXB0KSQvLFxuICAgICAgICBwYXJzZXJzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGFyc2VyOiB0eXBlc2NyaXB0UGFyc2VyLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IHt9XG4gICAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICB9XG5dXG5cbi8qKlxuICogV2hldGhlciB0byBvdXRwdXQgZGVidWcgaW5mb3JtYXRpb24uXG4gKiBAZGVmYXVsdCBmYWxzZVxuICovXG5leHBvcnQgY29uc3QgZGVidWc6IGJvb2xlYW4gPSBmYWxzZVxuXG4vKipcbiAqIFJlZ2lzdGVyIHBsdWdpbi5cbiAqL1xuZXhwb3J0IGNvbnN0IHBsdWdpbnM6IFBsdWdpbnNDb25maWdyYXRpb24gPSBbXG4gICAge1xuICAgICAgICBwbHVnaW46IGV4dHJhY3REZXBlbmRlbmN5UGx1Z2luLFxuICAgICAgICBvcHRpb25zOiB7fVxuICAgIH0sXG4gICAge1xuICAgICAgICBwbHVnaW46IHd4SW1wb3J0UGx1Z2luLFxuICAgICAgICBvcHRpb25zOiB7fVxuICAgIH0sXG4gICAge1xuICAgICAgICBwbHVnaW46IHNhdmVGaWxlUGx1Z2luLFxuICAgICAgICBvcHRpb25zOiB7fVxuICAgIH1cbl1cblxuLyoqXG4gKiBGaWxlcyB0aGF0IHdpbGwgYmUgaWdub3JlZCBpbiBjb21waWxhdGlvbi5cbiAqL1xuZXhwb3J0IGNvbnN0IGlnbm9yZWQ6IElnbm9yZWRDb25maWdyYXRpb24gPSBbXVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICAgICAgICAgICAgICAgZXhwZXJpbWVudGFsIGNvbmZpZ3VyZVxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4iLCJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgcmVzb2x2ZUNvbmZpZyBmcm9tICcuLi91dGlscy9yZXNvbHZlQ29uZmlnJ1xuaW1wb3J0ICogYXMgYW5rYURlZmF1bHRDb25maWcgZnJvbSAnLi9hbmthRGVmYXVsdENvbmZpZydcblxuaW1wb3J0IHtcbiAgICBBbmthQ29uZmlnXG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5jb25zdCBjd2QgPSBwcm9jZXNzLmN3ZCgpXG5jb25zdCBjdXN0b21Db25maWcgPSA8QW5rYUNvbmZpZz5yZXNvbHZlQ29uZmlnKFsnYW5rYS5jb25maWcuanMnLCAnYW5rYS5jb25maWcuanNvbiddKVxuXG5mdW5jdGlvbiBtZXJnZUFycmF5IDxUPiAoLi4uYXJyczogQXJyYXk8VFtdPik6IEFycmF5PFQ+IHtcbiAgICByZXR1cm4gYXJycy5maWx0ZXIoYXJyID0+IGFyciAmJiBhcnIubGVuZ3RoKS5yZWR1Y2UoKHByZXYsIG5leHQpID0+IHtcbiAgICAgICAgcmV0dXJuIHByZXYuY29uY2F0KG5leHQpXG4gICAgfSwgW10pXG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICAuLi5hbmthRGVmYXVsdENvbmZpZyxcbiAgICAuLi5jdXN0b21Db25maWcsXG4gICAgdGVtcGxhdGU6IGN1c3RvbUNvbmZpZy50ZW1wbGF0ZSA/IHtcbiAgICAgICAgcGFnZTogcGF0aC5qb2luKGN3ZCwgY3VzdG9tQ29uZmlnLnRlbXBsYXRlLnBhZ2UpLFxuICAgICAgICBjb21wb25lbnQ6IHBhdGguam9pbihjd2QsIGN1c3RvbUNvbmZpZy50ZW1wbGF0ZS5jb21wb25lbnQpXG4gICAgfSA6IGFua2FEZWZhdWx0Q29uZmlnLnRlbXBsYXRlLFxuICAgIHBhcnNlcnM6IG1lcmdlQXJyYXkoY3VzdG9tQ29uZmlnLnBhcnNlcnMsIGFua2FEZWZhdWx0Q29uZmlnLnBhcnNlcnMpLFxuICAgIHBsdWdpbnM6IG1lcmdlQXJyYXkoY3VzdG9tQ29uZmlnLnBsdWdpbnMsIGFua2FEZWZhdWx0Q29uZmlnLnBsdWdpbnMpLFxuICAgIGlnbm9yZWQ6IG1lcmdlQXJyYXkoY3VzdG9tQ29uZmlnLmlnbm9yZWQsIGFua2FEZWZhdWx0Q29uZmlnLmlnbm9yZWQpXG59XG4iLCJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgYW5rYUNvbmZpZyBmcm9tICcuL2Fua2FDb25maWcnXG5cbmV4cG9ydCBjb25zdCBjd2QgPSBwcm9jZXNzLmN3ZCgpXG5leHBvcnQgY29uc3Qgc3JjRGlyID0gcGF0aC5yZXNvbHZlKGN3ZCwgYW5rYUNvbmZpZy5zb3VyY2VEaXIpXG5leHBvcnQgY29uc3QgZGlzdERpciA9IHBhdGgucmVzb2x2ZShjd2QsIGFua2FDb25maWcub3V0cHV0RGlyKVxuZXhwb3J0IGNvbnN0IGFua2FNb2R1bGVzID0gcGF0aC5yZXNvbHZlKHNyY0RpciwgJ2Fua2FfbW9kdWxlcycpXG5leHBvcnQgY29uc3Qgc291cmNlTm9kZU1vZHVsZXMgPSBwYXRoLnJlc29sdmUoY3dkLCAnLi9ub2RlX21vZHVsZXMnKVxuZXhwb3J0IGNvbnN0IGRpc3ROb2RlTW9kdWxlcyA9IHBhdGgucmVzb2x2ZShkaXN0RGlyLCAnLi9ucG1fbW9kdWxlcycpXG5leHBvcnQgY29uc3QgZGVmYXVsdFNjYWZmb2xkID0gICdpRXhjZXB0aW9uL2Fua2EtcXVpY2tzdGFydCdcbiIsImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJ1xuaW1wb3J0IGFua2FDb25maWcgZnJvbSAnLi9hbmthQ29uZmlnJ1xuaW1wb3J0ICogYXMgc3lzdGVtIGZyb20gJy4vc3lzdGVtQ29uZmlnJ1xuaW1wb3J0IHJlc29sdmVDb25maWcgZnJvbSAnLi4vdXRpbHMvcmVzb2x2ZUNvbmZpZydcblxuY29uc3QgY3VzdG9tQ29uZmlnID0gcmVzb2x2ZUNvbmZpZyhbJ2FwcC5qc29uJ10sIHN5c3RlbS5zcmNEaXIpXG5cbmV4cG9ydCBkZWZhdWx0IE9iamVjdC5hc3NpZ24oe1xuICAgIHBhZ2VzOiBbXSxcbiAgICBzdWJQYWNrYWdlczogW10sXG4gICAgd2luZG93OiB7XG4gICAgICAgIG5hdmlnYXRpb25CYXJUaXRsZVRleHQ6ICdXZWNoYXQnXG4gICAgfVxuICAgIC8vIHRhYkJhcjoge1xuICAgIC8vICAgICBsaXN0OiBbXVxuICAgIC8vIH0sXG59LCBjdXN0b21Db25maWcpXG4iLCJpbXBvcnQgKiBhcyBzeXN0ZW1Db25maWcgZnJvbSAnLi9zeXN0ZW1Db25maWcnXG5pbXBvcnQgYW5rYUNvbmZpZyBmcm9tICcuL2Fua2FDb25maWcnXG5pbXBvcnQgcHJvamVjdENvbmZpZyBmcm9tICcuL3Byb2plY3RDb25maWcnXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICAuLi5zeXN0ZW1Db25maWcsXG4gICAgYW5rYUNvbmZpZyxcbiAgICBwcm9qZWN0Q29uZmlnXG59XG4iLCJpbXBvcnQgKiBhcyBHbG9iIGZyb20gJ2dsb2InXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSdcbmNvbnN0IGdsb2IgPSByZXF1aXJlKCdnbG9iJylcblxuaW1wb3J0IHtcbiAgICBDb250ZW50XG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkRmlsZSAoc291cmNlRmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8QnVmZmVyPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgZnMucmVhZEZpbGUoc291cmNlRmlsZVBhdGgsIChlcnIsIGJ1ZmZlcikgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoYnVmZmVyKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZUZpbGUgKHRhcmdldEZpbGVQYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IENvbnRlbnQpOiBQcm9taXNlPHVuZGVmaW5lZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGZzLndyaXRlRmlsZSh0YXJnZXRGaWxlUGF0aCwgY29udGVudCwgZXJyID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHRocm93IGVyclxuICAgICAgICAgICAgcmVzb2x2ZSgpXG4gICAgICAgIH0pXG4gICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlYXJjaEZpbGVzIChzY2hlbWU6IHN0cmluZywgb3B0aW9ucz86IEdsb2IuSU9wdGlvbnMpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgZ2xvYihzY2hlbWUsIG9wdGlvbnMsIChlcnI6IChFcnJvciB8IG51bGwpLCBmaWxlczogQXJyYXk8c3RyaW5nPik6IHZvaWQgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoZmlsZXMpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfSlcbn1cbiIsImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJ1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuLi8uLi9jb25maWcnXG5pbXBvcnQgKiBhcyB0IGZyb20gJ0BiYWJlbC90eXBlcydcbmltcG9ydCAqIGFzIFBvc3RDU1MgZnJvbSAncG9zdGNzcydcbmltcG9ydCB7XG4gICAgQ29udGVudCxcbiAgICBGaWxlQ29uc3RydWN0b3JPcHRpb25cbn0gZnJvbSAnLi4vLi4vLi4vdHlwZXMvdHlwZXMnXG5cbmNvbnN0IHJlcGxhY2VFeHQgPSByZXF1aXJlKCdyZXBsYWNlLWV4dCcpXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZpbGUge1xuICAgIHB1YmxpYyBzb3VyY2VGaWxlOiBzdHJpbmdcbiAgICBwdWJsaWMgY29udGVudDogQ29udGVudFxuICAgIHB1YmxpYyB0YXJnZXRGaWxlOiBzdHJpbmdcbiAgICBwdWJsaWMgYXN0PzogdC5Ob2RlIHwgUG9zdENTUy5SZXN1bHRcbiAgICBwdWJsaWMgc291cmNlTWFwPzogQ29udGVudFxuICAgIHB1YmxpYyBpc0luU3JjRGlyPzogYm9vbGVhblxuXG4gICAgY29uc3RydWN0b3IgKG9wdGlvbjogRmlsZUNvbnN0cnVjdG9yT3B0aW9uKSB7XG4gICAgICAgIGNvbnN0IGlzSW5TcmNEaXJUZXN0ID0gbmV3IFJlZ0V4cChgXiR7Y29uZmlnLnNyY0Rpcn1gKVxuXG4gICAgICAgIGlmICghb3B0aW9uLnNvdXJjZUZpbGUpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCB2YWx1ZTogRmlsZUNvbnN0cnVjdG9yT3B0aW9uLnNvdXJjZUZpbGUnKVxuICAgICAgICBpZiAoIW9wdGlvbi5jb250ZW50KSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgdmFsdWU6IEZpbGVDb25zdHJ1Y3Rvck9wdGlvbi5jb250ZW50JylcblxuICAgICAgICB0aGlzLnNvdXJjZUZpbGUgPSBvcHRpb24uc291cmNlRmlsZVxuICAgICAgICB0aGlzLnRhcmdldEZpbGUgPSBvcHRpb24udGFyZ2V0RmlsZSB8fCBvcHRpb24uc291cmNlRmlsZS5yZXBsYWNlKGNvbmZpZy5zcmNEaXIsIGNvbmZpZy5kaXN0RGlyKSAvLyBEZWZhdWx0IHZhbHVlXG4gICAgICAgIHRoaXMuY29udGVudCA9IG9wdGlvbi5jb250ZW50XG4gICAgICAgIHRoaXMuc291cmNlTWFwID0gb3B0aW9uLnNvdXJjZU1hcFxuICAgICAgICB0aGlzLmlzSW5TcmNEaXIgPSBpc0luU3JjRGlyVGVzdC50ZXN0KHRoaXMuc291cmNlRmlsZSlcbiAgICB9XG5cbiAgICBnZXQgZGlybmFtZSAoKSB7XG4gICAgICAgIHJldHVybiBwYXRoLmRpcm5hbWUodGhpcy50YXJnZXRGaWxlKVxuICAgIH1cblxuICAgIGdldCBiYXNlbmFtZSAoKSB7XG4gICAgICAgIHJldHVybiBwYXRoLmJhc2VuYW1lKHRoaXMudGFyZ2V0RmlsZSlcbiAgICB9XG5cbiAgICBnZXQgZXh0bmFtZSAoKSB7XG4gICAgICAgIHJldHVybiBwYXRoLmV4dG5hbWUodGhpcy50YXJnZXRGaWxlKVxuICAgIH1cblxuICAgIGFzeW5jIHNhdmVUbyAocGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGF3YWl0IGZzLmVuc3VyZUZpbGUocGF0aClcblxuICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwYXRoJylcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVwZGF0ZUV4dCAoZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgdGhpcy50YXJnZXRGaWxlID0gcmVwbGFjZUV4dCh0aGlzLnRhcmdldEZpbGUsIGV4dClcbiAgICB9XG5cbiAgICBjb252ZXJ0Q29udGVudFRvU3RyaW5nICgpIHtcbiAgICAgICAgaWYgKHRoaXMuY29udGVudCBpbnN0YW5jZW9mIEJ1ZmZlcikge1xuICAgICAgICAgICAgdGhpcy5jb250ZW50ID0gdGhpcy5jb250ZW50LnRvU3RyaW5nKClcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsImltcG9ydCB7XG4gICAgcmVhZEZpbGVcbn0gZnJvbSAnLi9mcydcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJ1xuaW1wb3J0IEZpbGUgZnJvbSAnLi4vY29yZS9jbGFzcy9GaWxlJ1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRmlsZSAoc291cmNlRmlsZTogc3RyaW5nKTogUHJvbWlzZTxGaWxlPiB7XG4gICAgcmV0dXJuIHJlYWRGaWxlKHNvdXJjZUZpbGUpLnRoZW4oY29udGVudCA9PiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IEZpbGUoe1xuICAgICAgICAgICAgc291cmNlRmlsZSxcbiAgICAgICAgICAgIGNvbnRlbnRcbiAgICAgICAgfSkpXG4gICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUZpbGVTeW5jIChzb3VyY2VGaWxlOiBzdHJpbmcpIHtcbiAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHNvdXJjZUZpbGUpXG4gICAgcmV0dXJuIG5ldyBGaWxlKHtcbiAgICAgICAgc291cmNlRmlsZSxcbiAgICAgICAgY29udGVudFxuICAgIH0pXG59XG4iLCJpbXBvcnQgeyBPcHRpb25zIGFzIFRlbXBsYXRlT3B0aW9ucyB9IGZyb20gJ2VqcydcbmltcG9ydCB7IG1lbUZzRWRpdG9yIGFzIE1lbUZzRWRpdG9yIH0gZnJvbSAnbWVtLWZzLWVkaXRvcidcblxuY29uc3QgbWVtRnMgPSByZXF1aXJlKCdtZW0tZnMnKVxuY29uc3QgbWVtRnNFZGl0b3IgPSByZXF1aXJlKCdtZW0tZnMtZWRpdG9yJylcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRnNFZGl0b3Ige1xuICAgIGVkaXRvcjogTWVtRnNFZGl0b3IuRWRpdG9yXG5cbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIGNvbnN0IHN0b3JlID0gbWVtRnMuY3JlYXRlKClcblxuICAgICAgICB0aGlzLmVkaXRvciA9IG1lbUZzRWRpdG9yLmNyZWF0ZShzdG9yZSlcbiAgICB9XG5cbiAgICBjb3B5IChmcm9tOiBzdHJpbmcsIHRvOiBzdHJpbmcsIGNvbnRleHQ6IG9iamVjdCwgdGVtcGxhdGVPcHRpb25zPzogVGVtcGxhdGVPcHRpb25zLCBjb3B5T3B0aW9ucz86IE1lbUZzRWRpdG9yLkNvcHlPcHRpb25zKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZWRpdG9yLmNvcHlUcGwoZnJvbSwgdG8sIGNvbnRleHQsIHRlbXBsYXRlT3B0aW9ucywgY29weU9wdGlvbnMpXG4gICAgfVxuXG4gICAgd3JpdGUgKGZpbGVwYXRoOiBzdHJpbmcsIGNvbnRlbnRzOiBNZW1Gc0VkaXRvci5Db250ZW50cyk6IHZvaWQge1xuICAgICAgICB0aGlzLmVkaXRvci53cml0ZShmaWxlcGF0aCwgY29udGVudHMpXG4gICAgfVxuXG4gICAgd3JpdGVKU09OIChmaWxlcGF0aDogc3RyaW5nLCBjb250ZW50czogYW55LCByZXBsYWNlcj86IE1lbUZzRWRpdG9yLlJlcGxhY2VyRnVuYywgc3BhY2U/OiBNZW1Gc0VkaXRvci5TcGFjZSk6IHZvaWQge1xuICAgICAgICB0aGlzLmVkaXRvci53cml0ZUpTT04oZmlsZXBhdGgsIGNvbnRlbnRzLCByZXBsYWNlciB8fCBudWxsLCBzcGFjZSA9IDQpXG4gICAgfVxuXG4gICAgcmVhZCAoZmlsZXBhdGg6IHN0cmluZywgb3B0aW9ucz86IHsgcmF3OiBib29sZWFuLCBkZWZhdWx0czogc3RyaW5nIH0pOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5lZGl0b3IucmVhZChmaWxlcGF0aCwgb3B0aW9ucylcbiAgICB9XG5cbiAgICByZWFkSlNPTiAoZmlsZXBhdGg6IHN0cmluZywgZGVmYXVsdHM/OiBhbnkpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5lZGl0b3IucmVhZEpTT04oZmlsZXBhdGgsIGRlZmF1bHRzKVxuICAgIH1cblxuICAgIHNhdmUgKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yLmNvbW1pdChyZXNvbHZlKVxuICAgICAgICB9KVxuICAgIH1cbn1cbiIsImltcG9ydCBsb2cgZnJvbSAnLi9sb2dnZXInXG5pbXBvcnQgYW5rYUNvbmZpZyBmcm9tICcuLi9jb25maWcvYW5rYUNvbmZpZydcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKGlkOiBzdHJpbmcsIG9wdGlvbnM/OiB7IHBhdGhzPzogc3RyaW5nW10gfSk6IHN0cmluZyB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUucmVzb2x2ZShpZCwgb3B0aW9ucylcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgbG9nLmVycm9yKCdNaXNzaW5nIGRlcGVuZGVuY3knLCBpZCwgIWFua2FDb25maWcucXVpZXQgPyBgaW4gJHtvcHRpb25zLnBhdGhzfWAgOiBudWxsKVxuICAgIH1cbn1cbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNhbGxQcm9taXNlSW5DaGFpbiAobGlzdDogQXJyYXk8KC4uLnBhcmFtczogYW55W10pID0+IFByb21pc2U8YW55Pj4gPSBbXSwgLi4ucGFyYW1zOiBBcnJheTxhbnk+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgaWYgKCFsaXN0Lmxlbmd0aCkgIHtcbiAgICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgbGV0IHN0ZXAgPSBsaXN0WzBdKC4uLnBhcmFtcylcblxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHN0ZXAgPSBzdGVwLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsaXN0W2ldKC4uLnBhcmFtcylcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICBzdGVwLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICB9LCBlcnIgPT4ge1xuICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgfSlcbiAgICB9KVxufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKGZuOiBGdW5jdGlvbik6ICgpID0+IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBmdW5jdGlvbiAoLi4ucGFyYW1zOiBBcnJheTxhbnk+KSB7XG4gICAgICAgIGNvbnN0IGxpbWl0YXRpb24gPSBwYXJhbXMubGVuZ3RoXG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgaWYgKGZuLmxlbmd0aCA+IGxpbWl0YXRpb24pIHtcbiAgICAgICAgICAgICAgICBmbiguLi5wYXJhbXMsIHJlc29sdmUpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoZm4oLi4ucGFyYW1zKSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBjaG9raWRhciBmcm9tICdjaG9raWRhcidcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKGRpcjogc3RyaW5nIHwgc3RyaW5nW10sIG9wdGlvbnM/OiBjaG9raWRhci5XYXRjaE9wdGlvbnMpOiBjaG9raWRhci5GU1dhdGNoZXIge1xuICAgIHJldHVybiBjaG9raWRhci53YXRjaChkaXIsIHtcbiAgICAgICAgcGVyc2lzdGVudDogdHJ1ZSxcbiAgICAgICAgaWdub3JlSW5pdGlhbDogdHJ1ZSxcbiAgICAgICAgLi4ub3B0aW9uc1xuICAgIH0pXG59XG4iLCJkZWNsYXJlIHR5cGUgVmFsaWRhdGVOcG1QYWNrYWdlTmFtZSA9IHtcbiAgICB2YWxpZEZvck5ld1BhY2thZ2VzOiBib29sZWFuLFxuICAgIHZhbGlkRm9yT2xkUGFja2FnZXM6IGJvb2xlYW5cbn1cblxuY29uc3QgdmFsaWRhdGUgPSByZXF1aXJlKCd2YWxpZGF0ZS1ucG0tcGFja2FnZS1uYW1lJylcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKHJlcXVpcmVkOiBzdHJpbmcgPSAnJyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IDxWYWxpZGF0ZU5wbVBhY2thZ2VOYW1lPnZhbGlkYXRlKHJlcXVpcmVkKVxuXG4gICAgcmV0dXJuIHJlc3VsdC52YWxpZEZvck5ld1BhY2thZ2VzIHx8IHJlc3VsdC52YWxpZEZvck9sZFBhY2thZ2VzXG59XG4iLCJpbXBvcnQgZG93bmxvYWRSZXBvIGZyb20gJ2Rvd25sb2FkLWdpdC1yZXBvJ1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAocmVwbzogc3RyaW5nLCBwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBkb3dubG9hZFJlcG8ocmVwbywgcGF0aCwgeyBjbG9uZTogZmFsc2UgfSwgKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgIGVyciA/IHJlamVjdChlcnIpIDogcmVzb2x2ZSgpXG4gICAgICAgIH0pXG4gICAgfSlcbn1cbiIsImltcG9ydCBDb21waWxlciBmcm9tICcuL0NvbXBpbGVyJ1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuLi8uLi9jb25maWcnXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi8uLi91dGlscydcblxuaW1wb3J0IHtcbiAgICBVdGlscyxcbiAgICBBbmthQ29uZmlnLFxuICAgIFBhcnNlck9wdGlvbnMsXG4gICAgUHJvamVjdENvbmZpZyxcbiAgICBQbHVnaW5IYW5kbGVyLFxuICAgIFBsdWdpbk9wdGlvbnMsXG4gICAgQ29tcGlsZXJDb25maWdcbn0gZnJvbSAnLi4vLi4vLi4vdHlwZXMvdHlwZXMnXG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBJbmplY3Rpb24ge1xuICAgIGNvbXBpbGVyOiBDb21waWxlclxuICAgIG9wdGlvbnM6IG9iamVjdFxuXG4gICAgY29uc3RydWN0b3IgKGNvbXBpbGVyOiBDb21waWxlciwgb3B0aW9ucz86IG9iamVjdCkge1xuICAgICAgICB0aGlzLmNvbXBpbGVyID0gY29tcGlsZXJcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9uc1xuICAgIH1cblxuICAgIGFic3RyYWN0IGdldE9wdGlvbnMgKCk6IG9iamVjdFxuXG4gICAgZ2V0Q29tcGlsZXIgKCk6IENvbXBpbGVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcGlsZXJcbiAgICB9XG5cbiAgICBnZXRVdGlscyAoKSB7XG4gICAgICAgIHJldHVybiB1dGlsc1xuICAgIH1cblxuICAgIGdldEFua2FDb25maWcgKCk6IEFua2FDb25maWcge1xuICAgICAgICByZXR1cm4gY29uZmlnLmFua2FDb25maWdcbiAgICB9XG5cbiAgICBnZXRTeXN0ZW1Db25maWcgKCk6IENvbXBpbGVyQ29uZmlnIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZ1xuICAgIH1cblxuICAgIGdldFByb2plY3RDb25maWcgKCk6IFByb2plY3RDb25maWcge1xuICAgICAgICByZXR1cm4gY29uZmlnLnByb2plY3RDb25maWdcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBQbHVnaW5JbmplY3Rpb24gZXh0ZW5kcyBJbmplY3Rpb24ge1xuXG4gICAgY29uc3RydWN0b3IgKGNvbXBpbGVyOiBDb21waWxlciwgb3B0aW9uczogUGx1Z2luT3B0aW9uc1snb3B0aW9ucyddKSB7XG4gICAgICAgIHN1cGVyKGNvbXBpbGVyLCBvcHRpb25zKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybiBQbHVnaW4gb3B0aW9uc1xuICAgICAqL1xuICAgIGdldE9wdGlvbnMgKCk6IG9iamVjdCB7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMgfHwge31cbiAgICB9XG5cbiAgICBvbiAoZXZlbnQ6IHN0cmluZywgaGFuZGxlcjogUGx1Z2luSGFuZGxlcik6IHZvaWQge1xuICAgICAgICB0aGlzLmNvbXBpbGVyLm9uKGV2ZW50LCBoYW5kbGVyKVxuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFBhcnNlckluamVjdGlvbiBleHRlbmRzIEluamVjdGlvbiB7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gUGFyc2VyT3B0aW9uc1xuICAgICAqL1xuICAgIGdldE9wdGlvbnMgKCk6IG9iamVjdCB7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMgfHwge31cbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvciAoY29tcGlsZXI6IENvbXBpbGVyLCBvcHRpb25zOiBQYXJzZXJPcHRpb25zWydvcHRpb25zJ10pIHtcbiAgICAgICAgc3VwZXIoY29tcGlsZXIsIG9wdGlvbnMpXG4gICAgfVxufVxuIiwiaW1wb3J0IEZpbGUgZnJvbSAnLi9GaWxlJ1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuLi8uLi9jb25maWcnXG5pbXBvcnQgQ29tcGlsZXIgZnJvbSAnLi9Db21waWxlcidcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uLy4uL3V0aWxzJ1xuXG5pbXBvcnQge1xuICAgIFBhcnNlcixcbiAgICBNYXRjaGVyLFxuICAgIFBsdWdpbkhhbmRsZXIsXG4gICAgUGx1Z2luT3B0aW9ucyxcbiAgICBDb21waWxlckNvbmZpZ1xufSBmcm9tICcuLi8uLi8uLi90eXBlcy90eXBlcydcblxuLyoqXG4gKiBBIGNvbXBpbGF0aW9uIHRhc2tcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29tcGlsYXRpb24ge1xuICAgIGNvbmZpZzogQ29tcGlsZXJDb25maWdcbiAgICByZWFkb25seSBjb21waWxlcjogQ29tcGlsZXJcbiAgICBpZDogbnVtYmVyICAgICAgICAvLyBVbmlxdWXvvIxmb3IgZWFjaCBDb21waWxhdGlvblxuICAgIGZpbGU6IEZpbGVcbiAgICBzb3VyY2VGaWxlOiBzdHJpbmdcbiAgICBkZXN0cm95ZWQ6IGJvb2xlYW5cblxuICAgIGNvbnN0cnVjdG9yIChmaWxlOiBGaWxlIHwgc3RyaW5nLCBjb25mOiBDb21waWxlckNvbmZpZywgY29tcGlsZXI6IENvbXBpbGVyKSB7XG4gICAgICAgIHRoaXMuY29tcGlsZXIgPSBjb21waWxlclxuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZcbiAgICAgICAgdGhpcy5pZCA9IENvbXBpbGVyLmNvbXBpbGF0aW9uSWQrK1xuXG4gICAgICAgIGlmIChmaWxlIGluc3RhbmNlb2YgRmlsZSkge1xuICAgICAgICAgICAgdGhpcy5maWxlID0gZmlsZVxuICAgICAgICAgICAgdGhpcy5zb3VyY2VGaWxlID0gZmlsZS5zb3VyY2VGaWxlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNvdXJjZUZpbGUgPSBmaWxlXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmVucm9sbCgpXG4gICAgfVxuXG4gICAgYXN5bmMgcnVuICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMubG9hZEZpbGUoKVxuICAgICAgICAgICAgYXdhaXQgdGhpcy5pbnZva2VQYXJzZXJzKClcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY29tcGlsZSgpXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHV0aWxzLmxvZ2dlci5lcnJvcignQ29tcGlsZScsIGUubWVzc2FnZSwgZSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGxvYWRGaWxlICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKHRoaXMuZGVzdHJveWVkKSByZXR1cm5cblxuICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGVyLmVtaXQoJ2JlZm9yZS1sb2FkLWZpbGUnLCB0aGlzKVxuICAgICAgICBpZiAoISh0aGlzLmZpbGUgaW5zdGFuY2VvZiBGaWxlKSkge1xuICAgICAgICAgICAgdGhpcy5maWxlID0gYXdhaXQgdXRpbHMuY3JlYXRlRmlsZSh0aGlzLnNvdXJjZUZpbGUpXG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGVyLmVtaXQoJ2FmdGVyLWxvYWQtZmlsZScsIHRoaXMpXG4gICAgfVxuXG4gICAgYXN5bmMgaW52b2tlUGFyc2VycyAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICh0aGlzLmRlc3Ryb3llZCkgcmV0dXJuXG5cbiAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuZmlsZVxuICAgICAgICBjb25zdCBwYXJzZXJzID0gPFBhcnNlcltdPnRoaXMuY29tcGlsZXIucGFyc2Vycy5maWx0ZXIoKG1hdGNoZXJzOiBNYXRjaGVyKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hlcnMubWF0Y2gudGVzdChmaWxlLnNvdXJjZUZpbGUpXG4gICAgICAgIH0pLm1hcCgobWF0Y2hlcnM6IE1hdGNoZXIpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBtYXRjaGVycy5wYXJzZXJzXG4gICAgICAgIH0pLnJlZHVjZSgocHJldiwgbmV4dCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHByZXYuY29uY2F0KG5leHQpXG4gICAgICAgIH0sIFtdKVxuICAgICAgICBjb25zdCB0YXNrcyA9IHBhcnNlcnMubWFwKHBhcnNlciA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdXRpbHMuYXN5bmNGdW5jdGlvbldyYXBwZXIocGFyc2VyKVxuICAgICAgICB9KVxuXG4gICAgICAgIGF3YWl0IHRoaXMuY29tcGlsZXIuZW1pdCgnYmVmb3JlLXBhcnNlJywgdGhpcylcbiAgICAgICAgYXdhaXQgdXRpbHMuY2FsbFByb21pc2VJbkNoYWluKHRhc2tzLCBmaWxlLCB0aGlzKVxuICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGVyLmVtaXQoJ2FmdGVyLXBhcnNlJywgdGhpcylcbiAgICB9XG5cbiAgICBhc3luYyBjb21waWxlICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKHRoaXMuZGVzdHJveWVkKSByZXR1cm5cblxuICAgICAgICAvLyBJbnZva2UgRXh0cmFjdERlcGVuZGVuY3lQbHVnaW4uXG4gICAgICAgIGF3YWl0IHRoaXMuY29tcGlsZXIuZW1pdCgnYmVmb3JlLWNvbXBpbGUnLCB0aGlzKVxuICAgICAgICAvLyBEbyBzb21ldGhpbmcgZWxzZS5cbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlci5lbWl0KCdhZnRlci1jb21waWxlJywgdGhpcylcbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlci5lbWl0KCdzYXZlJywgdGhpcylcbiAgICAgICAgIXRoaXMuY29uZmlnLmFua2FDb25maWcucXVpZXQgJiYgIHV0aWxzLmxvZ2dlci5pbmZvKCdDb21waWxlJywgIHRoaXMuZmlsZS5zb3VyY2VGaWxlLnJlcGxhY2UoYCR7Y29uZmlnLmN3ZH0vYCwgJycpKVxuICAgICAgICB0aGlzLmRlc3Ryb3koKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVyIG9uIENvbXBpbGVyIGFuZCBkZXN0cm95IHRoZSBwcmV2aW91cyBvbmUgaWYgY29uZmxpY3QgYXJpc2VzLlxuICAgICAqL1xuICAgIGVucm9sbCAoKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IG9sZENvbXBpbGF0aW9uID0gQ29tcGlsZXIuY29tcGlsYXRpb25Qb29sLmdldCh0aGlzLnNvdXJjZUZpbGUpXG5cbiAgICAgICAgaWYgKG9sZENvbXBpbGF0aW9uKSB7XG4gICAgICAgICAgICBpZiAoY29uZmlnLmFua2FDb25maWcuZGVidWcpIGNvbnNvbGUubG9nKCdcYkRlc3Ryb3kgQ29tcGlsYXRpb24nLCBvbGRDb21waWxhdGlvbi5pZCwgb2xkQ29tcGlsYXRpb24uc291cmNlRmlsZSlcblxuICAgICAgICAgICAgb2xkQ29tcGlsYXRpb24uZGVzdHJveSgpXG4gICAgICAgIH1cbiAgICAgICAgQ29tcGlsZXIuY29tcGlsYXRpb25Qb29sLnNldCh0aGlzLnNvdXJjZUZpbGUsIHRoaXMpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVW5yZWdpc3RlciB0aGVtc2VsdmVzIGZyb20gQ29tcGlsZXIuXG4gICAgICovXG4gICAgZGVzdHJveSAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZGVzdHJveWVkID0gdHJ1ZVxuICAgICAgICBDb21waWxlci5jb21waWxhdGlvblBvb2wuZGVsZXRlKHRoaXMuc291cmNlRmlsZSlcbiAgICB9XG59XG4iLCJpbXBvcnQge1xuICAgIFBhcnNlckluamVjdGlvbixcbiAgICBQbHVnaW5JbmplY3Rpb25cbn0gZnJvbSAnLi9JbmplY3Rpb24nXG5pbXBvcnQgRmlsZSBmcm9tICcuL0ZpbGUnXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSdcbmltcG9ydCBjb25maWcgZnJvbSAnLi4vLi4vY29uZmlnJ1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vLi4vdXRpbHMnXG5pbXBvcnQgQ29tcGlsYXRpb24gZnJvbSAnLi9Db21waWxhdGlvbidcbmltcG9ydCBjYWxsUHJvbWlzZUluQ2hhaW4gZnJvbSAnLi4vLi4vdXRpbHMvY2FsbFByb21pc2VJbkNoYWluJ1xuaW1wb3J0IGFzeW5jRnVuY3Rpb25XcmFwcGVyIGZyb20gJy4uLy4uL3V0aWxzL2FzeW5jRnVuY3Rpb25XcmFwcGVyJ1xuXG5pbXBvcnQge1xuICAgIFBhcnNlcixcbiAgICBQYXJzZXJPcHRpb25zLFxuICAgIFBsdWdpbkhhbmRsZXIsXG4gICAgUGx1Z2luT3B0aW9ucyxcbiAgICBDb21waWxlckNvbmZpZ1xufSBmcm9tICcuLi8uLi8uLi90eXBlcy90eXBlcydcblxuY29uc3QgeyBsb2dnZXIgfSA9IHV0aWxzXG5jb25zdCBkZWwgPSByZXF1aXJlKCdkZWwnKVxuXG4vKipcbiAqIFRoZSBjb3JlIGNvbXBpbGVyLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb21waWxlciB7XG4gICAgcmVhZG9ubHkgY29uZmlnOiBDb21waWxlckNvbmZpZ1xuICAgIHB1YmxpYyBzdGF0aWMgY29tcGlsYXRpb25JZCA9IDFcbiAgICBwdWJsaWMgc3RhdGljIGNvbXBpbGF0aW9uUG9vbCA9IG5ldyBNYXA8c3RyaW5nLCBDb21waWxhdGlvbj4oKVxuICAgIHBsdWdpbnM6IHtcbiAgICAgICAgW2V2ZW50TmFtZTogc3RyaW5nXTogQXJyYXk8UGx1Z2luSGFuZGxlcj5cbiAgICB9ID0ge1xuICAgICAgICAnYmVmb3JlLWxvYWQtZmlsZSc6IFtdLFxuICAgICAgICAnYWZ0ZXItbG9hZC1maWxlJzogW10sXG4gICAgICAgICdiZWZvcmUtcGFyc2UnOiBbXSxcbiAgICAgICAgJ2FmdGVyLXBhcnNlJzogW10sXG4gICAgICAgICdiZWZvcmUtY29tcGlsZSc6IFtdLFxuICAgICAgICAnYWZ0ZXItY29tcGlsZSc6IFtdLFxuICAgICAgICAnc2F2ZSc6IFtdXG4gICAgfVxuICAgIHBhcnNlcnM6IEFycmF5PHtcbiAgICAgICAgbWF0Y2g6IFJlZ0V4cCxcbiAgICAgICAgcGFyc2VyczogQXJyYXk8UGFyc2VyPlxuICAgIH0+ID0gW11cblxuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWdcbiAgICAgICAgdGhpcy5pbml0UGFyc2VycygpXG4gICAgICAgIHRoaXMuaW5pdFBsdWdpbnMoKVxuXG4gICAgICAgIGlmIChjb25maWcuYW5rYUNvbmZpZy5kZWJ1Zykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkodGhpcy5jb25maWcsIChrZXksIHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRnVuY3Rpb24pIHJldHVybiAnW0Z1bmN0aW9uXSdcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWVcbiAgICAgICAgICAgIH0sIDQpKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXIgUGx1Z2luLlxuICAgICAqIEBwYXJhbSBldmVudFxuICAgICAqIEBwYXJhbSBoYW5kbGVyXG4gICAgICovXG4gICAgb24gKGV2ZW50OiBzdHJpbmcsIGhhbmRsZXI6IFBsdWdpbkhhbmRsZXIpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMucGx1Z2luc1tldmVudF0gPT09IHZvaWQgKDApKSB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gaG9vazogJHtldmVudH1gKVxuICAgICAgICB0aGlzLnBsdWdpbnNbZXZlbnRdLnB1c2goaGFuZGxlcilcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbnZva2UgbGlmZWN5Y2xlIGhvb2tzKFByb21pc2UgY2hhaW5pbmcpLlxuICAgICAqIEBwYXJhbSBldmVudFxuICAgICAqIEBwYXJhbSBjb21waWxhdGlvblxuICAgICAqL1xuICAgIGFzeW5jIGVtaXQgKGV2ZW50OiBzdHJpbmcsIGNvbXBpbGF0aW9uOiBDb21waWxhdGlvbik6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGlmIChjb21waWxhdGlvbi5kZXN0cm95ZWQpIHJldHVyblxuXG4gICAgICAgIGNvbnN0IHBsdWdpbnMgPSB0aGlzLnBsdWdpbnNbZXZlbnRdXG5cbiAgICAgICAgaWYgKCFwbHVnaW5zIHx8ICFwbHVnaW5zLmxlbmd0aCkgcmV0dXJuXG5cbiAgICAgICAgY29uc3QgdGFza3MgPSBwbHVnaW5zLm1hcChwbHVnaW4gPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGFzeW5jRnVuY3Rpb25XcmFwcGVyKHBsdWdpbilcbiAgICAgICAgfSlcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgY2FsbFByb21pc2VJbkNoYWluKHRhc2tzLCBjb21waWxhdGlvbilcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdXRpbHMubG9nZ2VyLmVycm9yKCdDb21waWxlJywgZS5tZXNzYWdlLCBlKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2xlYW4gZGlzdCBkaXJlY3RvcnkuXG4gICAgICovXG4gICAgYXN5bmMgY2xlYW4gKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCBkZWwoW1xuICAgICAgICAgICAgcGF0aC5qb2luKGNvbmZpZy5kaXN0RGlyLCAnKiovKicpLFxuICAgICAgICAgICAgYCEke3BhdGguam9pbihjb25maWcuZGlzdERpciwgJ2FwcC5qcycpfWAsXG4gICAgICAgICAgICBgISR7cGF0aC5qb2luKGNvbmZpZy5kaXN0RGlyLCAnYXBwLmpzb24nKX1gLFxuICAgICAgICAgICAgYCEke3BhdGguam9pbihjb25maWcuZGlzdERpciwgJ3Byb2plY3QuY29uZmlnLmpzb24nKX1gXG4gICAgICAgIF0pXG4gICAgICAgIGxvZ2dlci5zdWNjZXNzKCdDbGVhbiB3b3Jrc2hvcCcsIGNvbmZpZy5kaXN0RGlyKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV2ZXJ5dGhpbmcgc3RhcnQgZnJvbSBoZXJlLlxuICAgICAqL1xuICAgIGFzeW5jIGxhdW5jaCAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgbG9nZ2VyLmluZm8oJ0xhdW5jaGluZy4uLicpXG5cbiAgICAgICAgY29uc3QgZmlsZVBhdGhzOiBzdHJpbmdbXSA9IGF3YWl0IHV0aWxzLnNlYXJjaEZpbGVzKGAqKi8qYCwge1xuICAgICAgICAgICAgY3dkOiBjb25maWcuc3JjRGlyLFxuICAgICAgICAgICAgbm9kaXI6IHRydWUsXG4gICAgICAgICAgICBzaWxlbnQ6IGZhbHNlLFxuICAgICAgICAgICAgYWJzb2x1dGU6IHRydWUsXG4gICAgICAgICAgICBpZ25vcmU6IGNvbmZpZy5hbmthQ29uZmlnLmlnbm9yZWRcbiAgICAgICAgfSlcbiAgICAgICAgY29uc3QgZmlsZXMgPSBhd2FpdCBQcm9taXNlLmFsbChmaWxlUGF0aHMubWFwKGZpbGUgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHV0aWxzLmNyZWF0ZUZpbGUoZmlsZSlcbiAgICAgICAgfSkpXG4gICAgICAgIGNvbnN0IGNvbXBpbGF0aW9ucyA9IGZpbGVzLm1hcChmaWxlID0+IHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ29tcGlsYXRpb24oZmlsZSwgdGhpcy5jb25maWcsIHRoaXMpXG4gICAgICAgIH0pXG5cbiAgICAgICAgZnMuZW5zdXJlRGlyU3luYyhjb25maWcuZGlzdE5vZGVNb2R1bGVzKVxuXG4gICAgICAgIC8vIGF3YWl0IFByb21pc2UuYWxsKGNvbXBpbGF0aW9ucy5tYXAoY29tcGlsYXRpb24gPT4gY29tcGlsYXRpb24ubG9hZEZpbGUoKSkpXG4gICAgICAgIC8vIGF3YWl0IFByb21pc2UuYWxsKGNvbXBpbGF0aW9ucy5tYXAoY29tcGlsYXRpb24gPT4gY29tcGlsYXRpb24uaW52b2tlUGFyc2VycygpKSlcblxuICAgICAgICAvLyBUT0RPOiBHZXQgYWxsIGZpbGVzXG4gICAgICAgIC8vIENvbXBpbGVyLmNvbXBpbGF0aW9uUG9vbC52YWx1ZXMoKVxuXG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKGNvbXBpbGF0aW9ucy5tYXAoY29tcGlsYXRpb25zID0+IGNvbXBpbGF0aW9ucy5ydW4oKSkpXG4gICAgfVxuXG4gICAgd2F0Y2hGaWxlcyAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgY29uc3Qgd2F0Y2hlciA9IHV0aWxzLmdlbkZpbGVXYXRjaGVyKGAke2NvbmZpZy5zcmNEaXJ9LyoqLypgLCB7XG4gICAgICAgICAgICAgICAgZm9sbG93U3ltbGlua3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGlnbm9yZWQ6IGNvbmZpZy5hbmthQ29uZmlnLmlnbm9yZWRcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIHdhdGNoZXIub24oJ2FkZCcsIGFzeW5jIChmaWxlTmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZSA9IGF3YWl0IHV0aWxzLmNyZWF0ZUZpbGUoZmlsZU5hbWUpXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5nZW5lcmF0ZUNvbXBpbGF0aW9uKGZpbGUpLnJ1bigpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgd2F0Y2hlci5vbigndW5saW5rJywgYXN5bmMgKGZpbGVOYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBmcy51bmxpbmsoZmlsZU5hbWUucmVwbGFjZShjb25maWcuc3JjRGlyLCBjb25maWcuZGlzdERpcikpXG4gICAgICAgICAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoJ1JlbW92ZScsIGZpbGVOYW1lKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIHdhdGNoZXIub24oJ2NoYW5nZScsIGFzeW5jIChmaWxlTmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZSA9IGF3YWl0IHV0aWxzLmNyZWF0ZUZpbGUoZmlsZU5hbWUpXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5nZW5lcmF0ZUNvbXBpbGF0aW9uKGZpbGUpLnJ1bigpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgd2F0Y2hlci5vbigncmVhZHknLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBuZXcgQ29tcGlsYXRpb24uXG4gICAgICogQHBhcmFtIGZpbGVcbiAgICAgKi9cbiAgICBnZW5lcmF0ZUNvbXBpbGF0aW9uIChmaWxlOiBGaWxlKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29tcGlsYXRpb24oZmlsZSwgdGhpcy5jb25maWcsIHRoaXMpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTW91bnQgcGFyc2Vycy5cbiAgICAgKi9cbiAgICBpbml0UGFyc2VycyAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY29uZmlnLmFua2FDb25maWcucGFyc2Vycy5mb3JFYWNoKCh7IG1hdGNoLCBwYXJzZXJzIH0pID0+IHtcbiAgICAgICAgICAgIHRoaXMucGFyc2Vycy5wdXNoKHtcbiAgICAgICAgICAgICAgICBtYXRjaCxcbiAgICAgICAgICAgICAgICBwYXJzZXJzOiBwYXJzZXJzLm1hcCgoeyBwYXJzZXIsIG9wdGlvbnMgfSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VyLmJpbmQodGhpcy5nZW5lcmF0ZVBhcnNlckluamVjdGlvbihvcHRpb25zKSlcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNb3VudCBQbHVnaW5zLlxuICAgICAqL1xuICAgIGluaXRQbHVnaW5zICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jb25maWcuYW5rYUNvbmZpZy5wbHVnaW5zLmZvckVhY2goKHsgcGx1Z2luLCBvcHRpb25zIH0pID0+IHtcbiAgICAgICAgICAgIHBsdWdpbi5jYWxsKHRoaXMuZ2VuZXJhdGVQbHVnaW5JbmplY3Rpb24ob3B0aW9ucykpXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgZ2VuZXJhdGVQbHVnaW5JbmplY3Rpb24gKG9wdGlvbnM6IFBsdWdpbk9wdGlvbnNbJ29wdGlvbnMnXSk6IFBsdWdpbkluamVjdGlvbiB7XG4gICAgICAgIHJldHVybiBuZXcgUGx1Z2luSW5qZWN0aW9uKHRoaXMsIG9wdGlvbnMpXG4gICAgfVxuXG4gICAgZ2VuZXJhdGVQYXJzZXJJbmplY3Rpb24gKG9wdGlvbnM6IFBhcnNlck9wdGlvbnNbJ29wdGlvbnMnXSk6IFBhcnNlckluamVjdGlvbiB7XG4gICAgICAgIHJldHVybiBuZXcgUGFyc2VySW5qZWN0aW9uKHRoaXMsIG9wdGlvbnMpXG4gICAgfVxufVxuIiwiaW1wb3J0IENvbXBpbGVyIGZyb20gJy4vQ29tcGlsZXInXG5cbmV4cG9ydCBkZWZhdWx0IGFic3RyYWN0IGNsYXNzIENvbW1hbmQge1xuICAgIHB1YmxpYyBjb21tYW5kOiBzdHJpbmdcbiAgICBwdWJsaWMgb3B0aW9uczogQXJyYXk8QXJyYXk8c3RyaW5nPj5cbiAgICBwdWJsaWMgYWxpYXM6IHN0cmluZ1xuICAgIHB1YmxpYyB1c2FnZTogc3RyaW5nXG4gICAgcHVibGljIGRlc2NyaXB0aW9uOiBzdHJpbmdcbiAgICBwdWJsaWMgZXhhbXBsZXM6IEFycmF5PHN0cmluZz5cbiAgICBwdWJsaWMgJGNvbXBpbGVyOiBDb21waWxlclxuICAgIHB1YmxpYyBvbjoge1xuICAgICAgICBba2V5OiBzdHJpbmddOiAoLi4uYXJnOiBhbnlbXSkgPT4gdm9pZFxuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yIChjb21tYW5kOiBzdHJpbmcsIGRlc2M/OiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5jb21tYW5kID0gY29tbWFuZFxuICAgICAgICB0aGlzLm9wdGlvbnMgPSBbXVxuICAgICAgICB0aGlzLmFsaWFzID0gJydcbiAgICAgICAgdGhpcy51c2FnZSA9ICcnXG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBkZXNjXG4gICAgICAgIHRoaXMuZXhhbXBsZXMgPSBbXVxuICAgICAgICB0aGlzLm9uID0ge31cbiAgICB9XG5cbiAgICBhYnN0cmFjdCBhY3Rpb24gKHBhcmFtOiBzdHJpbmcgfCBBcnJheTxzdHJpbmc+LCBvcHRpb25zOiBPYmplY3QsIC4uLm90aGVyOiBhbnlbXSk6IFByb21pc2U8YW55PiB8IHZvaWRcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemUgYW5rYSBjb3JlIGNvbXBpbGVyXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGluaXRDb21waWxlciAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuJGNvbXBpbGVyID0gbmV3IENvbXBpbGVyKClcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgc2V0VXNhZ2UgKHVzYWdlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgdGhpcy51c2FnZSA9IHVzYWdlXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHNldE9wdGlvbnMgKC4uLm9wdGlvbnM6IEFycmF5PHN0cmluZz4pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLnB1c2gob3B0aW9ucylcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgc2V0RXhhbXBsZXMgKC4uLmV4YW1wbGU6IEFycmF5PHN0cmluZz4pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5leGFtcGxlcyA9IHRoaXMuZXhhbXBsZXMuY29uY2F0KGV4YW1wbGUpXG4gICAgfVxuXG4gICAgcHVibGljIHByaW50VGl0bGUgKC4uLmFyZzogQXJyYXk8YW55Pikge1xuICAgICAgICBjb25zb2xlLmxvZygnXFxyXFxuICcsIC4uLmFyZywgJ1xcclxcbicpXG4gICAgfVxuXG4gICAgcHVibGljIHByaW50Q29udGVudCAoLi4uYXJnOiBBcnJheTxhbnk+KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCcgICAnLCAuLi5hcmcpXG4gICAgfVxufVxuIiwiaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi4vdXRpbHMnXG5pbXBvcnQgeyBDb21tYW5kLCBDb21waWxlciB9IGZyb20gJy4uL2NvcmUnXG5cbmV4cG9ydCB0eXBlIERldkNvbW1hbmRPcHRzID0gT2JqZWN0ICYge31cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGV2Q29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgc3VwZXIoXG4gICAgICAgICAgICAnZGV2IFtwYWdlcy4uLl0nLFxuICAgICAgICAgICAgJ0RldmVsb3BtZW50IG1vZGUnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldEV4YW1wbGVzKFxuICAgICAgICAgICAgJyQgYW5rYSBkZXYnLFxuICAgICAgICAgICAgJyQgYW5rYSBkZXYgaW5kZXgnLFxuICAgICAgICAgICAgJyQgYW5rYSBkZXYgL3BhZ2VzL2xvZy9sb2cgL3BhZ2VzL3VzZXIvdXNlcidcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuJGNvbXBpbGVyID0gbmV3IENvbXBpbGVyKClcbiAgICB9XG5cbiAgICBhc3luYyBhY3Rpb24gKHBhZ2VzPzogQXJyYXk8c3RyaW5nPiwgb3B0aW9ucz86IERldkNvbW1hbmRPcHRzKSB7XG4gICAgICAgIHRoaXMuJGNvbXBpbGVyLmNvbmZpZy5hbmthQ29uZmlnLmRldk1vZGUgPSB0cnVlXG5cbiAgICAgICAgY29uc3Qgc3RhcnR1cFRpbWUgPSBEYXRlLm5vdygpXG5cbiAgICAgICAgdGhpcy5pbml0Q29tcGlsZXIoKVxuICAgICAgICBhd2FpdCB0aGlzLiRjb21waWxlci5jbGVhbigpXG4gICAgICAgIGF3YWl0IHRoaXMuJGNvbXBpbGVyLmxhdW5jaCgpXG4gICAgICAgIGF3YWl0IHRoaXMuJGNvbXBpbGVyLndhdGNoRmlsZXMoKVxuICAgICAgICBsb2dnZXIuc3VjY2VzcyhgU3RhcnR1cDogJHtEYXRlLm5vdygpIC0gc3RhcnR1cFRpbWV9bXMg8J+OiSAsIEFua2EgaXMgd2FpdGluZyBmb3IgY2hhbmdlcy4uLmApXG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuLi9jb25maWcnXG5pbXBvcnQgeyBkb3dubG9hZFJlcG8sIGxvZ2dlciB9IGZyb20gJy4uL3V0aWxzJ1xuaW1wb3J0IHsgQ29tbWFuZCwgQ29tcGlsZXIgfSBmcm9tICcuLi9jb3JlJ1xuXG5leHBvcnQgdHlwZSBJbml0Q29tbWFuZE9wdHMgPSB7XG4gICAgcmVwbzogc3RyaW5nXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEluaXRDb21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBzdXBlcihcbiAgICAgICAgICAgICdpbml0IDxwcm9qZWN0LW5hbWU+JyxcbiAgICAgICAgICAgICdJbml0aWFsaXplIG5ldyBwcm9qZWN0J1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRFeGFtcGxlcyhcbiAgICAgICAgICAgICckIGFua2EgaW5pdCcsXG4gICAgICAgICAgICBgJCBhbmthIGluaXQgYW5rYS1pbi1hY3Rpb24gLS1yZXBvPSR7Y29uZmlnLmRlZmF1bHRTY2FmZm9sZH1gXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldE9wdGlvbnMoXG4gICAgICAgICAgICAnLXIsIC0tcmVwbycsXG4gICAgICAgICAgICAndGVtcGxhdGUgcmVwb3NpdG9yeSdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuJGNvbXBpbGVyID0gbmV3IENvbXBpbGVyKClcbiAgICB9XG5cbiAgICBhc3luYyBhY3Rpb24gKHByb2plY3ROYW1lOiBzdHJpbmcsIG9wdGlvbnM/OiBJbml0Q29tbWFuZE9wdHMpIHtcbiAgICAgICAgY29uc3QgcHJvamVjdCA9IHBhdGgucmVzb2x2ZShjb25maWcuY3dkLCBwcm9qZWN0TmFtZSlcbiAgICAgICAgY29uc3QgcmVwbyA9IG9wdGlvbnMucmVwbyB8fCBjb25maWcuZGVmYXVsdFNjYWZmb2xkXG5cbiAgICAgICAgbG9nZ2VyLnN0YXJ0TG9hZGluZygnRG93bmxvYWRpbmcgdGVtcGxhdGUuLi4nKVxuICAgICAgICBhd2FpdCBkb3dubG9hZFJlcG8ocmVwbywgcHJvamVjdClcbiAgICAgICAgbG9nZ2VyLnN0b3BMb2FkaW5nKClcbiAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoJ0RvbmUnLCBwcm9qZWN0KVxuICAgIH1cbn1cbiIsImltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uL3V0aWxzJ1xuaW1wb3J0IHsgQ29tbWFuZCwgQ29tcGlsZXIgfSBmcm9tICcuLi9jb3JlJ1xuXG5leHBvcnQgdHlwZSBEZXZDb21tYW5kT3B0cyA9IE9iamVjdCAmIHt9XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERldkNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHN1cGVyKFxuICAgICAgICAgICAgJ3Byb2QnLFxuICAgICAgICAgICAgJ1Byb2R1Y3Rpb24gbW9kZSdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0RXhhbXBsZXMoXG4gICAgICAgICAgICAnJCBhbmthIHByb2QnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLiRjb21waWxlciA9IG5ldyBDb21waWxlcigpXG4gICAgfVxuXG4gICAgYXN5bmMgYWN0aW9uIChwYWdlcz86IEFycmF5PHN0cmluZz4sIG9wdGlvbnM/OiBEZXZDb21tYW5kT3B0cykge1xuICAgICAgICB0aGlzLiRjb21waWxlci5jb25maWcuYW5rYUNvbmZpZy5kZXZNb2RlID0gZmFsc2VcblxuICAgICAgICBjb25zdCBzdGFydHVwVGltZSA9IERhdGUubm93KClcblxuICAgICAgICB0aGlzLmluaXRDb21waWxlcigpXG4gICAgICAgIGF3YWl0IHRoaXMuJGNvbXBpbGVyLmNsZWFuKClcbiAgICAgICAgYXdhaXQgdGhpcy4kY29tcGlsZXIubGF1bmNoKClcbiAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoYERvbmU6ICR7RGF0ZS5ub3coKSAtIHN0YXJ0dXBUaW1lfW1zYCwgJ0hhdmUgYSBuaWNlIGRheSDwn46JICEnKVxuICAgIH1cbn1cbiIsImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJ1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IGNvbmZpZyAgZnJvbSAnLi4vY29uZmlnJ1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vdXRpbHMnXG5pbXBvcnQgeyBDb21tYW5kLCBDb21waWxlciB9IGZyb20gJy4uL2NvcmUnXG5pbXBvcnQgeyBkZWZhdWx0IGFzIEZzRWRpdG9yQ29uc3RydWN0b3IgfSBmcm9tICcuLi91dGlscy9lZGl0b3InXG5cbmltcG9ydCB7XG4gICAgQ29tcGlsZXJDb25maWdcbn0gZnJvbSAnLi4vLi4vdHlwZXMvdHlwZXMnXG5cbmNvbnN0IHsgbG9nZ2VyLCBGc0VkaXRvciB9ID0gdXRpbHNcblxuZXhwb3J0IHR5cGUgQ3JlYXRlUGFnZUNvbW1hbmRPcHRzID0ge1xuICAgIHJvb3Q6IHN0cmluZ1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDcmVhdGVQYWdlQ29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgc3VwZXIoXG4gICAgICAgICAgICAnbmV3LXBhZ2UgPHBhZ2VzLi4uPicsXG4gICAgICAgICAgICAnQ3JlYXRlIGEgbWluaXByb2dyYW0gcGFnZSdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0RXhhbXBsZXMoXG4gICAgICAgICAgICAnJCBhbmthIG5ldy1wYWdlIGluZGV4JyxcbiAgICAgICAgICAgICckIGFua2EgbmV3LXBhZ2UgL3BhZ2VzL2luZGV4L2luZGV4JyxcbiAgICAgICAgICAgICckIGFua2EgbmV3LXBhZ2UgL3BhZ2VzL2luZGV4L2luZGV4IC0tcm9vdD1wYWNrYWdlQSdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0T3B0aW9ucyhcbiAgICAgICAgICAgICctciwgLS1yb290IDxzdWJwYWNrYWdlPicsXG4gICAgICAgICAgICAnc2F2ZSBwYWdlIHRvIHN1YnBhY2thZ2VzJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy4kY29tcGlsZXIgPSBuZXcgQ29tcGlsZXIoKVxuICAgIH1cblxuICAgIGFzeW5jIGFjdGlvbiAocGFnZXM/OiBBcnJheTxzdHJpbmc+LCBvcHRpb25zPzogQ3JlYXRlUGFnZUNvbW1hbmRPcHRzKSB7XG4gICAgICAgIGNvbnN0IHJvb3QgPSBvcHRpb25zLnJvb3RcbiAgICAgICAgY29uc3QgZWRpdG9yID0gbmV3IEZzRWRpdG9yKClcblxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChwYWdlcy5tYXAocGFnZSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZW5lcmF0ZVBhZ2UocGFnZSwgZWRpdG9yLCByb290KVxuICAgICAgICB9KSlcblxuICAgICAgICBsb2dnZXIuc3VjY2VzcygnRG9uZScsICdIYXZlIGEgbmljZSBkYXkg8J+OiSAhJylcbiAgICB9XG5cbiAgICBhc3luYyBnZW5lcmF0ZVBhZ2UgKHBhZ2U6IHN0cmluZywgZWRpdG9yOiBGc0VkaXRvckNvbnN0cnVjdG9yLCByb290Pzogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIGFua2FDb25maWcsXG4gICAgICAgICAgICBwcm9qZWN0Q29uZmlnXG4gICAgICAgIH0gPSA8Q29tcGlsZXJDb25maWc+Y29uZmlnXG4gICAgICAgIGNvbnN0IEN3ZFJlZ0V4cCA9IG5ldyBSZWdFeHAoYF4ke2NvbmZpZy5jd2R9YClcbiAgICAgICAgY29uc3QgcGFnZVBhdGggPSBwYWdlLnNwbGl0KHBhdGguc2VwKS5sZW5ndGggPT09IDEgP1xuICAgICAgICAgICAgcGF0aC5qb2luKGFua2FDb25maWcucGFnZXMsIHBhZ2UsIHBhZ2UpIDogcGFnZVxuICAgICAgICBjb25zdCBwYWdlTmFtZSA9IHBhdGguYmFzZW5hbWUocGFnZVBhdGgpXG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSB7XG4gICAgICAgICAgICBwYWdlTmFtZSxcbiAgICAgICAgICAgIHRpbWU6IG5ldyBEYXRlKCkudG9Mb2NhbGVTdHJpbmcoKVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGFwcENvbmZpZ1BhdGggPSBwYXRoLmpvaW4oY29uZmlnLnNyY0RpciwgJ2FwcC5qc29uJylcbiAgICAgICAgbGV0IGFic29sdXRlUGF0aCA9IGNvbmZpZy5zcmNEaXJcblxuICAgICAgICBpZiAocm9vdCkge1xuICAgICAgICAgICAgY29uc3Qgcm9vdFBhdGggPSBwYXRoLmpvaW4oYW5rYUNvbmZpZy5zdWJQYWNrYWdlcywgcm9vdClcbiAgICAgICAgICAgIGNvbnN0IHN1YlBrZyA9IHByb2plY3RDb25maWcuc3ViUGFja2FnZXMuZmluZCgocGtnOiBhbnkpID0+IHBrZy5yb290ID09PSByb290UGF0aClcblxuICAgICAgICAgICAgYWJzb2x1dGVQYXRoID0gcGF0aC5qb2luKGFic29sdXRlUGF0aCwgYW5rYUNvbmZpZy5zdWJQYWNrYWdlcywgcm9vdCwgcGFnZVBhdGgpXG5cbiAgICAgICAgICAgIGlmIChzdWJQa2cpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3ViUGtnLnBhZ2VzLmluY2x1ZGVzKHBhZ2VQYXRoKSkge1xuICAgICAgICAgICAgICAgICAgICBsb2dnZXIud2FybignVGhlIHBhZ2UgYWxyZWFkeSBleGlzdHMnLCBhYnNvbHV0ZVBhdGgpXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHN1YlBrZy5wYWdlcy5wdXNoKHBhZ2VQYXRoKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcHJvamVjdENvbmZpZy5zdWJQYWNrYWdlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgcm9vdDogcm9vdFBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHBhZ2VzOiBbcGFnZVBhdGhdXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFic29sdXRlUGF0aCA9IHBhdGguam9pbihhYnNvbHV0ZVBhdGgsIHBhZ2VQYXRoKVxuXG4gICAgICAgICAgICBpZiAocHJvamVjdENvbmZpZy5wYWdlcy5pbmNsdWRlcyhwYWdlUGF0aCkpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIud2FybignVGhlIHBhZ2UgYWxyZWFkeSBleGlzdHMnLCBhYnNvbHV0ZVBhdGgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHByb2plY3RDb25maWcucGFnZXMucHVzaChwYWdlUGF0aClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRwbHMgPSBhd2FpdCB1dGlscy5zZWFyY2hGaWxlcyhgJHtwYXRoLmpvaW4oYW5rYUNvbmZpZy50ZW1wbGF0ZS5wYWdlLCAnKi4qJyl9YClcblxuICAgICAgICB0cGxzLmZvckVhY2godHBsID0+IHtcbiAgICAgICAgICAgIGVkaXRvci5jb3B5KFxuICAgICAgICAgICAgICAgIHRwbCxcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKGFic29sdXRlUGF0aCksIHBhZ2VOYW1lICsgcGF0aC5leHRuYW1lKHRwbCkpLFxuICAgICAgICAgICAgICAgIGNvbnRleHRcbiAgICAgICAgICAgIClcbiAgICAgICAgfSlcbiAgICAgICAgZWRpdG9yLndyaXRlSlNPTihhcHBDb25maWdQYXRoLCBwcm9qZWN0Q29uZmlnLCBudWxsLCA0KVxuXG4gICAgICAgIGF3YWl0IGVkaXRvci5zYXZlKClcblxuICAgICAgICBsb2dnZXIuc3VjY2VzcygnQ3JlYXRlIHBhZ2UnLCBhYnNvbHV0ZVBhdGgucmVwbGFjZShDd2RSZWdFeHAsICcnKSlcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcydcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBjb25maWcgIGZyb20gJy4uL2NvbmZpZydcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uL3V0aWxzJ1xuaW1wb3J0IHsgQ29tbWFuZCwgQ29tcGlsZXIgfSBmcm9tICcuLi9jb3JlJ1xuaW1wb3J0IHsgZGVmYXVsdCBhcyBGc0VkaXRvckNvbnN0cnVjdG9yIH0gZnJvbSAnLi4vdXRpbHMvZWRpdG9yJ1xuXG5pbXBvcnQge1xuICAgIENvbXBpbGVyQ29uZmlnXG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5jb25zdCB7IGxvZ2dlciwgRnNFZGl0b3IgfSA9IHV0aWxzXG5cbmV4cG9ydCB0eXBlIENyZWF0ZUNvbXBvbmVudENvbW1hbmRPcHRzID0ge1xuICAgIHJvb3Q6IHN0cmluZ1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDcmVhdGVDb21wb25lbnRDb21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBzdXBlcihcbiAgICAgICAgICAgICduZXctY21wdCA8Y29tcG9uZW50cy4uLj4nLFxuICAgICAgICAgICAgJ0NyZWF0ZSBhIG1pbmlwcm9ncmFtIGNvbXBvbmVudCdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0RXhhbXBsZXMoXG4gICAgICAgICAgICAnJCBhbmthIG5ldy1jbXB0IGJ1dHRvbicsXG4gICAgICAgICAgICAnJCBhbmthIG5ldy1jbXB0IC9jb21wb25lbnRzL2J1dHRvbi9idXR0b24nLFxuICAgICAgICAgICAgJyQgYW5rYSBuZXctY21wdCAvY29tcG9uZW50cy9idXR0b24vYnV0dG9uIC0tZ2xvYmFsJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRPcHRpb25zKFxuICAgICAgICAgICAgJy1yLCAtLXJvb3QgPHN1YnBhY2thZ2U+JyxcbiAgICAgICAgICAgICdzYXZlIGNvbXBvbmVudCB0byBzdWJwYWNrYWdlcydcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuJGNvbXBpbGVyID0gbmV3IENvbXBpbGVyKClcbiAgICB9XG5cbiAgICBhc3luYyBhY3Rpb24gKGNvbXBvbmVudHM/OiBBcnJheTxzdHJpbmc+LCBvcHRpb25zPzogQ3JlYXRlQ29tcG9uZW50Q29tbWFuZE9wdHMpIHtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgcm9vdFxuICAgICAgICB9ID0gb3B0aW9uc1xuICAgICAgICBjb25zdCBlZGl0b3IgPSBuZXcgRnNFZGl0b3IoKVxuXG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKGNvbXBvbmVudHMubWFwKGNvbXBvbmVudCA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZW5lcmF0ZUNvbXBvbmVudChjb21wb25lbnQsIGVkaXRvciwgcm9vdClcbiAgICAgICAgfSkpXG5cbiAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoJ0RvbmUnLCAnSGF2ZSBhIG5pY2UgZGF5IPCfjokgIScpXG4gICAgfVxuXG4gICAgYXN5bmMgZ2VuZXJhdGVDb21wb25lbnQgKGNvbXBvbmVudDogc3RyaW5nLCBlZGl0b3I6IEZzRWRpdG9yQ29uc3RydWN0b3IsIHJvb3Q/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgYW5rYUNvbmZpZyxcbiAgICAgICAgICAgIHByb2plY3RDb25maWdcbiAgICAgICAgfSA9IDxDb21waWxlckNvbmZpZz5jb25maWdcbiAgICAgICAgY29uc3QgQ3dkUmVnRXhwID0gbmV3IFJlZ0V4cChgXiR7Y29uZmlnLmN3ZH1gKVxuICAgICAgICBjb25zdCBjb21wb25lbnRQYXRoID0gY29tcG9uZW50LnNwbGl0KHBhdGguc2VwKS5sZW5ndGggPT09IDEgP1xuICAgICAgICAgICAgcGF0aC5qb2luKGFua2FDb25maWcuY29tcG9uZW50cywgY29tcG9uZW50LCBjb21wb25lbnQpIDpcbiAgICAgICAgICAgIGNvbXBvbmVudFxuICAgICAgICBjb25zdCBjb21wb25lbnROYW1lID0gcGF0aC5iYXNlbmFtZShjb21wb25lbnRQYXRoKVxuICAgICAgICBjb25zdCBjb250ZXh0ID0ge1xuICAgICAgICAgICAgY29tcG9uZW50TmFtZSxcbiAgICAgICAgICAgIHRpbWU6IG5ldyBEYXRlKCkudG9Mb2NhbGVTdHJpbmcoKVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGFic29sdXRlUGF0aCA9IHJvb3QgP1xuICAgICAgICAgICAgcGF0aC5qb2luKGNvbmZpZy5zcmNEaXIsIGFua2FDb25maWcuc3ViUGFja2FnZXMsIHJvb3QsIGNvbXBvbmVudFBhdGgpIDpcbiAgICAgICAgICAgIHBhdGguam9pbihjb25maWcuc3JjRGlyLCBjb21wb25lbnRQYXRoKVxuXG4gICAgICAgIGlmIChmcy5leGlzdHNTeW5jKHBhdGguam9pbihwYXRoLmRpcm5hbWUoYWJzb2x1dGVQYXRoKSwgY29tcG9uZW50TmFtZSArICcuanNvbicpKSkge1xuICAgICAgICAgICAgbG9nZ2VyLndhcm4oJ1RoZSBjb21wb25lbnQgYWxyZWFkeSBleGlzdHMnLCBhYnNvbHV0ZVBhdGgpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRwbHMgPSBhd2FpdCB1dGlscy5zZWFyY2hGaWxlcyhgJHtwYXRoLmpvaW4oYW5rYUNvbmZpZy50ZW1wbGF0ZS5jb21wb25lbnQsICcqLionKX1gKVxuXG4gICAgICAgIHRwbHMuZm9yRWFjaCh0cGwgPT4ge1xuICAgICAgICAgICAgZWRpdG9yLmNvcHkoXG4gICAgICAgICAgICAgICAgdHBsLFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwYXRoLmRpcm5hbWUoYWJzb2x1dGVQYXRoKSwgY29tcG9uZW50TmFtZSArIHBhdGguZXh0bmFtZSh0cGwpKSxcbiAgICAgICAgICAgICAgICBjb250ZXh0XG4gICAgICAgICAgICApXG4gICAgICAgIH0pXG5cbiAgICAgICAgYXdhaXQgZWRpdG9yLnNhdmUoKVxuXG4gICAgICAgIGxvZ2dlci5zdWNjZXNzKCdDcmVhdGUgY29tcG9uZW50JywgYWJzb2x1dGVQYXRoLnJlcGxhY2UoQ3dkUmVnRXhwLCAnJykpXG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgY29uZmlnICBmcm9tICcuLi9jb25maWcnXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi91dGlscydcbmltcG9ydCB7IENvbW1hbmQsIENvbXBpbGVyIH0gZnJvbSAnLi4vY29yZSdcbmltcG9ydCB7IGRlZmF1bHQgYXMgRnNFZGl0b3JDb25zdHJ1Y3RvciB9IGZyb20gJy4uL3V0aWxzL2VkaXRvcidcblxuaW1wb3J0IHtcbiAgICBDb21waWxlckNvbmZpZ1xufSBmcm9tICcuLi8uLi90eXBlcy90eXBlcydcblxuY29uc3QgeyBsb2dnZXIsIEZzRWRpdG9yIH0gPSB1dGlsc1xuXG5leHBvcnQgdHlwZSBFbnJvbGxDb21wb25lbnRDb21tYW5kT3B0cyA9IHtcbiAgICBwYWdlOiBzdHJpbmdcbiAgICBnbG9iYWw6IHN0cmluZ1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBFbnJvbGxDb21wb25lbnRDb21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBzdXBlcihcbiAgICAgICAgICAgICdlbnJvbGwgPGNvbXBvbmVudHMuLi4+JyxcbiAgICAgICAgICAgICdFbnJvbGwgYSBtaW5pcHJvZ3JhbSBjb21wb25lbnQnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldEV4YW1wbGVzKFxuICAgICAgICAgICAgJyQgYW5rYSBlbnJvbGwgYnV0dG9uIC0tZ2xvYmFsJyxcbiAgICAgICAgICAgICckIGFua2EgZW5yb2xsIC9jb21wb25lbnRzL2J1dHRvbi9idXR0b24gLS1nbG9iYWwnLFxuICAgICAgICAgICAgJyQgYW5rYSBlbnJvbGwgL2NvbXBvbmVudHMvYnV0dG9uL2J1dHRvbiAtLXBhZ2U9L3BhZ2VzL2luZGV4L2luZGV4J1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRPcHRpb25zKFxuICAgICAgICAgICAgJy1wLCAtLXBhZ2UgPHBhZ2U+JyxcbiAgICAgICAgICAgICd3aGljaCBwYWdlIGNvbXBvbmVudHMgZW5yb2xsIHRvJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRPcHRpb25zKFxuICAgICAgICAgICAgJy1nLCAtLWdsb2JhbCcsXG4gICAgICAgICAgICAnZW5yb2xsIGNvbXBvbmVudHMgdG8gYXBwLmpzb24nXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLiRjb21waWxlciA9IG5ldyBDb21waWxlcigpXG4gICAgfVxuXG4gICAgYXN5bmMgYWN0aW9uIChjb21wb25lbnRzPzogQXJyYXk8c3RyaW5nPiwgb3B0aW9ucz86IEVucm9sbENvbXBvbmVudENvbW1hbmRPcHRzKSB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIHBhZ2UsXG4gICAgICAgICAgICBnbG9iYWxcbiAgICAgICAgfSA9IG9wdGlvbnNcbiAgICAgICAgY29uc3QgZWRpdG9yID0gbmV3IEZzRWRpdG9yKClcblxuICAgICAgICBpZiAoIWdsb2JhbCAmJiAhcGFnZSkge1xuICAgICAgICAgICAgbG9nZ2VyLndhcm4oJ1doZXJlIGNvbXBvbmVudHMgZW5yb2xsIHRvPycpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKGNvbXBvbmVudHMubWFwKGNvbXBvbmVudCA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5lbnJvbGxDb21wb25lbnQoY29tcG9uZW50LCBlZGl0b3IsIGdsb2JhbCA/ICcnIDogcGFnZSlcbiAgICAgICAgfSkpXG5cbiAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoJ0RvbmUnLCAnSGF2ZSBhIG5pY2UgZGF5IPCfjokgIScpXG4gICAgfVxuXG4gICAgYXN5bmMgZW5yb2xsQ29tcG9uZW50IChjb21wb25lbnQ6IHN0cmluZywgZWRpdG9yOiBGc0VkaXRvckNvbnN0cnVjdG9yLCBwYWdlPzogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIGFua2FDb25maWcsXG4gICAgICAgICAgICBwcm9qZWN0Q29uZmlnXG4gICAgICAgIH0gPSA8Q29tcGlsZXJDb25maWc+Y29uZmlnXG4gICAgICAgIGNvbnN0IEN3ZFJlZ0V4cCA9IG5ldyBSZWdFeHAoYF4ke2NvbmZpZy5jd2R9YClcbiAgICAgICAgY29uc3QgY29tcG9uZW50UGF0aCA9IGNvbXBvbmVudC5zcGxpdChwYXRoLnNlcCkubGVuZ3RoID09PSAxID9cbiAgICAgICAgICAgIHBhdGguam9pbihhbmthQ29uZmlnLmNvbXBvbmVudHMsIGNvbXBvbmVudCwgY29tcG9uZW50KSA6XG4gICAgICAgICAgICBjb21wb25lbnRcbiAgICAgICAgY29uc3QgY29tcG9uZW50TmFtZSA9IGNvbXBvbmVudFBhdGguc3BsaXQocGF0aC5zZXApLnBvcCgpXG4gICAgICAgIGNvbnN0IGFwcENvbmZpZ1BhdGggPSBwYXRoLmpvaW4oY29uZmlnLnNyY0RpciwgJ2FwcC5qc29uJylcbiAgICAgICAgY29uc3QgY29tcG9uZW50QWJzUGF0aCA9IHBhdGguam9pbihjb25maWcuc3JjRGlyLCBjb21wb25lbnRQYXRoKVxuXG4gICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKGNvbXBvbmVudEFic1BhdGgpLCBjb21wb25lbnROYW1lICsgJy5qc29uJykpKSB7XG4gICAgICAgICAgICBsb2dnZXIud2FybignQ29tcG9uZW50IGRvc2Ugbm90IGV4aXN0cycsIGNvbXBvbmVudEFic1BhdGgpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwYWdlKSB7XG4gICAgICAgICAgICBjb25zdCBwYWdlQWJzUGF0aCA9IHBhdGguam9pbihjb25maWcuc3JjRGlyLCBwYWdlKVxuICAgICAgICAgICAgY29uc3QgcGFnZUpzb25QYXRoID0gcGF0aC5qb2luKHBhdGguZGlybmFtZShwYWdlQWJzUGF0aCksIHBhdGguYmFzZW5hbWUocGFnZUFic1BhdGgpICsgJy5qc29uJylcbiAgICAgICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhwYWdlSnNvblBhdGgpKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLndhcm4oJ1BhZ2UgZG9zZSBub3QgZXhpc3RzJywgcGFnZUFic1BhdGgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHBhZ2VKc29uID0gPGFueT5KU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhwYWdlSnNvblBhdGgsIHtcbiAgICAgICAgICAgICAgICBlbmNvZGluZzogJ3V0ZjgnXG4gICAgICAgICAgICB9KSB8fCAne30nKVxuXG4gICAgICAgICAgICB0aGlzLmVuc3VyZVVzaW5nQ29tcG9uZW50cyhwYWdlSnNvbilcblxuICAgICAgICAgICAgaWYgKHBhZ2VKc29uLnVzaW5nQ29tcG9uZW50c1tjb21wb25lbnROYW1lXSkge1xuICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKCdDb21wb25lbnQgYWxyZWFkeSBlbnJvbGxlZCBpbicsIHBhZ2VBYnNQYXRoKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwYWdlSnNvbi51c2luZ0NvbXBvbmVudHNbY29tcG9uZW50TmFtZV0gPSBwYXRoLnJlbGF0aXZlKHBhdGguZGlybmFtZShwYWdlQWJzUGF0aCksIGNvbXBvbmVudEFic1BhdGgpXG4gICAgICAgICAgICBlZGl0b3Iud3JpdGVKU09OKHBhZ2VKc29uUGF0aCwgcGFnZUpzb24pXG4gICAgICAgICAgICBhd2FpdCBlZGl0b3Iuc2F2ZSgpXG5cbiAgICAgICAgICAgIGxvZ2dlci5zdWNjZXNzKGBFbnJvbGwgJHtjb21wb25lbnRQYXRofSBpbmAsIHBhZ2VBYnNQYXRoLnJlcGxhY2UoQ3dkUmVnRXhwLCAnJykpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmVuc3VyZVVzaW5nQ29tcG9uZW50cyhwcm9qZWN0Q29uZmlnKVxuXG4gICAgICAgICAgICBpZiAocHJvamVjdENvbmZpZy51c2luZ0NvbXBvbmVudHNbY29tcG9uZW50TmFtZV0pIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIud2FybignQ29tcG9uZW50IGFscmVhZHkgZW5yb2xsZWQgaW4nLCAnYXBwLmpzb24nKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcm9qZWN0Q29uZmlnLnVzaW5nQ29tcG9uZW50c1tjb21wb25lbnROYW1lXSA9IHBhdGgucmVsYXRpdmUocGF0aC5kaXJuYW1lKGFwcENvbmZpZ1BhdGgpLCBjb21wb25lbnRBYnNQYXRoKVxuICAgICAgICAgICAgZWRpdG9yLndyaXRlSlNPTihhcHBDb25maWdQYXRoLCBwcm9qZWN0Q29uZmlnKVxuICAgICAgICAgICAgYXdhaXQgZWRpdG9yLnNhdmUoKVxuXG4gICAgICAgICAgICBsb2dnZXIuc3VjY2VzcyhgRW5yb2xsICR7Y29tcG9uZW50UGF0aH0gaW5gLCAnYXBwLmpzb24nKVxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBlbnN1cmVVc2luZ0NvbXBvbmVudHMgKGNvbmZpZzogYW55KSB7XG4gICAgICAgIGlmICghY29uZmlnLnVzaW5nQ29tcG9uZW50cykge1xuICAgICAgICAgICAgY29uZmlnLnVzaW5nQ29tcG9uZW50cyA9IHt9XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJpbXBvcnQgRGV2IGZyb20gJy4vY29tbWFuZHMvZGV2J1xuaW1wb3J0IEluaXQgZnJvbSAnLi9jb21tYW5kcy9pbml0J1xuaW1wb3J0IFByb2QgZnJvbSAnLi9jb21tYW5kcy9wcm9kJ1xuaW1wb3J0IENyZWF0ZVBhZ2UgZnJvbSAnLi9jb21tYW5kcy9jcmVhdGVQYWdlJ1xuaW1wb3J0IENyZWF0ZUNvbXBvbmVudCBmcm9tICcuL2NvbW1hbmRzL2NyZWF0ZUNvbXBvbmVudCdcbmltcG9ydCBFbnJvbGxDb21wb25lbnQgZnJvbSAnLi9jb21tYW5kcy9lbnJvbGxDb21wb25lbnQnXG5cbmV4cG9ydCBkZWZhdWx0IFtcbiAgICBuZXcgUHJvZCgpLFxuICAgIG5ldyBEZXYoKSxcbiAgICBuZXcgSW5pdCgpLFxuICAgIG5ldyBDcmVhdGVQYWdlKCksXG4gICAgbmV3IENyZWF0ZUNvbXBvbmVudCgpLFxuICAgIG5ldyBFbnJvbGxDb21wb25lbnQoKVxuXVxuIiwiaW1wb3J0IGNvbmZpZyBmcm9tICcuL2NvbmZpZydcbmltcG9ydCAqIGFzIHNlbXZlciBmcm9tICdzZW12ZXInXG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tICcuL3V0aWxzJ1xuaW1wb3J0ICogYXMgY2ZvbnRzIGZyb20gJ2Nmb250cydcbmltcG9ydCBjb21tYW5kcyBmcm9tICcuL2NvbW1hbmRzJ1xuaW1wb3J0IENvbXBpbGVyIGZyb20gJy4vY29yZS9jbGFzcy9Db21waWxlcidcblxuY29uc3QgY29tbWFuZGVyID0gcmVxdWlyZSgnY29tbWFuZGVyJylcbmNvbnN0IHBrZ0pzb24gPSByZXF1aXJlKCcuLi9wYWNrYWdlLmpzb24nKVxuXG5yZXF1aXJlKCdzb3VyY2UtbWFwLXN1cHBvcnQnKS5pbnN0YWxsKClcblxuaWYgKCFzZW12ZXIuc2F0aXNmaWVzKHNlbXZlci5jbGVhbihwcm9jZXNzLnZlcnNpb24pLCBwa2dKc29uLmVuZ2luZXMubm9kZSkpIHtcbiAgICBsb2dnZXIuZXJyb3IoJ1JlcXVpcmVkIG5vZGUgdmVyc2lvbiAnICsgcGtnSnNvbi5lbmdpbmVzLm5vZGUpXG4gICAgcHJvY2Vzcy5leGl0KDEpXG59XG5cbmlmIChwcm9jZXNzLmFyZ3YuaW5kZXhPZignLS1kZWJ1ZycpID4gLTEpIHtcbiAgICBjb25maWcuYW5rYUNvbmZpZy5kZWJ1ZyA9IHRydWVcbn1cblxuaWYgKHByb2Nlc3MuYXJndi5pbmRleE9mKCctLXNsaWVudCcpID4gLTEpIHtcbiAgICBjb25maWcuYW5rYUNvbmZpZy5xdWlldCA9IHRydWVcbn1cblxuY29tbWFuZGVyXG4gICAgLm9wdGlvbignLS1kZWJ1ZycsICdlbmFibGUgZGVidWcgbW9kZScpXG4gICAgLm9wdGlvbignLS1xdWlldCcsICdoaWRlIGNvbXBpbGUgbG9nJylcbiAgICAudmVyc2lvbihwa2dKc29uLnZlcnNpb24pXG4gICAgLnVzYWdlKCc8Y29tbWFuZD4gW29wdGlvbnNdJylcblxuY29tbWFuZHMuZm9yRWFjaChjb21tYW5kID0+IHtcbiAgICBjb25zdCBjbWQgPSBjb21tYW5kZXIuY29tbWFuZChjb21tYW5kLmNvbW1hbmQpXG5cbiAgICBpZiAoY29tbWFuZC5kZXNjcmlwdGlvbikge1xuICAgICAgICBjbWQuZGVzY3JpcHRpb24oY29tbWFuZC5kZXNjcmlwdGlvbilcbiAgICB9XG5cbiAgICBpZiAoY29tbWFuZC51c2FnZSkge1xuICAgICAgICBjbWQudXNhZ2UoY29tbWFuZC51c2FnZSlcbiAgICB9XG5cbiAgICBpZiAoY29tbWFuZC5vbikge1xuICAgICAgICBmb3IgKGxldCBrZXkgaW4gY29tbWFuZC5vbikge1xuICAgICAgICAgICAgY21kLm9uKGtleSwgY29tbWFuZC5vbltrZXldKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNvbW1hbmQub3B0aW9ucykge1xuICAgICAgICBjb21tYW5kLm9wdGlvbnMuZm9yRWFjaCgob3B0aW9uOiBbYW55LCBhbnksIGFueSwgYW55XSkgPT4ge1xuICAgICAgICAgICAgY21kLm9wdGlvbiguLi5vcHRpb24pXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgaWYgKGNvbW1hbmQuYWN0aW9uKSB7XG4gICAgICAgIGNtZC5hY3Rpb24oYXN5bmMgKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgY29tbWFuZC5hY3Rpb24oLi4uYXJncylcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcihlcnIubWVzc2FnZSB8fCAnJylcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgaWYgKGNvbW1hbmQuZXhhbXBsZXMpIHtcbiAgICAgICAgY21kLm9uKCctLWhlbHAnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb21tYW5kLnByaW50VGl0bGUoJ0V4YW1wbGVzOicpXG4gICAgICAgICAgICBjb21tYW5kLmV4YW1wbGVzLmZvckVhY2goZXhhbXBsZSA9PiB7XG4gICAgICAgICAgICAgICAgY29tbWFuZC5wcmludENvbnRlbnQoZXhhbXBsZSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgfVxufSlcblxuaWYgKHByb2Nlc3MuYXJndi5sZW5ndGggPT09IDIpIHtcbiAgICBjb25zdCBMb2dvID0gY2ZvbnRzLnJlbmRlcignQW5rYScsIHtcbiAgICAgICAgZm9udDogJ3NpbXBsZScsXG4gICAgICAgIGNvbG9yczogWydncmVlbkJyaWdodCddXG4gICAgfSlcblxuICAgIGNvbnNvbGUubG9nKExvZ28uc3RyaW5nLnJlcGxhY2UoLyhcXHMrKSQvLCBgICR7cGtnSnNvbi52ZXJzaW9ufVxcclxcbmApKVxuICAgIGNvbW1hbmRlci5vdXRwdXRIZWxwKClcbn1cblxuY29tbWFuZGVyLnBhcnNlKHByb2Nlc3MuYXJndilcblxuZXhwb3J0IGRlZmF1bHQgQ29tcGlsZXJcbiJdLCJuYW1lcyI6WyJwYXRoLmpvaW4iLCJmcy5leGlzdHNTeW5jIiwic2Fzcy5yZW5kZXIiLCJwb3N0Y3NzIiwidHNsaWJfMS5fX2Fzc2lnbiIsImJhYmVsLnRyYW5zZm9ybVN5bmMiLCJmcy5lbnN1cmVGaWxlIiwicG9zdGNzcy5wbHVnaW4iLCJpbnRlcm5hbFBsdWdpbnMiLCJ0cy50cmFuc3BpbGVNb2R1bGUiLCJiYWJlbC5wYXJzZSIsInBhdGgiLCJwYXRoLmRpcm5hbWUiLCJwYXRoLnJlbGF0aXZlIiwiY3dkIiwiYW5rYURlZmF1bHRDb25maWcudGVtcGxhdGUiLCJhbmthRGVmYXVsdENvbmZpZy5wYXJzZXJzIiwiYW5rYURlZmF1bHRDb25maWcucGx1Z2lucyIsImFua2FEZWZhdWx0Q29uZmlnLmlnbm9yZWQiLCJwYXRoLnJlc29sdmUiLCJjdXN0b21Db25maWciLCJzeXN0ZW0uc3JjRGlyIiwiZnMucmVhZEZpbGUiLCJmcy53cml0ZUZpbGUiLCJwYXRoLmJhc2VuYW1lIiwicGF0aC5leHRuYW1lIiwiZnMucmVhZEZpbGVTeW5jIiwibG9nIiwiY2hva2lkYXIud2F0Y2giLCJ0c2xpYl8xLl9fZXh0ZW5kcyIsInV0aWxzLmxvZ2dlciIsInV0aWxzLmNyZWF0ZUZpbGUiLCJ1dGlscy5hc3luY0Z1bmN0aW9uV3JhcHBlciIsInV0aWxzLmNhbGxQcm9taXNlSW5DaGFpbiIsImxvZ2dlciIsInV0aWxzLnNlYXJjaEZpbGVzIiwiZnMuZW5zdXJlRGlyU3luYyIsInV0aWxzLmdlbkZpbGVXYXRjaGVyIiwiZnMudW5saW5rIiwiZG93bmxvYWRSZXBvIiwiRnNFZGl0b3IiLCJwYXRoLnNlcCIsImNvbmZpZyIsIlByb2QiLCJEZXYiLCJJbml0IiwiQ3JlYXRlUGFnZSIsIkNyZWF0ZUNvbXBvbmVudCIsIkVucm9sbENvbXBvbmVudCIsInNlbXZlci5zYXRpc2ZpZXMiLCJzZW12ZXIuY2xlYW4iLCJjZm9udHMucmVuZGVyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBR0EsSUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFBO0FBRXpCLHdCQUF5QixLQUF5QixFQUFFLElBQWE7SUFBeEMsc0JBQUEsRUFBQSxVQUF5QjtJQUM5QyxJQUFNLFlBQVksR0FBRyxFQUFFLENBQUE7SUFDdkIsSUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFD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
