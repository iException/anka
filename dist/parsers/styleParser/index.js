"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var logger_1 = require("../../utils/logger");
var postcssrc = require('postcss-load-config');
var postcss = require('postcss');
var postcssConfig = {};
var internalPlugins = [];
var tasks = [];
exports.default = (function (file, compilation, cb) {
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
    logger_1.default.error('loadConfig', err.message, err);
});
function exec(config, file, compilation, cb) {
    file.convertContentToString();
    postcss(config.plugins.concat(internalPlugins)).process(file.content, __assign({}, config.options, { from: file.sourceFile })).then(function (root) {
        file.content = root.css;
        file.ast = root.root.toResult();
        file.updateExt('.wxss');
        cb();
    }).catch(function (err) {
        logger_1.default.error('Compile', file.sourceFile, err);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvcGFyc2Vycy9zdHlsZVBhcnNlci9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBT0EsNkNBQXVDO0FBRXZDLElBQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFBO0FBQ2hELElBQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQTtBQUNsQyxJQUFNLGFBQWEsR0FBUSxFQUFFLENBQUE7QUFDN0IsSUFBTSxlQUFlLEdBQWtDLEVBQUUsQ0FBQTtBQUN6RCxJQUFNLEtBQUssR0FBVSxFQUFFLENBQUE7QUFRdkIsbUJBQXVCLFVBQWlDLElBQVUsRUFBRSxXQUF3QixFQUFFLEVBQVk7SUFDdEcsSUFBSSxhQUFhLENBQUMsT0FBTyxFQUFFO1FBQ3ZCLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQTtLQUM3QztTQUFNO1FBQ0gsS0FBSyxDQUFDLElBQUksQ0FBQztZQUNQLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUM5QyxDQUFDLENBQUMsQ0FBQTtLQUNMO0FBQ0wsQ0FBQyxFQUFBO0FBRUQsZ0JBQWdCLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBQyxNQUFXO0lBQ2hDLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBQyxJQUFjLElBQUssT0FBQSxJQUFJLEVBQUUsRUFBTixDQUFNLENBQUMsQ0FBQTtBQUM3QyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBQyxHQUFVO0lBQ2hCLGdCQUFNLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxHQUFHLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0FBQ2hELENBQUMsQ0FBQyxDQUFBO0FBR0YsU0FBUyxJQUFJLENBQUUsTUFBVyxFQUFFLElBQVUsRUFBRSxXQUF3QixFQUFFLEVBQVk7SUFDMUUsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUE7SUFDN0IsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsYUFDL0QsTUFBTSxDQUFDLE9BQU8sSUFDakIsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVLEdBQ0UsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFDLElBQW9CO1FBQ25ELElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQTtRQUN2QixJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7UUFDL0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUN2QixFQUFFLEVBQUUsQ0FBQTtJQUNSLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFDLEdBQVU7UUFDaEIsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDLENBQUE7UUFDN0MsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFBO1FBQ3JCLEVBQUUsRUFBRSxDQUFBO0lBQ1IsQ0FBQyxDQUFDLENBQUE7QUFDTixDQUFDO0FBRUQsU0FBUyxnQkFBZ0IsQ0FBRSxLQUFzQjtJQUF0QixzQkFBQSxFQUFBLFVBQXNCO0lBQzdDLE9BQU8sYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFDLE1BQVc7UUFDM0YsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUE7SUFDaEUsQ0FBQyxDQUFDLENBQUE7QUFDTixDQUFDIn0=