import { Router } from "express";
import { FeedbackController } from "./feedback.controllers";
import { authenticateUser } from "../../middlewares/auth.middleware";
import multer from "multer";

const allowedMimeTypes = [
	"image/png",
	"image/jpeg",
	"image/gif",
	"image/webp",
	"application/pdf",
	"text/plain",
	"video/mp4",
	"video/quicktime",
	"video/x-msvideo",
	"video/webm"
];

const attachmentUpload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
	fileFilter: (_req, file, cb) => {
		if (allowedMimeTypes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(
				new Error(
					"Unsupported file type. Please upload images, videos, pdf or text files."
				)
			);
		}
	}
}).single("attachment");

export class FeedbackRoutes {
	public path = "/feedback";
	public router = Router();
	private controller = new FeedbackController();

	constructor() {
		this.initialiseRoutes();
	}

	private initialiseRoutes() {
		this.router.post(
			this.path,
			authenticateUser,
			attachmentUpload,
			(req, res) => this.controller.createFeedback(req, res)
		);

		this.router.get(
			this.path,
			authenticateUser,
			(req, res) => this.controller.getFeedbacks(req, res)
		);

		this.router.patch(
			`${this.path}/:id/status`,
			authenticateUser,
			(req, res) => this.controller.updateFeedbackStatus(req, res)
		);
	}
}
