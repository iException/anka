"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("../config");
exports.default = (function (file, compilation, callback) {
    file.targetFile = file.targetFile.replace(config_1.default.srcDir, config_1.default.distDir);
    callback();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGVQYXJzZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvcGFyc2Vycy90ZW1wbGF0ZVBhcnNlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLG9DQUE4QjtBQWE5QixtQkFBdUIsVUFBaUMsSUFBVSxFQUFFLFdBQXdCLEVBQUUsUUFBa0I7SUFDNUcsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxnQkFBTSxDQUFDLE1BQU0sRUFBRSxnQkFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQ3hFLFFBQVEsRUFBRSxDQUFBO0FBQ2QsQ0FBQyxFQUFBIn0=