"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var postcssWximport_1 = require("./postcssWximport");
var postcss = require('postcss');
var cssnano = require('postcss-normalize-whitespace');
var internalPlugins = [postcssWximport_1.default];
exports.default = (function () {
    var utils = this.getUtils();
    var logger = utils.logger;
    var config = this.getSystemConfig();
    var testSrcDir = new RegExp("^" + config.srcDir);
    this.on('before-compile', function (compilation, cb) {
        var file = compilation.file;
        if (!config.ankaConfig.devMode) {
            internalPlugins.push(cssnano);
        }
        var handler = postcss(internalPlugins);
        if (file.extname === '.wxss' && testSrcDir.test(file.sourceFile)) {
            handler.process((file.ast || file.content), {
                from: file.sourceFile
            }).then(function (root) {
                file.content = root.css;
                file.ast = root.root.toResult();
                cb();
            }, function (err) {
                logger.error('Error', file.sourceFile, err);
                compilation.destroy();
                cb();
            });
        }
        else {
            cb();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvcGx1Z2lucy93eEltcG9ydFBsdWdpbi9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQVFBLHFEQUErQztBQUUvQyxJQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUE7QUFDbEMsSUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLDhCQUE4QixDQUFDLENBQUE7QUFDdkQsSUFBTSxlQUFlLEdBQWtDLENBQUMseUJBQWUsQ0FBQyxDQUFBO0FBRXhFLG1CQUF1QjtJQUNuQixJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7SUFFekIsSUFBQSxxQkFBTSxDQUNEO0lBQ1QsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFBO0lBQ3JDLElBQU0sVUFBVSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQUksTUFBTSxDQUFDLE1BQVEsQ0FBQyxDQUFBO0lBRWxELElBQUksQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLEVBQWlCLFVBQVUsV0FBd0IsRUFBRSxFQUFZO1FBQ3JGLElBQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUE7UUFFN0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFO1lBQzVCLGVBQWUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7U0FDaEM7UUFFRCxJQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUE7UUFFeEMsSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLE9BQU8sSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUM5RCxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUF1RCxFQUFFO2dCQUM5RixJQUFJLEVBQUUsSUFBSSxDQUFDLFVBQVU7YUFDRSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUMsSUFBb0I7Z0JBQ25ELElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQTtnQkFDdkIsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFBO2dCQUMvQixFQUFFLEVBQUUsQ0FBQTtZQUNSLENBQUMsRUFBRSxVQUFDLEdBQVU7Z0JBQ1YsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxHQUFHLENBQUMsQ0FBQTtnQkFDM0MsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFBO2dCQUNyQixFQUFFLEVBQUUsQ0FBQTtZQUNSLENBQUMsQ0FBQyxDQUFBO1NBQ0w7YUFBTTtZQUNILEVBQUUsRUFBRSxDQUFBO1NBQ1A7SUFDTCxDQUFDLENBQUMsQ0FBQTtBQUNOLENBQUMsRUFBQSJ9