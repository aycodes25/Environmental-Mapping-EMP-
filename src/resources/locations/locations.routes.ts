import { Router } from "express"
import { LocationController } from "./locations.controllers";
import multer from 'multer';
import { authenticateUser } from "../../middlewares/auth.middleware";

// check - please use disk
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage, 
    fileFilter: (req, file, cb) => {
        // Check if file is empty
        if (!file || file.size === 0) {
            return cb(null, false); // Reject the file
        }
        cb(null, true); // Accept the file
    }
})

const fields = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'model', maxCount: 1 }
])

export class LocationRoutes {
    path = "/location"
    router = Router();

    private location = new LocationController
    constructor() {
        this.initialiseRoutes();
    }
    private initialiseRoutes(): void {
        this.router.post(
            `${this.path}/create-location`,
            authenticateUser,
            fields,
            this.location.createLocation
        );
        this.router.get(
            `${this.path}/locations`,
            authenticateUser,
            this.location.getLocations
        );
        this.router.put(
            `${this.path}/location-update/:id`,
            authenticateUser,
            fields,
            this.location.updateLocations
        );
        this.router.delete(
            `${this.path}/location-delete/:id`,
            authenticateUser,
            this.location.deleteLocations
        );

    }
}