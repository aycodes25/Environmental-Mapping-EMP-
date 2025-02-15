"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesRoute = void 0;
const express_1 = require("express");
const files_controller_1 = require("./files.controller");
// handles managing local files
class FilesRoute {
    constructor() {
        this.router = (0, express_1.Router)();
        this.path = "/file";
        this.controller = new files_controller_1.FilesController();
        this.initialiseRoutes();
    }
    initialiseRoutes() {
        this.router.get(`${this.path}/:filename`, this.controller.getFile);
    }
}
exports.FilesRoute = FilesRoute;
//# sourceMappingURL=localfile.router.js.map