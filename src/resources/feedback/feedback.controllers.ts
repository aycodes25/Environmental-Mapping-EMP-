import { Request, Response } from "express";
import FeedbackModel, { FeedbackStatus } from "./feedback.model";
import { AuthUserRequest } from "../../middlewares/auth.middleware";
import userModel from "../users/user.model";
import { RoleType } from "../users/user.Interface";
import { saveToDisk, UploadSampleToS3 } from "../../utils/aws/aws";

const isSuperAdmin = (role?: RoleType) =>
	role === RoleType.superAdmin;

export class FeedbackController {
	async createFeedback(req: AuthUserRequest, res: Response) {
		try {
			const userId = req.user?.userId;
			const message = (req.body?.message || "").trim();

			if (!userId) {
				return res.status(401).json({ status: "error", message: "Unauthorized" });
			}
			if (!message) {
				return res
					.status(400)
					.json({ status: "error", message: "Message is required" });
			}
			if (message.length > 5000) {
				return res
					.status(400)
					.json({ status: "error", message: "Message exceeds 5000 characters" });
			}

			const file = req.file;
			let attachment;
			if (file) {
				const key = `feedback/${userId}/${Date.now()}-${file.originalname}`;
				const url = await (async () => {
					// Use disk storage in development or if AWS credentials are not configured
					const isDevelopment = process.env.NODE_ENV === "development";
					const hasAWSCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
					
					if (isDevelopment || !hasAWSCredentials) {
						return saveToDisk(file.buffer, key);
					}
					try {
						return await UploadSampleToS3(file.buffer, key);
					} catch (s3Error: any) {
						// Fallback to disk storage if S3 upload fails
						console.warn("S3 upload failed, falling back to disk storage:", s3Error?.message);
						return saveToDisk(file.buffer, key);
					}
				})();
				attachment = {
					url,
					filename: file.originalname,
					mimetype: file.mimetype
				};
			}

			const feedback = await (await FeedbackModel.create({
				user: userId,
				message,
				attachment
			})).populate("user", "fullname email username role");

			return res.status(201).json({
				status: "success",
				message: "Feedback submitted successfully",
				data: feedback
			});
		} catch (error: any) {
			return res.status(500).json({
				status: "error",
				message: error?.message || "Unable to submit feedback"
			});
		}
	}

	async getFeedbacks(req: AuthUserRequest, res: Response) {
		try {
			const userId = req.user?.userId;
			if (!userId) {
				return res.status(401).json({ status: "error", message: "Unauthorized" });
			}

			const requestingUser = await userModel.findById(userId);
			const admin = isSuperAdmin(requestingUser?.role);
			const { status } = req.query;

			const filter: Record<string, any> = {};
			if (!admin) {
				filter.user = userId;
			}
			if (status && typeof status === "string" && status !== "all") {
				filter.status = status;
			}

			const feedbacks = await FeedbackModel.find(filter)
				.sort({ createdAt: -1 })
				.populate("user", "fullname email username role");

			let summary = null;
			if (admin) {
				const [total, pending, reviewed, resolved] = await Promise.all([
					FeedbackModel.countDocuments(),
					FeedbackModel.countDocuments({ status: FeedbackStatus.pending }),
					FeedbackModel.countDocuments({ status: FeedbackStatus.reviewed }),
					FeedbackModel.countDocuments({ status: FeedbackStatus.resolved })
				]);
				summary = { total, pending, reviewed, resolved };
			}

			return res.status(200).json({
				status: "success",
				data: feedbacks,
				summary
			});
		} catch (error: any) {
			return res.status(500).json({
				status: "error",
				message: error?.message || "Unable to fetch feedbacks"
			});
		}
	}

	async updateFeedbackStatus(req: AuthUserRequest, res: Response) {
		try {
			const userId = req.user?.userId;
			const role = req.user?.role as RoleType | undefined;
			if (!userId || !isSuperAdmin(role)) {
				return res.status(403).json({
					status: "error",
					message: "Only super admins can update feedback status"
				});
			}

			const { status } = req.body;
			const { id } = req.params;
			if (!Object.values(FeedbackStatus).includes(status)) {
				return res
					.status(400)
					.json({ status: "error", message: "Invalid status value" });
			}

			const updated = await FeedbackModel.findByIdAndUpdate(
				id,
				{ status },
				{ new: true }
			).populate("user", "fullname email username role");

			if (!updated) {
				return res.status(404).json({ status: "error", message: "Feedback not found" });
			}

			return res.status(200).json({
				status: "success",
				message: "Feedback status updated",
				data: updated
			});
		} catch (error: any) {
			return res.status(500).json({
				status: "error",
				message: error?.message || "Unable to update feedback"
			});
		}
	}
}
