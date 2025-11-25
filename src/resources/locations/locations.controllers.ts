import { Request, Response, NextFunction } from "express";
import locationsModels from "./locations.models";
import { saveToDisk, UploadSampleToS3 } from "../../utils/aws/aws";
import { AuthUserRequest } from "@/middlewares/auth.middleware";
import userModel from "../users/user.model";
import { RoleType } from "../users/user.Interface";
import { toObjectId } from "../../utils/mongo";

export class LocationController {
    async createLocation(req: AuthUserRequest, res: Response, next: NextFunction) {
        try {
            const { name, user } = req.body
            const files = req.files;
            const location = "Texas"
            let newLocation
            if (!name) {
                return res.status(400).send({ status: "error", message: 'Name is required' });
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
                const locationId = toObjectId(user?.locations);
                const locations = locationId
                    ? await locationsModels
                        .find({ _id: locationId })
                        .sort({ createdAt: -1 })
                        .populate('user')
                    : [];

                // Send the response
                res.status(200).json({
                    message: 'success',
                    data: locations
                });
            }
        } catch (error: any) {
            return { error: error.message };
        }
    }
    async updateLocations(req: AuthUserRequest, res: Response, next: NextFunction) {
        try {
            const id = req.params.id
            const { name } = req.body
            const location = "Texas"
            let locations;
            const files = req.files;
            
            if (!id) {
                return res.status(400).send({ status: "error", message: 'Location ID is required' });
            }

            const existingLocation = await locationsModels.findById(id)

            if (!existingLocation) {
                return res.status(404).send('Location not found');  // Updated error message
            }

            // Create update object with only provided fields
            const updateData: { name?: string; location?: string; image?: string } = {};
            if (name) updateData.name = name;
            if (location) updateData.location = location;

            if (files) {
                // File was sent, handle the upload
                let imageFile: Express.Multer.File | null = null;

                if (typeof files === 'object' && files !== null && 'image' in files && Array.isArray(files['image'])) {
                    imageFile = files['image'][0];
                }

                const imageData = imageFile?.buffer;
                const imageFileName = imageFile?.originalname;
                const imageKey = `samples/${existingLocation.name}/${imageFileName}`;

                const imageUrl = await (async () => {
                    if (process.env.NODE_ENV === "development") {
                        let evidenceUrl = await saveToDisk(imageData, imageKey)
                        return evidenceUrl
                    }
                    return UploadSampleToS3(imageData, imageKey)
                })()

                updateData.image = imageUrl;
            }

            // Update location with only the provided fields
            locations = await locationsModels.findByIdAndUpdate(
                id,
                updateData,
                { new: true }
            );

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