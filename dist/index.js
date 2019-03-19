#!/usr/bin/env node
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var sass = require('node-sass');
var chalk = _interopDefault(require('chalk'));
var postcssrc = _interopDefault(require('postcss-load-config'));
var postcss = require('postcss');
var ts = require('typescript');
var babel = require('@babel/core');
var traverse = _interopDefault(require('@babel/traverse'));
var codeGenerator = _interopDefault(require('@babel/generator'));
var semver = require('semver');
var chokidar = require('chokidar');
var downloadRepo = _interopDefault(require('download-git-repo'));
var cfonts = require('cfonts');
var fs = require('fs-extra');
var tslib_1 = require('tslib');
var fs$1 = require('fs');
var path = require('path');

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
            compilation.destroy();
        }
        else {
            file.content = result.css;
            file.updateExt('.wxss');
        }
        callback();
    });
});

var messager = {
    errors: [],
    messages: [],
    push: function (msg) {
        if (msg instanceof Error) {
            this.errors.push(msg);
        }
        else {
            this.messages.push(msg);
        }
    },
    clear: function () {
        this.errors = [];
        this.messages = [];
    },
    hasError: function () {
        return !!this.errors.length;
    },
    printError: function () {
        logger.stopLoading();
        console.clear();
        logger.error('Error', this.errors.length + " errors occurred");
        console.log(this.errors.pop().message);
        this.errors.forEach(function (err) {
            console.error(err.message, '\r\n\r\n');
            ankaConfig.debug && console.log(err.stack);
        });
        this.errors = [];
    },
    printInfo: function () {
        logger.stopLoading();
        this.messages.forEach(function (info) {
            console.info(info);
        });
        this.messages = [];
    }
};

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
        return console.log([this.time].concat(msg).join(' '));
    };
    Logger.prototype.error = function (title, msg, err) {
        if (title === void 0) { title = ''; }
        if (msg === void 0) { msg = ''; }
        if (err === void (0)) {
            err = new Error('');
        }
        err.message = chalk.hex('#333333').bgRedBright(" " + title.trim() + " ") + ' ' + chalk.grey(msg) + '\r\n' + err.message;
        messager.push(err);
    };
    Logger.prototype.info = function (title, msg) {
        if (title === void 0) { title = ''; }
        if (msg === void 0) { msg = ''; }
        messager.push(this.time + ' ' + chalk.reset(title) + ' ' + chalk.grey(msg));
    };
    Logger.prototype.warn = function (title, msg) {
        if (title === void 0) { title = ''; }
        if (msg === void 0) { msg = ''; }
        this.stopLoading();
        console.clear();
        this.log(chalk.hex('#333333').bgYellowBright(" " + title.trim() + " "), chalk.grey(msg));
    };
    Logger.prototype.success = function (title, msg) {
        if (title === void 0) { title = ''; }
        if (msg === void 0) { msg = ''; }
        this.stopLoading();
        console.clear();
        this.log(chalk.hex('#333333').bgGreenBright(" " + title.trim() + " "), chalk.grey(msg));
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
        exec(postcssConfig, file, compilation, cb);
    }
    else {
        tasks.push(function () {
            exec(postcssConfig, file, compilation, cb);
        });
    }
});
genPostcssConfig().then(function (config) {
    tasks.forEach(function (task) { return task(); });
}).catch(function (err) {
    logger.error('loadConfig', err.message, err);
});
function exec(config, file, compilation, cb) {
    file.convertContentToString();
    postcss$1(config.plugins.concat(internalPlugins)).process(file.content, tslib_1.__assign({}, config.options, { from: file.sourceFile })).then(function (root) {
        file.content = root.css;
        file.ast = root.root.toResult();
        file.updateExt('.wxss');
        cb();
    }).catch(function (err) {
        logger.error('Compile', err.message, err);
        compilation.destroy();
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
        file.convertContentToString();
        try {
            var result = babel.transformSync(file.content, tslib_1.__assign({ babelrc: false, ast: true, filename: file.sourceFile, sourceType: 'module', sourceMaps: config.ankaConfig.devMode, comments: config.ankaConfig.devMode, minified: !config.ankaConfig.devMode }, babelConfig));
            file.sourceMap = JSON.stringify(result.map);
            file.content = result.code;
            file.ast = result.ast;
        }
        catch (err) {
            compilation.destroy();
            utils.logger.error('Compile', file.sourceFile, err);
        }
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
        fs.ensureFile(file.targetFile).then(function () {
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
            compilation.destroy();
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
                compilation.destroy();
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
        logger.error('Compile', err.message, err);
        compilation.destroy();
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
                utils.logger.error(file.sourceFile, err.message, err);
                compilation.destroy();
                cb();
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
    var content = fs.readFileSync(sourceFile);
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
        logger.error('Compile', id, new Error("Missing dependency " + id + " in " + options.paths));
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
                        this.destroy();
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
                        config.ankaConfig.debug && logger.info('Compile', this.file.sourceFile.replace("" + config.cwd + path.sep, ''));
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
            var startupTime, filePaths, files, compilations;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger$1.startLoading('Launching...');
                        startupTime = Date.now();
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
                        fs.ensureDirSync(config.distNodeModules);
                        return [4, Promise.all(compilations.map(function (compilations) { return compilations.run(); }))];
                    case 3:
                        _a.sent();
                        if (messager.hasError()) {
                            messager.printError();
                        }
                        else {
                            logger$1.success('Compiled', files.length + " files in " + (Date.now() - startupTime) + "ms");
                            config.ankaConfig.debug && messager.printInfo();
                        }
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
                var startupTime, file;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            logger$1.startLoading("Compiling " + fileName);
                            startupTime = Date.now();
                            return [4, createFile(fileName)];
                        case 1:
                            file = _a.sent();
                            return [4, this.generateCompilation(file).run()];
                        case 2:
                            _a.sent();
                            if (messager.hasError()) {
                                messager.printError();
                            }
                            else {
                                logger$1.success('Compiled ', fileName + " in " + (Date.now() - startupTime) + "ms");
                                messager.printInfo();
                            }
                            return [2];
                    }
                });
            }); });
            watcher.on('unlink', function (fileName) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                var err_1;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4, fs.unlink(fileName.replace(config.srcDir, config.distDir))];
                        case 1:
                            _a.sent();
                            logger$1.success('Remove', fileName);
                            return [3, 3];
                        case 2:
                            err_1 = _a.sent();
                            logger$1.error('Remove', fileName, err_1);
                            return [3, 3];
                        case 3: return [2];
                    }
                });
            }); });
            watcher.on('change', function (fileName) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                var startupTime, file;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            logger$1.startLoading("Compiling " + fileName);
                            startupTime = Date.now();
                            return [4, createFile(fileName)];
                        case 1:
                            file = _a.sent();
                            return [4, this.generateCompilation(file).run()];
                        case 2:
                            _a.sent();
                            if (messager.hasError()) {
                                messager.printError();
                            }
                            else {
                                logger$1.success('Compiled', fileName + " in " + (Date.now() - startupTime) + "ms");
                                messager.printInfo();
                            }
                            return [2];
                    }
                });
            }); });
            watcher.on('ready', function () {
                resolve();
                logger$1.log('Anka is waiting for changes...');
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
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.$compiler.config.ankaConfig.devMode = true;
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
                        if (fs$1.existsSync(path.join(path.dirname(absolutePath), componentName + '.json'))) {
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
                        if (!fs$1.existsSync(path.join(path.dirname(componentAbsPath), componentName + '.json'))) {
                            logger$4.warn('Component dose not exists', componentAbsPath);
                            return [2];
                        }
                        if (!page) return [3, 2];
                        pageAbsPath = path.join(config.srcDir, page);
                        pageJsonPath = path.join(path.dirname(pageAbsPath), path.basename(pageAbsPath) + '.json');
                        if (!fs$1.existsSync(pageJsonPath)) {
                            logger$4.warn('Page dose not exists', pageAbsPath);
                            return [2];
                        }
                        pageJson = JSON.parse(fs$1.readFileSync(pageJsonPath, {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlscy9yZXNvbHZlQ29uZmlnLnRzIiwiLi4vc3JjL3BhcnNlcnMvc2Fzc1BhcnNlci50cyIsIi4uL3NyYy91dGlscy9tZXNzYWdlci50cyIsIi4uL3NyYy91dGlscy9sb2dnZXIudHMiLCIuLi9zcmMvcGFyc2Vycy9zdHlsZVBhcnNlci9pbmRleC50cyIsIi4uL3NyYy9wYXJzZXJzL2JhYmVsUGFyc2VyLnRzIiwiLi4vc3JjL3BsdWdpbnMvc2F2ZUZpbGVQbHVnaW4vaW5kZXgudHMiLCIuLi9zcmMvcGx1Z2lucy93eEltcG9ydFBsdWdpbi9wb3N0Y3NzV3hpbXBvcnQudHMiLCIuLi9zcmMvcGx1Z2lucy93eEltcG9ydFBsdWdpbi9pbmRleC50cyIsIi4uL3NyYy9wYXJzZXJzL3R5cGVzY3JpcHRQYXJzZXIudHMiLCIuLi9zcmMvcGx1Z2lucy9leHRyYWN0RGVwZW5kZW5jeVBsdWdpbi9pbmRleC50cyIsIi4uL3NyYy9jb25maWcvYW5rYURlZmF1bHRDb25maWcudHMiLCIuLi9zcmMvY29uZmlnL2Fua2FDb25maWcudHMiLCIuLi9zcmMvY29uZmlnL3N5c3RlbUNvbmZpZy50cyIsIi4uL3NyYy9jb25maWcvcHJvamVjdENvbmZpZy50cyIsIi4uL3NyYy9jb25maWcvaW5kZXgudHMiLCIuLi9zcmMvdXRpbHMvZnMudHMiLCIuLi9zcmMvY29yZS9jbGFzcy9GaWxlLnRzIiwiLi4vc3JjL3V0aWxzL2NyZWF0ZUZpbGUudHMiLCIuLi9zcmMvdXRpbHMvZWRpdG9yLnRzIiwiLi4vc3JjL3V0aWxzL3Jlc29sdmVNb2R1bGUudHMiLCIuLi9zcmMvdXRpbHMvY2FsbFByb21pc2VJbkNoYWluLnRzIiwiLi4vc3JjL3V0aWxzL2FzeW5jRnVuY3Rpb25XcmFwcGVyLnRzIiwiLi4vc3JjL3V0aWxzL2dlbkZpbGVXYXRjaGVyLnRzIiwiLi4vc3JjL3V0aWxzL2lzTnBtRGVwZW5kZW5jeS50cyIsIi4uL3NyYy91dGlscy9kb3dubG9hZFJlcGUudHMiLCIuLi9zcmMvY29yZS9jbGFzcy9JbmplY3Rpb24udHMiLCIuLi9zcmMvY29yZS9jbGFzcy9Db21waWxhdGlvbi50cyIsIi4uL3NyYy9jb3JlL2NsYXNzL0NvbXBpbGVyLnRzIiwiLi4vc3JjL2NvcmUvY2xhc3MvQ29tbWFuZC50cyIsIi4uL3NyYy9jb21tYW5kcy9kZXYudHMiLCIuLi9zcmMvY29tbWFuZHMvaW5pdC50cyIsIi4uL3NyYy9jb21tYW5kcy9wcm9kLnRzIiwiLi4vc3JjL2NvbW1hbmRzL2NyZWF0ZVBhZ2UudHMiLCIuLi9zcmMvY29tbWFuZHMvY3JlYXRlQ29tcG9uZW50LnRzIiwiLi4vc3JjL2NvbW1hbmRzL2Vucm9sbENvbXBvbmVudC50cyIsIi4uL3NyYy9jb21tYW5kcy50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcydcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcblxuY29uc3QgY3dkID0gcHJvY2Vzcy5jd2QoKVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAobmFtZXM6IEFycmF5PHN0cmluZz4gPSBbXSwgcm9vdD86IHN0cmluZyk6IE9iamVjdCB7XG4gICAgY29uc3QgZGVmYXVsdFZhbHVlID0ge31cbiAgICBjb25zdCBjb25maWdQYXRocyA9IG5hbWVzLm1hcChuYW1lID0+IHBhdGguam9pbihyb290IHx8IGN3ZCwgbmFtZSkpXG5cbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgY29uZmlnUGF0aHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZ1BhdGggPSBjb25maWdQYXRoc1tpbmRleF1cblxuICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhjb25maWdQYXRoKSkge1xuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihkZWZhdWx0VmFsdWUsIHJlcXVpcmUoY29uZmlnUGF0aCkpXG4gICAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlZmF1bHRWYWx1ZVxufVxuIiwiaW1wb3J0ICogYXMgc2FzcyBmcm9tICdub2RlLXNhc3MnXG5cbmltcG9ydCB7XG4gICAgRmlsZSxcbiAgICBQYXJzZXIsXG4gICAgQ29tcGlsYXRpb24sXG4gICAgUGFyc2VySW5qZWN0aW9uXG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG4vKipcbiAqIFNhc3MgZmlsZSBwYXJzZXIuXG4gKiBAZm9yIGFueSBmaWxlIHRoYXQgZG9lcyBub3QgbWF0Y2hlIHBhcnNlcnMuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IDxQYXJzZXI+ZnVuY3Rpb24gKHRoaXM6IFBhcnNlckluamVjdGlvbiwgZmlsZTogRmlsZSwgY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYWxsYmFjaz86IEZ1bmN0aW9uKSB7XG4gICAgY29uc3QgdXRpbHMgPSB0aGlzLmdldFV0aWxzKClcbiAgICBjb25zdCBjb25maWcgPSB0aGlzLmdldFN5c3RlbUNvbmZpZygpXG5cbiAgICBmaWxlLmNvbnRlbnQgPSBmaWxlLmNvbnRlbnQgaW5zdGFuY2VvZiBCdWZmZXIgPyBmaWxlLmNvbnRlbnQudG9TdHJpbmcoKSA6IGZpbGUuY29udGVudFxuXG4gICAgc2Fzcy5yZW5kZXIoe1xuICAgICAgICBmaWxlOiBmaWxlLnNvdXJjZUZpbGUsXG4gICAgICAgIGRhdGE6IGZpbGUuY29udGVudFxuICAgIH0sIChlcnI6IEVycm9yLCByZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICB1dGlscy5sb2dnZXIuZXJyb3IoJ0NvbXBpbGUnLCBlcnIubWVzc2FnZSwgZXJyKVxuICAgICAgICAgICAgY29tcGlsYXRpb24uZGVzdHJveSgpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmaWxlLmNvbnRlbnQgPSByZXN1bHQuY3NzXG4gICAgICAgICAgICBmaWxlLnVwZGF0ZUV4dCgnLnd4c3MnKVxuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrKClcbiAgICB9KVxufVxuIiwiaW1wb3J0IGxvZ2dlciBmcm9tICcuL2xvZ2dlcidcbmltcG9ydCBhbmthQ29uZmlnIGZyb20gJy4uL2NvbmZpZy9hbmthQ29uZmlnJ1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgZXJyb3JzOiBbXSxcbiAgICBtZXNzYWdlczogW10sXG4gICAgcHVzaCAobXNnOiBPYmplY3QpOiB2b2lkIHtcbiAgICAgICAgaWYgKG1zZyBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLmVycm9ycy5wdXNoKG1zZylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZXMucHVzaChtc2cpXG4gICAgICAgIH1cbiAgICB9LFxuICAgIGNsZWFyICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5lcnJvcnMgPSBbXVxuICAgICAgICB0aGlzLm1lc3NhZ2VzID0gW11cbiAgICB9LFxuICAgIGhhc0Vycm9yICgpOiBCb29sZWFuIHtcbiAgICAgICAgcmV0dXJuICEhdGhpcy5lcnJvcnMubGVuZ3RoXG4gICAgfSxcbiAgICBwcmludEVycm9yICgpOiB2b2lkIHtcbiAgICAgICAgbG9nZ2VyLnN0b3BMb2FkaW5nKClcbiAgICAgICAgY29uc29sZS5jbGVhcigpXG4gICAgICAgIGxvZ2dlci5lcnJvcignRXJyb3InLCBgJHt0aGlzLmVycm9ycy5sZW5ndGh9IGVycm9ycyBvY2N1cnJlZGApXG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMuZXJyb3JzLnBvcCgpLm1lc3NhZ2UpXG4gICAgICAgIHRoaXMuZXJyb3JzLmZvckVhY2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyLm1lc3NhZ2UsICdcXHJcXG5cXHJcXG4nKVxuICAgICAgICAgICAgYW5rYUNvbmZpZy5kZWJ1ZyAmJiBjb25zb2xlLmxvZyhlcnIuc3RhY2spXG4gICAgICAgIH0pXG4gICAgICAgIHRoaXMuZXJyb3JzID0gW11cbiAgICB9LFxuICAgIHByaW50SW5mbyAoKTogdm9pZCB7XG4gICAgICAgIGxvZ2dlci5zdG9wTG9hZGluZygpXG4gICAgICAgIHRoaXMubWVzc2FnZXMuZm9yRWFjaCgoaW5mbzogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8oaW5mbylcbiAgICAgICAgfSlcblxuICAgICAgICB0aGlzLm1lc3NhZ2VzID0gW11cbiAgICB9XG59XG4iLCJpbXBvcnQgY2hhbGsgZnJvbSAnY2hhbGsnXG5pbXBvcnQgbWVzc2FnZXIgZnJvbSAnLi9tZXNzYWdlcidcblxuY29uc3Qgb3JhID0gcmVxdWlyZSgnb3JhJylcblxuZXhwb3J0IGZ1bmN0aW9uIHRvRml4IChudW1iZXI6IG51bWJlcik6IHN0cmluZyB7XG4gICAgcmV0dXJuICgnMDAnICsgbnVtYmVyKS5zbGljZSgtMilcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRUaW1lICgpOiBzdHJpbmcge1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKClcbiAgICByZXR1cm4gYCR7dG9GaXgobm93LmdldEhvdXJzKCkpfToke3RvRml4KG5vdy5nZXRNaW51dGVzKCkpfToke3RvRml4KG5vdy5nZXRTZWNvbmRzKCkpfWBcbn1cblxuZXhwb3J0IGNsYXNzIExvZ2dlciB7XG4gICAgb3JhSW5zdGFuY2U6IGFueVxuXG4gICAgZ2V0IHRpbWUgKCkge1xuICAgICAgICByZXR1cm4gY2hhbGsuZ3JleShgWyR7Z2V0Q3VycmVudFRpbWUoKX1dYClcbiAgICB9XG5cbiAgICBzdGFydExvYWRpbmcgKG1zZzogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMub3JhSW5zdGFuY2UgPSBvcmEobXNnKS5zdGFydCgpXG4gICAgfVxuXG4gICAgc3RvcExvYWRpbmcgKCkge1xuICAgICAgICB0aGlzLm9yYUluc3RhbmNlICYmIHRoaXMub3JhSW5zdGFuY2Uuc3RvcCgpXG4gICAgfVxuXG4gICAgbG9nICguLi5tc2c6IEFycmF5PHN0cmluZz4pIHtcbiAgICAgICAgcmV0dXJuIGNvbnNvbGUubG9nKFt0aGlzLnRpbWUsIC4uLm1zZ10uam9pbignICcpKVxuICAgIH1cblxuICAgIGVycm9yICh0aXRsZTogc3RyaW5nID0gJycsIG1zZzogc3RyaW5nID0gJycsIGVycj86IEVycm9yKSB7XG4gICAgICAgIGlmIChlcnIgPT09IHZvaWQgKDApKSB7XG4gICAgICAgICAgICBlcnIgPSBuZXcgRXJyb3IoJycpXG4gICAgICAgIH1cbiAgICAgICAgZXJyLm1lc3NhZ2UgPSBjaGFsay5oZXgoJyMzMzMzMzMnKS5iZ1JlZEJyaWdodChgICR7dGl0bGUudHJpbSgpfSBgKSArICcgJyArIGNoYWxrLmdyZXkobXNnKSArICdcXHJcXG4nICsgZXJyLm1lc3NhZ2VcbiAgICAgICAgbWVzc2FnZXIucHVzaChlcnIpXG4gICAgfVxuXG4gICAgaW5mbyAodGl0bGU6IHN0cmluZyA9ICcnLCBtc2c6IHN0cmluZyA9ICcnKSB7XG4gICAgICAgIG1lc3NhZ2VyLnB1c2godGhpcy50aW1lICsgJyAnICsgY2hhbGsucmVzZXQodGl0bGUpICsgJyAnICsgY2hhbGsuZ3JleShtc2cpKVxuICAgIH1cblxuICAgIHdhcm4gKHRpdGxlOiBzdHJpbmcgPSAnJywgbXNnOiBzdHJpbmcgPSAnJykge1xuICAgICAgICB0aGlzLnN0b3BMb2FkaW5nKClcbiAgICAgICAgY29uc29sZS5jbGVhcigpXG4gICAgICAgIHRoaXMubG9nKGNoYWxrLmhleCgnIzMzMzMzMycpLmJnWWVsbG93QnJpZ2h0KGAgJHt0aXRsZS50cmltKCl9IGApLCBjaGFsay5ncmV5KG1zZykpXG4gICAgfVxuXG4gICAgc3VjY2VzcyAodGl0bGU6IHN0cmluZyA9ICcnLCBtc2c6IHN0cmluZyA9ICcnKSB7XG4gICAgICAgIHRoaXMuc3RvcExvYWRpbmcoKVxuICAgICAgICBjb25zb2xlLmNsZWFyKClcbiAgICAgICAgdGhpcy5sb2coY2hhbGsuaGV4KCcjMzMzMzMzJykuYmdHcmVlbkJyaWdodChgICR7dGl0bGUudHJpbSgpfSBgKSwgY2hhbGsuZ3JleShtc2cpKVxuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgbmV3IExvZ2dlcigpXG4iLCJpbXBvcnQge1xuICAgIEZpbGUsXG4gICAgUGFyc2VyLFxuICAgIENvbXBpbGF0aW9uLFxuICAgIFBhcnNlckluamVjdGlvblxufSBmcm9tICcuLi8uLi8uLi90eXBlcy90eXBlcydcbmltcG9ydCAqIGFzIFBvc3Rjc3MgZnJvbSAncG9zdGNzcydcbmltcG9ydCBsb2dnZXIgZnJvbSAnLi4vLi4vdXRpbHMvbG9nZ2VyJ1xuaW1wb3J0IHBvc3Rjc3NyYyBmcm9tICdwb3N0Y3NzLWxvYWQtY29uZmlnJ1xuXG5jb25zdCBwb3N0Y3NzID0gcmVxdWlyZSgncG9zdGNzcycpXG5jb25zdCBwb3N0Y3NzQ29uZmlnOiBhbnkgPSB7fVxuY29uc3QgaW50ZXJuYWxQbHVnaW5zOiBBcnJheTxQb3N0Y3NzLkFjY2VwdGVkUGx1Z2luPiA9IFtdXG5jb25zdCB0YXNrczogYW55W10gPSBbXVxuXG4vLyBUT0RPOiBBZGQgbmV3IGhvb2s6IHByZXNldFxuXG4vKipcbiAqIFN0eWxlIGZpbGUgcGFyc2VyLlxuICogQGZvciAud3hzcyAuY3NzID0+IC53eHNzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IDxQYXJzZXI+ZnVuY3Rpb24gKHRoaXM6IFBhcnNlckluamVjdGlvbiwgZmlsZTogRmlsZSwgY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgICBpZiAocG9zdGNzc0NvbmZpZy5wbHVnaW5zKSB7XG4gICAgICAgIGV4ZWMocG9zdGNzc0NvbmZpZywgZmlsZSwgY29tcGlsYXRpb24sIGNiKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHRhc2tzLnB1c2goKCkgPT4ge1xuICAgICAgICAgICAgZXhlYyhwb3N0Y3NzQ29uZmlnLCBmaWxlLCBjb21waWxhdGlvbiwgY2IpXG4gICAgICAgIH0pXG4gICAgfVxufVxuXG5nZW5Qb3N0Y3NzQ29uZmlnKCkudGhlbigoY29uZmlnOiBhbnkpID0+IHtcbiAgICB0YXNrcy5mb3JFYWNoKCh0YXNrOiBGdW5jdGlvbikgPT4gdGFzaygpKVxufSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICBsb2dnZXIuZXJyb3IoJ2xvYWRDb25maWcnLCBlcnIubWVzc2FnZSwgZXJyKVxufSlcblxuXG5mdW5jdGlvbiBleGVjIChjb25maWc6IGFueSwgZmlsZTogRmlsZSwgY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYjogRnVuY3Rpb24pIHtcbiAgICBmaWxlLmNvbnZlcnRDb250ZW50VG9TdHJpbmcoKVxuICAgIHBvc3Rjc3MoY29uZmlnLnBsdWdpbnMuY29uY2F0KGludGVybmFsUGx1Z2lucykpLnByb2Nlc3MoZmlsZS5jb250ZW50LCB7XG4gICAgICAgIC4uLmNvbmZpZy5vcHRpb25zLFxuICAgICAgICBmcm9tOiBmaWxlLnNvdXJjZUZpbGVcbiAgICB9IGFzIFBvc3Rjc3MuUHJvY2Vzc09wdGlvbnMpLnRoZW4oKHJvb3Q6IFBvc3Rjc3MuUmVzdWx0KSA9PiB7XG4gICAgICAgIGZpbGUuY29udGVudCA9IHJvb3QuY3NzXG4gICAgICAgIGZpbGUuYXN0ID0gcm9vdC5yb290LnRvUmVzdWx0KClcbiAgICAgICAgZmlsZS51cGRhdGVFeHQoJy53eHNzJylcbiAgICAgICAgY2IoKVxuICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgIGxvZ2dlci5lcnJvcignQ29tcGlsZScsIGVyci5tZXNzYWdlLCBlcnIpXG4gICAgICAgIGNvbXBpbGF0aW9uLmRlc3Ryb3koKVxuICAgICAgICBjYigpXG4gICAgfSlcbn1cblxuZnVuY3Rpb24gZ2VuUG9zdGNzc0NvbmZpZyAodGFza3M6IEZ1bmN0aW9uW10gPSBbXSkge1xuICAgIHJldHVybiBwb3N0Y3NzQ29uZmlnLnBsdWdpbnMgPyBQcm9taXNlLnJlc29sdmUocG9zdGNzc0NvbmZpZykgOiBwb3N0Y3NzcmMoe30pLnRoZW4oKGNvbmZpZzogYW55KSA9PiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoT2JqZWN0LmFzc2lnbihwb3N0Y3NzQ29uZmlnLCBjb25maWcpKVxuICAgIH0pXG59XG4iLCJpbXBvcnQgKiBhcyBiYWJlbCBmcm9tICdAYmFiZWwvY29yZSdcbmltcG9ydCBGaWxlIGZyb20gJy4uL2NvcmUvY2xhc3MvRmlsZSdcblxuaW1wb3J0IHtcbiAgICBQYXJzZXIsXG4gICAgQ29tcGlsYXRpb24sXG4gICAgUGFyc2VySW5qZWN0aW9uXG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5sZXQgYmFiZWxDb25maWcgPSA8YmFiZWwuVHJhbnNmb3JtT3B0aW9ucz5udWxsXG5cbi8qKlxuICogU2NyaXB0IEZpbGUgcGFyc2VyLlxuICogQGZvciAuanMgLmVzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IDxQYXJzZXI+ZnVuY3Rpb24gKHRoaXM6IFBhcnNlckluamVjdGlvbiwgZmlsZTogRmlsZSwgY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYjogRnVuY3Rpb24pIHtcbiAgICBjb25zdCB1dGlscyA9IHRoaXMuZ2V0VXRpbHMoKVxuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuZ2V0U3lzdGVtQ29uZmlnKClcblxuICAgIGlmIChmaWxlLmlzSW5TcmNEaXIpIHtcbiAgICAgICAgaWYgKCFiYWJlbENvbmZpZykge1xuICAgICAgICAgICAgYmFiZWxDb25maWcgPSA8YmFiZWwuVHJhbnNmb3JtT3B0aW9ucz51dGlscy5yZXNvbHZlQ29uZmlnKFsnYmFiZWwuY29uZmlnLmpzJ10sIGNvbmZpZy5jd2QpXG4gICAgICAgIH1cblxuICAgICAgICBmaWxlLmNvbnZlcnRDb250ZW50VG9TdHJpbmcoKVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBiYWJlbC50cmFuc2Zvcm1TeW5jKDxzdHJpbmc+ZmlsZS5jb250ZW50LCB7XG4gICAgICAgICAgICAgICAgYmFiZWxyYzogZmFsc2UsXG4gICAgICAgICAgICAgICAgYXN0OiB0cnVlLFxuICAgICAgICAgICAgICAgIGZpbGVuYW1lOiBmaWxlLnNvdXJjZUZpbGUsXG4gICAgICAgICAgICAgICAgc291cmNlVHlwZTogJ21vZHVsZScsXG4gICAgICAgICAgICAgICAgc291cmNlTWFwczogY29uZmlnLmFua2FDb25maWcuZGV2TW9kZSxcbiAgICAgICAgICAgICAgICBjb21tZW50czogY29uZmlnLmFua2FDb25maWcuZGV2TW9kZSxcbiAgICAgICAgICAgICAgICBtaW5pZmllZDogIWNvbmZpZy5hbmthQ29uZmlnLmRldk1vZGUsXG4gICAgICAgICAgICAgICAgLi4uYmFiZWxDb25maWdcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIGZpbGUuc291cmNlTWFwID0gSlNPTi5zdHJpbmdpZnkocmVzdWx0Lm1hcClcbiAgICAgICAgICAgIGZpbGUuY29udGVudCA9IHJlc3VsdC5jb2RlXG4gICAgICAgICAgICBmaWxlLmFzdCA9IHJlc3VsdC5hc3RcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb21waWxhdGlvbi5kZXN0cm95KClcbiAgICAgICAgICAgIHV0aWxzLmxvZ2dlci5lcnJvcignQ29tcGlsZScsIGZpbGUuc291cmNlRmlsZSwgZXJyKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZmlsZS51cGRhdGVFeHQoJy5qcycpXG4gICAgY2IoKVxufVxuIiwiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnXG5pbXBvcnQge1xuICAgIFBsdWdpbixcbiAgICBDb21waWxhdGlvbixcbiAgICBQbHVnaW5IYW5kbGVyLFxuICAgIFBsdWdpbkluamVjdGlvblxufSBmcm9tICcuLi8uLi8uLi90eXBlcy90eXBlcydcbmNvbnN0IG1pbmlmeUpTT04gPSByZXF1aXJlKCdqc29ubWluaWZ5JylcblxuY29uc3QgaW5saW5lU291cmNlTWFwQ29tbWVudCA9IHJlcXVpcmUoJ2lubGluZS1zb3VyY2UtbWFwLWNvbW1lbnQnKVxuXG5leHBvcnQgZGVmYXVsdCA8UGx1Z2luPmZ1bmN0aW9uICh0aGlzOiBQbHVnaW5JbmplY3Rpb24pIHtcbiAgICBjb25zdCB1dGlscyA9IHRoaXMuZ2V0VXRpbHMoKVxuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuZ2V0U3lzdGVtQ29uZmlnKClcbiAgICBjb25zdCB7XG4gICAgICAgIGxvZ2dlcixcbiAgICAgICAgd3JpdGVGaWxlXG4gICAgfSA9IHV0aWxzXG5cbiAgICB0aGlzLm9uKCdzYXZlJywgPFBsdWdpbkhhbmRsZXI+ZnVuY3Rpb24gKGNvbXBpbGF0aW9uOiBDb21waWxhdGlvbiwgY2I6IEZ1bmN0aW9uKSB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSBjb21waWxhdGlvbi5maWxlXG5cbiAgICAgICAgLy8gVE9ETzogVXNlIG1lbS1mc1xuICAgICAgICBmcy5lbnN1cmVGaWxlKGZpbGUudGFyZ2V0RmlsZSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBpZiAoY29uZmlnLmFua2FDb25maWcuZGV2TW9kZSAmJiBmaWxlLnNvdXJjZU1hcCkge1xuICAgICAgICAgICAgICAgIGZpbGUuY29udmVydENvbnRlbnRUb1N0cmluZygpXG4gICAgICAgICAgICAgICAgZmlsZS5jb250ZW50ID0gZmlsZS5jb250ZW50ICsgJ1xcclxcblxcclxcbicgKyBpbmxpbmVTb3VyY2VNYXBDb21tZW50KGZpbGUuc291cmNlTWFwLCB7XG4gICAgICAgICAgICAgICAgICAgIGJsb2NrOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBzb3VyY2VzQ29udGVudDogdHJ1ZVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWNvbmZpZy5hbmthQ29uZmlnLmRldk1vZGUpIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGZpbGUuZXh0bmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjYXNlICcuanMnOlxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJy5qc29uJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuY29udmVydENvbnRlbnRUb1N0cmluZygpXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlLmNvbnRlbnQgPSBtaW5pZnlKU09OKGZpbGUuY29udGVudClcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHdyaXRlRmlsZShmaWxlLnRhcmdldEZpbGUsIGZpbGUuY29udGVudClcbiAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBjYigpXG4gICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yJywgZXJyLm1lc3NhZ2UsIGVycilcbiAgICAgICAgICAgIGNvbXBpbGF0aW9uLmRlc3Ryb3koKVxuICAgICAgICAgICAgY2IoKVxuICAgICAgICB9KVxuICAgIH0pXG59XG4iLCJpbXBvcnQgKiBhcyBwb3N0Y3NzIGZyb20gJ3Bvc3Rjc3MnXG5cbmV4cG9ydCBkZWZhdWx0IHBvc3Rjc3MucGx1Z2luKCdwb3N0Y3NzLXd4aW1wb3J0JywgKCkgPT4ge1xuICAgIHJldHVybiAocm9vdDogcG9zdGNzcy5Sb290KSA9PiB7XG4gICAgICAgIGxldCBpbXBvcnRzOiBBcnJheTxzdHJpbmc+ID0gW11cblxuICAgICAgICByb290LndhbGtBdFJ1bGVzKCd3eGltcG9ydCcsIChydWxlOiBwb3N0Y3NzLkF0UnVsZSkgPT4ge1xuICAgICAgICAgICAgaW1wb3J0cy5wdXNoKHJ1bGUucGFyYW1zLnJlcGxhY2UoL1xcLlxcdysoPz1bJ1wiXSQpLywgJy53eHNzJykpXG4gICAgICAgICAgICBydWxlLnJlbW92ZSgpXG4gICAgICAgIH0pXG4gICAgICAgIHJvb3QucHJlcGVuZCguLi5pbXBvcnRzLm1hcCgoaXRlbTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdpbXBvcnQnLFxuICAgICAgICAgICAgICAgIHBhcmFtczogaXRlbVxuICAgICAgICAgICAgfVxuICAgICAgICB9KSlcbiAgICAgICAgaW1wb3J0cy5sZW5ndGggPSAwXG4gICAgfVxufSlcbiIsImltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJ1xuaW1wb3J0IHtcbiAgICBQbHVnaW4sXG4gICAgQ29tcGlsYXRpb24sXG4gICAgUGx1Z2luSGFuZGxlcixcbiAgICBQbHVnaW5JbmplY3Rpb25cbn0gZnJvbSAnLi4vLi4vLi4vdHlwZXMvdHlwZXMnXG5pbXBvcnQgKiBhcyBQb3N0Q1NTIGZyb20gJ3Bvc3Rjc3MnXG5pbXBvcnQgcG9zdGNzc1d4SW1wb3J0IGZyb20gJy4vcG9zdGNzc1d4aW1wb3J0J1xuXG5jb25zdCBwb3N0Y3NzID0gcmVxdWlyZSgncG9zdGNzcycpXG5jb25zdCBjc3NuYW5vID0gcmVxdWlyZSgncG9zdGNzcy1ub3JtYWxpemUtd2hpdGVzcGFjZScpXG5jb25zdCBpbnRlcm5hbFBsdWdpbnM6IEFycmF5PFBvc3RDU1MuQWNjZXB0ZWRQbHVnaW4+ID0gW3Bvc3Rjc3NXeEltcG9ydF1cblxuZXhwb3J0IGRlZmF1bHQgPFBsdWdpbj5mdW5jdGlvbiAodGhpczogUGx1Z2luSW5qZWN0aW9uKSB7XG4gICAgY29uc3QgdXRpbHMgPSB0aGlzLmdldFV0aWxzKClcbiAgICBjb25zdCB7XG4gICAgICAgIGxvZ2dlclxuICAgIH0gPSB1dGlsc1xuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuZ2V0U3lzdGVtQ29uZmlnKClcbiAgICBjb25zdCB0ZXN0U3JjRGlyID0gbmV3IFJlZ0V4cChgXiR7Y29uZmlnLnNyY0Rpcn1gKVxuXG4gICAgdGhpcy5vbignYmVmb3JlLWNvbXBpbGUnLCA8UGx1Z2luSGFuZGxlcj5mdW5jdGlvbiAoY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYjogRnVuY3Rpb24pIHtcbiAgICAgICAgY29uc3QgZmlsZSA9IGNvbXBpbGF0aW9uLmZpbGVcblxuICAgICAgICBpZiAoIWNvbmZpZy5hbmthQ29uZmlnLmRldk1vZGUpIHtcbiAgICAgICAgICAgIGludGVybmFsUGx1Z2lucy5wdXNoKGNzc25hbm8pXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBoYW5kbGVyID0gcG9zdGNzcyhpbnRlcm5hbFBsdWdpbnMpXG5cbiAgICAgICAgaWYgKGZpbGUuZXh0bmFtZSA9PT0gJy53eHNzJyAmJiB0ZXN0U3JjRGlyLnRlc3QoZmlsZS5zb3VyY2VGaWxlKSkge1xuICAgICAgICAgICAgaGFuZGxlci5wcm9jZXNzKChmaWxlLmFzdCB8fCBmaWxlLmNvbnRlbnQpIGFzIHN0cmluZyB8IHsgdG9TdHJpbmcgKCk6IHN0cmluZzsgfSB8IFBvc3RDU1MuUmVzdWx0LCB7XG4gICAgICAgICAgICAgICAgZnJvbTogZmlsZS5zb3VyY2VGaWxlXG4gICAgICAgICAgICB9IGFzIFBvc3RDU1MuUHJvY2Vzc09wdGlvbnMpLnRoZW4oKHJvb3Q6IFBvc3RDU1MuUmVzdWx0KTogdm9pZCA9PiB7XG4gICAgICAgICAgICAgICAgZmlsZS5jb250ZW50ID0gcm9vdC5jc3NcbiAgICAgICAgICAgICAgICBmaWxlLmFzdCA9IHJvb3Qucm9vdC50b1Jlc3VsdCgpXG4gICAgICAgICAgICAgICAgY2IoKVxuICAgICAgICAgICAgfSwgKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yJywgZXJyLm1lc3NhZ2UsIGVycilcbiAgICAgICAgICAgICAgICBjb21waWxhdGlvbi5kZXN0cm95KClcbiAgICAgICAgICAgICAgICBjYigpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2IoKVxuICAgICAgICB9XG4gICAgfSlcbn1cbiIsImltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnXG5cbmltcG9ydCB7XG4gICAgRmlsZSxcbiAgICBQYXJzZXIsXG4gICAgQ29tcGlsYXRpb24sXG4gICAgUGFyc2VySW5qZWN0aW9uXG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5sZXQgdHNDb25maWcgPSA8dHMuVHJhbnNwaWxlT3B0aW9ucz5udWxsXG5cbi8qKlxuICogVHlwZXNjcmlwdCBmaWxlIHBhcnNlci5cbiAqXG4gKiBAZm9yIGFueSBmaWxlIHRoYXQgZG9lcyBub3QgbWF0Y2hlIHBhcnNlcnMuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IDxQYXJzZXI+ZnVuY3Rpb24gKHRoaXM6IFBhcnNlckluamVjdGlvbiwgZmlsZTogRmlsZSwgY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYWxsYmFjaz86IEZ1bmN0aW9uKSB7XG4gICAgY29uc3QgdXRpbHMgPSB0aGlzLmdldFV0aWxzKClcbiAgICBjb25zdCBjb25maWcgPSB0aGlzLmdldFN5c3RlbUNvbmZpZygpXG4gICAgY29uc3QgeyBsb2dnZXIgfSA9IHV0aWxzXG5cbiAgICBmaWxlLmNvbnRlbnQgPSBmaWxlLmNvbnRlbnQgaW5zdGFuY2VvZiBCdWZmZXIgPyBmaWxlLmNvbnRlbnQudG9TdHJpbmcoKSA6IGZpbGUuY29udGVudFxuICAgIGNvbnN0IHNvdXJjZU1hcCA9ICB7XG4gICAgICAgIHNvdXJjZXNDb250ZW50OiBbZmlsZS5jb250ZW50XVxuICAgIH1cblxuICAgIGlmICghdHNDb25maWcpIHtcbiAgICAgICAgdHNDb25maWcgPSA8dHMuVHJhbnNwaWxlT3B0aW9ucz51dGlscy5yZXNvbHZlQ29uZmlnKFsndHNjb25maWcuanNvbicsICd0c2NvbmZpZy5qcyddLCBjb25maWcuY3dkKVxuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdCA9IHRzLnRyYW5zcGlsZU1vZHVsZShmaWxlLmNvbnRlbnQsIHtcbiAgICAgICAgY29tcGlsZXJPcHRpb25zOiB0c0NvbmZpZy5jb21waWxlck9wdGlvbnMsXG4gICAgICAgIGZpbGVOYW1lOiBmaWxlLnNvdXJjZUZpbGVcbiAgICB9KVxuXG4gICAgdHJ5IHtcbiAgICAgICAgZmlsZS5jb250ZW50ID0gcmVzdWx0Lm91dHB1dFRleHRcbiAgICAgICAgaWYgKGNvbmZpZy5hbmthQ29uZmlnLmRldk1vZGUpIHtcbiAgICAgICAgICAgIGZpbGUuc291cmNlTWFwID0ge1xuICAgICAgICAgICAgICAgIC4uLkpTT04ucGFyc2UocmVzdWx0LnNvdXJjZU1hcFRleHQpLFxuICAgICAgICAgICAgICAgIC4uLnNvdXJjZU1hcFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZpbGUudXBkYXRlRXh0KCcuanMnKVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBsb2dnZXIuZXJyb3IoJ0NvbXBpbGUnLCBlcnIubWVzc2FnZSwgZXJyKVxuICAgICAgICBjb21waWxhdGlvbi5kZXN0cm95KClcbiAgICB9XG5cbiAgICBjYWxsYmFjaygpXG59XG4iLCJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgKiBhcyB0IGZyb20gJ0BiYWJlbC90eXBlcydcbmltcG9ydCAqIGFzIGJhYmVsIGZyb20gJ0BiYWJlbC9jb3JlJ1xuaW1wb3J0IHRyYXZlcnNlIGZyb20gJ0BiYWJlbC90cmF2ZXJzZSdcbmltcG9ydCBjb2RlR2VuZXJhdG9yIGZyb20gJ0BiYWJlbC9nZW5lcmF0b3InXG5cbmltcG9ydCB7XG4gICAgUGx1Z2luLFxuICAgIENvbXBpbGF0aW9uLFxuICAgIFBsdWdpbkhhbmRsZXIsXG4gICAgUGx1Z2luSW5qZWN0aW9uXG59IGZyb20gJy4uLy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5jb25zdCBkZXBlbmRlbmN5UG9vbCA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KClcbmNvbnN0IHJlc292bGVNb2R1bGVOYW1lID0gcmVxdWlyZSgncmVxdWlyZS1wYWNrYWdlLW5hbWUnKVxuXG5leHBvcnQgZGVmYXVsdCA8UGx1Z2luPiBmdW5jdGlvbiAodGhpczogUGx1Z2luSW5qZWN0aW9uKSB7XG4gICAgY29uc3QgdXRpbHMgPSB0aGlzLmdldFV0aWxzKClcbiAgICBjb25zdCBjb21waWxlciA9IHRoaXMuZ2V0Q29tcGlsZXIoKVxuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuZ2V0U3lzdGVtQ29uZmlnKClcbiAgICBjb25zdCB0ZXN0U3JjRGlyID0gbmV3IFJlZ0V4cChgXiR7Y29uZmlnLnNyY0Rpcn1gKVxuICAgIGNvbnN0IHRlc3ROb2RlTW9kdWxlcyA9IG5ldyBSZWdFeHAoYF4ke2NvbmZpZy5zb3VyY2VOb2RlTW9kdWxlc31gKVxuXG4gICAgdGhpcy5vbignYmVmb3JlLWNvbXBpbGUnLCBmdW5jdGlvbiAoY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYjogRnVuY3Rpb24pIHtcbiAgICAgICAgY29uc3QgZmlsZSA9IGNvbXBpbGF0aW9uLmZpbGVcbiAgICAgICAgY29uc3QgZGV2TW9kZSA9IGNvbmZpZy5hbmthQ29uZmlnLmRldk1vZGVcbiAgICAgICAgY29uc3QgbG9jYWxEZXBlbmRlbmN5UG9vbCA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KClcblxuICAgICAgICAvLyBPbmx5IHJlc29sdmUganMgZmlsZS5cbiAgICAgICAgaWYgKGZpbGUuZXh0bmFtZSA9PT0gJy5qcycpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGZpbGUuc291cmNlRmlsZSwgZmlsZS5hc3QgPyAnb2JqZWN0JyA6IGZpbGUuYXN0KVxuICAgICAgICAgICAgaWYgKCFmaWxlLmFzdCkge1xuICAgICAgICAgICAgICAgIGZpbGUuYXN0ID0gPHQuRmlsZT5iYWJlbC5wYXJzZShcbiAgICAgICAgICAgICAgICAgICAgZmlsZS5jb250ZW50IGluc3RhbmNlb2YgQnVmZmVyID8gZmlsZS5jb250ZW50LnRvU3RyaW5nKCkgOiBmaWxlLmNvbnRlbnQsXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhYmVscmM6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlVHlwZTogJ21vZHVsZSdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdHJhdmVyc2UoPHQuTm9kZT5maWxlLmFzdCwge1xuICAgICAgICAgICAgICAgIGVudGVyIChwYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXRoLmlzSW1wb3J0RGVjbGFyYXRpb24oKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHBhdGgubm9kZVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc291cmNlID0gbm9kZS5zb3VyY2VcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZS52YWx1ZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiBzb3VyY2UudmFsdWUgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHNvdXJjZSwgZmlsZS5zb3VyY2VGaWxlLCBmaWxlLnRhcmdldEZpbGUsIGxvY2FsRGVwZW5kZW5jeVBvb2wpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAocGF0aC5pc0NhbGxFeHByZXNzaW9uKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBwYXRoLm5vZGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNhbGxlZSA9IDx0LklkZW50aWZpZXI+bm9kZS5jYWxsZWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFyZ3MgPSA8dC5TdHJpbmdMaXRlcmFsW10+bm9kZS5hcmd1bWVudHNcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsZWUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzWzBdICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJnc1swXS52YWx1ZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxlZS5uYW1lID09PSAncmVxdWlyZScgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlb2YgYXJnc1swXS52YWx1ZSA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYXJnc1swXSwgZmlsZS5zb3VyY2VGaWxlLCBmaWxlLnRhcmdldEZpbGUsIGxvY2FsRGVwZW5kZW5jeVBvb2wpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgZmlsZS5jb250ZW50ID0gY29kZUdlbmVyYXRvcihmaWxlLmFzdCwge1xuICAgICAgICAgICAgICAgIGNvbXBhY3Q6ICFkZXZNb2RlLFxuICAgICAgICAgICAgICAgIG1pbmlmaWVkOiAhZGV2TW9kZVxuICAgICAgICAgICAgfSkuY29kZVxuXG4gICAgICAgICAgICBjb25zdCBkZXBlbmRlbmN5TGlzdCA9IEFycmF5LmZyb20obG9jYWxEZXBlbmRlbmN5UG9vbC5rZXlzKCkpLmZpbHRlcihkZXBlbmRlbmN5ID0+ICFkZXBlbmRlbmN5UG9vbC5oYXMoZGVwZW5kZW5jeSkpXG5cbiAgICAgICAgICAgIFByb21pc2UuYWxsKGRlcGVuZGVuY3lMaXN0Lm1hcChkZXBlbmRlbmN5ID0+IHRyYXZlcnNlTnBtRGVwZW5kZW5jeShkZXBlbmRlbmN5KSkpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNiKClcbiAgICAgICAgICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgdXRpbHMubG9nZ2VyLmVycm9yKGZpbGUuc291cmNlRmlsZSwgZXJyLm1lc3NhZ2UsIGVycilcbiAgICAgICAgICAgICAgICBjb21waWxhdGlvbi5kZXN0cm95KClcbiAgICAgICAgICAgICAgICBjYigpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2IoKVxuICAgICAgICB9XG4gICAgfSBhcyBQbHVnaW5IYW5kbGVyKVxuXG4gICAgZnVuY3Rpb24gcmVzb2x2ZSAobm9kZTogYW55LCBzb3VyY2VGaWxlOiBzdHJpbmcsIHRhcmdldEZpbGU6IHN0cmluZywgbG9jYWxEZXBlbmRlbmN5UG9vbDogTWFwPHN0cmluZywgc3RyaW5nPikge1xuICAgICAgICBjb25zdCBzb3VyY2VCYXNlTmFtZSA9IHBhdGguZGlybmFtZShzb3VyY2VGaWxlKVxuICAgICAgICBjb25zdCB0YXJnZXRCYXNlTmFtZSA9IHBhdGguZGlybmFtZSh0YXJnZXRGaWxlKVxuICAgICAgICBjb25zdCBtb2R1bGVOYW1lID0gcmVzb3ZsZU1vZHVsZU5hbWUobm9kZS52YWx1ZSlcblxuICAgICAgICBpZiAodXRpbHMuaXNOcG1EZXBlbmRlbmN5KG1vZHVsZU5hbWUpIHx8IHRlc3ROb2RlTW9kdWxlcy50ZXN0KHNvdXJjZUZpbGUpKSB7XG4gICAgICAgICAgICBjb25zdCBkZXBlbmRlbmN5ID0gdXRpbHMucmVzb2x2ZU1vZHVsZShub2RlLnZhbHVlLCB7XG4gICAgICAgICAgICAgICAgcGF0aHM6IFtzb3VyY2VCYXNlTmFtZV1cbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIC8vIEluIGNhc2UgYHJlcXVpcmUoJ2EnKWAsIGBhYCBpcyBsb2NhbCBmaWxlIGluIHNyYyBkaXJlY3RvcnlcbiAgICAgICAgICAgIGlmICghZGVwZW5kZW5jeSB8fCB0ZXN0U3JjRGlyLnRlc3QoZGVwZW5kZW5jeSkpIHJldHVyblxuXG4gICAgICAgICAgICBjb25zdCBkaXN0UGF0aCA9IGRlcGVuZGVuY3kucmVwbGFjZShjb25maWcuc291cmNlTm9kZU1vZHVsZXMsIGNvbmZpZy5kaXN0Tm9kZU1vZHVsZXMpXG5cbiAgICAgICAgICAgIG5vZGUudmFsdWUgPSBwYXRoLnJlbGF0aXZlKHRhcmdldEJhc2VOYW1lLCBkaXN0UGF0aClcblxuICAgICAgICAgICAgaWYgKGxvY2FsRGVwZW5kZW5jeVBvb2wuaGFzKGRlcGVuZGVuY3kpKSByZXR1cm5cbiAgICAgICAgICAgIGxvY2FsRGVwZW5kZW5jeVBvb2wuc2V0KGRlcGVuZGVuY3ksIGRlcGVuZGVuY3kpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBmdW5jdGlvbiB0cmF2ZXJzZU5wbURlcGVuZGVuY3kgKGRlcGVuZGVuY3k6IHN0cmluZykge1xuICAgICAgICBkZXBlbmRlbmN5UG9vbC5zZXQoZGVwZW5kZW5jeSwgZGVwZW5kZW5jeSlcbiAgICAgICAgY29uc3QgZmlsZSA9IGF3YWl0IHV0aWxzLmNyZWF0ZUZpbGUoZGVwZW5kZW5jeSlcblxuICAgICAgICBmaWxlLnRhcmdldEZpbGUgPSBmaWxlLnNvdXJjZUZpbGUucmVwbGFjZShjb25maWcuc291cmNlTm9kZU1vZHVsZXMsIGNvbmZpZy5kaXN0Tm9kZU1vZHVsZXMpXG4gICAgICAgIGF3YWl0IGNvbXBpbGVyLmdlbmVyYXRlQ29tcGlsYXRpb24oZmlsZSkucnVuKClcbiAgICB9XG59XG4iLCIvLyBpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgc2Fzc1BhcnNlciBmcm9tICcuLi9wYXJzZXJzL3Nhc3NQYXJzZXInXG5pbXBvcnQgZmlsZVBhcnNlciBmcm9tICcuLi9wYXJzZXJzL2ZpbGVQYXJzZXInXG5pbXBvcnQgc3R5bGVQYXJzZXIgZnJvbSAnLi4vcGFyc2Vycy9zdHlsZVBhcnNlcidcbmltcG9ydCBiYWJlbFBhcnNlciBmcm9tICcuLi9wYXJzZXJzL2JhYmVsUGFyc2VyJ1xuaW1wb3J0IHNjcmlwdFBhcnNlciBmcm9tICcuLi9wYXJzZXJzL3NjcmlwdFBhcnNlcidcbmltcG9ydCB0ZW1wbGF0ZVBhcnNlciBmcm9tICcuLi9wYXJzZXJzL3RlbXBsYXRlUGFyc2VyJ1xuaW1wb3J0IHNhdmVGaWxlUGx1Z2luIGZyb20gJy4uL3BsdWdpbnMvc2F2ZUZpbGVQbHVnaW4nXG5pbXBvcnQgd3hJbXBvcnRQbHVnaW4gZnJvbSAnLi4vcGx1Z2lucy93eEltcG9ydFBsdWdpbidcbmltcG9ydCB0eXBlc2NyaXB0UGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvdHlwZXNjcmlwdFBhcnNlcidcbmltcG9ydCBleHRyYWN0RGVwZW5kZW5jeVBsdWdpbiBmcm9tICcuLi9wbHVnaW5zL2V4dHJhY3REZXBlbmRlbmN5UGx1Z2luJ1xuXG5pbXBvcnQge1xuICAgIElnbm9yZWRDb25maWdyYXRpb24sXG4gICAgUGFyc2Vyc0NvbmZpZ3JhdGlvbixcbiAgICBQbHVnaW5zQ29uZmlncmF0aW9uXG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICAgICAgICAgICAgICAgICAgIERhbmdlciB6b25lXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbi8qKlxuICogVGhlIHBhdGggd2hlcmUgV2VDaGF0IG1pbmlwcm9ncmFtIHNvdXJjZSBmaWxlcyBleGlzdC5cbiAqIEBkZWZhdWx0ICcuL3NyYydcbiAqL1xuZXhwb3J0IGNvbnN0IHNvdXJjZURpciA9ICcuL3NyYydcblxuLyoqXG4gKiBUaGUgcGF0aCB3aGVyZSBXZUNoYXQgbWluaXByb2dyYW0gY29tcGlsZWQgZmlsZXMgZXhpc3QuXG4gKiBAZGVmYXVsdCAnLi9kaXN0J1xuICovXG5leHBvcnQgY29uc3Qgb3V0cHV0RGlyID0gJy4vZGlzdCdcblxuLyoqXG4gKiBUaGUgcGF0aCB3aGVyZSBXZUNoYXQgbWluaXByb2dyYW0gcGFnZXMgZXhpc3QuXG4gKiBAZGVmYXVsdCAnLi9zcmMvcGFnZXMnXG4gKi9cbmV4cG9ydCBjb25zdCBwYWdlcyA9ICcuL3BhZ2VzJ1xuXG4vKipcbiAqIFRoZSBwYXRoIHdoZXJlIFdlQ2hhdCBtaW5pcHJvZ3JhbSBjb21wb25lbnRzIGV4aXN0LlxuICogQGRlZmF1bHQgJy4vc3JjL2NvbXBvbmVudHMnXG4gKi9cbmV4cG9ydCBjb25zdCBjb21wb25lbnRzID0gJy4vY29tcG9uZW50cydcblxuLyoqXG4gKiBUZW1wbGF0ZSBmb3IgY3JlYXRpbmcgcGFnZSBhbmQgY29tcG9uZW50LlxuICovXG5leHBvcnQgY29uc3QgdGVtcGxhdGUgPSB7XG4gICAgcGFnZTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL3RlbXBsYXRlL3BhZ2UnKSxcbiAgICBjb21wb25lbnQ6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi90ZW1wbGF0ZS9jb21wb25lbnQnKVxufVxuXG4vKipcbiAqIFRoZSBwYXRoIHdoZXJlIFdlQ2hhdCBtaW5pcHJvZ3JhbSBzdWJwYWNrYWdlcyBleGlzdC5cbiAqIEBkZWZhdWx0ICcuL3NyYy9zdWJQYWNrYWdlcydcbiAqL1xuZXhwb3J0IGNvbnN0IHN1YlBhY2thZ2VzID0gJy4vc3ViUGFja2FnZXMnXG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogICAgICAgICAgICAgICAgIEN1c3RvbSBjb25maWd1cmVcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuLyoqXG4gKiBXaGV0aGVyIHRvIG91dHB1dCBjb21waWxlIGluZm9ybWF0aW9uLlxuICogQGRlZmF1bHQgZmFsc2VcbiAqL1xuZXhwb3J0IGNvbnN0IHF1aWV0ID0gZmFsc2VcblxuLyoqXG4gKiBBbmthIGRldmVsb3BtZW50IG1vZGUuXG4gKiBAZGVmYXVsdCBmYWxzZVxuICovXG5leHBvcnQgY29uc3QgZGV2TW9kZSA9IGZhbHNlXG5cbi8qKlxuICogUmVnaXN0ZXIgZmlsZSBwYXJzZXIuXG4gKi9cbmV4cG9ydCBjb25zdCBwYXJzZXJzOiBQYXJzZXJzQ29uZmlncmF0aW9uID0gW1xuICAgIHtcbiAgICAgICAgbWF0Y2g6IC8uKlxcLihqc3xlcykkLyxcbiAgICAgICAgcGFyc2VyczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcnNlcjogYmFiZWxQYXJzZXIsXG4gICAgICAgICAgICAgICAgb3B0aW9uczoge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgIH0sXG4gICAge1xuICAgICAgICBtYXRjaDogLy4qXFwuKHd4c3N8Y3NzfHBvc3Rjc3MpJC8sXG4gICAgICAgIHBhcnNlcnM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwYXJzZXI6IHN0eWxlUGFyc2VyLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IHt9XG4gICAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbWF0Y2g6IC8uKlxcLihzYXNzfHNjc3MpJC8sXG4gICAgICAgIHBhcnNlcnM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwYXJzZXI6IHNhc3NQYXJzZXIsXG4gICAgICAgICAgICAgICAgb3B0aW9uczoge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgIH0sXG4gICAge1xuICAgICAgICBtYXRjaDogLy4qXFwuKHRzfHR5cGVzY3JpcHQpJC8sXG4gICAgICAgIHBhcnNlcnM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwYXJzZXI6IHR5cGVzY3JpcHRQYXJzZXIsXG4gICAgICAgICAgICAgICAgb3B0aW9uczoge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgIH1cbl1cblxuLyoqXG4gKiBXaGV0aGVyIHRvIG91dHB1dCBkZWJ1ZyBpbmZvcm1hdGlvbi5cbiAqIEBkZWZhdWx0IGZhbHNlXG4gKi9cbmV4cG9ydCBjb25zdCBkZWJ1ZzogYm9vbGVhbiA9IGZhbHNlXG5cbi8qKlxuICogUmVnaXN0ZXIgcGx1Z2luLlxuICovXG5leHBvcnQgY29uc3QgcGx1Z2luczogUGx1Z2luc0NvbmZpZ3JhdGlvbiA9IFtcbiAgICB7XG4gICAgICAgIHBsdWdpbjogZXh0cmFjdERlcGVuZGVuY3lQbHVnaW4sXG4gICAgICAgIG9wdGlvbnM6IHt9XG4gICAgfSxcbiAgICB7XG4gICAgICAgIHBsdWdpbjogd3hJbXBvcnRQbHVnaW4sXG4gICAgICAgIG9wdGlvbnM6IHt9XG4gICAgfSxcbiAgICB7XG4gICAgICAgIHBsdWdpbjogc2F2ZUZpbGVQbHVnaW4sXG4gICAgICAgIG9wdGlvbnM6IHt9XG4gICAgfVxuXVxuXG4vKipcbiAqIEZpbGVzIHRoYXQgd2lsbCBiZSBpZ25vcmVkIGluIGNvbXBpbGF0aW9uLlxuICovXG5leHBvcnQgY29uc3QgaWdub3JlZDogSWdub3JlZENvbmZpZ3JhdGlvbiA9IFtdXG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogICAgICAgICAgICAgICBleHBlcmltZW50YWwgY29uZmlndXJlXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiIsImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCByZXNvbHZlQ29uZmlnIGZyb20gJy4uL3V0aWxzL3Jlc29sdmVDb25maWcnXG5pbXBvcnQgKiBhcyBhbmthRGVmYXVsdENvbmZpZyBmcm9tICcuL2Fua2FEZWZhdWx0Q29uZmlnJ1xuXG5pbXBvcnQge1xuICAgIEFua2FDb25maWdcbn0gZnJvbSAnLi4vLi4vdHlwZXMvdHlwZXMnXG5cbmNvbnN0IGN3ZCA9IHByb2Nlc3MuY3dkKClcbmNvbnN0IGN1c3RvbUNvbmZpZyA9IDxBbmthQ29uZmlnPnJlc29sdmVDb25maWcoWydhbmthLmNvbmZpZy5qcycsICdhbmthLmNvbmZpZy5qc29uJ10pXG5cbmZ1bmN0aW9uIG1lcmdlQXJyYXkgPFQ+ICguLi5hcnJzOiBBcnJheTxUW10+KTogQXJyYXk8VD4ge1xuICAgIHJldHVybiBhcnJzLmZpbHRlcihhcnIgPT4gYXJyICYmIGFyci5sZW5ndGgpLnJlZHVjZSgocHJldiwgbmV4dCkgPT4ge1xuICAgICAgICByZXR1cm4gcHJldi5jb25jYXQobmV4dClcbiAgICB9LCBbXSlcbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICAgIC4uLmFua2FEZWZhdWx0Q29uZmlnLFxuICAgIC4uLmN1c3RvbUNvbmZpZyxcbiAgICB0ZW1wbGF0ZTogY3VzdG9tQ29uZmlnLnRlbXBsYXRlID8ge1xuICAgICAgICBwYWdlOiBwYXRoLmpvaW4oY3dkLCBjdXN0b21Db25maWcudGVtcGxhdGUucGFnZSksXG4gICAgICAgIGNvbXBvbmVudDogcGF0aC5qb2luKGN3ZCwgY3VzdG9tQ29uZmlnLnRlbXBsYXRlLmNvbXBvbmVudClcbiAgICB9IDogYW5rYURlZmF1bHRDb25maWcudGVtcGxhdGUsXG4gICAgcGFyc2VyczogbWVyZ2VBcnJheShjdXN0b21Db25maWcucGFyc2VycywgYW5rYURlZmF1bHRDb25maWcucGFyc2VycyksXG4gICAgcGx1Z2luczogbWVyZ2VBcnJheShjdXN0b21Db25maWcucGx1Z2lucywgYW5rYURlZmF1bHRDb25maWcucGx1Z2lucyksXG4gICAgaWdub3JlZDogbWVyZ2VBcnJheShjdXN0b21Db25maWcuaWdub3JlZCwgYW5rYURlZmF1bHRDb25maWcuaWdub3JlZClcbn1cbiIsImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBhbmthQ29uZmlnIGZyb20gJy4vYW5rYUNvbmZpZydcblxuZXhwb3J0IGNvbnN0IGN3ZCA9IHByb2Nlc3MuY3dkKClcbmV4cG9ydCBjb25zdCBzcmNEaXIgPSBwYXRoLnJlc29sdmUoY3dkLCBhbmthQ29uZmlnLnNvdXJjZURpcilcbmV4cG9ydCBjb25zdCBkaXN0RGlyID0gcGF0aC5yZXNvbHZlKGN3ZCwgYW5rYUNvbmZpZy5vdXRwdXREaXIpXG5leHBvcnQgY29uc3QgYW5rYU1vZHVsZXMgPSBwYXRoLnJlc29sdmUoc3JjRGlyLCAnYW5rYV9tb2R1bGVzJylcbmV4cG9ydCBjb25zdCBzb3VyY2VOb2RlTW9kdWxlcyA9IHBhdGgucmVzb2x2ZShjd2QsICdub2RlX21vZHVsZXMnKVxuZXhwb3J0IGNvbnN0IGRpc3ROb2RlTW9kdWxlcyA9IHBhdGgucmVzb2x2ZShkaXN0RGlyLCAnbnBtX21vZHVsZXMnKVxuZXhwb3J0IGNvbnN0IGRlZmF1bHRTY2FmZm9sZCA9ICAnaUV4Y2VwdGlvbi9hbmthLXF1aWNrc3RhcnQnXG4iLCJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSdcbmltcG9ydCBhbmthQ29uZmlnIGZyb20gJy4vYW5rYUNvbmZpZydcbmltcG9ydCAqIGFzIHN5c3RlbSBmcm9tICcuL3N5c3RlbUNvbmZpZydcbmltcG9ydCByZXNvbHZlQ29uZmlnIGZyb20gJy4uL3V0aWxzL3Jlc29sdmVDb25maWcnXG5cbmNvbnN0IGN1c3RvbUNvbmZpZyA9IHJlc29sdmVDb25maWcoWydhcHAuanNvbiddLCBzeXN0ZW0uc3JjRGlyKVxuXG5leHBvcnQgZGVmYXVsdCBPYmplY3QuYXNzaWduKHtcbiAgICBwYWdlczogW10sXG4gICAgc3ViUGFja2FnZXM6IFtdLFxuICAgIHdpbmRvdzoge1xuICAgICAgICBuYXZpZ2F0aW9uQmFyVGl0bGVUZXh0OiAnV2VjaGF0J1xuICAgIH1cbiAgICAvLyB0YWJCYXI6IHtcbiAgICAvLyAgICAgbGlzdDogW11cbiAgICAvLyB9LFxufSwgY3VzdG9tQ29uZmlnKVxuIiwiaW1wb3J0ICogYXMgc3lzdGVtQ29uZmlnIGZyb20gJy4vc3lzdGVtQ29uZmlnJ1xuaW1wb3J0IGFua2FDb25maWcgZnJvbSAnLi9hbmthQ29uZmlnJ1xuaW1wb3J0IHByb2plY3RDb25maWcgZnJvbSAnLi9wcm9qZWN0Q29uZmlnJ1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgLi4uc3lzdGVtQ29uZmlnLFxuICAgIGFua2FDb25maWcsXG4gICAgcHJvamVjdENvbmZpZ1xufVxuIiwiaW1wb3J0ICogYXMgR2xvYiBmcm9tICdnbG9iJ1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnXG5jb25zdCBnbG9iID0gcmVxdWlyZSgnZ2xvYicpXG5cbmltcG9ydCB7XG4gICAgQ29udGVudFxufSBmcm9tICcuLi8uLi90eXBlcy90eXBlcydcblxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZEZpbGUgKHNvdXJjZUZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPEJ1ZmZlcj4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGZzLnJlYWRGaWxlKHNvdXJjZUZpbGVQYXRoLCAoZXJyLCBidWZmZXIpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKGJ1ZmZlcilcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVGaWxlICh0YXJnZXRGaWxlUGF0aDogc3RyaW5nLCBjb250ZW50OiBDb250ZW50KTogUHJvbWlzZTx1bmRlZmluZWQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBmcy53cml0ZUZpbGUodGFyZ2V0RmlsZVBhdGgsIGNvbnRlbnQsIGVyciA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlYXJjaEZpbGVzIChzY2hlbWU6IHN0cmluZywgb3B0aW9ucz86IEdsb2IuSU9wdGlvbnMpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgZ2xvYihzY2hlbWUsIG9wdGlvbnMsIChlcnI6IChFcnJvciB8IG51bGwpLCBmaWxlczogQXJyYXk8c3RyaW5nPik6IHZvaWQgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoZmlsZXMpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfSlcbn1cbiIsImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJ1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuLi8uLi9jb25maWcnXG5pbXBvcnQgKiBhcyB0IGZyb20gJ0BiYWJlbC90eXBlcydcbmltcG9ydCAqIGFzIFBvc3RDU1MgZnJvbSAncG9zdGNzcydcbmltcG9ydCB7XG4gICAgQ29udGVudCxcbiAgICBGaWxlQ29uc3RydWN0b3JPcHRpb25cbn0gZnJvbSAnLi4vLi4vLi4vdHlwZXMvdHlwZXMnXG5cbmNvbnN0IHJlcGxhY2VFeHQgPSByZXF1aXJlKCdyZXBsYWNlLWV4dCcpXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZpbGUge1xuICAgIHB1YmxpYyBzb3VyY2VGaWxlOiBzdHJpbmdcbiAgICBwdWJsaWMgY29udGVudDogQ29udGVudFxuICAgIHB1YmxpYyB0YXJnZXRGaWxlOiBzdHJpbmdcbiAgICBwdWJsaWMgYXN0PzogdC5Ob2RlIHwgUG9zdENTUy5SZXN1bHRcbiAgICBwdWJsaWMgc291cmNlTWFwPzogQ29udGVudFxuICAgIHB1YmxpYyBpc0luU3JjRGlyPzogYm9vbGVhblxuXG4gICAgY29uc3RydWN0b3IgKG9wdGlvbjogRmlsZUNvbnN0cnVjdG9yT3B0aW9uKSB7XG4gICAgICAgIGNvbnN0IGlzSW5TcmNEaXJUZXN0ID0gbmV3IFJlZ0V4cChgXiR7Y29uZmlnLnNyY0Rpcn1gKVxuXG4gICAgICAgIGlmICghb3B0aW9uLnNvdXJjZUZpbGUpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCB2YWx1ZTogRmlsZUNvbnN0cnVjdG9yT3B0aW9uLnNvdXJjZUZpbGUnKVxuICAgICAgICBpZiAoIW9wdGlvbi5jb250ZW50KSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgdmFsdWU6IEZpbGVDb25zdHJ1Y3Rvck9wdGlvbi5jb250ZW50JylcblxuICAgICAgICB0aGlzLnNvdXJjZUZpbGUgPSBvcHRpb24uc291cmNlRmlsZVxuICAgICAgICB0aGlzLnRhcmdldEZpbGUgPSBvcHRpb24udGFyZ2V0RmlsZSB8fCBvcHRpb24uc291cmNlRmlsZS5yZXBsYWNlKGNvbmZpZy5zcmNEaXIsIGNvbmZpZy5kaXN0RGlyKSAvLyBEZWZhdWx0IHZhbHVlXG4gICAgICAgIHRoaXMuY29udGVudCA9IG9wdGlvbi5jb250ZW50XG4gICAgICAgIHRoaXMuc291cmNlTWFwID0gb3B0aW9uLnNvdXJjZU1hcFxuICAgICAgICB0aGlzLmlzSW5TcmNEaXIgPSBpc0luU3JjRGlyVGVzdC50ZXN0KHRoaXMuc291cmNlRmlsZSlcbiAgICB9XG5cbiAgICBnZXQgZGlybmFtZSAoKSB7XG4gICAgICAgIHJldHVybiBwYXRoLmRpcm5hbWUodGhpcy50YXJnZXRGaWxlKVxuICAgIH1cblxuICAgIGdldCBiYXNlbmFtZSAoKSB7XG4gICAgICAgIHJldHVybiBwYXRoLmJhc2VuYW1lKHRoaXMudGFyZ2V0RmlsZSlcbiAgICB9XG5cbiAgICBnZXQgZXh0bmFtZSAoKSB7XG4gICAgICAgIHJldHVybiBwYXRoLmV4dG5hbWUodGhpcy50YXJnZXRGaWxlKVxuICAgIH1cblxuICAgIGFzeW5jIHNhdmVUbyAocGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGF3YWl0IGZzLmVuc3VyZUZpbGUocGF0aClcblxuICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwYXRoJylcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVwZGF0ZUV4dCAoZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgdGhpcy50YXJnZXRGaWxlID0gcmVwbGFjZUV4dCh0aGlzLnRhcmdldEZpbGUsIGV4dClcbiAgICB9XG5cbiAgICBjb252ZXJ0Q29udGVudFRvU3RyaW5nICgpIHtcbiAgICAgICAgaWYgKHRoaXMuY29udGVudCBpbnN0YW5jZW9mIEJ1ZmZlcikge1xuICAgICAgICAgICAgdGhpcy5jb250ZW50ID0gdGhpcy5jb250ZW50LnRvU3RyaW5nKClcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsImltcG9ydCB7XG4gICAgcmVhZEZpbGVcbn0gZnJvbSAnLi9mcydcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJ1xuaW1wb3J0IEZpbGUgZnJvbSAnLi4vY29yZS9jbGFzcy9GaWxlJ1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRmlsZSAoc291cmNlRmlsZTogc3RyaW5nKTogUHJvbWlzZTxGaWxlPiB7XG4gICAgcmV0dXJuIHJlYWRGaWxlKHNvdXJjZUZpbGUpLnRoZW4oY29udGVudCA9PiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IEZpbGUoe1xuICAgICAgICAgICAgc291cmNlRmlsZSxcbiAgICAgICAgICAgIGNvbnRlbnRcbiAgICAgICAgfSkpXG4gICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUZpbGVTeW5jIChzb3VyY2VGaWxlOiBzdHJpbmcpIHtcbiAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHNvdXJjZUZpbGUpXG4gICAgcmV0dXJuIG5ldyBGaWxlKHtcbiAgICAgICAgc291cmNlRmlsZSxcbiAgICAgICAgY29udGVudFxuICAgIH0pXG59XG4iLCJpbXBvcnQgeyBPcHRpb25zIGFzIFRlbXBsYXRlT3B0aW9ucyB9IGZyb20gJ2VqcydcbmltcG9ydCB7IG1lbUZzRWRpdG9yIGFzIE1lbUZzRWRpdG9yIH0gZnJvbSAnbWVtLWZzLWVkaXRvcidcblxuY29uc3QgbWVtRnMgPSByZXF1aXJlKCdtZW0tZnMnKVxuY29uc3QgbWVtRnNFZGl0b3IgPSByZXF1aXJlKCdtZW0tZnMtZWRpdG9yJylcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRnNFZGl0b3Ige1xuICAgIGVkaXRvcjogTWVtRnNFZGl0b3IuRWRpdG9yXG5cbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIGNvbnN0IHN0b3JlID0gbWVtRnMuY3JlYXRlKClcblxuICAgICAgICB0aGlzLmVkaXRvciA9IG1lbUZzRWRpdG9yLmNyZWF0ZShzdG9yZSlcbiAgICB9XG5cbiAgICBjb3B5IChmcm9tOiBzdHJpbmcsIHRvOiBzdHJpbmcsIGNvbnRleHQ6IG9iamVjdCwgdGVtcGxhdGVPcHRpb25zPzogVGVtcGxhdGVPcHRpb25zLCBjb3B5T3B0aW9ucz86IE1lbUZzRWRpdG9yLkNvcHlPcHRpb25zKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZWRpdG9yLmNvcHlUcGwoZnJvbSwgdG8sIGNvbnRleHQsIHRlbXBsYXRlT3B0aW9ucywgY29weU9wdGlvbnMpXG4gICAgfVxuXG4gICAgd3JpdGUgKGZpbGVwYXRoOiBzdHJpbmcsIGNvbnRlbnRzOiBNZW1Gc0VkaXRvci5Db250ZW50cyk6IHZvaWQge1xuICAgICAgICB0aGlzLmVkaXRvci53cml0ZShmaWxlcGF0aCwgY29udGVudHMpXG4gICAgfVxuXG4gICAgd3JpdGVKU09OIChmaWxlcGF0aDogc3RyaW5nLCBjb250ZW50czogYW55LCByZXBsYWNlcj86IE1lbUZzRWRpdG9yLlJlcGxhY2VyRnVuYywgc3BhY2U/OiBNZW1Gc0VkaXRvci5TcGFjZSk6IHZvaWQge1xuICAgICAgICB0aGlzLmVkaXRvci53cml0ZUpTT04oZmlsZXBhdGgsIGNvbnRlbnRzLCByZXBsYWNlciB8fCBudWxsLCBzcGFjZSA9IDQpXG4gICAgfVxuXG4gICAgcmVhZCAoZmlsZXBhdGg6IHN0cmluZywgb3B0aW9ucz86IHsgcmF3OiBib29sZWFuLCBkZWZhdWx0czogc3RyaW5nIH0pOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5lZGl0b3IucmVhZChmaWxlcGF0aCwgb3B0aW9ucylcbiAgICB9XG5cbiAgICByZWFkSlNPTiAoZmlsZXBhdGg6IHN0cmluZywgZGVmYXVsdHM/OiBhbnkpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5lZGl0b3IucmVhZEpTT04oZmlsZXBhdGgsIGRlZmF1bHRzKVxuICAgIH1cblxuICAgIHNhdmUgKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yLmNvbW1pdChyZXNvbHZlKVxuICAgICAgICB9KVxuICAgIH1cbn1cbiIsImltcG9ydCBsb2cgZnJvbSAnLi9sb2dnZXInXG5pbXBvcnQgYW5rYUNvbmZpZyBmcm9tICcuLi9jb25maWcvYW5rYUNvbmZpZydcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKGlkOiBzdHJpbmcsIG9wdGlvbnM/OiB7IHBhdGhzPzogc3RyaW5nW10gfSk6IHN0cmluZyB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUucmVzb2x2ZShpZCwgb3B0aW9ucylcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgbG9nLmVycm9yKCdDb21waWxlJywgaWQsIG5ldyBFcnJvcihgTWlzc2luZyBkZXBlbmRlbmN5ICR7aWR9IGluICR7b3B0aW9ucy5wYXRoc31gKSlcbiAgICB9XG59XG4iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjYWxsUHJvbWlzZUluQ2hhaW4gKGxpc3Q6IEFycmF5PCguLi5wYXJhbXM6IGFueVtdKSA9PiBQcm9taXNlPGFueT4+ID0gW10sIC4uLnBhcmFtczogQXJyYXk8YW55Pik6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGlmICghbGlzdC5sZW5ndGgpICB7XG4gICAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIGxldCBzdGVwID0gbGlzdFswXSguLi5wYXJhbXMpXG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBzdGVwID0gc3RlcC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGlzdFtpXSguLi5wYXJhbXMpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgc3RlcC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgfSwgZXJyID0+IHtcbiAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgIH0pXG4gICAgfSlcbn1cbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChmbjogRnVuY3Rpb24pOiAoKSA9PiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKC4uLnBhcmFtczogQXJyYXk8YW55Pikge1xuICAgICAgICBjb25zdCBsaW1pdGF0aW9uID0gcGFyYW1zLmxlbmd0aFxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIGlmIChmbi5sZW5ndGggPiBsaW1pdGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgZm4oLi4ucGFyYW1zLCByZXNvbHZlKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKGZuKC4uLnBhcmFtcykpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgY2hva2lkYXIgZnJvbSAnY2hva2lkYXInXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChkaXI6IHN0cmluZyB8IHN0cmluZ1tdLCBvcHRpb25zPzogY2hva2lkYXIuV2F0Y2hPcHRpb25zKTogY2hva2lkYXIuRlNXYXRjaGVyIHtcbiAgICByZXR1cm4gY2hva2lkYXIud2F0Y2goZGlyLCB7XG4gICAgICAgIHBlcnNpc3RlbnQ6IHRydWUsXG4gICAgICAgIGlnbm9yZUluaXRpYWw6IHRydWUsXG4gICAgICAgIC4uLm9wdGlvbnNcbiAgICB9KVxufVxuIiwiZGVjbGFyZSB0eXBlIFZhbGlkYXRlTnBtUGFja2FnZU5hbWUgPSB7XG4gICAgdmFsaWRGb3JOZXdQYWNrYWdlczogYm9vbGVhbixcbiAgICB2YWxpZEZvck9sZFBhY2thZ2VzOiBib29sZWFuXG59XG5cbmNvbnN0IHZhbGlkYXRlID0gcmVxdWlyZSgndmFsaWRhdGUtbnBtLXBhY2thZ2UtbmFtZScpXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChyZXF1aXJlZDogc3RyaW5nID0gJycpOiBib29sZWFuIHtcbiAgICBjb25zdCByZXN1bHQgPSA8VmFsaWRhdGVOcG1QYWNrYWdlTmFtZT52YWxpZGF0ZShyZXF1aXJlZClcblxuICAgIHJldHVybiByZXN1bHQudmFsaWRGb3JOZXdQYWNrYWdlcyB8fCByZXN1bHQudmFsaWRGb3JPbGRQYWNrYWdlc1xufVxuIiwiaW1wb3J0IGRvd25sb2FkUmVwbyBmcm9tICdkb3dubG9hZC1naXQtcmVwbydcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKHJlcG86IHN0cmluZywgcGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgZG93bmxvYWRSZXBvKHJlcG8sIHBhdGgsIHsgY2xvbmU6IGZhbHNlIH0sIChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICBlcnIgPyByZWplY3QoZXJyKSA6IHJlc29sdmUoKVxuICAgICAgICB9KVxuICAgIH0pXG59XG4iLCJpbXBvcnQgQ29tcGlsZXIgZnJvbSAnLi9Db21waWxlcidcbmltcG9ydCBjb25maWcgZnJvbSAnLi4vLi4vY29uZmlnJ1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vLi4vdXRpbHMnXG5cbmltcG9ydCB7XG4gICAgVXRpbHMsXG4gICAgQW5rYUNvbmZpZyxcbiAgICBQYXJzZXJPcHRpb25zLFxuICAgIFByb2plY3RDb25maWcsXG4gICAgUGx1Z2luSGFuZGxlcixcbiAgICBQbHVnaW5PcHRpb25zLFxuICAgIENvbXBpbGVyQ29uZmlnXG59IGZyb20gJy4uLy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgSW5qZWN0aW9uIHtcbiAgICBjb21waWxlcjogQ29tcGlsZXJcbiAgICBvcHRpb25zOiBvYmplY3RcblxuICAgIGNvbnN0cnVjdG9yIChjb21waWxlcjogQ29tcGlsZXIsIG9wdGlvbnM/OiBvYmplY3QpIHtcbiAgICAgICAgdGhpcy5jb21waWxlciA9IGNvbXBpbGVyXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnNcbiAgICB9XG5cbiAgICBhYnN0cmFjdCBnZXRPcHRpb25zICgpOiBvYmplY3RcblxuICAgIGdldENvbXBpbGVyICgpOiBDb21waWxlciB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbXBpbGVyXG4gICAgfVxuXG4gICAgZ2V0VXRpbHMgKCkge1xuICAgICAgICByZXR1cm4gdXRpbHNcbiAgICB9XG5cbiAgICBnZXRBbmthQ29uZmlnICgpOiBBbmthQ29uZmlnIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5hbmthQ29uZmlnXG4gICAgfVxuXG4gICAgZ2V0U3lzdGVtQ29uZmlnICgpOiBDb21waWxlckNvbmZpZyB7XG4gICAgICAgIHJldHVybiBjb25maWdcbiAgICB9XG5cbiAgICBnZXRQcm9qZWN0Q29uZmlnICgpOiBQcm9qZWN0Q29uZmlnIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5wcm9qZWN0Q29uZmlnXG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgUGx1Z2luSW5qZWN0aW9uIGV4dGVuZHMgSW5qZWN0aW9uIHtcblxuICAgIGNvbnN0cnVjdG9yIChjb21waWxlcjogQ29tcGlsZXIsIG9wdGlvbnM6IFBsdWdpbk9wdGlvbnNbJ29wdGlvbnMnXSkge1xuICAgICAgICBzdXBlcihjb21waWxlciwgb3B0aW9ucylcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gUGx1Z2luIG9wdGlvbnNcbiAgICAgKi9cbiAgICBnZXRPcHRpb25zICgpOiBvYmplY3Qge1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zIHx8IHt9XG4gICAgfVxuXG4gICAgb24gKGV2ZW50OiBzdHJpbmcsIGhhbmRsZXI6IFBsdWdpbkhhbmRsZXIpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jb21waWxlci5vbihldmVudCwgaGFuZGxlcilcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBQYXJzZXJJbmplY3Rpb24gZXh0ZW5kcyBJbmplY3Rpb24ge1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIFBhcnNlck9wdGlvbnNcbiAgICAgKi9cbiAgICBnZXRPcHRpb25zICgpOiBvYmplY3Qge1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zIHx8IHt9XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IgKGNvbXBpbGVyOiBDb21waWxlciwgb3B0aW9uczogUGFyc2VyT3B0aW9uc1snb3B0aW9ucyddKSB7XG4gICAgICAgIHN1cGVyKGNvbXBpbGVyLCBvcHRpb25zKVxuICAgIH1cbn1cbiIsImltcG9ydCBGaWxlIGZyb20gJy4vRmlsZSdcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBjb25maWcgZnJvbSAnLi4vLi4vY29uZmlnJ1xuaW1wb3J0IENvbXBpbGVyIGZyb20gJy4vQ29tcGlsZXInXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi8uLi91dGlscydcblxuaW1wb3J0IHtcbiAgICBQYXJzZXIsXG4gICAgTWF0Y2hlcixcbiAgICBQbHVnaW5IYW5kbGVyLFxuICAgIFBsdWdpbk9wdGlvbnMsXG4gICAgQ29tcGlsZXJDb25maWdcbn0gZnJvbSAnLi4vLi4vLi4vdHlwZXMvdHlwZXMnXG5pbXBvcnQgbWVzc2FnZXIgZnJvbSAnLi4vLi4vdXRpbHMvbWVzc2FnZXInXG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tICcuLi8uLi91dGlscydcblxuLyoqXG4gKiBBIGNvbXBpbGF0aW9uIHRhc2tcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29tcGlsYXRpb24ge1xuICAgIGNvbmZpZzogQ29tcGlsZXJDb25maWdcbiAgICByZWFkb25seSBjb21waWxlcjogQ29tcGlsZXJcbiAgICBpZDogbnVtYmVyICAgICAgICAvLyBVbmlxdWXvvIxmb3IgZWFjaCBDb21waWxhdGlvblxuICAgIGZpbGU6IEZpbGVcbiAgICBzb3VyY2VGaWxlOiBzdHJpbmdcbiAgICBkZXN0cm95ZWQ6IGJvb2xlYW5cblxuICAgIGNvbnN0cnVjdG9yIChmaWxlOiBGaWxlIHwgc3RyaW5nLCBjb25mOiBDb21waWxlckNvbmZpZywgY29tcGlsZXI6IENvbXBpbGVyKSB7XG4gICAgICAgIHRoaXMuY29tcGlsZXIgPSBjb21waWxlclxuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZcbiAgICAgICAgdGhpcy5pZCA9IENvbXBpbGVyLmNvbXBpbGF0aW9uSWQrK1xuXG4gICAgICAgIGlmIChmaWxlIGluc3RhbmNlb2YgRmlsZSkge1xuICAgICAgICAgICAgdGhpcy5maWxlID0gZmlsZVxuICAgICAgICAgICAgdGhpcy5zb3VyY2VGaWxlID0gZmlsZS5zb3VyY2VGaWxlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNvdXJjZUZpbGUgPSBmaWxlXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmVucm9sbCgpXG4gICAgfVxuXG4gICAgYXN5bmMgcnVuICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMubG9hZEZpbGUoKVxuICAgICAgICAgICAgYXdhaXQgdGhpcy5pbnZva2VQYXJzZXJzKClcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY29tcGlsZSgpXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRoaXMuZGVzdHJveSgpXG4gICAgICAgICAgICB1dGlscy5sb2dnZXIuZXJyb3IoJ0NvbXBpbGUnLCBlLm1lc3NhZ2UsIGUpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBsb2FkRmlsZSAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICh0aGlzLmRlc3Ryb3llZCkgcmV0dXJuXG5cbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlci5lbWl0KCdiZWZvcmUtbG9hZC1maWxlJywgdGhpcylcbiAgICAgICAgaWYgKCEodGhpcy5maWxlIGluc3RhbmNlb2YgRmlsZSkpIHtcbiAgICAgICAgICAgIHRoaXMuZmlsZSA9IGF3YWl0IHV0aWxzLmNyZWF0ZUZpbGUodGhpcy5zb3VyY2VGaWxlKVxuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlci5lbWl0KCdhZnRlci1sb2FkLWZpbGUnLCB0aGlzKVxuICAgIH1cblxuICAgIGFzeW5jIGludm9rZVBhcnNlcnMgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBpZiAodGhpcy5kZXN0cm95ZWQpIHJldHVyblxuXG4gICAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLmZpbGVcbiAgICAgICAgY29uc3QgcGFyc2VycyA9IDxQYXJzZXJbXT50aGlzLmNvbXBpbGVyLnBhcnNlcnMuZmlsdGVyKChtYXRjaGVyczogTWF0Y2hlcikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoZXJzLm1hdGNoLnRlc3QoZmlsZS5zb3VyY2VGaWxlKVxuICAgICAgICB9KS5tYXAoKG1hdGNoZXJzOiBNYXRjaGVyKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hlcnMucGFyc2Vyc1xuICAgICAgICB9KS5yZWR1Y2UoKHByZXYsIG5leHQpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBwcmV2LmNvbmNhdChuZXh0KVxuICAgICAgICB9LCBbXSlcbiAgICAgICAgY29uc3QgdGFza3MgPSBwYXJzZXJzLm1hcChwYXJzZXIgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHV0aWxzLmFzeW5jRnVuY3Rpb25XcmFwcGVyKHBhcnNlcilcbiAgICAgICAgfSlcblxuICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGVyLmVtaXQoJ2JlZm9yZS1wYXJzZScsIHRoaXMpXG4gICAgICAgIGF3YWl0IHV0aWxzLmNhbGxQcm9taXNlSW5DaGFpbih0YXNrcywgZmlsZSwgdGhpcylcbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlci5lbWl0KCdhZnRlci1wYXJzZScsIHRoaXMpXG4gICAgfVxuXG4gICAgYXN5bmMgY29tcGlsZSAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICh0aGlzLmRlc3Ryb3llZCkgcmV0dXJuXG5cbiAgICAgICAgLy8gSW52b2tlIEV4dHJhY3REZXBlbmRlbmN5UGx1Z2luLlxuICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGVyLmVtaXQoJ2JlZm9yZS1jb21waWxlJywgdGhpcylcbiAgICAgICAgLy8gRG8gc29tZXRoaW5nIGVsc2UuXG4gICAgICAgIGF3YWl0IHRoaXMuY29tcGlsZXIuZW1pdCgnYWZ0ZXItY29tcGlsZScsIHRoaXMpXG4gICAgICAgIGF3YWl0IHRoaXMuY29tcGlsZXIuZW1pdCgnc2F2ZScsIHRoaXMpXG4gICAgICAgIGNvbmZpZy5hbmthQ29uZmlnLmRlYnVnICYmIHV0aWxzLmxvZ2dlci5pbmZvKCdDb21waWxlJywgdGhpcy5maWxlLnNvdXJjZUZpbGUucmVwbGFjZShgJHtjb25maWcuY3dkfSR7cGF0aC5zZXB9YCwgJycpKVxuICAgICAgICB0aGlzLmRlc3Ryb3koKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVyIG9uIENvbXBpbGVyIGFuZCBkZXN0cm95IHRoZSBwcmV2aW91cyBvbmUgaWYgY29uZmxpY3QgYXJpc2VzLlxuICAgICAqL1xuICAgIGVucm9sbCAoKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IG9sZENvbXBpbGF0aW9uID0gQ29tcGlsZXIuY29tcGlsYXRpb25Qb29sLmdldCh0aGlzLnNvdXJjZUZpbGUpXG5cbiAgICAgICAgaWYgKG9sZENvbXBpbGF0aW9uKSB7XG4gICAgICAgICAgICBpZiAoY29uZmlnLmFua2FDb25maWcuZGVidWcpIGNvbnNvbGUubG9nKCdcYkRlc3Ryb3kgQ29tcGlsYXRpb24nLCBvbGRDb21waWxhdGlvbi5pZCwgb2xkQ29tcGlsYXRpb24uc291cmNlRmlsZSlcblxuICAgICAgICAgICAgb2xkQ29tcGlsYXRpb24uZGVzdHJveSgpXG4gICAgICAgIH1cbiAgICAgICAgQ29tcGlsZXIuY29tcGlsYXRpb25Qb29sLnNldCh0aGlzLnNvdXJjZUZpbGUsIHRoaXMpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVW5yZWdpc3RlciB0aGVtc2VsdmVzIGZyb20gQ29tcGlsZXIuXG4gICAgICovXG4gICAgZGVzdHJveSAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZGVzdHJveWVkID0gdHJ1ZVxuICAgICAgICBDb21waWxlci5jb21waWxhdGlvblBvb2wuZGVsZXRlKHRoaXMuc291cmNlRmlsZSlcbiAgICB9XG59XG4iLCJpbXBvcnQge1xuICAgIFBhcnNlckluamVjdGlvbixcbiAgICBQbHVnaW5JbmplY3Rpb25cbn0gZnJvbSAnLi9JbmplY3Rpb24nXG5pbXBvcnQgRmlsZSBmcm9tICcuL0ZpbGUnXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSdcbmltcG9ydCBjb25maWcgZnJvbSAnLi4vLi4vY29uZmlnJ1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vLi4vdXRpbHMnXG5pbXBvcnQgQ29tcGlsYXRpb24gZnJvbSAnLi9Db21waWxhdGlvbidcbmltcG9ydCBtZXNzYWdlciBmcm9tICcuLi8uLi91dGlscy9tZXNzYWdlcidcbmltcG9ydCBjYWxsUHJvbWlzZUluQ2hhaW4gZnJvbSAnLi4vLi4vdXRpbHMvY2FsbFByb21pc2VJbkNoYWluJ1xuaW1wb3J0IGFzeW5jRnVuY3Rpb25XcmFwcGVyIGZyb20gJy4uLy4uL3V0aWxzL2FzeW5jRnVuY3Rpb25XcmFwcGVyJ1xuXG5pbXBvcnQge1xuICAgIFBhcnNlcixcbiAgICBQYXJzZXJPcHRpb25zLFxuICAgIFBsdWdpbkhhbmRsZXIsXG4gICAgUGx1Z2luT3B0aW9ucyxcbiAgICBDb21waWxlckNvbmZpZ1xufSBmcm9tICcuLi8uLi8uLi90eXBlcy90eXBlcydcblxuY29uc3QgeyBsb2dnZXIgfSA9IHV0aWxzXG5jb25zdCBkZWwgPSByZXF1aXJlKCdkZWwnKVxuXG4vKipcbiAqIFRoZSBjb3JlIGNvbXBpbGVyLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb21waWxlciB7XG4gICAgcmVhZG9ubHkgY29uZmlnOiBDb21waWxlckNvbmZpZ1xuICAgIHB1YmxpYyBzdGF0aWMgY29tcGlsYXRpb25JZCA9IDFcbiAgICBwdWJsaWMgc3RhdGljIGNvbXBpbGF0aW9uUG9vbCA9IG5ldyBNYXA8c3RyaW5nLCBDb21waWxhdGlvbj4oKVxuICAgIHBsdWdpbnM6IHtcbiAgICAgICAgW2V2ZW50TmFtZTogc3RyaW5nXTogQXJyYXk8UGx1Z2luSGFuZGxlcj5cbiAgICB9ID0ge1xuICAgICAgICAnYmVmb3JlLWxvYWQtZmlsZSc6IFtdLFxuICAgICAgICAnYWZ0ZXItbG9hZC1maWxlJzogW10sXG4gICAgICAgICdiZWZvcmUtcGFyc2UnOiBbXSxcbiAgICAgICAgJ2FmdGVyLXBhcnNlJzogW10sXG4gICAgICAgICdiZWZvcmUtY29tcGlsZSc6IFtdLFxuICAgICAgICAnYWZ0ZXItY29tcGlsZSc6IFtdLFxuICAgICAgICAnc2F2ZSc6IFtdXG4gICAgfVxuICAgIHBhcnNlcnM6IEFycmF5PHtcbiAgICAgICAgbWF0Y2g6IFJlZ0V4cCxcbiAgICAgICAgcGFyc2VyczogQXJyYXk8UGFyc2VyPlxuICAgIH0+ID0gW11cblxuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWdcbiAgICAgICAgdGhpcy5pbml0UGFyc2VycygpXG4gICAgICAgIHRoaXMuaW5pdFBsdWdpbnMoKVxuXG4gICAgICAgIGlmIChjb25maWcuYW5rYUNvbmZpZy5kZWJ1Zykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkodGhpcy5jb25maWcsIChrZXksIHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRnVuY3Rpb24pIHJldHVybiAnW0Z1bmN0aW9uXSdcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWVcbiAgICAgICAgICAgIH0sIDQpKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXIgUGx1Z2luLlxuICAgICAqIEBwYXJhbSBldmVudFxuICAgICAqIEBwYXJhbSBoYW5kbGVyXG4gICAgICovXG4gICAgb24gKGV2ZW50OiBzdHJpbmcsIGhhbmRsZXI6IFBsdWdpbkhhbmRsZXIpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMucGx1Z2luc1tldmVudF0gPT09IHZvaWQgKDApKSB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gaG9vazogJHtldmVudH1gKVxuICAgICAgICB0aGlzLnBsdWdpbnNbZXZlbnRdLnB1c2goaGFuZGxlcilcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbnZva2UgbGlmZWN5Y2xlIGhvb2tzKFByb21pc2UgY2hhaW5pbmcpLlxuICAgICAqIEBwYXJhbSBldmVudFxuICAgICAqIEBwYXJhbSBjb21waWxhdGlvblxuICAgICAqL1xuICAgIGFzeW5jIGVtaXQgKGV2ZW50OiBzdHJpbmcsIGNvbXBpbGF0aW9uOiBDb21waWxhdGlvbik6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGlmIChjb21waWxhdGlvbi5kZXN0cm95ZWQpIHJldHVyblxuXG4gICAgICAgIGNvbnN0IHBsdWdpbnMgPSB0aGlzLnBsdWdpbnNbZXZlbnRdXG5cbiAgICAgICAgaWYgKCFwbHVnaW5zIHx8ICFwbHVnaW5zLmxlbmd0aCkgcmV0dXJuXG5cbiAgICAgICAgY29uc3QgdGFza3MgPSBwbHVnaW5zLm1hcChwbHVnaW4gPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGFzeW5jRnVuY3Rpb25XcmFwcGVyKHBsdWdpbilcbiAgICAgICAgfSlcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgY2FsbFByb21pc2VJbkNoYWluKHRhc2tzLCBjb21waWxhdGlvbilcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdXRpbHMubG9nZ2VyLmVycm9yKCdDb21waWxlJywgZS5tZXNzYWdlLCBlKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2xlYW4gZGlzdCBkaXJlY3RvcnkuXG4gICAgICovXG4gICAgYXN5bmMgY2xlYW4gKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCBkZWwoW1xuICAgICAgICAgICAgcGF0aC5qb2luKGNvbmZpZy5kaXN0RGlyLCAnKiovKicpLFxuICAgICAgICAgICAgYCEke3BhdGguam9pbihjb25maWcuZGlzdERpciwgJ2FwcC5qcycpfWAsXG4gICAgICAgICAgICBgISR7cGF0aC5qb2luKGNvbmZpZy5kaXN0RGlyLCAnYXBwLmpzb24nKX1gLFxuICAgICAgICAgICAgYCEke3BhdGguam9pbihjb25maWcuZGlzdERpciwgJ3Byb2plY3QuY29uZmlnLmpzb24nKX1gXG4gICAgICAgIF0pXG4gICAgICAgIGxvZ2dlci5zdWNjZXNzKCdDbGVhbiB3b3Jrc2hvcCcsIGNvbmZpZy5kaXN0RGlyKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV2ZXJ5dGhpbmcgc3RhcnQgZnJvbSBoZXJlLlxuICAgICAqL1xuICAgIGFzeW5jIGxhdW5jaCAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgbG9nZ2VyLnN0YXJ0TG9hZGluZygnTGF1bmNoaW5nLi4uJylcblxuICAgICAgICBjb25zdCBzdGFydHVwVGltZSA9IERhdGUubm93KClcbiAgICAgICAgY29uc3QgZmlsZVBhdGhzOiBzdHJpbmdbXSA9IGF3YWl0IHV0aWxzLnNlYXJjaEZpbGVzKGAqKi8qYCwge1xuICAgICAgICAgICAgY3dkOiBjb25maWcuc3JjRGlyLFxuICAgICAgICAgICAgbm9kaXI6IHRydWUsXG4gICAgICAgICAgICBzaWxlbnQ6IGZhbHNlLFxuICAgICAgICAgICAgYWJzb2x1dGU6IHRydWUsXG4gICAgICAgICAgICBpZ25vcmU6IGNvbmZpZy5hbmthQ29uZmlnLmlnbm9yZWRcbiAgICAgICAgfSlcbiAgICAgICAgY29uc3QgZmlsZXMgPSBhd2FpdCBQcm9taXNlLmFsbChmaWxlUGF0aHMubWFwKGZpbGUgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHV0aWxzLmNyZWF0ZUZpbGUoZmlsZSlcbiAgICAgICAgfSkpXG4gICAgICAgIGNvbnN0IGNvbXBpbGF0aW9ucyA9IGZpbGVzLm1hcChmaWxlID0+IHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ29tcGlsYXRpb24oZmlsZSwgdGhpcy5jb25maWcsIHRoaXMpXG4gICAgICAgIH0pXG5cbiAgICAgICAgZnMuZW5zdXJlRGlyU3luYyhjb25maWcuZGlzdE5vZGVNb2R1bGVzKVxuXG4gICAgICAgIC8vIGF3YWl0IFByb21pc2UuYWxsKGNvbXBpbGF0aW9ucy5tYXAoY29tcGlsYXRpb24gPT4gY29tcGlsYXRpb24ubG9hZEZpbGUoKSkpXG4gICAgICAgIC8vIGF3YWl0IFByb21pc2UuYWxsKGNvbXBpbGF0aW9ucy5tYXAoY29tcGlsYXRpb24gPT4gY29tcGlsYXRpb24uaW52b2tlUGFyc2VycygpKSlcblxuICAgICAgICAvLyBUT0RPOiBHZXQgYWxsIGZpbGVzXG4gICAgICAgIC8vIENvbXBpbGVyLmNvbXBpbGF0aW9uUG9vbC52YWx1ZXMoKVxuXG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKGNvbXBpbGF0aW9ucy5tYXAoY29tcGlsYXRpb25zID0+IGNvbXBpbGF0aW9ucy5ydW4oKSkpXG5cbiAgICAgICAgaWYgKG1lc3NhZ2VyLmhhc0Vycm9yKCkpIHtcbiAgICAgICAgICAgIG1lc3NhZ2VyLnByaW50RXJyb3IoKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoJ0NvbXBpbGVkJyAsIGAke2ZpbGVzLmxlbmd0aH0gZmlsZXMgaW4gJHtEYXRlLm5vdygpIC0gc3RhcnR1cFRpbWV9bXNgKVxuICAgICAgICAgICAgY29uZmlnLmFua2FDb25maWcuZGVidWcgJiYgbWVzc2FnZXIucHJpbnRJbmZvKClcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHdhdGNoRmlsZXMgKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHdhdGNoZXIgPSB1dGlscy5nZW5GaWxlV2F0Y2hlcihgJHtjb25maWcuc3JjRGlyfS8qKi8qYCwge1xuICAgICAgICAgICAgICAgIGZvbGxvd1N5bWxpbmtzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBpZ25vcmVkOiBjb25maWcuYW5rYUNvbmZpZy5pZ25vcmVkXG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICB3YXRjaGVyLm9uKCdhZGQnLCBhc3luYyAoZmlsZU5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5zdGFydExvYWRpbmcoYENvbXBpbGluZyAke2ZpbGVOYW1lfWApXG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnR1cFRpbWUgPSBEYXRlLm5vdygpXG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZSA9IGF3YWl0IHV0aWxzLmNyZWF0ZUZpbGUoZmlsZU5hbWUpXG5cbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmdlbmVyYXRlQ29tcGlsYXRpb24oZmlsZSkucnVuKClcblxuICAgICAgICAgICAgICAgIGlmIChtZXNzYWdlci5oYXNFcnJvcigpKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VyLnByaW50RXJyb3IoKVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZ2dlci5zdWNjZXNzKCdDb21waWxlZCAnLCBgJHtmaWxlTmFtZX0gaW4gJHtEYXRlLm5vdygpIC0gc3RhcnR1cFRpbWV9bXNgKVxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlci5wcmludEluZm8oKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB3YXRjaGVyLm9uKCd1bmxpbmsnLCBhc3luYyAoZmlsZU5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGZzLnVubGluayhmaWxlTmFtZS5yZXBsYWNlKGNvbmZpZy5zcmNEaXIsIGNvbmZpZy5kaXN0RGlyKSlcblxuICAgICAgICAgICAgICAgICAgICBsb2dnZXIuc3VjY2VzcygnUmVtb3ZlJywgZmlsZU5hbWUpXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcignUmVtb3ZlJywgZmlsZU5hbWUsIGVycilcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgd2F0Y2hlci5vbignY2hhbmdlJywgYXN5bmMgKGZpbGVOYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICBsb2dnZXIuc3RhcnRMb2FkaW5nKGBDb21waWxpbmcgJHtmaWxlTmFtZX1gKVxuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0dXBUaW1lID0gRGF0ZS5ub3coKVxuICAgICAgICAgICAgICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB1dGlscy5jcmVhdGVGaWxlKGZpbGVOYW1lKVxuXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5nZW5lcmF0ZUNvbXBpbGF0aW9uKGZpbGUpLnJ1bigpXG5cbiAgICAgICAgICAgICAgICBpZiAobWVzc2FnZXIuaGFzRXJyb3IoKSkge1xuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlci5wcmludEVycm9yKClcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsb2dnZXIuc3VjY2VzcygnQ29tcGlsZWQnLCBgJHtmaWxlTmFtZX0gaW4gJHtEYXRlLm5vdygpIC0gc3RhcnR1cFRpbWV9bXNgKVxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlci5wcmludEluZm8oKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB3YXRjaGVyLm9uKCdyZWFkeScsICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgICAgICAgICBsb2dnZXIubG9nKCdBbmthIGlzIHdhaXRpbmcgZm9yIGNoYW5nZXMuLi4nKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgbmV3IENvbXBpbGF0aW9uLlxuICAgICAqIEBwYXJhbSBmaWxlXG4gICAgICovXG4gICAgZ2VuZXJhdGVDb21waWxhdGlvbiAoZmlsZTogRmlsZSkge1xuICAgICAgICByZXR1cm4gbmV3IENvbXBpbGF0aW9uKGZpbGUsIHRoaXMuY29uZmlnLCB0aGlzKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1vdW50IHBhcnNlcnMuXG4gICAgICovXG4gICAgaW5pdFBhcnNlcnMgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmNvbmZpZy5hbmthQ29uZmlnLnBhcnNlcnMuZm9yRWFjaCgoeyBtYXRjaCwgcGFyc2VycyB9KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBhcnNlcnMucHVzaCh7XG4gICAgICAgICAgICAgICAgbWF0Y2gsXG4gICAgICAgICAgICAgICAgcGFyc2VyczogcGFyc2Vycy5tYXAoKHsgcGFyc2VyLCBvcHRpb25zIH0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlci5iaW5kKHRoaXMuZ2VuZXJhdGVQYXJzZXJJbmplY3Rpb24ob3B0aW9ucykpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTW91bnQgUGx1Z2lucy5cbiAgICAgKi9cbiAgICBpbml0UGx1Z2lucyAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY29uZmlnLmFua2FDb25maWcucGx1Z2lucy5mb3JFYWNoKCh7IHBsdWdpbiwgb3B0aW9ucyB9KSA9PiB7XG4gICAgICAgICAgICBwbHVnaW4uY2FsbCh0aGlzLmdlbmVyYXRlUGx1Z2luSW5qZWN0aW9uKG9wdGlvbnMpKVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGdlbmVyYXRlUGx1Z2luSW5qZWN0aW9uIChvcHRpb25zOiBQbHVnaW5PcHRpb25zWydvcHRpb25zJ10pOiBQbHVnaW5JbmplY3Rpb24ge1xuICAgICAgICByZXR1cm4gbmV3IFBsdWdpbkluamVjdGlvbih0aGlzLCBvcHRpb25zKVxuICAgIH1cblxuICAgIGdlbmVyYXRlUGFyc2VySW5qZWN0aW9uIChvcHRpb25zOiBQYXJzZXJPcHRpb25zWydvcHRpb25zJ10pOiBQYXJzZXJJbmplY3Rpb24ge1xuICAgICAgICByZXR1cm4gbmV3IFBhcnNlckluamVjdGlvbih0aGlzLCBvcHRpb25zKVxuICAgIH1cbn1cbiIsImltcG9ydCBDb21waWxlciBmcm9tICcuL0NvbXBpbGVyJ1xuXG5leHBvcnQgZGVmYXVsdCBhYnN0cmFjdCBjbGFzcyBDb21tYW5kIHtcbiAgICBwdWJsaWMgY29tbWFuZDogc3RyaW5nXG4gICAgcHVibGljIG9wdGlvbnM6IEFycmF5PEFycmF5PHN0cmluZz4+XG4gICAgcHVibGljIGFsaWFzOiBzdHJpbmdcbiAgICBwdWJsaWMgdXNhZ2U6IHN0cmluZ1xuICAgIHB1YmxpYyBkZXNjcmlwdGlvbjogc3RyaW5nXG4gICAgcHVibGljIGV4YW1wbGVzOiBBcnJheTxzdHJpbmc+XG4gICAgcHVibGljICRjb21waWxlcjogQ29tcGlsZXJcbiAgICBwdWJsaWMgb246IHtcbiAgICAgICAgW2tleTogc3RyaW5nXTogKC4uLmFyZzogYW55W10pID0+IHZvaWRcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvciAoY29tbWFuZDogc3RyaW5nLCBkZXNjPzogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuY29tbWFuZCA9IGNvbW1hbmRcbiAgICAgICAgdGhpcy5vcHRpb25zID0gW11cbiAgICAgICAgdGhpcy5hbGlhcyA9ICcnXG4gICAgICAgIHRoaXMudXNhZ2UgPSAnJ1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gZGVzY1xuICAgICAgICB0aGlzLmV4YW1wbGVzID0gW11cbiAgICAgICAgdGhpcy5vbiA9IHt9XG4gICAgfVxuXG4gICAgYWJzdHJhY3QgYWN0aW9uIChwYXJhbTogc3RyaW5nIHwgQXJyYXk8c3RyaW5nPiwgb3B0aW9uczogT2JqZWN0LCAuLi5vdGhlcjogYW55W10pOiBQcm9taXNlPGFueT4gfCB2b2lkXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplIGFua2EgY29yZSBjb21waWxlclxuICAgICAqL1xuICAgIHByb3RlY3RlZCBpbml0Q29tcGlsZXIgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLiRjb21waWxlciA9IG5ldyBDb21waWxlcigpXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHNldFVzYWdlICh1c2FnZTogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIHRoaXMudXNhZ2UgPSB1c2FnZVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBzZXRPcHRpb25zICguLi5vcHRpb25zOiBBcnJheTxzdHJpbmc+KTogdm9pZCB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5wdXNoKG9wdGlvbnMpXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHNldEV4YW1wbGVzICguLi5leGFtcGxlOiBBcnJheTxzdHJpbmc+KTogdm9pZCB7XG4gICAgICAgIHRoaXMuZXhhbXBsZXMgPSB0aGlzLmV4YW1wbGVzLmNvbmNhdChleGFtcGxlKVxuICAgIH1cblxuICAgIHB1YmxpYyBwcmludFRpdGxlICguLi5hcmc6IEFycmF5PGFueT4pIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1xcclxcbiAnLCAuLi5hcmcsICdcXHJcXG4nKVxuICAgIH1cblxuICAgIHB1YmxpYyBwcmludENvbnRlbnQgKC4uLmFyZzogQXJyYXk8YW55Pikge1xuICAgICAgICBjb25zb2xlLmxvZygnICAgJywgLi4uYXJnKVxuICAgIH1cbn1cbiIsImltcG9ydCBjb25maWcgIGZyb20gJy4uL2NvbmZpZydcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uL3V0aWxzJ1xuaW1wb3J0IHsgQ29tbWFuZCwgQ29tcGlsZXIgfSBmcm9tICcuLi9jb3JlJ1xuaW1wb3J0IG1lc3NhZ2VyIGZyb20gJy4uL3V0aWxzL21lc3NhZ2VyJ1xuXG5leHBvcnQgdHlwZSBEZXZDb21tYW5kT3B0cyA9IE9iamVjdCAmIHt9XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERldkNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHN1cGVyKFxuICAgICAgICAgICAgJ2RldiBbcGFnZXMuLi5dJyxcbiAgICAgICAgICAgICdEZXZlbG9wbWVudCBtb2RlJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRFeGFtcGxlcyhcbiAgICAgICAgICAgICckIGFua2EgZGV2JyxcbiAgICAgICAgICAgICckIGFua2EgZGV2IGluZGV4JyxcbiAgICAgICAgICAgICckIGFua2EgZGV2IC9wYWdlcy9sb2cvbG9nIC9wYWdlcy91c2VyL3VzZXInXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLiRjb21waWxlciA9IG5ldyBDb21waWxlcigpXG4gICAgfVxuXG4gICAgYXN5bmMgYWN0aW9uIChwYWdlcz86IEFycmF5PHN0cmluZz4sIG9wdGlvbnM/OiBEZXZDb21tYW5kT3B0cykge1xuICAgICAgICB0aGlzLiRjb21waWxlci5jb25maWcuYW5rYUNvbmZpZy5kZXZNb2RlID0gdHJ1ZVxuXG4gICAgICAgIHRoaXMuaW5pdENvbXBpbGVyKClcbiAgICAgICAgYXdhaXQgdGhpcy4kY29tcGlsZXIuY2xlYW4oKVxuICAgICAgICBhd2FpdCB0aGlzLiRjb21waWxlci5sYXVuY2goKVxuICAgICAgICBhd2FpdCB0aGlzLiRjb21waWxlci53YXRjaEZpbGVzKClcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgY29uZmlnIGZyb20gJy4uL2NvbmZpZydcbmltcG9ydCB7IGRvd25sb2FkUmVwbywgbG9nZ2VyIH0gZnJvbSAnLi4vdXRpbHMnXG5pbXBvcnQgeyBDb21tYW5kLCBDb21waWxlciB9IGZyb20gJy4uL2NvcmUnXG5cbmV4cG9ydCB0eXBlIEluaXRDb21tYW5kT3B0cyA9IHtcbiAgICByZXBvOiBzdHJpbmdcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSW5pdENvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHN1cGVyKFxuICAgICAgICAgICAgJ2luaXQgPHByb2plY3QtbmFtZT4nLFxuICAgICAgICAgICAgJ0luaXRpYWxpemUgbmV3IHByb2plY3QnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldEV4YW1wbGVzKFxuICAgICAgICAgICAgJyQgYW5rYSBpbml0JyxcbiAgICAgICAgICAgIGAkIGFua2EgaW5pdCBhbmthLWluLWFjdGlvbiAtLXJlcG89JHtjb25maWcuZGVmYXVsdFNjYWZmb2xkfWBcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0T3B0aW9ucyhcbiAgICAgICAgICAgICctciwgLS1yZXBvJyxcbiAgICAgICAgICAgICd0ZW1wbGF0ZSByZXBvc2l0b3J5J1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy4kY29tcGlsZXIgPSBuZXcgQ29tcGlsZXIoKVxuICAgIH1cblxuICAgIGFzeW5jIGFjdGlvbiAocHJvamVjdE5hbWU6IHN0cmluZywgb3B0aW9ucz86IEluaXRDb21tYW5kT3B0cykge1xuICAgICAgICBjb25zdCBwcm9qZWN0ID0gcGF0aC5yZXNvbHZlKGNvbmZpZy5jd2QsIHByb2plY3ROYW1lKVxuICAgICAgICBjb25zdCByZXBvID0gb3B0aW9ucy5yZXBvIHx8IGNvbmZpZy5kZWZhdWx0U2NhZmZvbGRcblxuICAgICAgICBsb2dnZXIuc3RhcnRMb2FkaW5nKCdEb3dubG9hZGluZyB0ZW1wbGF0ZS4uLicpXG4gICAgICAgIGF3YWl0IGRvd25sb2FkUmVwbyhyZXBvLCBwcm9qZWN0KVxuICAgICAgICBsb2dnZXIuc3RvcExvYWRpbmcoKVxuICAgICAgICBsb2dnZXIuc3VjY2VzcygnRG9uZScsIHByb2plY3QpXG4gICAgfVxufVxuIiwiaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi4vdXRpbHMnXG5pbXBvcnQgeyBDb21tYW5kLCBDb21waWxlciB9IGZyb20gJy4uL2NvcmUnXG5cbmV4cG9ydCB0eXBlIERldkNvbW1hbmRPcHRzID0gT2JqZWN0ICYge31cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGV2Q29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgc3VwZXIoXG4gICAgICAgICAgICAncHJvZCcsXG4gICAgICAgICAgICAnUHJvZHVjdGlvbiBtb2RlJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRFeGFtcGxlcyhcbiAgICAgICAgICAgICckIGFua2EgcHJvZCdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuJGNvbXBpbGVyID0gbmV3IENvbXBpbGVyKClcbiAgICB9XG5cbiAgICBhc3luYyBhY3Rpb24gKHBhZ2VzPzogQXJyYXk8c3RyaW5nPiwgb3B0aW9ucz86IERldkNvbW1hbmRPcHRzKSB7XG4gICAgICAgIHRoaXMuJGNvbXBpbGVyLmNvbmZpZy5hbmthQ29uZmlnLmRldk1vZGUgPSBmYWxzZVxuXG4gICAgICAgIGNvbnN0IHN0YXJ0dXBUaW1lID0gRGF0ZS5ub3coKVxuXG4gICAgICAgIHRoaXMuaW5pdENvbXBpbGVyKClcbiAgICAgICAgYXdhaXQgdGhpcy4kY29tcGlsZXIuY2xlYW4oKVxuICAgICAgICBhd2FpdCB0aGlzLiRjb21waWxlci5sYXVuY2goKVxuICAgICAgICBsb2dnZXIuc3VjY2VzcyhgQ29tcGlsZWQgaW4gJHtEYXRlLm5vdygpIC0gc3RhcnR1cFRpbWV9bXNgLCAnSGF2ZSBhIG5pY2UgZGF5IPCfjokgIScpXG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgY29uZmlnICBmcm9tICcuLi9jb25maWcnXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi91dGlscydcbmltcG9ydCB7IENvbW1hbmQsIENvbXBpbGVyIH0gZnJvbSAnLi4vY29yZSdcbmltcG9ydCB7IGRlZmF1bHQgYXMgRnNFZGl0b3JDb25zdHJ1Y3RvciB9IGZyb20gJy4uL3V0aWxzL2VkaXRvcidcblxuaW1wb3J0IHtcbiAgICBDb21waWxlckNvbmZpZ1xufSBmcm9tICcuLi8uLi90eXBlcy90eXBlcydcblxuY29uc3QgeyBsb2dnZXIsIEZzRWRpdG9yIH0gPSB1dGlsc1xuXG5leHBvcnQgdHlwZSBDcmVhdGVQYWdlQ29tbWFuZE9wdHMgPSB7XG4gICAgcm9vdDogc3RyaW5nXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENyZWF0ZVBhZ2VDb21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBzdXBlcihcbiAgICAgICAgICAgICduZXctcGFnZSA8cGFnZXMuLi4+JyxcbiAgICAgICAgICAgICdDcmVhdGUgYSBtaW5pcHJvZ3JhbSBwYWdlJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRFeGFtcGxlcyhcbiAgICAgICAgICAgICckIGFua2EgbmV3LXBhZ2UgaW5kZXgnLFxuICAgICAgICAgICAgJyQgYW5rYSBuZXctcGFnZSAvcGFnZXMvaW5kZXgvaW5kZXgnLFxuICAgICAgICAgICAgJyQgYW5rYSBuZXctcGFnZSAvcGFnZXMvaW5kZXgvaW5kZXggLS1yb290PXBhY2thZ2VBJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRPcHRpb25zKFxuICAgICAgICAgICAgJy1yLCAtLXJvb3QgPHN1YnBhY2thZ2U+JyxcbiAgICAgICAgICAgICdzYXZlIHBhZ2UgdG8gc3VicGFja2FnZXMnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLiRjb21waWxlciA9IG5ldyBDb21waWxlcigpXG4gICAgfVxuXG4gICAgYXN5bmMgYWN0aW9uIChwYWdlcz86IEFycmF5PHN0cmluZz4sIG9wdGlvbnM/OiBDcmVhdGVQYWdlQ29tbWFuZE9wdHMpIHtcbiAgICAgICAgY29uc3Qgcm9vdCA9IG9wdGlvbnMucm9vdFxuICAgICAgICBjb25zdCBlZGl0b3IgPSBuZXcgRnNFZGl0b3IoKVxuXG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHBhZ2VzLm1hcChwYWdlID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdlbmVyYXRlUGFnZShwYWdlLCBlZGl0b3IsIHJvb3QpXG4gICAgICAgIH0pKVxuXG4gICAgICAgIGxvZ2dlci5zdWNjZXNzKCdEb25lJywgJ0hhdmUgYSBuaWNlIGRheSDwn46JICEnKVxuICAgIH1cblxuICAgIGFzeW5jIGdlbmVyYXRlUGFnZSAocGFnZTogc3RyaW5nLCBlZGl0b3I6IEZzRWRpdG9yQ29uc3RydWN0b3IsIHJvb3Q/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgYW5rYUNvbmZpZyxcbiAgICAgICAgICAgIHByb2plY3RDb25maWdcbiAgICAgICAgfSA9IDxDb21waWxlckNvbmZpZz5jb25maWdcbiAgICAgICAgY29uc3QgQ3dkUmVnRXhwID0gbmV3IFJlZ0V4cChgXiR7Y29uZmlnLmN3ZH1gKVxuICAgICAgICBjb25zdCBwYWdlUGF0aCA9IHBhZ2Uuc3BsaXQocGF0aC5zZXApLmxlbmd0aCA9PT0gMSA/XG4gICAgICAgICAgICBwYXRoLmpvaW4oYW5rYUNvbmZpZy5wYWdlcywgcGFnZSwgcGFnZSkgOiBwYWdlXG4gICAgICAgIGNvbnN0IHBhZ2VOYW1lID0gcGF0aC5iYXNlbmFtZShwYWdlUGF0aClcbiAgICAgICAgY29uc3QgY29udGV4dCA9IHtcbiAgICAgICAgICAgIHBhZ2VOYW1lLFxuICAgICAgICAgICAgdGltZTogbmV3IERhdGUoKS50b0xvY2FsZVN0cmluZygpXG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYXBwQ29uZmlnUGF0aCA9IHBhdGguam9pbihjb25maWcuc3JjRGlyLCAnYXBwLmpzb24nKVxuICAgICAgICBsZXQgYWJzb2x1dGVQYXRoID0gY29uZmlnLnNyY0RpclxuXG4gICAgICAgIGlmIChyb290KSB7XG4gICAgICAgICAgICBjb25zdCByb290UGF0aCA9IHBhdGguam9pbihhbmthQ29uZmlnLnN1YlBhY2thZ2VzLCByb290KVxuICAgICAgICAgICAgY29uc3Qgc3ViUGtnID0gcHJvamVjdENvbmZpZy5zdWJQYWNrYWdlcy5maW5kKChwa2c6IGFueSkgPT4gcGtnLnJvb3QgPT09IHJvb3RQYXRoKVxuXG4gICAgICAgICAgICBhYnNvbHV0ZVBhdGggPSBwYXRoLmpvaW4oYWJzb2x1dGVQYXRoLCBhbmthQ29uZmlnLnN1YlBhY2thZ2VzLCByb290LCBwYWdlUGF0aClcblxuICAgICAgICAgICAgaWYgKHN1YlBrZykge1xuICAgICAgICAgICAgICAgIGlmIChzdWJQa2cucGFnZXMuaW5jbHVkZXMocGFnZVBhdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKCdUaGUgcGFnZSBhbHJlYWR5IGV4aXN0cycsIGFic29sdXRlUGF0aClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc3ViUGtnLnBhZ2VzLnB1c2gocGFnZVBhdGgpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwcm9qZWN0Q29uZmlnLnN1YlBhY2thZ2VzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICByb290OiByb290UGF0aCxcbiAgICAgICAgICAgICAgICAgICAgcGFnZXM6IFtwYWdlUGF0aF1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWJzb2x1dGVQYXRoID0gcGF0aC5qb2luKGFic29sdXRlUGF0aCwgcGFnZVBhdGgpXG5cbiAgICAgICAgICAgIGlmIChwcm9qZWN0Q29uZmlnLnBhZ2VzLmluY2x1ZGVzKHBhZ2VQYXRoKSkge1xuICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKCdUaGUgcGFnZSBhbHJlYWR5IGV4aXN0cycsIGFic29sdXRlUGF0aClcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcHJvamVjdENvbmZpZy5wYWdlcy5wdXNoKHBhZ2VQYXRoKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdHBscyA9IGF3YWl0IHV0aWxzLnNlYXJjaEZpbGVzKGAke3BhdGguam9pbihhbmthQ29uZmlnLnRlbXBsYXRlLnBhZ2UsICcqLionKX1gKVxuXG4gICAgICAgIHRwbHMuZm9yRWFjaCh0cGwgPT4ge1xuICAgICAgICAgICAgZWRpdG9yLmNvcHkoXG4gICAgICAgICAgICAgICAgdHBsLFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwYXRoLmRpcm5hbWUoYWJzb2x1dGVQYXRoKSwgcGFnZU5hbWUgKyBwYXRoLmV4dG5hbWUodHBsKSksXG4gICAgICAgICAgICAgICAgY29udGV4dFxuICAgICAgICAgICAgKVxuICAgICAgICB9KVxuICAgICAgICBlZGl0b3Iud3JpdGVKU09OKGFwcENvbmZpZ1BhdGgsIHByb2plY3RDb25maWcsIG51bGwsIDQpXG5cbiAgICAgICAgYXdhaXQgZWRpdG9yLnNhdmUoKVxuXG4gICAgICAgIGxvZ2dlci5zdWNjZXNzKCdDcmVhdGUgcGFnZScsIGFic29sdXRlUGF0aC5yZXBsYWNlKEN3ZFJlZ0V4cCwgJycpKVxuICAgIH1cbn1cbiIsImltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJ1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IGNvbmZpZyAgZnJvbSAnLi4vY29uZmlnJ1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vdXRpbHMnXG5pbXBvcnQgeyBDb21tYW5kLCBDb21waWxlciB9IGZyb20gJy4uL2NvcmUnXG5pbXBvcnQgeyBkZWZhdWx0IGFzIEZzRWRpdG9yQ29uc3RydWN0b3IgfSBmcm9tICcuLi91dGlscy9lZGl0b3InXG5cbmltcG9ydCB7XG4gICAgQ29tcGlsZXJDb25maWdcbn0gZnJvbSAnLi4vLi4vdHlwZXMvdHlwZXMnXG5cbmNvbnN0IHsgbG9nZ2VyLCBGc0VkaXRvciB9ID0gdXRpbHNcblxuZXhwb3J0IHR5cGUgQ3JlYXRlQ29tcG9uZW50Q29tbWFuZE9wdHMgPSB7XG4gICAgcm9vdDogc3RyaW5nXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENyZWF0ZUNvbXBvbmVudENvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHN1cGVyKFxuICAgICAgICAgICAgJ25ldy1jbXB0IDxjb21wb25lbnRzLi4uPicsXG4gICAgICAgICAgICAnQ3JlYXRlIGEgbWluaXByb2dyYW0gY29tcG9uZW50J1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRFeGFtcGxlcyhcbiAgICAgICAgICAgICckIGFua2EgbmV3LWNtcHQgYnV0dG9uJyxcbiAgICAgICAgICAgICckIGFua2EgbmV3LWNtcHQgL2NvbXBvbmVudHMvYnV0dG9uL2J1dHRvbicsXG4gICAgICAgICAgICAnJCBhbmthIG5ldy1jbXB0IC9jb21wb25lbnRzL2J1dHRvbi9idXR0b24gLS1nbG9iYWwnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldE9wdGlvbnMoXG4gICAgICAgICAgICAnLXIsIC0tcm9vdCA8c3VicGFja2FnZT4nLFxuICAgICAgICAgICAgJ3NhdmUgY29tcG9uZW50IHRvIHN1YnBhY2thZ2VzJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy4kY29tcGlsZXIgPSBuZXcgQ29tcGlsZXIoKVxuICAgIH1cblxuICAgIGFzeW5jIGFjdGlvbiAoY29tcG9uZW50cz86IEFycmF5PHN0cmluZz4sIG9wdGlvbnM/OiBDcmVhdGVDb21wb25lbnRDb21tYW5kT3B0cykge1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICByb290XG4gICAgICAgIH0gPSBvcHRpb25zXG4gICAgICAgIGNvbnN0IGVkaXRvciA9IG5ldyBGc0VkaXRvcigpXG5cbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoY29tcG9uZW50cy5tYXAoY29tcG9uZW50ID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdlbmVyYXRlQ29tcG9uZW50KGNvbXBvbmVudCwgZWRpdG9yLCByb290KVxuICAgICAgICB9KSlcblxuICAgICAgICBsb2dnZXIuc3VjY2VzcygnRG9uZScsICdIYXZlIGEgbmljZSBkYXkg8J+OiSAhJylcbiAgICB9XG5cbiAgICBhc3luYyBnZW5lcmF0ZUNvbXBvbmVudCAoY29tcG9uZW50OiBzdHJpbmcsIGVkaXRvcjogRnNFZGl0b3JDb25zdHJ1Y3Rvciwgcm9vdD86IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICBhbmthQ29uZmlnLFxuICAgICAgICAgICAgcHJvamVjdENvbmZpZ1xuICAgICAgICB9ID0gPENvbXBpbGVyQ29uZmlnPmNvbmZpZ1xuICAgICAgICBjb25zdCBDd2RSZWdFeHAgPSBuZXcgUmVnRXhwKGBeJHtjb25maWcuY3dkfWApXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudFBhdGggPSBjb21wb25lbnQuc3BsaXQocGF0aC5zZXApLmxlbmd0aCA9PT0gMSA/XG4gICAgICAgICAgICBwYXRoLmpvaW4oYW5rYUNvbmZpZy5jb21wb25lbnRzLCBjb21wb25lbnQsIGNvbXBvbmVudCkgOlxuICAgICAgICAgICAgY29tcG9uZW50XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudE5hbWUgPSBwYXRoLmJhc2VuYW1lKGNvbXBvbmVudFBhdGgpXG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSB7XG4gICAgICAgICAgICBjb21wb25lbnROYW1lLFxuICAgICAgICAgICAgdGltZTogbmV3IERhdGUoKS50b0xvY2FsZVN0cmluZygpXG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYWJzb2x1dGVQYXRoID0gcm9vdCA/XG4gICAgICAgICAgICBwYXRoLmpvaW4oY29uZmlnLnNyY0RpciwgYW5rYUNvbmZpZy5zdWJQYWNrYWdlcywgcm9vdCwgY29tcG9uZW50UGF0aCkgOlxuICAgICAgICAgICAgcGF0aC5qb2luKGNvbmZpZy5zcmNEaXIsIGNvbXBvbmVudFBhdGgpXG5cbiAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMocGF0aC5qb2luKHBhdGguZGlybmFtZShhYnNvbHV0ZVBhdGgpLCBjb21wb25lbnROYW1lICsgJy5qc29uJykpKSB7XG4gICAgICAgICAgICBsb2dnZXIud2FybignVGhlIGNvbXBvbmVudCBhbHJlYWR5IGV4aXN0cycsIGFic29sdXRlUGF0aClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdHBscyA9IGF3YWl0IHV0aWxzLnNlYXJjaEZpbGVzKGAke3BhdGguam9pbihhbmthQ29uZmlnLnRlbXBsYXRlLmNvbXBvbmVudCwgJyouKicpfWApXG5cbiAgICAgICAgdHBscy5mb3JFYWNoKHRwbCA9PiB7XG4gICAgICAgICAgICBlZGl0b3IuY29weShcbiAgICAgICAgICAgICAgICB0cGwsXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHBhdGguZGlybmFtZShhYnNvbHV0ZVBhdGgpLCBjb21wb25lbnROYW1lICsgcGF0aC5leHRuYW1lKHRwbCkpLFxuICAgICAgICAgICAgICAgIGNvbnRleHRcbiAgICAgICAgICAgIClcbiAgICAgICAgfSlcblxuICAgICAgICBhd2FpdCBlZGl0b3Iuc2F2ZSgpXG5cbiAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoJ0NyZWF0ZSBjb21wb25lbnQnLCBhYnNvbHV0ZVBhdGgucmVwbGFjZShDd2RSZWdFeHAsICcnKSlcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcydcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBjb25maWcgIGZyb20gJy4uL2NvbmZpZydcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uL3V0aWxzJ1xuaW1wb3J0IHsgQ29tbWFuZCwgQ29tcGlsZXIgfSBmcm9tICcuLi9jb3JlJ1xuaW1wb3J0IHsgZGVmYXVsdCBhcyBGc0VkaXRvckNvbnN0cnVjdG9yIH0gZnJvbSAnLi4vdXRpbHMvZWRpdG9yJ1xuXG5pbXBvcnQge1xuICAgIENvbXBpbGVyQ29uZmlnXG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5jb25zdCB7IGxvZ2dlciwgRnNFZGl0b3IgfSA9IHV0aWxzXG5cbmV4cG9ydCB0eXBlIEVucm9sbENvbXBvbmVudENvbW1hbmRPcHRzID0ge1xuICAgIHBhZ2U6IHN0cmluZ1xuICAgIGdsb2JhbDogc3RyaW5nXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEVucm9sbENvbXBvbmVudENvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHN1cGVyKFxuICAgICAgICAgICAgJ2Vucm9sbCA8Y29tcG9uZW50cy4uLj4nLFxuICAgICAgICAgICAgJ0Vucm9sbCBhIG1pbmlwcm9ncmFtIGNvbXBvbmVudCdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0RXhhbXBsZXMoXG4gICAgICAgICAgICAnJCBhbmthIGVucm9sbCBidXR0b24gLS1nbG9iYWwnLFxuICAgICAgICAgICAgJyQgYW5rYSBlbnJvbGwgL2NvbXBvbmVudHMvYnV0dG9uL2J1dHRvbiAtLWdsb2JhbCcsXG4gICAgICAgICAgICAnJCBhbmthIGVucm9sbCAvY29tcG9uZW50cy9idXR0b24vYnV0dG9uIC0tcGFnZT0vcGFnZXMvaW5kZXgvaW5kZXgnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldE9wdGlvbnMoXG4gICAgICAgICAgICAnLXAsIC0tcGFnZSA8cGFnZT4nLFxuICAgICAgICAgICAgJ3doaWNoIHBhZ2UgY29tcG9uZW50cyBlbnJvbGwgdG8nXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldE9wdGlvbnMoXG4gICAgICAgICAgICAnLWcsIC0tZ2xvYmFsJyxcbiAgICAgICAgICAgICdlbnJvbGwgY29tcG9uZW50cyB0byBhcHAuanNvbidcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuJGNvbXBpbGVyID0gbmV3IENvbXBpbGVyKClcbiAgICB9XG5cbiAgICBhc3luYyBhY3Rpb24gKGNvbXBvbmVudHM/OiBBcnJheTxzdHJpbmc+LCBvcHRpb25zPzogRW5yb2xsQ29tcG9uZW50Q29tbWFuZE9wdHMpIHtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgcGFnZSxcbiAgICAgICAgICAgIGdsb2JhbFxuICAgICAgICB9ID0gb3B0aW9uc1xuICAgICAgICBjb25zdCBlZGl0b3IgPSBuZXcgRnNFZGl0b3IoKVxuXG4gICAgICAgIGlmICghZ2xvYmFsICYmICFwYWdlKSB7XG4gICAgICAgICAgICBsb2dnZXIud2FybignV2hlcmUgY29tcG9uZW50cyBlbnJvbGwgdG8/JylcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoY29tcG9uZW50cy5tYXAoY29tcG9uZW50ID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmVucm9sbENvbXBvbmVudChjb21wb25lbnQsIGVkaXRvciwgZ2xvYmFsID8gJycgOiBwYWdlKVxuICAgICAgICB9KSlcblxuICAgICAgICBsb2dnZXIuc3VjY2VzcygnRG9uZScsICdIYXZlIGEgbmljZSBkYXkg8J+OiSAhJylcbiAgICB9XG5cbiAgICBhc3luYyBlbnJvbGxDb21wb25lbnQgKGNvbXBvbmVudDogc3RyaW5nLCBlZGl0b3I6IEZzRWRpdG9yQ29uc3RydWN0b3IsIHBhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgYW5rYUNvbmZpZyxcbiAgICAgICAgICAgIHByb2plY3RDb25maWdcbiAgICAgICAgfSA9IDxDb21waWxlckNvbmZpZz5jb25maWdcbiAgICAgICAgY29uc3QgQ3dkUmVnRXhwID0gbmV3IFJlZ0V4cChgXiR7Y29uZmlnLmN3ZH1gKVxuICAgICAgICBjb25zdCBjb21wb25lbnRQYXRoID0gY29tcG9uZW50LnNwbGl0KHBhdGguc2VwKS5sZW5ndGggPT09IDEgP1xuICAgICAgICAgICAgcGF0aC5qb2luKGFua2FDb25maWcuY29tcG9uZW50cywgY29tcG9uZW50LCBjb21wb25lbnQpIDpcbiAgICAgICAgICAgIGNvbXBvbmVudFxuICAgICAgICBjb25zdCBjb21wb25lbnROYW1lID0gY29tcG9uZW50UGF0aC5zcGxpdChwYXRoLnNlcCkucG9wKClcbiAgICAgICAgY29uc3QgYXBwQ29uZmlnUGF0aCA9IHBhdGguam9pbihjb25maWcuc3JjRGlyLCAnYXBwLmpzb24nKVxuICAgICAgICBjb25zdCBjb21wb25lbnRBYnNQYXRoID0gcGF0aC5qb2luKGNvbmZpZy5zcmNEaXIsIGNvbXBvbmVudFBhdGgpXG5cbiAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHBhdGguam9pbihwYXRoLmRpcm5hbWUoY29tcG9uZW50QWJzUGF0aCksIGNvbXBvbmVudE5hbWUgKyAnLmpzb24nKSkpIHtcbiAgICAgICAgICAgIGxvZ2dlci53YXJuKCdDb21wb25lbnQgZG9zZSBub3QgZXhpc3RzJywgY29tcG9uZW50QWJzUGF0aClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBhZ2UpIHtcbiAgICAgICAgICAgIGNvbnN0IHBhZ2VBYnNQYXRoID0gcGF0aC5qb2luKGNvbmZpZy5zcmNEaXIsIHBhZ2UpXG4gICAgICAgICAgICBjb25zdCBwYWdlSnNvblBhdGggPSBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKHBhZ2VBYnNQYXRoKSwgcGF0aC5iYXNlbmFtZShwYWdlQWJzUGF0aCkgKyAnLmpzb24nKVxuICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHBhZ2VKc29uUGF0aCkpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIud2FybignUGFnZSBkb3NlIG5vdCBleGlzdHMnLCBwYWdlQWJzUGF0aClcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgcGFnZUpzb24gPSA8YW55PkpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHBhZ2VKc29uUGF0aCwge1xuICAgICAgICAgICAgICAgIGVuY29kaW5nOiAndXRmOCdcbiAgICAgICAgICAgIH0pIHx8ICd7fScpXG5cbiAgICAgICAgICAgIHRoaXMuZW5zdXJlVXNpbmdDb21wb25lbnRzKHBhZ2VKc29uKVxuXG4gICAgICAgICAgICBpZiAocGFnZUpzb24udXNpbmdDb21wb25lbnRzW2NvbXBvbmVudE5hbWVdKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLndhcm4oJ0NvbXBvbmVudCBhbHJlYWR5IGVucm9sbGVkIGluJywgcGFnZUFic1BhdGgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHBhZ2VKc29uLnVzaW5nQ29tcG9uZW50c1tjb21wb25lbnROYW1lXSA9IHBhdGgucmVsYXRpdmUocGF0aC5kaXJuYW1lKHBhZ2VBYnNQYXRoKSwgY29tcG9uZW50QWJzUGF0aClcbiAgICAgICAgICAgIGVkaXRvci53cml0ZUpTT04ocGFnZUpzb25QYXRoLCBwYWdlSnNvbilcbiAgICAgICAgICAgIGF3YWl0IGVkaXRvci5zYXZlKClcblxuICAgICAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoYEVucm9sbCAke2NvbXBvbmVudFBhdGh9IGluYCwgcGFnZUFic1BhdGgucmVwbGFjZShDd2RSZWdFeHAsICcnKSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZW5zdXJlVXNpbmdDb21wb25lbnRzKHByb2plY3RDb25maWcpXG5cbiAgICAgICAgICAgIGlmIChwcm9qZWN0Q29uZmlnLnVzaW5nQ29tcG9uZW50c1tjb21wb25lbnROYW1lXSkge1xuICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKCdDb21wb25lbnQgYWxyZWFkeSBlbnJvbGxlZCBpbicsICdhcHAuanNvbicpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByb2plY3RDb25maWcudXNpbmdDb21wb25lbnRzW2NvbXBvbmVudE5hbWVdID0gcGF0aC5yZWxhdGl2ZShwYXRoLmRpcm5hbWUoYXBwQ29uZmlnUGF0aCksIGNvbXBvbmVudEFic1BhdGgpXG4gICAgICAgICAgICBlZGl0b3Iud3JpdGVKU09OKGFwcENvbmZpZ1BhdGgsIHByb2plY3RDb25maWcpXG4gICAgICAgICAgICBhd2FpdCBlZGl0b3Iuc2F2ZSgpXG5cbiAgICAgICAgICAgIGxvZ2dlci5zdWNjZXNzKGBFbnJvbGwgJHtjb21wb25lbnRQYXRofSBpbmAsICdhcHAuanNvbicpXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIGVuc3VyZVVzaW5nQ29tcG9uZW50cyAoY29uZmlnOiBhbnkpIHtcbiAgICAgICAgaWYgKCFjb25maWcudXNpbmdDb21wb25lbnRzKSB7XG4gICAgICAgICAgICBjb25maWcudXNpbmdDb21wb25lbnRzID0ge31cbiAgICAgICAgfVxuICAgIH1cbn1cbiIsImltcG9ydCBEZXYgZnJvbSAnLi9jb21tYW5kcy9kZXYnXG5pbXBvcnQgSW5pdCBmcm9tICcuL2NvbW1hbmRzL2luaXQnXG5pbXBvcnQgUHJvZCBmcm9tICcuL2NvbW1hbmRzL3Byb2QnXG5pbXBvcnQgQ3JlYXRlUGFnZSBmcm9tICcuL2NvbW1hbmRzL2NyZWF0ZVBhZ2UnXG5pbXBvcnQgQ3JlYXRlQ29tcG9uZW50IGZyb20gJy4vY29tbWFuZHMvY3JlYXRlQ29tcG9uZW50J1xuaW1wb3J0IEVucm9sbENvbXBvbmVudCBmcm9tICcuL2NvbW1hbmRzL2Vucm9sbENvbXBvbmVudCdcblxuZXhwb3J0IGRlZmF1bHQgW1xuICAgIG5ldyBQcm9kKCksXG4gICAgbmV3IERldigpLFxuICAgIG5ldyBJbml0KCksXG4gICAgbmV3IENyZWF0ZVBhZ2UoKSxcbiAgICBuZXcgQ3JlYXRlQ29tcG9uZW50KCksXG4gICAgbmV3IEVucm9sbENvbXBvbmVudCgpXG5dXG4iLCJpbXBvcnQgY29uZmlnIGZyb20gJy4vY29uZmlnJ1xuaW1wb3J0ICogYXMgc2VtdmVyIGZyb20gJ3NlbXZlcidcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4vdXRpbHMnXG5pbXBvcnQgKiBhcyBjZm9udHMgZnJvbSAnY2ZvbnRzJ1xuaW1wb3J0IGNvbW1hbmRzIGZyb20gJy4vY29tbWFuZHMnXG5pbXBvcnQgQ29tcGlsZXIgZnJvbSAnLi9jb3JlL2NsYXNzL0NvbXBpbGVyJ1xuXG5jb25zdCBjb21tYW5kZXIgPSByZXF1aXJlKCdjb21tYW5kZXInKVxuY29uc3QgcGtnSnNvbiA9IHJlcXVpcmUoJy4uL3BhY2thZ2UuanNvbicpXG5cbnJlcXVpcmUoJ3NvdXJjZS1tYXAtc3VwcG9ydCcpLmluc3RhbGwoKVxuXG5pZiAoIXNlbXZlci5zYXRpc2ZpZXMoc2VtdmVyLmNsZWFuKHByb2Nlc3MudmVyc2lvbiksIHBrZ0pzb24uZW5naW5lcy5ub2RlKSkge1xuICAgIGxvZ2dlci5lcnJvcignUmVxdWlyZWQgbm9kZSB2ZXJzaW9uICcgKyBwa2dKc29uLmVuZ2luZXMubm9kZSlcbiAgICBwcm9jZXNzLmV4aXQoMSlcbn1cblxuaWYgKHByb2Nlc3MuYXJndi5pbmRleE9mKCctLWRlYnVnJykgPiAtMSkge1xuICAgIGNvbmZpZy5hbmthQ29uZmlnLmRlYnVnID0gdHJ1ZVxufVxuXG5pZiAocHJvY2Vzcy5hcmd2LmluZGV4T2YoJy0tc2xpZW50JykgPiAtMSkge1xuICAgIGNvbmZpZy5hbmthQ29uZmlnLnF1aWV0ID0gdHJ1ZVxufVxuXG5jb21tYW5kZXJcbiAgICAub3B0aW9uKCctLWRlYnVnJywgJ2VuYWJsZSBkZWJ1ZyBtb2RlJylcbiAgICAub3B0aW9uKCctLXF1aWV0JywgJ2hpZGUgY29tcGlsZSBsb2cnKVxuICAgIC52ZXJzaW9uKHBrZ0pzb24udmVyc2lvbilcbiAgICAudXNhZ2UoJzxjb21tYW5kPiBbb3B0aW9uc10nKVxuXG5jb21tYW5kcy5mb3JFYWNoKGNvbW1hbmQgPT4ge1xuICAgIGNvbnN0IGNtZCA9IGNvbW1hbmRlci5jb21tYW5kKGNvbW1hbmQuY29tbWFuZClcblxuICAgIGlmIChjb21tYW5kLmRlc2NyaXB0aW9uKSB7XG4gICAgICAgIGNtZC5kZXNjcmlwdGlvbihjb21tYW5kLmRlc2NyaXB0aW9uKVxuICAgIH1cblxuICAgIGlmIChjb21tYW5kLnVzYWdlKSB7XG4gICAgICAgIGNtZC51c2FnZShjb21tYW5kLnVzYWdlKVxuICAgIH1cblxuICAgIGlmIChjb21tYW5kLm9uKSB7XG4gICAgICAgIGZvciAobGV0IGtleSBpbiBjb21tYW5kLm9uKSB7XG4gICAgICAgICAgICBjbWQub24oa2V5LCBjb21tYW5kLm9uW2tleV0pXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY29tbWFuZC5vcHRpb25zKSB7XG4gICAgICAgIGNvbW1hbmQub3B0aW9ucy5mb3JFYWNoKChvcHRpb246IFthbnksIGFueSwgYW55LCBhbnldKSA9PiB7XG4gICAgICAgICAgICBjbWQub3B0aW9uKC4uLm9wdGlvbilcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAoY29tbWFuZC5hY3Rpb24pIHtcbiAgICAgICAgY21kLmFjdGlvbihhc3luYyAoLi4uYXJncykgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBjb21tYW5kLmFjdGlvbiguLi5hcmdzKVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGlmIChjb21tYW5kLmV4YW1wbGVzKSB7XG4gICAgICAgIGNtZC5vbignLS1oZWxwJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY29tbWFuZC5wcmludFRpdGxlKCdFeGFtcGxlczonKVxuICAgICAgICAgICAgY29tbWFuZC5leGFtcGxlcy5mb3JFYWNoKGV4YW1wbGUgPT4ge1xuICAgICAgICAgICAgICAgIGNvbW1hbmQucHJpbnRDb250ZW50KGV4YW1wbGUpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgIH1cbn0pXG5cbmlmIChwcm9jZXNzLmFyZ3YubGVuZ3RoID09PSAyKSB7XG4gICAgY29uc3QgTG9nbyA9IGNmb250cy5yZW5kZXIoJ0Fua2EnLCB7XG4gICAgICAgIGZvbnQ6ICdzaW1wbGUnLFxuICAgICAgICBjb2xvcnM6IFsnZ3JlZW5CcmlnaHQnXVxuICAgIH0pXG5cbiAgICBjb25zb2xlLmxvZyhMb2dvLnN0cmluZy5yZXBsYWNlKC8oXFxzKykkLywgYCAke3BrZ0pzb24udmVyc2lvbn1cXHJcXG5gKSlcbiAgICBjb21tYW5kZXIub3V0cHV0SGVscCgpXG59XG5cbmNvbW1hbmRlci5wYXJzZShwcm9jZXNzLmFyZ3YpXG5cbmV4cG9ydCBkZWZhdWx0IENvbXBpbGVyXG4iXSwibmFtZXMiOlsicGF0aC5qb2luIiwiZnMuZXhpc3RzU3luYyIsInNhc3MucmVuZGVyIiwicG9zdGNzcyIsInRzbGliXzEuX19hc3NpZ24iLCJiYWJlbC50cmFuc2Zvcm1TeW5jIiwiZnMuZW5zdXJlRmlsZSIsInBvc3Rjc3MucGx1Z2luIiwiaW50ZXJuYWxQbHVnaW5zIiwidHMudHJhbnNwaWxlTW9kdWxlIiwiYmFiZWwucGFyc2UiLCJwYXRoIiwicGF0aC5kaXJuYW1lIiwicGF0aC5yZWxhdGl2ZSIsImN3ZCIsImFua2FEZWZhdWx0Q29uZmlnLnRlbXBsYXRlIiwiYW5rYURlZmF1bHRDb25maWcucGFyc2VycyIsImFua2FEZWZhdWx0Q29uZmlnLnBsdWdpbnMiLCJhbmthRGVmYXVsdENvbmZpZy5pZ25vcmVkIiwicGF0aC5yZXNvbHZlIiwiY3VzdG9tQ29uZmlnIiwic3lzdGVtLnNyY0RpciIsImZzLnJlYWRGaWxlIiwiZnMud3JpdGVGaWxlIiwicGF0aC5iYXNlbmFtZSIsInBhdGguZXh0bmFtZSIsImZzLnJlYWRGaWxlU3luYyIsImxvZyIsImNob2tpZGFyLndhdGNoIiwidHNsaWJfMS5fX2V4dGVuZHMiLCJ1dGlscy5sb2dnZXIiLCJ1dGlscy5jcmVhdGVGaWxlIiwidXRpbHMuYXN5bmNGdW5jdGlvbldyYXBwZXIiLCJ1dGlscy5jYWxsUHJvbWlzZUluQ2hhaW4iLCJwYXRoLnNlcCIsImxvZ2dlciIsInV0aWxzLnNlYXJjaEZpbGVzIiwiZnMuZW5zdXJlRGlyU3luYyIsInV0aWxzLmdlbkZpbGVXYXRjaGVyIiwiZnMudW5saW5rIiwiZG93bmxvYWRSZXBvIiwiRnNFZGl0b3IiLCJjb25maWciLCJQcm9kIiwiRGV2IiwiSW5pdCIsIkNyZWF0ZVBhZ2UiLCJDcmVhdGVDb21wb25lbnQiLCJFbnJvbGxDb21w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
