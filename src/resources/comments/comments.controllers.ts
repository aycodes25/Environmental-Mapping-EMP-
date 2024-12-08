import { Response, NextFunction } from "express";
import { commentService } from ".";
import { AuthUserRequest } from "@/middlewares/auth.middleware";


export class CommentController {
    async addComment(req: AuthUserRequest, res: Response, next: NextFunction) {
        try {
            const { userId, tagId, comment } = req.body
            const data = await commentService.addComment(userId, tagId, comment)
            console.log(req.body);

            res.json({
                message: "success",
                data
            })

        } catch (error: any) {
            next(new Error(error.message));
        }
    }
}