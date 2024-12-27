
import aws from 'aws-sdk'
import modelModel from "./model.model";
import { UploadEvidenceToS3, deleteFileFromDisk, deleteObjectFromS3, extractAWSKeyFromCoverPhotoUrl, saveToDisk, uploadFilesToS3 } from "../../utils/aws/aws";
import { endOfToday, startOfDay, startOfToday, subDays } from 'date-fns';
import locationsModels from "../locations/locations.models";
import userModel from "../users/user.model";
import { RoleType } from '../users/user.Interface';

const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'us-east-1',
    apiVersion: '2006-03-01',
    signatureVersion: 'v4',
});
const S3_BUCKET_NAME = 'enviromentalmapping';
export const createModel = async (
    modelName: string,
    description: string,
    userId: string,
    modelFile: any,
    size: number | undefined,
    imageFile: any,
    imageFileName: any,
    modelFileName: any,
    location: string,
    twoDFileData?: any,
    twoDFileName?: string
): Promise<any> => {
    try {
        const user = await userModel.findOne({ _id: userId })
        if (!user) { return { error: "user not found" } }
        if (!size) size = 0
        const modelKey = `models/${user.username}/${modelName}/${modelFileName}`;
        const imageKey = `coverPhoto/${user.username}/${imageFileName}`;
        const twoDimageKey = `twoD/${user.username}/${twoDFileName}`;
        const locationModelRetrieved = await locationsModels.findOne({ _id: location });

        // Generate a unique 4-digit slug
        let slug;
        let slugExists = true;
        while (slugExists) {
            slug = `FAC-${Math.floor(1000 + Math.random() * 9000)}`;
            slugExists = await modelModel.exists({ slug }) !== null;
        }

        const { modelUrl, coverPhotoUrl } = await (async () => {
            if (process.env.NODE_ENV === "development") {
                let modelUrl = await saveToDisk(modelFile, modelKey)
                let coverPhotoUrl = await saveToDisk(imageFile, imageKey)
                return { modelUrl, coverPhotoUrl }
            }
            return uploadFilesToS3(modelFile, imageFile, modelKey, imageKey);
        })()
        let model;
        if (twoDFileData && twoDFileName) {

            const twoDUrl = await (async () => {
                if (process.env.NODE_ENV === "development") {
                    let twoDUrl = await saveToDisk(twoDFileData, twoDimageKey)
                    return twoDUrl
                }
                return UploadEvidenceToS3(twoDFileData, twoDimageKey)
            })()

            model = modelModel.create({
                description,
                slug,
                modelName,
                file: modelUrl,
                size,
                coverPicture: coverPhotoUrl,
                user,
                location: locationModelRetrieved,
                twoD: twoDUrl,
            });
        } else {
            model = modelModel.create({
                description,
                slug,
                modelName,
                file: modelUrl,
                size,
                coverPicture: coverPhotoUrl,
                user,
                location: locationModelRetrieved
            });
        }

        // Push the model to the user's models array
        // user.models.push((await model).id);
        // await user.save();
        // Push the model to the location's models array
        if (locationModelRetrieved) {
            locationModelRetrieved.models.push((await model).id);

            // Save the updated locationModelRetireved document
            await locationModelRetrieved.save();
        }



        return model
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);

    }

}
// export const createCoverPhoto = async (
//     id: string,
//     modelFile: any
// ): Promise<any> => {
//     try {
//         const Model = await modelModel.findOne({ _id: id })
//         if (!Model) throw new Error("model not found")
//         const modelKey = `models/coverphotos/${Model?.modelName}`;
//         const uploadModelParams = {
//             Bucket: S3_BUCKET_NAME,
//             Key: modelKey,
//             Body: modelFile,
//         };
//         await Promise.all([
//             s3.upload(uploadModelParams).promise(),
//         ]);
//         console.log('upload to s3');

//         // Construct URLs for uploaded files
//         const photoUrl = `https://YOUR_S3_BUCKET_NAME.s3.amazonaws.com/${modelKey}`;
//         if (!photoUrl) {
//             throw new Error('Failed to upload model');
//         }
//         Model.coverPicture = photoUrl

//         await Model.save()

//         return Model
//     } catch (error: any) {
//                return {error:error.message};

//     }

// }
export const getModel = async (userId: string): Promise<any> => {

    try {

        // Fetch the user
        const user = await userModel.findById(userId).exec();

        if (!user) { return { error: "user not found" } }

        let models;

        if (user.role === RoleType.superAdmin) {
            // If the user is a super admin, fetch all models
            models = await modelModel.find({ delete: false }).sort({ createdAt: -1 }).populate('location').exec();
        } else {
            // If the user is not a super admin, fetch models based on allowed locations
            models = await modelModel.find({ location: user?.locations?.valueOf().valueOf(), delete: false }).sort({ createdAt: -1 }).populate('location').exec();
        }

        return models;
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);

    }

}

export const getSoftedModel = async (userId: string): Promise<any> => {
    try {
        // Fetch the user
        const user = await userModel.findById(userId).exec();

        if (!user) {
            { return { error: "user not found" } }
        }

        let models;

        if (user.role === RoleType.superAdmin) {
            // If the user is a super admin, fetch all soft deleted models
            models = await modelModel.find({ delete: true }).sort({ createdAt: -1 }).populate('location').exec();
        } else {
            // If the user is not a super admin, fetch soft deleted models based on allowed locations
            models = await modelModel.find({ location: user?.locations?.valueOf(), delete: true }).sort({ createdAt: -1 }).populate('location').exec();
        }

        return models;
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);
    }

}

export const restoreSoftedModel = async (id: string): Promise<any> => {
    try {
        const models = await modelModel.findByIdAndUpdate(id, { delete: false });

        return models
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);

    }
}
export const updateModel = async (id: string): Promise<any> => {
    try {
        const models = await modelModel.findByIdAndUpdate(id, { delete: false });

        return models
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);

    }
}

export const getAModel = async (id: string): Promise<any> => {
    try {
        // Find the model by id and populate the 'tags' array
        const model = await modelModel.findOne({ _id: id }).populate({
            path: 'tags',
            model: 'Tag',
            options: { sort: { createdAt: -1 } },
            populate: [
                { path: 'user' },
                { path: 'sample' },
                { path: 'incident' }
            ]
        }).populate({ path: 'location' }).populate({ path: 'gTags' })

        if (!model) {
            return { error: 'Model not found' };
        }

        // Populate the 'user' field within each tag


        return model
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);

    }

}
export const deleteModel = async (id: string): Promise<any> => {
    try {
        const modelToDelete = await modelModel.findById(id);



        if (!modelToDelete) {
            return { error: 'Model not found' };
        }
        // Delete cover photo from AWS S3 if it exists
        if (modelToDelete.coverPicture) {
            try {
                const extractedKey = extractAWSKeyFromCoverPhotoUrl(modelToDelete.coverPicture)
                if (process.env.NODE_ENV === "development") {
                    deleteFileFromDisk(modelToDelete.coverPicture)
                } else {
                    await deleteObjectFromS3(modelToDelete.coverPicture);
                }
            } catch (error) {
                console.error('Failed to delete cover photo from AWS S3:', error);
            }
        }

        // Delete the model from the database
        await modelModel.findByIdAndDelete({ _id: id })

    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);

    }

}
export const softDeleteModel = async (modelIds: any): Promise<any> => {
    try {
        const softDeletedModels = await modelModel.updateMany(
            { _id: { $in: modelIds } }, // Find models with IDs in the 'ids' array
            { delete: true },
            { new: true } // Set the 'deleted' field to true for the matched models
        );

        // console.log(softDeletedModels);

        return softDeletedModels
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);

    }

}

export const restoreSoftDeletedModels = async (modelIds: any): Promise<any> => {
    try {
        const softDeletedModels = await modelModel.updateMany(
            { _id: { $in: modelIds } }, // Find models with IDs in the 'ids' array
            { delete: false },
            { new: true } // Set the 'deleted' field to true for the matched models
        );

        // console.log(softDeletedModels);

        return softDeletedModels
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);

    }

}
export const deleteMultipleModels = async (ids: any): Promise<any> => {
    try {
        const result = await modelModel.deleteMany({ _id: { $in: ids } });
        return result;
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);
    }
}

export const updateLocationAndUser = async (modelId: string): Promise<any> => {
    try {
        // Find the model by ID to get its location and user
        const model = await modelModel.findById(modelId);

        if (!model) {
            throw new Error('Model not found');
        }

        // Remove the model ID from the location's models array
        await locationsModels.updateOne(
            { _id: model.location },
            { $pull: { models: model._id } }
        );

        // Remove the model ID from the user's models array
        await userModel.updateOne(
            { _id: model.user },
            { $pull: { models: model._id } }
        );
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);
    }
}

export const getUpdatedModels = async (startTime: any, endTime: string | number | Date): Promise<any> => {
    try {
        // Query the database to get updated models within the specified time frame
        const updatedModels = await modelModel.find({
            updatedAt: { $gte: new Date(startTime), $lte: new Date(endTime) }
        });

        if (!updatedModels) throw new Error("model not found")


        return updatedModels
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);

    }

}
export const totalModels = async (userId: string): Promise<any> => {
    try {
        // Fetch the user
        const user = await userModel.findById(userId).exec();

        if (!user) {
            throw new Error('User not found');
        }

        let totalModels;

        if (user.role === RoleType.superAdmin) {
            // If the user is a super admin, count all models
            totalModels = await modelModel.countDocuments({ delete: false });
        } else {
            // If the user is not a super admin, count models based on allowed locations
            totalModels = await modelModel.countDocuments({ location: user?.locations?.valueOf(), delete: false });
        }

        return totalModels;
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);
    }
};

export const totalModelsByLocation = async (locationId: string): Promise<any> => {
    try {
        if (!locationId) {
            throw new Error('Location ID and Location Name are required');
        }

        // Count models based on the provided location ID and include the location name in the response
        const totalModels = await modelModel.countDocuments({ location: locationId, delete: false });

        return totalModels;
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);
    }
};

export const totalDeletedModels = async (userId: string): Promise<any> => {
    try {
        // Fetch the user
        const user = await userModel.findById(userId).exec();

        if (!user) {
            throw new Error('User not found');
        }

        let totalDeletedModels;

        if (user.role === RoleType.superAdmin) {
            // If the user is a super admin, count all deleted models
            totalDeletedModels = await modelModel.countDocuments({ deleted: true });
        } else {
            // If the user is not a super admin, count deleted models based on allowed locations
            totalDeletedModels = await modelModel.countDocuments({ location: user?.locations?.valueOf(), deleted: true });
        }

        return totalDeletedModels;
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);
    }
};
export const recentModels = async (userId: string): Promise<any> => {
    try {
        // Fetch the user
        const user = await userModel.findById(userId).exec();

        if (!user) {
            throw new Error('User not found');
        }

        let recentModels;

        if (user.role === RoleType.superAdmin) {
            // If the user is a super admin, fetch recent models without location restriction
            recentModels = await modelModel.find({ delete: false })
                .populate({ path: 'location' })
                .populate({ path: 'user' })
                .sort({ createdAt: -1 })
                .limit(9);
        } else {
            // If the user is not a super admin, fetch recent models based on allowed locations
            recentModels = await modelModel.find({ delete: false, location: user?.locations?.valueOf() })
                .populate({ path: 'location' })
                .populate({ path: 'user' })
                .sort({ createdAt: -1 })
                .limit(9);
        }

        return recentModels;
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);
    }

}
export const todayModels = async (userId: string): Promise<any> => {
    try {
        // Fetch the user
        const user = await userModel.findById(userId).exec();

        if (!user) {
            throw new Error('User not found');
        }

        let totalModels;

        const todayStart = startOfToday();
        const todayEnd = endOfToday();

        if (user.role === RoleType.superAdmin) {
            // If the user is a super admin, count all models created today
            totalModels = await modelModel.countDocuments({ delete: false, createdAt: { $gte: todayStart, $lte: todayEnd } });
        } else {
            // If the user is not a super admin, count models based on allowed locations created today
            totalModels = await modelModel.countDocuments({ location: user?.locations?.valueOf(), delete: false, createdAt: { $gte: todayStart, $lte: todayEnd } });
        }

        return totalModels;
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);

    }

}



export const todayModelsByLocation = async (locationId: string): Promise<any> => {
    try {
        if (!locationId) {
            throw new Error('Location ID and Location Name are required');
        }

        const todayStart = startOfToday();
        const todayEnd = endOfToday();

        // Count models created today based on the provided location ID
        const totalModels = await modelModel.countDocuments({
            location: locationId,
            delete: false,
            createdAt: { $gte: todayStart, $lte: todayEnd }
        });

        return totalModels;
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);
    }
};
export const weekModels = async (): Promise<any> => {
    try {
        // Get today's date in normal date format (YYYY-MM-DD)
        // Calculate the date one week ago
        const oneWeekAgo = subDays(new Date(), 7);

        // Find the start of today
        const todayStart = startOfDay(new Date());

        // Fetch the models added within the past week based on their creation date
        const modelsAddedInWeek = await modelModel.countDocuments({
            createdAt: { $gte: oneWeekAgo, $lte: todayStart }
        });

        return modelsAddedInWeek
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);

    }

}
export const modelsEachDay = async (): Promise<any> => {
    try {
        // Get today's date in normal date format (YYYY-MM-DD)
        // Calculate the date one week ago
        const oneWeekAgo = subDays(new Date(), 7);

        // Find the start of today
        const todayStart = startOfDay(new Date());

        // Fetch the models added within the past week based on their creation date
        const modelsAddedInWeek = await modelModel.countDocuments({
            createdAt: { $gte: oneWeekAgo, $lte: todayStart }
        });

        return modelsAddedInWeek
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);

    }

}
export const modelsEachLocation = async (userId: string): Promise<any> => {
    try {
        // Fetch the user
        const user = await userModel.findById(userId).exec();

        if (!user) {
            throw new Error('User not found');
        }

        let modelsInEachLocation;

        if (user.role === RoleType.superAdmin) {
            // If the user is a super admin, aggregate all models in each location
            modelsInEachLocation = await modelModel.aggregate([
                {
                    $match: {
                        location: { $exists: true, $ne: null } // Filter out models without a location
                    }
                },
                {
                    $group: {
                        _id: '$location', // Group by location field in the model documents
                        totalModels: { $sum: 1 } // Count the number of models in each location
                    }
                }, {
                    $lookup: {
                        from: 'locations', // Name of the locations collection
                        localField: '_id',
                        foreignField: '_id',
                        as: 'locationData'
                    }
                },
                {
                    $unwind: {
                        path: '$locationData',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        _id: 1,
                        totalModels: 1,
                        locationName: '$locationData.name' // Project the name field from the joined location documents
                    }
                }
            ]);
            return modelsInEachLocation.filter(model => model.locationName);
        } else {
            // If the user is not a super admin, aggregate models in each location based on allowed locations
            modelsInEachLocation = await modelModel.aggregate([
                {
                    $match: {
                        location: user?.locations?.valueOf()
                    }
                },
                {
                    $group: {
                        _id: '$location', // Group by location field in the model documents
                        totalModels: { $sum: 1 } // Count the number of models in each location
                    }
                }, {
                    $lookup: {
                        from: 'locations', // Name of the locations collection
                        localField: '_id',
                        foreignField: '_id',
                        as: 'locationData'
                    }
                },
                {
                    $unwind: {
                        path: '$locationData',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        _id: 1,
                        totalModels: 1,
                        locationName: '$locationData.name' // Project the name field from the joined location documents
                    }
                }
            ]);
            return modelsInEachLocation.filter(model => model.locationName);
        }

        // Filter out any null or empty location names

    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);
    }
};
export const recentlyUpdatedModels = async (): Promise<any> => {
    try {
        const oneDayAgo = subDays(new Date(), 1);

        // Find models updated in the last day
        const recentlyUpdatedModels = await modelModel.find({ updatedAt: { $gte: oneDayAgo } }).populate({ path: 'location' }).populate({ path: 'user' });



        return recentlyUpdatedModels
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);

    }

};

export const recentlyTaggeddModels = async (userId: string): Promise<any> => {
    try {
        // Fetch the user
        const user = await userModel.findById(userId).exec();

        if (!user) {
            throw new Error('User not found');
        }

        let recentlyTaggedModels;

        if (user.role === RoleType.superAdmin) {
            // If the user is a super admin, find models where the updatedAt field matches the current date and time
            const currentDate = new Date();
            recentlyTaggedModels = await modelModel.find({ updatedAt: currentDate }).populate('location').populate('user');
        } else {
            // If the user is not a super admin, find models where the updatedAt field matches the current date and time
            // and the model's location is one of the user's allowed locations
            const currentDate = new Date();
            recentlyTaggedModels = await modelModel.find({
                updatedAt: currentDate,
                location: user?.locations?.valueOf()
            }).populate('location').populate('user');
        }

        return recentlyTaggedModels;
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);
    }
};
export const getRecentlyViewedModelsAndUsers = async (): Promise<any> => {
    try {
        // Get the current date and time in ISO format
        const recentlyViewedModels = await modelModel.find().populate({ path: 'location' }).populate({ path: 'user' })
            .sort({ 'viewers.viewedAt': -1 }) // Sort by most recent views
            .limit(10) // Limit to the latest 10 models
            .populate('viewers.userId');

        // Return recently viewed models along with users who viewed them
        return recentlyViewedModels;
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);

    }

}
export const getTotalModelsPerDayOfWeek = async (userId: string): Promise<any> => {
    try {
        // Fetch the user
        const user = await userModel.findById(userId).exec();

        if (!user) {
            throw new Error('User not found');
        }

        let result;

        if (user.role === RoleType.superAdmin) {
            // If the user is a super admin, aggregate total models per day of the week
            result = await modelModel.aggregate([
                {
                    $group: {
                        _id: { $dayOfWeek: { $toDate: '$createdAt' } }, // Extract day of the week from createdAt field
                        count: { $sum: 1 }, // Count the number of models
                    },
                },
                {
                    $project: {
                        dayOfWeek: '$_id', // Rename _id to dayOfWeek
                        count: 1, // Include the count field
                        _id: 0, // Exclude _id field
                    },
                },
                {
                    $sort: { dayOfWeek: 1 }, // Sort by day of the week (Monday to Sunday)
                },
            ]);
        } else {
            // If the user is not a super admin, aggregate total models per day of the week based on allowed locations
            result = await modelModel.aggregate([
                {
                    $match: {
                        location: user?.locations?.valueOf()
                    }
                },
                {
                    $group: {
                        _id: { $dayOfWeek: { $toDate: '$createdAt' } }, // Extract day of the week from createdAt field
                        count: { $sum: 1 }, // Count the number of models
                    },
                },
                {
                    $project: {
                        dayOfWeek: '$_id', // Rename _id to dayOfWeek
                        count: 1, // Include the count field
                        _id: 0, // Exclude _id field
                    },
                },
                {
                    $sort: { dayOfWeek: 1 }, // Sort by day of the week (Monday to Sunday)
                },
            ]);
        }

        return result;
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);
    }
};

export const getTotalModelsPerMonth = async (userId: string): Promise<any> => {
    try {
        // Fetch the user
        const user = await userModel.findById(userId).exec();

        if (!user) {
            throw new Error('User not found');
        }

        //console.log(user);

        let result;



        if (user.role === RoleType.superAdmin) {
            // If the user is a super admin, aggregate total models per month
            result = await modelModel.aggregate([
                {
                    $project: {
                        month: { $month: { $toDate: '$createdAt' } }, // Extract month from createdAt field
                    },
                },
                {
                    $group: {
                        _id: '$month', // Group by month
                        count: { $sum: 1 }, // Count the number of models
                    },
                },
                {
                    $sort: { _id: 1 }, // Sort by month in ascending order
                },
            ]);
        } else {
            // If the user is not a super admin, aggregate total models per month based on allowed locations
            result = await modelModel.aggregate([
                {
                    $match: {
                        location: user?.locations?.valueOf()
                    }
                },
                {
                    $project: {
                        month: { $month: { $toDate: '$createdAt' } }, // Extract month from createdAt field
                    },
                },
                {
                    $group: {
                        _id: '$month', // Group by month
                        count: { $sum: 1 }, // Count the number of models
                    },
                },
                {
                    $sort: { _id: 1 }, // Sort by month in ascending order
                },
            ]);
        }
        // console.log(result);
        return result;
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);
    }
};
export const getTotalModelsPerMonthByLocation = async (locationId: string): Promise<any> => {
    try {
        if (!locationId) {
            throw new Error('Location ID is required');
        }

        // Aggregate total models per month based on the provided location ID
        const result = await modelModel.aggregate([
            {
                $match: {
                    location: locationId,
                },
            },
            {
                $project: {
                    month: { $month: { $toDate: '$createdAt' } }, // Extract month from createdAt field
                },
            },
            {
                $group: {
                    _id: '$month', // Group by month
                    count: { $sum: 1 }, // Count the number of models
                },
            },
            {
                $sort: { _id: 1 }, // Sort by month in ascending order
            },
        ]);

        return result;
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);
    }
};

export const updateModels = async (id: string, modelName: string, description: string, location: any, coverPicture: any, twoDFile?: any): Promise<any> => {
    try {
        const result = await modelModel.findByIdAndUpdate(
            id,
            { modelName, description, location, coverPicture, twoDFile },
        )
        return result
    } catch (error: any) {
        throw new Error(`Server error: ${error.message}`);

    }

}

