import mongoose, { Schema, model } from "mongoose";

import Tag from "./tags.interface";
const TagsSchema = new Schema({
    objectName: {
        type: String,
        require: true,
    },
    incident: {
        type: Schema.Types.ObjectId,
        ref: 'Incident',
        required: [false, 'Please provide review text'],
    },
    evidence: { type: String, require: false },
    action: { type: String, },
    locations: { type: String, required: [false, 'Please provide location'] },
    presence: { type: String, 
        enum: ['positive', 'negative'], 
        required: false },
    sample: {
        type: Schema.Types.ObjectId,
        ref: 'Sample',
        required: false,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    model: {
        type: Schema.Types.ObjectId,
        ref: 'Model',
        required: true,
    },
    text: {
        type: String,
        required: false
    },
    taggedInfo: {
        type: String,
        required: false
    },
    type: {
        type: String,
        enum: ['safety', 'incident', 'sampling'], 
        required: false
    },
    slug: {
        type: String,
        required: false
    }
}, { timestamps: true })

export default model<Tag>('Tag', TagsSchema)