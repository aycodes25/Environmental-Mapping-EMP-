import mongoose, { Document } from "mongoose";

export default interface Gtag extends Document {
    userId: mongoose.Types.ObjectId,
    objectName: string,
    taggedInfo: string,
    modelId: mongoose.Types.ObjectId,
    image: string
}