"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var fs = require("fs");
var path = require("path");
var config_1 = require("../config");
var utils = require("../utils");
var core_1 = require("../core");
var logger = utils.logger, FsEditor = utils.FsEditor;
var EnrollComponentCommand = (function (_super) {
    __extends(EnrollComponentCommand, _super);
    function EnrollComponentCommand() {
        var _this = _super.call(this, 'enroll <components...>', 'Enroll a miniprogram component') || this;
        _this.setExamples('$ anka enroll button --global', '$ anka enroll /components/button/button --global', '$ anka enroll /components/button/button --page=/pages/index/index');
        _this.setOptions('-p, --page <page>', 'which page components enroll to');
        _this.setOptions('-g, --global', 'enroll components to app.json');
        _this.$compiler = new core_1.Compiler();
        return _this;
    }
    EnrollComponentCommand.prototype.action = function (components, options) {
        return __awaiter(this, void 0, void 0, function () {
            var page, global, editor;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        page = options.page, global = options.global;
                        editor = new FsEditor();
                        if (!global && !page) {
                            logger.warn('Where components enroll to?');
                            return [2];
                        }
                        return [4, Promise.all(components.map(function (component) {
                                return _this.enrollComponent(component, editor, global ? '' : page);
                            }))];
                    case 1:
                        _a.sent();
                        logger.success('Done', 'Have a nice day 🎉 !');
                        return [2];
                }
            });
        });
    };
    EnrollComponentCommand.prototype.enrollComponent = function (component, editor, page) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, ankaConfig, projectConfig, CwdRegExp, componentPath, componentName, appConfigPath, componentAbsPath, pageAbsPath, pageJsonPath, pageJson;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = config_1.default, ankaConfig = _a.ankaConfig, projectConfig = _a.projectConfig;
                        CwdRegExp = new RegExp("^" + config_1.default.cwd);
                        componentPath = component.split(path.sep).length === 1 ?
                            path.join(ankaConfig.components, component, component) :
                            component;
                        componentName = componentPath.split(path.sep).pop();
                        appConfigPath = path.join(config_1.default.srcDir, 'app.json');
                        componentAbsPath = path.join(config_1.default.srcDir, componentPath);
                        if (!fs.existsSync(path.join(path.dirname(componentAbsPath), componentName + '.json'))) {
                            logger.warn('Component dose not exists', componentAbsPath);
                            return [2];
                        }
                        if (!page) return [3, 2];
                        pageAbsPath = path.join(config_1.default.srcDir, page);
                        pageJsonPath = path.join(path.dirname(pageAbsPath), path.basename(pageAbsPath) + '.json');
                        if (!fs.existsSync(pageJsonPath)) {
                            logger.warn('Page dose not exists', pageAbsPath);
                            return [2];
                        }
                        pageJson = JSON.parse(fs.readFileSync(pageJsonPath, {
                            encoding: 'utf8'
                        }) || '{}');
                        this.ensureUsingComponents(pageJson);
                        if (pageJson.usingComponents[componentName]) {
                            logger.warn('Component already enrolled in', pageAbsPath);
                            return [2];
                        }
                        pageJson.usingComponents[componentName] = path.relative(path.dirname(pageAbsPath), componentAbsPath);
                        editor.writeJSON(pageJsonPath, pageJson);
                        return [4, editor.save()];
                    case 1:
                        _b.sent();
                        logger.success("Enroll " + componentPath + " in", pageAbsPath.replace(CwdRegExp, ''));
                        return [3, 4];
                    case 2:
                        this.ensureUsingComponents(projectConfig);
                        if (projectConfig.usingComponents[componentName]) {
                            logger.warn('Component already enrolled in', 'app.json');
                            return [2];
                        }
                        projectConfig.usingComponents[componentName] = path.relative(path.dirname(appConfigPath), componentAbsPath);
                        editor.writeJSON(appConfigPath, projectConfig);
                        return [4, editor.save()];
                    case 3:
                        _b.sent();
                        logger.success("Enroll " + componentPath + " in", 'app.json');
                        _b.label = 4;
                    case 4: return [2];
                }
            });
        });
    };
    EnrollComponentCommand.prototype.ensureUsingComponents = function (config) {
        if (!config.usingComponents) {
            config.usingComponents = {};
        }
    };
    return EnrollComponentCommand;
}(core_1.Command));
exports.default = EnrollComponentCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5yb2xsQ29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbW1hbmRzL2Vucm9sbENvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHVCQUF3QjtBQUN4QiwyQkFBNEI7QUFDNUIsb0NBQStCO0FBQy9CLGdDQUFpQztBQUNqQyxnQ0FBMkM7QUFRbkMsSUFBQSxxQkFBTSxFQUFFLHlCQUFRLENBQVU7QUFFbEM7SUFBb0QsMENBQU87SUFDdkQ7UUFBQSxZQUNJLGtCQUNJLHdCQUF3QixFQUN4QixnQ0FBZ0MsQ0FDbkMsU0FtQko7UUFqQkcsS0FBSSxDQUFDLFdBQVcsQ0FDWiwrQkFBK0IsRUFDL0Isa0RBQWtELEVBQ2xELG1FQUFtRSxDQUN0RSxDQUFBO1FBRUQsS0FBSSxDQUFDLFVBQVUsQ0FDWCxtQkFBbUIsRUFDbkIsaUNBQWlDLENBQ3BDLENBQUE7UUFFRCxLQUFJLENBQUMsVUFBVSxDQUNYLGNBQWMsRUFDZCwrQkFBK0IsQ0FDbEMsQ0FBQTtRQUVELEtBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxlQUFRLEVBQUUsQ0FBQTs7SUFDbkMsQ0FBQztJQUVLLHVDQUFNLEdBQVosVUFBYyxVQUEwQixFQUFFLE9BQWdEOzs7Ozs7O3dCQUVsRixJQUFJLEdBRUosT0FBTyxLQUZILEVBQ0osTUFBTSxHQUNOLE9BQU8sT0FERCxDQUNDO3dCQUNMLE1BQU0sR0FBRyxJQUFJLFFBQVEsRUFBRSxDQUFBO3dCQUU3QixJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSxFQUFFOzRCQUNsQixNQUFNLENBQUMsSUFBSSxDQUFDLDZCQUE2QixDQUFDLENBQUE7NEJBQzFDLFdBQU07eUJBQ1Q7d0JBRUQsV0FBTSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsVUFBQSxTQUFTO2dDQUN0QyxPQUFP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