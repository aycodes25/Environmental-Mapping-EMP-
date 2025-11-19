// import { Login, recentReviewers, totalTaggers } from './user.services';

import { Request, Response, NextFunction } from "express";
import { userService } from ".";
import { HttpException } from "../../utils/exceptions/http.exceptions";
import { modelService } from "../models";
import { TagsServices } from "../tags";
import { saveToDisk, UploadUserToS3 } from "../../utils/aws/aws";
import { AuthUserRequest } from "../../middlewares/auth.middleware";
import tagsModel from "../tags/tags.model";
import userModel from "./user.model";
import modelModel from "../models/model.model";
import { RoleType } from "./user.Interface";
import { hashPassword, seedSuperAdmin } from "./user.services";
import { checkIfAuthenticated } from "../../utils/utills";

export class UserController {
	async signUpAdmin(req: AuthUserRequest, res: Response, next: NextFunction) {
		const { email, password, username, fullname } = req.body;
		const files = req.files;
		if (!email || !password || !username) {
			res.status(401).json({
				status: "error",
				message: "missing credentials",
			});
		}
		let imageFile: Express.Multer.File | null = null;

		if (
			typeof files === "object" &&
			files !== null &&
			"image" in files &&
			Array.isArray(files["image"])
		) {
			imageFile = files["image"][0];
		}
		const photoFile = imageFile?.buffer;
		try {
			const data = await userService.signUpAdmin(
				email,
				password,
				username,
				photoFile,
				fullname
			);
			res.json({
				status: "success",
				data,
				message: "Sign up admin success",
			});
		} catch (error: any) {
			next(new HttpException(400, error.message));
		}
	}

	async LoginAdmin(req: Request, res: Response, next: NextFunction) {
		const { email, password } = req.body;
		try {
			const data = await userService.Login(email, password);
			res.json({
				status: "success",
				data,
				message: !data?.error ? "login  success" : data?.error,
			});
		} catch (error: any) {
			next(new HttpException(400, error.message));
		}
	}

	async CheckIfAuthenticated(req: Request, res: Response, next: NextFunction) {
		try {
			const data = checkIfAuthenticated(req);
			res.json({
				status: "success",
				data,
				message: data.authenticated ? "Authenticated" : "Not Authenticated",
			});
		} catch (error: any) {
			next(new HttpException(400, error.message));
		}
	}

	async seedSuperAdmin(req: Request, res: Response, next: NextFunction) {
		try {
			await seedSuperAdmin();
			res.status(201).json({
				message: "SuperAdmin seeded successfully.",
				user: { email: "superadmin@mail.com", password: "superadmin" },
			});
		} catch (error) {
			console.error("Error seeding SuperAdmin:", error);
			res.status(500).json({
				message: "An error occurred while seeding SuperAdmin.",
			});
		}
	}

	async signUpTagger(req: AuthUserRequest, res: Response, next: NextFunction) {
		const { email, password, username, role, fullname, location } = req.body;
		if (!email || !password || !username || !role) {
			res.status(401).json({
				status: "error",
				message: "missing credentials",
			});
		}
		//console.log(req.body);

		const files = req.files;
		let data;
		let image = "";
		try {
			if (files) {
				// File was sent, handle the upload
				let imageFile: Express.Multer.File | null = null;

				if (
					typeof files === "object" &&
					files !== null &&
					"image" in files &&
					Array.isArray(files["image"])
				) {
					imageFile = files["image"][0];
					const imageData = imageFile?.buffer;
					const imageFileName = imageFile?.originalname;
					const imageKey = `users/${username}/${imageFileName}`;

					image = await (async () => {
						if (process.env.NODE_ENV === "development") {
							let imageUrl = await saveToDisk(imageData, imageKey);
							return imageUrl;
						}
						return UploadUserToS3(imageData, imageKey);
					})();
				}

				data = await userService.signUpTagger(
					email,
					password,
					username,
					role,
					image,
					fullname,
					location
				);
			} else {
				data = await userService.signUpTagger(
					email,
					password,
					username,
					role,
					image,
					fullname,
					location
				);
			}
			res.json({
				status: "success",
				data,
				message: "Sign up tagger success",
			});
		} catch (error: any) {
			next(new HttpException(400, error.message));
		}
	}

	async updatePassword(
		req: AuthUserRequest,
		res: Response,
		next: NextFunction
	) {
		const { email, password } = req.body;
		if (!email || !password) {
			res.status(401).json({
				status: "error",
				message: "missing credentials",
			});
		}
		try {
			const data = await userService.updatePassword(email, password);
			res.json({
				status: "success",
				data,
				message: "password updated success",
			});
		} catch (error: any) {
			next(new HttpException(400, error.message));
		}
	}

	async getUsers(req: AuthUserRequest, res: Response, next: NextFunction) {
		try {
			const userId = req.user?.userId;
			const { users, totalUsers } = await userService.getUsers(userId);
			res.json({
				status: "success",
				totalUsers,
				users,
				message: "users return",
			});
		} catch (error: any) {
			next(new HttpException(400, error.message));
		}
	}

	async getAUser(req: AuthUserRequest, res: Response, next: NextFunction) {
		try {
			const id = req.params.id;
			if (!id) {
				res.status(400).send({
					status: "error",
					message: "No user id is parsed",
				});
			}
			const data = await userService.getAUser(id);
			res.json({
				status: "success",
				data,
				message: "users return",
			});
		} catch (error: any) {
			next(new HttpException(400, error.message));
		}
	}

	async updateAUser(req: AuthUserRequest, res: Response, next: NextFunction) {
		try {
			const id = req.params.id;
			const { username, email, role, fullname, location, password } =
				req.body;
			const files = req.files;
			if (!id) {
				throw new HttpException(400, "User ID not found in request");
			}
			const user = await userService.getAUser(id);
			let data;
			// Check if a file was sent
			if (
				files &&
				typeof files === "object" &&
				files !== null &&
				"image" in files
			) {
				// File was sent, handle the upload
				let imageFile: Express.Multer.File | null = null;
				if (
					typeof files === "object" &&
					files !== null &&
					"image" in files &&
					Array.isArray(files["image"])
				) {
					imageFile = files["image"][0];
					const imageData = imageFile?.buffer;
					const imageFileName = imageFile?.originalname;
					const imageKey = `users/${user.username}/${imageFileName}`;

					const imageUrl = await (async () => {
						if (process.env.NODE_ENV === "development") {
							let imageUrl = await saveToDisk(imageData, imageKey);
							return imageUrl;
						}
						return UploadUserToS3(imageData, imageKey);
					})();

					data = await userService.userUpdate(id, {
						username: username ?? user.username,
						email,
						role:
							user.role === "superAdmin" ? user.role : role ?? user.role,
						fullname,
						imageUrl,
						location:
							user.role === "superAdmin"
								? user?.locations?.valueOf()
								: location,
						password,
					});
				}
			} else {
				data = await userService.userUpdate(id, {
					username: username ?? user.username,
					email,
					role: user.role === "superAdmin" ? user.role : role ?? user.role,
					fullname,
					location:
						user.role === "superAdmin"
							? user?.locations?.valueOf()
							: location,
					password,
				});
			}
			res.json({
				status: "success",
				data,
				message: "users return",
			});
		} catch (error: any) {
			console.log(error);
			next(new HttpException(400, error.message));
		}
	}
	async deleteUser(req: AuthUserRequest, res: Response, next: NextFunction) {
		try {
			const id = req.params.id;

			await userService.deleteUsers(id);
			res.json({
				status: "success",
				message: "user deleted",
			});
		} catch (error: any) {
			next(new HttpException(400, error.message));
		}
	}
	async twoFA(req: AuthUserRequest, res: Response) {
		try {
			const { email } = req.body;
			const secret = await userService.setTwoFAVerification(email);
			res.status(200).json({
				message: "show user qr code",
				status: "success",
				secret: secret,
			});
		} catch (error) {
			res.status(500).json({
				message: "Please try again an error occurred",
				status: "error",
			});
		}
	}

	async resetPassword(req: AuthUserRequest, res: Response) {
		try {
			const { email } = req.body;

			await userService.sendResetVerification(email);
			res.status(200).json({
				message: "Please check your email for the reset link",
				status: "success",
			});
		} catch (error) {
			res.status(500).json({
				message: "try again failed to send reset link",
				status: "error",
			});
		}
	}

	async requestPasswordReset(req: AuthUserRequest, res: Response) {
		try {
			const { email } = req.body;

			await userService.requestPasswordReset(email);
			res.status(200).json({
				message: "Please check your email for the reset link",
				status: "success",
			});
		} catch (error) {
			console.log(error);
			res.status(500).json({
				message: "try again, failed to send reset link",
				status: "error",
			});
		}
	}

	async twoFAverifyToken(req: AuthUserRequest, res: Response) {
		try {
			const { email, token } = req.body;
			const response = await userService.verify2FAToken(email, token);
			res.status(200).json(response);
		} catch (error) {
			res.status(500).json({
				message: "Failed to  verification token",
				status: "error",
			});
		}
	}

	async resetPasswordVerifyToken(req: AuthUserRequest, res: Response) {
		try {
			const { token, password } = req.body;
			const response = await userService.resetPassword(token, password);
			res.status(200).json({
				status: "Success",
				message: "Password reset was successful",
			});
		} catch (error) {
			console.log(error);
			res.status(500).json({
				message: "Failed to verify token",
				status: "error",
			});
		}
	}

	async dashboard(req: AuthUserRequest, res: Response) {
		const userId = req.user?.userId;
		if (!userId) {
			// Handle case when user ID is not found
			throw new Error("User ID not found");
		}
		try {
			const user = await userModel.findById(userId).populate("locations");
			if (!user) {
				return res
					.status(404)
					.json({ status: "error", message: "User not found" });
			}

			const userRole = user.role;
			const userLocation = user?.locations;

			const now = new Date();

			// Helper function to calculate start and end of the month
			const getMonthRange = (date: Date) => {
				const startOfMonth = new Date(
					date.getFullYear(),
					date.getMonth(),
					1
				);
				const endOfMonth = new Date(
					date.getFullYear(),
					date.getMonth() + 1,
					0,
					23,
					59,
					59,
					999
				);
				return { startOfMonth, endOfMonth };
			};

			// Helper function to calculate start and end of the year
			const getYearRange = (date: Date) => {
				const startOfYear = new Date(date.getFullYear(), 0, 1);
				const endOfYear = new Date(
					date.getFullYear(),
					11,
					31,
					23,
					59,
					59,
					999
				);
				return { startOfYear, endOfYear };
			};

			const { startOfMonth, endOfMonth } = getMonthRange(now);
			const { startOfYear, endOfYear } = getYearRange(now);

			// Define matchStage
			const matchStage =
				userRole === "superAdmin"
					? { type: "sampling" }
					: {
							type: "sampling",
							"modelInfo.location": userLocation,
							"modelInfo.delete": false,
					  };

			// Current month tags grouped by sample
			const tagsThisMonth = await tagsModel.countDocuments({
				createdAt: { $gte: startOfMonth, $lte: endOfMonth },
			});

			// Last month range
			const startOfLastMonth = new Date(
				now.getFullYear(),
				now.getMonth() - 1,
				1
			);
			const endOfLastMonth = new Date(
				now.getFullYear(),
				now.getMonth(),
				0,
				23,
				59,
				59,
				999
			);

			// Last month tags grouped by sample
			const tagsLastMonth = await tagsModel.countDocuments({
				createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
			});

			// Positivity rate this month
			const totalTagsThisMonth = await tagsModel.countDocuments({
				createdAt: { $gte: startOfMonth, $lte: endOfMonth },
				type: "sampling",
				...(userRole !== "superAdmin" && {
					"modelInfo.location": userLocation,
					"modelInfo.delete": false,
				}),
			});
			const positiveTagsThisMonth = await tagsModel.countDocuments({
				createdAt: { $gte: startOfMonth, $lte: endOfMonth },
				presence: "positive",
				type: "sampling",
				...(userRole !== "superAdmin" && {
					"modelInfo.location": userLocation,
					"modelInfo.delete": false,
				}),
			});
			const positivityRateThisMonth =
				totalTagsThisMonth > 0
					? (positiveTagsThisMonth / totalTagsThisMonth) * 100
					: 0;

			// Year-to-date tags grouped by sample
			const tagsYearToDate = await tagsModel.countDocuments({
				createdAt: { $gte: startOfYear, $lte: endOfYear },
			});

			// Year-to-date positivity rate
			const totalTagsYearToDate = await tagsModel.countDocuments({
				createdAt: { $gte: startOfYear, $lte: endOfYear },
				type: "sampling",
				...(userRole !== "superAdmin" && {
					"modelInfo.location": userLocation,
					"modelInfo.delete": false,
				}),
			});
			const positiveTagsYearToDate = await tagsModel.countDocuments({
				createdAt: { $gte: startOfYear, $lte: endOfYear },
				presence: "positive",
				type: "sampling",
				...(userRole !== "superAdmin" && {
					"modelInfo.location": userLocation,
					"modelInfo.delete": false,
				}),
			});
			const positivityRateYearToDate =
				totalTagsYearToDate > 0
					? (positiveTagsYearToDate / totalTagsYearToDate) * 100
					: 0;

			// Positivity rate per month YTD
			const positivityRatePerMonthYearToDate = await tagsModel.aggregate([
				{
					$match: {
						createdAt: { $gte: startOfYear, $lte: endOfYear },
						presence: { $in: ["positive", "negative"] },
					},
				},
				{
					$lookup: {
						from: "models",
						localField: "model",
						foreignField: "_id",
						as: "modelInfo",
					},
				},
				{ $unwind: "$modelInfo" },
				{ $match: matchStage },
				{
					$group: {
						_id: {
							year: { $year: "$createdAt" },
							month: { $month: "$createdAt" },
						},
						total: { $sum: 1 },
						positive: {
							$sum: {
								$cond: [{ $eq: ["$presence", "positive"] }, 1, 0],
							},
						},
					},
				},
				{
					$project: {
						_id: 0,
						year: "$_id.year",
						month: "$_id.month",
						positivityRate: {
							$cond: [
								{ $eq: ["$total", 0] },
								0,
								{ $divide: ["$positive", "$total"] },
							],
						},
						totalTags: "$total",
						positiveTags: "$positive",
					},
				},
				{ $sort: { year: 1, month: 1 } },
			]);

			const totalModels = await modelService.totalModels(userId);
			const deletedModels = await modelService.totalDeletedModels(userId);
			const recentModels = await modelService.recentModels(userId);
			const totalReviewers = await userService.totalReviewers(userId);
			const todaysModels = await modelService.todayModels(userId);
			const totalTaggers = await userService.totalTaggers(userId);
			const TotalTagsBySampleAndMonth =
				await TagsServices.getTotalTagsBySampleAndMonth(userId);
			const TotalIncidentsByMonth = await TagsServices.taggedIncidentByMonth(
				userId
			);
			const TotalIncidentsByDay = await TagsServices.taggedIncidentByDay(
				userId
			);
			const TotalTagsBySampleAndDay =
				await TagsServices.getTotalTagsBySampleAndDay(userId);
			const recentlyViewedModels =
				await modelService.getRecentlyViewedModelsAndUsers();
			const modelsInEachLocation = await modelService.modelsEachLocation(
				userId
			);
			const recentlyTaggeddModels = await modelService.recentlyTaggeddModels(
				userId
			);
			const modelsByDays = await modelService.getTotalModelsPerDayOfWeek(
				userId
			);
			const modelsByMonth = await modelService.getTotalModelsPerMonth(
				userId
			);

			res.status(200).json({
				tagsThisMonth,
				tagsLastMonth,
				totalTagsThisMonth,
				positiveTagsThisMonth,
				positivityRateThisMonth,
				tagsYearToDate,
				positivityRateYearToDate,
				positivityRatePerMonthYearToDate,
				totalModels,
				totalTaggers,
				totalReviewers,
				todaysModels,
				modelsByDays,
				modelsByMonth,
				TotalTagsBySampleAndDay,
				TotalIncidentsByDay,
				TotalIncidentsByMonth,
				TotalTagsBySampleAndMonth,
				modelsInEachLocation,
				recentlyViewedModels,
				recentlyTaggeddModels,
				deletedModels,
				recentModels,
				message: "success",
			});
		} catch (error) {
			res.status(500).json({ error: "internal server error" });
		}
	}

	async dashboardByLocation_old(req: AuthUserRequest, res: Response) {
		const { locationId } = req.params;

		try {
			const now = new Date();

			// Helper function to calculate start and end of the month
			const getMonthRange = (date: Date) => {
				const startOfMonth = new Date(
					date.getFullYear(),
					date.getMonth(),
					1
				);
				const endOfMonth = new Date(
					date.getFullYear(),
					date.getMonth() + 1,
					0,
					23,
					59,
					59,
					999
				);
				return { startOfMonth, endOfMonth };
			};

			// Helper function to calculate start and end of the year
			const getYearRange = (date: Date) => {
				const startOfYear = new Date(date.getFullYear(), 0, 1);
				const endOfYear = new Date(
					date.getFullYear(),
					11,
					31,
					23,
					59,
					59,
					999
				);
				return { startOfYear, endOfYear };
			};

			// Get range for this month and last month
			const { startOfMonth, endOfMonth } = getMonthRange(now);
			const { startOfYear, endOfYear } = getYearRange(now);

			// Build match stage for queries
			const matchStage = {
				type: "sampling",
				"modelInfo.location": locationId,
				"modelInfo.delete": false,
			};

			// Get total tags this month grouped by sample
			const tagsThisMonth = await tagsModel.aggregate([
				{
					$match: {
						createdAt: { $gte: startOfMonth, $lte: endOfMonth },
						...matchStage,
					},
				},
				{
					$lookup: {
						from: "models", // The collection name for Model model
						localField: "model",
						foreignField: "_id",
						as: "modelInfo",
					},
				},
				{ $unwind: "$modelInfo" },
				{
					$lookup: {
						from: "samples", // The collection name for sample model
						localField: "sample",
						foreignField: "_id",
						as: "sampleInfo",
					},
				},
				{ $unwind: "$sampleInfo" },
				{ $group: { _id: "$sampleInfo.name", count: { $sum: 1 } } },
			]);

			// Get total tags last month grouped by sample
			const startOfLastMonth = new Date(startOfMonth);
			startOfLastMonth.setMonth(startOfMonth.getMonth() - 1);
			const endOfLastMonth = new Date(endOfMonth);
			endOfLastMonth.setMonth(endOfMonth.getMonth() - 1);

			const tagsLastMonth = await tagsModel.aggregate([
				{
					$match: {
						createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
						...matchStage,
					},
				},
				{
					$lookup: {
						from: "models", // The collection name for Model model
						localField: "model",
						foreignField: "_id",
						as: "modelInfo",
					},
				},
				{ $unwind: "$modelInfo" },
				{
					$lookup: {
						from: "samples", // The collection name for sample model
						localField: "sample",
						foreignField: "_id",
						as: "sampleInfo",
					},
				},
				{ $unwind: "$sampleInfo" },
				{ $group: { _id: "$sampleInfo.name", count: { $sum: 1 } } },
			]);

			// Get positivity rate this month
			const totalTagsThisMonth = await tagsModel.countDocuments({
				createdAt: { $gte: startOfMonth, $lte: endOfMonth },
				type: "sampling",
				"model.location": locationId,
			});
			const positiveTagsThisMonth = await tagsModel.countDocuments({
				createdAt: { $gte: startOfMonth, $lte: endOfMonth },
				presence: "positive",
				type: "sampling",
				"model.location": locationId,
			});
			const positivityRateThisMonth =
				totalTagsThisMonth > 0
					? (positiveTagsThisMonth / totalTagsThisMonth) * 100
					: 0;

			// Get total tags year-to-date grouped by sample
			const tagsYearToDate = await tagsModel.aggregate([
				{
					$match: {
						createdAt: { $gte: startOfYear, $lte: endOfYear },
						...matchStage,
					},
				},
				{
					$lookup: {
						from: "models", // The collection name for Model model
						localField: "model",
						foreignField: "_id",
						as: "modelInfo",
					},
				},
				{ $unwind: "$modelInfo" },
				{
					$lookup: {
						from: "samples", // The collection name for sample model
						localField: "sample",
						foreignField: "_id",
						as: "sampleInfo",
					},
				},
				{ $unwind: "$sampleInfo" },
				{ $group: { _id: "$sampleInfo.name", count: { $sum: 1 } } },
			]);

			// Get positivity rate year-to-date
			const totalTagsYearToDate = await tagsModel.countDocuments({
				createdAt: { $gte: startOfYear, $lte: endOfYear },
				type: "sampling",
				"model.location": locationId,
				"model.delete": false,
			});
			const positiveTagsYearToDate = await tagsModel.countDocuments({
				createdAt: { $gte: startOfYear, $lte: endOfYear },
				presence: "positive",
				type: "sampling",
				"model.location": locationId,
				"model.delete": false,
			});
			const positivityRateYearToDate =
				totalTagsYearToDate > 0
					? (positiveTagsYearToDate / totalTagsYearToDate) * 100
					: 0;

			// Get positivity rate per month year-to-date
			const positivityRatePerMonthYearToDate = await tagsModel.aggregate([
				{
					$match: {
						createdAt: { $gte: startOfYear, $lte: endOfYear },
						presence: { $in: ["positive", "negative"] },
						...matchStage,
					},
				},
				{
					$lookup: {
						from: "models", // The collection name for Model model
						localField: "model",
						foreignField: "_id",
						as: "modelInfo",
					},
				},
				{ $unwind: "$modelInfo" },
				{
					$group: {
						_id: {
							year: { $year: "$createdAt" },
							month: { $month: "$createdAt" },
						},
						total: { $sum: 1 },
						positive: {
							$sum: {
								$cond: [{ $eq: ["$presence", "positive"] }, 1, 0],
							},
						},
					},
				},
				{
					$project: {
						_id: 0,
						year: "$_id.year",
						month: "$_id.month",
						positivityRate: {
							$cond: [
								{ $eq: ["$total", 0] },
								0,
								{ $divide: ["$positive", "$total"] },
							],
						},
						totalTags: "$total",
						positiveTags: "$positive",
					},
				},
				{ $sort: { year: 1, month: 1 } }, // Sort by year and month
			]);

			const totalModels = await modelModel.countDocuments({
				location: locationId,
				delete: false,
			});

			// Query for deleted models in the location
			const deletedModels = await modelModel.countDocuments({
				location: locationId,
				delete: true,
			});

			// Query for recent models in the location (e.g., created in the last 7 days)
			const recentModels = await modelModel
				.find({
					delete: false,
					location: locationId,
					createdAt: { $gte: new Date(now.setDate(now.getDate() - 7)) },
				})
				.sort({ createdAt: -1 });

			// Query for total reviewers in the location
			const totalReviewers = await userModel.countDocuments({
				location: locationId,
				role: "reviewer",
			});

			// Query for today's models in the location
			const todaysModels = await modelModel
				.find({
					location: locationId,
					createdAt: {
						$gte: new Date(now.setHours(0, 0, 0, 0)),
						$lt: new Date(now.setHours(23, 59, 59, 999)),
					},
				})
				.sort({ createdAt: -1 });

			// Query for total taggers in the location
			const totalTaggers = await userModel.countDocuments({
				location: locationId,
				role: "tagger",
			});

			// Query for total tags by sample and month
			const TotalTagsBySampleAndMonth = await tagsModel.aggregate([
				{
					$match: {
						createdAt: { $gte: startOfYear, $lte: endOfYear },
						"model.location": locationId,
						"model.delete": false,
					},
				},
				{
					$group: {
						_id: { month: { $month: "$createdAt" }, sample: "$sample" },
						count: { $sum: 1 },
					},
				},
				{ $sort: { "_id.month": 1 } },
			]);

			// Query for total incidents by month
			const TotalIncidentsByMonth = await tagsModel.aggregate([
				{
					$match: {
						createdAt: { $gte: startOfYear, $lte: endOfYear },
						"model.location": locationId,
						"model.delete": false,
						type: "incident",
					},
				},
				{
					$group: {
						_id: { month: { $month: "$createdAt" } },
						count: { $sum: 1 },
					},
				},
				{ $sort: { "_id.month": 1 } },
			]);

			// Query for total incidents by day
			const TotalIncidentsByDay = await tagsModel.aggregate([
				{
					$match: {
						createdAt: { $gte: startOfMonth, $lte: endOfMonth },
						"model.location": locationId,
						"model.delete": false,
						type: "incident",
					},
				},
				{
					$group: {
						_id: { day: { $dayOfMonth: "$createdAt" } },
						count: { $sum: 1 },
					},
				},
				{ $sort: { "_id.day": 1 } },
			]);

			// Query for total tags by sample and day
			const TotalTagsBySampleAndDay = await tagsModel.aggregate([
				{
					$match: {
						createdAt: { $gte: startOfMonth, $lte: endOfMonth },
						"model.location": locationId,
						"model.delete": false,
					},
				},
				{
					$group: {
						_id: {
							day: { $dayOfMonth: "$createdAt" },
							sample: "$sample",
						},
						count: { $sum: 1 },
					},
				},
				{ $sort: { "_id.day": 1 } },
			]);

			// Query for models in each location
			const modelsInEachLocation = await modelModel.aggregate([
				{
					$group: {
						_id: "$location",
						count: { $sum: 1 },
					},
				},
			]);

			// Query for recently tagged models in the location
			const recentlyTaggedModels = await tagsModel.aggregate([
				{ $match: { "model.location": locationId, "model.delete": false } },
				{
					$lookup: {
						from: "models",
						localField: "model",
						foreignField: "_id",
						as: "modelInfo",
					},
				},
				{ $unwind: "$modelInfo" },
				{ $sort: { createdAt: -1 } },
				{ $limit: 10 },
			]);

			// Query for models per day of the week in the location
			const modelsByDays = await modelModel.aggregate([
				{ $match: { location: locationId, delete: false } },
				{
					$group: {
						_id: { dayOfWeek: { $dayOfWeek: "$createdAt" } },
						count: { $sum: 1 },
					},
				},
				{ $sort: { "_id.dayOfWeek": 1 } },
			]);

			// Query for models per month in the location
			const modelsByMonth = await modelModel.aggregate([
				{ $match: { location: locationId, delete: false } },
				{
					$group: {
						_id: { month: { $month: "$createdAt" } },
						count: { $sum: 1 },
					},
				},
				{ $sort: { "_id.month": 1 } },
			]);

			res.status(200).json({
				tagsThisMonth,
				tagsLastMonth,
				totalTagsThisMonth,
				positiveTagsThisMonth,
				positivityRateThisMonth,
				tagsYearToDate,
				positivityRateYearToDate,
				positivityRatePerMonthYearToDate,
				totalModels,
				totalTaggers,
				totalReviewers,
				todaysModels,
				modelsByDays,
				modelsByMonth,
				TotalTagsBySampleAndDay,
				TotalIncidentsByDay,
				TotalIncidentsByMonth,
				TotalTagsBySampleAndMonth,
				modelsInEachLocation,
				recentlyTaggedModels,
				deletedModels,
				recentModels,
				message: "success",
			});
		} catch (error) {
			res.status(500).json({
				status: "error",
				message: "internal server error",
			});
		}
	}

	async dashboardByLocation(req: AuthUserRequest, res: Response) {
		try {
			const locationId = req.params.locationId;
			const now = new Date();

			const { startOfMonth, endOfMonth } = await getMonthRange(now);
			const { startOfYear, endOfYear } = await getYearRange(now);
			const startOfLastMonth = new Date(
				startOfMonth.getFullYear(),
				startOfMonth.getMonth() - 1,
				1
			);
			const endOfLastMonth = new Date(
				startOfMonth.getFullYear(),
				startOfMonth.getMonth(),
				0,
				23,
				59,
				59,
				999
			);

			const [
				tagsMonth,
				positivityRateMonth,
				tagsYearToDate,
				positivityRatePerMonthYearToDate,
				totalModels,
				deletedModels,
				recentModels,
				totalReviewers,
				todaysModels,
				totalTaggers,
				totalTagsBySampleAndMonth,
				totalIncidentsByMonth,
				totalIncidentsByDay,
				totalTagsBySampleAndDay,
				modelsInEachLocation,
				recentlyTaggedModels,
				modelsByDays,
				tagsLastMonth,
				totalTagsThisMonth,
				positiveTagsThisMonth,
				modelsByMonth,
				positivityRateYearToDate,
			] = await Promise.all([
				getTagsByPeriod(startOfMonth, endOfMonth, locationId),
				getPositivityRate(startOfMonth, endOfMonth, locationId),
				getTagsYearToDate(startOfYear, endOfYear, locationId),
				getPositivityRatePerMonthYearToDate(
					startOfYear,
					endOfYear,
					locationId
				),
				getTotalModels(locationId),
				getDeletedModels(locationId),
				getRecentModels(locationId, now),
				getTotalReviewers(locationId),
				getTodaysModels(locationId, now),
				getTotalTaggers(locationId),
				getTotalTagsBySampleAndMonth(startOfYear, endOfYear, locationId),
				getTotalIncidentsByMonth(startOfYear, endOfYear, locationId),
				getTotalIncidentsByDay(startOfMonth, endOfMonth, locationId),
				getTotalTagsBySampleAndDay(startOfMonth, endOfMonth, locationId),
				getModelsInEachLocation(),
				getRecentlyTaggedModels(locationId),
				getModelsByDays(locationId),
				getTagsLastMonth(startOfLastMonth, endOfLastMonth, locationId),
				getTotalTagsThisMonth(startOfMonth, endOfMonth, locationId),
				getPositiveTagsThisMonth(startOfMonth, endOfMonth, locationId),
				getModelsByMonth(startOfYear, endOfYear, locationId),
				getPositivityRateYearToDate(startOfYear, endOfYear, locationId),
			]);

			res.json({
				message: "success",
				tagsMonth,
				positivityRateMonth,
				tagsYearToDate,
				positivityRatePerMonthYearToDate,
				totalModels,
				deletedModels,
				recentModels,
				totalReviewers,
				todaysModels,
				totalTaggers,
				totalTagsBySampleAndMonth,
				totalIncidentsByMonth,
				totalIncidentsByDay,
				totalTagsBySampleAndDay,
				modelsInEachLocation,
				recentlyTaggedModels,
				modelsByDays,
				tagsLastMonth,
				totalTagsThisMonth,
				positiveTagsThisMonth,
				modelsByMonth,
				positivityRateYearToDate,
			});
		} catch (error) {
			console.error("Error in dashboardByLocation:", error);
			res.status(500).json({
				status: "error",
				message: (error as any).message,
			});
		}
	}
}

// async function getPositivityRatePerMonthYearToDate(startOfYear: Date, endOfYear: Date, locationId: string) {
//     return tagsModel.aggregate([
//         { $match: { createdAt: { $gte: startOfYear, $lte: endOfYear }, presence: { $in: ['positive', 'negative'] }, type: 'sampling', 'model.location': locationId, 'model.delete': false } },
//         { $lookup: { from: 'models', localField: 'model', foreignField: '_id', as: 'modelInfo' } },
//         { $unwind: '$modelInfo' },
//         { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, total: { $sum: 1 }, positive: { $sum: { $cond: [{ $eq: ["$presence", "positive"] }, 1, 0] } } } },
//         { $project: { _id: 0, year: "$_id.year", month: "$_id.month", positivityRate: { $cond: [{ $eq: ["$total", 0] }, 0, { $divide: ["$positive", "$total"] }] }, totalTags: "$total", positiveTags: "$positive" } },
//         { $sort: { year: 1, month: 1 } }
//     ]);
// }

async function getMonthRange(date: Date) {
	const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
	const endOfMonth = new Date(
		date.getFullYear(),
		date.getMonth() + 1,
		0,
		23,
		59,
		59,
		999
	);
	return { startOfMonth, endOfMonth };
}

async function getYearRange(date: Date) {
	const startOfYear = new Date(date.getFullYear(), 0, 1);
	const endOfYear = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
	return { startOfYear, endOfYear };
}

async function getTagsByPeriod(
	startDate: Date,
	endDate: Date,
	locationId: string
) {
	return tagsModel.aggregate([
		{
			$match: {
				createdAt: { $gte: startDate, $lte: endDate },
				type: "sampling",
				"modelInfo.location": locationId,
				"modelInfo.delete": false,
			},
		},
		{
			$lookup: {
				from: "models",
				localField: "model",
				foreignField: "_id",
				as: "modelInfo",
			},
		},
		{ $unwind: "$modelInfo" },
		{
			$lookup: {
				from: "samples",
				localField: "sample",
				foreignField: "_id",
				as: "sampleInfo",
			},
		},
		{ $unwind: "$sampleInfo" },
		{ $group: { _id: "$sampleInfo.name", count: { $sum: 1 } } },
	]);
}

async function getPositivityRate(
	startDate: Date,
	endDate: Date,
	locationId: string
) {
	const totalTags = await tagsModel.countDocuments({
		createdAt: { $gte: startDate, $lte: endDate },
		type: "sampling",
		"model.location": locationId,
	});
	const positiveTags = await tagsModel.countDocuments({
		createdAt: { $gte: startDate, $lte: endDate },
		presence: "positive",
		type: "sampling",
		"model.location": locationId,
	});
	return totalTags > 0 ? (positiveTags / totalTags) * 100 : 0;
}

async function getTagsYearToDate(
	startOfYear: Date,
	endOfYear: Date,
	locationId: string
) {
	return tagsModel.aggregate([
		{
			$match: {
				createdAt: { $gte: startOfYear, $lte: endOfYear },
				type: "sampling",
				"model.location": locationId,
				"model.delete": false,
			},
		},
		{
			$lookup: {
				from: "models",
				localField: "model",
				foreignField: "_id",
				as: "modelInfo",
			},
		},
		{ $unwind: "$modelInfo" },
		{
			$lookup: {
				from: "samples",
				localField: "sample",
				foreignField: "_id",
				as: "sampleInfo",
			},
		},
		{ $unwind: "$sampleInfo" },
		{ $group: { _id: "$sampleInfo.name", count: { $sum: 1 } } },
	]);
}

async function getPositivityRatePerMonthYearToDate(
	startOfYear: Date,
	endOfYear: Date,
	locationId: string
) {
	return tagsModel.aggregate([
		{
			$match: {
				createdAt: { $gte: startOfYear, $lte: endOfYear },
				presence: { $in: ["positive", "negative"] },
				type: "sampling",
				"model.location": locationId,
				"model.delete": false,
			},
		},
		{
			$lookup: {
				from: "models",
				localField: "model",
				foreignField: "_id",
				as: "modelInfo",
			},
		},
		{ $unwind: "$modelInfo" },
		{
			$group: {
				_id: {
					year: { $year: "$createdAt" },
					month: { $month: "$createdAt" },
				},
				total: { $sum: 1 },
				positive: {
					$sum: { $cond: [{ $eq: ["$presence", "positive"] }, 1, 0] },
				},
			},
		},
		{
			$project: {
				_id: 0,
				year: "$_id.year",
				month: "$_id.month",
				positivityRate: {
					$cond: [
						{ $eq: ["$total", 0] },
						0,
						{ $divide: ["$positive", "$total"] },
					],
				},
				totalTags: "$total",
				positiveTags: "$positive",
			},
		},
		{ $sort: { year: 1, month: 1 } },
	]);
}

async function getTagsLastMonth(
	startOfLastMonth: Date,
	endOfLastMonth: Date,
	locationId: string
) {
	return tagsModel.aggregate([
		{
			$match: {
				createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
				type: "sampling",
				"model.location": locationId,
				"model.delete": false,
			},
		},
		{ $group: { _id: null, count: { $sum: 1 } } },
	]);
}

async function getTotalTagsThisMonth(
	startOfMonth: Date,
	endOfMonth: Date,
	locationId: string
) {
	return tagsModel.countDocuments({
		createdAt: { $gte: startOfMonth, $lte: endOfMonth },
		type: "sampling",
		"model.location": locationId,
		"model.delete": false,
	});
}

async function getPositiveTagsThisMonth(
	startOfMonth: Date,
	endOfMonth: Date,
	locationId: string
) {
	return tagsModel.countDocuments({
		createdAt: { $gte: startOfMonth, $lte: endOfMonth },
		presence: "positive",
		type: "sampling",
		"model.location": locationId,
		"model.delete": false,
	});
}

async function getModelsByMonth(
	startOfYear: Date,
	endOfYear: Date,
	locationId: string
) {
	return modelModel.aggregate([
		{
			$match: {
				location: locationId,
				delete: false,
				createdAt: { $gte: startOfYear, $lte: endOfYear },
			},
		},
		{
			$group: {
				_id: { month: { $month: "$createdAt" } },
				count: { $sum: 1 },
			},
		},
		{ $sort: { "_id.month": 1 } },
	]);
}

async function getTotalModels(locationId: string) {
	return modelModel.countDocuments({ location: locationId, delete: false });
}

async function getDeletedModels(locationId: string) {
	return modelModel.countDocuments({ location: locationId, delete: true });
}

async function getRecentModels(locationId: string, now: Date) {
	return modelModel
		.find({
			location: locationId,
			delete: false,
			createdAt: { $gte: new Date(now.setDate(now.getDate() - 7)) },
		})
		.sort({ createdAt: -1 });
}

async function getTotalReviewers(locationId: string) {
	return userModel.countDocuments({ location: locationId, role: "reviewer" });
}

async function getTodaysModels(locationId: string, now: Date) {
	return modelModel
		.find({
			location: locationId,
			createdAt: {
				$gte: new Date(now.setHours(0, 0, 0, 0)),
				$lt: new Date(now.setHours(23, 59, 59, 999)),
			},
		})
		.sort({ createdAt: -1 });
}

async function getTotalTaggers(locationId: string) {
	return userModel.countDocuments({ location: locationId, role: "tagger" });
}

async function getTotalTagsBySampleAndMonth(
	startOfYear: Date,
	endOfYear: Date,
	locationId: string
) {
	return tagsModel.aggregate([
		{
			$match: {
				createdAt: { $gte: startOfYear, $lte: endOfYear },
				"model.location": locationId,
				"model.delete": false,
			},
		},
		{
			$group: {
				_id: { month: { $month: "$createdAt" }, sample: "$sample" },
				count: { $sum: 1 },
			},
		},
		{ $sort: { "_id.month": 1 } },
	]);
}

async function getTotalIncidentsByMonth(
	startOfYear: Date,
	endOfYear: Date,
	locationId: string
) {
	return tagsModel.aggregate([
		{
			$match: {
				createdAt: { $gte: startOfYear, $lte: endOfYear },
				"model.location": locationId,
				"model.delete": false,
				type: "incident",
			},
		},
		{
			$group: {
				_id: { month: { $month: "$createdAt" } },
				count: { $sum: 1 },
			},
		},
		{ $sort: { "_id.month": 1 } },
	]);
}

async function getTotalIncidentsByDay(
	startOfMonth: Date,
	endOfMonth: Date,
	locationId: string
) {
	return tagsModel.aggregate([
		{
			$match: {
				createdAt: { $gte: startOfMonth, $lte: endOfMonth },
				"model.location": locationId,
				"model.delete": false,
				type: "incident",
			},
		},
		{
			$group: {
				_id: { day: { $dayOfMonth: "$createdAt" } },
				count: { $sum: 1 },
			},
		},
		{ $sort: { "_id.day": 1 } },
	]);
}

async function getTotalTagsBySampleAndDay(
	startOfMonth: Date,
	endOfMonth: Date,
	locationId: string
) {
	return tagsModel.aggregate([
		{
			$match: {
				createdAt: { $gte: startOfMonth, $lte: endOfMonth },
				"model.location": locationId,
				"model.delete": false,
			},
		},
		{
			$group: {
				_id: { day: { $dayOfMonth: "$createdAt" }, sample: "$sample" },
				count: { $sum: 1 },
			},
		},
		{ $sort: { "_id.day": 1 } },
	]);
}

async function getModelsInEachLocation() {
	return modelModel.aggregate([
		{ $group: { _id: "$location", count: { $sum: 1 } } },
	]);
}

async function getRecentlyTaggedModels(locationId: string) {
	return tagsModel.aggregate([
		{ $match: { "model.location": locationId, "model.delete": false } },
		{
			$lookup: {
				from: "models",
				localField: "model",
				foreignField: "_id",
				as: "modelInfo",
			},
		},
		{ $unwind: "$modelInfo" },
		{ $sort: { createdAt: -1 } },
		{ $limit: 10 },
	]);
}

async function getModelsByDays(locationId: string) {
	return modelModel.aggregate([
		{ $match: { location: locationId, delete: false } },
		{
			$group: {
				_id: { dayOfWeek: { $dayOfWeek: "$createdAt" } },
				count: { $sum: 1 },
			},
		},
	]);
}

async function getPositivityRateYearToDate(
	startOfYear: Date,
	endOfYear: Date,
	locationId: string
): Promise<number> {
	// Count the total number of tags for the year-to-date
	const totalTags = await tagsModel.countDocuments({
		createdAt: { $gte: startOfYear, $lte: endOfYear },
		type: "sampling",
		"model.location": locationId,
		"model.delete": false,
	});

	// Count the number of positive tags for the year-to-date
	const positiveTags = await tagsModel.countDocuments({
		createdAt: { $gte: startOfYear, $lte: endOfYear },
		presence: "positive",
		type: "sampling",
		"model.location": locationId,
		"model.delete": false,
	});

	// Calculate the positivity rate
	return totalTags > 0 ? (positiveTags / totalTags) * 100 : 0;
}