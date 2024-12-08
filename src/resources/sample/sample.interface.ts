import mongoose, { Document } from "mongoose";

export default interface Sample extends Document {
    id: mongoose.Types.ObjectId,
    name: string,
    description: string,
    user: mongoose.Types.ObjectId,
    tags: [mongoose.Types.ObjectId],
    image: string
}