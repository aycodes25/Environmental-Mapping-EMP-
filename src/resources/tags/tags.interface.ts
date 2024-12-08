import mongoose from "mongoose";

export default interface Tag extends Document {
    id: mongoose.Types.ObjectId,
    objectName: string,
    incident: mongoose.Types.ObjectId,
    evidence: string,
    action: string,
    presence: string,
    locations: string,
    sample: mongoose.Types.ObjectId,
    user: mongoose.Types.ObjectId,
    model: mongoose.Types.ObjectId,
    text: string,
    taggedInfo: string,
    type: string,
    slug: string,

}
