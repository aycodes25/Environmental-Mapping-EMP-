import { Router } from "express";
import { FilesController } from "./files.controller";

import { authenticateUser } from "../../middlewares/auth.middleware";

// handles managing local files
export class FilesRoute {
    router = Router();

    path = "/file"

    private controller = new FilesController();
    constructor() {
        this.initialiseRoutes()
    }

    private initialiseRoutes(): void {
        this.router.get(
            `${this.path}/:filename`,
            this.controller.getFile
        );
    }
}