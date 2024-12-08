import { Request, Response, NextFunction } from "express";
import locationsModels from "./locations.models";
import { saveToDisk, UploadSampleToS3 } from "../../utils/aws/aws";
import { AuthUserRequest } from "@/middlewares/auth.middleware";
import userModel from "../users/user.model";
import { RoleType } from "../users/user.Interface";

export class LocationController {
    async createLocation(req: AuthUserRequest, res: Response, next: NextFunction) {
        try {
            const { name, location, user } = req.body
            const files = req.files;
            let newLocation
            if (!name || !location) {
                return res.status(400).send({ status: "error", message: 'upload name or location' });
            }
            if (files) {
                // File was sent, handle the upload
                let imageFile: Express.Multer.File | null = null;

                if (typeof files === 'object' && files !== null && 'image' in files && Array.isArray(files['image'])) {
                    imageFile = files['image'][0];

                }
                const imageData = imageFile?.buffer
                const imageFileName = imageFile?.originalname
                const imageKey = `location/${name}/${imageFileName}`;

                const imageUrl = await (async () => {
                    if (process.env.NODE_ENV === "development") {
                        let imageUrl = await saveToDisk(imageData, imageKey)
                        return imageUrl
                    }
                    return UploadSampleToS3(imageData, imageKey)
                })()

                newLocation = await locationsModels.create({
                    name,
                    location,
                    user,
                    image: imageUrl
                })

            } else {
                newLocation = await locationsModels.create({
                    name,
                    location,
                    user,
                })
            }


            res.status(200).json({
                message: 'success',
                data: newLocation
            })
        } catch (error: any) {
            return { error: error.message };
        }
    }
    async getLocations(req: AuthUserRequest, res: Response, next: NextFunction) {
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
                const locations = await locationsModels.find().sort({ createdAt: -1 }).populate('user');

                // Send the response
                res.status(200).json({
                    message: 'success',
                    data: locations
                });

            } else {
                const locations = await locationsModels.find().sort({ createdAt: -1 }).populate('user');

                // Send the response
                res.status(200).json({
                    message: 'success',
                    data: [...locations.filter((s: any) => s._id.valueOf() === user?.locations?.valueOf())]
                });
            }
        } catch (error: any) {
            return { error: error.message };
        }
    }
    async updateLocations(req: AuthUserRequest, res: Response, next: NextFunction) {
        try {
            const id = req.params.id
            const { location, name } = req.body
            let locations;
            const files = req.files;
            // Check if the sample ID is provided
            if (!id) {
                return res.status(400).send({ status: "error", message: 'Location ID is required' });
            }

            const existingLocation = await locationsModels.findById(id)

            if (!existingLocation) {
                return res.status(404).send('Sample not found');
            }


            if (files) {
                // File was sent, handle the upload
                let imageFile: Express.Multer.File | null = null;

                // Ensure name and description are provided if updating image

                // Check if the uploaded file is an array
                if (typeof files === 'object' && files !== null && 'image' in files && Array.isArray(files['image'])) {
                    imageFile = files['image'][0];
                }

                const imageData = imageFile?.buffer;
                const imageFileName = imageFile?.originalname;
                const imageKey = `samples/${existingLocation.name}/${imageFileName}`;

                // Upload image to S3 and get the URL

                const imageUrl = await (async () => {
                    if (process.env.NODE_ENV === "development") {
                        let evidenceUrl = await saveToDisk(imageData, imageKey)
                        return evidenceUrl
                    }
                    return UploadSampleToS3(imageData, imageKey)
                })()

                // Update sample with new details
                locations = await locationsModels.findByIdAndUpdate(
                    id,
                    { location, image: imageUrl, name },
                    { new: true } // Return the updated sample
                );
            } else {
                // No file was sent, update sample with provided details
                locations = await locationsModels.findByIdAndUpdate(
                    id,
                    { location, name },
                    { new: true } // Return the updated sample
                );
            }
            res.status(200).json({
                message: 'success',
                data: locations
            })
        } catch (error: any) {
            return { error: error.message };
        }
    }

    async deleteLocations(req: AuthUserRequest, res: Response, next: NextFunction) {
        try {
            const id = req.params.id
            const locations = await locationsModels.findById(id)
            if (!locations) {
                return res.status(404).json({ status: "error", message: 'Location not found' });
            }
            // Check if the models array is empty
            if (locations.models.length > 0) {
                return res.status(400).json({ status: "error", message: 'Cannot delete location with associated models' });
            } else {
                await locationsModels.findByIdAndDelete(id)
            }
            res.status(200).json({
                message: 'location deleted successfully',
                data: locations
            })
        } catch (error: any) {
            return { error: error.message };
        }
    }


}