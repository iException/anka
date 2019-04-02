"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var Injection_1 = require("./Injection");
var path = require("path");
var fs = require("fs-extra");
var config_1 = require("../../config");
var utils = require("../../utils");
var Compilation_1 = require("./Compilation");
var messager_1 = require("../../utils/messager");
var callPromiseInChain_1 = require("../../utils/callPromiseInChain");
var asyncFunctionWrapper_1 = require("../../utils/asyncFunctionWrapper");
var logger = utils.logger;
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
        this.config = config_1.default;
        this.initParsers();
        this.initPlugins();
        if (config_1.default.ankaConfig.debug) {
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
        return __awaiter(this, void 0, void 0, function () {
            var plugins, tasks, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (compilation.destroyed)
                            return [2];
                        plugins = this.plugins[event];
                        if (!plugins || !plugins.length)
                            return [2];
                        tasks = plugins.map(function (plugin) {
                            return asyncFunctionWrapper_1.default(plugin);
                        });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4, callPromiseInChain_1.default(tasks, compilation)];
                    case 2:
                        _a.sent();
                        return [3, 4];
                    case 3:
                        e_1 = _a.sent();
                        utils.logger.error('Compile', e_1.message, e_1);
                        return [3, 4];
                    case 4: return [2];
                }
            });
        });
    };
    Compiler.prototype.clean = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, del([
                            path.join(config_1.default.distDir, '**', '*'),
                            "!" + path.join(config_1.default.distDir, 'app.js'),
                            "!" + path.join(config_1.default.distDir, 'app.json'),
                            "!" + path.join(config_1.default.distDir, 'project.config.json')
                        ])];
                    case 1:
                        _a.sent();
                        logger.success('Clean workshop', config_1.default.distDir);
                        return [2];
                }
            });
        });
    };
    Compiler.prototype.launch = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startupTime, filePaths, files, compilations;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger.startLoading('Launching...');
                        startupTime = Date.now();
                        return [4, utils.searchFiles("**/*", {
                                cwd: config_1.default.srcDir,
                                nodir: true,
                                quiet: false,
                                absolute: true,
                                ignore: config_1.default.ankaConfig.ignored
                            })];
                    case 1:
                        filePaths = _a.sent();
                        return [4, Promise.all(filePaths.map(function (file) {
                                return utils.createFile(file);
                            }))];
                    case 2:
                        files = _a.sent();
                        compilations = files.map(function (file) {
                            return new Compilation_1.default(file, _this.config, _this);
                        });
                        fs.ensureDirSync(config_1.default.distNodeModules);
                        return [4, Promise.all(compilations.map(function (compilations) { return compilations.run(); }))];
                    case 3:
                        _a.sent();
                        if (messager_1.default.hasError()) {
                            messager_1.default.printError();
                        }
                        else {
                            logger.success('Compiled', files.length + " files in " + (Date.now() - startupTime) + "ms");
                            config_1.default.ankaConfig.debug && messager_1.default.printInfo();
                        }
                        return [2];
                }
            });
        });
    };
    Compiler.prototype.watchFiles = function () {
        var _this = this;
        return new Promise(function (resolve) {
            var watcher = utils.genFileWatcher(config_1.default.srcDir + "/**/*", {
                followSymlinks: false,
                ignored: config_1.default.ankaConfig.ignored
            });
            watcher.on('add', function (fileName) { return __awaiter(_this, void 0, void 0, function () {
                var startupTime, file;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            logger.startLoading("Compiling " + fileName);
                            startupTime = Date.now();
                            return [4, utils.createFile(fileName)];
                        case 1:
                            file = _a.sent();
                            return [4, this.generateCompilation(file).run()];
                        case 2:
                            _a.sent();
                            if (messager_1.default.hasError()) {
                                messager_1.default.printError();
                            }
                            else {
                                logger.success('Compiled ', fileName + " in " + (Date.now() - startupTime) + "ms");
                                messager_1.default.printInfo();
                            }
                            return [2];
                    }
                });
            }); });
            watcher.on('unlink', function (fileName) { return __awaiter(_this, void 0, void 0, function () {
                var err_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4, fs.unlink(fileName.replace(config_1.default.srcDir, config_1.default.distDir))];
                        case 1:
                            _a.sent();
                            logger.success('Remove', fileName);
                            return [3, 3];
                        case 2:
                            err_1 = _a.sent();
                            logger.error('Remove', fileName, err_1);
                            return [3, 3];
                        case 3: return [2];
                    }
                });
            }); });
            watcher.on('change', function (fileName) { return __awaiter(_this, void 0, void 0, function () {
                var startupTime, file;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            logger.startLoading("Compiling " + fileName);
                            startupTime = Date.now();
                            return [4, utils.createFile(fileName)];
                        case 1:
                            file = _a.sent();
                            return [4, this.generateCompilation(file).run()];
                        case 2:
                            _a.sent();
                            if (messager_1.default.hasError()) {
                                messager_1.default.printError();
                            }
                            else {
                                logger.success('Compiled', fileName + " in " + (Date.now() - startupTime) + "ms");
                                messager_1.default.printInfo();
                            }
                            return [2];
                    }
                });
            }); });
            watcher.on('ready', function () {
                resolve();
                logger.log('Anka is waiting for changes...');
            });
        });
    };
    Compiler.prototype.generateCompilation = function (file) {
        return new Compilation_1.default(file, this.config, this);
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
        return new Injection_1.PluginInjection(this, options);
    };
    Compiler.prototype.generateParserInjection = function (options) {
        return new Injection_1.ParserInjection(this, options);
    };
    Compiler.compilationId = 1;
    Compiler.compilationPool = new Map();
    return Compiler;
}());
exports.default = Compiler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29tcGlsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29yZS9jbGFzcy9Db21waWxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEseUNBR29CO0FBRXBCLDJCQUE0QjtBQUM1Qiw2QkFBOEI7QUFDOUIsdUNBQWlDO0FBQ2pDLG1DQUFvQztBQUNwQyw2Q0FBdUM7QUFDdkMsaURBQTJDO0FBQzNDLHFFQUErRDtBQUMvRCx5RUFBbUU7QUFVM0QsSUFBQSxxQkFBTSxDQUFVO0FBQ3hCLElBQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQTtBQUsxQjtJQW9CSTtRQWhCQSxZQUFPLEdBRUg7WUFDQSxrQkFBa0IsRUFBRSxFQUFFO1lBQ3RCLGlCQUFpQixFQUFFLEVBQUU7WUFDckIsY0FBYyxFQUFFLEVBQUU7WUFDbEIsYUFBYSxFQUFFLEVBQUU7WUFDakIsZ0JBQWdCLEVBQUUsRUFBRTtZQUNwQixlQUFlLEVBQUUsRUFBRTtZQUNuQixNQUFNLEVBQUUsRUFBRTtTQUNiLENBQUE7UUFDRCxZQUFPLEdBR0YsRUFBRSxDQUFBO1FBR0gsSUFBSSxDQUFDLE1BQU0sR0FBRyxnQkFBTSxDQUFBO1FBQ3BCLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQTtRQUNsQixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUE7UUFFbEIsSUFBSSxnQkFBTSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUU7WUFDekIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsVUFBQyxHQUFHLEVBQUUsS0FBSztnQkFDL0MsSUFBSSxLQUFLLFlBQVksUUFBUTtvQkFBRSxPQUFPLFlBQVksQ0FBQTtnQkFDbEQsT0FBTyxLQUFLLENBQUE7WUFDaEIsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7U0FDVDtJQUNM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