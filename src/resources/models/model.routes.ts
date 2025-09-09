import { Router } from "express";
import { ModelController } from "./model.controller";
import multer from 'multer';
import { authenticateUser, authorizeTaggersOrSuperAdmins } from "../../middlewares/auth.middleware";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage })
const fields = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'model', maxCount: 1 },
    { name: 'twoD', maxCount: 1 }
])
export class ModelRoute {
    path = "/model";
    router = Router();
    private model = new ModelController();

    constructor() {
        this.initialiseRoutes();
    }


    
    private initialiseRoutes(): void {
        /**
         * @POST /model/create
         * @DESC create a model
         */
        this.router.post(
            `${this.path}/create-models`,
            authenticateUser,
            //authorizeTaggersOrSuperAdmins,
            fields,
            this.model.createModel
        );
        /**
         * @POST /model/create-coverPhoto
         * @DESC add-coverphoto
         */
        this.router.post(
            `${this.path}/create-coverPhoto`,
            authenticateUser,
            // authorizeTaggersOrSuperAdmins,
            fields,
            this.model.createModelCoverPhoto
        );
        /**
         * @GET /model/get-models
         * @DESC get all Models
         */
        this.router.get(
            `${this.path}/get-models/`,
            authenticateUser,
            // authorizeTaggersOrSuperAdmins,
            this.model.getModels
        );
        this.router.get(
            `${this.path}/get-softed-models/`,
            authenticateUser,
            // authorizeTaggersOrSuperAdmins,
            this.model.getSoftedModel
        );

        this.router.get(
            `${this.path}/restore-softed-models/:id`,
            authenticateUser,
            // authorizeTaggersOrSuperAdmins,
            this.model.restoreSoftedModel
        );

        this.router.post(
            `${this.path}/restore-softed-models/`,
            authenticateUser,
            // authorizeTaggersOrSuperAdmins,
            this.model.restoreSoftedModels
        );
        /**
         * @Get /model/get-model
         * @DESC get a model
         */
        this.router.get(`${this.path}/get-a-models/:id?`, authenticateUser, this.model.getAModel);
        /**
         * @Delete /model/delete-a-models
         * @DESC get a model
         */
        this.router.delete(`${this.path}/delete-a-models/:id?`, authenticateUser, this.model.deletAModel);
        /**
        /**
         * @Delete /model/softedelete-a-models
         * @DESC get a model
         */
        this.router.post(`${this.path}/soft-delete-models/`, authenticateUser, this.model.softDeletAModel);
        /**
         * @Delete /model/get-model
         * @DESC delete multiple models
         */
        this.router.delete(`${this.path}/delete-models/`, authenticateUser, this.model.deletAModel);

        /**
         * @Get /model/get-Updated-models
         * @DESC get updated models
         */
        this.router.get(`${this.path}/get-updated-models`, authenticateUser, this.model.getUpdatedModels)
        /**
         * @Get /model/get-Updated-models
         * @DESC get updated models
         */
        this.router.post(`${this.path}/update-model/:id`, authenticateUser, fields, this.model.UpdatedModel)

        // Object Group Routes
        /**
         * @POST /model/:modelId/object-group
         * @DESC Create an object group for a specific model
         */
        this.router.post(
            `${this.path}/:modelId/object-group`,
            authenticateUser,
            this.model.createObjectGroup
        );

        /**
         * @GET /model/:modelId/object-groups
         * @DESC Get all object groups for a specific model
         */
        this.router.get(
            `${this.path}/:modelId/object-group`,
            authenticateUser,
            this.model.getObjectGroupsByModel
        );

        /**
         * @DELETE /model/:modelId/object-group/:objectGroupId
         * @DESC Delete an object group
         */
        this.router.delete(
            `${this.path}/:modelId/object-group/:objectGroupId`,
            authenticateUser,
            this.model.deleteObjectGroup
        );
    }
}