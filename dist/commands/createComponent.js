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
var CreateComponentCommand = (function (_super) {
    __extends(CreateComponentCommand, _super);
    function CreateComponentCommand() {
        var _this = _super.call(this, 'new-cmpt <components...>', 'Create a miniprogram component') || this;
        _this.setExamples('$ anka new-cmpt button', '$ anka new-cmpt /components/button/button', '$ anka new-cmpt /components/button/button --global');
        _this.setOptions('-r, --root <subpackage>', 'save component to subpackages');
        _this.$compiler = new core_1.Compiler();
        return _this;
    }
    CreateComponentCommand.prototype.action = function (components, options) {
        return __awaiter(this, void 0, void 0, function () {
            var root, editor;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        root = options.root;
                        editor = new FsEditor();
                        return [4, Promise.all(components.map(function (component) {
                                return _this.generateComponent(component, editor, root);
                            }))];
                    case 1:
                        _a.sent();
                        logger.success('Done', 'Have a nice day 🎉 !');
                        return [2];
                }
            });
        });
    };
    CreateComponentCommand.prototype.generateComponent = function (component, editor, root) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, ankaConfig, projectConfig, CwdRegExp, componentPath, componentName, context, absolutePath, tpls;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = config_1.default, ankaConfig = _a.ankaConfig, projectConfig = _a.projectConfig;
                        CwdRegExp = new RegExp("^" + config_1.default.cwd);
                        componentPath = component.split(path.sep).length === 1 ?
                            path.join(ankaConfig.components, component, component) :
                            component;
                        componentName = path.basename(componentPath);
                        context = {
                            componentName: componentName,
                            time: new Date().toLocaleString()
                        };
                        absolutePath = root ?
                            path.join(config_1.default.srcDir, ankaConfig.subPackages, root, componentPath) :
                            path.join(config_1.default.srcDir, componentPath);
                        if (fs.existsSync(path.join(path.dirname(absolutePath), componentName + '.json'))) {
                            logger.warn('The component already exists', absolutePath);
                            return [2];
                        }
                        return [4, utils.searchFiles("" + path.join(ankaConfig.template.component, '*.*'))];
                    case 1:
                        tpls = _b.sent();
                        tpls.forEach(function (tpl) {
                            editor.copy(tpl, path.join(path.dirname(absolutePath), componentName + path.extname(tpl)), context);
                        });
                        return [4, editor.save()];
                    case 2:
                        _b.sent();
                        logger.success('Create component', absolutePath.replace(CwdRegExp, ''));
                        return [2];
                }
            });
        });
    };
    return CreateComponentCommand;
}(core_1.Command));
exports.default = CreateComponentCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlQ29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbW1hbmRzL2NyZWF0ZUNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHVCQUF3QjtBQUN4QiwyQkFBNEI7QUFDNUIsb0NBQStCO0FBQy9CLGdDQUFpQztBQUNqQyxnQ0FBMkM7QUFRbkMsSUFBQSxxQkFBTSxFQUFFLHlCQUFRLENBQVU7QUFFbEM7SUFBb0QsMENBQU87SUFDdkQ7UUFBQSxZQUNJLGtCQUNJLDBCQUEwQixFQUMxQixnQ0FBZ0MsQ0FDbkMsU0FjSjtRQVpHLEtBQUksQ0FBQyxXQUFXLENBQ1osd0JBQXdCLEVBQ3hCLDJDQUEyQyxFQUMzQyxvREFBb0QsQ0FDdkQsQ0FBQTtRQUVELEtBQUksQ0FBQyxVQUFVLENBQ1gseUJBQXlCLEVBQ3pCLCtCQUErQixDQUNsQyxDQUFBO1FBRUQsS0FBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLGVBQVEsRUFBRSxDQUFBOztJQUNuQyxDQUFDO0lBRUssdUNBQU0sR0FBWixVQUFjLFVBQTBCLEVBQUUsT0FBZ0Q7Ozs7Ozs7d0JBRWxGLElBQUksR0FDSixPQUFPLEtBREgsQ0FDRzt3QkFDTCxNQUFNLEdBQUcsSUFBSSxRQUFRLEVBQUUsQ0FBQTt3QkFFN0IsV0FBTSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsVUFBQSxTQUFTO2dDQUN0QyxPQUFPLEtBQUksQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFBOzRCQUMxRCxDQUFDLENBQUMsQ0FBQyxFQUFBOzt3QkFGSCxTQUVHLENBQUE7d0JBRUgsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsc0JBQXNCLENBQUMsQ0FBQTs7Ozs7S0FDakQ7SUFFSyxrREFBaUIsR0FBdkIsVUFBeUIsU0FBaUIsRUFBRSxNQUEyQixFQUFFLElBQWE7Ozs7Ozt3QkFDNUUsS0FHYyxnQkFBTSxFQUZ0QixVQUFVLGdCQUFBLEVBQ1YsYUFBYSxtQkFBQSxDQUNTO3dCQUNwQixTQUFTLEdBQUcsSUFBSSxNQUFNLENBQUMsTUFBSSxnQkFBTSxDQUFDLEdBQUssQ0FBQyxDQUFBO3dCQUN4QyxhQUFhLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDOzRCQUMxRCxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7NEJBQ3hELFNBQVMsQ0FBQTt3QkFDUCxhQUFhLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQTt3QkFDNUMsT0FBTyxHQUFHOzRCQUNaLGFBQWEsZUFBQTs0QkFDYixJQUFJLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxjQUFjLEVBQUU7eUJBQ3BDLENBQUE7d0JBQ0ssWUFBWSxHQUFHLElBQUksQ0FBQyxDQUFDOzRCQUN2QixJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFNLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxXQUFXLEVBQUUsSUFBSSxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUM7NEJBQ3ZFLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQU0sQ0FBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLENBQUE7d0JBRTNDLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLEVBQUUsYUFBYSxHQUFHLE9BQU8sQ0FBQyxDQUFDLEVBQUU7NEJBQy9FLE1BQU0sQ0FBQyxJQUFJLENBQUMsOEJBQThCLEVBQUUsWUFBWSxDQUFDLENBQUE7NEJBQ3pELFdBQU07eUJBQ1Q7d0JBRVksV0FBTSxLQUFLLENBQUMsV0FBVyxDQUFDLEtBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUcsQ0FBQyxFQUFBOzt3QkFBcEYsSUFBSSxHQUFHLFNBQTZFO3dCQUUxRixJQUFJLENBQUMsT0FBTyxDQUFDLFVBQUEsR0FBRzs0QkFDWixNQUFNLENBQUMsSUFBSSxDQUNQLEdBQUcsRUFDSCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLEVBQUUsYUFBYSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsRUFDeEUsT0FBTyxDQUNWLENBQUE7d0JBQ0wsQ0FBQyxDQUFDLENBQUE7d0JBRUYsV0FBTSxNQUFNLENBQUMsSUFBSSxFQUFFLEVBQUE7O3dCQUFuQixTQUFtQixDQUFBO3dCQUVuQixNQUFNLENBQUMsT0FBTyxDQUFDLGtCQUFrQixFQUFFLFlBQVksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUE7Ozs7O0tBQzFFO0lBQ0wsNkJBQUM7QUFBRCxDQUFDLEFBdkVELENBQW9ELGNBQU8sR0F1RTFEIn0=