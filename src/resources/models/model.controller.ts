import { Response, NextFunction } from "express";
import { modelService } from ".";
import { HttpException } from "../../utils/exceptions/http.exceptions";
import modelModel from "./model.model";
import { saveToDisk, UploadSampleToS3 } from "../../utils/aws/aws";
import { AuthUserRequest } from "@../../middlewares/auth.middleware";
import objectGroupsModel from "./object-groups.model";

export class ModelController {
    async createModel(req: AuthUserRequest, res: Response, next: NextFunction) {
        try {
            if (!req.files || Object.keys(req.files).length === 0) {
                return res.status(400).send({ status: "error", message: 'No files were uploaded.' });
            }
            const { modelName, description, userId, location, size } = req.body;
            const files = req.files;
            // console.log(files);

            let imageFile: Express.Multer.File | null = null;
            let modelFile: Express.Multer.File | null = null;
            let twoDFile: Express.Multer.File | null = null;
            if (!modelName || !description) {
                res.status(400).send({ status: "error", message: 'add model name or description' })
            }
            if (!userId || !location) {
                res.status(400).send({ status: "error", message: 'add user or location' })
            }
            if (typeof files === 'object' && files !== null && 'image' in files && Array.isArray(files['image'])) {
                imageFile = files['image'][0];
            }
            if (typeof files === 'object' && files !== null && 'model' in files && Array.isArray(files['model'])) {
                modelFile = files['model'][0];
            }

            if (typeof files === 'object' && files !== null && 'twoD' in files && Array.isArray(files['twoD'])) {
                twoDFile = files['twoD'][0];
            }
            const modelData = modelFile?.buffer
            const imageData = imageFile?.buffer
            const imageFileName = imageFile?.originalname
            const modelFileName = modelFile?.originalname
            const twoDFileData = twoDFile?.buffer;
            const twoDFileName = twoDFile?.originalname
            let data;
            if (typeof files === 'object' && files !== null && 'twoD' in files && Array.isArray(files['twoD'])) {
                data = await modelService.createModel(modelName, description, userId, modelData, size, imageData, imageFileName, modelFileName, location, twoDFileData, twoDFileName);
            } else {
                data = await modelService.createModel(modelName, description, userId, modelData, size, imageData, imageFileName, modelFileName, location);
            }
            res.json({
                status: "success",
                data,
                message: 'Model upload'
            })

        } catch (error: any) {
            next(new HttpException(400, error.message));
        }

    }
    async createModelCoverPhoto(req: AuthUserRequest, res: Response, next: NextFunction) {
        try {
            if (!req.files || Object.keys(req.files).length === 0) {
                return res.status(400).send({ status: "error", message: 'No files were uploaded.' });
            }
            // const { id } = req.body;
            // const files = req.files;

            // let imageFile: Express.Multer.File | null = null;

            // if (typeof files === 'object' && files !== null && 'image' in files && Array.isArray(files['image'])) {
            //     imageFile = files['image'][0];
            // }
            // const modelFile = imageFile?.buffer

            // const data = await modelService.createCoverPhoto(id, modelFile);
            // res.json({
            //     status: "sucess",
            //     data,
            //     message: 'photo upload'
            // })

        } catch (error: any) {
            next(new HttpException(400, error.message));
        }

    }
    async getModels(req: AuthUserRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                // Handle case when user ID is not found
                return res.status(400).send({ error: 'User ID not found' });
            }
            const data = await modelService.getModel(userId)
            res.json({
                status: "success",
                data,
                message: 'all models'
            })

        } catch (error: any) {
            next(new HttpException(400, error.message));
        }

    }

    async getSoftedModel(req: AuthUserRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                // Handle case when user ID is not found
                return res.status(400).send({ error: 'User ID not found' });
            }
            const data = await modelService.getSoftedModel(userId)
            res.json({
                status: "success",
                data,
                message: 'soft deleted models'
            })
            3

        } catch (error: any) {
            next(new HttpException(400, error.message));
        }

    }

    async restoreSoftedModel(req: AuthUserRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const data = await modelService.restoreSoftedModel(id)
            res.json({
                status: "success",
                data,
                message: 'model restored'
            })

        } catch (error: any) {
            next(new HttpException(400, error.message));
        }

    }

    async restoreSoftedModels(req: AuthUserRequest, res: Response, next: NextFunction) {
        try {
            const { modelIds } = req.body
            if (!Array.isArray(modelIds) || modelIds.length === 0) {
                return res.status(400).send({ status: "error", message: 'Invalid or empty model IDs provided' });
            }
            const data = await modelService.softDeleteModel(modelIds)
            res.json({
                status: "success",
                data,
                message: 'model restored successfully'
            })

        } catch (error: any) {
            next(new HttpException(400, error.message));
        }

    }

    async getAModel(req: AuthUserRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params

            const data = await modelService.getAModel(id)
            res.json({
                status: "success",
                data,
                message: 'get a model'
            })

        } catch (error: any) {
            next(new HttpException(400, error.message));
        }

    }
    async deletAModel(req: AuthUserRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params

            await modelService.deleteModel(id)
            res.json({
                status: "success",
                message: 'model deleted successfully'
            })

        } catch (error: any) {
            next(new HttpException(400, error.message));
        }

    }
    async softDeletAModel(req: AuthUserRequest, res: Response, next: NextFunction) {
        try {
            const { modelIds } = req.body
            if (!Array.isArray(modelIds) || modelIds.length === 0) {
                return res.status(400).send({ status: "error", message: 'Invalid or empty model IDs provided' });
            }
            const data = await modelService.softDeleteModel(modelIds)
            res.json({
                status: "success",
                data,
                message: 'model moved to recycle bin'
            })

        } catch (error: any) {
            next(new HttpException(400, error.message));
        }

    }

    async deleteMultipleModels(req: AuthUserRequest, res: Response, next: NextFunction) {
        const { modelIds } = req.body;

        try {
            // Call the controller function to delete models
            const result = await modelService.deleteMultipleModels(modelIds);
            // Update locations and users after successful deletion
            await Promise.all(modelIds.map(async (modelId: string) => {
                await modelService.updateLocationAndUser(modelId);
            }));

            res.status(200).json({ message: 'Models deleted successfully', result });
        } catch (error: any) {
            res.status(500).json({ status: "error", message: error.message });
        }
    }

    async getUpdatedModels(req: AuthUserRequest, res: Response) {
        try {
            const startTimeStr = req.query.startTime as string;
            const endTimeStr = req.query.endTime as string;

            // Parse the query parameters as dates
            const startTime = new Date(startTimeStr);
            const endTime = new Date(endTimeStr);

            const data = await modelService.getUpdatedModels(startTime, endTime)
            // Send the updated models in the response
            res.status(200).json({ data });
        } catch (error) {
            console.error('Error fetching updated models:', error);
            res.status(500).json({ status: "error", message: 'Failed to fetch updated models' });
        }
    };


    async UpdatedModel(req: AuthUserRequest, res: Response) {
        try {
            const id = req.params.id;
            const files = req.files;
            if (!id) {
                return res.status(400).send({ status: "error", message: 'Model ID is required' });
            }

            const { description, modelName, location } = req.body;

            let coverPicture;
            let model;
            let twoD;
            const existingModel = await modelModel.findById(id);

            if (!existingModel) {
                return res.status(404).json({ status: "error", message: 'Model not found' });
            }

            if (!existingModel.coverPicture && !files) {
                return res.status(400).send({ status: "error", message: 'Cover picture is required' });
            }
            const checkfiles = async (req: any) => {
                if (req.files) {
                    return true;
                }
            }
            const filesCheck = await checkfiles(req);
            if (filesCheck) {
                let imageFile: Express.Multer.File | null = null;
                let twoDFile: Express.Multer.File | null = null;
                // Check if the uploaded file is an array
                if (typeof files === 'object' && files !== null && 'image' in files && Array.isArray(files['image'])) {
                    imageFile = files['image'][0];
                    const imageData = imageFile?.buffer;
                    const imageFileName = imageFile?.originalname;
                    const imageKey = `coverPhoto/${existingModel?.modelName}/${imageFileName}`;
                    try {
                        coverPicture = await (async () => {
                            if (process.env.NODE_ENV === "development") {
                                let imageUrl = await saveToDisk(imageData, imageKey)
                                return imageUrl
                            }
                            return UploadSampleToS3(imageData, imageKey)
                        })()
                    } catch (error: any) {
                        return res.status(500).json({ message: "Failed to upload image to S3", error: error.message });
                    }
                }

                if (typeof files === 'object' && files !== null && 'twoD' in files && Array.isArray(files['twoD'])) {
                    twoDFile = files['twoD'][0];
                    const imageData = twoDFile?.buffer;
                    const twoDFileName = twoDFile?.originalname;
                    const twoDKey = `twoDKey/${existingModel?.modelName}/${twoDFileName}`;
                    try {
                        twoD = await (async () => {
                            if (process.env.NODE_ENV === "development") {
                                let imageUrl = await saveToDisk(imageData, twoDKey)
                                return imageUrl
                            }
                            return UploadSampleToS3(imageData, twoDKey)
                        })()
                    } catch (error: any) {
                        return res.status(500).json({ status: "error", message: "Failed to upload 2d image to S3", error: error.message });
                    }
                }

            }

            try {
                model = await modelService.updateModels(id, modelName, description, location, coverPicture || existingModel.coverPicture, twoD || existingModel.twoD);
            } catch (error: any) {
                return res.status(500).json({ status: "error", message: "Failed to update model", error: error.message });
            }

            res.status(200).json({ model });
        } catch (error: any) {
            console.error('Error updating model:', error);
            res.status(500).json({ status: "error", message: 'Failed to update model' });
        }
    }

    async createObjectGroup(req: AuthUserRequest, res: Response, next: NextFunction) {
        try {
            const { modelId } = req.params;
            const { name, cameraPosition, cameraDirection, cameraRotation } = req.body;

            // Check if the model exists
            const existingModel = await modelModel.findById(modelId);
            if (!existingModel) {
                res.status(404).json({ message: "Model not found" });
                return;
            }

            const newObjectGroup = new objectGroupsModel({
                name,
                cameraPosition,
                cameraDirection,
                cameraRotation,
                modelId: modelId,
            });

            const savedObjectGroup = await newObjectGroup.save();
            res.status(201).json(savedObjectGroup);
        } catch (error) {
            console.error("Error creating object group:", error);
            next(new HttpException(500, "Internal server error"));
        }
    }

    async getObjectGroupsByModel(req: AuthUserRequest, res: Response, next: NextFunction) {
        try {
            const { modelId } = req.params;

            // Check if the model exists
            const existingModel = await modelModel.findById(modelId);
            if (!existingModel) {
                res.status(404).json({ message: "Model not found" });
                return;
            }

            const objectGroups = await objectGroupsModel.find({ modelId: modelId });
            res.status(200).json(objectGroups);
        } catch (error) {
            console.error("Error getting object groups:", error);
            next(new HttpException(500, "Internal server error"));
        }
    }

    async deleteObjectGroup(req: AuthUserRequest, res: Response, next: NextFunction) {
        try {
            const { modelId, objectGroupId } = req.params;

            // Check if the model exists
            const existingModel = await modelModel.findById(modelId);
            if (!existingModel) {
                res.status(404).json({ message: "Model not found" });
                return;
            }

            // Check if the object group exists
            const existingObjectGroup = await objectGroupsModel.findById(objectGroupId);
            if (!existingObjectGroup) {
                res.status(404).json({ message: "Object group not found" });
                return;
            }

            // Delete the object group
            await objectGroupsModel.findByIdAndDelete(objectGroupId);
            res.status(200).json({ message: "Object group deleted" });
        } catch (error) {
            console.error("Error deleting object group:", error);
            next(new HttpException(500, "Internal server error"));
        }
    }

}
