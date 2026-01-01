import mongoose, { Schema, Model } from "mongoose";
import { ISyncData, ISyncDataDocument } from "../types";

const SyncDataSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileType: {
      type: String,
      enum: ["categories", "locations", "inventoryItems", "todoItems", "settings"],
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index - ensures one document per user per file type
SyncDataSchema.index({ userId: 1, fileType: 1 }, { unique: true });

const SyncData: Model<ISyncDataDocument> = mongoose.model<ISyncDataDocument>("SyncData", SyncDataSchema);

export default SyncData;

