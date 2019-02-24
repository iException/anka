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
        console.clear();
        this.errors.forEach(function (err) {
            console.error(err.message);
            ankaConfig.debug && console.log(err.stack);
        });
        this.errors = [];
    },
    printInfo: function () {
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
        return console.log([this.time].concat(msg).join(' '));
    };
    Logger.prototype.error = function (title, msg, err) {
        if (title === void 0) { title = ''; }
        if (msg === void 0) { msg = ''; }
        if (err === void (0)) {
            err = new Error('');
        }
        err.message = chalk.hex('#333333').bgRedBright(title) + ' ' + chalk.grey(msg) + '\r\n' + err.message;
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
        this.log(chalk.hex('#333333').bgYellowBright(title), chalk.grey(msg));
    };
    Logger.prototype.success = function (title, msg) {
        if (title === void 0) { title = ''; }
        if (msg === void 0) { msg = ''; }
        console.clear();
        this.log(chalk.hex('#333333').bgGreenBright(title), chalk.grey(msg));
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
//# sourceMappingURL=index.js.map

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
            utils.logger.error('Compile', file.sourceFile, err);
        }
    }
    file.updateExt('.js');
    cb();
});
//# sourceMappingURL=babelParser.js.map

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
            return writeFile(file.targetFile, file.content);
        }).then(function () {
            cb();
        }).catch(function (err) {
            logger.error('Error', err.message, err);
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
        logger.error('Compile error', err.message, err);
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
        logger.error('Missing dependency', id, !ankaConfig.quiet ? "in " + options.paths : null);
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
                            logger$1.log('Compiling', fileName);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlscy9yZXNvbHZlQ29uZmlnLnRzIiwiLi4vc3JjL3BhcnNlcnMvc2Fzc1BhcnNlci50cyIsIi4uL3NyYy91dGlscy9tZXNzYWdlci50cyIsIi4uL3NyYy91dGlscy9sb2dnZXIudHMiLCIuLi9zcmMvcGFyc2Vycy9zdHlsZVBhcnNlci9pbmRleC50cyIsIi4uL3NyYy9wYXJzZXJzL2JhYmVsUGFyc2VyLnRzIiwiLi4vc3JjL3BsdWdpbnMvc2F2ZUZpbGVQbHVnaW4vaW5kZXgudHMiLCIuLi9zcmMvcGx1Z2lucy93eEltcG9ydFBsdWdpbi9wb3N0Y3NzV3hpbXBvcnQudHMiLCIuLi9zcmMvcGx1Z2lucy93eEltcG9ydFBsdWdpbi9pbmRleC50cyIsIi4uL3NyYy9wYXJzZXJzL3R5cGVzY3JpcHRQYXJzZXIudHMiLCIuLi9zcmMvcGx1Z2lucy9leHRyYWN0RGVwZW5kZW5jeVBsdWdpbi9pbmRleC50cyIsIi4uL3NyYy9jb25maWcvYW5rYURlZmF1bHRDb25maWcudHMiLCIuLi9zcmMvY29uZmlnL2Fua2FDb25maWcudHMiLCIuLi9zcmMvY29uZmlnL3N5c3RlbUNvbmZpZy50cyIsIi4uL3NyYy9jb25maWcvcHJvamVjdENvbmZpZy50cyIsIi4uL3NyYy9jb25maWcvaW5kZXgudHMiLCIuLi9zcmMvdXRpbHMvZnMudHMiLCIuLi9zcmMvY29yZS9jbGFzcy9GaWxlLnRzIiwiLi4vc3JjL3V0aWxzL2NyZWF0ZUZpbGUudHMiLCIuLi9zcmMvdXRpbHMvZWRpdG9yLnRzIiwiLi4vc3JjL3V0aWxzL3Jlc29sdmVNb2R1bGUudHMiLCIuLi9zcmMvdXRpbHMvY2FsbFByb21pc2VJbkNoYWluLnRzIiwiLi4vc3JjL3V0aWxzL2FzeW5jRnVuY3Rpb25XcmFwcGVyLnRzIiwiLi4vc3JjL3V0aWxzL2dlbkZpbGVXYXRjaGVyLnRzIiwiLi4vc3JjL3V0aWxzL2lzTnBtRGVwZW5kZW5jeS50cyIsIi4uL3NyYy91dGlscy9kb3dubG9hZFJlcGUudHMiLCIuLi9zcmMvY29yZS9jbGFzcy9JbmplY3Rpb24udHMiLCIuLi9zcmMvY29yZS9jbGFzcy9Db21waWxhdGlvbi50cyIsIi4uL3NyYy9jb3JlL2NsYXNzL0NvbXBpbGVyLnRzIiwiLi4vc3JjL2NvcmUvY2xhc3MvQ29tbWFuZC50cyIsIi4uL3NyYy9jb21tYW5kcy9kZXYudHMiLCIuLi9zcmMvY29tbWFuZHMvaW5pdC50cyIsIi4uL3NyYy9jb21tYW5kcy9wcm9kLnRzIiwiLi4vc3JjL2NvbW1hbmRzL2NyZWF0ZVBhZ2UudHMiLCIuLi9zcmMvY29tbWFuZHMvY3JlYXRlQ29tcG9uZW50LnRzIiwiLi4vc3JjL2NvbW1hbmRzL2Vucm9sbENvbXBvbmVudC50cyIsIi4uL3NyYy9jb21tYW5kcy50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcydcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcblxuY29uc3QgY3dkID0gcHJvY2Vzcy5jd2QoKVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAobmFtZXM6IEFycmF5PHN0cmluZz4gPSBbXSwgcm9vdD86IHN0cmluZyk6IE9iamVjdCB7XG4gICAgY29uc3QgZGVmYXVsdFZhbHVlID0ge31cbiAgICBjb25zdCBjb25maWdQYXRocyA9IG5hbWVzLm1hcChuYW1lID0+IHBhdGguam9pbihyb290IHx8IGN3ZCwgbmFtZSkpXG5cbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgY29uZmlnUGF0aHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZ1BhdGggPSBjb25maWdQYXRoc1tpbmRleF1cblxuICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhjb25maWdQYXRoKSkge1xuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihkZWZhdWx0VmFsdWUsIHJlcXVpcmUoY29uZmlnUGF0aCkpXG4gICAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlZmF1bHRWYWx1ZVxufVxuIiwiaW1wb3J0ICogYXMgc2FzcyBmcm9tICdub2RlLXNhc3MnXG5cbmltcG9ydCB7XG4gICAgRmlsZSxcbiAgICBQYXJzZXIsXG4gICAgQ29tcGlsYXRpb24sXG4gICAgUGFyc2VySW5qZWN0aW9uXG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG4vKipcbiAqIFNhc3MgZmlsZSBwYXJzZXIuXG4gKiBAZm9yIGFueSBmaWxlIHRoYXQgZG9lcyBub3QgbWF0Y2hlIHBhcnNlcnMuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IDxQYXJzZXI+ZnVuY3Rpb24gKHRoaXM6IFBhcnNlckluamVjdGlvbiwgZmlsZTogRmlsZSwgY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYWxsYmFjaz86IEZ1bmN0aW9uKSB7XG4gICAgY29uc3QgdXRpbHMgPSB0aGlzLmdldFV0aWxzKClcbiAgICBjb25zdCBjb25maWcgPSB0aGlzLmdldFN5c3RlbUNvbmZpZygpXG5cbiAgICBmaWxlLmNvbnRlbnQgPSBmaWxlLmNvbnRlbnQgaW5zdGFuY2VvZiBCdWZmZXIgPyBmaWxlLmNvbnRlbnQudG9TdHJpbmcoKSA6IGZpbGUuY29udGVudFxuXG4gICAgc2Fzcy5yZW5kZXIoe1xuICAgICAgICBmaWxlOiBmaWxlLnNvdXJjZUZpbGUsXG4gICAgICAgIGRhdGE6IGZpbGUuY29udGVudFxuICAgIH0sIChlcnI6IEVycm9yLCByZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICB1dGlscy5sb2dnZXIuZXJyb3IoJ0NvbXBpbGUnLCBlcnIubWVzc2FnZSwgZXJyKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZmlsZS5jb250ZW50ID0gcmVzdWx0LmNzc1xuICAgICAgICAgICAgZmlsZS51cGRhdGVFeHQoJy53eHNzJylcbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjaygpXG4gICAgfSlcbn1cbiIsImltcG9ydCBsb2dnZXIgZnJvbSAnLi9sb2dnZXInXG5pbXBvcnQgYW5rYUNvbmZpZyBmcm9tIFwiLi4vY29uZmlnL2Fua2FDb25maWdcIjtcblxuZXhwb3J0IGRlZmF1bHQge1xuICAgIGVycm9yczogW10sXG4gICAgbWVzc2FnZXM6IFtdLFxuICAgIHB1c2ggKG1zZzogT2JqZWN0KTogdm9pZCB7XG4gICAgICAgIGlmIChtc2cgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICAgICAgdGhpcy5lcnJvcnMucHVzaChtc2cpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VzLnB1c2gobXNnKVxuICAgICAgICB9XG4gICAgfSxcbiAgICBjbGVhciAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZXJyb3JzID0gW11cbiAgICAgICAgdGhpcy5tZXNzYWdlcyA9IFtdXG4gICAgfSxcbiAgICBoYXNFcnJvciAoKTogQm9vbGVhbiB7XG4gICAgICAgIHJldHVybiAhIXRoaXMuZXJyb3JzLmxlbmd0aFxuICAgIH0sXG4gICAgcHJpbnRFcnJvciAoKTogdm9pZCB7XG4gICAgICAgIGNvbnNvbGUuY2xlYXIoKVxuICAgICAgICB0aGlzLmVycm9ycy5mb3JFYWNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVyci5tZXNzYWdlKVxuICAgICAgICAgICAgYW5rYUNvbmZpZy5kZWJ1ZyAmJiBjb25zb2xlLmxvZyhlcnIuc3RhY2spXG4gICAgICAgIH0pXG4gICAgICAgIHRoaXMuZXJyb3JzID0gW11cbiAgICB9LFxuICAgIHByaW50SW5mbyAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMubWVzc2FnZXMuZm9yRWFjaCgoaW5mbzogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8oaW5mbylcbiAgICAgICAgfSlcblxuICAgICAgICB0aGlzLm1lc3NhZ2VzID0gW11cbiAgICB9XG59XG4iLCJpbXBvcnQgY2hhbGsgZnJvbSAnY2hhbGsnXG5pbXBvcnQgbWVzc2FnZXIgZnJvbSAnLi9tZXNzYWdlcidcblxuY29uc3Qgb3JhID0gcmVxdWlyZSgnb3JhJylcblxuZXhwb3J0IGZ1bmN0aW9uIHRvRml4IChudW1iZXI6IG51bWJlcik6IHN0cmluZyB7XG4gICAgcmV0dXJuICgnMDAnICsgbnVtYmVyKS5zbGljZSgtMilcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRUaW1lICgpOiBzdHJpbmcge1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKClcbiAgICByZXR1cm4gYCR7dG9GaXgobm93LmdldEhvdXJzKCkpfToke3RvRml4KG5vdy5nZXRNaW51dGVzKCkpfToke3RvRml4KG5vdy5nZXRTZWNvbmRzKCkpfWBcbn1cblxuZXhwb3J0IGNsYXNzIExvZ2dlciB7XG4gICAgb3JhSW5zdGFuY2U6IGFueVxuXG4gICAgZ2V0IHRpbWUgKCkge1xuICAgICAgICByZXR1cm4gY2hhbGsuZ3JleShgWyR7Z2V0Q3VycmVudFRpbWUoKX1dYClcbiAgICB9XG5cbiAgICBzdGFydExvYWRpbmcgKG1zZzogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMub3JhSW5zdGFuY2UgPSBvcmEobXNnKS5zdGFydCgpXG4gICAgfVxuXG4gICAgc3RvcExvYWRpbmcgKCkge1xuICAgICAgICB0aGlzLm9yYUluc3RhbmNlICYmIHRoaXMub3JhSW5zdGFuY2Uuc3RvcCgpXG4gICAgfVxuXG4gICAgbG9nICguLi5tc2c6IEFycmF5PHN0cmluZz4pIHtcbiAgICAgICAgcmV0dXJuIGNvbnNvbGUubG9nKFt0aGlzLnRpbWUsIC4uLm1zZ10uam9pbignICcpKVxuICAgIH1cblxuICAgIGVycm9yICh0aXRsZTogc3RyaW5nID0gJycsIG1zZzogc3RyaW5nID0gJycsIGVycj86IGFueSkge1xuICAgICAgICBpZiAoZXJyID09PSB2b2lkICgwKSkge1xuICAgICAgICAgICAgZXJyID0gbmV3IEVycm9yKCcnKVxuICAgICAgICB9XG4gICAgICAgIGVyci5tZXNzYWdlID0gY2hhbGsuaGV4KCcjMzMzMzMzJykuYmdSZWRCcmlnaHQodGl0bGUpICsgJyAnICsgY2hhbGsuZ3JleShtc2cpICsgJ1xcclxcbicgKyBlcnIubWVzc2FnZVxuICAgICAgICBtZXNzYWdlci5wdXNoKGVycilcbiAgICB9XG5cbiAgICBpbmZvICh0aXRsZTogc3RyaW5nID0gJycsIG1zZzogc3RyaW5nID0gJycpIHtcbiAgICAgICAgbWVzc2FnZXIucHVzaCh0aGlzLnRpbWUgKyAnICcgKyBjaGFsay5yZXNldCh0aXRsZSkgKyAnICcgKyBjaGFsay5ncmV5KG1zZykpXG4gICAgfVxuXG4gICAgd2FybiAodGl0bGU6IHN0cmluZyA9ICcnLCBtc2c6IHN0cmluZyA9ICcnKSB7XG4gICAgICAgIGNvbnNvbGUuY2xlYXIoKVxuICAgICAgICB0aGlzLmxvZyhjaGFsay5oZXgoJyMzMzMzMzMnKS5iZ1llbGxvd0JyaWdodCh0aXRsZSksIGNoYWxrLmdyZXkobXNnKSlcbiAgICB9XG5cbiAgICBzdWNjZXNzICh0aXRsZTogc3RyaW5nID0gJycsIG1zZzogc3RyaW5nID0gJycpIHtcbiAgICAgICAgY29uc29sZS5jbGVhcigpXG4gICAgICAgIHRoaXMubG9nKGNoYWxrLmhleCgnIzMzMzMzMycpLmJnR3JlZW5CcmlnaHQodGl0bGUpLCBjaGFsay5ncmV5KG1zZykpXG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBuZXcgTG9nZ2VyKClcbiIsImltcG9ydCAqIGFzIFBvc3Rjc3MgZnJvbSAncG9zdGNzcydcbmltcG9ydCBsb2dnZXIgZnJvbSAnLi4vLi4vdXRpbHMvbG9nZ2VyJ1xuaW1wb3J0IHBvc3Rjc3NyYyBmcm9tICdwb3N0Y3NzLWxvYWQtY29uZmlnJ1xuXG5pbXBvcnQge1xuICAgIEZpbGUsXG4gICAgUGFyc2VyLFxuICAgIENvbXBpbGF0aW9uLFxuICAgIFBhcnNlckluamVjdGlvblxufSBmcm9tICcuLi8uLi8uLi90eXBlcy90eXBlcydcblxuY29uc3QgcG9zdGNzcyA9IHJlcXVpcmUoJ3Bvc3Rjc3MnKVxuY29uc3QgcG9zdGNzc0NvbmZpZzogYW55ID0ge31cbmNvbnN0IGludGVybmFsUGx1Z2luczogQXJyYXk8UG9zdGNzcy5BY2NlcHRlZFBsdWdpbj4gPSBbXVxuY29uc3QgdGFza3M6IGFueVtdID0gW11cblxuLy8gVE9ETzogQWRkIG5ldyBob29rOiBwcmVzZXRcblxuLyoqXG4gKiBTdHlsZSBmaWxlIHBhcnNlci5cbiAqIEBmb3IgLnd4c3MgLmNzcyA9PiAud3hzc1xuICovXG5leHBvcnQgZGVmYXVsdCA8UGFyc2VyPmZ1bmN0aW9uICh0aGlzOiBQYXJzZXJJbmplY3Rpb24sIGZpbGU6IEZpbGUsIGNvbXBpbGF0aW9uOiBDb21waWxhdGlvbiwgY2I6IEZ1bmN0aW9uKTogdm9pZCB7XG4gICAgaWYgKHBvc3Rjc3NDb25maWcucGx1Z2lucykge1xuICAgICAgICBleGVjKHBvc3Rjc3NDb25maWcsIGZpbGUsIGNiKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHRhc2tzLnB1c2goKCkgPT4ge1xuICAgICAgICAgICAgZXhlYyhwb3N0Y3NzQ29uZmlnLCBmaWxlLCBjYilcbiAgICAgICAgfSlcbiAgICB9XG59XG5cbmdlblBvc3Rjc3NDb25maWcoKS50aGVuKChjb25maWc6IGFueSkgPT4ge1xuICAgIHRhc2tzLmZvckVhY2goKHRhc2s6IEZ1bmN0aW9uKSA9PiB0YXNrKCkpXG59KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgIGxvZ2dlci5lcnJvcignbG9hZENvbmZpZycsIGVyci5tZXNzYWdlLCBlcnIpXG59KVxuXG5cbmZ1bmN0aW9uIGV4ZWMgKGNvbmZpZzogYW55LCBmaWxlOiBGaWxlLCBjYjogRnVuY3Rpb24pIHtcbiAgICBmaWxlLmNvbnZlcnRDb250ZW50VG9TdHJpbmcoKVxuICAgIHBvc3Rjc3MoY29uZmlnLnBsdWdpbnMuY29uY2F0KGludGVybmFsUGx1Z2lucykpLnByb2Nlc3MoZmlsZS5jb250ZW50LCB7XG4gICAgICAgIC4uLmNvbmZpZy5vcHRpb25zLFxuICAgICAgICBmcm9tOiBmaWxlLnNvdXJjZUZpbGVcbiAgICB9IGFzIFBvc3Rjc3MuUHJvY2Vzc09wdGlvbnMpLnRoZW4oKHJvb3Q6IFBvc3Rjc3MuUmVzdWx0KSA9PiB7XG4gICAgICAgIGZpbGUuY29udGVudCA9IHJvb3QuY3NzXG4gICAgICAgIGZpbGUuYXN0ID0gcm9vdC5yb290LnRvUmVzdWx0KClcbiAgICAgICAgZmlsZS51cGRhdGVFeHQoJy53eHNzJylcbiAgICAgICAgY2IoKVxuICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgIGxvZ2dlci5lcnJvcignQ29tcGlsZScsIGVyci5tZXNzYWdlLCBlcnIpXG4gICAgfSlcbn1cblxuZnVuY3Rpb24gZ2VuUG9zdGNzc0NvbmZpZyAodGFza3M6IEZ1bmN0aW9uW10gPSBbXSkge1xuICAgIHJldHVybiBwb3N0Y3NzQ29uZmlnLnBsdWdpbnMgPyBQcm9taXNlLnJlc29sdmUocG9zdGNzc0NvbmZpZykgOiBwb3N0Y3NzcmMoe30pLnRoZW4oKGNvbmZpZzogYW55KSA9PiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoT2JqZWN0LmFzc2lnbihwb3N0Y3NzQ29uZmlnLCBjb25maWcpKVxuICAgIH0pXG59XG4iLCJpbXBvcnQgKiBhcyBiYWJlbCBmcm9tICdAYmFiZWwvY29yZSdcbmltcG9ydCBGaWxlIGZyb20gJy4uL2NvcmUvY2xhc3MvRmlsZSdcblxuaW1wb3J0IHtcbiAgICBQYXJzZXIsXG4gICAgQ29tcGlsYXRpb24sXG4gICAgUGFyc2VySW5qZWN0aW9uXG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5sZXQgYmFiZWxDb25maWcgPSA8YmFiZWwuVHJhbnNmb3JtT3B0aW9ucz5udWxsXG5cbi8qKlxuICogU2NyaXB0IEZpbGUgcGFyc2VyLlxuICogQGZvciAuanMgLmVzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IDxQYXJzZXI+ZnVuY3Rpb24gKHRoaXM6IFBhcnNlckluamVjdGlvbiwgZmlsZTogRmlsZSwgY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYjogRnVuY3Rpb24pIHtcbiAgICBjb25zdCB1dGlscyA9IHRoaXMuZ2V0VXRpbHMoKVxuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuZ2V0U3lzdGVtQ29uZmlnKClcblxuICAgIGlmIChmaWxlLmlzSW5TcmNEaXIpIHtcbiAgICAgICAgaWYgKCFiYWJlbENvbmZpZykge1xuICAgICAgICAgICAgYmFiZWxDb25maWcgPSA8YmFiZWwuVHJhbnNmb3JtT3B0aW9ucz51dGlscy5yZXNvbHZlQ29uZmlnKFsnYmFiZWwuY29uZmlnLmpzJ10sIGNvbmZpZy5jd2QpXG4gICAgICAgIH1cblxuICAgICAgICBmaWxlLmNvbnZlcnRDb250ZW50VG9TdHJpbmcoKVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBiYWJlbC50cmFuc2Zvcm1TeW5jKDxzdHJpbmc+ZmlsZS5jb250ZW50LCB7XG4gICAgICAgICAgICAgICAgYmFiZWxyYzogZmFsc2UsXG4gICAgICAgICAgICAgICAgYXN0OiB0cnVlLFxuICAgICAgICAgICAgICAgIGZpbGVuYW1lOiBmaWxlLnNvdXJjZUZpbGUsXG4gICAgICAgICAgICAgICAgc291cmNlVHlwZTogJ21vZHVsZScsXG4gICAgICAgICAgICAgICAgc291cmNlTWFwczogY29uZmlnLmFua2FDb25maWcuZGV2TW9kZSxcbiAgICAgICAgICAgICAgICBjb21tZW50czogY29uZmlnLmFua2FDb25maWcuZGV2TW9kZSxcbiAgICAgICAgICAgICAgICBtaW5pZmllZDogIWNvbmZpZy5hbmthQ29uZmlnLmRldk1vZGUsXG4gICAgICAgICAgICAgICAgLi4uYmFiZWxDb25maWdcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBmaWxlLnNvdXJjZU1hcCA9IEpTT04uc3RyaW5naWZ5KHJlc3VsdC5tYXApXG4gICAgICAgICAgICBmaWxlLmNvbnRlbnQgPSByZXN1bHQuY29kZVxuICAgICAgICAgICAgZmlsZS5hc3QgPSByZXN1bHQuYXN0XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgdXRpbHMubG9nZ2VyLmVycm9yKCdDb21waWxlJywgZmlsZS5zb3VyY2VGaWxlLCBlcnIpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmaWxlLnVwZGF0ZUV4dCgnLmpzJylcbiAgICBjYigpXG59XG4iLCJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSdcbmltcG9ydCB7XG4gICAgUGx1Z2luLFxuICAgIENvbXBpbGF0aW9uLFxuICAgIFBsdWdpbkhhbmRsZXIsXG4gICAgUGx1Z2luSW5qZWN0aW9uXG59IGZyb20gJy4uLy4uLy4uL3R5cGVzL3R5cGVzJ1xuY29uc3QgVWdsaWZ5SlMgPSByZXF1aXJlKCd1Z2xpZnktanMnKVxuY29uc3QgbWluaWZ5SlNPTiA9IHJlcXVpcmUoJ2pzb25taW5pZnknKVxuXG5jb25zdCBpbmxpbmVTb3VyY2VNYXBDb21tZW50ID0gcmVxdWlyZSgnaW5saW5lLXNvdXJjZS1tYXAtY29tbWVudCcpXG5cbmV4cG9ydCBkZWZhdWx0IDxQbHVnaW4+ZnVuY3Rpb24gKHRoaXM6IFBsdWdpbkluamVjdGlvbikge1xuICAgIGNvbnN0IHV0aWxzID0gdGhpcy5nZXRVdGlscygpXG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5nZXRTeXN0ZW1Db25maWcoKVxuICAgIGNvbnN0IHtcbiAgICAgICAgbG9nZ2VyLFxuICAgICAgICB3cml0ZUZpbGVcbiAgICB9ID0gdXRpbHNcblxuICAgIHRoaXMub24oJ3NhdmUnLCA8UGx1Z2luSGFuZGxlcj5mdW5jdGlvbiAoY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYjogRnVuY3Rpb24pIHtcbiAgICAgICAgY29uc3QgZmlsZSA9IGNvbXBpbGF0aW9uLmZpbGVcblxuICAgICAgICAvLyBUT0RPOiBVc2UgbWVtLWZzXG4gICAgICAgIGZzLmVuc3VyZUZpbGUoZmlsZS50YXJnZXRGaWxlKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGlmIChjb25maWcuYW5rYUNvbmZpZy5kZXZNb2RlICYmIGZpbGUuc291cmNlTWFwKSB7XG4gICAgICAgICAgICAgICAgZmlsZS5jb252ZXJ0Q29udGVudFRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICBmaWxlLmNvbnRlbnQgPSBmaWxlLmNvbnRlbnQgKyAnXFxyXFxuXFxyXFxuJyArIGlubGluZVNvdXJjZU1hcENvbW1lbnQoZmlsZS5zb3VyY2VNYXAsIHtcbiAgICAgICAgICAgICAgICAgICAgYmxvY2s6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZXNDb250ZW50OiB0cnVlXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghY29uZmlnLmFua2FDb25maWcuZGV2TW9kZSkge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoZmlsZS5leHRuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNhc2UgJy5qcyc6XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnLmpzb24nOlxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5jb252ZXJ0Q29udGVudFRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuY29udGVudCA9IG1pbmlmeUpTT04oZmlsZS5jb250ZW50KVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gd3JpdGVGaWxlKGZpbGUudGFyZ2V0RmlsZSwgZmlsZS5jb250ZW50KVxuICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGNiKClcbiAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgIGxvZ2dlci5lcnJvcignRXJyb3InLCBlcnIubWVzc2FnZSwgZXJyKVxuICAgICAgICAgICAgY2IoKVxuICAgICAgICB9KVxuICAgIH0pXG59XG4iLCJpbXBvcnQgKiBhcyBwb3N0Y3NzIGZyb20gJ3Bvc3Rjc3MnXG5cbmV4cG9ydCBkZWZhdWx0IHBvc3Rjc3MucGx1Z2luKCdwb3N0Y3NzLXd4aW1wb3J0JywgKCkgPT4ge1xuICAgIHJldHVybiAocm9vdDogcG9zdGNzcy5Sb290KSA9PiB7XG4gICAgICAgIGxldCBpbXBvcnRzOiBBcnJheTxzdHJpbmc+ID0gW11cblxuICAgICAgICByb290LndhbGtBdFJ1bGVzKCd3eGltcG9ydCcsIChydWxlOiBwb3N0Y3NzLkF0UnVsZSkgPT4ge1xuICAgICAgICAgICAgaW1wb3J0cy5wdXNoKHJ1bGUucGFyYW1zLnJlcGxhY2UoL1xcLlxcdysoPz1bJ1wiXSQpLywgJy53eHNzJykpXG4gICAgICAgICAgICBydWxlLnJlbW92ZSgpXG4gICAgICAgIH0pXG4gICAgICAgIHJvb3QucHJlcGVuZCguLi5pbXBvcnRzLm1hcCgoaXRlbTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdpbXBvcnQnLFxuICAgICAgICAgICAgICAgIHBhcmFtczogaXRlbVxuICAgICAgICAgICAgfVxuICAgICAgICB9KSlcbiAgICAgICAgaW1wb3J0cy5sZW5ndGggPSAwXG4gICAgfVxufSlcbiIsImltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJ1xuaW1wb3J0IHtcbiAgICBQbHVnaW4sXG4gICAgQ29tcGlsYXRpb24sXG4gICAgUGx1Z2luSGFuZGxlcixcbiAgICBQbHVnaW5JbmplY3Rpb25cbn0gZnJvbSAnLi4vLi4vLi4vdHlwZXMvdHlwZXMnXG5pbXBvcnQgKiBhcyBQb3N0Q1NTIGZyb20gJ3Bvc3Rjc3MnXG5pbXBvcnQgcG9zdGNzc1d4SW1wb3J0IGZyb20gJy4vcG9zdGNzc1d4aW1wb3J0J1xuXG5jb25zdCBwb3N0Y3NzID0gcmVxdWlyZSgncG9zdGNzcycpXG5jb25zdCBjc3NuYW5vID0gcmVxdWlyZSgncG9zdGNzcy1ub3JtYWxpemUtd2hpdGVzcGFjZScpXG5jb25zdCBpbnRlcm5hbFBsdWdpbnM6IEFycmF5PFBvc3RDU1MuQWNjZXB0ZWRQbHVnaW4+ID0gW3Bvc3Rjc3NXeEltcG9ydF1cblxuZXhwb3J0IGRlZmF1bHQgPFBsdWdpbj5mdW5jdGlvbiAodGhpczogUGx1Z2luSW5qZWN0aW9uKSB7XG4gICAgY29uc3QgdXRpbHMgPSB0aGlzLmdldFV0aWxzKClcbiAgICBjb25zdCB7XG4gICAgICAgIGxvZ2dlclxuICAgIH0gPSB1dGlsc1xuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuZ2V0U3lzdGVtQ29uZmlnKClcbiAgICBjb25zdCB0ZXN0U3JjRGlyID0gbmV3IFJlZ0V4cChgXiR7Y29uZmlnLnNyY0Rpcn1gKVxuXG4gICAgdGhpcy5vbignYmVmb3JlLWNvbXBpbGUnLCA8UGx1Z2luSGFuZGxlcj5mdW5jdGlvbiAoY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYjogRnVuY3Rpb24pIHtcbiAgICAgICAgY29uc3QgZmlsZSA9IGNvbXBpbGF0aW9uLmZpbGVcblxuICAgICAgICBpZiAoIWNvbmZpZy5hbmthQ29uZmlnLmRldk1vZGUpIHtcbiAgICAgICAgICAgIGludGVybmFsUGx1Z2lucy5wdXNoKGNzc25hbm8pXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBoYW5kbGVyID0gcG9zdGNzcyhpbnRlcm5hbFBsdWdpbnMpXG5cbiAgICAgICAgaWYgKGZpbGUuZXh0bmFtZSA9PT0gJy53eHNzJyAmJiB0ZXN0U3JjRGlyLnRlc3QoZmlsZS5zb3VyY2VGaWxlKSkge1xuICAgICAgICAgICAgaGFuZGxlci5wcm9jZXNzKChmaWxlLmFzdCB8fCBmaWxlLmNvbnRlbnQpIGFzIHN0cmluZyB8IHsgdG9TdHJpbmcgKCk6IHN0cmluZzsgfSB8IFBvc3RDU1MuUmVzdWx0LCB7XG4gICAgICAgICAgICAgICAgZnJvbTogZmlsZS5zb3VyY2VGaWxlXG4gICAgICAgICAgICB9IGFzIFBvc3RDU1MuUHJvY2Vzc09wdGlvbnMpLnRoZW4oKHJvb3Q6IFBvc3RDU1MuUmVzdWx0KTogdm9pZCA9PiB7XG4gICAgICAgICAgICAgICAgZmlsZS5jb250ZW50ID0gcm9vdC5jc3NcbiAgICAgICAgICAgICAgICBmaWxlLmFzdCA9IHJvb3Qucm9vdC50b1Jlc3VsdCgpXG4gICAgICAgICAgICAgICAgY2IoKVxuICAgICAgICAgICAgfSwgKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yJywgZXJyLm1lc3NhZ2UsIGVycilcbiAgICAgICAgICAgICAgICBjYigpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2IoKVxuICAgICAgICB9XG4gICAgfSlcbn1cbiIsImltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnXG5cbmltcG9ydCB7XG4gICAgRmlsZSxcbiAgICBQYXJzZXIsXG4gICAgQ29tcGlsYXRpb24sXG4gICAgUGFyc2VySW5qZWN0aW9uXG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5sZXQgdHNDb25maWcgPSA8dHMuVHJhbnNwaWxlT3B0aW9ucz5udWxsXG5cbi8qKlxuICogVHlwZXNjcmlwdCBmaWxlIHBhcnNlci5cbiAqXG4gKiBAZm9yIGFueSBmaWxlIHRoYXQgZG9lcyBub3QgbWF0Y2hlIHBhcnNlcnMuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IDxQYXJzZXI+ZnVuY3Rpb24gKHRoaXM6IFBhcnNlckluamVjdGlvbiwgZmlsZTogRmlsZSwgY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYWxsYmFjaz86IEZ1bmN0aW9uKSB7XG4gICAgY29uc3QgdXRpbHMgPSB0aGlzLmdldFV0aWxzKClcbiAgICBjb25zdCBjb25maWcgPSB0aGlzLmdldFN5c3RlbUNvbmZpZygpXG4gICAgY29uc3QgeyBsb2dnZXIgfSA9IHV0aWxzXG5cbiAgICBmaWxlLmNvbnRlbnQgPSBmaWxlLmNvbnRlbnQgaW5zdGFuY2VvZiBCdWZmZXIgPyBmaWxlLmNvbnRlbnQudG9TdHJpbmcoKSA6IGZpbGUuY29udGVudFxuICAgIGNvbnN0IHNvdXJjZU1hcCA9ICB7XG4gICAgICAgIHNvdXJjZXNDb250ZW50OiBbZmlsZS5jb250ZW50XVxuICAgIH1cblxuICAgIGlmICghdHNDb25maWcpIHtcbiAgICAgICAgdHNDb25maWcgPSA8dHMuVHJhbnNwaWxlT3B0aW9ucz51dGlscy5yZXNvbHZlQ29uZmlnKFsndHNjb25maWcuanNvbicsICd0c2NvbmZpZy5qcyddLCBjb25maWcuY3dkKVxuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdCA9IHRzLnRyYW5zcGlsZU1vZHVsZShmaWxlLmNvbnRlbnQsIHtcbiAgICAgICAgY29tcGlsZXJPcHRpb25zOiB0c0NvbmZpZy5jb21waWxlck9wdGlvbnMsXG4gICAgICAgIGZpbGVOYW1lOiBmaWxlLnNvdXJjZUZpbGVcbiAgICB9KVxuXG4gICAgdHJ5IHtcbiAgICAgICAgZmlsZS5jb250ZW50ID0gcmVzdWx0Lm91dHB1dFRleHRcbiAgICAgICAgaWYgKGNvbmZpZy5hbmthQ29uZmlnLmRldk1vZGUpIHtcbiAgICAgICAgICAgIGZpbGUuc291cmNlTWFwID0ge1xuICAgICAgICAgICAgICAgIC4uLkpTT04ucGFyc2UocmVzdWx0LnNvdXJjZU1hcFRleHQpLFxuICAgICAgICAgICAgICAgIC4uLnNvdXJjZU1hcFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZpbGUudXBkYXRlRXh0KCcuanMnKVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBsb2dnZXIuZXJyb3IoJ0NvbXBpbGUgZXJyb3InLCBlcnIubWVzc2FnZSwgZXJyKVxuICAgIH1cblxuICAgIGNhbGxiYWNrKClcbn1cbiIsImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIHQgZnJvbSAnQGJhYmVsL3R5cGVzJ1xuaW1wb3J0ICogYXMgYmFiZWwgZnJvbSAnQGJhYmVsL2NvcmUnXG5pbXBvcnQgdHJhdmVyc2UgZnJvbSAnQGJhYmVsL3RyYXZlcnNlJ1xuaW1wb3J0IGNvZGVHZW5lcmF0b3IgZnJvbSAnQGJhYmVsL2dlbmVyYXRvcidcblxuaW1wb3J0IHtcbiAgICBQbHVnaW4sXG4gICAgQ29tcGlsYXRpb24sXG4gICAgUGx1Z2luSGFuZGxlcixcbiAgICBQbHVnaW5JbmplY3Rpb25cbn0gZnJvbSAnLi4vLi4vLi4vdHlwZXMvdHlwZXMnXG5cbmNvbnN0IGRlcGVuZGVuY3lQb29sID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKVxuY29uc3QgcmVzb3ZsZU1vZHVsZU5hbWUgPSByZXF1aXJlKCdyZXF1aXJlLXBhY2thZ2UtbmFtZScpXG5cbmV4cG9ydCBkZWZhdWx0IDxQbHVnaW4+IGZ1bmN0aW9uICh0aGlzOiBQbHVnaW5JbmplY3Rpb24pIHtcbiAgICBjb25zdCB1dGlscyA9IHRoaXMuZ2V0VXRpbHMoKVxuICAgIGNvbnN0IGNvbXBpbGVyID0gdGhpcy5nZXRDb21waWxlcigpXG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5nZXRTeXN0ZW1Db25maWcoKVxuICAgIGNvbnN0IHRlc3RTcmNEaXIgPSBuZXcgUmVnRXhwKGBeJHtjb25maWcuc3JjRGlyfWApXG4gICAgY29uc3QgdGVzdE5vZGVNb2R1bGVzID0gbmV3IFJlZ0V4cChgXiR7Y29uZmlnLnNvdXJjZU5vZGVNb2R1bGVzfWApXG5cbiAgICB0aGlzLm9uKCdiZWZvcmUtY29tcGlsZScsIGZ1bmN0aW9uIChjb21waWxhdGlvbjogQ29tcGlsYXRpb24sIGNiOiBGdW5jdGlvbikge1xuICAgICAgICBjb25zdCBmaWxlID0gY29tcGlsYXRpb24uZmlsZVxuICAgICAgICBjb25zdCBkZXZNb2RlID0gY29uZmlnLmFua2FDb25maWcuZGV2TW9kZVxuICAgICAgICBjb25zdCBsb2NhbERlcGVuZGVuY3lQb29sID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKVxuXG4gICAgICAgIC8vIE9ubHkgcmVzb2x2ZSBqcyBmaWxlLlxuICAgICAgICBpZiAoZmlsZS5leHRuYW1lID09PSAnLmpzJykge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coZmlsZS5zb3VyY2VGaWxlLCBmaWxlLmFzdCA/ICdvYmplY3QnIDogZmlsZS5hc3QpXG4gICAgICAgICAgICBpZiAoIWZpbGUuYXN0KSB7XG4gICAgICAgICAgICAgICAgZmlsZS5hc3QgPSA8dC5GaWxlPmJhYmVsLnBhcnNlKFxuICAgICAgICAgICAgICAgICAgICBmaWxlLmNvbnRlbnQgaW5zdGFuY2VvZiBCdWZmZXIgPyBmaWxlLmNvbnRlbnQudG9TdHJpbmcoKSA6IGZpbGUuY29udGVudCxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmFiZWxyYzogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VUeXBlOiAnbW9kdWxlJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cmF2ZXJzZSg8dC5Ob2RlPmZpbGUuYXN0LCB7XG4gICAgICAgICAgICAgICAgZW50ZXIgKHBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhdGguaXNJbXBvcnREZWNsYXJhdGlvbigpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBub2RlID0gcGF0aC5ub2RlXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzb3VyY2UgPSBub2RlLnNvdXJjZVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlLnZhbHVlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIHNvdXJjZS52YWx1ZSA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoc291cmNlLCBmaWxlLnNvdXJjZUZpbGUsIGZpbGUudGFyZ2V0RmlsZSwgbG9jYWxEZXBlbmRlbmN5UG9vbClcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXRoLmlzQ2FsbEV4cHJlc3Npb24oKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHBhdGgubm9kZVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2FsbGVlID0gPHQuSWRlbnRpZmllcj5ub2RlLmNhbGxlZVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYXJncyA9IDx0LlN0cmluZ0xpdGVyYWxbXT5ub2RlLmFyZ3VtZW50c1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJncyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxlZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3NbMF0gJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzWzBdLnZhbHVlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGVlLm5hbWUgPT09ICdyZXF1aXJlJyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiBhcmdzWzBdLnZhbHVlID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShhcmdzWzBdLCBmaWxlLnNvdXJjZUZpbGUsIGZpbGUudGFyZ2V0RmlsZSwgbG9jYWxEZXBlbmRlbmN5UG9vbClcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBmaWxlLmNvbnRlbnQgPSBjb2RlR2VuZXJhdG9yKGZpbGUuYXN0LCB7XG4gICAgICAgICAgICAgICAgY29tcGFjdDogIWRldk1vZGUsXG4gICAgICAgICAgICAgICAgbWluaWZpZWQ6ICFkZXZNb2RlXG4gICAgICAgICAgICB9KS5jb2RlXG5cbiAgICAgICAgICAgIGNvbnN0IGRlcGVuZGVuY3lMaXN0ID0gQXJyYXkuZnJvbShsb2NhbERlcGVuZGVuY3lQb29sLmtleXMoKSkuZmlsdGVyKGRlcGVuZGVuY3kgPT4gIWRlcGVuZGVuY3lQb29sLmhhcyhkZXBlbmRlbmN5KSlcblxuICAgICAgICAgICAgUHJvbWlzZS5hbGwoZGVwZW5kZW5jeUxpc3QubWFwKGRlcGVuZGVuY3kgPT4gdHJhdmVyc2VOcG1EZXBlbmRlbmN5KGRlcGVuZGVuY3kpKSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgY2IoKVxuICAgICAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBjYigpXG4gICAgICAgICAgICAgICAgdXRpbHMubG9nZ2VyLmVycm9yKGZpbGUuc291cmNlRmlsZSwgZXJyLm1lc3NhZ2UsIGVycilcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYigpXG4gICAgICAgIH1cbiAgICB9IGFzIFBsdWdpbkhhbmRsZXIpXG5cbiAgICBmdW5jdGlvbiByZXNvbHZlIChub2RlOiBhbnksIHNvdXJjZUZpbGU6IHN0cmluZywgdGFyZ2V0RmlsZTogc3RyaW5nLCBsb2NhbERlcGVuZGVuY3lQb29sOiBNYXA8c3RyaW5nLCBzdHJpbmc+KSB7XG4gICAgICAgIGNvbnN0IHNvdXJjZUJhc2VOYW1lID0gcGF0aC5kaXJuYW1lKHNvdXJjZUZpbGUpXG4gICAgICAgIGNvbnN0IHRhcmdldEJhc2VOYW1lID0gcGF0aC5kaXJuYW1lKHRhcmdldEZpbGUpXG4gICAgICAgIGNvbnN0IG1vZHVsZU5hbWUgPSByZXNvdmxlTW9kdWxlTmFtZShub2RlLnZhbHVlKVxuXG4gICAgICAgIGlmICh1dGlscy5pc05wbURlcGVuZGVuY3kobW9kdWxlTmFtZSkgfHwgdGVzdE5vZGVNb2R1bGVzLnRlc3Qoc291cmNlRmlsZSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGRlcGVuZGVuY3kgPSB1dGlscy5yZXNvbHZlTW9kdWxlKG5vZGUudmFsdWUsIHtcbiAgICAgICAgICAgICAgICBwYXRoczogW3NvdXJjZUJhc2VOYW1lXVxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgLy8gSW4gY2FzZSBgcmVxdWlyZSgnYScpYCwgYGFgIGlzIGxvY2FsIGZpbGUgaW4gc3JjIGRpcmVjdG9yeVxuICAgICAgICAgICAgaWYgKCFkZXBlbmRlbmN5IHx8IHRlc3RTcmNEaXIudGVzdChkZXBlbmRlbmN5KSkgcmV0dXJuXG5cbiAgICAgICAgICAgIGNvbnN0IGRpc3RQYXRoID0gZGVwZW5kZW5jeS5yZXBsYWNlKGNvbmZpZy5zb3VyY2VOb2RlTW9kdWxlcywgY29uZmlnLmRpc3ROb2RlTW9kdWxlcylcblxuICAgICAgICAgICAgbm9kZS52YWx1ZSA9IHBhdGgucmVsYXRpdmUodGFyZ2V0QmFzZU5hbWUsIGRpc3RQYXRoKVxuXG4gICAgICAgICAgICBpZiAobG9jYWxEZXBlbmRlbmN5UG9vbC5oYXMoZGVwZW5kZW5jeSkpIHJldHVyblxuICAgICAgICAgICAgbG9jYWxEZXBlbmRlbmN5UG9vbC5zZXQoZGVwZW5kZW5jeSwgZGVwZW5kZW5jeSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGZ1bmN0aW9uIHRyYXZlcnNlTnBtRGVwZW5kZW5jeSAoZGVwZW5kZW5jeTogc3RyaW5nKSB7XG4gICAgICAgIGRlcGVuZGVuY3lQb29sLnNldChkZXBlbmRlbmN5LCBkZXBlbmRlbmN5KVxuICAgICAgICBjb25zdCBmaWxlID0gYXdhaXQgdXRpbHMuY3JlYXRlRmlsZShkZXBlbmRlbmN5KVxuXG4gICAgICAgIGZpbGUudGFyZ2V0RmlsZSA9IGZpbGUuc291cmNlRmlsZS5yZXBsYWNlKGNvbmZpZy5zb3VyY2VOb2RlTW9kdWxlcywgY29uZmlnLmRpc3ROb2RlTW9kdWxlcylcbiAgICAgICAgYXdhaXQgY29tcGlsZXIuZ2VuZXJhdGVDb21waWxhdGlvbihmaWxlKS5ydW4oKVxuICAgIH1cbn1cbiIsIi8vIGltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBzYXNzUGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvc2Fzc1BhcnNlcidcbmltcG9ydCBmaWxlUGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvZmlsZVBhcnNlcidcbmltcG9ydCBzdHlsZVBhcnNlciBmcm9tICcuLi9wYXJzZXJzL3N0eWxlUGFyc2VyJ1xuaW1wb3J0IGJhYmVsUGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvYmFiZWxQYXJzZXInXG5pbXBvcnQgc2NyaXB0UGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvc2NyaXB0UGFyc2VyJ1xuaW1wb3J0IHRlbXBsYXRlUGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvdGVtcGxhdGVQYXJzZXInXG5pbXBvcnQgc2F2ZUZpbGVQbHVnaW4gZnJvbSAnLi4vcGx1Z2lucy9zYXZlRmlsZVBsdWdpbidcbmltcG9ydCB3eEltcG9ydFBsdWdpbiBmcm9tICcuLi9wbHVnaW5zL3d4SW1wb3J0UGx1Z2luJ1xuaW1wb3J0IHR5cGVzY3JpcHRQYXJzZXIgZnJvbSAnLi4vcGFyc2Vycy90eXBlc2NyaXB0UGFyc2VyJ1xuaW1wb3J0IGV4dHJhY3REZXBlbmRlbmN5UGx1Z2luIGZyb20gJy4uL3BsdWdpbnMvZXh0cmFjdERlcGVuZGVuY3lQbHVnaW4nXG5cbmltcG9ydCB7XG4gICAgSWdub3JlZENvbmZpZ3JhdGlvbixcbiAgICBQYXJzZXJzQ29uZmlncmF0aW9uLFxuICAgIFBsdWdpbnNDb25maWdyYXRpb25cbn0gZnJvbSAnLi4vLi4vdHlwZXMvdHlwZXMnXG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogICAgICAgICAgICAgICAgICAgRGFuZ2VyIHpvbmVcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuLyoqXG4gKiBUaGUgcGF0aCB3aGVyZSBXZUNoYXQgbWluaXByb2dyYW0gc291cmNlIGZpbGVzIGV4aXN0LlxuICogQGRlZmF1bHQgJy4vc3JjJ1xuICovXG5leHBvcnQgY29uc3Qgc291cmNlRGlyID0gJy4vc3JjJ1xuXG4vKipcbiAqIFRoZSBwYXRoIHdoZXJlIFdlQ2hhdCBtaW5pcHJvZ3JhbSBjb21waWxlZCBmaWxlcyBleGlzdC5cbiAqIEBkZWZhdWx0ICcuL2Rpc3QnXG4gKi9cbmV4cG9ydCBjb25zdCBvdXRwdXREaXIgPSAnLi9kaXN0J1xuXG4vKipcbiAqIFRoZSBwYXRoIHdoZXJlIFdlQ2hhdCBtaW5pcHJvZ3JhbSBwYWdlcyBleGlzdC5cbiAqIEBkZWZhdWx0ICcuL3NyYy9wYWdlcydcbiAqL1xuZXhwb3J0IGNvbnN0IHBhZ2VzID0gJy4vcGFnZXMnXG5cbi8qKlxuICogVGhlIHBhdGggd2hlcmUgV2VDaGF0IG1pbmlwcm9ncmFtIGNvbXBvbmVudHMgZXhpc3QuXG4gKiBAZGVmYXVsdCAnLi9zcmMvY29tcG9uZW50cydcbiAqL1xuZXhwb3J0IGNvbnN0IGNvbXBvbmVudHMgPSAnLi9jb21wb25lbnRzJ1xuXG4vKipcbiAqIFRlbXBsYXRlIGZvciBjcmVhdGluZyBwYWdlIGFuZCBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCBjb25zdCB0ZW1wbGF0ZSA9IHtcbiAgICBwYWdlOiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vdGVtcGxhdGUvcGFnZScpLFxuICAgIGNvbXBvbmVudDogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL3RlbXBsYXRlL2NvbXBvbmVudCcpXG59XG5cbi8qKlxuICogVGhlIHBhdGggd2hlcmUgV2VDaGF0IG1pbmlwcm9ncmFtIHN1YnBhY2thZ2VzIGV4aXN0LlxuICogQGRlZmF1bHQgJy4vc3JjL3N1YlBhY2thZ2VzJ1xuICovXG5leHBvcnQgY29uc3Qgc3ViUGFja2FnZXMgPSAnLi9zdWJQYWNrYWdlcydcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgICAgICAgICAgICAgICAgQ3VzdG9tIGNvbmZpZ3VyZVxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4vKipcbiAqIFdoZXRoZXIgdG8gb3V0cHV0IGNvbXBpbGUgaW5mb3JtYXRpb24uXG4gKiBAZGVmYXVsdCBmYWxzZVxuICovXG5leHBvcnQgY29uc3QgcXVpZXQgPSBmYWxzZVxuXG4vKipcbiAqIEFua2EgZGV2ZWxvcG1lbnQgbW9kZS5cbiAqIEBkZWZhdWx0IGZhbHNlXG4gKi9cbmV4cG9ydCBjb25zdCBkZXZNb2RlID0gZmFsc2VcblxuLyoqXG4gKiBSZWdpc3RlciBmaWxlIHBhcnNlci5cbiAqL1xuZXhwb3J0IGNvbnN0IHBhcnNlcnM6IFBhcnNlcnNDb25maWdyYXRpb24gPSBbXG4gICAge1xuICAgICAgICBtYXRjaDogLy4qXFwuKGpzfGVzKSQvLFxuICAgICAgICBwYXJzZXJzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGFyc2VyOiBiYWJlbFBhcnNlcixcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB7fVxuICAgICAgICAgICAgfVxuICAgICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG1hdGNoOiAvLipcXC4od3hzc3xjc3N8cG9zdGNzcykkLyxcbiAgICAgICAgcGFyc2VyczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcnNlcjogc3R5bGVQYXJzZXIsXG4gICAgICAgICAgICAgICAgb3B0aW9uczoge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgIH0sXG4gICAge1xuICAgICAgICBtYXRjaDogLy4qXFwuKHNhc3N8c2NzcykkLyxcbiAgICAgICAgcGFyc2VyczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcnNlcjogc2Fzc1BhcnNlcixcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB7fVxuICAgICAgICAgICAgfVxuICAgICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG1hdGNoOiAvLipcXC4odHN8dHlwZXNjcmlwdCkkLyxcbiAgICAgICAgcGFyc2VyczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcnNlcjogdHlwZXNjcmlwdFBhcnNlcixcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB7fVxuICAgICAgICAgICAgfVxuICAgICAgICBdXG4gICAgfVxuXVxuXG4vKipcbiAqIFdoZXRoZXIgdG8gb3V0cHV0IGRlYnVnIGluZm9ybWF0aW9uLlxuICogQGRlZmF1bHQgZmFsc2VcbiAqL1xuZXhwb3J0IGNvbnN0IGRlYnVnOiBib29sZWFuID0gZmFsc2VcblxuLyoqXG4gKiBSZWdpc3RlciBwbHVnaW4uXG4gKi9cbmV4cG9ydCBjb25zdCBwbHVnaW5zOiBQbHVnaW5zQ29uZmlncmF0aW9uID0gW1xuICAgIHtcbiAgICAgICAgcGx1Z2luOiBleHRyYWN0RGVwZW5kZW5jeVBsdWdpbixcbiAgICAgICAgb3B0aW9uczoge31cbiAgICB9LFxuICAgIHtcbiAgICAgICAgcGx1Z2luOiB3eEltcG9ydFBsdWdpbixcbiAgICAgICAgb3B0aW9uczoge31cbiAgICB9LFxuICAgIHtcbiAgICAgICAgcGx1Z2luOiBzYXZlRmlsZVBsdWdpbixcbiAgICAgICAgb3B0aW9uczoge31cbiAgICB9XG5dXG5cbi8qKlxuICogRmlsZXMgdGhhdCB3aWxsIGJlIGlnbm9yZWQgaW4gY29tcGlsYXRpb24uXG4gKi9cbmV4cG9ydCBjb25zdCBpZ25vcmVkOiBJZ25vcmVkQ29uZmlncmF0aW9uID0gW11cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgICAgICAgICAgICAgIGV4cGVyaW1lbnRhbCBjb25maWd1cmVcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuIiwiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IHJlc29sdmVDb25maWcgZnJvbSAnLi4vdXRpbHMvcmVzb2x2ZUNvbmZpZydcbmltcG9ydCAqIGFzIGFua2FEZWZhdWx0Q29uZmlnIGZyb20gJy4vYW5rYURlZmF1bHRDb25maWcnXG5cbmltcG9ydCB7XG4gICAgQW5rYUNvbmZpZ1xufSBmcm9tICcuLi8uLi90eXBlcy90eXBlcydcblxuY29uc3QgY3dkID0gcHJvY2Vzcy5jd2QoKVxuY29uc3QgY3VzdG9tQ29uZmlnID0gPEFua2FDb25maWc+cmVzb2x2ZUNvbmZpZyhbJ2Fua2EuY29uZmlnLmpzJywgJ2Fua2EuY29uZmlnLmpzb24nXSlcblxuZnVuY3Rpb24gbWVyZ2VBcnJheSA8VD4gKC4uLmFycnM6IEFycmF5PFRbXT4pOiBBcnJheTxUPiB7XG4gICAgcmV0dXJuIGFycnMuZmlsdGVyKGFyciA9PiBhcnIgJiYgYXJyLmxlbmd0aCkucmVkdWNlKChwcmV2LCBuZXh0KSA9PiB7XG4gICAgICAgIHJldHVybiBwcmV2LmNvbmNhdChuZXh0KVxuICAgIH0sIFtdKVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgLi4uYW5rYURlZmF1bHRDb25maWcsXG4gICAgLi4uY3VzdG9tQ29uZmlnLFxuICAgIHRlbXBsYXRlOiBjdXN0b21Db25maWcudGVtcGxhdGUgPyB7XG4gICAgICAgIHBhZ2U6IHBhdGguam9pbihjd2QsIGN1c3RvbUNvbmZpZy50ZW1wbGF0ZS5wYWdlKSxcbiAgICAgICAgY29tcG9uZW50OiBwYXRoLmpvaW4oY3dkLCBjdXN0b21Db25maWcudGVtcGxhdGUuY29tcG9uZW50KVxuICAgIH0gOiBhbmthRGVmYXVsdENvbmZpZy50ZW1wbGF0ZSxcbiAgICBwYXJzZXJzOiBtZXJnZUFycmF5KGN1c3RvbUNvbmZpZy5wYXJzZXJzLCBhbmthRGVmYXVsdENvbmZpZy5wYXJzZXJzKSxcbiAgICBwbHVnaW5zOiBtZXJnZUFycmF5KGN1c3RvbUNvbmZpZy5wbHVnaW5zLCBhbmthRGVmYXVsdENvbmZpZy5wbHVnaW5zKSxcbiAgICBpZ25vcmVkOiBtZXJnZUFycmF5KGN1c3RvbUNvbmZpZy5pZ25vcmVkLCBhbmthRGVmYXVsdENvbmZpZy5pZ25vcmVkKVxufVxuIiwiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IGFua2FDb25maWcgZnJvbSAnLi9hbmthQ29uZmlnJ1xuXG5leHBvcnQgY29uc3QgY3dkID0gcHJvY2Vzcy5jd2QoKVxuZXhwb3J0IGNvbnN0IHNyY0RpciA9IHBhdGgucmVzb2x2ZShjd2QsIGFua2FDb25maWcuc291cmNlRGlyKVxuZXhwb3J0IGNvbnN0IGRpc3REaXIgPSBwYXRoLnJlc29sdmUoY3dkLCBhbmthQ29uZmlnLm91dHB1dERpcilcbmV4cG9ydCBjb25zdCBhbmthTW9kdWxlcyA9IHBhdGgucmVzb2x2ZShzcmNEaXIsICdhbmthX21vZHVsZXMnKVxuZXhwb3J0IGNvbnN0IHNvdXJjZU5vZGVNb2R1bGVzID0gcGF0aC5yZXNvbHZlKGN3ZCwgJ25vZGVfbW9kdWxlcycpXG5leHBvcnQgY29uc3QgZGlzdE5vZGVNb2R1bGVzID0gcGF0aC5yZXNvbHZlKGRpc3REaXIsICducG1fbW9kdWxlcycpXG5leHBvcnQgY29uc3QgZGVmYXVsdFNjYWZmb2xkID0gICdpRXhjZXB0aW9uL2Fua2EtcXVpY2tzdGFydCdcbiIsImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJ1xuaW1wb3J0IGFua2FDb25maWcgZnJvbSAnLi9hbmthQ29uZmlnJ1xuaW1wb3J0ICogYXMgc3lzdGVtIGZyb20gJy4vc3lzdGVtQ29uZmlnJ1xuaW1wb3J0IHJlc29sdmVDb25maWcgZnJvbSAnLi4vdXRpbHMvcmVzb2x2ZUNvbmZpZydcblxuY29uc3QgY3VzdG9tQ29uZmlnID0gcmVzb2x2ZUNvbmZpZyhbJ2FwcC5qc29uJ10sIHN5c3RlbS5zcmNEaXIpXG5cbmV4cG9ydCBkZWZhdWx0IE9iamVjdC5hc3NpZ24oe1xuICAgIHBhZ2VzOiBbXSxcbiAgICBzdWJQYWNrYWdlczogW10sXG4gICAgd2luZG93OiB7XG4gICAgICAgIG5hdmlnYXRpb25CYXJUaXRsZVRleHQ6ICdXZWNoYXQnXG4gICAgfVxuICAgIC8vIHRhYkJhcjoge1xuICAgIC8vICAgICBsaXN0OiBbXVxuICAgIC8vIH0sXG59LCBjdXN0b21Db25maWcpXG4iLCJpbXBvcnQgKiBhcyBzeXN0ZW1Db25maWcgZnJvbSAnLi9zeXN0ZW1Db25maWcnXG5pbXBvcnQgYW5rYUNvbmZpZyBmcm9tICcuL2Fua2FDb25maWcnXG5pbXBvcnQgcHJvamVjdENvbmZpZyBmcm9tICcuL3Byb2plY3RDb25maWcnXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICAuLi5zeXN0ZW1Db25maWcsXG4gICAgYW5rYUNvbmZpZyxcbiAgICBwcm9qZWN0Q29uZmlnXG59XG4iLCJpbXBvcnQgKiBhcyBHbG9iIGZyb20gJ2dsb2InXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSdcbmNvbnN0IGdsb2IgPSByZXF1aXJlKCdnbG9iJylcblxuaW1wb3J0IHtcbiAgICBDb250ZW50XG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkRmlsZSAoc291cmNlRmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8QnVmZmVyPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgZnMucmVhZEZpbGUoc291cmNlRmlsZVBhdGgsIChlcnIsIGJ1ZmZlcikgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoYnVmZmVyKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZUZpbGUgKHRhcmdldEZpbGVQYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IENvbnRlbnQpOiBQcm9taXNlPHVuZGVmaW5lZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGZzLndyaXRlRmlsZSh0YXJnZXRGaWxlUGF0aCwgY29udGVudCwgZXJyID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VhcmNoRmlsZXMgKHNjaGVtZTogc3RyaW5nLCBvcHRpb25zPzogR2xvYi5JT3B0aW9ucyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBnbG9iKHNjaGVtZSwgb3B0aW9ucywgKGVycjogKEVycm9yIHwgbnVsbCksIGZpbGVzOiBBcnJheTxzdHJpbmc+KTogdm9pZCA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShmaWxlcylcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9KVxufVxuIiwiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnXG5pbXBvcnQgY29uZmlnIGZyb20gJy4uLy4uL2NvbmZpZydcbmltcG9ydCAqIGFzIHQgZnJvbSAnQGJhYmVsL3R5cGVzJ1xuaW1wb3J0ICogYXMgUG9zdENTUyBmcm9tICdwb3N0Y3NzJ1xuaW1wb3J0IHtcbiAgICBDb250ZW50LFxuICAgIEZpbGVDb25zdHJ1Y3Rvck9wdGlvblxufSBmcm9tICcuLi8uLi8uLi90eXBlcy90eXBlcydcblxuY29uc3QgcmVwbGFjZUV4dCA9IHJlcXVpcmUoJ3JlcGxhY2UtZXh0JylcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRmlsZSB7XG4gICAgcHVibGljIHNvdXJjZUZpbGU6IHN0cmluZ1xuICAgIHB1YmxpYyBjb250ZW50OiBDb250ZW50XG4gICAgcHVibGljIHRhcmdldEZpbGU6IHN0cmluZ1xuICAgIHB1YmxpYyBhc3Q/OiB0Lk5vZGUgfCBQb3N0Q1NTLlJlc3VsdFxuICAgIHB1YmxpYyBzb3VyY2VNYXA/OiBDb250ZW50XG4gICAgcHVibGljIGlzSW5TcmNEaXI/OiBib29sZWFuXG5cbiAgICBjb25zdHJ1Y3RvciAob3B0aW9uOiBGaWxlQ29uc3RydWN0b3JPcHRpb24pIHtcbiAgICAgICAgY29uc3QgaXNJblNyY0RpclRlc3QgPSBuZXcgUmVnRXhwKGBeJHtjb25maWcuc3JjRGlyfWApXG5cbiAgICAgICAgaWYgKCFvcHRpb24uc291cmNlRmlsZSkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHZhbHVlOiBGaWxlQ29uc3RydWN0b3JPcHRpb24uc291cmNlRmlsZScpXG4gICAgICAgIGlmICghb3B0aW9uLmNvbnRlbnQpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCB2YWx1ZTogRmlsZUNvbnN0cnVjdG9yT3B0aW9uLmNvbnRlbnQnKVxuXG4gICAgICAgIHRoaXMuc291cmNlRmlsZSA9IG9wdGlvbi5zb3VyY2VGaWxlXG4gICAgICAgIHRoaXMudGFyZ2V0RmlsZSA9IG9wdGlvbi50YXJnZXRGaWxlIHx8IG9wdGlvbi5zb3VyY2VGaWxlLnJlcGxhY2UoY29uZmlnLnNyY0RpciwgY29uZmlnLmRpc3REaXIpIC8vIERlZmF1bHQgdmFsdWVcbiAgICAgICAgdGhpcy5jb250ZW50ID0gb3B0aW9uLmNvbnRlbnRcbiAgICAgICAgdGhpcy5zb3VyY2VNYXAgPSBvcHRpb24uc291cmNlTWFwXG4gICAgICAgIHRoaXMuaXNJblNyY0RpciA9IGlzSW5TcmNEaXJUZXN0LnRlc3QodGhpcy5zb3VyY2VGaWxlKVxuICAgIH1cblxuICAgIGdldCBkaXJuYW1lICgpIHtcbiAgICAgICAgcmV0dXJuIHBhdGguZGlybmFtZSh0aGlzLnRhcmdldEZpbGUpXG4gICAgfVxuXG4gICAgZ2V0IGJhc2VuYW1lICgpIHtcbiAgICAgICAgcmV0dXJuIHBhdGguYmFzZW5hbWUodGhpcy50YXJnZXRGaWxlKVxuICAgIH1cblxuICAgIGdldCBleHRuYW1lICgpIHtcbiAgICAgICAgcmV0dXJuIHBhdGguZXh0bmFtZSh0aGlzLnRhcmdldEZpbGUpXG4gICAgfVxuXG4gICAgYXN5bmMgc2F2ZVRvIChwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgYXdhaXQgZnMuZW5zdXJlRmlsZShwYXRoKVxuXG4gICAgICAgIGlmICghcGF0aCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHBhdGgnKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlRXh0IChleHQ6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICB0aGlzLnRhcmdldEZpbGUgPSByZXBsYWNlRXh0KHRoaXMudGFyZ2V0RmlsZSwgZXh0KVxuICAgIH1cblxuICAgIGNvbnZlcnRDb250ZW50VG9TdHJpbmcgKCkge1xuICAgICAgICBpZiAodGhpcy5jb250ZW50IGluc3RhbmNlb2YgQnVmZmVyKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRlbnQgPSB0aGlzLmNvbnRlbnQudG9TdHJpbmcoKVxuICAgICAgICB9XG4gICAgfVxufVxuIiwiaW1wb3J0IHtcbiAgICByZWFkRmlsZVxufSBmcm9tICcuL2ZzJ1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnXG5pbXBvcnQgRmlsZSBmcm9tICcuLi9jb3JlL2NsYXNzL0ZpbGUnXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVGaWxlIChzb3VyY2VGaWxlOiBzdHJpbmcpOiBQcm9taXNlPEZpbGU+IHtcbiAgICByZXR1cm4gcmVhZEZpbGUoc291cmNlRmlsZSkudGhlbihjb250ZW50ID0+IHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgRmlsZSh7XG4gICAgICAgICAgICBzb3VyY2VGaWxlLFxuICAgICAgICAgICAgY29udGVudFxuICAgICAgICB9KSlcbiAgICB9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRmlsZVN5bmMgKHNvdXJjZUZpbGU6IHN0cmluZykge1xuICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoc291cmNlRmlsZSlcbiAgICByZXR1cm4gbmV3IEZpbGUoe1xuICAgICAgICBzb3VyY2VGaWxlLFxuICAgICAgICBjb250ZW50XG4gICAgfSlcbn1cbiIsImltcG9ydCB7IE9wdGlvbnMgYXMgVGVtcGxhdGVPcHRpb25zIH0gZnJvbSAnZWpzJ1xuaW1wb3J0IHsgbWVtRnNFZGl0b3IgYXMgTWVtRnNFZGl0b3IgfSBmcm9tICdtZW0tZnMtZWRpdG9yJ1xuXG5jb25zdCBtZW1GcyA9IHJlcXVpcmUoJ21lbS1mcycpXG5jb25zdCBtZW1Gc0VkaXRvciA9IHJlcXVpcmUoJ21lbS1mcy1lZGl0b3InKVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGc0VkaXRvciB7XG4gICAgZWRpdG9yOiBNZW1Gc0VkaXRvci5FZGl0b3JcblxuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgY29uc3Qgc3RvcmUgPSBtZW1Gcy5jcmVhdGUoKVxuXG4gICAgICAgIHRoaXMuZWRpdG9yID0gbWVtRnNFZGl0b3IuY3JlYXRlKHN0b3JlKVxuICAgIH1cblxuICAgIGNvcHkgKGZyb206IHN0cmluZywgdG86IHN0cmluZywgY29udGV4dDogb2JqZWN0LCB0ZW1wbGF0ZU9wdGlvbnM/OiBUZW1wbGF0ZU9wdGlvbnMsIGNvcHlPcHRpb25zPzogTWVtRnNFZGl0b3IuQ29weU9wdGlvbnMpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5lZGl0b3IuY29weVRwbChmcm9tLCB0bywgY29udGV4dCwgdGVtcGxhdGVPcHRpb25zLCBjb3B5T3B0aW9ucylcbiAgICB9XG5cbiAgICB3cml0ZSAoZmlsZXBhdGg6IHN0cmluZywgY29udGVudHM6IE1lbUZzRWRpdG9yLkNvbnRlbnRzKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZWRpdG9yLndyaXRlKGZpbGVwYXRoLCBjb250ZW50cylcbiAgICB9XG5cbiAgICB3cml0ZUpTT04gKGZpbGVwYXRoOiBzdHJpbmcsIGNvbnRlbnRzOiBhbnksIHJlcGxhY2VyPzogTWVtRnNFZGl0b3IuUmVwbGFjZXJGdW5jLCBzcGFjZT86IE1lbUZzRWRpdG9yLlNwYWNlKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZWRpdG9yLndyaXRlSlNPTihmaWxlcGF0aCwgY29udGVudHMsIHJlcGxhY2VyIHx8IG51bGwsIHNwYWNlID0gNClcbiAgICB9XG5cbiAgICByZWFkIChmaWxlcGF0aDogc3RyaW5nLCBvcHRpb25zPzogeyByYXc6IGJvb2xlYW4sIGRlZmF1bHRzOiBzdHJpbmcgfSk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLmVkaXRvci5yZWFkKGZpbGVwYXRoLCBvcHRpb25zKVxuICAgIH1cblxuICAgIHJlYWRKU09OIChmaWxlcGF0aDogc3RyaW5nLCBkZWZhdWx0cz86IGFueSk6IHZvaWQge1xuICAgICAgICB0aGlzLmVkaXRvci5yZWFkSlNPTihmaWxlcGF0aCwgZGVmYXVsdHMpXG4gICAgfVxuXG4gICAgc2F2ZSAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgdGhpcy5lZGl0b3IuY29tbWl0KHJlc29sdmUpXG4gICAgICAgIH0pXG4gICAgfVxufVxuIiwiaW1wb3J0IGxvZyBmcm9tICcuL2xvZ2dlcidcbmltcG9ydCBhbmthQ29uZmlnIGZyb20gJy4uL2NvbmZpZy9hbmthQ29uZmlnJ1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAoaWQ6IHN0cmluZywgb3B0aW9ucz86IHsgcGF0aHM/OiBzdHJpbmdbXSB9KTogc3RyaW5nIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gcmVxdWlyZS5yZXNvbHZlKGlkLCBvcHRpb25zKVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBsb2cuZXJyb3IoJ01pc3NpbmcgZGVwZW5kZW5jeScsIGlkLCAhYW5rYUNvbmZpZy5xdWlldCA/IGBpbiAke29wdGlvbnMucGF0aHN9YCA6IG51bGwpXG4gICAgfVxufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY2FsbFByb21pc2VJbkNoYWluIChsaXN0OiBBcnJheTwoLi4ucGFyYW1zOiBhbnlbXSkgPT4gUHJvbWlzZTxhbnk+PiA9IFtdLCAuLi5wYXJhbXM6IEFycmF5PGFueT4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBpZiAoIWxpc3QubGVuZ3RoKSAge1xuICAgICAgICAgICAgcmVzb2x2ZSgpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBsZXQgc3RlcCA9IGxpc3RbMF0oLi4ucGFyYW1zKVxuXG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgc3RlcCA9IHN0ZXAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxpc3RbaV0oLi4ucGFyYW1zKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIHN0ZXAudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgcmVzb2x2ZSgpXG4gICAgICAgIH0sIGVyciA9PiB7XG4gICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICB9KVxuICAgIH0pXG59XG4iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAoZm46IEZ1bmN0aW9uKTogKCkgPT4gUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICguLi5wYXJhbXM6IEFycmF5PGFueT4pIHtcbiAgICAgICAgY29uc3QgbGltaXRhdGlvbiA9IHBhcmFtcy5sZW5ndGhcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICBpZiAoZm4ubGVuZ3RoID4gbGltaXRhdGlvbikge1xuICAgICAgICAgICAgICAgIGZuKC4uLnBhcmFtcywgcmVzb2x2ZSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShmbiguLi5wYXJhbXMpKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cbn1cbiIsImltcG9ydCAqIGFzIGNob2tpZGFyIGZyb20gJ2Nob2tpZGFyJ1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAoZGlyOiBzdHJpbmcgfCBzdHJpbmdbXSwgb3B0aW9ucz86IGNob2tpZGFyLldhdGNoT3B0aW9ucyk6IGNob2tpZGFyLkZTV2F0Y2hlciB7XG4gICAgcmV0dXJuIGNob2tpZGFyLndhdGNoKGRpciwge1xuICAgICAgICBwZXJzaXN0ZW50OiB0cnVlLFxuICAgICAgICBpZ25vcmVJbml0aWFsOiB0cnVlLFxuICAgICAgICAuLi5vcHRpb25zXG4gICAgfSlcbn1cbiIsImRlY2xhcmUgdHlwZSBWYWxpZGF0ZU5wbVBhY2thZ2VOYW1lID0ge1xuICAgIHZhbGlkRm9yTmV3UGFja2FnZXM6IGJvb2xlYW4sXG4gICAgdmFsaWRGb3JPbGRQYWNrYWdlczogYm9vbGVhblxufVxuXG5jb25zdCB2YWxpZGF0ZSA9IHJlcXVpcmUoJ3ZhbGlkYXRlLW5wbS1wYWNrYWdlLW5hbWUnKVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAocmVxdWlyZWQ6IHN0cmluZyA9ICcnKTogYm9vbGVhbiB7XG4gICAgY29uc3QgcmVzdWx0ID0gPFZhbGlkYXRlTnBtUGFja2FnZU5hbWU+dmFsaWRhdGUocmVxdWlyZWQpXG5cbiAgICByZXR1cm4gcmVzdWx0LnZhbGlkRm9yTmV3UGFja2FnZXMgfHwgcmVzdWx0LnZhbGlkRm9yT2xkUGFja2FnZXNcbn1cbiIsImltcG9ydCBkb3dubG9hZFJlcG8gZnJvbSAnZG93bmxvYWQtZ2l0LXJlcG8nXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChyZXBvOiBzdHJpbmcsIHBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGRvd25sb2FkUmVwbyhyZXBvLCBwYXRoLCB7IGNsb25lOiBmYWxzZSB9LCAoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgZXJyID8gcmVqZWN0KGVycikgOiByZXNvbHZlKClcbiAgICAgICAgfSlcbiAgICB9KVxufVxuIiwiaW1wb3J0IENvbXBpbGVyIGZyb20gJy4vQ29tcGlsZXInXG5pbXBvcnQgY29uZmlnIGZyb20gJy4uLy4uL2NvbmZpZydcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uLy4uL3V0aWxzJ1xuXG5pbXBvcnQge1xuICAgIFV0aWxzLFxuICAgIEFua2FDb25maWcsXG4gICAgUGFyc2VyT3B0aW9ucyxcbiAgICBQcm9qZWN0Q29uZmlnLFxuICAgIFBsdWdpbkhhbmRsZXIsXG4gICAgUGx1Z2luT3B0aW9ucyxcbiAgICBDb21waWxlckNvbmZpZ1xufSBmcm9tICcuLi8uLi8uLi90eXBlcy90eXBlcydcblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEluamVjdGlvbiB7XG4gICAgY29tcGlsZXI6IENvbXBpbGVyXG4gICAgb3B0aW9uczogb2JqZWN0XG5cbiAgICBjb25zdHJ1Y3RvciAoY29tcGlsZXI6IENvbXBpbGVyLCBvcHRpb25zPzogb2JqZWN0KSB7XG4gICAgICAgIHRoaXMuY29tcGlsZXIgPSBjb21waWxlclxuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zXG4gICAgfVxuXG4gICAgYWJzdHJhY3QgZ2V0T3B0aW9ucyAoKTogb2JqZWN0XG5cbiAgICBnZXRDb21waWxlciAoKTogQ29tcGlsZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5jb21waWxlclxuICAgIH1cblxuICAgIGdldFV0aWxzICgpIHtcbiAgICAgICAgcmV0dXJuIHV0aWxzXG4gICAgfVxuXG4gICAgZ2V0QW5rYUNvbmZpZyAoKTogQW5rYUNvbmZpZyB7XG4gICAgICAgIHJldHVybiBjb25maWcuYW5rYUNvbmZpZ1xuICAgIH1cblxuICAgIGdldFN5c3RlbUNvbmZpZyAoKTogQ29tcGlsZXJDb25maWcge1xuICAgICAgICByZXR1cm4gY29uZmlnXG4gICAgfVxuXG4gICAgZ2V0UHJvamVjdENvbmZpZyAoKTogUHJvamVjdENvbmZpZyB7XG4gICAgICAgIHJldHVybiBjb25maWcucHJvamVjdENvbmZpZ1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFBsdWdpbkluamVjdGlvbiBleHRlbmRzIEluamVjdGlvbiB7XG5cbiAgICBjb25zdHJ1Y3RvciAoY29tcGlsZXI6IENvbXBpbGVyLCBvcHRpb25zOiBQbHVnaW5PcHRpb25zWydvcHRpb25zJ10pIHtcbiAgICAgICAgc3VwZXIoY29tcGlsZXIsIG9wdGlvbnMpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIFBsdWdpbiBvcHRpb25zXG4gICAgICovXG4gICAgZ2V0T3B0aW9ucyAoKTogb2JqZWN0IHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucyB8fCB7fVxuICAgIH1cblxuICAgIG9uIChldmVudDogc3RyaW5nLCBoYW5kbGVyOiBQbHVnaW5IYW5kbGVyKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY29tcGlsZXIub24oZXZlbnQsIGhhbmRsZXIpXG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgUGFyc2VySW5qZWN0aW9uIGV4dGVuZHMgSW5qZWN0aW9uIHtcblxuICAgIC8qKlxuICAgICAqIFJldHVybiBQYXJzZXJPcHRpb25zXG4gICAgICovXG4gICAgZ2V0T3B0aW9ucyAoKTogb2JqZWN0IHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucyB8fCB7fVxuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yIChjb21waWxlcjogQ29tcGlsZXIsIG9wdGlvbnM6IFBhcnNlck9wdGlvbnNbJ29wdGlvbnMnXSkge1xuICAgICAgICBzdXBlcihjb21waWxlciwgb3B0aW9ucylcbiAgICB9XG59XG4iLCJpbXBvcnQgRmlsZSBmcm9tICcuL0ZpbGUnXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgY29uZmlnIGZyb20gJy4uLy4uL2NvbmZpZydcbmltcG9ydCBDb21waWxlciBmcm9tICcuL0NvbXBpbGVyJ1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vLi4vdXRpbHMnXG5cbmltcG9ydCB7XG4gICAgUGFyc2VyLFxuICAgIE1hdGNoZXIsXG4gICAgUGx1Z2luSGFuZGxlcixcbiAgICBQbHVnaW5PcHRpb25zLFxuICAgIENvbXBpbGVyQ29uZmlnXG59IGZyb20gJy4uLy4uLy4uL3R5cGVzL3R5cGVzJ1xuaW1wb3J0IG1lc3NhZ2VyIGZyb20gJy4uLy4uL3V0aWxzL21lc3NhZ2VyJ1xuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi4vLi4vdXRpbHMnXG5cbi8qKlxuICogQSBjb21waWxhdGlvbiB0YXNrXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbXBpbGF0aW9uIHtcbiAgICBjb25maWc6IENvbXBpbGVyQ29uZmlnXG4gICAgcmVhZG9ubHkgY29tcGlsZXI6IENvbXBpbGVyXG4gICAgaWQ6IG51bWJlciAgICAgICAgLy8gVW5pcXVl77yMZm9yIGVhY2ggQ29tcGlsYXRpb25cbiAgICBmaWxlOiBGaWxlXG4gICAgc291cmNlRmlsZTogc3RyaW5nXG4gICAgZGVzdHJveWVkOiBib29sZWFuXG5cbiAgICBjb25zdHJ1Y3RvciAoZmlsZTogRmlsZSB8IHN0cmluZywgY29uZjogQ29tcGlsZXJDb25maWcsIGNvbXBpbGVyOiBDb21waWxlcikge1xuICAgICAgICB0aGlzLmNvbXBpbGVyID0gY29tcGlsZXJcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25mXG4gICAgICAgIHRoaXMuaWQgPSBDb21waWxlci5jb21waWxhdGlvbklkKytcblxuICAgICAgICBpZiAoZmlsZSBpbnN0YW5jZW9mIEZpbGUpIHtcbiAgICAgICAgICAgIHRoaXMuZmlsZSA9IGZpbGVcbiAgICAgICAgICAgIHRoaXMuc291cmNlRmlsZSA9IGZpbGUuc291cmNlRmlsZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zb3VyY2VGaWxlID0gZmlsZVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5lbnJvbGwoKVxuICAgIH1cblxuICAgIGFzeW5jIHJ1biAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmxvYWRGaWxlKClcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuaW52b2tlUGFyc2VycygpXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGUoKVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB1dGlscy5sb2dnZXIuZXJyb3IoJ0NvbXBpbGUnLCBlLm1lc3NhZ2UsIGUpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBsb2FkRmlsZSAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICh0aGlzLmRlc3Ryb3llZCkgcmV0dXJuXG5cbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlci5lbWl0KCdiZWZvcmUtbG9hZC1maWxlJywgdGhpcylcbiAgICAgICAgaWYgKCEodGhpcy5maWxlIGluc3RhbmNlb2YgRmlsZSkpIHtcbiAgICAgICAgICAgIHRoaXMuZmlsZSA9IGF3YWl0IHV0aWxzLmNyZWF0ZUZpbGUodGhpcy5zb3VyY2VGaWxlKVxuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlci5lbWl0KCdhZnRlci1sb2FkLWZpbGUnLCB0aGlzKVxuICAgIH1cblxuICAgIGFzeW5jIGludm9rZVBhcnNlcnMgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBpZiAodGhpcy5kZXN0cm95ZWQpIHJldHVyblxuXG4gICAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLmZpbGVcbiAgICAgICAgY29uc3QgcGFyc2VycyA9IDxQYXJzZXJbXT50aGlzLmNvbXBpbGVyLnBhcnNlcnMuZmlsdGVyKChtYXRjaGVyczogTWF0Y2hlcikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoZXJzLm1hdGNoLnRlc3QoZmlsZS5zb3VyY2VGaWxlKVxuICAgICAgICB9KS5tYXAoKG1hdGNoZXJzOiBNYXRjaGVyKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hlcnMucGFyc2Vyc1xuICAgICAgICB9KS5yZWR1Y2UoKHByZXYsIG5leHQpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBwcmV2LmNvbmNhdChuZXh0KVxuICAgICAgICB9LCBbXSlcbiAgICAgICAgY29uc3QgdGFza3MgPSBwYXJzZXJzLm1hcChwYXJzZXIgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHV0aWxzLmFzeW5jRnVuY3Rpb25XcmFwcGVyKHBhcnNlcilcbiAgICAgICAgfSlcblxuICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGVyLmVtaXQoJ2JlZm9yZS1wYXJzZScsIHRoaXMpXG4gICAgICAgIGF3YWl0IHV0aWxzLmNhbGxQcm9taXNlSW5DaGFpbih0YXNrcywgZmlsZSwgdGhpcylcbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlci5lbWl0KCdhZnRlci1wYXJzZScsIHRoaXMpXG4gICAgfVxuXG4gICAgYXN5bmMgY29tcGlsZSAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICh0aGlzLmRlc3Ryb3llZCkgcmV0dXJuXG5cbiAgICAgICAgLy8gSW52b2tlIEV4dHJhY3REZXBlbmRlbmN5UGx1Z2luLlxuICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGVyLmVtaXQoJ2JlZm9yZS1jb21waWxlJywgdGhpcylcbiAgICAgICAgLy8gRG8gc29tZXRoaW5nIGVsc2UuXG4gICAgICAgIGF3YWl0IHRoaXMuY29tcGlsZXIuZW1pdCgnYWZ0ZXItY29tcGlsZScsIHRoaXMpXG4gICAgICAgIGF3YWl0IHRoaXMuY29tcGlsZXIuZW1pdCgnc2F2ZScsIHRoaXMpXG4gICAgICAgIGNvbmZpZy5hbmthQ29uZmlnLmRlYnVnICYmIHV0aWxzLmxvZ2dlci5pbmZvKCdDb21waWxlJywgdGhpcy5maWxlLnNvdXJjZUZpbGUucmVwbGFjZShgJHtjb25maWcuY3dkfSR7cGF0aC5zZXB9YCwgJycpKVxuICAgICAgICB0aGlzLmRlc3Ryb3koKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVyIG9uIENvbXBpbGVyIGFuZCBkZXN0cm95IHRoZSBwcmV2aW91cyBvbmUgaWYgY29uZmxpY3QgYXJpc2VzLlxuICAgICAqL1xuICAgIGVucm9sbCAoKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IG9sZENvbXBpbGF0aW9uID0gQ29tcGlsZXIuY29tcGlsYXRpb25Qb29sLmdldCh0aGlzLnNvdXJjZUZpbGUpXG5cbiAgICAgICAgaWYgKG9sZENvbXBpbGF0aW9uKSB7XG4gICAgICAgICAgICBpZiAoY29uZmlnLmFua2FDb25maWcuZGVidWcpIGNvbnNvbGUubG9nKCdcYkRlc3Ryb3kgQ29tcGlsYXRpb24nLCBvbGRDb21waWxhdGlvbi5pZCwgb2xkQ29tcGlsYXRpb24uc291cmNlRmlsZSlcblxuICAgICAgICAgICAgb2xkQ29tcGlsYXRpb24uZGVzdHJveSgpXG4gICAgICAgIH1cbiAgICAgICAgQ29tcGlsZXIuY29tcGlsYXRpb25Qb29sLnNldCh0aGlzLnNvdXJjZUZpbGUsIHRoaXMpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVW5yZWdpc3RlciB0aGVtc2VsdmVzIGZyb20gQ29tcGlsZXIuXG4gICAgICovXG4gICAgZGVzdHJveSAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZGVzdHJveWVkID0gdHJ1ZVxuICAgICAgICBDb21waWxlci5jb21waWxhdGlvblBvb2wuZGVsZXRlKHRoaXMuc291cmNlRmlsZSlcbiAgICB9XG59XG4iLCJpbXBvcnQge1xuICAgIFBhcnNlckluamVjdGlvbixcbiAgICBQbHVnaW5JbmplY3Rpb25cbn0gZnJvbSAnLi9JbmplY3Rpb24nXG5pbXBvcnQgRmlsZSBmcm9tICcuL0ZpbGUnXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSdcbmltcG9ydCBjb25maWcgZnJvbSAnLi4vLi4vY29uZmlnJ1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vLi4vdXRpbHMnXG5pbXBvcnQgQ29tcGlsYXRpb24gZnJvbSAnLi9Db21waWxhdGlvbidcbmltcG9ydCBtZXNzYWdlciBmcm9tICcuLi8uLi91dGlscy9tZXNzYWdlcidcbmltcG9ydCBjYWxsUHJvbWlzZUluQ2hhaW4gZnJvbSAnLi4vLi4vdXRpbHMvY2FsbFByb21pc2VJbkNoYWluJ1xuaW1wb3J0IGFzeW5jRnVuY3Rpb25XcmFwcGVyIGZyb20gJy4uLy4uL3V0aWxzL2FzeW5jRnVuY3Rpb25XcmFwcGVyJ1xuXG5pbXBvcnQge1xuICAgIFBhcnNlcixcbiAgICBQYXJzZXJPcHRpb25zLFxuICAgIFBsdWdpbkhhbmRsZXIsXG4gICAgUGx1Z2luT3B0aW9ucyxcbiAgICBDb21waWxlckNvbmZpZ1xufSBmcm9tICcuLi8uLi8uLi90eXBlcy90eXBlcydcblxuY29uc3QgeyBsb2dnZXIgfSA9IHV0aWxzXG5jb25zdCBkZWwgPSByZXF1aXJlKCdkZWwnKVxuXG4vKipcbiAqIFRoZSBjb3JlIGNvbXBpbGVyLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb21waWxlciB7XG4gICAgcmVhZG9ubHkgY29uZmlnOiBDb21waWxlckNvbmZpZ1xuICAgIHB1YmxpYyBzdGF0aWMgY29tcGlsYXRpb25JZCA9IDFcbiAgICBwdWJsaWMgc3RhdGljIGNvbXBpbGF0aW9uUG9vbCA9IG5ldyBNYXA8c3RyaW5nLCBDb21waWxhdGlvbj4oKVxuICAgIHBsdWdpbnM6IHtcbiAgICAgICAgW2V2ZW50TmFtZTogc3RyaW5nXTogQXJyYXk8UGx1Z2luSGFuZGxlcj5cbiAgICB9ID0ge1xuICAgICAgICAnYmVmb3JlLWxvYWQtZmlsZSc6IFtdLFxuICAgICAgICAnYWZ0ZXItbG9hZC1maWxlJzogW10sXG4gICAgICAgICdiZWZvcmUtcGFyc2UnOiBbXSxcbiAgICAgICAgJ2FmdGVyLXBhcnNlJzogW10sXG4gICAgICAgICdiZWZvcmUtY29tcGlsZSc6IFtdLFxuICAgICAgICAnYWZ0ZXItY29tcGlsZSc6IFtdLFxuICAgICAgICAnc2F2ZSc6IFtdXG4gICAgfVxuICAgIHBhcnNlcnM6IEFycmF5PHtcbiAgICAgICAgbWF0Y2g6IFJlZ0V4cCxcbiAgICAgICAgcGFyc2VyczogQXJyYXk8UGFyc2VyPlxuICAgIH0+ID0gW11cblxuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWdcbiAgICAgICAgdGhpcy5pbml0UGFyc2VycygpXG4gICAgICAgIHRoaXMuaW5pdFBsdWdpbnMoKVxuXG4gICAgICAgIGlmIChjb25maWcuYW5rYUNvbmZpZy5kZWJ1Zykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkodGhpcy5jb25maWcsIChrZXksIHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRnVuY3Rpb24pIHJldHVybiAnW0Z1bmN0aW9uXSdcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWVcbiAgICAgICAgICAgIH0sIDQpKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXIgUGx1Z2luLlxuICAgICAqIEBwYXJhbSBldmVudFxuICAgICAqIEBwYXJhbSBoYW5kbGVyXG4gICAgICovXG4gICAgb24gKGV2ZW50OiBzdHJpbmcsIGhhbmRsZXI6IFBsdWdpbkhhbmRsZXIpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMucGx1Z2luc1tldmVudF0gPT09IHZvaWQgKDApKSB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gaG9vazogJHtldmVudH1gKVxuICAgICAgICB0aGlzLnBsdWdpbnNbZXZlbnRdLnB1c2goaGFuZGxlcilcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbnZva2UgbGlmZWN5Y2xlIGhvb2tzKFByb21pc2UgY2hhaW5pbmcpLlxuICAgICAqIEBwYXJhbSBldmVudFxuICAgICAqIEBwYXJhbSBjb21waWxhdGlvblxuICAgICAqL1xuICAgIGFzeW5jIGVtaXQgKGV2ZW50OiBzdHJpbmcsIGNvbXBpbGF0aW9uOiBDb21waWxhdGlvbik6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGlmIChjb21waWxhdGlvbi5kZXN0cm95ZWQpIHJldHVyblxuXG4gICAgICAgIGNvbnN0IHBsdWdpbnMgPSB0aGlzLnBsdWdpbnNbZXZlbnRdXG5cbiAgICAgICAgaWYgKCFwbHVnaW5zIHx8ICFwbHVnaW5zLmxlbmd0aCkgcmV0dXJuXG5cbiAgICAgICAgY29uc3QgdGFza3MgPSBwbHVnaW5zLm1hcChwbHVnaW4gPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGFzeW5jRnVuY3Rpb25XcmFwcGVyKHBsdWdpbilcbiAgICAgICAgfSlcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgY2FsbFByb21pc2VJbkNoYWluKHRhc2tzLCBjb21waWxhdGlvbilcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdXRpbHMubG9nZ2VyLmVycm9yKCdDb21waWxlJywgZS5tZXNzYWdlLCBlKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2xlYW4gZGlzdCBkaXJlY3RvcnkuXG4gICAgICovXG4gICAgYXN5bmMgY2xlYW4gKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCBkZWwoW1xuICAgICAgICAgICAgcGF0aC5qb2luKGNvbmZpZy5kaXN0RGlyLCAnKiovKicpLFxuICAgICAgICAgICAgYCEke3BhdGguam9pbihjb25maWcuZGlzdERpciwgJ2FwcC5qcycpfWAsXG4gICAgICAgICAgICBgISR7cGF0aC5qb2luKGNvbmZpZy5kaXN0RGlyLCAnYXBwLmpzb24nKX1gLFxuICAgICAgICAgICAgYCEke3BhdGguam9pbihjb25maWcuZGlzdERpciwgJ3Byb2plY3QuY29uZmlnLmpzb24nKX1gXG4gICAgICAgIF0pXG4gICAgICAgIGxvZ2dlci5zdWNjZXNzKCdDbGVhbiB3b3Jrc2hvcCcsIGNvbmZpZy5kaXN0RGlyKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV2ZXJ5dGhpbmcgc3RhcnQgZnJvbSBoZXJlLlxuICAgICAqL1xuICAgIGFzeW5jIGxhdW5jaCAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgY29uc3Qgc3RhcnR1cFRpbWUgPSBEYXRlLm5vdygpXG4gICAgICAgIGNvbnN0IGZpbGVQYXRoczogc3RyaW5nW10gPSBhd2FpdCB1dGlscy5zZWFyY2hGaWxlcyhgKiovKmAsIHtcbiAgICAgICAgICAgIGN3ZDogY29uZmlnLnNyY0RpcixcbiAgICAgICAgICAgIG5vZGlyOiB0cnVlLFxuICAgICAgICAgICAgc2lsZW50OiBmYWxzZSxcbiAgICAgICAgICAgIGFic29sdXRlOiB0cnVlLFxuICAgICAgICAgICAgaWdub3JlOiBjb25maWcuYW5rYUNvbmZpZy5pZ25vcmVkXG4gICAgICAgIH0pXG4gICAgICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgUHJvbWlzZS5hbGwoZmlsZVBhdGhzLm1hcChmaWxlID0+IHtcbiAgICAgICAgICAgIHJldHVybiB1dGlscy5jcmVhdGVGaWxlKGZpbGUpXG4gICAgICAgIH0pKVxuICAgICAgICBjb25zdCBjb21waWxhdGlvbnMgPSBmaWxlcy5tYXAoZmlsZSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IENvbXBpbGF0aW9uKGZpbGUsIHRoaXMuY29uZmlnLCB0aGlzKVxuICAgICAgICB9KVxuXG4gICAgICAgIGZzLmVuc3VyZURpclN5bmMoY29uZmlnLmRpc3ROb2RlTW9kdWxlcylcblxuICAgICAgICAvLyBhd2FpdCBQcm9taXNlLmFsbChjb21waWxhdGlvbnMubWFwKGNvbXBpbGF0aW9uID0+IGNvbXBpbGF0aW9uLmxvYWRGaWxlKCkpKVxuICAgICAgICAvLyBhd2FpdCBQcm9taXNlLmFsbChjb21waWxhdGlvbnMubWFwKGNvbXBpbGF0aW9uID0+IGNvbXBpbGF0aW9uLmludm9rZVBhcnNlcnMoKSkpXG5cbiAgICAgICAgLy8gVE9ETzogR2V0IGFsbCBmaWxlc1xuICAgICAgICAvLyBDb21waWxlci5jb21waWxhdGlvblBvb2wudmFsdWVzKClcblxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChjb21waWxhdGlvbnMubWFwKGNvbXBpbGF0aW9ucyA9PiBjb21waWxhdGlvbnMucnVuKCkpKVxuXG4gICAgICAgIGlmIChtZXNzYWdlci5oYXNFcnJvcigpKSB7XG4gICAgICAgICAgICBtZXNzYWdlci5wcmludEVycm9yKClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxvZ2dlci5zdWNjZXNzKCdDb21waWxlZCcgLCBgJHtmaWxlcy5sZW5ndGh9IGZpbGVzIGluICR7RGF0ZS5ub3coKSAtIHN0YXJ0dXBUaW1lfW1zYClcbiAgICAgICAgICAgIGNvbmZpZy5hbmthQ29uZmlnLmRlYnVnICYmIG1lc3NhZ2VyLnByaW50SW5mbygpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB3YXRjaEZpbGVzICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICBjb25zdCB3YXRjaGVyID0gdXRpbHMuZ2VuRmlsZVdhdGNoZXIoYCR7Y29uZmlnLnNyY0Rpcn0vKiovKmAsIHtcbiAgICAgICAgICAgICAgICBmb2xsb3dTeW1saW5rczogZmFsc2UsXG4gICAgICAgICAgICAgICAgaWdub3JlZDogY29uZmlnLmFua2FDb25maWcuaWdub3JlZFxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgd2F0Y2hlci5vbignYWRkJywgYXN5bmMgKGZpbGVOYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydHVwVGltZSA9IERhdGUubm93KClcbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlID0gYXdhaXQgdXRpbHMuY3JlYXRlRmlsZShmaWxlTmFtZSlcblxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuZ2VuZXJhdGVDb21waWxhdGlvbihmaWxlKS5ydW4oKVxuXG4gICAgICAgICAgICAgICAgaWYgKG1lc3NhZ2VyLmhhc0Vycm9yKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZXIucHJpbnRFcnJvcigpXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoJ0NvbXBpbGVkICcsIGAke2ZpbGVOYW1lfSBpbiAke0RhdGUubm93KCkgLSBzdGFydHVwVGltZX1tc2ApXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VyLnByaW50SW5mbygpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIHdhdGNoZXIub24oJ3VubGluaycsIGFzeW5jIChmaWxlTmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZnMudW5saW5rKGZpbGVOYW1lLnJlcGxhY2UoY29uZmlnLnNyY0RpciwgY29uZmlnLmRpc3REaXIpKVxuICAgICAgICAgICAgICAgIGxvZ2dlci5zdWNjZXNzKCdSZW1vdmUnLCBmaWxlTmFtZSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB3YXRjaGVyLm9uKCdjaGFuZ2UnLCBhc3luYyAoZmlsZU5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5sb2coJ0NvbXBpbGluZycsIGZpbGVOYW1lKVxuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0dXBUaW1lID0gRGF0ZS5ub3coKVxuICAgICAgICAgICAgICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB1dGlscy5jcmVhdGVGaWxlKGZpbGVOYW1lKVxuXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5nZW5lcmF0ZUNvbXBpbGF0aW9uKGZpbGUpLnJ1bigpXG5cbiAgICAgICAgICAgICAgICBpZiAobWVzc2FnZXIuaGFzRXJyb3IoKSkge1xuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlci5wcmludEVycm9yKClcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsb2dnZXIuc3VjY2VzcygnQ29tcGlsZWQgJywgYCR7ZmlsZU5hbWV9IGluICR7RGF0ZS5ub3coKSAtIHN0YXJ0dXBUaW1lfW1zYClcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZXIucHJpbnRJbmZvKClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgd2F0Y2hlci5vbigncmVhZHknLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpXG4gICAgICAgICAgICAgICAgbG9nZ2VyLmxvZygnQW5rYSBpcyB3YWl0aW5nIGZvciBjaGFuZ2VzLi4uJylcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIG5ldyBDb21waWxhdGlvbi5cbiAgICAgKiBAcGFyYW0gZmlsZVxuICAgICAqL1xuICAgIGdlbmVyYXRlQ29tcGlsYXRpb24gKGZpbGU6IEZpbGUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb21waWxhdGlvbihmaWxlLCB0aGlzLmNvbmZpZywgdGhpcylcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNb3VudCBwYXJzZXJzLlxuICAgICAqL1xuICAgIGluaXRQYXJzZXJzICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jb25maWcuYW5rYUNvbmZpZy5wYXJzZXJzLmZvckVhY2goKHsgbWF0Y2gsIHBhcnNlcnMgfSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wYXJzZXJzLnB1c2goe1xuICAgICAgICAgICAgICAgIG1hdGNoLFxuICAgICAgICAgICAgICAgIHBhcnNlcnM6IHBhcnNlcnMubWFwKCh7IHBhcnNlciwgb3B0aW9ucyB9KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZXIuYmluZCh0aGlzLmdlbmVyYXRlUGFyc2VySW5qZWN0aW9uKG9wdGlvbnMpKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1vdW50IFBsdWdpbnMuXG4gICAgICovXG4gICAgaW5pdFBsdWdpbnMgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmNvbmZpZy5hbmthQ29uZmlnLnBsdWdpbnMuZm9yRWFjaCgoeyBwbHVnaW4sIG9wdGlvbnMgfSkgPT4ge1xuICAgICAgICAgICAgcGx1Z2luLmNhbGwodGhpcy5nZW5lcmF0ZVBsdWdpbkluamVjdGlvbihvcHRpb25zKSlcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBnZW5lcmF0ZVBsdWdpbkluamVjdGlvbiAob3B0aW9uczogUGx1Z2luT3B0aW9uc1snb3B0aW9ucyddKTogUGx1Z2luSW5qZWN0aW9uIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQbHVnaW5JbmplY3Rpb24odGhpcywgb3B0aW9ucylcbiAgICB9XG5cbiAgICBnZW5lcmF0ZVBhcnNlckluamVjdGlvbiAob3B0aW9uczogUGFyc2VyT3B0aW9uc1snb3B0aW9ucyddKTogUGFyc2VySW5qZWN0aW9uIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQYXJzZXJJbmplY3Rpb24odGhpcywgb3B0aW9ucylcbiAgICB9XG59XG4iLCJpbXBvcnQgQ29tcGlsZXIgZnJvbSAnLi9Db21waWxlcidcblxuZXhwb3J0IGRlZmF1bHQgYWJzdHJhY3QgY2xhc3MgQ29tbWFuZCB7XG4gICAgcHVibGljIGNvbW1hbmQ6IHN0cmluZ1xuICAgIHB1YmxpYyBvcHRpb25zOiBBcnJheTxBcnJheTxzdHJpbmc+PlxuICAgIHB1YmxpYyBhbGlhczogc3RyaW5nXG4gICAgcHVibGljIHVzYWdlOiBzdHJpbmdcbiAgICBwdWJsaWMgZGVzY3JpcHRpb246IHN0cmluZ1xuICAgIHB1YmxpYyBleGFtcGxlczogQXJyYXk8c3RyaW5nPlxuICAgIHB1YmxpYyAkY29tcGlsZXI6IENvbXBpbGVyXG4gICAgcHVibGljIG9uOiB7XG4gICAgICAgIFtrZXk6IHN0cmluZ106ICguLi5hcmc6IGFueVtdKSA9PiB2b2lkXG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IgKGNvbW1hbmQ6IHN0cmluZywgZGVzYz86IHN0cmluZykge1xuICAgICAgICB0aGlzLmNvbW1hbmQgPSBjb21tYW5kXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IFtdXG4gICAgICAgIHRoaXMuYWxpYXMgPSAnJ1xuICAgICAgICB0aGlzLnVzYWdlID0gJydcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IGRlc2NcbiAgICAgICAgdGhpcy5leGFtcGxlcyA9IFtdXG4gICAgICAgIHRoaXMub24gPSB7fVxuICAgIH1cblxuICAgIGFic3RyYWN0IGFjdGlvbiAocGFyYW06IHN0cmluZyB8IEFycmF5PHN0cmluZz4sIG9wdGlvbnM6IE9iamVjdCwgLi4ub3RoZXI6IGFueVtdKTogUHJvbWlzZTxhbnk+IHwgdm9pZFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSBhbmthIGNvcmUgY29tcGlsZXJcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgaW5pdENvbXBpbGVyICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy4kY29tcGlsZXIgPSBuZXcgQ29tcGlsZXIoKVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBzZXRVc2FnZSAodXNhZ2U6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICB0aGlzLnVzYWdlID0gdXNhZ2VcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgc2V0T3B0aW9ucyAoLi4ub3B0aW9uczogQXJyYXk8c3RyaW5nPik6IHZvaWQge1xuICAgICAgICB0aGlzLm9wdGlvbnMucHVzaChvcHRpb25zKVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBzZXRFeGFtcGxlcyAoLi4uZXhhbXBsZTogQXJyYXk8c3RyaW5nPik6IHZvaWQge1xuICAgICAgICB0aGlzLmV4YW1wbGVzID0gdGhpcy5leGFtcGxlcy5jb25jYXQoZXhhbXBsZSlcbiAgICB9XG5cbiAgICBwdWJsaWMgcHJpbnRUaXRsZSAoLi4uYXJnOiBBcnJheTxhbnk+KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdcXHJcXG4gJywgLi4uYXJnLCAnXFxyXFxuJylcbiAgICB9XG5cbiAgICBwdWJsaWMgcHJpbnRDb250ZW50ICguLi5hcmc6IEFycmF5PGFueT4pIHtcbiAgICAgICAgY29uc29sZS5sb2coJyAgICcsIC4uLmFyZylcbiAgICB9XG59XG4iLCJpbXBvcnQgY29uZmlnICBmcm9tICcuLi9jb25maWcnXG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tICcuLi91dGlscydcbmltcG9ydCB7IENvbW1hbmQsIENvbXBpbGVyIH0gZnJvbSAnLi4vY29yZSdcbmltcG9ydCBtZXNzYWdlciBmcm9tICcuLi91dGlscy9tZXNzYWdlcidcblxuZXhwb3J0IHR5cGUgRGV2Q29tbWFuZE9wdHMgPSBPYmplY3QgJiB7fVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEZXZDb21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBzdXBlcihcbiAgICAgICAgICAgICdkZXYgW3BhZ2VzLi4uXScsXG4gICAgICAgICAgICAnRGV2ZWxvcG1lbnQgbW9kZSdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0RXhhbXBsZXMoXG4gICAgICAgICAgICAnJCBhbmthIGRldicsXG4gICAgICAgICAgICAnJCBhbmthIGRldiBpbmRleCcsXG4gICAgICAgICAgICAnJCBhbmthIGRldiAvcGFnZXMvbG9nL2xvZyAvcGFnZXMvdXNlci91c2VyJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy4kY29tcGlsZXIgPSBuZXcgQ29tcGlsZXIoKVxuICAgIH1cblxuICAgIGFzeW5jIGFjdGlvbiAocGFnZXM/OiBBcnJheTxzdHJpbmc+LCBvcHRpb25zPzogRGV2Q29tbWFuZE9wdHMpIHtcbiAgICAgICAgdGhpcy4kY29tcGlsZXIuY29uZmlnLmFua2FDb25maWcuZGV2TW9kZSA9IHRydWVcblxuICAgICAgICB0aGlzLmluaXRDb21waWxlcigpXG4gICAgICAgIGF3YWl0IHRoaXMuJGNvbXBpbGVyLmNsZWFuKClcbiAgICAgICAgYXdhaXQgdGhpcy4kY29tcGlsZXIubGF1bmNoKClcbiAgICAgICAgYXdhaXQgdGhpcy4kY29tcGlsZXIud2F0Y2hGaWxlcygpXG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuLi9jb25maWcnXG5pbXBvcnQgeyBkb3dubG9hZFJlcG8sIGxvZ2dlciB9IGZyb20gJy4uL3V0aWxzJ1xuaW1wb3J0IHsgQ29tbWFuZCwgQ29tcGlsZXIgfSBmcm9tICcuLi9jb3JlJ1xuXG5leHBvcnQgdHlwZSBJbml0Q29tbWFuZE9wdHMgPSB7XG4gICAgcmVwbzogc3RyaW5nXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEluaXRDb21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBzdXBlcihcbiAgICAgICAgICAgICdpbml0IDxwcm9qZWN0LW5hbWU+JyxcbiAgICAgICAgICAgICdJbml0aWFsaXplIG5ldyBwcm9qZWN0J1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRFeGFtcGxlcyhcbiAgICAgICAgICAgICckIGFua2EgaW5pdCcsXG4gICAgICAgICAgICBgJCBhbmthIGluaXQgYW5rYS1pbi1hY3Rpb24gLS1yZXBvPSR7Y29uZmlnLmRlZmF1bHRTY2FmZm9sZH1gXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldE9wdGlvbnMoXG4gICAgICAgICAgICAnLXIsIC0tcmVwbycsXG4gICAgICAgICAgICAndGVtcGxhdGUgcmVwb3NpdG9yeSdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuJGNvbXBpbGVyID0gbmV3IENvbXBpbGVyKClcbiAgICB9XG5cbiAgICBhc3luYyBhY3Rpb24gKHByb2plY3ROYW1lOiBzdHJpbmcsIG9wdGlvbnM/OiBJbml0Q29tbWFuZE9wdHMpIHtcbiAgICAgICAgY29uc3QgcHJvamVjdCA9IHBhdGgucmVzb2x2ZShjb25maWcuY3dkLCBwcm9qZWN0TmFtZSlcbiAgICAgICAgY29uc3QgcmVwbyA9IG9wdGlvbnMucmVwbyB8fCBjb25maWcuZGVmYXVsdFNjYWZmb2xkXG5cbiAgICAgICAgbG9nZ2VyLnN0YXJ0TG9hZGluZygnRG93bmxvYWRpbmcgdGVtcGxhdGUuLi4nKVxuICAgICAgICBhd2FpdCBkb3dubG9hZFJlcG8ocmVwbywgcHJvamVjdClcbiAgICAgICAgbG9nZ2VyLnN0b3BMb2FkaW5nKClcbiAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoJ0RvbmUnLCBwcm9qZWN0KVxuICAgIH1cbn1cbiIsImltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uL3V0aWxzJ1xuaW1wb3J0IHsgQ29tbWFuZCwgQ29tcGlsZXIgfSBmcm9tICcuLi9jb3JlJ1xuXG5leHBvcnQgdHlwZSBEZXZDb21tYW5kT3B0cyA9IE9iamVjdCAmIHt9XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERldkNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHN1cGVyKFxuICAgICAgICAgICAgJ3Byb2QnLFxuICAgICAgICAgICAgJ1Byb2R1Y3Rpb24gbW9kZSdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0RXhhbXBsZXMoXG4gICAgICAgICAgICAnJCBhbmthIHByb2QnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLiRjb21waWxlciA9IG5ldyBDb21waWxlcigpXG4gICAgfVxuXG4gICAgYXN5bmMgYWN0aW9uIChwYWdlcz86IEFycmF5PHN0cmluZz4sIG9wdGlvbnM/OiBEZXZDb21tYW5kT3B0cykge1xuICAgICAgICB0aGlzLiRjb21waWxlci5jb25maWcuYW5rYUNvbmZpZy5kZXZNb2RlID0gZmFsc2VcblxuICAgICAgICBjb25zdCBzdGFydHVwVGltZSA9IERhdGUubm93KClcblxuICAgICAgICB0aGlzLmluaXRDb21waWxlcigpXG4gICAgICAgIGF3YWl0IHRoaXMuJGNvbXBpbGVyLmNsZWFuKClcbiAgICAgICAgYXdhaXQgdGhpcy4kY29tcGlsZXIubGF1bmNoKClcbiAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoYENvbXBpbGVkIGluICR7RGF0ZS5ub3coKSAtIHN0YXJ0dXBUaW1lfW1zYCwgJ0hhdmUgYSBuaWNlIGRheSDwn46JICEnKVxuICAgIH1cbn1cbiIsImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJ1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IGNvbmZpZyAgZnJvbSAnLi4vY29uZmlnJ1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vdXRpbHMnXG5pbXBvcnQgeyBDb21tYW5kLCBDb21waWxlciB9IGZyb20gJy4uL2NvcmUnXG5pbXBvcnQgeyBkZWZhdWx0IGFzIEZzRWRpdG9yQ29uc3RydWN0b3IgfSBmcm9tICcuLi91dGlscy9lZGl0b3InXG5cbmltcG9ydCB7XG4gICAgQ29tcGlsZXJDb25maWdcbn0gZnJvbSAnLi4vLi4vdHlwZXMvdHlwZXMnXG5cbmNvbnN0IHsgbG9nZ2VyLCBGc0VkaXRvciB9ID0gdXRpbHNcblxuZXhwb3J0IHR5cGUgQ3JlYXRlUGFnZUNvbW1hbmRPcHRzID0ge1xuICAgIHJvb3Q6IHN0cmluZ1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDcmVhdGVQYWdlQ29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgc3VwZXIoXG4gICAgICAgICAgICAnbmV3LXBhZ2UgPHBhZ2VzLi4uPicsXG4gICAgICAgICAgICAnQ3JlYXRlIGEgbWluaXByb2dyYW0gcGFnZSdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0RXhhbXBsZXMoXG4gICAgICAgICAgICAnJCBhbmthIG5ldy1wYWdlIGluZGV4JyxcbiAgICAgICAgICAgICckIGFua2EgbmV3LXBhZ2UgL3BhZ2VzL2luZGV4L2luZGV4JyxcbiAgICAgICAgICAgICckIGFua2EgbmV3LXBhZ2UgL3BhZ2VzL2luZGV4L2luZGV4IC0tcm9vdD1wYWNrYWdlQSdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0T3B0aW9ucyhcbiAgICAgICAgICAgICctciwgLS1yb290IDxzdWJwYWNrYWdlPicsXG4gICAgICAgICAgICAnc2F2ZSBwYWdlIHRvIHN1YnBhY2thZ2VzJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy4kY29tcGlsZXIgPSBuZXcgQ29tcGlsZXIoKVxuICAgIH1cblxuICAgIGFzeW5jIGFjdGlvbiAocGFnZXM/OiBBcnJheTxzdHJpbmc+LCBvcHRpb25zPzogQ3JlYXRlUGFnZUNvbW1hbmRPcHRzKSB7XG4gICAgICAgIGNvbnN0IHJvb3QgPSBvcHRpb25zLnJvb3RcbiAgICAgICAgY29uc3QgZWRpdG9yID0gbmV3IEZzRWRpdG9yKClcblxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChwYWdlcy5tYXAocGFnZSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZW5lcmF0ZVBhZ2UocGFnZSwgZWRpdG9yLCByb290KVxuICAgICAgICB9KSlcblxuICAgICAgICBsb2dnZXIuc3VjY2VzcygnRG9uZScsICdIYXZlIGEgbmljZSBkYXkg8J+OiSAhJylcbiAgICB9XG5cbiAgICBhc3luYyBnZW5lcmF0ZVBhZ2UgKHBhZ2U6IHN0cmluZywgZWRpdG9yOiBGc0VkaXRvckNvbnN0cnVjdG9yLCByb290Pzogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIGFua2FDb25maWcsXG4gICAgICAgICAgICBwcm9qZWN0Q29uZmlnXG4gICAgICAgIH0gPSA8Q29tcGlsZXJDb25maWc+Y29uZmlnXG4gICAgICAgIGNvbnN0IEN3ZFJlZ0V4cCA9IG5ldyBSZWdFeHAoYF4ke2NvbmZpZy5jd2R9YClcbiAgICAgICAgY29uc3QgcGFnZVBhdGggPSBwYWdlLnNwbGl0KHBhdGguc2VwKS5sZW5ndGggPT09IDEgP1xuICAgICAgICAgICAgcGF0aC5qb2luKGFua2FDb25maWcucGFnZXMsIHBhZ2UsIHBhZ2UpIDogcGFnZVxuICAgICAgICBjb25zdCBwYWdlTmFtZSA9IHBhdGguYmFzZW5hbWUocGFnZVBhdGgpXG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSB7XG4gICAgICAgICAgICBwYWdlTmFtZSxcbiAgICAgICAgICAgIHRpbWU6IG5ldyBEYXRlKCkudG9Mb2NhbGVTdHJpbmcoKVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGFwcENvbmZpZ1BhdGggPSBwYXRoLmpvaW4oY29uZmlnLnNyY0RpciwgJ2FwcC5qc29uJylcbiAgICAgICAgbGV0IGFic29sdXRlUGF0aCA9IGNvbmZpZy5zcmNEaXJcblxuICAgICAgICBpZiAocm9vdCkge1xuICAgICAgICAgICAgY29uc3Qgcm9vdFBhdGggPSBwYXRoLmpvaW4oYW5rYUNvbmZpZy5zdWJQYWNrYWdlcywgcm9vdClcbiAgICAgICAgICAgIGNvbnN0IHN1YlBrZyA9IHByb2plY3RDb25maWcuc3ViUGFja2FnZXMuZmluZCgocGtnOiBhbnkpID0+IHBrZy5yb290ID09PSByb290UGF0aClcblxuICAgICAgICAgICAgYWJzb2x1dGVQYXRoID0gcGF0aC5qb2luKGFic29sdXRlUGF0aCwgYW5rYUNvbmZpZy5zdWJQYWNrYWdlcywgcm9vdCwgcGFnZVBhdGgpXG5cbiAgICAgICAgICAgIGlmIChzdWJQa2cpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3ViUGtnLnBhZ2VzLmluY2x1ZGVzKHBhZ2VQYXRoKSkge1xuICAgICAgICAgICAgICAgICAgICBsb2dnZXIud2FybignVGhlIHBhZ2UgYWxyZWFkeSBleGlzdHMnLCBhYnNvbHV0ZVBhdGgpXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHN1YlBrZy5wYWdlcy5wdXNoKHBhZ2VQYXRoKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcHJvamVjdENvbmZpZy5zdWJQYWNrYWdlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgcm9vdDogcm9vdFBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHBhZ2VzOiBbcGFnZVBhdGhdXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFic29sdXRlUGF0aCA9IHBhdGguam9pbihhYnNvbHV0ZVBhdGgsIHBhZ2VQYXRoKVxuXG4gICAgICAgICAgICBpZiAocHJvamVjdENvbmZpZy5wYWdlcy5pbmNsdWRlcyhwYWdlUGF0aCkpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIud2FybignVGhlIHBhZ2UgYWxyZWFkeSBleGlzdHMnLCBhYnNvbHV0ZVBhdGgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHByb2plY3RDb25maWcucGFnZXMucHVzaChwYWdlUGF0aClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRwbHMgPSBhd2FpdCB1dGlscy5zZWFyY2hGaWxlcyhgJHtwYXRoLmpvaW4oYW5rYUNvbmZpZy50ZW1wbGF0ZS5wYWdlLCAnKi4qJyl9YClcblxuICAgICAgICB0cGxzLmZvckVhY2godHBsID0+IHtcbiAgICAgICAgICAgIGVkaXRvci5jb3B5KFxuICAgICAgICAgICAgICAgIHRwbCxcbiAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKGFic29sdXRlUGF0aCksIHBhZ2VOYW1lICsgcGF0aC5leHRuYW1lKHRwbCkpLFxuICAgICAgICAgICAgICAgIGNvbnRleHRcbiAgICAgICAgICAgIClcbiAgICAgICAgfSlcbiAgICAgICAgZWRpdG9yLndyaXRlSlNPTihhcHBDb25maWdQYXRoLCBwcm9qZWN0Q29uZmlnLCBudWxsLCA0KVxuXG4gICAgICAgIGF3YWl0IGVkaXRvci5zYXZlKClcblxuICAgICAgICBsb2dnZXIuc3VjY2VzcygnQ3JlYXRlIHBhZ2UnLCBhYnNvbHV0ZVBhdGgucmVwbGFjZShDd2RSZWdFeHAsICcnKSlcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcydcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBjb25maWcgIGZyb20gJy4uL2NvbmZpZydcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uL3V0aWxzJ1xuaW1wb3J0IHsgQ29tbWFuZCwgQ29tcGlsZXIgfSBmcm9tICcuLi9jb3JlJ1xuaW1wb3J0IHsgZGVmYXVsdCBhcyBGc0VkaXRvckNvbnN0cnVjdG9yIH0gZnJvbSAnLi4vdXRpbHMvZWRpdG9yJ1xuXG5pbXBvcnQge1xuICAgIENvbXBpbGVyQ29uZmlnXG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5jb25zdCB7IGxvZ2dlciwgRnNFZGl0b3IgfSA9IHV0aWxzXG5cbmV4cG9ydCB0eXBlIENyZWF0ZUNvbXBvbmVudENvbW1hbmRPcHRzID0ge1xuICAgIHJvb3Q6IHN0cmluZ1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDcmVhdGVDb21wb25lbnRDb21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBzdXBlcihcbiAgICAgICAgICAgICduZXctY21wdCA8Y29tcG9uZW50cy4uLj4nLFxuICAgICAgICAgICAgJ0NyZWF0ZSBhIG1pbmlwcm9ncmFtIGNvbXBvbmVudCdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0RXhhbXBsZXMoXG4gICAgICAgICAgICAnJCBhbmthIG5ldy1jbXB0IGJ1dHRvbicsXG4gICAgICAgICAgICAnJCBhbmthIG5ldy1jbXB0IC9jb21wb25lbnRzL2J1dHRvbi9idXR0b24nLFxuICAgICAgICAgICAgJyQgYW5rYSBuZXctY21wdCAvY29tcG9uZW50cy9idXR0b24vYnV0dG9uIC0tZ2xvYmFsJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRPcHRpb25zKFxuICAgICAgICAgICAgJy1yLCAtLXJvb3QgPHN1YnBhY2thZ2U+JyxcbiAgICAgICAgICAgICdzYXZlIGNvbXBvbmVudCB0byBzdWJwYWNrYWdlcydcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuJGNvbXBpbGVyID0gbmV3IENvbXBpbGVyKClcbiAgICB9XG5cbiAgICBhc3luYyBhY3Rpb24gKGNvbXBvbmVudHM/OiBBcnJheTxzdHJpbmc+LCBvcHRpb25zPzogQ3JlYXRlQ29tcG9uZW50Q29tbWFuZE9wdHMpIHtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgcm9vdFxuICAgICAgICB9ID0gb3B0aW9uc1xuICAgICAgICBjb25zdCBlZGl0b3IgPSBuZXcgRnNFZGl0b3IoKVxuXG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKGNvbXBvbmVudHMubWFwKGNvbXBvbmVudCA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZW5lcmF0ZUNvbXBvbmVudChjb21wb25lbnQsIGVkaXRvciwgcm9vdClcbiAgICAgICAgfSkpXG5cbiAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoJ0RvbmUnLCAnSGF2ZSBhIG5pY2UgZGF5IPCfjokgIScpXG4gICAgfVxuXG4gICAgYXN5bmMgZ2VuZXJhdGVDb21wb25lbnQgKGNvbXBvbmVudDogc3RyaW5nLCBlZGl0b3I6IEZzRWRpdG9yQ29uc3RydWN0b3IsIHJvb3Q/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgYW5rYUNvbmZpZyxcbiAgICAgICAgICAgIHByb2plY3RDb25maWdcbiAgICAgICAgfSA9IDxDb21waWxlckNvbmZpZz5jb25maWdcbiAgICAgICAgY29uc3QgQ3dkUmVnRXhwID0gbmV3IFJlZ0V4cChgXiR7Y29uZmlnLmN3ZH1gKVxuICAgICAgICBjb25zdCBjb21wb25lbnRQYXRoID0gY29tcG9uZW50LnNwbGl0KHBhdGguc2VwKS5sZW5ndGggPT09IDEgP1xuICAgICAgICAgICAgcGF0aC5qb2luKGFua2FDb25maWcuY29tcG9uZW50cywgY29tcG9uZW50LCBjb21wb25lbnQpIDpcbiAgICAgICAgICAgIGNvbXBvbmVudFxuICAgICAgICBjb25zdCBjb21wb25lbnROYW1lID0gcGF0aC5iYXNlbmFtZShjb21wb25lbnRQYXRoKVxuICAgICAgICBjb25zdCBjb250ZXh0ID0ge1xuICAgICAgICAgICAgY29tcG9uZW50TmFtZSxcbiAgICAgICAgICAgIHRpbWU6IG5ldyBEYXRlKCkudG9Mb2NhbGVTdHJpbmcoKVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGFic29sdXRlUGF0aCA9IHJvb3QgP1xuICAgICAgICAgICAgcGF0aC5qb2luKGNvbmZpZy5zcmNEaXIsIGFua2FDb25maWcuc3ViUGFja2FnZXMsIHJvb3QsIGNvbXBvbmVudFBhdGgpIDpcbiAgICAgICAgICAgIHBhdGguam9pbihjb25maWcuc3JjRGlyLCBjb21wb25lbnRQYXRoKVxuXG4gICAgICAgIGlmIChmcy5leGlzdHNTeW5jKHBhdGguam9pbihwYXRoLmRpcm5hbWUoYWJzb2x1dGVQYXRoKSwgY29tcG9uZW50TmFtZSArICcuanNvbicpKSkge1xuICAgICAgICAgICAgbG9nZ2VyLndhcm4oJ1RoZSBjb21wb25lbnQgYWxyZWFkeSBleGlzdHMnLCBhYnNvbHV0ZVBhdGgpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRwbHMgPSBhd2FpdCB1dGlscy5zZWFyY2hGaWxlcyhgJHtwYXRoLmpvaW4oYW5rYUNvbmZpZy50ZW1wbGF0ZS5jb21wb25lbnQsICcqLionKX1gKVxuXG4gICAgICAgIHRwbHMuZm9yRWFjaCh0cGwgPT4ge1xuICAgICAgICAgICAgZWRpdG9yLmNvcHkoXG4gICAgICAgICAgICAgICAgdHBsLFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwYXRoLmRpcm5hbWUoYWJzb2x1dGVQYXRoKSwgY29tcG9uZW50TmFtZSArIHBhdGguZXh0bmFtZSh0cGwpKSxcbiAgICAgICAgICAgICAgICBjb250ZXh0XG4gICAgICAgICAgICApXG4gICAgICAgIH0pXG5cbiAgICAgICAgYXdhaXQgZWRpdG9yLnNhdmUoKVxuXG4gICAgICAgIGxvZ2dlci5zdWNjZXNzKCdDcmVhdGUgY29tcG9uZW50JywgYWJzb2x1dGVQYXRoLnJlcGxhY2UoQ3dkUmVnRXhwLCAnJykpXG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgY29uZmlnICBmcm9tICcuLi9jb25maWcnXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi91dGlscydcbmltcG9ydCB7IENvbW1hbmQsIENvbXBpbGVyIH0gZnJvbSAnLi4vY29yZSdcbmltcG9ydCB7IGRlZmF1bHQgYXMgRnNFZGl0b3JDb25zdHJ1Y3RvciB9IGZyb20gJy4uL3V0aWxzL2VkaXRvcidcblxuaW1wb3J0IHtcbiAgICBDb21waWxlckNvbmZpZ1xufSBmcm9tICcuLi8uLi90eXBlcy90eXBlcydcblxuY29uc3QgeyBsb2dnZXIsIEZzRWRpdG9yIH0gPSB1dGlsc1xuXG5leHBvcnQgdHlwZSBFbnJvbGxDb21wb25lbnRDb21tYW5kT3B0cyA9IHtcbiAgICBwYWdlOiBzdHJpbmdcbiAgICBnbG9iYWw6IHN0cmluZ1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBFbnJvbGxDb21wb25lbnRDb21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBzdXBlcihcbiAgICAgICAgICAgICdlbnJvbGwgPGNvbXBvbmVudHMuLi4+JyxcbiAgICAgICAgICAgICdFbnJvbGwgYSBtaW5pcHJvZ3JhbSBjb21wb25lbnQnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldEV4YW1wbGVzKFxuICAgICAgICAgICAgJyQgYW5rYSBlbnJvbGwgYnV0dG9uIC0tZ2xvYmFsJyxcbiAgICAgICAgICAgICckIGFua2EgZW5yb2xsIC9jb21wb25lbnRzL2J1dHRvbi9idXR0b24gLS1nbG9iYWwnLFxuICAgICAgICAgICAgJyQgYW5rYSBlbnJvbGwgL2NvbXBvbmVudHMvYnV0dG9uL2J1dHRvbiAtLXBhZ2U9L3BhZ2VzL2luZGV4L2luZGV4J1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRPcHRpb25zKFxuICAgICAgICAgICAgJy1wLCAtLXBhZ2UgPHBhZ2U+JyxcbiAgICAgICAgICAgICd3aGljaCBwYWdlIGNvbXBvbmVudHMgZW5yb2xsIHRvJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRPcHRpb25zKFxuICAgICAgICAgICAgJy1nLCAtLWdsb2JhbCcsXG4gICAgICAgICAgICAnZW5yb2xsIGNvbXBvbmVudHMgdG8gYXBwLmpzb24nXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLiRjb21waWxlciA9IG5ldyBDb21waWxlcigpXG4gICAgfVxuXG4gICAgYXN5bmMgYWN0aW9uIChjb21wb25lbnRzPzogQXJyYXk8c3RyaW5nPiwgb3B0aW9ucz86IEVucm9sbENvbXBvbmVudENvbW1hbmRPcHRzKSB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIHBhZ2UsXG4gICAgICAgICAgICBnbG9iYWxcbiAgICAgICAgfSA9IG9wdGlvbnNcbiAgICAgICAgY29uc3QgZWRpdG9yID0gbmV3IEZzRWRpdG9yKClcblxuICAgICAgICBpZiAoIWdsb2JhbCAmJiAhcGFnZSkge1xuICAgICAgICAgICAgbG9nZ2VyLndhcm4oJ1doZXJlIGNvbXBvbmVudHMgZW5yb2xsIHRvPycpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKGNvbXBvbmVudHMubWFwKGNvbXBvbmVudCA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5lbnJvbGxDb21wb25lbnQoY29tcG9uZW50LCBlZGl0b3IsIGdsb2JhbCA/ICcnIDogcGFnZSlcbiAgICAgICAgfSkpXG5cbiAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoJ0RvbmUnLCAnSGF2ZSBhIG5pY2UgZGF5IPCfjokgIScpXG4gICAgfVxuXG4gICAgYXN5bmMgZW5yb2xsQ29tcG9uZW50IChjb21wb25lbnQ6IHN0cmluZywgZWRpdG9yOiBGc0VkaXRvckNvbnN0cnVjdG9yLCBwYWdlPzogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIGFua2FDb25maWcsXG4gICAgICAgICAgICBwcm9qZWN0Q29uZmlnXG4gICAgICAgIH0gPSA8Q29tcGlsZXJDb25maWc+Y29uZmlnXG4gICAgICAgIGNvbnN0IEN3ZFJlZ0V4cCA9IG5ldyBSZWdFeHAoYF4ke2NvbmZpZy5jd2R9YClcbiAgICAgICAgY29uc3QgY29tcG9uZW50UGF0aCA9IGNvbXBvbmVudC5zcGxpdChwYXRoLnNlcCkubGVuZ3RoID09PSAxID9cbiAgICAgICAgICAgIHBhdGguam9pbihhbmthQ29uZmlnLmNvbXBvbmVudHMsIGNvbXBvbmVudCwgY29tcG9uZW50KSA6XG4gICAgICAgICAgICBjb21wb25lbnRcbiAgICAgICAgY29uc3QgY29tcG9uZW50TmFtZSA9IGNvbXBvbmVudFBhdGguc3BsaXQocGF0aC5zZXApLnBvcCgpXG4gICAgICAgIGNvbnN0IGFwcENvbmZpZ1BhdGggPSBwYXRoLmpvaW4oY29uZmlnLnNyY0RpciwgJ2FwcC5qc29uJylcbiAgICAgICAgY29uc3QgY29tcG9uZW50QWJzUGF0aCA9IHBhdGguam9pbihjb25maWcuc3JjRGlyLCBjb21wb25lbnRQYXRoKVxuXG4gICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKGNvbXBvbmVudEFic1BhdGgpLCBjb21wb25lbnROYW1lICsgJy5qc29uJykpKSB7XG4gICAgICAgICAgICBsb2dnZXIud2FybignQ29tcG9uZW50IGRvc2Ugbm90IGV4aXN0cycsIGNvbXBvbmVudEFic1BhdGgpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwYWdlKSB7XG4gICAgICAgICAgICBjb25zdCBwYWdlQWJzUGF0aCA9IHBhdGguam9pbihjb25maWcuc3JjRGlyLCBwYWdlKVxuICAgICAgICAgICAgY29uc3QgcGFnZUpzb25QYXRoID0gcGF0aC5qb2luKHBhdGguZGlybmFtZShwYWdlQWJzUGF0aCksIHBhdGguYmFzZW5hbWUocGFnZUFic1BhdGgpICsgJy5qc29uJylcbiAgICAgICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhwYWdlSnNvblBhdGgpKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLndhcm4oJ1BhZ2UgZG9zZSBub3QgZXhpc3RzJywgcGFnZUFic1BhdGgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHBhZ2VKc29uID0gPGFueT5KU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhwYWdlSnNvblBhdGgsIHtcbiAgICAgICAgICAgICAgICBlbmNvZGluZzogJ3V0ZjgnXG4gICAgICAgICAgICB9KSB8fCAne30nKVxuXG4gICAgICAgICAgICB0aGlzLmVuc3VyZVVzaW5nQ29tcG9uZW50cyhwYWdlSnNvbilcblxuICAgICAgICAgICAgaWYgKHBhZ2VKc29uLnVzaW5nQ29tcG9uZW50c1tjb21wb25lbnROYW1lXSkge1xuICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKCdDb21wb25lbnQgYWxyZWFkeSBlbnJvbGxlZCBpbicsIHBhZ2VBYnNQYXRoKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwYWdlSnNvbi51c2luZ0NvbXBvbmVudHNbY29tcG9uZW50TmFtZV0gPSBwYXRoLnJlbGF0aXZlKHBhdGguZGlybmFtZShwYWdlQWJzUGF0aCksIGNvbXBvbmVudEFic1BhdGgpXG4gICAgICAgICAgICBlZGl0b3Iud3JpdGVKU09OKHBhZ2VKc29uUGF0aCwgcGFnZUpzb24pXG4gICAgICAgICAgICBhd2FpdCBlZGl0b3Iuc2F2ZSgpXG5cbiAgICAgICAgICAgIGxvZ2dlci5zdWNjZXNzKGBFbnJvbGwgJHtjb21wb25lbnRQYXRofSBpbmAsIHBhZ2VBYnNQYXRoLnJlcGxhY2UoQ3dkUmVnRXhwLCAnJykpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmVuc3VyZVVzaW5nQ29tcG9uZW50cyhwcm9qZWN0Q29uZmlnKVxuXG4gICAgICAgICAgICBpZiAocHJvamVjdENvbmZpZy51c2luZ0NvbXBvbmVudHNbY29tcG9uZW50TmFtZV0pIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIud2FybignQ29tcG9uZW50IGFscmVhZHkgZW5yb2xsZWQgaW4nLCAnYXBwLmpzb24nKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcm9qZWN0Q29uZmlnLnVzaW5nQ29tcG9uZW50c1tjb21wb25lbnROYW1lXSA9IHBhdGgucmVsYXRpdmUocGF0aC5kaXJuYW1lKGFwcENvbmZpZ1BhdGgpLCBjb21wb25lbnRBYnNQYXRoKVxuICAgICAgICAgICAgZWRpdG9yLndyaXRlSlNPTihhcHBDb25maWdQYXRoLCBwcm9qZWN0Q29uZmlnKVxuICAgICAgICAgICAgYXdhaXQgZWRpdG9yLnNhdmUoKVxuXG4gICAgICAgICAgICBsb2dnZXIuc3VjY2VzcyhgRW5yb2xsICR7Y29tcG9uZW50UGF0aH0gaW5gLCAnYXBwLmpzb24nKVxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBlbnN1cmVVc2luZ0NvbXBvbmVudHMgKGNvbmZpZzogYW55KSB7XG4gICAgICAgIGlmICghY29uZmlnLnVzaW5nQ29tcG9uZW50cykge1xuICAgICAgICAgICAgY29uZmlnLnVzaW5nQ29tcG9uZW50cyA9IHt9XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJpbXBvcnQgRGV2IGZyb20gJy4vY29tbWFuZHMvZGV2J1xuaW1wb3J0IEluaXQgZnJvbSAnLi9jb21tYW5kcy9pbml0J1xuaW1wb3J0IFByb2QgZnJvbSAnLi9jb21tYW5kcy9wcm9kJ1xuaW1wb3J0IENyZWF0ZVBhZ2UgZnJvbSAnLi9jb21tYW5kcy9jcmVhdGVQYWdlJ1xuaW1wb3J0IENyZWF0ZUNvbXBvbmVudCBmcm9tICcuL2NvbW1hbmRzL2NyZWF0ZUNvbXBvbmVudCdcbmltcG9ydCBFbnJvbGxDb21wb25lbnQgZnJvbSAnLi9jb21tYW5kcy9lbnJvbGxDb21wb25lbnQnXG5cbmV4cG9ydCBkZWZhdWx0IFtcbiAgICBuZXcgUHJvZCgpLFxuICAgIG5ldyBEZXYoKSxcbiAgICBuZXcgSW5pdCgpLFxuICAgIG5ldyBDcmVhdGVQYWdlKCksXG4gICAgbmV3IENyZWF0ZUNvbXBvbmVudCgpLFxuICAgIG5ldyBFbnJvbGxDb21wb25lbnQoKVxuXVxuIiwiaW1wb3J0IGNvbmZpZyBmcm9tICcuL2NvbmZpZydcbmltcG9ydCAqIGFzIHNlbXZlciBmcm9tICdzZW12ZXInXG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tICcuL3V0aWxzJ1xuaW1wb3J0ICogYXMgY2ZvbnRzIGZyb20gJ2Nmb250cydcbmltcG9ydCBjb21tYW5kcyBmcm9tICcuL2NvbW1hbmRzJ1xuaW1wb3J0IENvbXBpbGVyIGZyb20gJy4vY29yZS9jbGFzcy9Db21waWxlcidcblxuY29uc3QgY29tbWFuZGVyID0gcmVxdWlyZSgnY29tbWFuZGVyJylcbmNvbnN0IHBrZ0pzb24gPSByZXF1aXJlKCcuLi9wYWNrYWdlLmpzb24nKVxuXG5yZXF1aXJlKCdzb3VyY2UtbWFwLXN1cHBvcnQnKS5pbnN0YWxsKClcblxuaWYgKCFzZW12ZXIuc2F0aXNmaWVzKHNlbXZlci5jbGVhbihwcm9jZXNzLnZlcnNpb24pLCBwa2dKc29uLmVuZ2luZXMubm9kZSkpIHtcbiAgICBsb2dnZXIuZXJyb3IoJ1JlcXVpcmVkIG5vZGUgdmVyc2lvbiAnICsgcGtnSnNvbi5lbmdpbmVzLm5vZGUpXG4gICAgcHJvY2Vzcy5leGl0KDEpXG59XG5cbmlmIChwcm9jZXNzLmFyZ3YuaW5kZXhPZignLS1kZWJ1ZycpID4gLTEpIHtcbiAgICBjb25maWcuYW5rYUNvbmZpZy5kZWJ1ZyA9IHRydWVcbn1cblxuaWYgKHByb2Nlc3MuYXJndi5pbmRleE9mKCctLXNsaWVudCcpID4gLTEpIHtcbiAgICBjb25maWcuYW5rYUNvbmZpZy5xdWlldCA9IHRydWVcbn1cblxuY29tbWFuZGVyXG4gICAgLm9wdGlvbignLS1kZWJ1ZycsICdlbmFibGUgZGVidWcgbW9kZScpXG4gICAgLm9wdGlvbignLS1xdWlldCcsICdoaWRlIGNvbXBpbGUgbG9nJylcbiAgICAudmVyc2lvbihwa2dKc29uLnZlcnNpb24pXG4gICAgLnVzYWdlKCc8Y29tbWFuZD4gW29wdGlvbnNdJylcblxuY29tbWFuZHMuZm9yRWFjaChjb21tYW5kID0+IHtcbiAgICBjb25zdCBjbWQgPSBjb21tYW5kZXIuY29tbWFuZChjb21tYW5kLmNvbW1hbmQpXG5cbiAgICBpZiAoY29tbWFuZC5kZXNjcmlwdGlvbikge1xuICAgICAgICBjbWQuZGVzY3JpcHRpb24oY29tbWFuZC5kZXNjcmlwdGlvbilcbiAgICB9XG5cbiAgICBpZiAoY29tbWFuZC51c2FnZSkge1xuICAgICAgICBjbWQudXNhZ2UoY29tbWFuZC51c2FnZSlcbiAgICB9XG5cbiAgICBpZiAoY29tbWFuZC5vbikge1xuICAgICAgICBmb3IgKGxldCBrZXkgaW4gY29tbWFuZC5vbikge1xuICAgICAgICAgICAgY21kLm9uKGtleSwgY29tbWFuZC5vbltrZXldKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNvbW1hbmQub3B0aW9ucykge1xuICAgICAgICBjb21tYW5kLm9wdGlvbnMuZm9yRWFjaCgob3B0aW9uOiBbYW55LCBhbnksIGFueSwgYW55XSkgPT4ge1xuICAgICAgICAgICAgY21kLm9wdGlvbiguLi5vcHRpb24pXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgaWYgKGNvbW1hbmQuYWN0aW9uKSB7XG4gICAgICAgIGNtZC5hY3Rpb24oYXN5bmMgKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgY29tbWFuZC5hY3Rpb24oLi4uYXJncylcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAoY29tbWFuZC5leGFtcGxlcykge1xuICAgICAgICBjbWQub24oJy0taGVscCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbW1hbmQucHJpbnRUaXRsZSgnRXhhbXBsZXM6JylcbiAgICAgICAgICAgIGNvbW1hbmQuZXhhbXBsZXMuZm9yRWFjaChleGFtcGxlID0+IHtcbiAgICAgICAgICAgICAgICBjb21tYW5kLnByaW50Q29udGVudChleGFtcGxlKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICB9XG59KVxuXG5pZiAocHJvY2Vzcy5hcmd2Lmxlbmd0aCA9PT0gMikge1xuICAgIGNvbnN0IExvZ28gPSBjZm9udHMucmVuZGVyKCdBbmthJywge1xuICAgICAgICBmb250OiAnc2ltcGxlJyxcbiAgICAgICAgY29sb3JzOiBbJ2dyZWVuQnJpZ2h0J11cbiAgICB9KVxuXG4gICAgY29uc29sZS5sb2coTG9nby5zdHJpbmcucmVwbGFjZSgvKFxccyspJC8sIGAgJHtwa2dKc29uLnZlcnNpb259XFxyXFxuYCkpXG4gICAgY29tbWFuZGVyLm91dHB1dEhlbHAoKVxufVxuXG5jb21tYW5kZXIucGFyc2UocHJvY2Vzcy5hcmd2KVxuXG5leHBvcnQgZGVmYXVsdCBDb21waWxlclxuIl0sIm5hbWVzIjpbInBhdGguam9pbiIsImZzLmV4aXN0c1N5bmMiLCJzYXNzLnJlbmRlciIsInBvc3Rjc3MiLCJ0c2xpYl8xLl9fYXNzaWduIiwiYmFiZWwudHJhbnNmb3JtU3luYyIsImZzLmVuc3VyZUZpbGUiLCJwb3N0Y3NzLnBsdWdpbiIsImludGVybmFsUGx1Z2lucyIsInRzLnRyYW5zcGlsZU1vZHVsZSIsImJhYmVsLnBhcnNlIiwicGF0aCIsInBhdGguZGlybmFtZSIsInBhdGgucmVsYXRpdmUiLCJjd2QiLCJhbmthRGVmYXVsdENvbmZpZy50ZW1wbGF0ZSIsImFua2FEZWZhdWx0Q29uZmlnLnBhcnNlcnMiLCJhbmthRGVmYXVsdENvbmZpZy5wbHVnaW5zIiwiYW5rYURlZmF1bHRDb25maWcuaWdub3JlZCIsInBhdGgucmVzb2x2ZSIsImN1c3RvbUNvbmZpZyIsInN5c3RlbS5zcmNEaXIiLCJmcy5yZWFkRmlsZSIsImZzLndyaXRlRmlsZSIsInBhdGguYmFzZW5hbWUiLCJwYXRoLmV4dG5hbWUiLCJmcy5yZWFkRmlsZVN5bmMiLCJsb2ciLCJjaG9raWRhci53YXRjaCIsInRzbGliXzEuX19leHRlbmRzIiwidXRpbHMubG9nZ2VyIiwidXRpbHMuY3JlYXRlRmlsZSIsInV0aWxzLmFzeW5jRnVuY3Rpb25XcmFwcGVyIiwidXRpbHMuY2FsbFByb21pc2VJbkNoYWluIiwicGF0aC5zZXAiLCJsb2dnZXIiLCJ1dGlscy5zZWFyY2hGaWxlcyIsImZzLmVuc3VyZURpclN5bmMiLCJ1dGlscy5nZW5GaWxlV2F0Y2hlciIsImZzLnVubGluayIsImRvd25sb2FkUmVwbyIsIkZzRWRpdG9yIiwiY29uZmlnIiwiUHJvZCIsIkRldiIsIkluaXQiLCJDcmVhdGVQYWdlIiwiQ3JlYXRlQ29tcG9uZW50IiwiRW5yb2xsQ29tcG9uZW50Iiwic2VtdmVyLnNhdGlzZmllcyIsInNlbXZlci5jbGVhbiIsImNmb250cy5yZW5kZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHQSxJQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUE7QUFFekIsd0JBQXlCLEtBQXlCLEVBQUUsSUFBYTtJQUF4QyxzQkFBQSxFQUFBLFVBQXlCO0lBQzlDLElBQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQTtJQUN2QixJQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQUEsSUFBSSxJQUFJLE9BQUFBLFNBQVMsQ0FBQyxJQUFJLElBQUksR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFBLENBQUMsQ0FBQTtJQUVuRSxLQUFLLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRSxLQUFLLEdBQUcsV0FBVyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRTtRQUNyRCxJQUFNLFVBQVUsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUE7UUFFckMsSUFBSUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQzNCLE1BQU0sQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFBO1lBQ2hELE1BQUs7U0FDUjtLQUNKO0lBRUQsT0FBTyxZQUFZLENBQUE7Q0FDdEI7OztBQ05ELGtCQUF1QixVQUFpQyxJQUFVLEVBQUUsV0FBd0IsRUFBRSxRQUFtQjtJQUM3RyxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7SUFDN0IsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFBO0lBRXJDLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sWUFBWSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsR0FBRyxJQUFJ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
