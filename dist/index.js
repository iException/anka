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
    if (file.isInSrcDir || 1) {
        if (!babelConfig) {
            babelConfig = utils.resolveConfig(['babel.config.js'], config.cwd);
        }
        file.convertContentToString();
        var result = babel.transformSync(file.content, tslib_1.__assign({ babelrc: false, ast: true, filename: file.sourceFile, sourceType: 'module', sourceMaps: config.ankaConfig.devMode, comments: false, minified: false }, babelConfig));
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
                    case '.js':
                        var result = UglifyJS.minify(file.content);
                        if (result.error) {
                            throw result.error;
                        }
                        file.content = result.code;
                        break;
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
                minified: false,
                comments: false
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
//# sourceMappingURL=index.js.map

module.exports = Compiler;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlscy9yZXNvbHZlQ29uZmlnLnRzIiwiLi4vc3JjL3BhcnNlcnMvc2Fzc1BhcnNlci50cyIsIi4uL3NyYy91dGlscy9sb2dnZXIudHMiLCIuLi9zcmMvcGFyc2Vycy9zdHlsZVBhcnNlci9pbmRleC50cyIsIi4uL3NyYy9wYXJzZXJzL2JhYmVsUGFyc2VyLnRzIiwiLi4vc3JjL3BsdWdpbnMvc2F2ZUZpbGVQbHVnaW4vaW5kZXgudHMiLCIuLi9zcmMvcGx1Z2lucy93eEltcG9ydFBsdWdpbi9wb3N0Y3NzV3hpbXBvcnQudHMiLCIuLi9zcmMvcGx1Z2lucy93eEltcG9ydFBsdWdpbi9pbmRleC50cyIsIi4uL3NyYy9wYXJzZXJzL3R5cGVzY3JpcHRQYXJzZXIudHMiLCIuLi9zcmMvcGx1Z2lucy9leHRyYWN0RGVwZW5kZW5jeVBsdWdpbi9pbmRleC50cyIsIi4uL3NyYy9jb25maWcvYW5rYURlZmF1bHRDb25maWcudHMiLCIuLi9zcmMvY29uZmlnL2Fua2FDb25maWcudHMiLCIuLi9zcmMvY29uZmlnL3N5c3RlbUNvbmZpZy50cyIsIi4uL3NyYy9jb25maWcvcHJvamVjdENvbmZpZy50cyIsIi4uL3NyYy9jb25maWcvaW5kZXgudHMiLCIuLi9zcmMvdXRpbHMvZnMudHMiLCIuLi9zcmMvY29yZS9jbGFzcy9GaWxlLnRzIiwiLi4vc3JjL3V0aWxzL2NyZWF0ZUZpbGUudHMiLCIuLi9zcmMvdXRpbHMvZWRpdG9yLnRzIiwiLi4vc3JjL3V0aWxzL3Jlc29sdmVNb2R1bGUudHMiLCIuLi9zcmMvdXRpbHMvY2FsbFByb21pc2VJbkNoYWluLnRzIiwiLi4vc3JjL3V0aWxzL2FzeW5jRnVuY3Rpb25XcmFwcGVyLnRzIiwiLi4vc3JjL3V0aWxzL2dlbkZpbGVXYXRjaGVyLnRzIiwiLi4vc3JjL3V0aWxzL2lzTnBtRGVwZW5kZW5jeS50cyIsIi4uL3NyYy91dGlscy9kb3dubG9hZFJlcGUudHMiLCIuLi9zcmMvY29yZS9jbGFzcy9JbmplY3Rpb24udHMiLCIuLi9zcmMvY29yZS9jbGFzcy9Db21waWxhdGlvbi50cyIsIi4uL3NyYy9jb3JlL2NsYXNzL0NvbXBpbGVyLnRzIiwiLi4vc3JjL2NvcmUvY2xhc3MvQ29tbWFuZC50cyIsIi4uL3NyYy9jb21tYW5kcy9kZXYudHMiLCIuLi9zcmMvY29tbWFuZHMvaW5pdC50cyIsIi4uL3NyYy9jb21tYW5kcy9wcm9kLnRzIiwiLi4vc3JjL2NvbW1hbmRzL2NyZWF0ZVBhZ2UudHMiLCIuLi9zcmMvY29tbWFuZHMvY3JlYXRlQ29tcG9uZW50LnRzIiwiLi4vc3JjL2NvbW1hbmRzL2Vucm9sbENvbXBvbmVudC50cyIsIi4uL3NyYy9jb21tYW5kcy50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcydcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcblxuY29uc3QgY3dkID0gcHJvY2Vzcy5jd2QoKVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAobmFtZXM6IEFycmF5PHN0cmluZz4gPSBbXSwgcm9vdD86IHN0cmluZyk6IE9iamVjdCB7XG4gICAgY29uc3QgZGVmYXVsdFZhbHVlID0ge31cbiAgICBjb25zdCBjb25maWdQYXRocyA9IG5hbWVzLm1hcChuYW1lID0+IHBhdGguam9pbihyb290IHx8IGN3ZCwgbmFtZSkpXG5cbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgY29uZmlnUGF0aHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZ1BhdGggPSBjb25maWdQYXRoc1tpbmRleF1cblxuICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhjb25maWdQYXRoKSkge1xuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihkZWZhdWx0VmFsdWUsIHJlcXVpcmUoY29uZmlnUGF0aCkpXG4gICAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlZmF1bHRWYWx1ZVxufVxuIiwiaW1wb3J0ICogYXMgc2FzcyBmcm9tICdub2RlLXNhc3MnXG5cbmltcG9ydCB7XG4gICAgRmlsZSxcbiAgICBQYXJzZXIsXG4gICAgQ29tcGlsYXRpb24sXG4gICAgUGFyc2VySW5qZWN0aW9uXG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG4vKipcbiAqIFNhc3MgZmlsZSBwYXJzZXIuXG4gKiBAZm9yIGFueSBmaWxlIHRoYXQgZG9lcyBub3QgbWF0Y2hlIHBhcnNlcnMuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IDxQYXJzZXI+ZnVuY3Rpb24gKHRoaXM6IFBhcnNlckluamVjdGlvbiwgZmlsZTogRmlsZSwgY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYWxsYmFjaz86IEZ1bmN0aW9uKSB7XG4gICAgY29uc3QgdXRpbHMgPSB0aGlzLmdldFV0aWxzKClcbiAgICBjb25zdCBjb25maWcgPSB0aGlzLmdldFN5c3RlbUNvbmZpZygpXG5cbiAgICBmaWxlLmNvbnRlbnQgPSBmaWxlLmNvbnRlbnQgaW5zdGFuY2VvZiBCdWZmZXIgPyBmaWxlLmNvbnRlbnQudG9TdHJpbmcoKSA6IGZpbGUuY29udGVudFxuXG4gICAgc2Fzcy5yZW5kZXIoe1xuICAgICAgICBmaWxlOiBmaWxlLnNvdXJjZUZpbGUsXG4gICAgICAgIGRhdGE6IGZpbGUuY29udGVudFxuICAgIH0sIChlcnI6IEVycm9yLCByZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICB1dGlscy5sb2dnZXIuZXJyb3IoJ0NvbXBpbGUnLCBlcnIubWVzc2FnZSwgZXJyKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZmlsZS5jb250ZW50ID0gcmVzdWx0LmNzc1xuICAgICAgICAgICAgZmlsZS51cGRhdGVFeHQoJy53eHNzJylcbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjaygpXG4gICAgfSlcbn1cbiIsImltcG9ydCBjaGFsayBmcm9tICdjaGFsaydcbmNvbnN0IG9yYSA9IHJlcXVpcmUoJ29yYScpXG5cbmV4cG9ydCBmdW5jdGlvbiB0b0ZpeCAobnVtYmVyOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIHJldHVybiAoJzAwJyArIG51bWJlcikuc2xpY2UoLTIpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50VGltZSAoKTogc3RyaW5nIHtcbiAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpXG4gICAgcmV0dXJuIGAke3RvRml4KG5vdy5nZXRIb3VycygpKX06JHt0b0ZpeChub3cuZ2V0TWludXRlcygpKX06JHt0b0ZpeChub3cuZ2V0U2Vjb25kcygpKX1gXG59XG5cbmV4cG9ydCBjbGFzcyBMb2dnZXIge1xuICAgIG9yYUluc3RhbmNlOiBhbnlcblxuICAgIGdldCB0aW1lICgpIHtcbiAgICAgICAgcmV0dXJuIGNoYWxrLmdyZXkoYFske2dldEN1cnJlbnRUaW1lKCl9XWApXG4gICAgfVxuXG4gICAgc3RhcnRMb2FkaW5nIChtc2c6IHN0cmluZykge1xuICAgICAgICB0aGlzLm9yYUluc3RhbmNlID0gb3JhKG1zZykuc3RhcnQoKVxuICAgIH1cblxuICAgIHN0b3BMb2FkaW5nICgpIHtcbiAgICAgICAgdGhpcy5vcmFJbnN0YW5jZSAmJiB0aGlzLm9yYUluc3RhbmNlLnN0b3AoKVxuICAgIH1cblxuICAgIGxvZyAoLi4ubXNnOiBBcnJheTxzdHJpbmc+KSB7XG4gICAgICAgIHJldHVybiBjb25zb2xlLmxvZyh0aGlzLnRpbWUsIC4uLm1zZylcbiAgICB9XG5cbiAgICBlcnJvciAodGl0bGU6IHN0cmluZyA9ICcnLCBtc2c6IHN0cmluZyA9ICcnLCBlcnI/OiBhbnkpIHtcbiAgICAgICAgdGhpcy5sb2coY2hhbGsucmVkQnJpZ2h0KHRpdGxlKSwgY2hhbGsuZ3JleShtc2cpKVxuICAgICAgICBlcnIgJiYgY29uc29sZS5sb2coY2hhbGsucmVkQnJpZ2h0KGVyciB8fCBlcnIuc3RhY2spKVxuICAgIH1cblxuICAgIGluZm8gKHRpdGxlOiBzdHJpbmcgPSAnJywgbXNnOiBzdHJpbmcgPSAnJykge1xuICAgICAgICB0aGlzLmxvZyhjaGFsay5yZXNldCh0aXRsZSksIGNoYWxrLmdyZXkobXNnKSlcbiAgICB9XG5cbiAgICB3YXJuICh0aXRsZTogc3RyaW5nID0gJycsIG1zZzogc3RyaW5nID0gJycpIHtcbiAgICAgICAgdGhpcy5sb2coY2hhbGsueWVsbG93QnJpZ2h0KHRpdGxlKSwgY2hhbGsuZ3JleShtc2cpKVxuICAgIH1cblxuICAgIHN1Y2Nlc3MgKHRpdGxlOiBzdHJpbmcgPSAnJywgbXNnOiBzdHJpbmcgPSAnJykge1xuICAgICAgICB0aGlzLmxvZyhjaGFsay5ncmVlbkJyaWdodCh0aXRsZSksIGNoYWxrLmdyZXkobXNnKSlcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IG5ldyBMb2dnZXIoKVxuIiwiaW1wb3J0ICogYXMgUG9zdGNzcyBmcm9tICdwb3N0Y3NzJ1xuaW1wb3J0IGxvZ2dlciBmcm9tICcuLi8uLi91dGlscy9sb2dnZXInXG5pbXBvcnQgcG9zdGNzc3JjIGZyb20gJ3Bvc3Rjc3MtbG9hZC1jb25maWcnXG5cbmltcG9ydCB7XG4gICAgRmlsZSxcbiAgICBQYXJzZXIsXG4gICAgQ29tcGlsYXRpb24sXG4gICAgUGFyc2VySW5qZWN0aW9uXG59IGZyb20gJy4uLy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5jb25zdCBwb3N0Y3NzID0gcmVxdWlyZSgncG9zdGNzcycpXG5jb25zdCBwb3N0Y3NzQ29uZmlnOiBhbnkgPSB7fVxuY29uc3QgaW50ZXJuYWxQbHVnaW5zOiBBcnJheTxQb3N0Y3NzLkFjY2VwdGVkUGx1Z2luPiA9IFtdXG5jb25zdCB0YXNrczogYW55W10gPSBbXVxuXG4vLyBUT0RPOiBBZGQgbmV3IGhvb2s6IHByZXNldFxuXG4vKipcbiAqIFN0eWxlIGZpbGUgcGFyc2VyLlxuICogQGZvciAud3hzcyAuY3NzID0+IC53eHNzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IDxQYXJzZXI+ZnVuY3Rpb24gKHRoaXM6IFBhcnNlckluamVjdGlvbiwgZmlsZTogRmlsZSwgY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBjYjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgICBpZiAocG9zdGNzc0NvbmZpZy5wbHVnaW5zKSB7XG4gICAgICAgIGV4ZWMocG9zdGNzc0NvbmZpZywgZmlsZSwgY2IpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGFza3MucHVzaCgoKSA9PiB7XG4gICAgICAgICAgICBleGVjKHBvc3Rjc3NDb25maWcsIGZpbGUsIGNiKVxuICAgICAgICB9KVxuICAgIH1cbn1cblxuZ2VuUG9zdGNzc0NvbmZpZygpLnRoZW4oKGNvbmZpZzogYW55KSA9PiB7XG4gICAgdGFza3MuZm9yRWFjaCgodGFzazogRnVuY3Rpb24pID0+IHRhc2soKSlcbn0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgbG9nZ2VyLmVycm9yKCdsb2FkQ29uZmlnJywgZXJyLm1lc3NhZ2UsIGVycilcbn0pXG5cblxuZnVuY3Rpb24gZXhlYyAoY29uZmlnOiBhbnksIGZpbGU6IEZpbGUsIGNiOiBGdW5jdGlvbikge1xuICAgIGZpbGUuY29udmVydENvbnRlbnRUb1N0cmluZygpXG4gICAgcG9zdGNzcyhjb25maWcucGx1Z2lucy5jb25jYXQoaW50ZXJuYWxQbHVnaW5zKSkucHJvY2VzcyhmaWxlLmNvbnRlbnQsIHtcbiAgICAgICAgLi4uY29uZmlnLm9wdGlvbnMsXG4gICAgICAgIGZyb206IGZpbGUuc291cmNlRmlsZVxuICAgIH0gYXMgUG9zdGNzcy5Qcm9jZXNzT3B0aW9ucykudGhlbigocm9vdDogUG9zdGNzcy5SZXN1bHQpID0+IHtcbiAgICAgICAgZmlsZS5jb250ZW50ID0gcm9vdC5jc3NcbiAgICAgICAgZmlsZS5hc3QgPSByb290LnJvb3QudG9SZXN1bHQoKVxuICAgICAgICBmaWxlLnVwZGF0ZUV4dCgnLnd4c3MnKVxuICAgICAgICBjYigpXG4gICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgbG9nZ2VyLmVycm9yKCdDb21waWxlJywgZXJyLm1lc3NhZ2UsIGVycilcbiAgICB9KVxufVxuXG5mdW5jdGlvbiBnZW5Qb3N0Y3NzQ29uZmlnICh0YXNrczogRnVuY3Rpb25bXSA9IFtdKSB7XG4gICAgcmV0dXJuIHBvc3Rjc3NDb25maWcucGx1Z2lucyA/IFByb21pc2UucmVzb2x2ZShwb3N0Y3NzQ29uZmlnKSA6IHBvc3Rjc3NyYyh7fSkudGhlbigoY29uZmlnOiBhbnkpID0+IHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShPYmplY3QuYXNzaWduKHBvc3Rjc3NDb25maWcsIGNvbmZpZykpXG4gICAgfSlcbn1cbiIsImltcG9ydCAqIGFzIGJhYmVsIGZyb20gJ0BiYWJlbC9jb3JlJ1xuaW1wb3J0IEZpbGUgZnJvbSAnLi4vY29yZS9jbGFzcy9GaWxlJ1xuXG5pbXBvcnQge1xuICAgIFBhcnNlcixcbiAgICBDb21waWxhdGlvbixcbiAgICBQYXJzZXJJbmplY3Rpb25cbn0gZnJvbSAnLi4vLi4vdHlwZXMvdHlwZXMnXG5cbmxldCBiYWJlbENvbmZpZyA9IDxiYWJlbC5UcmFuc2Zvcm1PcHRpb25zPm51bGxcblxuLyoqXG4gKiBTY3JpcHQgRmlsZSBwYXJzZXIuXG4gKiBAZm9yIC5qcyAuZXNcbiAqL1xuZXhwb3J0IGRlZmF1bHQgPFBhcnNlcj5mdW5jdGlvbiAodGhpczogUGFyc2VySW5qZWN0aW9uLCBmaWxlOiBGaWxlLCBjb21waWxhdGlvbjogQ29tcGlsYXRpb24sIGNiOiBGdW5jdGlvbikge1xuICAgIGNvbnN0IHV0aWxzID0gdGhpcy5nZXRVdGlscygpXG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5nZXRTeXN0ZW1Db25maWcoKVxuXG4gICAgaWYgKGZpbGUuaXNJblNyY0RpciB8fCAxKSB7XG4gICAgICAgIGlmICghYmFiZWxDb25maWcpIHtcbiAgICAgICAgICAgIGJhYmVsQ29uZmlnID0gPGJhYmVsLlRyYW5zZm9ybU9wdGlvbnM+dXRpbHMucmVzb2x2ZUNvbmZpZyhbJ2JhYmVsLmNvbmZpZy5qcyddLCBjb25maWcuY3dkKVxuICAgICAgICB9XG5cbiAgICAgICAgZmlsZS5jb252ZXJ0Q29udGVudFRvU3RyaW5nKClcblxuICAgICAgICBjb25zdCByZXN1bHQgPSBiYWJlbC50cmFuc2Zvcm1TeW5jKDxzdHJpbmc+ZmlsZS5jb250ZW50LCB7XG4gICAgICAgICAgICBiYWJlbHJjOiBmYWxzZSxcbiAgICAgICAgICAgIGFzdDogdHJ1ZSxcbiAgICAgICAgICAgIGZpbGVuYW1lOiBmaWxlLnNvdXJjZUZpbGUsXG4gICAgICAgICAgICBzb3VyY2VUeXBlOiAnbW9kdWxlJyxcbiAgICAgICAgICAgIHNvdXJjZU1hcHM6IGNvbmZpZy5hbmthQ29uZmlnLmRldk1vZGUsXG4gICAgICAgICAgICBjb21tZW50czogZmFsc2UsXG4gICAgICAgICAgICBtaW5pZmllZDogZmFsc2UsXG4gICAgICAgICAgICAuLi5iYWJlbENvbmZpZ1xuICAgICAgICB9KVxuXG4gICAgICAgIGZpbGUuc291cmNlTWFwID0gSlNPTi5zdHJpbmdpZnkocmVzdWx0Lm1hcClcbiAgICAgICAgZmlsZS5jb250ZW50ID0gcmVzdWx0LmNvZGVcbiAgICAgICAgZmlsZS5hc3QgPSByZXN1bHQuYXN0XG4gICAgfVxuXG4gICAgZmlsZS51cGRhdGVFeHQoJy5qcycpXG4gICAgY2IoKVxufVxuIiwiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnXG5pbXBvcnQge1xuICAgIFBsdWdpbixcbiAgICBDb21waWxhdGlvbixcbiAgICBQbHVnaW5IYW5kbGVyLFxuICAgIFBsdWdpbkluamVjdGlvblxufSBmcm9tICcuLi8uLi8uLi90eXBlcy90eXBlcydcbmNvbnN0IFVnbGlmeUpTID0gcmVxdWlyZSgndWdsaWZ5LWpzJylcbmNvbnN0IG1pbmlmeUpTT04gPSByZXF1aXJlKCdqc29ubWluaWZ5JylcblxuY29uc3QgaW5saW5lU291cmNlTWFwQ29tbWVudCA9IHJlcXVpcmUoJ2lubGluZS1zb3VyY2UtbWFwLWNvbW1lbnQnKVxuXG5leHBvcnQgZGVmYXVsdCA8UGx1Z2luPmZ1bmN0aW9uICh0aGlzOiBQbHVnaW5JbmplY3Rpb24pIHtcbiAgICBjb25zdCB1dGlscyA9IHRoaXMuZ2V0VXRpbHMoKVxuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuZ2V0U3lzdGVtQ29uZmlnKClcbiAgICBjb25zdCB7XG4gICAgICAgIGxvZ2dlcixcbiAgICAgICAgd3JpdGVGaWxlXG4gICAgfSA9IHV0aWxzXG5cbiAgICB0aGlzLm9uKCdzYXZlJywgPFBsdWdpbkhhbmRsZXI+ZnVuY3Rpb24gKGNvbXBpbGF0aW9uOiBDb21waWxhdGlvbiwgY2I6IEZ1bmN0aW9uKSB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSBjb21waWxhdGlvbi5maWxlXG5cbiAgICAgICAgLy8gVE9ETzogVXNlIG1lbS1mc1xuICAgICAgICBmcy5lbnN1cmVGaWxlKGZpbGUudGFyZ2V0RmlsZSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBpZiAoY29uZmlnLmFua2FDb25maWcuZGV2TW9kZSAmJiBmaWxlLnNvdXJjZU1hcCkge1xuICAgICAgICAgICAgICAgIGZpbGUuY29udmVydENvbnRlbnRUb1N0cmluZygpXG4gICAgICAgICAgICAgICAgZmlsZS5jb250ZW50ID0gZmlsZS5jb250ZW50ICsgJ1xcclxcblxcclxcbicgKyBpbmxpbmVTb3VyY2VNYXBDb21tZW50KGZpbGUuc291cmNlTWFwLCB7XG4gICAgICAgICAgICAgICAgICAgIGJsb2NrOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBzb3VyY2VzQ29udGVudDogdHJ1ZVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWNvbmZpZy5hbmthQ29uZmlnLmRldk1vZGUpIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGZpbGUuZXh0bmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICcuanMnOlxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gVWdsaWZ5SlMubWluaWZ5KGZpbGUuY29udGVudClcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5lcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IHJlc3VsdC5lcnJvclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5jb250ZW50ID0gcmVzdWx0LmNvZGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJy5qc29uJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuY29udmVydENvbnRlbnRUb1N0cmluZygpXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlLmNvbnRlbnQgPSBtaW5pZnlKU09OKGZpbGUuY29udGVudClcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNvbmZpZy5hbmthQ29uZmlnLmRlYnVnKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ1NhdmluZycsIGZpbGUudGFyZ2V0RmlsZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB3cml0ZUZpbGUoZmlsZS50YXJnZXRGaWxlLCBmaWxlLmNvbnRlbnQpXG4gICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgY2IoKVxuICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvcicsIGVyci5tZXNzYWdlLCBlcnIpXG4gICAgICAgICAgICBjYigpXG4gICAgICAgIH0pXG4gICAgfSlcbn1cbiIsImltcG9ydCAqIGFzIHBvc3Rjc3MgZnJvbSAncG9zdGNzcydcblxuZXhwb3J0IGRlZmF1bHQgcG9zdGNzcy5wbHVnaW4oJ3Bvc3Rjc3Mtd3hpbXBvcnQnLCAoKSA9PiB7XG4gICAgcmV0dXJuIChyb290OiBwb3N0Y3NzLlJvb3QpID0+IHtcbiAgICAgICAgbGV0IGltcG9ydHM6IEFycmF5PHN0cmluZz4gPSBbXVxuXG4gICAgICAgIHJvb3Qud2Fsa0F0UnVsZXMoJ3d4aW1wb3J0JywgKHJ1bGU6IHBvc3Rjc3MuQXRSdWxlKSA9PiB7XG4gICAgICAgICAgICBpbXBvcnRzLnB1c2gocnVsZS5wYXJhbXMucmVwbGFjZSgvXFwuXFx3Kyg/PVsnXCJdJCkvLCAnLnd4c3MnKSlcbiAgICAgICAgICAgIHJ1bGUucmVtb3ZlKClcbiAgICAgICAgfSlcbiAgICAgICAgcm9vdC5wcmVwZW5kKC4uLmltcG9ydHMubWFwKChpdGVtOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2ltcG9ydCcsXG4gICAgICAgICAgICAgICAgcGFyYW1zOiBpdGVtXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKVxuICAgICAgICBpbXBvcnRzLmxlbmd0aCA9IDBcbiAgICB9XG59KVxuIiwiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnXG5pbXBvcnQge1xuICAgIFBsdWdpbixcbiAgICBDb21waWxhdGlvbixcbiAgICBQbHVnaW5IYW5kbGVyLFxuICAgIFBsdWdpbkluamVjdGlvblxufSBmcm9tICcuLi8uLi8uLi90eXBlcy90eXBlcydcbmltcG9ydCAqIGFzIFBvc3RDU1MgZnJvbSAncG9zdGNzcydcbmltcG9ydCBwb3N0Y3NzV3hJbXBvcnQgZnJvbSAnLi9wb3N0Y3NzV3hpbXBvcnQnXG5cbmNvbnN0IHBvc3Rjc3MgPSByZXF1aXJlKCdwb3N0Y3NzJylcbmNvbnN0IGNzc25hbm8gPSByZXF1aXJlKCdwb3N0Y3NzLW5vcm1hbGl6ZS13aGl0ZXNwYWNlJylcbmNvbnN0IGludGVybmFsUGx1Z2luczogQXJyYXk8UG9zdENTUy5BY2NlcHRlZFBsdWdpbj4gPSBbcG9zdGNzc1d4SW1wb3J0XVxuXG5leHBvcnQgZGVmYXVsdCA8UGx1Z2luPmZ1bmN0aW9uICh0aGlzOiBQbHVnaW5JbmplY3Rpb24pIHtcbiAgICBjb25zdCB1dGlscyA9IHRoaXMuZ2V0VXRpbHMoKVxuICAgIGNvbnN0IHtcbiAgICAgICAgbG9nZ2VyXG4gICAgfSA9IHV0aWxzXG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5nZXRTeXN0ZW1Db25maWcoKVxuICAgIGNvbnN0IHRlc3RTcmNEaXIgPSBuZXcgUmVnRXhwKGBeJHtjb25maWcuc3JjRGlyfWApXG5cbiAgICB0aGlzLm9uKCdiZWZvcmUtY29tcGlsZScsIDxQbHVnaW5IYW5kbGVyPmZ1bmN0aW9uIChjb21waWxhdGlvbjogQ29tcGlsYXRpb24sIGNiOiBGdW5jdGlvbikge1xuICAgICAgICBjb25zdCBmaWxlID0gY29tcGlsYXRpb24uZmlsZVxuXG4gICAgICAgIGlmICghY29uZmlnLmFua2FDb25maWcuZGV2TW9kZSkge1xuICAgICAgICAgICAgaW50ZXJuYWxQbHVnaW5zLnB1c2goY3NzbmFubylcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGhhbmRsZXIgPSBwb3N0Y3NzKGludGVybmFsUGx1Z2lucylcblxuICAgICAgICBpZiAoZmlsZS5leHRuYW1lID09PSAnLnd4c3MnICYmIHRlc3RTcmNEaXIudGVzdChmaWxlLnNvdXJjZUZpbGUpKSB7XG4gICAgICAgICAgICBoYW5kbGVyLnByb2Nlc3MoKGZpbGUuYXN0IHx8IGZpbGUuY29udGVudCkgYXMgc3RyaW5nIHwgeyB0b1N0cmluZyAoKTogc3RyaW5nOyB9IHwgUG9zdENTUy5SZXN1bHQsIHtcbiAgICAgICAgICAgICAgICBmcm9tOiBmaWxlLnNvdXJjZUZpbGVcbiAgICAgICAgICAgIH0gYXMgUG9zdENTUy5Qcm9jZXNzT3B0aW9ucykudGhlbigocm9vdDogUG9zdENTUy5SZXN1bHQpOiB2b2lkID0+IHtcbiAgICAgICAgICAgICAgICBmaWxlLmNvbnRlbnQgPSByb290LmNzc1xuICAgICAgICAgICAgICAgIGZpbGUuYXN0ID0gcm9vdC5yb290LnRvUmVzdWx0KClcbiAgICAgICAgICAgICAgICBjYigpXG4gICAgICAgICAgICB9LCAoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcignRXJyb3InLCBlcnIubWVzc2FnZSwgZXJyKVxuICAgICAgICAgICAgICAgIGNiKClcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYigpXG4gICAgICAgIH1cbiAgICB9KVxufVxuIiwiaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCdcblxuaW1wb3J0IHtcbiAgICBGaWxlLFxuICAgIFBhcnNlcixcbiAgICBDb21waWxhdGlvbixcbiAgICBQYXJzZXJJbmplY3Rpb25cbn0gZnJvbSAnLi4vLi4vdHlwZXMvdHlwZXMnXG5cbmxldCB0c0NvbmZpZyA9IDx0cy5UcmFuc3BpbGVPcHRpb25zPm51bGxcblxuLyoqXG4gKiBUeXBlc2NyaXB0IGZpbGUgcGFyc2VyLlxuICpcbiAqIEBmb3IgYW55IGZpbGUgdGhhdCBkb2VzIG5vdCBtYXRjaGUgcGFyc2Vycy5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgPFBhcnNlcj5mdW5jdGlvbiAodGhpczogUGFyc2VySW5qZWN0aW9uLCBmaWxlOiBGaWxlLCBjb21waWxhdGlvbjogQ29tcGlsYXRpb24sIGNhbGxiYWNrPzogRnVuY3Rpb24pIHtcbiAgICBjb25zdCB1dGlscyA9IHRoaXMuZ2V0VXRpbHMoKVxuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuZ2V0U3lzdGVtQ29uZmlnKClcbiAgICBjb25zdCB7IGxvZ2dlciB9ID0gdXRpbHNcblxuICAgIGZpbGUuY29udGVudCA9IGZpbGUuY29udGVudCBpbnN0YW5jZW9mIEJ1ZmZlciA/IGZpbGUuY29udGVudC50b1N0cmluZygpIDogZmlsZS5jb250ZW50XG4gICAgY29uc3Qgc291cmNlTWFwID0gIHtcbiAgICAgICAgc291cmNlc0NvbnRlbnQ6IFtmaWxlLmNvbnRlbnRdXG4gICAgfVxuXG4gICAgaWYgKCF0c0NvbmZpZykge1xuICAgICAgICB0c0NvbmZpZyA9IDx0cy5UcmFuc3BpbGVPcHRpb25zPnV0aWxzLnJlc29sdmVDb25maWcoWyd0c2NvbmZpZy5qc29uJywgJ3RzY29uZmlnLmpzJ10sIGNvbmZpZy5jd2QpXG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gdHMudHJhbnNwaWxlTW9kdWxlKGZpbGUuY29udGVudCwge1xuICAgICAgICBjb21waWxlck9wdGlvbnM6IHRzQ29uZmlnLmNvbXBpbGVyT3B0aW9ucyxcbiAgICAgICAgZmlsZU5hbWU6IGZpbGUuc291cmNlRmlsZVxuICAgIH0pXG5cbiAgICB0cnkge1xuICAgICAgICBmaWxlLmNvbnRlbnQgPSByZXN1bHQub3V0cHV0VGV4dFxuICAgICAgICBpZiAoY29uZmlnLmFua2FDb25maWcuZGV2TW9kZSkge1xuICAgICAgICAgICAgZmlsZS5zb3VyY2VNYXAgPSB7XG4gICAgICAgICAgICAgICAgLi4uSlNPTi5wYXJzZShyZXN1bHQuc291cmNlTWFwVGV4dCksXG4gICAgICAgICAgICAgICAgLi4uc291cmNlTWFwXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZmlsZS51cGRhdGVFeHQoJy5qcycpXG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGxvZ2dlci5lcnJvcignQ29tcGlsZSBlcnJvcicsIGVyci5tZXNzYWdlLCBlcnIpXG4gICAgfVxuXG4gICAgY2FsbGJhY2soKVxufVxuIiwiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0ICogYXMgdCBmcm9tICdAYmFiZWwvdHlwZXMnXG5pbXBvcnQgKiBhcyBiYWJlbCBmcm9tICdAYmFiZWwvY29yZSdcbmltcG9ydCB0cmF2ZXJzZSBmcm9tICdAYmFiZWwvdHJhdmVyc2UnXG5pbXBvcnQgY29kZUdlbmVyYXRvciBmcm9tICdAYmFiZWwvZ2VuZXJhdG9yJ1xuXG5pbXBvcnQge1xuICAgIFBsdWdpbixcbiAgICBDb21waWxhdGlvbixcbiAgICBQbHVnaW5IYW5kbGVyLFxuICAgIFBsdWdpbkluamVjdGlvblxufSBmcm9tICcuLi8uLi8uLi90eXBlcy90eXBlcydcblxuY29uc3QgZGVwZW5kZW5jeVBvb2wgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpXG5jb25zdCByZXNvdmxlTW9kdWxlTmFtZSA9IHJlcXVpcmUoJ3JlcXVpcmUtcGFja2FnZS1uYW1lJylcblxuZXhwb3J0IGRlZmF1bHQgPFBsdWdpbj4gZnVuY3Rpb24gKHRoaXM6IFBsdWdpbkluamVjdGlvbikge1xuICAgIGNvbnN0IHV0aWxzID0gdGhpcy5nZXRVdGlscygpXG4gICAgY29uc3QgY29tcGlsZXIgPSB0aGlzLmdldENvbXBpbGVyKClcbiAgICBjb25zdCBjb25maWcgPSB0aGlzLmdldFN5c3RlbUNvbmZpZygpXG4gICAgY29uc3QgdGVzdFNyY0RpciA9IG5ldyBSZWdFeHAoYF4ke2NvbmZpZy5zcmNEaXJ9YClcbiAgICBjb25zdCB0ZXN0Tm9kZU1vZHVsZXMgPSBuZXcgUmVnRXhwKGBeJHtjb25maWcuc291cmNlTm9kZU1vZHVsZXN9YClcblxuICAgIHRoaXMub24oJ2JlZm9yZS1jb21waWxlJywgZnVuY3Rpb24gKGNvbXBpbGF0aW9uOiBDb21waWxhdGlvbiwgY2I6IEZ1bmN0aW9uKSB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSBjb21waWxhdGlvbi5maWxlXG4gICAgICAgIGNvbnN0IGxvY2FsRGVwZW5kZW5jeVBvb2wgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpXG5cbiAgICAgICAgLy8gT25seSByZXNvbHZlIGpzIGZpbGUuXG4gICAgICAgIGlmIChmaWxlLmV4dG5hbWUgPT09ICcuanMnKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhmaWxlLnNvdXJjZUZpbGUsIGZpbGUuYXN0ID8gJ29iamVjdCcgOiBmaWxlLmFzdClcbiAgICAgICAgICAgIGlmICghZmlsZS5hc3QpIHtcbiAgICAgICAgICAgICAgICBmaWxlLmFzdCA9IDx0LkZpbGU+YmFiZWwucGFyc2UoXG4gICAgICAgICAgICAgICAgICAgIGZpbGUuY29udGVudCBpbnN0YW5jZW9mIEJ1ZmZlciA/IGZpbGUuY29udGVudC50b1N0cmluZygpIDogZmlsZS5jb250ZW50LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYWJlbHJjOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZVR5cGU6ICdtb2R1bGUnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyYXZlcnNlKDx0Lk5vZGU+ZmlsZS5hc3QsIHtcbiAgICAgICAgICAgICAgICBlbnRlciAocGF0aCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocGF0aC5pc0ltcG9ydERlY2xhcmF0aW9uKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBwYXRoLm5vZGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNvdXJjZSA9IG5vZGUuc291cmNlXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2UgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2UudmFsdWUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlb2Ygc291cmNlLnZhbHVlID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShzb3VyY2UsIGZpbGUuc291cmNlRmlsZSwgZmlsZS50YXJnZXRGaWxlLCBsb2NhbERlcGVuZGVuY3lQb29sKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhdGguaXNDYWxsRXhwcmVzc2lvbigpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBub2RlID0gcGF0aC5ub2RlXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjYWxsZWUgPSA8dC5JZGVudGlmaWVyPm5vZGUuY2FsbGVlXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhcmdzID0gPHQuU3RyaW5nTGl0ZXJhbFtdPm5vZGUuYXJndW1lbnRzXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGVlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJnc1swXSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3NbMF0udmFsdWUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsZWUubmFtZSA9PT0gJ3JlcXVpcmUnICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIGFyZ3NbMF0udmFsdWUgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGFyZ3NbMF0sIGZpbGUuc291cmNlRmlsZSwgZmlsZS50YXJnZXRGaWxlLCBsb2NhbERlcGVuZGVuY3lQb29sKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIGZpbGUuY29udGVudCA9IGNvZGVHZW5lcmF0b3IoPHQuTm9kZT5maWxlLmFzdCwge1xuICAgICAgICAgICAgICAgIG1pbmlmaWVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBjb21tZW50czogZmFsc2VcbiAgICAgICAgICAgIH0pLmNvZGVcblxuICAgICAgICAgICAgY29uc3QgZGVwZW5kZW5jeUxpc3QgPSBBcnJheS5mcm9tKGxvY2FsRGVwZW5kZW5jeVBvb2wua2V5cygpKS5maWx0ZXIoZGVwZW5kZW5jeSA9PiAhZGVwZW5kZW5jeVBvb2wuaGFzKGRlcGVuZGVuY3kpKVxuXG4gICAgICAgICAgICBQcm9taXNlLmFsbChkZXBlbmRlbmN5TGlzdC5tYXAoZGVwZW5kZW5jeSA9PiB0cmF2ZXJzZU5wbURlcGVuZGVuY3koZGVwZW5kZW5jeSkpKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBjYigpXG4gICAgICAgICAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIGNiKClcbiAgICAgICAgICAgICAgICB1dGlscy5sb2dnZXIuZXJyb3IoZmlsZS5zb3VyY2VGaWxlLCBlcnIubWVzc2FnZSwgZXJyKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNiKClcbiAgICAgICAgfVxuICAgIH0gYXMgUGx1Z2luSGFuZGxlcilcblxuICAgIGZ1bmN0aW9uIHJlc29sdmUgKG5vZGU6IGFueSwgc291cmNlRmlsZTogc3RyaW5nLCB0YXJnZXRGaWxlOiBzdHJpbmcsIGxvY2FsRGVwZW5kZW5jeVBvb2w6IE1hcDxzdHJpbmcsIHN0cmluZz4pIHtcbiAgICAgICAgY29uc3Qgc291cmNlQmFzZU5hbWUgPSBwYXRoLmRpcm5hbWUoc291cmNlRmlsZSlcbiAgICAgICAgY29uc3QgdGFyZ2V0QmFzZU5hbWUgPSBwYXRoLmRpcm5hbWUodGFyZ2V0RmlsZSlcbiAgICAgICAgY29uc3QgbW9kdWxlTmFtZSA9IHJlc292bGVNb2R1bGVOYW1lKG5vZGUudmFsdWUpXG5cbiAgICAgICAgaWYgKHV0aWxzLmlzTnBtRGVwZW5kZW5jeShtb2R1bGVOYW1lKSB8fCB0ZXN0Tm9kZU1vZHVsZXMudGVzdChzb3VyY2VGaWxlKSkge1xuICAgICAgICAgICAgY29uc3QgZGVwZW5kZW5jeSA9IHV0aWxzLnJlc29sdmVNb2R1bGUobm9kZS52YWx1ZSwge1xuICAgICAgICAgICAgICAgIHBhdGhzOiBbc291cmNlQmFzZU5hbWVdXG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAvLyBJbiBjYXNlIGByZXF1aXJlKCdhJylgLCBgYWAgaXMgbG9jYWwgZmlsZSBpbiBzcmMgZGlyZWN0b3J5XG4gICAgICAgICAgICBpZiAoIWRlcGVuZGVuY3kgfHwgdGVzdFNyY0Rpci50ZXN0KGRlcGVuZGVuY3kpKSByZXR1cm5cblxuICAgICAgICAgICAgY29uc3QgZGlzdFBhdGggPSBkZXBlbmRlbmN5LnJlcGxhY2UoY29uZmlnLnNvdXJjZU5vZGVNb2R1bGVzLCBjb25maWcuZGlzdE5vZGVNb2R1bGVzKVxuXG4gICAgICAgICAgICBub2RlLnZhbHVlID0gcGF0aC5yZWxhdGl2ZSh0YXJnZXRCYXNlTmFtZSwgZGlzdFBhdGgpXG5cbiAgICAgICAgICAgIGlmIChsb2NhbERlcGVuZGVuY3lQb29sLmhhcyhkZXBlbmRlbmN5KSkgcmV0dXJuXG4gICAgICAgICAgICBsb2NhbERlcGVuZGVuY3lQb29sLnNldChkZXBlbmRlbmN5LCBkZXBlbmRlbmN5KVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgZnVuY3Rpb24gdHJhdmVyc2VOcG1EZXBlbmRlbmN5IChkZXBlbmRlbmN5OiBzdHJpbmcpIHtcbiAgICAgICAgZGVwZW5kZW5jeVBvb2wuc2V0KGRlcGVuZGVuY3ksIGRlcGVuZGVuY3kpXG4gICAgICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB1dGlscy5jcmVhdGVGaWxlKGRlcGVuZGVuY3kpXG5cbiAgICAgICAgZmlsZS50YXJnZXRGaWxlID0gZmlsZS5zb3VyY2VGaWxlLnJlcGxhY2UoY29uZmlnLnNvdXJjZU5vZGVNb2R1bGVzLCBjb25maWcuZGlzdE5vZGVNb2R1bGVzKVxuICAgICAgICBhd2FpdCBjb21waWxlci5nZW5lcmF0ZUNvbXBpbGF0aW9uKGZpbGUpLnJ1bigpXG4gICAgfVxufVxuIiwiLy8gaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IHNhc3NQYXJzZXIgZnJvbSAnLi4vcGFyc2Vycy9zYXNzUGFyc2VyJ1xuaW1wb3J0IGZpbGVQYXJzZXIgZnJvbSAnLi4vcGFyc2Vycy9maWxlUGFyc2VyJ1xuaW1wb3J0IHN0eWxlUGFyc2VyIGZyb20gJy4uL3BhcnNlcnMvc3R5bGVQYXJzZXInXG5pbXBvcnQgYmFiZWxQYXJzZXIgZnJvbSAnLi4vcGFyc2Vycy9iYWJlbFBhcnNlcidcbmltcG9ydCBzY3JpcHRQYXJzZXIgZnJvbSAnLi4vcGFyc2Vycy9zY3JpcHRQYXJzZXInXG5pbXBvcnQgdGVtcGxhdGVQYXJzZXIgZnJvbSAnLi4vcGFyc2Vycy90ZW1wbGF0ZVBhcnNlcidcbmltcG9ydCBzYXZlRmlsZVBsdWdpbiBmcm9tICcuLi9wbHVnaW5zL3NhdmVGaWxlUGx1Z2luJ1xuaW1wb3J0IHd4SW1wb3J0UGx1Z2luIGZyb20gJy4uL3BsdWdpbnMvd3hJbXBvcnRQbHVnaW4nXG5pbXBvcnQgdHlwZXNjcmlwdFBhcnNlciBmcm9tICcuLi9wYXJzZXJzL3R5cGVzY3JpcHRQYXJzZXInXG5pbXBvcnQgZXh0cmFjdERlcGVuZGVuY3lQbHVnaW4gZnJvbSAnLi4vcGx1Z2lucy9leHRyYWN0RGVwZW5kZW5jeVBsdWdpbidcblxuaW1wb3J0IHtcbiAgICBJZ25vcmVkQ29uZmlncmF0aW9uLFxuICAgIFBhcnNlcnNDb25maWdyYXRpb24sXG4gICAgUGx1Z2luc0NvbmZpZ3JhdGlvblxufSBmcm9tICcuLi8uLi90eXBlcy90eXBlcydcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgICAgICAgICAgICAgICAgICBEYW5nZXIgem9uZVxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4vKipcbiAqIFRoZSBwYXRoIHdoZXJlIFdlQ2hhdCBtaW5pcHJvZ3JhbSBzb3VyY2UgZmlsZXMgZXhpc3QuXG4gKiBAZGVmYXVsdCAnLi9zcmMnXG4gKi9cbmV4cG9ydCBjb25zdCBzb3VyY2VEaXIgPSAnLi9zcmMnXG5cbi8qKlxuICogVGhlIHBhdGggd2hlcmUgV2VDaGF0IG1pbmlwcm9ncmFtIGNvbXBpbGVkIGZpbGVzIGV4aXN0LlxuICogQGRlZmF1bHQgJy4vZGlzdCdcbiAqL1xuZXhwb3J0IGNvbnN0IG91dHB1dERpciA9ICcuL2Rpc3QnXG5cbi8qKlxuICogVGhlIHBhdGggd2hlcmUgV2VDaGF0IG1pbmlwcm9ncmFtIHBhZ2VzIGV4aXN0LlxuICogQGRlZmF1bHQgJy4vc3JjL3BhZ2VzJ1xuICovXG5leHBvcnQgY29uc3QgcGFnZXMgPSAnLi9wYWdlcydcblxuLyoqXG4gKiBUaGUgcGF0aCB3aGVyZSBXZUNoYXQgbWluaXByb2dyYW0gY29tcG9uZW50cyBleGlzdC5cbiAqIEBkZWZhdWx0ICcuL3NyYy9jb21wb25lbnRzJ1xuICovXG5leHBvcnQgY29uc3QgY29tcG9uZW50cyA9ICcuL2NvbXBvbmVudHMnXG5cbi8qKlxuICogVGVtcGxhdGUgZm9yIGNyZWF0aW5nIHBhZ2UgYW5kIGNvbXBvbmVudC5cbiAqL1xuZXhwb3J0IGNvbnN0IHRlbXBsYXRlID0ge1xuICAgIHBhZ2U6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi90ZW1wbGF0ZS9wYWdlJyksXG4gICAgY29tcG9uZW50OiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vdGVtcGxhdGUvY29tcG9uZW50Jylcbn1cblxuLyoqXG4gKiBUaGUgcGF0aCB3aGVyZSBXZUNoYXQgbWluaXByb2dyYW0gc3VicGFja2FnZXMgZXhpc3QuXG4gKiBAZGVmYXVsdCAnLi9zcmMvc3ViUGFja2FnZXMnXG4gKi9cbmV4cG9ydCBjb25zdCBzdWJQYWNrYWdlcyA9ICcuL3N1YlBhY2thZ2VzJ1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICAgICAgICAgICAgICAgICBDdXN0b20gY29uZmlndXJlXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbi8qKlxuICogV2hldGhlciB0byBvdXRwdXQgY29tcGlsZSBpbmZvcm1hdGlvbi5cbiAqIEBkZWZhdWx0IGZhbHNlXG4gKi9cbmV4cG9ydCBjb25zdCBxdWlldCA9IGZhbHNlXG5cbi8qKlxuICogQW5rYSBkZXZlbG9wbWVudCBtb2RlLlxuICogQGRlZmF1bHQgZmFsc2VcbiAqL1xuZXhwb3J0IGNvbnN0IGRldk1vZGUgPSBmYWxzZVxuXG4vKipcbiAqIFJlZ2lzdGVyIGZpbGUgcGFyc2VyLlxuICovXG5leHBvcnQgY29uc3QgcGFyc2VyczogUGFyc2Vyc0NvbmZpZ3JhdGlvbiA9IFtcbiAgICB7XG4gICAgICAgIG1hdGNoOiAvLipcXC4oanN8ZXMpJC8sXG4gICAgICAgIHBhcnNlcnM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwYXJzZXI6IGJhYmVsUGFyc2VyLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IHt9XG4gICAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbWF0Y2g6IC8uKlxcLih3eHNzfGNzc3xwb3N0Y3NzKSQvLFxuICAgICAgICBwYXJzZXJzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGFyc2VyOiBzdHlsZVBhcnNlcixcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB7fVxuICAgICAgICAgICAgfVxuICAgICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG1hdGNoOiAvLipcXC4oc2Fzc3xzY3NzKSQvLFxuICAgICAgICBwYXJzZXJzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGFyc2VyOiBzYXNzUGFyc2VyLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IHt9XG4gICAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgbWF0Y2g6IC8uKlxcLih0c3x0eXBlc2NyaXB0KSQvLFxuICAgICAgICBwYXJzZXJzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGFyc2VyOiB0eXBlc2NyaXB0UGFyc2VyLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IHt9XG4gICAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICB9XG5dXG5cbi8qKlxuICogV2hldGhlciB0byBvdXRwdXQgZGVidWcgaW5mb3JtYXRpb24uXG4gKiBAZGVmYXVsdCBmYWxzZVxuICovXG5leHBvcnQgY29uc3QgZGVidWc6IGJvb2xlYW4gPSBmYWxzZVxuXG4vKipcbiAqIFJlZ2lzdGVyIHBsdWdpbi5cbiAqL1xuZXhwb3J0IGNvbnN0IHBsdWdpbnM6IFBsdWdpbnNDb25maWdyYXRpb24gPSBbXG4gICAge1xuICAgICAgICBwbHVnaW46IGV4dHJhY3REZXBlbmRlbmN5UGx1Z2luLFxuICAgICAgICBvcHRpb25zOiB7fVxuICAgIH0sXG4gICAge1xuICAgICAgICBwbHVnaW46IHd4SW1wb3J0UGx1Z2luLFxuICAgICAgICBvcHRpb25zOiB7fVxuICAgIH0sXG4gICAge1xuICAgICAgICBwbHVnaW46IHNhdmVGaWxlUGx1Z2luLFxuICAgICAgICBvcHRpb25zOiB7fVxuICAgIH1cbl1cblxuLyoqXG4gKiBGaWxlcyB0aGF0IHdpbGwgYmUgaWdub3JlZCBpbiBjb21waWxhdGlvbi5cbiAqL1xuZXhwb3J0IGNvbnN0IGlnbm9yZWQ6IElnbm9yZWRDb25maWdyYXRpb24gPSBbXVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICAgICAgICAgICAgICAgZXhwZXJpbWVudGFsIGNvbmZpZ3VyZVxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4iLCJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgcmVzb2x2ZUNvbmZpZyBmcm9tICcuLi91dGlscy9yZXNvbHZlQ29uZmlnJ1xuaW1wb3J0ICogYXMgYW5rYURlZmF1bHRDb25maWcgZnJvbSAnLi9hbmthRGVmYXVsdENvbmZpZydcblxuaW1wb3J0IHtcbiAgICBBbmthQ29uZmlnXG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5jb25zdCBjd2QgPSBwcm9jZXNzLmN3ZCgpXG5jb25zdCBjdXN0b21Db25maWcgPSA8QW5rYUNvbmZpZz5yZXNvbHZlQ29uZmlnKFsnYW5rYS5jb25maWcuanMnLCAnYW5rYS5jb25maWcuanNvbiddKVxuXG5mdW5jdGlvbiBtZXJnZUFycmF5IDxUPiAoLi4uYXJyczogQXJyYXk8VFtdPik6IEFycmF5PFQ+IHtcbiAgICByZXR1cm4gYXJycy5maWx0ZXIoYXJyID0+IGFyciAmJiBhcnIubGVuZ3RoKS5yZWR1Y2UoKHByZXYsIG5leHQpID0+IHtcbiAgICAgICAgcmV0dXJuIHByZXYuY29uY2F0KG5leHQpXG4gICAgfSwgW10pXG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICAuLi5hbmthRGVmYXVsdENvbmZpZyxcbiAgICAuLi5jdXN0b21Db25maWcsXG4gICAgdGVtcGxhdGU6IGN1c3RvbUNvbmZpZy50ZW1wbGF0ZSA/IHtcbiAgICAgICAgcGFnZTogcGF0aC5qb2luKGN3ZCwgY3VzdG9tQ29uZmlnLnRlbXBsYXRlLnBhZ2UpLFxuICAgICAgICBjb21wb25lbnQ6IHBhdGguam9pbihjd2QsIGN1c3RvbUNvbmZpZy50ZW1wbGF0ZS5jb21wb25lbnQpXG4gICAgfSA6IGFua2FEZWZhdWx0Q29uZmlnLnRlbXBsYXRlLFxuICAgIHBhcnNlcnM6IG1lcmdlQXJyYXkoY3VzdG9tQ29uZmlnLnBhcnNlcnMsIGFua2FEZWZhdWx0Q29uZmlnLnBhcnNlcnMpLFxuICAgIHBsdWdpbnM6IG1lcmdlQXJyYXkoY3VzdG9tQ29uZmlnLnBsdWdpbnMsIGFua2FEZWZhdWx0Q29uZmlnLnBsdWdpbnMpLFxuICAgIGlnbm9yZWQ6IG1lcmdlQXJyYXkoY3VzdG9tQ29uZmlnLmlnbm9yZWQsIGFua2FEZWZhdWx0Q29uZmlnLmlnbm9yZWQpXG59XG4iLCJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgYW5rYUNvbmZpZyBmcm9tICcuL2Fua2FDb25maWcnXG5cbmV4cG9ydCBjb25zdCBjd2QgPSBwcm9jZXNzLmN3ZCgpXG5leHBvcnQgY29uc3Qgc3JjRGlyID0gcGF0aC5yZXNvbHZlKGN3ZCwgYW5rYUNvbmZpZy5zb3VyY2VEaXIpXG5leHBvcnQgY29uc3QgZGlzdERpciA9IHBhdGgucmVzb2x2ZShjd2QsIGFua2FDb25maWcub3V0cHV0RGlyKVxuZXhwb3J0IGNvbnN0IGFua2FNb2R1bGVzID0gcGF0aC5yZXNvbHZlKHNyY0RpciwgJ2Fua2FfbW9kdWxlcycpXG5leHBvcnQgY29uc3Qgc291cmNlTm9kZU1vZHVsZXMgPSBwYXRoLnJlc29sdmUoY3dkLCAnbm9kZV9tb2R1bGVzJylcbmV4cG9ydCBjb25zdCBkaXN0Tm9kZU1vZHVsZXMgPSBwYXRoLnJlc29sdmUoZGlzdERpciwgJ25wbV9tb2R1bGVzJylcbmV4cG9ydCBjb25zdCBkZWZhdWx0U2NhZmZvbGQgPSAgJ2lFeGNlcHRpb24vYW5rYS1xdWlja3N0YXJ0J1xuIiwiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnXG5pbXBvcnQgYW5rYUNvbmZpZyBmcm9tICcuL2Fua2FDb25maWcnXG5pbXBvcnQgKiBhcyBzeXN0ZW0gZnJvbSAnLi9zeXN0ZW1Db25maWcnXG5pbXBvcnQgcmVzb2x2ZUNvbmZpZyBmcm9tICcuLi91dGlscy9yZXNvbHZlQ29uZmlnJ1xuXG5jb25zdCBjdXN0b21Db25maWcgPSByZXNvbHZlQ29uZmlnKFsnYXBwLmpzb24nXSwgc3lzdGVtLnNyY0RpcilcblxuZXhwb3J0IGRlZmF1bHQgT2JqZWN0LmFzc2lnbih7XG4gICAgcGFnZXM6IFtdLFxuICAgIHN1YlBhY2thZ2VzOiBbXSxcbiAgICB3aW5kb3c6IHtcbiAgICAgICAgbmF2aWdhdGlvbkJhclRpdGxlVGV4dDogJ1dlY2hhdCdcbiAgICB9XG4gICAgLy8gdGFiQmFyOiB7XG4gICAgLy8gICAgIGxpc3Q6IFtdXG4gICAgLy8gfSxcbn0sIGN1c3RvbUNvbmZpZylcbiIsImltcG9ydCAqIGFzIHN5c3RlbUNvbmZpZyBmcm9tICcuL3N5c3RlbUNvbmZpZydcbmltcG9ydCBhbmthQ29uZmlnIGZyb20gJy4vYW5rYUNvbmZpZydcbmltcG9ydCBwcm9qZWN0Q29uZmlnIGZyb20gJy4vcHJvamVjdENvbmZpZydcblxuZXhwb3J0IGRlZmF1bHQge1xuICAgIC4uLnN5c3RlbUNvbmZpZyxcbiAgICBhbmthQ29uZmlnLFxuICAgIHByb2plY3RDb25maWdcbn1cbiIsImltcG9ydCAqIGFzIEdsb2IgZnJvbSAnZ2xvYidcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJ1xuY29uc3QgZ2xvYiA9IHJlcXVpcmUoJ2dsb2InKVxuXG5pbXBvcnQge1xuICAgIENvbnRlbnRcbn0gZnJvbSAnLi4vLi4vdHlwZXMvdHlwZXMnXG5cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRGaWxlIChzb3VyY2VGaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxCdWZmZXI+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBmcy5yZWFkRmlsZShzb3VyY2VGaWxlUGF0aCwgKGVyciwgYnVmZmVyKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShidWZmZXIpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlRmlsZSAodGFyZ2V0RmlsZVBhdGg6IHN0cmluZywgY29udGVudDogQ29udGVudCk6IFByb21pc2U8dW5kZWZpbmVkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgZnMud3JpdGVGaWxlKHRhcmdldEZpbGVQYXRoLCBjb250ZW50LCBlcnIgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZWFyY2hGaWxlcyAoc2NoZW1lOiBzdHJpbmcsIG9wdGlvbnM/OiBHbG9iLklPcHRpb25zKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGdsb2Ioc2NoZW1lLCBvcHRpb25zLCAoZXJyOiAoRXJyb3IgfCBudWxsKSwgZmlsZXM6IEFycmF5PHN0cmluZz4pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKGZpbGVzKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0pXG59XG4iLCJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSdcbmltcG9ydCBjb25maWcgZnJvbSAnLi4vLi4vY29uZmlnJ1xuaW1wb3J0ICogYXMgdCBmcm9tICdAYmFiZWwvdHlwZXMnXG5pbXBvcnQgKiBhcyBQb3N0Q1NTIGZyb20gJ3Bvc3Rjc3MnXG5pbXBvcnQge1xuICAgIENvbnRlbnQsXG4gICAgRmlsZUNvbnN0cnVjdG9yT3B0aW9uXG59IGZyb20gJy4uLy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5jb25zdCByZXBsYWNlRXh0ID0gcmVxdWlyZSgncmVwbGFjZS1leHQnKVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGaWxlIHtcbiAgICBwdWJsaWMgc291cmNlRmlsZTogc3RyaW5nXG4gICAgcHVibGljIGNvbnRlbnQ6IENvbnRlbnRcbiAgICBwdWJsaWMgdGFyZ2V0RmlsZTogc3RyaW5nXG4gICAgcHVibGljIGFzdD86IHQuTm9kZSB8IFBvc3RDU1MuUmVzdWx0XG4gICAgcHVibGljIHNvdXJjZU1hcD86IENvbnRlbnRcbiAgICBwdWJsaWMgaXNJblNyY0Rpcj86IGJvb2xlYW5cblxuICAgIGNvbnN0cnVjdG9yIChvcHRpb246IEZpbGVDb25zdHJ1Y3Rvck9wdGlvbikge1xuICAgICAgICBjb25zdCBpc0luU3JjRGlyVGVzdCA9IG5ldyBSZWdFeHAoYF4ke2NvbmZpZy5zcmNEaXJ9YClcblxuICAgICAgICBpZiAoIW9wdGlvbi5zb3VyY2VGaWxlKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgdmFsdWU6IEZpbGVDb25zdHJ1Y3Rvck9wdGlvbi5zb3VyY2VGaWxlJylcbiAgICAgICAgaWYgKCFvcHRpb24uY29udGVudCkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHZhbHVlOiBGaWxlQ29uc3RydWN0b3JPcHRpb24uY29udGVudCcpXG5cbiAgICAgICAgdGhpcy5zb3VyY2VGaWxlID0gb3B0aW9uLnNvdXJjZUZpbGVcbiAgICAgICAgdGhpcy50YXJnZXRGaWxlID0gb3B0aW9uLnRhcmdldEZpbGUgfHwgb3B0aW9uLnNvdXJjZUZpbGUucmVwbGFjZShjb25maWcuc3JjRGlyLCBjb25maWcuZGlzdERpcikgLy8gRGVmYXVsdCB2YWx1ZVxuICAgICAgICB0aGlzLmNvbnRlbnQgPSBvcHRpb24uY29udGVudFxuICAgICAgICB0aGlzLnNvdXJjZU1hcCA9IG9wdGlvbi5zb3VyY2VNYXBcbiAgICAgICAgdGhpcy5pc0luU3JjRGlyID0gaXNJblNyY0RpclRlc3QudGVzdCh0aGlzLnNvdXJjZUZpbGUpXG4gICAgfVxuXG4gICAgZ2V0IGRpcm5hbWUgKCkge1xuICAgICAgICByZXR1cm4gcGF0aC5kaXJuYW1lKHRoaXMudGFyZ2V0RmlsZSlcbiAgICB9XG5cbiAgICBnZXQgYmFzZW5hbWUgKCkge1xuICAgICAgICByZXR1cm4gcGF0aC5iYXNlbmFtZSh0aGlzLnRhcmdldEZpbGUpXG4gICAgfVxuXG4gICAgZ2V0IGV4dG5hbWUgKCkge1xuICAgICAgICByZXR1cm4gcGF0aC5leHRuYW1lKHRoaXMudGFyZ2V0RmlsZSlcbiAgICB9XG5cbiAgICBhc3luYyBzYXZlVG8gKHBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCBmcy5lbnN1cmVGaWxlKHBhdGgpXG5cbiAgICAgICAgaWYgKCFwYXRoKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgcGF0aCcpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1cGRhdGVFeHQgKGV4dDogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIHRoaXMudGFyZ2V0RmlsZSA9IHJlcGxhY2VFeHQodGhpcy50YXJnZXRGaWxlLCBleHQpXG4gICAgfVxuXG4gICAgY29udmVydENvbnRlbnRUb1N0cmluZyAoKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbnRlbnQgaW5zdGFuY2VvZiBCdWZmZXIpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGVudCA9IHRoaXMuY29udGVudC50b1N0cmluZygpXG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJpbXBvcnQge1xuICAgIHJlYWRGaWxlXG59IGZyb20gJy4vZnMnXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSdcbmltcG9ydCBGaWxlIGZyb20gJy4uL2NvcmUvY2xhc3MvRmlsZSdcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUZpbGUgKHNvdXJjZUZpbGU6IHN0cmluZyk6IFByb21pc2U8RmlsZT4ge1xuICAgIHJldHVybiByZWFkRmlsZShzb3VyY2VGaWxlKS50aGVuKGNvbnRlbnQgPT4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5ldyBGaWxlKHtcbiAgICAgICAgICAgIHNvdXJjZUZpbGUsXG4gICAgICAgICAgICBjb250ZW50XG4gICAgICAgIH0pKVxuICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVGaWxlU3luYyAoc291cmNlRmlsZTogc3RyaW5nKSB7XG4gICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhzb3VyY2VGaWxlKVxuICAgIHJldHVybiBuZXcgRmlsZSh7XG4gICAgICAgIHNvdXJjZUZpbGUsXG4gICAgICAgIGNvbnRlbnRcbiAgICB9KVxufVxuIiwiaW1wb3J0IHsgT3B0aW9ucyBhcyBUZW1wbGF0ZU9wdGlvbnMgfSBmcm9tICdlanMnXG5pbXBvcnQgeyBtZW1Gc0VkaXRvciBhcyBNZW1Gc0VkaXRvciB9IGZyb20gJ21lbS1mcy1lZGl0b3InXG5cbmNvbnN0IG1lbUZzID0gcmVxdWlyZSgnbWVtLWZzJylcbmNvbnN0IG1lbUZzRWRpdG9yID0gcmVxdWlyZSgnbWVtLWZzLWVkaXRvcicpXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZzRWRpdG9yIHtcbiAgICBlZGl0b3I6IE1lbUZzRWRpdG9yLkVkaXRvclxuXG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBjb25zdCBzdG9yZSA9IG1lbUZzLmNyZWF0ZSgpXG5cbiAgICAgICAgdGhpcy5lZGl0b3IgPSBtZW1Gc0VkaXRvci5jcmVhdGUoc3RvcmUpXG4gICAgfVxuXG4gICAgY29weSAoZnJvbTogc3RyaW5nLCB0bzogc3RyaW5nLCBjb250ZXh0OiBvYmplY3QsIHRlbXBsYXRlT3B0aW9ucz86IFRlbXBsYXRlT3B0aW9ucywgY29weU9wdGlvbnM/OiBNZW1Gc0VkaXRvci5Db3B5T3B0aW9ucyk6IHZvaWQge1xuICAgICAgICB0aGlzLmVkaXRvci5jb3B5VHBsKGZyb20sIHRvLCBjb250ZXh0LCB0ZW1wbGF0ZU9wdGlvbnMsIGNvcHlPcHRpb25zKVxuICAgIH1cblxuICAgIHdyaXRlIChmaWxlcGF0aDogc3RyaW5nLCBjb250ZW50czogTWVtRnNFZGl0b3IuQ29udGVudHMpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5lZGl0b3Iud3JpdGUoZmlsZXBhdGgsIGNvbnRlbnRzKVxuICAgIH1cblxuICAgIHdyaXRlSlNPTiAoZmlsZXBhdGg6IHN0cmluZywgY29udGVudHM6IGFueSwgcmVwbGFjZXI/OiBNZW1Gc0VkaXRvci5SZXBsYWNlckZ1bmMsIHNwYWNlPzogTWVtRnNFZGl0b3IuU3BhY2UpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5lZGl0b3Iud3JpdGVKU09OKGZpbGVwYXRoLCBjb250ZW50cywgcmVwbGFjZXIgfHwgbnVsbCwgc3BhY2UgPSA0KVxuICAgIH1cblxuICAgIHJlYWQgKGZpbGVwYXRoOiBzdHJpbmcsIG9wdGlvbnM/OiB7IHJhdzogYm9vbGVhbiwgZGVmYXVsdHM6IHN0cmluZyB9KTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWRpdG9yLnJlYWQoZmlsZXBhdGgsIG9wdGlvbnMpXG4gICAgfVxuXG4gICAgcmVhZEpTT04gKGZpbGVwYXRoOiBzdHJpbmcsIGRlZmF1bHRzPzogYW55KTogdm9pZCB7XG4gICAgICAgIHRoaXMuZWRpdG9yLnJlYWRKU09OKGZpbGVwYXRoLCBkZWZhdWx0cylcbiAgICB9XG5cbiAgICBzYXZlICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICB0aGlzLmVkaXRvci5jb21taXQocmVzb2x2ZSlcbiAgICAgICAgfSlcbiAgICB9XG59XG4iLCJpbXBvcnQgbG9nIGZyb20gJy4vbG9nZ2VyJ1xuaW1wb3J0IGFua2FDb25maWcgZnJvbSAnLi4vY29uZmlnL2Fua2FDb25maWcnXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChpZDogc3RyaW5nLCBvcHRpb25zPzogeyBwYXRocz86IHN0cmluZ1tdIH0pOiBzdHJpbmcge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiByZXF1aXJlLnJlc29sdmUoaWQsIG9wdGlvbnMpXG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGxvZy5lcnJvcignTWlzc2luZyBkZXBlbmRlbmN5JywgaWQsICFhbmthQ29uZmlnLnF1aWV0ID8gYGluICR7b3B0aW9ucy5wYXRoc31gIDogbnVsbClcbiAgICB9XG59XG4iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjYWxsUHJvbWlzZUluQ2hhaW4gKGxpc3Q6IEFycmF5PCguLi5wYXJhbXM6IGFueVtdKSA9PiBQcm9taXNlPGFueT4+ID0gW10sIC4uLnBhcmFtczogQXJyYXk8YW55Pik6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGlmICghbGlzdC5sZW5ndGgpICB7XG4gICAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIGxldCBzdGVwID0gbGlzdFswXSguLi5wYXJhbXMpXG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBzdGVwID0gc3RlcC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGlzdFtpXSguLi5wYXJhbXMpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgc3RlcC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgfSwgZXJyID0+IHtcbiAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgIH0pXG4gICAgfSlcbn1cbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChmbjogRnVuY3Rpb24pOiAoKSA9PiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKC4uLnBhcmFtczogQXJyYXk8YW55Pikge1xuICAgICAgICBjb25zdCBsaW1pdGF0aW9uID0gcGFyYW1zLmxlbmd0aFxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIGlmIChmbi5sZW5ndGggPiBsaW1pdGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgZm4oLi4ucGFyYW1zLCByZXNvbHZlKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKGZuKC4uLnBhcmFtcykpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgY2hva2lkYXIgZnJvbSAnY2hva2lkYXInXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChkaXI6IHN0cmluZyB8IHN0cmluZ1tdLCBvcHRpb25zPzogY2hva2lkYXIuV2F0Y2hPcHRpb25zKTogY2hva2lkYXIuRlNXYXRjaGVyIHtcbiAgICByZXR1cm4gY2hva2lkYXIud2F0Y2goZGlyLCB7XG4gICAgICAgIHBlcnNpc3RlbnQ6IHRydWUsXG4gICAgICAgIGlnbm9yZUluaXRpYWw6IHRydWUsXG4gICAgICAgIC4uLm9wdGlvbnNcbiAgICB9KVxufVxuIiwiZGVjbGFyZSB0eXBlIFZhbGlkYXRlTnBtUGFja2FnZU5hbWUgPSB7XG4gICAgdmFsaWRGb3JOZXdQYWNrYWdlczogYm9vbGVhbixcbiAgICB2YWxpZEZvck9sZFBhY2thZ2VzOiBib29sZWFuXG59XG5cbmNvbnN0IHZhbGlkYXRlID0gcmVxdWlyZSgndmFsaWRhdGUtbnBtLXBhY2thZ2UtbmFtZScpXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChyZXF1aXJlZDogc3RyaW5nID0gJycpOiBib29sZWFuIHtcbiAgICBjb25zdCByZXN1bHQgPSA8VmFsaWRhdGVOcG1QYWNrYWdlTmFtZT52YWxpZGF0ZShyZXF1aXJlZClcblxuICAgIHJldHVybiByZXN1bHQudmFsaWRGb3JOZXdQYWNrYWdlcyB8fCByZXN1bHQudmFsaWRGb3JPbGRQYWNrYWdlc1xufVxuIiwiaW1wb3J0IGRvd25sb2FkUmVwbyBmcm9tICdkb3dubG9hZC1naXQtcmVwbydcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKHJlcG86IHN0cmluZywgcGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgZG93bmxvYWRSZXBvKHJlcG8sIHBhdGgsIHsgY2xvbmU6IGZhbHNlIH0sIChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICBlcnIgPyByZWplY3QoZXJyKSA6IHJlc29sdmUoKVxuICAgICAgICB9KVxuICAgIH0pXG59XG4iLCJpbXBvcnQgQ29tcGlsZXIgZnJvbSAnLi9Db21waWxlcidcbmltcG9ydCBjb25maWcgZnJvbSAnLi4vLi4vY29uZmlnJ1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vLi4vdXRpbHMnXG5cbmltcG9ydCB7XG4gICAgVXRpbHMsXG4gICAgQW5rYUNvbmZpZyxcbiAgICBQYXJzZXJPcHRpb25zLFxuICAgIFByb2plY3RDb25maWcsXG4gICAgUGx1Z2luSGFuZGxlcixcbiAgICBQbHVnaW5PcHRpb25zLFxuICAgIENvbXBpbGVyQ29uZmlnXG59IGZyb20gJy4uLy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgSW5qZWN0aW9uIHtcbiAgICBjb21waWxlcjogQ29tcGlsZXJcbiAgICBvcHRpb25zOiBvYmplY3RcblxuICAgIGNvbnN0cnVjdG9yIChjb21waWxlcjogQ29tcGlsZXIsIG9wdGlvbnM/OiBvYmplY3QpIHtcbiAgICAgICAgdGhpcy5jb21waWxlciA9IGNvbXBpbGVyXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnNcbiAgICB9XG5cbiAgICBhYnN0cmFjdCBnZXRPcHRpb25zICgpOiBvYmplY3RcblxuICAgIGdldENvbXBpbGVyICgpOiBDb21waWxlciB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbXBpbGVyXG4gICAgfVxuXG4gICAgZ2V0VXRpbHMgKCkge1xuICAgICAgICByZXR1cm4gdXRpbHNcbiAgICB9XG5cbiAgICBnZXRBbmthQ29uZmlnICgpOiBBbmthQ29uZmlnIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5hbmthQ29uZmlnXG4gICAgfVxuXG4gICAgZ2V0U3lzdGVtQ29uZmlnICgpOiBDb21waWxlckNvbmZpZyB7XG4gICAgICAgIHJldHVybiBjb25maWdcbiAgICB9XG5cbiAgICBnZXRQcm9qZWN0Q29uZmlnICgpOiBQcm9qZWN0Q29uZmlnIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5wcm9qZWN0Q29uZmlnXG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgUGx1Z2luSW5qZWN0aW9uIGV4dGVuZHMgSW5qZWN0aW9uIHtcblxuICAgIGNvbnN0cnVjdG9yIChjb21waWxlcjogQ29tcGlsZXIsIG9wdGlvbnM6IFBsdWdpbk9wdGlvbnNbJ29wdGlvbnMnXSkge1xuICAgICAgICBzdXBlcihjb21waWxlciwgb3B0aW9ucylcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gUGx1Z2luIG9wdGlvbnNcbiAgICAgKi9cbiAgICBnZXRPcHRpb25zICgpOiBvYmplY3Qge1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zIHx8IHt9XG4gICAgfVxuXG4gICAgb24gKGV2ZW50OiBzdHJpbmcsIGhhbmRsZXI6IFBsdWdpbkhhbmRsZXIpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jb21waWxlci5vbihldmVudCwgaGFuZGxlcilcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBQYXJzZXJJbmplY3Rpb24gZXh0ZW5kcyBJbmplY3Rpb24ge1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIFBhcnNlck9wdGlvbnNcbiAgICAgKi9cbiAgICBnZXRPcHRpb25zICgpOiBvYmplY3Qge1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zIHx8IHt9XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IgKGNvbXBpbGVyOiBDb21waWxlciwgb3B0aW9uczogUGFyc2VyT3B0aW9uc1snb3B0aW9ucyddKSB7XG4gICAgICAgIHN1cGVyKGNvbXBpbGVyLCBvcHRpb25zKVxuICAgIH1cbn1cbiIsImltcG9ydCBGaWxlIGZyb20gJy4vRmlsZSdcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBjb25maWcgZnJvbSAnLi4vLi4vY29uZmlnJ1xuaW1wb3J0IENvbXBpbGVyIGZyb20gJy4vQ29tcGlsZXInXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi8uLi91dGlscydcblxuaW1wb3J0IHtcbiAgICBQYXJzZXIsXG4gICAgTWF0Y2hlcixcbiAgICBQbHVnaW5IYW5kbGVyLFxuICAgIFBsdWdpbk9wdGlvbnMsXG4gICAgQ29tcGlsZXJDb25maWdcbn0gZnJvbSAnLi4vLi4vLi4vdHlwZXMvdHlwZXMnXG5cbi8qKlxuICogQSBjb21waWxhdGlvbiB0YXNrXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbXBpbGF0aW9uIHtcbiAgICBjb25maWc6IENvbXBpbGVyQ29uZmlnXG4gICAgcmVhZG9ubHkgY29tcGlsZXI6IENvbXBpbGVyXG4gICAgaWQ6IG51bWJlciAgICAgICAgLy8gVW5pcXVl77yMZm9yIGVhY2ggQ29tcGlsYXRpb25cbiAgICBmaWxlOiBGaWxlXG4gICAgc291cmNlRmlsZTogc3RyaW5nXG4gICAgZGVzdHJveWVkOiBib29sZWFuXG5cbiAgICBjb25zdHJ1Y3RvciAoZmlsZTogRmlsZSB8IHN0cmluZywgY29uZjogQ29tcGlsZXJDb25maWcsIGNvbXBpbGVyOiBDb21waWxlcikge1xuICAgICAgICB0aGlzLmNvbXBpbGVyID0gY29tcGlsZXJcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25mXG4gICAgICAgIHRoaXMuaWQgPSBDb21waWxlci5jb21waWxhdGlvbklkKytcblxuICAgICAgICBpZiAoZmlsZSBpbnN0YW5jZW9mIEZpbGUpIHtcbiAgICAgICAgICAgIHRoaXMuZmlsZSA9IGZpbGVcbiAgICAgICAgICAgIHRoaXMuc291cmNlRmlsZSA9IGZpbGUuc291cmNlRmlsZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zb3VyY2VGaWxlID0gZmlsZVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5lbnJvbGwoKVxuICAgIH1cblxuICAgIGFzeW5jIHJ1biAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmxvYWRGaWxlKClcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuaW52b2tlUGFyc2VycygpXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGUoKVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB1dGlscy5sb2dnZXIuZXJyb3IoJ0NvbXBpbGUnLCBlLm1lc3NhZ2UsIGUpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBsb2FkRmlsZSAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICh0aGlzLmRlc3Ryb3llZCkgcmV0dXJuXG5cbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlci5lbWl0KCdiZWZvcmUtbG9hZC1maWxlJywgdGhpcylcbiAgICAgICAgaWYgKCEodGhpcy5maWxlIGluc3RhbmNlb2YgRmlsZSkpIHtcbiAgICAgICAgICAgIHRoaXMuZmlsZSA9IGF3YWl0IHV0aWxzLmNyZWF0ZUZpbGUodGhpcy5zb3VyY2VGaWxlKVxuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlci5lbWl0KCdhZnRlci1sb2FkLWZpbGUnLCB0aGlzKVxuICAgIH1cblxuICAgIGFzeW5jIGludm9rZVBhcnNlcnMgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBpZiAodGhpcy5kZXN0cm95ZWQpIHJldHVyblxuXG4gICAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLmZpbGVcbiAgICAgICAgY29uc3QgcGFyc2VycyA9IDxQYXJzZXJbXT50aGlzLmNvbXBpbGVyLnBhcnNlcnMuZmlsdGVyKChtYXRjaGVyczogTWF0Y2hlcikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoZXJzLm1hdGNoLnRlc3QoZmlsZS5zb3VyY2VGaWxlKVxuICAgICAgICB9KS5tYXAoKG1hdGNoZXJzOiBNYXRjaGVyKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hlcnMucGFyc2Vyc1xuICAgICAgICB9KS5yZWR1Y2UoKHByZXYsIG5leHQpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBwcmV2LmNvbmNhdChuZXh0KVxuICAgICAgICB9LCBbXSlcbiAgICAgICAgY29uc3QgdGFza3MgPSBwYXJzZXJzLm1hcChwYXJzZXIgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHV0aWxzLmFzeW5jRnVuY3Rpb25XcmFwcGVyKHBhcnNlcilcbiAgICAgICAgfSlcblxuICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGVyLmVtaXQoJ2JlZm9yZS1wYXJzZScsIHRoaXMpXG4gICAgICAgIGF3YWl0IHV0aWxzLmNhbGxQcm9taXNlSW5DaGFpbih0YXNrcywgZmlsZSwgdGhpcylcbiAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlci5lbWl0KCdhZnRlci1wYXJzZScsIHRoaXMpXG4gICAgfVxuXG4gICAgYXN5bmMgY29tcGlsZSAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICh0aGlzLmRlc3Ryb3llZCkgcmV0dXJuXG5cbiAgICAgICAgLy8gSW52b2tlIEV4dHJhY3REZXBlbmRlbmN5UGx1Z2luLlxuICAgICAgICBhd2FpdCB0aGlzLmNvbXBpbGVyLmVtaXQoJ2JlZm9yZS1jb21waWxlJywgdGhpcylcbiAgICAgICAgLy8gRG8gc29tZXRoaW5nIGVsc2UuXG4gICAgICAgIGF3YWl0IHRoaXMuY29tcGlsZXIuZW1pdCgnYWZ0ZXItY29tcGlsZScsIHRoaXMpXG4gICAgICAgIGF3YWl0IHRoaXMuY29tcGlsZXIuZW1pdCgnc2F2ZScsIHRoaXMpXG4gICAgICAgICF0aGlzLmNvbmZpZy5hbmthQ29uZmlnLnF1aWV0ICYmICB1dGlscy5sb2dnZXIuaW5mbygnQ29tcGlsZScsICB0aGlzLmZpbGUuc291cmNlRmlsZS5yZXBsYWNlKGAke2NvbmZpZy5jd2R9JHtwYXRoLnNlcH1gLCAnJykpXG4gICAgICAgIHRoaXMuZGVzdHJveSgpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXIgb24gQ29tcGlsZXIgYW5kIGRlc3Ryb3kgdGhlIHByZXZpb3VzIG9uZSBpZiBjb25mbGljdCBhcmlzZXMuXG4gICAgICovXG4gICAgZW5yb2xsICgpOiB2b2lkIHtcbiAgICAgICAgY29uc3Qgb2xkQ29tcGlsYXRpb24gPSBDb21waWxlci5jb21waWxhdGlvblBvb2wuZ2V0KHRoaXMuc291cmNlRmlsZSlcblxuICAgICAgICBpZiAob2xkQ29tcGlsYXRpb24pIHtcbiAgICAgICAgICAgIGlmIChjb25maWcuYW5rYUNvbmZpZy5kZWJ1ZykgY29uc29sZS5sb2coJ1xiRGVzdHJveSBDb21waWxhdGlvbicsIG9sZENvbXBpbGF0aW9uLmlkLCBvbGRDb21waWxhdGlvbi5zb3VyY2VGaWxlKVxuXG4gICAgICAgICAgICBvbGRDb21waWxhdGlvbi5kZXN0cm95KClcbiAgICAgICAgfVxuICAgICAgICBDb21waWxlci5jb21waWxhdGlvblBvb2wuc2V0KHRoaXMuc291cmNlRmlsZSwgdGhpcylcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVbnJlZ2lzdGVyIHRoZW1zZWx2ZXMgZnJvbSBDb21waWxlci5cbiAgICAgKi9cbiAgICBkZXN0cm95ICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5kZXN0cm95ZWQgPSB0cnVlXG4gICAgICAgIENvbXBpbGVyLmNvbXBpbGF0aW9uUG9vbC5kZWxldGUodGhpcy5zb3VyY2VGaWxlKVxuICAgIH1cbn1cbiIsImltcG9ydCB7XG4gICAgUGFyc2VySW5qZWN0aW9uLFxuICAgIFBsdWdpbkluamVjdGlvblxufSBmcm9tICcuL0luamVjdGlvbidcbmltcG9ydCBGaWxlIGZyb20gJy4vRmlsZSdcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJ1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuLi8uLi9jb25maWcnXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi8uLi91dGlscydcbmltcG9ydCBDb21waWxhdGlvbiBmcm9tICcuL0NvbXBpbGF0aW9uJ1xuaW1wb3J0IGNhbGxQcm9taXNlSW5DaGFpbiBmcm9tICcuLi8uLi91dGlscy9jYWxsUHJvbWlzZUluQ2hhaW4nXG5pbXBvcnQgYXN5bmNGdW5jdGlvbldyYXBwZXIgZnJvbSAnLi4vLi4vdXRpbHMvYXN5bmNGdW5jdGlvbldyYXBwZXInXG5cbmltcG9ydCB7XG4gICAgUGFyc2VyLFxuICAgIFBhcnNlck9wdGlvbnMsXG4gICAgUGx1Z2luSGFuZGxlcixcbiAgICBQbHVnaW5PcHRpb25zLFxuICAgIENvbXBpbGVyQ29uZmlnXG59IGZyb20gJy4uLy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5jb25zdCB7IGxvZ2dlciB9ID0gdXRpbHNcbmNvbnN0IGRlbCA9IHJlcXVpcmUoJ2RlbCcpXG5cbi8qKlxuICogVGhlIGNvcmUgY29tcGlsZXIuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbXBpbGVyIHtcbiAgICByZWFkb25seSBjb25maWc6IENvbXBpbGVyQ29uZmlnXG4gICAgcHVibGljIHN0YXRpYyBjb21waWxhdGlvbklkID0gMVxuICAgIHB1YmxpYyBzdGF0aWMgY29tcGlsYXRpb25Qb29sID0gbmV3IE1hcDxzdHJpbmcsIENvbXBpbGF0aW9uPigpXG4gICAgcGx1Z2luczoge1xuICAgICAgICBbZXZlbnROYW1lOiBzdHJpbmddOiBBcnJheTxQbHVnaW5IYW5kbGVyPlxuICAgIH0gPSB7XG4gICAgICAgICdiZWZvcmUtbG9hZC1maWxlJzogW10sXG4gICAgICAgICdhZnRlci1sb2FkLWZpbGUnOiBbXSxcbiAgICAgICAgJ2JlZm9yZS1wYXJzZSc6IFtdLFxuICAgICAgICAnYWZ0ZXItcGFyc2UnOiBbXSxcbiAgICAgICAgJ2JlZm9yZS1jb21waWxlJzogW10sXG4gICAgICAgICdhZnRlci1jb21waWxlJzogW10sXG4gICAgICAgICdzYXZlJzogW11cbiAgICB9XG4gICAgcGFyc2VyczogQXJyYXk8e1xuICAgICAgICBtYXRjaDogUmVnRXhwLFxuICAgICAgICBwYXJzZXJzOiBBcnJheTxQYXJzZXI+XG4gICAgfT4gPSBbXVxuXG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZ1xuICAgICAgICB0aGlzLmluaXRQYXJzZXJzKClcbiAgICAgICAgdGhpcy5pbml0UGx1Z2lucygpXG5cbiAgICAgICAgaWYgKGNvbmZpZy5hbmthQ29uZmlnLmRlYnVnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh0aGlzLmNvbmZpZywgKGtleSwgdmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBGdW5jdGlvbikgcmV0dXJuICdbRnVuY3Rpb25dJ1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZVxuICAgICAgICAgICAgfSwgNCkpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlciBQbHVnaW4uXG4gICAgICogQHBhcmFtIGV2ZW50XG4gICAgICogQHBhcmFtIGhhbmRsZXJcbiAgICAgKi9cbiAgICBvbiAoZXZlbnQ6IHN0cmluZywgaGFuZGxlcjogUGx1Z2luSGFuZGxlcik6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5wbHVnaW5zW2V2ZW50XSA9PT0gdm9pZCAoMCkpIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBob29rOiAke2V2ZW50fWApXG4gICAgICAgIHRoaXMucGx1Z2luc1tldmVudF0ucHVzaChoYW5kbGVyKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEludm9rZSBsaWZlY3ljbGUgaG9va3MoUHJvbWlzZSBjaGFpbmluZykuXG4gICAgICogQHBhcmFtIGV2ZW50XG4gICAgICogQHBhcmFtIGNvbXBpbGF0aW9uXG4gICAgICovXG4gICAgYXN5bmMgZW1pdCAoZXZlbnQ6IHN0cmluZywgY29tcGlsYXRpb246IENvbXBpbGF0aW9uKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKGNvbXBpbGF0aW9uLmRlc3Ryb3llZCkgcmV0dXJuXG5cbiAgICAgICAgY29uc3QgcGx1Z2lucyA9IHRoaXMucGx1Z2luc1tldmVudF1cblxuICAgICAgICBpZiAoIXBsdWdpbnMgfHwgIXBsdWdpbnMubGVuZ3RoKSByZXR1cm5cblxuICAgICAgICBjb25zdCB0YXNrcyA9IHBsdWdpbnMubWFwKHBsdWdpbiA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYXN5bmNGdW5jdGlvbldyYXBwZXIocGx1Z2luKVxuICAgICAgICB9KVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBjYWxsUHJvbWlzZUluQ2hhaW4odGFza3MsIGNvbXBpbGF0aW9uKVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB1dGlscy5sb2dnZXIuZXJyb3IoJ0NvbXBpbGUnLCBlLm1lc3NhZ2UsIGUpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDbGVhbiBkaXN0IGRpcmVjdG9yeS5cbiAgICAgKi9cbiAgICBhc3luYyBjbGVhbiAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGF3YWl0IGRlbChbXG4gICAgICAgICAgICBwYXRoLmpvaW4oY29uZmlnLmRpc3REaXIsICcqKi8qJyksXG4gICAgICAgICAgICBgISR7cGF0aC5qb2luKGNvbmZpZy5kaXN0RGlyLCAnYXBwLmpzJyl9YCxcbiAgICAgICAgICAgIGAhJHtwYXRoLmpvaW4oY29uZmlnLmRpc3REaXIsICdhcHAuanNvbicpfWAsXG4gICAgICAgICAgICBgISR7cGF0aC5qb2luKGNvbmZpZy5kaXN0RGlyLCAncHJvamVjdC5jb25maWcuanNvbicpfWBcbiAgICAgICAgXSlcbiAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoJ0NsZWFuIHdvcmtzaG9wJywgY29uZmlnLmRpc3REaXIpXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRXZlcnl0aGluZyBzdGFydCBmcm9tIGhlcmUuXG4gICAgICovXG4gICAgYXN5bmMgbGF1bmNoICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBsb2dnZXIuaW5mbygnTGF1bmNoaW5nLi4uJylcblxuICAgICAgICBjb25zdCBmaWxlUGF0aHM6IHN0cmluZ1tdID0gYXdhaXQgdXRpbHMuc2VhcmNoRmlsZXMoYCoqLypgLCB7XG4gICAgICAgICAgICBjd2Q6IGNvbmZpZy5zcmNEaXIsXG4gICAgICAgICAgICBub2RpcjogdHJ1ZSxcbiAgICAgICAgICAgIHNpbGVudDogZmFsc2UsXG4gICAgICAgICAgICBhYnNvbHV0ZTogdHJ1ZSxcbiAgICAgICAgICAgIGlnbm9yZTogY29uZmlnLmFua2FDb25maWcuaWdub3JlZFxuICAgICAgICB9KVxuICAgICAgICBjb25zdCBmaWxlcyA9IGF3YWl0IFByb21pc2UuYWxsKGZpbGVQYXRocy5tYXAoZmlsZSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdXRpbHMuY3JlYXRlRmlsZShmaWxlKVxuICAgICAgICB9KSlcbiAgICAgICAgY29uc3QgY29tcGlsYXRpb25zID0gZmlsZXMubWFwKGZpbGUgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBDb21waWxhdGlvbihmaWxlLCB0aGlzLmNvbmZpZywgdGhpcylcbiAgICAgICAgfSlcblxuICAgICAgICBmcy5lbnN1cmVEaXJTeW5jKGNvbmZpZy5kaXN0Tm9kZU1vZHVsZXMpXG5cbiAgICAgICAgLy8gYXdhaXQgUHJvbWlzZS5hbGwoY29tcGlsYXRpb25zLm1hcChjb21waWxhdGlvbiA9PiBjb21waWxhdGlvbi5sb2FkRmlsZSgpKSlcbiAgICAgICAgLy8gYXdhaXQgUHJvbWlzZS5hbGwoY29tcGlsYXRpb25zLm1hcChjb21waWxhdGlvbiA9PiBjb21waWxhdGlvbi5pbnZva2VQYXJzZXJzKCkpKVxuXG4gICAgICAgIC8vIFRPRE86IEdldCBhbGwgZmlsZXNcbiAgICAgICAgLy8gQ29tcGlsZXIuY29tcGlsYXRpb25Qb29sLnZhbHVlcygpXG5cbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoY29tcGlsYXRpb25zLm1hcChjb21waWxhdGlvbnMgPT4gY29tcGlsYXRpb25zLnJ1bigpKSlcbiAgICB9XG5cbiAgICB3YXRjaEZpbGVzICgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgICAgICBjb25zdCB3YXRjaGVyID0gdXRpbHMuZ2VuRmlsZVdhdGNoZXIoYCR7Y29uZmlnLnNyY0Rpcn0vKiovKmAsIHtcbiAgICAgICAgICAgICAgICBmb2xsb3dTeW1saW5rczogZmFsc2UsXG4gICAgICAgICAgICAgICAgaWdub3JlZDogY29uZmlnLmFua2FDb25maWcuaWdub3JlZFxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgd2F0Y2hlci5vbignYWRkJywgYXN5bmMgKGZpbGVOYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlID0gYXdhaXQgdXRpbHMuY3JlYXRlRmlsZShmaWxlTmFtZSlcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmdlbmVyYXRlQ29tcGlsYXRpb24oZmlsZSkucnVuKClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB3YXRjaGVyLm9uKCd1bmxpbmsnLCBhc3luYyAoZmlsZU5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIGF3YWl0IGZzLnVubGluayhmaWxlTmFtZS5yZXBsYWNlKGNvbmZpZy5zcmNEaXIsIGNvbmZpZy5kaXN0RGlyKSlcbiAgICAgICAgICAgICAgICBsb2dnZXIuc3VjY2VzcygnUmVtb3ZlJywgZmlsZU5hbWUpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgd2F0Y2hlci5vbignY2hhbmdlJywgYXN5bmMgKGZpbGVOYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlID0gYXdhaXQgdXRpbHMuY3JlYXRlRmlsZShmaWxlTmFtZSlcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmdlbmVyYXRlQ29tcGlsYXRpb24oZmlsZSkucnVuKClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB3YXRjaGVyLm9uKCdyZWFkeScsICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIG5ldyBDb21waWxhdGlvbi5cbiAgICAgKiBAcGFyYW0gZmlsZVxuICAgICAqL1xuICAgIGdlbmVyYXRlQ29tcGlsYXRpb24gKGZpbGU6IEZpbGUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb21waWxhdGlvbihmaWxlLCB0aGlzLmNvbmZpZywgdGhpcylcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNb3VudCBwYXJzZXJzLlxuICAgICAqL1xuICAgIGluaXRQYXJzZXJzICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jb25maWcuYW5rYUNvbmZpZy5wYXJzZXJzLmZvckVhY2goKHsgbWF0Y2gsIHBhcnNlcnMgfSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wYXJzZXJzLnB1c2goe1xuICAgICAgICAgICAgICAgIG1hdGNoLFxuICAgICAgICAgICAgICAgIHBhcnNlcnM6IHBhcnNlcnMubWFwKCh7IHBhcnNlciwgb3B0aW9ucyB9KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZXIuYmluZCh0aGlzLmdlbmVyYXRlUGFyc2VySW5qZWN0aW9uKG9wdGlvbnMpKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1vdW50IFBsdWdpbnMuXG4gICAgICovXG4gICAgaW5pdFBsdWdpbnMgKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmNvbmZpZy5hbmthQ29uZmlnLnBsdWdpbnMuZm9yRWFjaCgoeyBwbHVnaW4sIG9wdGlvbnMgfSkgPT4ge1xuICAgICAgICAgICAgcGx1Z2luLmNhbGwodGhpcy5nZW5lcmF0ZVBsdWdpbkluamVjdGlvbihvcHRpb25zKSlcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBnZW5lcmF0ZVBsdWdpbkluamVjdGlvbiAob3B0aW9uczogUGx1Z2luT3B0aW9uc1snb3B0aW9ucyddKTogUGx1Z2luSW5qZWN0aW9uIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQbHVnaW5JbmplY3Rpb24odGhpcywgb3B0aW9ucylcbiAgICB9XG5cbiAgICBnZW5lcmF0ZVBhcnNlckluamVjdGlvbiAob3B0aW9uczogUGFyc2VyT3B0aW9uc1snb3B0aW9ucyddKTogUGFyc2VySW5qZWN0aW9uIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQYXJzZXJJbmplY3Rpb24odGhpcywgb3B0aW9ucylcbiAgICB9XG59XG4iLCJpbXBvcnQgQ29tcGlsZXIgZnJvbSAnLi9Db21waWxlcidcblxuZXhwb3J0IGRlZmF1bHQgYWJzdHJhY3QgY2xhc3MgQ29tbWFuZCB7XG4gICAgcHVibGljIGNvbW1hbmQ6IHN0cmluZ1xuICAgIHB1YmxpYyBvcHRpb25zOiBBcnJheTxBcnJheTxzdHJpbmc+PlxuICAgIHB1YmxpYyBhbGlhczogc3RyaW5nXG4gICAgcHVibGljIHVzYWdlOiBzdHJpbmdcbiAgICBwdWJsaWMgZGVzY3JpcHRpb246IHN0cmluZ1xuICAgIHB1YmxpYyBleGFtcGxlczogQXJyYXk8c3RyaW5nPlxuICAgIHB1YmxpYyAkY29tcGlsZXI6IENvbXBpbGVyXG4gICAgcHVibGljIG9uOiB7XG4gICAgICAgIFtrZXk6IHN0cmluZ106ICguLi5hcmc6IGFueVtdKSA9PiB2b2lkXG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IgKGNvbW1hbmQ6IHN0cmluZywgZGVzYz86IHN0cmluZykge1xuICAgICAgICB0aGlzLmNvbW1hbmQgPSBjb21tYW5kXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IFtdXG4gICAgICAgIHRoaXMuYWxpYXMgPSAnJ1xuICAgICAgICB0aGlzLnVzYWdlID0gJydcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IGRlc2NcbiAgICAgICAgdGhpcy5leGFtcGxlcyA9IFtdXG4gICAgICAgIHRoaXMub24gPSB7fVxuICAgIH1cblxuICAgIGFic3RyYWN0IGFjdGlvbiAocGFyYW06IHN0cmluZyB8IEFycmF5PHN0cmluZz4sIG9wdGlvbnM6IE9iamVjdCwgLi4ub3RoZXI6IGFueVtdKTogUHJvbWlzZTxhbnk+IHwgdm9pZFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSBhbmthIGNvcmUgY29tcGlsZXJcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgaW5pdENvbXBpbGVyICgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy4kY29tcGlsZXIgPSBuZXcgQ29tcGlsZXIoKVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBzZXRVc2FnZSAodXNhZ2U6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICB0aGlzLnVzYWdlID0gdXNhZ2VcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgc2V0T3B0aW9ucyAoLi4ub3B0aW9uczogQXJyYXk8c3RyaW5nPik6IHZvaWQge1xuICAgICAgICB0aGlzLm9wdGlvbnMucHVzaChvcHRpb25zKVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBzZXRFeGFtcGxlcyAoLi4uZXhhbXBsZTogQXJyYXk8c3RyaW5nPik6IHZvaWQge1xuICAgICAgICB0aGlzLmV4YW1wbGVzID0gdGhpcy5leGFtcGxlcy5jb25jYXQoZXhhbXBsZSlcbiAgICB9XG5cbiAgICBwdWJsaWMgcHJpbnRUaXRsZSAoLi4uYXJnOiBBcnJheTxhbnk+KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdcXHJcXG4gJywgLi4uYXJnLCAnXFxyXFxuJylcbiAgICB9XG5cbiAgICBwdWJsaWMgcHJpbnRDb250ZW50ICguLi5hcmc6IEFycmF5PGFueT4pIHtcbiAgICAgICAgY29uc29sZS5sb2coJyAgICcsIC4uLmFyZylcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBsb2dnZXIgfSBmcm9tICcuLi91dGlscydcbmltcG9ydCB7IENvbW1hbmQsIENvbXBpbGVyIH0gZnJvbSAnLi4vY29yZSdcblxuZXhwb3J0IHR5cGUgRGV2Q29tbWFuZE9wdHMgPSBPYmplY3QgJiB7fVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEZXZDb21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBzdXBlcihcbiAgICAgICAgICAgICdkZXYgW3BhZ2VzLi4uXScsXG4gICAgICAgICAgICAnRGV2ZWxvcG1lbnQgbW9kZSdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0RXhhbXBsZXMoXG4gICAgICAgICAgICAnJCBhbmthIGRldicsXG4gICAgICAgICAgICAnJCBhbmthIGRldiBpbmRleCcsXG4gICAgICAgICAgICAnJCBhbmthIGRldiAvcGFnZXMvbG9nL2xvZyAvcGFnZXMvdXNlci91c2VyJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy4kY29tcGlsZXIgPSBuZXcgQ29tcGlsZXIoKVxuICAgIH1cblxuICAgIGFzeW5jIGFjdGlvbiAocGFnZXM/OiBBcnJheTxzdHJpbmc+LCBvcHRpb25zPzogRGV2Q29tbWFuZE9wdHMpIHtcbiAgICAgICAgdGhpcy4kY29tcGlsZXIuY29uZmlnLmFua2FDb25maWcuZGV2TW9kZSA9IHRydWVcblxuICAgICAgICBjb25zdCBzdGFydHVwVGltZSA9IERhdGUubm93KClcblxuICAgICAgICB0aGlzLmluaXRDb21waWxlcigpXG4gICAgICAgIGF3YWl0IHRoaXMuJGNvbXBpbGVyLmNsZWFuKClcbiAgICAgICAgYXdhaXQgdGhpcy4kY29tcGlsZXIubGF1bmNoKClcbiAgICAgICAgYXdhaXQgdGhpcy4kY29tcGlsZXIud2F0Y2hGaWxlcygpXG4gICAgICAgIGxvZ2dlci5zdWNjZXNzKGBDb21waWxlZCBpbiAke0RhdGUubm93KCkgLSBzdGFydHVwVGltZX1tcyDwn46JICwgQW5rYSBpcyB3YWl0aW5nIGZvciBjaGFuZ2VzLi4uYClcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgY29uZmlnIGZyb20gJy4uL2NvbmZpZydcbmltcG9ydCB7IGRvd25sb2FkUmVwbywgbG9nZ2VyIH0gZnJvbSAnLi4vdXRpbHMnXG5pbXBvcnQgeyBDb21tYW5kLCBDb21waWxlciB9IGZyb20gJy4uL2NvcmUnXG5cbmV4cG9ydCB0eXBlIEluaXRDb21tYW5kT3B0cyA9IHtcbiAgICByZXBvOiBzdHJpbmdcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSW5pdENvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHN1cGVyKFxuICAgICAgICAgICAgJ2luaXQgPHByb2plY3QtbmFtZT4nLFxuICAgICAgICAgICAgJ0luaXRpYWxpemUgbmV3IHByb2plY3QnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldEV4YW1wbGVzKFxuICAgICAgICAgICAgJyQgYW5rYSBpbml0JyxcbiAgICAgICAgICAgIGAkIGFua2EgaW5pdCBhbmthLWluLWFjdGlvbiAtLXJlcG89JHtjb25maWcuZGVmYXVsdFNjYWZmb2xkfWBcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0T3B0aW9ucyhcbiAgICAgICAgICAgICctciwgLS1yZXBvJyxcbiAgICAgICAgICAgICd0ZW1wbGF0ZSByZXBvc2l0b3J5J1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy4kY29tcGlsZXIgPSBuZXcgQ29tcGlsZXIoKVxuICAgIH1cblxuICAgIGFzeW5jIGFjdGlvbiAocHJvamVjdE5hbWU6IHN0cmluZywgb3B0aW9ucz86IEluaXRDb21tYW5kT3B0cykge1xuICAgICAgICBjb25zdCBwcm9qZWN0ID0gcGF0aC5yZXNvbHZlKGNvbmZpZy5jd2QsIHByb2plY3ROYW1lKVxuICAgICAgICBjb25zdCByZXBvID0gb3B0aW9ucy5yZXBvIHx8IGNvbmZpZy5kZWZhdWx0U2NhZmZvbGRcblxuICAgICAgICBsb2dnZXIuc3RhcnRMb2FkaW5nKCdEb3dubG9hZGluZyB0ZW1wbGF0ZS4uLicpXG4gICAgICAgIGF3YWl0IGRvd25sb2FkUmVwbyhyZXBvLCBwcm9qZWN0KVxuICAgICAgICBsb2dnZXIuc3RvcExvYWRpbmcoKVxuICAgICAgICBsb2dnZXIuc3VjY2VzcygnRG9uZScsIHByb2plY3QpXG4gICAgfVxufVxuIiwiaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi4vdXRpbHMnXG5pbXBvcnQgeyBDb21tYW5kLCBDb21waWxlciB9IGZyb20gJy4uL2NvcmUnXG5cbmV4cG9ydCB0eXBlIERldkNvbW1hbmRPcHRzID0gT2JqZWN0ICYge31cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGV2Q29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgc3VwZXIoXG4gICAgICAgICAgICAncHJvZCcsXG4gICAgICAgICAgICAnUHJvZHVjdGlvbiBtb2RlJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRFeGFtcGxlcyhcbiAgICAgICAgICAgICckIGFua2EgcHJvZCdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuJGNvbXBpbGVyID0gbmV3IENvbXBpbGVyKClcbiAgICB9XG5cbiAgICBhc3luYyBhY3Rpb24gKHBhZ2VzPzogQXJyYXk8c3RyaW5nPiwgb3B0aW9ucz86IERldkNvbW1hbmRPcHRzKSB7XG4gICAgICAgIHRoaXMuJGNvbXBpbGVyLmNvbmZpZy5hbmthQ29uZmlnLmRldk1vZGUgPSBmYWxzZVxuXG4gICAgICAgIGNvbnN0IHN0YXJ0dXBUaW1lID0gRGF0ZS5ub3coKVxuXG4gICAgICAgIHRoaXMuaW5pdENvbXBpbGVyKClcbiAgICAgICAgYXdhaXQgdGhpcy4kY29tcGlsZXIuY2xlYW4oKVxuICAgICAgICBhd2FpdCB0aGlzLiRjb21waWxlci5sYXVuY2goKVxuICAgICAgICBsb2dnZXIuc3VjY2VzcyhgQ29tcGlsZWQgaW4gJHtEYXRlLm5vdygpIC0gc3RhcnR1cFRpbWV9bXNgLCAnSGF2ZSBhIG5pY2UgZGF5IPCfjokgIScpXG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgY29uZmlnICBmcm9tICcuLi9jb25maWcnXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi91dGlscydcbmltcG9ydCB7IENvbW1hbmQsIENvbXBpbGVyIH0gZnJvbSAnLi4vY29yZSdcbmltcG9ydCB7IGRlZmF1bHQgYXMgRnNFZGl0b3JDb25zdHJ1Y3RvciB9IGZyb20gJy4uL3V0aWxzL2VkaXRvcidcblxuaW1wb3J0IHtcbiAgICBDb21waWxlckNvbmZpZ1xufSBmcm9tICcuLi8uLi90eXBlcy90eXBlcydcblxuY29uc3QgeyBsb2dnZXIsIEZzRWRpdG9yIH0gPSB1dGlsc1xuXG5leHBvcnQgdHlwZSBDcmVhdGVQYWdlQ29tbWFuZE9wdHMgPSB7XG4gICAgcm9vdDogc3RyaW5nXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENyZWF0ZVBhZ2VDb21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBzdXBlcihcbiAgICAgICAgICAgICduZXctcGFnZSA8cGFnZXMuLi4+JyxcbiAgICAgICAgICAgICdDcmVhdGUgYSBtaW5pcHJvZ3JhbSBwYWdlJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRFeGFtcGxlcyhcbiAgICAgICAgICAgICckIGFua2EgbmV3LXBhZ2UgaW5kZXgnLFxuICAgICAgICAgICAgJyQgYW5rYSBuZXctcGFnZSAvcGFnZXMvaW5kZXgvaW5kZXgnLFxuICAgICAgICAgICAgJyQgYW5rYSBuZXctcGFnZSAvcGFnZXMvaW5kZXgvaW5kZXggLS1yb290PXBhY2thZ2VBJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRPcHRpb25zKFxuICAgICAgICAgICAgJy1yLCAtLXJvb3QgPHN1YnBhY2thZ2U+JyxcbiAgICAgICAgICAgICdzYXZlIHBhZ2UgdG8gc3VicGFja2FnZXMnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLiRjb21waWxlciA9IG5ldyBDb21waWxlcigpXG4gICAgfVxuXG4gICAgYXN5bmMgYWN0aW9uIChwYWdlcz86IEFycmF5PHN0cmluZz4sIG9wdGlvbnM/OiBDcmVhdGVQYWdlQ29tbWFuZE9wdHMpIHtcbiAgICAgICAgY29uc3Qgcm9vdCA9IG9wdGlvbnMucm9vdFxuICAgICAgICBjb25zdCBlZGl0b3IgPSBuZXcgRnNFZGl0b3IoKVxuXG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHBhZ2VzLm1hcChwYWdlID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdlbmVyYXRlUGFnZShwYWdlLCBlZGl0b3IsIHJvb3QpXG4gICAgICAgIH0pKVxuXG4gICAgICAgIGxvZ2dlci5zdWNjZXNzKCdEb25lJywgJ0hhdmUgYSBuaWNlIGRheSDwn46JICEnKVxuICAgIH1cblxuICAgIGFzeW5jIGdlbmVyYXRlUGFnZSAocGFnZTogc3RyaW5nLCBlZGl0b3I6IEZzRWRpdG9yQ29uc3RydWN0b3IsIHJvb3Q/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgYW5rYUNvbmZpZyxcbiAgICAgICAgICAgIHByb2plY3RDb25maWdcbiAgICAgICAgfSA9IDxDb21waWxlckNvbmZpZz5jb25maWdcbiAgICAgICAgY29uc3QgQ3dkUmVnRXhwID0gbmV3IFJlZ0V4cChgXiR7Y29uZmlnLmN3ZH1gKVxuICAgICAgICBjb25zdCBwYWdlUGF0aCA9IHBhZ2Uuc3BsaXQocGF0aC5zZXApLmxlbmd0aCA9PT0gMSA/XG4gICAgICAgICAgICBwYXRoLmpvaW4oYW5rYUNvbmZpZy5wYWdlcywgcGFnZSwgcGFnZSkgOiBwYWdlXG4gICAgICAgIGNvbnN0IHBhZ2VOYW1lID0gcGF0aC5iYXNlbmFtZShwYWdlUGF0aClcbiAgICAgICAgY29uc3QgY29udGV4dCA9IHtcbiAgICAgICAgICAgIHBhZ2VOYW1lLFxuICAgICAgICAgICAgdGltZTogbmV3IERhdGUoKS50b0xvY2FsZVN0cmluZygpXG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYXBwQ29uZmlnUGF0aCA9IHBhdGguam9pbihjb25maWcuc3JjRGlyLCAnYXBwLmpzb24nKVxuICAgICAgICBsZXQgYWJzb2x1dGVQYXRoID0gY29uZmlnLnNyY0RpclxuXG4gICAgICAgIGlmIChyb290KSB7XG4gICAgICAgICAgICBjb25zdCByb290UGF0aCA9IHBhdGguam9pbihhbmthQ29uZmlnLnN1YlBhY2thZ2VzLCByb290KVxuICAgICAgICAgICAgY29uc3Qgc3ViUGtnID0gcHJvamVjdENvbmZpZy5zdWJQYWNrYWdlcy5maW5kKChwa2c6IGFueSkgPT4gcGtnLnJvb3QgPT09IHJvb3RQYXRoKVxuXG4gICAgICAgICAgICBhYnNvbHV0ZVBhdGggPSBwYXRoLmpvaW4oYWJzb2x1dGVQYXRoLCBhbmthQ29uZmlnLnN1YlBhY2thZ2VzLCByb290LCBwYWdlUGF0aClcblxuICAgICAgICAgICAgaWYgKHN1YlBrZykge1xuICAgICAgICAgICAgICAgIGlmIChzdWJQa2cucGFnZXMuaW5jbHVkZXMocGFnZVBhdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKCdUaGUgcGFnZSBhbHJlYWR5IGV4aXN0cycsIGFic29sdXRlUGF0aClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc3ViUGtnLnBhZ2VzLnB1c2gocGFnZVBhdGgpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwcm9qZWN0Q29uZmlnLnN1YlBhY2thZ2VzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICByb290OiByb290UGF0aCxcbiAgICAgICAgICAgICAgICAgICAgcGFnZXM6IFtwYWdlUGF0aF1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWJzb2x1dGVQYXRoID0gcGF0aC5qb2luKGFic29sdXRlUGF0aCwgcGFnZVBhdGgpXG5cbiAgICAgICAgICAgIGlmIChwcm9qZWN0Q29uZmlnLnBhZ2VzLmluY2x1ZGVzKHBhZ2VQYXRoKSkge1xuICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKCdUaGUgcGFnZSBhbHJlYWR5IGV4aXN0cycsIGFic29sdXRlUGF0aClcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcHJvamVjdENvbmZpZy5wYWdlcy5wdXNoKHBhZ2VQYXRoKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdHBscyA9IGF3YWl0IHV0aWxzLnNlYXJjaEZpbGVzKGAke3BhdGguam9pbihhbmthQ29uZmlnLnRlbXBsYXRlLnBhZ2UsICcqLionKX1gKVxuXG4gICAgICAgIHRwbHMuZm9yRWFjaCh0cGwgPT4ge1xuICAgICAgICAgICAgZWRpdG9yLmNvcHkoXG4gICAgICAgICAgICAgICAgdHBsLFxuICAgICAgICAgICAgICAgIHBhdGguam9pbihwYXRoLmRpcm5hbWUoYWJzb2x1dGVQYXRoKSwgcGFnZU5hbWUgKyBwYXRoLmV4dG5hbWUodHBsKSksXG4gICAgICAgICAgICAgICAgY29udGV4dFxuICAgICAgICAgICAgKVxuICAgICAgICB9KVxuICAgICAgICBlZGl0b3Iud3JpdGVKU09OKGFwcENvbmZpZ1BhdGgsIHByb2plY3RDb25maWcsIG51bGwsIDQpXG5cbiAgICAgICAgYXdhaXQgZWRpdG9yLnNhdmUoKVxuXG4gICAgICAgIGxvZ2dlci5zdWNjZXNzKCdDcmVhdGUgcGFnZScsIGFic29sdXRlUGF0aC5yZXBsYWNlKEN3ZFJlZ0V4cCwgJycpKVxuICAgIH1cbn1cbiIsImltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJ1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IGNvbmZpZyAgZnJvbSAnLi4vY29uZmlnJ1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vdXRpbHMnXG5pbXBvcnQgeyBDb21tYW5kLCBDb21waWxlciB9IGZyb20gJy4uL2NvcmUnXG5pbXBvcnQgeyBkZWZhdWx0IGFzIEZzRWRpdG9yQ29uc3RydWN0b3IgfSBmcm9tICcuLi91dGlscy9lZGl0b3InXG5cbmltcG9ydCB7XG4gICAgQ29tcGlsZXJDb25maWdcbn0gZnJvbSAnLi4vLi4vdHlwZXMvdHlwZXMnXG5cbmNvbnN0IHsgbG9nZ2VyLCBGc0VkaXRvciB9ID0gdXRpbHNcblxuZXhwb3J0IHR5cGUgQ3JlYXRlQ29tcG9uZW50Q29tbWFuZE9wdHMgPSB7XG4gICAgcm9vdDogc3RyaW5nXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENyZWF0ZUNvbXBvbmVudENvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHN1cGVyKFxuICAgICAgICAgICAgJ25ldy1jbXB0IDxjb21wb25lbnRzLi4uPicsXG4gICAgICAgICAgICAnQ3JlYXRlIGEgbWluaXByb2dyYW0gY29tcG9uZW50J1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy5zZXRFeGFtcGxlcyhcbiAgICAgICAgICAgICckIGFua2EgbmV3LWNtcHQgYnV0dG9uJyxcbiAgICAgICAgICAgICckIGFua2EgbmV3LWNtcHQgL2NvbXBvbmVudHMvYnV0dG9uL2J1dHRvbicsXG4gICAgICAgICAgICAnJCBhbmthIG5ldy1jbXB0IC9jb21wb25lbnRzL2J1dHRvbi9idXR0b24gLS1nbG9iYWwnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldE9wdGlvbnMoXG4gICAgICAgICAgICAnLXIsIC0tcm9vdCA8c3VicGFja2FnZT4nLFxuICAgICAgICAgICAgJ3NhdmUgY29tcG9uZW50IHRvIHN1YnBhY2thZ2VzJ1xuICAgICAgICApXG5cbiAgICAgICAgdGhpcy4kY29tcGlsZXIgPSBuZXcgQ29tcGlsZXIoKVxuICAgIH1cblxuICAgIGFzeW5jIGFjdGlvbiAoY29tcG9uZW50cz86IEFycmF5PHN0cmluZz4sIG9wdGlvbnM/OiBDcmVhdGVDb21wb25lbnRDb21tYW5kT3B0cykge1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICByb290XG4gICAgICAgIH0gPSBvcHRpb25zXG4gICAgICAgIGNvbnN0IGVkaXRvciA9IG5ldyBGc0VkaXRvcigpXG5cbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoY29tcG9uZW50cy5tYXAoY29tcG9uZW50ID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdlbmVyYXRlQ29tcG9uZW50KGNvbXBvbmVudCwgZWRpdG9yLCByb290KVxuICAgICAgICB9KSlcblxuICAgICAgICBsb2dnZXIuc3VjY2VzcygnRG9uZScsICdIYXZlIGEgbmljZSBkYXkg8J+OiSAhJylcbiAgICB9XG5cbiAgICBhc3luYyBnZW5lcmF0ZUNvbXBvbmVudCAoY29tcG9uZW50OiBzdHJpbmcsIGVkaXRvcjogRnNFZGl0b3JDb25zdHJ1Y3Rvciwgcm9vdD86IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICBhbmthQ29uZmlnLFxuICAgICAgICAgICAgcHJvamVjdENvbmZpZ1xuICAgICAgICB9ID0gPENvbXBpbGVyQ29uZmlnPmNvbmZpZ1xuICAgICAgICBjb25zdCBDd2RSZWdFeHAgPSBuZXcgUmVnRXhwKGBeJHtjb25maWcuY3dkfWApXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudFBhdGggPSBjb21wb25lbnQuc3BsaXQocGF0aC5zZXApLmxlbmd0aCA9PT0gMSA/XG4gICAgICAgICAgICBwYXRoLmpvaW4oYW5rYUNvbmZpZy5jb21wb25lbnRzLCBjb21wb25lbnQsIGNvbXBvbmVudCkgOlxuICAgICAgICAgICAgY29tcG9uZW50XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudE5hbWUgPSBwYXRoLmJhc2VuYW1lKGNvbXBvbmVudFBhdGgpXG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSB7XG4gICAgICAgICAgICBjb21wb25lbnROYW1lLFxuICAgICAgICAgICAgdGltZTogbmV3IERhdGUoKS50b0xvY2FsZVN0cmluZygpXG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYWJzb2x1dGVQYXRoID0gcm9vdCA/XG4gICAgICAgICAgICBwYXRoLmpvaW4oY29uZmlnLnNyY0RpciwgYW5rYUNvbmZpZy5zdWJQYWNrYWdlcywgcm9vdCwgY29tcG9uZW50UGF0aCkgOlxuICAgICAgICAgICAgcGF0aC5qb2luKGNvbmZpZy5zcmNEaXIsIGNvbXBvbmVudFBhdGgpXG5cbiAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMocGF0aC5qb2luKHBhdGguZGlybmFtZShhYnNvbHV0ZVBhdGgpLCBjb21wb25lbnROYW1lICsgJy5qc29uJykpKSB7XG4gICAgICAgICAgICBsb2dnZXIud2FybignVGhlIGNvbXBvbmVudCBhbHJlYWR5IGV4aXN0cycsIGFic29sdXRlUGF0aClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdHBscyA9IGF3YWl0IHV0aWxzLnNlYXJjaEZpbGVzKGAke3BhdGguam9pbihhbmthQ29uZmlnLnRlbXBsYXRlLmNvbXBvbmVudCwgJyouKicpfWApXG5cbiAgICAgICAgdHBscy5mb3JFYWNoKHRwbCA9PiB7XG4gICAgICAgICAgICBlZGl0b3IuY29weShcbiAgICAgICAgICAgICAgICB0cGwsXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKHBhdGguZGlybmFtZShhYnNvbHV0ZVBhdGgpLCBjb21wb25lbnROYW1lICsgcGF0aC5leHRuYW1lKHRwbCkpLFxuICAgICAgICAgICAgICAgIGNvbnRleHRcbiAgICAgICAgICAgIClcbiAgICAgICAgfSlcblxuICAgICAgICBhd2FpdCBlZGl0b3Iuc2F2ZSgpXG5cbiAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoJ0NyZWF0ZSBjb21wb25lbnQnLCBhYnNvbHV0ZVBhdGgucmVwbGFjZShDd2RSZWdFeHAsICcnKSlcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcydcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBjb25maWcgIGZyb20gJy4uL2NvbmZpZydcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uL3V0aWxzJ1xuaW1wb3J0IHsgQ29tbWFuZCwgQ29tcGlsZXIgfSBmcm9tICcuLi9jb3JlJ1xuaW1wb3J0IHsgZGVmYXVsdCBhcyBGc0VkaXRvckNvbnN0cnVjdG9yIH0gZnJvbSAnLi4vdXRpbHMvZWRpdG9yJ1xuXG5pbXBvcnQge1xuICAgIENvbXBpbGVyQ29uZmlnXG59IGZyb20gJy4uLy4uL3R5cGVzL3R5cGVzJ1xuXG5jb25zdCB7IGxvZ2dlciwgRnNFZGl0b3IgfSA9IHV0aWxzXG5cbmV4cG9ydCB0eXBlIEVucm9sbENvbXBvbmVudENvbW1hbmRPcHRzID0ge1xuICAgIHBhZ2U6IHN0cmluZ1xuICAgIGdsb2JhbDogc3RyaW5nXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEVucm9sbENvbXBvbmVudENvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHN1cGVyKFxuICAgICAgICAgICAgJ2Vucm9sbCA8Y29tcG9uZW50cy4uLj4nLFxuICAgICAgICAgICAgJ0Vucm9sbCBhIG1pbmlwcm9ncmFtIGNvbXBvbmVudCdcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuc2V0RXhhbXBsZXMoXG4gICAgICAgICAgICAnJCBhbmthIGVucm9sbCBidXR0b24gLS1nbG9iYWwnLFxuICAgICAgICAgICAgJyQgYW5rYSBlbnJvbGwgL2NvbXBvbmVudHMvYnV0dG9uL2J1dHRvbiAtLWdsb2JhbCcsXG4gICAgICAgICAgICAnJCBhbmthIGVucm9sbCAvY29tcG9uZW50cy9idXR0b24vYnV0dG9uIC0tcGFnZT0vcGFnZXMvaW5kZXgvaW5kZXgnXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldE9wdGlvbnMoXG4gICAgICAgICAgICAnLXAsIC0tcGFnZSA8cGFnZT4nLFxuICAgICAgICAgICAgJ3doaWNoIHBhZ2UgY29tcG9uZW50cyBlbnJvbGwgdG8nXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLnNldE9wdGlvbnMoXG4gICAgICAgICAgICAnLWcsIC0tZ2xvYmFsJyxcbiAgICAgICAgICAgICdlbnJvbGwgY29tcG9uZW50cyB0byBhcHAuanNvbidcbiAgICAgICAgKVxuXG4gICAgICAgIHRoaXMuJGNvbXBpbGVyID0gbmV3IENvbXBpbGVyKClcbiAgICB9XG5cbiAgICBhc3luYyBhY3Rpb24gKGNvbXBvbmVudHM/OiBBcnJheTxzdHJpbmc+LCBvcHRpb25zPzogRW5yb2xsQ29tcG9uZW50Q29tbWFuZE9wdHMpIHtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgcGFnZSxcbiAgICAgICAgICAgIGdsb2JhbFxuICAgICAgICB9ID0gb3B0aW9uc1xuICAgICAgICBjb25zdCBlZGl0b3IgPSBuZXcgRnNFZGl0b3IoKVxuXG4gICAgICAgIGlmICghZ2xvYmFsICYmICFwYWdlKSB7XG4gICAgICAgICAgICBsb2dnZXIud2FybignV2hlcmUgY29tcG9uZW50cyBlbnJvbGwgdG8/JylcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoY29tcG9uZW50cy5tYXAoY29tcG9uZW50ID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmVucm9sbENvbXBvbmVudChjb21wb25lbnQsIGVkaXRvciwgZ2xvYmFsID8gJycgOiBwYWdlKVxuICAgICAgICB9KSlcblxuICAgICAgICBsb2dnZXIuc3VjY2VzcygnRG9uZScsICdIYXZlIGEgbmljZSBkYXkg8J+OiSAhJylcbiAgICB9XG5cbiAgICBhc3luYyBlbnJvbGxDb21wb25lbnQgKGNvbXBvbmVudDogc3RyaW5nLCBlZGl0b3I6IEZzRWRpdG9yQ29uc3RydWN0b3IsIHBhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgYW5rYUNvbmZpZyxcbiAgICAgICAgICAgIHByb2plY3RDb25maWdcbiAgICAgICAgfSA9IDxDb21waWxlckNvbmZpZz5jb25maWdcbiAgICAgICAgY29uc3QgQ3dkUmVnRXhwID0gbmV3IFJlZ0V4cChgXiR7Y29uZmlnLmN3ZH1gKVxuICAgICAgICBjb25zdCBjb21wb25lbnRQYXRoID0gY29tcG9uZW50LnNwbGl0KHBhdGguc2VwKS5sZW5ndGggPT09IDEgP1xuICAgICAgICAgICAgcGF0aC5qb2luKGFua2FDb25maWcuY29tcG9uZW50cywgY29tcG9uZW50LCBjb21wb25lbnQpIDpcbiAgICAgICAgICAgIGNvbXBvbmVudFxuICAgICAgICBjb25zdCBjb21wb25lbnROYW1lID0gY29tcG9uZW50UGF0aC5zcGxpdChwYXRoLnNlcCkucG9wKClcbiAgICAgICAgY29uc3QgYXBwQ29uZmlnUGF0aCA9IHBhdGguam9pbihjb25maWcuc3JjRGlyLCAnYXBwLmpzb24nKVxuICAgICAgICBjb25zdCBjb21wb25lbnRBYnNQYXRoID0gcGF0aC5qb2luKGNvbmZpZy5zcmNEaXIsIGNvbXBvbmVudFBhdGgpXG5cbiAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHBhdGguam9pbihwYXRoLmRpcm5hbWUoY29tcG9uZW50QWJzUGF0aCksIGNvbXBvbmVudE5hbWUgKyAnLmpzb24nKSkpIHtcbiAgICAgICAgICAgIGxvZ2dlci53YXJuKCdDb21wb25lbnQgZG9zZSBub3QgZXhpc3RzJywgY29tcG9uZW50QWJzUGF0aClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBhZ2UpIHtcbiAgICAgICAgICAgIGNvbnN0IHBhZ2VBYnNQYXRoID0gcGF0aC5qb2luKGNvbmZpZy5zcmNEaXIsIHBhZ2UpXG4gICAgICAgICAgICBjb25zdCBwYWdlSnNvblBhdGggPSBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKHBhZ2VBYnNQYXRoKSwgcGF0aC5iYXNlbmFtZShwYWdlQWJzUGF0aCkgKyAnLmpzb24nKVxuICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHBhZ2VKc29uUGF0aCkpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIud2FybignUGFnZSBkb3NlIG5vdCBleGlzdHMnLCBwYWdlQWJzUGF0aClcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgcGFnZUpzb24gPSA8YW55PkpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHBhZ2VKc29uUGF0aCwge1xuICAgICAgICAgICAgICAgIGVuY29kaW5nOiAndXRmOCdcbiAgICAgICAgICAgIH0pIHx8ICd7fScpXG5cbiAgICAgICAgICAgIHRoaXMuZW5zdXJlVXNpbmdDb21wb25lbnRzKHBhZ2VKc29uKVxuXG4gICAgICAgICAgICBpZiAocGFnZUpzb24udXNpbmdDb21wb25lbnRzW2NvbXBvbmVudE5hbWVdKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLndhcm4oJ0NvbXBvbmVudCBhbHJlYWR5IGVucm9sbGVkIGluJywgcGFnZUFic1BhdGgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHBhZ2VKc29uLnVzaW5nQ29tcG9uZW50c1tjb21wb25lbnROYW1lXSA9IHBhdGgucmVsYXRpdmUocGF0aC5kaXJuYW1lKHBhZ2VBYnNQYXRoKSwgY29tcG9uZW50QWJzUGF0aClcbiAgICAgICAgICAgIGVkaXRvci53cml0ZUpTT04ocGFnZUpzb25QYXRoLCBwYWdlSnNvbilcbiAgICAgICAgICAgIGF3YWl0IGVkaXRvci5zYXZlKClcblxuICAgICAgICAgICAgbG9nZ2VyLnN1Y2Nlc3MoYEVucm9sbCAke2NvbXBvbmVudFBhdGh9IGluYCwgcGFnZUFic1BhdGgucmVwbGFjZShDd2RSZWdFeHAsICcnKSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZW5zdXJlVXNpbmdDb21wb25lbnRzKHByb2plY3RDb25maWcpXG5cbiAgICAgICAgICAgIGlmIChwcm9qZWN0Q29uZmlnLnVzaW5nQ29tcG9uZW50c1tjb21wb25lbnROYW1lXSkge1xuICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKCdDb21wb25lbnQgYWxyZWFkeSBlbnJvbGxlZCBpbicsICdhcHAuanNvbicpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByb2plY3RDb25maWcudXNpbmdDb21wb25lbnRzW2NvbXBvbmVudE5hbWVdID0gcGF0aC5yZWxhdGl2ZShwYXRoLmRpcm5hbWUoYXBwQ29uZmlnUGF0aCksIGNvbXBvbmVudEFic1BhdGgpXG4gICAgICAgICAgICBlZGl0b3Iud3JpdGVKU09OKGFwcENvbmZpZ1BhdGgsIHByb2plY3RDb25maWcpXG4gICAgICAgICAgICBhd2FpdCBlZGl0b3Iuc2F2ZSgpXG5cbiAgICAgICAgICAgIGxvZ2dlci5zdWNjZXNzKGBFbnJvbGwgJHtjb21wb25lbnRQYXRofSBpbmAsICdhcHAuanNvbicpXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIGVuc3VyZVVzaW5nQ29tcG9uZW50cyAoY29uZmlnOiBhbnkpIHtcbiAgICAgICAgaWYgKCFjb25maWcudXNpbmdDb21wb25lbnRzKSB7XG4gICAgICAgICAgICBjb25maWcudXNpbmdDb21wb25lbnRzID0ge31cbiAgICAgICAgfVxuICAgIH1cbn1cbiIsImltcG9ydCBEZXYgZnJvbSAnLi9jb21tYW5kcy9kZXYnXG5pbXBvcnQgSW5pdCBmcm9tICcuL2NvbW1hbmRzL2luaXQnXG5pbXBvcnQgUHJvZCBmcm9tICcuL2NvbW1hbmRzL3Byb2QnXG5pbXBvcnQgQ3JlYXRlUGFnZSBmcm9tICcuL2NvbW1hbmRzL2NyZWF0ZVBhZ2UnXG5pbXBvcnQgQ3JlYXRlQ29tcG9uZW50IGZyb20gJy4vY29tbWFuZHMvY3JlYXRlQ29tcG9uZW50J1xuaW1wb3J0IEVucm9sbENvbXBvbmVudCBmcm9tICcuL2NvbW1hbmRzL2Vucm9sbENvbXBvbmVudCdcblxuZXhwb3J0IGRlZmF1bHQgW1xuICAgIG5ldyBQcm9kKCksXG4gICAgbmV3IERldigpLFxuICAgIG5ldyBJbml0KCksXG4gICAgbmV3IENyZWF0ZVBhZ2UoKSxcbiAgICBuZXcgQ3JlYXRlQ29tcG9uZW50KCksXG4gICAgbmV3IEVucm9sbENvbXBvbmVudCgpXG5dXG4iLCJpbXBvcnQgY29uZmlnIGZyb20gJy4vY29uZmlnJ1xuaW1wb3J0ICogYXMgc2VtdmVyIGZyb20gJ3NlbXZlcidcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4vdXRpbHMnXG5pbXBvcnQgKiBhcyBjZm9udHMgZnJvbSAnY2ZvbnRzJ1xuaW1wb3J0IGNvbW1hbmRzIGZyb20gJy4vY29tbWFuZHMnXG5pbXBvcnQgQ29tcGlsZXIgZnJvbSAnLi9jb3JlL2NsYXNzL0NvbXBpbGVyJ1xuXG5jb25zdCBjb21tYW5kZXIgPSByZXF1aXJlKCdjb21tYW5kZXInKVxuY29uc3QgcGtnSnNvbiA9IHJlcXVpcmUoJy4uL3BhY2thZ2UuanNvbicpXG5cbnJlcXVpcmUoJ3NvdXJjZS1tYXAtc3VwcG9ydCcpLmluc3RhbGwoKVxuXG5pZiAoIXNlbXZlci5zYXRpc2ZpZXMoc2VtdmVyLmNsZWFuKHByb2Nlc3MudmVyc2lvbiksIHBrZ0pzb24uZW5naW5lcy5ub2RlKSkge1xuICAgIGxvZ2dlci5lcnJvcignUmVxdWlyZWQgbm9kZSB2ZXJzaW9uICcgKyBwa2dKc29uLmVuZ2luZXMubm9kZSlcbiAgICBwcm9jZXNzLmV4aXQoMSlcbn1cblxuaWYgKHByb2Nlc3MuYXJndi5pbmRleE9mKCctLWRlYnVnJykgPiAtMSkge1xuICAgIGNvbmZpZy5hbmthQ29uZmlnLmRlYnVnID0gdHJ1ZVxufVxuXG5pZiAocHJvY2Vzcy5hcmd2LmluZGV4T2YoJy0tc2xpZW50JykgPiAtMSkge1xuICAgIGNvbmZpZy5hbmthQ29uZmlnLnF1aWV0ID0gdHJ1ZVxufVxuXG5jb21tYW5kZXJcbiAgICAub3B0aW9uKCctLWRlYnVnJywgJ2VuYWJsZSBkZWJ1ZyBtb2RlJylcbiAgICAub3B0aW9uKCctLXF1aWV0JywgJ2hpZGUgY29tcGlsZSBsb2cnKVxuICAgIC52ZXJzaW9uKHBrZ0pzb24udmVyc2lvbilcbiAgICAudXNhZ2UoJzxjb21tYW5kPiBbb3B0aW9uc10nKVxuXG5jb21tYW5kcy5mb3JFYWNoKGNvbW1hbmQgPT4ge1xuICAgIGNvbnN0IGNtZCA9IGNvbW1hbmRlci5jb21tYW5kKGNvbW1hbmQuY29tbWFuZClcblxuICAgIGlmIChjb21tYW5kLmRlc2NyaXB0aW9uKSB7XG4gICAgICAgIGNtZC5kZXNjcmlwdGlvbihjb21tYW5kLmRlc2NyaXB0aW9uKVxuICAgIH1cblxuICAgIGlmIChjb21tYW5kLnVzYWdlKSB7XG4gICAgICAgIGNtZC51c2FnZShjb21tYW5kLnVzYWdlKVxuICAgIH1cblxuICAgIGlmIChjb21tYW5kLm9uKSB7XG4gICAgICAgIGZvciAobGV0IGtleSBpbiBjb21tYW5kLm9uKSB7XG4gICAgICAgICAgICBjbWQub24oa2V5LCBjb21tYW5kLm9uW2tleV0pXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY29tbWFuZC5vcHRpb25zKSB7XG4gICAgICAgIGNvbW1hbmQub3B0aW9ucy5mb3JFYWNoKChvcHRpb246IFthbnksIGFueSwgYW55LCBhbnldKSA9PiB7XG4gICAgICAgICAgICBjbWQub3B0aW9uKC4uLm9wdGlvbilcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAoY29tbWFuZC5hY3Rpb24pIHtcbiAgICAgICAgY21kLmFjdGlvbihhc3luYyAoLi4uYXJncykgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBjb21tYW5kLmFjdGlvbiguLi5hcmdzKVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKGVyci5tZXNzYWdlIHx8ICcnKVxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAoY29tbWFuZC5leGFtcGxlcykge1xuICAgICAgICBjbWQub24oJy0taGVscCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbW1hbmQucHJpbnRUaXRsZSgnRXhhbXBsZXM6JylcbiAgICAgICAgICAgIGNvbW1hbmQuZXhhbXBsZXMuZm9yRWFjaChleGFtcGxlID0+IHtcbiAgICAgICAgICAgICAgICBjb21tYW5kLnByaW50Q29udGVudChleGFtcGxlKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICB9XG59KVxuXG5pZiAocHJvY2Vzcy5hcmd2Lmxlbmd0aCA9PT0gMikge1xuICAgIGNvbnN0IExvZ28gPSBjZm9udHMucmVuZGVyKCdBbmthJywge1xuICAgICAgICBmb250OiAnc2ltcGxlJyxcbiAgICAgICAgY29sb3JzOiBbJ2dyZWVuQnJpZ2h0J11cbiAgICB9KVxuXG4gICAgY29uc29sZS5sb2coTG9nby5zdHJpbmcucmVwbGFjZSgvKFxccyspJC8sIGAgJHtwa2dKc29uLnZlcnNpb259XFxyXFxuYCkpXG4gICAgY29tbWFuZGVyLm91dHB1dEhlbHAoKVxufVxuXG5jb21tYW5kZXIucGFyc2UocHJvY2Vzcy5hcmd2KVxuXG5leHBvcnQgZGVmYXVsdCBDb21waWxlclxuIl0sIm5hbWVzIjpbInBhdGguam9pbiIsImZzLmV4aXN0c1N5bmMiLCJzYXNzLnJlbmRlciIsInBvc3Rjc3MiLCJ0c2xpYl8xLl9fYXNzaWduIiwiYmFiZWwudHJhbnNmb3JtU3luYyIsImZzLmVuc3VyZUZpbGUiLCJwb3N0Y3NzLnBsdWdpbiIsImludGVybmFsUGx1Z2lucyIsInRzLnRyYW5zcGlsZU1vZHVsZSIsImJhYmVsLnBhcnNlIiwicGF0aCIsInBhdGguZGlybmFtZSIsInBhdGgucmVsYXRpdmUiLCJjd2QiLCJhbmthRGVmYXVsdENvbmZpZy50ZW1wbGF0ZSIsImFua2FEZWZhdWx0Q29uZmlnLnBhcnNlcnMiLCJhbmthRGVmYXVsdENvbmZpZy5wbHVnaW5zIiwiYW5rYURlZmF1bHRDb25maWcuaWdub3JlZCIsInBhdGgucmVzb2x2ZSIsImN1c3RvbUNvbmZpZyIsInN5c3RlbS5zcmNEaXIiLCJmcy5yZWFkRmlsZSIsImZzLndyaXRlRmlsZSIsInBhdGguYmFzZW5hbWUiLCJwYXRoLmV4dG5hbWUiLCJmcy5yZWFkRmlsZVN5bmMiLCJsb2ciLCJjaG9raWRhci53YXRjaCIsInRzbGliXzEuX19leHRlbmRzIiwidXRpbHMubG9nZ2VyIiwidXRpbHMuY3JlYXRlRmlsZSIsInV0aWxzLmFzeW5jRnVuY3Rpb25XcmFwcGVyIiwidXRpbHMuY2FsbFByb21pc2VJbkNoYWluIiwicGF0aC5zZXAiLCJsb2dnZXIiLCJ1dGlscy5zZWFyY2hGaWxlcyIsImZzLmVuc3VyZURpclN5bmMiLCJ1dGlscy5nZW5GaWxlV2F0Y2hlciIsImZzLnVubGluayIsImRvd25sb2FkUmVwbyIsIkZzRWRpdG9yIiwiY29uZmlnIiwiUHJvZCIsIkRldiIsIkluaXQiLCJDcmVhdGVQYWdlIiwiQ3JlYXRlQ29tcG9uZW50IiwiRW5yb2xsQ29tcG9uZW50Iiwic2VtdmVyLnNhdGlzZmllcyIsInNlbXZlci5jbGVhbiIsImNmb250cy5yZW5kZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHQSxJQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUE7QUFFekIsd0JBQXlCLEtBQXlCLEVBQUUsSUFBYTtJQUF4QyxzQkFBQSxFQUFBLFVBQXlCO0lBQzlDLElBQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQTtJQUN2QixJ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
