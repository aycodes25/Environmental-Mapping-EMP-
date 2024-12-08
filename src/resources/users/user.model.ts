import mongoose, { Document, Schema, model } from 'mongoose';
import User, { RoleType } from './user.Interface';

const userSchema = new Schema<User>({
    username: { type: String, unique: true, required: true },
    fullname: { type: String, required: true },
    password: { type: String, required: true, select: false },
    imageUrl: { type: String, required: false },
    email: { type: String, unique: true, required: true },
    locations: { type: Schema.Types.ObjectId, ref: 'Location' }, // Specify type as Schema.Types.ObjectId
    role: {
        type: String,
        enum: Object.values(RoleType),
        default: RoleType.tagger
    },
    isVerified: { type: Boolean },
    models: [{ type: Schema.Types.ObjectId, ref: "Model" }],
    twoFactorAuth: {
        enabled: { type: Boolean, default: false },
        secret: { type: String, select: false },
    },
}, { timestamps: true });




export default model<User>("User", userSchema);


