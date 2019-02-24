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
            logger.error('Error');
            console.error(err);
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
        err.message = chalk.hex('#333333').bgRedBright(title) + ' ' + chalk.grey(msg);
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
        var result = babel.transformSync(file.content, tslib_1.__assign({ babelrc: false, ast: true, filename: file.sourceFile, sourceType: 'module', sourceMaps: config.ankaConfig.devMode, comments: config.ankaConfig.devMode, minified: !config.ankaConfig.devMode }, babelConfig));
        file.sourceMap = JSON.stringify(result.map);
        file.content = result.code;
        file.ast = result.ast;
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
                                logger$1.success('Compiled ', "in " + (Date.now() - startupTime) + "ms");
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
                                logger$1.success('Compiled ', "in " + (Date.now() - startupTime) + "ms");
                                messager.printInfo();
                            }
                            return [2];
                    }
                });
            }); });
            watcher.on('ready', function () {
                resolve();
                logger$1.log('waiting for changes...');
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlscy9yZXNvbHZlQ29uZmlnLnRzIiwiLi4vc3JjL3BhcnNlcnMvc2Fzc1BhcnNlci50cyIsIi4uL3NyYy91dGlscy9tZXNzYWdlci50cyIsIi4uL3NyYy91dGlscy9sb2dnZXIudHMiLCIuLi9zcmMvcGFyc2Vycy9zdHlsZVBhcnNlci9pbmRleC50cyIsIi4uL3NyYy9wYXJzZXJzL2JhYmVsUGFyc2VyLnRzIiwiLi4vc3JjL3BsdWdpbnMvc2F2ZUZpbGVQbHVnaW4vaW5kZXgudHMiLCIuLi9zcmMvcGx1Z2lucy93eEltcG9ydFBsdWdpbi9wb3N0Y3NzV3hpbXBvcnQudHMiLCIuLi9zcmMvcGx1Z2lucy93eEltcG9ydFBsdWdpbi9pbmRleC50cyIsIi4uL3NyYy9wYXJzZXJzL3R5cGVzY3JpcHRQYXJzZXIudHMiLCIuLi9zcmMvcGx1Z2lucy9leHRyYWN0RGVwZW5kZW5jeVBsdWdpbi9pbmRleC50cyIsIi4uL3NyYy9jb25maWcvYW5rYURlZmF1bHRDb25maWcudHMiLCIuLi9zcmMvY29uZmlnL2Fua2FDb25maWcudHMiLCIuLi9zcmMvY29uZmlnL3N5c3RlbUNvbmZpZy50cyIsIi4uL3NyYy9jb25maWcvcHJvamVjdENvbmZpZy50cyIsIi4uL3NyYy9jb25maWcvaW5kZXgudHMiLCIuLi9zcmMvdXRpbHMvZnMudHMiLCIuLi9zcmMvY29yZS9jbGFzcy9GaWxlLnRzIiwiLi4vc3JjL3V0aWxzL2NyZWF0ZUZpbGUudHMiLCIuLi9zcmMvdXRpbHMvZWRpdG9yLnRzIiwiLi4vc3JjL3V0aWxzL3Jlc29sdmVNb2R1bGUudHMiLCIuLi9zcmMvdXRpbHMvY2FsbFByb21pc2VJbkNoYWluLnRzIiwiLi4vc3JjL3V0aWxzL2FzeW5jRnVuY3Rpb25XcmFwcGVyLnRzIiwiLi4vc3JjL3V0aWxzL2dlbkZpbGVXYXRjaGVyLnRzIiwiLi4vc3JjL3V0aWxzL2lzTnBtRGVwZW5kZW5jeS50cyIsIi4uL3NyYy91dGlscy9kb3dubG9hZFJlcGUudHMiLCIuLi9zcmMvY29yZS9jbGFzcy9JbmplY3Rpb24udHMiLCIuLi9zcmMvY29yZS9jbGFzcy9Db21waWxhdGlvbi50cyIsIi4uL3NyYy9jb3JlL2NsYXNzL0NvbXBpbGVyLnRzIiwiLi4vc3JjL2NvcmUvY2xhc3MvQ29tbWFuZC50cyIsIi4uL3NyYy9jb21tYW5kcy9kZXYudHMiLCIuLi9zcmMvY29tbWFuZHMvaW5pdC50cyIsIi4uL3NyYy9jb21tYW5kcy9wcm9kLnRzIiwiLi4vc3JjL2NvbW1hbmRzL2NyZWF0ZVBhZ2UudHMiLCIuLi9zcmMvY29tbWFuZHMvY3JlYXRlQ29tcG9uZW50LnRzIiwiLi4vc3JjL2NvbW1hbmRzL2Vucm9sbENvbXBvbmVudC50cyIsIi4uL3NyYy9jb21tYW5kcy50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcydcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcblxuY29uc3QgY3dkID0gcHJvY2Vzcy5jd2QoKVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAobmFtZXM6IEFycmF5PHN0cmluZz4gPSBbXSwgcm9vdD86IHN0cmluZyk6IE9iamVjdCB7XG4gICAgY29uc3QgZGVmYXVsdFZhbHVlID0ge31cbiAgICBjb25zdCBjb25maWdQYXRocyA9IG5hbWVzLm1hcChuYW1lID0+IHBhdGguam9pbihyb290IHx8IGN3ZCwgbmFtZSkpXG5cbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgY29uZmlnUGF0aHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZ1BhdGggPSBjb25maWdQYXRoc1tpbmRleF1cblxuICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhjb25maWdQYXRoKSkge1xuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihkZWZhdWx0VmFsdWUsIHJlcXVpcmUoY29uZmlnUGF0aCkpXG4gICAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlZmF1bHRWYWx1ZVxufVxuIiwiaW1wb3J0ICogYXMgc2FzcyBmcm9tICdub2RlLXNhc3MnXG5cbmltcG9ydCB7XG4gICAgRmlsZSxcbiAgICBQYXJzZXIsXG4gICAgQ29tcGlsYXRpb24sXG4gICAgUGFyc2VySW5qZWN0aW9uXG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG4vKipcbiAqIFNhc3MgZmlsZSBwYXJzZXIuXG4gKiBAZm9yIGFueSBmaWxlIHRoYXQgZG9lcyBub3QgbWF0Y2hlIHBhcnNlcnMuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IDxQYXJzZXI+ZnVuY3Rpb24gKHRoaXM6IFBhcnNlckluamVjdGlvbiwgZmlsZTogRmlsZSwgY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYWxsYmFjaz86IEZ1bmN0aW9uKSB7XG4gICAgY29uc3QgdXRpbHMgPSB0aGlzLmdldFV0aWxzKClcbiAgICBjb25zdCBjb25maWcgPSB0aGlzLmdldFN5c3RlbUNvbmZpZygpXG5cbiAgICBmaWxlLmNvbnRlbnQgPSBmaWxlLmNvbnRlbnQgaW5zdGFuY2VvZiBCdWZmZXIgPyBmaWxlLmNvbnRlbnQudG9TdHJpbmcoKSA6IGZpbGUuY29udGVudFxuXG4gICAgc2Fzcy5yZW5kZXIoe1xuICAgICAgICBmaWxlOiBmaWxlLnNvdXJjZUZpbGUsXG4gICAgICAgIGRhdGE6IGZpbGUuY29udGVudFxuICAgIH0sIChlcnI6IEVycm9yLCByZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICB1dGlscy5sb2dnZXIuZXJyb3IoJ0NvbXBpbGUnLCBlcnIubWVzc2FnZSwgZXJyKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZmlsZS5jb250ZW50ID0gcmVzdWx0LmNzc1xuICAgICAgICAgICAgZmlsZS51cGRhdGVFeHQoJy53eHNzJylcbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjaygpXG4gICAgfSlcbn1cbiIsImltcG9ydCBsb2dnZXIgZnJvbSAnLi9sb2dnZXInXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBlcnJvcnM6IFtdLFxuICAgIG1lc3NhZ2VzOiBbXSxcbiAgICBwdXNoIChtc2c6IE9iamVjdCk6IHZvaWQge1xuICAgICAgICBpZiAobXNnIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMuZXJyb3JzLnB1c2gobXNnKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlcy5wdXNoKG1zZylcbiAgICAgICAgfVxuICAgIH0sXG4gICAgY2xlYXIgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmVycm9ycyA9IFtdXG4gICAgICAgIHRoaXMubWVzc2FnZXMgPSBbXVxuICAgIH0sXG4gICAgaGFzRXJyb3IgKCk6IEJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gISF0aGlzLmVycm9ycy5sZW5ndGhcbiAgICB9LFxuICAgIHByaW50RXJyb3IgKCk6IHZvaWQge1xuICAgICAgICBjb25zb2xlLmNsZWFyKClcbiAgICAgICAgdGhpcy5lcnJvcnMuZm9yRWFjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvcicpXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgICAgfSlcbiAgICAgICAgdGhpcy5lcnJvcnMgPSBbXVxuICAgIH0sXG4gICAgcHJpbnRJbmZvICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5tZXNzYWdlcy5mb3JFYWNoKChpbmZvOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhpbmZvKVxuICAgICAgICB9KVxuXG4gICAgICAgIHRoaXMubWVzc2FnZXMgPSBbXVxuICAgIH1cbn1cbiIsImltcG9ydCBjaGFsayBmcm9tICdjaGFsaydcbmltcG9ydCBtZXNzYWdlciBmcm9tICcuL21lc3NhZ2VyJ1xuXG5jb25zdCBvcmEgPSByZXF1aXJlKCdvcmEnKVxuXG5leHBvcnQgZnVuY3Rpb24gdG9GaXggKG51bWJlcjogbnVtYmVyKTogc3RyaW5nIHtcbiAgICByZXR1cm4gKCcwMCcgKyBudW1iZXIpLnNsaWNlKC0yKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudFRpbWUgKCk6IHN0cmluZyB7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKVxuICAgIHJldHVybiBgJHt0b0ZpeChub3cuZ2V0SG91cnMoKSl9OiR7dG9GaXgobm93LmdldE1pbnV0ZXMoKSl9OiR7dG9GaXgobm93LmdldFNlY29uZHMoKSl9YFxufVxuXG5leHBvcnQgY2xhc3MgTG9nZ2VyIHtcbiAgICBvcmFJbnN0YW5jZTogYW55XG5cbiAgICBnZXQgdGltZSAoKSB7XG4gICAgICAgIHJldHVybiBjaGFsay5ncmV5KGBbJHtnZXRDdXJyZW50VGltZSgpfV1gKVxuICAgIH1cblxuICAgIHN0YXJ0TG9hZGluZyAobXNnOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5vcmFJbnN0YW5jZSA9IG9yYShtc2cpLnN0YXJ0KClcbiAgICB9XG5cbiAgICBzdG9wTG9hZGluZyAoKSB7XG4gICAgICAgIHRoaXMub3JhSW5zdGFuY2UgJiYgdGhpcy5vcmFJbnN0YW5jZS5zdG9wKClcbiAgICB9XG5cbiAgICBsb2cgKC4uLm1zZzogQXJyYXk8c3RyaW5nPikge1xuICAgICAgICByZXR1cm4gY29uc29sZS5sb2coW3RoaXMudGltZSwgLi4ubXNnXS5qb2luKCcgJykpXG4gICAgfVxuXG4gICAgZXJyb3IgKHRpdGxlOiBzdHJpbmcgPSAnJywgbXNnOiBzdHJpbmcgPSAnJywgZXJyPzogYW55KSB7XG4gICAgICAgIGlmIChlcnIgPT09IHZvaWQgKDApKSB7XG4gICAgICAgICAgICBlcnIgPSBuZXcgRXJyb3IoJycpXG4gICAgICAgIH1cbiAgICAgICAgZXJyLm1lc3NhZ2UgPSBjaGFsay5oZXgoJyMzMzMzMzMnKS5iZ1JlZEJyaWdodCh0aXRsZSkgKyAnICcgKyBjaGFsay5ncmV5KG1zZylcbiAgICAgICAgbWVzc2FnZXIucHVzaChlcnIpXG4gICAgfVxuXG4gICAgaW5mbyAodGl0bGU6IHN0cmluZyA9ICcnLCBtc2c6IHN0cmluZyA9ICcnKSB7XG4gICAgICAgIG1lc3NhZ2VyLnB1c2godGhpcy50aW1lICsgJyAnICsgY2hhbGsucmVzZXQodGl0bGUpICsgJyAnICsgY2hhbGsuZ3JleShtc2cpKVxuICAgIH1cblxuICAgIHdhcm4gKHRpdGxlOiBzdHJpbmcgPSAnJywgbXNnOiBzdHJpbmcgPSAnJykge1xuICAgICAgICBjb25zb2xlLmNsZWFyKClcbiAgICAgICAgdGhpcy5sb2coY2hhbGsuaGV4KCcjMzMzMzMzJykuYmdZZWxsb3dCcmlnaHQodGl0bGUpLCBjaGFsay5ncmV5KG1zZykpXG4gICAgfVxuXG4gICAgc3VjY2VzcyAodGl0bGU6IHN0cmluZyA9ICcnLCBtc2c6IHN0cmluZyA9ICcnKSB7XG4gICAgICAgIGNvbnNvbGUuY2xlYXIoKVxuICAgICAgICB0aGlzLmxvZyhjaGFsay5oZXgoJyMzMzMzMzMnKS5iZ0dyZWVuQnJpZ2h0KHRpdGxlKSwgY2hhbGsuZ3JleShtc2cpKVxuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgbmV3IExvZ2dlcigpXG4iLCJpbXBvcnQgKiBhcyBQb3N0Y3NzIGZyb20gJ3Bvc3Rjc3MnXG5pbXBvcnQgbG9nZ2VyIGZyb20gJy4uLy4uL3V0aWxzL2xvZ2dlcidcbmltcG9ydCBwb3N0Y3NzcmMgZnJvbSAncG9zdGNzcy1sb2FkLWNvbmZpZydcblxuaW1wb3J0IHtcbiAgICBGaWxlLFxuICAgIFBhcnNlcixcbiAgICBDb21waWxhdGlvbixcbiAgICBQYXJzZXJJbmplY3Rpb25cbn0gZnJvbSAnLi4vLi4vLi4vdHlwZXMvdHlwZXMnXG5cbmNvbnN0IHBvc3Rjc3MgPSByZXF1aXJlKCdwb3N0Y3NzJylcbmNvbnN0IHBvc3Rjc3NDb25maWc6IGFueSA9IHt9XG5jb25zdCBpbnRlcm5hbFBsdWdpbnM6IEFycmF5PFBvc3Rjc3MuQWNjZXB0ZWRQbHVnaW4+ID0gW11cbmNvbnN0IHRhc2tzOiBhbnlbXSA9IFtdXG5cbi8vIFRPRE86IEFkZCBuZXcgaG9vazogcHJlc2V0XG5cbi8qKlxuICogU3R5bGUgZmlsZSBwYXJzZXIuXG4gKiBAZm9yIC53eHNzIC5jc3MgPT4gLnd4c3NcbiAqL1xuZXhwb3J0IGRlZmF1bHQgPFBhcnNlcj5mdW5jdGlvbiAodGhpczogUGFyc2VySW5qZWN0aW9uLCBmaWxlOiBGaWxlLCBjb21waWxhdGlvbjogQ29tcGlsYXRpb24sIGNiOiBGdW5jdGlvbik6IHZvaWQge1xuICAgIGlmIChwb3N0Y3NzQ29uZmlnLnBsdWdpbnMpIHtcbiAgICAgICAgZXhlYyhwb3N0Y3NzQ29uZmlnLCBmaWxlLCBjYilcbiAgICB9IGVsc2Uge1xuICAgICAgICB0YXNrcy5wdXNoKCgpID0+IHtcbiAgICAgICAgICAgIGV4ZWMocG9zdGNzc0NvbmZpZywgZmlsZSwgY2IpXG4gICAgICAgIH0pXG4gICAgfVxufVxuXG5nZW5Qb3N0Y3NzQ29uZmlnKCkudGhlbigoY29uZmlnOiBhbnkpID0+IHtcbiAgICB0YXNrcy5mb3JFYWNoKCh0YXNrOiBGdW5jdGlvbikgPT4gdGFzaygpKVxufSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICBsb2dnZXIuZXJyb3IoJ2xvYWRDb25maWcnLCBlcnIubWVzc2FnZSwgZXJyKVxufSlcblxuXG5mdW5jdGlvbiBleGVjIChjb25maWc6IGFueSwgZmlsZTogRmlsZSwgY2I6IEZ1bmN0aW9uKSB7XG4gICAgZmlsZS5jb252ZXJ0Q29udGVudFRvU3RyaW5nKClcbiAgICBwb3N0Y3NzKGNvbmZpZy5wbHVnaW5zLmNvbmNhdChpbnRlcm5hbFBsdWdpbnMpKS5wcm9jZXNzKGZpbGUuY29udGVudCwge1xuICAgICAgICAuLi5jb25maWcub3B0aW9ucyxcbiAgICAgICAgZnJvbTogZmlsZS5zb3VyY2VGaWxlXG4gICAgfSBhcyBQb3N0Y3NzLlByb2Nlc3NPcHRpb25zKS50aGVuKChyb290OiBQb3N0Y3NzLlJlc3VsdCkgPT4ge1xuICAgICAgICBmaWxlLmNvbnRlbnQgPSByb290LmNzc1xuICAgICAgICBmaWxlLmFzdCA9IHJvb3Qucm9vdC50b1Jlc3VsdCgpXG4gICAgICAgIGZpbGUudXBkYXRlRXh0KCcud3hzcycpXG4gICAgICAgIGNiKClcbiAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICBsb2dnZXIuZXJyb3IoJ0NvbXBpbGUnLCBlcnIubWVzc2FnZSwgZXJyKVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIGdlblBvc3Rjc3NDb25maWcgKHRhc2tzOiBGdW5jdGlvbltdID0gW10pIHtcbiAgICByZXR1cm4gcG9zdGNzc0NvbmZpZy5wbHVnaW5zID8gUHJvbWlzZS5yZXNvbHZlKHBvc3Rjc3NDb25maWcpIDogcG9zdGNzc3JjKHt9KS50aGVuKChjb25maWc6IGFueSkgPT4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKE9iamVjdC5hc3NpZ24ocG9zdGNzc0NvbmZpZywgY29uZmlnKSlcbiAgICB9KVxufVxuIiwiaW1wb3J0ICogYXMgYmFiZWwgZnJvbSAnQGJhYmVsL2NvcmUnXG5pbXBvcnQgRmlsZSBmcm9tICcuLi9jb3JlL2NsYXNzL0ZpbGUnXG5cbmltcG9ydCB7XG4gICAgUGFyc2VyLFxuICAgIENvbXBpbGF0aW9uLFxuICAgIFBhcnNlckluamVjdGlvblxufSBmcm9tICcuLi8uLi90eXBlcy90eXBlcydcblxubGV0IGJhYmVsQ29uZmlnID0gPGJhYmVsLlRyYW5zZm9ybU9wdGlvbnM+bnVsbFxuXG4vKipcbiAqIFNjcmlwdCBGaWxlIHBhcnNlci5cbiAqIEBmb3IgLmpzIC5lc1xuICovXG5leHBvcnQgZGVmYXVsdCA8UGFyc2VyPmZ1bmN0aW9uICh0aGlzOiBQYXJzZXJJbmplY3Rpb24sIGZpbGU6IEZpbGUsIGNvbXBpbGF0aW9uOiBDb21waWxhdGlvbiwgY2I6IEZ1bmN0aW9uKSB7XG4gICAgY29uc3QgdXRpbHMgPSB0aGlzLmdldFV0aWxzKClcbiAgICBjb25zdCBjb25maWcgPSB0aGlzLmdldFN5c3RlbUNvbmZpZygpXG5cbiAgICBpZiAoZmlsZS5pc0luU3JjRGlyKSB7XG4gICAgICAgIGlmICghYmFiZWxDb25maWcpIHtcbiAgICAgICAgICAgIGJhYmVsQ29uZmlnID0gPGJhYmVsLlRyYW5zZm9ybU9wdGlvbnM+dXRpbHMucmVzb2x2ZUNvbmZpZyhbJ2JhYmVsLmNvbmZpZy5qcyddLCBjb25maWcuY3dkKVxuICAgICAgICB9XG5cbiAgICAgICAgZmlsZS5jb252ZXJ0Q29udGVudFRvU3RyaW5nKClcblxuICAgICAgICBjb25zdCByZXN1bHQgPSBiYWJlbC50cmFuc2Zvcm1TeW5jKDxzdHJpbmc+ZmlsZS5jb250ZW50LCB7XG4gICAgICAgICAgICBiYWJlbHJjOiBmYWxzZSxcbiAgICAgICAgICAgIGFzdDogdHJ1ZSxcbiAgICAgICAgICAgIGZpbGVuYW1lOiBmaWxlLnNvdXJjZUZpbGUsXG4gICAgICAgICAgICBzb3VyY2VUeXBlOiAnbW9kdWxlJyxcbiAgICAgICAgICAgIHNvdXJjZU1hcHM6IGNvbmZpZy5hbmthQ29uZmlnLmRldk1vZGUsXG4gICAgICAgICAgICBjb21tZW50czogY29uZmlnLmFua2FDb25maWcuZGV2TW9kZSxcbiAgICAgICAgICAgIG1pbmlmaWVkOiAhY29uZmlnLmFua2FDb25maWcuZGV2TW9kZSxcbiAgICAgICAgICAgIC4uLmJhYmVsQ29uZmlnXG4gICAgICAgIH0pXG5cbiAgICAgICAgZmlsZS5zb3VyY2VNYXAgPSBKU09OLnN0cmluZ2lmeShyZXN1bHQubWFwKVxuICAgICAgICBmaWxlLmNvbnRlbnQgPSByZXN1bHQuY29kZVxuICAgICAgICBmaWxlLmFzdCA9IHJlc3VsdC5hc3RcbiAgICB9XG5cbiAgICBmaWxlLnVwZGF0ZUV4dCgnLmpzJylcbiAgICBjYigpXG59XG4iLCJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSdcbmltcG9ydCB7XG4gICAgUGx1Z2luLFxuICAgIENvbXBpbGF0aW9uLFxuICAgIFBsdWdpbkhhbmRsZXIsXG4gICAgUGx1Z2luSW5qZWN0aW9uXG59IGZyb20gJy4uLy4uLy4uL3R5cGVzL3R5cGVzJ1xuY29uc3QgVWdsaWZ5SlMgPSByZXF1aXJlKCd1Z2xpZnktanMnKVxuY29uc3QgbWluaWZ5SlNPTiA9IHJlcXVpcmUoJ2pzb25taW5pZnknKVxuXG5jb25zdCBpbmxpbmVTb3VyY2VNYXBDb21tZW50ID0gcmVxdWlyZSgnaW5saW5lLXNvdXJjZS1tYXAtY29tbWVudCcpXG5cbmV4cG9ydCBkZWZhdWx0IDxQbHVnaW4+ZnVuY3Rpb24gKHRoaXM6IFBsdWdpbkluamVjdGlvbikge1xuICAgIGNvbnN0IHV0aWxzID0gdGhpcy5nZXRVdGlscygpXG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5nZXRTeXN0ZW1Db25maWcoKVxuICAgIGNvbnN0IHtcbiAgICAgICAgbG9nZ2VyLFxuICAgICAgICB3cml0ZUZpbGVcbiAgICB9ID0gdXRpbHNcblxuICAgIHRoaXMub24oJ3NhdmUnLCA8UGx1Z2luSGFuZGxlcj5mdW5jdGlvbiAoY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYjogRnVuY3Rpb24pIHtcbiAgICAgICAgY29uc3QgZmlsZSA9IGNvbXBpbGF0aW9uLmZpbGVcblxuICAgICAgICAvLyBUT0RPOiBVc2UgbWVtLWZzXG4gICAgICAgIGZzLmVuc3VyZUZpbGUoZmlsZS50YXJnZXRGaWxlKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGlmIChjb25maWcuYW5rYUNvbmZpZy5kZXZNb2RlICYmIGZpbGUuc291cmNlTWFwKSB7XG4gICAgICAgICAgICAgICAgZmlsZS5jb252ZXJ0Q29udGVudFRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICBmaWxlLmNvbnRlbnQgPSBmaWxlLmNvbnRlbnQgKyAnXFxyXFxuXFxyXFxuJyArIGlubGluZVNvdXJjZU1hcENvbW1lbnQoZmlsZS5zb3VyY2VNYXAsIHtcbiAgICAgICAgICAgICAgICAgICAgYmxvY2s6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZXNDb250ZW50OiB0cnVlXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghY29uZmlnLmFua2FDb25maWcuZGV2TW9kZSkge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoZmlsZS5leHRuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNhc2UgJy5qcyc6XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnLmpzb24nOlxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5jb252ZXJ0Q29udGVudFRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuY29udGVudCA9IG1pbmlmeUpTT04oZmlsZS5jb250ZW50KVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gd3JpdGVGaWxlKGZpbGUudGFyZ2V0RmlsZSwgZmlsZS5jb250ZW50KVxuICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGNiKClcbiAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgIGxvZ2dlci5lcnJvcignRXJyb3InLCBlcnIubWVzc2FnZSwgZXJyKVxuICAgICAgICAgICAgY2IoKVxuICAgICAgICB9KVxuICAgIH0pXG59XG4iLCJpbXBvcnQgKiBhcyBwb3N0Y3NzIGZyb20gJ3Bvc3Rjc3MnXG5cbmV4cG9ydCBkZWZhdWx0IHBvc3Rjc3MucGx1Z2luKCdwb3N0Y3NzLXd4aW1wb3J0JywgKCkgPT4ge1xuICAgIHJldHVybiAocm9vdDogcG9zdGNzcy5Sb290KSA9PiB7XG4gICAgICAgIGxldCBpbXBvcnRzOiBBcnJheTxzdHJpbmc+ID0gW11cblxuICAgICAgICByb290LndhbGtBdFJ1bGVzKCd3eGltcG9ydCcsIChydWxlOiBwb3N0Y3NzLkF0UnVsZSkgPT4ge1xuICAgICAgICAgICAgaW1wb3J0cy5wdXNoKHJ1bGUucGFyYW1zLnJlcGxhY2UoL1xcLlxcdysoPz1bJ1wiXSQpLywgJy53eHNzJykpXG4gICAgICAgICAgICBydWxlLnJlbW92ZSgpXG4gICAgICAgIH0pXG4gICAgICAgIHJvb3QucHJlcGVuZCguLi5pbXBvcnRzLm1hcCgoaXRlbTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdpbXBvcnQnLFxuICAgICAgICAgICAgICAgIHBhcmFtczogaXRlbVxuICAgICAgICAgICAgfVxuICAgICAgICB9KSlcbiAgICAgICAgaW1wb3J0cy5sZW5ndGggPSAwXG4gICAgfVxufSlcbiIsImltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJ1xuaW1wb3J0IHtcbiAgICBQbHVnaW4sXG4gICAgQ29tcGlsYXRpb24sXG4gICAgUGx1Z2luSGFuZGxlcixcbiAgICBQbHVnaW5JbmplY3Rpb25cbn0gZnJvbSAnLi4vLi4vLi4vdHlwZXMvdHlwZXMnXG5pbXBvcnQgKiBhcyBQb3N0Q1NTIGZyb20gJ3Bvc3Rjc3MnXG5pbXBvcnQgcG9zdGNzc1d4SW1wb3J0IGZyb20gJy4vcG9zdGNzc1d4aW1wb3J0J1xuXG5jb25zdCBwb3N0Y3NzID0gcmVxdWlyZSgncG9zdGNzcycpXG5jb25zdCBjc3NuYW5vID0gcmVxdWlyZSgncG9zdGNzcy1ub3JtYWxpemUtd2hpdGVzcGFjZScpXG5jb25zdCBpbnRlcm5hbFBsdWdpbnM6IEFycmF5PFBvc3RDU1MuQWNjZXB0ZWRQbHVnaW4+ID0gW3Bvc3Rjc3NXeEltcG9ydF1cblxuZXhwb3J0IGRlZmF1bHQgPFBsdWdpbj5mdW5jdGlvbiAodGhpczogUGx1Z2luSW5qZWN0aW9uKSB7XG4gICAgY29uc3QgdXRpbHMgPSB0aGlzLmdldFV0aWxzKClcbiAgICBjb25zdCB7XG4gICAgICAgIGxvZ2dlclxuICAgIH0gPSB1dGlsc1xuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuZ2V0U3lzdGVtQ29uZmlnKClcbiAgICBjb25zdCB0ZXN0U3JjRGlyID0gbmV3IFJlZ0V4cChgXiR7Y29uZmlnLnNyY0Rpcn1gKVxuXG4gICAgdGhpcy5vbignYmVmb3JlLWNvbXBpbGUnLCA8UGx1Z2luSGFuZGxlcj5mdW5jdGlvbiAoY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYjogRnVuY3Rpb24pIHtcbiAgICAgICAgY29uc3QgZmlsZSA9IGNvbXBpbGF0aW9uLmZpbGVcblxuICAgICAgICBpZiAoIWNvbmZpZy5hbmthQ29uZmlnLmRldk1vZGUpIHtcbiAgICAgICAgICAgIGludGVybmFsUGx1Z2lucy5wdXNoKGNzc25hbm8pXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBoYW5kbGVyID0gcG9zdGNzcyhpbnRlcm5hbFBsdWdpbnMpXG5cbiAgICAgICAgaWYgKGZpbGUuZXh0bmFtZSA9PT0gJy53eHNzJyAmJiB0ZXN0U3JjRGlyLnRlc3QoZmlsZS5zb3VyY2VGaWxlKSkge1xuICAgICAgICAgICAgaGFuZGxlci5wcm9jZXNzKChmaWxlLmFzdCB8fCBmaWxlLmNvbnRlbnQpIGFzIHN0cmluZyB8IHsgdG9TdHJpbmcgKCk6IHN0cmluZzsgfSB8IFBvc3RDU1MuUmVzdWx0LCB7XG4gICAgICAgICAgICAgICAgZnJvbTogZmlsZS5zb3VyY2VGaWxlXG4gICAgICAgICAgICB9IGFzIFBvc3RDU1MuUHJvY2Vzc09wdGlvbnMpLnRoZW4oKHJvb3Q6IFBvc3RDU1MuUmVzdWx0KTogdm9pZCA9PiB7XG4gICAgICAgICAgICAgICAgZmlsZS5jb250ZW50ID0gcm9vdC5jc3NcbiAgICAgICAgICAgICAgICBmaWxlLmFzdCA9IHJvb3Qucm9vdC50b1Jlc3VsdCgpXG4gICAgICAgICAgICAgICAgY2IoKVxuICAgICAgICAgICAgfSwgKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yJywgZXJyLm1lc3NhZ2UsIGVycilcbiAgICAgICAgICAgICAgICBjYigpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2IoKVxuICAgICAgICB9XG4gICAgfSlcbn1cbiIsImltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnXG5cbmltcG9ydCB7XG4gICAgRmlsZSxcbiAgICBQYXJzZXIsXG4gICAgQ29tcGlsYXRpb24sXG4gICAgUGFyc2VySW5qZWN0aW9uXG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5sZXQgdHNDb25maWcgPSA8dHMuVHJhbnNwaWxlT3B0aW9ucz5udWxsXG5cbi8qKlxuICogVHlwZXNjcmlwdCBmaWxlIHBhcnNlci5cbiAqXG4gKiBAZm9yIGFueSBmaWxlIHRoYXQgZG9lcyBub3QgbWF0Y2hlIHBhcnNlcnMuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IDxQYXJzZXI+ZnVuY3Rpb24gKHRoaXM6IFBhcnNlckluamVjdGlvbiwgZmlsZTogRmlsZSwgY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYWxsYmFjaz86IEZ1bmN0aW9uKSB7XG4gICAgY29uc3QgdXRpbHMgPSB0aGlzLmdldFV0aWxzKClcbiAgICBjb25zdCBjb25maWcgPSB0aGlzLmdldFN5c3RlbUNvbmZpZygpXG4gICAgY29uc3QgeyBsb2dnZXIgfSA9IHV0aWxzXG5cbiAgICBmaWxlLmNvbnRlbnQgPSBmaWxlLmNvbnRlbnQgaW5zdGFuY2VvZiBCdWZmZXIgPyBmaWxlLmNvbnRlbnQudG9TdHJpbmcoKSA6IGZpbGUuY29udGVudFxuICAgIGNvbnN0IHNvdXJjZU1hcCA9ICB7XG4gICAgICAgIHNvdXJjZXNDb250ZW50OiBbZmlsZS5jb250ZW50XVxuICAgIH1cblxuICAgIGlmICghdHNDb25maWcpIHtcbiAgICAgICAgdHNDb25maWcgPSA8dHMuVHJhbnNwaWxlT3B0aW9ucz51dGlscy5yZXNvbHZlQ29uZmlnKFsndHNjb25maWcuanNvbicsICd0c2NvbmZpZy5qcyddLCBjb25maWcuY3dkKVxuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdCA9IHRzLnRyYW5zcGlsZU1vZHVsZShmaWxlLmNvbnRlbnQsIHtcbiAgICAgICAgY29tcGlsZXJPcHRpb25zOiB0c0NvbmZpZy5jb21waWxlck9wdGlvbnMsXG4gICAgICAgIGZpbGVOYW1lOiBmaWxlLnNvdXJjZUZpbGVcbiAgICB9KVxuXG4gICAgdHJ5IHtcbiAgICAgICAgZmlsZS5jb250ZW50ID0gcmVzdWx0Lm91dHB1dFRleHRcbiAgICAgICAgaWYgKGNvbmZpZy5hbmthQ29uZmlnLmRldk1vZGUpIHtcbiAgICAgICAgICAgIGZpbGUuc291cmNlTWFwID0ge1xuICAgICAgICAgICAgICAgIC4uLkpTT04ucGFyc2UocmVzdWx0LnNvdXJjZU1hcFRleHQpLFxuICAgICAgICAgICAgICAgIC4uLnNvdXJjZU1hcFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZpbGUudXBkYXRlRXh0KCcuanMnKVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBsb2dnZXIuZXJyb3IoJ0NvbXBpbGUgZXJyb3InLCBlcnIubWVzc2FnZSwgZXJyKVxuICAgIH1cblxuICAgIGNhbGxiYWNrKClcbn1cbiIsImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIHQgZnJvbSAnQGJhYmVsL3R5cGVzJ1xuaW1wb3J0ICogYXMgYmFiZWwgZnJvbSAnQGJhYmVsL2NvcmUnXG5pbXBvcnQgdHJhdmVyc2UgZnJvbSAnQGJhYmVsL3RyYXZlcnNlJ1xuaW1wb3J0IGNvZGVHZW5lcmF0b3IgZnJvbSAnQGJhYmVsL2dlbmVyYXRvcidcblxuaW1wb3J0IHtcbiAgICBQbHVnaW4sXG4gICAgQ29tcGlsYXRpb24sXG4gICAgUGx1Z2luSGFuZGxlcixcbiAgICBQbHVnaW5JbmplY3Rpb25cbn0gZnJvbSAnLi4vLi4vLi4vdHlwZXMvdHlwZXMnXG5cbmNvbnN0IGRlcGVuZGVuY3lQb29sID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKVxuY29uc3QgcmVzb3ZsZU1vZHVsZU5hbWUgPSByZXF1aXJlKCdyZXF1aXJlLXBhY2thZ2UtbmFtZScpXG5cbmV4cG9ydCBkZWZhdWx0IDxQbHVnaW4+IGZ1bmN0aW9uICh0aGlzOiBQbHVnaW5JbmplY3Rpb24pIHtcbiAgICBjb25zdCB1dGlscyA9IHRoaXMuZ2V0VXRpbHMoKVxuICAgIGNvbnN0IGNvbXBpbGVyID0gdGhpcy5nZXRDb21waWxlcigpXG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5nZXRTeXN0ZW1Db25maWcoKVxuICAgIGNvbnN0IHRlc3RTcmNEaXIgPSBuZXcgUmVnRXhwKGBeJHtjb25maWcuc3JjRGlyfWApXG4gICAgY29uc3QgdGVzdE5vZGVNb2R1bGVzID0gbmV3IFJlZ0V4cChgXiR7Y29uZmlnLnNvdXJjZU5vZGVNb2R1bGVzfWApXG5cbiAgICB0aGlzLm9uKCdiZWZvcmUtY29tcGlsZScsIGZ1bmN0aW9uIChjb21waWxhdGlvbjogQ29tcGlsYXRpb24sIGNiOiBGdW5jdGlvbikge1xuICAgICAgICBjb25zdCBmaWxlID0gY29tcGlsYXRpb24uZmlsZVxuICAgICAgICBjb25zdCBkZXZNb2RlID0gY29uZmlnLmFua2FDb25maWcuZGV2TW9kZVxuICAgICAgICBjb25zdCBsb2NhbERlcGVuZGVuY3lQb29sID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKVxuXG4gICAgICAgIC8vIE9ubHkgcmVzb2x2ZSBqcyBmaWxlLlxuICAgICAgICBpZiAoZmlsZS5leHRuYW1lID09PSAnLmpzJykge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coZmlsZS5zb3VyY2VGaWxlLCBmaWxlLmFzdCA/ICdvYmplY3QnIDogZmlsZS5hc3QpXG4gICAgICAgICAgICBpZiAoIWZpbGUuYXN0KSB7XG4gICAgICAgICAgICAgICAgZmlsZS5hc3QgPSA8dC5GaWxlPmJhYmVsLnBhcnNlKFxuICAgICAgICAgICAgICAgICAgICBmaWxlLmNvbnRlbnQgaW5zdGFuY2VvZiBCdWZmZXIgPyBmaWxlLmNvbnRlbnQudG9TdHJpbmcoKSA6IGZpbGUuY29udGVudCxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmFiZWxyYzogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VUeXBlOiAnbW9kdWxlJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cmF2ZXJzZSg8dC5Ob2RlPmZpbGUuYXN0LCB7XG4gICAgICAgICAgICAgICAgZW50ZXIgKHBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhdGguaXNJbXBvcnREZWNsYXJhdGlvbigpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBub2RlID0gcGF0aC5ub2RlXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzb3VyY2UgPSBub2RlLnNvdXJjZVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlLnZhbHVlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIHNvdXJjZS52YWx1ZSA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoc291cmNlLCBmaWxlLnNvdXJjZUZpbGUsIGZpbGUudGFyZ2V0RmlsZSwgbG9jYWxEZXBlbmRlbmN5UG9vbClcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXRoLmlzQ2FsbEV4cHJlc3Npb24oKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHBhdGgubm9kZVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2FsbGVlID0gPHQuSWRlbnRpZmllcj5ub2RlLmNhbGxlZVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYXJncyA9IDx0LlN0cmluZ0xpdGVyYWxbXT5ub2RlLmFyZ3VtZW50c1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJncyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxlZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3NbMF0gJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzWzBdLnZhbHVlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGVlLm5hbWUgPT09ICdyZXF1aXJlJyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiBhcmdzWzBdLnZhbHVlID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShhcmdzWzBdLCBmaWxlLnNvdXJjZUZpbGUsIGZpbGUudGFyZ2V0RmlsZSwgbG9jYWxEZXBlbmRlbmN5UG9vbClcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBmaWxlLmNvbnRlbnQgPSBjb2RlR2VuZXJhdG9yKGZpbGUuYXN0LCB7XG4gICAgICAgICAgICAgICAgY29tcGFjdDogIWRldk1vZGUsXG4gICAgICAgICAgICAgICAgbWluaWZpZWQ6ICFkZXZNb2RlXG4gICAgICAgICAgICB9KS5jb2RlXG5cbiAgICAgICAgICAgIGNvbnN0IGRlcGVuZGVuY3lMaXN0ID0gQXJyYXkuZnJvbShsb2NhbERlcGVuZGVuY3lQb29sLmtleXMoKSkuZmlsdGVyKGRlcGVuZGVuY3kgPT4gIWRlcGVuZGVuY3lQb29sLmhhcyhkZXBlbmRlbmN5KSlcblxuICAgICAgICAgICAgUHJvbWlzZS5hbGwoZGVwZW5kZW5jeUxpc3QubWFwKGRlcGVuZGVuY3kgPT4gdHJhdmVyc2VOcG1EZXBlbmRlbmN5KGRlcGVuZGVuY3kpKSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgY2IoKVxuICAgICAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBjYigpXG4gICAgICAgICAgICAgICAgdXRpbHMubG9nZ2VyLmVycm9yKGZpbGUuc291cmNlRmlsZSwgZXJyLm1lc3NhZ2UsIGVycilcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYigpXG4gICAgICAgIH1cbiAgICB9IGFzIFBsdWdpbkhhbmRsZXIpXG5cbiAgICBmdW5jdGlvbiByZXNvbHZlIChub2RlOiBhbnksIHNvdXJjZUZpbGU6IHN0cmluZywgdGFyZ2V0RmlsZTogc3RyaW5nLCBsb2NhbERlcGVuZGVuY3lQb29sOiBNYXA8c3RyaW5nLCBzdHJpbmc+KSB7XG4gICAgICAgIGNvbnN0IHNvdXJjZUJhc2VOYW1lID0gcGF0aC5kaXJuYW1lKHNvdXJjZUZpbGUpXG4gICAgICAgIGNvbnN0IHRhcmdldEJhc2VOYW1lID0gcGF0aC5kaXJuYW1lKHRhcmdldEZpbGUpXG4gICAgICAgIGNvbnN0IG1vZHVsZU5hbWUgPSByZXNvdmxlTW9kdWxlTmFtZShub2RlLnZhbHVlKVxuXG4gICAgICAgIGlmICh1dGlscy5pc05wbURlcGVuZGVuY3kobW9kdWxlTmFtZSkgfHwgdGVzdE5vZGVNb2R1bGVzLnRlc3Qoc291cmNlRmlsZSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGRlcGVuZGVuY3kgPSB1dGlscy5yZXNvbHZlTW9kdWxlKG5vZGUudmFsdWUsIHtcbiAgICAgICAgICAgICAgICBwYXRoczogW3NvdXJjZUJhc2VOYW1lXVxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgLy8gSW4gY2FzZSBgcmVxdWlyZSgnYScpYCwgYGFgIGlzIGxvY2FsIGZpbGUgaW4gc3JjIGRpcmVjdG9yeVxuICAgICAgICAgICAgaWYgKCFkZXBlbmRlbmN5IHx8IHRlc3RTcmNEaXIudGVzdChkZXBlbmRlbmN5KSkgcmV0dXJuXG5cbiAgICAgICAgICAgIGNvbnN0IGRpc3RQYXRoID0gZGVwZW5kZW5jeS5yZXBsYWNlKGNvbmZpZy5zb3VyY2VOb2RlTW9kdWxlcywgY29uZmlnLmRpc3ROb2RlTW9kdWxlcylcblxuICAgICAgICAgICAgbm9kZS52YWx1ZSA9IHBhdGgucmVsYXRpdmUodGFyZ2V0QmFzZU5hbWUsIGRpc3RQYXRoKVxuXG4gICAgICAgICAgICBpZiAobG9jYWxEZXBlbmRlbmN5UG9vbC5oYXMoZGVwZW5kZW5jeSkpIHJldHVyblxuICAgICAgICAgICAgbG9jYWxEZXBlbmRlbmN5UG9vbC5zZXQoZGVwZW5kZW5jeSwgZGVwZW5kZW5jeSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGZ1bmN0aW9uIHRyYXZlcnNlTnBtRGVwZW5kZW5jeSAoZGVwZW5kZW5jeTogc3RyaW5nKSB7XG4gICAgICAgIGRlcGVuZGVuY3lQb29sLnNldChkZXBlbmRlbmN5LCBkZXBlbmRlbmN5KVxuICAgICAgICBjb25zdCBmaWxlID0gYXdhaXQgdXRpbHMuY3JlYXRlRmlsZShkZXBlbmRlbmN5KVxuXG4gICAgICAgIGZpbGUudGFyZ2V0RmlsZSA9IGZpbGUuc291cmNlRmlsZS5yZXBsYWNlKGNvbmZpZy5zb3VyY2VOb2RlTW9kdWxlcywgY29uZmlnLmRpc3ROb2RlTW9kdWxlcylcbiAgICAgICAgYXdhaXQgY29tcGlsZXIuZ2VuZXJhdGVDb21waWxhdGlvbihmaWxlKS5ydW4oKVxuICAgIH1cbn1cbiIsIi8vIGltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBzYXNzUGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvc2Fzc1BhcnNlcidcbmltcG9ydCBmaWxlUGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvZmlsZVBhcnNlcidcbmltcG9ydCBzdHlsZVBhcnNlciBmcm9tICcuLi9wYXJzZXJzL3N0eWxlUGFyc2VyJ1xuaW1wb3J0IGJhYmVsUGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvYmFiZWxQYXJzZXInXG5pbXBvcnQgc2NyaXB0UGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvc2NyaXB0UGFyc2VyJ1xuaW1wb3J0IHRlbXBsYXRlUGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvdGVtcGxhdGVQYXJzZXInXG5pbXBvcnQgc2F2ZUZpbGVQbHVnaW4gZnJvbSAnLi4vcGx1Z2lucy9zYXZlRmlsZVBsdWdpbidcbmltcG9ydCB3eEltcG9ydFBsdWdpbiBmcm9tICcuLi9wbHVnaW5zL3d4SW1wb3J0UGx1Z2luJ1xuaW1wb3J0IHR5cGVzY3JpcHRQYXJzZXIgZnJvbSAnLi4vcGFyc2Vycy90eXBlc2NyaXB0UGFyc2VyJ1xuaW1wb3J0IGV4dHJhY3REZXBlbmRlbmN5UGx1Z2luIGZyb20gJy4uL3BsdWdpbnMvZXh0cmFjdERlcGVuZGVuY3lQbHVnaW4nXG5cbmltcG9ydCB7XG4gICAgSWdub3JlZENvbmZpZ3JhdGlvbixcbiAgICBQYXJzZXJzQ29uZmlncmF0aW9uLFxuICAgIFBsdWdpbnNDb25maWdyYXRpb25cbn0gZnJvbSAnLi4vLi4vdHlwZXMvdHlwZXMnXG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogICAgICAgICAgICAgICAgICAgRGFuZ2VyIHpvbmVcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuLyoqXG4gKiBUaGUgcGF0aCB3aGVyZSBXZUNoYXQgbWluaXByb2dyYW0gc291cmNlIGZpbGVzIGV4aXN0LlxuICogQGRlZmF1bHQgJy4vc3JjJ1xuICovXG5leHBvcnQgY29uc3Qgc291cmNlRGlyID0gJy4vc3JjJ1xuXG4vKipcbiAqIFRoZSBwYXRoIHdoZXJlIFdlQ2hhdCBtaW5pcHJvZ3JhbSBjb21waWxlZCBmaWxlcyBleGlzdC5cbiAqIEBkZWZhdWx0ICcuL2Rpc3QnXG4gKi9cbmV4cG9ydCBjb25zdCBvdXRwdXREaXIgPSAnLi9kaXN0J1xuXG4vKipcbiAqIFRoZSBwYXRoIHdoZXJlIFdlQ2hhdCBtaW5pcHJvZ3JhbSBwYWdlcyBleGlzdC5cbiAqIEBkZWZhdWx0ICcuL3NyYy9wYWdlcydcbiAqL1xuZXhwb3J0IGNvbnN0IHBhZ2VzID0gJy4vcGFnZXMnXG5cbi8qKlxuICogVGhlIHBhdGggd2hlcmUgV2VDaGF0IG1pbmlwcm9ncmFtIGNvbXBvbmVudHMgZXhpc3QuXG4gKiBAZGVmYXVsdCAnLi9zcmMvY29tcG9uZW50cydcbiAqL1xuZXhwb3J0IGNvbnN0IGNvbXBvbmVudHMgPSAnLi9jb21wb25lbnRzJ1xuXG4vKipcbiAqIFRlbXBsYXRlIGZvciBjcmVhdGluZyBwYWdlIGFuZCBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCBjb25zdCB0ZW1wbGF0ZSA9IHtcbiAgICBwYWdlOiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vdGVtcGxhdGUvcGFnZScpLFxuICAgIGNvbXBvbmVudDogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL3RlbXBsYXRlL2NvbXBvbmVudCcpXG59XG5cbi8qKlxuICogVGhlIHBhdGggd2hlcmUgV2VDaGF0IG1pbmlwcm9ncmFtIHN1YnBhY2thZ2VzIGV4aXN0LlxuICogQGRlZmF1bHQgJy4vc3JjL3N1YlBhY2thZ2VzJ1xuICovXG5leHBvcnQgY29uc3Qgc3ViUGFja2FnZXMgPSAnLi9zdWJQYWNrYWdlcydcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgICAgICAgICAgICAgICAgQ3VzdG9tIGNvbmZpZ3VyZVxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4vKipcbiAqIFdoZXRoZXIgdG8gb3V0cHV0IGNvbXBpbGUgaW5mb3JtYXRpb24uXG4gKiBAZGVmYXVsdCBmYWxzZVxuICovXG5leHBvcnQgY29uc3QgcXVpZXQgPSBmYWxzZVxuXG4vKipcbiAqIEFua2EgZGV2ZWxvcG1lbnQgbW9kZS5cbiAqIEBkZWZhdWx0IGZhbHNlXG4gKi9cbmV4cG9ydCBjb25zdCBkZXZNb2RlID0gZmFsc2VcblxuLyoqXG4gKiBSZWdpc3RlciBmaWxlIHBhcnNlci5cbiAqL1xuZXhwb3J0IGNvbnN0IHBhcnNlcnM6IFBhcnNlcnNDb25maWdyYXRpb24gPSBbXG4gICAge1xuICAgICAgICBtYXRjaDogLy4qXFwuKGpzfGVzKSQvLFxuICAgICAgICBwYXJzZXJzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGFyc2VyOiBiYWJlbFBhcnNlcixcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB7fVxuICAgICAgICAgICAgfVxuICAgICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG1hdGNoOiAvLipcXC4od3hzc3xjc3N8cG9zdGNzcykkLyxcbiAgICAgICAgcGFyc2VyczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcnNlcjogc3R5bGVQYXJzZXIsXG4gICAgICAgICAgICAgICAgb3B0aW9uczoge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgIH0sXG4gICAge1xuICAgICAgICBtYXRjaDogLy4qXFwuKHNhc3N8c2NzcykkLyxcbiAgICAgICAgcGFyc2VyczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcnNlcjogc2Fzc1BhcnNlcixcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB7fVxuICAgICAgICAgICAgfVxuICAgICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG1hdGNoOiAvLipcXC4odHN8dHlwZXNjcmlwdCkkLyxcbiAgICAgICAgcGFyc2VyczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcnNlcjogdHlwZXNjcmlwdFBhcnNlcixcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB7fVxuICAgICAgICAgICAgfVxuICAgICAgICBdXG4gICAgfVxuXVxuXG4vKipcbiAqIFdoZXRoZXIgdG8gb3V0cHV0IGRlYnVnIGluZm9ybWF0aW9uLlxuICogQGRlZmF1bHQgZmFsc2VcbiAqL1xuZXhwb3J0IGNvbnN0IGRlYnVnOiBib29sZWFuID0gZmFsc2VcblxuLyoqXG4gKiBSZWdpc3RlciBwbHVnaW4uXG4gKi9cbmV4cG9ydCBjb25zdCBwbHVnaW5zOiBQbHVnaW5zQ29uZmlncmF0aW9uID0gW1xuICAgIHtcbiAgICAgICAgcGx1Z2luOiBleHRyYWN0RGVwZW5kZW5jeVBsdWdpbixcbiAgICAgICAgb3B0aW9uczoge31cbiAgICB9LFxuICAgIHtcbiAgICAgICAgcGx1Z2luOiB3eEltcG9ydFBsdWdpbixcbiAgICAgICAgb3B0aW9uczoge31cbiAgICB9LFxuICAgIHtcbiAgICAgICAgcGx1Z2luOiBzYXZlRmlsZVBsdWdpbixcbiAgICAgICAgb3B0aW9uczoge31cbiAgICB9XG5dXG5cbi8qKlxuICogRmlsZXMgdGhhdCB3aWxsIGJlIGlnbm9yZWQgaW4gY29tcGlsYXRpb24uXG4gKi9cbmV4cG9ydCBjb25zdCBpZ25vcmVkOiBJZ25vcmVkQ29uZmlncmF0aW9uID0gW11cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgICAgICAgICAgICAgIGV4cGVyaW1lbnRhbCBjb25maWd1cmVcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuIiwiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IHJlc29sdmVDb25maWcgZnJvbSAnLi4vdXRpbHMvcmVzb2x2ZUNvbmZpZydcbmltcG9ydCAqIGFzIGFua2FEZWZhdWx0Q29uZmlnIGZyb20gJy4vYW5rYURlZmF1bHRDb25maWcnXG5cbmltcG9ydCB7XG4gICAgQW5rYUNvbmZpZ1xufSBmcm9tICcuLi8uLi90eXBlcy90eXBlcydcblxuY29uc3QgY3dkID0gcHJvY2Vzcy5jd2QoKVxuY29uc3QgY3VzdG9tQ29uZmlnID0gPEFua2FDb25maWc+cmVzb2x2ZUNvbmZpZyhbJ2Fua2EuY29uZmlnLmpzJywgJ2Fua2EuY29uZmlnLmpzb24nXSlcblxuZnVuY3Rpb24gbWVyZ2VBcnJheSA8VD4gKC4uLmFycnM6IEFycmF5PFRbXT4pOiBBcnJheTxUPiB7XG4gICAgcmV0dXJuIGFycnMuZmlsdGVyKGFyciA9PiBhcnIgJiYgYXJyLmxlbmd0aCkucmVkdWNlKChwcmV2LCBuZXh0KSA9PiB7XG4gICAgICAgIHJldHVybiBwcmV2LmNvbmNhdChuZXh0KVxuICAgIH0sIFtdKVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgLi4uYW5rYURlZmF1bHRDb25maWcsXG4gICAgLi4uY3VzdG9tQ29uZmlnLFxuICAgIHRlbXBsYXRlOiBjdXN0b21Db25maWcudGVtcGxhdGUgPyB7XG4gICAgICAgIHBhZ2U6IHBhdGguam9pbihjd2QsIGN1c3RvbUNvbmZpZy50ZW1wbGF0ZS5wYWdlKSxcbiAgICAgICAgY29tcG9uZW50OiBwYXRoLmpvaW4oY3dkLCBjdXN0b21Db25maWcudGVtcGxhdGUuY29tcG9uZW50KVxuICAgIH0gOiBhbmthRGVmYXVsdENvbmZpZy50ZW1wbGF0ZSxcbiAgICBwYXJzZXJzOiBtZXJnZUFycmF5KGN1c3RvbUNvbmZpZy5wYXJzZXJzLCBhbmthRGVmYXVsdENvbmZpZy5wYXJzZXJzKSxcbiAgICBwbHVnaW5zOiBtZXJnZUFycmF5KGN1c3RvbUNvbmZpZy5wbHVnaW5zLCBhbmthRGVmYXVsdENvbmZpZy5wbHVnaW5zKSxcbiAgICBpZ25vcmVkOiBtZXJnZUFycmF5KGN1c3RvbUNvbmZpZy5pZ25vcmVkLCBhbmthRGVmYXVsdENvbmZpZy5pZ25vcmVkKVxufVxuIiwiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IGFua2FDb25maWcgZnJvbSAnLi9hbmthQ29uZmlnJ1xuXG5leHBvcnQgY29uc3QgY3dkID0gcHJvY2Vzcy5jd2QoKVxuZXhwb3J0IGNvbnN0IHNyY0RpciA9IHBhdGgucmVzb2x2ZShjd2QsIGFua2FDb25maWcuc291cmNlRGlyKVxuZXhwb3J0IGNvbnN0IGRpc3REaXIgPSBwYXRoLnJlc29sdmUoY3dkLCBhbmthQ29uZmlnLm91dHB1dERpcilcbmV4cG9ydCBjb25zdCBhbmthTW9kdWxlcyA9IHBhdGgucmVzb2x2ZShzcmNEaXIsICdhbmthX21vZHVsZXMnKVxuZXhwb3J0IGNvbnN0IHNvdXJjZU5vZGVNb2R1bGVzID0gcGF0aC5yZXNvbHZlKGN3ZCwgJ25vZGVfbW9kdWxlcycpXG5leHBvcnQgY29uc3QgZGlzdE5vZGVNb2R1bGVzID0gcGF0aC5yZXNvbHZlKGRpc3REaXIsICducG1fbW9kdWxlcycpXG5leHBvcnQgY29uc3QgZGVmYXVsdFNjYWZmb2xkID0gICdpRXhjZXB0aW9uL2Fua2EtcXVpY2tzdGFydCdcbiIsImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJ1xuaW1wb3J0IGFua2FDb25maWcgZnJvbSAnLi9hbmthQ29uZmlnJ1xuaW1wb3J0ICogYXMgc3lzdGVtIGZyb20gJy4vc3lzdGVtQ29uZmlnJ1xuaW1wb3J0IHJlc29sdmVDb25maWcgZnJvbSAnLi4vdXRpbHMvcmVzb2x2ZUNvbmZpZydcblxuY29uc3QgY3VzdG9tQ29uZmlnID0gcmVzb2x2ZUNvbmZpZyhbJ2FwcC5qc29uJ10sIHN5c3RlbS5zcmNEaXIpXG5cbmV4cG9ydCBkZWZhdWx0IE9iamVjdC5hc3NpZ24oe1xuICAgIHBhZ2VzOiBbXSxcbiAgICBzdWJQYWNrYWdlczogW10sXG4gICAgd2luZG93OiB7XG4gICAgICAgIG5hdmlnYXRpb25CYXJUaXRsZVRleHQ6ICdXZWNoYXQnXG4gICAgfVxuICAgIC8vIHRhYkJhcjoge1xuICAgIC8vICAgICBsaXN0OiBbXVxuICAgIC8vIH0sXG59LCBjdXN0b21Db25maWcpXG4iLCJpbXBvcnQgKiBhcyBzeXN0ZW1Db25maWcgZnJvbSAnLi9zeXN0ZW1Db25maWcnXG5pbXBvcnQgYW5rYUNvbmZpZyBmcm9tICcuL2Fua2FDb25maWcnXG5pbXBvcnQgcHJvamVjdENvbmZpZyBmcm9tICcuL3Byb2plY3RDb25maWcnXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICAuLi5zeXN0ZW1Db25maWcsXG4gICAgYW5rYUNvbmZpZyxcbiAgICBwcm9qZWN0Q29uZmlnXG59XG4iLCJpbXBvcnQgKiBhcyBHbG9iIGZyb20gJ2dsb2InXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSdcbmNvbnN0IGdsb2IgPSByZXF1aXJlKCdnbG9iJylcblxuaW1wb3J0IHtcbiAgICBDb250ZW50XG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkRmlsZSAoc291cmNlRmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8QnVmZmVyPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgZnMucmVhZEZpbGUoc291cmNlRmlsZVBhdGgsIChlcnIsIGJ1ZmZlcikgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoYnVmZmVyKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZUZpbGUgKHRhcmdldEZpbGVQYXRoOiBzdHJpbmcsIGNvbnRlbnQ6IENvbnRlbnQpOiBQcm9taXNlPHVuZGVmaW5lZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGZzLndyaXRlRmlsZSh0YXJnZXRGaWxlUGF0aCwgY29udGVudCwgZXJyID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VhcmNoRmlsZXMgKHNjaGVtZTogc3RyaW5nLCBvcHRpb25zPzogR2xvYi5JT3B0aW9ucyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBnbG9iKHNjaGVtZSwgb3B0aW9ucywgKGVycjogKEVycm9yIHwgbnVsbCksIGZpbGVzOiBBcnJheTxzdHJpbmc+KTogdm9pZCA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShmaWxlcylcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9KVxufVxuIiwiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnXG5pbXBvcnQgY29uZmlnIGZyb20gJy4uLy4uL2NvbmZpZydcbmltcG9ydCAqIGFzIHQgZnJvbSAnQGJhYmVsL3R5cGVzJ1xuaW1wb3J0ICogYXMgUG9zdENTUyBmcm9tICdwb3N0Y3NzJ1xuaW1wb3J0IHtcbiAgICBDb250ZW50LFxuICAgIEZpbGVDb25zdHJ1Y3Rvck9wdGlvblxufSBmcm9tICcuLi8uLi8uLi90eXBlcy90eXBlcydcblxuY29uc3QgcmVwbGFjZUV4dCA9IHJlcXVpcmUoJ3JlcGxhY2UtZXh0JylcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRmlsZSB7XG4gICAgcHVibGljIHNvdXJjZUZpbGU6IHN0cmluZ1xuICAgIHB1YmxpYyBjb250ZW50OiBDb250ZW50XG4gICAgcHVibGljIHRhcmdldEZpbGU6IHN0cmluZ1xuICAgIHB1YmxpYyBhc3Q/OiB0Lk5vZGUgfCBQb3N0Q1NTLlJlc3VsdFxuICAgIHB1YmxpYyBzb3VyY2VNYXA/OiBDb250ZW50XG4gICAgcHVibGljIGlzSW5TcmNEaXI/OiBib29sZWFuXG5cbiAgICBjb25zdHJ1Y3RvciAob3B0aW9uOiBGaWxlQ29uc3RydWN0b3JPcHRpb24pIHtcbiAgICAgICAgY29uc3QgaXNJblNyY0RpclRlc3QgPSBuZXcgUmVnRXhwKGBeJHtjb25maWcuc3JjRGlyfWApXG5cbiAgICAgICAgaWYgKCFvcHRpb24uc291cmNlRmlsZSkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHZhbHVlOiBGaWxlQ29uc3RydWN0b3JPcHRpb24uc291cmNlRmlsZScpXG4gICAgICAgIGlmICghb3B0aW9uLmNvbnRlbnQpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCB2YWx1ZTogRmlsZUNvbnN0cnVjdG9yT3B0aW9uLmNvbnRlbnQnKVxuXG4gICAgICAgIHRoaXMuc291cmNlRmlsZSA9IG9wdGlvbi5zb3VyY2VGaWxlXG4gICAgICAgIHRoaXMudGFyZ2V0RmlsZSA9IG9wdGlvbi50YXJnZXRGaWxlIHx8IG9wdGlvbi5zb3VyY2VGaWxlLnJlcGxhY2UoY29uZmlnLnNyY0RpciwgY29uZmlnLmRpc3REaXIpIC8vIERlZmF1bHQgdmFsdWVcbiAgICAgICAgdGhpcy5jb250ZW50ID0gb3B0aW9uLmNvbnRlbnRcbiAgICAgICAgdGhpcy5zb3VyY2VNYXAgPSBvcHRpb24uc291cmNlTWFwXG4gICAgICAgIHRoaXMuaXNJblNyY0RpciA9IGlzSW5TcmNEaXJUZXN0LnRlc3QodGhpcy5zb3VyY2VGaWxlKVxuICAgIH1cblxuICAgIGdldCBkaXJuYW1lICgpIHtcbiAgICAgICAgcmV0dXJuIHBhdGguZGlybmFtZSh0aGlzLnRhcmdldEZpbGUpXG4gICAgfVxuXG4gICAgZ2V0IGJhc2VuYW1lICgpIHtcbiAgICAgICAgcmV0dXJuIHBhdGguYmFzZW5hbWUodGhpcy50YXJnZXRGaWxlKVxuICAgIH1cblxuICAgIGdldCBleHRuYW1lICgpIHtcbiAgICAgICAgcmV0dXJuIHBhdGguZXh0bmFtZSh0aGlzLnRhcmdldEZpbGUpXG4gICAgfVxuXG4gICAgYXN5bmMgc2F2ZVRvIChwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgYXdhaXQgZnMuZW5zdXJlRmlsZShwYXRoKVxuXG4gICAgICAgIGlmICghcGF0aCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHBhdGgnKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlRXh0IChleHQ6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICB0aGlzLnRhcmdldEZpbGUgPSByZXBsYWNlRXh0KHRoaXMudGFyZ2V0RmlsZSwgZXh0KVxuICAgIH1cblxuICAgIGNvbnZlcnRDb250ZW50VG9TdHJpbmcgKCkge1xuICAgICAgICBpZiAodGhpcy5jb250ZW50IGluc3RhbmNlb2YgQnVmZmVyKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRlbnQgPSB0aGlzLmNvbnRlbnQudG9TdHJpbmcoKVxuICAgICAgICB9XG4gICAgfVxufVxuIiwiaW1wb3J0IHtcbiAgICByZWFkRmlsZVxufSBmcm9tICcuL2ZzJ1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnXG5pbXBvcnQgRmlsZSBmcm9tICcuLi9jb3JlL2NsYXNzL0ZpbGUnXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVGaWxlIChzb3VyY2VGaWxlOiBzdHJpbmcpOiBQcm9taXNlPEZpbGU+IHtcbiAgICByZXR1cm4gcmVhZEZpbGUoc291cmNlRmlsZSkudGhlbihjb250ZW50ID0+IHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgRmlsZSh7XG4gICAgICAgICAgICBzb3VyY2VGaWxlLFxuICAgICAgICAgICAgY29udGVudFxuICAgICAgICB9KSlcbiAgICB9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRmlsZVN5bmMgKHNvdXJjZUZpbGU6IHN0cmluZykge1xuICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoc291cmNlRmlsZSlcbiAgICByZXR1cm4gbmV3IEZpbGUoe1xuICAgICAgICBzb3VyY2VGaWxlLFxuICAgICAgICBjb250ZW50XG4gICAgfSlcbn1cbiIsImltcG9ydCB7IE9wdGlvbnMgYXMgVGVtcGxhdGVPcHRpb25zIH0gZnJvbSAnZWpzJ1xuaW1wb3J0IHsgbWVtRnNFZGl0b3IgYXMgTWVtRnNFZGl0b3IgfSBmcm9tICdtZW0tZnMtZWRpdG9yJ1xuXG5jb25zdCBtZW1GcyA9IHJlcXVpcmUoJ21lbS1mcycpXG5jb25zdCBtZW1Gc0VkaXRvciA9IHJlcXVpcmUoJ21lbS1mcy1lZGl0b3InKVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGc0VkaXRvciB7XG4gICAgZWRpdG9yOiBNZW1Gc0VkaXRvci5FZGl0b3JcblxuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgY29uc3Qgc3RvcmUgPSBtZW1Gcy5jcmVhdGUoKVxuXG4gICAgICAgIHRoaXMuZWRpdG9yID0gbWVtRnNFZGl0b3IuY3JlYXRlKHN0b3JlKVxuICAgIH1cblxuICAgIGNvcHkgKGZyb206IHN0cmluZywgdG86IHN0cmluZywgY29udGV4dDogb2JqZWN0LCB0ZW1wbGF0ZU9wdGlvbnM/OiBUZW1wbGF0ZU9wdGlvbnMsIGNvcHlPcHRpb25zPzogTWVtRnNFZGl0b3IuQ29weU9wdGlvbnMpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5lZGl0b3IuY29weVRwbChmcm9tLCB0bywgY29udGV4dCwgdGVtcGxhdGVPcHRpb25zLCBjb3B5T3B0aW9ucylcbiAgICB9XG5cbiAgICB3cml0ZSAoZmlsZXBhdGg6IHN0cmluZywgY29udGVudHM6IE1lbUZzRWRpdG9yLkNvbnRlbnRzKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZWRpdG9yLndyaXRlKGZpbGVwYXRoLCBjb250ZW50cylcbiAgICB9XG5cbiAgICB3cml0ZUpTT04gKGZpbGVwYXRoOiBzdHJpbmcsIGNvbnRlbnRzOiBhbnksIHJlcGxhY2VyPzogTWVtRnNFZGl0b3IuUmVwbGFjZXJGdW5jLCBzcGFjZT86IE1lbUZzRWRpdG9yLlNwYWNlKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZWRpdG9yLndyaXRlSlNPTihmaWxlcGF0aCwgY29udGVudHMsIHJlcGxhY2VyIHx8IG51bGwsIHNwYWNlID0gNClcbiAgICB9XG5cbiAgICByZWFkIChmaWxlcGF0aDogc3RyaW5nLCBvcHRpb25zPzogeyByYXc6IGJvb2xlYW4sIGRlZmF1bHRzOiBzdHJpbmcgfSk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLmVkaXRvci5yZWFkKGZpbGVwYXRoLCBvcHRpb25zKVxuICAgIH1cblxuICAgIHJlYWRKU09OIChmaWxlcGF0aDogc3RyaW5nLCBkZWZhdWx0cz86IGFueSk6IHZvaWQge1xuICAgICAgICB0aGlzLmVkaXRvci5yZWFkSlNPTihmaWxlcGF0aCwgZGVmYXVsdHMpXG4gICAgfVxuXG4gICAgc2F2ZSAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgdGhpcy5lZGl0b3IuY29tbWl0KHJlc29sdmUpXG4gICAgICAgIH0pXG4gICAgfVxufVxuIiwiaW1wb3J0IGxvZyBmcm9tICcuL2xvZ2dlcidcbmltcG9ydCBhbmthQ29uZmlnIGZyb20gJy4uL2NvbmZpZy9hbmthQ29uZmlnJ1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAoaWQ6IHN0cmluZywgb3B0aW9ucz86IHsgcGF0aHM/OiBzdHJpbmdbXSB9KTogc3RyaW5nIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gcmVxdWlyZS5yZXNvbHZlKGlkLCBvcHRpb25zKVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBsb2cuZXJyb3IoJ01pc3NpbmcgZGVwZW5kZW5jeScsIGlkLCAhYW5rYUNvbmZpZy5xdWlldCA/IGBpbiAke29wdGlvbnMucGF0aHN9YCA6IG51bGwpXG4gICAgfVxufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY2FsbFByb21pc2VJbkNoYWluIChsaXN0OiBBcnJheTwoLi4ucGFyYW1zOiBhbnlbXSkgPT4gUHJvbWlzZTxhbnk+PiA9IFtdLCAuLi5wYXJhbXM6IEFycmF5PGFueT4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBpZiAoIWxpc3QubGVuZ3RoKSAge1xuICAgICAgICAgICAgcmVzb2x2ZSgpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBsZXQgc3RlcCA9IGxpc3RbMF0oLi4ucGFyYW1zKVxuXG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgc3RlcCA9IHN0ZXAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxpc3RbaV0oLi4ucGFyYW1zKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIHN0ZXAudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgcmVzb2x2ZSgpXG4gICAgICAgIH0sIGVyciA9PiB7XG4gICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICB9KVxuICAgIH0pXG59XG4iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAoZm46IEZ1bmN0aW9uKTogKCkgPT4gUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICguLi5wYXJhbXM6IEFycmF5PGFueT4pIHtcbiAgICAgICAgY29uc3QgbGltaXRhdGlvbiA9IHBhcmFtcy5sZW5ndGhcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICBpZiAoZm4ubGVuZ3RoID4gbGltaXRhdGlvbikge1xuICAgICAgICAgICAgICAgIGZuKC4uLnBhcmFtcywgcmVzb2x2ZSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShmbiguLi5wYXJhbXMpKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cbn1cbiIsImltcG9ydCAqIGFzIGNob2tpZGFyIGZyb20gJ2Nob2tpZGFyJ1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAoZGlyOiBzdHJpbmcgfCBzdHJpbmdbXSwgb3B0aW9ucz86IGNob2tpZGFyLldhdGNoT3B0aW9ucyk6IGNob2tpZGFyLkZTV2F0Y2hlciB7XG4gICAgcmV0dXJuIGNob2tpZGFyLndhdGNoKGRpciwge1xuICAgICAgICBwZXJzaXN0ZW50OiB0cnVlLFxuICAgICAgICBpZ25vcmVJbml0aWFsOiB0cnVlLFxuICAgICAgICAuLi5vcHRpb25zXG4gICAgfSlcbn1cbiIsImRlY2xhcmUgdHlwZSBWYWxpZGF0ZU5wbVBhY2thZ2VOYW1lID0ge1xuICAgIHZhbGlkRm9yTmV3UGFja2FnZXM6IGJvb2xlYW4sXG4gICAgdmFsaWRGb3JPbGRQYWNrYWdlczogYm9vbGVhblxufVxuXG5jb25zdCB2YWxpZGF0ZSA9IHJlcXVpcmUoJ3ZhbGlkYXRlLW5wbS1wYWNrYWdlLW5hbWUnKVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAocmVxdWlyZWQ6IHN0cmluZyA9ICcnKTogYm9vbGVhbiB7XG4gICAgY29uc3QgcmVzdWx0ID0gPFZhbGlkYXRlTnBtUGFja2FnZU5hbWU+dmFsaWRhdGUocmVxdWlyZWQpXG5cbiAgICByZXR1cm4gcmVzdWx0LnZhbGlkRm9yTmV3UGFja2FnZXMgfHwgcmVzdWx0LnZhbGlkRm9yT2xkUGFja2FnZXNcbn1cbiIsImltcG9ydCBkb3dubG9hZFJlcG8gZnJvbSAnZG93bmxvYWQtZ2l0LXJlcG8nXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChyZXBvOiBzdHJpbmcsIHBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGRvd25sb2FkUmVwbyhyZXBvLCBwYXRoLCB7IGNsb25lOiBmYWxzZSB9LCAoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgZXJyID8gcmVqZWN0KGVycikgOiByZXNvbHZlKClcbiAgICAgICAgfSlcbiAgICB9KVxufVxuIiwiaW1wb3J0IENvbXBpbGVyIGZyb20gJy4vQ29tcGlsZXInXG5pbXBvcnQgY29uZmlnIGZyb20gJy4uLy4uL2NvbmZpZydcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uLy4uL3V0aWxzJ1xuXG5pbXBvcnQge1xuICAgIFV0aWxzLFxuICAgIEFua2FDb25maWcsXG4gICAgUGFyc2VyT3B0aW9ucyxcbiAgICBQcm9qZWN0Q29uZmlnLFxuICAgIFBsdWdpbkhhbmRsZXIsXG4gICAgUGx1Z2luT3B0aW9ucyxcbiAgICBDb21waWxlckNvbmZpZ1xufSBmcm9tICcuLi8uLi8uLi90eXBlcy90eXBlcydcblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEluamVjdGlvbiB7XG4gICAgY29tcGlsZXI6IENvbXBpbGVyXG4gICAgb3B0aW9uczogb2JqZWN0XG5cbiAgICBjb25zdHJ1Y3RvciAoY29tcGlsZXI6IENvbXBpbGVyLCBvcHRpb25zPzogb2JqZWN0KSB7XG4gICAgICAgIHRoaXMuY29tcGlsZXIgPSBjb21waWxlclxuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zXG4gICAgfVxuXG4gICAgYWJzdHJhY3QgZ2V0T3B0aW9ucyAoKTogb2JqZWN0XG5cbiAgICBnZXRDb21waWxlciAoKTogQ29tcGlsZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5jb21waWxlclxuICAgIH1cblxuICAgIGdldFV0aWxzICgpIHtcbiAgICAgICAgcmV0dXJuIHV0aWxzXG4gICAgfVxuXG4gICAgZ2V0QW5rYUNvbmZpZyAoKTogQW5rYUNvbmZpZyB7XG4gICAgICAgIHJldHVybiBjb25maWcuYW5rYUNvbmZpZ1xuICAgIH1cblxuICAgIGdldFN5c3RlbUNvbmZpZyAoKTogQ29tcGlsZXJDb25maWcge1xuICAgICAgICByZXR1cm4gY29uZmlnXG4gICAgfVxuXG4gICAgZ2V0UHJvamVjdENvbmZpZyAoKTogUHJvamVjdENvbmZpZyB7XG4gICAgICAgIHJldHVybiBjb25maWcucHJvamVjdENvbmZpZ1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFBsdWdpbkluamVjdGlvbiBleHRlbmRzIEluamVjdGlvbiB7XG5cbiAgICBjb25zdHJ1Y3RvciAoY29tcGlsZXI6IENvbXBpbGVyLCBvcHRpb25zOiBQbHVnaW5PcHRpb25zWydvcHRpb25zJ10pIHtcbiAgICAgICAgc3VwZXIoY29tcGlsZXIsIG9wdGlvbnMpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIFBsdWdpbiBvcHRpb25zXG4gICAgICovXG4gICAgZ2V0T3B0aW9ucyAoKTogb2JqZWN0IHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucyB8fCB7fVxuICAgIH1cblxuICAgIG9uIChldmVudDogc3RyaW5nLCBoYW5kbGVyOiBQbHVnaW5IYW5kbGVyKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY29tcGlsZXIub24oZXZlbnQsIGhhbmRsZXIpXG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgUGFyc2VySW5qZWN0aW9uIGV4dGVuZHMgSW5qZWN0aW9uIHtcblxuICAgIC8qKlxuICAgICAqIFJldHVybiBQYXJzZXJPcHRpb25zXG4gICAgICovXG4gICAgZ2V0T3B0aW9ucyAoKTogb2JqZWN0IHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucyB8fCB7fVxuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yIChjb21waWxlcjogQ29tcGlsZXIsIG9wdGlvbnM6IFBhcnNlck9wdGlvbnNbJ29wdGlvbnMnXSkge1xuICAgICAgICBzdXBlcihjb21waWxlciwgb3B0aW9ucylcbiAgICB9XG59XG4iLCJpbXBvcnQgRmlsZSBmcm9tICcuL0ZpbGUnXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgY29uZmlnIGZyb20gJy4uLy4uL2NvbmZpZydcbmltcG9ydCBDb21waWxlciBmcm9tICcuL0NvbXBpbGVyJ1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vLi4vdXRpbHMnXG5cbmltcG9ydCB7XG4gICAgUGFyc2VyLFxuICAgIE1hdGNoZXIsXG4gICAgUGx1Z2luSGFuZGxlcixcbiAgICBQbHVnaW5PcHRpb25zLFxuICAgIENvbXBpbGVyQ29uZmlnXG59IGZyb20gJy4uLy4uLy4uL3R5cGVzL3R5cGVzJ1xuaW1wb3J0IG1lc3NhZ2VyIGZyb20gJy4uLy4uL3V0aWxzL21lc3NhZ2VyJ1xuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi4vLi4vdXRpbHMnXG5cbi8qKlxuICogQSBjb21waWxhdGlvbiB0YXNrXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbXBpbGF0aW9uIHtcbiAgICBjb25maWc6IENvbXBpbGVyQ29uZmlnXG4gICAgcmVhZG9ubHkgY29tcGlsZXI6IENvbXBpbGVyXG4gICAgaWQ6IG51bWJlciAgICAgICAgLy8gVW5pcXVl77yMZm9yIGVhY2ggQ29tcGlsYXRpb25cbiAgICBmaWxlOiBGaWxlXG4gICAgc291cmNlRmlsZTogc3RyaW5nXG4gICAgZGVzdHJveWVkOiBib29sZWFuXG5cbiAgICBjb25zdHJ1Y3RvciAoZmlsZTogRmlsZSB8IHN0cmluZywgY29uZjogQ29tcGlsZXJDb25maWcsIGNvbXBpbGVyOiBDb21waWxlcikge1xuICAgICAgICB0aGlzLmNvbXBpbGVyID0gY29tcGlsZXJcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25mXG4gICAgICAgIHRoaXMuaWQgPSBDb21waWxlci5jb21waWxhdGlvbklkKytcblxuICAgICAgICBpZiAoZmlsZSBpbnN0YW5jZW9mIEZpbGUpIHtcbiAgICAgICAgICAgIHRoaXMuZmlsZSA9IGZpbGVcbiAgICAgICAgICAgIHRoaXMuc291cmNlRmlsZSA9IGZpbGUuc291cmNlRmlsZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zb3VyY2VGaWxlID0gZmlsZVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5lbnJvbGwoKVxuICAgIH1cblxuICAgIGFzeW5jIHJ1biAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmxvYWRGaWxlKClcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuaW52b2tlUGFyc2VycygpXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGUoKVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB1dGlscy5sb2dnZXIuZXJyb3IoJ0NvbXBpbGUnLCBlLm1lc3NhZ2UsIGUpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBsb2FkRmlsZSAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICh0aGlzLmRlc3Ryb3llZCkgcmV0dXJuXG5cbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlci5lbWl0KCdiZWZvcmUtbG9hZC1maWxlJywgdGhpcylcbiAgICAgICAgaWYgKCEodGhpcy5maWxlIGluc3RhbmNlb2YgRmlsZSkpIHtcbiAgICAgICAgICAgIHRoaXMuZmlsZSA9IGF3YWl0IHV0aWxzLmNyZWF0ZUZpbGUodGhpcy5zb3VyY2VGaWxlKVxuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlci5lbWl0KCdhZnRlci1sb2FkLWZpbGUnLCB0aGlzKVxuICAgIH1cblxuICAgIGFzeW5jIGludm9rZVBhcnNlcnMgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBpZiAodGhpcy5kZXN0cm95ZWQpIHJldHVyblxuXG4gICAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLmZpbGVcbiAgICAgICAgY29uc3QgcGFyc2VycyA9IDxQYXJzZXJbXT50aGlzLmNvbXBpbGVyLnBhcnNlcnMuZmlsdGVyKChtYXRjaGVyczogTWF0Y2hlcikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoZXJzLm1hdGNoLnRlc3QoZmlsZS5zb3VyY2VGaWxlKVxuICAgICAgICB9KS5tYXAoKG1hdGNoZXJzOiBNYXRjaGVyKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hlcnMucGFyc2Vyc1xuICAgICAgICB9KS5yZWR1Y2UoKHByZXYsIG5leHQpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBwcmV2LmNvbmNhdChuZXh0KVxuICAgICAgICB9LCBbXSlcbiAgICAgICAgY29uc3QgdGFza3MgPSBwYXJzZXJzLm1hcChwYXJzZXIgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHV0aWxzLmFzeW5jRnVuY3Rpb25XcmFwcGVyKHBhcnNlcilcbiAgICAgICAgfSlcblxuICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGVyLmVtaXQoJ2JlZm9yZS1wYXJzZScsIHRoaXMpXG4gICAgICAgIGF3YWl0IHV0aWxzLmNhbGxQcm9taXNlSW5DaGFpbih0YXNrcywgZmlsZSwgdGhpcylcbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlci5lbWl0KCdhZnRlci1wYXJzZScsIHRoaXMpXG4gICAgfVxuXG4gICAgYXN5bmMgY29tcGlsZSAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICh0aGlzLmRlc3Ryb3llZCkgcmV0dXJuXG5cbiAgICAgICAgLy8gSW52b2tlIEV4dHJhY3REZXBlbmRlbmN5UGx1Z2luLlxuICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGVyLmVtaXQoJ2JlZm9yZS1jb21waWxlJywgdGhpcylcbiAgICAgICAgLy8gRG8gc29tZXRoaW5nIGVsc2UuXG4gICAgICAgIGF3YWl0IHRoaXMuY29tcGlsZXIuZW1pdCgnYWZ0ZXItY29tcGlsZScsIHRoaXMpXG4gICAgICAgIGF3YWl0IHRoaXMuY29tcGlsZXIuZW1pdCgnc2F2ZScsIHRoaXMpXG4gICAgICAgIGNvbmZpZy5hbmthQ29uZmlnLmRlYnVnICYmIHV0aWxzLmxvZ2dlci5pbmZvKCdDb21waWxlJywgdGhpcy5maWxlLnNvdXJjZUZpbGUucmVwbGFjZShgJHtjb25maWcuY3dkfSR7cGF0aC5zZXB9YCwgJycpKVxuICAgICAgICB0aGlzLmRlc3Ryb3koKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVyIG9uIENvbXBpbGVyIGFuZCBkZXN0cm95IHRoZSBwcmV2aW91cyBvbmUgaWYgY29uZmxpY3QgYXJpc2VzLlxuICAgICAqL1xuICAgIGVucm9sbCAoKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IG9sZENvbXBpbGF0aW9uID0gQ29tcGlsZXIuY29tcGlsYXRpb25Qb29sLmdldCh0aGlzLnNvdXJjZUZpbGUpXG5cbiAgICAgICAgaWYgKG9sZENvbXBpbGF0aW9uKSB7XG4gICAgICAgICAgICBpZiAoY29uZmlnLmFua2FDb25maWcuZGVidWcpIGNvbnNvbGUubG9nKCdcYkRlc3Ryb3kgQ29tcGlsYXRpb24nLCBvbGRDb21waWxhdGlvbi5pZCwgb2xkQ29tcGlsYXRpb24uc291cmNlRmlsZSlcblxuICAgICAgICAgICAgb2xkQ29tcGlsYXRpb24uZGVzdHJveSgpXG4gICAgICAgIH1cbiAgICAgICAgQ29tcGlsZXIuY29tcGlsYXRpb25Qb29sLnNldCh0aGlzLnNvdXJjZUZpbGUsIHRoaXMpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVW5yZWdpc3RlciB0aGVtc2VsdmVzIGZyb20gQ29tcGlsZXIuXG4gICAgICovXG4gICAgZGVzdHJveSAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZGVzdHJveWVkID0gdHJ1ZVxuICAgICAgICBDb21waWxlci5jb21waWxhdGlvblBvb2wuZGVsZXRlKHRoaXMuc291cmNlRmlsZSlcbiAgICB9XG59XG4iLCJpbXBvcnQge1xuICAgIFBhcnNlckluamVjdGlvbixcbiAgICBQbHVnaW5JbmplY3Rpb25cbn0gZnJvbSAnLi9JbmplY3Rpb24nXG5pbXBvcnQgRmlsZSBmcm9tICcuL0ZpbGUnXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSdcbmltcG9ydCBjb25maWcgZnJvbSAnLi4vLi4vY29uZmlnJ1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vLi4vdXRpbHMnXG5pbXBvcnQgQ29tcGlsYXRpb24gZnJvbSAnLi9Db21waWxhdGlvbidcbmltcG9ydCBtZXNzYWdlciBmcm9tICcuLi8uLi91dGlscy9tZXNzYWdlcidcbmltcG9ydCBjYWxsUHJvbWlzZUluQ2hhaW4gZnJvbSAnLi4vLi4vdXRpbHMvY2FsbFByb21pc2VJbkNoYWluJ1xuaW1wb3J0IGFzeW5jRnVuY3Rpb25XcmFwcGVyIGZyb20gJy4uLy4uL3V0aWxzL2FzeW5jRnVuY3Rpb25XcmFwcGVyJ1xuXG5pbXBvcnQge1xuICAgIFBhcnNlcixcbiAgICBQYXJzZXJPcHRpb25zLFxuICAgIFBsdWdpbkhhbmRsZXIsXG4gICAgUGx1Z2luT3B0aW9ucyxcbiAgICBDb21waWxlckNvbmZpZ1xufSBmcm9tICcuLi8uLi8uLi90eXBlcy90eXBlcydcblxuY29uc3QgeyBsb2dnZXIgfSA9IHV0aWxzXG5jb25zdCBkZWwgPSByZXF1aXJlKCdkZWwnKVxuXG4vKipcbiAqIFRoZSBjb3JlIGNvbXBpbGVyLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb21waWxlciB7XG4gICAgcmVhZG9ubHkgY29uZmlnOiBDb21waWxlckNvbmZpZ1xuICAgIHB1YmxpYyBzdGF0aWMgY29tcGlsYXRpb25JZCA9IDFcbiAgICBwdWJsaWMgc3RhdGljIGNvbXBpbGF0aW9uUG9vbCA9IG5ldyBNYXA8c3RyaW5nLCBDb21waWxhdGlvbj4oKVxuICAgIHBsdWdpbnM6IHtcbiAgICAgICAgW2V2ZW50TmFtZTogc3RyaW5nXTogQXJyYXk8UGx1Z2luSGFuZGxlcj5cbiAgICB9ID0ge1xuICAgICAgICAnYmVmb3JlLWxvYWQtZmlsZSc6IFtdLFxuICAgICAgICAnYWZ0ZXItbG9hZC1maWxlJzogW10sXG4gICAgICAgICdiZWZvcmUtcGFyc2UnOiBbXSxcbiAgICAgICAgJ2FmdGVyLXBhcnNlJzogW10sXG4gICAgICAgICdiZWZvcmUtY29tcGlsZSc6IFtdLFxuICAgICAgICAnYWZ0ZXItY29tcGlsZSc6IFtdLFxuICAgICAgICAnc2F2ZSc6IFtdXG4gICAgfVxuICAgIHBhcnNlcnM6IEFycmF5PHtcbiAgICAgICAgbWF0Y2g6IFJlZ0V4cCxcbiAgICAgICAgcGFyc2VyczogQXJyYXk8UGFyc2VyPlxuICAgIH0+ID0gW11cblxuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWdcbiAgICAgICAgdGhpcy5pbml0UGFyc2VycygpXG4gICAgICAgIHRoaXMuaW5pdFBsdWdpbnMoKVxuXG4gICAgICAgIGlmIChjb25maWcuYW5rYUNvbmZpZy5kZWJ1Zykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkodGhpcy5jb25maWcsIChrZXksIHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRnVuY3Rpb24pIHJldHVybiAnW0Z1bmN0aW9uXSdcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWVcbiAgICAgICAgICAgIH0sIDQpKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXIgUGx1Z2luLlxuICAgICAqIEBwYXJhbSBldmVudFxuICAgICAqIEBwYXJhbSBoYW5kbGVyXG4gICAgICovXG4gICAgb24gKGV2ZW50OiBzdHJpbmcsIGhhbmRsZXI6IFBsdWdpbkhhbmRsZXIpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMucGx1Z2luc1tldmVudF0gPT09IHZvaWQgKDApKSB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gaG9vazogJHtldmVudH1gKVxuICAgICAgICB0aGlzLnBsdWdpbnNbZXZlbnRdLnB1c2goaGFuZGxlcilcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbnZva2UgbGlmZWN5Y2xlIGhvb2tzKFByb21pc2UgY2hhaW5pbmcpLlxuICAgICAqIEBwYXJhbSBldmVudFxuICAgICAqIEBwYXJhbSBjb21waWxhdGlvblxuICAgICAqL1xuICAgIGFzeW5jIGVtaXQgKGV2ZW50OiBzdHJpbmcsIGNvbXBpbGF0aW9uOiBDb21waWxhdGlvbik6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGlmIChjb21waWxhdGlvbi5kZXN0cm95ZWQpIHJldHVyblxuXG4gICAgICAgIGNvbnN0IHBsdWdpbnMgPSB0aGlzLnBsdWdpbnNbZXZlbnRdXG5cbiAgICAgICAgaWYgKCFwbHVnaW5zIHx8ICFwbHVnaW5zLmxlbmd0aCkgcmV0dXJuXG5cbiAgICAgICAgY29uc3QgdGFza3MgPSBwbHVnaW5zLm1hcChwbHVnaW4gPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGFzeW5jRnVuY3Rpb25XcmFwcGVyKHBsdWdpbilcbiAgICAgICAgfSlcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgY2FsbFByb21pc2VJbkNoYWluKHRhc2tzLCBjb21waWxhdGlvbilcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdXRpbHMubG9nZ2VyLmVycm9yKCdDb21waWxlJywgZS5tZXNzYWdlLCBlKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2xlYW4gZGlzdCBkaXJlY3RvcnkuXG4gICAgICovXG4gICAgYXN5bmMgY2xlYW4gKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCBkZWwoW1xuICAgICAgICAgICAgcGF0aC5qb2luKGNvbmZpZy5kaXN0RGlyLCAnKiovKicpLFxuICAgICAgICAgICAgYCEke3BhdGguam9pbihjb25maWcuZGlzdERpciwgJ2FwcC5qcycpfWAsXG4gICAgICAgICAgICBgISR7cGF0aC5qb2luKGNvbmZpZy5kaXN0RGlyLCAnYXBwLmpzb24nKX1gLFxuICAgICAgICAgICAgYCEke3BhdGguam9pbihjb25maWcuZGlzdERpciwgJ3Byb2plY3QuY29uZmlnLmpzb24nKX1gXG4gICAgICAgIF0pXG4gICAgICAgIGxvZ2dlci5zdWNjZXNzKCdDbGVhbiB3b3Jrc2hvcCcsIGNvbmZpZy5kaXN0RGlyKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV2ZXJ5dGhpbmcgc3RhcnQgZnJvbSBoZXJlLlxuICAgICAqL1xuICAgIGFzeW5jIGxhdW5jaCAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgY29uc3Qgc3RhcnR1cFRpbWUgPSBEYXRlLm5vdygpXG5cbiAgICAgICAgbG9nZ2VyLmluZm8oJ0xhdW5jaGluZy4uLicpXG5cbiAgICAgICAgY29uc3QgZmlsZVBhdGhzOiBzdHJpbmdbXSA9IGF3YWl0IHV0aWxzLnNlYXJjaEZpbGVzKGAqKi8qYCwge1xuICAgICAgICAgICAgY3dkOiBjb25maWcuc3JjRGlyLFxuICAgICAgICAgICAgbm9kaXI6IHRydWUsXG4gICAgICAgICAgICBzaWxlbnQ6IGZhbHNlLFxuICAgICAgICAgICAgYWJzb2x1dGU6IHRydWUsXG4gICAgICAgICAgICBpZ25vcmU6IGNvbmZpZy5hbmthQ29uZmlnLmlnbm9yZWRcbiAgICAgICAgfSlcbiAgICAgICAgY29uc3QgZmlsZXMgPSBhd2FpdCBQcm9taXNlLmFsbChmaWxlUGF0aHMubWFwKGZpbGUgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHV0aWxzLmNyZWF0ZUZpbGUoZmlsZSlcbiAgICAgICAgfSkpXG4gICAgICAgIGNvbnN0IGNvbXBpbGF0aW9ucyA9IGZpbGVzLm1hcChmaWxlID0+IHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ29tcGlsYXRpb24oZmlsZSwgdGhpcy5jb25maWcsIHRoaXMpXG4gICAgICAgIH0pXG5cbiAgICAgICAgZnMuZW5zdXJlRGlyU3luYyhjb25maWcuZGlzdE5vZGVNb2R1bGVzKVxuXG4gICAgICAgIC8vIGF3YWl0IFByb21pc2UuYWxsKGNvbXBpbGF0aW9ucy5tYXAoY29tcGlsYXRpb24gPT4gY29tcGlsYXRpb24ubG9hZEZpbGUoKSkpXG4gICAgICAgIC8vIGF3YWl0IFByb21pc2UuYWxsKGNvbXBpbGF0aW9ucy5tYXAoY29tcGlsYXRpb24gPT4gY29tcGlsYXRpb24uaW52b2tlUGFyc2VycygpKSlcblxuICAgICAgICAvLyBUT0RPOiBHZXQgYWxsIGZpbGVzXG4gICAgICAgIC8vIENvbXBpbGVyLmNvbXBpbGF0aW9uUG9vbC52YWx1ZXMoKVxuXG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKGNvbXBpbGF0aW9ucy5tYXAoY29tcGlsYXRpb25zID0+IGNvbXBpbGF0aW9ucy5ydW4oKSkpXG5cblxuICAgICAgICBpZiAobWVzc2FnZXIuaGFzRXJyb3IoKSkge1xuICAgICAgICAgICAgbWVzc2FnZXIucHJpbnRFcnJvcigpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsb2dnZXIuc3VjY2VzcygnQ29tcGlsZWQnICwgYCR7ZmlsZXMubGVuZ3RofSBmaWxlcyBpbiAke0RhdGUubm93KCkgLSBzdGFydHVwVGltZX1tc2ApXG4gICAgICAgICAgICBjb25maWcuYW5rYUNvbmZpZy5kZWJ1ZyAmJiBtZXNzYWdlci5wcmludEluZm8oKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgd2F0Y2hGaWxlcyAoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgY29uc3Qgd2F0Y2hlciA9IHV0aWxzLmdlbkZpbGVXYXRjaGVyKGAke2NvbmZpZy5zcmNEaXJ9LyoqLypgLCB7XG4gICAgICAgICAgICAgICAgZm9sbG93U3ltbGlua3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGlnbm9yZWQ6IGNvbmZpZy5hbmthQ29uZmlnLmlnbm9yZWRcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIHdhdGNoZXIub24oJ2FkZCcsIGFzeW5jIChmaWxlTmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnR1cFRpbWUgPSBEYXRlLm5vdygpXG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZSA9IGF3YWl0IHV0aWxzLmNyZWF0ZUZpbGUoZmlsZU5hbWUpXG5cbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmdlbmVyYXRlQ29tcGlsYXRpb24oZmlsZSkucnVuKClcblxuICAgICAgICAgICAgICAgIGlmIChtZXNzYWdlci5oYXNFcnJvcigpKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VyLnByaW50RXJyb3IoKVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZ2dlci5zdWNjZXNzKCdDb21waWxlZCAnLCBgaW4gJHtEYXRlLm5vdygpIC0gc3RhcnR1cFRpbWV9bXNgKVxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlci5wcmludEluZm8oKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB3YXRjaGVyLm9uKCd1bmxpbmsnLCBhc3luYyAoZmlsZU5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIGF3YWl0IGZzLnVubGluayhmaWxlTmFtZS5yZXBsYWNlKGNvbmZpZy5zcmNEaXIsIGNvbmZpZy5kaXN0RGlyKSlcbiAgICAgICAgICAgICAgICBsb2dnZXIuc3VjY2VzcygnUmVtb3ZlJywgZmlsZU5hbWUpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgd2F0Y2hlci5vbignY2hhbmdlJywgYXN5bmMgKGZpbGVOYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydHVwVGltZSA9IERhdGUubm93KClcbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlID0gYXdhaXQgdXRpbHMuY3JlYXRlRmlsZShmaWxlTmFtZSlcblxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuZ2VuZXJhdGVDb21waWxhdGlvbihmaWxlKS5ydW4oKVxuXG4gICAgICAgICAgICAgICAgaWYgKG1lc3NhZ2VyLmhhc0Vycm9yKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZXIucHJpbnRFcnJvcigpXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoJ0NvbXBpbGVkICcsIGBpbiAke0RhdGUubm93KCkgLSBzdGFydHVwVGltZX1tc2ApXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VyLnByaW50SW5mbygpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIHdhdGNoZXIub24oJ3JlYWR5JywgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICAgICAgICAgIGxvZ2dlci5sb2coJ3dhaXRpbmcgZm9yIGNoYW5nZXMuLi4nKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgbmV3IENvbXBpbGF0aW9uLlxuICAgICAqIEBwYXJhbSBmaWxlXG4gICAgICovXG4gICAgZ2VuZXJhdGVDb21waWxhdGlvbiAoZmlsZTogRmlsZSkge1xuICAgICAgICByZXR1cm4gbmV3IENvbXBpbGF0aW9uKGZpbGUsIHRoaXMuY29uZmlnLCB0aGlzKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1vdW50IHBhcnNlcnMuXG4gICAgICovXG4gICAgaW5pdFBhcnNlcnMgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmNvbmZpZy5hbmthQ29uZmlnLnBhcnNlcnMuZm9yRWFjaCgoeyBtYXRjaCwgcGFyc2VycyB9KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBhcnNlcnMucHVzaCh7XG4gICAgICAgICAgICAgICAgbWF0Y2gsXG4gICAgICAgICAgICAgICAgcGFyc2VyczogcGFyc2Vycy5tYXAoKHsgcGFyc2VyLCBvcHRpb25zIH0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlci5iaW5kKHRoaXMuZ2VuZXJhdGVQYXJzZXJJbmplY3Rpb24ob3B0aW9ucykpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTW91bnQgUGx1Z2lucy5cbiAgICAgKi9cbiAgICBpbml0UGx1Z2lucyAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY29uZmlnLmFua2FDb25maWcucGx1Z2lucy5mb3JFYWNoKCh7IHBsdWdpbiwgb3B0aW9ucyB9KSA9PiB7XG4gICAgICAgICAgICBwbHVnaW4uY2FsbCh0aGlzLmdlbmVyYXRlUGx1Z2luSW5qZWN0aW9uKG9wdGlvbnMpKVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGdlbmVyYXRlUGx1Z2luSW5qZWN0aW9uIChvcHRpb25zOiBQbHVnaW5PcHRpb25zWydvcHRpb25zJ10pOiBQbHVnaW5JbmplY3Rpb24ge1xuICAgICAgICByZXR1cm4gbmV3IFBsdWdpbkluamVjdGlvbih0aGlzLCBvcHRpb25zKVxuICAgIH1cblxuICAgIGdlbmVyYXRlUGFyc2VySW5qZWN0aW9uIChvcHRpb25zOiBQYXJzZXJPcHRpb25zWydvcHRpb25zJ10pOiBQYXJzZXJJbmplY3Rpb24ge1xuICAgICAgICByZXR1cm4gbmV3IFBhcnNlckluamVjdGlvbih0aGlzLCBvcHRpb25zKVxuICAgIH1cbn1cbiIsImltcG9ydCBDb21waWxlciBmcm9tICcuL0NvbXBpbGVyJ1xuXG5leHBvcnQgZGVmYXVsdCBhYnN0cmFjdCBjbGFzcyBDb21tYW5kIHtcbiAgICBwdWJsaWMgY29tbWFuZDogc3RyaW5nXG4gICAgcHVibGljIG9wdGlvbnM6IEFycmF5PEFycmF5PHN0cmluZz4+XG4gICAgcHVibGljIGFsaWFzOiBzdHJpbmdcbiAgICBwdWJsaWMgdXNhZ2U6IHN0cmluZ1xuICAgIHB1YmxpYyBkZXNjcmlwdGlvbjogc3RyaW5nXG4gICAgcHVibGljIGV4YW1wbGVzOiBBcnJheTxzdHJpbmc+XG4gICAgcHVibGljICRjb21waWxlcjogQ29tcGlsZXJcbiAgICBwdWJsaWMgb246IHtcbiAgICAgICAgW2tleTogc3RyaW5nXTogKC4uLmFyZzogYW55W10pID0+IHZvaWRcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvciAoY29tbWFuZDogc3RyaW5nLCBkZXNjPzogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuY29tbWFuZCA9IGNvbW1hbmRcbiAgICAgICAgdGhpcy5vcHRpb25zID0gW11cbiAgICAgICAgdGhpcy5hbGlhcyA9ICcnXG4gICAgICAgIHRoaXMudXNhZ2UgPSAnJ1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gZGVzY1xuICAgICAgICB0aGlzLmV4YW1wbGVzID0gW11cbiAgICAgICAgdGhpcy5vbiA9IHt9XG4gICAgfVxuXG4gICAgYWJzdHJhY3QgYWN0aW9uIChwYXJhbTogc3RyaW5nIHwgQXJyYXk8c3RyaW5nPiwgb3B0aW9uczogT2JqZWN0LCAuLi5vdGhlcjogYW55W10pOiBQcm9taXNlPGFueT4gfCB2b2lkXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplIGFua2EgY29yZSBjb21waWxlclxuICAgICAqL1xuICAgIHByb3RlY3RlZCBpbml0Q29tcGlsZXIgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLiRjb21waWxlciA9IG5ldyBDb21waWxlcigpXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHNldFVzYWdlICh1c2FnZTogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIHRoaXMudXNhZ2UgPSB1c2FnZVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBzZXRPcHRpb25zICguLi5vcHRpb25zOiBBcnJheTxzdHJpbmc+KTogdm9pZCB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5wdXNoKG9wdGlvbnMpXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHNldEV4YW1wbGVzICguLi5leGFtcGxlOiBBcnJheTxzdHJpbmc+KTogdm9pZCB7XG4gICAgICAgIHRoaXMuZXhhbXBsZXMgPSB0aGlzLmV4YW1wbGVzLmNvbmNhdChleGFtcGxlKVxuICAgIH1cblxuICAgIHB1YmxpYyBwcmludFRpdGxlICguLi5hcmc6IEFycmF5PGFueT4pIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1xcclxcbiAnLCAuLi5hcmcsICdcXHJcXG4nKVxuICAgIH1cblxuICAgIHB1YmxpYyBwcmludENvbnRlbnQgKC4uLmFyZzogQXJyYXk8YW55Pikge1xuICAgICAgICBjb25zb2xlLmxvZygnICAgJywgLi4uYXJnKVxuICAgIH1cbn1cbiIsImltcG9ydCBjb25maWcgIGZyb20gJy4uL2NvbmZpZydcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uL3V0aWxzJ1xuaW1wb3J0IHsgQ29tbWFuZCwgQ29tcGlsZXIgfSBmcm9tICcuLi9jb3JlJ1xuaW1wb3J0IG1lc3NhZ2VyIGZyb20gJy4uL3V0aWxzL21lc3NhZ2VyJ1xuXG5leHBvcnQgdHlwZSBEZXZDb21tYW5kT3B0cyA9IE9iamVjdCAmIHt9XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERldkNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHN1cGVyKFxuICAgICAgICAgICAgJ2RldiBbcGFnZXMuLi5dJyxcbiAgICAgICAgICAgICdEZXZlbG9wbWVudCBtb2RlJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRFeGFtcGxlcyhcbiAgICAgICAgICAgICckIGFua2EgZGV2JyxcbiAgICAgICAgICAgICckIGFua2EgZGV2IGluZGV4JyxcbiAgICAgICAgICAgICckIGFua2EgZGV2IC9wYWdlcy9sb2cvbG9nIC9wYWdlcy91c2VyL3VzZXInXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLiRjb21waWxlciA9IG5ldyBDb21waWxlcigpXG4gICAgfVxuXG4gICAgYXN5bmMgYWN0aW9uIChwYWdlcz86IEFycmF5PHN0cmluZz4sIG9wdGlvbnM/OiBEZXZDb21tYW5kT3B0cykge1xuICAgICAgICB0aGlzLiRjb21waWxlci5jb25maWcuYW5rYUNvbmZpZy5kZXZNb2RlID0gdHJ1ZVxuXG4gICAgICAgIHRoaXMuaW5pdENvbXBpbGVyKClcbiAgICAgICAgYXdhaXQgdGhpcy4kY29tcGlsZXIuY2xlYW4oKVxuICAgICAgICBhd2FpdCB0aGlzLiRjb21waWxlci5sYXVuY2goKVxuICAgICAgICBhd2FpdCB0aGlzLiRjb21waWxlci53YXRjaEZpbGVzKClcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgY29uZmlnIGZyb20gJy4uL2NvbmZpZydcbmltcG9ydCB7IGRvd25sb2FkUmVwbywgbG9nZ2VyIH0gZnJvbSAnLi4vdXRpbHMnXG5pbXBvcnQgeyBDb21tYW5kLCBDb21waWxlciB9IGZyb20gJy4uL2NvcmUnXG5cbmV4cG9ydCB0eXBlIEluaXRDb21tYW5kT3B0cyA9IHtcbiAgICByZXBvOiBzdHJpbmdcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSW5pdENvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHN1cGVyKFxuICAgICAgICAgICAgJ2luaXQgPHByb2plY3QtbmFtZT4nLFxuICAgICAgICAgICAgJ0luaXRpYWxpemUgbmV3IHByb2plY3QnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldEV4YW1wbGVzKFxuICAgICAgICAgICAgJyQgYW5rYSBpbml0JyxcbiAgICAgICAgICAgIGAkIGFua2EgaW5pdCBhbmthLWluLWFjdGlvbiAtLXJlcG89JHtjb25maWcuZGVmYXVsdFNjYWZmb2xkfWBcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0T3B0aW9ucyhcbiAgICAgICAgICAgICctciwgLS1yZXBvJyxcbiAgICAgICAgICAgICd0ZW1wbGF0ZSByZXBvc2l0b3J5J1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy4kY29tcGlsZXIgPSBuZXcgQ29tcGlsZXIoKVxuICAgIH1cblxuICAgIGFzeW5jIGFjdGlvbiAocHJvamVjdE5hbWU6IHN0cmluZywgb3B0aW9ucz86IEluaXRDb21tYW5kT3B0cykge1xuICAgICAgICBjb25zdCBwcm9qZWN0ID0gcGF0aC5yZXNvbHZlKGNvbmZpZy5jd2QsIHByb2plY3ROYW1lKVxuICAgICAgICBjb25zdCByZXBvID0gb3B0aW9ucy5yZXBvIHx8IGNvbmZpZy5kZWZhdWx0U2NhZmZvbGRcblxuICAgICAgICBsb2dnZXIuc3RhcnRMb2FkaW5nKCdEb3dubG9hZGluZyB0ZW1wbGF0ZS4uLicpXG4gICAgICAgIGF3YWl0IGRvd25sb2FkUmVwbyhyZXBvLCBwcm9qZWN0KVxuICAgICAgICBsb2dnZXIuc3RvcExvYWRpbmcoKVxuICAgICAgICBsb2dnZXIuc3VjY2VzcygnRG9uZScsIHByb2plY3QpXG4gICAgfVxufVxuIiwiaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi4vdXRpbHMnXG5pbXBvcnQgeyBDb21tYW5kLCBDb21waWxlciB9IGZyb20gJy4uL2NvcmUnXG5cbmV4cG9ydCB0eXBlIERldkNvbW1hbmRPcHRzID0gT2JqZWN0ICYge31cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGV2Q29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgc3VwZXIoXG4gICAgICAgICAgICAncHJvZCcsXG4gICAgICAgICAgICAnUHJvZHVjdGlvbiBtb2RlJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRFeGFtcGxlcyhcbiAgICAgICAgICAgICckIGFua2EgcHJvZCdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuJGNvbXBpbGVyID0gbmV3IENvbXBpbGVyKClcbiAgICB9XG5cbiAgICBhc3luYyBhY3Rpb24gKHBhZ2VzPzogQXJyYXk8c3RyaW5nPiwgb3B0aW9ucz86IERldkNvbW1hbmRPcHRzKSB7XG4gICAgICAgIHRoaXMuJGNvbXBpbGVyLmNvbmZpZy5hbmthQ29uZmlnLmRldk1vZGUgPSBmYWxzZVxuXG4gICAgICAgIGNvbnN0IHN0YXJ0dXBUaW1lID0gRGF0ZS5ub3coKVxuXG4gICAgICAgIHRoaXMuaW5pdENvbXBpbGVyKClcbiAgICAgICAgYXdhaXQgdGhpcy4kY29tcGlsZXIuY2xlYW4oKVxuICAgICAgICBhd2FpdCB0aGlzLiRjb21waWxlci5sYXVuY2goKVxuICAgICAgICBsb2dnZXIuc3VjY2VzcyhgQ29tcGlsZWQgaW4gJHtEYXRlLm5vdygpIC0gc3RhcnR1cFRpbWV9bXNgLCAnSGF2ZSBhIG5pY2UgZGF5IPCfjokgIScpXG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgY29uZmlnICBmcm9tICcuLi9jb25maWcnXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi91dGlscydcbmltcG9ydCB7IENvbW1hbmQsIENvbXBpbGVyIH0gZnJvbSAnLi4vY29yZSdcbmltcG9ydCB7IGRlZmF1bHQgYXMgRnNFZGl0b3JDb25zdHJ1Y3RvciB9IGZyb20gJy4uL3V0aWxzL2VkaXRvcidcblxuaW1wb3J0IHtcbiAgICBDb21waWxlckNvbmZpZ1xufSBmcm9tICcuLi8uLi90eXBlcy90eXBlcydcblxuY29uc3QgeyBsb2dnZXIsIEZzRWRpdG9yIH0gPSB1dGlsc1xuXG5leHBvcnQgdHlwZSBDcmVhdGVQYWdlQ29tbWFuZE9wdHMgPSB7XG4gICAgcm9vdDogc3RyaW5nXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENyZWF0ZVBhZ2VDb21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBzdXBlcihcbiAgICAgICAgICAgICduZXctcGFnZSA8cGFnZXMuLi4+JyxcbiAgICAgICAgICAgICdDcmVhdGUgYSBtaW5pcHJvZ3JhbSBwYWdlJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRFeGFtcGxlcyhcbiAgICAgICAgICAgICckIGFua2EgbmV3LXBhZ2UgaW5kZXgnLFxuICAgICAgICAgICAgJyQgYW5rYSBuZXctcGFnZSAvcGFnZXMvaW5kZXgvaW5kZXgnLFxuICAgICAgICAgICAgJyQgYW5rYSBuZXctcGFnZSAvcGFnZXMvaW5kZXgvaW5kZXggLS1yb290PXBhY2thZ2VBJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRPcHRpb25zKFxuICAgICAgICAgICAgJy1yLCAtLXJvb3QgPHN1YnBhY2thZ2U+JyxcbiAgICAgICAgICAgICdzYXZlIHBhZ2UgdG8gc3VicGFja2FnZXMnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLiRjb21waWxlciA9IG5ldyBDb21waWxlcigpXG4gICAgfVxuXG4gICAgYXN5bmMgYWN0aW9uIChwYWdlcz86IEFycmF5PHN0cmluZz4sIG9wdGlvbnM/OiBDcmVhdGVQYWdlQ29tbWFuZE9wdHMpIHtcbiAgICAgICAgY29uc3Qgcm9vdCA9IG9wdGlvbnMucm9vdFxuICAgICAgICBjb25zdCBlZGl0b3IgPSBuZXcgRnNFZGl0b3IoKVxuXG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHBhZ2VzLm1hcChwYWdlID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdlbmVyYXRlUGFnZShwYWdlLCBlZGl0b3IsIHJvb3QpXG4gICAgICAgIH0pKVxuXG4gICAgICAgIGxvZ2dlci5zdWNjZXNzKCdEb25lJywgJ0hhdmUgYSBuaWNlIGRheSDwn46JICEnKVxuICAgIH1cblxuICAgIGFzeW5jIGdlbmVyYXRlUGFnZSAocGFnZTogc3RyaW5nLCBlZGl0b3I6IEZzRWRpdG9yQ29uc3RydWN0b3IsIHJvb3Q/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgYW5rYUNvbmZpZyxcbiAgICAgICAgICAgIHByb2plY3RDb25maWdcbiAgICAgICAgfSA9IDxDb21waWxlckNvbmZpZz5jb25maWdcbiAgICAgICAgY29uc3QgQ3dkUmVnRXhwID0gbmV3IFJlZ0V4cChgXiR7Y29uZmlnLmN3ZH1gKVxuICAgICAgICBjb25zdCBwYWdlUGF0aCA9IHBhZ2Uuc3BsaXQocGF0aC5zZXApLmxlbmd0aCA9PT0gMSA/XG4gICAgICAgICAgICBwYXRoLmpvaW4oYW5rYUNvbmZpZy5wYWdlcywgcGFnZSwgcGFnZSkgOiBwYWdlXG4gICAgICAgIGNvbnN0IHBhZ2VOYW1lID0gcGF0aC5iYXNlbmFtZShwYWdlUGF0aClcbiAgICAgICAgY29uc3QgY29udGV4dCA9IHtcbiAgICAgICAgICAgIHBhZ2VOYW1lLFxuICAgICAgICAgICAgdGltZTogbmV3IERhdGUoKS50b0xvY2FsZVN0cmluZygpXG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYXBwQ29uZmlnUGF0aCA9IHBhdGguam9pbihjb25maWcuc3JjRGlyLCAnYXBwLmpzb24nKVxuICAgICAgICBsZXQgYWJzb2x1dGVQYXRoID0gY29uZmlnLnNyY0RpclxuXG4gICAgICAgIGlmIChyb290KSB7XG4gICAgICAgICAgICBjb25zdCByb290UGF0aCA9IHBhdGguam9pbihhbmthQ29uZmlnLnN1YlBhY2thZ2VzLCByb290KVxuICAgICAgICAgICAgY29uc3Qgc3ViUGtnID0gcHJvamVjdENvbmZpZy5zdWJQYWNrYWdlcy5maW5kKChwa2c6IGFueSkgPT4gcGtnLnJvb3QgPT09IHJvb3RQYXRoKVxuXG4gICAgICAgICAgICBhYnNvbHV0ZVBhdGggPSBwYXRoLmpvaW4oYWJzb2x1dGVQYXRoLCBhbmthQ29uZmlnLnN1YlBhY2thZ2VzLCByb290LCBwYWdlUGF0aClcblxuICAgICAgICAgICAgaWYgKHN1YlBrZykge1xuICAgICAgICAgICAgICAgIGlmIChzdWJQa2cucGFnZXMuaW5jbHVkZXMocGFnZVBhdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKCdUaGUgcGFnZSBhbHJlYWR5IGV4aXN0cycsIGFic29sdXRlUGF0aClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc3ViUGtnLnBhZ2VzLnB1c2gocGFnZVBhdGgpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwcm9qZWN0Q29uZmlnLnN1YlBhY2thZ2VzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICByb290OiByb290UGF0aCxcbiAgICAgICAgICAgICAgICAgICAgcGFnZXM6IFtwYWdlUGF0aF1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWJzb2x1dGVQYXRoID0gcGF0aC5qb2luKGFic29sdXRlUGF0aCwgcGFnZVBhdGgpXG5cbiAgICAgICAgICAgIGlmIChwcm9qZWN0Q29uZmlnLnBhZ2VzLmluY2x1ZGVzKHBhZ2VQYXRoKSkge1xuICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKCdUaGUgcGFnZSBhbHJlYWR5IGV4aXN0cycsIGFic29sdXRlUGF0aClcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcHJvamVjdENvbmZpZy5wYWdlcy5wdXNoKHBhZ2VQYXRoKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdHBscyA9IGF3YWl0IHV0aWxzLnNlYXJjaEZpbGVzKGAke3BhdGguam9pbihhbmthQ29uZmlnLnRlbXBsYXRlLnBhZ2UsICcqLionKX1gKVxuXG4gICAgICAgIHRwbHMuZm9yRWFjaCh0cGwgPT4ge1xuICAgICAgICAgICAgZWRpdG9yLmNvcHkoXG4gICAgICAgICAgICAgICAgdHBsLFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwYXRoLmRpcm5hbWUoYWJzb2x1dGVQYXRoKSwgcGFnZU5hbWUgKyBwYXRoLmV4dG5hbWUodHBsKSksXG4gICAgICAgICAgICAgICAgY29udGV4dFxuICAgICAgICAgICAgKVxuICAgICAgICB9KVxuICAgICAgICBlZGl0b3Iud3JpdGVKU09OKGFwcENvbmZpZ1BhdGgsIHByb2plY3RDb25maWcsIG51bGwsIDQpXG5cbiAgICAgICAgYXdhaXQgZWRpdG9yLnNhdmUoKVxuXG4gICAgICAgIGxvZ2dlci5zdWNjZXNzKCdDcmVhdGUgcGFnZScsIGFic29sdXRlUGF0aC5yZXBsYWNlKEN3ZFJlZ0V4cCwgJycpKVxuICAgIH1cbn1cbiIsImltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJ1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IGNvbmZpZyAgZnJvbSAnLi4vY29uZmlnJ1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vdXRpbHMnXG5pbXBvcnQgeyBDb21tYW5kLCBDb21waWxlciB9IGZyb20gJy4uL2NvcmUnXG5pbXBvcnQgeyBkZWZhdWx0IGFzIEZzRWRpdG9yQ29uc3RydWN0b3IgfSBmcm9tICcuLi91dGlscy9lZGl0b3InXG5cbmltcG9ydCB7XG4gICAgQ29tcGlsZXJDb25maWdcbn0gZnJvbSAnLi4vLi4vdHlwZXMvdHlwZXMnXG5cbmNvbnN0IHsgbG9nZ2VyLCBGc0VkaXRvciB9ID0gdXRpbHNcblxuZXhwb3J0IHR5cGUgQ3JlYXRlQ29tcG9uZW50Q29tbWFuZE9wdHMgPSB7XG4gICAgcm9vdDogc3RyaW5nXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENyZWF0ZUNvbXBvbmVudENvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHN1cGVyKFxuICAgICAgICAgICAgJ25ldy1jbXB0IDxjb21wb25lbnRzLi4uPicsXG4gICAgICAgICAgICAnQ3JlYXRlIGEgbWluaXByb2dyYW0gY29tcG9uZW50J1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRFeGFtcGxlcyhcbiAgICAgICAgICAgICckIGFua2EgbmV3LWNtcHQgYnV0dG9uJyxcbiAgICAgICAgICAgICckIGFua2EgbmV3LWNtcHQgL2NvbXBvbmVudHMvYnV0dG9uL2J1dHRvbicsXG4gICAgICAgICAgICAnJCBhbmthIG5ldy1jbXB0IC9jb21wb25lbnRzL2J1dHRvbi9idXR0b24gLS1nbG9iYWwnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldE9wdGlvbnMoXG4gICAgICAgICAgICAnLXIsIC0tcm9vdCA8c3VicGFja2FnZT4nLFxuICAgICAgICAgICAgJ3NhdmUgY29tcG9uZW50IHRvIHN1YnBhY2thZ2VzJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy4kY29tcGlsZXIgPSBuZXcgQ29tcGlsZXIoKVxuICAgIH1cblxuICAgIGFzeW5jIGFjdGlvbiAoY29tcG9uZW50cz86IEFycmF5PHN0cmluZz4sIG9wdGlvbnM/OiBDcmVhdGVDb21wb25lbnRDb21tYW5kT3B0cykge1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICByb290XG4gICAgICAgIH0gPSBvcHRpb25zXG4gICAgICAgIGNvbnN0IGVkaXRvciA9IG5ldyBGc0VkaXRvcigpXG5cbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoY29tcG9uZW50cy5tYXAoY29tcG9uZW50ID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdlbmVyYXRlQ29tcG9uZW50KGNvbXBvbmVudCwgZWRpdG9yLCByb290KVxuICAgICAgICB9KSlcblxuICAgICAgICBsb2dnZXIuc3VjY2VzcygnRG9uZScsICdIYXZlIGEgbmljZSBkYXkg8J+OiSAhJylcbiAgICB9XG5cbiAgICBhc3luYyBnZW5lcmF0ZUNvbXBvbmVudCAoY29tcG9uZW50OiBzdHJpbmcsIGVkaXRvcjogRnNFZGl0b3JDb25zdHJ1Y3Rvciwgcm9vdD86IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICBhbmthQ29uZmlnLFxuICAgICAgICAgICAgcHJvamVjdENvbmZpZ1xuICAgICAgICB9ID0gPENvbXBpbGVyQ29uZmlnPmNvbmZpZ1xuICAgICAgICBjb25zdCBDd2RSZWdFeHAgPSBuZXcgUmVnRXhwKGBeJHtjb25maWcuY3dkfWApXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudFBhdGggPSBjb21wb25lbnQuc3BsaXQocGF0aC5zZXApLmxlbmd0aCA9PT0gMSA/XG4gICAgICAgICAgICBwYXRoLmpvaW4oYW5rYUNvbmZpZy5jb21wb25lbnRzLCBjb21wb25lbnQsIGNvbXBvbmVudCkgOlxuICAgICAgICAgICAgY29tcG9uZW50XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudE5hbWUgPSBwYXRoLmJhc2VuYW1lKGNvbXBvbmVudFBhdGgpXG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSB7XG4gICAgICAgICAgICBjb21wb25lbnROYW1lLFxuICAgICAgICAgICAgdGltZTogbmV3IERhdGUoKS50b0xvY2FsZVN0cmluZygpXG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYWJzb2x1dGVQYXRoID0gcm9vdCA/XG4gICAgICAgICAgICBwYXRoLmpvaW4oY29uZmlnLnNyY0RpciwgYW5rYUNvbmZpZy5zdWJQYWNrYWdlcywgcm9vdCwgY29tcG9uZW50UGF0aCkgOlxuICAgICAgICAgICAgcGF0aC5qb2luKGNvbmZpZy5zcmNEaXIsIGNvbXBvbmVudFBhdGgpXG5cbiAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMocGF0aC5qb2luKHBhdGguZGlybmFtZShhYnNvbHV0ZVBhdGgpLCBjb21wb25lbnROYW1lICsgJy5qc29uJykpKSB7XG4gICAgICAgICAgICBsb2dnZXIud2FybignVGhlIGNvbXBvbmVudCBhbHJlYWR5IGV4aXN0cycsIGFic29sdXRlUGF0aClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdHBscyA9IGF3YWl0IHV0aWxzLnNlYXJjaEZpbGVzKGAke3BhdGguam9pbihhbmthQ29uZmlnLnRlbXBsYXRlLmNvbXBvbmVudCwgJyouKicpfWApXG5cbiAgICAgICAgdHBscy5mb3JFYWNoKHRwbCA9PiB7XG4gICAgICAgICAgICBlZGl0b3IuY29weShcbiAgICAgICAgICAgICAgICB0cGwsXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHBhdGguZGlybmFtZShhYnNvbHV0ZVBhdGgpLCBjb21wb25lbnROYW1lICsgcGF0aC5leHRuYW1lKHRwbCkpLFxuICAgICAgICAgICAgICAgIGNvbnRleHRcbiAgICAgICAgICAgIClcbiAgICAgICAgfSlcblxuICAgICAgICBhd2FpdCBlZGl0b3Iuc2F2ZSgpXG5cbiAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoJ0NyZWF0ZSBjb21wb25lbnQnLCBhYnNvbHV0ZVBhdGgucmVwbGFjZShDd2RSZWdFeHAsICcnKSlcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcydcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBjb25maWcgIGZyb20gJy4uL2NvbmZpZydcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uL3V0aWxzJ1xuaW1wb3J0IHsgQ29tbWFuZCwgQ29tcGlsZXIgfSBmcm9tICcuLi9jb3JlJ1xuaW1wb3J0IHsgZGVmYXVsdCBhcyBGc0VkaXRvckNvbnN0cnVjdG9yIH0gZnJvbSAnLi4vdXRpbHMvZWRpdG9yJ1xuXG5pbXBvcnQge1xuICAgIENvbXBpbGVyQ29uZmlnXG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5jb25zdCB7IGxvZ2dlciwgRnNFZGl0b3IgfSA9IHV0aWxzXG5cbmV4cG9ydCB0eXBlIEVucm9sbENvbXBvbmVudENvbW1hbmRPcHRzID0ge1xuICAgIHBhZ2U6IHN0cmluZ1xuICAgIGdsb2JhbDogc3RyaW5nXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEVucm9sbENvbXBvbmVudENvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHN1cGVyKFxuICAgICAgICAgICAgJ2Vucm9sbCA8Y29tcG9uZW50cy4uLj4nLFxuICAgICAgICAgICAgJ0Vucm9sbCBhIG1pbmlwcm9ncmFtIGNvbXBvbmVudCdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0RXhhbXBsZXMoXG4gICAgICAgICAgICAnJCBhbmthIGVucm9sbCBidXR0b24gLS1nbG9iYWwnLFxuICAgICAgICAgICAgJyQgYW5rYSBlbnJvbGwgL2NvbXBvbmVudHMvYnV0dG9uL2J1dHRvbiAtLWdsb2JhbCcsXG4gICAgICAgICAgICAnJCBhbmthIGVucm9sbCAvY29tcG9uZW50cy9idXR0b24vYnV0dG9uIC0tcGFnZT0vcGFnZXMvaW5kZXgvaW5kZXgnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldE9wdGlvbnMoXG4gICAgICAgICAgICAnLXAsIC0tcGFnZSA8cGFnZT4nLFxuICAgICAgICAgICAgJ3doaWNoIHBhZ2UgY29tcG9uZW50cyBlbnJvbGwgdG8nXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldE9wdGlvbnMoXG4gICAgICAgICAgICAnLWcsIC0tZ2xvYmFsJyxcbiAgICAgICAgICAgICdlbnJvbGwgY29tcG9uZW50cyB0byBhcHAuanNvbidcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuJGNvbXBpbGVyID0gbmV3IENvbXBpbGVyKClcbiAgICB9XG5cbiAgICBhc3luYyBhY3Rpb24gKGNvbXBvbmVudHM/OiBBcnJheTxzdHJpbmc+LCBvcHRpb25zPzogRW5yb2xsQ29tcG9uZW50Q29tbWFuZE9wdHMpIHtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgcGFnZSxcbiAgICAgICAgICAgIGdsb2JhbFxuICAgICAgICB9ID0gb3B0aW9uc1xuICAgICAgICBjb25zdCBlZGl0b3IgPSBuZXcgRnNFZGl0b3IoKVxuXG4gICAgICAgIGlmICghZ2xvYmFsICYmICFwYWdlKSB7XG4gICAgICAgICAgICBsb2dnZXIud2FybignV2hlcmUgY29tcG9uZW50cyBlbnJvbGwgdG8/JylcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoY29tcG9uZW50cy5tYXAoY29tcG9uZW50ID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmVucm9sbENvbXBvbmVudChjb21wb25lbnQsIGVkaXRvciwgZ2xvYmFsID8gJycgOiBwYWdlKVxuICAgICAgICB9KSlcblxuICAgICAgICBsb2dnZXIuc3VjY2VzcygnRG9uZScsICdIYXZlIGEgbmljZSBkYXkg8J+OiSAhJylcbiAgICB9XG5cbiAgICBhc3luYyBlbnJvbGxDb21wb25lbnQgKGNvbXBvbmVudDogc3RyaW5nLCBlZGl0b3I6IEZzRWRpdG9yQ29uc3RydWN0b3IsIHBhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgYW5rYUNvbmZpZyxcbiAgICAgICAgICAgIHByb2plY3RDb25maWdcbiAgICAgICAgfSA9IDxDb21waWxlckNvbmZpZz5jb25maWdcbiAgICAgICAgY29uc3QgQ3dkUmVnRXhwID0gbmV3IFJlZ0V4cChgXiR7Y29uZmlnLmN3ZH1gKVxuICAgICAgICBjb25zdCBjb21wb25lbnRQYXRoID0gY29tcG9uZW50LnNwbGl0KHBhdGguc2VwKS5sZW5ndGggPT09IDEgP1xuICAgICAgICAgICAgcGF0aC5qb2luKGFua2FDb25maWcuY29tcG9uZW50cywgY29tcG9uZW50LCBjb21wb25lbnQpIDpcbiAgICAgICAgICAgIGNvbXBvbmVudFxuICAgICAgICBjb25zdCBjb21wb25lbnROYW1lID0gY29tcG9uZW50UGF0aC5zcGxpdChwYXRoLnNlcCkucG9wKClcbiAgICAgICAgY29uc3QgYXBwQ29uZmlnUGF0aCA9IHBhdGguam9pbihjb25maWcuc3JjRGlyLCAnYXBwLmpzb24nKVxuICAgICAgICBjb25zdCBjb21wb25lbnRBYnNQYXRoID0gcGF0aC5qb2luKGNvbmZpZy5zcmNEaXIsIGNvbXBvbmVudFBhdGgpXG5cbiAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHBhdGguam9pbihwYXRoLmRpcm5hbWUoY29tcG9uZW50QWJzUGF0aCksIGNvbXBvbmVudE5hbWUgKyAnLmpzb24nKSkpIHtcbiAgICAgICAgICAgIGxvZ2dlci53YXJuKCdDb21wb25lbnQgZG9zZSBub3QgZXhpc3RzJywgY29tcG9uZW50QWJzUGF0aClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBhZ2UpIHtcbiAgICAgICAgICAgIGNvbnN0IHBhZ2VBYnNQYXRoID0gcGF0aC5qb2luKGNvbmZpZy5zcmNEaXIsIHBhZ2UpXG4gICAgICAgICAgICBjb25zdCBwYWdlSnNvblBhdGggPSBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKHBhZ2VBYnNQYXRoKSwgcGF0aC5iYXNlbmFtZShwYWdlQWJzUGF0aCkgKyAnLmpzb24nKVxuICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHBhZ2VKc29uUGF0aCkpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIud2FybignUGFnZSBkb3NlIG5vdCBleGlzdHMnLCBwYWdlQWJzUGF0aClcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgcGFnZUpzb24gPSA8YW55PkpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHBhZ2VKc29uUGF0aCwge1xuICAgICAgICAgICAgICAgIGVuY29kaW5nOiAndXRmOCdcbiAgICAgICAgICAgIH0pIHx8ICd7fScpXG5cbiAgICAgICAgICAgIHRoaXMuZW5zdXJlVXNpbmdDb21wb25lbnRzKHBhZ2VKc29uKVxuXG4gICAgICAgICAgICBpZiAocGFnZUpzb24udXNpbmdDb21wb25lbnRzW2NvbXBvbmVudE5hbWVdKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLndhcm4oJ0NvbXBvbmVudCBhbHJlYWR5IGVucm9sbGVkIGluJywgcGFnZUFic1BhdGgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHBhZ2VKc29uLnVzaW5nQ29tcG9uZW50c1tjb21wb25lbnROYW1lXSA9IHBhdGgucmVsYXRpdmUocGF0aC5kaXJuYW1lKHBhZ2VBYnNQYXRoKSwgY29tcG9uZW50QWJzUGF0aClcbiAgICAgICAgICAgIGVkaXRvci53cml0ZUpTT04ocGFnZUpzb25QYXRoLCBwYWdlSnNvbilcbiAgICAgICAgICAgIGF3YWl0IGVkaXRvci5zYXZlKClcblxuICAgICAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoYEVucm9sbCAke2NvbXBvbmVudFBhdGh9IGluYCwgcGFnZUFic1BhdGgucmVwbGFjZShDd2RSZWdFeHAsICcnKSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZW5zdXJlVXNpbmdDb21wb25lbnRzKHByb2plY3RDb25maWcpXG5cbiAgICAgICAgICAgIGlmIChwcm9qZWN0Q29uZmlnLnVzaW5nQ29tcG9uZW50c1tjb21wb25lbnROYW1lXSkge1xuICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKCdDb21wb25lbnQgYWxyZWFkeSBlbnJvbGxlZCBpbicsICdhcHAuanNvbicpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByb2plY3RDb25maWcudXNpbmdDb21wb25lbnRzW2NvbXBvbmVudE5hbWVdID0gcGF0aC5yZWxhdGl2ZShwYXRoLmRpcm5hbWUoYXBwQ29uZmlnUGF0aCksIGNvbXBvbmVudEFic1BhdGgpXG4gICAgICAgICAgICBlZGl0b3Iud3JpdGVKU09OKGFwcENvbmZpZ1BhdGgsIHByb2plY3RDb25maWcpXG4gICAgICAgICAgICBhd2FpdCBlZGl0b3Iuc2F2ZSgpXG5cbiAgICAgICAgICAgIGxvZ2dlci5zdWNjZXNzKGBFbnJvbGwgJHtjb21wb25lbnRQYXRofSBpbmAsICdhcHAuanNvbicpXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIGVuc3VyZVVzaW5nQ29tcG9uZW50cyAoY29uZmlnOiBhbnkpIHtcbiAgICAgICAgaWYgKCFjb25maWcudXNpbmdDb21wb25lbnRzKSB7XG4gICAgICAgICAgICBjb25maWcudXNpbmdDb21wb25lbnRzID0ge31cbiAgICAgICAgfVxuICAgIH1cbn1cbiIsImltcG9ydCBEZXYgZnJvbSAnLi9jb21tYW5kcy9kZXYnXG5pbXBvcnQgSW5pdCBmcm9tICcuL2NvbW1hbmRzL2luaXQnXG5pbXBvcnQgUHJvZCBmcm9tICcuL2NvbW1hbmRzL3Byb2QnXG5pbXBvcnQgQ3JlYXRlUGFnZSBmcm9tICcuL2NvbW1hbmRzL2NyZWF0ZVBhZ2UnXG5pbXBvcnQgQ3JlYXRlQ29tcG9uZW50IGZyb20gJy4vY29tbWFuZHMvY3JlYXRlQ29tcG9uZW50J1xuaW1wb3J0IEVucm9sbENvbXBvbmVudCBmcm9tICcuL2NvbW1hbmRzL2Vucm9sbENvbXBvbmVudCdcblxuZXhwb3J0IGRlZmF1bHQgW1xuICAgIG5ldyBQcm9kKCksXG4gICAgbmV3IERldigpLFxuICAgIG5ldyBJbml0KCksXG4gICAgbmV3IENyZWF0ZVBhZ2UoKSxcbiAgICBuZXcgQ3JlYXRlQ29tcG9uZW50KCksXG4gICAgbmV3IEVucm9sbENvbXBvbmVudCgpXG5dXG4iLCJpbXBvcnQgY29uZmlnIGZyb20gJy4vY29uZmlnJ1xuaW1wb3J0ICogYXMgc2VtdmVyIGZyb20gJ3NlbXZlcidcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4vdXRpbHMnXG5pbXBvcnQgKiBhcyBjZm9udHMgZnJvbSAnY2ZvbnRzJ1xuaW1wb3J0IGNvbW1hbmRzIGZyb20gJy4vY29tbWFuZHMnXG5pbXBvcnQgQ29tcGlsZXIgZnJvbSAnLi9jb3JlL2NsYXNzL0NvbXBpbGVyJ1xuXG5jb25zdCBjb21tYW5kZXIgPSByZXF1aXJlKCdjb21tYW5kZXInKVxuY29uc3QgcGtnSnNvbiA9IHJlcXVpcmUoJy4uL3BhY2thZ2UuanNvbicpXG5cbnJlcXVpcmUoJ3NvdXJjZS1tYXAtc3VwcG9ydCcpLmluc3RhbGwoKVxuXG5pZiAoIXNlbXZlci5zYXRpc2ZpZXMoc2VtdmVyLmNsZWFuKHByb2Nlc3MudmVyc2lvbiksIHBrZ0pzb24uZW5naW5lcy5ub2RlKSkge1xuICAgIGxvZ2dlci5lcnJvcignUmVxdWlyZWQgbm9kZSB2ZXJzaW9uICcgKyBwa2dKc29uLmVuZ2luZXMubm9kZSlcbiAgICBwcm9jZXNzLmV4aXQoMSlcbn1cblxuaWYgKHByb2Nlc3MuYXJndi5pbmRleE9mKCctLWRlYnVnJykgPiAtMSkge1xuICAgIGNvbmZpZy5hbmthQ29uZmlnLmRlYnVnID0gdHJ1ZVxufVxuXG5pZiAocHJvY2Vzcy5hcmd2LmluZGV4T2YoJy0tc2xpZW50JykgPiAtMSkge1xuICAgIGNvbmZpZy5hbmthQ29uZmlnLnF1aWV0ID0gdHJ1ZVxufVxuXG5jb21tYW5kZXJcbiAgICAub3B0aW9uKCctLWRlYnVnJywgJ2VuYWJsZSBkZWJ1ZyBtb2RlJylcbiAgICAub3B0aW9uKCctLXF1aWV0JywgJ2hpZGUgY29tcGlsZSBsb2cnKVxuICAgIC52ZXJzaW9uKHBrZ0pzb24udmVyc2lvbilcbiAgICAudXNhZ2UoJzxjb21tYW5kPiBbb3B0aW9uc10nKVxuXG5jb21tYW5kcy5mb3JFYWNoKGNvbW1hbmQgPT4ge1xuICAgIGNvbnN0IGNtZCA9IGNvbW1hbmRlci5jb21tYW5kKGNvbW1hbmQuY29tbWFuZClcblxuICAgIGlmIChjb21tYW5kLmRlc2NyaXB0aW9uKSB7XG4gICAgICAgIGNtZC5kZXNjcmlwdGlvbihjb21tYW5kLmRlc2NyaXB0aW9uKVxuICAgIH1cblxuICAgIGlmIChjb21tYW5kLnVzYWdlKSB7XG4gICAgICAgIGNtZC51c2FnZShjb21tYW5kLnVzYWdlKVxuICAgIH1cblxuICAgIGlmIChjb21tYW5kLm9uKSB7XG4gICAgICAgIGZvciAobGV0IGtleSBpbiBjb21tYW5kLm9uKSB7XG4gICAgICAgICAgICBjbWQub24oa2V5LCBjb21tYW5kLm9uW2tleV0pXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY29tbWFuZC5vcHRpb25zKSB7XG4gICAgICAgIGNvbW1hbmQub3B0aW9ucy5mb3JFYWNoKChvcHRpb246IFthbnksIGFueSwgYW55LCBhbnldKSA9PiB7XG4gICAgICAgICAgICBjbWQub3B0aW9uKC4uLm9wdGlvbilcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAoY29tbWFuZC5hY3Rpb24pIHtcbiAgICAgICAgY21kLmFjdGlvbihhc3luYyAoLi4uYXJncykgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBjb21tYW5kLmFjdGlvbiguLi5hcmdzKVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGlmIChjb21tYW5kLmV4YW1wbGVzKSB7XG4gICAgICAgIGNtZC5vbignLS1oZWxwJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY29tbWFuZC5wcmludFRpdGxlKCdFeGFtcGxlczonKVxuICAgICAgICAgICAgY29tbWFuZC5leGFtcGxlcy5mb3JFYWNoKGV4YW1wbGUgPT4ge1xuICAgICAgICAgICAgICAgIGNvbW1hbmQucHJpbnRDb250ZW50KGV4YW1wbGUpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgIH1cbn0pXG5cbmlmIChwcm9jZXNzLmFyZ3YubGVuZ3RoID09PSAyKSB7XG4gICAgY29uc3QgTG9nbyA9IGNmb250cy5yZW5kZXIoJ0Fua2EnLCB7XG4gICAgICAgIGZvbnQ6ICdzaW1wbGUnLFxuICAgICAgICBjb2xvcnM6IFsnZ3JlZW5CcmlnaHQnXVxuICAgIH0pXG5cbiAgICBjb25zb2xlLmxvZyhMb2dvLnN0cmluZy5yZXBsYWNlKC8oXFxzKykkLywgYCAke3BrZ0pzb24udmVyc2lvbn1cXHJcXG5gKSlcbiAgICBjb21tYW5kZXIub3V0cHV0SGVscCgpXG59XG5cbmNvbW1hbmRlci5wYXJzZShwcm9jZXNzLmFyZ3YpXG5cbmV4cG9ydCBkZWZhdWx0IENvbXBpbGVyXG4iXSwibmFtZXMiOlsicGF0aC5qb2luIiwiZnMuZXhpc3RzU3luYyIsInNhc3MucmVuZGVyIiwicG9zdGNzcyIsInRzbGliXzEuX19hc3NpZ24iLCJiYWJlbC50cmFuc2Zvcm1TeW5jIiwiZnMuZW5zdXJlRmlsZSIsInBvc3Rjc3MucGx1Z2luIiwiaW50ZXJuYWxQbHVnaW5zIiwidHMudHJhbnNwaWxlTW9kdWxlIiwiYmFiZWwucGFyc2UiLCJwYXRoIiwicGF0aC5kaXJuYW1lIiwicGF0aC5yZWxhdGl2ZSIsImN3ZCIsImFua2FEZWZhdWx0Q29uZmlnLnRlbXBsYXRlIiwiYW5rYURlZmF1bHRDb25maWcucGFyc2VycyIsImFua2FEZWZhdWx0Q29uZmlnLnBsdWdpbnMiLCJhbmthRGVmYXVsdENvbmZpZy5pZ25vcmVkIiwicGF0aC5yZXNvbHZlIiwiY3VzdG9tQ29uZmlnIiwic3lzdGVtLnNyY0RpciIsImZzLnJlYWRGaWxlIiwiZnMud3JpdGVGaWxlIiwicGF0aC5iYXNlbmFtZSIsInBhdGguZXh0bmFtZSIsImZzLnJlYWRGaWxlU3luYyIsImxvZyIsImNob2tpZGFyLndhdGNoIiwidHNsaWJfMS5fX2V4dGVuZHMiLCJ1dGlscy5sb2dnZXIiLCJ1dGlscy5jcmVhdGVGaWxlIiwidXRpbHMuYXN5bmNGdW5jdGlvbldyYXBwZXIiLCJ1dGlscy5jYWxsUHJvbWlzZUluQ2hhaW4iLCJwYXRoLnNlcCIsImxvZ2dlciIsInV0aWxzLnNlYXJjaEZpbGVzIiwiZnMuZW5zdXJlRGlyU3luYyIsInV0aWxzLmdlbkZpbGVXYXRjaGVyIiwiZnMudW5saW5rIiwiZG93bmxvYWRSZXBvIiwiRnNFZGl0b3IiLCJjb25maWciLCJQcm9kIiwiRGV2IiwiSW5pdCIsIkNyZWF0ZVBhZ2UiLCJDcmVhdGVDb21wb25lbnQiLCJFbnJvbGxDb21wb25lbnQiLCJzZW12ZXIuc2F0aXNmaWVzIiwic2VtdmVyLmNsZWFuIiwiY2ZvbnRzLnJlbmRlciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUdBLElBQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQTtBQUV6Qix3QkFBeUIsS0FBeUIsRUFBRSxJQUFhO0lBQXhDLHNCQUFBLEVBQUEsVUFBeUI7SUFDOUMsSUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFBO0lBQ3ZCLElBQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxHQUFHLENB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
