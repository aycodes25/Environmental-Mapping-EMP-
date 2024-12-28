import moment from "moment";
import { saveToDisk, UploadEvidenceToS3 } from "../../utils/aws/aws";
import modelModel from "../models/model.model"
import userModel from "../users/user.model"
import tagsModel from "./tags.model"
import { Types } from "mongoose"
import { RoleType } from '../users/user.Interface';
export const addTags = async (
    incident: string,
    objectName: string,
    fileName: any,
    action: string,
    locations: string,
    sample: string,
    userId: string,
    modelId: string,
    evidenceFile: any,
    taggedInfo: string,
    text: string,
    presence: string,
    type: string
): Promise<any> => {
    try {
        const Model = await modelModel.findById(modelId)
        const User = await userModel.findById(userId)
        let evidenceKey;
        let evidenceUrl;

        let tagData
        let Tag

        // Generate a unique 4-digit slug
        let slug = "";
        if (type === "sampling") {
            const timestamp = Math.floor(Date.now() / 1000);
            slug = `SAM-${timestamp}`;
        }
        if (type === "incident") {
            const timestamp = Math.floor(Date.now() / 1000);
            slug = `INC-${timestamp}`;
        }

        if (!User || !Model) throw new Error("Invalid User or Model")

        if (fileName && evidenceFile) {
            evidenceKey = `evidence/${Model.modelName}/${fileName}`;
            evidenceUrl = await (async () => {
                if (process.env.NODE_ENV === "development") {
                    let evidenceUrl = await saveToDisk(evidenceFile, evidenceKey)
                    return evidenceUrl
                }
                return UploadEvidenceToS3(evidenceFile, evidenceKey)
            })()
        }

        if (type === "sampling") {
            tagData = {
                objectName,
                evidence: evidenceUrl,
                action,
                sample,
                locations,
                user: User,
                model: Model,
                taggedInfo,
                text,
                presence: presence || "negative",
                type,
                slug
            }
        }
        if (type === "incident") {
            tagData = {
                incident,
                objectName,
                evidence: evidenceUrl,
                action,
                locations,
                user: User,
                model: Model,
                taggedInfo,
                text,
                type,
                slug
            }
        }

        Tag = await tagsModel.create(tagData);

        Model?.tags.push((await Tag)._id)

        await Model?.save()
        return Tag;
    } catch (error: any) {
        return { error: error.message };
    }
}

export const taggedSamplesByday = async (): Promise<any> => {

    try {
        // Use MongoDB aggregation to get the amount of samples tagged on each day of the week
        const result = await tagsModel.aggregate([
            {
                $lookup: {
                    from: 'samples', // Name of the sample collection
                    localField: 'sample',
                    foreignField: '_id',
                    as: 'sample',
                },
            },
            {
                $unwind: '$sample', // Flatten the sample array
            },
            {
                $project: {
                    dayOfWeek: { $dayOfWeek: { $toDate: '$createdAt' } }, // Extract day of the week from createdAt field
                    sampleId: '$sample._id', // Get the sample ID
                },
            },
            {
                $group: {
                    _id: '$dayOfWeek', // Group by day of the week
                    samplesTagged: { $addToSet: '$sampleId' }, // Add sample IDs to set to count unique samples
                },
            },
            {
                $project: {
                    _id: 0, // Exclude _id from the result
                    dayOfWeek: '$_id', // Rename _id to dayOfWeek
                    samplesTagged: { $size: '$samplesTagged' }, // Get the count of unique samples
                },
            },
            {
                $sort: { dayOfWeek: 1 }, // Sort by day of the week in ascending order
            },
        ]);

        return result;
    } catch (error: any) {
        return { error: error.message };
    }

}
export const getTotalTagsBySampleAndMonth = async (userId: string): Promise<any> => {

    try {
        // Fetch the user
        const user = await userModel.findById(userId).exec();

        if (!user) {
            throw new Error('User not found');
        }

        let tagsBySampleAndMonth;

        if (user.role === RoleType.superAdmin) {
            // If the user is a super admin, execute the aggregation query without location restriction
            tagsBySampleAndMonth = await tagsModel.aggregate([
                // Your aggregation pipeline
                {
                    $group: {
                        _id: {
                            sample: '$sample',
                            month: { $month: '$createdAt' } // Extract month from createdAt field
                        },
                        totalTags: { $sum: 1 } // Count the tags
                    }
                },
                {
                    $lookup: {
                        from: 'samples', // Name of the collection to perform the lookup
                        localField: '_id.sample', // Field from the tagsBySampleAndMonth pipeline
                        foreignField: '_id', // Field from the Samples collection
                        as: 'sampleData' // Alias for the joined data
                    }
                },
                {
                    $unwind: '$sampleData' // Unwind the sampleData array to get a single document per group
                },
                {
                    $project: {
                        _id: 0, // Exclude the _id field from the final result
                        name: '$sampleData.name', // Include the sample name
                        totalTags: 1, // Include the totalTags field
                        month: '$_id.month' // Include the month
                    }
                }
            ]);
        } else {
            // If the user is not a super admin, execute the aggregation query with location restriction
            // If the user is not a super admin, execute the aggregation query with location restriction
            tagsBySampleAndMonth = await tagsModel.aggregate([
                {
                    $match: {
                        location: user?.locations?.valueOf() // Filter by allowed locations
                    }
                },
                {
                    $group: {
                        _id: {
                            sample: '$sample',
                            month: { $month: '$createdAt' } // Extract month from createdAt field
                        },
                        totalTags: { $sum: 1 } // Count the tags
                    }
                },
                {
                    $lookup: {
                        from: 'samples', // Name of the collection to perform the lookup
                        localField: '_id.sample', // Field from the tagsBySampleAndMonth pipeline
                        foreignField: '_id', // Field from the Samples collection
                        as: 'sampleData' // Alias for the joined data
                    }
                },
                {
                    $unwind: '$sampleData' // Unwind the sampleData array to get a single document per group
                },
                {
                    $project: {
                        _id: 0, // Exclude the _id field from the final result
                        name: '$sampleData.name', // Include the sample name
                        totalTags: 1, // Include the totalTags field
                        month: '$_id.month' // Include the month
                    }
                }
            ]);
        }

        const result = tagsBySampleAndMonth.reduce((acc, { name, totalTags, month }) => {
            if (!acc[name]) {
                acc[name] = [];
            }
            acc[name].push({ totalTags, month });
            return acc;
        }, {});

        return result;
    } catch (error: any) {
        return { error: error.message };
    }
}
export const getTotalTagsBySampleAndDay = async (userId: string): Promise<any> => {

    try {
        // Calculate the start of the current week
        const startOfWeek = moment().startOf('day').subtract(7, 'days');
        const user = await userModel.findById(userId).exec();

        if (!user) {
            throw new Error('User not found');
        }

        let tagsBySampleAndDayOfWeek;

        // If the user is a super admin, execute the aggregation query without location restriction
        if (user.role === RoleType.superAdmin) {
            // Calculate the start of the current week
            const startOfWeek = moment().startOf('day').subtract(7, 'days');

            tagsBySampleAndDayOfWeek = await tagsModel.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: startOfWeek.toDate() // Filter documents from the start of the current week
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            sample: '$sample',
                            dayOfWeek: { $dayOfWeek: '$createdAt' } // Extract day of the week from createdAt field
                        },
                        totalTags: { $sum: 1 } // Count the tags
                    }
                },
                {
                    $lookup: {
                        from: 'samples', // Name of the collection to perform the lookup
                        localField: '_id.sample', // Field from the tagsBySampleAndDayOfWeek pipeline
                        foreignField: '_id', // Field from the Samples collection
                        as: 'sampleData' // Alias for the joined data
                    }
                },
                {
                    $unwind: '$sampleData' // Unwind the sampleData array to get a single document per group
                },
                {
                    $project: {
                        _id: 0, // Exclude the _id field from the final result
                        name: '$sampleData.name', // Include the sample name
                        totalTags: 1, // Include the totalTags field
                        dayOfWeek: '$_id.dayOfWeek' // Include the day of the week
                    }
                }
            ]);
        } else {
            // If the user is not a super admin, execute the aggregation query with location restriction
            tagsBySampleAndDayOfWeek = await tagsModel.aggregate([
                {
                    $match: {
                        location: user?.locations?.valueOf(), // Filter by allowed locations
                        createdAt: {
                            $gte: startOfWeek.toDate() // Filter documents from the start of the current week
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            sample: '$sample',
                            dayOfWeek: { $dayOfWeek: '$createdAt' } // Extract day of the week from createdAt field
                        },
                        totalTags: { $sum: 1 } // Count the tags
                    }
                },
                {
                    $lookup: {
                        from: 'samples', // Name of the collection to perform the lookup
                        localField: '_id.sample', // Field from the tagsBySampleAndDayOfWeek pipeline
                        foreignField: '_id', // Field from the Samples collection
                        as: 'sampleData' // Alias for the joined data
                    }
                },
                {
                    $unwind: '$sampleData' // Unwind the sampleData array to get a single document per group
                },
                {
                    $project: {
                        _id: 0, // Exclude the _id field from the final result
                        name: '$sampleData.name', // Include the sample name
                        totalTags: 1, // Include the totalTags field
                        dayOfWeek: '$_id.dayOfWeek' // Include the day of the week
                    }
                }
            ]);
        }


        // Group the results by sample name
        const result = tagsBySampleAndDayOfWeek.reduce((acc, { name, totalTags, dayOfWeek }) => {
            if (!acc[name]) {
                acc[name] = [];
            }
            acc[name].push({ totalTags, dayOfWeek });
            return acc;
        }, {});

        return result
    } catch (error: any) {
        return { error: error.message };
    }

}

// export const getTotalTagsBySampleAndDay = async (userId: string): Promise<any> => {
//     try {
//         // Fetch the user
//         const user = await userModel.findById(userId).exec();

//         if (!user) {
//             throw new Error('User not found');
//         }

//         let tagsBySampleAndDayOfWeek;

//         // If the user is a super admin, execute the aggregation query without location restriction
//         if (user.role === RoleType.superAdmin) {
//             // Calculate the start of the current week
//             const startOfWeek = moment().startOf('day').subtract(7, 'days');

//             tagsBySampleAndDayOfWeek = await tagsModel.aggregate([
//                 {
//                     $match: {
//                         createdAt: {
//                             $gte: startOfWeek.toDate() // Filter documents from the start of the current week
//                         }
//                     }
//                 },
//                 // Your existing aggregation pipeline
//             ]);
//         } else {
//             // If the user is not a super admin, execute the aggregation query with location restriction
//             tagsBySampleAndDayOfWeek = await tagsModel.aggregate([
//                 {
//                     $match: {
//                         location: user?.locations?.valueOf(), // Filter by allowed locations
//                         createdAt: {
//                             $gte: startOfWeek.toDate() // Filter documents from the start of the current week
//                         }
//                     }
//                 },
//                 // Your existing aggregation pipeline
//             ]);
//         }

//         // Group the results by sample name
//         const result = tagsBySampleAndDayOfWeek.reduce((acc, { name, totalTags, dayOfWeek }) => {
//             if (!acc[name]) {
//                 acc[name] = [];
//             }
//             acc[name].push({ totalTags, dayOfWeek });
//             return acc;
//         }, {});

//         return result;
//     } catch (error: any) {
//     return { error: error.message };
//     }
// };

export const taggedIncidentbyMonth = async (userId: string): Promise<any> => {
    try {
        // Fetch the user
        const user = await userModel.findById(userId).exec();

        if (!user) {
            throw new Error('User not found');
        }

        let result;

        if (user.role === RoleType.superAdmin) {
            // If the user is a super admin, execute the aggregation query without location restriction
            // If the user is a super admin, execute the aggregation query without location restriction
            result = await tagsModel.aggregate([
                // Your existing aggregation pipeline
                {
                    $lookup: {
                        from: 'incidents',
                        localField: 'incident',
                        foreignField: '_id',
                        as: 'incident',
                    },
                },
                {
                    $unwind: '$incident',
                },
                {
                    $project: {
                        month: { $month: { $toDate: '$createdAt' } },
                        incidentName: '$incident.name',
                    },
                },
                {
                    $group: {
                        _id: { incident: '$incidentName', month: '$month' },
                        totalTags: { $sum: 1 },
                    },
                },
                {
                    $group: {
                        _id: '$_id.incident',
                        tagsByMonth: {
                            $push: {
                                totalTags: '$totalTags',
                                month: '$_id.month',
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        incident: '$_id',
                        tagsByMonth: 1,
                    },
                },
            ]);
        } else {
            // If the user is not a super admin, execute the aggregation query with location restriction
            result = await tagsModel.aggregate([
                {
                    $match: {
                        location: Array.isArray(user?.locations?.valueOf()) ? user?.locations?.valueOf() : [user?.locations?.valueOf()]
                    }
                },
                // Your existing aggregation pipeline after applying location filtering
                {
                    $lookup: {
                        from: 'incidents',
                        localField: 'incident',
                        foreignField: '_id',
                        as: 'incident',
                    },
                },
                {
                    $unwind: '$incident',
                },
                {
                    $project: {
                        month: { $month: { $toDate: '$createdAt' } },
                        incidentName: '$incident.name',
                    },
                },
                {
                    $group: {
                        _id: { incident: '$incidentName', month: '$month' },
                        totalTags: { $sum: 1 },
                    },
                },
                {
                    $group: {
                        _id: '$_id.incident',
                        tagsByMonth: {
                            $push: {
                                totalTags: '$totalTags',
                                month: '$_id.month',
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        incident: '$_id',
                        tagsByMonth: 1,
                    },
                },
            ]);
        }

        // Convert the result to the desired format
        const formattedResult: any = {};
        result.forEach((item: any) => {
            formattedResult[item.incident] = item.tagsByMonth;
        });

        return formattedResult;
    } catch (error: any) {
        return { error: error.message };
    }
}

export const taggedIncidentbyDay = async (userId: string): Promise<any> => {
    try {
        // Fetch the user
        const user = await userModel.findById(userId).exec();

        if (!user) {
            throw new Error('User not found');
        }

        let result;

        if (user.role === RoleType.superAdmin) {
            // If the user is a super admin, execute the aggregation query without location restriction
            result = await tagsModel.aggregate([
                // Your existing aggregation pipeline
                {
                    $lookup: {
                        from: 'incidents',
                        localField: 'incident',
                        foreignField: '_id',
                        as: 'incident',
                    },
                },
                {
                    $unwind: '$incident',
                },
                {
                    $project: {
                        dayOfWeek: { $dayOfWeek: { $toDate: '$createdAt' } }, // Extract day of the week from createdAt field
                        incidentName: '$incident.name',
                    },
                },
                {
                    $group: {
                        _id: { incident: '$incidentName', dayOfWeek: '$dayOfWeek' }, // Group by incident and day of week
                        totalTags: { $sum: 1 },
                    },
                },
                {
                    $group: {
                        _id: '$_id.incident',
                        tagsByDayOfWeek: {
                            $push: {
                                totalTags: '$totalTags',
                                dayOfWeek: '$_id.dayOfWeek',
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        incident: '$_id',
                        tagsByDayOfWeek: 1,
                    },
                },
            ]);
        } else {
            // If the user is not a super admin, execute the aggregation query with location restriction
            result = await tagsModel.aggregate([
                {
                    $match: {
                        location: user?.locations?.valueOf() // Filter by allowed locations
                    }
                },
                // Your existing aggregation pipeline after applying location filtering
                {
                    $lookup: {
                        from: 'incidents',
                        localField: 'incident',
                        foreignField: '_id',
                        as: 'incident',
                    },
                },
                {
                    $unwind: '$incident',
                },
                {
                    $project: {
                        dayOfWeek: { $dayOfWeek: { $toDate: '$createdAt' } }, // Extract day of the week from createdAt field
                        incidentName: '$incident.name',
                    },
                },
                {
                    $group: {
                        _id: { incident: '$incidentName', dayOfWeek: '$dayOfWeek' }, // Group by incident and day of week
                        totalTags: { $sum: 1 },
                    },
                },
                {
                    $group: {
                        _id: '$_id.incident',
                        tagsByDayOfWeek: {
                            $push: {
                                totalTags: '$totalTags',
                                dayOfWeek: '$_id.dayOfWeek',
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        incident: '$_id',
                        tagsByDayOfWeek: 1,
                    },
                },
            ]);
        }

        // Convert the result to the desired format
        const formattedResult: any = {};
        result.forEach((item: any) => {
            formattedResult[item.incident] = item.tagsByDayOfWeek;
        });

        return formattedResult;
    } catch (error: any) {
        return { error: error.message };
    }
}
export const deleteModelTags = async (id: string): Promise<any> => {

    try {

        // Find the model by its ID
        const model = await modelModel.findById(id);

        if (!model) {
            return
        }

        // Set the tags array to an empty array
        model.tags = [new Types.ObjectId()];

        // Save the updated model
        await model.save();

        // Delete the tags from the database
        await tagsModel.deleteMany({ model: model._id });
        // Save the updated model
        await model.save();
    } catch (error: any) {
        return { error: error.message };
    }

}