import mongoose, { Schema, model } from "mongoose";

export enum FeedbackStatus {
	pending = "pending",
	reviewed = "reviewed",
	resolved = "resolved"
}

interface FeedbackAttachment {
	url?: string;
	filename?: string;
	mimetype?: string;
}

export interface Feedback {
	user: mongoose.Types.ObjectId;
	message: string;
	status: FeedbackStatus;
	attachment?: FeedbackAttachment;
}

const AttachmentSchema = new Schema<FeedbackAttachment>({
	url: String,
	filename: String,
	mimetype: String
}, { _id: false });

const FeedbackSchema = new Schema<Feedback>({
	user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
	message: { type: String, required: true, maxlength: 5000 },
	status: {
		type: String,
		enum: Object.values(FeedbackStatus),
		default: FeedbackStatus.pending
	},
	attachment: AttachmentSchema
}, { timestamps: true });

export default model<Feedback>("Feedback", FeedbackSchema);
