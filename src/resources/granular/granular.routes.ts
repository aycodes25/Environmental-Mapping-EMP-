import multer from 'multer';
import { Router } from "express"
import { authenticateUser } from "../../middlewares/auth.middleware";
import { GtagController } from './granular.controller';


const storage = multer.memoryStorage();
const upload = multer({ storage: storage })
const fields = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'model', maxCount: 1 }
])
export class Granular {
    path = "/Gtags"
    router = Router();

    private gTag = new GtagController()
    constructor() {
        this.initialiseRoutes();
    }
    private initialiseRoutes(): void {
        this.router.post(
            `${this.path}/create-Gtags`,
            authenticateUser,
            fields,
            this.gTag.createGtag
        );
        // this.router.put(
        //     `${this.path}/update-sample/:id`,
        //     authenticateUser,
        //     fields,
        //     this.sample.updateSample
        // );
        // this.router.get(
        //     `${this.path}/samples`,
        //     authenticateUser,
        //     this.sample.getSample
        // );
        this.router.delete(
            `${this.path}/gtag-delete/:id`,
            authenticateUser,
            this.gTag.deleteSample
        );

    }
}