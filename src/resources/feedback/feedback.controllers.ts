import { Request, Response } from "express";
import FeedbackModel, { FeedbackStatus } from "./feedback.model";
import { AuthUserRequest } from "../../middlewares/auth.middleware";
import userModel from "../users/user.model";
import { RoleType } from "../users/user.Interface";
import { saveToDisk, UploadSampleToS3 } from "../../utils/aws/aws";
import notificationService from "../notifications/notification.service";

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
					const isDevelopment = process.env.NODE_ENV === "development";
					const hasAWSCredentials =
						process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
					const shouldUseDisk = isDevelopment || !hasAWSCredentials;

					if (shouldUseDisk) {
						return saveToDisk(file.buffer, key);
					}

					return UploadSampleToS3(file.buffer, key);
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

			// --- NOTIFICATION: Feedback submitted ---
			// Notify Super Admin and Admin that new feedback arrived
			notificationService.notifyRoles(
				[RoleType.superAdmin, RoleType.admin, RoleType.reviewer],
				"New feedback received",
				`New feedback has been submitted and requires attention.`,
				"Feedback",
				feedback._id
			).catch(() => {});

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

			// --- NOTIFICATION: Feedback resolved/updated ---
			// Notify the user who submitted the feedback
			if (updated.user) {
				const feedbackUserId = (updated.user as any)?._id || updated.user;
				if (status === FeedbackStatus.resolved) {
					notificationService.notifyUser(
						feedbackUserId.toString(),
						"Feedback resolved",
						`Your feedback has been marked as resolved.`,
						"Feedback",
						updated._id
					).catch(() => {});
				} else if (status === FeedbackStatus.reviewed) {
					notificationService.notifyUser(
						feedbackUserId.toString(),
						"Feedback reviewed",
						`Your feedback is currently being reviewed.`,
						"Feedback",
						updated._id
					).catch(() => {});
				}
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
