// import mongoose from "mongoose";

import mongoose from "mongoose";

export enum RoleType {
    reviewer = "reviewer",
    tagger = "tagger",
    sampler = "sampler",
    admin = 'admin',
    superAdmin = "superAdmin"
}
export default interface User extends Document {
    _id: mongoose.Types.ObjectId;
    username: string;
    password?: string;
    fullname: string,
    imageUrl: string,
    email: string,
    locations: mongoose.Types.ObjectId
    role: RoleType
    passwordToken: string;
    phone_number: string;
    isVerified: Boolean,
    models: [mongoose.Types.ObjectId],
    twoFactorAuth: {
        enabled?: Boolean;
        secret?: string;
    },

}