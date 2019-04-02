"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(fn) {
    return function () {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i] = arguments[_i];
        }
        var limitation = params.length;
        return new Promise(function (resolve) {
            if (fn.length > limitation) {
                fn.apply(void 0, params.concat(new Array(fn.length - limitation - 1).fill(undefined)).concat([resolve]));
            }
            else {
                fn.apply(void 0, params.splice(0, fn.length - 1).concat([resolve]));
            }
        });
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN5bmNGdW5jdGlvbldyYXBwZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdXRpbHMvYXN5bmNGdW5jdGlvbldyYXBwZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtQkFBeUIsRUFBWTtJQUNqQyxPQUFPO1FBQVUsZ0JBQVM7YUFBVCxVQUFTLEVBQVQscUJBQVMsRUFBVCxJQUFTO1lBQVQsMkJBQVM7O1FBQ3RCLElBQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUE7UUFFaEMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxVQUFBLE9BQU87WUFDdEIsSUFBSSxFQUFFLENBQUMsTUFBTSxHQUFHLFVBQVUsRUFBRTtnQkFDeEIsRUFBRSxlQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDLE1BQU0sR0FBRyxVQUFVLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLFNBQUUsT0FBTyxJQUFDO2FBQ3ZGO2lCQUFNO2dCQUNILEVBQUUsZUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxTQUFFLE9BQU8sSUFBQzthQUNsRDtRQUNMLENBQUMsQ0FBQyxDQUFBO0lBQ04sQ0FBQyxDQUFBO0FBQ0wsQ0FBQztBQVpELDRCQVlDIn0=