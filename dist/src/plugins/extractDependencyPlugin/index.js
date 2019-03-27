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
var path = require("path");
var babel = require("@babel/core");
var traverse_1 = require("@babel/traverse");
var generator_1 = require("@babel/generator");
var dependencyPool = new Map();
var resovleModuleName = require('require-package-name');
exports.default = (function () {
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
            traverse_1.default(file.ast, {
                enter: function (path) {
                    if (path.isImportDeclaration()) {
                        var node = path.node;
                        var source = node.source;
                        if (source &&
                            source.value &&
                            typeof source.value === 'string') {
                            resolve(source, file.sourceFile, file.targetFile, localDependencyPool);
                        }
                    }
                    if (path.isCallExpression()) {
                        var node = path.node;
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
            file.content = generator_1.default(file.ast, {
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
        return __awaiter(this, void 0, void 0, function () {
            var file;
            return __generator(this, function (_a) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvcGx1Z2lucy9leHRyYWN0RGVwZW5kZW5jeVBsdWdpbi9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMkJBQTRCO0FBRTVCLG1DQUFvQztBQUNwQyw0Q0FBc0M7QUFDdEMsOENBQTRDO0FBUzVDLElBQU0sY0FBYyxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFBO0FBQ2hELElBQU0saUJBQWlCLEdBQUcsT0FBTyxDQUFDLHNCQUFzQixDQUFDLENBQUE7QUFFekQsbUJBQXdCO0lBQ3BCLElBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQTtJQUM3QixJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUE7SUFDbkMsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFBO0lBQ3JDLElBQU0sVUFBVSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQUksTUFBTSxDQUFDLE1BQVEsQ0FBQyxDQUFBO0lBQ2xELElBQU0sZUFBZSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQUksTUFBTSxDQUFDLGlCQUFtQixDQUFDLENBQUE7SUFFbEUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsRUFBRSxVQUFVLFdBQXdCLEVBQUUsRUFBWTtRQUN0RSxJQUFNLElBQUksR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFBO1FBQzdCLElBQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFBO1FBQ3pDLElBQU0sbUJBQW1CLEdBQUcsSUFBSSxHQUFHLEVBQWtCLENBQUE7UUFHckQsSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLEtBQUssRUFBRTtZQUV4QixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDWCxJQUFJLENBQUMsR0FBRyxH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