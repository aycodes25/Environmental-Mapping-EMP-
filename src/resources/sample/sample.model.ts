import mongoose, { Schema, model } from "mongoose";

import Sample from "./sample.interface";

const SampleSchema = new Schema({
    name: {
        type: String
    },
    description: {
        type: String
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    tags: [
        { type: Schema.Types.ObjectId }
    ],
    image: { type: String }
})

export default model<Sample>('Sample', SampleSchema)