import mongoose, { Document, Schema } from "mongoose";
import modelModel from "./model.model";

export interface ObjectGroup extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  cameraPosition: {
    x: number;
    y: number;
    z: number;
  };
  cameraDirection: {
    x: number;
    y: number;
    z: number;
  };
  cameraRotation: {
    x: number;
    y: number;
    z: number;
  };
  modelId: mongoose.Types.ObjectId;
}

const objectGroupSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  cameraPosition: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
  },
  cameraDirection: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
  },
  cameraRotation: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
  },
  modelId: {
    type: Schema.Types.ObjectId,
    ref: modelModel,
    required: true,
  }
}, { timestamps: true });

export default mongoose.model<ObjectGroup>("ObjectGroup", objectGroupSchema);
