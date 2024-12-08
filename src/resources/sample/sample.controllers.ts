import incidentModel, { Incident } from './../incident/incident.model';
import { Request, Response, NextFunction } from "express";
import sampleModel from "./sample.model";
import { saveToDisk, UploadSampleToS3 } from "../../utils/aws/aws";
import { AuthUserRequest } from '@/middlewares/auth.middleware';
import userModel from '../users/user.model';
import { RoleType } from '../users/user.Interface';


export class SampleController {
    async createSample(req: AuthUserRequest, res: Response, next: NextFunction) {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(400).send({ status: "error", message: 'Please login again, User not found' });
        }

        // Fetch the user by ID
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(400).send({ status: "error", message: 'User not found' });
        };
        const { name, description } = req.body
        const files = req.files;
        let sample;
        let imageUrl = '';

        if (!name && !description || !user) {
            return res.status(400).send({ status: "error", message: 'name and description is required' });
        }
        if (!files) {
            sample = await sampleModel.create({
                name,
                user,
                description,
                image: imageUrl
            })

        } else {
            // // File was sent, handle the upload
            let imageFile: Express.Multer.File | null = null;

            if (typeof files === 'object' && files !== null && 'image' in files && Array.isArray(files['image'])) {
                imageFile = files['image'][0];

            }
            const imageData = imageFile?.buffer
            const imageFileName = imageFile?.originalname
            const imageKey = `samples/${name}/${imageFileName}`;

            imageUrl = await (async () => {
                if (process.env.NODE_ENV === "development") {
                    let imageUrl = await saveToDisk(imageData, imageKey)
                    return imageUrl
                }
                return UploadSampleToS3(imageData, imageKey)
            })()

            sample = await sampleModel.create({
                name,
                user,
                description,
                image: imageUrl
            })

        }
        try {
            res.status(200).json({
                message: 'success',
                data: sample
            })
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    async updateSample(req: AuthUserRequest, res: Response, next: NextFunction) {
        try {
            const id = req.params.id;
            // console.log(id);

            const { name, description } = req.body;
            const files = req.files;
            let sample;

            if (!name || !description) {
                return res.status(400).send({ status: "error", message: 'no name or description' })
            }
            // Check if the sample ID is provided
            if (!id) {
                return res.status(400).send({ status: "error", message: 'Sample ID is required' });
            }

            // Retrieve the existing sample from the database
            const existingSample = await sampleModel.findById(id);

            if (!existingSample) {
                return res.status(404).send('Sample not found');
            }

            // Check if a file was sent
            if (files) {
                // File was sent, handle the upload
                let imageFile: Express.Multer.File | null = null;

                // Ensure name and description are provided if updating image
                if (!name && !description) {
                    return res.status(400).send({ status: "error", message: 'Name and description are required' });
                }

                // Check if the uploaded file is an array
                if (typeof files === 'object' && files !== null && 'image' in files && Array.isArray(files['image'])) {
                    imageFile = files['image'][0];
                }

                const imageData = imageFile?.buffer;
                const imageFileName = imageFile?.originalname;
                const imageKey = `samples/${existingSample.name}/${imageFileName}`;

                // Upload image to S3 and get the URL
                const imageUrl = await (async () => {
                    if (process.env.NODE_ENV === "development") {
                        let imageUrl = await saveToDisk(imageData, imageKey)
                        return imageUrl
                    }
                    return UploadSampleToS3(imageData, imageKey)
                })()

                // Update sample with new details
                sample = await sampleModel.findByIdAndUpdate(
                    id,
                    { name, description, image: imageUrl },
                    { new: true } // Return the updated sample
                );
            } else {
                // No file was sent, update sample with provided details
                sample = await sampleModel.findByIdAndUpdate(
                    id,
                    { name, description },
                    { new: true } // Return the updated sample
                );
            }

            res.status(200).json({
                message: 'Sample updated successfully',
                data: sample
            });
        } catch (error: any) {
            next(error.message); // Pass the error to the error handling middleware
        }
    }

    async getSample(req: AuthUserRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                // Handle case when user ID is not found
                return res.status(400).send({ status: "error", message: 'Please login again, User not found' });
            }

            // Fetch the user by ID
            const user = await userModel.findById(userId);
            if (!user) {
                return res.status(400).send({ status: "error", message: 'User not found' });
            }
            // console.log(user.locations)
            if (user.role === RoleType.superAdmin) {
                const sample = await sampleModel.find().populate('user', 'username email locations').exec();

                // Send the response
                res.status(200).json({
                    message: 'success',
                    data: sample
                });

            } else {
                const sample = await sampleModel.find().populate('user', 'username email locations').exec();

                // Send the response
                res.status(200).json({
                    message: 'success',
                    data: [...sample.filter((s: any) => s.user?.locations?.valueOf() === user?.locations?.valueOf())]
                });
            }

        } catch (error: any) {
            // Handle errors
            next(error);
        }
    }

    async deleteSample(req: AuthUserRequest, res: Response, next: NextFunction) {
        try {
            await sampleModel.findByIdAndDelete(req.params.id)
            res.status(200).json({
                message: 'success sample deleted',
            })
        } catch (error: any) {
            return res.status(400).send({ status: "error", message: error.message })
        }
    }


}