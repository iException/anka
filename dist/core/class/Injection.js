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
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("../../config");
var utils = require("../../utils");
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
        return config_1.default.ankaConfig;
    };
    Injection.prototype.getSystemConfig = function () {
        return config_1.default;
    };
    Injection.prototype.getProjectConfig = function () {
        return config_1.default.projectConfig;
    };
    return Injection;
}());
exports.Injection = Injection;
var PluginInjection = (function (_super) {
    __extends(PluginInjection, _super);
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
exports.PluginInjection = PluginInjection;
var ParserInjection = (function (_super) {
    __extends(ParserInjection, _super);
    function ParserInjection(compiler, options) {
        return _super.call(this, compiler, options) || this;
    }
    ParserInjection.prototype.getOptions = function () {
        return this.options || {};
    };
    return ParserInjection;
}(Injection));
exports.ParserInjection = ParserInjection;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW5qZWN0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NvcmUvY2xhc3MvSW5qZWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUNBLHVDQUFpQztBQUNqQyxtQ0FBb0M7QUFZcEM7SUFJSSxtQkFBYSxRQUFrQixFQUFFLE9BQWdCO1FBQzdDLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFBO1FBQ3hCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBO0lBQzFCLENBQUM7SUFJRCwrQkFBVyxHQUFYO1FBQ0ksT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFBO0lBQ3hCLENBQUM7SUFFRCw0QkFBUSxHQUFSO1FBQ0ksT0FBTyxLQUFLLENBQUE7SUFDaEIsQ0FBQztJQUVELGlDQUFhLEdBQWI7UUFDSSxPQUFPLGdCQUFNLENBQUMsVUFBVSxDQUFBO0lBQzVCLENBQUM7SUFFRCxtQ0FBZSxHQUFmO1FBQ0ksT0FBTyxnQkFBTSxDQUFBO0lBQ2pCLENBQUM7SUFFRCxvQ0FBZ0IsR0FBaEI7UUFDSSxPQUFPLGdCQUFNLENBQUMsYUFBYSxDQUFBO0lBQy9CLENBQUM7SUFDTCxnQkFBQztBQUFELENBQUMsQUE5QkQsSUE4QkM7QUE5QnFCLDhCQUFTO0FBZ0MvQjtJQUFxQyxtQ0FBUztJQUUxQyx5QkFBYSxRQUFrQixFQUFFLE9BQWlDO2VBQzlELGtCQUFNLFFBQVEsRUFBRSxPQUFPLENBQUM7SUFDNUIsQ0FBQztJQUtELG9DQUFVLEdBQVY7UUFDSSxPQUFPLElBQUksQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFBO0lBQzdCLENBQUM7SUFFRCw0QkFBRSxHQUFGLFVBQUksS0FBYSxFQUFFLE9BQXNCO1FBQ3JDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQTtJQUNwQyxDQUFDO0lBQ0wsc0JBQUM7QUFBRCxDQUFDLEFBaEJELENBQXFDLFNBQVMsR0FnQjdDO0FBaEJZLDBDQUFlO0FBa0I1QjtJQUFxQyxtQ0FBUztJQVMxQyx5QkFBYSxRQUFrQixFQUFFLE9BQWlDO2VBQzlELGtCQUFNLFFBQVEsRUFBRSxPQUFPLENBQUM7SUFDNUIsQ0FBQztJQU5ELG9DQUFVLEdBQVY7UUFDSSxPQUFPLElBQUksQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFBO0lBQzdCLENBQUM7SUFLTCxzQkFBQztBQUFELENBQUMsQUFaRCxDQUFxQyxTQUFTLEdBWTdDO0FBWlksMENBQWUifQ==