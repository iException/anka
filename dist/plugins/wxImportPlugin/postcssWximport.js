"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var postcss = require("postcss");
exports.default = postcss.plugin('postcss-wximport', function () {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zdGNzc1d4aW1wb3J0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3BsdWdpbnMvd3hJbXBvcnRQbHVnaW4vcG9zdGNzc1d4aW1wb3J0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsaUNBQWtDO0FBRWxDLGtCQUFlLE9BQU8sQ0FBQyxNQUFNLENBQUMsa0JBQWtCLEVBQUU7SUFDOUMsT0FBTyxVQUFDLElBQWtCO1FBQ3RCLElBQUksT0FBTyxHQUFrQixFQUFFLENBQUE7UUFFL0IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUUsVUFBQyxJQUFvQjtZQUM5QyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUE7WUFDNUQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFBO1FBQ2pCLENBQUMsQ0FBQyxDQUFBO1FBQ0YsSUFBSSxDQUFDLE9BQU8sT0FBWixJQUFJLEVBQVksT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFDLElBQVk7WUFDckMsT0FBTztnQkFDSCxJQUFJLEVBQUUsUUFBUTtnQkFDZCxNQUFNLEVBQUUsSUFBSTthQUNmLENBQUE7UUFDTCxDQUFDLENBQUMsRUFBQztRQUNILE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFBO0lBQ3RCLENBQUMsQ0FBQTtBQUNMLENBQUMsQ0FBQyxDQUFBIn0=