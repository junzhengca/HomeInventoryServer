import { Response } from "express";
import SyncData from "../models/SyncData";
import SyncMetadata from "../models/SyncMetadata";
import {
  SyncRequestWithBody,
  SyncFileType,
  PullResponse,
  PushResponse,
} from "../types";

// Valid file types for validation
const VALID_FILE_TYPES: SyncFileType[] = [
  "categories",
  "locations",
  "inventoryItems",
  "todoItems",
  "settings",
];

// Helper function to validate file type
function isValidFileType(fileType: string): fileType is SyncFileType {
  return VALID_FILE_TYPES.includes(fileType as SyncFileType);
}

/**
 * Pull data for a specific file type from the server
 * GET /api/sync/:fileType/pull
 */
export async function pullFile(req: SyncRequestWithBody, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: "Unauthorized - invalid or expired token",
          code: "UNAUTHORIZED",
          statusCode: 401,
        },
      });
      return;
    }

    const { fileType } = req.params;
    const serverTimestamp = new Date().toISOString();

    // Validate file type presence
    if (!fileType) {
      res.status(400).json({
        success: false,
        error: {
          message: "File type is required",
          code: "INVALID_FILE_TYPE",
          statusCode: 400,
        },
      });
      return;
    }

    // Validate file type
    if (!isValidFileType(fileType)) {
      res.status(400).json({
        success: false,
        error: {
          message: "Invalid file type",
          code: "INVALID_FILE_TYPE",
          statusCode: 400,
        },
      });
      return;
    }

    // Find sync data for this user and file type
    const syncData = await SyncData.findOne({ userId: req.user.userId, fileType });

    // Find sync metadata for last sync time
    const syncMetadata = await SyncMetadata.findOne({ userId: req.user.userId, fileType });

    const lastSyncTime = syncMetadata?.lastSyncTime || "";
    const data = syncData?.data || [];

    const response: PullResponse<any> = {
      success: true,
      data,
      serverTimestamp,
      lastSyncTime,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Pull file error:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Internal server error",
        code: "SERVER_ERROR",
        statusCode: 500,
      },
    });
  }
}

/**
 * Push merged data for a specific file type to the server
 * POST /api/sync/:fileType/push
 */
export async function pushFile(req: SyncRequestWithBody, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: "Unauthorized - invalid or expired token",
          code: "UNAUTHORIZED",
          statusCode: 401,
        },
      });
      return;
    }

    const { fileType } = req.params;
    const { version, deviceId, syncTimestamp, data } = req.body;
    const serverTimestamp = new Date().toISOString();

    // Validate file type presence
    if (!fileType) {
      res.status(400).json({
        success: false,
        error: {
          message: "File type is required",
          code: "INVALID_FILE_TYPE",
          statusCode: 400,
        },
      });
      return;
    }

    // Validate file type
    if (!isValidFileType(fileType)) {
      res.status(400).json({
        success: false,
        error: {
          message: "Invalid file type",
          code: "INVALID_FILE_TYPE",
          statusCode: 400,
        },
      });
      return;
    }

    // Validate required fields
    if (!version || !deviceId || !syncTimestamp || data === undefined) {
      res.status(400).json({
        success: false,
        error: {
          message: "Missing required fields (version, deviceId, syncTimestamp, data)",
          code: "INVALID_DATA",
          statusCode: 400,
        },
      });
      return;
    }

    // Validate data structure
    // For settings, data should be a single object; for others, an array
    if (fileType === "settings") {
      if (typeof data !== "object" || Array.isArray(data)) {
        res.status(400).json({
          success: false,
          error: {
            message: "Settings must be a single object, not an array",
            code: "INVALID_DATA",
            statusCode: 400,
          },
        });
        return;
      }
    } else {
      if (!Array.isArray(data)) {
        res.status(400).json({
          success: false,
          error: {
            message: "Data must be an array",
            code: "INVALID_DATA",
            statusCode: 400,
          },
        });
        return;
      }
    }

    // Count entries
    const entriesCount = Array.isArray(data) ? data.length : 1;

    // Upsert sync data (replace existing or create new)
    // Use $set to update data, and ensure userId/fileType are set on insert
    await SyncData.findOneAndUpdate(
      { userId: req.user.userId, fileType },
      { 
        $set: { data },
        $setOnInsert: { userId: req.user.userId, fileType }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Update or create sync metadata
    let syncMetadata = await SyncMetadata.findOne({ userId: req.user.userId, fileType });

    if (syncMetadata) {
      // Update existing metadata
      syncMetadata.lastSyncTime = serverTimestamp;
      syncMetadata.lastSyncedByDeviceId = deviceId;
      syncMetadata.lastSyncedAt = serverTimestamp;
      syncMetadata.clientVersion = version;
      syncMetadata.deviceName = req.body.deviceName || syncMetadata.deviceName;
      syncMetadata.totalSyncs += 1;
      await syncMetadata.save();
    } else {
      // Create new metadata
      syncMetadata = await SyncMetadata.create({
        userId: req.user.userId,
        fileType,
        lastSyncTime: serverTimestamp,
        lastSyncedByDeviceId: deviceId,
        lastSyncedAt: serverTimestamp,
        clientVersion: version,
        deviceName: req.body.deviceName,
        totalSyncs: 1,
      });
    }

    const response: PushResponse = {
      success: true,
      serverTimestamp,
      lastSyncTime: serverTimestamp,
      entriesCount,
      message: `${fileType} synced successfully`,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Push file error:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Internal server error",
        code: "SERVER_ERROR",
        statusCode: 500,
      },
    });
  }
}

/**
 * Get sync status for all file types or a specific file type
 * GET /api/sync/status?fileType=...
 */
export async function getSyncStatus(req: SyncRequestWithBody, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: "Unauthorized - invalid or expired token",
          code: "UNAUTHORIZED",
          statusCode: 401,
        },
      });
      return;
    }

    const { fileType } = req.query as { fileType?: SyncFileType };

    // If specific file type is requested
    if (fileType) {
      if (!isValidFileType(fileType)) {
        res.status(400).json({
          success: false,
          error: {
            message: "Invalid file type",
            code: "INVALID_FILE_TYPE",
            statusCode: 400,
          },
        });
        return;
      }

      const syncMetadata = await SyncMetadata.findOne({ userId: req.user.userId, fileType });

      if (!syncMetadata) {
        res.status(404).json({
          success: false,
          error: {
            message: "Sync metadata not found for this file type",
            code: "NOT_FOUND",
            statusCode: 404,
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          userId: syncMetadata.userId,
          fileType: syncMetadata.fileType,
          lastSyncTime: syncMetadata.lastSyncTime,
          lastSyncedByDeviceId: syncMetadata.lastSyncedByDeviceId,
          lastSyncedAt: syncMetadata.lastSyncedAt,
          clientVersion: syncMetadata.clientVersion,
          deviceName: syncMetadata.deviceName,
          totalSyncs: syncMetadata.totalSyncs,
        },
      });
      return;
    }

    // Return status for all file types
    const allMetadata = await SyncMetadata.find({ userId: req.user.userId });

    const statusMap: Record<string, any> = {};

    // Initialize all file types with empty metadata
    VALID_FILE_TYPES.forEach((type) => {
      statusMap[type] = null;
    });

    // Populate with actual metadata
    allMetadata.forEach((metadata) => {
      statusMap[metadata.fileType] = {
        userId: metadata.userId,
        fileType: metadata.fileType,
        lastSyncTime: metadata.lastSyncTime,
        lastSyncedByDeviceId: metadata.lastSyncedByDeviceId,
        lastSyncedAt: metadata.lastSyncedAt,
        clientVersion: metadata.clientVersion,
        deviceName: metadata.deviceName,
        totalSyncs: metadata.totalSyncs,
      };
    });

    res.status(200).json({
      success: true,
      data: statusMap,
    });
  } catch (error) {
    console.error("Get sync status error:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Internal server error",
        code: "SERVER_ERROR",
        statusCode: 500,
      },
    });
  }
}

/**
 * Delete all data for a specific file type for the user
 * DELETE /api/sync/:fileType/data
 */
export async function deleteFileData(req: SyncRequestWithBody, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: "Unauthorized - invalid or expired token",
          code: "UNAUTHORIZED",
          statusCode: 401,
        },
      });
      return;
    }

    const { fileType } = req.params;

    // Validate file type presence
    if (!fileType) {
      res.status(400).json({
        success: false,
        error: {
          message: "File type is required",
          code: "INVALID_FILE_TYPE",
          statusCode: 400,
        },
      });
      return;
    }

    // Validate file type
    if (!isValidFileType(fileType)) {
      res.status(400).json({
        success: false,
        error: {
          message: "Invalid file type",
          code: "INVALID_FILE_TYPE",
          statusCode: 400,
        },
      });
      return;
    }

    // Delete sync data
    const deleteResult = await SyncData.deleteOne({ userId: req.user.userId, fileType });

    // Also delete sync metadata
    await SyncMetadata.deleteOne({ userId: req.user.userId, fileType });

    const deletedCount = deleteResult.deletedCount || 0;

    res.status(200).json({
      success: true,
      message: deletedCount > 0 ? `All ${fileType} data has been deleted` : `No ${fileType} data found to delete`,
    });
  } catch (error) {
    console.error("Delete file data error:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Internal server error",
        code: "SERVER_ERROR",
        statusCode: 500,
      },
    });
  }
}

