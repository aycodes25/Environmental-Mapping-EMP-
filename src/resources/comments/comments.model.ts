import mongoose, { Schema, model } from "mongoose";
import Comments from "./comments.interface";
const commentSchema = new Schema({
    user: { type: mongoose.Types.ObjectId, ref: "User" },
    tag: { type: mongoose.Types.ObjectId, ref: 'Tag' },
    model: { type: mongoose.Types.ObjectId, ref: 'Model' },
    comment: { type: String, require: true }

}, { timestamps: true })

export default model<Comments>('Comment', commentSchema)