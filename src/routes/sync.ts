import { Router } from "express";
import { pullFile, pushFile, getSyncStatus, deleteFileData } from "../controllers/syncController";
import { authenticate } from "../middleware/auth";

const router = Router();

// All sync routes require authentication
router.get("/:fileType/pull", authenticate, pullFile);
router.post("/:fileType/push", authenticate, pushFile);
router.get("/status", authenticate, getSyncStatus);
router.delete("/:fileType/data", authenticate, deleteFileData);

export default router;

