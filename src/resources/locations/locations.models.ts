import mongoose, { Schema, model } from "mongoose";

interface Location {
    id: mongoose.Types.ObjectId,
    name: string,
    location: string,
    user: mongoose.Types.ObjectId,
    models: [mongoose.Types.ObjectId],
    image: string
}
const LocationsSchema = new Schema({
    name: {
        type: String
    },
    location: {
        type: String
    },
    user: {
        type: mongoose.Types.ObjectId
    },
    models: [{
        type: mongoose.Types.ObjectId, ref: "Model"
    }],
    image: {
        type: String
    }
})

export default model<Location>('Location', LocationsSchema)