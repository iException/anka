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
        err && console.error(err);
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
    }).catch(function (err) {
        logger.error('Compile', err.message, err);
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
        file.convertContentToString();
        var result = babel.transformSync(file.content, tslib_1.__assign({ babelrc: false, ast: true, filename: file.sourceFile, sourceType: 'module', sourceMaps: config.ankaConfig.devMode, comments: config.ankaConfig.devMode, minified: !config.ankaConfig.devMode }, babelConfig));
        file.sourceMap = JSON.stringify(result.map);
        file.content = result.code;
        file.ast = result.ast;
    }
    file.updateExt('.js');
    cb();
});

var UglifyJS = require('uglify-js');
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
            if (config.ankaConfig.debug) {
                logger.info('Saving', file.targetFile);
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
var sourceNodeModules = path.resolve(cwd$2, 'node_modules');
var distNodeModules = path.resolve(distDir, 'npm_modules');
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
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
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
                        !this.config.ankaConfig.quiet && logger.info('Compile', this.file.sourceFile.replace("" + config.cwd + path.sep, ''));
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
                        logger.success("Compiled in " + (Date.now() - startupTime) + "ms \uD83C\uDF89 , Anka is waiting for changes...");
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
                        logger.success("Compiled in " + (Date.now() - startupTime) + "ms", 'Have a nice day 🎉 !');
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlscy9yZXNvbHZlQ29uZmlnLnRzIiwiLi4vc3JjL3BhcnNlcnMvc2Fzc1BhcnNlci50cyIsIi4uL3NyYy91dGlscy9sb2dnZXIudHMiLCIuLi9zcmMvcGFyc2Vycy9zdHlsZVBhcnNlci9pbmRleC50cyIsIi4uL3NyYy9wYXJzZXJzL2JhYmVsUGFyc2VyLnRzIiwiLi4vc3JjL3BsdWdpbnMvc2F2ZUZpbGVQbHVnaW4vaW5kZXgudHMiLCIuLi9zcmMvcGx1Z2lucy93eEltcG9ydFBsdWdpbi9wb3N0Y3NzV3hpbXBvcnQudHMiLCIuLi9zcmMvcGx1Z2lucy93eEltcG9ydFBsdWdpbi9pbmRleC50cyIsIi4uL3NyYy9wYXJzZXJzL3R5cGVzY3JpcHRQYXJzZXIudHMiLCIuLi9zcmMvcGx1Z2lucy9leHRyYWN0RGVwZW5kZW5jeVBsdWdpbi9pbmRleC50cyIsIi4uL3NyYy9jb25maWcvYW5rYURlZmF1bHRDb25maWcudHMiLCIuLi9zcmMvY29uZmlnL2Fua2FDb25maWcudHMiLCIuLi9zcmMvY29uZmlnL3N5c3RlbUNvbmZpZy50cyIsIi4uL3NyYy9jb25maWcvcHJvamVjdENvbmZpZy50cyIsIi4uL3NyYy9jb25maWcvaW5kZXgudHMiLCIuLi9zcmMvdXRpbHMvZnMudHMiLCIuLi9zcmMvY29yZS9jbGFzcy9GaWxlLnRzIiwiLi4vc3JjL3V0aWxzL2NyZWF0ZUZpbGUudHMiLCIuLi9zcmMvdXRpbHMvZWRpdG9yLnRzIiwiLi4vc3JjL3V0aWxzL3Jlc29sdmVNb2R1bGUudHMiLCIuLi9zcmMvdXRpbHMvY2FsbFByb21pc2VJbkNoYWluLnRzIiwiLi4vc3JjL3V0aWxzL2FzeW5jRnVuY3Rpb25XcmFwcGVyLnRzIiwiLi4vc3JjL3V0aWxzL2dlbkZpbGVXYXRjaGVyLnRzIiwiLi4vc3JjL3V0aWxzL2lzTnBtRGVwZW5kZW5jeS50cyIsIi4uL3NyYy91dGlscy9kb3dubG9hZFJlcGUudHMiLCIuLi9zcmMvY29yZS9jbGFzcy9JbmplY3Rpb24udHMiLCIuLi9zcmMvY29yZS9jbGFzcy9Db21waWxhdGlvbi50cyIsIi4uL3NyYy9jb3JlL2NsYXNzL0NvbXBpbGVyLnRzIiwiLi4vc3JjL2NvcmUvY2xhc3MvQ29tbWFuZC50cyIsIi4uL3NyYy9jb21tYW5kcy9kZXYudHMiLCIuLi9zcmMvY29tbWFuZHMvaW5pdC50cyIsIi4uL3NyYy9jb21tYW5kcy9wcm9kLnRzIiwiLi4vc3JjL2NvbW1hbmRzL2NyZWF0ZVBhZ2UudHMiLCIuLi9zcmMvY29tbWFuZHMvY3JlYXRlQ29tcG9uZW50LnRzIiwiLi4vc3JjL2NvbW1hbmRzL2Vucm9sbENvbXBvbmVudC50cyIsIi4uL3NyYy9jb21tYW5kcy50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcydcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcblxuY29uc3QgY3dkID0gcHJvY2Vzcy5jd2QoKVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAobmFtZXM6IEFycmF5PHN0cmluZz4gPSBbXSwgcm9vdD86IHN0cmluZyk6IE9iamVjdCB7XG4gICAgY29uc3QgZGVmYXVsdFZhbHVlID0ge31cbiAgICBjb25zdCBjb25maWdQYXRocyA9IG5hbWVzLm1hcChuYW1lID0+IHBhdGguam9pbihyb290IHx8IGN3ZCwgbmFtZSkpXG5cbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgY29uZmlnUGF0aHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZ1BhdGggPSBjb25maWdQYXRoc1tpbmRleF1cblxuICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhjb25maWdQYXRoKSkge1xuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihkZWZhdWx0VmFsdWUsIHJlcXVpcmUoY29uZmlnUGF0aCkpXG4gICAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlZmF1bHRWYWx1ZVxufVxuIiwiaW1wb3J0ICogYXMgc2FzcyBmcm9tICdub2RlLXNhc3MnXG5cbmltcG9ydCB7XG4gICAgRmlsZSxcbiAgICBQYXJzZXIsXG4gICAgQ29tcGlsYXRpb24sXG4gICAgUGFyc2VySW5qZWN0aW9uXG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG4vKipcbiAqIFNhc3MgZmlsZSBwYXJzZXIuXG4gKiBAZm9yIGFueSBmaWxlIHRoYXQgZG9lcyBub3QgbWF0Y2hlIHBhcnNlcnMuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IDxQYXJzZXI+ZnVuY3Rpb24gKHRoaXM6IFBhcnNlckluamVjdGlvbiwgZmlsZTogRmlsZSwgY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYWxsYmFjaz86IEZ1bmN0aW9uKSB7XG4gICAgY29uc3QgdXRpbHMgPSB0aGlzLmdldFV0aWxzKClcbiAgICBjb25zdCBjb25maWcgPSB0aGlzLmdldFN5c3RlbUNvbmZpZygpXG5cbiAgICBmaWxlLmNvbnRlbnQgPSBmaWxlLmNvbnRlbnQgaW5zdGFuY2VvZiBCdWZmZXIgPyBmaWxlLmNvbnRlbnQudG9TdHJpbmcoKSA6IGZpbGUuY29udGVudFxuXG4gICAgc2Fzcy5yZW5kZXIoe1xuICAgICAgICBmaWxlOiBmaWxlLnNvdXJjZUZpbGUsXG4gICAgICAgIGRhdGE6IGZpbGUuY29udGVudFxuICAgIH0sIChlcnI6IEVycm9yLCByZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICB1dGlscy5sb2dnZXIuZXJyb3IoJ0NvbXBpbGUnLCBlcnIubWVzc2FnZSwgZXJyKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZmlsZS5jb250ZW50ID0gcmVzdWx0LmNzc1xuICAgICAgICAgICAgZmlsZS51cGRhdGVFeHQoJy53eHNzJylcbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjaygpXG4gICAgfSlcbn1cbiIsImltcG9ydCBjaGFsayBmcm9tICdjaGFsaydcbmNvbnN0IG9yYSA9IHJlcXVpcmUoJ29yYScpXG5cbmV4cG9ydCBmdW5jdGlvbiB0b0ZpeCAobnVtYmVyOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIHJldHVybiAoJzAwJyArIG51bWJlcikuc2xpY2UoLTIpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50VGltZSAoKTogc3RyaW5nIHtcbiAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpXG4gICAgcmV0dXJuIGAke3RvRml4KG5vdy5nZXRIb3VycygpKX06JHt0b0ZpeChub3cuZ2V0TWludXRlcygpKX06JHt0b0ZpeChub3cuZ2V0U2Vjb25kcygpKX1gXG59XG5cbmV4cG9ydCBjbGFzcyBMb2dnZXIge1xuICAgIG9yYUluc3RhbmNlOiBhbnlcblxuICAgIGdldCB0aW1lICgpIHtcbiAgICAgICAgcmV0dXJuIGNoYWxrLmdyZXkoYFske2dldEN1cnJlbnRUaW1lKCl9XWApXG4gICAgfVxuXG4gICAgc3RhcnRMb2FkaW5nIChtc2c6IHN0cmluZykge1xuICAgICAgICB0aGlzLm9yYUluc3RhbmNlID0gb3JhKG1zZykuc3RhcnQoKVxuICAgIH1cblxuICAgIHN0b3BMb2FkaW5nICgpIHtcbiAgICAgICAgdGhpcy5vcmFJbnN0YW5jZSAmJiB0aGlzLm9yYUluc3RhbmNlLnN0b3AoKVxuICAgIH1cblxuICAgIGxvZyAoLi4ubXNnOiBBcnJheTxzdHJpbmc+KSB7XG4gICAgICAgIHJldHVybiBjb25zb2xlLmxvZyh0aGlzLnRpbWUsIC4uLm1zZylcbiAgICB9XG5cbiAgICBlcnJvciAodGl0bGU6IHN0cmluZyA9ICcnLCBtc2c6IHN0cmluZyA9ICcnLCBlcnI/OiBhbnkpIHtcbiAgICAgICAgdGhpcy5sb2coY2hhbGsucmVkQnJpZ2h0KHRpdGxlKSwgY2hhbGsuZ3JleShtc2cpKVxuICAgICAgICBlcnIgJiYgY29uc29sZS5lcnJvcihlcnIpXG4gICAgfVxuXG4gICAgaW5mbyAodGl0bGU6IHN0cmluZyA9ICcnLCBtc2c6IHN0cmluZyA9ICcnKSB7XG4gICAgICAgIHRoaXMubG9nKGNoYWxrLnJlc2V0KHRpdGxlKSwgY2hhbGsuZ3JleShtc2cpKVxuICAgIH1cblxuICAgIHdhcm4gKHRpdGxlOiBzdHJpbmcgPSAnJywgbXNnOiBzdHJpbmcgPSAnJykge1xuICAgICAgICB0aGlzLmxvZyhjaGFsay55ZWxsb3dCcmlnaHQodGl0bGUpLCBjaGFsay5ncmV5KG1zZykpXG4gICAgfVxuXG4gICAgc3VjY2VzcyAodGl0bGU6IHN0cmluZyA9ICcnLCBtc2c6IHN0cmluZyA9ICcnKSB7XG4gICAgICAgIHRoaXMubG9nKGNoYWxrLmdyZWVuQnJpZ2h0KHRpdGxlKSwgY2hhbGsuZ3JleShtc2cpKVxuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgbmV3IExvZ2dlcigpXG4iLCJpbXBvcnQgKiBhcyBQb3N0Y3NzIGZyb20gJ3Bvc3Rjc3MnXG5pbXBvcnQgbG9nZ2VyIGZyb20gJy4uLy4uL3V0aWxzL2xvZ2dlcidcbmltcG9ydCBwb3N0Y3NzcmMgZnJvbSAncG9zdGNzcy1sb2FkLWNvbmZpZydcblxuaW1wb3J0IHtcbiAgICBGaWxlLFxuICAgIFBhcnNlcixcbiAgICBDb21waWxhdGlvbixcbiAgICBQYXJzZXJJbmplY3Rpb25cbn0gZnJvbSAnLi4vLi4vLi4vdHlwZXMvdHlwZXMnXG5cbmNvbnN0IHBvc3Rjc3MgPSByZXF1aXJlKCdwb3N0Y3NzJylcbmNvbnN0IHBvc3Rjc3NDb25maWc6IGFueSA9IHt9XG5jb25zdCBpbnRlcm5hbFBsdWdpbnM6IEFycmF5PFBvc3Rjc3MuQWNjZXB0ZWRQbHVnaW4+ID0gW11cbmNvbnN0IHRhc2tzOiBhbnlbXSA9IFtdXG5cbi8vIFRPRE86IEFkZCBuZXcgaG9vazogcHJlc2V0XG5cbi8qKlxuICogU3R5bGUgZmlsZSBwYXJzZXIuXG4gKiBAZm9yIC53eHNzIC5jc3MgPT4gLnd4c3NcbiAqL1xuZXhwb3J0IGRlZmF1bHQgPFBhcnNlcj5mdW5jdGlvbiAodGhpczogUGFyc2VySW5qZWN0aW9uLCBmaWxlOiBGaWxlLCBjb21waWxhdGlvbjogQ29tcGlsYXRpb24sIGNiOiBGdW5jdGlvbik6IHZvaWQge1xuICAgIGlmIChwb3N0Y3NzQ29uZmlnLnBsdWdpbnMpIHtcbiAgICAgICAgZXhlYyhwb3N0Y3NzQ29uZmlnLCBmaWxlLCBjYilcbiAgICB9IGVsc2Uge1xuICAgICAgICB0YXNrcy5wdXNoKCgpID0+IHtcbiAgICAgICAgICAgIGV4ZWMocG9zdGNzc0NvbmZpZywgZmlsZSwgY2IpXG4gICAgICAgIH0pXG4gICAgfVxufVxuXG5nZW5Qb3N0Y3NzQ29uZmlnKCkudGhlbigoY29uZmlnOiBhbnkpID0+IHtcbiAgICB0YXNrcy5mb3JFYWNoKCh0YXNrOiBGdW5jdGlvbikgPT4gdGFzaygpKVxufSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICBsb2dnZXIuZXJyb3IoJ2xvYWRDb25maWcnLCBlcnIubWVzc2FnZSwgZXJyKVxufSlcblxuXG5mdW5jdGlvbiBleGVjIChjb25maWc6IGFueSwgZmlsZTogRmlsZSwgY2I6IEZ1bmN0aW9uKSB7XG4gICAgZmlsZS5jb252ZXJ0Q29udGVudFRvU3RyaW5nKClcbiAgICBwb3N0Y3NzKGNvbmZpZy5wbHVnaW5zLmNvbmNhdChpbnRlcm5hbFBsdWdpbnMpKS5wcm9jZXNzKGZpbGUuY29udGVudCwge1xuICAgICAgICAuLi5jb25maWcub3B0aW9ucyxcbiAgICAgICAgZnJvbTogZmlsZS5zb3VyY2VGaWxlXG4gICAgfSBhcyBQb3N0Y3NzLlByb2Nlc3NPcHRpb25zKS50aGVuKChyb290OiBQb3N0Y3NzLlJlc3VsdCkgPT4ge1xuICAgICAgICBmaWxlLmNvbnRlbnQgPSByb290LmNzc1xuICAgICAgICBmaWxlLmFzdCA9IHJvb3Qucm9vdC50b1Jlc3VsdCgpXG4gICAgICAgIGZpbGUudXBkYXRlRXh0KCcud3hzcycpXG4gICAgICAgIGNiKClcbiAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICBsb2dnZXIuZXJyb3IoJ0NvbXBpbGUnLCBlcnIubWVzc2FnZSwgZXJyKVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIGdlblBvc3Rjc3NDb25maWcgKHRhc2tzOiBGdW5jdGlvbltdID0gW10pIHtcbiAgICByZXR1cm4gcG9zdGNzc0NvbmZpZy5wbHVnaW5zID8gUHJvbWlzZS5yZXNvbHZlKHBvc3Rjc3NDb25maWcpIDogcG9zdGNzc3JjKHt9KS50aGVuKChjb25maWc6IGFueSkgPT4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKE9iamVjdC5hc3NpZ24ocG9zdGNzc0NvbmZpZywgY29uZmlnKSlcbiAgICB9KVxufVxuIiwiaW1wb3J0ICogYXMgYmFiZWwgZnJvbSAnQGJhYmVsL2NvcmUnXG5pbXBvcnQgRmlsZSBmcm9tICcuLi9jb3JlL2NsYXNzL0ZpbGUnXG5cbmltcG9ydCB7XG4gICAgUGFyc2VyLFxuICAgIENvbXBpbGF0aW9uLFxuICAgIFBhcnNlckluamVjdGlvblxufSBmcm9tICcuLi8uLi90eXBlcy90eXBlcydcblxubGV0IGJhYmVsQ29uZmlnID0gPGJhYmVsLlRyYW5zZm9ybU9wdGlvbnM+bnVsbFxuXG4vKipcbiAqIFNjcmlwdCBGaWxlIHBhcnNlci5cbiAqIEBmb3IgLmpzIC5lc1xuICovXG5leHBvcnQgZGVmYXVsdCA8UGFyc2VyPmZ1bmN0aW9uICh0aGlzOiBQYXJzZXJJbmplY3Rpb24sIGZpbGU6IEZpbGUsIGNvbXBpbGF0aW9uOiBDb21waWxhdGlvbiwgY2I6IEZ1bmN0aW9uKSB7XG4gICAgY29uc3QgdXRpbHMgPSB0aGlzLmdldFV0aWxzKClcbiAgICBjb25zdCBjb25maWcgPSB0aGlzLmdldFN5c3RlbUNvbmZpZygpXG5cbiAgICBpZiAoZmlsZS5pc0luU3JjRGlyKSB7XG4gICAgICAgIGlmICghYmFiZWxDb25maWcpIHtcbiAgICAgICAgICAgIGJhYmVsQ29uZmlnID0gPGJhYmVsLlRyYW5zZm9ybU9wdGlvbnM+dXRpbHMucmVzb2x2ZUNvbmZpZyhbJ2JhYmVsLmNvbmZpZy5qcyddLCBjb25maWcuY3dkKVxuICAgICAgICB9XG5cbiAgICAgICAgZmlsZS5jb252ZXJ0Q29udGVudFRvU3RyaW5nKClcblxuICAgICAgICBjb25zdCByZXN1bHQgPSBiYWJlbC50cmFuc2Zvcm1TeW5jKDxzdHJpbmc+ZmlsZS5jb250ZW50LCB7XG4gICAgICAgICAgICBiYWJlbHJjOiBmYWxzZSxcbiAgICAgICAgICAgIGFzdDogdHJ1ZSxcbiAgICAgICAgICAgIGZpbGVuYW1lOiBmaWxlLnNvdXJjZUZpbGUsXG4gICAgICAgICAgICBzb3VyY2VUeXBlOiAnbW9kdWxlJyxcbiAgICAgICAgICAgIHNvdXJjZU1hcHM6IGNvbmZpZy5hbmthQ29uZmlnLmRldk1vZGUsXG4gICAgICAgICAgICBjb21tZW50czogY29uZmlnLmFua2FDb25maWcuZGV2TW9kZSxcbiAgICAgICAgICAgIG1pbmlmaWVkOiAhY29uZmlnLmFua2FDb25maWcuZGV2TW9kZSxcbiAgICAgICAgICAgIC4uLmJhYmVsQ29uZmlnXG4gICAgICAgIH0pXG5cbiAgICAgICAgZmlsZS5zb3VyY2VNYXAgPSBKU09OLnN0cmluZ2lmeShyZXN1bHQubWFwKVxuICAgICAgICBmaWxlLmNvbnRlbnQgPSByZXN1bHQuY29kZVxuICAgICAgICBmaWxlLmFzdCA9IHJlc3VsdC5hc3RcbiAgICB9XG5cbiAgICBmaWxlLnVwZGF0ZUV4dCgnLmpzJylcbiAgICBjYigpXG59XG4iLCJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSdcbmltcG9ydCB7XG4gICAgUGx1Z2luLFxuICAgIENvbXBpbGF0aW9uLFxuICAgIFBsdWdpbkhhbmRsZXIsXG4gICAgUGx1Z2luSW5qZWN0aW9uXG59IGZyb20gJy4uLy4uLy4uL3R5cGVzL3R5cGVzJ1xuY29uc3QgVWdsaWZ5SlMgPSByZXF1aXJlKCd1Z2xpZnktanMnKVxuY29uc3QgbWluaWZ5SlNPTiA9IHJlcXVpcmUoJ2pzb25taW5pZnknKVxuXG5jb25zdCBpbmxpbmVTb3VyY2VNYXBDb21tZW50ID0gcmVxdWlyZSgnaW5saW5lLXNvdXJjZS1tYXAtY29tbWVudCcpXG5cbmV4cG9ydCBkZWZhdWx0IDxQbHVnaW4+ZnVuY3Rpb24gKHRoaXM6IFBsdWdpbkluamVjdGlvbikge1xuICAgIGNvbnN0IHV0aWxzID0gdGhpcy5nZXRVdGlscygpXG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5nZXRTeXN0ZW1Db25maWcoKVxuICAgIGNvbnN0IHtcbiAgICAgICAgbG9nZ2VyLFxuICAgICAgICB3cml0ZUZpbGVcbiAgICB9ID0gdXRpbHNcblxuICAgIHRoaXMub24oJ3NhdmUnLCA8UGx1Z2luSGFuZGxlcj5mdW5jdGlvbiAoY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYjogRnVuY3Rpb24pIHtcbiAgICAgICAgY29uc3QgZmlsZSA9IGNvbXBpbGF0aW9uLmZpbGVcblxuICAgICAgICAvLyBUT0RPOiBVc2UgbWVtLWZzXG4gICAgICAgIGZzLmVuc3VyZUZpbGUoZmlsZS50YXJnZXRGaWxlKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGlmIChjb25maWcuYW5rYUNvbmZpZy5kZXZNb2RlICYmIGZpbGUuc291cmNlTWFwKSB7XG4gICAgICAgICAgICAgICAgZmlsZS5jb252ZXJ0Q29udGVudFRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICBmaWxlLmNvbnRlbnQgPSBmaWxlLmNvbnRlbnQgKyAnXFxyXFxuXFxyXFxuJyArIGlubGluZVNvdXJjZU1hcENvbW1lbnQoZmlsZS5zb3VyY2VNYXAsIHtcbiAgICAgICAgICAgICAgICAgICAgYmxvY2s6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZXNDb250ZW50OiB0cnVlXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghY29uZmlnLmFua2FDb25maWcuZGV2TW9kZSkge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoZmlsZS5leHRuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNhc2UgJy5qcyc6XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnLmpzb24nOlxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5jb252ZXJ0Q29udGVudFRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuY29udGVudCA9IG1pbmlmeUpTT04oZmlsZS5jb250ZW50KVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY29uZmlnLmFua2FDb25maWcuZGVidWcpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIuaW5mbygnU2F2aW5nJywgZmlsZS50YXJnZXRGaWxlKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHdyaXRlRmlsZShmaWxlLnRhcmdldEZpbGUsIGZpbGUuY29udGVudClcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBjYigpXG4gICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yJywgZXJyLm1lc3NhZ2UsIGVycilcbiAgICAgICAgICAgIGNiKClcbiAgICAgICAgfSlcbiAgICB9KVxufVxuIiwiaW1wb3J0ICogYXMgcG9zdGNzcyBmcm9tICdwb3N0Y3NzJ1xuXG5leHBvcnQgZGVmYXVsdCBwb3N0Y3NzLnBsdWdpbigncG9zdGNzcy13eGltcG9ydCcsICgpID0+IHtcbiAgICByZXR1cm4gKHJvb3Q6IHBvc3Rjc3MuUm9vdCkgPT4ge1xuICAgICAgICBsZXQgaW1wb3J0czogQXJyYXk8c3RyaW5nPiA9IFtdXG5cbiAgICAgICAgcm9vdC53YWxrQXRSdWxlcygnd3hpbXBvcnQnLCAocnVsZTogcG9zdGNzcy5BdFJ1bGUpID0+IHtcbiAgICAgICAgICAgIGltcG9ydHMucHVzaChydWxlLnBhcmFtcy5yZXBsYWNlKC9cXC5cXHcrKD89WydcIl0kKS8sICcud3hzcycpKVxuICAgICAgICAgICAgcnVsZS5yZW1vdmUoKVxuICAgICAgICB9KVxuICAgICAgICByb290LnByZXBlbmQoLi4uaW1wb3J0cy5tYXAoKGl0ZW06IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnaW1wb3J0JyxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IGl0ZW1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpXG4gICAgICAgIGltcG9ydHMubGVuZ3RoID0gMFxuICAgIH1cbn0pXG4iLCJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSdcbmltcG9ydCB7XG4gICAgUGx1Z2luLFxuICAgIENvbXBpbGF0aW9uLFxuICAgIFBsdWdpbkhhbmRsZXIsXG4gICAgUGx1Z2luSW5qZWN0aW9uXG59IGZyb20gJy4uLy4uLy4uL3R5cGVzL3R5cGVzJ1xuaW1wb3J0ICogYXMgUG9zdENTUyBmcm9tICdwb3N0Y3NzJ1xuaW1wb3J0IHBvc3Rjc3NXeEltcG9ydCBmcm9tICcuL3Bvc3Rjc3NXeGltcG9ydCdcblxuY29uc3QgcG9zdGNzcyA9IHJlcXVpcmUoJ3Bvc3Rjc3MnKVxuY29uc3QgY3NzbmFubyA9IHJlcXVpcmUoJ3Bvc3Rjc3Mtbm9ybWFsaXplLXdoaXRlc3BhY2UnKVxuY29uc3QgaW50ZXJuYWxQbHVnaW5zOiBBcnJheTxQb3N0Q1NTLkFjY2VwdGVkUGx1Z2luPiA9IFtwb3N0Y3NzV3hJbXBvcnRdXG5cbmV4cG9ydCBkZWZhdWx0IDxQbHVnaW4+ZnVuY3Rpb24gKHRoaXM6IFBsdWdpbkluamVjdGlvbikge1xuICAgIGNvbnN0IHV0aWxzID0gdGhpcy5nZXRVdGlscygpXG4gICAgY29uc3Qge1xuICAgICAgICBsb2dnZXJcbiAgICB9ID0gdXRpbHNcbiAgICBjb25zdCBjb25maWcgPSB0aGlzLmdldFN5c3RlbUNvbmZpZygpXG4gICAgY29uc3QgdGVzdFNyY0RpciA9IG5ldyBSZWdFeHAoYF4ke2NvbmZpZy5zcmNEaXJ9YClcblxuICAgIHRoaXMub24oJ2JlZm9yZS1jb21waWxlJywgPFBsdWdpbkhhbmRsZXI+ZnVuY3Rpb24gKGNvbXBpbGF0aW9uOiBDb21waWxhdGlvbiwgY2I6IEZ1bmN0aW9uKSB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSBjb21waWxhdGlvbi5maWxlXG5cbiAgICAgICAgaWYgKCFjb25maWcuYW5rYUNvbmZpZy5kZXZNb2RlKSB7XG4gICAgICAgICAgICBpbnRlcm5hbFBsdWdpbnMucHVzaChjc3NuYW5vKVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaGFuZGxlciA9IHBvc3Rjc3MoaW50ZXJuYWxQbHVnaW5zKVxuXG4gICAgICAgIGlmIChmaWxlLmV4dG5hbWUgPT09ICcud3hzcycgJiYgdGVzdFNyY0Rpci50ZXN0KGZpbGUuc291cmNlRmlsZSkpIHtcbiAgICAgICAgICAgIGhhbmRsZXIucHJvY2VzcygoZmlsZS5hc3QgfHwgZmlsZS5jb250ZW50KSBhcyBzdHJpbmcgfCB7IHRvU3RyaW5nICgpOiBzdHJpbmc7IH0gfCBQb3N0Q1NTLlJlc3VsdCwge1xuICAgICAgICAgICAgICAgIGZyb206IGZpbGUuc291cmNlRmlsZVxuICAgICAgICAgICAgfSBhcyBQb3N0Q1NTLlByb2Nlc3NPcHRpb25zKS50aGVuKChyb290OiBQb3N0Q1NTLlJlc3VsdCk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgICAgIGZpbGUuY29udGVudCA9IHJvb3QuY3NzXG4gICAgICAgICAgICAgICAgZmlsZS5hc3QgPSByb290LnJvb3QudG9SZXN1bHQoKVxuICAgICAgICAgICAgICAgIGNiKClcbiAgICAgICAgICAgIH0sIChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvcicsIGVyci5tZXNzYWdlLCBlcnIpXG4gICAgICAgICAgICAgICAgY2IoKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNiKClcbiAgICAgICAgfVxuICAgIH0pXG59XG4iLCJpbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0J1xuXG5pbXBvcnQge1xuICAgIEZpbGUsXG4gICAgUGFyc2VyLFxuICAgIENvbXBpbGF0aW9uLFxuICAgIFBhcnNlckluamVjdGlvblxufSBmcm9tICcuLi8uLi90eXBlcy90eXBlcydcblxubGV0IHRzQ29uZmlnID0gPHRzLlRyYW5zcGlsZU9wdGlvbnM+bnVsbFxuXG4vKipcbiAqIFR5cGVzY3JpcHQgZmlsZSBwYXJzZXIuXG4gKlxuICogQGZvciBhbnkgZmlsZSB0aGF0IGRvZXMgbm90IG1hdGNoZSBwYXJzZXJzLlxuICovXG5leHBvcnQgZGVmYXVsdCA8UGFyc2VyPmZ1bmN0aW9uICh0aGlzOiBQYXJzZXJJbmplY3Rpb24sIGZpbGU6IEZpbGUsIGNvbXBpbGF0aW9uOiBDb21waWxhdGlvbiwgY2FsbGJhY2s/OiBGdW5jdGlvbikge1xuICAgIGNvbnN0IHV0aWxzID0gdGhpcy5nZXRVdGlscygpXG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5nZXRTeXN0ZW1Db25maWcoKVxuICAgIGNvbnN0IHsgbG9nZ2VyIH0gPSB1dGlsc1xuXG4gICAgZmlsZS5jb250ZW50ID0gZmlsZS5jb250ZW50IGluc3RhbmNlb2YgQnVmZmVyID8gZmlsZS5jb250ZW50LnRvU3RyaW5nKCkgOiBmaWxlLmNvbnRlbnRcbiAgICBjb25zdCBzb3VyY2VNYXAgPSAge1xuICAgICAgICBzb3VyY2VzQ29udGVudDogW2ZpbGUuY29udGVudF1cbiAgICB9XG5cbiAgICBpZiAoIXRzQ29uZmlnKSB7XG4gICAgICAgIHRzQ29uZmlnID0gPHRzLlRyYW5zcGlsZU9wdGlvbnM+dXRpbHMucmVzb2x2ZUNvbmZpZyhbJ3RzY29uZmlnLmpzb24nLCAndHNjb25maWcuanMnXSwgY29uZmlnLmN3ZClcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQgPSB0cy50cmFuc3BpbGVNb2R1bGUoZmlsZS5jb250ZW50LCB7XG4gICAgICAgIGNvbXBpbGVyT3B0aW9uczogdHNDb25maWcuY29tcGlsZXJPcHRpb25zLFxuICAgICAgICBmaWxlTmFtZTogZmlsZS5zb3VyY2VGaWxlXG4gICAgfSlcblxuICAgIHRyeSB7XG4gICAgICAgIGZpbGUuY29udGVudCA9IHJlc3VsdC5vdXRwdXRUZXh0XG4gICAgICAgIGlmIChjb25maWcuYW5rYUNvbmZpZy5kZXZNb2RlKSB7XG4gICAgICAgICAgICBmaWxlLnNvdXJjZU1hcCA9IHtcbiAgICAgICAgICAgICAgICAuLi5KU09OLnBhcnNlKHJlc3VsdC5zb3VyY2VNYXBUZXh0KSxcbiAgICAgICAgICAgICAgICAuLi5zb3VyY2VNYXBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmaWxlLnVwZGF0ZUV4dCgnLmpzJylcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgbG9nZ2VyLmVycm9yKCdDb21waWxlIGVycm9yJywgZXJyLm1lc3NhZ2UsIGVycilcbiAgICB9XG5cbiAgICBjYWxsYmFjaygpXG59XG4iLCJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgKiBhcyB0IGZyb20gJ0BiYWJlbC90eXBlcydcbmltcG9ydCAqIGFzIGJhYmVsIGZyb20gJ0BiYWJlbC9jb3JlJ1xuaW1wb3J0IHRyYXZlcnNlIGZyb20gJ0BiYWJlbC90cmF2ZXJzZSdcbmltcG9ydCBjb2RlR2VuZXJhdG9yIGZyb20gJ0BiYWJlbC9nZW5lcmF0b3InXG5cbmltcG9ydCB7XG4gICAgUGx1Z2luLFxuICAgIENvbXBpbGF0aW9uLFxuICAgIFBsdWdpbkhhbmRsZXIsXG4gICAgUGx1Z2luSW5qZWN0aW9uXG59IGZyb20gJy4uLy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5jb25zdCBkZXBlbmRlbmN5UG9vbCA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KClcbmNvbnN0IHJlc292bGVNb2R1bGVOYW1lID0gcmVxdWlyZSgncmVxdWlyZS1wYWNrYWdlLW5hbWUnKVxuXG5leHBvcnQgZGVmYXVsdCA8UGx1Z2luPiBmdW5jdGlvbiAodGhpczogUGx1Z2luSW5qZWN0aW9uKSB7XG4gICAgY29uc3QgdXRpbHMgPSB0aGlzLmdldFV0aWxzKClcbiAgICBjb25zdCBjb21waWxlciA9IHRoaXMuZ2V0Q29tcGlsZXIoKVxuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuZ2V0U3lzdGVtQ29uZmlnKClcbiAgICBjb25zdCB0ZXN0U3JjRGlyID0gbmV3IFJlZ0V4cChgXiR7Y29uZmlnLnNyY0Rpcn1gKVxuICAgIGNvbnN0IHRlc3ROb2RlTW9kdWxlcyA9IG5ldyBSZWdFeHAoYF4ke2NvbmZpZy5zb3VyY2VOb2RlTW9kdWxlc31gKVxuXG4gICAgdGhpcy5vbignYmVmb3JlLWNvbXBpbGUnLCBmdW5jdGlvbiAoY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYjogRnVuY3Rpb24pIHtcbiAgICAgICAgY29uc3QgZmlsZSA9IGNvbXBpbGF0aW9uLmZpbGVcbiAgICAgICAgY29uc3QgZGV2TW9kZSA9IGNvbmZpZy5hbmthQ29uZmlnLmRldk1vZGVcbiAgICAgICAgY29uc3QgbG9jYWxEZXBlbmRlbmN5UG9vbCA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KClcblxuICAgICAgICAvLyBPbmx5IHJlc29sdmUganMgZmlsZS5cbiAgICAgICAgaWYgKGZpbGUuZXh0bmFtZSA9PT0gJy5qcycpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGZpbGUuc291cmNlRmlsZSwgZmlsZS5hc3QgPyAnb2JqZWN0JyA6IGZpbGUuYXN0KVxuICAgICAgICAgICAgaWYgKCFmaWxlLmFzdCkge1xuICAgICAgICAgICAgICAgIGZpbGUuYXN0ID0gPHQuRmlsZT5iYWJlbC5wYXJzZShcbiAgICAgICAgICAgICAgICAgICAgZmlsZS5jb250ZW50IGluc3RhbmNlb2YgQnVmZmVyID8gZmlsZS5jb250ZW50LnRvU3RyaW5nKCkgOiBmaWxlLmNvbnRlbnQsXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhYmVscmM6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlVHlwZTogJ21vZHVsZSdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdHJhdmVyc2UoPHQuTm9kZT5maWxlLmFzdCwge1xuICAgICAgICAgICAgICAgIGVudGVyIChwYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXRoLmlzSW1wb3J0RGVjbGFyYXRpb24oKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHBhdGgubm9kZVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc291cmNlID0gbm9kZS5zb3VyY2VcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZS52YWx1ZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiBzb3VyY2UudmFsdWUgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHNvdXJjZSwgZmlsZS5zb3VyY2VGaWxlLCBmaWxlLnRhcmdldEZpbGUsIGxvY2FsRGVwZW5kZW5jeVBvb2wpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAocGF0aC5pc0NhbGxFeHByZXNzaW9uKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBwYXRoLm5vZGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNhbGxlZSA9IDx0LklkZW50aWZpZXI+bm9kZS5jYWxsZWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFyZ3MgPSA8dC5TdHJpbmdMaXRlcmFsW10+bm9kZS5hcmd1bWVudHNcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsZWUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzWzBdICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJnc1swXS52YWx1ZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxlZS5uYW1lID09PSAncmVxdWlyZScgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlb2YgYXJnc1swXS52YWx1ZSA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYXJnc1swXSwgZmlsZS5zb3VyY2VGaWxlLCBmaWxlLnRhcmdldEZpbGUsIGxvY2FsRGVwZW5kZW5jeVBvb2wpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgZmlsZS5jb250ZW50ID0gY29kZUdlbmVyYXRvcihmaWxlLmFzdCwge1xuICAgICAgICAgICAgICAgIGNvbXBhY3Q6ICFkZXZNb2RlLFxuICAgICAgICAgICAgICAgIG1pbmlmaWVkOiAhZGV2TW9kZVxuICAgICAgICAgICAgfSkuY29kZVxuXG4gICAgICAgICAgICBjb25zdCBkZXBlbmRlbmN5TGlzdCA9IEFycmF5LmZyb20obG9jYWxEZXBlbmRlbmN5UG9vbC5rZXlzKCkpLmZpbHRlcihkZXBlbmRlbmN5ID0+ICFkZXBlbmRlbmN5UG9vbC5oYXMoZGVwZW5kZW5jeSkpXG5cbiAgICAgICAgICAgIFByb21pc2UuYWxsKGRlcGVuZGVuY3lMaXN0Lm1hcChkZXBlbmRlbmN5ID0+IHRyYXZlcnNlTnBtRGVwZW5kZW5jeShkZXBlbmRlbmN5KSkpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNiKClcbiAgICAgICAgICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgY2IoKVxuICAgICAgICAgICAgICAgIHV0aWxzLmxvZ2dlci5lcnJvcihmaWxlLnNvdXJjZUZpbGUsIGVyci5tZXNzYWdlLCBlcnIpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2IoKVxuICAgICAgICB9XG4gICAgfSBhcyBQbHVnaW5IYW5kbGVyKVxuXG4gICAgZnVuY3Rpb24gcmVzb2x2ZSAobm9kZTogYW55LCBzb3VyY2VGaWxlOiBzdHJpbmcsIHRhcmdldEZpbGU6IHN0cmluZywgbG9jYWxEZXBlbmRlbmN5UG9vbDogTWFwPHN0cmluZywgc3RyaW5nPikge1xuICAgICAgICBjb25zdCBzb3VyY2VCYXNlTmFtZSA9IHBhdGguZGlybmFtZShzb3VyY2VGaWxlKVxuICAgICAgICBjb25zdCB0YXJnZXRCYXNlTmFtZSA9IHBhdGguZGlybmFtZSh0YXJnZXRGaWxlKVxuICAgICAgICBjb25zdCBtb2R1bGVOYW1lID0gcmVzb3ZsZU1vZHVsZU5hbWUobm9kZS52YWx1ZSlcblxuICAgICAgICBpZiAodXRpbHMuaXNOcG1EZXBlbmRlbmN5KG1vZHVsZU5hbWUpIHx8IHRlc3ROb2RlTW9kdWxlcy50ZXN0KHNvdXJjZUZpbGUpKSB7XG4gICAgICAgICAgICBjb25zdCBkZXBlbmRlbmN5ID0gdXRpbHMucmVzb2x2ZU1vZHVsZShub2RlLnZhbHVlLCB7XG4gICAgICAgICAgICAgICAgcGF0aHM6IFtzb3VyY2VCYXNlTmFtZV1cbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIC8vIEluIGNhc2UgYHJlcXVpcmUoJ2EnKWAsIGBhYCBpcyBsb2NhbCBmaWxlIGluIHNyYyBkaXJlY3RvcnlcbiAgICAgICAgICAgIGlmICghZGVwZW5kZW5jeSB8fCB0ZXN0U3JjRGlyLnRlc3QoZGVwZW5kZW5jeSkpIHJldHVyblxuXG4gICAgICAgICAgICBjb25zdCBkaXN0UGF0aCA9IGRlcGVuZGVuY3kucmVwbGFjZShjb25maWcuc291cmNlTm9kZU1vZHVsZXMsIGNvbmZpZy5kaXN0Tm9kZU1vZHVsZXMpXG5cbiAgICAgICAgICAgIG5vZGUudmFsdWUgPSBwYXRoLnJlbGF0aXZlKHRhcmdldEJhc2VOYW1lLCBkaXN0UGF0aClcblxuICAgICAgICAgICAgaWYgKGxvY2FsRGVwZW5kZW5jeVBvb2wuaGFzKGRlcGVuZGVuY3kpKSByZXR1cm5cbiAgICAgICAgICAgIGxvY2FsRGVwZW5kZW5jeVBvb2wuc2V0KGRlcGVuZGVuY3ksIGRlcGVuZGVuY3kpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBmdW5jdGlvbiB0cmF2ZXJzZU5wbURlcGVuZGVuY3kgKGRlcGVuZGVuY3k6IHN0cmluZykge1xuICAgICAgICBkZXBlbmRlbmN5UG9vbC5zZXQoZGVwZW5kZW5jeSwgZGVwZW5kZW5jeSlcbiAgICAgICAgY29uc3QgZmlsZSA9IGF3YWl0IHV0aWxzLmNyZWF0ZUZpbGUoZGVwZW5kZW5jeSlcblxuICAgICAgICBmaWxlLnRhcmdldEZpbGUgPSBmaWxlLnNvdXJjZUZpbGUucmVwbGFjZShjb25maWcuc291cmNlTm9kZU1vZHVsZXMsIGNvbmZpZy5kaXN0Tm9kZU1vZHVsZXMpXG4gICAgICAgIGF3YWl0IGNvbXBpbGVyLmdlbmVyYXRlQ29tcGlsYXRpb24oZmlsZSkucnVuKClcbiAgICB9XG59XG4iLCIvLyBpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgc2Fzc1BhcnNlciBmcm9tICcuLi9wYXJzZXJzL3Nhc3NQYXJzZXInXG5pbXBvcnQgZmlsZVBhcnNlciBmcm9tICcuLi9wYXJzZXJzL2ZpbGVQYXJzZXInXG5pbXBvcnQgc3R5bGVQYXJzZXIgZnJvbSAnLi4vcGFyc2Vycy9zdHlsZVBhcnNlcidcbmltcG9ydCBiYWJlbFBhcnNlciBmcm9tICcuLi9wYXJzZXJzL2JhYmVsUGFyc2VyJ1xuaW1wb3J0IHNjcmlwdFBhcnNlciBmcm9tICcuLi9wYXJzZXJzL3NjcmlwdFBhcnNlcidcbmltcG9ydCB0ZW1wbGF0ZVBhcnNlciBmcm9tICcuLi9wYXJzZXJzL3RlbXBsYXRlUGFyc2VyJ1xuaW1wb3J0IHNhdmVGaWxlUGx1Z2luIGZyb20gJy4uL3BsdWdpbnMvc2F2ZUZpbGVQbHVnaW4nXG5pbXBvcnQgd3hJbXBvcnRQbHVnaW4gZnJvbSAnLi4vcGx1Z2lucy93eEltcG9ydFBsdWdpbidcbmltcG9ydCB0eXBlc2NyaXB0UGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvdHlwZXNjcmlwdFBhcnNlcidcbmltcG9ydCBleHRyYWN0RGVwZW5kZW5jeVBsdWdpbiBmcm9tICcuLi9wbHVnaW5zL2V4dHJhY3REZXBlbmRlbmN5UGx1Z2luJ1xuXG5pbXBvcnQge1xuICAgIElnbm9yZWRDb25maWdyYXRpb24sXG4gICAgUGFyc2Vyc0NvbmZpZ3JhdGlvbixcbiAgICBQbHVnaW5zQ29uZmlncmF0aW9uXG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICAgICAgICAgICAgICAgICAgIERhbmdlciB6b25lXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbi8qKlxuICogVGhlIHBhdGggd2hlcmUgV2VDaGF0IG1pbmlwcm9ncmFtIHNvdXJjZSBmaWxlcyBleGlzdC5cbiAqIEBkZWZhdWx0ICcuL3NyYydcbiAqL1xuZXhwb3J0IGNvbnN0IHNvdXJjZURpciA9ICcuL3NyYydcblxuLyoqXG4gKiBUaGUgcGF0aCB3aGVyZSBXZUNoYXQgbWluaXByb2dyYW0gY29tcGlsZWQgZmlsZXMgZXhpc3QuXG4gKiBAZGVmYXVsdCAnLi9kaXN0J1xuICovXG5leHBvcnQgY29uc3Qgb3V0cHV0RGlyID0gJy4vZGlzdCdcblxuLyoqXG4gKiBUaGUgcGF0aCB3aGVyZSBXZUNoYXQgbWluaXByb2dyYW0gcGFnZXMgZXhpc3QuXG4gKiBAZGVmYXVsdCAnLi9zcmMvcGFnZXMnXG4gKi9cbmV4cG9ydCBjb25zdCBwYWdlcyA9ICcuL3BhZ2VzJ1xuXG4vKipcbiAqIFRoZSBwYXRoIHdoZXJlIFdlQ2hhdCBtaW5pcHJvZ3JhbSBjb21wb25lbnRzIGV4aXN0LlxuICogQGRlZmF1bHQgJy4vc3JjL2NvbXBvbmVudHMnXG4gKi9cbmV4cG9ydCBjb25zdCBjb21wb25lbnRzID0gJy4vY29tcG9uZW50cydcblxuLyoqXG4gKiBUZW1wbGF0ZSBmb3IgY3JlYXRpbmcgcGFnZSBhbmQgY29tcG9uZW50LlxuICovXG5leHBvcnQgY29uc3QgdGVtcGxhdGUgPSB7XG4gICAgcGFnZTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL3RlbXBsYXRlL3BhZ2UnKSxcbiAgICBjb21wb25lbnQ6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi90ZW1wbGF0ZS9jb21wb25lbnQnKVxufVxuXG4vKipcbiAqIFRoZSBwYXRoIHdoZXJlIFdlQ2hhdCBtaW5pcHJvZ3JhbSBzdWJwYWNrYWdlcyBleGlzdC5cbiAqIEBkZWZhdWx0ICcuL3NyYy9zdWJQYWNrYWdlcydcbiAqL1xuZXhwb3J0IGNvbnN0IHN1YlBhY2thZ2VzID0gJy4vc3ViUGFja2FnZXMnXG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogICAgICAgICAgICAgICAgIEN1c3RvbSBjb25maWd1cmVcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuLyoqXG4gKiBXaGV0aGVyIHRvIG91dHB1dCBjb21waWxlIGluZm9ybWF0aW9uLlxuICogQGRlZmF1bHQgZmFsc2VcbiAqL1xuZXhwb3J0IGNvbnN0IHF1aWV0ID0gZmFsc2VcblxuLyoqXG4gKiBBbmthIGRldmVsb3BtZW50IG1vZGUuXG4gKiBAZGVmYXVsdCBmYWxzZVxuICovXG5leHBvcnQgY29uc3QgZGV2TW9kZSA9IGZhbHNlXG5cbi8qKlxuICogUmVnaXN0ZXIgZmlsZSBwYXJzZXIuXG4gKi9cbmV4cG9ydCBjb25zdCBwYXJzZXJzOiBQYXJzZXJzQ29uZmlncmF0aW9uID0gW1xuICAgIHtcbiAgICAgICAgbWF0Y2g6IC8uKlxcLihqc3xlcykkLyxcbiAgICAgICAgcGFyc2VyczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcnNlcjogYmFiZWxQYXJzZXIsXG4gICAgICAgICAgICAgICAgb3B0aW9uczoge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgIH0sXG4gICAge1xuICAgICAgICBtYXRjaDogLy4qXFwuKHd4c3N8Y3NzfHBvc3Rjc3MpJC8sXG4gICAgICAgIHBhcnNlcnM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwYXJzZXI6IHN0eWxlUGFyc2VyLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IHt9XG4gICAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbWF0Y2g6IC8uKlxcLihzYXNzfHNjc3MpJC8sXG4gICAgICAgIHBhcnNlcnM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwYXJzZXI6IHNhc3NQYXJzZXIsXG4gICAgICAgICAgICAgICAgb3B0aW9uczoge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgIH0sXG4gICAge1xuICAgICAgICBtYXRjaDogLy4qXFwuKHRzfHR5cGVzY3JpcHQpJC8sXG4gICAgICAgIHBhcnNlcnM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwYXJzZXI6IHR5cGVzY3JpcHRQYXJzZXIsXG4gICAgICAgICAgICAgICAgb3B0aW9uczoge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgIH1cbl1cblxuLyoqXG4gKiBXaGV0aGVyIHRvIG91dHB1dCBkZWJ1ZyBpbmZvcm1hdGlvbi5cbiAqIEBkZWZhdWx0IGZhbHNlXG4gKi9cbmV4cG9ydCBjb25zdCBkZWJ1ZzogYm9vbGVhbiA9IGZhbHNlXG5cbi8qKlxuICogUmVnaXN0ZXIgcGx1Z2luLlxuICovXG5leHBvcnQgY29uc3QgcGx1Z2luczogUGx1Z2luc0NvbmZpZ3JhdGlvbiA9IFtcbiAgICB7XG4gICAgICAgIHBsdWdpbjogZXh0cmFjdERlcGVuZGVuY3lQbHVnaW4sXG4gICAgICAgIG9wdGlvbnM6IHt9XG4gICAgfSxcbiAgICB7XG4gICAgICAgIHBsdWdpbjogd3hJbXBvcnRQbHVnaW4sXG4gICAgICAgIG9wdGlvbnM6IHt9XG4gICAgfSxcbiAgICB7XG4gICAgICAgIHBsdWdpbjogc2F2ZUZpbGVQbHVnaW4sXG4gICAgICAgIG9wdGlvbnM6IHt9XG4gICAgfVxuXVxuXG4vKipcbiAqIEZpbGVzIHRoYXQgd2lsbCBiZSBpZ25vcmVkIGluIGNvbXBpbGF0aW9uLlxuICovXG5leHBvcnQgY29uc3QgaWdub3JlZDogSWdub3JlZENvbmZpZ3JhdGlvbiA9IFtdXG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogICAgICAgICAgICAgICBleHBlcmltZW50YWwgY29uZmlndXJlXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiIsImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCByZXNvbHZlQ29uZmlnIGZyb20gJy4uL3V0aWxzL3Jlc29sdmVDb25maWcnXG5pbXBvcnQgKiBhcyBhbmthRGVmYXVsdENvbmZpZyBmcm9tICcuL2Fua2FEZWZhdWx0Q29uZmlnJ1xuXG5pbXBvcnQge1xuICAgIEFua2FDb25maWdcbn0gZnJvbSAnLi4vLi4vdHlwZXMvdHlwZXMnXG5cbmNvbnN0IGN3ZCA9IHByb2Nlc3MuY3dkKClcbmNvbnN0IGN1c3RvbUNvbmZpZyA9IDxBbmthQ29uZmlnPnJlc29sdmVDb25maWcoWydhbmthLmNvbmZpZy5qcycsICdhbmthLmNvbmZpZy5qc29uJ10pXG5cbmZ1bmN0aW9uIG1lcmdlQXJyYXkgPFQ+ICguLi5hcnJzOiBBcnJheTxUW10+KTogQXJyYXk8VD4ge1xuICAgIHJldHVybiBhcnJzLmZpbHRlcihhcnIgPT4gYXJyICYmIGFyci5sZW5ndGgpLnJlZHVjZSgocHJldiwgbmV4dCkgPT4ge1xuICAgICAgICByZXR1cm4gcHJldi5jb25jYXQobmV4dClcbiAgICB9LCBbXSlcbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICAgIC4uLmFua2FEZWZhdWx0Q29uZmlnLFxuICAgIC4uLmN1c3RvbUNvbmZpZyxcbiAgICB0ZW1wbGF0ZTogY3VzdG9tQ29uZmlnLnRlbXBsYXRlID8ge1xuICAgICAgICBwYWdlOiBwYXRoLmpvaW4oY3dkLCBjdXN0b21Db25maWcudGVtcGxhdGUucGFnZSksXG4gICAgICAgIGNvbXBvbmVudDogcGF0aC5qb2luKGN3ZCwgY3VzdG9tQ29uZmlnLnRlbXBsYXRlLmNvbXBvbmVudClcbiAgICB9IDogYW5rYURlZmF1bHRDb25maWcudGVtcGxhdGUsXG4gICAgcGFyc2VyczogbWVyZ2VBcnJheShjdXN0b21Db25maWcucGFyc2VycywgYW5rYURlZmF1bHRDb25maWcucGFyc2VycyksXG4gICAgcGx1Z2luczogbWVyZ2VBcnJheShjdXN0b21Db25maWcucGx1Z2lucywgYW5rYURlZmF1bHRDb25maWcucGx1Z2lucyksXG4gICAgaWdub3JlZDogbWVyZ2VBcnJheShjdXN0b21Db25maWcuaWdub3JlZCwgYW5rYURlZmF1bHRDb25maWcuaWdub3JlZClcbn1cbiIsImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBhbmthQ29uZmlnIGZyb20gJy4vYW5rYUNvbmZpZydcblxuZXhwb3J0IGNvbnN0IGN3ZCA9IHByb2Nlc3MuY3dkKClcbmV4cG9ydCBjb25zdCBzcmNEaXIgPSBwYXRoLnJlc29sdmUoY3dkLCBhbmthQ29uZmlnLnNvdXJjZURpcilcbmV4cG9ydCBjb25zdCBkaXN0RGlyID0gcGF0aC5yZXNvbHZlKGN3ZCwgYW5rYUNvbmZpZy5vdXRwdXREaXIpXG5leHBvcnQgY29uc3QgYW5rYU1vZHVsZXMgPSBwYXRoLnJlc29sdmUoc3JjRGlyLCAnYW5rYV9tb2R1bGVzJylcbmV4cG9ydCBjb25zdCBzb3VyY2VOb2RlTW9kdWxlcyA9IHBhdGgucmVzb2x2ZShjd2QsICdub2RlX21vZHVsZXMnKVxuZXhwb3J0IGNvbnN0IGRpc3ROb2RlTW9kdWxlcyA9IHBhdGgucmVzb2x2ZShkaXN0RGlyLCAnbnBtX21vZHVsZXMnKVxuZXhwb3J0IGNvbnN0IGRlZmF1bHRTY2FmZm9sZCA9ICAnaUV4Y2VwdGlvbi9hbmthLXF1aWNrc3RhcnQnXG4iLCJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSdcbmltcG9ydCBhbmthQ29uZmlnIGZyb20gJy4vYW5rYUNvbmZpZydcbmltcG9ydCAqIGFzIHN5c3RlbSBmcm9tICcuL3N5c3RlbUNvbmZpZydcbmltcG9ydCByZXNvbHZlQ29uZmlnIGZyb20gJy4uL3V0aWxzL3Jlc29sdmVDb25maWcnXG5cbmNvbnN0IGN1c3RvbUNvbmZpZyA9IHJlc29sdmVDb25maWcoWydhcHAuanNvbiddLCBzeXN0ZW0uc3JjRGlyKVxuXG5leHBvcnQgZGVmYXVsdCBPYmplY3QuYXNzaWduKHtcbiAgICBwYWdlczogW10sXG4gICAgc3ViUGFja2FnZXM6IFtdLFxuICAgIHdpbmRvdzoge1xuICAgICAgICBuYXZpZ2F0aW9uQmFyVGl0bGVUZXh0OiAnV2VjaGF0J1xuICAgIH1cbiAgICAvLyB0YWJCYXI6IHtcbiAgICAvLyAgICAgbGlzdDogW11cbiAgICAvLyB9LFxufSwgY3VzdG9tQ29uZmlnKVxuIiwiaW1wb3J0ICogYXMgc3lzdGVtQ29uZmlnIGZyb20gJy4vc3lzdGVtQ29uZmlnJ1xuaW1wb3J0IGFua2FDb25maWcgZnJvbSAnLi9hbmthQ29uZmlnJ1xuaW1wb3J0IHByb2plY3RDb25maWcgZnJvbSAnLi9wcm9qZWN0Q29uZmlnJ1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgLi4uc3lzdGVtQ29uZmlnLFxuICAgIGFua2FDb25maWcsXG4gICAgcHJvamVjdENvbmZpZ1xufVxuIiwiaW1wb3J0ICogYXMgR2xvYiBmcm9tICdnbG9iJ1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnXG5jb25zdCBnbG9iID0gcmVxdWlyZSgnZ2xvYicpXG5cbmltcG9ydCB7XG4gICAgQ29udGVudFxufSBmcm9tICcuLi8uLi90eXBlcy90eXBlcydcblxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZEZpbGUgKHNvdXJjZUZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPEJ1ZmZlcj4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGZzLnJlYWRGaWxlKHNvdXJjZUZpbGVQYXRoLCAoZXJyLCBidWZmZXIpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKGJ1ZmZlcilcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVGaWxlICh0YXJnZXRGaWxlUGF0aDogc3RyaW5nLCBjb250ZW50OiBDb250ZW50KTogUHJvbWlzZTx1bmRlZmluZWQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBmcy53cml0ZUZpbGUodGFyZ2V0RmlsZVBhdGgsIGNvbnRlbnQsIGVyciA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlYXJjaEZpbGVzIChzY2hlbWU6IHN0cmluZywgb3B0aW9ucz86IEdsb2IuSU9wdGlvbnMpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgZ2xvYihzY2hlbWUsIG9wdGlvbnMsIChlcnI6IChFcnJvciB8IG51bGwpLCBmaWxlczogQXJyYXk8c3RyaW5nPik6IHZvaWQgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoZmlsZXMpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfSlcbn1cbiIsImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJ1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuLi8uLi9jb25maWcnXG5pbXBvcnQgKiBhcyB0IGZyb20gJ0BiYWJlbC90eXBlcydcbmltcG9ydCAqIGFzIFBvc3RDU1MgZnJvbSAncG9zdGNzcydcbmltcG9ydCB7XG4gICAgQ29udGVudCxcbiAgICBGaWxlQ29uc3RydWN0b3JPcHRpb25cbn0gZnJvbSAnLi4vLi4vLi4vdHlwZXMvdHlwZXMnXG5cbmNvbnN0IHJlcGxhY2VFeHQgPSByZXF1aXJlKCdyZXBsYWNlLWV4dCcpXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZpbGUge1xuICAgIHB1YmxpYyBzb3VyY2VGaWxlOiBzdHJpbmdcbiAgICBwdWJsaWMgY29udGVudDogQ29udGVudFxuICAgIHB1YmxpYyB0YXJnZXRGaWxlOiBzdHJpbmdcbiAgICBwdWJsaWMgYXN0PzogdC5Ob2RlIHwgUG9zdENTUy5SZXN1bHRcbiAgICBwdWJsaWMgc291cmNlTWFwPzogQ29udGVudFxuICAgIHB1YmxpYyBpc0luU3JjRGlyPzogYm9vbGVhblxuXG4gICAgY29uc3RydWN0b3IgKG9wdGlvbjogRmlsZUNvbnN0cnVjdG9yT3B0aW9uKSB7XG4gICAgICAgIGNvbnN0IGlzSW5TcmNEaXJUZXN0ID0gbmV3IFJlZ0V4cChgXiR7Y29uZmlnLnNyY0Rpcn1gKVxuXG4gICAgICAgIGlmICghb3B0aW9uLnNvdXJjZUZpbGUpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCB2YWx1ZTogRmlsZUNvbnN0cnVjdG9yT3B0aW9uLnNvdXJjZUZpbGUnKVxuICAgICAgICBpZiAoIW9wdGlvbi5jb250ZW50KSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgdmFsdWU6IEZpbGVDb25zdHJ1Y3Rvck9wdGlvbi5jb250ZW50JylcblxuICAgICAgICB0aGlzLnNvdXJjZUZpbGUgPSBvcHRpb24uc291cmNlRmlsZVxuICAgICAgICB0aGlzLnRhcmdldEZpbGUgPSBvcHRpb24udGFyZ2V0RmlsZSB8fCBvcHRpb24uc291cmNlRmlsZS5yZXBsYWNlKGNvbmZpZy5zcmNEaXIsIGNvbmZpZy5kaXN0RGlyKSAvLyBEZWZhdWx0IHZhbHVlXG4gICAgICAgIHRoaXMuY29udGVudCA9IG9wdGlvbi5jb250ZW50XG4gICAgICAgIHRoaXMuc291cmNlTWFwID0gb3B0aW9uLnNvdXJjZU1hcFxuICAgICAgICB0aGlzLmlzSW5TcmNEaXIgPSBpc0luU3JjRGlyVGVzdC50ZXN0KHRoaXMuc291cmNlRmlsZSlcbiAgICB9XG5cbiAgICBnZXQgZGlybmFtZSAoKSB7XG4gICAgICAgIHJldHVybiBwYXRoLmRpcm5hbWUodGhpcy50YXJnZXRGaWxlKVxuICAgIH1cblxuICAgIGdldCBiYXNlbmFtZSAoKSB7XG4gICAgICAgIHJldHVybiBwYXRoLmJhc2VuYW1lKHRoaXMudGFyZ2V0RmlsZSlcbiAgICB9XG5cbiAgICBnZXQgZXh0bmFtZSAoKSB7XG4gICAgICAgIHJldHVybiBwYXRoLmV4dG5hbWUodGhpcy50YXJnZXRGaWxlKVxuICAgIH1cblxuICAgIGFzeW5jIHNhdmVUbyAocGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGF3YWl0IGZzLmVuc3VyZUZpbGUocGF0aClcblxuICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwYXRoJylcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVwZGF0ZUV4dCAoZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgdGhpcy50YXJnZXRGaWxlID0gcmVwbGFjZUV4dCh0aGlzLnRhcmdldEZpbGUsIGV4dClcbiAgICB9XG5cbiAgICBjb252ZXJ0Q29udGVudFRvU3RyaW5nICgpIHtcbiAgICAgICAgaWYgKHRoaXMuY29udGVudCBpbnN0YW5jZW9mIEJ1ZmZlcikge1xuICAgICAgICAgICAgdGhpcy5jb250ZW50ID0gdGhpcy5jb250ZW50LnRvU3RyaW5nKClcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsImltcG9ydCB7XG4gICAgcmVhZEZpbGVcbn0gZnJvbSAnLi9mcydcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJ1xuaW1wb3J0IEZpbGUgZnJvbSAnLi4vY29yZS9jbGFzcy9GaWxlJ1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRmlsZSAoc291cmNlRmlsZTogc3RyaW5nKTogUHJvbWlzZTxGaWxlPiB7XG4gICAgcmV0dXJuIHJlYWRGaWxlKHNvdXJjZUZpbGUpLnRoZW4oY29udGVudCA9PiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IEZpbGUoe1xuICAgICAgICAgICAgc291cmNlRmlsZSxcbiAgICAgICAgICAgIGNvbnRlbnRcbiAgICAgICAgfSkpXG4gICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUZpbGVTeW5jIChzb3VyY2VGaWxlOiBzdHJpbmcpIHtcbiAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHNvdXJjZUZpbGUpXG4gICAgcmV0dXJuIG5ldyBGaWxlKHtcbiAgICAgICAgc291cmNlRmlsZSxcbiAgICAgICAgY29udGVudFxuICAgIH0pXG59XG4iLCJpbXBvcnQgeyBPcHRpb25zIGFzIFRlbXBsYXRlT3B0aW9ucyB9IGZyb20gJ2VqcydcbmltcG9ydCB7IG1lbUZzRWRpdG9yIGFzIE1lbUZzRWRpdG9yIH0gZnJvbSAnbWVtLWZzLWVkaXRvcidcblxuY29uc3QgbWVtRnMgPSByZXF1aXJlKCdtZW0tZnMnKVxuY29uc3QgbWVtRnNFZGl0b3IgPSByZXF1aXJlKCdtZW0tZnMtZWRpdG9yJylcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRnNFZGl0b3Ige1xuICAgIGVkaXRvcjogTWVtRnNFZGl0b3IuRWRpdG9yXG5cbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIGNvbnN0IHN0b3JlID0gbWVtRnMuY3JlYXRlKClcblxuICAgICAgICB0aGlzLmVkaXRvciA9IG1lbUZzRWRpdG9yLmNyZWF0ZShzdG9yZSlcbiAgICB9XG5cbiAgICBjb3B5IChmcm9tOiBzdHJpbmcsIHRvOiBzdHJpbmcsIGNvbnRleHQ6IG9iamVjdCwgdGVtcGxhdGVPcHRpb25zPzogVGVtcGxhdGVPcHRpb25zLCBjb3B5T3B0aW9ucz86IE1lbUZzRWRpdG9yLkNvcHlPcHRpb25zKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZWRpdG9yLmNvcHlUcGwoZnJvbSwgdG8sIGNvbnRleHQsIHRlbXBsYXRlT3B0aW9ucywgY29weU9wdGlvbnMpXG4gICAgfVxuXG4gICAgd3JpdGUgKGZpbGVwYXRoOiBzdHJpbmcsIGNvbnRlbnRzOiBNZW1Gc0VkaXRvci5Db250ZW50cyk6IHZvaWQge1xuICAgICAgICB0aGlzLmVkaXRvci53cml0ZShmaWxlcGF0aCwgY29udGVudHMpXG4gICAgfVxuXG4gICAgd3JpdGVKU09OIChmaWxlcGF0aDogc3RyaW5nLCBjb250ZW50czogYW55LCByZXBsYWNlcj86IE1lbUZzRWRpdG9yLlJlcGxhY2VyRnVuYywgc3BhY2U/OiBNZW1Gc0VkaXRvci5TcGFjZSk6IHZvaWQge1xuICAgICAgICB0aGlzLmVkaXRvci53cml0ZUpTT04oZmlsZXBhdGgsIGNvbnRlbnRzLCByZXBsYWNlciB8fCBudWxsLCBzcGFjZSA9IDQpXG4gICAgfVxuXG4gICAgcmVhZCAoZmlsZXBhdGg6IHN0cmluZywgb3B0aW9ucz86IHsgcmF3OiBib29sZWFuLCBkZWZhdWx0czogc3RyaW5nIH0pOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5lZGl0b3IucmVhZChmaWxlcGF0aCwgb3B0aW9ucylcbiAgICB9XG5cbiAgICByZWFkSlNPTiAoZmlsZXBhdGg6IHN0cmluZywgZGVmYXVsdHM/OiBhbnkpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5lZGl0b3IucmVhZEpTT04oZmlsZXBhdGgsIGRlZmF1bHRzKVxuICAgIH1cblxuICAgIHNhdmUgKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yLmNvbW1pdChyZXNvbHZlKVxuICAgICAgICB9KVxuICAgIH1cbn1cbiIsImltcG9ydCBsb2cgZnJvbSAnLi9sb2dnZXInXG5pbXBvcnQgYW5rYUNvbmZpZyBmcm9tICcuLi9jb25maWcvYW5rYUNvbmZpZydcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKGlkOiBzdHJpbmcsIG9wdGlvbnM/OiB7IHBhdGhzPzogc3RyaW5nW10gfSk6IHN0cmluZyB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUucmVzb2x2ZShpZCwgb3B0aW9ucylcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgbG9nLmVycm9yKCdNaXNzaW5nIGRlcGVuZGVuY3knLCBpZCwgIWFua2FDb25maWcucXVpZXQgPyBgaW4gJHtvcHRpb25zLnBhdGhzfWAgOiBudWxsKVxuICAgIH1cbn1cbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNhbGxQcm9taXNlSW5DaGFpbiAobGlzdDogQXJyYXk8KC4uLnBhcmFtczogYW55W10pID0+IFByb21pc2U8YW55Pj4gPSBbXSwgLi4ucGFyYW1zOiBBcnJheTxhbnk+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgaWYgKCFsaXN0Lmxlbmd0aCkgIHtcbiAgICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgbGV0IHN0ZXAgPSBsaXN0WzBdKC4uLnBhcmFtcylcblxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHN0ZXAgPSBzdGVwLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsaXN0W2ldKC4uLnBhcmFtcylcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICBzdGVwLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICB9LCBlcnIgPT4ge1xuICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgfSlcbiAgICB9KVxufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKGZuOiBGdW5jdGlvbik6ICgpID0+IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBmdW5jdGlvbiAoLi4ucGFyYW1zOiBBcnJheTxhbnk+KSB7XG4gICAgICAgIGNvbnN0IGxpbWl0YXRpb24gPSBwYXJhbXMubGVuZ3RoXG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgaWYgKGZuLmxlbmd0aCA+IGxpbWl0YXRpb24pIHtcbiAgICAgICAgICAgICAgICBmbiguLi5wYXJhbXMsIHJlc29sdmUpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoZm4oLi4ucGFyYW1zKSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBjaG9raWRhciBmcm9tICdjaG9raWRhcidcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKGRpcjogc3RyaW5nIHwgc3RyaW5nW10sIG9wdGlvbnM/OiBjaG9raWRhci5XYXRjaE9wdGlvbnMpOiBjaG9raWRhci5GU1dhdGNoZXIge1xuICAgIHJldHVybiBjaG9raWRhci53YXRjaChkaXIsIHtcbiAgICAgICAgcGVyc2lzdGVudDogdHJ1ZSxcbiAgICAgICAgaWdub3JlSW5pdGlhbDogdHJ1ZSxcbiAgICAgICAgLi4ub3B0aW9uc1xuICAgIH0pXG59XG4iLCJkZWNsYXJlIHR5cGUgVmFsaWRhdGVOcG1QYWNrYWdlTmFtZSA9IHtcbiAgICB2YWxpZEZvck5ld1BhY2thZ2VzOiBib29sZWFuLFxuICAgIHZhbGlkRm9yT2xkUGFja2FnZXM6IGJvb2xlYW5cbn1cblxuY29uc3QgdmFsaWRhdGUgPSByZXF1aXJlKCd2YWxpZGF0ZS1ucG0tcGFja2FnZS1uYW1lJylcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKHJlcXVpcmVkOiBzdHJpbmcgPSAnJyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IDxWYWxpZGF0ZU5wbVBhY2thZ2VOYW1lPnZhbGlkYXRlKHJlcXVpcmVkKVxuXG4gICAgcmV0dXJuIHJlc3VsdC52YWxpZEZvck5ld1BhY2thZ2VzIHx8IHJlc3VsdC52YWxpZEZvck9sZFBhY2thZ2VzXG59XG4iLCJpbXBvcnQgZG93bmxvYWRSZXBvIGZyb20gJ2Rvd25sb2FkLWdpdC1yZXBvJ1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAocmVwbzogc3RyaW5nLCBwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBkb3dubG9hZFJlcG8ocmVwbywgcGF0aCwgeyBjbG9uZTogZmFsc2UgfSwgKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgIGVyciA/IHJlamVjdChlcnIpIDogcmVzb2x2ZSgpXG4gICAgICAgIH0pXG4gICAgfSlcbn1cbiIsImltcG9ydCBDb21waWxlciBmcm9tICcuL0NvbXBpbGVyJ1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuLi8uLi9jb25maWcnXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi8uLi91dGlscydcblxuaW1wb3J0IHtcbiAgICBVdGlscyxcbiAgICBBbmthQ29uZmlnLFxuICAgIFBhcnNlck9wdGlvbnMsXG4gICAgUHJvamVjdENvbmZpZyxcbiAgICBQbHVnaW5IYW5kbGVyLFxuICAgIFBsdWdpbk9wdGlvbnMsXG4gICAgQ29tcGlsZXJDb25maWdcbn0gZnJvbSAnLi4vLi4vLi4vdHlwZXMvdHlwZXMnXG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBJbmplY3Rpb24ge1xuICAgIGNvbXBpbGVyOiBDb21waWxlclxuICAgIG9wdGlvbnM6IG9iamVjdFxuXG4gICAgY29uc3RydWN0b3IgKGNvbXBpbGVyOiBDb21waWxlciwgb3B0aW9ucz86IG9iamVjdCkge1xuICAgICAgICB0aGlzLmNvbXBpbGVyID0gY29tcGlsZXJcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9uc1xuICAgIH1cblxuICAgIGFic3RyYWN0IGdldE9wdGlvbnMgKCk6IG9iamVjdFxuXG4gICAgZ2V0Q29tcGlsZXIgKCk6IENvbXBpbGVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcGlsZXJcbiAgICB9XG5cbiAgICBnZXRVdGlscyAoKSB7XG4gICAgICAgIHJldHVybiB1dGlsc1xuICAgIH1cblxuICAgIGdldEFua2FDb25maWcgKCk6IEFua2FDb25maWcge1xuICAgICAgICByZXR1cm4gY29uZmlnLmFua2FDb25maWdcbiAgICB9XG5cbiAgICBnZXRTeXN0ZW1Db25maWcgKCk6IENvbXBpbGVyQ29uZmlnIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZ1xuICAgIH1cblxuICAgIGdldFByb2plY3RDb25maWcgKCk6IFByb2plY3RDb25maWcge1xuICAgICAgICByZXR1cm4gY29uZmlnLnByb2plY3RDb25maWdcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBQbHVnaW5JbmplY3Rpb24gZXh0ZW5kcyBJbmplY3Rpb24ge1xuXG4gICAgY29uc3RydWN0b3IgKGNvbXBpbGVyOiBDb21waWxlciwgb3B0aW9uczogUGx1Z2luT3B0aW9uc1snb3B0aW9ucyddKSB7XG4gICAgICAgIHN1cGVyKGNvbXBpbGVyLCBvcHRpb25zKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybiBQbHVnaW4gb3B0aW9uc1xuICAgICAqL1xuICAgIGdldE9wdGlvbnMgKCk6IG9iamVjdCB7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMgfHwge31cbiAgICB9XG5cbiAgICBvbiAoZXZlbnQ6IHN0cmluZywgaGFuZGxlcjogUGx1Z2luSGFuZGxlcik6IHZvaWQge1xuICAgICAgICB0aGlzLmNvbXBpbGVyLm9uKGV2ZW50LCBoYW5kbGVyKVxuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFBhcnNlckluamVjdGlvbiBleHRlbmRzIEluamVjdGlvbiB7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gUGFyc2VyT3B0aW9uc1xuICAgICAqL1xuICAgIGdldE9wdGlvbnMgKCk6IG9iamVjdCB7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMgfHwge31cbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvciAoY29tcGlsZXI6IENvbXBpbGVyLCBvcHRpb25zOiBQYXJzZXJPcHRpb25zWydvcHRpb25zJ10pIHtcbiAgICAgICAgc3VwZXIoY29tcGlsZXIsIG9wdGlvbnMpXG4gICAgfVxufVxuIiwiaW1wb3J0IEZpbGUgZnJvbSAnLi9GaWxlJ1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuLi8uLi9jb25maWcnXG5pbXBvcnQgQ29tcGlsZXIgZnJvbSAnLi9Db21waWxlcidcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uLy4uL3V0aWxzJ1xuXG5pbXBvcnQge1xuICAgIFBhcnNlcixcbiAgICBNYXRjaGVyLFxuICAgIFBsdWdpbkhhbmRsZXIsXG4gICAgUGx1Z2luT3B0aW9ucyxcbiAgICBDb21waWxlckNvbmZpZ1xufSBmcm9tICcuLi8uLi8uLi90eXBlcy90eXBlcydcblxuLyoqXG4gKiBBIGNvbXBpbGF0aW9uIHRhc2tcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29tcGlsYXRpb24ge1xuICAgIGNvbmZpZzogQ29tcGlsZXJDb25maWdcbiAgICByZWFkb25seSBjb21waWxlcjogQ29tcGlsZXJcbiAgICBpZDogbnVtYmVyICAgICAgICAvLyBVbmlxdWXvvIxmb3IgZWFjaCBDb21waWxhdGlvblxuICAgIGZpbGU6IEZpbGVcbiAgICBzb3VyY2VGaWxlOiBzdHJpbmdcbiAgICBkZXN0cm95ZWQ6IGJvb2xlYW5cblxuICAgIGNvbnN0cnVjdG9yIChmaWxlOiBGaWxlIHwgc3RyaW5nLCBjb25mOiBDb21waWxlckNvbmZpZywgY29tcGlsZXI6IENvbXBpbGVyKSB7XG4gICAgICAgIHRoaXMuY29tcGlsZXIgPSBjb21waWxlclxuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZcbiAgICAgICAgdGhpcy5pZCA9IENvbXBpbGVyLmNvbXBpbGF0aW9uSWQrK1xuXG4gICAgICAgIGlmIChmaWxlIGluc3RhbmNlb2YgRmlsZSkge1xuICAgICAgICAgICAgdGhpcy5maWxlID0gZmlsZVxuICAgICAgICAgICAgdGhpcy5zb3VyY2VGaWxlID0gZmlsZS5zb3VyY2VGaWxlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNvdXJjZUZpbGUgPSBmaWxlXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmVucm9sbCgpXG4gICAgfVxuXG4gICAgYXN5bmMgcnVuICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMubG9hZEZpbGUoKVxuICAgICAgICAgICAgYXdhaXQgdGhpcy5pbnZva2VQYXJzZXJzKClcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY29tcGlsZSgpXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHV0aWxzLmxvZ2dlci5lcnJvcignQ29tcGlsZScsIGUubWVzc2FnZSwgZSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGxvYWRGaWxlICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKHRoaXMuZGVzdHJveWVkKSByZXR1cm5cblxuICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGVyLmVtaXQoJ2JlZm9yZS1sb2FkLWZpbGUnLCB0aGlzKVxuICAgICAgICBpZiAoISh0aGlzLmZpbGUgaW5zdGFuY2VvZiBGaWxlKSkge1xuICAgICAgICAgICAgdGhpcy5maWxlID0gYXdhaXQgdXRpbHMuY3JlYXRlRmlsZSh0aGlzLnNvdXJjZUZpbGUpXG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGVyLmVtaXQoJ2FmdGVyLWxvYWQtZmlsZScsIHRoaXMpXG4gICAgfVxuXG4gICAgYXN5bmMgaW52b2tlUGFyc2VycyAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICh0aGlzLmRlc3Ryb3llZCkgcmV0dXJuXG5cbiAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuZmlsZVxuICAgICAgICBjb25zdCBwYXJzZXJzID0gPFBhcnNlcltdPnRoaXMuY29tcGlsZXIucGFyc2Vycy5maWx0ZXIoKG1hdGNoZXJzOiBNYXRjaGVyKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hlcnMubWF0Y2gudGVzdChmaWxlLnNvdXJjZUZpbGUpXG4gICAgICAgIH0pLm1hcCgobWF0Y2hlcnM6IE1hdGNoZXIpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBtYXRjaGVycy5wYXJzZXJzXG4gICAgICAgIH0pLnJlZHVjZSgocHJldiwgbmV4dCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHByZXYuY29uY2F0KG5leHQpXG4gICAgICAgIH0sIFtdKVxuICAgICAgICBjb25zdCB0YXNrcyA9IHBhcnNlcnMubWFwKHBhcnNlciA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdXRpbHMuYXN5bmNGdW5jdGlvbldyYXBwZXIocGFyc2VyKVxuICAgICAgICB9KVxuXG4gICAgICAgIGF3YWl0IHRoaXMuY29tcGlsZXIuZW1pdCgnYmVmb3JlLXBhcnNlJywgdGhpcylcbiAgICAgICAgYXdhaXQgdXRpbHMuY2FsbFByb21pc2VJbkNoYWluKHRhc2tzLCBmaWxlLCB0aGlzKVxuICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGVyLmVtaXQoJ2FmdGVyLXBhcnNlJywgdGhpcylcbiAgICB9XG5cbiAgICBhc3luYyBjb21waWxlICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKHRoaXMuZGVzdHJveWVkKSByZXR1cm5cblxuICAgICAgICAvLyBJbnZva2UgRXh0cmFjdERlcGVuZGVuY3lQbHVnaW4uXG4gICAgICAgIGF3YWl0IHRoaXMuY29tcGlsZXIuZW1pdCgnYmVmb3JlLWNvbXBpbGUnLCB0aGlzKVxuICAgICAgICAvLyBEbyBzb21ldGhpbmcgZWxzZS5cbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlci5lbWl0KCdhZnRlci1jb21waWxlJywgdGhpcylcbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlci5lbWl0KCdzYXZlJywgdGhpcylcbiAgICAgICAgIXRoaXMuY29uZmlnLmFua2FDb25maWcucXVpZXQgJiYgIHV0aWxzLmxvZ2dlci5pbmZvKCdDb21waWxlJywgIHRoaXMuZmlsZS5zb3VyY2VGaWxlLnJlcGxhY2UoYCR7Y29uZmlnLmN3ZH0ke3BhdGguc2VwfWAsICcnKSlcbiAgICAgICAgdGhpcy5kZXN0cm95KClcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBvbiBDb21waWxlciBhbmQgZGVzdHJveSB0aGUgcHJldmlvdXMgb25lIGlmIGNvbmZsaWN0IGFyaXNlcy5cbiAgICAgKi9cbiAgICBlbnJvbGwgKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBvbGRDb21waWxhdGlvbiA9IENvbXBpbGVyLmNvbXBpbGF0aW9uUG9vbC5nZXQodGhpcy5zb3VyY2VGaWxlKVxuXG4gICAgICAgIGlmIChvbGRDb21waWxhdGlvbikge1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5hbmthQ29uZmlnLmRlYnVnKSBjb25zb2xlLmxvZygnXGJEZXN0cm95IENvbXBpbGF0aW9uJywgb2xkQ29tcGlsYXRpb24uaWQsIG9sZENvbXBpbGF0aW9uLnNvdXJjZUZpbGUpXG5cbiAgICAgICAgICAgIG9sZENvbXBpbGF0aW9uLmRlc3Ryb3koKVxuICAgICAgICB9XG4gICAgICAgIENvbXBpbGVyLmNvbXBpbGF0aW9uUG9vbC5zZXQodGhpcy5zb3VyY2VGaWxlLCB0aGlzKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVucmVnaXN0ZXIgdGhlbXNlbHZlcyBmcm9tIENvbXBpbGVyLlxuICAgICAqL1xuICAgIGRlc3Ryb3kgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmRlc3Ryb3llZCA9IHRydWVcbiAgICAgICAgQ29tcGlsZXIuY29tcGlsYXRpb25Qb29sLmRlbGV0ZSh0aGlzLnNvdXJjZUZpbGUpXG4gICAgfVxufVxuIiwiaW1wb3J0IHtcbiAgICBQYXJzZXJJbmplY3Rpb24sXG4gICAgUGx1Z2luSW5qZWN0aW9uXG59IGZyb20gJy4vSW5qZWN0aW9uJ1xuaW1wb3J0IEZpbGUgZnJvbSAnLi9GaWxlJ1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnXG5pbXBvcnQgY29uZmlnIGZyb20gJy4uLy4uL2NvbmZpZydcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uLy4uL3V0aWxzJ1xuaW1wb3J0IENvbXBpbGF0aW9uIGZyb20gJy4vQ29tcGlsYXRpb24nXG5pbXBvcnQgY2FsbFByb21pc2VJbkNoYWluIGZyb20gJy4uLy4uL3V0aWxzL2NhbGxQcm9taXNlSW5DaGFpbidcbmltcG9ydCBhc3luY0Z1bmN0aW9uV3JhcHBlciBmcm9tICcuLi8uLi91dGlscy9hc3luY0Z1bmN0aW9uV3JhcHBlcidcblxuaW1wb3J0IHtcbiAgICBQYXJzZXIsXG4gICAgUGFyc2VyT3B0aW9ucyxcbiAgICBQbHVnaW5IYW5kbGVyLFxuICAgIFBsdWdpbk9wdGlvbnMsXG4gICAgQ29tcGlsZXJDb25maWdcbn0gZnJvbSAnLi4vLi4vLi4vdHlwZXMvdHlwZXMnXG5cbmNvbnN0IHsgbG9nZ2VyIH0gPSB1dGlsc1xuY29uc3QgZGVsID0gcmVxdWlyZSgnZGVsJylcblxuLyoqXG4gKiBUaGUgY29yZSBjb21waWxlci5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29tcGlsZXIge1xuICAgIHJlYWRvbmx5IGNvbmZpZzogQ29tcGlsZXJDb25maWdcbiAgICBwdWJsaWMgc3RhdGljIGNvbXBpbGF0aW9uSWQgPSAxXG4gICAgcHVibGljIHN0YXRpYyBjb21waWxhdGlvblBvb2wgPSBuZXcgTWFwPHN0cmluZywgQ29tcGlsYXRpb24+KClcbiAgICBwbHVnaW5zOiB7XG4gICAgICAgIFtldmVudE5hbWU6IHN0cmluZ106IEFycmF5PFBsdWdpbkhhbmRsZXI+XG4gICAgfSA9IHtcbiAgICAgICAgJ2JlZm9yZS1sb2FkLWZpbGUnOiBbXSxcbiAgICAgICAgJ2FmdGVyLWxvYWQtZmlsZSc6IFtdLFxuICAgICAgICAnYmVmb3JlLXBhcnNlJzogW10sXG4gICAgICAgICdhZnRlci1wYXJzZSc6IFtdLFxuICAgICAgICAnYmVmb3JlLWNvbXBpbGUnOiBbXSxcbiAgICAgICAgJ2FmdGVyLWNvbXBpbGUnOiBbXSxcbiAgICAgICAgJ3NhdmUnOiBbXVxuICAgIH1cbiAgICBwYXJzZXJzOiBBcnJheTx7XG4gICAgICAgIG1hdGNoOiBSZWdFeHAsXG4gICAgICAgIHBhcnNlcnM6IEFycmF5PFBhcnNlcj5cbiAgICB9PiA9IFtdXG5cbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnXG4gICAgICAgIHRoaXMuaW5pdFBhcnNlcnMoKVxuICAgICAgICB0aGlzLmluaXRQbHVnaW5zKClcblxuICAgICAgICBpZiAoY29uZmlnLmFua2FDb25maWcuZGVidWcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHRoaXMuY29uZmlnLCAoa2V5LCB2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSByZXR1cm4gJ1tGdW5jdGlvbl0nXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlXG4gICAgICAgICAgICB9LCA0KSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVyIFBsdWdpbi5cbiAgICAgKiBAcGFyYW0gZXZlbnRcbiAgICAgKiBAcGFyYW0gaGFuZGxlclxuICAgICAqL1xuICAgIG9uIChldmVudDogc3RyaW5nLCBoYW5kbGVyOiBQbHVnaW5IYW5kbGVyKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLnBsdWdpbnNbZXZlbnRdID09PSB2b2lkICgwKSkgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGhvb2s6ICR7ZXZlbnR9YClcbiAgICAgICAgdGhpcy5wbHVnaW5zW2V2ZW50XS5wdXNoKGhhbmRsZXIpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW52b2tlIGxpZmVjeWNsZSBob29rcyhQcm9taXNlIGNoYWluaW5nKS5cbiAgICAgKiBAcGFyYW0gZXZlbnRcbiAgICAgKiBAcGFyYW0gY29tcGlsYXRpb25cbiAgICAgKi9cbiAgICBhc3luYyBlbWl0IChldmVudDogc3RyaW5nLCBjb21waWxhdGlvbjogQ29tcGlsYXRpb24pOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBpZiAoY29tcGlsYXRpb24uZGVzdHJveWVkKSByZXR1cm5cblxuICAgICAgICBjb25zdCBwbHVnaW5zID0gdGhpcy5wbHVnaW5zW2V2ZW50XVxuXG4gICAgICAgIGlmICghcGx1Z2lucyB8fCAhcGx1Z2lucy5sZW5ndGgpIHJldHVyblxuXG4gICAgICAgIGNvbnN0IHRhc2tzID0gcGx1Z2lucy5tYXAocGx1Z2luID0+IHtcbiAgICAgICAgICAgIHJldHVybiBhc3luY0Z1bmN0aW9uV3JhcHBlcihwbHVnaW4pXG4gICAgICAgIH0pXG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IGNhbGxQcm9taXNlSW5DaGFpbih0YXNrcywgY29tcGlsYXRpb24pXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHV0aWxzLmxvZ2dlci5lcnJvcignQ29tcGlsZScsIGUubWVzc2FnZSwgZSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENsZWFuIGRpc3QgZGlyZWN0b3J5LlxuICAgICAqL1xuICAgIGFzeW5jIGNsZWFuICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgYXdhaXQgZGVsKFtcbiAgICAgICAgICAgIHBhdGguam9pbihjb25maWcuZGlzdERpciwgJyoqLyonKSxcbiAgICAgICAgICAgIGAhJHtwYXRoLmpvaW4oY29uZmlnLmRpc3REaXIsICdhcHAuanMnKX1gLFxuICAgICAgICAgICAgYCEke3BhdGguam9pbihjb25maWcuZGlzdERpciwgJ2FwcC5qc29uJyl9YCxcbiAgICAgICAgICAgIGAhJHtwYXRoLmpvaW4oY29uZmlnLmRpc3REaXIsICdwcm9qZWN0LmNvbmZpZy5qc29uJyl9YFxuICAgICAgICBdKVxuICAgICAgICBsb2dnZXIuc3VjY2VzcygnQ2xlYW4gd29ya3Nob3AnLCBjb25maWcuZGlzdERpcilcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFdmVyeXRoaW5nIHN0YXJ0IGZyb20gaGVyZS5cbiAgICAgKi9cbiAgICBhc3luYyBsYXVuY2ggKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGxvZ2dlci5pbmZvKCdMYXVuY2hpbmcuLi4nKVxuXG4gICAgICAgIGNvbnN0IGZpbGVQYXRoczogc3RyaW5nW10gPSBhd2FpdCB1dGlscy5zZWFyY2hGaWxlcyhgKiovKmAsIHtcbiAgICAgICAgICAgIGN3ZDogY29uZmlnLnNyY0RpcixcbiAgICAgICAgICAgIG5vZGlyOiB0cnVlLFxuICAgICAgICAgICAgc2lsZW50OiBmYWxzZSxcbiAgICAgICAgICAgIGFic29sdXRlOiB0cnVlLFxuICAgICAgICAgICAgaWdub3JlOiBjb25maWcuYW5rYUNvbmZpZy5pZ25vcmVkXG4gICAgICAgIH0pXG4gICAgICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgUHJvbWlzZS5hbGwoZmlsZVBhdGhzLm1hcChmaWxlID0+IHtcbiAgICAgICAgICAgIHJldHVybiB1dGlscy5jcmVhdGVGaWxlKGZpbGUpXG4gICAgICAgIH0pKVxuICAgICAgICBjb25zdCBjb21waWxhdGlvbnMgPSBmaWxlcy5tYXAoZmlsZSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IENvbXBpbGF0aW9uKGZpbGUsIHRoaXMuY29uZmlnLCB0aGlzKVxuICAgICAgICB9KVxuXG4gICAgICAgIGZzLmVuc3VyZURpclN5bmMoY29uZmlnLmRpc3ROb2RlTW9kdWxlcylcblxuICAgICAgICAvLyBhd2FpdCBQcm9taXNlLmFsbChjb21waWxhdGlvbnMubWFwKGNvbXBpbGF0aW9uID0+IGNvbXBpbGF0aW9uLmxvYWRGaWxlKCkpKVxuICAgICAgICAvLyBhd2FpdCBQcm9taXNlLmFsbChjb21waWxhdGlvbnMubWFwKGNvbXBpbGF0aW9uID0+IGNvbXBpbGF0aW9uLmludm9rZVBhcnNlcnMoKSkpXG5cbiAgICAgICAgLy8gVE9ETzogR2V0IGFsbCBmaWxlc1xuICAgICAgICAvLyBDb21waWxlci5jb21waWxhdGlvblBvb2wudmFsdWVzKClcblxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChjb21waWxhdGlvbnMubWFwKGNvbXBpbGF0aW9ucyA9PiBjb21waWxhdGlvbnMucnVuKCkpKVxuICAgIH1cblxuICAgIHdhdGNoRmlsZXMgKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHdhdGNoZXIgPSB1dGlscy5nZW5GaWxlV2F0Y2hlcihgJHtjb25maWcuc3JjRGlyfS8qKi8qYCwge1xuICAgICAgICAgICAgICAgIGZvbGxvd1N5bWxpbmtzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBpZ25vcmVkOiBjb25maWcuYW5rYUNvbmZpZy5pZ25vcmVkXG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICB3YXRjaGVyLm9uKCdhZGQnLCBhc3luYyAoZmlsZU5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB1dGlscy5jcmVhdGVGaWxlKGZpbGVOYW1lKVxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuZ2VuZXJhdGVDb21waWxhdGlvbihmaWxlKS5ydW4oKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIHdhdGNoZXIub24oJ3VubGluaycsIGFzeW5jIChmaWxlTmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZnMudW5saW5rKGZpbGVOYW1lLnJlcGxhY2UoY29uZmlnLnNyY0RpciwgY29uZmlnLmRpc3REaXIpKVxuICAgICAgICAgICAgICAgIGxvZ2dlci5zdWNjZXNzKCdSZW1vdmUnLCBmaWxlTmFtZSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB3YXRjaGVyLm9uKCdjaGFuZ2UnLCBhc3luYyAoZmlsZU5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB1dGlscy5jcmVhdGVGaWxlKGZpbGVOYW1lKVxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuZ2VuZXJhdGVDb21waWxhdGlvbihmaWxlKS5ydW4oKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIHdhdGNoZXIub24oJ3JlYWR5JywgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgbmV3IENvbXBpbGF0aW9uLlxuICAgICAqIEBwYXJhbSBmaWxlXG4gICAgICovXG4gICAgZ2VuZXJhdGVDb21waWxhdGlvbiAoZmlsZTogRmlsZSkge1xuICAgICAgICByZXR1cm4gbmV3IENvbXBpbGF0aW9uKGZpbGUsIHRoaXMuY29uZmlnLCB0aGlzKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1vdW50IHBhcnNlcnMuXG4gICAgICovXG4gICAgaW5pdFBhcnNlcnMgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmNvbmZpZy5hbmthQ29uZmlnLnBhcnNlcnMuZm9yRWFjaCgoeyBtYXRjaCwgcGFyc2VycyB9KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBhcnNlcnMucHVzaCh7XG4gICAgICAgICAgICAgICAgbWF0Y2gsXG4gICAgICAgICAgICAgICAgcGFyc2VyczogcGFyc2Vycy5tYXAoKHsgcGFyc2VyLCBvcHRpb25zIH0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlci5iaW5kKHRoaXMuZ2VuZXJhdGVQYXJzZXJJbmplY3Rpb24ob3B0aW9ucykpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTW91bnQgUGx1Z2lucy5cbiAgICAgKi9cbiAgICBpbml0UGx1Z2lucyAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY29uZmlnLmFua2FDb25maWcucGx1Z2lucy5mb3JFYWNoKCh7IHBsdWdpbiwgb3B0aW9ucyB9KSA9PiB7XG4gICAgICAgICAgICBwbHVnaW4uY2FsbCh0aGlzLmdlbmVyYXRlUGx1Z2luSW5qZWN0aW9uKG9wdGlvbnMpKVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGdlbmVyYXRlUGx1Z2luSW5qZWN0aW9uIChvcHRpb25zOiBQbHVnaW5PcHRpb25zWydvcHRpb25zJ10pOiBQbHVnaW5JbmplY3Rpb24ge1xuICAgICAgICByZXR1cm4gbmV3IFBsdWdpbkluamVjdGlvbih0aGlzLCBvcHRpb25zKVxuICAgIH1cblxuICAgIGdlbmVyYXRlUGFyc2VySW5qZWN0aW9uIChvcHRpb25zOiBQYXJzZXJPcHRpb25zWydvcHRpb25zJ10pOiBQYXJzZXJJbmplY3Rpb24ge1xuICAgICAgICByZXR1cm4gbmV3IFBhcnNlckluamVjdGlvbih0aGlzLCBvcHRpb25zKVxuICAgIH1cbn1cbiIsImltcG9ydCBDb21waWxlciBmcm9tICcuL0NvbXBpbGVyJ1xuXG5leHBvcnQgZGVmYXVsdCBhYnN0cmFjdCBjbGFzcyBDb21tYW5kIHtcbiAgICBwdWJsaWMgY29tbWFuZDogc3RyaW5nXG4gICAgcHVibGljIG9wdGlvbnM6IEFycmF5PEFycmF5PHN0cmluZz4+XG4gICAgcHVibGljIGFsaWFzOiBzdHJpbmdcbiAgICBwdWJsaWMgdXNhZ2U6IHN0cmluZ1xuICAgIHB1YmxpYyBkZXNjcmlwdGlvbjogc3RyaW5nXG4gICAgcHVibGljIGV4YW1wbGVzOiBBcnJheTxzdHJpbmc+XG4gICAgcHVibGljICRjb21waWxlcjogQ29tcGlsZXJcbiAgICBwdWJsaWMgb246IHtcbiAgICAgICAgW2tleTogc3RyaW5nXTogKC4uLmFyZzogYW55W10pID0+IHZvaWRcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvciAoY29tbWFuZDogc3RyaW5nLCBkZXNjPzogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuY29tbWFuZCA9IGNvbW1hbmRcbiAgICAgICAgdGhpcy5vcHRpb25zID0gW11cbiAgICAgICAgdGhpcy5hbGlhcyA9ICcnXG4gICAgICAgIHRoaXMudXNhZ2UgPSAnJ1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gZGVzY1xuICAgICAgICB0aGlzLmV4YW1wbGVzID0gW11cbiAgICAgICAgdGhpcy5vbiA9IHt9XG4gICAgfVxuXG4gICAgYWJzdHJhY3QgYWN0aW9uIChwYXJhbTogc3RyaW5nIHwgQXJyYXk8c3RyaW5nPiwgb3B0aW9uczogT2JqZWN0LCAuLi5vdGhlcjogYW55W10pOiBQcm9taXNlPGFueT4gfCB2b2lkXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplIGFua2EgY29yZSBjb21waWxlclxuICAgICAqL1xuICAgIHByb3RlY3RlZCBpbml0Q29tcGlsZXIgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLiRjb21waWxlciA9IG5ldyBDb21waWxlcigpXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHNldFVzYWdlICh1c2FnZTogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIHRoaXMudXNhZ2UgPSB1c2FnZVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBzZXRPcHRpb25zICguLi5vcHRpb25zOiBBcnJheTxzdHJpbmc+KTogdm9pZCB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5wdXNoKG9wdGlvbnMpXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHNldEV4YW1wbGVzICguLi5leGFtcGxlOiBBcnJheTxzdHJpbmc+KTogdm9pZCB7XG4gICAgICAgIHRoaXMuZXhhbXBsZXMgPSB0aGlzLmV4YW1wbGVzLmNvbmNhdChleGFtcGxlKVxuICAgIH1cblxuICAgIHB1YmxpYyBwcmludFRpdGxlICguLi5hcmc6IEFycmF5PGFueT4pIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1xcclxcbiAnLCAuLi5hcmcsICdcXHJcXG4nKVxuICAgIH1cblxuICAgIHB1YmxpYyBwcmludENvbnRlbnQgKC4uLmFyZzogQXJyYXk8YW55Pikge1xuICAgICAgICBjb25zb2xlLmxvZygnICAgJywgLi4uYXJnKVxuICAgIH1cbn1cbiIsImltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uL3V0aWxzJ1xuaW1wb3J0IHsgQ29tbWFuZCwgQ29tcGlsZXIgfSBmcm9tICcuLi9jb3JlJ1xuXG5leHBvcnQgdHlwZSBEZXZDb21tYW5kT3B0cyA9IE9iamVjdCAmIHt9XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERldkNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHN1cGVyKFxuICAgICAgICAgICAgJ2RldiBbcGFnZXMuLi5dJyxcbiAgICAgICAgICAgICdEZXZlbG9wbWVudCBtb2RlJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRFeGFtcGxlcyhcbiAgICAgICAgICAgICckIGFua2EgZGV2JyxcbiAgICAgICAgICAgICckIGFua2EgZGV2IGluZGV4JyxcbiAgICAgICAgICAgICckIGFua2EgZGV2IC9wYWdlcy9sb2cvbG9nIC9wYWdlcy91c2VyL3VzZXInXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLiRjb21waWxlciA9IG5ldyBDb21waWxlcigpXG4gICAgfVxuXG4gICAgYXN5bmMgYWN0aW9uIChwYWdlcz86IEFycmF5PHN0cmluZz4sIG9wdGlvbnM/OiBEZXZDb21tYW5kT3B0cykge1xuICAgICAgICB0aGlzLiRjb21waWxlci5jb25maWcuYW5rYUNvbmZpZy5kZXZNb2RlID0gdHJ1ZVxuXG4gICAgICAgIGNvbnN0IHN0YXJ0dXBUaW1lID0gRGF0ZS5ub3coKVxuXG4gICAgICAgIHRoaXMuaW5pdENvbXBpbGVyKClcbiAgICAgICAgYXdhaXQgdGhpcy4kY29tcGlsZXIuY2xlYW4oKVxuICAgICAgICBhd2FpdCB0aGlzLiRjb21waWxlci5sYXVuY2goKVxuICAgICAgICBhd2FpdCB0aGlzLiRjb21waWxlci53YXRjaEZpbGVzKClcbiAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoYENvbXBpbGVkIGluICR7RGF0ZS5ub3coKSAtIHN0YXJ0dXBUaW1lfW1zIPCfjokgLCBBbmthIGlzIHdhaXRpbmcgZm9yIGNoYW5nZXMuLi5gKVxuICAgIH1cbn1cbiIsImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBjb25maWcgZnJvbSAnLi4vY29uZmlnJ1xuaW1wb3J0IHsgZG93bmxvYWRSZXBvLCBsb2dnZXIgfSBmcm9tICcuLi91dGlscydcbmltcG9ydCB7IENvbW1hbmQsIENvbXBpbGVyIH0gZnJvbSAnLi4vY29yZSdcblxuZXhwb3J0IHR5cGUgSW5pdENvbW1hbmRPcHRzID0ge1xuICAgIHJlcG86IHN0cmluZ1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBJbml0Q29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgc3VwZXIoXG4gICAgICAgICAgICAnaW5pdCA8cHJvamVjdC1uYW1lPicsXG4gICAgICAgICAgICAnSW5pdGlhbGl6ZSBuZXcgcHJvamVjdCdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0RXhhbXBsZXMoXG4gICAgICAgICAgICAnJCBhbmthIGluaXQnLFxuICAgICAgICAgICAgYCQgYW5rYSBpbml0IGFua2EtaW4tYWN0aW9uIC0tcmVwbz0ke2NvbmZpZy5kZWZhdWx0U2NhZmZvbGR9YFxuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRPcHRpb25zKFxuICAgICAgICAgICAgJy1yLCAtLXJlcG8nLFxuICAgICAgICAgICAgJ3RlbXBsYXRlIHJlcG9zaXRvcnknXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLiRjb21waWxlciA9IG5ldyBDb21waWxlcigpXG4gICAgfVxuXG4gICAgYXN5bmMgYWN0aW9uIChwcm9qZWN0TmFtZTogc3RyaW5nLCBvcHRpb25zPzogSW5pdENvbW1hbmRPcHRzKSB7XG4gICAgICAgIGNvbnN0IHByb2plY3QgPSBwYXRoLnJlc29sdmUoY29uZmlnLmN3ZCwgcHJvamVjdE5hbWUpXG4gICAgICAgIGNvbnN0IHJlcG8gPSBvcHRpb25zLnJlcG8gfHwgY29uZmlnLmRlZmF1bHRTY2FmZm9sZFxuXG4gICAgICAgIGxvZ2dlci5zdGFydExvYWRpbmcoJ0Rvd25sb2FkaW5nIHRlbXBsYXRlLi4uJylcbiAgICAgICAgYXdhaXQgZG93bmxvYWRSZXBvKHJlcG8sIHByb2plY3QpXG4gICAgICAgIGxvZ2dlci5zdG9wTG9hZGluZygpXG4gICAgICAgIGxvZ2dlci5zdWNjZXNzKCdEb25lJywgcHJvamVjdClcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBsb2dnZXIgfSBmcm9tICcuLi91dGlscydcbmltcG9ydCB7IENvbW1hbmQsIENvbXBpbGVyIH0gZnJvbSAnLi4vY29yZSdcblxuZXhwb3J0IHR5cGUgRGV2Q29tbWFuZE9wdHMgPSBPYmplY3QgJiB7fVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEZXZDb21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBzdXBlcihcbiAgICAgICAgICAgICdwcm9kJyxcbiAgICAgICAgICAgICdQcm9kdWN0aW9uIG1vZGUnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldEV4YW1wbGVzKFxuICAgICAgICAgICAgJyQgYW5rYSBwcm9kJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy4kY29tcGlsZXIgPSBuZXcgQ29tcGlsZXIoKVxuICAgIH1cblxuICAgIGFzeW5jIGFjdGlvbiAocGFnZXM/OiBBcnJheTxzdHJpbmc+LCBvcHRpb25zPzogRGV2Q29tbWFuZE9wdHMpIHtcbiAgICAgICAgdGhpcy4kY29tcGlsZXIuY29uZmlnLmFua2FDb25maWcuZGV2TW9kZSA9IGZhbHNlXG5cbiAgICAgICAgY29uc3Qgc3RhcnR1cFRpbWUgPSBEYXRlLm5vdygpXG5cbiAgICAgICAgdGhpcy5pbml0Q29tcGlsZXIoKVxuICAgICAgICBhd2FpdCB0aGlzLiRjb21waWxlci5jbGVhbigpXG4gICAgICAgIGF3YWl0IHRoaXMuJGNvbXBpbGVyLmxhdW5jaCgpXG4gICAgICAgIGxvZ2dlci5zdWNjZXNzKGBDb21waWxlZCBpbiAke0RhdGUubm93KCkgLSBzdGFydHVwVGltZX1tc2AsICdIYXZlIGEgbmljZSBkYXkg8J+OiSAhJylcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCdcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBjb25maWcgIGZyb20gJy4uL2NvbmZpZydcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uL3V0aWxzJ1xuaW1wb3J0IHsgQ29tbWFuZCwgQ29tcGlsZXIgfSBmcm9tICcuLi9jb3JlJ1xuaW1wb3J0IHsgZGVmYXVsdCBhcyBGc0VkaXRvckNvbnN0cnVjdG9yIH0gZnJvbSAnLi4vdXRpbHMvZWRpdG9yJ1xuXG5pbXBvcnQge1xuICAgIENvbXBpbGVyQ29uZmlnXG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5jb25zdCB7IGxvZ2dlciwgRnNFZGl0b3IgfSA9IHV0aWxzXG5cbmV4cG9ydCB0eXBlIENyZWF0ZVBhZ2VDb21tYW5kT3B0cyA9IHtcbiAgICByb290OiBzdHJpbmdcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ3JlYXRlUGFnZUNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHN1cGVyKFxuICAgICAgICAgICAgJ25ldy1wYWdlIDxwYWdlcy4uLj4nLFxuICAgICAgICAgICAgJ0NyZWF0ZSBhIG1pbmlwcm9ncmFtIHBhZ2UnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldEV4YW1wbGVzKFxuICAgICAgICAgICAgJyQgYW5rYSBuZXctcGFnZSBpbmRleCcsXG4gICAgICAgICAgICAnJCBhbmthIG5ldy1wYWdlIC9wYWdlcy9pbmRleC9pbmRleCcsXG4gICAgICAgICAgICAnJCBhbmthIG5ldy1wYWdlIC9wYWdlcy9pbmRleC9pbmRleCAtLXJvb3Q9cGFja2FnZUEnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldE9wdGlvbnMoXG4gICAgICAgICAgICAnLXIsIC0tcm9vdCA8c3VicGFja2FnZT4nLFxuICAgICAgICAgICAgJ3NhdmUgcGFnZSB0byBzdWJwYWNrYWdlcydcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuJGNvbXBpbGVyID0gbmV3IENvbXBpbGVyKClcbiAgICB9XG5cbiAgICBhc3luYyBhY3Rpb24gKHBhZ2VzPzogQXJyYXk8c3RyaW5nPiwgb3B0aW9ucz86IENyZWF0ZVBhZ2VDb21tYW5kT3B0cykge1xuICAgICAgICBjb25zdCByb290ID0gb3B0aW9ucy5yb290XG4gICAgICAgIGNvbnN0IGVkaXRvciA9IG5ldyBGc0VkaXRvcigpXG5cbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwocGFnZXMubWFwKHBhZ2UgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2VuZXJhdGVQYWdlKHBhZ2UsIGVkaXRvciwgcm9vdClcbiAgICAgICAgfSkpXG5cbiAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoJ0RvbmUnLCAnSGF2ZSBhIG5pY2UgZGF5IPCfjokgIScpXG4gICAgfVxuXG4gICAgYXN5bmMgZ2VuZXJhdGVQYWdlIChwYWdlOiBzdHJpbmcsIGVkaXRvcjogRnNFZGl0b3JDb25zdHJ1Y3Rvciwgcm9vdD86IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICBhbmthQ29uZmlnLFxuICAgICAgICAgICAgcHJvamVjdENvbmZpZ1xuICAgICAgICB9ID0gPENvbXBpbGVyQ29uZmlnPmNvbmZpZ1xuICAgICAgICBjb25zdCBDd2RSZWdFeHAgPSBuZXcgUmVnRXhwKGBeJHtjb25maWcuY3dkfWApXG4gICAgICAgIGNvbnN0IHBhZ2VQYXRoID0gcGFnZS5zcGxpdChwYXRoLnNlcCkubGVuZ3RoID09PSAxID9cbiAgICAgICAgICAgIHBhdGguam9pbihhbmthQ29uZmlnLnBhZ2VzLCBwYWdlLCBwYWdlKSA6IHBhZ2VcbiAgICAgICAgY29uc3QgcGFnZU5hbWUgPSBwYXRoLmJhc2VuYW1lKHBhZ2VQYXRoKVxuICAgICAgICBjb25zdCBjb250ZXh0ID0ge1xuICAgICAgICAgICAgcGFnZU5hbWUsXG4gICAgICAgICAgICB0aW1lOiBuZXcgRGF0ZSgpLnRvTG9jYWxlU3RyaW5nKClcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhcHBDb25maWdQYXRoID0gcGF0aC5qb2luKGNvbmZpZy5zcmNEaXIsICdhcHAuanNvbicpXG4gICAgICAgIGxldCBhYnNvbHV0ZVBhdGggPSBjb25maWcuc3JjRGlyXG5cbiAgICAgICAgaWYgKHJvb3QpIHtcbiAgICAgICAgICAgIGNvbnN0IHJvb3RQYXRoID0gcGF0aC5qb2luKGFua2FDb25maWcuc3ViUGFja2FnZXMsIHJvb3QpXG4gICAgICAgICAgICBjb25zdCBzdWJQa2cgPSBwcm9qZWN0Q29uZmlnLnN1YlBhY2thZ2VzLmZpbmQoKHBrZzogYW55KSA9PiBwa2cucm9vdCA9PT0gcm9vdFBhdGgpXG5cbiAgICAgICAgICAgIGFic29sdXRlUGF0aCA9IHBhdGguam9pbihhYnNvbHV0ZVBhdGgsIGFua2FDb25maWcuc3ViUGFja2FnZXMsIHJvb3QsIHBhZ2VQYXRoKVxuXG4gICAgICAgICAgICBpZiAoc3ViUGtnKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN1YlBrZy5wYWdlcy5pbmNsdWRlcyhwYWdlUGF0aCkpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLndhcm4oJ1RoZSBwYWdlIGFscmVhZHkgZXhpc3RzJywgYWJzb2x1dGVQYXRoKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzdWJQa2cucGFnZXMucHVzaChwYWdlUGF0aClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHByb2plY3RDb25maWcuc3ViUGFja2FnZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHJvb3Q6IHJvb3RQYXRoLFxuICAgICAgICAgICAgICAgICAgICBwYWdlczogW3BhZ2VQYXRoXVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhYnNvbHV0ZVBhdGggPSBwYXRoLmpvaW4oYWJzb2x1dGVQYXRoLCBwYWdlUGF0aClcblxuICAgICAgICAgICAgaWYgKHByb2plY3RDb25maWcucGFnZXMuaW5jbHVkZXMocGFnZVBhdGgpKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLndhcm4oJ1RoZSBwYWdlIGFscmVhZHkgZXhpc3RzJywgYWJzb2x1dGVQYXRoKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwcm9qZWN0Q29uZmlnLnBhZ2VzLnB1c2gocGFnZVBhdGgpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0cGxzID0gYXdhaXQgdXRpbHMuc2VhcmNoRmlsZXMoYCR7cGF0aC5qb2luKGFua2FDb25maWcudGVtcGxhdGUucGFnZSwgJyouKicpfWApXG5cbiAgICAgICAgdHBscy5mb3JFYWNoKHRwbCA9PiB7XG4gICAgICAgICAgICBlZGl0b3IuY29weShcbiAgICAgICAgICAgICAgICB0cGwsXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHBhdGguZGlybmFtZShhYnNvbHV0ZVBhdGgpLCBwYWdlTmFtZSArIHBhdGguZXh0bmFtZSh0cGwpKSxcbiAgICAgICAgICAgICAgICBjb250ZXh0XG4gICAgICAgICAgICApXG4gICAgICAgIH0pXG4gICAgICAgIGVkaXRvci53cml0ZUpTT04oYXBwQ29uZmlnUGF0aCwgcHJvamVjdENvbmZpZywgbnVsbCwgNClcblxuICAgICAgICBhd2FpdCBlZGl0b3Iuc2F2ZSgpXG5cbiAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoJ0NyZWF0ZSBwYWdlJywgYWJzb2x1dGVQYXRoLnJlcGxhY2UoQ3dkUmVnRXhwLCAnJykpXG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgY29uZmlnICBmcm9tICcuLi9jb25maWcnXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi91dGlscydcbmltcG9ydCB7IENvbW1hbmQsIENvbXBpbGVyIH0gZnJvbSAnLi4vY29yZSdcbmltcG9ydCB7IGRlZmF1bHQgYXMgRnNFZGl0b3JDb25zdHJ1Y3RvciB9IGZyb20gJy4uL3V0aWxzL2VkaXRvcidcblxuaW1wb3J0IHtcbiAgICBDb21waWxlckNvbmZpZ1xufSBmcm9tICcuLi8uLi90eXBlcy90eXBlcydcblxuY29uc3QgeyBsb2dnZXIsIEZzRWRpdG9yIH0gPSB1dGlsc1xuXG5leHBvcnQgdHlwZSBDcmVhdGVDb21wb25lbnRDb21tYW5kT3B0cyA9IHtcbiAgICByb290OiBzdHJpbmdcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ3JlYXRlQ29tcG9uZW50Q29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgc3VwZXIoXG4gICAgICAgICAgICAnbmV3LWNtcHQgPGNvbXBvbmVudHMuLi4+JyxcbiAgICAgICAgICAgICdDcmVhdGUgYSBtaW5pcHJvZ3JhbSBjb21wb25lbnQnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldEV4YW1wbGVzKFxuICAgICAgICAgICAgJyQgYW5rYSBuZXctY21wdCBidXR0b24nLFxuICAgICAgICAgICAgJyQgYW5rYSBuZXctY21wdCAvY29tcG9uZW50cy9idXR0b24vYnV0dG9uJyxcbiAgICAgICAgICAgICckIGFua2EgbmV3LWNtcHQgL2NvbXBvbmVudHMvYnV0dG9uL2J1dHRvbiAtLWdsb2JhbCdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0T3B0aW9ucyhcbiAgICAgICAgICAgICctciwgLS1yb290IDxzdWJwYWNrYWdlPicsXG4gICAgICAgICAgICAnc2F2ZSBjb21wb25lbnQgdG8gc3VicGFja2FnZXMnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLiRjb21waWxlciA9IG5ldyBDb21waWxlcigpXG4gICAgfVxuXG4gICAgYXN5bmMgYWN0aW9uIChjb21wb25lbnRzPzogQXJyYXk8c3RyaW5nPiwgb3B0aW9ucz86IENyZWF0ZUNvbXBvbmVudENvbW1hbmRPcHRzKSB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIHJvb3RcbiAgICAgICAgfSA9IG9wdGlvbnNcbiAgICAgICAgY29uc3QgZWRpdG9yID0gbmV3IEZzRWRpdG9yKClcblxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChjb21wb25lbnRzLm1hcChjb21wb25lbnQgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2VuZXJhdGVDb21wb25lbnQoY29tcG9uZW50LCBlZGl0b3IsIHJvb3QpXG4gICAgICAgIH0pKVxuXG4gICAgICAgIGxvZ2dlci5zdWNjZXNzKCdEb25lJywgJ0hhdmUgYSBuaWNlIGRheSDwn46JICEnKVxuICAgIH1cblxuICAgIGFzeW5jIGdlbmVyYXRlQ29tcG9uZW50IChjb21wb25lbnQ6IHN0cmluZywgZWRpdG9yOiBGc0VkaXRvckNvbnN0cnVjdG9yLCByb290Pzogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIGFua2FDb25maWcsXG4gICAgICAgICAgICBwcm9qZWN0Q29uZmlnXG4gICAgICAgIH0gPSA8Q29tcGlsZXJDb25maWc+Y29uZmlnXG4gICAgICAgIGNvbnN0IEN3ZFJlZ0V4cCA9IG5ldyBSZWdFeHAoYF4ke2NvbmZpZy5jd2R9YClcbiAgICAgICAgY29uc3QgY29tcG9uZW50UGF0aCA9IGNvbXBvbmVudC5zcGxpdChwYXRoLnNlcCkubGVuZ3RoID09PSAxID9cbiAgICAgICAgICAgIHBhdGguam9pbihhbmthQ29uZmlnLmNvbXBvbmVudHMsIGNvbXBvbmVudCwgY29tcG9uZW50KSA6XG4gICAgICAgICAgICBjb21wb25lbnRcbiAgICAgICAgY29uc3QgY29tcG9uZW50TmFtZSA9IHBhdGguYmFzZW5hbWUoY29tcG9uZW50UGF0aClcbiAgICAgICAgY29uc3QgY29udGV4dCA9IHtcbiAgICAgICAgICAgIGNvbXBvbmVudE5hbWUsXG4gICAgICAgICAgICB0aW1lOiBuZXcgRGF0ZSgpLnRvTG9jYWxlU3RyaW5nKClcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhYnNvbHV0ZVBhdGggPSByb290ID9cbiAgICAgICAgICAgIHBhdGguam9pbihjb25maWcuc3JjRGlyLCBhbmthQ29uZmlnLnN1YlBhY2thZ2VzLCByb290LCBjb21wb25lbnRQYXRoKSA6XG4gICAgICAgICAgICBwYXRoLmpvaW4oY29uZmlnLnNyY0RpciwgY29tcG9uZW50UGF0aClcblxuICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKGFic29sdXRlUGF0aCksIGNvbXBvbmVudE5hbWUgKyAnLmpzb24nKSkpIHtcbiAgICAgICAgICAgIGxvZ2dlci53YXJuKCdUaGUgY29tcG9uZW50IGFscmVhZHkgZXhpc3RzJywgYWJzb2x1dGVQYXRoKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0cGxzID0gYXdhaXQgdXRpbHMuc2VhcmNoRmlsZXMoYCR7cGF0aC5qb2luKGFua2FDb25maWcudGVtcGxhdGUuY29tcG9uZW50LCAnKi4qJyl9YClcblxuICAgICAgICB0cGxzLmZvckVhY2godHBsID0+IHtcbiAgICAgICAgICAgIGVkaXRvci5jb3B5KFxuICAgICAgICAgICAgICAgIHRwbCxcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKGFic29sdXRlUGF0aCksIGNvbXBvbmVudE5hbWUgKyBwYXRoLmV4dG5hbWUodHBsKSksXG4gICAgICAgICAgICAgICAgY29udGV4dFxuICAgICAgICAgICAgKVxuICAgICAgICB9KVxuXG4gICAgICAgIGF3YWl0IGVkaXRvci5zYXZlKClcblxuICAgICAgICBsb2dnZXIuc3VjY2VzcygnQ3JlYXRlIGNvbXBvbmVudCcsIGFic29sdXRlUGF0aC5yZXBsYWNlKEN3ZFJlZ0V4cCwgJycpKVxuICAgIH1cbn1cbiIsImltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJ1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IGNvbmZpZyAgZnJvbSAnLi4vY29uZmlnJ1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vdXRpbHMnXG5pbXBvcnQgeyBDb21tYW5kLCBDb21waWxlciB9IGZyb20gJy4uL2NvcmUnXG5pbXBvcnQgeyBkZWZhdWx0IGFzIEZzRWRpdG9yQ29uc3RydWN0b3IgfSBmcm9tICcuLi91dGlscy9lZGl0b3InXG5cbmltcG9ydCB7XG4gICAgQ29tcGlsZXJDb25maWdcbn0gZnJvbSAnLi4vLi4vdHlwZXMvdHlwZXMnXG5cbmNvbnN0IHsgbG9nZ2VyLCBGc0VkaXRvciB9ID0gdXRpbHNcblxuZXhwb3J0IHR5cGUgRW5yb2xsQ29tcG9uZW50Q29tbWFuZE9wdHMgPSB7XG4gICAgcGFnZTogc3RyaW5nXG4gICAgZ2xvYmFsOiBzdHJpbmdcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRW5yb2xsQ29tcG9uZW50Q29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgc3VwZXIoXG4gICAgICAgICAgICAnZW5yb2xsIDxjb21wb25lbnRzLi4uPicsXG4gICAgICAgICAgICAnRW5yb2xsIGEgbWluaXByb2dyYW0gY29tcG9uZW50J1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRFeGFtcGxlcyhcbiAgICAgICAgICAgICckIGFua2EgZW5yb2xsIGJ1dHRvbiAtLWdsb2JhbCcsXG4gICAgICAgICAgICAnJCBhbmthIGVucm9sbCAvY29tcG9uZW50cy9idXR0b24vYnV0dG9uIC0tZ2xvYmFsJyxcbiAgICAgICAgICAgICckIGFua2EgZW5yb2xsIC9jb21wb25lbnRzL2J1dHRvbi9idXR0b24gLS1wYWdlPS9wYWdlcy9pbmRleC9pbmRleCdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0T3B0aW9ucyhcbiAgICAgICAgICAgICctcCwgLS1wYWdlIDxwYWdlPicsXG4gICAgICAgICAgICAnd2hpY2ggcGFnZSBjb21wb25lbnRzIGVucm9sbCB0bydcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0T3B0aW9ucyhcbiAgICAgICAgICAgICctZywgLS1nbG9iYWwnLFxuICAgICAgICAgICAgJ2Vucm9sbCBjb21wb25lbnRzIHRvIGFwcC5qc29uJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy4kY29tcGlsZXIgPSBuZXcgQ29tcGlsZXIoKVxuICAgIH1cblxuICAgIGFzeW5jIGFjdGlvbiAoY29tcG9uZW50cz86IEFycmF5PHN0cmluZz4sIG9wdGlvbnM/OiBFbnJvbGxDb21wb25lbnRDb21tYW5kT3B0cykge1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICBwYWdlLFxuICAgICAgICAgICAgZ2xvYmFsXG4gICAgICAgIH0gPSBvcHRpb25zXG4gICAgICAgIGNvbnN0IGVkaXRvciA9IG5ldyBGc0VkaXRvcigpXG5cbiAgICAgICAgaWYgKCFnbG9iYWwgJiYgIXBhZ2UpIHtcbiAgICAgICAgICAgIGxvZ2dlci53YXJuKCdXaGVyZSBjb21wb25lbnRzIGVucm9sbCB0bz8nKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChjb21wb25lbnRzLm1hcChjb21wb25lbnQgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZW5yb2xsQ29tcG9uZW50KGNvbXBvbmVudCwgZWRpdG9yLCBnbG9iYWwgPyAnJyA6IHBhZ2UpXG4gICAgICAgIH0pKVxuXG4gICAgICAgIGxvZ2dlci5zdWNjZXNzKCdEb25lJywgJ0hhdmUgYSBuaWNlIGRheSDwn46JICEnKVxuICAgIH1cblxuICAgIGFzeW5jIGVucm9sbENvbXBvbmVudCAoY29tcG9uZW50OiBzdHJpbmcsIGVkaXRvcjogRnNFZGl0b3JDb25zdHJ1Y3RvciwgcGFnZT86IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICBhbmthQ29uZmlnLFxuICAgICAgICAgICAgcHJvamVjdENvbmZpZ1xuICAgICAgICB9ID0gPENvbXBpbGVyQ29uZmlnPmNvbmZpZ1xuICAgICAgICBjb25zdCBDd2RSZWdFeHAgPSBuZXcgUmVnRXhwKGBeJHtjb25maWcuY3dkfWApXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudFBhdGggPSBjb21wb25lbnQuc3BsaXQocGF0aC5zZXApLmxlbmd0aCA9PT0gMSA/XG4gICAgICAgICAgICBwYXRoLmpvaW4oYW5rYUNvbmZpZy5jb21wb25lbnRzLCBjb21wb25lbnQsIGNvbXBvbmVudCkgOlxuICAgICAgICAgICAgY29tcG9uZW50XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudE5hbWUgPSBjb21wb25lbnRQYXRoLnNwbGl0KHBhdGguc2VwKS5wb3AoKVxuICAgICAgICBjb25zdCBhcHBDb25maWdQYXRoID0gcGF0aC5qb2luKGNvbmZpZy5zcmNEaXIsICdhcHAuanNvbicpXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudEFic1BhdGggPSBwYXRoLmpvaW4oY29uZmlnLnNyY0RpciwgY29tcG9uZW50UGF0aClcblxuICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMocGF0aC5qb2luKHBhdGguZGlybmFtZShjb21wb25lbnRBYnNQYXRoKSwgY29tcG9uZW50TmFtZSArICcuanNvbicpKSkge1xuICAgICAgICAgICAgbG9nZ2VyLndhcm4oJ0NvbXBvbmVudCBkb3NlIG5vdCBleGlzdHMnLCBjb21wb25lbnRBYnNQYXRoKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAocGFnZSkge1xuICAgICAgICAgICAgY29uc3QgcGFnZUFic1BhdGggPSBwYXRoLmpvaW4oY29uZmlnLnNyY0RpciwgcGFnZSlcbiAgICAgICAgICAgIGNvbnN0IHBhZ2VKc29uUGF0aCA9IHBhdGguam9pbihwYXRoLmRpcm5hbWUocGFnZUFic1BhdGgpLCBwYXRoLmJhc2VuYW1lKHBhZ2VBYnNQYXRoKSArICcuanNvbicpXG4gICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMocGFnZUpzb25QYXRoKSkge1xuICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKCdQYWdlIGRvc2Ugbm90IGV4aXN0cycsIHBhZ2VBYnNQYXRoKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBwYWdlSnNvbiA9IDxhbnk+SlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMocGFnZUpzb25QYXRoLCB7XG4gICAgICAgICAgICAgICAgZW5jb2Rpbmc6ICd1dGY4J1xuICAgICAgICAgICAgfSkgfHwgJ3t9JylcblxuICAgICAgICAgICAgdGhpcy5lbnN1cmVVc2luZ0NvbXBvbmVudHMocGFnZUpzb24pXG5cbiAgICAgICAgICAgIGlmIChwYWdlSnNvbi51c2luZ0NvbXBvbmVudHNbY29tcG9uZW50TmFtZV0pIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIud2FybignQ29tcG9uZW50IGFscmVhZHkgZW5yb2xsZWQgaW4nLCBwYWdlQWJzUGF0aClcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcGFnZUpzb24udXNpbmdDb21wb25lbnRzW2NvbXBvbmVudE5hbWVdID0gcGF0aC5yZWxhdGl2ZShwYXRoLmRpcm5hbWUocGFnZUFic1BhdGgpLCBjb21wb25lbnRBYnNQYXRoKVxuICAgICAgICAgICAgZWRpdG9yLndyaXRlSlNPTihwYWdlSnNvblBhdGgsIHBhZ2VKc29uKVxuICAgICAgICAgICAgYXdhaXQgZWRpdG9yLnNhdmUoKVxuXG4gICAgICAgICAgICBsb2dnZXIuc3VjY2VzcyhgRW5yb2xsICR7Y29tcG9uZW50UGF0aH0gaW5gLCBwYWdlQWJzUGF0aC5yZXBsYWNlKEN3ZFJlZ0V4cCwgJycpKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5lbnN1cmVVc2luZ0NvbXBvbmVudHMocHJvamVjdENvbmZpZylcblxuICAgICAgICAgICAgaWYgKHByb2plY3RDb25maWcudXNpbmdDb21wb25lbnRzW2NvbXBvbmVudE5hbWVdKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLndhcm4oJ0NvbXBvbmVudCBhbHJlYWR5IGVucm9sbGVkIGluJywgJ2FwcC5qc29uJylcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJvamVjdENvbmZpZy51c2luZ0NvbXBvbmVudHNbY29tcG9uZW50TmFtZV0gPSBwYXRoLnJlbGF0aXZlKHBhdGguZGlybmFtZShhcHBDb25maWdQYXRoKSwgY29tcG9uZW50QWJzUGF0aClcbiAgICAgICAgICAgIGVkaXRvci53cml0ZUpTT04oYXBwQ29uZmlnUGF0aCwgcHJvamVjdENvbmZpZylcbiAgICAgICAgICAgIGF3YWl0IGVkaXRvci5zYXZlKClcblxuICAgICAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoYEVucm9sbCAke2NvbXBvbmVudFBhdGh9IGluYCwgJ2FwcC5qc29uJylcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgZW5zdXJlVXNpbmdDb21wb25lbnRzIChjb25maWc6IGFueSkge1xuICAgICAgICBpZiAoIWNvbmZpZy51c2luZ0NvbXBvbmVudHMpIHtcbiAgICAgICAgICAgIGNvbmZpZy51c2luZ0NvbXBvbmVudHMgPSB7fVxuICAgICAgICB9XG4gICAgfVxufVxuIiwiaW1wb3J0IERldiBmcm9tICcuL2NvbW1hbmRzL2RldidcbmltcG9ydCBJbml0IGZyb20gJy4vY29tbWFuZHMvaW5pdCdcbmltcG9ydCBQcm9kIGZyb20gJy4vY29tbWFuZHMvcHJvZCdcbmltcG9ydCBDcmVhdGVQYWdlIGZyb20gJy4vY29tbWFuZHMvY3JlYXRlUGFnZSdcbmltcG9ydCBDcmVhdGVDb21wb25lbnQgZnJvbSAnLi9jb21tYW5kcy9jcmVhdGVDb21wb25lbnQnXG5pbXBvcnQgRW5yb2xsQ29tcG9uZW50IGZyb20gJy4vY29tbWFuZHMvZW5yb2xsQ29tcG9uZW50J1xuXG5leHBvcnQgZGVmYXVsdCBbXG4gICAgbmV3IFByb2QoKSxcbiAgICBuZXcgRGV2KCksXG4gICAgbmV3IEluaXQoKSxcbiAgICBuZXcgQ3JlYXRlUGFnZSgpLFxuICAgIG5ldyBDcmVhdGVDb21wb25lbnQoKSxcbiAgICBuZXcgRW5yb2xsQ29tcG9uZW50KClcbl1cbiIsImltcG9ydCBjb25maWcgZnJvbSAnLi9jb25maWcnXG5pbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJ1xuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi91dGlscydcbmltcG9ydCAqIGFzIGNmb250cyBmcm9tICdjZm9udHMnXG5pbXBvcnQgY29tbWFuZHMgZnJvbSAnLi9jb21tYW5kcydcbmltcG9ydCBDb21waWxlciBmcm9tICcuL2NvcmUvY2xhc3MvQ29tcGlsZXInXG5cbmNvbnN0IGNvbW1hbmRlciA9IHJlcXVpcmUoJ2NvbW1hbmRlcicpXG5jb25zdCBwa2dKc29uID0gcmVxdWlyZSgnLi4vcGFja2FnZS5qc29uJylcblxucmVxdWlyZSgnc291cmNlLW1hcC1zdXBwb3J0JykuaW5zdGFsbCgpXG5cbmlmICghc2VtdmVyLnNhdGlzZmllcyhzZW12ZXIuY2xlYW4ocHJvY2Vzcy52ZXJzaW9uKSwgcGtnSnNvbi5lbmdpbmVzLm5vZGUpKSB7XG4gICAgbG9nZ2VyLmVycm9yKCdSZXF1aXJlZCBub2RlIHZlcnNpb24gJyArIHBrZ0pzb24uZW5naW5lcy5ub2RlKVxuICAgIHByb2Nlc3MuZXhpdCgxKVxufVxuXG5pZiAocHJvY2Vzcy5hcmd2LmluZGV4T2YoJy0tZGVidWcnKSA+IC0xKSB7XG4gICAgY29uZmlnLmFua2FDb25maWcuZGVidWcgPSB0cnVlXG59XG5cbmlmIChwcm9jZXNzLmFyZ3YuaW5kZXhPZignLS1zbGllbnQnKSA+IC0xKSB7XG4gICAgY29uZmlnLmFua2FDb25maWcucXVpZXQgPSB0cnVlXG59XG5cbmNvbW1hbmRlclxuICAgIC5vcHRpb24oJy0tZGVidWcnLCAnZW5hYmxlIGRlYnVnIG1vZGUnKVxuICAgIC5vcHRpb24oJy0tcXVpZXQnLCAnaGlkZSBjb21waWxlIGxvZycpXG4gICAgLnZlcnNpb24ocGtnSnNvbi52ZXJzaW9uKVxuICAgIC51c2FnZSgnPGNvbW1hbmQ+IFtvcHRpb25zXScpXG5cbmNvbW1hbmRzLmZvckVhY2goY29tbWFuZCA9PiB7XG4gICAgY29uc3QgY21kID0gY29tbWFuZGVyLmNvbW1hbmQoY29tbWFuZC5jb21tYW5kKVxuXG4gICAgaWYgKGNvbW1hbmQuZGVzY3JpcHRpb24pIHtcbiAgICAgICAgY21kLmRlc2NyaXB0aW9uKGNvbW1hbmQuZGVzY3JpcHRpb24pXG4gICAgfVxuXG4gICAgaWYgKGNvbW1hbmQudXNhZ2UpIHtcbiAgICAgICAgY21kLnVzYWdlKGNvbW1hbmQudXNhZ2UpXG4gICAgfVxuXG4gICAgaWYgKGNvbW1hbmQub24pIHtcbiAgICAgICAgZm9yIChsZXQga2V5IGluIGNvbW1hbmQub24pIHtcbiAgICAgICAgICAgIGNtZC5vbihrZXksIGNvbW1hbmQub25ba2V5XSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjb21tYW5kLm9wdGlvbnMpIHtcbiAgICAgICAgY29tbWFuZC5vcHRpb25zLmZvckVhY2goKG9wdGlvbjogW2FueSwgYW55LCBhbnksIGFueV0pID0+IHtcbiAgICAgICAgICAgIGNtZC5vcHRpb24oLi4ub3B0aW9uKVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGlmIChjb21tYW5kLmFjdGlvbikge1xuICAgICAgICBjbWQuYWN0aW9uKGFzeW5jICguLi5hcmdzKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IGNvbW1hbmQuYWN0aW9uKC4uLmFyZ3MpXG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoZXJyLm1lc3NhZ2UgfHwgJycpXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGlmIChjb21tYW5kLmV4YW1wbGVzKSB7XG4gICAgICAgIGNtZC5vbignLS1oZWxwJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY29tbWFuZC5wcmludFRpdGxlKCdFeGFtcGxlczonKVxuICAgICAgICAgICAgY29tbWFuZC5leGFtcGxlcy5mb3JFYWNoKGV4YW1wbGUgPT4ge1xuICAgICAgICAgICAgICAgIGNvbW1hbmQucHJpbnRDb250ZW50KGV4YW1wbGUpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgIH1cbn0pXG5cbmlmIChwcm9jZXNzLmFyZ3YubGVuZ3RoID09PSAyKSB7XG4gICAgY29uc3QgTG9nbyA9IGNmb250cy5yZW5kZXIoJ0Fua2EnLCB7XG4gICAgICAgIGZvbnQ6ICdzaW1wbGUnLFxuICAgICAgICBjb2xvcnM6IFsnZ3JlZW5CcmlnaHQnXVxuICAgIH0pXG5cbiAgICBjb25zb2xlLmxvZyhMb2dvLnN0cmluZy5yZXBsYWNlKC8oXFxzKykkLywgYCAke3BrZ0pzb24udmVyc2lvbn1cXHJcXG5gKSlcbiAgICBjb21tYW5kZXIub3V0cHV0SGVscCgpXG59XG5cbmNvbW1hbmRlci5wYXJzZShwcm9jZXNzLmFyZ3YpXG5cbmV4cG9ydCBkZWZhdWx0IENvbXBpbGVyXG4iXSwibmFtZXMiOlsicGF0aC5qb2luIiwiZnMuZXhpc3RzU3luYyIsInNhc3MucmVuZGVyIiwicG9zdGNzcyIsInRzbGliXzEuX19hc3NpZ24iLCJiYWJlbC50cmFuc2Zvcm1TeW5jIiwiZnMuZW5zdXJlRmlsZSIsInBvc3Rjc3MucGx1Z2luIiwiaW50ZXJuYWxQbHVnaW5zIiwidHMudHJhbnNwaWxlTW9kdWxlIiwiYmFiZWwucGFyc2UiLCJwYXRoIiwicGF0aC5kaXJuYW1lIiwicGF0aC5yZWxhdGl2ZSIsImN3ZCIsImFua2FEZWZhdWx0Q29uZmlnLnRlbXBsYXRlIiwiYW5rYURlZmF1bHRDb25maWcucGFyc2VycyIsImFua2FEZWZhdWx0Q29uZmlnLnBsdWdpbnMiLCJhbmthRGVmYXVsdENvbmZpZy5pZ25vcmVkIiwicGF0aC5yZXNvbHZlIiwiY3VzdG9tQ29uZmlnIiwic3lzdGVtLnNyY0RpciIsImZzLnJlYWRGaWxlIiwiZnMud3JpdGVGaWxlIiwicGF0aC5iYXNlbmFtZSIsInBhdGguZXh0bmFtZSIsImZzLnJlYWRGaWxlU3luYyIsImxvZyIsImNob2tpZGFyLndhdGNoIiwidHNsaWJfMS5fX2V4dGVuZHMiLCJ1dGlscy5sb2dnZXIiLCJ1dGlscy5jcmVhdGVGaWxlIiwidXRpbHMuYXN5bmNGdW5jdGlvbldyYXBwZXIiLCJ1dGlscy5jYWxsUHJvbWlzZUluQ2hhaW4iLCJwYXRoLnNlcCIsImxvZ2dlciIsInV0aWxzLnNlYXJjaEZpbGVzIiwiZnMuZW5zdXJlRGlyU3luYyIsInV0aWxzLmdlbkZpbGVXYXRjaGVyIiwiZnMudW5saW5rIiwiZG93bmxvYWRSZXBvIiwiRnNFZGl0b3IiLCJjb25maWciLCJQcm9kIiwiRGV2IiwiSW5pdCIsIkNyZWF0ZVBhZ2UiLCJDcmVhdGVDb21wb25lbnQiLCJFbnJvbGxDb21wb25lbnQiLCJzZW12ZXIuc2F0aXNmaWVzIiwic2VtdmVyLmNsZWFuIiwiY2ZvbnRzLnJlbmRlciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUdBLElBQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQTtBQUV6Qix3QkFBeUIsS0FBeUIsRUFBRSxJQUFhO0lBQXhDLHNCQUFBLEVBQUEsVUFBeUI7SUFDOUMsSUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFBO0lBQ3ZCLElBQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsVUFBQSxJQUFJLElBQUksT0FBQUEsU0FBUyxDQUFDLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUEsQ0FBQyxDQUFBO0lBRW5FLEtBQUssSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFLEtBQUssR0FBRyxXQUFXLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFO1FBQ3JELElBQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUVyQyxJQUFJQyxhQUFhLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDM0IsTUFBTSxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUE7WUFDaEQsTUFBSztTQUNSO0tBQ0o7SUFFRCxPQUFPLFlBQVksQ0FBQTtDQUN0Qjs7QUNORCxrQkFBdUIsVUFBaUMsSUFBVSxFQUFFLFdBQXdCLEVBQUUsUUFBbUI7SUFDN0csSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFBO0lBQzdCLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQTtJQUVyQyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLFlBQVksTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQTtJQUV0RkMsV0FBVyxDQUFDO1FBQ1IsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVO1FBQ3JCLElBQUksRUFBRSxJQUFJLENBQUMsT0FBTztLQUNyQixFQUFFLFVBQUMsR0FBVSxFQUFFLE1BQVc7UUFDdkIsSUFBSSxHQUFHLEVBQUU7WUFDTCxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQTtTQUNsRDthQUFNO1lBQ0gsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFBO1lBQ3pCLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUE7U0FDMUI7UUFDRCxRQUFRLEVBQUUsQ0FBQTtLQUNiLENBQUMsQ0FBQTtDQUNMLEVBQUE7O0FDOUJELElBQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQTtBQUUxQixTQUFnQixLQUFLLENBQUUsTUFBYztJQUNqQyxPQUFPLENBQUMsSUFBSSxHQUFHLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtDQUNuQztBQUVELFNBQWdCLGNBQWM7SUFDMUIsSUFBTSxHQUFHLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQTtJQUN0QixPQUFVLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsU0FBSSxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxDQUFDLFNBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBRyxDQUFBO0NBQzFGO0FBRUQ7SUFBQTtLQW1DQztJQWhDRyxzQkFBSSx3QkFBSTthQUFSO1lBQ0ksT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQUksY0FBYyxFQUFFLE1BQUcsQ0FBQyxDQUFBO1NBQzdDOzs7T0FBQTtJQUVELDZCQUFZLEdBQVosVUFBYyxHQUFXO1FBQ3JCLElBQUksQ0FBQyxXQUFXLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFBO0tBQ3RDO0lBRUQsNEJBQVcsR0FBWDtRQUNJLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtLQUM5QztJQUVELG9CQUFHLEdBQUg7UUFBSyxhQUFxQjthQUFyQixVQUFxQixFQUFyQixxQkFBcUIsRUFBckIsSUFBcUI7WUFBckIsd0JBQXFCOztRQUN0QixPQUFPLE9BQU8sQ0FBQyxHQUFHLE9BQVgsT0FBTyxHQUFLLElBQUksQ0FBQyxJQUFJLFNBQUssR0FBRyxHQUFDO0tBQ3hDO0lBRUQsc0JBQUssR0FBTCxVQUFPLEtBQWtCLEVBQUUsR0FBZ0IsRUFBRSxHQUFTO1FBQS9DLHNCQUFBLEVBQUEsVUFBa0I7UUFBRSxvQkFBQSxFQUFBLFFBQWdCO1FBQ3ZDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7UUFDakQsR0FBRyxJQUFJLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUE7S0FDNUI7SUFFRCxxQkFBSSxHQUFKLFVBQU0sS0FBa0IsRUFBRSxHQUFnQjtRQUFwQyxzQkFBQSxFQUFBLFVBQWtCO1FBQUUsb0JBQUEsRUFBQSxRQUFnQjtRQUN0QyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO0tBQ2hEO0lBRUQscUJBQUksR0FBSixVQUFNLEtBQWtCLEVBQUUsR0FBZ0I7UUFBcEMsc0JBQUEsRUFBQSxVQUFrQjtRQUFFLG9CQUFBLEVBQUEsUUFBZ0I7UUFDdEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtLQUN2RDtJQUVELHdCQUFPLEdBQVAsVUFBUyxLQUFrQixFQUFFLEdBQWdCO1FBQXBDLHNCQUFBLEVBQUEsVUFBa0I7UUFBRSxvQkFBQSxFQUFBLFFBQWdCO1FBQ3pDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7S0FDdEQ7SUFDTCxhQUFDO0NBQUEsSUFBQTtBQUVELGFBQWUsSUFBSSxNQUFNLEVBQUUsQ0FBQTs7QUN0QzNCLElBQU1DLFNBQU8sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUE7QUFDbEMsSUFBTSxhQUFhLEdBQVEsRUFBRSxDQUFBO0FBQzdCLElBQU0sZUFBZSxHQUFrQyxFQUFFLENBQUE7QUFDekQsSUFBTSxLQUFLLEdBQVUsRUFBRSxDQUFBO0FBUXZCLG1CQUF1QixVQUFpQyxJQUFVLEVBQUUsV0FBd0IsRUFBRSxFQUFZO0lBQ3RHLElBQUksYUFBYSxDQUFDLE9BQU8sRUFBRTtRQUN2QixJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQTtLQUNoQztTQUFNO1FBQ0gsS0FBSyxDQUFDLElBQUksQ0FBQztZQUNQLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1NBQ2hDLENBQUMsQ0FBQTtLQUNMO0NBQ0osRUFBQTtBQUVELGdCQUFnQixFQUFFLENBQUMsSUFBSSxDQUFDLFVBQUMsTUFBVztJQUNoQyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQUMsSUFBYyxJQUFLLE9BQUEsSUFBSSxFQUFFLEdBQUEsQ0FBQyxDQUFBO0NBQzVDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBQyxHQUFVO0lBQ2hCLE1BQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUE7Q0FDL0MsQ0FBQyxDQUFBO0FBR0YsU0FBUyxJQUFJLENBQUUsTUFBVyxFQUFFLElBQVUsRUFBRSxFQUFZO0lBQ2hELElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFBO0lBQzdCQSxTQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRUMscUJBQy9ELE1BQU0sQ0FBQyxPQUFPLElBQ2pCLElBQUksRUFBRSxJQUFJLENBQUMsVUFBVSxHQUNFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQyxJQUFvQjtRQUNuRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUE7UUFDdkIsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFBO1FBQy9CLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUE7UUFDdkIsRUFBRSxFQUFFLENBQUE7S0FDUCxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQUMsR0FBVTtRQUNoQixNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0tBQzVDLENBQUMsQ0FBQTtDQUNMO0FBRUQsU0FBUyxnQkFBZ0IsQ0FBRSxLQUFzQjtJQUF0QixzQkFBQSxFQUFBLFVBQXNCO0lBQzdDLE9BQU8sYUFBYSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQyxNQUFXO1FBQzNGLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFBO0tBQy9ELENBQUMsQ0FBQTtDQUNMOztBQ2pERCxJQUFJLFdBQVcsR0FBMkIsSUFBSSxDQUFBO0FBTTlDLG1CQUF1QixVQUFpQyxJQUFVLEVBQUUsV0FBd0IsRUFBRSxFQUFZO0lBQ3RHLElBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQTtJQUM3QixJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUE7SUFFckMsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO1FBQ2pCLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDZCxXQUFXLEdBQTJCLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTtTQUM3RjtRQUVELElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFBO1FBRTdCLElBQU0sTUFBTSxHQUFHQyxtQkFBbUIsQ0FBUyxJQUFJLENBQUMsT0FBTyxxQkFDbkQsT0FBTyxFQUFFLEtBQUssRUFDZCxHQUFHLEVBQUUsSUFBSSxFQUNULFFBQVEsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUN6QixVQUFVLEVBQUUsUUFBUSxFQUNwQixVQUFVLEVBQUUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQ3JDLFFBQVEsRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFDbkMsUUFBUSxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLElBQ2pDLFdBQVcsRUFDaEIsQ0FBQTtRQUVGLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDM0MsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFBO1FBQzFCLElBQUksQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQTtLQUN4QjtJQUVELElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDckIsRUFBRSxFQUFFLENBQUE7Q0FDUCxFQUFBOztBQ3JDRCxJQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUE7QUFDckMsSUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFBO0FBRXhDLElBQU0sc0JBQXNCLEdBQUcsT0FBTyxDQUFDLDJCQUEyQixDQUFDLENBQUE7QUFFbkUsc0JBQXVCO0lBQ25CLElBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQTtJQUM3QixJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUE7SUFFakMsSUFBQSxxQkFBTSxFQUNOLDJCQUFTLENBQ0o7SUFFVCxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBaUIsVUFBVSxXQUF3QixFQUFFLEVBQVk7UUFDM0UsSUFBTSxJQUFJLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQTtRQUc3QkMsZUFBYSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDaEMsSUFBSSxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO2dCQUM3QyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQTtnQkFDN0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxHQUFHLFVBQVUsR0FBRyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFO29CQUM5RSxLQUFLLEVBQUUsSUFBSTtvQkFDWCxjQUFjLEVBQUUsSUFBSTtpQkFDdkIsQ0FBQyxDQUFBO2FBQ0w7WUFDRCxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUU7Z0JBQzVCLFFBQVEsSUFBSSxDQUFDLE9BQU87b0JBR2hCLEtBQUssT0FBTzt3QkFDUixJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQTt3QkFDN0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO3dCQUN2QyxNQUFLO2lCQUNaO2FBQ0o7WUFDRCxJQUFJLE1BQU0sQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFO2dCQUN6QixNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUE7YUFDekM7WUFDRCxPQUFPLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtTQUNsRCxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ0osRUFBRSxFQUFFLENBQUE7U0FDUCxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQUMsR0FBVTtZQUNoQixNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFBO1lBQ3ZDLEVBQUUsRUFBRSxDQUFBO1NBQ1AsQ0FBQyxDQUFBO0tBQ0wsQ0FBQyxDQUFBO0NBQ0wsRUFBQTs7QUNuREQsc0JBQWVDLGNBQWMsQ0FBQyxrQkFBa0IsRUFBRTtJQUM5QyxPQUFPLFVBQUMsSUFBa0I7UUFDdEIsSUFBSSxPQUFPLEdBQWtCLEVBQUUsQ0FBQTtRQUUvQixJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsRUFBRSxVQUFDLElBQW9CO1lBQzlDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQTtZQUM1RCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUE7U0FDaEIsQ0FBQyxDQUFBO1FBQ0YsSUFBSSxDQUFDLE9BQU8sT0FBWixJQUFJLEVBQVksT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFDLElBQVk7WUFDckMsT0FBTztnQkFDSCxJQUFJLEVBQUUsUUFBUTtnQkFDZCxNQUFNLEVBQUUsSUFBSTthQUNmLENBQUE7U0FDSixDQUFDLEVBQUM7UUFDSCxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQTtLQUNyQixDQUFBO0NBQ0osQ0FBQyxDQUFBOztBQ1JGLElBQU1KLFNBQU8sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUE7QUFDbEMsSUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLDhCQUE4QixDQUFDLENBQUE7QUFDdkQsSUFBTUssaUJBQWUsR0FBa0MsQ0FBQyxlQUFlLENBQUMsQ0FBQTtBQUV4RSxzQkFBdUI7SUFDbkIsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFBO0lBRXpCLElBQUEscUJBQU0sQ0FDRDtJQUNULElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQTtJQUNyQyxJQUFNLFVBQVUsR0FBRyxJQUFJLE1BQU0sQ0FBQyxNQUFJLE1BQU0sQ0FBQyxNQUFRLENBQUMsQ0FBQTtJQUVsRCxJQUFJLENBQUMsRUFBRSxDQUFDLGdCQUFnQixFQUFpQixVQUFVLFdBQXdCLEVBQUUsRUFBWTtRQUNyRixJQUFNLElBQUksR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFBO1FBRTdCLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRTtZQUM1QkEsaUJBQWUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7U0FDaEM7UUFFRCxJQUFNLE9BQU8sR0FBR0wsU0FBTyxDQUFDSyxpQkFBZSxDQUFDLENBQUE7UUFFeEMsSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLE9BQU8sSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUM5RCxPQUFPLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLE9BQU8sR0FBeUQ7Z0JBQzlGLElBQUksRUFBRSxJQUFJLENBQUMsVUFBVTthQUNFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQyxJQUFvQjtnQkFDbkQsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFBO2dCQUN2QixJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7Z0JBQy9CLEVBQUUsRUFBRSxDQUFBO2FBQ1AsRUFBRSxVQUFDLEdBQVU7Z0JBQ1YsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQTtnQkFDdkMsRUFBRSxFQUFFLENBQUE7YUFDUCxDQUFDLENBQUE7U0FDTDthQUFNO1lBQ0gsRUFBRSxFQUFFLENBQUE7U0FDUDtLQUNKLENBQUMsQ0FBQTtDQUNMLEVBQUE7O0FDckNELElBQUksUUFBUSxHQUF3QixJQUFJLENBQUE7QUFPeEMsd0JBQXVCLFVBQWlDLElBQVUsRUFBRSxXQUF3QixFQUFFLFFBQW1CO0lBQzdHLElBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQTtJQUM3QixJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUE7SUFDN0IsSUFBQSxxQkFBTSxDQUFVO0lBRXhCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sWUFBWSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFBO0lBQ3RGLElBQU0sU0FBUyxHQUFJO1FBQ2YsY0FBYyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztLQUNqQyxDQUFBO0lBRUQsSUFBSSxDQUFDLFFBQVEsRUFBRTtRQUNYLFFBQVEsR0FBd0IsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLGVBQWUsRUFBRSxhQUFhLENBQUMsRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUE7S0FDcEc7SUFFRCxJQUFNLE1BQU0sR0FBR0Msa0JBQWtCLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtRQUM1QyxlQUFlLEVBQUUsUUFBUSxDQUFDLGVBQWU7UUFDekMsUUFBUSxFQUFFLElBQUksQ0FBQyxVQUFVO0tBQzVCLENBQUMsQ0FBQTtJQUVGLElBQUk7UUFDQSxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUE7UUFDaEMsSUFBSSxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRTtZQUMzQixJQUFJLENBQUMsU0FBUyx3QkFDUCxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsRUFDaEMsU0FBUyxDQUNmLENBQUE7U0FDSjtRQUNELElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUE7S0FDeEI7SUFBQyxPQUFPLEdBQUcsRUFBRTtRQUNWLE1BQU0sQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUE7S0FDbEQ7SUFFRCxRQUFRLEVBQUUsQ0FBQTtDQUNiLEVBQUE7O0FDcENELElBQU0sY0FBYyxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFBO0FBQ2hELElBQU0saUJBQWlCLEdBQUcsT0FBTyxDQUFDLHNCQUFzQixDQUFDLENBQUE7QUFFekQsK0JBQXdCO0lBQ3BCLElBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQTtJQUM3QixJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUE7SUFDbkMsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFBO0lBQ3JDLElBQU0sVUFBVSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQUksTUFBTSxDQUFDLE1BQVEsQ0FBQyxDQUFBO0lBQ2xELElBQU0sZUFBZSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQUksTUFBTSxDQUFDLGlCQUFtQixDQUFDLENBQUE7SUFFbEUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsRUFBRSxVQUFVLFdBQXdCLEVBQUUsRUFBWTtRQUN0RSxJQUFNLElBQUksR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFBO1FBQzdCLElBQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFBO1FBQ3pDLElBQU0sbUJBQW1CLEdBQUcsSUFBSSxHQUFHLEVBQWtCLENBQUE7UUFHckQsSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLEtBQUssRUFBRTtZQUV4QixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDWCxJQUFJLENBQUMsR0FBRyxHQUFXQyxXQUFXLENBQzFCLElBQUksQ0FBQyxPQUFPLFlBQVksTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFDdkU7b0JBQ0ksT0FBTyxFQUFFLEtBQUs7b0JBQ2QsVUFBVSxFQUFFLFFBQVE7aUJBQ3ZCLENBQ0osQ0FBQTthQUNKO1lBRUQsUUFBUSxDQUFTLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQ3ZCLEtBQUssWUFBRUMsT0FBSTtvQkFDUCxJQUFJQSxPQUFJLENBQUMsbUJBQW1CLEVBQUUsRUFBRTt3QkFDNUIsSUFBTSxJQUFJLEdBQUdBLE9BQUksQ0FBQyxJQUFJLENBQUE7d0JBQ3RCLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUE7d0JBRTFCLElBQ0ksTUFBTTs0QkFDTixNQUFNLENBQUMsS0FBSzs0QkFDWixPQUFPLE1BQU0sQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUNsQzs0QkFDRSxPQUFPLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxtQkFBbUIsQ0FBQyxDQUFBO3lCQUN6RTtxQkFDSjtvQkFFRCxJQUFJQSxPQUFJLENBQUMsZ0JBQWdCLEVBQUUsRUFBRTt3QkFDekIsSUFBTSxJQUFJLEdBQUdBLE9BQUksQ0FBQyxJQUFJLENBQUE7d0JBQ3RCLElBQU0sTUFBTSxHQUFpQixJQUFJLENBQUMsTUFBTSxDQUFBO3dCQUN4QyxJQUFNLElBQUksR0FBc0IsSUFBSSxDQUFDLFNBQVMsQ0FBQTt3QkFFOUMsSUFDSSxJQUFJOzRCQUNKLE1BQU07NEJBQ04sSUFBSSxDQUFDLENBQUMsQ0FBQzs0QkFDUCxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSzs0QkFDYixNQUFNLENBQUMsSUFBSSxLQUFLLFNBQVM7NEJBQ3pCLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxRQUFRLEVBQ25DOzRCQUNFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLG1CQUFtQixDQUFDLENBQUE7eUJBQzFFO3FCQUNKO2lCQUNKO2FBQ0osQ0FBQyxDQUFBO1lBQ0YsSUFBSSxDQUFDLE9BQU8sR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDbkMsT0FBTyxFQUFFLENBQUMsT0FBTztnQkFDakIsUUFBUSxFQUFFLENBQUMsT0FBTzthQUNyQixDQUFDLENBQUMsSUFBSSxDQUFBO1lBRVAsSUFBTSxjQUFjLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFBLFVBQVUsSUFBSSxPQUFBLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBQSxDQUFDLENBQUE7WUFFbkgsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLFVBQUEsVUFBVSxJQUFJLE9BQUEscUJBQXFCLENBQUMsVUFBVSxDQUFDLEdBQUEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUNsRixFQUFFLEVBQUUsQ0FBQTthQUNQLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBQSxHQUFHO2dCQUNSLEVBQUUsRUFBRSxDQUFBO2dCQUNKLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQTthQUN4RCxDQUFDLENBQUE7U0FDTDthQUFNO1lBQ0gsRUFBRSxFQUFFLENBQUE7U0FDUDtLQUNhLENBQUMsQ0FBQTtJQUVuQixTQUFTLE9BQU8sQ0FBRSxJQUFTLEVBQUUsVUFBa0IsRUFBRSxVQUFrQixFQUFFLG1CQUF3QztRQUN6RyxJQUFNLGNBQWMsR0FBR0MsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFBO1FBQy9DLElBQU0sY0FBYyxHQUFHQSxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUE7UUFDL0MsSUFBTSxVQUFVLEdBQUcsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBRWhELElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQ3ZFLElBQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRTtnQkFDL0MsS0FBSyxFQUFFLENBQUMsY0FBYyxDQUFDO2FBQzFCLENBQUMsQ0FBQTtZQUdGLElBQUksQ0FBQyxVQUFVLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7Z0JBQUUsT0FBTTtZQUV0RCxJQUFNLFFBQVEsR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUE7WUFFckYsSUFBSSxDQUFDLEtBQUssR0FBR0MsYUFBYSxDQUFDLGNBQWMsRUFBRSxRQUFRLENBQUMsQ0FBQTtZQUVwRCxJQUFJLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUM7Z0JBQUUsT0FBTTtZQUMvQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFBO1NBQ2xEO0tBQ0o7SUFFRCxTQUFlLHFCQUFxQixDQUFFLFVBQWtCOzs7Ozs7d0JBQ3BELGNBQWMsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFBO3dCQUM3QixXQUFNLEtBQUssQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEVBQUE7O3dCQUF6QyxJQUFJLEdBQUcsU0FBa0M7d0JBRS9DLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLGlCQUFpQixFQUFFLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQTt3QkFDM0YsV0FBTSxRQUFRLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUE7O3dCQUE5QyxTQUE4QyxDQUFBOzs7OztLQUNqRDtDQUNKLEVBQUE7O0FDOUZNLElBQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQTtBQU1oQyxBQUFPLElBQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQTtBQU1qQyxBQUFPLElBQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQTtBQU05QixBQUFPLElBQU0sVUFBVSxHQUFHLGNBQWMsQ0FBQTtBQUt4QyxBQUFPLElBQU0sUUFBUSxHQUFHO0lBQ3BCLElBQUksRUFBRWIsU0FBUyxDQUFDLFNBQVMsRUFBRSxrQkFBa0IsQ0FBQztJQUM5QyxTQUFTLEVBQUVBLFNBQVMsQ0FBQyxTQUFTLEVBQUUsdUJBQXVCLENBQUM7Q0FDM0QsQ0FBQTtBQU1ELEFBQU8sSUFBTSxXQUFXLEdBQUcsZUFBZSxDQUFBO0FBVTFDLEFBQU8sSUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFBO0FBTTFCLEFBQU8sSUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFBO0FBSzVCLEFBQU8sSUFBTSxPQUFPLEdBQXdCO0lBQ3hDO1FBQ0ksS0FBSyxFQUFFLGNBQWM7UUFDckIsT0FBTyxFQUFFO1lBQ0w7Z0JBQ0ksTUFBTSxFQUFFLFdBQVc7Z0JBQ25CLE9BQU8sRUFBRSxFQUFFO2FBQ2Q7U0FDSjtLQUNKO0lBQ0Q7UUFDSSxLQUFLLEVBQUUseUJBQXlCO1FBQ2hDLE9BQU8sRUFBRTtZQUNMO2dCQUNJLE1BQU0sRUFBRSxXQUFXO2dCQUNuQixPQUFPLEVBQUUsRUFBRTthQUNkO1NBQ0o7S0FDSjtJQUNEO1FBQ0ksS0FBSyxFQUFFLGtCQUFrQjtRQUN6QixPQUFPLEVBQUU7WUFDTDtnQkFDSSxNQUFNLEVBQUUsVUFBVTtnQkFDbEIsT0FBTyxFQUFFLEVBQUU7YUFDZDtTQUNKO0tBQ0o7SUFDRDtRQUNJLEtBQUssRUFBRSxzQkFBc0I7UUFDN0IsT0FBTyxFQUFFO1lBQ0w7Z0JBQ0ksTUFBTSxFQUFFLGdCQUFnQjtnQkFDeEIsT0FBTyxFQUFFLEVBQUU7YUFDZDtTQUNKO0tBQ0o7Q0FDSixDQUFBO0FBTUQsQUFBTyxJQUFNLEtBQUssR0FBWSxLQUFLLENBQUE7QUFLbkMsQUFBTyxJQUFNLE9BQU8sR0FBd0I7SUFDeEM7UUFDSSxNQUFNLEVBQUUsdUJBQXVCO1FBQy9CLE9BQU8sRUFBRSxFQUFFO0tBQ2Q7SUFDRDtRQUNJLE1BQU0sRUFBRSxjQUFjO1FBQ3RCLE9BQU8sRUFBRSxFQUFFO0tBQ2Q7SUFDRDtRQUNJLE1BQU0sRUFBRSxjQUFjO1FBQ3RCLE9BQU8sRUFBRSxFQUFFO0tBQ2Q7Q0FDSixDQUFBO0FBS0QsQUFBTyxJQUFNLE9BQU8sR0FBd0IsRUFBRSxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7OztBQzFJOUMsSUFBTWMsS0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQTtBQUN6QixJQUFNLFlBQVksR0FBZSxhQUFhLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLENBQUE7QUFFdEYsU0FBUyxVQUFVO0lBQU0sY0FBbUI7U0FBbkIsVUFBbUIsRUFBbkIscUJBQW1CLEVBQW5CLElBQW1CO1FBQW5CLHlCQUFtQjs7SUFDeEMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQUEsR0FBRyxJQUFJLE9BQUEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEdBQUEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFDLElBQUksRUFBRSxJQUFJO1FBQzNELE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQTtLQUMzQixFQUFFLEVBQUUsQ0FBQyxDQUFBO0NBQ1Q7QUFFRCxzQ0FDTyxpQkFBaUIsRUFDakIsWUFBWSxJQUNmLFFBQVEsRUFBRSxZQUFZLENBQUMsUUFBUSxHQUFHO1FBQzlCLElBQUksRUFBRWQsU0FBUyxDQUFDYyxLQUFHLEVBQUUsWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7UUFDaEQsU0FBUyxFQUFFZCxTQUFTLENBQUNjLEtBQUcsRUFBRSxZQUFZLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQztLQUM3RCxHQUFHQyxRQUEwQixFQUM5QixPQUFPLEVBQUUsVUFBVSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUVDLE9BQXlCLENBQUMsRUFDcEUsT0FBTyxFQUFFLFVBQVUsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFQyxPQUF5QixDQUFDLEVBQ3BFLE9BQU8sRUFBRSxVQUFVLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRUMsT0FBeUIsQ0FBQyxJQUN2RTs7QUN4Qk0sSUFBTUosS0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQTtBQUNoQyxBQUFPLElBQU0sTUFBTSxHQUFHSyxZQUFZLENBQUNMLEtBQUcsRUFBRSxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUE7QUFDN0QsQUFBTyxJQUFNLE9BQU8sR0FBR0ssWUFBWSxDQUFDTCxLQUFHLEVBQUUsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFBO0FBQzlELEFBQU8sSUFBTSxXQUFXLEdBQUdLLFlBQVksQ0FBQyxNQUFNLEVBQUUsY0FBYyxDQUFDLENBQUE7QUFDL0QsQUFBTyxJQUFNLGlCQUFpQixHQUFHQSxZQUFZLENBQUNMLEtBQUcsRUFBRSxjQUFjLENBQUMsQ0FBQTtBQUNsRSxBQUFPLElBQU0sZUFBZSxHQUFHSyxZQUFZLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFBO0FBQ25FLEFBQU8sSUFBTSxlQUFlLEdBQUksNEJBQTRCLENBQUE7Ozs7Ozs7Ozs7OztBQ0g1RCxJQUFNQyxjQUFZLEdBQUcsYUFBYSxDQUFDLENBQUMsVUFBVSxDQUFDLEVBQUVDLE1BQWEsQ0FBQyxDQUFBO0FBRS9ELG9CQUFlLE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDekIsS0FBSyxFQUFFLEVBQUU7SUFDVCxXQUFXLEVBQUUsRUFBRTtJQUNmLE1BQU0sRUFBRTtRQUNKLHNCQUFzQixFQUFFLFFBQVE7S0FDbkM7Q0FJSixFQUFFRCxjQUFZLENBQUMsQ0FBQTs7QUNiaEIsa0NBQ08sWUFBWSxJQUNmLFVBQVUsWUFBQTtJQUNWLGFBQWEsZUFBQSxJQUNoQjs7QUNORCxJQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUE7QUFPNUIsU0FBZ0IsUUFBUSxDQUFFLGNBQXNCO0lBQzVDLE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTTtRQUMvQkUsYUFBVyxDQUFDLGNBQWMsRUFBRSxVQUFDLEdBQUcsRUFBRSxNQUFNO1lBQ3BDLElBQUksR0FBRyxFQUFFO2dCQUNMLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTthQUNkO2lCQUFNO2dCQUNILE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQTthQUNsQjtTQUNKLENBQUMsQ0FBQTtLQUNMLENBQUMsQ0FBQTtDQUNMO0FBRUQsU0FBZ0IsU0FBUyxDQUFFLGNBQXNCLEVBQUUsT0FBZ0I7SUFDL0QsT0FBTyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNO1FBQy9CQyxjQUFZLENBQUMsY0FBYyxFQUFFLE9BQU8sRUFBRSxVQUFBLEdBQUc7WUFDckMsSUFBSSxHQUFHLEVBQUU7Z0JBQ0wsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO2FBQ2Q7aUJBQU07Z0JBQ0gsT0FBTyxFQUFFLENBQUE7YUFDWjtTQUNKLENBQUMsQ0FBQTtLQUNMLENBQUMsQ0FBQTtDQUNMO0FBRUQsU0FBZ0IsV0FBVyxDQUFFLE1BQWMsRUFBRSxPQUF1QjtJQUNoRSxPQUFPLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU07UUFDL0IsSUFBSSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsVUFBQyxHQUFtQixFQUFFLEtBQW9CO1lBQzVELElBQUksR0FBRyxFQUFFO2dCQUNMLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTthQUNkO2lCQUFNO2dCQUNILE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQTthQUNqQjtTQUNKLENBQUMsQ0FBQTtLQUNMLENBQUMsQ0FBQTtDQUNMOztBQ2pDRCxJQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUE7QUFFekM7SUFRSSxjQUFhLE1BQTZCO1FBQ3RDLElBQU0sY0FBYyxHQUFHLElBQUksTUFBTSxDQUFDLE1BQUksTUFBTSxDQUFDLE1BQVEsQ0FBQyxDQUFBO1FBRXRELElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVTtZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsaURBQWlELENBQUMsQ0FBQTtRQUMxRixJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU87WUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLDhDQUE4QyxDQUFDLENBQUE7UUFFcEYsSUFBSSxDQUFDLFVBQVUsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFBO1FBQ25DLElBQUksQ0FBQyxVQUFVLEdBQUcsTUFBTSxDQUFDLFVBQVUsSUFBSSxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUMvRixJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUE7UUFDN0IsSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFBO1FBQ2pDLElBQUksQ0FBQyxVQUFVLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUE7S0FDekQ7SUFFRCxzQkFBSSx5QkFBTzthQUFYO1lBQ0ksT0FBT1gsWUFBWSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQTtTQUN2Qzs7O09BQUE7SUFFRCxzQkFBSSwwQkFBUTthQUFaO1lBQ0ksT0FBT1ksYUFBYSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQTtTQUN4Qzs7O09BQUE7SUFFRCxzQkFBSSx5QkFBTzthQUFYO1lBQ0ksT0FBT0MsWUFBWSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQTtTQUN2Qzs7O09BQUE7SUFFSyxxQkFBTSxHQUFaLFVBQWNkLE9BQVk7K0NBQUcsT0FBTzs7OzRCQUNoQyxXQUFNTCxlQUFhLENBQUNLLE9BQUksQ0FBQyxFQUFBOzt3QkFBekIsU0FBeUIsQ0FBQTt3QkFFekIsSUFBSSxDQUFDQSxPQUFJLEVBQUU7NEJBQ1AsTUFBTSxJQUFJLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQTt5QkFDbEM7Ozs7O0tBQ0o7SUFFRCx3QkFBUyxHQUFULFVBQVcsR0FBVztRQUNsQixJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxDQUFBO0tBQ3JEO0lBRUQscUNBQXNCLEdBQXRCO1FBQ0ksSUFBSSxJQUFJLENBQUMsT0FBTyxZQUFZLE1BQU0sRUFBRTtZQUNoQyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUE7U0FDekM7S0FDSjtJQUNMLFdBQUM7Q0FBQSxJQUFBOztTQ3ZEZSxVQUFVLENBQUUsVUFBa0I7SUFDMUMsT0FBTyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUEsT0FBTztRQUNwQyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxJQUFJLENBQUM7WUFDNUIsVUFBVSxZQUFBO1lBQ1YsT0FBTyxTQUFBO1NBQ1YsQ0FBQyxDQUFDLENBQUE7S0FDTixDQUFDLENBQUE7Q0FDTDtBQUVELFNBQWdCLGNBQWMsQ0FBRSxVQUFrQjtJQUM5QyxJQUFNLE9BQU8sR0FBR2UsaUJBQWUsQ0FBQyxVQUFVLENBQUMsQ0FBQTtJQUMzQyxPQUFPLElBQUksSUFBSSxDQUFDO1FBQ1osVUFBVSxZQUFBO1FBQ1YsT0FBTyxTQUFBO0tBQ1YsQ0FBQyxDQUFBO0NBQ0w7O0FDbkJELElBQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQTtBQUMvQixJQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUE7QUFFNUM7SUFHSTtRQUNJLElBQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQTtRQUU1QixJQUFJLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUE7S0FDMUM7SUFFRCx1QkFBSSxHQUFKLFVBQU0sSUFBWSxFQUFFLEVBQVUsRUFBRSxPQUFlLEVBQUUsZUFBaUMsRUFBRSxXQUFxQztRQUNySCxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxlQUFlLEVBQUUsV0FBVyxDQUFDLENBQUE7S0FDdkU7SUFFRCx3QkFBSyxHQUFMLFVBQU8sUUFBZ0IsRUFBRSxRQUE4QjtRQUNuRCxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUE7S0FDeEM7SUFFRCw0QkFBUyxHQUFULFVBQVcsUUFBZ0IsRUFBRSxRQUFhLEVBQUUsUUFBbUMsRUFBRSxLQUF5QjtRQUN0RyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLFFBQVEsSUFBSSxJQUFJLEVBQUUsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFBO0tBQ3pFO0lBRUQsdUJBQUksR0FBSixVQUFNLFFBQWdCLEVBQUUsT0FBNEM7UUFDaEUsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUE7S0FDN0M7SUFFRCwyQkFBUSxHQUFSLFVBQVUsUUFBZ0IsRUFBRSxRQUFjO1FBQ3RDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQTtLQUMzQztJQUVELHVCQUFJLEdBQUo7UUFBQSxpQkFJQztRQUhHLE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBQSxPQUFPO1lBQ3RCLEtBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1NBQzlCLENBQUMsQ0FBQTtLQUNMO0lBQ0wsZUFBQztDQUFBLElBQUE7O3dCQ3JDd0IsRUFBVSxFQUFFLE9BQThCO0lBQy9ELElBQUk7UUFDQSxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFBO0tBQ3RDO0lBQUMsT0FBTyxHQUFHLEVBQUU7UUFDVkMsTUFBRyxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsS0FBSyxHQUFHLFFBQU0sT0FBTyxDQUFDLEtBQU8sR0FBRyxJQUFJLENBQUMsQ0FBQTtLQUN4RjtDQUNKOztTQ1R1QixrQkFBa0IsQ0FBRSxJQUFvRDtJQUFwRCxxQkFBQSxFQUFBLFNBQW9EO0lBQUUsZ0JBQXFCO1NBQXJCLFVBQXFCLEVBQXJCLHFCQUFxQixFQUFyQixJQUFxQjtRQUFyQiwrQkFBcUI7O0lBQ25ILE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTTtRQUMvQixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRztZQUNmLE9BQU8sRUFBRSxDQUFBO1lBQ1QsT0FBTTtTQUNUO1FBQ0QsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFQLElBQUksRUFBTyxNQUFNLENBQUMsQ0FBQTtnQ0FFcEIsQ0FBQztZQUNOLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO2dCQUNiLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFQLElBQUksRUFBTyxNQUFNLEVBQUM7YUFDNUIsQ0FBQyxDQUFBOztRQUhOLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRTtvQkFBM0IsQ0FBQztTQUlUO1FBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFBLEdBQUc7WUFDVCxPQUFPLEVBQUUsQ0FBQTtTQUNaLEVBQUUsVUFBQSxHQUFHO1lBQ0YsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1NBQ2QsQ0FBQyxDQUFBO0tBQ0wsQ0FBQyxDQUFBO0NBQ0w7OytCQ3BCd0IsRUFBWTtJQUNqQyxPQUFPO1FBQVUsZ0JBQXFCO2FBQXJCLFVBQXFCLEVBQXJCLHFCQUFxQixFQUFyQixJQUFxQjtZQUFyQiwyQkFBcUI7O1FBQ2xDLElBQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUE7UUFFaEMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxVQUFBLE9BQU87WUFDdEIsSUFBSSxFQUFFLENBQUMsTUFBTSxHQUFHLFVBQVUsRUFBRTtnQkFDeEIsRUFBRSxlQUFJLE1BQU0sU0FBRSxPQUFPLElBQUM7YUFDekI7aUJBQU07Z0JBQ0gsT0FBTyxDQUFDLEVBQUUsZUFBSSxNQUFNLEVBQUUsQ0FBQTthQUN6QjtTQUNKLENBQUMsQ0FBQTtLQUNMLENBQUE7Q0FDSjs7eUJDVndCLEdBQXNCLEVBQUUsT0FBK0I7SUFDNUUsT0FBT0MsY0FBYyxDQUFDLEdBQUcscUJBQ3JCLFVBQVUsRUFBRSxJQUFJLEVBQ2hCLGFBQWEsRUFBRSxJQUFJLElBQ2hCLE9BQU8sRUFDWixDQUFBO0NBQ0w7O0FDSEQsSUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLDJCQUEyQixDQUFDLENBQUE7QUFFckQsMEJBQXlCLFFBQXFCO0lBQXJCLHlCQUFBLEVBQUEsYUFBcUI7SUFDMUMsSUFBTSxNQUFNLEdBQTJCLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQTtJQUV6RCxPQUFPLE1BQU0sQ0FBQyxtQkFBbUIsSUFBSSxNQUFNLENBQUMsbUJBQW1CLENBQUE7Q0FDbEU7O3lCQ1R3QixJQUFZLEVBQUVqQixPQUFZO0lBQy9DLE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTTtRQUMvQixZQUFZLENBQUMsSUFBSSxFQUFFQSxPQUFJLEVBQUUsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUUsVUFBQyxHQUFVO1lBQ2xELEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsT0FBTyxFQUFFLENBQUE7U0FDaEMsQ0FBQyxDQUFBO0tBQ0wsQ0FBQyxDQUFBO0NBQ0w7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ01EO0lBSUksbUJBQWEsUUFBa0IsRUFBRSxPQUFnQjtRQUM3QyxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQTtRQUN4QixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTtLQUN6QjtJQUlELCtCQUFXLEdBQVg7UUFDSSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUE7S0FDdkI7SUFFRCw0QkFBUSxHQUFSO1FBQ0ksT0FBTyxLQUFLLENBQUE7S0FDZjtJQUVELGlDQUFhLEdBQWI7UUFDSSxPQUFPLE1BQU0sQ0FBQyxVQUFVLENBQUE7S0FDM0I7SUFFRCxtQ0FBZSxHQUFmO1FBQ0ksT0FBTyxNQUFNLENBQUE7S0FDaEI7SUFFRCxvQ0FBZ0IsR0FBaEI7UUFDSSxPQUFPLE1BQU0sQ0FBQyxhQUFhLENBQUE7S0FDOUI7SUFDTCxnQkFBQztDQUFBLElBQUE7QUFFRDtJQUFxQ2tCLDJDQUFTO0lBRTFDLHlCQUFhLFFBQWtCLEVBQUUsT0FBaUM7ZUFDOUQsa0JBQU0sUUFBUSxFQUFFLE9BQU8sQ0FBQztLQUMzQjtJQUtELG9DQUFVLEdBQVY7UUFDSSxPQUFPLElBQUksQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFBO0tBQzVCO0lBRUQsNEJBQUUsR0FBRixVQUFJLEtBQWEsRUFBRSxPQUFzQjtRQUNyQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUE7S0FDbkM7SUFDTCxzQkFBQztDQWhCRCxDQUFxQyxTQUFTLEdBZ0I3QztBQUVEO0lBQXFDQSwyQ0FBUztJQVMxQyx5QkFBYSxRQUFrQixFQUFFLE9BQWlDO2VBQzlELGtCQUFNLFFBQVEsRUFBRSxPQUFPLENBQUM7S0FDM0I7SUFORCxvQ0FBVSxHQUFWO1FBQ0ksT0FBTyxJQUFJLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQTtLQUM1QjtJQUtMLHNCQUFDO0NBWkQsQ0FBcUMsU0FBUyxHQVk3Qzs7QUMzREQ7SUFRSSxxQkFBYSxJQUFtQixFQUFFLElBQW9CLEVBQUUsUUFBa0I7UUFDdEUsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUE7UUFDeEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUE7UUFDbEIsSUFBSSxDQUFDLEVBQUUsR0FBRyxRQUFRLENBQUMsYUFBYSxFQUFFLENBQUE7UUFFbEMsSUFBSSxJQUFJLFlBQVksSUFBSSxFQUFFO1lBQ3RCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFBO1lBQ2hCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQTtTQUNwQzthQUFNO1lBQ0gsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUE7U0FDekI7UUFFRCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUE7S0FDaEI7SUFFSyx5QkFBRyxHQUFUOytDQUFjLE9BQU87Ozs7Ozt3QkFFYixXQUFNLElBQUksQ0FBQyxRQUFRLEVBQUUsRUFBQTs7d0JBQXJCLFNBQXFCLENBQUE7d0JBQ3JCLFdBQU0sSUFBSSxDQUFDLGFBQWEsRUFBRSxFQUFBOzt3QkFBMUIsU0FBMEIsQ0FBQTt3QkFDMUIsV0FBTSxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUE7O3dCQUFwQixTQUFvQixDQUFBOzs7O3dCQUVwQkMsTUFBWSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsR0FBQyxDQUFDLE9BQU8sRUFBRSxHQUFDLENBQUMsQ0FBQTs7Ozs7O0tBRWxEO0lBRUssOEJBQVEsR0FBZDsrQ0FBbUIsT0FBTzs7Ozs7d0JBQ3RCLElBQUksSUFBSSxDQUFDLFNBQVM7NEJBQUUsV0FBTTt3QkFFMUIsV0FBTSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsRUFBQTs7d0JBQWxELFNBQWtELENBQUE7NkJBQzlDLEVBQUUsSUFBSSxDQUFDLElBQUksWUFBWSxJQUFJLENBQUMsRUFBNUIsY0FBNEI7d0JBQzVCLEtBQUEsSUFBSSxDQUFBO3dCQUFRLFdBQU1DLFVBQWdCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFBOzt3QkFBbkQsR0FBSyxJQUFJLEdBQUcsU0FBdUMsQ0FBQTs7NEJBR3ZELFdBQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLEVBQUE7O3dCQUFqRCxTQUFpRCxDQUFBOzs7OztLQUNwRDtJQUVLLG1DQUFhLEdBQW5COytDQUF3QixPQUFPOzs7Ozt3QkFDM0IsSUFBSSxJQUFJLENBQUMsU0FBUzs0QkFBRSxXQUFNO3dCQUVwQixJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQTt3QkFDaEIsT0FBTyxHQUFhLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxVQUFDLFFBQWlCOzRCQUNyRSxPQUFPLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQTt5QkFDOUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFDLFFBQWlCOzRCQUNyQixPQUFPLFFBQVEsQ0FBQyxPQUFPLENBQUE7eUJBQzFCLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBQyxJQUFJLEVBQUUsSUFBSTs0QkFDakIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFBO3lCQUMzQixFQUFFLEVBQUUsQ0FBQyxDQUFBO3dCQUNBLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQUEsTUFBTTs0QkFDNUIsT0FBT0Msb0JBQTBCLENBQUMsTUFBTSxDQUFDLENBQUE7eUJBQzVDLENBQUMsQ0FBQTt3QkFFRixXQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsRUFBQTs7d0JBQTlDLFNBQThDLENBQUE7d0JBQzlDLFdBQU1DLGtCQUF3QixDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUE7O3dCQUFqRCxTQUFpRCxDQUFBO3dCQUNqRCxXQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsRUFBQTs7d0JBQTdDLFNBQTZDLENBQUE7Ozs7O0tBQ2hEO0lBRUssNkJBQU8sR0FBYjsrQ0FBa0IsT0FBTzs7Ozt3QkFDckIsSUFBSSxJQUFJLENBQUMsU0FBUzs0QkFBRSxXQUFNO3dCQUcxQixXQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxFQUFBOzt3QkFBaEQsU0FBZ0QsQ0FBQTt3QkFFaEQsV0FBTSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLEVBQUE7O3dCQUEvQyxTQUErQyxDQUFBO3dCQUMvQyxXQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsRUFBQTs7d0JBQXRDLFNBQXNDLENBQUE7d0JBQ3RDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsS0FBSyxJQUFLSCxNQUFZLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsS0FBRyxNQUFNLENBQUMsR0FBRyxHQUFHSSxRQUFVLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQTt3QkFDN0gsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFBOzs7OztLQUNqQjtJQUtELDRCQUFNLEdBQU47UUFDSSxJQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUE7UUFFcEUsSUFBSSxjQUFjLEVBQUU7WUFDaEIsSUFBSSxNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUs7Z0JBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsRUFBRSxjQUFjLENBQUMsRUFBRSxFQUFFLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQTtZQUU5RyxjQUFjLENBQUMsT0FBTyxFQUFFLENBQUE7U0FDM0I7UUFDRCxRQUFRLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFBO0tBQ3REO0lBS0QsNkJBQU8sR0FBUDtRQUNJLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFBO1FBQ3JCLFFBQVEsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQTtLQUNuRDtJQUNMLGtCQUFDO0NBQUEsSUFBQTs7QUM3Rk8sSUFBQUMsaUJBQU0sQ0FBVTtBQUN4QixJQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUE7QUFLMUI7SUFvQkk7UUFoQkEsWUFBTyxHQUVIO1lBQ0Esa0JBQWtCLEVBQUUsRUFBRTtZQUN0QixpQkFBaUIsRUFBRSxFQUFFO1lBQ3JCLGNBQWMsRUFBRSxFQUFFO1lBQ2xCLGFBQWEsRUFBRSxFQUFFO1lBQ2pCLGdCQUFnQixFQUFFLEVBQUU7WUFDcEIsZUFBZSxFQUFFLEVBQUU7WUFDbkIsTUFBTSxFQUFFLEVBQUU7U0FDYixDQUFBO1FBQ0QsWUFBTyxHQUdGLEVBQUUsQ0FBQTtRQUdILElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFBO1FBQ3BCLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQTtRQUNsQixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUE7UUFFbEIsSUFBSSxNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRTtZQUN6QixPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxVQUFDLEdBQUcsRUFBRSxLQUFLO2dCQUMvQyxJQUFJLEtBQUssWUFBWSxRQUFRO29CQUFFLE9BQU8sWUFBWSxDQUFBO2dCQUNsRCxPQUFPLEtBQUssQ0FBQTthQUNmLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtTQUNUO0tBQ0o7SUFPRCxxQkFBRSxHQUFGLFVBQUksS0FBYSxFQUFFLE9BQXNCO1FBQ3JDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxNQUFNLENBQUMsQ0FBQztZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsbUJBQWlCLEtBQU8sQ0FBQyxDQUFBO1FBQy9FLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO0tBQ3BDO0lBT0ssdUJBQUksR0FBVixVQUFZLEtBQWEsRUFBRSxXQUF3QjsrQ0FBRyxPQUFPOzs7Ozt3QkFDekQsSUFBSSxXQUFXLENBQUMsU0FBUzs0QkFBRSxXQUFNO3dCQUUzQixPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQTt3QkFFbkMsSUFBSSxDQUFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNOzRCQUFFLFdBQU07d0JBRWpDLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQUEsTUFBTTs0QkFDNUIsT0FBTyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsQ0FBQTt5QkFDdEMsQ0FBQyxDQUFBOzs7O3dCQUdFLFdBQU0sa0JBQWtCLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxFQUFBOzt3QkFBNUMsU0FBNEMsQ0FBQTs7Ozt3QkFFNUNMLE1BQVksQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEdBQUMsQ0FBQyxPQUFPLEVBQUUsR0FBQyxDQUFDLENBQUE7Ozs7OztLQUVsRDtJQUtLLHdCQUFLLEdBQVg7K0NBQWdCLE9BQU87Ozs0QkFDbkIsV0FBTSxHQUFHLENBQUM7NEJBQ045QixTQUFTLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUM7NEJBQ2pDLE1BQUlBLFNBQVMsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBRzs0QkFDekMsTUFBSUEsU0FBUyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFHOzRCQUMzQyxNQUFJQSxTQUFTLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxxQkFBcUIsQ0FBRzt5QkFDekQsQ0FBQyxFQUFBOzt3QkFMRixTQUtFLENBQUE7d0JBQ0ZtQyxRQUFNLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQTs7Ozs7S0FDbkQ7SUFLSyx5QkFBTSxHQUFaOytDQUFpQixPQUFPOzs7Ozs7d0JBQ3BCQSxRQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFBO3dCQUVDLFdBQU1DLFdBQWlCLENBQUMsTUFBTSxFQUFFO2dDQUN4RCxHQUFHLEVBQUUsTUFBTSxDQUFDLE1BQU07Z0NBQ2xCLEtBQUssRUFBRSxJQUFJO2dDQUNYLE1BQU0sRUFBRSxLQUFLO2dDQUNiLFFBQVEsRUFBRSxJQUFJO2dDQUNkLE1BQU0sRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU87NkJBQ3BDLENBQUMsRUFBQTs7d0JBTkksU0FBUyxHQUFhLFNBTTFCO3dCQUNZLFdBQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQUEsSUFBSTtnQ0FDOUMsT0FBT0wsVUFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQTs2QkFDaEMsQ0FBQyxDQUFDLEVBQUE7O3dCQUZHLEtBQUssR0FBRyxTQUVYO3dCQUNHLFlBQVksR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQUEsSUFBSTs0QkFDL0IsT0FBTyxJQUFJLFdBQVcsQ0FBQyxJQUFJLEVBQUUsS0FBSSxDQUFDLE1BQU0sRUFBRSxLQUFJLENBQUMsQ0FBQTt5QkFDbEQsQ0FBQyxDQUFBO3dCQUVGTSxrQkFBZ0IsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUE7d0JBUXhDLFdBQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLFVBQUEsWUFBWSxJQUFJLE9BQUEsWUFBWSxDQUFDLEdBQUcsRUFBRSxHQUFBLENBQUMsQ0FBQyxFQUFBOzt3QkFBdkUsU0FBdUUsQ0FBQTs7Ozs7S0FDMUU7SUFFRCw2QkFBVSxHQUFWO1FBQUEsaUJBdUJDO1FBdEJHLE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBQSxPQUFPO1lBQ3RCLElBQU0sT0FBTyxHQUFHQyxjQUFvQixDQUFJLE1BQU0sQ0FBQyxNQUFNLFVBQU8sRUFBRTtnQkFDMUQsY0FBYyxFQUFFLEtBQUs7Z0JBQ3JCLE9BQU8sRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU87YUFDckMsQ0FBQyxDQUFBO1lBRUYsT0FBTyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsVUFBTyxRQUFnQjs7OztnQ0FDeEIsV0FBTVAsVUFBZ0IsQ0FBQyxRQUFRLENBQUMsRUFBQTs7NEJBQXZDLElBQUksR0FBRyxTQUFnQzs0QkFDN0MsV0FBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUE7OzRCQUExQyxTQUEwQyxDQUFBOzs7O2lCQUM3QyxDQUFDLENBQUE7WUFDRixPQUFPLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxVQUFPLFFBQWdCOzs7Z0NBQ3hDLFdBQU1RLFdBQVMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUE7OzRCQUFoRSxTQUFnRSxDQUFBOzRCQUNoRUosUUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUE7Ozs7aUJBQ3JDLENBQUMsQ0FBQTtZQUNGLE9BQU8sQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLFVBQU8sUUFBZ0I7Ozs7Z0NBQzNCLFdBQU1KLFVBQWdCLENBQUMsUUFBUSxDQUFDLEVBQUE7OzRCQUF2QyxJQUFJLEdBQUcsU0FBZ0M7NEJBQzdDLFdBQU0sSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFBOzs0QkFBMUMsU0FBMEMsQ0FBQTs7OztpQkFDN0MsQ0FBQyxDQUFBO1lBQ0YsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUU7Z0JBQ2hCLE9BQU8sRUFBRSxDQUFBO2FBQ1osQ0FBQyxDQUFBO1NBQ0wsQ0FBQyxDQUFBO0tBQ0w7SUFNRCxzQ0FBbUIsR0FBbkIsVUFBcUIsSUFBVTtRQUMzQixPQUFPLElBQUksV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFBO0tBQ2xEO0lBS0QsOEJBQVcsR0FBWDtRQUFBLGlCQVNDO1FBUkcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFDLEVBQWtCO2dCQUFoQixnQkFBSyxFQUFFLG9CQUFPO1lBQ3BELEtBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO2dCQUNkLEtBQUssT0FBQTtnQkFDTCxPQUFPLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFDLEVBQW1CO3dCQUFqQixrQkFBTSxFQUFFLG9CQUFPO29CQUNuQyxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSSxDQUFDLHVCQUF1QixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUE7aUJBQzVELENBQUM7YUFDTCxDQUFDLENBQUE7U0FDTCxDQUFDLENBQUE7S0FDTDtJQUtELDhCQUFXLEdBQVg7UUFBQSxpQkFJQztRQUhHLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBQyxFQUFtQjtnQkFBakIsa0JBQU0sRUFBRSxvQkFBTztZQUNyRCxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUksQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFBO1NBQ3JELENBQUMsQ0FBQTtLQUNMO0lBRUQsMENBQXVCLEdBQXZCLFVBQXlCLE9BQWlDO1FBQ3RELE9BQU8sSUFBSSxlQUFlLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFBO0tBQzVDO0lBRUQsMENBQXVCLEdBQXZCLFVBQXlCLE9BQWlDO1FBQ3RELE9BQU8sSUFBSSxlQUFlLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFBO0tBQzVDO0lBMUthLHNCQUFhLEdBQUcsQ0FBQyxDQUFBO0lBQ2pCLHdCQUFlLEdBQUcsSUFBSSxHQUFHLEVBQXVCLENBQUE7SUEwS2xFLGVBQUM7Q0E3S0QsSUE2S0M7O0FDdE1EO0lBWUksaUJBQWEsT0FBZSxFQUFFLElBQWE7UUFDdkMsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUE7UUFDdEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUE7UUFDakIsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUE7UUFDZixJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQTtRQUNmLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFBO1FBQ3ZCLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFBO1FBQ2xCLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFBO0tBQ2Y7SUFPUyw4QkFBWSxHQUF0QjtRQUNJLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxRQUFRLEVBQUUsQ0FBQTtLQUNsQztJQUVTLDBCQUFRLEdBQWxCLFVBQW9CLEtBQWE7UUFDN0IsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUE7S0FDckI7SUFFUyw0QkFBVSxHQUFwQjtRQUFzQixpQkFBeUI7YUFBekIsVUFBeUIsRUFBekIscUJBQXlCLEVBQXpCLElBQXlCO1lBQXpCLDRCQUF5Qjs7UUFDM0MsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7S0FDN0I7SUFFUyw2QkFBVyxHQUFyQjtRQUF1QixpQkFBeUI7YUFBekIsVUFBeUIsRUFBekIscUJBQXlCLEVBQXpCLElBQXlCO1lBQXpCLDRCQUF5Qjs7UUFDNUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQTtLQUNoRDtJQUVNLDRCQUFVLEdBQWpCO1FBQW1CLGFBQWtCO2FBQWxCLFVBQWtCLEVBQWxCLHFCQUFrQixFQUFsQixJQUFrQjtZQUFsQix3QkFBa0I7O1FBQ2pDLE9BQU8sQ0FBQyxHQUFHLE9BQVgsT0FBTyxHQUFLLE9BQU8sU0FBSyxHQUFHLEdBQUUsTUFBTSxJQUFDO0tBQ3ZDO0lBRU0sOEJBQVksR0FBbkI7UUFBcUIsYUFBa0I7YUFBbEIsVUFBa0IsRUFBbEIscUJBQWtCLEVBQWxCLElBQWtCO1lBQWxCLHdCQUFrQjs7UUFDbkMsT0FBTyxDQUFDLEdBQUcsT0FBWCxPQUFPLEdBQUssS0FBSyxTQUFLLEdBQUcsR0FBQztLQUM3QjtJQUNMLGNBQUM7Q0FBQSxJQUFBOztBQy9DRDtJQUF3Q0Ysc0NBQU87SUFDM0M7UUFBQSxZQUNJLGtCQUNJLGdCQUFnQixFQUNoQixrQkFBa0IsQ0FDckIsU0FTSjtRQVBHLEtBQUksQ0FBQyxXQUFXLENBQ1osWUFBWSxFQUNaLGtCQUFrQixFQUNsQiw0Q0FBNEMsQ0FDL0MsQ0FBQTtRQUVELEtBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxRQUFRLEVBQUUsQ0FBQTs7S0FDbEM7SUFFSywyQkFBTSxHQUFaLFVBQWMsS0FBcUIsRUFBRSxPQUF3Qjs7Ozs7O3dCQUN6RCxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQTt3QkFFekMsV0FBVyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQTt3QkFFOUIsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFBO3dCQUNuQixXQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLEVBQUE7O3dCQUE1QixTQUE0QixDQUFBO3dCQUM1QixXQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLEVBQUE7O3dCQUE3QixTQUE2QixDQUFBO3dCQUM3QixXQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLEVBQUE7O3dCQUFqQyxTQUFpQyxDQUFBO3dCQUNqQyxNQUFNLENBQUMsT0FBTyxDQUFDLGtCQUFlLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxXQUFXLHNEQUF3QyxDQUFDLENBQUE7Ozs7O0tBQ2xHO0lBQ0wsaUJBQUM7Q0EzQkQsQ0FBd0MsT0FBTyxHQTJCOUM7O0FDdkJEO0lBQXlDQSx1Q0FBTztJQUM1QztRQUFBLFlBQ0ksa0JBQ0kscUJBQXFCLEVBQ3JCLHdCQUF3QixDQUMzQixTQWFKO1FBWEcsS0FBSSxDQUFDLFdBQVcsQ0FDWixhQUFhLEVBQ2IsdUNBQXFDLE1BQU0sQ0FBQyxlQUFpQixDQUNoRSxDQUFBO1FBRUQsS0FBSSxDQUFDLFVBQVUsQ0FDWCxZQUFZLEVBQ1oscUJBQXFCLENBQ3hCLENBQUE7UUFFRCxLQUFJLENBQUMsU0FBUyxHQUFHLElBQUksUUFBUSxFQUFFLENBQUE7O0tBQ2xDO0lBRUssNEJBQU0sR0FBWixVQUFjLFdBQW1CLEVBQUUsT0FBeUI7Ozs7Ozt3QkFDbEQsT0FBTyxHQUFHVixZQUFZLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxXQUFXLENBQUMsQ0FBQTt3QkFDL0MsSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLElBQUksTUFBTSxDQUFDLGVBQWUsQ0FBQTt3QkFFbkQsTUFBTSxDQUFDLFlBQVksQ0FBQyx5QkFBeUIsQ0FBQyxDQUFBO3dCQUM5QyxXQUFNcUIsY0FBWSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsRUFBQTs7d0JBQWpDLFNBQWlDLENBQUE7d0JBQ2pDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQTt3QkFDcEIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUE7Ozs7O0tBQ2xDO0lBQ0wsa0JBQUM7Q0E3QkQsQ0FBeUMsT0FBTyxHQTZCL0M7O0FDakNEO0lBQXdDWCxzQ0FBTztJQUMzQztRQUFBLFlBQ0ksa0JBQ0ksTUFBTSxFQUNOLGlCQUFpQixDQUNwQixTQU9KO1FBTEcsS0FBSSxDQUFDLFdBQVcsQ0FDWixhQUFhLENBQ2hCLENBQUE7UUFFRCxLQUFJLENBQUMsU0FBUyxHQUFHLElBQUksUUFBUSxFQUFFLENBQUE7O0tBQ2xDO0lBRUssMkJBQU0sR0FBWixVQUFjLEtBQXFCLEVBQUUsT0FBd0I7Ozs7Ozt3QkFDekQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUE7d0JBRTFDLFdBQVcsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUE7d0JBRTlCLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQTt3QkFDbkIsV0FBTSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxFQUFBOzt3QkFBNUIsU0FBNEIsQ0FBQTt3QkFDNUIsV0FBTSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxFQUFBOzt3QkFBN0IsU0FBNkIsQ0FBQTt3QkFDN0IsTUFBTSxDQUFDLE9BQU8sQ0FBQyxrQkFBZSxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsV0FBVyxRQUFJLEVBQUUsc0JBQXNCLENBQUMsQ0FBQTs7Ozs7S0FDdEY7SUFDTCxpQkFBQztDQXhCRCxDQUF3QyxPQUFPLEdBd0I5Qzs7QUNsQk8sSUFBQU0saUJBQU0sRUFBRU0scUJBQVEsQ0FBVTtBQU1sQztJQUErQ1osNkNBQU87SUFDbEQ7UUFBQSxZQUNJLGtCQUNJLHFCQUFxQixFQUNyQiwyQkFBMkIsQ0FDOUIsU0FjSjtRQVpHLEtBQUksQ0FBQyxXQUFXLENBQ1osdUJBQXVCLEVBQ3ZCLG9DQUFvQyxFQUNwQyxvREFBb0QsQ0FDdkQsQ0FBQTtRQUVELEtBQUksQ0FBQyxVQUFVLENBQ1gseUJBQXlCLEVBQ3pCLDBCQUEwQixDQUM3QixDQUFBO1FBRUQsS0FBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLFFBQVEsRUFBRSxDQUFBOztLQUNsQztJQUVLLGtDQUFNLEdBQVosVUFBYyxLQUFxQixFQUFFLE9BQStCOzs7Ozs7O3dCQUMxRCxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQTt3QkFDbkIsTUFBTSxHQUFHLElBQUlZLFVBQVEsRUFBRSxDQUFBO3dCQUU3QixXQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFBLElBQUk7Z0NBQzVCLE9BQU8sS0FBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFBOzZCQUMvQyxDQUFDLENBQUMsRUFBQTs7d0JBRkgsU0FFRyxDQUFBO3dCQUVITixRQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxzQkFBc0IsQ0FBQyxDQUFBOzs7OztLQUNqRDtJQUVLLHdDQUFZLEdBQWxCLFVBQW9CLElBQVksRUFBRSxNQUEyQixFQUFFLElBQWE7K0NBQUcsT0FBTzs7Ozs7d0JBQzVFLEtBR2MsTUFBTSxFQUZ0QixVQUFVLGdCQUFBLEVBQ1YsYUFBYSxtQkFBQSxDQUNTO3dCQUNwQixTQUFTLEdBQUcsSUFBSSxNQUFNLENBQUMsTUFBSSxNQUFNLENBQUMsR0FBSyxDQUFDLENBQUE7d0JBQ3hDLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDRCxRQUFRLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQzs0QkFDOUNsQyxTQUFTLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFBO3dCQUM1QyxRQUFRLEdBQUd3QixhQUFhLENBQUMsUUFBUSxDQUFDLENBQUE7d0JBQ2xDLE9BQU8sR0FBRzs0QkFDWixRQUFRLFVBQUE7NEJBQ1IsSUFBSSxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsY0FBYyxFQUFFO3lCQUNwQyxDQUFBO3dCQUNLLGFBQWEsR0FBR3hCLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFBO3dCQUN0RCxZQUFZLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQTt3QkFFaEMsSUFBSSxJQUFJLEVBQUU7NEJBQ0EsYUFBV0EsU0FBUyxDQUFDLFVBQVUsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUE7NEJBQ2xELE1BQU0sR0FBRyxhQUFhLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFDLEdBQVEsSUFBSyxPQUFBLEdBQUcsQ0FBQyxJQUFJLEtBQUssVUFBUSxHQUFBLENBQUMsQ0FBQTs0QkFFbEYsWUFBWSxHQUFHQSxTQUFTLENBQUMsWUFBWSxFQUFFLFVBQVUsQ0FBQyxXQUFXLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFBOzRCQUU5RSxJQUFJLE1BQU0sRUFBRTtnQ0FDUixJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFO29DQUNqQ21DLFFBQU0sQ0FBQyxJQUFJLENBQUMseUJBQXlCLEVBQUUsWUFBWSxDQUFDLENBQUE7b0NBQ3BELFdBQU07aUNBQ1Q7cUNBQU07b0NBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUE7aUNBQzlCOzZCQUNKO2lDQUFNO2dDQUNILGFBQWEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO29DQUMzQixJQUFJLEVBQUUsVUFBUTtvQ0FDZCxLQUFLLEVBQUUsQ0FBQyxRQUFRLENBQUM7aUNBQ3BCLENBQUMsQ0FBQTs2QkFDTDt5QkFDSjs2QkFBTTs0QkFDSCxZQUFZLEdBQUduQyxTQUFTLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFBOzRCQUVoRCxJQUFJLGFBQWEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dDQUN4Q21DLFFBQU0sQ0FBQyxJQUFJLENBQUMseUJBQXlCLEVBQUUsWUFBWSxDQUFDLENBQUE7Z0NBQ3BELFdBQU07NkJBQ1Q7aUNBQU07Z0NBQ0gsYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUE7NkJBQ3JDO3lCQUNKO3dCQUVZLFdBQU1DLFdBQWlCLENBQUMsS0FBR3BDLFNBQVMsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUcsQ0FBQyxFQUFBOzt3QkFBL0UsSUFBSSxHQUFHLFNBQXdFO3dCQUVyRixJQUFJLENBQUMsT0FBTyxDQUFDLFVBQUEsR0FBRzs0QkFDWixNQUFNLENBQUMsSUFBSSxDQUNQLEdBQUcsRUFDSEEsU0FBUyxDQUFDWSxZQUFZLENBQUMsWUFBWSxDQUFDLEVBQUUsUUFBUSxHQUFHYSxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsRUFDbkUsT0FBTyxDQUNWLENBQUE7eUJBQ0osQ0FBQyxDQUFBO3dCQUNGLE1BQU0sQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUE7d0JBRXZELFdBQU0sTUFBTSxDQUFDLElBQUksRUFBRSxFQUFBOzt3QkFBbkIsU0FBbUIsQ0FBQTt3QkFFbkJVLFFBQU0sQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLFlBQVksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUE7Ozs7O0tBQ3JFO0lBQ0wsd0JBQUM7Q0E3RkQsQ0FBK0MsT0FBTyxHQTZGckQ7O0FDbkdPLElBQUFBLGlCQUFNLEVBQUVNLHFCQUFRLENBQVU7QUFNbEM7SUFBb0RaLGtEQUFPO0lBQ3ZEO1FBQUEsWUFDSSxrQkFDSSwwQkFBMEIsRUFDMUIsZ0NBQWdDLENBQ25DLFNBY0o7UUFaRyxLQUFJLENBQUMsV0FBVyxDQUNaLHdCQUF3QixFQUN4QiwyQ0FBMkMsRUFDM0Msb0RBQW9ELENBQ3ZELENBQUE7UUFFRCxLQUFJLENBQUMsVUFBVSxDQUNYLHlCQUF5QixFQUN6QiwrQkFBK0IsQ0FDbEMsQ0FBQTtRQUVELEtBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxRQUFRLEVBQUUsQ0FBQTs7S0FDbEM7SUFFSyx1Q0FBTSxHQUFaLFVBQWMsVUFBMEIsRUFBRSxPQUFvQzs7Ozs7Ozt3QkFFdEUsSUFBSSxHQUNKLE9BQU8sS0FESCxDQUNHO3dCQUNMLE1BQU0sR0FBRyxJQUFJWSxVQUFRLEVBQUUsQ0FBQTt3QkFFN0IsV0FBTSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsVUFBQSxTQUFTO2dDQUN0QyxPQUFPLEtBQUksQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFBOzZCQUN6RCxDQUFDLENBQUMsRUFBQTs7d0JBRkgsU0FFRyxDQUFBO3dCQUVITixRQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxzQkFBc0IsQ0FBQyxDQUFBOzs7OztLQUNqRDtJQUVLLGtEQUFpQixHQUF2QixVQUF5QixTQUFpQixFQUFFLE1BQTJCLEVBQUUsSUFBYTsrQ0FBRyxPQUFPOzs7Ozt3QkFDdEYsS0FHYyxNQUFNLEVBRnRCLFVBQVUsZ0JBQUEsRUFDVixhQUFhLG1CQUFBLENBQ1M7d0JBQ3BCLFNBQVMsR0FBRyxJQUFJLE1BQU0sQ0FBQyxNQUFJLE1BQU0sQ0FBQyxHQUFLLENBQUMsQ0FBQTt3QkFDeEMsYUFBYSxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUNELFFBQVEsQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDOzRCQUN4RGxDLFNBQVMsQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUM7NEJBQ3RELFNBQVMsQ0FBQTt3QkFDUCxhQUFhLEdBQUd3QixhQUFhLENBQUMsYUFBYSxDQUFDLENBQUE7d0JBQzVDLE9BQU8sR0FBRzs0QkFDWixhQUFhLGVBQUE7NEJBQ2IsSUFBSSxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsY0FBYyxFQUFFO3lCQUNwQyxDQUFBO3dCQUNLLFlBQVksR0FBRyxJQUFJOzRCQUNyQnhCLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxXQUFXLEVBQUUsSUFBSSxFQUFFLGFBQWEsQ0FBQzs0QkFDckVBLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQyxDQUFBO3dCQUUzQyxJQUFJQyxhQUFhLENBQUNELFNBQVMsQ0FBQ1ksWUFBWSxDQUFDLFlBQVksQ0FBQyxFQUFFLGFBQWEsR0FBRyxPQUFPLENBQUMsQ0FBQyxFQUFFOzRCQUMvRXVCLFFBQU0sQ0FBQyxJQUFJLENBQUMsOEJBQThCLEVBQUUsWUFBWSxDQUFDLENBQUE7NEJBQ3pELFdBQU07eUJBQ1Q7d0JBRVksV0FBTUMsV0FBaUIsQ0FBQyxLQUFHcEMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBRyxDQUFDLEVBQUE7O3dCQUFwRixJQUFJLEdBQUcsU0FBNkU7d0JBRTFGLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBQSxHQUFHOzRCQUNaLE1BQU0sQ0FBQyxJQUFJLENBQ1AsR0FBRyxFQUNIQSxTQUFTLENBQUNZLFlBQVksQ0FBQyxZQUFZLENBQUMsRUFBRSxhQUFhLEdBQUdhLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUN4RSxPQUFPLENBQ1YsQ0FBQTt5QkFDSixDQUFDLENBQUE7d0JBRUYsV0FBTSxNQUFNLENBQUMsSUFBSSxFQUFFLEVBQUE7O3dCQUFuQixTQUFtQixDQUFBO3dCQUVuQlUsUUFBTSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxZQUFZLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFBOzs7OztLQUMxRTtJQUNMLDZCQUFDO0NBdkVELENBQW9ELE9BQU8sR0F1RTFEOztBQzdFTyxJQUFBQSxpQkFBTSxFQUFFTSxxQkFBUSxDQUFVO0FBT2xDO0lBQW9EWixrREFBTztJQUN2RDtRQUFBLFlBQ0ksa0JBQ0ksd0JBQXdCLEVBQ3hCLGdDQUFnQyxDQUNuQyxTQW1CSjtRQWpCRyxLQUFJLENBQUMsV0FBVyxDQUNaLCtCQUErQixFQUMvQixrREFBa0QsRUFDbEQsbUVBQW1FLENBQ3RFLENBQUE7UUFFRCxLQUFJLENBQUMsVUFBVSxDQUNYLG1CQUFtQixFQUNuQixpQ0FBaUMsQ0FDcEMsQ0FBQTtRQUVELEtBQUksQ0FBQyxVQUFVLENBQ1gsY0FBYyxFQUNkLCtCQUErQixDQUNsQyxDQUFBO1FBRUQsS0FBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLFFBQVEsRUFBRSxDQUFBOztLQUNsQztJQUVLLHVDQUFNLEdBQVosVUFBYyxVQUEwQixFQUFFLE9BQW9DOzs7Ozs7O3dCQUV0RSxJQUFJLEdBRUosT0FBTyxLQUZILEVBQ0osTUFBTSxHQUNOLE9BQU8sT0FERCxDQUNDO3dCQUNMLE1BQU0sR0FBRyxJQUFJWSxVQUFRLEVBQUUsQ0FBQTt3QkFFN0IsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksRUFBRTs0QkFDbEJOLFFBQU0sQ0FBQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsQ0FBQTs0QkFDMUMsV0FBTTt5QkFDVDt3QkFFRCxXQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxVQUFBLFNBQVM7Z0NBQ3RDLE9BQU8sS0FBSSxDQUFDLGVBQWUsQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLE1BQU0sR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUE7NkJBQ3JFLENBQUMsQ0FBQyxFQUFBOzt3QkFGSCxTQUVHLENBQUE7d0JBRUhBLFFBQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLHNCQUFzQixDQUFDLENBQUE7Ozs7O0tBQ2pEO0lBRUssZ0RBQWUsR0FBckIsVUFBdUIsU0FBaUIsRUFBRSxNQUEyQixFQUFFLElBQWE7K0NBQUcsT0FBTzs7Ozs7d0JBQ3BGLEtBR2MsTUFBTSxFQUZ0QixVQUFVLGdCQUFBLEVBQ1YsYUFBYSxtQkFBQSxDQUNTO3dCQUNwQixTQUFTLEdBQUcsSUFBSSxNQUFNLENBQUMsTUFBSSxNQUFNLENBQUMsR0FBSyxDQUFDLENBQUE7d0JBQ3hDLGFBQWEsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDRCxRQUFRLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQzs0QkFDeERsQyxTQUFTLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDOzRCQUN0RCxTQUFTLENBQUE7d0JBQ1AsYUFBYSxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUNrQyxRQUFRLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQTt3QkFDbkQsYUFBYSxHQUFHbEMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUE7d0JBQ3BELGdCQUFnQixHQUFHQSxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxhQUFhLENBQUMsQ0FBQTt3QkFFaEUsSUFBSSxDQUFDQyxhQUFhLENBQUNELFNBQVMsQ0FBQ1ksWUFBWSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsYUFBYSxHQUFHLE9BQU8sQ0FBQyxDQUFDLEVBQUU7NEJBQ3BGdUIsUUFBTSxDQUFDLElBQUksQ0FBQywyQkFBMkIsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFBOzRCQUMxRCxXQUFNO3lCQUNUOzZCQUVHLElBQUksRUFBSixjQUFJO3dCQUNFLFdBQVcsR0FBR25DLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFBO3dCQUM1QyxZQUFZLEdBQUdBLFNBQVMsQ0FBQ1ksWUFBWSxDQUFDLFdBQVcsQ0FBQyxFQUFFWSxhQUFhLENBQUMsV0FBVyxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUE7d0JBQy9GLElBQUksQ0FBQ3ZCLGFBQWEsQ0FBQyxZQUFZLENBQUMsRUFBRTs0QkFDOUJrQyxRQUFNLENBQUMsSUFBSSxDQUFDLHNCQUFzQixFQUFFLFdBQVcsQ0FBQyxDQUFBOzRCQUNoRCxXQUFNO3lCQUNUO3dCQUVLLFFBQVEsR0FBUSxJQUFJLENBQUMsS0FBSyxDQUFDVCxlQUFlLENBQUMsWUFBWSxFQUFFOzRCQUMzRCxRQUFRLEVBQUUsTUFBTTt5QkFDbkIsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFBO3dCQUVYLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsQ0FBQTt3QkFFcEMsSUFBSSxRQUFRLENBQUMsZUFBZSxDQUFDLGFBQWEsQ0FBQyxFQUFFOzRCQUN6Q1MsUUFBTSxDQUFDLElBQUksQ0FBQywrQkFBK0IsRUFBRSxXQUFXLENBQUMsQ0FBQTs0QkFDekQsV0FBTTt5QkFDVDt3QkFFRCxRQUFRLENBQUMsZUFBZSxDQUFDLGFBQWEsQ0FBQyxHQUFHdEIsYUFBYSxDQUFDRCxZQUFZLENBQUMsV0FBVyxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQTt3QkFDcEcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUE7d0JBQ3hDLFdBQU0sTUFBTSxDQUFDLElBQUksRUFBRSxFQUFBOzt3QkFBbkIsU0FBbUIsQ0FBQTt3QkFFbkJ1QixRQUFNLENBQUMsT0FBTyxDQUFDLFlBQVUsYUFBYSxRQUFLLEVBQUUsV0FBVyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQTs7O3dCQUVoRixJQUFJLENBQUMscUJBQXFCLENBQUMsYUFBYSxDQUFDLENBQUE7d0JBRXpDLElBQUksYUFBYSxDQUFDLGVBQWUsQ0FBQyxhQUFhLENBQUMsRUFBRTs0QkFDOUNBLFFBQU0sQ0FBQyxJQUFJLENBQUMsK0JBQStCLEVBQUUsVUFBVSxDQUFDLENBQUE7NEJBQ3hELFdBQU07eUJBQ1Q7d0JBRUQsYUFBYSxDQUFDLGVBQWUsQ0FBQyxhQUFhLENBQUMsR0FBR3RCLGFBQWEsQ0FBQ0QsWUFBWSxDQUFDLGFBQWEsQ0FBQyxFQUFFLGdCQUFnQixDQUFDLENBQUE7d0JBQzNHLE1BQU0sQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQyxDQUFBO3dCQUM5QyxXQUFNLE1BQU0sQ0FBQyxJQUFJLEVBQUUsRUFBQTs7d0JBQW5CLFNBQW1CLENBQUE7d0JBRW5CdUIsUUFBTSxDQUFDLE9BQU8sQ0FBQyxZQUFVLGFBQWEsUUFBSyxFQUFFLFVBQVUsQ0FBQyxDQUFBOzs7Ozs7S0FHL0Q7SUFFRCxzREFBcUIsR0FBckIsVUFBdUJPLFNBQVc7UUFDOUIsSUFBSSxDQUFDQSxTQUFNLENBQUMsZUFBZSxFQUFFO1lBQ3pCQSxTQUFNLENBQUMsZUFBZSxHQUFHLEVBQUUsQ0FBQTtTQUM5QjtLQUNKO0lBQ0wsNkJBQUM7Q0E3R0QsQ0FBb0QsT0FBTyxHQTZHMUQ7O0FDeEhELGVBQWU7SUFDWCxJQUFJQyxZQUFJLEVBQUU7SUFDVixJQUFJQyxVQUFHLEVBQUU7SUFDVCxJQUFJQyxXQUFJLEVBQUU7SUFDVixJQUFJQyxpQkFBVSxFQUFFO0lBQ2hCLElBQUlDLHNCQUFlLEVBQUU7SUFDckIsSUFBSUMsc0JBQWUsRUFBRTtDQUN4QixDQUFBOztBQ2RELHNCQXdGQTtBQWpGQSxJQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUE7QUFDdEMsSUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUE7QUFFMUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUMsT0FBTyxFQUFFLENBQUE7QUFFdkMsSUFBSSxDQUFDQyxnQkFBZ0IsQ0FBQ0MsWUFBWSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO0lBQ3hFLE1BQU0sQ0FBQyxLQUFLLENBQUMsd0JBQXdCLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUM3RCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO0NBQ2xCO0FBRUQsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRTtJQUN0QyxNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUE7Q0FDakM7QUFFRCxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFO0lBQ3ZDLE1BQU0sQ0FBQyxVQUFVLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQTtDQUNqQztBQUVELFNBQVM7S0FDSixNQUFNLENBQUMsU0FBUyxFQUFFLG1CQUFtQixDQUFDO0tBQ3RDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsa0JBQWtCLENBQUM7S0FDckMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUM7S0FDeEIsS0FBSyxDQUFDLHFCQUFxQixDQUFDLENBQUE7QUFFakMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFBLE9BQU87SUFDcEIsSUFBTSxHQUFHLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUE7SUFFOUMsSUFBSSxPQUFPLENBQUMsV0FBVyxFQUFFO1FBQ3JCLEdBQUcsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFBO0tBQ3ZDO0lBRUQsSUFBSSxPQUFPLENBQUMsS0FBSyxFQUFFO1FBQ2YsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUE7S0FDM0I7SUFFRCxJQUFJLE9BQU8sQ0FBQyxFQUFFLEVBQUU7UUFDWixLQUFLLElBQUksR0FBRyxJQUFJLE9BQU8sQ0FBQyxFQUFFLEVBQUU7WUFDeEIsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO1NBQy9CO0tBQ0o7SUFFRCxJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUU7UUFDakIsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBQyxNQUE0QjtZQUNqRCxHQUFHLENBQUMsTUFBTSxPQUFWLEdBQUcsRUFBVyxNQUFNLEVBQUM7U0FDeEIsQ0FBQyxDQUFBO0tBQ0w7SUFFRCxJQUFJLE9BQU8sQ0FBQyxNQUFNLEVBQUU7UUFDaEIsR0FBRyxDQUFDLE1BQU0sQ0FBQztZQUFPLGNBQU87aUJBQVAsVUFBTyxFQUFQLHFCQUFPLEVBQVAsSUFBTztnQkFBUCx5QkFBTzs7Ozs7Ozs7NEJBRWpCLFdBQU0sT0FBTyxDQUFDLE1BQU0sT0FBZCxPQUFPLEVBQVcsSUFBSSxHQUFDOzs0QkFBN0IsU0FBNkIsQ0FBQTs7Ozs0QkFFN0IsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFHLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQyxDQUFBOzRCQUMvQixPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUcsQ0FBQyxDQUFBOzs7Ozs7U0FFdkIsQ0FBQyxDQUFBO0tBQ0w7SUFFRCxJQUFJLE9BQU8sQ0FBQyxRQUFRLEVBQUU7UUFDbEIsR0FBRyxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUU7WUFDYixPQUFPLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFBO1lBQy9CLE9BQU8sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFVBQUEsT0FBTztnQkFDNUIsT0FBTyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQTthQUNoQyxDQUFDLENBQUE7U0FDTCxDQUFDLENBQUE7S0FDTDtDQUNKLENBQUMsQ0FBQTtBQUVGLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO0lBQzNCLElBQU0sSUFBSSxHQUFHQyxhQUFhLENBQUMsTUFBTSxFQUFFO1FBQy9CLElBQUksRUFBRSxRQUFRO1FBQ2QsTUFBTSxFQUFFLENBQUMsYUFBYSxDQUFDO0tBQzFCLENBQUMsQ0FBQTtJQUVGLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQUksT0FBTyxDQUFDLE9BQU8sU0FBTSxDQUFDLENBQUMsQ0FBQTtJQUNyRSxTQUFTLENBQUMsVUFBVSxFQUFFLENBQUE7Q0FDekI7QUFFRCxTQUFTLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQTs7OzsifQ==
