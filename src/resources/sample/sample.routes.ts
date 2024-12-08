import multer from 'multer';
import { SampleController } from './sample.controllers';
import { Router } from "express"
import { authenticateUser } from "../../middlewares/auth.middleware";


const storage = multer.memoryStorage();
const upload = multer({ storage: storage })
const fields = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'model', maxCount: 1 }
])
export class SampleRoutes {
    path = "/sample"
    router = Router();

    private sample = new SampleController()
    constructor() {
        this.initialiseRoutes();
    }
    private initialiseRoutes(): void {
        this.router.post(
            `${this.path}/create-samples`,
            authenticateUser,
            fields,
            this.sample.createSample
        );
        this.router.put(
            `${this.path}/update-sample/:id`,
            authenticateUser,
            fields,
            this.sample.updateSample
        );
        this.router.get(
            `${this.path}/samples`,
            authenticateUser,
            this.sample.getSample
        );
        this.router.delete(
            `${this.path}/samples-delete/:id`,
            authenticateUser,
            this.sample.deleteSample
        );

    }
}