import mongoose, { Schema, model } from "mongoose";
import Gtag from "./granular.interface";

const GtagSchema: Schema = new Schema({
    userId: { type: mongoose.Types.ObjectId, required: true },
    objectName: { type: String, required: true },
    taggedInfo: { type: String, required: true },
    modelId: { type: mongoose.Types.ObjectId, required: true },
    image: { type: String, required: true }
});
export default model<Gtag>('Gtag', GtagSchema)


