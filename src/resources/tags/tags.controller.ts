import { Response, NextFunction } from "express";
import { TagsServices } from ".";
import { HttpException } from "../../utils/exceptions/http.exceptions";
import tagModel from "./tags.model";
import modelModel from "../models/model.model";
import { RoleType } from "../users/user.Interface";
import { AuthUserRequest } from "../../middlewares/auth.middleware";
import userModel from "../users/user.model";
// import tagsModel from "./tags.model";
import { toObjectId, toObjectIdArray } from "../../utils/mongo";

export class TagController {
	async addTag(req: AuthUserRequest, res: Response, next: NextFunction) {
		// if (!req.files || Object.keys(req.files).length === 0) {
		//     return res.status(400).send('No files were uploaded.');
		// }
		const {
			incident,
			action,
			locations,
			sample,
			userId,
			modelId,
			taggedInfo,
			objectName,
			text,
			presence,
			type,
			group,
			...rest
		} = req.body;

		if (!userId) {
			res.status(400).send("please login into the app");
		}
		try {
			const files = req.files;
			let imageFile: Express.Multer.File | null = null;
			let fileName;
			let evidenceFile;
			if (
				typeof files === "object" &&
				files !== null &&
				"evidence" in files &&
				Array.isArray(files["evidence"])
			) {
				imageFile = files["evidence"][0];
				evidenceFile = imageFile?.buffer;
				fileName = imageFile?.originalname;
			}

			const data = await TagsServices.addTags(
				incident,
				objectName,
				fileName,
				action,
				locations,
				sample,
				userId,
				modelId,
				evidenceFile,
				taggedInfo,
				text,
				presence,
				type,
				group,
				rest
			);
			res.status(200).json({
				status: "success",
				data,
				message: "tag added successfully",
			});
		} catch (error: any) {
			next(new HttpException(400, error.message));
		}
	}

	async updateTag(req: AuthUserRequest, res: Response, next: NextFunction) {
		try {
			const id = req.params.id;
			const {
				incident,
				frequency,
				locations,
				sample,
				userId,
				modelId,
				taggedInfo,
				objectName,
				text,
				presence,
				type,
				action,
			} = req.body;
			const files = req.files;
			let imageFile: Express.Multer.File | null = null;
			let fileName;
			let evidenceFile;
			if (
				typeof files === "object" &&
				files !== null &&
				"evidence" in files &&
				Array.isArray(files["evidence"])
			) {
				imageFile = files["evidence"][0];
				evidenceFile = imageFile?.buffer;
				fileName = imageFile?.originalname;
			}

			const tag = await tagModel.findByIdAndUpdate(id, {
				incident,
				objectName,
				fileName,
				frequency,
				locations,
				sample,
				userId,
				modelId,
				evidenceFile,
				taggedInfo,
				text,
				presence,
				type,
				action,
			});

			res.status(200).json({
				message: "tag updated successfully",
				data: tag,
			});
		} catch (error: any) {
			return { error: error.message };
		}
	}

	async deleteTag(req: AuthUserRequest, res: Response, next: NextFunction) {
		try {
			await tagModel.findByIdAndDelete(req.params.id);
			res.status(200).json({
				message: "tag deleted successfully",
			});
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
	async getTotalTagsBySampleAndDay(
		req: AuthUserRequest,
		res: Response,
		next: NextFunction
	) {
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
	async deleteModelTags(
		req: AuthUserRequest,
		res: Response,
		next: NextFunction
	) {
		try {
			const id = req.params.id;

			const data = await TagsServices.deleteModelTags(id);
			res.status(200).json({
				message: "successfully",
				data,
			});
		} catch (error: any) {
			return { error: error.message };
		}
	}

	async paginatedTags(req: AuthUserRequest, res: Response, next: NextFunction) {
		try {
			const userId = req.user?.userId;
			const user = await userModel.findById(userId).exec();
			const page = parseInt((req.query.page as string) || "1", 10) || 1;
			const limit = parseInt((req.query.limit as string) || "25", 10) || 25;
			const search = (req.query.search as string) || "";
			const startDate = req.query.startDate as string;
			const endDate = req.query.endDate as string;
			const skip = (page - 1) * limit;

			// Date filter logic
			const dateFilter: any = {};
			if (startDate && endDate) {
				const start = new Date(startDate);
				start.setHours(0, 0, 0, 0);
				const end = new Date(endDate);
				end.setHours(23, 59, 59, 999);
				dateFilter.createdAt = {
					$gte: start,
					$lte: end,
				};
			}

			if (!user) {
				return res.status(400).send({ error: "User not found" });
			}

			// Build search query for direct tag fields
			const searchQuery: any = {};
			let userIdsForSearch: any[] | null = null;
			if (search && search.trim()) {
				const searchRegex = new RegExp(search.trim(), "i");
				searchQuery.$or = [
					{ objectName: searchRegex },
					{ incident: searchRegex },
					{ presence: searchRegex },
					{ sample: searchRegex },
					{ locations: searchRegex },
					{ text: searchRegex },
					{ type: searchRegex },
					{ group: searchRegex },
					{ slug: searchRegex },
				];

				// Search by user fullname
				const matchingUsers = await userModel
					.find({ fullname: searchRegex })
					.select("_id")
					.lean();
				userIdsForSearch = matchingUsers.map((u) => u._id);
				if (userIdsForSearch.length > 0) {
					searchQuery.$or.push({ user: { $in: userIdsForSearch } });
				}
			}

			// Check if user is a super admin
			if (user.role === RoleType.superAdmin) {
				// If searching by model name or user name, we need to find them first
				let modelIdsForSearch: any[] | null = null;
				if (search && search.trim()) {
					const modelSearchRegex = new RegExp(search.trim(), "i");
					const matchingModels = await modelModel
						.find({ modelName: modelSearchRegex })
						.select("_id")
						.lean();
					modelIdsForSearch = matchingModels.map((m) => m._id);
					if (modelIdsForSearch.length > 0) {
						searchQuery.$or = searchQuery.$or || [];
						searchQuery.$or.push({ model: { $in: modelIdsForSearch } });
					}
					// User search is already added to searchQuery.$or above
				}

				// Get all non-deleted model IDs first to ensure consistency in search and count
				const safeModelIds = (await modelModel.find({ delete: { $ne: true } }).select('_id').lean()).map(m => m._id);

				// Prepare the base query with search, date filter, and non-deleted model constraint
				// If specific models were found via search (modelIdsForSearch), we need to INTERSECT them with safeModelIds
				let effectiveModelFilter: any = { $in: safeModelIds };

				if (modelIdsForSearch && modelIdsForSearch.length > 0) {
					// Intersection: Models that match search AND are not deleted
					// Since we don't have a simple lodash intersection here, we can just use $in with a filtered list
					// But simpler: just add another condition or refine the $in list.
					// Actually, modelIdsForSearch came from a query. We should check if they are in safeModelIds? 
					// Or just let MongoDB handle it: $in: [ids] AND $in: [safeIds]
					// MongoDB handles multiple fields. But here 'model' is one field.
					// Let's use $and if needed.
					// However, the cleanest way:
				}

				// ACTUALLY, simpler approach:
				// We already have `searchQuery`. If it has model constraints, we need to respect them AND add `delete: false`.
				// Since `searchQuery` uses `$or` for broad search, simply Adding `model: {$in: safeModelIds}` to the top level 
				// works as an AND condition with the $or group. 
				// So: (A or B or C) AND (Model is Safe). This is correct.

				const queryWithSafeModels = {
					...(Object.keys(searchQuery).length > 0 ? searchQuery : {}),
					...dateFilter,
					model: { $in: safeModelIds }
				};

				// BUT, if `searchQuery` already had a `model` condition (from specific model name search), 
				// `model: { $in: safeModelIds }` would OVERWRITE it if we just spread it.
				// Let's check `searchQuery`.
				// In lines 262-264 we did: `searchQuery.$or.push({ model: { $in: modelIdsForSearch } });`
				// So `model` is NOT a top-level key in `searchQuery`, it's inside `$or`.
				// So `queryWithSafeModels` having `model: { ... }` at top level is perfectly fine.
				// It acts as: ( $or conditions ) AND ( model in safeList ). 
				// This correctly filters out any match that happens to be on a deleted model.

				const [tags, total] = await Promise.all([
					tagModel.find(queryWithSafeModels)
						.populate({ path: "user" })
						.populate({ path: "sample" })
						.populate({
							path: "model",
							populate: [{ path: "location" }, { path: "comments" }],
						})
						.sort({ createdAt: -1 })
						.skip(skip)
						.limit(limit),
					tagModel.countDocuments(queryWithSafeModels),
				]);

				return res.status(200).json({
					message: "Paginated tags",
					data: {
						items: tags,
						total,
						page,
						limit,
					},
					status: "success",
				});
			}

			// Non-super admin: filter by allowed locations
			const allowedLocationIds = toObjectIdArray(user?.locations);
			if (!allowedLocationIds.length) {
				return res.status(200).json({
					message: "Filtered tags based on user's allowed locations",
					data: {
						items: [],
						total: 0,
						page,
						limit,
					},
					status: "success",
				});
			}

			const allowedModels = await modelModel
				.find({ location: { $in: allowedLocationIds } })
				.select("_id")
				.lean();
			const allowedModelIds = allowedModels.map((model) => model._id);

			if (!allowedModelIds.length) {
				return res.status(200).json({
					message: "No models found for user's allowed locations",
					data: {
						items: [],
						total: 0,
						page,
						limit,
					},
					status: "success",
				});
			}

			// Filter out deleted models from allowedModelIds
			const nonDeletedAllowedModels = await modelModel.find({
				_id: { $in: allowedModelIds },
				delete: { $ne: true }
			}).select('_id').lean();

			const safeAllowedModelIds = nonDeletedAllowedModels.map(m => m._id);

			// Update finalQuery to use only safe IDs
			const finalQuery: any = {
				model: { $in: safeAllowedModelIds },
				...dateFilter,
			};

			// If searching by model name, filter allowed models first
			let modelIdsForSearch: any[] | null = null;
			if (search && search.trim()) {
				const modelSearchRegex = new RegExp(search.trim(), "i");
				const matchingModels = await modelModel
					.find({
						_id: { $in: safeAllowedModelIds }, // Use safe IDs here
						modelName: modelSearchRegex,
					})
					.select("_id")
					.lean();
				modelIdsForSearch = matchingModels.map((m) => m._id);

				// Combine search query with location filter
				if (searchQuery.$or && searchQuery.$or.length > 0) {
					finalQuery.$and = [
						{ model: { $in: safeAllowedModelIds } }, // Use safe IDs here
						{ $or: searchQuery.$or },
					];
					// If we found matching models, add them to the search
					if (modelIdsForSearch.length > 0) {
						finalQuery.$and[1].$or.push({
							model: { $in: modelIdsForSearch },
						});
					}
				} else if (modelIdsForSearch.length > 0) {
					// Only model name search matched
					finalQuery.model = { $in: modelIdsForSearch };
				}
			}

			const baseQuery = tagModel
				.find(finalQuery)
				.populate({ path: "user", select: "locations email username" })
				.populate({ path: "sample" })
				.populate({
					path: "model",
					populate: [{ path: "location" }, { path: "comments" }],
				})
				.sort({ createdAt: -1 });

			const [tags, total] = await Promise.all([
				baseQuery.clone().skip(skip).limit(limit),
				tagModel.countDocuments(finalQuery),
			]);

			return res.status(200).json({
				message: "Filtered tags based on user's allowed locations",
				data: {
					items: tags,
					total,
					page,
					limit,
				},
				status: "success",
			});
		} catch (error: any) {
			next(new HttpException(400, error.message));
		}
	}
	async allTags(req: AuthUserRequest, res: Response, next: NextFunction) {
		try {
			const userId = req.user?.userId;
			const user = await userModel.findById(userId).exec();

			if (!user) {
				return res.status(400).send({ error: "User not found" });
			}

			// Check if user is not found or if user is not a super admin
			if (user.role === RoleType.superAdmin) {
				// If user is a super admin, retrieve all tags without location filter
				const tags = await tagModel
					.find()
					.populate({ path: "user" })
					.populate({ path: "sample" })
					.populate({
						path: "model",
						populate: [{ path: "location" }, { path: "comments" }],
					})
					.sort({ createdAt: -1 });
				res.status(200).json({
					message: "All tags",
					data: tags,
					status: "success",
				});
			} else {
				// If user is not a super admin, filter tags based on user's allowed locations
				const allowedLocationIds = toObjectIdArray(user?.locations);
				if (!allowedLocationIds.length) {
					return res.status(200).json({
						message: "Filtered tags based on user's allowed locations",
						data: [],
						status: "success",
					});
				}

				const allowedModels = await modelModel
					.find({ location: { $in: allowedLocationIds } })
					.select("_id")
					.lean();
				const allowedModelIds = allowedModels.map((model) => model._id);

				if (!allowedModelIds.length) {
					return res.status(200).json({
						message: "No models found for user's allowed locations",
						data: [],
						status: "success",
					});
				}

				const tags = await tagModel
					.find({ model: { $in: allowedModelIds } })
					.populate({ path: "user", select: "locations email username" })
					.populate({ path: "sample" })
					.populate({
						path: "model",
						populate: [{ path: "location" }, { path: "comments" }],
					})
					.sort({ createdAt: -1 });

				res.status(200).json({
					message: "Filtered tags based on user's allowed locations",
					data: tags,
					status: "success",
				});
			}
		} catch (error: any) {
			next(new HttpException(400, error.message));
		}
	}
}
