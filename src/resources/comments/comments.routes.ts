import { Router } from "express";
import { CommentController } from "./comments.controllers";
import { authenticateUser } from "../../middlewares/auth.middleware";

export class CommentRoutes {
    path = "/comment";
    router = Router();

    private Comments = new CommentController()

    constructor() {

        this.initialiseRoutes();
    }
    private initialiseRoutes(): void {
        /**
         * @POST /comment/add
         * @DESC create a comment
         */
        this.router.post(
            `${this.path}/add`,
            authenticateUser,
            this.Comments.addComment
        )
    }
}