import mongoose, { Mongoose, Schema, model } from "mongoose";
import Model from "./model.interface";
import { required } from "joi";

const modelSchema = new Schema({
    description: { type: String },
    slug: {
        type: String,
        required: true
    },
    file: { type: String, required: true },
    modelName: { type: String, require: true },
    coverPicture: { type: String },
    twoD: { type: String, required: false },
    user: { type: mongoose.Types.ObjectId, ref: 'User' },
    tags: [{ type: mongoose.Types.ObjectId, ref: 'Tag' }],
    comments: [{ type: String, required: false }],
    delete: { type: Boolean, default: false }, // Set deleted to false by default
    location: { type: mongoose.Types.ObjectId, ref: 'Location' },
    viewers: [{ userId: { type: Schema.Types.ObjectId, ref: 'User' }, viewedAt: { type: Date, default: Date.now } }],
    gTags: [{ type: mongoose.Types.ObjectId, ref: 'Gtag' }]
}, { timestamps: true })



export default model<Model>('Model', modelSchema)