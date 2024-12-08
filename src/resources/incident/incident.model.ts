import mongoose, { Document, Schema, model } from "mongoose";

export interface Incident extends Document {
    name: string,
    description: string,
}

const IncidentSchema = new Schema({
    name: {
        type: String
    },
    description: {
        type: String
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
})

export default model<Incident>('Incident', IncidentSchema)