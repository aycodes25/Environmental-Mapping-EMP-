import mongoose from "mongoose";

export default interface Comments {
    user: mongoose.Types.ObjectId,
    tags: mongoose.Types.ObjectId
    model: mongoose.Types.ObjectId
    comment: string
}