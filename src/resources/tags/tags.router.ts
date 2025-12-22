import { Router } from "express";
import { TagController } from "./tags.controller";
import multer from 'multer';

import { authenticateUser } from "../../middlewares/auth.middleware";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage })
const fields = upload.fields([
    { name: 'evidence', maxCount: 1 },
    { name: 'model', maxCount: 1 }
])
export class TagsRoute {
    path = '/tag';
    router = Router();

    private tag = new TagController();
    constructor() {
        this.initialiseRoutes()
    }

    private initialiseRoutes(): void {
        /**
         * @POST v1/tag/Add
         * @DESC add tag
         */
        this.router.post(
            `${this.path}/add`,
            authenticateUser,
            fields,
            this.tag.addTag
        );
        this.router.get(
            `${this.path}/all-tags`,
            authenticateUser,
            this.tag.allTags
        );

        this.router.get(
            `${this.path}/paginated-tags`,
            authenticateUser,
            this.tag.paginatedTags
        );

        this.router.put(
            `${this.path}/update-tag/:id`,
            authenticateUser,
            fields,
            this.tag.updateTag
        );
        this.router.delete(
            `${this.path}/tags-delete/:id`,
            authenticateUser,
            this.tag.deleteTag
        );
        // this.router.get(
        //     `${this.path}/total-samples-month`,
        //     authenticateUser,
        //     this.tag.getTotalTagsBySampleAndMonth
        // );
        // this.router.get(
        //     `${this.path}/total-samples-day`,
        //     authenticateUser,
        //     this.tag.getTotalTagsBySampleAndDay
        // );
        this.router.delete(
            `${this.path}/delete-model-tags/:id`,
            authenticateUser,
            this.tag.deleteModelTags
        );




    }
}