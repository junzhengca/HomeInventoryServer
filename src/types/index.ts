import { Document } from "mongoose";
import { Request } from "express";

export interface IUser {
  email: string;
  password: string;
  avatarUrl?: string;
}

export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}


export interface SignupRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface ImageUploadResponse {
  url: string;
}

export interface UpdateUserRequest {
  currentPassword?: string;
  newPassword?: string;
  avatarUrl?: string;
}

// Sync Types
export type SyncFileType = "categories" | "locations" | "inventoryItems" | "todoItems" | "settings";

export interface SyncFileData<T> {
  version: string;
  deviceId: string;
  syncTimestamp: string;
  data: T;
}

export interface FileSyncMetadata {
  userId: string;
  fileType: SyncFileType;
  lastSyncTime: string;
  lastSyncedByDeviceId: string;
  lastSyncedAt: string;
  clientVersion?: string;
  deviceName?: string;
  totalSyncs: number;
}

export interface IFileSyncMetadata extends FileSyncMetadata, Document {}

export interface PullResponse<T> {
  success: boolean;
  data?: T;
  serverTimestamp: string;
  lastSyncTime: string;
}

export interface PushResponse {
  success: boolean;
  serverTimestamp: string;
  lastSyncTime: string;
  entriesCount: number;
  message?: string;
}

export interface SyncRequestWithBody extends AuthRequest {
  body: any;
  params: {
    fileType?: SyncFileType;
  };
  query: {
    fileType?: SyncFileType;
  };
}

export interface ISyncData {
  userId: string;
  fileType: SyncFileType;
  data: any;
}

export interface ISyncDataDocument extends ISyncData, Document {}
