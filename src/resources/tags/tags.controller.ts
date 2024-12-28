import { Response, NextFunction } from "express";
import { TagsServices } from ".";
import { HttpException } from "../../utils/exceptions/http.exceptions";
import tagModel from "./tags.model";
import { RoleType } from "../users/user.Interface";
import { AuthUserRequest } from "../../middlewares/auth.middleware";
import userModel from "../users/user.model";
// import tagsModel from "./tags.model";

export class TagController {
    async addTag(req: AuthUserRequest, res: Response, next: NextFunction) {
        // if (!req.files || Object.keys(req.files).length === 0) {
        //     return res.status(400).send('No files were uploaded.');
        // }
        const { incident, action, locations, sample, userId, modelId, taggedInfo, objectName, text, presence, type } = req.body


        if (!userId) {
            res.status(400).send('please login into the app')
        }
        try {
            const files = req.files;
            let imageFile: Express.Multer.File | null = null;
            let fileName;
            let evidenceFile;
            if (typeof files === 'object' && files !== null && 'evidence' in files && Array.isArray(files['evidence'])) {
                imageFile = files['evidence'][0];
                evidenceFile = imageFile?.buffer
                fileName = imageFile?.originalname
            }

            const data = await TagsServices.addTags(incident, objectName, fileName, action, locations, sample, userId, modelId, evidenceFile, taggedInfo, text, presence, type);
            res.status(200).json({
                status: "success",
                data,
                message: 'tag added successfully'
            })
        } catch (error: any) {
            next(new HttpException(400, error.message));

        }
    }

    async updateTag(req: AuthUserRequest, res: Response, next: NextFunction) {

        try {
            const id = req.params.id
            const { incident, frequency, locations, sample, userId, modelId, taggedInfo, objectName, text, presence, type, action } = req.body
            const files = req.files;
            let imageFile: Express.Multer.File | null = null;
            let fileName;
            let evidenceFile;
            if (typeof files === 'object' && files !== null && 'evidence' in files && Array.isArray(files['evidence'])) {
                imageFile = files['evidence'][0];
                evidenceFile = imageFile?.buffer
                fileName = imageFile?.originalname
            }

            const tag = await tagModel.findByIdAndUpdate(id, {
                incident, objectName, fileName, frequency, locations, sample, userId, modelId, evidenceFile, taggedInfo, text, presence, type, action
            })

            res.status(200).json({
                message: 'tag updated successfully',
                data: tag
            })
        } catch (error: any) {
            return { error: error.message };
        }
    }

    async deleteTag(req: AuthUserRequest, res: Response, next: NextFunction) {
        try {
            await tagModel.findByIdAndDelete(req.params.id)
            res.status(200).json({
                message: 'tag deleted successfully',
            })
        } catch (error: any) {
            return { error: error.message };
        }
    }
    // async getTotalTagsBySampleAndMonth(req: AuthUserRequest, res: Response, next: NextFunction) {
    //     try {
    //         //const { sampleName } = req.query;

    //         const data = await TagsServices.getTotalTagsBySampleAndMonth()
    //         res.status(200).json({
    //             message: ' successfully',
    //             data
    //         })
    //     } catch (error: any) {
    //                 return {error:error.message};
    //     }
    // }
    async getTotalTagsBySampleAndDay(req: AuthUserRequest, res: Response, next: NextFunction) {
        // try {
        //     //const { sampleName } = req.query;

        //     const data = await TagsServices.getTotalTagsBySampleAndDay()
        //     res.status(200).json({
        //         message: 'successfully',
        //         data
        //     })
        // } catch (error: any) {
        //             return {error:error.message};
        // }
    }
    async deleteModelTags(req: AuthUserRequest, res: Response, next: NextFunction) {
        try {
            const id = req.params.id

            const data = await TagsServices.deleteModelTags(id)
            res.status(200).json({
                message: 'successfully',
                data
            })
        } catch (error: any) {
            return { error: error.message };
        }
    }
    async allTags(req: AuthUserRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.userId;
            const user = await userModel.findById(userId).exec();

            if (!user) {
                return res.status(400).send({ error: 'User not found' });
            }


            // Check if user is not found or if user is not a super admin
            if (user.role === RoleType.superAdmin) {

                // If user is a super admin, retrieve all tags without location filter
                const tags = await tagModel.find()
                    .populate({ path: 'user' })
                    .populate({ path: 'sample' })
                    .populate({ path: 'model', populate: [{ path: 'location' }, { path: 'comments' }] })
                    .sort({ createdAt: -1 });
                res.status(200).json({
                    message: 'All tags',
                    data: tags,
                    status: "success",
                });

            } else {

                // If user is not a super admin, filter tags based on user's allowed locations
                const tags = await tagModel.find()
                    .populate({ path: 'user', select: 'locations email username' })
                    .populate({ path: 'sample' })
                    .populate({ path: 'model', populate: [{ path: 'location' }, { path: 'comments' }] })
                    .sort({ createdAt: -1 });
                res.status(200).json({
                    message: 'Filtered tags based on user\'s allowed locations',
                    data: [...tags.filter((i: any) => i.user?.locations?.valueOf() === user?.locations?.valueOf())],
                    status: "success",
                });
            }
        } catch (error: any) {
            next(new HttpException(400, error.message));
        }
    }
}

