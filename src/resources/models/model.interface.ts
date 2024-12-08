import mongoose, { Document } from "mongoose";


export default interface Model extends Document {
    description: string;
    file: string;
    modelName: string;
    coverPicture: string;
    twoD?: string;  
    user: mongoose.Types.ObjectId,
    tags: [mongoose.Types.ObjectId],
    deleted: boolean,
    location: mongoose.Types.ObjectId,
    viewers: [{ userId: mongoose.Types.ObjectId; viewedAt: Date }],
    gTags: [mongoose.Types.ObjectId];
    
}
