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
//# sourceMappingURL=resolveConfig.js.map

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
//# sourceMappingURL=sassParser.js.map

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
//# sourceMappingURL=messager.js.map

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
        this.stopLoading();
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
        console.clear();
        this.log(chalk.hex('#333333').bgYellowBright(" " + title.trim() + " "), chalk.grey(msg));
    };
    Logger.prototype.success = function (title, msg) {
        if (title === void 0) { title = ''; }
        if (msg === void 0) { msg = ''; }
        console.clear();
        this.log(chalk.hex('#333333').bgGreenBright(" " + title.trim() + " "), chalk.grey(msg));
    };
    return Logger;
}());
var logger = new Logger();
//# sourceMappingURL=logger.js.map

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
//# sourceMappingURL=babelParser.js.map

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
            compilation.destroy();
            cb();
        });
    });
});
//# sourceMappingURL=index.js.map

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
//# sourceMappingURL=postcssWximport.js.map

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
//# sourceMappingURL=index.js.map

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
//# sourceMappingURL=typescriptParser.js.map

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
//# sourceMappingURL=index.js.map

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
//# sourceMappingURL=ankaDefaultConfig.js.map

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
//# sourceMappingURL=ankaConfig.js.map

var cwd$2 = process.cwd();
var srcDir = path.resolve(cwd$2, ankaConfig.sourceDir);
var distDir = path.resolve(cwd$2, ankaConfig.outputDir);
var ankaModules = path.resolve(srcDir, 'anka_modules');
var sourceNodeModules = path.resolve(cwd$2, 'node_modules');
var distNodeModules = path.resolve(distDir, 'npm_modules');
var defaultScaffold = 'iException/anka-quickstart';
//# sourceMappingURL=systemConfig.js.map

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
//# sourceMappingURL=projectConfig.js.map

var config = tslib_1.__assign({}, systemConfig, { ankaConfig: ankaConfig,
    projectConfig: projectConfig });
//# sourceMappingURL=index.js.map

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
//# sourceMappingURL=fs.js.map

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
    var content = fs$1.readFileSync(sourceFile);
    return new File({
        sourceFile: sourceFile,
        content: content
    });
}
//# sourceMappingURL=createFile.js.map

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
//# sourceMappingURL=editor.js.map

function resolveModule (id, options) {
    try {
        return require.resolve(id, options);
    }
    catch (err) {
        logger.error('Compile', id, new Error("Missing dependency " + id + " in " + options.paths));
    }
}
//# sourceMappingURL=resolveModule.js.map

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
    var result = validate(required);
    return result.validForNewPackages || result.validForOldPackages;
}
//# sourceMappingURL=isNpmDependency.js.map

function downloadRepo$1 (repo, path$$1) {
    return new Promise(function (resolve, reject) {
        downloadRepo(repo, path$$1, { clone: false }, function (err) {
            err ? reject(err) : resolve();
        });
    });
}
//# sourceMappingURL=downloadRepe.js.map

//# sourceMappingURL=index.js.map

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
//# sourceMappingURL=Compilation.js.map

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
                        fs$1.ensureDirSync(config.distNodeModules);
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
//# sourceMappingURL=Command.js.map

//# sourceMappingURL=index.js.map

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
//# sourceMappingURL=dev.js.map

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
//# sourceMappingURL=init.js.map

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
//# sourceMappingURL=prod.js.map

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
//# sourceMappingURL=createPage.js.map

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
//# sourceMappingURL=createComponent.js.map

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
//# sourceMappingURL=enrollComponent.js.map

var commands = [
    new DevCommand$1(),
    new DevCommand(),
    new InitCommand(),
    new CreatePageCommand(),
    new CreateComponentCommand(),
    new EnrollComponentCommand()
];
//# sourceMappingURL=commands.js.map

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
//# sourceMappingURL=index.js.map

module.exports = Compiler;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlscy9yZXNvbHZlQ29uZmlnLnRzIiwiLi4vc3JjL3BhcnNlcnMvc2Fzc1BhcnNlci50cyIsIi4uL3NyYy91dGlscy9tZXNzYWdlci50cyIsIi4uL3NyYy91dGlscy9sb2dnZXIudHMiLCIuLi9zcmMvcGFyc2Vycy9zdHlsZVBhcnNlci9pbmRleC50cyIsIi4uL3NyYy9wYXJzZXJzL2JhYmVsUGFyc2VyLnRzIiwiLi4vc3JjL3BsdWdpbnMvc2F2ZUZpbGVQbHVnaW4vaW5kZXgudHMiLCIuLi9zcmMvcGx1Z2lucy93eEltcG9ydFBsdWdpbi9wb3N0Y3NzV3hpbXBvcnQudHMiLCIuLi9zcmMvcGx1Z2lucy93eEltcG9ydFBsdWdpbi9pbmRleC50cyIsIi4uL3NyYy9wYXJzZXJzL3R5cGVzY3JpcHRQYXJzZXIudHMiLCIuLi9zcmMvcGx1Z2lucy9leHRyYWN0RGVwZW5kZW5jeVBsdWdpbi9pbmRleC50cyIsIi4uL3NyYy9jb25maWcvYW5rYURlZmF1bHRDb25maWcudHMiLCIuLi9zcmMvY29uZmlnL2Fua2FDb25maWcudHMiLCIuLi9zcmMvY29uZmlnL3N5c3RlbUNvbmZpZy50cyIsIi4uL3NyYy9jb25maWcvcHJvamVjdENvbmZpZy50cyIsIi4uL3NyYy9jb25maWcvaW5kZXgudHMiLCIuLi9zcmMvdXRpbHMvZnMudHMiLCIuLi9zcmMvY29yZS9jbGFzcy9GaWxlLnRzIiwiLi4vc3JjL3V0aWxzL2NyZWF0ZUZpbGUudHMiLCIuLi9zcmMvdXRpbHMvZWRpdG9yLnRzIiwiLi4vc3JjL3V0aWxzL3Jlc29sdmVNb2R1bGUudHMiLCIuLi9zcmMvdXRpbHMvY2FsbFByb21pc2VJbkNoYWluLnRzIiwiLi4vc3JjL3V0aWxzL2FzeW5jRnVuY3Rpb25XcmFwcGVyLnRzIiwiLi4vc3JjL3V0aWxzL2dlbkZpbGVXYXRjaGVyLnRzIiwiLi4vc3JjL3V0aWxzL2lzTnBtRGVwZW5kZW5jeS50cyIsIi4uL3NyYy91dGlscy9kb3dubG9hZFJlcGUudHMiLCIuLi9zcmMvY29yZS9jbGFzcy9JbmplY3Rpb24udHMiLCIuLi9zcmMvY29yZS9jbGFzcy9Db21waWxhdGlvbi50cyIsIi4uL3NyYy9jb3JlL2NsYXNzL0NvbXBpbGVyLnRzIiwiLi4vc3JjL2NvcmUvY2xhc3MvQ29tbWFuZC50cyIsIi4uL3NyYy9jb21tYW5kcy9kZXYudHMiLCIuLi9zcmMvY29tbWFuZHMvaW5pdC50cyIsIi4uL3NyYy9jb21tYW5kcy9wcm9kLnRzIiwiLi4vc3JjL2NvbW1hbmRzL2NyZWF0ZVBhZ2UudHMiLCIuLi9zcmMvY29tbWFuZHMvY3JlYXRlQ29tcG9uZW50LnRzIiwiLi4vc3JjL2NvbW1hbmRzL2Vucm9sbENvbXBvbmVudC50cyIsIi4uL3NyYy9jb21tYW5kcy50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcydcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcblxuY29uc3QgY3dkID0gcHJvY2Vzcy5jd2QoKVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAobmFtZXM6IEFycmF5PHN0cmluZz4gPSBbXSwgcm9vdD86IHN0cmluZyk6IE9iamVjdCB7XG4gICAgY29uc3QgZGVmYXVsdFZhbHVlID0ge31cbiAgICBjb25zdCBjb25maWdQYXRocyA9IG5hbWVzLm1hcChuYW1lID0+IHBhdGguam9pbihyb290IHx8IGN3ZCwgbmFtZSkpXG5cbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgY29uZmlnUGF0aHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZ1BhdGggPSBjb25maWdQYXRoc1tpbmRleF1cblxuICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhjb25maWdQYXRoKSkge1xuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihkZWZhdWx0VmFsdWUsIHJlcXVpcmUoY29uZmlnUGF0aCkpXG4gICAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlZmF1bHRWYWx1ZVxufVxuIiwiaW1wb3J0ICogYXMgc2FzcyBmcm9tICdub2RlLXNhc3MnXG5cbmltcG9ydCB7XG4gICAgRmlsZSxcbiAgICBQYXJzZXIsXG4gICAgQ29tcGlsYXRpb24sXG4gICAgUGFyc2VySW5qZWN0aW9uXG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG4vKipcbiAqIFNhc3MgZmlsZSBwYXJzZXIuXG4gKiBAZm9yIGFueSBmaWxlIHRoYXQgZG9lcyBub3QgbWF0Y2hlIHBhcnNlcnMuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IDxQYXJzZXI+ZnVuY3Rpb24gKHRoaXM6IFBhcnNlckluamVjdGlvbiwgZmlsZTogRmlsZSwgY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYWxsYmFjaz86IEZ1bmN0aW9uKSB7XG4gICAgY29uc3QgdXRpbHMgPSB0aGlzLmdldFV0aWxzKClcbiAgICBjb25zdCBjb25maWcgPSB0aGlzLmdldFN5c3RlbUNvbmZpZygpXG5cbiAgICBmaWxlLmNvbnRlbnQgPSBmaWxlLmNvbnRlbnQgaW5zdGFuY2VvZiBCdWZmZXIgPyBmaWxlLmNvbnRlbnQudG9TdHJpbmcoKSA6IGZpbGUuY29udGVudFxuXG4gICAgc2Fzcy5yZW5kZXIoe1xuICAgICAgICBmaWxlOiBmaWxlLnNvdXJjZUZpbGUsXG4gICAgICAgIGRhdGE6IGZpbGUuY29udGVudFxuICAgIH0sIChlcnI6IEVycm9yLCByZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICB1dGlscy5sb2dnZXIuZXJyb3IoJ0NvbXBpbGUnLCBlcnIubWVzc2FnZSwgZXJyKVxuICAgICAgICAgICAgY29tcGlsYXRpb24uZGVzdHJveSgpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmaWxlLmNvbnRlbnQgPSByZXN1bHQuY3NzXG4gICAgICAgICAgICBmaWxlLnVwZGF0ZUV4dCgnLnd4c3MnKVxuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrKClcbiAgICB9KVxufVxuIiwiaW1wb3J0IGxvZ2dlciBmcm9tICcuL2xvZ2dlcidcbmltcG9ydCBhbmthQ29uZmlnIGZyb20gJy4uL2NvbmZpZy9hbmthQ29uZmlnJ1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgZXJyb3JzOiBbXSxcbiAgICBtZXNzYWdlczogW10sXG4gICAgcHVzaCAobXNnOiBPYmplY3QpOiB2b2lkIHtcbiAgICAgICAgaWYgKG1zZyBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLmVycm9ycy5wdXNoKG1zZylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZXMucHVzaChtc2cpXG4gICAgICAgIH1cbiAgICB9LFxuICAgIGNsZWFyICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5lcnJvcnMgPSBbXVxuICAgICAgICB0aGlzLm1lc3NhZ2VzID0gW11cbiAgICB9LFxuICAgIGhhc0Vycm9yICgpOiBCb29sZWFuIHtcbiAgICAgICAgcmV0dXJuICEhdGhpcy5lcnJvcnMubGVuZ3RoXG4gICAgfSxcbiAgICBwcmludEVycm9yICgpOiB2b2lkIHtcbiAgICAgICAgbG9nZ2VyLnN0b3BMb2FkaW5nKClcbiAgICAgICAgY29uc29sZS5jbGVhcigpXG4gICAgICAgIGxvZ2dlci5lcnJvcignRXJyb3InLCBgJHt0aGlzLmVycm9ycy5sZW5ndGh9IGVycm9ycyBvY2N1cnJlZGApXG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMuZXJyb3JzLnBvcCgpLm1lc3NhZ2UpXG4gICAgICAgIHRoaXMuZXJyb3JzLmZvckVhY2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyLm1lc3NhZ2UsICdcXHJcXG5cXHJcXG4nKVxuICAgICAgICAgICAgYW5rYUNvbmZpZy5kZWJ1ZyAmJiBjb25zb2xlLmxvZyhlcnIuc3RhY2spXG4gICAgICAgIH0pXG4gICAgICAgIHRoaXMuZXJyb3JzID0gW11cbiAgICB9LFxuICAgIHByaW50SW5mbyAoKTogdm9pZCB7XG4gICAgICAgIGxvZ2dlci5zdG9wTG9hZGluZygpXG4gICAgICAgIHRoaXMubWVzc2FnZXMuZm9yRWFjaCgoaW5mbzogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8oaW5mbylcbiAgICAgICAgfSlcblxuICAgICAgICB0aGlzLm1lc3NhZ2VzID0gW11cbiAgICB9XG59XG4iLCJpbXBvcnQgY2hhbGsgZnJvbSAnY2hhbGsnXG5pbXBvcnQgbWVzc2FnZXIgZnJvbSAnLi9tZXNzYWdlcidcblxuY29uc3Qgb3JhID0gcmVxdWlyZSgnb3JhJylcblxuZXhwb3J0IGZ1bmN0aW9uIHRvRml4IChudW1iZXI6IG51bWJlcik6IHN0cmluZyB7XG4gICAgcmV0dXJuICgnMDAnICsgbnVtYmVyKS5zbGljZSgtMilcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRUaW1lICgpOiBzdHJpbmcge1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKClcbiAgICByZXR1cm4gYCR7dG9GaXgobm93LmdldEhvdXJzKCkpfToke3RvRml4KG5vdy5nZXRNaW51dGVzKCkpfToke3RvRml4KG5vdy5nZXRTZWNvbmRzKCkpfWBcbn1cblxuZXhwb3J0IGNsYXNzIExvZ2dlciB7XG4gICAgb3JhSW5zdGFuY2U6IGFueVxuXG4gICAgZ2V0IHRpbWUgKCkge1xuICAgICAgICByZXR1cm4gY2hhbGsuZ3JleShgWyR7Z2V0Q3VycmVudFRpbWUoKX1dYClcbiAgICB9XG5cbiAgICBzdGFydExvYWRpbmcgKG1zZzogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMub3JhSW5zdGFuY2UgPSBvcmEobXNnKS5zdGFydCgpXG4gICAgfVxuXG4gICAgc3RvcExvYWRpbmcgKCkge1xuICAgICAgICB0aGlzLm9yYUluc3RhbmNlICYmIHRoaXMub3JhSW5zdGFuY2Uuc3RvcCgpXG4gICAgfVxuXG4gICAgbG9nICguLi5tc2c6IEFycmF5PHN0cmluZz4pIHtcbiAgICAgICAgdGhpcy5zdG9wTG9hZGluZygpXG4gICAgICAgIHJldHVybiBjb25zb2xlLmxvZyhbdGhpcy50aW1lLCAuLi5tc2ddLmpvaW4oJyAnKSlcbiAgICB9XG5cbiAgICBlcnJvciAodGl0bGU6IHN0cmluZyA9ICcnLCBtc2c6IHN0cmluZyA9ICcnLCBlcnI/OiBFcnJvcikge1xuICAgICAgICBpZiAoZXJyID09PSB2b2lkICgwKSkge1xuICAgICAgICAgICAgZXJyID0gbmV3IEVycm9yKCcnKVxuICAgICAgICB9XG4gICAgICAgIGVyci5tZXNzYWdlID0gY2hhbGsuaGV4KCcjMzMzMzMzJykuYmdSZWRCcmlnaHQoYCAke3RpdGxlLnRyaW0oKX0gYCkgKyAnICcgKyBjaGFsay5ncmV5KG1zZykgKyAnXFxyXFxuJyArIGVyci5tZXNzYWdlXG4gICAgICAgIG1lc3NhZ2VyLnB1c2goZXJyKVxuICAgIH1cblxuICAgIGluZm8gKHRpdGxlOiBzdHJpbmcgPSAnJywgbXNnOiBzdHJpbmcgPSAnJykge1xuICAgICAgICBtZXNzYWdlci5wdXNoKHRoaXMudGltZSArICcgJyArIGNoYWxrLnJlc2V0KHRpdGxlKSArICcgJyArIGNoYWxrLmdyZXkobXNnKSlcbiAgICB9XG5cbiAgICB3YXJuICh0aXRsZTogc3RyaW5nID0gJycsIG1zZzogc3RyaW5nID0gJycpIHtcbiAgICAgICAgY29uc29sZS5jbGVhcigpXG4gICAgICAgIHRoaXMubG9nKGNoYWxrLmhleCgnIzMzMzMzMycpLmJnWWVsbG93QnJpZ2h0KGAgJHt0aXRsZS50cmltKCl9IGApLCBjaGFsay5ncmV5KG1zZykpXG4gICAgfVxuXG4gICAgc3VjY2VzcyAodGl0bGU6IHN0cmluZyA9ICcnLCBtc2c6IHN0cmluZyA9ICcnKSB7XG4gICAgICAgIGNvbnNvbGUuY2xlYXIoKVxuICAgICAgICB0aGlzLmxvZyhjaGFsay5oZXgoJyMzMzMzMzMnKS5iZ0dyZWVuQnJpZ2h0KGAgJHt0aXRsZS50cmltKCl9IGApLCBjaGFsay5ncmV5KG1zZykpXG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBuZXcgTG9nZ2VyKClcbiIsImltcG9ydCB7XG4gICAgRmlsZSxcbiAgICBQYXJzZXIsXG4gICAgQ29tcGlsYXRpb24sXG4gICAgUGFyc2VySW5qZWN0aW9uXG59IGZyb20gJy4uLy4uLy4uL3R5cGVzL3R5cGVzJ1xuaW1wb3J0ICogYXMgUG9zdGNzcyBmcm9tICdwb3N0Y3NzJ1xuaW1wb3J0IGxvZ2dlciBmcm9tICcuLi8uLi91dGlscy9sb2dnZXInXG5pbXBvcnQgcG9zdGNzc3JjIGZyb20gJ3Bvc3Rjc3MtbG9hZC1jb25maWcnXG5cbmNvbnN0IHBvc3Rjc3MgPSByZXF1aXJlKCdwb3N0Y3NzJylcbmNvbnN0IHBvc3Rjc3NDb25maWc6IGFueSA9IHt9XG5jb25zdCBpbnRlcm5hbFBsdWdpbnM6IEFycmF5PFBvc3Rjc3MuQWNjZXB0ZWRQbHVnaW4+ID0gW11cbmNvbnN0IHRhc2tzOiBhbnlbXSA9IFtdXG5cbi8vIFRPRE86IEFkZCBuZXcgaG9vazogcHJlc2V0XG5cbi8qKlxuICogU3R5bGUgZmlsZSBwYXJzZXIuXG4gKiBAZm9yIC53eHNzIC5jc3MgPT4gLnd4c3NcbiAqL1xuZXhwb3J0IGRlZmF1bHQgPFBhcnNlcj5mdW5jdGlvbiAodGhpczogUGFyc2VySW5qZWN0aW9uLCBmaWxlOiBGaWxlLCBjb21waWxhdGlvbjogQ29tcGlsYXRpb24sIGNiOiBGdW5jdGlvbik6IHZvaWQge1xuICAgIGlmIChwb3N0Y3NzQ29uZmlnLnBsdWdpbnMpIHtcbiAgICAgICAgZXhlYyhwb3N0Y3NzQ29uZmlnLCBmaWxlLCBjb21waWxhdGlvbiwgY2IpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGFza3MucHVzaCgoKSA9PiB7XG4gICAgICAgICAgICBleGVjKHBvc3Rjc3NDb25maWcsIGZpbGUsIGNvbXBpbGF0aW9uLCBjYilcbiAgICAgICAgfSlcbiAgICB9XG59XG5cbmdlblBvc3Rjc3NDb25maWcoKS50aGVuKChjb25maWc6IGFueSkgPT4ge1xuICAgIHRhc2tzLmZvckVhY2goKHRhc2s6IEZ1bmN0aW9uKSA9PiB0YXNrKCkpXG59KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgIGxvZ2dlci5lcnJvcignbG9hZENvbmZpZycsIGVyci5tZXNzYWdlLCBlcnIpXG59KVxuXG5cbmZ1bmN0aW9uIGV4ZWMgKGNvbmZpZzogYW55LCBmaWxlOiBGaWxlLCBjb21waWxhdGlvbjogQ29tcGlsYXRpb24sIGNiOiBGdW5jdGlvbikge1xuICAgIGZpbGUuY29udmVydENvbnRlbnRUb1N0cmluZygpXG4gICAgcG9zdGNzcyhjb25maWcucGx1Z2lucy5jb25jYXQoaW50ZXJuYWxQbHVnaW5zKSkucHJvY2VzcyhmaWxlLmNvbnRlbnQsIHtcbiAgICAgICAgLi4uY29uZmlnLm9wdGlvbnMsXG4gICAgICAgIGZyb206IGZpbGUuc291cmNlRmlsZVxuICAgIH0gYXMgUG9zdGNzcy5Qcm9jZXNzT3B0aW9ucykudGhlbigocm9vdDogUG9zdGNzcy5SZXN1bHQpID0+IHtcbiAgICAgICAgZmlsZS5jb250ZW50ID0gcm9vdC5jc3NcbiAgICAgICAgZmlsZS5hc3QgPSByb290LnJvb3QudG9SZXN1bHQoKVxuICAgICAgICBmaWxlLnVwZGF0ZUV4dCgnLnd4c3MnKVxuICAgICAgICBjYigpXG4gICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgbG9nZ2VyLmVycm9yKCdDb21waWxlJywgZXJyLm1lc3NhZ2UsIGVycilcbiAgICAgICAgY29tcGlsYXRpb24uZGVzdHJveSgpXG4gICAgICAgIGNiKClcbiAgICB9KVxufVxuXG5mdW5jdGlvbiBnZW5Qb3N0Y3NzQ29uZmlnICh0YXNrczogRnVuY3Rpb25bXSA9IFtdKSB7XG4gICAgcmV0dXJuIHBvc3Rjc3NDb25maWcucGx1Z2lucyA/IFByb21pc2UucmVzb2x2ZShwb3N0Y3NzQ29uZmlnKSA6IHBvc3Rjc3NyYyh7fSkudGhlbigoY29uZmlnOiBhbnkpID0+IHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShPYmplY3QuYXNzaWduKHBvc3Rjc3NDb25maWcsIGNvbmZpZykpXG4gICAgfSlcbn1cbiIsImltcG9ydCAqIGFzIGJhYmVsIGZyb20gJ0BiYWJlbC9jb3JlJ1xuaW1wb3J0IEZpbGUgZnJvbSAnLi4vY29yZS9jbGFzcy9GaWxlJ1xuXG5pbXBvcnQge1xuICAgIFBhcnNlcixcbiAgICBDb21waWxhdGlvbixcbiAgICBQYXJzZXJJbmplY3Rpb25cbn0gZnJvbSAnLi4vLi4vdHlwZXMvdHlwZXMnXG5cbmxldCBiYWJlbENvbmZpZyA9IDxiYWJlbC5UcmFuc2Zvcm1PcHRpb25zPm51bGxcblxuLyoqXG4gKiBTY3JpcHQgRmlsZSBwYXJzZXIuXG4gKiBAZm9yIC5qcyAuZXNcbiAqL1xuZXhwb3J0IGRlZmF1bHQgPFBhcnNlcj5mdW5jdGlvbiAodGhpczogUGFyc2VySW5qZWN0aW9uLCBmaWxlOiBGaWxlLCBjb21waWxhdGlvbjogQ29tcGlsYXRpb24sIGNiOiBGdW5jdGlvbikge1xuICAgIGNvbnN0IHV0aWxzID0gdGhpcy5nZXRVdGlscygpXG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5nZXRTeXN0ZW1Db25maWcoKVxuXG4gICAgaWYgKGZpbGUuaXNJblNyY0Rpcikge1xuICAgICAgICBpZiAoIWJhYmVsQ29uZmlnKSB7XG4gICAgICAgICAgICBiYWJlbENvbmZpZyA9IDxiYWJlbC5UcmFuc2Zvcm1PcHRpb25zPnV0aWxzLnJlc29sdmVDb25maWcoWydiYWJlbC5jb25maWcuanMnXSwgY29uZmlnLmN3ZClcbiAgICAgICAgfVxuXG4gICAgICAgIGZpbGUuY29udmVydENvbnRlbnRUb1N0cmluZygpXG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGJhYmVsLnRyYW5zZm9ybVN5bmMoPHN0cmluZz5maWxlLmNvbnRlbnQsIHtcbiAgICAgICAgICAgICAgICBiYWJlbHJjOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBhc3Q6IHRydWUsXG4gICAgICAgICAgICAgICAgZmlsZW5hbWU6IGZpbGUuc291cmNlRmlsZSxcbiAgICAgICAgICAgICAgICBzb3VyY2VUeXBlOiAnbW9kdWxlJyxcbiAgICAgICAgICAgICAgICBzb3VyY2VNYXBzOiBjb25maWcuYW5rYUNvbmZpZy5kZXZNb2RlLFxuICAgICAgICAgICAgICAgIGNvbW1lbnRzOiBjb25maWcuYW5rYUNvbmZpZy5kZXZNb2RlLFxuICAgICAgICAgICAgICAgIG1pbmlmaWVkOiAhY29uZmlnLmFua2FDb25maWcuZGV2TW9kZSxcbiAgICAgICAgICAgICAgICAuLi5iYWJlbENvbmZpZ1xuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgZmlsZS5zb3VyY2VNYXAgPSBKU09OLnN0cmluZ2lmeShyZXN1bHQubWFwKVxuICAgICAgICAgICAgZmlsZS5jb250ZW50ID0gcmVzdWx0LmNvZGVcbiAgICAgICAgICAgIGZpbGUuYXN0ID0gcmVzdWx0LmFzdFxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbXBpbGF0aW9uLmRlc3Ryb3koKVxuICAgICAgICAgICAgdXRpbHMubG9nZ2VyLmVycm9yKCdDb21waWxlJywgZmlsZS5zb3VyY2VGaWxlLCBlcnIpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmaWxlLnVwZGF0ZUV4dCgnLmpzJylcbiAgICBjYigpXG59XG4iLCJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSdcbmltcG9ydCB7XG4gICAgUGx1Z2luLFxuICAgIENvbXBpbGF0aW9uLFxuICAgIFBsdWdpbkhhbmRsZXIsXG4gICAgUGx1Z2luSW5qZWN0aW9uXG59IGZyb20gJy4uLy4uLy4uL3R5cGVzL3R5cGVzJ1xuY29uc3QgbWluaWZ5SlNPTiA9IHJlcXVpcmUoJ2pzb25taW5pZnknKVxuXG5jb25zdCBpbmxpbmVTb3VyY2VNYXBDb21tZW50ID0gcmVxdWlyZSgnaW5saW5lLXNvdXJjZS1tYXAtY29tbWVudCcpXG5cbmV4cG9ydCBkZWZhdWx0IDxQbHVnaW4+ZnVuY3Rpb24gKHRoaXM6IFBsdWdpbkluamVjdGlvbikge1xuICAgIGNvbnN0IHV0aWxzID0gdGhpcy5nZXRVdGlscygpXG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5nZXRTeXN0ZW1Db25maWcoKVxuICAgIGNvbnN0IHtcbiAgICAgICAgbG9nZ2VyLFxuICAgICAgICB3cml0ZUZpbGVcbiAgICB9ID0gdXRpbHNcblxuICAgIHRoaXMub24oJ3NhdmUnLCA8UGx1Z2luSGFuZGxlcj5mdW5jdGlvbiAoY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYjogRnVuY3Rpb24pIHtcbiAgICAgICAgY29uc3QgZmlsZSA9IGNvbXBpbGF0aW9uLmZpbGVcblxuICAgICAgICAvLyBUT0RPOiBVc2UgbWVtLWZzXG4gICAgICAgIGZzLmVuc3VyZUZpbGUoZmlsZS50YXJnZXRGaWxlKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGlmIChjb25maWcuYW5rYUNvbmZpZy5kZXZNb2RlICYmIGZpbGUuc291cmNlTWFwKSB7XG4gICAgICAgICAgICAgICAgZmlsZS5jb252ZXJ0Q29udGVudFRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICBmaWxlLmNvbnRlbnQgPSBmaWxlLmNvbnRlbnQgKyAnXFxyXFxuXFxyXFxuJyArIGlubGluZVNvdXJjZU1hcENvbW1lbnQoZmlsZS5zb3VyY2VNYXAsIHtcbiAgICAgICAgICAgICAgICAgICAgYmxvY2s6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZXNDb250ZW50OiB0cnVlXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghY29uZmlnLmFua2FDb25maWcuZGV2TW9kZSkge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoZmlsZS5leHRuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNhc2UgJy5qcyc6XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnLmpzb24nOlxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5jb252ZXJ0Q29udGVudFRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuY29udGVudCA9IG1pbmlmeUpTT04oZmlsZS5jb250ZW50KVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gd3JpdGVGaWxlKGZpbGUudGFyZ2V0RmlsZSwgZmlsZS5jb250ZW50KVxuICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGNiKClcbiAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgIGxvZ2dlci5lcnJvcignRXJyb3InLCBlcnIubWVzc2FnZSwgZXJyKVxuICAgICAgICAgICAgY29tcGlsYXRpb24uZGVzdHJveSgpXG4gICAgICAgICAgICBjYigpXG4gICAgICAgIH0pXG4gICAgfSlcbn1cbiIsImltcG9ydCAqIGFzIHBvc3Rjc3MgZnJvbSAncG9zdGNzcydcblxuZXhwb3J0IGRlZmF1bHQgcG9zdGNzcy5wbHVnaW4oJ3Bvc3Rjc3Mtd3hpbXBvcnQnLCAoKSA9PiB7XG4gICAgcmV0dXJuIChyb290OiBwb3N0Y3NzLlJvb3QpID0+IHtcbiAgICAgICAgbGV0IGltcG9ydHM6IEFycmF5PHN0cmluZz4gPSBbXVxuXG4gICAgICAgIHJvb3Qud2Fsa0F0UnVsZXMoJ3d4aW1wb3J0JywgKHJ1bGU6IHBvc3Rjc3MuQXRSdWxlKSA9PiB7XG4gICAgICAgICAgICBpbXBvcnRzLnB1c2gocnVsZS5wYXJhbXMucmVwbGFjZSgvXFwuXFx3Kyg/PVsnXCJdJCkvLCAnLnd4c3MnKSlcbiAgICAgICAgICAgIHJ1bGUucmVtb3ZlKClcbiAgICAgICAgfSlcbiAgICAgICAgcm9vdC5wcmVwZW5kKC4uLmltcG9ydHMubWFwKChpdGVtOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2ltcG9ydCcsXG4gICAgICAgICAgICAgICAgcGFyYW1zOiBpdGVtXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKVxuICAgICAgICBpbXBvcnRzLmxlbmd0aCA9IDBcbiAgICB9XG59KVxuIiwiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnXG5pbXBvcnQge1xuICAgIFBsdWdpbixcbiAgICBDb21waWxhdGlvbixcbiAgICBQbHVnaW5IYW5kbGVyLFxuICAgIFBsdWdpbkluamVjdGlvblxufSBmcm9tICcuLi8uLi8uLi90eXBlcy90eXBlcydcbmltcG9ydCAqIGFzIFBvc3RDU1MgZnJvbSAncG9zdGNzcydcbmltcG9ydCBwb3N0Y3NzV3hJbXBvcnQgZnJvbSAnLi9wb3N0Y3NzV3hpbXBvcnQnXG5cbmNvbnN0IHBvc3Rjc3MgPSByZXF1aXJlKCdwb3N0Y3NzJylcbmNvbnN0IGNzc25hbm8gPSByZXF1aXJlKCdwb3N0Y3NzLW5vcm1hbGl6ZS13aGl0ZXNwYWNlJylcbmNvbnN0IGludGVybmFsUGx1Z2luczogQXJyYXk8UG9zdENTUy5BY2NlcHRlZFBsdWdpbj4gPSBbcG9zdGNzc1d4SW1wb3J0XVxuXG5leHBvcnQgZGVmYXVsdCA8UGx1Z2luPmZ1bmN0aW9uICh0aGlzOiBQbHVnaW5JbmplY3Rpb24pIHtcbiAgICBjb25zdCB1dGlscyA9IHRoaXMuZ2V0VXRpbHMoKVxuICAgIGNvbnN0IHtcbiAgICAgICAgbG9nZ2VyXG4gICAgfSA9IHV0aWxzXG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5nZXRTeXN0ZW1Db25maWcoKVxuICAgIGNvbnN0IHRlc3RTcmNEaXIgPSBuZXcgUmVnRXhwKGBeJHtjb25maWcuc3JjRGlyfWApXG5cbiAgICB0aGlzLm9uKCdiZWZvcmUtY29tcGlsZScsIDxQbHVnaW5IYW5kbGVyPmZ1bmN0aW9uIChjb21waWxhdGlvbjogQ29tcGlsYXRpb24sIGNiOiBGdW5jdGlvbikge1xuICAgICAgICBjb25zdCBmaWxlID0gY29tcGlsYXRpb24uZmlsZVxuXG4gICAgICAgIGlmICghY29uZmlnLmFua2FDb25maWcuZGV2TW9kZSkge1xuICAgICAgICAgICAgaW50ZXJuYWxQbHVnaW5zLnB1c2goY3NzbmFubylcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGhhbmRsZXIgPSBwb3N0Y3NzKGludGVybmFsUGx1Z2lucylcblxuICAgICAgICBpZiAoZmlsZS5leHRuYW1lID09PSAnLnd4c3MnICYmIHRlc3RTcmNEaXIudGVzdChmaWxlLnNvdXJjZUZpbGUpKSB7XG4gICAgICAgICAgICBoYW5kbGVyLnByb2Nlc3MoKGZpbGUuYXN0IHx8IGZpbGUuY29udGVudCkgYXMgc3RyaW5nIHwgeyB0b1N0cmluZyAoKTogc3RyaW5nOyB9IHwgUG9zdENTUy5SZXN1bHQsIHtcbiAgICAgICAgICAgICAgICBmcm9tOiBmaWxlLnNvdXJjZUZpbGVcbiAgICAgICAgICAgIH0gYXMgUG9zdENTUy5Qcm9jZXNzT3B0aW9ucykudGhlbigocm9vdDogUG9zdENTUy5SZXN1bHQpOiB2b2lkID0+IHtcbiAgICAgICAgICAgICAgICBmaWxlLmNvbnRlbnQgPSByb290LmNzc1xuICAgICAgICAgICAgICAgIGZpbGUuYXN0ID0gcm9vdC5yb290LnRvUmVzdWx0KClcbiAgICAgICAgICAgICAgICBjYigpXG4gICAgICAgICAgICB9LCAoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcignRXJyb3InLCBlcnIubWVzc2FnZSwgZXJyKVxuICAgICAgICAgICAgICAgIGNvbXBpbGF0aW9uLmRlc3Ryb3koKVxuICAgICAgICAgICAgICAgIGNiKClcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYigpXG4gICAgICAgIH1cbiAgICB9KVxufVxuIiwiaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCdcblxuaW1wb3J0IHtcbiAgICBGaWxlLFxuICAgIFBhcnNlcixcbiAgICBDb21waWxhdGlvbixcbiAgICBQYXJzZXJJbmplY3Rpb25cbn0gZnJvbSAnLi4vLi4vdHlwZXMvdHlwZXMnXG5cbmxldCB0c0NvbmZpZyA9IDx0cy5UcmFuc3BpbGVPcHRpb25zPm51bGxcblxuLyoqXG4gKiBUeXBlc2NyaXB0IGZpbGUgcGFyc2VyLlxuICpcbiAqIEBmb3IgYW55IGZpbGUgdGhhdCBkb2VzIG5vdCBtYXRjaGUgcGFyc2Vycy5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgPFBhcnNlcj5mdW5jdGlvbiAodGhpczogUGFyc2VySW5qZWN0aW9uLCBmaWxlOiBGaWxlLCBjb21waWxhdGlvbjogQ29tcGlsYXRpb24sIGNhbGxiYWNrPzogRnVuY3Rpb24pIHtcbiAgICBjb25zdCB1dGlscyA9IHRoaXMuZ2V0VXRpbHMoKVxuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuZ2V0U3lzdGVtQ29uZmlnKClcbiAgICBjb25zdCB7IGxvZ2dlciB9ID0gdXRpbHNcblxuICAgIGZpbGUuY29udGVudCA9IGZpbGUuY29udGVudCBpbnN0YW5jZW9mIEJ1ZmZlciA/IGZpbGUuY29udGVudC50b1N0cmluZygpIDogZmlsZS5jb250ZW50XG4gICAgY29uc3Qgc291cmNlTWFwID0gIHtcbiAgICAgICAgc291cmNlc0NvbnRlbnQ6IFtmaWxlLmNvbnRlbnRdXG4gICAgfVxuXG4gICAgaWYgKCF0c0NvbmZpZykge1xuICAgICAgICB0c0NvbmZpZyA9IDx0cy5UcmFuc3BpbGVPcHRpb25zPnV0aWxzLnJlc29sdmVDb25maWcoWyd0c2NvbmZpZy5qc29uJywgJ3RzY29uZmlnLmpzJ10sIGNvbmZpZy5jd2QpXG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gdHMudHJhbnNwaWxlTW9kdWxlKGZpbGUuY29udGVudCwge1xuICAgICAgICBjb21waWxlck9wdGlvbnM6IHRzQ29uZmlnLmNvbXBpbGVyT3B0aW9ucyxcbiAgICAgICAgZmlsZU5hbWU6IGZpbGUuc291cmNlRmlsZVxuICAgIH0pXG5cbiAgICB0cnkge1xuICAgICAgICBmaWxlLmNvbnRlbnQgPSByZXN1bHQub3V0cHV0VGV4dFxuICAgICAgICBpZiAoY29uZmlnLmFua2FDb25maWcuZGV2TW9kZSkge1xuICAgICAgICAgICAgZmlsZS5zb3VyY2VNYXAgPSB7XG4gICAgICAgICAgICAgICAgLi4uSlNPTi5wYXJzZShyZXN1bHQuc291cmNlTWFwVGV4dCksXG4gICAgICAgICAgICAgICAgLi4uc291cmNlTWFwXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZmlsZS51cGRhdGVFeHQoJy5qcycpXG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGxvZ2dlci5lcnJvcignQ29tcGlsZScsIGVyci5tZXNzYWdlLCBlcnIpXG4gICAgICAgIGNvbXBpbGF0aW9uLmRlc3Ryb3koKVxuICAgIH1cblxuICAgIGNhbGxiYWNrKClcbn1cbiIsImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIHQgZnJvbSAnQGJhYmVsL3R5cGVzJ1xuaW1wb3J0ICogYXMgYmFiZWwgZnJvbSAnQGJhYmVsL2NvcmUnXG5pbXBvcnQgdHJhdmVyc2UgZnJvbSAnQGJhYmVsL3RyYXZlcnNlJ1xuaW1wb3J0IGNvZGVHZW5lcmF0b3IgZnJvbSAnQGJhYmVsL2dlbmVyYXRvcidcblxuaW1wb3J0IHtcbiAgICBQbHVnaW4sXG4gICAgQ29tcGlsYXRpb24sXG4gICAgUGx1Z2luSGFuZGxlcixcbiAgICBQbHVnaW5JbmplY3Rpb25cbn0gZnJvbSAnLi4vLi4vLi4vdHlwZXMvdHlwZXMnXG5cbmNvbnN0IGRlcGVuZGVuY3lQb29sID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKVxuY29uc3QgcmVzb3ZsZU1vZHVsZU5hbWUgPSByZXF1aXJlKCdyZXF1aXJlLXBhY2thZ2UtbmFtZScpXG5cbmV4cG9ydCBkZWZhdWx0IDxQbHVnaW4+IGZ1bmN0aW9uICh0aGlzOiBQbHVnaW5JbmplY3Rpb24pIHtcbiAgICBjb25zdCB1dGlscyA9IHRoaXMuZ2V0VXRpbHMoKVxuICAgIGNvbnN0IGNvbXBpbGVyID0gdGhpcy5nZXRDb21waWxlcigpXG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5nZXRTeXN0ZW1Db25maWcoKVxuICAgIGNvbnN0IHRlc3RTcmNEaXIgPSBuZXcgUmVnRXhwKGBeJHtjb25maWcuc3JjRGlyfWApXG4gICAgY29uc3QgdGVzdE5vZGVNb2R1bGVzID0gbmV3IFJlZ0V4cChgXiR7Y29uZmlnLnNvdXJjZU5vZGVNb2R1bGVzfWApXG5cbiAgICB0aGlzLm9uKCdiZWZvcmUtY29tcGlsZScsIGZ1bmN0aW9uIChjb21waWxhdGlvbjogQ29tcGlsYXRpb24sIGNiOiBGdW5jdGlvbikge1xuICAgICAgICBjb25zdCBmaWxlID0gY29tcGlsYXRpb24uZmlsZVxuICAgICAgICBjb25zdCBkZXZNb2RlID0gY29uZmlnLmFua2FDb25maWcuZGV2TW9kZVxuICAgICAgICBjb25zdCBsb2NhbERlcGVuZGVuY3lQb29sID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKVxuXG4gICAgICAgIC8vIE9ubHkgcmVzb2x2ZSBqcyBmaWxlLlxuICAgICAgICBpZiAoZmlsZS5leHRuYW1lID09PSAnLmpzJykge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coZmlsZS5zb3VyY2VGaWxlLCBmaWxlLmFzdCA/ICdvYmplY3QnIDogZmlsZS5hc3QpXG4gICAgICAgICAgICBpZiAoIWZpbGUuYXN0KSB7XG4gICAgICAgICAgICAgICAgZmlsZS5hc3QgPSA8dC5GaWxlPmJhYmVsLnBhcnNlKFxuICAgICAgICAgICAgICAgICAgICBmaWxlLmNvbnRlbnQgaW5zdGFuY2VvZiBCdWZmZXIgPyBmaWxlLmNvbnRlbnQudG9TdHJpbmcoKSA6IGZpbGUuY29udGVudCxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmFiZWxyYzogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VUeXBlOiAnbW9kdWxlJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cmF2ZXJzZSg8dC5Ob2RlPmZpbGUuYXN0LCB7XG4gICAgICAgICAgICAgICAgZW50ZXIgKHBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhdGguaXNJbXBvcnREZWNsYXJhdGlvbigpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBub2RlID0gcGF0aC5ub2RlXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzb3VyY2UgPSBub2RlLnNvdXJjZVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlLnZhbHVlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIHNvdXJjZS52YWx1ZSA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoc291cmNlLCBmaWxlLnNvdXJjZUZpbGUsIGZpbGUudGFyZ2V0RmlsZSwgbG9jYWxEZXBlbmRlbmN5UG9vbClcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXRoLmlzQ2FsbEV4cHJlc3Npb24oKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHBhdGgubm9kZVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2FsbGVlID0gPHQuSWRlbnRpZmllcj5ub2RlLmNhbGxlZVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYXJncyA9IDx0LlN0cmluZ0xpdGVyYWxbXT5ub2RlLmFyZ3VtZW50c1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJncyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxlZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3NbMF0gJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzWzBdLnZhbHVlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGVlLm5hbWUgPT09ICdyZXF1aXJlJyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiBhcmdzWzBdLnZhbHVlID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShhcmdzWzBdLCBmaWxlLnNvdXJjZUZpbGUsIGZpbGUudGFyZ2V0RmlsZSwgbG9jYWxEZXBlbmRlbmN5UG9vbClcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBmaWxlLmNvbnRlbnQgPSBjb2RlR2VuZXJhdG9yKGZpbGUuYXN0LCB7XG4gICAgICAgICAgICAgICAgY29tcGFjdDogIWRldk1vZGUsXG4gICAgICAgICAgICAgICAgbWluaWZpZWQ6ICFkZXZNb2RlXG4gICAgICAgICAgICB9KS5jb2RlXG5cbiAgICAgICAgICAgIGNvbnN0IGRlcGVuZGVuY3lMaXN0ID0gQXJyYXkuZnJvbShsb2NhbERlcGVuZGVuY3lQb29sLmtleXMoKSkuZmlsdGVyKGRlcGVuZGVuY3kgPT4gIWRlcGVuZGVuY3lQb29sLmhhcyhkZXBlbmRlbmN5KSlcblxuICAgICAgICAgICAgUHJvbWlzZS5hbGwoZGVwZW5kZW5jeUxpc3QubWFwKGRlcGVuZGVuY3kgPT4gdHJhdmVyc2VOcG1EZXBlbmRlbmN5KGRlcGVuZGVuY3kpKSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgY2IoKVxuICAgICAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICB1dGlscy5sb2dnZXIuZXJyb3IoZmlsZS5zb3VyY2VGaWxlLCBlcnIubWVzc2FnZSwgZXJyKVxuICAgICAgICAgICAgICAgIGNvbXBpbGF0aW9uLmRlc3Ryb3koKVxuICAgICAgICAgICAgICAgIGNiKClcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYigpXG4gICAgICAgIH1cbiAgICB9IGFzIFBsdWdpbkhhbmRsZXIpXG5cbiAgICBmdW5jdGlvbiByZXNvbHZlIChub2RlOiBhbnksIHNvdXJjZUZpbGU6IHN0cmluZywgdGFyZ2V0RmlsZTogc3RyaW5nLCBsb2NhbERlcGVuZGVuY3lQb29sOiBNYXA8c3RyaW5nLCBzdHJpbmc+KSB7XG4gICAgICAgIGNvbnN0IHNvdXJjZUJhc2VOYW1lID0gcGF0aC5kaXJuYW1lKHNvdXJjZUZpbGUpXG4gICAgICAgIGNvbnN0IHRhcmdldEJhc2VOYW1lID0gcGF0aC5kaXJuYW1lKHRhcmdldEZpbGUpXG4gICAgICAgIGNvbnN0IG1vZHVsZU5hbWUgPSByZXNvdmxlTW9kdWxlTmFtZShub2RlLnZhbHVlKVxuXG4gICAgICAgIGlmICh1dGlscy5pc05wbURlcGVuZGVuY3kobW9kdWxlTmFtZSkgfHwgdGVzdE5vZGVNb2R1bGVzLnRlc3Qoc291cmNlRmlsZSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGRlcGVuZGVuY3kgPSB1dGlscy5yZXNvbHZlTW9kdWxlKG5vZGUudmFsdWUsIHtcbiAgICAgICAgICAgICAgICBwYXRoczogW3NvdXJjZUJhc2VOYW1lXVxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgLy8gSW4gY2FzZSBgcmVxdWlyZSgnYScpYCwgYGFgIGlzIGxvY2FsIGZpbGUgaW4gc3JjIGRpcmVjdG9yeVxuICAgICAgICAgICAgaWYgKCFkZXBlbmRlbmN5IHx8IHRlc3RTcmNEaXIudGVzdChkZXBlbmRlbmN5KSkgcmV0dXJuXG5cbiAgICAgICAgICAgIGNvbnN0IGRpc3RQYXRoID0gZGVwZW5kZW5jeS5yZXBsYWNlKGNvbmZpZy5zb3VyY2VOb2RlTW9kdWxlcywgY29uZmlnLmRpc3ROb2RlTW9kdWxlcylcblxuICAgICAgICAgICAgbm9kZS52YWx1ZSA9IHBhdGgucmVsYXRpdmUodGFyZ2V0QmFzZU5hbWUsIGRpc3RQYXRoKVxuXG4gICAgICAgICAgICBpZiAobG9jYWxEZXBlbmRlbmN5UG9vbC5oYXMoZGVwZW5kZW5jeSkpIHJldHVyblxuICAgICAgICAgICAgbG9jYWxEZXBlbmRlbmN5UG9vbC5zZXQoZGVwZW5kZW5jeSwgZGVwZW5kZW5jeSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGZ1bmN0aW9uIHRyYXZlcnNlTnBtRGVwZW5kZW5jeSAoZGVwZW5kZW5jeTogc3RyaW5nKSB7XG4gICAgICAgIGRlcGVuZGVuY3lQb29sLnNldChkZXBlbmRlbmN5LCBkZXBlbmRlbmN5KVxuICAgICAgICBjb25zdCBmaWxlID0gYXdhaXQgdXRpbHMuY3JlYXRlRmlsZShkZXBlbmRlbmN5KVxuXG4gICAgICAgIGZpbGUudGFyZ2V0RmlsZSA9IGZpbGUuc291cmNlRmlsZS5yZXBsYWNlKGNvbmZpZy5zb3VyY2VOb2RlTW9kdWxlcywgY29uZmlnLmRpc3ROb2RlTW9kdWxlcylcbiAgICAgICAgYXdhaXQgY29tcGlsZXIuZ2VuZXJhdGVDb21waWxhdGlvbihmaWxlKS5ydW4oKVxuICAgIH1cbn1cbiIsIi8vIGltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBzYXNzUGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvc2Fzc1BhcnNlcidcbmltcG9ydCBmaWxlUGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvZmlsZVBhcnNlcidcbmltcG9ydCBzdHlsZVBhcnNlciBmcm9tICcuLi9wYXJzZXJzL3N0eWxlUGFyc2VyJ1xuaW1wb3J0IGJhYmVsUGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvYmFiZWxQYXJzZXInXG5pbXBvcnQgc2NyaXB0UGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvc2NyaXB0UGFyc2VyJ1xuaW1wb3J0IHRlbXBsYXRlUGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvdGVtcGxhdGVQYXJzZXInXG5pbXBvcnQgc2F2ZUZpbGVQbHVnaW4gZnJvbSAnLi4vcGx1Z2lucy9zYXZlRmlsZVBsdWdpbidcbmltcG9ydCB3eEltcG9ydFBsdWdpbiBmcm9tICcuLi9wbHVnaW5zL3d4SW1wb3J0UGx1Z2luJ1xuaW1wb3J0IHR5cGVzY3JpcHRQYXJzZXIgZnJvbSAnLi4vcGFyc2Vycy90eXBlc2NyaXB0UGFyc2VyJ1xuaW1wb3J0IGV4dHJhY3REZXBlbmRlbmN5UGx1Z2luIGZyb20gJy4uL3BsdWdpbnMvZXh0cmFjdERlcGVuZGVuY3lQbHVnaW4nXG5cbmltcG9ydCB7XG4gICAgSWdub3JlZENvbmZpZ3JhdGlvbixcbiAgICBQYXJzZXJzQ29uZmlncmF0aW9uLFxuICAgIFBsdWdpbnNDb25maWdyYXRpb25cbn0gZnJvbSAnLi4vLi4vdHlwZXMvdHlwZXMnXG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogICAgICAgICAgICAgICAgICAgRGFuZ2VyIHpvbmVcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuLyoqXG4gKiBUaGUgcGF0aCB3aGVyZSBXZUNoYXQgbWluaXByb2dyYW0gc291cmNlIGZpbGVzIGV4aXN0LlxuICogQGRlZmF1bHQgJy4vc3JjJ1xuICovXG5leHBvcnQgY29uc3Qgc291cmNlRGlyID0gJy4vc3JjJ1xuXG4vKipcbiAqIFRoZSBwYXRoIHdoZXJlIFdlQ2hhdCBtaW5pcHJvZ3JhbSBjb21waWxlZCBmaWxlcyBleGlzdC5cbiAqIEBkZWZhdWx0ICcuL2Rpc3QnXG4gKi9cbmV4cG9ydCBjb25zdCBvdXRwdXREaXIgPSAnLi9kaXN0J1xuXG4vKipcbiAqIFRoZSBwYXRoIHdoZXJlIFdlQ2hhdCBtaW5pcHJvZ3JhbSBwYWdlcyBleGlzdC5cbiAqIEBkZWZhdWx0ICcuL3NyYy9wYWdlcydcbiAqL1xuZXhwb3J0IGNvbnN0IHBhZ2VzID0gJy4vcGFnZXMnXG5cbi8qKlxuICogVGhlIHBhdGggd2hlcmUgV2VDaGF0IG1pbmlwcm9ncmFtIGNvbXBvbmVudHMgZXhpc3QuXG4gKiBAZGVmYXVsdCAnLi9zcmMvY29tcG9uZW50cydcbiAqL1xuZXhwb3J0IGNvbnN0IGNvbXBvbmVudHMgPSAnLi9jb21wb25lbnRzJ1xuXG4vKipcbiAqIFRlbXBsYXRlIGZvciBjcmVhdGluZyBwYWdlIGFuZCBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCBjb25zdCB0ZW1wbGF0ZSA9IHtcbiAgICBwYWdlOiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vdGVtcGxhdGUvcGFnZScpLFxuICAgIGNvbXBvbmVudDogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL3RlbXBsYXRlL2NvbXBvbmVudCcpXG59XG5cbi8qKlxuICogVGhlIHBhdGggd2hlcmUgV2VDaGF0IG1pbmlwcm9ncmFtIHN1YnBhY2thZ2VzIGV4aXN0LlxuICogQGRlZmF1bHQgJy4vc3JjL3N1YlBhY2thZ2VzJ1xuICovXG5leHBvcnQgY29uc3Qgc3ViUGFja2FnZXMgPSAnLi9zdWJQYWNrYWdlcydcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgICAgICAgICAgICAgICAgQ3VzdG9tIGNvbmZpZ3VyZVxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4vKipcbiAqIFdoZXRoZXIgdG8gb3V0cHV0IGNvbXBpbGUgaW5mb3JtYXRpb24uXG4gKiBAZGVmYXVsdCBmYWxzZVxuICovXG5leHBvcnQgY29uc3QgcXVpZXQgPSBmYWxzZVxuXG4vKipcbiAqIEFua2EgZGV2ZWxvcG1lbnQgbW9kZS5cbiAqIEBkZWZhdWx0IGZhbHNlXG4gKi9cbmV4cG9ydCBjb25zdCBkZXZNb2RlID0gZmFsc2VcblxuLyoqXG4gKiBSZWdpc3RlciBmaWxlIHBhcnNlci5cbiAqL1xuZXhwb3J0IGNvbnN0IHBhcnNlcnM6IFBhcnNlcnNDb25maWdyYXRpb24gPSBbXG4gICAge1xuICAgICAgICBtYXRjaDogLy4qXFwuKGpzfGVzKSQvLFxuICAgICAgICBwYXJzZXJzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGFyc2VyOiBiYWJlbFBhcnNlcixcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB7fVxuICAgICAgICAgICAgfVxuICAgICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG1hdGNoOiAvLipcXC4od3hzc3xjc3N8cG9zdGNzcykkLyxcbiAgICAgICAgcGFyc2VyczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcnNlcjogc3R5bGVQYXJzZXIsXG4gICAgICAgICAgICAgICAgb3B0aW9uczoge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgIH0sXG4gICAge1xuICAgICAgICBtYXRjaDogLy4qXFwuKHNhc3N8c2NzcykkLyxcbiAgICAgICAgcGFyc2VyczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcnNlcjogc2Fzc1BhcnNlcixcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB7fVxuICAgICAgICAgICAgfVxuICAgICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG1hdGNoOiAvLipcXC4odHN8dHlwZXNjcmlwdCkkLyxcbiAgICAgICAgcGFyc2VyczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcnNlcjogdHlwZXNjcmlwdFBhcnNlcixcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB7fVxuICAgICAgICAgICAgfVxuICAgICAgICBdXG4gICAgfVxuXVxuXG4vKipcbiAqIFdoZXRoZXIgdG8gb3V0cHV0IGRlYnVnIGluZm9ybWF0aW9uLlxuICogQGRlZmF1bHQgZmFsc2VcbiAqL1xuZXhwb3J0IGNvbnN0IGRlYnVnOiBib29sZWFuID0gZmFsc2VcblxuLyoqXG4gKiBSZWdpc3RlciBwbHVnaW4uXG4gKi9cbmV4cG9ydCBjb25zdCBwbHVnaW5zOiBQbHVnaW5zQ29uZmlncmF0aW9uID0gW1xuICAgIHtcbiAgICAgICAgcGx1Z2luOiBleHRyYWN0RGVwZW5kZW5jeVBsdWdpbixcbiAgICAgICAgb3B0aW9uczoge31cbiAgICB9LFxuICAgIHtcbiAgICAgICAgcGx1Z2luOiB3eEltcG9ydFBsdWdpbixcbiAgICAgICAgb3B0aW9uczoge31cbiAgICB9LFxuICAgIHtcbiAgICAgICAgcGx1Z2luOiBzYXZlRmlsZVBsdWdpbixcbiAgICAgICAgb3B0aW9uczoge31cbiAgICB9XG5dXG5cbi8qKlxuICogRmlsZXMgdGhhdCB3aWxsIGJlIGlnbm9yZWQgaW4gY29tcGlsYXRpb24uXG4gKi9cbmV4cG9ydCBjb25zdCBpZ25vcmVkOiBJZ25vcmVkQ29uZmlncmF0aW9uID0gW11cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgICAgICAgICAgICAgIGV4cGVyaW1lbnRhbCBjb25maWd1cmVcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuIiwiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IHJlc29sdmVDb25maWcgZnJvbSAnLi4vdXRpbHMvcmVzb2x2ZUNvbmZpZydcbmltcG9ydCAqIGFzIGFua2FEZWZhdWx0Q29uZmlnIGZyb20gJy4vYW5rYURlZmF1bHRDb25maWcnXG5cbmltcG9ydCB7XG4gICAgQW5rYUNvbmZpZ1xufSBmcm9tICcuLi8uLi90eXBlcy90eXBlcydcblxuY29uc3QgY3dkID0gcHJvY2Vzcy5jd2QoKVxuY29uc3QgY3VzdG9tQ29uZmlnID0gPEFua2FDb25maWc+cmVzb2x2ZUNvbmZpZyhbJ2Fua2EuY29uZmlnLmpzJywgJ2Fua2EuY29uZmlnLmpzb24nXSlcblxuZnVuY3Rpb24gbWVyZ2VBcnJheSA8VD4gKC4uLmFycnM6IEFycmF5PFRbXT4pOiBBcnJheTxUPiB7XG4gICAgcmV0dXJuIGFycnMuZmlsdGVyKGFyciA9PiBhcnIgJiYgYXJyLmxlbmd0aCkucmVkdWNlKChwcmV2LCBuZXh0KSA9PiB7XG4gICAgICAgIHJldHVybiBwcmV2LmNvbmNhdChuZXh0KVxuICAgIH0sIFtdKVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgLi4uYW5rYURlZmF1bHRDb25maWcsXG4gICAgLi4uY3VzdG9tQ29uZmlnLFxuICAgIHRlbXBsYXRlOiBjdXN0b21Db25maWcudGVtcGxhdGUgPyB7XG4gICAgICAgIHBhZ2U6IHBhdGguam9pbihjd2QsIGN1c3RvbUNvbmZpZy50ZW1wbGF0ZS5wYWdlKSxcbiAgICAgICAgY29tcG9uZW50OiBwYXRoLmpvaW4oY3dkLCBjdXN0b21Db25maWcudGVtcGxhdGUuY29tcG9uZW50KVxuICAgIH0gOiBhbmthRGVmYXVsdENvbmZpZy50ZW1wbGF0ZSxcbiAgICBwYXJzZXJzOiBtZXJnZUFycmF5KGN1c3RvbUNvbmZpZy5wYXJzZXJzLCBhbmthRGVmYXVsdENvbmZpZy5wYXJzZXJzKSxcbiAgICBwbHVnaW5zOiBtZXJnZUFycmF5KGN1c3RvbUNvbmZpZy5wbHVnaW5zLCBhbmthRGVmYXVsdENvbmZpZy5wbHVnaW5zKSxcbiAgICBpZ25vcmVkOiBtZXJnZUFycmF5KGN1c3RvbUNvbmZpZy5pZ25vcmVkLCBhbmthRGVmYXVsdENvbmZpZy5pZ25vcmVkKVxufVxuIiwiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IGFua2FDb25maWcgZnJvbSAnLi9hbmthQ29uZmlnJ1xuXG5leHBvcnQgY29uc3QgY3dkID0gcHJvY2Vzcy5jd2QoKVxuZXhwb3J0IGNvbnN0IHNyY0RpciA9IHBhdGgucmVzb2x2ZShjd2QsIGFua2FDb25maWcuc291cmNlRGlyKVxuZXhwb3J0IGNvbnN0IGRpc3REaXIgPSBwYXRoLnJlc29sdmUoY3dkLCBhbmthQ29uZmlnLm91dHB1dERpcilcbmV4cG9ydCBjb25zdCBhbmthTW9kdWxlcyA9IHBhdGgucmVzb2x2ZShzcmNEaXIsICdhbmthX21vZHVsZXMnKVxuZXhwb3J0IGNvbnN0IHNvdXJjZU5vZGVNb2R1bGVzID0gcGF0aC5yZXNvbHZlKGN3ZCwgJ25vZGVfbW9kdWxlcycpXG5leHBvcnQgY29uc3QgZGlzdE5vZGVNb2R1bGVzID0gcGF0aC5yZXNvbHZlKGRpc3REaXIsICducG1fbW9kdWxlcycpXG5leHBvcnQgY29uc3QgZGVmYXVsdFNjYWZmb2xkID0gICdpRXhjZXB0aW9uL2Fua2EtcXVpY2tzdGFydCdcbiIsImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJ1xuaW1wb3J0IGFua2FDb25maWcgZnJvbSAnLi9hbmthQ29uZmlnJ1xuaW1wb3J0ICogYXMgc3lzdGVtIGZyb20gJy4vc3lzdGVtQ29uZmlnJ1xuaW1wb3J0IHJlc29sdmVDb25maWcgZnJvbSAnLi4vdXRpbHMvcmVzb2x2ZUNvbmZpZydcblxuY29uc3QgY3VzdG9tQ29uZmlnID0gcmVzb2x2ZUNvbmZpZyhbJ2FwcC5qc29uJ10sIHN5c3RlbS5zcmNEaXIpXG5cbmV4cG9ydCBkZWZhdWx0IE9iamVjdC5hc3NpZ24oe1xuICAgIHBhZ2VzOiBbXSxcbiAgICBzdWJQYWNrYWdlczogW10sXG4gICAgd2luZG93OiB7XG4gICAgICAgIG5hdmlnYXRpb25CYXJUaXRsZVRleHQ6ICdXZWNoYXQnXG4gICAgfVxuICAgIC8vIHRhYkJhcjoge1xuICAgIC8vICAgICBsaXN0OiBbXVxuICAgIC8vIH0sXG59LCBjdXN0b21Db25maWcpXG4iLCJpbXBvcnQgKiBhcyBzeXN0ZW1Db25maWcgZnJvbSAnLi9zeXN0ZW1Db25maWcnXG5pbXBvcnQgYW5rYUNvbmZpZyBmcm9tICcuL2Fua2FDb25maWcnXG5pbXBvcnQgcHJvamVjdENvbmZpZyBmcm9tICcuL3Byb2plY3RDb25maWcnXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICAuLi5zeXN0ZW1Db25maWcsXG4gICAgYW5rYUNvbmZpZyxcbiAgICBwcm9qZWN0Q29uZmlnXG59XG4iLCJpbXBvcnQgKiBhcyBHbG9iIGZyb20gJ2dsb2InXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSdcbmNvbnN0IGdsb2IgPSByZXF1aXJlKCdnbG9iJylcblxuaW1wb3J0IHtcbiAgICBDb250ZW50XG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkRmlsZSAoc291cmNlRmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8QnVmZmVyPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgZnMucmVhZEZpbGUoc291cmNlRmlsZVBhdGgsIChlcnIsIGJ1ZmZlcikgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoYnVmZmVyKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZUZpbGUgKHRhcmdldEZpbGVQYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IENvbnRlbnQpOiBQcm9taXNlPHVuZGVmaW5lZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGZzLndyaXRlRmlsZSh0YXJnZXRGaWxlUGF0aCwgY29udGVudCwgZXJyID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VhcmNoRmlsZXMgKHNjaGVtZTogc3RyaW5nLCBvcHRpb25zPzogR2xvYi5JT3B0aW9ucyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBnbG9iKHNjaGVtZSwgb3B0aW9ucywgKGVycjogKEVycm9yIHwgbnVsbCksIGZpbGVzOiBBcnJheTxzdHJpbmc+KTogdm9pZCA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShmaWxlcylcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9KVxufVxuIiwiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnXG5pbXBvcnQgY29uZmlnIGZyb20gJy4uLy4uL2NvbmZpZydcbmltcG9ydCAqIGFzIHQgZnJvbSAnQGJhYmVsL3R5cGVzJ1xuaW1wb3J0ICogYXMgUG9zdENTUyBmcm9tICdwb3N0Y3NzJ1xuaW1wb3J0IHtcbiAgICBDb250ZW50LFxuICAgIEZpbGVDb25zdHJ1Y3Rvck9wdGlvblxufSBmcm9tICcuLi8uLi8uLi90eXBlcy90eXBlcydcblxuY29uc3QgcmVwbGFjZUV4dCA9IHJlcXVpcmUoJ3JlcGxhY2UtZXh0JylcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRmlsZSB7XG4gICAgcHVibGljIHNvdXJjZUZpbGU6IHN0cmluZ1xuICAgIHB1YmxpYyBjb250ZW50OiBDb250ZW50XG4gICAgcHVibGljIHRhcmdldEZpbGU6IHN0cmluZ1xuICAgIHB1YmxpYyBhc3Q/OiB0Lk5vZGUgfCBQb3N0Q1NTLlJlc3VsdFxuICAgIHB1YmxpYyBzb3VyY2VNYXA/OiBDb250ZW50XG4gICAgcHVibGljIGlzSW5TcmNEaXI/OiBib29sZWFuXG5cbiAgICBjb25zdHJ1Y3RvciAob3B0aW9uOiBGaWxlQ29uc3RydWN0b3JPcHRpb24pIHtcbiAgICAgICAgY29uc3QgaXNJblNyY0RpclRlc3QgPSBuZXcgUmVnRXhwKGBeJHtjb25maWcuc3JjRGlyfWApXG5cbiAgICAgICAgaWYgKCFvcHRpb24uc291cmNlRmlsZSkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHZhbHVlOiBGaWxlQ29uc3RydWN0b3JPcHRpb24uc291cmNlRmlsZScpXG4gICAgICAgIGlmICghb3B0aW9uLmNvbnRlbnQpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCB2YWx1ZTogRmlsZUNvbnN0cnVjdG9yT3B0aW9uLmNvbnRlbnQnKVxuXG4gICAgICAgIHRoaXMuc291cmNlRmlsZSA9IG9wdGlvbi5zb3VyY2VGaWxlXG4gICAgICAgIHRoaXMudGFyZ2V0RmlsZSA9IG9wdGlvbi50YXJnZXRGaWxlIHx8IG9wdGlvbi5zb3VyY2VGaWxlLnJlcGxhY2UoY29uZmlnLnNyY0RpciwgY29uZmlnLmRpc3REaXIpIC8vIERlZmF1bHQgdmFsdWVcbiAgICAgICAgdGhpcy5jb250ZW50ID0gb3B0aW9uLmNvbnRlbnRcbiAgICAgICAgdGhpcy5zb3VyY2VNYXAgPSBvcHRpb24uc291cmNlTWFwXG4gICAgICAgIHRoaXMuaXNJblNyY0RpciA9IGlzSW5TcmNEaXJUZXN0LnRlc3QodGhpcy5zb3VyY2VGaWxlKVxuICAgIH1cblxuICAgIGdldCBkaXJuYW1lICgpIHtcbiAgICAgICAgcmV0dXJuIHBhdGguZGlybmFtZSh0aGlzLnRhcmdldEZpbGUpXG4gICAgfVxuXG4gICAgZ2V0IGJhc2VuYW1lICgpIHtcbiAgICAgICAgcmV0dXJuIHBhdGguYmFzZW5hbWUodGhpcy50YXJnZXRGaWxlKVxuICAgIH1cblxuICAgIGdldCBleHRuYW1lICgpIHtcbiAgICAgICAgcmV0dXJuIHBhdGguZXh0bmFtZSh0aGlzLnRhcmdldEZpbGUpXG4gICAgfVxuXG4gICAgYXN5bmMgc2F2ZVRvIChwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgYXdhaXQgZnMuZW5zdXJlRmlsZShwYXRoKVxuXG4gICAgICAgIGlmICghcGF0aCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHBhdGgnKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlRXh0IChleHQ6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICB0aGlzLnRhcmdldEZpbGUgPSByZXBsYWNlRXh0KHRoaXMudGFyZ2V0RmlsZSwgZXh0KVxuICAgIH1cblxuICAgIGNvbnZlcnRDb250ZW50VG9TdHJpbmcgKCkge1xuICAgICAgICBpZiAodGhpcy5jb250ZW50IGluc3RhbmNlb2YgQnVmZmVyKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRlbnQgPSB0aGlzLmNvbnRlbnQudG9TdHJpbmcoKVxuICAgICAgICB9XG4gICAgfVxufVxuIiwiaW1wb3J0IHtcbiAgICByZWFkRmlsZVxufSBmcm9tICcuL2ZzJ1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnXG5pbXBvcnQgRmlsZSBmcm9tICcuLi9jb3JlL2NsYXNzL0ZpbGUnXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVGaWxlIChzb3VyY2VGaWxlOiBzdHJpbmcpOiBQcm9taXNlPEZpbGU+IHtcbiAgICByZXR1cm4gcmVhZEZpbGUoc291cmNlRmlsZSkudGhlbihjb250ZW50ID0+IHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgRmlsZSh7XG4gICAgICAgICAgICBzb3VyY2VGaWxlLFxuICAgICAgICAgICAgY29udGVudFxuICAgICAgICB9KSlcbiAgICB9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRmlsZVN5bmMgKHNvdXJjZUZpbGU6IHN0cmluZykge1xuICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoc291cmNlRmlsZSlcbiAgICByZXR1cm4gbmV3IEZpbGUoe1xuICAgICAgICBzb3VyY2VGaWxlLFxuICAgICAgICBjb250ZW50XG4gICAgfSlcbn1cbiIsImltcG9ydCB7IE9wdGlvbnMgYXMgVGVtcGxhdGVPcHRpb25zIH0gZnJvbSAnZWpzJ1xuaW1wb3J0IHsgbWVtRnNFZGl0b3IgYXMgTWVtRnNFZGl0b3IgfSBmcm9tICdtZW0tZnMtZWRpdG9yJ1xuXG5jb25zdCBtZW1GcyA9IHJlcXVpcmUoJ21lbS1mcycpXG5jb25zdCBtZW1Gc0VkaXRvciA9IHJlcXVpcmUoJ21lbS1mcy1lZGl0b3InKVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGc0VkaXRvciB7XG4gICAgZWRpdG9yOiBNZW1Gc0VkaXRvci5FZGl0b3JcblxuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgY29uc3Qgc3RvcmUgPSBtZW1Gcy5jcmVhdGUoKVxuXG4gICAgICAgIHRoaXMuZWRpdG9yID0gbWVtRnNFZGl0b3IuY3JlYXRlKHN0b3JlKVxuICAgIH1cblxuICAgIGNvcHkgKGZyb206IHN0cmluZywgdG86IHN0cmluZywgY29udGV4dDogb2JqZWN0LCB0ZW1wbGF0ZU9wdGlvbnM/OiBUZW1wbGF0ZU9wdGlvbnMsIGNvcHlPcHRpb25zPzogTWVtRnNFZGl0b3IuQ29weU9wdGlvbnMpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5lZGl0b3IuY29weVRwbChmcm9tLCB0bywgY29udGV4dCwgdGVtcGxhdGVPcHRpb25zLCBjb3B5T3B0aW9ucylcbiAgICB9XG5cbiAgICB3cml0ZSAoZmlsZXBhdGg6IHN0cmluZywgY29udGVudHM6IE1lbUZzRWRpdG9yLkNvbnRlbnRzKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZWRpdG9yLndyaXRlKGZpbGVwYXRoLCBjb250ZW50cylcbiAgICB9XG5cbiAgICB3cml0ZUpTT04gKGZpbGVwYXRoOiBzdHJpbmcsIGNvbnRlbnRzOiBhbnksIHJlcGxhY2VyPzogTWVtRnNFZGl0b3IuUmVwbGFjZXJGdW5jLCBzcGFjZT86IE1lbUZzRWRpdG9yLlNwYWNlKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZWRpdG9yLndyaXRlSlNPTihmaWxlcGF0aCwgY29udGVudHMsIHJlcGxhY2VyIHx8IG51bGwsIHNwYWNlID0gNClcbiAgICB9XG5cbiAgICByZWFkIChmaWxlcGF0aDogc3RyaW5nLCBvcHRpb25zPzogeyByYXc6IGJvb2xlYW4sIGRlZmF1bHRzOiBzdHJpbmcgfSk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLmVkaXRvci5yZWFkKGZpbGVwYXRoLCBvcHRpb25zKVxuICAgIH1cblxuICAgIHJlYWRKU09OIChmaWxlcGF0aDogc3RyaW5nLCBkZWZhdWx0cz86IGFueSk6IHZvaWQge1xuICAgICAgICB0aGlzLmVkaXRvci5yZWFkSlNPTihmaWxlcGF0aCwgZGVmYXVsdHMpXG4gICAgfVxuXG4gICAgc2F2ZSAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgdGhpcy5lZGl0b3IuY29tbWl0KHJlc29sdmUpXG4gICAgICAgIH0pXG4gICAgfVxufVxuIiwiaW1wb3J0IGxvZyBmcm9tICcuL2xvZ2dlcidcbmltcG9ydCBhbmthQ29uZmlnIGZyb20gJy4uL2NvbmZpZy9hbmthQ29uZmlnJ1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAoaWQ6IHN0cmluZywgb3B0aW9ucz86IHsgcGF0aHM/OiBzdHJpbmdbXSB9KTogc3RyaW5nIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gcmVxdWlyZS5yZXNvbHZlKGlkLCBvcHRpb25zKVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBsb2cuZXJyb3IoJ0NvbXBpbGUnLCBpZCwgbmV3IEVycm9yKGBNaXNzaW5nIGRlcGVuZGVuY3kgJHtpZH0gaW4gJHtvcHRpb25zLnBhdGhzfWApKVxuICAgIH1cbn1cbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNhbGxQcm9taXNlSW5DaGFpbiAobGlzdDogQXJyYXk8KC4uLnBhcmFtczogYW55W10pID0+IFByb21pc2U8YW55Pj4gPSBbXSwgLi4ucGFyYW1zOiBBcnJheTxhbnk+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgaWYgKCFsaXN0Lmxlbmd0aCkgIHtcbiAgICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgbGV0IHN0ZXAgPSBsaXN0WzBdKC4uLnBhcmFtcylcblxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHN0ZXAgPSBzdGVwLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsaXN0W2ldKC4uLnBhcmFtcylcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICBzdGVwLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICB9LCBlcnIgPT4ge1xuICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgfSlcbiAgICB9KVxufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKGZuOiBGdW5jdGlvbik6ICgpID0+IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBmdW5jdGlvbiAoLi4ucGFyYW1zOiBBcnJheTxhbnk+KSB7XG4gICAgICAgIGNvbnN0IGxpbWl0YXRpb24gPSBwYXJhbXMubGVuZ3RoXG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgaWYgKGZuLmxlbmd0aCA+IGxpbWl0YXRpb24pIHtcbiAgICAgICAgICAgICAgICBmbiguLi5wYXJhbXMsIHJlc29sdmUpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoZm4oLi4ucGFyYW1zKSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBjaG9raWRhciBmcm9tICdjaG9raWRhcidcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKGRpcjogc3RyaW5nIHwgc3RyaW5nW10sIG9wdGlvbnM/OiBjaG9raWRhci5XYXRjaE9wdGlvbnMpOiBjaG9raWRhci5GU1dhdGNoZXIge1xuICAgIHJldHVybiBjaG9raWRhci53YXRjaChkaXIsIHtcbiAgICAgICAgcGVyc2lzdGVudDogdHJ1ZSxcbiAgICAgICAgaWdub3JlSW5pdGlhbDogdHJ1ZSxcbiAgICAgICAgLi4ub3B0aW9uc1xuICAgIH0pXG59XG4iLCJkZWNsYXJlIHR5cGUgVmFsaWRhdGVOcG1QYWNrYWdlTmFtZSA9IHtcbiAgICB2YWxpZEZvck5ld1BhY2thZ2VzOiBib29sZWFuLFxuICAgIHZhbGlkRm9yT2xkUGFja2FnZXM6IGJvb2xlYW5cbn1cblxuY29uc3QgdmFsaWRhdGUgPSByZXF1aXJlKCd2YWxpZGF0ZS1ucG0tcGFja2FnZS1uYW1lJylcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKHJlcXVpcmVkOiBzdHJpbmcgPSAnJyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IDxWYWxpZGF0ZU5wbVBhY2thZ2VOYW1lPnZhbGlkYXRlKHJlcXVpcmVkKVxuXG4gICAgcmV0dXJuIHJlc3VsdC52YWxpZEZvck5ld1BhY2thZ2VzIHx8IHJlc3VsdC52YWxpZEZvck9sZFBhY2thZ2VzXG59XG4iLCJpbXBvcnQgZG93bmxvYWRSZXBvIGZyb20gJ2Rvd25sb2FkLWdpdC1yZXBvJ1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAocmVwbzogc3RyaW5nLCBwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBkb3dubG9hZFJlcG8ocmVwbywgcGF0aCwgeyBjbG9uZTogZmFsc2UgfSwgKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgIGVyciA/IHJlamVjdChlcnIpIDogcmVzb2x2ZSgpXG4gICAgICAgIH0pXG4gICAgfSlcbn1cbiIsImltcG9ydCBDb21waWxlciBmcm9tICcuL0NvbXBpbGVyJ1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuLi8uLi9jb25maWcnXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi8uLi91dGlscydcblxuaW1wb3J0IHtcbiAgICBVdGlscyxcbiAgICBBbmthQ29uZmlnLFxuICAgIFBhcnNlck9wdGlvbnMsXG4gICAgUHJvamVjdENvbmZpZyxcbiAgICBQbHVnaW5IYW5kbGVyLFxuICAgIFBsdWdpbk9wdGlvbnMsXG4gICAgQ29tcGlsZXJDb25maWdcbn0gZnJvbSAnLi4vLi4vLi4vdHlwZXMvdHlwZXMnXG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBJbmplY3Rpb24ge1xuICAgIGNvbXBpbGVyOiBDb21waWxlclxuICAgIG9wdGlvbnM6IG9iamVjdFxuXG4gICAgY29uc3RydWN0b3IgKGNvbXBpbGVyOiBDb21waWxlciwgb3B0aW9ucz86IG9iamVjdCkge1xuICAgICAgICB0aGlzLmNvbXBpbGVyID0gY29tcGlsZXJcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9uc1xuICAgIH1cblxuICAgIGFic3RyYWN0IGdldE9wdGlvbnMgKCk6IG9iamVjdFxuXG4gICAgZ2V0Q29tcGlsZXIgKCk6IENvbXBpbGVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcGlsZXJcbiAgICB9XG5cbiAgICBnZXRVdGlscyAoKSB7XG4gICAgICAgIHJldHVybiB1dGlsc1xuICAgIH1cblxuICAgIGdldEFua2FDb25maWcgKCk6IEFua2FDb25maWcge1xuICAgICAgICByZXR1cm4gY29uZmlnLmFua2FDb25maWdcbiAgICB9XG5cbiAgICBnZXRTeXN0ZW1Db25maWcgKCk6IENvbXBpbGVyQ29uZmlnIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZ1xuICAgIH1cblxuICAgIGdldFByb2plY3RDb25maWcgKCk6IFByb2plY3RDb25maWcge1xuICAgICAgICByZXR1cm4gY29uZmlnLnByb2plY3RDb25maWdcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBQbHVnaW5JbmplY3Rpb24gZXh0ZW5kcyBJbmplY3Rpb24ge1xuXG4gICAgY29uc3RydWN0b3IgKGNvbXBpbGVyOiBDb21waWxlciwgb3B0aW9uczogUGx1Z2luT3B0aW9uc1snb3B0aW9ucyddKSB7XG4gICAgICAgIHN1cGVyKGNvbXBpbGVyLCBvcHRpb25zKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybiBQbHVnaW4gb3B0aW9uc1xuICAgICAqL1xuICAgIGdldE9wdGlvbnMgKCk6IG9iamVjdCB7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMgfHwge31cbiAgICB9XG5cbiAgICBvbiAoZXZlbnQ6IHN0cmluZywgaGFuZGxlcjogUGx1Z2luSGFuZGxlcik6IHZvaWQge1xuICAgICAgICB0aGlzLmNvbXBpbGVyLm9uKGV2ZW50LCBoYW5kbGVyKVxuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFBhcnNlckluamVjdGlvbiBleHRlbmRzIEluamVjdGlvbiB7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gUGFyc2VyT3B0aW9uc1xuICAgICAqL1xuICAgIGdldE9wdGlvbnMgKCk6IG9iamVjdCB7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMgfHwge31cbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvciAoY29tcGlsZXI6IENvbXBpbGVyLCBvcHRpb25zOiBQYXJzZXJPcHRpb25zWydvcHRpb25zJ10pIHtcbiAgICAgICAgc3VwZXIoY29tcGlsZXIsIG9wdGlvbnMpXG4gICAgfVxufVxuIiwiaW1wb3J0IEZpbGUgZnJvbSAnLi9GaWxlJ1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuLi8uLi9jb25maWcnXG5pbXBvcnQgQ29tcGlsZXIgZnJvbSAnLi9Db21waWxlcidcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uLy4uL3V0aWxzJ1xuXG5pbXBvcnQge1xuICAgIFBhcnNlcixcbiAgICBNYXRjaGVyLFxuICAgIFBsdWdpbkhhbmRsZXIsXG4gICAgUGx1Z2luT3B0aW9ucyxcbiAgICBDb21waWxlckNvbmZpZ1xufSBmcm9tICcuLi8uLi8uLi90eXBlcy90eXBlcydcbmltcG9ydCBtZXNzYWdlciBmcm9tICcuLi8uLi91dGlscy9tZXNzYWdlcidcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uLy4uL3V0aWxzJ1xuXG4vKipcbiAqIEEgY29tcGlsYXRpb24gdGFza1xuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb21waWxhdGlvbiB7XG4gICAgY29uZmlnOiBDb21waWxlckNvbmZpZ1xuICAgIHJlYWRvbmx5IGNvbXBpbGVyOiBDb21waWxlclxuICAgIGlkOiBudW1iZXIgICAgICAgIC8vIFVuaXF1Ze+8jGZvciBlYWNoIENvbXBpbGF0aW9uXG4gICAgZmlsZTogRmlsZVxuICAgIHNvdXJjZUZpbGU6IHN0cmluZ1xuICAgIGRlc3Ryb3llZDogYm9vbGVhblxuXG4gICAgY29uc3RydWN0b3IgKGZpbGU6IEZpbGUgfCBzdHJpbmcsIGNvbmY6IENvbXBpbGVyQ29uZmlnLCBjb21waWxlcjogQ29tcGlsZXIpIHtcbiAgICAgICAgdGhpcy5jb21waWxlciA9IGNvbXBpbGVyXG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZlxuICAgICAgICB0aGlzLmlkID0gQ29tcGlsZXIuY29tcGlsYXRpb25JZCsrXG5cbiAgICAgICAgaWYgKGZpbGUgaW5zdGFuY2VvZiBGaWxlKSB7XG4gICAgICAgICAgICB0aGlzLmZpbGUgPSBmaWxlXG4gICAgICAgICAgICB0aGlzLnNvdXJjZUZpbGUgPSBmaWxlLnNvdXJjZUZpbGVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc291cmNlRmlsZSA9IGZpbGVcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZW5yb2xsKClcbiAgICB9XG5cbiAgICBhc3luYyBydW4gKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5sb2FkRmlsZSgpXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmludm9rZVBhcnNlcnMoKVxuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlKClcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdGhpcy5kZXN0cm95KClcbiAgICAgICAgICAgIHV0aWxzLmxvZ2dlci5lcnJvcignQ29tcGlsZScsIGUubWVzc2FnZSwgZSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGxvYWRGaWxlICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKHRoaXMuZGVzdHJveWVkKSByZXR1cm5cblxuICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGVyLmVtaXQoJ2JlZm9yZS1sb2FkLWZpbGUnLCB0aGlzKVxuICAgICAgICBpZiAoISh0aGlzLmZpbGUgaW5zdGFuY2VvZiBGaWxlKSkge1xuICAgICAgICAgICAgdGhpcy5maWxlID0gYXdhaXQgdXRpbHMuY3JlYXRlRmlsZSh0aGlzLnNvdXJjZUZpbGUpXG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGVyLmVtaXQoJ2FmdGVyLWxvYWQtZmlsZScsIHRoaXMpXG4gICAgfVxuXG4gICAgYXN5bmMgaW52b2tlUGFyc2VycyAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICh0aGlzLmRlc3Ryb3llZCkgcmV0dXJuXG5cbiAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuZmlsZVxuICAgICAgICBjb25zdCBwYXJzZXJzID0gPFBhcnNlcltdPnRoaXMuY29tcGlsZXIucGFyc2Vycy5maWx0ZXIoKG1hdGNoZXJzOiBNYXRjaGVyKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hlcnMubWF0Y2gudGVzdChmaWxlLnNvdXJjZUZpbGUpXG4gICAgICAgIH0pLm1hcCgobWF0Y2hlcnM6IE1hdGNoZXIpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBtYXRjaGVycy5wYXJzZXJzXG4gICAgICAgIH0pLnJlZHVjZSgocHJldiwgbmV4dCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHByZXYuY29uY2F0KG5leHQpXG4gICAgICAgIH0sIFtdKVxuICAgICAgICBjb25zdCB0YXNrcyA9IHBhcnNlcnMubWFwKHBhcnNlciA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdXRpbHMuYXN5bmNGdW5jdGlvbldyYXBwZXIocGFyc2VyKVxuICAgICAgICB9KVxuXG4gICAgICAgIGF3YWl0IHRoaXMuY29tcGlsZXIuZW1pdCgnYmVmb3JlLXBhcnNlJywgdGhpcylcbiAgICAgICAgYXdhaXQgdXRpbHMuY2FsbFByb21pc2VJbkNoYWluKHRhc2tzLCBmaWxlLCB0aGlzKVxuICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGVyLmVtaXQoJ2FmdGVyLXBhcnNlJywgdGhpcylcbiAgICB9XG5cbiAgICBhc3luYyBjb21waWxlICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKHRoaXMuZGVzdHJveWVkKSByZXR1cm5cblxuICAgICAgICAvLyBJbnZva2UgRXh0cmFjdERlcGVuZGVuY3lQbHVnaW4uXG4gICAgICAgIGF3YWl0IHRoaXMuY29tcGlsZXIuZW1pdCgnYmVmb3JlLWNvbXBpbGUnLCB0aGlzKVxuICAgICAgICAvLyBEbyBzb21ldGhpbmcgZWxzZS5cbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlci5lbWl0KCdhZnRlci1jb21waWxlJywgdGhpcylcbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlci5lbWl0KCdzYXZlJywgdGhpcylcbiAgICAgICAgY29uZmlnLmFua2FDb25maWcuZGVidWcgJiYgdXRpbHMubG9nZ2VyLmluZm8oJ0NvbXBpbGUnLCB0aGlzLmZpbGUuc291cmNlRmlsZS5yZXBsYWNlKGAke2NvbmZpZy5jd2R9JHtwYXRoLnNlcH1gLCAnJykpXG4gICAgICAgIHRoaXMuZGVzdHJveSgpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXIgb24gQ29tcGlsZXIgYW5kIGRlc3Ryb3kgdGhlIHByZXZpb3VzIG9uZSBpZiBjb25mbGljdCBhcmlzZXMuXG4gICAgICovXG4gICAgZW5yb2xsICgpOiB2b2lkIHtcbiAgICAgICAgY29uc3Qgb2xkQ29tcGlsYXRpb24gPSBDb21waWxlci5jb21waWxhdGlvblBvb2wuZ2V0KHRoaXMuc291cmNlRmlsZSlcblxuICAgICAgICBpZiAob2xkQ29tcGlsYXRpb24pIHtcbiAgICAgICAgICAgIGlmIChjb25maWcuYW5rYUNvbmZpZy5kZWJ1ZykgY29uc29sZS5sb2coJ1xiRGVzdHJveSBDb21waWxhdGlvbicsIG9sZENvbXBpbGF0aW9uLmlkLCBvbGRDb21waWxhdGlvbi5zb3VyY2VGaWxlKVxuXG4gICAgICAgICAgICBvbGRDb21waWxhdGlvbi5kZXN0cm95KClcbiAgICAgICAgfVxuICAgICAgICBDb21waWxlci5jb21waWxhdGlvblBvb2wuc2V0KHRoaXMuc291cmNlRmlsZSwgdGhpcylcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVbnJlZ2lzdGVyIHRoZW1zZWx2ZXMgZnJvbSBDb21waWxlci5cbiAgICAgKi9cbiAgICBkZXN0cm95ICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5kZXN0cm95ZWQgPSB0cnVlXG4gICAgICAgIENvbXBpbGVyLmNvbXBpbGF0aW9uUG9vbC5kZWxldGUodGhpcy5zb3VyY2VGaWxlKVxuICAgIH1cbn1cbiIsImltcG9ydCB7XG4gICAgUGFyc2VySW5qZWN0aW9uLFxuICAgIFBsdWdpbkluamVjdGlvblxufSBmcm9tICcuL0luamVjdGlvbidcbmltcG9ydCBGaWxlIGZyb20gJy4vRmlsZSdcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJ1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuLi8uLi9jb25maWcnXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi8uLi91dGlscydcbmltcG9ydCBDb21waWxhdGlvbiBmcm9tICcuL0NvbXBpbGF0aW9uJ1xuaW1wb3J0IG1lc3NhZ2VyIGZyb20gJy4uLy4uL3V0aWxzL21lc3NhZ2VyJ1xuaW1wb3J0IGNhbGxQcm9taXNlSW5DaGFpbiBmcm9tICcuLi8uLi91dGlscy9jYWxsUHJvbWlzZUluQ2hhaW4nXG5pbXBvcnQgYXN5bmNGdW5jdGlvbldyYXBwZXIgZnJvbSAnLi4vLi4vdXRpbHMvYXN5bmNGdW5jdGlvbldyYXBwZXInXG5cbmltcG9ydCB7XG4gICAgUGFyc2VyLFxuICAgIFBhcnNlck9wdGlvbnMsXG4gICAgUGx1Z2luSGFuZGxlcixcbiAgICBQbHVnaW5PcHRpb25zLFxuICAgIENvbXBpbGVyQ29uZmlnXG59IGZyb20gJy4uLy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5jb25zdCB7IGxvZ2dlciB9ID0gdXRpbHNcbmNvbnN0IGRlbCA9IHJlcXVpcmUoJ2RlbCcpXG5cbi8qKlxuICogVGhlIGNvcmUgY29tcGlsZXIuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbXBpbGVyIHtcbiAgICByZWFkb25seSBjb25maWc6IENvbXBpbGVyQ29uZmlnXG4gICAgcHVibGljIHN0YXRpYyBjb21waWxhdGlvbklkID0gMVxuICAgIHB1YmxpYyBzdGF0aWMgY29tcGlsYXRpb25Qb29sID0gbmV3IE1hcDxzdHJpbmcsIENvbXBpbGF0aW9uPigpXG4gICAgcGx1Z2luczoge1xuICAgICAgICBbZXZlbnROYW1lOiBzdHJpbmddOiBBcnJheTxQbHVnaW5IYW5kbGVyPlxuICAgIH0gPSB7XG4gICAgICAgICdiZWZvcmUtbG9hZC1maWxlJzogW10sXG4gICAgICAgICdhZnRlci1sb2FkLWZpbGUnOiBbXSxcbiAgICAgICAgJ2JlZm9yZS1wYXJzZSc6IFtdLFxuICAgICAgICAnYWZ0ZXItcGFyc2UnOiBbXSxcbiAgICAgICAgJ2JlZm9yZS1jb21waWxlJzogW10sXG4gICAgICAgICdhZnRlci1jb21waWxlJzogW10sXG4gICAgICAgICdzYXZlJzogW11cbiAgICB9XG4gICAgcGFyc2VyczogQXJyYXk8e1xuICAgICAgICBtYXRjaDogUmVnRXhwLFxuICAgICAgICBwYXJzZXJzOiBBcnJheTxQYXJzZXI+XG4gICAgfT4gPSBbXVxuXG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZ1xuICAgICAgICB0aGlzLmluaXRQYXJzZXJzKClcbiAgICAgICAgdGhpcy5pbml0UGx1Z2lucygpXG5cbiAgICAgICAgaWYgKGNvbmZpZy5hbmthQ29uZmlnLmRlYnVnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh0aGlzLmNvbmZpZywgKGtleSwgdmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBGdW5jdGlvbikgcmV0dXJuICdbRnVuY3Rpb25dJ1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZVxuICAgICAgICAgICAgfSwgNCkpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBQbHVnaW4uXG4gICAgICogQHBhcmFtIGV2ZW50XG4gICAgICogQHBhcmFtIGhhbmRsZXJcbiAgICAgKi9cbiAgICBvbiAoZXZlbnQ6IHN0cmluZywgaGFuZGxlcjogUGx1Z2luSGFuZGxlcik6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5wbHVnaW5zW2V2ZW50XSA9PT0gdm9pZCAoMCkpIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBob29rOiAke2V2ZW50fWApXG4gICAgICAgIHRoaXMucGx1Z2luc1tldmVudF0ucHVzaChoYW5kbGVyKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEludm9rZSBsaWZlY3ljbGUgaG9va3MoUHJvbWlzZSBjaGFpbmluZykuXG4gICAgICogQHBhcmFtIGV2ZW50XG4gICAgICogQHBhcmFtIGNvbXBpbGF0aW9uXG4gICAgICovXG4gICAgYXN5bmMgZW1pdCAoZXZlbnQ6IHN0cmluZywgY29tcGlsYXRpb246IENvbXBpbGF0aW9uKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKGNvbXBpbGF0aW9uLmRlc3Ryb3llZCkgcmV0dXJuXG5cbiAgICAgICAgY29uc3QgcGx1Z2lucyA9IHRoaXMucGx1Z2luc1tldmVudF1cblxuICAgICAgICBpZiAoIXBsdWdpbnMgfHwgIXBsdWdpbnMubGVuZ3RoKSByZXR1cm5cblxuICAgICAgICBjb25zdCB0YXNrcyA9IHBsdWdpbnMubWFwKHBsdWdpbiA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYXN5bmNGdW5jdGlvbldyYXBwZXIocGx1Z2luKVxuICAgICAgICB9KVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBjYWxsUHJvbWlzZUluQ2hhaW4odGFza3MsIGNvbXBpbGF0aW9uKVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB1dGlscy5sb2dnZXIuZXJyb3IoJ0NvbXBpbGUnLCBlLm1lc3NhZ2UsIGUpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDbGVhbiBkaXN0IGRpcmVjdG9yeS5cbiAgICAgKi9cbiAgICBhc3luYyBjbGVhbiAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGF3YWl0IGRlbChbXG4gICAgICAgICAgICBwYXRoLmpvaW4oY29uZmlnLmRpc3REaXIsICcqKi8qJyksXG4gICAgICAgICAgICBgISR7cGF0aC5qb2luKGNvbmZpZy5kaXN0RGlyLCAnYXBwLmpzJyl9YCxcbiAgICAgICAgICAgIGAhJHtwYXRoLmpvaW4oY29uZmlnLmRpc3REaXIsICdhcHAuanNvbicpfWAsXG4gICAgICAgICAgICBgISR7cGF0aC5qb2luKGNvbmZpZy5kaXN0RGlyLCAncHJvamVjdC5jb25maWcuanNvbicpfWBcbiAgICAgICAgXSlcbiAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoJ0NsZWFuIHdvcmtzaG9wJywgY29uZmlnLmRpc3REaXIpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRXZlcnl0aGluZyBzdGFydCBmcm9tIGhlcmUuXG4gICAgICovXG4gICAgYXN5bmMgbGF1bmNoICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBsb2dnZXIuc3RhcnRMb2FkaW5nKCdMYXVuY2hpbmcuLi4nKVxuXG4gICAgICAgIGNvbnN0IHN0YXJ0dXBUaW1lID0gRGF0ZS5ub3coKVxuICAgICAgICBjb25zdCBmaWxlUGF0aHM6IHN0cmluZ1tdID0gYXdhaXQgdXRpbHMuc2VhcmNoRmlsZXMoYCoqLypgLCB7XG4gICAgICAgICAgICBjd2Q6IGNvbmZpZy5zcmNEaXIsXG4gICAgICAgICAgICBub2RpcjogdHJ1ZSxcbiAgICAgICAgICAgIHNpbGVudDogZmFsc2UsXG4gICAgICAgICAgICBhYnNvbHV0ZTogdHJ1ZSxcbiAgICAgICAgICAgIGlnbm9yZTogY29uZmlnLmFua2FDb25maWcuaWdub3JlZFxuICAgICAgICB9KVxuICAgICAgICBjb25zdCBmaWxlcyA9IGF3YWl0IFByb21pc2UuYWxsKGZpbGVQYXRocy5tYXAoZmlsZSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdXRpbHMuY3JlYXRlRmlsZShmaWxlKVxuICAgICAgICB9KSlcbiAgICAgICAgY29uc3QgY29tcGlsYXRpb25zID0gZmlsZXMubWFwKGZpbGUgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBDb21waWxhdGlvbihmaWxlLCB0aGlzLmNvbmZpZywgdGhpcylcbiAgICAgICAgfSlcblxuICAgICAgICBmcy5lbnN1cmVEaXJTeW5jKGNvbmZpZy5kaXN0Tm9kZU1vZHVsZXMpXG5cbiAgICAgICAgLy8gYXdhaXQgUHJvbWlzZS5hbGwoY29tcGlsYXRpb25zLm1hcChjb21waWxhdGlvbiA9PiBjb21waWxhdGlvbi5sb2FkRmlsZSgpKSlcbiAgICAgICAgLy8gYXdhaXQgUHJvbWlzZS5hbGwoY29tcGlsYXRpb25zLm1hcChjb21waWxhdGlvbiA9PiBjb21waWxhdGlvbi5pbnZva2VQYXJzZXJzKCkpKVxuXG4gICAgICAgIC8vIFRPRE86IEdldCBhbGwgZmlsZXNcbiAgICAgICAgLy8gQ29tcGlsZXIuY29tcGlsYXRpb25Qb29sLnZhbHVlcygpXG5cbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoY29tcGlsYXRpb25zLm1hcChjb21waWxhdGlvbnMgPT4gY29tcGlsYXRpb25zLnJ1bigpKSlcblxuICAgICAgICBpZiAobWVzc2FnZXIuaGFzRXJyb3IoKSkge1xuICAgICAgICAgICAgbWVzc2FnZXIucHJpbnRFcnJvcigpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsb2dnZXIuc3VjY2VzcygnQ29tcGlsZWQnICwgYCR7ZmlsZXMubGVuZ3RofSBmaWxlcyBpbiAke0RhdGUubm93KCkgLSBzdGFydHVwVGltZX1tc2ApXG4gICAgICAgICAgICBjb25maWcuYW5rYUNvbmZpZy5kZWJ1ZyAmJiBtZXNzYWdlci5wcmludEluZm8oKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgd2F0Y2hGaWxlcyAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgY29uc3Qgd2F0Y2hlciA9IHV0aWxzLmdlbkZpbGVXYXRjaGVyKGAke2NvbmZpZy5zcmNEaXJ9LyoqLypgLCB7XG4gICAgICAgICAgICAgICAgZm9sbG93U3ltbGlua3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGlnbm9yZWQ6IGNvbmZpZy5hbmthQ29uZmlnLmlnbm9yZWRcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIHdhdGNoZXIub24oJ2FkZCcsIGFzeW5jIChmaWxlTmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLnN0YXJ0TG9hZGluZyhgQ29tcGlsaW5nICR7ZmlsZU5hbWV9YClcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydHVwVGltZSA9IERhdGUubm93KClcbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlID0gYXdhaXQgdXRpbHMuY3JlYXRlRmlsZShmaWxlTmFtZSlcblxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuZ2VuZXJhdGVDb21waWxhdGlvbihmaWxlKS5ydW4oKVxuXG4gICAgICAgICAgICAgICAgaWYgKG1lc3NhZ2VyLmhhc0Vycm9yKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZXIucHJpbnRFcnJvcigpXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoJ0NvbXBpbGVkICcsIGAke2ZpbGVOYW1lfSBpbiAke0RhdGUubm93KCkgLSBzdGFydHVwVGltZX1tc2ApXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VyLnByaW50SW5mbygpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIHdhdGNoZXIub24oJ3VubGluaycsIGFzeW5jIChmaWxlTmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZnMudW5saW5rKGZpbGVOYW1lLnJlcGxhY2UoY29uZmlnLnNyY0RpciwgY29uZmlnLmRpc3REaXIpKVxuICAgICAgICAgICAgICAgIGxvZ2dlci5zdWNjZXNzKCdSZW1vdmUnLCBmaWxlTmFtZSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB3YXRjaGVyLm9uKCdjaGFuZ2UnLCBhc3luYyAoZmlsZU5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5zdGFydExvYWRpbmcoYENvbXBpbGluZyAke2ZpbGVOYW1lfWApXG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnR1cFRpbWUgPSBEYXRlLm5vdygpXG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZSA9IGF3YWl0IHV0aWxzLmNyZWF0ZUZpbGUoZmlsZU5hbWUpXG5cbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmdlbmVyYXRlQ29tcGlsYXRpb24oZmlsZSkucnVuKClcblxuICAgICAgICAgICAgICAgIGlmIChtZXNzYWdlci5oYXNFcnJvcigpKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VyLnByaW50RXJyb3IoKVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZ2dlci5zdWNjZXNzKCdDb21waWxlZCcsIGAke2ZpbGVOYW1lfSBpbiAke0RhdGUubm93KCkgLSBzdGFydHVwVGltZX1tc2ApXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VyLnByaW50SW5mbygpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIHdhdGNoZXIub24oJ3JlYWR5JywgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICAgICAgICAgIGxvZ2dlci5sb2coJ0Fua2EgaXMgd2FpdGluZyBmb3IgY2hhbmdlcy4uLicpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBuZXcgQ29tcGlsYXRpb24uXG4gICAgICogQHBhcmFtIGZpbGVcbiAgICAgKi9cbiAgICBnZW5lcmF0ZUNvbXBpbGF0aW9uIChmaWxlOiBGaWxlKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29tcGlsYXRpb24oZmlsZSwgdGhpcy5jb25maWcsIHRoaXMpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTW91bnQgcGFyc2Vycy5cbiAgICAgKi9cbiAgICBpbml0UGFyc2VycyAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY29uZmlnLmFua2FDb25maWcucGFyc2Vycy5mb3JFYWNoKCh7IG1hdGNoLCBwYXJzZXJzIH0pID0+IHtcbiAgICAgICAgICAgIHRoaXMucGFyc2Vycy5wdXNoKHtcbiAgICAgICAgICAgICAgICBtYXRjaCxcbiAgICAgICAgICAgICAgICBwYXJzZXJzOiBwYXJzZXJzLm1hcCgoeyBwYXJzZXIsIG9wdGlvbnMgfSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VyLmJpbmQodGhpcy5nZW5lcmF0ZVBhcnNlckluamVjdGlvbihvcHRpb25zKSlcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNb3VudCBQbHVnaW5zLlxuICAgICAqL1xuICAgIGluaXRQbHVnaW5zICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jb25maWcuYW5rYUNvbmZpZy5wbHVnaW5zLmZvckVhY2goKHsgcGx1Z2luLCBvcHRpb25zIH0pID0+IHtcbiAgICAgICAgICAgIHBsdWdpbi5jYWxsKHRoaXMuZ2VuZXJhdGVQbHVnaW5JbmplY3Rpb24ob3B0aW9ucykpXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgZ2VuZXJhdGVQbHVnaW5JbmplY3Rpb24gKG9wdGlvbnM6IFBsdWdpbk9wdGlvbnNbJ29wdGlvbnMnXSk6IFBsdWdpbkluamVjdGlvbiB7XG4gICAgICAgIHJldHVybiBuZXcgUGx1Z2luSW5qZWN0aW9uKHRoaXMsIG9wdGlvbnMpXG4gICAgfVxuXG4gICAgZ2VuZXJhdGVQYXJzZXJJbmplY3Rpb24gKG9wdGlvbnM6IFBhcnNlck9wdGlvbnNbJ29wdGlvbnMnXSk6IFBhcnNlckluamVjdGlvbiB7XG4gICAgICAgIHJldHVybiBuZXcgUGFyc2VySW5qZWN0aW9uKHRoaXMsIG9wdGlvbnMpXG4gICAgfVxufVxuIiwiaW1wb3J0IENvbXBpbGVyIGZyb20gJy4vQ29tcGlsZXInXG5cbmV4cG9ydCBkZWZhdWx0IGFic3RyYWN0IGNsYXNzIENvbW1hbmQge1xuICAgIHB1YmxpYyBjb21tYW5kOiBzdHJpbmdcbiAgICBwdWJsaWMgb3B0aW9uczogQXJyYXk8QXJyYXk8c3RyaW5nPj5cbiAgICBwdWJsaWMgYWxpYXM6IHN0cmluZ1xuICAgIHB1YmxpYyB1c2FnZTogc3RyaW5nXG4gICAgcHVibGljIGRlc2NyaXB0aW9uOiBzdHJpbmdcbiAgICBwdWJsaWMgZXhhbXBsZXM6IEFycmF5PHN0cmluZz5cbiAgICBwdWJsaWMgJGNvbXBpbGVyOiBDb21waWxlclxuICAgIHB1YmxpYyBvbjoge1xuICAgICAgICBba2V5OiBzdHJpbmddOiAoLi4uYXJnOiBhbnlbXSkgPT4gdm9pZFxuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yIChjb21tYW5kOiBzdHJpbmcsIGRlc2M/OiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5jb21tYW5kID0gY29tbWFuZFxuICAgICAgICB0aGlzLm9wdGlvbnMgPSBbXVxuICAgICAgICB0aGlzLmFsaWFzID0gJydcbiAgICAgICAgdGhpcy51c2FnZSA9ICcnXG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBkZXNjXG4gICAgICAgIHRoaXMuZXhhbXBsZXMgPSBbXVxuICAgICAgICB0aGlzLm9uID0ge31cbiAgICB9XG5cbiAgICBhYnN0cmFjdCBhY3Rpb24gKHBhcmFtOiBzdHJpbmcgfCBBcnJheTxzdHJpbmc+LCBvcHRpb25zOiBPYmplY3QsIC4uLm90aGVyOiBhbnlbXSk6IFByb21pc2U8YW55PiB8IHZvaWRcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemUgYW5rYSBjb3JlIGNvbXBpbGVyXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGluaXRDb21waWxlciAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuJGNvbXBpbGVyID0gbmV3IENvbXBpbGVyKClcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgc2V0VXNhZ2UgKHVzYWdlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgdGhpcy51c2FnZSA9IHVzYWdlXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHNldE9wdGlvbnMgKC4uLm9wdGlvbnM6IEFycmF5PHN0cmluZz4pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLnB1c2gob3B0aW9ucylcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgc2V0RXhhbXBsZXMgKC4uLmV4YW1wbGU6IEFycmF5PHN0cmluZz4pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5leGFtcGxlcyA9IHRoaXMuZXhhbXBsZXMuY29uY2F0KGV4YW1wbGUpXG4gICAgfVxuXG4gICAgcHVibGljIHByaW50VGl0bGUgKC4uLmFyZzogQXJyYXk8YW55Pikge1xuICAgICAgICBjb25zb2xlLmxvZygnXFxyXFxuICcsIC4uLmFyZywgJ1xcclxcbicpXG4gICAgfVxuXG4gICAgcHVibGljIHByaW50Q29udGVudCAoLi4uYXJnOiBBcnJheTxhbnk+KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCcgICAnLCAuLi5hcmcpXG4gICAgfVxufVxuIiwiaW1wb3J0IGNvbmZpZyAgZnJvbSAnLi4vY29uZmlnJ1xuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi4vdXRpbHMnXG5pbXBvcnQgeyBDb21tYW5kLCBDb21waWxlciB9IGZyb20gJy4uL2NvcmUnXG5pbXBvcnQgbWVzc2FnZXIgZnJvbSAnLi4vdXRpbHMvbWVzc2FnZXInXG5cbmV4cG9ydCB0eXBlIERldkNvbW1hbmRPcHRzID0gT2JqZWN0ICYge31cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGV2Q29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgc3VwZXIoXG4gICAgICAgICAgICAnZGV2IFtwYWdlcy4uLl0nLFxuICAgICAgICAgICAgJ0RldmVsb3BtZW50IG1vZGUnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldEV4YW1wbGVzKFxuICAgICAgICAgICAgJyQgYW5rYSBkZXYnLFxuICAgICAgICAgICAgJyQgYW5rYSBkZXYgaW5kZXgnLFxuICAgICAgICAgICAgJyQgYW5rYSBkZXYgL3BhZ2VzL2xvZy9sb2cgL3BhZ2VzL3VzZXIvdXNlcidcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuJGNvbXBpbGVyID0gbmV3IENvbXBpbGVyKClcbiAgICB9XG5cbiAgICBhc3luYyBhY3Rpb24gKHBhZ2VzPzogQXJyYXk8c3RyaW5nPiwgb3B0aW9ucz86IERldkNvbW1hbmRPcHRzKSB7XG4gICAgICAgIHRoaXMuJGNvbXBpbGVyLmNvbmZpZy5hbmthQ29uZmlnLmRldk1vZGUgPSB0cnVlXG5cbiAgICAgICAgdGhpcy5pbml0Q29tcGlsZXIoKVxuICAgICAgICBhd2FpdCB0aGlzLiRjb21waWxlci5jbGVhbigpXG4gICAgICAgIGF3YWl0IHRoaXMuJGNvbXBpbGVyLmxhdW5jaCgpXG4gICAgICAgIGF3YWl0IHRoaXMuJGNvbXBpbGVyLndhdGNoRmlsZXMoKVxuICAgIH1cbn1cbiIsImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBjb25maWcgZnJvbSAnLi4vY29uZmlnJ1xuaW1wb3J0IHsgZG93bmxvYWRSZXBvLCBsb2dnZXIgfSBmcm9tICcuLi91dGlscydcbmltcG9ydCB7IENvbW1hbmQsIENvbXBpbGVyIH0gZnJvbSAnLi4vY29yZSdcblxuZXhwb3J0IHR5cGUgSW5pdENvbW1hbmRPcHRzID0ge1xuICAgIHJlcG86IHN0cmluZ1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBJbml0Q29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgc3VwZXIoXG4gICAgICAgICAgICAnaW5pdCA8cHJvamVjdC1uYW1lPicsXG4gICAgICAgICAgICAnSW5pdGlhbGl6ZSBuZXcgcHJvamVjdCdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0RXhhbXBsZXMoXG4gICAgICAgICAgICAnJCBhbmthIGluaXQnLFxuICAgICAgICAgICAgYCQgYW5rYSBpbml0IGFua2EtaW4tYWN0aW9uIC0tcmVwbz0ke2NvbmZpZy5kZWZhdWx0U2NhZmZvbGR9YFxuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRPcHRpb25zKFxuICAgICAgICAgICAgJy1yLCAtLXJlcG8nLFxuICAgICAgICAgICAgJ3RlbXBsYXRlIHJlcG9zaXRvcnknXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLiRjb21waWxlciA9IG5ldyBDb21waWxlcigpXG4gICAgfVxuXG4gICAgYXN5bmMgYWN0aW9uIChwcm9qZWN0TmFtZTogc3RyaW5nLCBvcHRpb25zPzogSW5pdENvbW1hbmRPcHRzKSB7XG4gICAgICAgIGNvbnN0IHByb2plY3QgPSBwYXRoLnJlc29sdmUoY29uZmlnLmN3ZCwgcHJvamVjdE5hbWUpXG4gICAgICAgIGNvbnN0IHJlcG8gPSBvcHRpb25zLnJlcG8gfHwgY29uZmlnLmRlZmF1bHRTY2FmZm9sZFxuXG4gICAgICAgIGxvZ2dlci5zdGFydExvYWRpbmcoJ0Rvd25sb2FkaW5nIHRlbXBsYXRlLi4uJylcbiAgICAgICAgYXdhaXQgZG93bmxvYWRSZXBvKHJlcG8sIHByb2plY3QpXG4gICAgICAgIGxvZ2dlci5zdG9wTG9hZGluZygpXG4gICAgICAgIGxvZ2dlci5zdWNjZXNzKCdEb25lJywgcHJvamVjdClcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBsb2dnZXIgfSBmcm9tICcuLi91dGlscydcbmltcG9ydCB7IENvbW1hbmQsIENvbXBpbGVyIH0gZnJvbSAnLi4vY29yZSdcblxuZXhwb3J0IHR5cGUgRGV2Q29tbWFuZE9wdHMgPSBPYmplY3QgJiB7fVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEZXZDb21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBzdXBlcihcbiAgICAgICAgICAgICdwcm9kJyxcbiAgICAgICAgICAgICdQcm9kdWN0aW9uIG1vZGUnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldEV4YW1wbGVzKFxuICAgICAgICAgICAgJyQgYW5rYSBwcm9kJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy4kY29tcGlsZXIgPSBuZXcgQ29tcGlsZXIoKVxuICAgIH1cblxuICAgIGFzeW5jIGFjdGlvbiAocGFnZXM/OiBBcnJheTxzdHJpbmc+LCBvcHRpb25zPzogRGV2Q29tbWFuZE9wdHMpIHtcbiAgICAgICAgdGhpcy4kY29tcGlsZXIuY29uZmlnLmFua2FDb25maWcuZGV2TW9kZSA9IGZhbHNlXG5cbiAgICAgICAgY29uc3Qgc3RhcnR1cFRpbWUgPSBEYXRlLm5vdygpXG5cbiAgICAgICAgdGhpcy5pbml0Q29tcGlsZXIoKVxuICAgICAgICBhd2FpdCB0aGlzLiRjb21waWxlci5jbGVhbigpXG4gICAgICAgIGF3YWl0IHRoaXMuJGNvbXBpbGVyLmxhdW5jaCgpXG4gICAgICAgIGxvZ2dlci5zdWNjZXNzKGBDb21waWxlZCBpbiAke0RhdGUubm93KCkgLSBzdGFydHVwVGltZX1tc2AsICdIYXZlIGEgbmljZSBkYXkg8J+OiSAhJylcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCdcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBjb25maWcgIGZyb20gJy4uL2NvbmZpZydcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uL3V0aWxzJ1xuaW1wb3J0IHsgQ29tbWFuZCwgQ29tcGlsZXIgfSBmcm9tICcuLi9jb3JlJ1xuaW1wb3J0IHsgZGVmYXVsdCBhcyBGc0VkaXRvckNvbnN0cnVjdG9yIH0gZnJvbSAnLi4vdXRpbHMvZWRpdG9yJ1xuXG5pbXBvcnQge1xuICAgIENvbXBpbGVyQ29uZmlnXG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5jb25zdCB7IGxvZ2dlciwgRnNFZGl0b3IgfSA9IHV0aWxzXG5cbmV4cG9ydCB0eXBlIENyZWF0ZVBhZ2VDb21tYW5kT3B0cyA9IHtcbiAgICByb290OiBzdHJpbmdcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ3JlYXRlUGFnZUNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHN1cGVyKFxuICAgICAgICAgICAgJ25ldy1wYWdlIDxwYWdlcy4uLj4nLFxuICAgICAgICAgICAgJ0NyZWF0ZSBhIG1pbmlwcm9ncmFtIHBhZ2UnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldEV4YW1wbGVzKFxuICAgICAgICAgICAgJyQgYW5rYSBuZXctcGFnZSBpbmRleCcsXG4gICAgICAgICAgICAnJCBhbmthIG5ldy1wYWdlIC9wYWdlcy9pbmRleC9pbmRleCcsXG4gICAgICAgICAgICAnJCBhbmthIG5ldy1wYWdlIC9wYWdlcy9pbmRleC9pbmRleCAtLXJvb3Q9cGFja2FnZUEnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldE9wdGlvbnMoXG4gICAgICAgICAgICAnLXIsIC0tcm9vdCA8c3VicGFja2FnZT4nLFxuICAgICAgICAgICAgJ3NhdmUgcGFnZSB0byBzdWJwYWNrYWdlcydcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuJGNvbXBpbGVyID0gbmV3IENvbXBpbGVyKClcbiAgICB9XG5cbiAgICBhc3luYyBhY3Rpb24gKHBhZ2VzPzogQXJyYXk8c3RyaW5nPiwgb3B0aW9ucz86IENyZWF0ZVBhZ2VDb21tYW5kT3B0cykge1xuICAgICAgICBjb25zdCByb290ID0gb3B0aW9ucy5yb290XG4gICAgICAgIGNvbnN0IGVkaXRvciA9IG5ldyBGc0VkaXRvcigpXG5cbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwocGFnZXMubWFwKHBhZ2UgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2VuZXJhdGVQYWdlKHBhZ2UsIGVkaXRvciwgcm9vdClcbiAgICAgICAgfSkpXG5cbiAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoJ0RvbmUnLCAnSGF2ZSBhIG5pY2UgZGF5IPCfjokgIScpXG4gICAgfVxuXG4gICAgYXN5bmMgZ2VuZXJhdGVQYWdlIChwYWdlOiBzdHJpbmcsIGVkaXRvcjogRnNFZGl0b3JDb25zdHJ1Y3Rvciwgcm9vdD86IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICBhbmthQ29uZmlnLFxuICAgICAgICAgICAgcHJvamVjdENvbmZpZ1xuICAgICAgICB9ID0gPENvbXBpbGVyQ29uZmlnPmNvbmZpZ1xuICAgICAgICBjb25zdCBDd2RSZWdFeHAgPSBuZXcgUmVnRXhwKGBeJHtjb25maWcuY3dkfWApXG4gICAgICAgIGNvbnN0IHBhZ2VQYXRoID0gcGFnZS5zcGxpdChwYXRoLnNlcCkubGVuZ3RoID09PSAxID9cbiAgICAgICAgICAgIHBhdGguam9pbihhbmthQ29uZmlnLnBhZ2VzLCBwYWdlLCBwYWdlKSA6IHBhZ2VcbiAgICAgICAgY29uc3QgcGFnZU5hbWUgPSBwYXRoLmJhc2VuYW1lKHBhZ2VQYXRoKVxuICAgICAgICBjb25zdCBjb250ZXh0ID0ge1xuICAgICAgICAgICAgcGFnZU5hbWUsXG4gICAgICAgICAgICB0aW1lOiBuZXcgRGF0ZSgpLnRvTG9jYWxlU3RyaW5nKClcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhcHBDb25maWdQYXRoID0gcGF0aC5qb2luKGNvbmZpZy5zcmNEaXIsICdhcHAuanNvbicpXG4gICAgICAgIGxldCBhYnNvbHV0ZVBhdGggPSBjb25maWcuc3JjRGlyXG5cbiAgICAgICAgaWYgKHJvb3QpIHtcbiAgICAgICAgICAgIGNvbnN0IHJvb3RQYXRoID0gcGF0aC5qb2luKGFua2FDb25maWcuc3ViUGFja2FnZXMsIHJvb3QpXG4gICAgICAgICAgICBjb25zdCBzdWJQa2cgPSBwcm9qZWN0Q29uZmlnLnN1YlBhY2thZ2VzLmZpbmQoKHBrZzogYW55KSA9PiBwa2cucm9vdCA9PT0gcm9vdFBhdGgpXG5cbiAgICAgICAgICAgIGFic29sdXRlUGF0aCA9IHBhdGguam9pbihhYnNvbHV0ZVBhdGgsIGFua2FDb25maWcuc3ViUGFja2FnZXMsIHJvb3QsIHBhZ2VQYXRoKVxuXG4gICAgICAgICAgICBpZiAoc3ViUGtnKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN1YlBrZy5wYWdlcy5pbmNsdWRlcyhwYWdlUGF0aCkpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLndhcm4oJ1RoZSBwYWdlIGFscmVhZHkgZXhpc3RzJywgYWJzb2x1dGVQYXRoKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzdWJQa2cucGFnZXMucHVzaChwYWdlUGF0aClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHByb2plY3RDb25maWcuc3ViUGFja2FnZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHJvb3Q6IHJvb3RQYXRoLFxuICAgICAgICAgICAgICAgICAgICBwYWdlczogW3BhZ2VQYXRoXVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhYnNvbHV0ZVBhdGggPSBwYXRoLmpvaW4oYWJzb2x1dGVQYXRoLCBwYWdlUGF0aClcblxuICAgICAgICAgICAgaWYgKHByb2plY3RDb25maWcucGFnZXMuaW5jbHVkZXMocGFnZVBhdGgpKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLndhcm4oJ1RoZSBwYWdlIGFscmVhZHkgZXhpc3RzJywgYWJzb2x1dGVQYXRoKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwcm9qZWN0Q29uZmlnLnBhZ2VzLnB1c2gocGFnZVBhdGgpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0cGxzID0gYXdhaXQgdXRpbHMuc2VhcmNoRmlsZXMoYCR7cGF0aC5qb2luKGFua2FDb25maWcudGVtcGxhdGUucGFnZSwgJyouKicpfWApXG5cbiAgICAgICAgdHBscy5mb3JFYWNoKHRwbCA9PiB7XG4gICAgICAgICAgICBlZGl0b3IuY29weShcbiAgICAgICAgICAgICAgICB0cGwsXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHBhdGguZGlybmFtZShhYnNvbHV0ZVBhdGgpLCBwYWdlTmFtZSArIHBhdGguZXh0bmFtZSh0cGwpKSxcbiAgICAgICAgICAgICAgICBjb250ZXh0XG4gICAgICAgICAgICApXG4gICAgICAgIH0pXG4gICAgICAgIGVkaXRvci53cml0ZUpTT04oYXBwQ29uZmlnUGF0aCwgcHJvamVjdENvbmZpZywgbnVsbCwgNClcblxuICAgICAgICBhd2FpdCBlZGl0b3Iuc2F2ZSgpXG5cbiAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoJ0NyZWF0ZSBwYWdlJywgYWJzb2x1dGVQYXRoLnJlcGxhY2UoQ3dkUmVnRXhwLCAnJykpXG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgY29uZmlnICBmcm9tICcuLi9jb25maWcnXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi91dGlscydcbmltcG9ydCB7IENvbW1hbmQsIENvbXBpbGVyIH0gZnJvbSAnLi4vY29yZSdcbmltcG9ydCB7IGRlZmF1bHQgYXMgRnNFZGl0b3JDb25zdHJ1Y3RvciB9IGZyb20gJy4uL3V0aWxzL2VkaXRvcidcblxuaW1wb3J0IHtcbiAgICBDb21waWxlckNvbmZpZ1xufSBmcm9tICcuLi8uLi90eXBlcy90eXBlcydcblxuY29uc3QgeyBsb2dnZXIsIEZzRWRpdG9yIH0gPSB1dGlsc1xuXG5leHBvcnQgdHlwZSBDcmVhdGVDb21wb25lbnRDb21tYW5kT3B0cyA9IHtcbiAgICByb290OiBzdHJpbmdcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ3JlYXRlQ29tcG9uZW50Q29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgc3VwZXIoXG4gICAgICAgICAgICAnbmV3LWNtcHQgPGNvbXBvbmVudHMuLi4+JyxcbiAgICAgICAgICAgICdDcmVhdGUgYSBtaW5pcHJvZ3JhbSBjb21wb25lbnQnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldEV4YW1wbGVzKFxuICAgICAgICAgICAgJyQgYW5rYSBuZXctY21wdCBidXR0b24nLFxuICAgICAgICAgICAgJyQgYW5rYSBuZXctY21wdCAvY29tcG9uZW50cy9idXR0b24vYnV0dG9uJyxcbiAgICAgICAgICAgICckIGFua2EgbmV3LWNtcHQgL2NvbXBvbmVudHMvYnV0dG9uL2J1dHRvbiAtLWdsb2JhbCdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0T3B0aW9ucyhcbiAgICAgICAgICAgICctciwgLS1yb290IDxzdWJwYWNrYWdlPicsXG4gICAgICAgICAgICAnc2F2ZSBjb21wb25lbnQgdG8gc3VicGFja2FnZXMnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLiRjb21waWxlciA9IG5ldyBDb21waWxlcigpXG4gICAgfVxuXG4gICAgYXN5bmMgYWN0aW9uIChjb21wb25lbnRzPzogQXJyYXk8c3RyaW5nPiwgb3B0aW9ucz86IENyZWF0ZUNvbXBvbmVudENvbW1hbmRPcHRzKSB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIHJvb3RcbiAgICAgICAgfSA9IG9wdGlvbnNcbiAgICAgICAgY29uc3QgZWRpdG9yID0gbmV3IEZzRWRpdG9yKClcblxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChjb21wb25lbnRzLm1hcChjb21wb25lbnQgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2VuZXJhdGVDb21wb25lbnQoY29tcG9uZW50LCBlZGl0b3IsIHJvb3QpXG4gICAgICAgIH0pKVxuXG4gICAgICAgIGxvZ2dlci5zdWNjZXNzKCdEb25lJywgJ0hhdmUgYSBuaWNlIGRheSDwn46JICEnKVxuICAgIH1cblxuICAgIGFzeW5jIGdlbmVyYXRlQ29tcG9uZW50IChjb21wb25lbnQ6IHN0cmluZywgZWRpdG9yOiBGc0VkaXRvckNvbnN0cnVjdG9yLCByb290Pzogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIGFua2FDb25maWcsXG4gICAgICAgICAgICBwcm9qZWN0Q29uZmlnXG4gICAgICAgIH0gPSA8Q29tcGlsZXJDb25maWc+Y29uZmlnXG4gICAgICAgIGNvbnN0IEN3ZFJlZ0V4cCA9IG5ldyBSZWdFeHAoYF4ke2NvbmZpZy5jd2R9YClcbiAgICAgICAgY29uc3QgY29tcG9uZW50UGF0aCA9IGNvbXBvbmVudC5zcGxpdChwYXRoLnNlcCkubGVuZ3RoID09PSAxID9cbiAgICAgICAgICAgIHBhdGguam9pbihhbmthQ29uZmlnLmNvbXBvbmVudHMsIGNvbXBvbmVudCwgY29tcG9uZW50KSA6XG4gICAgICAgICAgICBjb21wb25lbnRcbiAgICAgICAgY29uc3QgY29tcG9uZW50TmFtZSA9IHBhdGguYmFzZW5hbWUoY29tcG9uZW50UGF0aClcbiAgICAgICAgY29uc3QgY29udGV4dCA9IHtcbiAgICAgICAgICAgIGNvbXBvbmVudE5hbWUsXG4gICAgICAgICAgICB0aW1lOiBuZXcgRGF0ZSgpLnRvTG9jYWxlU3RyaW5nKClcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhYnNvbHV0ZVBhdGggPSByb290ID9cbiAgICAgICAgICAgIHBhdGguam9pbihjb25maWcuc3JjRGlyLCBhbmthQ29uZmlnLnN1YlBhY2thZ2VzLCByb290LCBjb21wb25lbnRQYXRoKSA6XG4gICAgICAgICAgICBwYXRoLmpvaW4oY29uZmlnLnNyY0RpciwgY29tcG9uZW50UGF0aClcblxuICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKGFic29sdXRlUGF0aCksIGNvbXBvbmVudE5hbWUgKyAnLmpzb24nKSkpIHtcbiAgICAgICAgICAgIGxvZ2dlci53YXJuKCdUaGUgY29tcG9uZW50IGFscmVhZHkgZXhpc3RzJywgYWJzb2x1dGVQYXRoKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0cGxzID0gYXdhaXQgdXRpbHMuc2VhcmNoRmlsZXMoYCR7cGF0aC5qb2luKGFua2FDb25maWcudGVtcGxhdGUuY29tcG9uZW50LCAnKi4qJyl9YClcblxuICAgICAgICB0cGxzLmZvckVhY2godHBsID0+IHtcbiAgICAgICAgICAgIGVkaXRvci5jb3B5KFxuICAgICAgICAgICAgICAgIHRwbCxcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKGFic29sdXRlUGF0aCksIGNvbXBvbmVudE5hbWUgKyBwYXRoLmV4dG5hbWUodHBsKSksXG4gICAgICAgICAgICAgICAgY29udGV4dFxuICAgICAgICAgICAgKVxuICAgICAgICB9KVxuXG4gICAgICAgIGF3YWl0IGVkaXRvci5zYXZlKClcblxuICAgICAgICBsb2dnZXIuc3VjY2VzcygnQ3JlYXRlIGNvbXBvbmVudCcsIGFic29sdXRlUGF0aC5yZXBsYWNlKEN3ZFJlZ0V4cCwgJycpKVxuICAgIH1cbn1cbiIsImltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJ1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IGNvbmZpZyAgZnJvbSAnLi4vY29uZmlnJ1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vdXRpbHMnXG5pbXBvcnQgeyBDb21tYW5kLCBDb21waWxlciB9IGZyb20gJy4uL2NvcmUnXG5pbXBvcnQgeyBkZWZhdWx0IGFzIEZzRWRpdG9yQ29uc3RydWN0b3IgfSBmcm9tICcuLi91dGlscy9lZGl0b3InXG5cbmltcG9ydCB7XG4gICAgQ29tcGlsZXJDb25maWdcbn0gZnJvbSAnLi4vLi4vdHlwZXMvdHlwZXMnXG5cbmNvbnN0IHsgbG9nZ2VyLCBGc0VkaXRvciB9ID0gdXRpbHNcblxuZXhwb3J0IHR5cGUgRW5yb2xsQ29tcG9uZW50Q29tbWFuZE9wdHMgPSB7XG4gICAgcGFnZTogc3RyaW5nXG4gICAgZ2xvYmFsOiBzdHJpbmdcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRW5yb2xsQ29tcG9uZW50Q29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgc3VwZXIoXG4gICAgICAgICAgICAnZW5yb2xsIDxjb21wb25lbnRzLi4uPicsXG4gICAgICAgICAgICAnRW5yb2xsIGEgbWluaXByb2dyYW0gY29tcG9uZW50J1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRFeGFtcGxlcyhcbiAgICAgICAgICAgICckIGFua2EgZW5yb2xsIGJ1dHRvbiAtLWdsb2JhbCcsXG4gICAgICAgICAgICAnJCBhbmthIGVucm9sbCAvY29tcG9uZW50cy9idXR0b24vYnV0dG9uIC0tZ2xvYmFsJyxcbiAgICAgICAgICAgICckIGFua2EgZW5yb2xsIC9jb21wb25lbnRzL2J1dHRvbi9idXR0b24gLS1wYWdlPS9wYWdlcy9pbmRleC9pbmRleCdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0T3B0aW9ucyhcbiAgICAgICAgICAgICctcCwgLS1wYWdlIDxwYWdlPicsXG4gICAgICAgICAgICAnd2hpY2ggcGFnZSBjb21wb25lbnRzIGVucm9sbCB0bydcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0T3B0aW9ucyhcbiAgICAgICAgICAgICctZywgLS1nbG9iYWwnLFxuICAgICAgICAgICAgJ2Vucm9sbCBjb21wb25lbnRzIHRvIGFwcC5qc29uJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy4kY29tcGlsZXIgPSBuZXcgQ29tcGlsZXIoKVxuICAgIH1cblxuICAgIGFzeW5jIGFjdGlvbiAoY29tcG9uZW50cz86IEFycmF5PHN0cmluZz4sIG9wdGlvbnM/OiBFbnJvbGxDb21wb25lbnRDb21tYW5kT3B0cykge1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICBwYWdlLFxuICAgICAgICAgICAgZ2xvYmFsXG4gICAgICAgIH0gPSBvcHRpb25zXG4gICAgICAgIGNvbnN0IGVkaXRvciA9IG5ldyBGc0VkaXRvcigpXG5cbiAgICAgICAgaWYgKCFnbG9iYWwgJiYgIXBhZ2UpIHtcbiAgICAgICAgICAgIGxvZ2dlci53YXJuKCdXaGVyZSBjb21wb25lbnRzIGVucm9sbCB0bz8nKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChjb21wb25lbnRzLm1hcChjb21wb25lbnQgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZW5yb2xsQ29tcG9uZW50KGNvbXBvbmVudCwgZWRpdG9yLCBnbG9iYWwgPyAnJyA6IHBhZ2UpXG4gICAgICAgIH0pKVxuXG4gICAgICAgIGxvZ2dlci5zdWNjZXNzKCdEb25lJywgJ0hhdmUgYSBuaWNlIGRheSDwn46JICEnKVxuICAgIH1cblxuICAgIGFzeW5jIGVucm9sbENvbXBvbmVudCAoY29tcG9uZW50OiBzdHJpbmcsIGVkaXRvcjogRnNFZGl0b3JDb25zdHJ1Y3RvciwgcGFnZT86IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICBhbmthQ29uZmlnLFxuICAgICAgICAgICAgcHJvamVjdENvbmZpZ1xuICAgICAgICB9ID0gPENvbXBpbGVyQ29uZmlnPmNvbmZpZ1xuICAgICAgICBjb25zdCBDd2RSZWdFeHAgPSBuZXcgUmVnRXhwKGBeJHtjb25maWcuY3dkfWApXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudFBhdGggPSBjb21wb25lbnQuc3BsaXQocGF0aC5zZXApLmxlbmd0aCA9PT0gMSA/XG4gICAgICAgICAgICBwYXRoLmpvaW4oYW5rYUNvbmZpZy5jb21wb25lbnRzLCBjb21wb25lbnQsIGNvbXBvbmVudCkgOlxuICAgICAgICAgICAgY29tcG9uZW50XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudE5hbWUgPSBjb21wb25lbnRQYXRoLnNwbGl0KHBhdGguc2VwKS5wb3AoKVxuICAgICAgICBjb25zdCBhcHBDb25maWdQYXRoID0gcGF0aC5qb2luKGNvbmZpZy5zcmNEaXIsICdhcHAuanNvbicpXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudEFic1BhdGggPSBwYXRoLmpvaW4oY29uZmlnLnNyY0RpciwgY29tcG9uZW50UGF0aClcblxuICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMocGF0aC5qb2luKHBhdGguZGlybmFtZShjb21wb25lbnRBYnNQYXRoKSwgY29tcG9uZW50TmFtZSArICcuanNvbicpKSkge1xuICAgICAgICAgICAgbG9nZ2VyLndhcm4oJ0NvbXBvbmVudCBkb3NlIG5vdCBleGlzdHMnLCBjb21wb25lbnRBYnNQYXRoKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAocGFnZSkge1xuICAgICAgICAgICAgY29uc3QgcGFnZUFic1BhdGggPSBwYXRoLmpvaW4oY29uZmlnLnNyY0RpciwgcGFnZSlcbiAgICAgICAgICAgIGNvbnN0IHBhZ2VKc29uUGF0aCA9IHBhdGguam9pbihwYXRoLmRpcm5hbWUocGFnZUFic1BhdGgpLCBwYXRoLmJhc2VuYW1lKHBhZ2VBYnNQYXRoKSArICcuanNvbicpXG4gICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMocGFnZUpzb25QYXRoKSkge1xuICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKCdQYWdlIGRvc2Ugbm90IGV4aXN0cycsIHBhZ2VBYnNQYXRoKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBwYWdlSnNvbiA9IDxhbnk+SlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMocGFnZUpzb25QYXRoLCB7XG4gICAgICAgICAgICAgICAgZW5jb2Rpbmc6ICd1dGY4J1xuICAgICAgICAgICAgfSkgfHwgJ3t9JylcblxuICAgICAgICAgICAgdGhpcy5lbnN1cmVVc2luZ0NvbXBvbmVudHMocGFnZUpzb24pXG5cbiAgICAgICAgICAgIGlmIChwYWdlSnNvbi51c2luZ0NvbXBvbmVudHNbY29tcG9uZW50TmFtZV0pIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIud2FybignQ29tcG9uZW50IGFscmVhZHkgZW5yb2xsZWQgaW4nLCBwYWdlQWJzUGF0aClcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcGFnZUpzb24udXNpbmdDb21wb25lbnRzW2NvbXBvbmVudE5hbWVdID0gcGF0aC5yZWxhdGl2ZShwYXRoLmRpcm5hbWUocGFnZUFic1BhdGgpLCBjb21wb25lbnRBYnNQYXRoKVxuICAgICAgICAgICAgZWRpdG9yLndyaXRlSlNPTihwYWdlSnNvblBhdGgsIHBhZ2VKc29uKVxuICAgICAgICAgICAgYXdhaXQgZWRpdG9yLnNhdmUoKVxuXG4gICAgICAgICAgICBsb2dnZXIuc3VjY2VzcyhgRW5yb2xsICR7Y29tcG9uZW50UGF0aH0gaW5gLCBwYWdlQWJzUGF0aC5yZXBsYWNlKEN3ZFJlZ0V4cCwgJycpKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5lbnN1cmVVc2luZ0NvbXBvbmVudHMocHJvamVjdENvbmZpZylcblxuICAgICAgICAgICAgaWYgKHByb2plY3RDb25maWcudXNpbmdDb21wb25lbnRzW2NvbXBvbmVudE5hbWVdKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLndhcm4oJ0NvbXBvbmVudCBhbHJlYWR5IGVucm9sbGVkIGluJywgJ2FwcC5qc29uJylcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJvamVjdENvbmZpZy51c2luZ0NvbXBvbmVudHNbY29tcG9uZW50TmFtZV0gPSBwYXRoLnJlbGF0aXZlKHBhdGguZGlybmFtZShhcHBDb25maWdQYXRoKSwgY29tcG9uZW50QWJzUGF0aClcbiAgICAgICAgICAgIGVkaXRvci53cml0ZUpTT04oYXBwQ29uZmlnUGF0aCwgcHJvamVjdENvbmZpZylcbiAgICAgICAgICAgIGF3YWl0IGVkaXRvci5zYXZlKClcblxuICAgICAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoYEVucm9sbCAke2NvbXBvbmVudFBhdGh9IGluYCwgJ2FwcC5qc29uJylcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgZW5zdXJlVXNpbmdDb21wb25lbnRzIChjb25maWc6IGFueSkge1xuICAgICAgICBpZiAoIWNvbmZpZy51c2luZ0NvbXBvbmVudHMpIHtcbiAgICAgICAgICAgIGNvbmZpZy51c2luZ0NvbXBvbmVudHMgPSB7fVxuICAgICAgICB9XG4gICAgfVxufVxuIiwiaW1wb3J0IERldiBmcm9tICcuL2NvbW1hbmRzL2RldidcbmltcG9ydCBJbml0IGZyb20gJy4vY29tbWFuZHMvaW5pdCdcbmltcG9ydCBQcm9kIGZyb20gJy4vY29tbWFuZHMvcHJvZCdcbmltcG9ydCBDcmVhdGVQYWdlIGZyb20gJy4vY29tbWFuZHMvY3JlYXRlUGFnZSdcbmltcG9ydCBDcmVhdGVDb21wb25lbnQgZnJvbSAnLi9jb21tYW5kcy9jcmVhdGVDb21wb25lbnQnXG5pbXBvcnQgRW5yb2xsQ29tcG9uZW50IGZyb20gJy4vY29tbWFuZHMvZW5yb2xsQ29tcG9uZW50J1xuXG5leHBvcnQgZGVmYXVsdCBbXG4gICAgbmV3IFByb2QoKSxcbiAgICBuZXcgRGV2KCksXG4gICAgbmV3IEluaXQoKSxcbiAgICBuZXcgQ3JlYXRlUGFnZSgpLFxuICAgIG5ldyBDcmVhdGVDb21wb25lbnQoKSxcbiAgICBuZXcgRW5yb2xsQ29tcG9uZW50KClcbl1cbiIsImltcG9ydCBjb25maWcgZnJvbSAnLi9jb25maWcnXG5pbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJ1xuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi91dGlscydcbmltcG9ydCAqIGFzIGNmb250cyBmcm9tICdjZm9udHMnXG5pbXBvcnQgY29tbWFuZHMgZnJvbSAnLi9jb21tYW5kcydcbmltcG9ydCBDb21waWxlciBmcm9tICcuL2NvcmUvY2xhc3MvQ29tcGlsZXInXG5cbmNvbnN0IGNvbW1hbmRlciA9IHJlcXVpcmUoJ2NvbW1hbmRlcicpXG5jb25zdCBwa2dKc29uID0gcmVxdWlyZSgnLi4vcGFja2FnZS5qc29uJylcblxucmVxdWlyZSgnc291cmNlLW1hcC1zdXBwb3J0JykuaW5zdGFsbCgpXG5cbmlmICghc2VtdmVyLnNhdGlzZmllcyhzZW12ZXIuY2xlYW4ocHJvY2Vzcy52ZXJzaW9uKSwgcGtnSnNvbi5lbmdpbmVzLm5vZGUpKSB7XG4gICAgbG9nZ2VyLmVycm9yKCdSZXF1aXJlZCBub2RlIHZlcnNpb24gJyArIHBrZ0pzb24uZW5naW5lcy5ub2RlKVxuICAgIHByb2Nlc3MuZXhpdCgxKVxufVxuXG5pZiAocHJvY2Vzcy5hcmd2LmluZGV4T2YoJy0tZGVidWcnKSA+IC0xKSB7XG4gICAgY29uZmlnLmFua2FDb25maWcuZGVidWcgPSB0cnVlXG59XG5cbmlmIChwcm9jZXNzLmFyZ3YuaW5kZXhPZignLS1zbGllbnQnKSA+IC0xKSB7XG4gICAgY29uZmlnLmFua2FDb25maWcucXVpZXQgPSB0cnVlXG59XG5cbmNvbW1hbmRlclxuICAgIC5vcHRpb24oJy0tZGVidWcnLCAnZW5hYmxlIGRlYnVnIG1vZGUnKVxuICAgIC5vcHRpb24oJy0tcXVpZXQnLCAnaGlkZSBjb21waWxlIGxvZycpXG4gICAgLnZlcnNpb24ocGtnSnNvbi52ZXJzaW9uKVxuICAgIC51c2FnZSgnPGNvbW1hbmQ+IFtvcHRpb25zXScpXG5cbmNvbW1hbmRzLmZvckVhY2goY29tbWFuZCA9PiB7XG4gICAgY29uc3QgY21kID0gY29tbWFuZGVyLmNvbW1hbmQoY29tbWFuZC5jb21tYW5kKVxuXG4gICAgaWYgKGNvbW1hbmQuZGVzY3JpcHRpb24pIHtcbiAgICAgICAgY21kLmRlc2NyaXB0aW9uKGNvbW1hbmQuZGVzY3JpcHRpb24pXG4gICAgfVxuXG4gICAgaWYgKGNvbW1hbmQudXNhZ2UpIHtcbiAgICAgICAgY21kLnVzYWdlKGNvbW1hbmQudXNhZ2UpXG4gICAgfVxuXG4gICAgaWYgKGNvbW1hbmQub24pIHtcbiAgICAgICAgZm9yIChsZXQga2V5IGluIGNvbW1hbmQub24pIHtcbiAgICAgICAgICAgIGNtZC5vbihrZXksIGNvbW1hbmQub25ba2V5XSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjb21tYW5kLm9wdGlvbnMpIHtcbiAgICAgICAgY29tbWFuZC5vcHRpb25zLmZvckVhY2goKG9wdGlvbjogW2FueSwgYW55LCBhbnksIGFueV0pID0+IHtcbiAgICAgICAgICAgIGNtZC5vcHRpb24oLi4ub3B0aW9uKVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGlmIChjb21tYW5kLmFjdGlvbikge1xuICAgICAgICBjbWQuYWN0aW9uKGFzeW5jICguLi5hcmdzKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IGNvbW1hbmQuYWN0aW9uKC4uLmFyZ3MpXG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgaWYgKGNvbW1hbmQuZXhhbXBsZXMpIHtcbiAgICAgICAgY21kLm9uKCctLWhlbHAnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb21tYW5kLnByaW50VGl0bGUoJ0V4YW1wbGVzOicpXG4gICAgICAgICAgICBjb21tYW5kLmV4YW1wbGVzLmZvckVhY2goZXhhbXBsZSA9PiB7XG4gICAgICAgICAgICAgICAgY29tbWFuZC5wcmludENvbnRlbnQoZXhhbXBsZSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgfVxufSlcblxuaWYgKHByb2Nlc3MuYXJndi5sZW5ndGggPT09IDIpIHtcbiAgICBjb25zdCBMb2dvID0gY2ZvbnRzLnJlbmRlcignQW5rYScsIHtcbiAgICAgICAgZm9udDogJ3NpbXBsZScsXG4gICAgICAgIGNvbG9yczogWydncmVlbkJyaWdodCddXG4gICAgfSlcblxuICAgIGNvbnNvbGUubG9nKExvZ28uc3RyaW5nLnJlcGxhY2UoLyhcXHMrKSQvLCBgICR7cGtnSnNvbi52ZXJzaW9ufVxcclxcbmApKVxuICAgIGNvbW1hbmRlci5vdXRwdXRIZWxwKClcbn1cblxuY29tbWFuZGVyLnBhcnNlKHByb2Nlc3MuYXJndilcblxuZXhwb3J0IGRlZmF1bHQgQ29tcGlsZXJcbiJdLCJuYW1lcyI6WyJwYXRoLmpvaW4iLCJmcy5leGlzdHNTeW5jIiwic2Fzcy5yZW5kZXIiLCJwb3N0Y3NzIiwidHNsaWJfMS5fX2Fzc2lnbiIsImJhYmVsLnRyYW5zZm9ybVN5bmMiLCJmcy5lbnN1cmVGaWxlIiwicG9zdGNzcy5wbHVnaW4iLCJpbnRlcm5hbFBsdWdpbnMiLCJ0cy50cmFuc3BpbGVNb2R1bGUiLCJiYWJlbC5wYXJzZSIsInBhdGgiLCJwYXRoLmRpcm5hbWUiLCJwYXRoLnJlbGF0aXZlIiwiY3dkIiwiYW5rYURlZmF1bHRDb25maWcudGVtcGxhdGUiLCJhbmthRGVmYXVsdENvbmZpZy5wYXJzZXJzIiwiYW5rYURlZmF1bHRDb25maWcucGx1Z2lucyIsImFua2FEZWZhdWx0Q29uZmlnLmlnbm9yZWQiLCJwYXRoLnJlc29sdmUiLCJjdXN0b21Db25maWciLCJzeXN0ZW0uc3JjRGlyIiwiZnMucmVhZEZpbGUiLCJmcy53cml0ZUZpbGUiLCJwYXRoLmJhc2VuYW1lIiwicGF0aC5leHRuYW1lIiwiZnMucmVhZEZpbGVTeW5jIiwibG9nIiwiY2hva2lkYXIud2F0Y2giLCJ0c2xpYl8xLl9fZXh0ZW5kcyIsInV0aWxzLmxvZ2dlciIsInV0aWxzLmNyZWF0ZUZpbGUiLCJ1dGlscy5hc3luY0Z1bmN0aW9uV3JhcHBlciIsInV0aWxzLmNhbGxQcm9taXNlSW5DaGFpbiIsInBhdGguc2VwIiwibG9nZ2VyIiwidXRpbHMuc2VhcmNoRmlsZXMiLCJmcy5lbnN1cmVEaXJTeW5jIiwidXRpbHMuZ2VuRmlsZVdhdGNoZXIiLCJmcy51bmxpbmsiLCJkb3dubG9hZFJlcG8iLCJGc0VkaXRvciIsImNvbmZpZyIsIlByb2QiLCJEZXYiLCJJbml0IiwiQ3JlYXRlUGFnZSIsIkNyZWF0ZUNvbXBvbmVudCIsIkVucm9sbENvbXBvbmVudCIsInNlbXZlci5zYXRpc2ZpZXMiLCJzZW12ZXIuY2xlYW4iLCJjZm9udHMucmVuZGVyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBR0EsSUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFBO0FBRXpCLHdCQUF5QixLQUF5QixFQUFFLElBQWE7SUFBeEMs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
