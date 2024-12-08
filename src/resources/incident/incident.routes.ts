import { Incident } from './incident.model';
import multer from 'multer';
import { Router } from "express"
import { authenticateUser } from "../../middlewares/auth.middleware";
import { IncidentController } from './incident.controller';


const storage = multer.memoryStorage();
const upload = multer({ storage: storage })
const fields = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'model', maxCount: 1 }
])
export class IncidentRoutes {
    path = "/incident"
    router = Router();

    private Incident = new IncidentController()
    constructor() {
        this.initialiseRoutes();
    }
    private initialiseRoutes(): void {
        this.router.post(
            `${this.path}/create-incident`,
            authenticateUser,
            fields,
            this.Incident.createIncident
        );
        this.router.put(
            `${this.path}/update-incident/:id`,
            authenticateUser,
            fields,
            this.Incident.updateIncident
        );
        this.router.get(
            `${this.path}/incidents`,
            authenticateUser,
            this.Incident.getIncident
        );
        this.router.delete(
            `${this.path}/incident-delete/:id`,
            authenticateUser,
            this.Incident.deleteIncident
        );

    }
}