import mongoose, { Schema, Model } from "mongoose";
import { IFileSyncMetadata } from "../types";

const SyncMetadataSchema: Schema = new Schema(
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
    lastSyncTime: {
      type: String,
      required: true,
    },
    lastSyncedByDeviceId: {
      type: String,
      required: true,
    },
    lastSyncedAt: {
      type: String,
      required: true,
    },
    clientVersion: {
      type: String,
      required: false,
    },
    deviceName: {
      type: String,
      required: false,
    },
    totalSyncs: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index - ensures one document per user per file type
SyncMetadataSchema.index({ userId: 1, fileType: 1 }, { unique: true });

const SyncMetadata: Model<IFileSyncMetadata> = mongoose.model<IFileSyncMetadata>(
  "SyncMetadata",
  SyncMetadataSchema
);

export default SyncMetadata;

