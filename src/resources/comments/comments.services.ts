import { Tag } from "../tags"
import tagsModel from "../tags/tags.model"
import userModel from "../users/user.model"
import commentsModel from "./comments.model"

export const addComment = async (
    userId: string,
    tag: string,
    comment: string,
): Promise<any> => {
    try {
        const user = await userModel.findOne({ _id: userId })
        const tagged = await tagsModel.findOne({ _id: tag })
        if (!user) {
            return {error: 'User not found'};
        };

        if (!tagged) {
            return {error: 'tag not found'};
        }
        tagged.model

        const Comment = await commentsModel.create({
            user,
            tag: tag,
            model: tagged.model,
            comment
        })

        return Comment;
    
    } catch (error: any) {
        throw new Error(error.message)
    }

}