import { Router, RequestHandler } from "express";
import { uploadImage } from "../controllers/imageController";
import { authenticate } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = Router();

// Middleware to conditionally apply multer for multipart requests
const multerConditional = (req: any, res: any, next: any) => {
  if (req.is("multipart/form-data")) {
    upload.single("image")(req, res, next);
  } else {
    next();
  }
};

// POST /api/images/upload - Upload image (authenticated)
// Supports both:
// - multipart/form-data with file field "image"
// - JSON with base64 string: { "image": "data:image/png;base64,..." }
// Query param: ?resize=WIDTH (optional, width in pixels)
router.post(
  "/upload",
  authenticate,
  multerConditional,
  uploadImage as RequestHandler
);

export default router;
